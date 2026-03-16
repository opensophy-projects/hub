import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const start = performance.now();

try {
  execSync(`node ${JSON.stringify(path.join(__dirname, 'generateDocs.mjs'))}`, { stdio: 'inherit' });
  execSync(`node ${JSON.stringify(path.join(__dirname, 'generateSitemap.mjs'))}`, { stdio: 'inherit' });
} catch {
  process.exit(1);
}

const ms = (performance.now() - start).toFixed(0);
const isTTY = process.stdout.isTTY;
const dim = isTTY ? '\x1b[2m' : '';
const reset = isTTY ? '\x1b[0m' : '';

process.stdout.write(`\n  ${dim}done in${reset} ${ms}ms\n\n`);