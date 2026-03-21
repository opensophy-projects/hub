/**
 * SitePanel — настройки сайта: SEO, GEO, OpenGraph, robots.txt, sitemap
 * Читает/пишет конфиг файлы через bridge.readFile / bridge.writeFile
 *
 * Поддерживаемые файлы:
 *   src/site.config.ts     — основные мета-данные (title, description, lang)
 *   public/robots.txt      — robots директивы
 *   src/content/seo.json   — расширенный SEO (OG, Twitter, canonical)
 *   public/sitemap.xml     — ручной sitemap (если нет astro/sitemap)
 */

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import { ThemeTokensContext } from '../DevPanel';
import type { TTokens } from '../DevPanel';
import {
  Globe, Search, Share2, Map, RefreshCw, Save,
  Loader2, ChevronDown, ChevronRight, Info, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteConfig {
  // Basic
  siteTitle:       string;
  siteDescription: string;
  siteUrl:         string;
  siteLang:        string;
  siteAuthor:      string;
  // SEO
  metaRobots:      string;
  canonicalBase:   string;
  googleVerify:    string;
  yandexVerify:    string;
  // OpenGraph
  ogTitle:         string;
  ogDescription:   string;
  ogImage:         string;
  ogType:          string;
  ogLocale:        string;
  // Twitter/X
  twitterCard:     string;
  twitterSite:     string;
  twitterCreator:  string;
  // GEO (ICBM / geo meta)
  geoRegion:       string;
  geoPlacename:    string;
  geoPosition:     string; // lat;lon
  // Structured Data (JSON-LD skeleton)
  jsonLdType:      string;
  jsonLdName:      string;
  jsonLdSameAs:    string; // comma-separated URLs
}

const EMPTY: SiteConfig = {
  siteTitle:'', siteDescription:'', siteUrl:'', siteLang:'ru',
  siteAuthor:'', metaRobots:'index, follow', canonicalBase:'',
  googleVerify:'', yandexVerify:'',
  ogTitle:'', ogDescription:'', ogImage:'/og-image.png',
  ogType:'website', ogLocale:'ru_RU',
  twitterCard:'summary_large_image', twitterSite:'', twitterCreator:'',
  geoRegion:'', geoPlacename:'', geoPosition:'',
  jsonLdType:'WebSite', jsonLdName:'', jsonLdSameAs:'',
};

// ─── Config file paths ────────────────────────────────────────────────────────

// Where we store the merged SEO config as JSON
const SEO_PATH = 'src/content/seo.json';
// robots.txt
const ROBOTS_PATH = 'public/robots.txt';

// ─── Parse/serialize helpers ──────────────────────────────────────────────────

function parseJson(raw: string): Partial<SiteConfig> {
  try { return JSON.parse(raw); }
  catch { return {}; }
}

function buildRobots(cfg: SiteConfig): string {
  const lines = [
    'User-agent: *',
    cfg.metaRobots.includes('noindex') ? 'Disallow: /' : 'Allow: /',
    '',
  ];
  if (cfg.siteUrl) lines.push(`Sitemap: ${cfg.siteUrl.replace(/\/$/, '')}/sitemap-index.xml`);
  return lines.join('\n');
}

function buildJsonLd(cfg: SiteConfig): string {
  const sameAs = cfg.jsonLdSameAs
    ? cfg.jsonLdSameAs.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': cfg.jsonLdType || 'WebSite',
    name: cfg.jsonLdName || cfg.siteTitle,
    url: cfg.siteUrl,
    ...(sameAs.length ? { sameAs } : {}),
  }, null, 2);
}

// ─── Section component ────────────────────────────────────────────────────────

function Section({ icon, title, children, defaultOpen = true, t }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
  defaultOpen?: boolean; t: TTokens;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 12px', border: 'none', background: t.surface,
          color: t.fgMuted, cursor: 'pointer', textAlign: 'left' as const,
          fontSize: 10, fontWeight: 700, fontFamily: t.mono,
          textTransform: 'uppercase' as const, letterSpacing: '0.08em',
        }}
      >
        {open ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
        <span style={{ color: t.fgSub }}>{icon}</span>
        {title}
      </button>
      {open && (
        <div style={{ padding: '6px 12px 12px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--fg-sub)',
          textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{label}</span>
        {hint && <span title={hint} style={{ cursor: 'help', opacity: 0.5, display: 'flex' }}><Info size={9}/></span>}
      </div>
      {children}
    </div>
  );
}

// ─── Input styles factory ─────────────────────────────────────────────────────

function useInpStyle(t: TTokens): React.CSSProperties {
  return {
    width: '100%', padding: '6px 8px', borderRadius: 6,
    border: `1px solid ${t.border}`, background: t.inpBg,
    color: t.fg, fontSize: 11, outline: 'none', fontFamily: t.mono,
    boxSizing: 'border-box' as const,
  };
}

// ─── Select ───────────────────────────────────────────────────────────────────

function Sel({ value, onChange, options, t }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; t: TTokens;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '6px 8px', borderRadius: 6,
        border: `1px solid ${t.border}`, background: t.inpBg,
        color: t.fg, fontSize: 11, outline: 'none', fontFamily: t.mono,
        boxSizing: 'border-box' as const, cursor: 'pointer',
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── SitePanel ────────────────────────────────────────────────────────────────

export default function SitePanel() {
  const t = useContext(ThemeTokensContext);
  const [cfg, setCfg]       = useState<SiteConfig>({ ...EMPTY });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  const inp = useInpStyle(t);

  const set = (key: keyof SiteConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCfg(p => ({ ...p, [key]: e.target.value }));
    setDirty(true);
  };

  const setVal = (key: keyof SiteConfig, val: string) => {
    setCfg(p => ({ ...p, [key]: val }));
    setDirty(true);
  };

  // ─── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try to read seo.json — our single source of truth
      const { content } = await bridge.readFile(SEO_PATH).catch(() => ({ content: '{}' }));
      const parsed = parseJson(content);
      setCfg({ ...EMPTY, ...parsed });
      setDirty(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const c = cfgRef.current;

      // 1. Write seo.json — the master config
      await bridge.writeFile(SEO_PATH, JSON.stringify(c, null, 2));

      // 2. Write robots.txt
      await bridge.writeFile(ROBOTS_PATH, buildRobots(c));

      // 3. Write JSON-LD snippet to public/schema.json for the layout to include
      await bridge.writeFile('public/schema.json', buildJsonLd(c));

      setDirty(false);
      toast.success('Настройки сайта сохранены');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }, []);

  // Ctrl+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgMuted }}>
      <Loader2 size={16} style={{ animation: 'devSpinAnim 1s linear infinite' }}/>
      <span style={{ fontSize: 12 }}>Загрузка...</span>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: 11, color: t.fgMuted, fontFamily: t.mono }}>
          {dirty && <span style={{ color: t.warning, marginRight: 6 }}>●</span>}
          seo.json · robots.txt · schema.json
        </span>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
          borderRadius: 6, border: `1px solid ${t.border}`, background: 'transparent',
          color: t.fgMuted, cursor: 'pointer', fontSize: 11, fontFamily: t.mono,
        }}>
          <RefreshCw size={10}/> Сброс
        </button>
        <button onClick={save} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
          borderRadius: 6, border: `1px solid ${dirty ? t.borderStrong : t.border}`,
          background: dirty ? t.surfaceHov : 'transparent',
          color: dirty ? t.fg : t.fgMuted,
          cursor: 'pointer', fontSize: 11, fontFamily: t.mono, fontWeight: dirty ? 600 : 400,
        }}>
          {saving && <Loader2 size={10} style={{ animation: 'devSpinAnim 1s linear infinite' }}/>}
          Сохранить
          <span style={{ fontSize: 9, color: t.fgSub, background: t.inpBg, border: `1px solid ${t.border}`, borderRadius: 3, padding: '1px 4px' }}>Ctrl+S</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="adm-scroll">

        {/* ── Основное ── */}
        <Section icon={<Globe size={10}/>} title="Основное" t={t}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Название сайта" hint="Отображается в <title> и og:title">
                <input value={cfg.siteTitle} onChange={set('siteTitle')} style={inp} placeholder="Мой сайт"/>
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Описание" hint="meta description — до 160 символов">
                <textarea value={cfg.siteDescription} onChange={set('siteDescription')}
                  style={{ ...inp, resize: 'none', height: 58, lineHeight: 1.5 }}
                  placeholder="Краткое описание сайта..."/>
              </Field>
            </div>
            <Field label="URL сайта" hint="https://example.com — без слэша в конце">
              <input value={cfg.siteUrl} onChange={set('siteUrl')} style={inp} placeholder="https://example.com"/>
            </Field>
            <Field label="Язык" hint="HTML lang атрибут">
              <Sel value={cfg.siteLang} onChange={v => setVal('siteLang', v)} t={t} options={[
                { value: 'ru', label: 'ru — Русский' },
                { value: 'en', label: 'en — English' },
                { value: 'de', label: 'de — Deutsch' },
                { value: 'fr', label: 'fr — Français' },
                { value: 'es', label: 'es — Español' },
                { value: 'zh', label: 'zh — 中文' },
                { value: 'ja', label: 'ja — 日本語' },
              ]}/>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Автор">
                <input value={cfg.siteAuthor} onChange={set('siteAuthor')} style={inp} placeholder="Имя автора"/>
              </Field>
            </div>
          </div>
        </Section>

        {/* ── SEO ── */}
        <Section icon={<Search size={10}/>} title="SEO" t={t}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Meta Robots" hint="Управление индексацией">
                <Sel value={cfg.metaRobots} onChange={v => setVal('metaRobots', v)} t={t} options={[
                  { value: 'index, follow',         label: 'index, follow (по умолчанию)' },
                  { value: 'noindex, follow',        label: 'noindex, follow' },
                  { value: 'index, nofollow',        label: 'index, nofollow' },
                  { value: 'noindex, nofollow',      label: 'noindex, nofollow' },
                  { value: 'noarchive',              label: 'noarchive' },
                  { value: 'nosnippet',              label: 'nosnippet' },
                  { value: 'max-snippet:160',        label: 'max-snippet:160' },
                  { value: 'max-image-preview:large',label: 'max-image-preview:large' },
                ]}/>
              </Field>
            </div>
            <Field label="Canonical base URL" hint="Базовый URL для canonical ссылок">
              <input value={cfg.canonicalBase} onChange={set('canonicalBase')} style={inp} placeholder="https://example.com"/>
            </Field>
            <Field label="Google Verify" hint="content= для google-site-verification">
              <input value={cfg.googleVerify} onChange={set('googleVerify')} style={inp} placeholder="abc123..."/>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Yandex Verify" hint="content= для yandex-verification">
                <input value={cfg.yandexVerify} onChange={set('yandexVerify')} style={inp} placeholder="abc123..."/>
              </Field>
            </div>
          </div>
          {/* robots.txt preview */}
          <div>
            <div style={{ fontSize: 9, color: t.fgSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Превью robots.txt
            </div>
            <pre style={{
              fontSize: 10, color: t.fgMuted, background: t.inpBg,
              border: `1px solid ${t.border}`, borderRadius: 6,
              padding: '6px 8px', margin: 0, fontFamily: t.mono,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>{buildRobots(cfg)}</pre>
          </div>
        </Section>

        {/* ── Open Graph ── */}
        <Section icon={<Share2 size={10}/>} title="Open Graph" t={t}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="OG Title" hint="Заголовок при шаринге. Если пусто — берётся siteTitle">
                <input value={cfg.ogTitle} onChange={set('ogTitle')} style={inp} placeholder={cfg.siteTitle || 'Заголовок'}/>
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="OG Description" hint="Описание при шаринге. Если пусто — берётся siteDescription">
                <textarea value={cfg.ogDescription} onChange={set('ogDescription')}
                  style={{ ...inp, resize: 'none', height: 52, lineHeight: 1.5 }}
                  placeholder={cfg.siteDescription || 'Описание...'}/>
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="OG Image" hint="Путь к изображению (1200×630px рекомендуется)">
                <input value={cfg.ogImage} onChange={set('ogImage')} style={inp} placeholder="/og-image.png"/>
              </Field>
            </div>
            <Field label="OG Type">
              <Sel value={cfg.ogType} onChange={v => setVal('ogType', v)} t={t} options={[
                { value: 'website', label: 'website' },
                { value: 'article', label: 'article' },
                { value: 'blog',    label: 'blog' },
                { value: 'profile', label: 'profile' },
              ]}/>
            </Field>
            <Field label="OG Locale" hint="Формат: ru_RU, en_US">
              <input value={cfg.ogLocale} onChange={set('ogLocale')} style={inp} placeholder="ru_RU"/>
            </Field>
          </div>
          {/* OG preview card */}
          <div style={{
            border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden',
            background: t.inpBg,
          }}>
            <div style={{ height: 60, background: t.surfaceHov, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgSub, fontSize: 10 }}>
              {cfg.ogImage ? cfg.ogImage : 'og:image не указан'}
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.fg, marginBottom: 2 }}>{cfg.ogTitle || cfg.siteTitle || 'og:title'}</div>
              <div style={{ fontSize: 10, color: t.fgMuted, lineHeight: 1.4 }}>{(cfg.ogDescription || cfg.siteDescription || 'og:description').slice(0, 100)}{(cfg.ogDescription || cfg.siteDescription || '').length > 100 ? '...' : ''}</div>
              <div style={{ fontSize: 9, color: t.fgSub, marginTop: 3 }}>{cfg.siteUrl || 'example.com'}</div>
            </div>
          </div>
        </Section>

        {/* ── Twitter / X ── */}
        <Section icon={<Share2 size={10}/>} title="Twitter / X Card" defaultOpen={false} t={t}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Card Type">
                <Sel value={cfg.twitterCard} onChange={v => setVal('twitterCard', v)} t={t} options={[
                  { value: 'summary',              label: 'summary — маленький превью' },
                  { value: 'summary_large_image',  label: 'summary_large_image — большое фото' },
                  { value: 'app',                  label: 'app — приложение' },
                  { value: 'player',               label: 'player — видео/аудио' },
                ]}/>
              </Field>
            </div>
            <Field label="@site" hint="Аккаунт сайта в Twitter">
              <input value={cfg.twitterSite} onChange={set('twitterSite')} style={inp} placeholder="@mysite"/>
            </Field>
            <Field label="@creator" hint="Аккаунт автора">
              <input value={cfg.twitterCreator} onChange={set('twitterCreator')} style={inp} placeholder="@author"/>
            </Field>
          </div>
        </Section>

        {/* ── GEO ── */}
        <Section icon={<Map size={10}/>} title="GEO мета-теги" defaultOpen={false} t={t}>
          <div style={{
            padding: '6px 8px', borderRadius: 6, background: t.inpBg,
            border: `1px solid ${t.border}`, marginBottom: 4,
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={11} style={{ color: t.warning, flexShrink: 0, marginTop: 1 }}/>
            <span style={{ fontSize: 10, color: t.fgMuted, lineHeight: 1.5 }}>
              GEO мета-теги используются для локального SEO и геотаргетинга. Поддерживаются Google, Yandex. Укажи регион, название и координаты.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="geo.region" hint="Формат: RU-MOW (страна-регион ISO 3166-2)">
              <input value={cfg.geoRegion} onChange={set('geoRegion')} style={inp} placeholder="RU-MOW"/>
            </Field>
            <Field label="geo.placename" hint="Название города/региона">
              <input value={cfg.geoPlacename} onChange={set('geoPlacename')} style={inp} placeholder="Москва"/>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="geo.position / ICBM" hint="Широта;долгота — например 55.7558;37.6173">
                <input value={cfg.geoPosition} onChange={set('geoPosition')} style={inp} placeholder="55.7558;37.6173"/>
              </Field>
            </div>
          </div>
          {/* Preview */}
          {(cfg.geoRegion || cfg.geoPlacename || cfg.geoPosition) && (
            <pre style={{ fontSize: 10, color: t.fgMuted, background: t.inpBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '6px 8px', margin: 0, fontFamily: t.mono, whiteSpace: 'pre-wrap' }}>{[
              cfg.geoRegion    && `<meta name="geo.region"    content="${cfg.geoRegion}">`,
              cfg.geoPlacename && `<meta name="geo.placename" content="${cfg.geoPlacename}">`,
              cfg.geoPosition  && `<meta name="geo.position"  content="${cfg.geoPosition}">`,
              cfg.geoPosition  && `<meta name="ICBM"          content="${cfg.geoPosition.replace(';', ', ')}">`,
            ].filter(Boolean).join('\n')}</pre>
          )}
        </Section>

        {/* ── JSON-LD ── */}
        <Section icon={<Search size={10}/>} title="Структурированные данные (JSON-LD)" defaultOpen={false} t={t}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="@type">
              <Sel value={cfg.jsonLdType} onChange={v => setVal('jsonLdType', v)} t={t} options={[
                { value: 'WebSite',       label: 'WebSite — сайт' },
                { value: 'Organization',  label: 'Organization — организация' },
                { value: 'Person',        label: 'Person — личный сайт' },
                { value: 'Blog',          label: 'Blog — блог' },
                { value: 'TechArticle',   label: 'TechArticle — тех. документация' },
                { value: 'SoftwareApplication', label: 'SoftwareApplication — приложение' },
              ]}/>
            </Field>
            <Field label="name" hint="Официальное название сайта/организации">
              <input value={cfg.jsonLdName} onChange={set('jsonLdName')} style={inp} placeholder={cfg.siteTitle || 'Название'}/>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="sameAs URLs" hint="Ссылки на соцсети — через запятую">
                <input value={cfg.jsonLdSameAs} onChange={set('jsonLdSameAs')} style={inp} placeholder="https://github.com/user, https://twitter.com/user"/>
              </Field>
            </div>
          </div>
          {/* JSON-LD preview */}
          <div>
            <div style={{ fontSize: 9, color: t.fgSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Превью schema.json
            </div>
            <pre style={{
              fontSize: 10, color: t.fgMuted, background: t.inpBg,
              border: `1px solid ${t.border}`, borderRadius: 6,
              padding: '6px 8px', margin: 0, fontFamily: t.mono,
              whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto',
            }}>{buildJsonLd(cfg)}</pre>
          </div>
        </Section>

        <div style={{ height: 24 }}/>
      </div>
    </div>
  );
}