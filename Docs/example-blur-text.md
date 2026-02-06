# BlurText - Анимированный текст

<uic-component id="blur-text" name="BlurText" />

## Основное использование

Этот компонент создает красивую анимацию текста с эффектом размытия.

### Примеры:

**По словам:**
```tsx
<BlurText
  text="Это красиво выглядит"
  delay={200}
  animateBy="words"
  direction="top"
/>
По буквам:

<BlurText
  text="Буква за буквой"
  delay={50}
  animateBy="letters"
  direction="bottom"
/>
```

---

## Как подключить в Astro компонент DocContent

Обновленный **src/components/DocContent.tsx** (ТОЛЬКО если используешь это):

```typescript
import React, { useMemo } from 'react';
import { parseHtmlToReact, TableContext } from '@/lib/htmlParser';
import { useTheme } from '@/contexts/ThemeContext';
import UIComponentViewer from '@/uic-system/components/UIComponentViewer';
import BlurText from '@/uic-system/blur-text/BlurText';

interface DocContentProps {
  html: string;
  isDark: boolean;
}

const DocContent: React.FC<DocContentProps> = ({ html, isDark }) => {
  const processedHtml = useMemo(() => {
    // Заменяем <uic-component> на временный плейсхолдер
    return html.replace(
      /<uic-component[^>]*id="([^"]*)"[^>]*name="([^"]*)"[^>]*\/?>/g,
      (match, id, name) => `<div data-uic-component="${id}" data-uic-name="${name}"></div>`
    );
  }, [html]);

  const elements = parseHtmlToReact(processedHtml);

  const processedElements = elements.map((element, index) => {
    if (!React.isValidElement(element)) return element;

    const { props } = element;
    if (props?.children && typeof props.children === 'object') {
      const divProps = props.children?.props?.dangerouslySetInnerHTML?.__html;
      
      if (divProps?.includes('data-uic-component')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(divProps, 'text/html');
        const div = doc.querySelector('[data-uic-component]');
        
        if (div) {
          const componentId = div.getAttribute('data-uic-component');
          const componentName = div.getAttribute('data-uic-name') || componentId;

          if (componentId === 'blur-text') {
            return (
              <div key={index} className="my-8">
                <UIComponentViewer
                  componentId="blur-text"
                  componentName={componentName}
                  Component={BlurText}
                  files={{
                    'BlurText.tsx': require('!raw-loader!@/uic-system/blur-text/BlurText.tsx').default,
                    'types.ts': require('!raw-loader!@/uic-system/blur-text/types.ts').default,
                  }}
                  config={{
                    name: 'BlurText',
                    description: 'Анимированный текст',
                    files: [
                      { name: 'BlurText.tsx', type: 'tsx' },
                      { name: 'types.ts', type: 'ts' },
                    ],
                  }}
                />
              </div>
            );
          }
        }
      }
    }

    return element;
  });

  return (
    <TableContext.Provider value={{ isDark }}>
      <div className="prose dark:prose-invert max-w-none">
        {processedElements}
      </div>
    </TableContext.Provider>
  );
};

export default DocContent;
