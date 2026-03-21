import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import { ThemeTokensContext } from '../DevPanel';
import type { TTokens } from '../DevPanel';
import {
  Globe, Search, Bot, RefreshCw, Loader2,
  ChevronDown, ChevronRight, Check, FileText,
} from 'lucide-react';

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface SiteConfig {
  siteTitle:       string;
  siteDescription: string;
  siteUrl:         string;
  siteLang:        string;
  siteAuthor:      string;
  keywords:        string;
  metaRobots:      string;
  ogImage:         string;
  ogType:          string;
  ogLocale:        string;
  twitterCard:     string;
  twitterSite:     string;
}

const DEFAULTS: SiteConfig = {
  siteTitle:       'Hub — Opensophy',
  siteDescription: 'Hub проекта Opensophy — центр знаний по ИИ и кибербезопасности.',
  siteUrl:         'https://hub.opensophy.com',
  siteLang:        'ru',
  siteAuthor:      'Opensophy',
  keywords:        'opensophy, hub, документация, AI, кибербезопасность',
  metaRobots:      'index, follow',
  ogImage:         '/og-image.png',
  ogType:          'website',
  ogLocale:        'ru_RU',
  twitterCard:     'summary_large_image',
  twitterSite:     '',
};

const SEO_PATH    = 'src/shared/data/seo.ts';
const ROBOTS_PATH = 'public/robots.txt';
const LLM_PATH    = 'public/llm.txt';

// ─── Сериализация в seo.ts ────────────────────────────────────────────────────

function buildSeoTs(cfg: SiteConfig): string {
  return `// Генерируется Dev Panel — вкладка "Сайт". Не редактировать вручную.

export const SEO_CONFIG = {
  siteTitle:       ${JSON.stringify(cfg.siteTitle)},
  siteDescription: ${JSON.stringify(cfg.siteDescription)},
  siteUrl:         ${JSON.stringify(cfg.siteUrl)},
  siteLang:        ${JSON.stringify(cfg.siteLang)},
  siteAuthor:      ${JSON.stringify(cfg.siteAuthor)},
  keywords:        ${JSON.stringify(cfg.keywords)},
  metaRobots:      ${JSON.stringify(cfg.metaRobots)},
  ogImage:         ${JSON.stringify(cfg.ogImage)},
  ogType:          ${JSON.stringify(cfg.ogType)},
  ogLocale:        ${JSON.stringify(cfg.ogLocale)},
  twitterCard:     ${JSON.stringify(cfg.twitterCard)},
  twitterSite:     ${JSON.stringify(cfg.twitterSite)},
} as const;
`;
}

// ─── Парсинг seo.ts ───────────────────────────────────────────────────────────

function parseSeoTs(content: string): Partial<SiteConfig> {
  const result: Record<string, string> = {};
  const re = /^\s*(\w+):\s*["']([^"'\n]*)["'],?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = m[2];
  }
  return result as Partial<SiteConfig>;
}

// ─── UI-хелперы ───────────────────────────────────────────────────────────────

function useInpStyle(t: TTokens): React.CSSProperties {
  return {
    width: '100%', padding: '6px 8px', borderRadius: 6,
    border: `1px solid ${t.inpBorder}`, background: t.inpBg,
    color: t.fg, fontSize: 11, outline: 'none', fontFamily: t.mono,
    boxSizing: 'border-box' as const,
  };
}

interface FieldProps {
  label: string;
  hint?: string;
  wide?: boolean;
  t: TTokens;
  children: React.ReactNode;
}
function Field({ label, hint, wide, t, children }: Readonly<FieldProps>) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: t.fgSub, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, marginLeft: 5, opacity: 0.65 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

interface SelProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  t: TTokens;
}
function Sel({ value, onChange, options, t }: Readonly<SelProps>) {
  const s = useInpStyle(t);
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s, cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  t: TTokens;
  children: React.ReactNode;
}
function Section({ icon, title, badge, defaultOpen = true, t, children }: Readonly<SectionProps>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 12px', border: 'none', background: t.surface,
        color: t.fgMuted, cursor: 'pointer', textAlign: 'left' as const,
        fontSize: 10, fontWeight: 700, fontFamily: t.mono,
        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
      }}>
        {open ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
        <span style={{ color: t.fgSub, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ flex: 1 }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: t.accentSoft, color: t.fgMuted, border: `1px solid ${t.border}` }}>
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Стили кнопки "Сохранить" — вынесены чтобы избежать вложенных тернарников ─

function getSaveBtnStyle(saved: boolean, dirty: boolean, saving: boolean, t: TTokens): React.CSSProperties {
  const border     = saved ? `1px solid ${t.success}66` : dirty ? `1px solid ${t.borderStrong}` : `1px solid ${t.border}`;
  const background = saved ? 'rgba(34,197,94,0.1)'      : dirty ? t.surfaceHov                  : 'transparent';
  const color      = saved ? t.success                  : dirty ? t.fg                           : t.fgMuted;
  const fontWeight = dirty ? 500 : 400;
  return {
    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
    borderRadius: 6, border, background, color,
    cursor: saving ? 'default' : 'pointer',
    fontSize: 11, fontFamily: t.mono, fontWeight,
  };
}

// ─── SitePanel ────────────────────────────────────────────────────────────────

export default function SitePanel() {
  const t = useContext(ThemeTokensContext);
  const [cfg,       setCfg]       = useState<SiteConfig>({ ...DEFAULTS });
  const [robotsTxt, setRobotsTxt] = useState('');
  const [llmTxt,    setLlmTxt]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [dirty,     setDirty]     = useState(false);

  // Рефы нужны чтобы save() всегда читал актуальные значения без лишних зависимостей
  const cfgRef    = useRef(cfg);
  const robotsRef = useRef(robotsTxt);
  const llmRef    = useRef(llmTxt);
  useEffect(() => { cfgRef.current = cfg; },       [cfg]);
  useEffect(() => { robotsRef.current = robotsTxt; }, [robotsTxt]);
  useEffect(() => { llmRef.current = llmTxt; },    [llmTxt]);

  const inp = useInpStyle(t);

  const setC = (key: keyof SiteConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCfg(p => ({ ...p, [key]: e.target.value }));
      setDirty(true);
    };
  const setCVal = (key: keyof SiteConfig, val: string) => {
    setCfg(p => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { content: seoContent } = await bridge.readFile(SEO_PATH);
      if (seoContent.trim()) {
        const parsed = parseSeoTs(seoContent);
        setCfg(prev => ({ ...prev, ...parsed }));
      }
      const { content: robotsContent } = await bridge.readFile(ROBOTS_PATH);
      setRobotsTxt(robotsContent);
      const { content: llmContent } = await bridge.readFile(LLM_PATH);
      setLlmTxt(llmContent);
    } catch (e: unknown) {
      toast.error('Ошибка загрузки: ' + (e as Error).message);
    } finally {
      setDirty(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await bridge.writeFile(SEO_PATH,    buildSeoTs(cfgRef.current));
      await bridge.writeFile(ROBOTS_PATH, robotsRef.current);
      await bridge.writeFile(LLM_PATH,    llmRef.current);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Сохранено: seo.ts · robots.txt · llm.txt');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, []);

  // Ctrl+S / Cmd+S — сохранить
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    };
    globalThis.addEventListener('keydown', h);
    return () => globalThis.removeEventListener('keydown', h);
  }, [save]);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgMuted }}>
      <Loader2 size={16} style={{ animation: 'devSpin 1s linear infinite' }}/>
      <span style={{ fontSize: 12 }}>Загрузка...</span>
    </div>
  );

  const domainBadge = cfg.siteUrl
    ? cfg.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : 'домен не задан';

  const saveBtnStyle = getSaveBtnStyle(saved, dirty, saving, t);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Топ-бар с кнопками Обновить / Сохранить */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0,
      }}>
        <div style={{
          fontSize: 11, color: t.fgMuted, fontFamily: t.mono,
          padding: '3px 8px', borderRadius: 6, background: t.accentSoft,
          border: `1px solid ${t.border}`, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 160,
        }}>
          {domainBadge}
        </div>
        <span style={{ flex: 1, fontSize: 10, color: t.fgSub, fontFamily: t.mono }}>
          {dirty && <span style={{ color: t.warning, marginRight: 4 }}>●</span>}
          seo.ts · robots.txt · llm.txt
        </span>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
            borderRadius: 6, border: `1px solid ${t.border}`,
            background: 'transparent', color: t.fgMuted, cursor: 'pointer',
            fontSize: 11, fontFamily: t.mono,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = t.surfaceHov)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <RefreshCw size={10}/> Обновить
        </button>
        <button onClick={save} disabled={saving} style={saveBtnStyle}>
          {saving && <Loader2 size={10} style={{ animation: 'devSpin 1s linear infinite' }}/>}
          {saved ? <><Check size={10}/> Сохранено</> : 'Сохранить'}
          {!saved && !saving && (
            <span style={{ fontSize: 9, color: t.fgSub, background: t.inpBg, border: `1px solid ${t.border}`, borderRadius: 3, padding: '1px 4px' }}>
              Ctrl+S
            </span>
          )}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="adm-scroll">

        {/* Основные настройки сайта */}
        <Section icon={<Globe size={10}/>} title="Основное" t={t}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

            <Field label="Домен / URL сайта" hint="https://example.com" wide t={t}>
              <input value={cfg.siteUrl} onChange={setC('siteUrl')} placeholder="https://hub.opensophy.com" style={inp}/>
            </Field>

            <Field label="Название сайта" wide t={t}>
              <input value={cfg.siteTitle} onChange={setC('siteTitle')} placeholder="Hub — Opensophy" style={inp}/>
            </Field>

            <Field label="Описание" hint="до 160 символов" wide t={t}>
              <textarea value={cfg.siteDescription} onChange={setC('siteDescription')}
                placeholder="Краткое описание сайта..." rows={3}
                style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.5 }}/>
              <div style={{ fontSize: 9, marginTop: 2, color: cfg.siteDescription.length > 160 ? t.danger : t.fgSub }}>
                {cfg.siteDescription.length} / 160
              </div>
            </Field>

            <Field label="Ключевые слова" hint="через запятую" wide t={t}>
              <input value={cfg.keywords} onChange={setC('keywords')} placeholder="opensophy, hub, AI" style={inp}/>
            </Field>

            <Field label="Автор" t={t}>
              <input value={cfg.siteAuthor} onChange={setC('siteAuthor')} placeholder="Opensophy" style={inp}/>
            </Field>

            <Field label="Язык" t={t}>
              <Sel value={cfg.siteLang} onChange={v => setCVal('siteLang', v)} t={t} options={[
                { value: 'ru', label: 'ru — Русский' },
                { value: 'en', label: 'en — English' },
                { value: 'de', label: 'de — Deutsch' },
                { value: 'fr', label: 'fr — Français' },
                { value: 'es', label: 'es — Español' },
                { value: 'zh', label: 'zh — 中文' },
              ]}/>
            </Field>

          </div>
        </Section>

        {/* SEO мета-теги */}
        <Section icon={<Search size={10}/>} title="SEO и мета-теги" t={t} defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

            <Field label="Meta Robots" wide t={t}>
              <Sel value={cfg.metaRobots} onChange={v => setCVal('metaRobots', v)} t={t} options={[
                { value: 'index, follow',     label: '✅ index, follow (по умолчанию)' },
                { value: 'noindex, follow',   label: '🚫 noindex, follow' },
                { value: 'index, nofollow',   label: 'index, nofollow' },
                { value: 'noindex, nofollow', label: '🚫 noindex, nofollow' },
              ]}/>
            </Field>

            <Field label="OG Image" hint="путь к картинке" wide t={t}>
              <input value={cfg.ogImage} onChange={setC('ogImage')} placeholder="/og-image.png" style={inp}/>
            </Field>

            <Field label="OG Type" t={t}>
              <Sel value={cfg.ogType} onChange={v => setCVal('ogType', v)} t={t} options={[
                { value: 'website', label: 'website' },
                { value: 'article', label: 'article' },
              ]}/>
            </Field>

            <Field label="OG Locale" t={t}>
              <input value={cfg.ogLocale} onChange={setC('ogLocale')} placeholder="ru_RU" style={inp}/>
            </Field>

            <Field label="Twitter Card" t={t}>
              <Sel value={cfg.twitterCard} onChange={v => setCVal('twitterCard', v)} t={t} options={[
                { value: 'summary_large_image', label: 'summary_large_image' },
                { value: 'summary',             label: 'summary' },
              ]}/>
            </Field>

            <Field label="Twitter @site" t={t}>
              <input value={cfg.twitterSite} onChange={setC('twitterSite')} placeholder="@opensophy" style={inp}/>
            </Field>

          </div>
        </Section>

        {/* Прямое редактирование robots.txt */}
        <Section icon={<FileText size={10}/>} title="Robots.txt" badge="public/robots.txt" t={t} defaultOpen={false}>
          <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.6, padding: '2px 0' }}>
            Прямое редактирование файла. Текущий <code style={{ background: t.inpBg, padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>robots.txt</code> загружен как есть.
          </div>
          <Field label="Содержимое robots.txt" wide t={t}>
            <textarea
              value={robotsTxt}
              onChange={e => { setRobotsTxt(e.target.value); setDirty(true); }}
              rows={18}
              spellCheck={false}
              style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6, fontFamily: t.mono, fontSize: 11, minHeight: 200 }}
            />
          </Field>
          <div style={{ fontSize: 9, color: t.fgSub, display: 'flex', gap: 16 }}>
            <span>{robotsTxt.split('\n').length} строк</span>
            <span>{robotsTxt.length} символов</span>
          </div>
        </Section>

        {/* Прямое редактирование llm.txt для AI-ботов */}
        <Section icon={<Bot size={10}/>} title="LLM.txt / AI-боты" badge="public/llm.txt" t={t} defaultOpen={false}>
          <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.6, padding: '2px 0' }}>
            Прямое редактирование файла. Управляет тем, как AI-боты (ChatGPT, Claude, Perplexity) видят и используют сайт.
          </div>
          <Field label="Содержимое llm.txt" wide t={t}>
            <textarea
              value={llmTxt}
              onChange={e => { setLlmTxt(e.target.value); setDirty(true); }}
              rows={18}
              spellCheck={false}
              style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6, fontFamily: t.mono, fontSize: 11, minHeight: 200 }}
            />
          </Field>
          <div style={{ fontSize: 9, color: t.fgSub, display: 'flex', gap: 16 }}>
            <span>{llmTxt.split('\n').length} строк</span>
            <span>{llmTxt.length} символов</span>
          </div>
        </Section>

        <div style={{ height: 24 }}/>
      </div>
    </div>
  );
}