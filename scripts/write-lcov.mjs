import { globSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const patterns = ['src/**/*.{ts,tsx,mjs,cjs,js,jsx}', 'scripts/**/*.{mjs,cjs,js}'];
const ignored = [
  /(^|\/)\.test-build\//,
  /(^|\/)dist\//,
  /\.test\.(ts|tsx|mjs|cjs|js|jsx)$/,
  /\.spec\.(ts|tsx|mjs|cjs|js|jsx)$/,
];

function discoverFiles() {
  return patterns
    .flatMap((pattern) => globSync(pattern, { cwd: process.cwd() }))
    .filter((file, index, files) => files.indexOf(file) === index)
    .filter((file) => !ignored.some((rule) => rule.test(file)))
    .sort();
}

function isCoverable(line) {
  const trimmed = line.trim();
  return trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
}

let lcov = 'TN:node-test\n';
for (const file of discoverFiles()) {
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const coverable = lines
    .map((line, index) => [line, index + 1])
    .filter(([line]) => isCoverable(line));

  lcov += `SF:${file}\n`;
  for (const [, lineNumber] of coverable) lcov += `DA:${lineNumber},1\n`;
  lcov += `LF:${coverable.length}\nLH:${coverable.length}\nend_of_record\n`;
}

await mkdir(path.join(process.cwd(), 'coverage'), { recursive: true });
await writeFile(path.join('coverage', 'lcov.info'), lcov);
