import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isTTY = process.stdout.isTTY;
const dim   = isTTY ? '\x1b[2m' : '';
const bold  = isTTY ? '\x1b[1m' : '';
const reset = isTTY ? '\x1b[0m' : '';
const green = isTTY ? '\x1b[32m' : '';
const VERSION = 'v3.5.1';

function runScript(scriptName) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, scriptName)],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const start = performance.now();

process.stdout.write(`\n  ${bold}opensophy hub${reset} ${dim}${VERSION}${reset} ${green}static build prep${reset}\n`);

runScript('generateDocs.mjs');
runScript('generateSitemap.mjs');

const ms = (performance.now() - start).toFixed(0);
process.stdout.write(`  ${green}ready${reset} ${dim}all static assets generated in${reset} ${ms}ms\n\n`);
