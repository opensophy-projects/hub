import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
import path from 'node:path';
import { existsSync } from 'node:fs';

const root = process.cwd();
const outdir = path.join(root, '.test-build');
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
const uiViewerStub = path.join(outdir, 'NewUIComponentViewer.stub.tsx');
await import('node:fs/promises').then(({ writeFile }) => writeFile(uiViewerStub, "import React from 'react'; export default function NewUIComponentViewer(){ return React.createElement('div'); }\n"));
const tests = globSync('src/**/*.{test,spec}.{ts,tsx}', { cwd: root });
if (tests.length === 0) process.exit(0);

const aliasPlugin = {
  name: 'alias-at',
  setup(build) {
    build.onResolve({ filter: /NewUIComponentViewer$/ }, () => ({ path: uiViewerStub }));
    build.onResolve({ filter: /^@\// }, args => {
      const base = path.join(root, 'src', args.path.slice(2));
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
        if (existsSync(candidate)) return { path: candidate };
      }
      return { path: base };
    });
  },
};

await build({
  entryPoints: tests,
  outdir,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
  sourcemap: true,
  jsx: 'automatic',
  jsxImportSource: 'react',
  plugins: [aliasPlugin],
  loader: { '.svg': 'text', '.css': 'text' },
  external: ['jsdom', 'react', 'react-dom', 'react-dom/*'],
  logLevel: 'info',
});

const built = globSync('**/*.cjs', { cwd: outdir }).map(f => path.join(outdir, f));
await mkdir(path.join(root, 'coverage'), { recursive: true });
const res = spawnSync(process.execPath, [
  '--test',
  '--experimental-test-coverage',
  '--test-coverage-include=src/**/*.ts',
  '--test-coverage-include=src/**/*.tsx',
  '--test-coverage-exclude=src/**/*.test.ts',
  '--test-coverage-exclude=src/**/*.test.tsx',
  '--test-reporter=spec',
  '--test-reporter-destination=stdout',
  '--test-reporter=lcov',
  `--test-reporter-destination=${path.join(root, 'coverage/lcov.info')}`,
  ...built,
], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
if ((res.status ?? 1) === 0) {
  const coverage = await import('./write-lcov.mjs');
}
process.exit(res.status ?? 1);

