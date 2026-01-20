import { marked, Renderer, Token } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export const setupMarkedConfig = () => {
  const renderer = new Renderer();

  // Заголовки
  renderer.heading = (token: Token.Heading) => {
    const text = token.text;
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `<h${token.depth} id="${id}" class="heading-${token.depth}">${text}</h${token.depth}>`;
  };

  // Параграфы
  renderer.paragraph = (token: Token.Paragraph) => {
    return `<p class="paragraph">${token.text}</p>`;
  };

  // Жирный текст
  renderer.strong = (token: Token.Strong) => {
    return `<strong>${token.text}</strong>`;
  };

  // Курсив
  renderer.em = (token: Token.Em) => {
    return `<em>${token.text}</em>`;
  };

  // Зачёркнутый текст (через ~~text~~)
  renderer.del = (token: Token.Del) => {
    return `<del>${token.text}</del>`;
  };

  // Inline код
  renderer.codespan = (token: Token.Codespan) => {
    return `<code class="inline-code">${DOMPurify.sanitize(token.text)}</code>`;
  };

  // Блок-цитаты
  renderer.blockquote = (token: Token.Blockquote) => {
    const depth = token.raw.split('>').length - 1;
    return `<blockquote class="blockquote blockquote-depth-${Math.min(depth, 3)}">${token.text}</blockquote>`;
  };

  // Списки
  renderer.list = (token: Token.List) => {
    const ordered = token.ordered;
    const tag = ordered ? 'ol' : 'ul';
    const start = ordered && token.start !== 1 ? ` start="${token.start}"` : '';
    return `<${tag}${start} class="markdown-list markdown-${ordered ? 'ordered' : 'unordered'}">${token.raw}</${tag}>`;
  };

  // Элементы списка с поддержкой чек-листов
  renderer.listitem = (token: Token.ListItem) => {
    let content = token.text;

    // Чек-лист: [✗] [✓] [!] [?]
    const checkboxMatch = content.match(/^\[(✗|✓|!|\?)\]\s*/);
    if (checkboxMatch) {
      const checkbox = checkboxMatch[1];
      const checkboxClass = {
        '✗': 'checkbox-unchecked',
        '✓': 'checkbox-checked',
        '!': 'checkbox-warning',
        '?': 'checkbox-info'
      }[checkbox];
      
      content = content.replace(/^\[(✗|✓|!|\?)\]\s*/, '');
      return `<li class="list-item ${checkboxClass}"><span class="checkbox-icon">${checkbox}</span> ${content}</li>`;
    }

    return `<li class="list-item">${content}</li>`;
  };

  // Код-блоки
  renderer.code = (token: Token.Code) => {
    const lang = token.lang || 'plaintext';
    const code = DOMPurify.sanitize(token.text);
    return `<code-block language="${lang}">${code}</code-block>`;
  };

  // Горизонтальный разделитель
  renderer.hr = () => {
    return '<hr class="horizontal-separator">';
  };

  // Ссылки
  renderer.link = (token: Token.Link) => {
    const href = DOMPurify.sanitize(token.href);
    const title = token.title ? ` title="${DOMPurify.sanitize(token.title)}"` : '';
    return `<a href="${href}"${title} class="markdown-link">${token.text}</a>`;
  };

  // Email ссылки
  renderer.text = (token: Token.Text | any) => {
    let text = token.text || token;

    // Автоссылки для URL
    text = text.replace(
      /(?:^|[^[\]"])(https?:\/\/[^\s<>[\]{}|\\^`"]+)/g,
      (match: string, url: string) => {
        const offset = match.startsWith('(') || match.startsWith('[') ? 1 : 0;
        return (offset ? match.substring(0, offset) : '') + 
               `<a href="${url}" class="markdown-autolink">${url}</a>` +
               (offset ? match.substring(offset + url.length) : '');
      }
    );

    // Email ссылки
    text = text.replace(
      /(?:^|[^<\]"])([\w.+-]+@[\w.-]+\.\w+)/g,
      (match: string, email: string) => {
        const offset = match.startsWith('[') ? 1 : 0;
        return (offset ? match.substring(0, offset) : '') + 
               `<a href="mailto:${email}" class="markdown-email">${email}</a>`;
      }
    );

    // Inline-математика $E = mc^2$
    text = text.replace(
      /\$([^\$]+)\$/g,
      (match: string, formula: string) => {
        return `<math-inline>${DOMPurify.sanitize(formula)}</math-inline>`;
      }
    );

    return text;
  };

  // Изображения с подписями
  renderer.image = (token: Token.Image) => {
    const src = token.href;
    const alt = token.text;
    const title = token.title || '';
    
    const isAsset = src.includes('.png') && !src.startsWith('http');
    const imgSrc = isAsset ? `/assets/${src}` : src;
    
    const caption = title ? `<figcaption class="image-caption">${title}</figcaption>` : '';
    
    return `<figure class="markdown-figure"><img src="${imgSrc}" alt="${alt}" class="markdown-image">${caption}</figure>`;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true
  });

  return marked;
};

// Функция для обработки специальных блоков до парсинга marked
export const preprocessMarkdown = (content: string): string => {
  let processed = content;

  // Обработка Callouts: > [!NOTE] ... > > NOTE
  processed = processed.replace(
    /^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*\n((?:>.*\n?)*)/gm,
    (match, type, content) => {
      const lines = content
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, '').trim())
        .filter((line: string) => line)
        .join('\n');
      return `<callout type="${type.toLowerCase()}">${lines}</callout>`;
    }
  );

  // Обработка Collapsed sections
  processed = processed.replace(
    /<details>\s*\n?\s*<summary>(.*?)<\/summary>\s*\n([\s\S]*?)\n<\/details>/g,
    '<collapsed-section title="$1">$2</collapsed-section>'
  );

  // Обработка code-section блоков
  processed = processed.replace(
    /<code\s+section>\s*\n([\s\S]*?)\n<\/code\s+section>/g,
    '<code-section>$1</code-section>'
  );

  // Обработка Mermaid диаграмм
  processed = processed.replace(
    /```mermaid\n([\s\S]*?)\n```/g,
    '<mermaid-diagram>$1</mermaid-diagram>'
  );

  // Обработка таблиц для AdvancedTable
  processed = processed.replace(
    /\|(.+)\|\n\|[\s\-:|\s]+\|\n((?:\|.+\|\n?)*)/g,
    (match) => {
      return `<advanced-table>${match}</advanced-table>`;
    }
  );

  return processed;
};

// Функция для post-processing HTML
export const postprocessMarkdown = (html: string): string => {
  let processed = html;

  // Очистка пустых параграфов
  processed = processed.replace(/<p>\s*<\/p>/g, '');

  // Форматирование inline-математики (KaTeX)
  processed = processed.replace(
    /<math-inline>(.*?)<\/math-inline>/g,
    (match, formula) => {
      return `<span class="math-inline" data-formula="${encodeURIComponent(formula)}">${formula}</span>`;
    }
  );

  return processed;
};
