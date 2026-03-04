import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, Sparkles } from 'lucide-react';

interface AskAIButtonProps {
  isDark: boolean;
  pageTitle: string;
  pageSlug: string;
  markdownContent?: string;
}

const PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    getUrl: (title: string, url: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(`Объясни эту страницу: "${title}" — ${url}`)}`,
  },
  {
    id: 'claude',
    name: 'Claude',
    getUrl: (title: string, url: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(`Объясни эту страницу: "${title}" — ${url}`)}`,
  },
];

const AskAIButton: React.FC<AskAIButtonProps> = ({
  isDark,
  pageTitle,
  pageSlug,
  markdownContent,
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const getPageUrl = () =>
    typeof window !== 'undefined' ? window.location.href : pageSlug;

  const handleProviderClick = (p: typeof PROVIDERS[0]) => {
    window.open(p.getUrl(pageTitle, getPageUrl()), '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleCopy = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const popupBg   = isDark ? '#0a0a0a' : '#E8E7E3';
  const border    = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
  const labelColor= isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.35)';
  const rowHov    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const divColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const btnBg     = isDark ? '#1a1a1a' : '#d4d3cf';
  const btnBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
  const btnHov    = isDark ? '#222222' : '#c8c7c3';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Кнопка */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.7rem',
          borderRadius: '8px',
          border: `1px solid ${btnBorder}`,
          background: open ? btnHov : btnBg,
          color: textColor,
          fontSize: '0.76rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s',
          userSelect: 'none',
          lineHeight: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = btnHov)}
        onMouseLeave={e => (e.currentTarget.style.background = open ? btnHov : btnBg)}
      >
        <Sparkles size={11} style={{ opacity: 0.7 }} />
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

      {/* Дропдаун */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 7px)',
            right: 0,
            width: '200px',
            background: popupBg,
            border: `1px solid ${border}`,
            borderRadius: '10px',
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.7)'
              : '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 200,
            overflow: 'hidden',
            animation: 'askAiIn 0.13s ease',
          }}
        >
          <style>{`
            @keyframes askAiIn {
              from { opacity:0; transform:translateY(-5px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          {/* Лейбл */}
          <div style={{
            padding: '9px 12px 4px',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: labelColor,
          }}>
            Выбери ИИ
          </div>

          {/* Провайдеры */}
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
                background: hoveredId === p.id ? rowHov : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: textColor,
                fontSize: '0.83rem',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
            >
              {p.name}
            </button>
          ))}

          {/* Разделитель */}
          <div style={{ height: '1px', background: divColor, margin: '4px 0' }} />

          {/* Копировать Markdown */}
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
              background: hoveredId === 'copy' ? rowHov : 'transparent',
              border: 'none',
              cursor: markdownContent ? 'pointer' : 'default',
              color: markdownContent ? textColor : labelColor,
              fontSize: '0.83rem',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
          >
            {copied
              ? <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
              : <Copy size={13} style={{ opacity: 0.45, flexShrink: 0 }} />
            }
            {copied ? 'Скопировано!' : 'Копировать Markdown'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AskAIButton;
