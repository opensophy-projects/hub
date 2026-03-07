import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanDocsDirectoryRecursive,
  buildDocFromPath,
} from './docUtils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../Docs');
const outputDir = path.join(__dirname, '../public/data/docs');
const manifestFile = path.join(outputDir, 'manifest.json');

const EXCLUDED_FIELDS = new Set(['content', 'keywords', 'robots']);

function generateDocs() {
  console.log('🔄 Generating docs manifest...');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Docs directory not found: ${docsDir}`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allMdFiles = scanDocsDirectoryRecursive(docsDir);

  const manifest = allMdFiles.map((mdPath) => {
    const doc = buildDocFromPath(mdPath, docsDir);
    return Object.fromEntries(
      Object.entries(doc).filter(([k]) => !EXCLUDED_FIELDS.has(k))
    );
  });

  const sorted = manifest.toSorted(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  fs.writeFileSync(manifestFile, JSON.stringify(sorted, null, 2));

  console.log(`✅ Generated manifest.json with ${sorted.length} documents`);
  sorted.forEach((doc) =>
    console.log(`  - ${doc.title} (${doc.typename || 'no-category'}) - slug: ${doc.slug || '/'}`)
  );
  console.log('✅ No individual JSON files generated - using raw markdown files');
}

generateDocs();