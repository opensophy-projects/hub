import { marked } from 'marked';

export function setupMarked() {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const renderer = {
    image: (token: any) => {
      let src = token.href || '';
      const alt = token.text || '';
      const title = token.title || '';
      let caption = '';

      if (!title && src && !src.startsWith('http') && !src.startsWith('/')) {
        if (!src.includes('.')) {
          caption = src;
          src = `/assets/${alt}`;
        } else {
          src = `/assets/${src}`;
        }
      } else if (src && !src.startsWith('http') && !src.startsWith('/')) {
        src = `/assets/${src}`;
      }

      const titleAttr = title || caption ? `title="${title || caption}"` : '';
      
      return `<img src="${src}" alt="${alt}" ${titleAttr} style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;" loading="lazy" />`;
    },
    link: (token: any) => {
      const href = token.href || '';
      const text = token.text || '';
      return `<a href="${href}" style="color: #3b82f6; text-decoration: underline;">${text}</a>`;
    },
    code: (token: any) => {
      const text = token.text || '';
      const lang = token.lang || 'plaintext';
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `<pre class="code-block" data-lang="${lang}"><code class="language-${lang}">${escaped}</code></pre>`;
    },
  };

  marked.use({ renderer: renderer as any });
}

setupMarked();
