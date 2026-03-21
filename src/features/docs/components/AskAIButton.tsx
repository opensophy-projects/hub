import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, Sparkles } from 'lucide-react';

interface AskAIButtonProps {
  isDark: boolean;
  pageTitle: string;
  pageSlug: string;
  markdownContent?: string;
}

function buildAiQuery(title: string, url: string): string {
  return `Объясни эту страницу: "${title}" — ${url}`;
}

const PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    getUrl: (title: string, url: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(buildAiQuery(title, url))}`,
  },
  {
    id: 'claude',
    name: 'Claude',
    getUrl: (title: string, url: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(buildAiQuery(title, url))}`,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    getUrl: (title: string, url: string) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(buildAiQuery(title, url))}`,
  },
];

interface Theme {
  popupBg: string;
  border: string;
  textColor: string;
  labelColor: string;
  rowHov: string;
  divColor: string;
  btnBg: string;
  btnBorder: string;
  btnHov: string;
}

function getTheme(isDark: boolean): Theme {
  return isDark
    ? {
        popupBg:    '#0a0a0a',
        border:     'rgba(255,255,255,0.1)',
        textColor:  'rgba(255,255,255,0.85)',
        labelColor: 'rgba(255,255,255,0.3)',
        rowHov:     'rgba(255,255,255,0.06)',
        divColor:   'rgba(255,255,255,0.08)',
        btnBg:      '#1a1a1a',
        btnBorder:  'rgba(255,255,255,0.12)',
        btnHov:     '#222222',
      }
    : {
        popupBg:    '#E8E7E3',
        border:     'rgba(0,0,0,0.1)',
        textColor:  'rgba(0,0,0,0.85)',
        labelColor: 'rgba(0,0,0,0.35)',
        rowHov:     'rgba(0,0,0,0.06)',
        divColor:   'rgba(0,0,0,0.08)',
        btnBg:      '#d4d3cf',
        btnBorder:  'rgba(0,0,0,0.15)',
        btnHov:     '#c8c7c3',
      };
}

const AskAIButton: React.FC<AskAIButtonProps> = ({
  isDark,
  pageTitle,
  pageSlug,
  markdownContent,
}) => {
  const [open,      setOpen]      = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const t   = getTheme(isDark);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const getPageUrl = () => globalThis.location.href;

  const handleProviderClick = (p: typeof PROVIDERS[0]) => {
    globalThis.open(p.getUrl(pageTitle, getPageUrl()), '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleCopy = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступен — тихо игнорируем
    }
  };

  const boxShadow = isDark
    ? '0 8px 32px rgba(0,0,0,0.7)'
    : '0 8px 32px rgba(0,0,0,0.12)';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={e => (e.currentTarget.style.background = t.btnHov)}
        onMouseLeave={e => (e.currentTarget.style.background = open ? t.btnHov : t.btnBg)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.7rem',
          borderRadius: '8px',
          border: `1px solid ${t.btnBorder}`,
          background: open ? t.btnHov : t.btnBg,
          color: t.textColor,
          fontSize: '0.76rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        <Sparkles size={11} style={{ opacity: 0.7 }}/>
        Спросить у ИИ
        <ChevronDown
          size={11}
          style={{
            opacity: 0.5,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 7px)',
          right: 0,
          width: '200px',
          background: t.popupBg,
          border: `1px solid ${t.border}`,
          borderRadius: '10px',
          boxShadow,
          zIndex: 200,
          overflow: 'hidden',
          animation: 'askAiIn 0.13s ease',
        }}>
          <style>{`
            @keyframes askAiIn {
              from { opacity:0; transform:translateY(-5px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          <div style={{
            padding: '9px 12px 4px',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: t.labelColor,
          }}>
            Выбери ИИ
          </div>

          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => handleProviderClick(p)}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0.42rem 0.75rem',
                background: hoveredId === p.id ? t.rowHov : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: t.textColor,
                fontSize: '0.83rem',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              {p.name}
            </button>
          ))}

          <div style={{ height: '1px', background: t.divColor, margin: '4px 0' }}/>

          <button
            onClick={handleCopy}
            onMouseEnter={() => setHoveredId('copy')}
            onMouseLeave={() => setHoveredId(null)}
            disabled={!markdownContent}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.42rem 0.75rem 0.6rem',
              background: hoveredId === 'copy' ? t.rowHov : 'transparent',
              border: 'none',
              cursor: markdownContent ? 'pointer' : 'default',
              color: markdownContent ? t.textColor : t.labelColor,
              fontSize: '0.83rem',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
          >
            {copied
              ? <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }}/>
              : <Copy  size={13} style={{ opacity: 0.45,   flexShrink: 0 }}/>
            }
            {copied ? 'Скопировано!' : 'Копировать HTML'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AskAIButton;