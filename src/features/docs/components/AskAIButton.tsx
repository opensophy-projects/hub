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

// ── Exact copies from Navigation.tsx ────────────────────────────────────────

const THEME_DARK = {
  fg:               'rgba(255,255,255,0.85)',
  fgMuted:          'rgba(255,255,255,0.55)',
  hov:              'rgba(255,255,255,0.05)',
  sectionBorder:    'rgba(255,255,255,0.12)',
  sectionShadow:    '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
  dropdownBg:       '#0F0F0F',
  dropdownBorder:   'rgba(255,255,255,0.10)',
  dropdownShadow:   '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
  surface:          '#0F0F0F',
  accentSoft:       'rgba(255,255,255,0.07)',
} as const;

const THEME_LIGHT = {
  fg:               'rgba(0,0,0,0.85)',
  fgMuted:          'rgba(0,0,0,0.55)',
  hov:              'rgba(0,0,0,0.04)',
  sectionBorder:    'rgba(0,0,0,0.15)',
  sectionShadow:    '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.55)',
  dropdownBg:       '#dddcd8',   // exact from Navigation THEME_LIGHT
  dropdownBorder:   'rgba(0,0,0,0.1)',
  dropdownShadow:   '0 8px 24px rgba(0,0,0,0.14)',
  surface:          '#d5d4d0',   // exact: sectionBg items sit on top of dropdownBg
  accentSoft:       'rgba(0,0,0,0.05)',
} as const;

function tk(isDark: boolean) {
  const base = makeTokens(isDark);
  const mode = isDark ? THEME_DARK : THEME_LIGHT;
  return { ...base, ...mode };
}

// Exact copy from Navigation.tsx
function getSectionOpenBorder(sectionOpen: boolean, isDark: boolean): string {
  if (!sectionOpen) return tk(isDark).sectionBorder;
  return isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
}

// Exact copy from Navigation.tsx
function getUnifiedControlStyle(isDark: boolean, isActive: boolean = false) {
  const t = tk(isDark);
  return {
    border: `1px solid ${isActive ? getSectionOpenBorder(true, isDark) : t.sectionBorder}`,
    background: t.surface,
    boxShadow: t.sectionShadow,
    borderRadius: '8px',
  };
}

// ────────────────────────────────────────────────────────────────────────────

const AskAIButton: React.FC<AskAIButtonProps> = ({ isDark, pageTitle, markdownContent }) => {
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

  const toggleOpen = () => {
    if (open) { setOpen(false); return; }
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const width = 210;
      setMenuPos({
        top:  rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
    setOpen(true);
  };

  const handleProviderClick = (p: typeof PROVIDERS[0]) => {
    globalThis.open(p.getUrl(pageTitle, globalThis.location.href), '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleCopy = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Trigger button — exact copy of the nav section selector button ── */}
      <button
        onClick={toggleOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.65rem',
          fontSize: '0.875rem',
          color: t.fg,
          cursor: 'pointer',
          ...getUnifiedControlStyle(isDark, open),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', minWidth: 0, flex: 1 }}>
          <Sparkles size={13} style={{ color: t.fgMuted, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', lineHeight: 1.3 }}>
            Спросить у ИИ
          </span>
        </div>
        <ChevronDown
          size={12}
          style={{
            color: t.fgMuted,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* ── Popup — exact copy of the nav section dropdown ── */}
      {open && createPortal(
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            top:  menuPos.top,
            left: menuPos.left,
            width: '210px',
            // From Navigation: position absolute, borderRadius 12, border elevatedBorder,
            // background isDark ? '#121212' : '#ECEBE7', boxShadow elevatedShadow
            borderRadius: '12px',
            border: `1px solid ${t.dropdownBorder}`,
            background: isDark ? '#121212' : '#ECEBE7',
            boxShadow: t.dropdownShadow,
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

          {/* Items — exact copy of SectionDropdown content wrapper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>

            {PROVIDERS.map(s => {
              const isActive = hoveredId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleProviderClick(s)}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.7rem',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: isActive ? t.accent : t.fg,
                    fontWeight: isActive ? 600 : 400,
                    // exact: getUnifiedControlStyle from Navigation
                    ...getUnifiedControlStyle(isDark, isActive),
                  }}
                >
                  <span style={{ wordBreak: 'break-word', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div style={{
              height: '1px',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              margin: '0 2px',
            }} />

            {/* Copy row */}
            {(() => {
              const isActive = hoveredId === 'copy';
              return (
                <button
                  onClick={handleCopy}
                  onMouseEnter={() => setHoveredId('copy')}
                  onMouseLeave={() => setHoveredId(null)}
                  disabled={!markdownContent}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.7rem',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: markdownContent ? 'pointer' : 'default',
                    color: markdownContent ? (isActive ? t.accent : t.fg) : t.fgMuted,
                    fontWeight: isActive && markdownContent ? 600 : 400,
                    ...getUnifiedControlStyle(isDark, isActive && !!markdownContent),
                  }}
                >
                  {copied
                    ? <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                    : <Copy  size={13} style={{ opacity: 0.45, flexShrink: 0, color: t.fgMuted }} />
                  }
                  <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {copied ? 'Скопировано!' : 'Копировать HTML'}
                  </span>
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