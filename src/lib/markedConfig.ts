import { marked } from 'marked';

export function setupMarked() {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  let lastImageSrc = '';

  const renderer = {
    image: (token: any) => {
      let src = token.href || '';
      const alt = token.text || '';

      if (src && !src.startsWith('http') && !src.startsWith('/')) {
        src = `/assets/${src}`;
      }

      lastImageSrc = src;

      return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;" loading="lazy" />`;
    },

    paragraph: (token: any) => {
      const text = token.text || '';
      
      if (text.startsWith('<em>') && text.endsWith('</em>') && lastImageSrc) {
        const caption = text.replaceAll(/<\/?em>/g, '').trim();
        lastImageSrc = '';
        return `<figcaption style="text-align: center; margin-top: -12px; margin-bottom: 24px; font-style: italic; font-size: 0.95em; opacity: 0.85; color: #999;">${caption}</figcaption>`;
      }

      lastImageSrc = '';
      return `<p>${text}</p>`;
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
        .replaceAll(/&/g, '&amp;')
        .replaceAll(/</g, '&lt;')
        .replaceAll(/>/g, '&gt;')
        .replaceAll(/"/g, '&quot;');
      return `<pre class="code-block" data-lang="${lang}"><code class="language-${lang}">${escaped}</code></pre>`;
    },
  };

  marked.use({ renderer: renderer as any });
}

setupMarked();
