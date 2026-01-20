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

      if (src && !src.startsWith('http') && !src.startsWith('/')) {
        src = `/assets/${src}`;
      }

      const imgTag = `<img src="${src}" alt="${alt}" loading="lazy" />`;

      // Если есть title, оборачиваем в figure с figcaption
      if (title) {
        return `<figure class="image-with-caption">
          ${imgTag}
          <figcaption>${title}</figcaption>
        </figure>`;
      }

      // Если нет title, просто img
      return imgTag;
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
    paragraph: (token: any) => {
      const text = token.text || '';
      return `<p>${text}</p>`;
    },
    list: (token: any) => {
      const type = token.ordered ? 'ol' : 'ul';
      const body = token.items.map((item: any) => {
        return `<li>${item.text}</li>`;
      }).join('\n');
      return `<${type}>\n${body}\n</${type}>`;
    },
  };

  marked.use({ renderer: renderer as any });
}

setupMarked();
