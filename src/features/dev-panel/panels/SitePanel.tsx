import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import { ThemeTokensContext } from '../DevPanel';
import type { TTokens } from '../DevPanel';
import {
  Globe, Search, Bot, RefreshCw, Loader2,
  ChevronDown, ChevronRight, Check, FileText, Eye,
  AlertCircle, Zap,
} from 'lucide-react';

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface SiteConfig {
  // Основное
  siteUrl:         string;
  siteTitle:       string;
  siteDescription: string;
  siteLang:        string;
  siteAuthor:      string;
  // SEO
  keywords:        string;
  metaRobots:      string;
  canonicalBase:   string;
  // Open Graph
  ogImage:         string;
  ogType:          string;
  ogLocale:        string;
  ogSiteName:      string;
  // Twitter / X
  twitterCard:     string;
  twitterSite:     string;
  twitterCreator:  string;
  // GEO / AI
  geoRegion:       string;
  geoPlacename:    string;
  geoPosition:     string;
  icbm:            string;
  // Дополнительные мета
  themeColor:      string;
  colorScheme:     string;
  viewport:        string;
  rating:          string;
  revisitAfter:    string;
  copyright:       string;
  // Верификация
  googleVerify:    string;
  yandexVerify:    string;
  bingVerify:      string;
}

const DEFAULTS: SiteConfig = {
  siteUrl:         'https://hub.opensophy.com',
  siteTitle:       'Hub — Opensophy',
  siteDescription: 'Hub проекта Opensophy — центр знаний по ИИ и кибербезопасности.',
  siteLang:        'ru',
  siteAuthor:      'Opensophy',
  keywords:        'opensophy, opensophy hub, opensophy docs, opensophy documentation, hub opensophy, платформа знаний, база знаний, хаб знаний, документация проектов, техническая документация, IT документация, developer hub, knowledge hub, knowledge base, engineering knowledge, developer resources, developer documentation, open source, open source projects, open source tools, open source platform, AI, artificial intelligence, machine learning, deep learning, neural networks, LLM, generative AI, AI tools, AI development, AI security, кибербезопасность, информационная безопасность, безопасность приложений, web security, application security, appsec, cybersecurity tools, ethical hacking, penetration testing, pentest, vulnerability analysis, уязвимости, web vulnerabilities, OWASP, OWASP Top 10, secure coding, secure development, DevSecOps, cloud security, network security, API security, backend security, frontend security, DevOps, CI/CD, infrastructure, cloud computing, software development, разработка ПО, веб-разработка, backend development, frontend development, fullstack development, programming, software engineering, system design, архитектура ПО, software architecture, microservices, distributed systems, databases, SQL, NoSQL, API, REST API, GraphQL, docker, kubernetes, linux, git, github, gitlab, automation, scripting, python, javascript, typescript, nodejs, java, golang, rust, learning platform, educational platform, tech education, обучение разработке, обучение безопасности, практические гайды, tutorials, guides, how-to, best practices, developer tools, engineering tools, productivity tools, coding resources, IT community, developer community, open knowledge, tech hub, innovation, research, experiments, real projects, case studies, hands-on learning
',
  metaRobots:      'index, follow',
  canonicalBase:   '',
  ogImage:         '/og-image.png',
  ogType:          'website',
  ogLocale:        'ru_RU',
  ogSiteName:      '',
  twitterCard:     'summary_large_image',
  twitterSite:     '',
  twitterCreator:  '',
  geoRegion:       '',
  geoPlacename:    '',
  geoPosition:     '',
  icbm:            '',
  themeColor:      '',
  colorScheme:     '',
  viewport:        'width=device-width, initial-scale=1.0',
  rating:          '',
  revisitAfter:    '',
  copyright:       '',
  googleVerify:    '',
  yandexVerify:    '',
  bingVerify:      '',
};

const SEO_PATH    = 'src/shared/data/seo.ts';
const ROBOTS_PATH = 'public/robots.txt';
const LLM_PATH    = 'public/llm.txt';

// ─── Сериализация / парсинг ───────────────────────────────────────────────────

function buildSeoTs(cfg: SiteConfig): string {
  const fields = Object.entries(cfg)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
    .join('\n');
  return `// Генерируется Dev Panel — вкладка "Сайт". Не редактировать вручную.\n\nexport const SEO_CONFIG = {\n${fields}\n} as const;\n`;
}

const RE_SEO_FIELD = /^[ \t]*(\w{1,60}):[ \t]*["']([^"'\n]{0,1000})["'][^\n]*$/gm;

function parseSeoTs(content: string): Partial<SiteConfig> {
  const result: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = RE_SEO_FIELD.exec(content)) !== null) {
    result[m[1]] = m[2];
  }
  return result as Partial<SiteConfig>;
}

// ─── Google SERP preview ──────────────────────────────────────────────────────

function SerpPreview({ cfg, t }: { cfg: SiteConfig; t: TTokens }) {
  const domain   = cfg.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const title    = cfg.siteTitle || 'Заголовок сайта';
  const desc     = cfg.siteDescription || 'Описание страницы появится здесь...';
  const titleLen = title.length;
  const descLen  = desc.length;

  const isDark   = t.bg === '#111112';

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 8,
      border: `1px solid ${t.border}`,
      background: isDark ? '#1a1a1c' : '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: t.fgSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        Предпросмотр в Google
      </div>
      {/* Domain row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: isDark ? '#444' : '#ddd',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 12, color: isDark ? '#bdc1c6' : '#202124', lineHeight: 1.3 }}>{domain || 'example.com'}</div>
          <div style={{ fontSize: 11, color: isDark ? '#9aa0a6' : '#4d5156' }}>{cfg.siteUrl || 'https://example.com'}</div>
        </div>
      </div>
      {/* Title */}
      <div style={{
        fontSize: 18, color: isDark ? '#8ab4f8' : '#1a0dab',
        lineHeight: 1.3, marginBottom: 3,
        fontWeight: 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {title}
      </div>
      {/* Description */}
      <div style={{
        fontSize: 13, color: isDark ? '#bdc1c6' : '#4d5156',
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}>
        {desc}
      </div>
      {/* Counters */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        <span style={{ fontSize: 10, color: titleLen > 60 ? t.danger : t.fgSub }}>
          Заголовок: {titleLen}/60 {titleLen > 60 ? '⚠️ слишком длинный' : ''}
        </span>
        <span style={{ fontSize: 10, color: descLen > 160 ? t.danger : t.fgSub }}>
          Описание: {descLen}/160 {descLen > 160 ? '⚠️ слишком длинное' : ''}
        </span>
      </div>
    </div>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

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
  warn?: string;
  t: TTokens;
  children: React.ReactNode;
}

function Field({ label, hint, wide, warn, t, children }: Readonly<FieldProps>) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: t.fgSub,
        textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, opacity: 0.65 }}>{hint}</span>}
        {warn && <span style={{ color: t.warning, fontWeight: 400, textTransform: 'none' as const }}>{warn}</span>}
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
  badgeColor?: string;
  defaultOpen?: boolean;
  t: TTokens;
  children: React.ReactNode;
}

function Section({ icon, title, badge, badgeColor, defaultOpen = true, t, children }: Readonly<SectionProps>) {
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
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 4,
            background: badgeColor ? `${badgeColor}22` : t.accentSoft,
            color: badgeColor ?? t.fgMuted,
            border: `1px solid ${badgeColor ? `${badgeColor}44` : t.border}`,
          }}>
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

// ─── Стили кнопки Сохранить ───────────────────────────────────────────────────

function getSaveBtnStyle(saved: boolean, dirty: boolean, saving: boolean, t: TTokens): React.CSSProperties {
  if (saved)  return { border: `1px solid ${t.success}66`, background: 'rgba(34,197,94,0.1)', color: t.success };
  if (dirty)  return { border: `1px solid ${t.borderStrong}`, background: t.surfaceHov, color: t.fg };
  return { border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted };
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
  const [tab,       setTab]       = useState<'main' | 'robots' | 'llm'>('main');

  const cfgRef    = useRef(cfg);
  const robotsRef = useRef(robotsTxt);
  const llmRef    = useRef(llmTxt);
  useEffect(() => { cfgRef.current    = cfg;       }, [cfg]);
  useEffect(() => { robotsRef.current = robotsTxt; }, [robotsTxt]);
  useEffect(() => { llmRef.current    = llmTxt;    }, [llmTxt]);

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

  const TABS = [
    { id: 'main',   label: 'SEO / Основное' },
    { id: 'robots', label: 'robots.txt' },
    { id: 'llm',    label: 'llm.txt (AI)' },
  ] as const;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Топ-бар */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0,
      }}>
        <div style={{
          fontSize: 11, color: t.fgMuted, fontFamily: t.mono,
          padding: '3px 8px', borderRadius: 6, background: t.accentSoft,
          border: `1px solid ${t.border}`, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 170,
        }}>
          {domainBadge}
        </div>
        <span style={{ flex: 1, fontSize: 10, color: t.fgSub, fontFamily: t.mono }}>
          {dirty && <span style={{ color: t.warning, marginRight: 4 }}>●</span>}
          seo.ts · robots.txt · llm.txt
        </span>
        <button onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 6, border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: 11, fontFamily: t.mono }}
          onMouseEnter={e => (e.currentTarget.style.background = t.surfaceHov)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <RefreshCw size={10}/> Обновить
        </button>
        <button onClick={save} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
          borderRadius: 6, cursor: saving ? 'default' : 'pointer',
          fontSize: 11, fontFamily: t.mono, fontWeight: dirty ? 500 : 400,
          ...saveBtnStyle,
        }}>
          {saving && <Loader2 size={10} style={{ animation: 'devSpin 1s linear infinite' }}/>}
          {saved ? <><Check size={10}/> Сохранено</> : 'Сохранить'}
          {!saved && !saving && (
            <span style={{ fontSize: 9, color: t.fgSub, background: t.inpBg, border: `1px solid ${t.border}`, borderRadius: 3, padding: '1px 4px' }}>Ctrl+S</span>
          )}
        </button>
      </div>

      {/* Табы */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0 }}>
        {TABS.map(tb => {
          const active = tab === tb.id;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              padding: '7px 12px', border: 'none', background: 'transparent',
              borderBottom: `2px solid ${active ? t.fg : 'transparent'}`,
              color: active ? t.fg : t.fgMuted,
              fontSize: 11, fontWeight: active ? 600 : 400,
              cursor: 'pointer', fontFamily: t.mono, flexShrink: 0, outline: 'none',
            }}>
              {tb.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="adm-scroll">

        {tab === 'main' && (
          <>
            {/* SERP Preview */}
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>
              <SerpPreview cfg={cfg} t={t} />
            </div>

            {/* Основное */}
            <Section icon={<Globe size={10}/>} title="Основное" t={t}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="URL сайта" hint="https://example.com" wide t={t}>
                  <input value={cfg.siteUrl} onChange={setC('siteUrl')} placeholder="https://hub.opensophy.com" style={inp}/>
                </Field>
                <Field label="Название сайта" hint="до 60 символов" wide t={t}
                  warn={cfg.siteTitle.length > 60 ? `${cfg.siteTitle.length}/60 ⚠️` : ''}>
                  <input value={cfg.siteTitle} onChange={setC('siteTitle')} placeholder="Hub — Opensophy" style={inp}/>
                </Field>
                <Field label="Описание" hint="до 160 символов" wide t={t}
                  warn={cfg.siteDescription.length > 160 ? `${cfg.siteDescription.length}/160 ⚠️` : ''}>
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
                    { value: 'uk', label: 'uk — Українська' },
                  ]}/>
                </Field>
                <Field label="Copyright" hint="необязательно" wide t={t}>
                  <input value={cfg.copyright} onChange={setC('copyright')} placeholder="© 2025 Opensophy" style={inp}/>
                </Field>
              </div>
            </Section>

            {/* SEO мета */}
            <Section icon={<Search size={10}/>} title="SEO и индексирование" t={t} defaultOpen={false}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Meta Robots" hint="управляет индексацией" wide t={t}>
                  <Sel value={cfg.metaRobots} onChange={v => setCVal('metaRobots', v)} t={t} options={[
                    { value: 'index, follow',               label: '✅ index, follow (по умолчанию)' },
                    { value: 'noindex, follow',             label: '🚫 noindex, follow' },
                    { value: 'index, nofollow',             label: 'index, nofollow' },
                    { value: 'noindex, nofollow',           label: '🚫 noindex, nofollow' },
                    { value: 'noarchive',                   label: 'noarchive' },
                    { value: 'nosnippet',                   label: 'nosnippet' },
                    { value: 'noimageindex',                label: 'noimageindex' },
                    { value: 'index, follow, noarchive',    label: 'index + noarchive' },
                  ]}/>
                </Field>
                <Field label="Canonical Base URL" hint="базовый URL для canonical" wide t={t}>
                  <input value={cfg.canonicalBase} onChange={setC('canonicalBase')} placeholder="https://hub.opensophy.com" style={inp}/>
                </Field>
                <Field label="Обновление страницы" hint="для поисковиков" t={t}>
                  <Sel value={cfg.revisitAfter} onChange={v => setCVal('revisitAfter', v)} t={t} options={[
                    { value: '',         label: '— не указано' },
                    { value: '1 days',   label: '1 день' },
                    { value: '3 days',   label: '3 дня' },
                    { value: '7 days',   label: '7 дней' },
                    { value: '14 days',  label: '14 дней' },
                    { value: '30 days',  label: '30 дней' },
                  ]}/>
                </Field>
                <Field label="Rating" hint="необязательно" t={t}>
                  <Sel value={cfg.rating} onChange={v => setCVal('rating', v)} t={t} options={[
                    { value: '',        label: '— не указано' },
                    { value: 'general', label: 'general (0+)' },
                    { value: 'mature',  label: 'mature (18+)' },
                  ]}/>
                </Field>
                <Field label="Theme Color" hint="цвет браузерного chrome" t={t}>
                  <input value={cfg.themeColor} onChange={setC('themeColor')} placeholder="#0a0a0a" style={inp}/>
                </Field>
                <Field label="Color Scheme" t={t}>
                  <Sel value={cfg.colorScheme} onChange={v => setCVal('colorScheme', v)} t={t} options={[
                    { value: '',             label: '— не указано' },
                    { value: 'dark',         label: 'dark' },
                    { value: 'light',        label: 'light' },
                    { value: 'dark light',   label: 'dark light' },
                    { value: 'light dark',   label: 'light dark' },
                  ]}/>
                </Field>
                <Field label="Viewport" hint="meta viewport" wide t={t}>
                  <input value={cfg.viewport} onChange={setC('viewport')} placeholder="width=device-width, initial-scale=1.0" style={inp}/>
                </Field>
              </div>
            </Section>

            {/* Open Graph */}
            <Section icon={<Eye size={10}/>} title="Open Graph (соцсети)" t={t} defaultOpen={false} badge="OG">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="OG Image" hint="путь к картинке 1200×630" wide t={t}>
                  <input value={cfg.ogImage} onChange={setC('ogImage')} placeholder="/og-image.png" style={inp}/>
                </Field>
                <Field label="OG Type" t={t}>
                  <Sel value={cfg.ogType} onChange={v => setCVal('ogType', v)} t={t} options={[
                    { value: 'website', label: 'website' },
                    { value: 'article', label: 'article' },
                    { value: 'blog',    label: 'blog' },
                    { value: 'product', label: 'product' },
                  ]}/>
                </Field>
                <Field label="OG Locale" t={t}>
                  <input value={cfg.ogLocale} onChange={setC('ogLocale')} placeholder="ru_RU" style={inp}/>
                </Field>
                <Field label="OG Site Name" hint="название в превью" t={t}>
                  <input value={cfg.ogSiteName} onChange={setC('ogSiteName')} placeholder="Opensophy Hub" style={inp}/>
                </Field>
              </div>
            </Section>

            {/* Twitter / X */}
            <Section icon={<span style={{ fontSize: 10 }}>𝕏</span>} title="Twitter / X Cards" t={t} defaultOpen={false}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Twitter Card" wide t={t}>
                  <Sel value={cfg.twitterCard} onChange={v => setCVal('twitterCard', v)} t={t} options={[
                    { value: 'summary_large_image', label: 'summary_large_image (большое фото)' },
                    { value: 'summary',             label: 'summary (маленькое фото)' },
                    { value: 'app',                 label: 'app' },
                    { value: 'player',              label: 'player' },
                  ]}/>
                </Field>
                <Field label="Twitter @site" hint="аккаунт сайта" t={t}>
                  <input value={cfg.twitterSite} onChange={setC('twitterSite')} placeholder="@opensophy" style={inp}/>
                </Field>
                <Field label="Twitter @creator" hint="аккаунт автора" t={t}>
                  <input value={cfg.twitterCreator} onChange={setC('twitterCreator')} placeholder="@opensophy" style={inp}/>
                </Field>
              </div>
            </Section>

            {/* GEO / AI оптимизация */}
            <Section icon={<Bot size={10}/>} title="GEO — AI & Геолокация" t={t} defaultOpen={false}
              badge="AI" badgeColor="#7c5cfc">
              <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.6, marginBottom: 4 }}>
                GEO (Generative Engine Optimization) — мета-теги для AI-поисковиков (ChatGPT, Perplexity, Claude Search).
                Геотеги помогают локальному SEO.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Geo Region" hint="напр. RU-MOW" t={t}>
                  <input value={cfg.geoRegion} onChange={setC('geoRegion')} placeholder="RU" style={inp}/>
                </Field>
                <Field label="Geo Placename" hint="название места" t={t}>
                  <input value={cfg.geoPlacename} onChange={setC('geoPlacename')} placeholder="Москва" style={inp}/>
                </Field>
                <Field label="Geo Position" hint="lat;lon" t={t}>
                  <input value={cfg.geoPosition} onChange={setC('geoPosition')} placeholder="55.7558;37.6173" style={inp}/>
                </Field>
                <Field label="ICBM" hint="широта, долгота" t={t}>
                  <input value={cfg.icbm} onChange={setC('icbm')} placeholder="55.7558, 37.6173" style={inp}/>
                </Field>
              </div>
            </Section>

            {/* Верификация */}
            <Section icon={<Zap size={10}/>} title="Верификация (Search Console)" t={t} defaultOpen={false}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <Field label="Google Site Verification" t={t}>
                  <input value={cfg.googleVerify} onChange={setC('googleVerify')} placeholder="xxxxxxxxxxxxxxxxx" style={inp}/>
                </Field>
                <Field label="Yandex Verification" t={t}>
                  <input value={cfg.yandexVerify} onChange={setC('yandexVerify')} placeholder="xxxxxxxxxxxxxxxxx" style={inp}/>
                </Field>
                <Field label="Bing Site Verification" t={t}>
                  <input value={cfg.bingVerify} onChange={setC('bingVerify')} placeholder="xxxxxxxxxxxxxxxxx" style={inp}/>
                </Field>
              </div>
              <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.6 }}>
                Теги верификации появляются в &lt;head&gt; как <code style={{ background: t.inpBg, padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>meta name="google-site-verification"</code>
              </div>
            </Section>

            <div style={{ height: 24 }}/>
          </>
        )}

        {tab === 'robots' && (
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.6, marginBottom: 10 }}>
              Файл <code style={{ background: t.inpBg, padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>public/robots.txt</code> управляет доступом поисковых роботов к страницам сайта.
            </div>
            <textarea
              value={robotsTxt}
              onChange={e => { setRobotsTxt(e.target.value); setDirty(true); }}
              rows={20}
              spellCheck={false}
              style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6, minHeight: 300, fontSize: 12 }}
            />
            <div style={{ fontSize: 9, color: t.fgSub, display: 'flex', gap: 16, marginTop: 6 }}>
              <span>{robotsTxt.split('\n').length} строк</span>
              <span>{robotsTxt.length} символов</span>
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 6, background: t.inpBg, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.fgSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Быстрые шаблоны</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Разрешить всё', value: 'User-agent: *\nAllow: /\n\nSitemap: ' + cfg.siteUrl + '/sitemap.xml\n' },
                  { label: 'Запретить всё', value: 'User-agent: *\nDisallow: /\n' },
                  { label: 'Блокировать AI-боты', value: 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: ChatGPT-User\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ' + cfg.siteUrl + '/sitemap.xml\n' },
                  { label: 'Разрешить AI-боты', value: 'User-agent: GPTBot\nAllow: /\n\nUser-agent: anthropic-ai\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ' + cfg.siteUrl + '/sitemap.xml\n' },
                ].map(tpl => (
                  <button key={tpl.label} onClick={() => { setRobotsTxt(tpl.value); setDirty(true); }} style={{
                    padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, fontFamily: t.mono,
                  }}>
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'llm' && (
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.6, marginBottom: 10 }}>
              Файл <code style={{ background: t.inpBg, padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>public/llm.txt</code> — специальный файл для AI-систем (ChatGPT, Claude, Perplexity).
              Это аналог robots.txt, но для языковых моделей. Позволяет указать как AI может использовать контент сайта.
            </div>
            <textarea
              value={llmTxt}
              onChange={e => { setLlmTxt(e.target.value); setDirty(true); }}
              rows={20}
              spellCheck={false}
              style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6, minHeight: 300, fontSize: 12 }}
            />
            <div style={{ fontSize: 9, color: t.fgSub, display: 'flex', gap: 16, marginTop: 6 }}>
              <span>{llmTxt.split('\n').length} строк</span>
              <span>{llmTxt.length} символов</span>
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 6, background: t.inpBg, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.fgSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Быстрые шаблоны</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Базовый', value: `# ${cfg.siteTitle}\n\n> ${cfg.siteDescription}\n\n## О сайте\n\nАвтор: ${cfg.siteAuthor}\nURL: ${cfg.siteUrl}\nЯзык: ${cfg.siteLang}\n\n## Ключевые темы\n\n${cfg.keywords}\n\n## Условия использования\n\nКонтент доступен для AI-систем в образовательных и исследовательских целях.\nПри цитировании указывайте источник: ${cfg.siteUrl}\n` },
                  { label: 'Запрет AI', value: `# ${cfg.siteTitle}\n\n> AI-системам запрещено использовать контент этого сайта для обучения.\n\n## Правила\n\n- Запрещено использование для обучения LLM\n- Запрещено копирование в тренировочные датасеты\n- Разрешено цитирование с указанием источника\n\nURL: ${cfg.siteUrl}\n` },
                ].map(tpl => (
                  <button key={tpl.label} onClick={() => { setLlmTxt(tpl.value); setDirty(true); }} style={{
                    padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, fontFamily: t.mono,
                  }}>
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}