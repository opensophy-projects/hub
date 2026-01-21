import { marked } from 'marked';

export function setupMarked() {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const renderer = {
    image: (token: any) => {
      const alt = token.text || '';
      let src = token.href || '';
      const title = token.title || '';
      let caption = '';

      // Если href выглядит как текст (не путь), то это подпись
      if (src && !src.startsWith('http') && !src.startsWith('/') && !src.includes('.')) {
        caption = src;
        src = `/assets/${alt}`;
      } 
      // Если src - это имя файла
      else if (src && !src.startsWith('http') && !src.startsWith('/')) {
        src = `/assets/${src}`;
        // Если есть title, используем его как подпись
        if (title) {
          caption = title;
        }
      } 
      // Если src уже полный путь
      else if (src) {
        if (title) {
          caption = title;
        }
      }

      const titleAttr = caption ? `title="${caption}"` : '';
      const captionClass = caption ? 'has-caption' : '';
      
      return `<img src="${src}" alt="${alt}" ${titleAttr} class="${captionClass}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;" loading="lazy" />`;
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