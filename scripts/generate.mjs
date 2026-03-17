import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isTTY = process.stdout.isTTY;
const dim   = isTTY ? '\x1b[2m' : '';
const reset = isTTY ? '\x1b[0m' : '';

function runScript(scriptName) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, scriptName)],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const start = performance.now();

runScript('generateDocs.mjs');
runScript('generateSitemap.mjs');

const ms = (performance.now() - start).toFixed(0);
process.stdout.write(`\n  ${dim}done in${reset} ${ms}ms\n\n`);