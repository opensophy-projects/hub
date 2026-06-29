import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, ChevronDown, Sparkles } from 'lucide-react';
import { makeTokens } from '@/shared/tokens/theme';

interface AskAIButtonProps {
  isDark: boolean;
  pageTitle: string;
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

// Mirrors the token helpers from Navigation
const THEME_DARK = {
  fg:               'rgba(255,255,255,0.85)',
  fgMuted:          'rgba(255,255,255,0.55)',
  hov:              'rgba(255,255,255,0.05)',
  sectionBorder:    'rgba(255,255,255,0.12)',
  sectionShadow:    '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
  sectionBg:        '#0F0F0F',
  elevatedBg:       '#121212',
  elevatedBorder:   'rgba(255,255,255,0.10)',
  elevatedShadow:   '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
  accentSoft:       'rgba(255,255,255,0.07)',
} as const;

const THEME_LIGHT = {
  fg:               'rgba(0,0,0,0.85)',
  fgMuted:          'rgba(0,0,0,0.55)',
  hov:              'rgba(0,0,0,0.04)',
  sectionBorder:    'rgba(0,0,0,0.15)',
  sectionShadow:    '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.55)',
  sectionBg:        '#d5d4d0',
  elevatedBg:       '#ECEBE7',
  elevatedBorder:   'rgba(0,0,0,0.10)',
  elevatedShadow:   '0 8px 24px rgba(0,0,0,0.14)',
  accentSoft:       'rgba(0,0,0,0.05)',
} as const;

function tk(isDark: boolean) {
  const base = makeTokens(isDark);
  const mode = isDark ? THEME_DARK : THEME_LIGHT;
  return { ...base, ...mode };
}

function getUnifiedControlStyle(isDark: boolean, isActive = false) {
  const t = tk(isDark);
  return {
    border: `1px solid ${isActive
      ? (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)')
      : t.sectionBorder}`,
    background: t.sectionBg,
    boxShadow: t.sectionShadow,
    borderRadius: '8px',
  };
}

const AskAIButton: React.FC<AskAIButtonProps> = ({
  isDark,
  pageTitle,
  markdownContent,
}) => {
  const [open,      setOpen]      = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref      = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const t = tk(isDark);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (ref.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const getPageUrl = () => globalThis.location.href;

  const toggleOpen = () => {
    if (open) { setOpen(false); return; }
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const width = 210;
      setMenuPos({
        top:  rect.bottom + 7,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
    setOpen(true);
  };

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
      // clipboard недоступен
    }
  };

  // Trigger button: same style as nav section selector button
  const triggerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.4rem 0.65rem',
    fontSize: '0.855rem',
    fontWeight: 500,
    cursor: 'pointer',
    color: t.fg,
    userSelect: 'none' as const,
    lineHeight: 1,
    ...getUnifiedControlStyle(isDark, open),
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={toggleOpen} style={triggerStyle}>
        <Sparkles size={13} style={{ opacity: 0.7, color: t.fgMuted }} />
        Спросить у ИИ
        <ChevronDown
          size={12}
          style={{
            color: t.fgMuted,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            top:  menuPos.top,
            left: menuPos.left,
            width: '210px',
            // Matches the nav section dropdown popup
            borderRadius: '12px',
            border: `1px solid ${t.elevatedBorder}`,
            background: t.elevatedBg,
            boxShadow: t.elevatedShadow,
            zIndex: 100020,
            overflow: 'hidden',
            animation: 'askAiIn 0.13s ease',
          }}
        >
          <style>{`
            @keyframes askAiIn {
              from { opacity:0; transform:translateY(-4px) scale(0.98); }
              to   { opacity:1; transform:translateY(0)   scale(1); }
            }
          `}</style>

          {/* Label — same style as nav section header label */}
          <div style={{
            padding: '9px 12px 5px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: t.fgMuted,
          }}>
            Выбери ИИ
          </div>

          {/* Provider rows — use getUnifiedControlStyle on hover */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px 8px 4px' }}>
            {PROVIDERS.map(p => {
              const isHov = hoveredId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProviderClick(p)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 10px',
                    color: t.fg,
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'color 0.12s',
                    ...(isHov
                      ? getUnifiedControlStyle(isDark, true)
                      : { border: '1px solid transparent', background: 'transparent', boxShadow: 'none', borderRadius: '8px' }),
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Divider — same style as nav */}
          <div style={{
            height: '1px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            margin: '4px 8px',
          }} />

          {/* Copy row */}
          <div style={{ padding: '4px 8px 8px' }}>
            {(() => {
              const isHov = hoveredId === 'copy';
              return (
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
                    padding: '8px 10px',
                    color: markdownContent ? t.fg : t.fgMuted,
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: markdownContent ? 'pointer' : 'default',
                    transition: 'color 0.12s',
                    ...(isHov && markdownContent
                      ? getUnifiedControlStyle(isDark, true)
                      : { border: '1px solid transparent', background: 'transparent', boxShadow: 'none', borderRadius: '8px' }),
                  }}
                >
                  {copied
                    ? <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                    : <Copy  size={13} style={{ opacity: 0.45, flexShrink: 0, color: t.fgMuted }} />
                  }
                  {copied ? 'Скопировано!' : 'Копировать HTML'}
                </button>
              );
            })()}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default AskAIButton;