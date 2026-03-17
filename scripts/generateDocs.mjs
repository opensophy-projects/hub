import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanDocsDirectoryRecursive,
  buildDocFromPath,
  extractFrontMatter,
} from './docUtils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const docsDir      = path.join(__dirname, '../Docs');
const outputDir    = path.join(__dirname, '../public/data/docs');
const manifestFile = path.join(outputDir, 'manifest.json');

const EXCLUDED_FIELDS = new Set(['content', 'keywords', 'robots']);

// ─── Terminal helpers ─────────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY;

const c = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  white:  '\x1b[37m',
  bold:   '\x1b[1m',
};

const clr = (code, str) => isTTY ? `${code}${str}${c.reset}` : str;

function col(text, width) {
  return String(text).padEnd(width);
}

function progressBar(done, total, width = 20) {
  const filled = Math.round((done / total) * width);
  const empty  = width - filled;
  const bar    = '='.repeat(Math.max(0, filled - 1)) + (done < total ? '>' : '=') + ' '.repeat(empty);
  return `[${bar}]`;
}

function clearLine() {
  if (isTTY) process.stdout.write('\r\x1b[K');
}

function moveCursorUp(lines) {
  if (isTTY) process.stdout.write(`\x1b[${lines}A`);
}

// ─── Frontmatter validator ────────────────────────────────────────────────────

function findFieldLine(lines, field) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(`${field}:`)) return i + 1;
  }
  return null;
}

function validateDoc(mdPath, docsDir) {
  const rel = path.relative(docsDir, mdPath);
  if (rel === 'welcome.md') return [];

  let raw;
  try {
    raw = fs.readFileSync(mdPath, 'utf-8');
  } catch {
    return [{ line: 0, message: 'cannot read file' }];
  }

  const { metadata } = extractFrontMatter(raw);
  const lines = raw.split('\n');
  const errors = [];

  if (!metadata.title?.trim()) {
    errors.push({ line: findFieldLine(lines, 'title') ?? 1, message: 'missing required field "title"' });
  }

  if (metadata.date && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date.trim())) {
    errors.push({ line: findFieldLine(lines, 'date') ?? 1, message: `invalid date format "${metadata.date.trim()}" (expected YYYY-MM-DD)` });
  }

  return errors;
}

// ─── Build pass ───────────────────────────────────────────────────────────────

function processFile(mdPath, relPath) {
  const errors = validateDoc(mdPath, docsDir);
  if (errors.length > 0) return { ok: false, file: relPath, errors };

  try {
    const doc = buildDocFromPath(mdPath, docsDir);
    const entry = Object.fromEntries(Object.entries(doc).filter(([k]) => !EXCLUDED_FIELDS.has(k)));
    return { ok: true, entry };
  } catch (err) {
    return { ok: false, file: relPath, errors: [{ line: 0, message: err.message }] };
  }
}

function buildManifest(allMdFiles) {
  const manifest   = [];
  const fileErrors = [];

  if (isTTY) {
    process.stdout.write(`  ${progressBar(0, allMdFiles.length)} 0/${allMdFiles.length} docs`);
  }

  for (let i = 0; i < allMdFiles.length; i++) {
    const mdPath  = allMdFiles[i];
    const relPath = path.relative(path.join(__dirname, '..'), mdPath);
    const result  = processFile(mdPath, relPath);

    if (result.ok) {
      manifest.push(result.entry);
    } else {
      fileErrors.push({ file: result.file, errors: result.errors });
    }

    if (isTTY) {
      clearLine();
      process.stdout.write(`  ${progressBar(i + 1, allMdFiles.length)} ${i + 1}/${allMdFiles.length} docs`);
    }
  }

  if (isTTY) {
    process.stdout.write('\n');
    moveCursorUp(2);
    clearLine();
    clearLine();
  }

  return { manifest, fileErrors };
}

// ─── Output helpers ───────────────────────────────────────────────────────────

function printErrors(fileErrors) {
  process.stdout.write('\n');
  for (const { file, errors } of fileErrors) {
    for (const { line, message } of errors) {
      const lineStr = line > 0 ? `:${line}` : '';
      process.stdout.write(`  ${clr(c.red, 'error')}  ${clr(c.white, file)}${clr(c.dim, lineStr)}\n`);
      process.stdout.write(`         ${clr(c.dim, message)}\n`);
    }
  }
}

function pluralErrors(count) {
  return count === 1 ? 'error' : 'errors';
}

function buildDocsStr(okCount, errCount) {
  if (errCount === 0) return clr(c.green, `${okCount} articles`);
  return `${clr(c.green, `${okCount} ok`)} ${clr(c.dim, '·')} ${clr(c.red, `${errCount} ${pluralErrors(errCount)}`)}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function generateDocs() {
  const startAll = performance.now();

  process.stdout.write(`\n  ${clr(c.dim, 'hub')}  generate\n`);

  if (!fs.existsSync(docsDir)) {
    process.stdout.write(`\n  ${clr(c.red, 'error')}  Docs/ directory not found: ${docsDir}\n\n`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const allMdFiles = scanDocsDirectoryRecursive(docsDir);

  if (allMdFiles.length === 0) {
    process.stdout.write(`\n  ${clr(c.yellow, 'warn')}  no .md files found in Docs/\n\n`);
    return;
  }

  const docStart              = performance.now();
  const { manifest, fileErrors } = buildManifest(allMdFiles);

  const sorted = manifest.toSorted(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  fs.writeFileSync(manifestFile, JSON.stringify(sorted));

  const docMs    = (performance.now() - docStart).toFixed(0);
  const allMs    = (performance.now() - startAll).toFixed(0);
  const okCount  = manifest.length;
  const errCount = fileErrors.length;

  process.stdout.write(`\n  ${clr(c.dim, 'hub')}  generate\n`);

  if (errCount > 0) printErrors(fileErrors);

  process.stdout.write('\n');
  process.stdout.write(`  ${clr(c.dim, col('docs', 10))}${buildDocsStr(okCount, errCount)}   ${clr(c.dim, docMs + 'ms')}\n`);
  process.stdout.write(`\n  ${clr(c.dim, 'done in')} ${allMs}ms\n\n`);

  if (errCount > 0) process.exit(1);
}

generateDocs();