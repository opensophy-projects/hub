
// ─── § Preview renderer (used by dev panel) ───────────────────────────────────
// Runs the same pipeline as parseDoc but returns only the HTML content string.
// Called by devBridge.mjs → handleRenderPreview action.

export function renderMarkdownToHtml(markdown) {
  // Strip frontmatter if present
  let content = markdown;
  if (content.startsWith('---\n')) {
    const end = content.indexOf('\n---\n', 4);
    if (end !== -1) content = content.slice(end + 5);
  }
  const processed = processImageSyntax(content);
  const withKatex = preprocessKatex(processed);
  return marked(preprocessMarkdownExtensions(withKatex));
}