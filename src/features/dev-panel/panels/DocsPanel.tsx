import React, {
  useState, useEffect, useCallback, useRef, useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { bridge } from '../useDevBridge';
import { toast } from '../components/toastBus';
import { Badge, ConfirmDialog } from '../components/ui';
import LucideIcon from '@/shared/components/LucideIcon';
import { ThemeTokensContext } from '../theme';
import type { TTokens } from '../theme';
import {
  FolderOpen, Plus, Trash2,
  ChevronRight, ChevronDown, FolderPlus, FilePlus,
  Loader2, Bold, Italic, Code, Link, Hash, List,
  RefreshCw, Minus, Image, BarChart2, Table, Search,
  Columns, AlertCircle, Calculator, Footprints, LayoutGrid, Type,
  Edit3, Undo2, Redo2, X,
} from 'lucide-react';

interface FlatEntry { type: 'file' | 'dir'; path: string; name: string; depth: number; title?: string; }
interface TreeEntry extends FlatEntry {
  children: TreeEntry[];
  parsed: { type: 'N' | 'C' | 'A' | null; icon: string | null; title: string; slug: string | null; };
}
interface FM {
  title: string; description: string; author: string; date: string;
  updated: string; tags: string; icon: string; lang: string; robots: string;
  priority: string; custom: string;
}
const EMPTY_FM: FM = {
  title: '', description: '', author: '',
  date: new Date().toISOString().split('T')[0],
  updated: '', tags: '', icon: '', lang: 'ru', robots: 'index, follow',
  priority: '', custom: '',
};

const RU_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const toSlug = (s: string): string => {
  const chars: string[] = [];
  let prevDash = false;
  for (const raw of s.toLowerCase().trim()) {
    const mapped = RU_MAP[raw] ?? raw;
    for (const ch of mapped.normalize('NFKD')) {
      const isAscii = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
      if (isAscii) { chars.push(ch); prevDash = false; continue; }
      if (ch === '-' || ch === '_' || /\s/.test(ch)) {
        if (!prevDash && chars.length > 0) { chars.push('-'); prevDash = true; }
      }
    }
  }
  while (chars.at(-1) === '-') chars.pop();
  return chars.join('');
};

// ─── ALL LUCIDE ICONS ────────────────────────────────────────────────────────
const ALL_ICONS = [
  'activity','airplay','alert-circle','alert-octagon','alert-triangle','align-center',
  'align-justify','align-left','align-right','anchor','aperture','archive','arrow-down',
  'arrow-down-circle','arrow-down-left','arrow-down-right','arrow-left','arrow-left-circle',
  'arrow-right','arrow-right-circle','arrow-up','arrow-up-circle','arrow-up-left',
  'arrow-up-right','at-sign','award','axe','baby','backpack','badge','badge-alert',
  'badge-check','badge-dollar-sign','badge-help','badge-info','badge-minus','badge-percent',
  'badge-plus','badge-x','ban','banknote','bar-chart','bar-chart-2','bar-chart-3',
  'bar-chart-4','bar-chart-big','battery','battery-charging','battery-full','battery-low',
  'battery-medium','beaker','bell','bell-dot','bell-minus','bell-off','bell-plus','bell-ring',
  'bike','binary','bitcoin','blend','blocks','bluetooth','bold','book','book-copy',
  'book-down','book-key','book-lock','book-marked','book-minus','book-open','book-open-check',
  'book-open-text','book-plus','book-text','book-type','book-up','bookmark','bookmark-check',
  'bookmark-minus','bookmark-plus','bookmark-x','bot','box','boxes','brain','briefcase',
  'briefcase-business','briefcase-medical','broadcast','brush','bug','bug-play','building',
  'building-2','bus','calculator','calendar','calendar-check','calendar-clock','calendar-days',
  'calendar-fold','calendar-heart','calendar-minus','calendar-plus','calendar-range',
  'calendar-search','calendar-x','camera','camera-off','candy','car','car-front','card-stack-minus',
  'castle','cat','chart-area','chart-bar','chart-bar-big','chart-candlestick','chart-column',
  'chart-gantt','chart-line','chart-no-axes-column','chart-no-axes-combined','chart-pie',
  'chart-scatter','check','check-check','check-circle','check-circle-2','check-square',
  'chevron-down','chevron-first','chevron-last','chevron-left','chevron-right','chevron-up',
  'chevrons-down','chevrons-left','chevrons-right','chevrons-up','chrome','circle',
  'circle-alert','circle-arrow-down','circle-arrow-left','circle-arrow-out-up-right',
  'circle-arrow-right','circle-arrow-up','circle-check','circle-chevron-down',
  'circle-chevron-left','circle-chevron-right','circle-chevron-up','circle-dashed',
  'circle-dot','circle-ellipsis','circle-equal','circle-fading-plus','circle-gauge',
  'circle-help','circle-minus','circle-off','circle-parking','circle-pause','circle-percent',
  'circle-play','circle-plus','circle-power','circle-slash','circle-stop','circle-user',
  'circle-user-round','circle-x','clipboard','clipboard-check','clipboard-copy','clipboard-list',
  'clipboard-minus','clipboard-paste','clipboard-pen','clipboard-plus','clipboard-type',
  'clipboard-x','clock','clock-1','clock-10','clock-11','clock-12','clock-2','clock-3',
  'cloud','cloud-cog','cloud-download','cloud-drizzle','cloud-fog','cloud-hail','cloud-lightning',
  'cloud-moon','cloud-moon-rain','cloud-off','cloud-rain','cloud-rain-wind','cloud-snow',
  'cloud-sun','cloud-sun-rain','cloud-upload','cloudy','code','code-2','code-xml','cog',
  'coins','columns','combine','command','component','computer','construction','container',
  'copy','corner-down-left','corner-down-right','corner-left-down','corner-left-up',
  'corner-right-down','corner-right-up','corner-up-left','corner-up-right','cpu','credit-card',
  'crop','cross','crosshair','crown','cuboid','currency','database','database-backup',
  'database-zap','delete','diamond','dice-1','dice-2','dice-3','dice-4','dice-5','dice-6',
  'disc','divide','divide-circle','divide-square','dna','dock','dog','dollar-sign','download',
  'drafting-compass','drama','dribbble','droplet','droplets','drum','dumbbell','ear',
  'earth','edit','edit-2','edit-3','egg','egg-fried','ellipsis','ellipsis-vertical','eraser',
  'ethernet-port','expand','external-link','eye','eye-off','facebook','factory','fan',
  'fast-forward','feather','figma','file','file-archive','file-audio','file-badge',
  'file-check','file-check-2','file-clock','file-code','file-code-2','file-cog','file-diff',
  'file-digit','file-down','file-heart','file-image','file-input','file-json','file-key',
  'file-lock','file-minus','file-music','file-output','file-pen','file-plus','file-question',
  'file-search','file-sliders','file-spreadsheet','file-stack','file-symlink','file-terminal',
  'file-text','file-type','file-up','file-video','file-volume','file-warning','file-x',
  'files','filter','fingerprint','fish','flag','flag-off','flame','flashlight','flask-conical',
  'flip-horizontal','flip-vertical','flower','focus','folder','folder-archive','folder-check',
  'folder-clock','folder-closed','folder-code','folder-cog','folder-dot','folder-down',
  'folder-git','folder-git-2','folder-heart','folder-input','folder-key','folder-lock',
  'folder-minus','folder-open','folder-open-dot','folder-output','folder-pen','folder-plus',
  'folder-root','folder-search','folder-symlink','folder-sync','folder-tree','folder-up',
  'folder-video','folder-x','footprints','forklift','forward','frame','framer','frown',
  'fuel','fullscreen','function-square','gauge','gem','ghost','gift','git-branch',
  'git-branch-plus','git-commit','git-compare','git-fork','git-graph','git-merge',
  'git-pull-request','git-pull-request-closed','globe','globe-2','graduation-cap','grid',
  'grip','grip-horizontal','grip-vertical','hand','hand-coins','hand-heart','hand-helping',
  'hand-metal','hand-shake','hard-drive','hard-hat','hash','hdmi-port','headphones',
  'headset','heart','heart-crack','heart-handshake','heart-off','heart-pulse','help-circle',
  'hexagon','highlighter','history','home','hospital','hotel','hourglass','image','image-down',
  'image-minus','image-off','image-plus','image-up','import','inbox','indent','infinity',
  'info','instagram','italic','key','key-round','keyboard','lab','lamp','landmark','languages',
  'laptop','layers','layout','layout-dashboard','layout-grid','layout-list','layout-panel-left',
  'layout-panel-top','layout-template','leaf','library','life-buoy','lightbulb','link',
  'link-2','linkedin','list','list-checks','list-end','list-filter','list-minus','list-music',
  'list-ordered','list-plus','list-restart','list-start','list-todo','list-tree','list-video',
  'list-x','loader','lock','lock-keyhole','log-in','log-out','luggage','mail',
  'mail-check','mail-minus','mail-open','mail-plus','mail-question','mail-search','mail-warning',
  'mail-x','map','map-pin','map-pinned','maximize','maximize-2','megaphone','menu',
  'merge','message-circle','message-circle-code','message-circle-heart','message-circle-more',
  'message-circle-off','message-circle-plus','message-circle-question','message-circle-reply',
  'message-circle-warning','message-circle-x','message-square','message-square-code',
  'message-square-dashed','message-square-diff','message-square-dot','message-square-heart',
  'message-square-lock','message-square-more','message-square-off','message-square-plus',
  'message-square-quote','message-square-reply','message-square-share','message-square-text',
  'message-square-warning','message-square-x','mic','mic-off','minimize','minimize-2',
  'minus','minus-circle','minus-square','monitor','monitor-off','monitor-play','monitor-smartphone',
  'moon','more-horizontal','more-vertical','mountain','mouse','mouse-pointer','mouse-pointer-2',
  'move','move-3d','move-diagonal','move-horizontal','move-vertical','music','navigation',
  'network','newspaper','nfc','notebook','notebook-pen','notebook-tabs','npm','octagon',
  'orbit','outdent','package','package-check','package-minus','package-open','package-plus',
  'package-search','package-x','paint-bucket','paintbrush','panel-bottom','panel-left',
  'panel-right','panel-top','paperclip','pause','pause-circle','pencil','pencil-line',
  'pencil-ruler','percent','phone','phone-call','phone-forwarded','phone-incoming','phone-missed',
  'phone-off','phone-outgoing','pie-chart','pin','plane','play','play-circle','plug',
  'plug-2','plug-zap','pocket','podcast','pointer','power','power-off','presentation',
  'printer','puzzle','qr-code','quote','radio','rainbow','receipt','redo','redo-2',
  'refresh-ccw','refresh-cw','regex','remote-control','repeat','repeat-1','replace',
  'reply','rocket','rotate-3d','route','rss','ruler','save','scan','scissors',
  'screen-share','scroll','search','server','settings','share','share-2','shield',
  'shield-alert','shield-check','shield-off','shuffle','signal','siren','skip-back',
  'skip-forward','skull','slash','sliders','smile','sort-asc','sort-desc','sparkle',
  'sparkles','speaker','split','spray-can','square','star','star-off','stop-circle',
  'sun','switch-camera','table','table-of-contents','tablet','tag','tags','target',
  'terminal','thermometer','thumbs-down','thumbs-up','ticket','timer','timer-off',
  'toggle-left','toggle-right','tool','tornado','trash','trash-2','trending-down',
  'trending-up','triangle','triangle-alert','trophy','truck','tv','twitch','twitter',
  'type','umbrella','underline','undo','undo-2','unlink','upload','user','user-check',
  'user-cog','user-minus','user-plus','user-round','user-round-check','user-round-minus',
  'user-round-plus','user-round-search','user-round-x','user-search','user-x',
  'users','users-round','video','video-off','view','voicemail','volume','volume-1',
  'volume-2','volume-x','wallet','wand','wand-2','watch','waves','waypoints','wifi',
  'wifi-off','wind','workflow','wrench','x','x-circle','x-octagon','x-square','youtube',
  'zap','zap-off','zoom-in','zoom-out',
];

// ─── IconPickerModal ─────────────────────────────────────────────────────────
function IconPickerModal({ current, onSelect, onClose, t }: {
  readonly current: string;
  readonly onSelect: (icon: string) => void;
  readonly onClose: () => void;
  readonly t: TTokens;
}) {
  const [q, setQ] = useState('');
  const [hov, setHov] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const filtered = q.trim()
    ? ALL_ICONS.filter(n => n.includes(q.toLowerCase().trim()))
    : ALL_ICONS;

  return createPortal(
    <dialog open style={{
      position: 'fixed', inset: 0, zIndex: 100030,
      border: 'none', padding: 0, margin: 0,
      maxWidth: '100vw', maxHeight: '100vh', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <button type="button" aria-label="Закрыть" onClick={onClose} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        background: 'transparent', border: 'none', cursor: 'default', padding: 0,
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: t.bg, border: `1px solid ${t.borderStrong}`,
        borderRadius: 14, width: 520, maxHeight: '80vh',
        boxShadow: t.shadow, fontFamily: t.mono,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', borderBottom: `1px solid ${t.border}`,
          background: t.surface, flexShrink: 0,
        }}>
          <Search size={14} style={{ color: t.fgMuted }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск иконки..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: t.fg,
              fontSize: 13, fontFamily: t.mono,
            }}
          />
          <span style={{ fontSize: 11, color: t.fgSub }}>{filtered.length}</span>
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: 'transparent', color: t.fgMuted, cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = t.fg; }}
            onMouseLeave={e => { e.currentTarget.style.color = t.fgMuted; }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: 10,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 4,
        }} className="adm-scroll">
          {filtered.map(name => {
            const isActive = name === current;
            const isHov = hov === name;
            const buttonBorder = isActive ? t.borderStrong : isHov ? t.border : 'transparent';
            const buttonBg = isActive ? t.accentSoft : isHov ? t.surfaceHov : 'transparent';
            return (
              <button
                key={name}
                title={name}
                onClick={() => { onSelect(name); onClose(); }}
                onMouseEnter={() => setHov(name)}
                onMouseLeave={() => setHov(null)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 5,
                  padding: '8px 4px', borderRadius: 8,
                  border: `1px solid ${buttonBorder}`,
                  background: buttonBg,
                  color: isActive ? t.fg : t.fgMuted,
                  cursor: 'pointer', fontSize: 9, fontFamily: t.mono,
                  lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-all',
                  transition: 'all 0.1s',
                }}
              >
                <LucideIcon name={name} size={18} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', paddingInline: 2 }}>{name}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 32, color: t.fgSub, fontSize: 13 }}>
              Ничего не найдено
            </div>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}

// ─── IconField ───────────────────────────────────────────────────────────────
function IconField({ value, onChange, t, placeholder = 'file-text', inputId }: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly t: TTokens;
  readonly placeholder?: string;
  readonly inputId?: string;
}) {
  const [open, setOpen] = useState(false);

  const inpS: React.CSSProperties = {
    flex: 1, padding: '4px 7px', borderRadius: 5,
    border: `1px solid ${t.border}`, background: t.inpBg, color: t.fg,
    fontSize: 12, outline: 'none', fontFamily: t.mono, boxSizing: 'border-box',
    minWidth: 0,
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 6, flexShrink: 0,
          border: `1px solid ${t.border}`, background: t.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.fgMuted,
        }}>
          <LucideIcon name={value || placeholder} size={16} />
        </div>
        <input
          id={inputId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inpS}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 6, flexShrink: 0,
            border: `1px solid ${t.border}`, background: t.surfaceHov,
            color: t.fgMuted, cursor: 'pointer', fontSize: 11, fontFamily: t.mono,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = t.fg; }}
          onMouseLeave={e => { e.currentTarget.style.color = t.fgMuted; }}
        >
          <Search size={11} /> Выбрать
        </button>
      </div>
      {open && (
        <IconPickerModal
          current={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
          t={t}
        />
      )}
    </>
  );
}

const RE_PN_TYPE = /^\[([NCA])\]/;
const RE_PN_ICON = /^\[([^\]]{1,60})\]/;
const RE_PN_SLUG = /^([^{]{1,300})\{([^{}]{1,200})\}$/;

const parseName = (name: string) => {
  const cleaned = name.replace(/\.md$/, '');
  const tm = RE_PN_TYPE.exec(cleaned);
  const type = (tm?.[1] ?? null) as 'N' | 'C' | 'A' | null;
  const rest = tm ? cleaned.slice(tm[0].length) : cleaned;
  const im = RE_PN_ICON.exec(rest);
  const icon = im?.[1] ?? null;
  const ai = im ? rest.slice(im[0].length) : rest;
  const sm = RE_PN_SLUG.exec(ai);
  const rawTitle = sm ? sm[1].trim() : ai.trim();
  const prettyTitle = rawTitle
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, ch => ch.toUpperCase());
  return { type, icon, title: prettyTitle || rawTitle, slug: sm ? sm[2].trim() : null };
};

const buildTree = (flat: FlatEntry[]): TreeEntry[] => {
  const m = new Map<string, TreeEntry>();
  const tree: TreeEntry[] = [];
  flat.forEach(e => {
    const parsed = parseName(e.name);
    if (e.title) parsed.title = e.title;
    m.set(e.path, { ...e, children: [], parsed });
  });
  flat.forEach(e => {
    const node = m.get(e.path);
    if (!node) return;
    const parent = m.get(e.path.split('/').slice(0, -1).join('/'));
    if (parent) parent.children.push(node); else tree.push(node);
  });
  return tree;
};

const routeFromDocPath = (filePath: string): string => {
  const parts = filePath.replace(/^Docs\/?/, '').split('/').filter(Boolean);
  const last = parts.at(-1)?.toLowerCase();
  if (parts.length === 1 && last === 'welcome.md') return '/';
  const slugs = parts.map((part) => parseName(part).slug || toSlug(parseName(part).title || part.replace(/\.md$/, ''))).filter(Boolean);
  return `/${slugs.join('/')}/`;
};

const openRouteForDoc = (filePath: string) => {
  if (globalThis.window === undefined) return;
  const route = routeFromDocPath(filePath);
  const current = globalThis.window.location.pathname;
  if (current !== route) globalThis.window.history.pushState({}, '', route);
};

const parseFM = (raw: string): { fm: FM; body: string } => {
  if (!raw.startsWith('---\n')) return { fm: { ...EMPTY_FM }, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { fm: { ...EMPTY_FM }, body: raw };
  const fm: FM = { ...EMPTY_FM };
  raw.slice(4, end).split('\n').forEach(line => {
    const ci = line.indexOf(':');
    if (ci < 1) return;
    const k = line.slice(0, ci).trim() as keyof FM;
    const v = line.slice(ci + 1).trim().replaceAll(/^["']|["']$/g, '');
    if (k in fm) (fm as unknown as Record<string, string>)[k] = v;
  });
  return { fm, body: raw.slice(end + 5) };
};

const serializeFM = (fm: FM, body: string): string => {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(fm) as [keyof FM, string][]) {
    if (!v) continue;
    const needsQuotes = /[:#[\]{}&*!|>'",%@`]/.test(v);
    const escaped = v.replaceAll('"', String.raw`\"`);
    const val = needsQuotes ? `"${escaped}"` : v;
    lines.push(`${k}: ${val}`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
};

async function renameDir(oldPath: string, newPath: string): Promise<void> {
  const { entries } = await bridge.listDocs();
  const children = entries.filter(e => e.path.startsWith(oldPath + '/') || e.path === oldPath);
  await bridge.mkdir(newPath);
  const files = children.filter(e => e.type === 'file');
  for (const file of files) {
    const relPath = file.path.slice(oldPath.length);
    const { content } = await bridge.readFile(file.path);
    await bridge.writeFile(newPath + relPath, content);
  }
  for (const file of files) {
    await bridge.deleteFile(file.path);
  }
  const dirs = children
    .filter(e => e.type === 'dir' && e.path !== oldPath)
    .sort((a, b) => b.path.length - a.path.length);
  for (const d of dirs) {
    try { await bridge.deleteFile(d.path); } catch { /* noop */ }
  }
  try { await bridge.deleteFile(oldPath); } catch { /* noop */ }
}

interface BV { label: string; code: string; }
interface BI { label: string; icon: React.ReactNode; code?: string; variants?: BV[]; }
const BG: { g: string; icon: React.ReactNode; items: BI[] }[] = [
  {
    g: 'Текст', icon: <Type size={11} />, items: [
      {
        label: 'Заголовок', icon: <Hash size={10} />, variants: [
          { label: 'H1', code: '\n# Заголовок\n' }, { label: 'H2', code: '\n## Заголовок\n' },
          { label: 'H3', code: '\n### Заголовок\n' }, { label: 'H4', code: '\n#### Заголовок\n' },
        ],
      },
      {
        label: 'Блок кода', icon: <Code size={10} />, variants: [
          { label: 'JavaScript', code: '\n```javascript\nconst x = 1;\n```\n' },
          { label: 'TypeScript', code: '\n```typescript\nconst x: number = 1;\n```\n' },
          { label: 'Python', code: '\n```python\ndef hello():\n    print("Hi")\n```\n' },
          { label: 'Bash', code: '\n```bash\nnpm install\n```\n' },
          { label: 'JSON', code: '\n```json\n{\n  "key": "value"\n}\n```\n' },
        ],
      },
      {
        label: 'Список', icon: <List size={10} />, variants: [
          { label: 'Маркированный', code: '\n- Элемент 1\n- Элемент 2\n- Элемент 3\n' },
          { label: 'Нумерованный', code: '\n1. Элемент 1\n2. Элемент 2\n3. Элемент 3\n' },
          { label: 'Задачи', code: '\n- [x] Выполнено\n- [ ] Не выполнено\n' },
        ],
      },
      {
        label: 'Цитата', icon: <ChevronRight size={10} />, variants: [
          { label: 'Простая', code: '\n> Текст цитаты.\n' },
          { label: 'Вложенная', code: '\n> Уровень 1\n>> Уровень 2\n' },
        ],
      },
      { label: 'HR линия', icon: <Minus size={10} />, code: '\n---\n' },
      { label: 'Детали', icon: <ChevronDown size={10} />, code: '\n<details>\n<summary>Нажмите, чтобы развернуть</summary>\n\nСкрытый контент.\n\n</details>\n' },
    ],
  },
  {
    g: 'Алерты', icon: <AlertCircle size={11} />, items: [
      { label: 'Note', icon: <AlertCircle size={10} />, code: '\n:::note\nПолезная информация.\n:::\n' },
      { label: 'Tip', icon: <AlertCircle size={10} />, code: '\n:::tip\nПолезный совет.\n:::\n' },
      { label: 'Important', icon: <AlertCircle size={10} />, code: '\n:::important\nВажная информация.\n:::\n' },
      { label: 'Warning', icon: <AlertCircle size={10} />, code: '\n:::warning\nПредупреждение.\n:::\n' },
      { label: 'Caution', icon: <AlertCircle size={10} />, code: '\n:::caution\nОсторожно.\n:::\n' },
    ],
  },
  {
    g: 'Таблица', icon: <Table size={11} />, items: [
      {
        label: 'Таблица', icon: <Table size={10} />, variants: [
          { label: '2 колонки', code: '\n| H1 | H2 |\n|----|----|\n| A  | B  |\n| C  | D  |\n' },
          { label: '3 колонки', code: '\n| H1 | H2 | H3 |\n|----|----|----|  \n| A  | B  | C  |\n' },
          { label: 'Выравнивание', code: '\n| Лево | Центр | Право |\n|:-----|:-----:|------:|\n| A    |   B   |     C |\n' },
        ],
      },
    ],
  },
  {
    g: 'Карточки', icon: <LayoutGrid size={11} />, items: [
      {
        label: 'Карточка', icon: <LayoutGrid size={10} />, variants: [
          { label: 'Простая', code: '\n:::card\n[title]Заголовок\nОписание.\n:::\n' },
          { label: 'С иконкой', code: '\n:::card\n[title]Заголовок\n[icon]rocket\nОписание.\n:::\n' },
          { label: 'С картинкой', code: '\n:::card\n[title]Заголовок\n[image]/assets/image.png\nОписание.\n:::\n' },
          { label: 'Синяя', code: '\n:::card[color=#3b82f6]\n[title]Заголовок\n[icon]book-open\nОписание.\n:::\n' },
          { label: 'Зелёная', code: '\n:::card[color=#22c55e]\n[title]Заголовок\n[icon]check-circle\nОписание.\n:::\n' },
          { label: 'Красная', code: '\n:::card[color=#ef4444]\n[title]Заголовок\n[icon]shield-alert\nОписание.\n:::\n' },
        ],
      },
      { label: 'Сетка 2×2', icon: <LayoutGrid size={10} />, code: '\n:::cards[cols=2]\n:::card[color=#3b82f6]\n[title]Первая\n[icon]book-open\nОписание.\n:::\n:::card[color=#22c55e]\n[title]Вторая\n[icon]code-2\nОписание.\n:::\n:::card[color=#f59e0b]\n[title]Третья\n[icon]layers\nОписание.\n:::\n:::card[color=#ef4444]\n[title]Четвёртая\n[icon]shield-check\nОписание.\n:::\n:::\n' },
      { label: 'Сетка 3×1', icon: <LayoutGrid size={10} />, code: '\n:::cards[cols=3]\n:::card[color=#8b5cf6]\n[title]Первая\n[icon]zap\nОписание.\n:::\n:::card[color=#06b6d4]\n[title]Вторая\n[icon]plug\nОписание.\n:::\n:::card[color=#f43f5e]\n[title]Третья\n[icon]life-buoy\nОписание.\n:::\n:::\n' },
    ],
  },
  {
    g: 'Колонки', icon: <Columns size={11} />, items: [
      {
        label: 'Колонки', icon: <Columns size={10} />, variants: [
          { label: '50/50', code: '\n:::columns[layout=equal]\n:::col\nЛевая.\n:::\n:::col\nПравая.\n:::\n:::\n' },
          { label: '70/30 лево', code: '\n:::columns[layout=wide-left]\n:::col\n## Заголовок\n\nОсновной текст.\n:::\n:::col\nДоп.\n:::\n:::\n' },
          { label: '30/70 право', code: '\n:::columns[layout=wide-right]\n:::col\nДоп.\n:::\n:::col\n## Заголовок\n\nОсновной текст.\n:::\n:::\n' },
          { label: 'Фото слева', code: '\n:::columns[layout=image-left]\n:::col\n![](/assets/image.png)\n:::\n:::col\n## Заголовок\nТекст.\n:::\n:::\n' },
          { label: 'Фото справа', code: '\n:::columns[layout=image-right]\n:::col\n## Заголовок\nТекст.\n:::\n:::col\n![](/assets/image.png)\n:::\n:::\n' },
        ],
      },
    ],
  },
  {
    g: 'Steps', icon: <Footprints size={11} />, items: [
      {
        label: 'Шаги', icon: <Footprints size={10} />, variants: [
          { label: 'Простые', code: '\n:::steps\n:::step Первый шаг\nОписание.\n:::\n\n:::step Второй шаг\nОписание.\n:::\n:::\n' },
          { label: 'Со статусами', code: '\n:::steps\n:::step[status=done] Установка\n`npm install`\n:::\n\n:::step[status=active] Настройка\n`.env`\n:::\n\n:::step[status=pending] Запуск\n`npm run dev`\n:::\n:::\n' },
          { label: 'С цветами', code: '\n:::steps\n:::step[status=done,color=#f59e0b] Подготовка\nДанные.\n:::\n\n:::step[status=active,color=#3b82f6] Обработка\nСкрипт.\n:::\n\n:::step[status=pending,color=#8b5cf6] Публикация\nДеплой.\n:::\n:::\n' },
        ],
      },
    ],
  },
  {
    g: 'Математика', icon: <Calculator size={11} />, items: [
      {
        label: 'Формула', icon: <Calculator size={10} />, variants: [
          { label: 'Инлайн', code: ' $E = mc^2$ ' },
          { label: 'Блок', code: '\n:::math\nE = mc^2\n:::\n' },
          { label: 'Блок с рамкой', code: '\n:::math[display]\nx = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\n:::\n' },
          { label: 'Интеграл', code: '\n:::math[display]\n\\int_{-\\infty}^{+\\infty} e^{-x^2}dx = \\sqrt{\\pi}\n:::\n' },
          { label: 'Эйлер', code: '\n:::math[display]\ne^{i\\pi} + 1 = 0\n:::\n' },
        ],
      },
    ],
  },
  {
    g: 'Графики', icon: <BarChart2 size={11} />, items: [
      {
        label: 'Area', icon: <BarChart2 size={10} />, variants: [
          { label: 'Area', code: '\n:::chart\n[title]Посещаемость\n[type]area\n[colors]#555, #888\n\n| Месяц | Визиты | Уники |\n|-------|--------|-------|\n| Янв   | 4200   | 3100  |\n| Фев   | 3800   | 2900  |\n:::\n' },
          { label: 'Area Stacked', code: '\n:::chart\n[title]Трафик\n[type]area-stacked\n[colors]#555, #888, #aaa\n\n| Месяц | Орг | Рекл | Прям |\n|-------|-----|------|------|\n| Янв   | 2100| 800  | 500  |\n:::\n' },
        ],
      },
      {
        label: 'Bar', icon: <BarChart2 size={10} />, variants: [
          { label: 'Bar', code: '\n:::chart\n[title]Продажи\n[type]bar\n[colors]#555, #888\n\n| Квартал | Север | Юг  |\n|---------|-------|-----|\n| Q1      | 1200  | 900 |\n:::\n' },
          { label: 'Bar Stacked', code: '\n:::chart\n[title]Расходы\n[type]bar-stacked\n[colors]#555, #888, #aaa\n\n| Месяц | ЗП   | Инфра |\n|-------|------|-------|\n| Янв   | 3200 | 800   |\n:::\n' },
          { label: 'Bar Horizontal', code: '\n:::chart\n[title]Языки\n[type]bar-horizontal\n[colors]#555, #888\n\n| Язык   | % |\n|--------|---|\n| Python | 28|\n| JS     | 24|\n:::\n' },
        ],
      },
      {
        label: 'Pie', icon: <BarChart2 size={10} />, variants: [
          { label: 'Pie', code: '\n:::chart\n[title]Источники\n[type]pie\n[colors]#444, #666, #888\n\n| Источник | Доля |\n|----------|------|\n| Органика | 42   |\n| Прямой   | 28   |\n| Реклама  | 30   |\n:::\n' },
          { label: 'Pie Donut', code: '\n:::chart\n[title]Браузеры\n[type]pie-donut\n[colors]#444, #666, #888\n\n| Браузер | Доля |\n|---------|------|\n| Chrome  | 63   |\n| Firefox | 10   |\n| Safari  | 27   |\n:::\n' },
        ],
      },
      { label: 'Radar', icon: <BarChart2 size={10} />, code: '\n:::chart\n[title]Навыки\n[type]radar\n[colors]#555, #888\n\n| Навык | Фронт | Бэк |\n|-------|-------|-----|\n| TS    | 90    | 60  |\n| Py    | 40    | 95  |\n:::\n' },
    ],
  },
  {
    g: 'Изображение', icon: <Image size={11} />, items: [
      {
        label: 'Изображение', icon: <Image size={10} />, variants: [
          { label: 'Простое', code: '[image.png]' },
          { label: 'С описанием', code: '![Текст](/assets/image.png "Заголовок")' },
          { label: 'Кликабельное', code: '[![Текст](/assets/image.png)](https://example.com)' },
        ],
      },
    ],
  },
];

function Modal({ onClose, children, width, t }: {
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly width?: number;
  readonly t: TTokens;
}) {
  return createPortal(
    <dialog open style={{
      position: 'fixed', inset: 0, zIndex: 100020,
      border: 'none', padding: 0, margin: 0,
      maxWidth: '100vw', maxHeight: '100vh', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <button type="button" aria-label="Закрыть" onClick={onClose} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        background: 'transparent', border: 'none', cursor: 'default', padding: 0,
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: t.bg, border: `1px solid ${t.borderStrong}`,
        borderRadius: 12, padding: 22, width: width ?? 360,
        boxShadow: t.shadow, fontFamily: t.mono,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </dialog>,
    document.body
  );
}

interface CC { parentPath: string; entryType: 'N' | 'C' | 'A'; }

async function saveRenamedFile(existing: TreeEntry, nm: string, onDone: (fp?: string) => void) {
  const parent = existing.path.split('/').slice(0, -1).join('/');
  const newPath = `${parent}/${nm}.md`;
  if (newPath === existing.path) { toast.info('Имя не изменилось'); onDone(); return; }
  const { content } = await bridge.readFile(existing.path);
  await bridge.writeFile(newPath, content);
  await bridge.deleteFile(existing.path);
  toast.success('Страница переименована');
  onDone(newPath);
}

async function saveRenamedDir(existing: TreeEntry, nm: string, onDone: (fp?: string) => void) {
  const parent = existing.path.split('/').slice(0, -1).join('/');
  const newPath = `${parent}/${nm}`;
  if (newPath === existing.path) { toast.info('Имя не изменилось'); onDone(); return; }
  try {
    await renameDir(existing.path, newPath);
    toast.success('Переименовано');
    onDone();
  } catch (err: unknown) {
    toast.error('Ошибка: ' + (err as Error).message);
  }
}

function EntryModal({ cfg, existing, onClose, onDone, t }: {
  readonly cfg: CC;
  readonly existing?: TreeEntry;
  readonly onClose: () => void;
  readonly onDone: (fp?: string) => void;
  readonly t: TTokens;
}) {
  const isEdit = !!existing;
  const p = existing?.parsed;
  const [title, setTitle] = useState(p?.title ?? '');
  const [slug, setSlug] = useState(p?.slug ?? (p?.title ? toSlug(p.title) : ''));
  const [icon, setIcon] = useState(p?.icon ?? '');
  const [auto, setAuto] = useState(!isEdit);
  const [fm, setFm] = useState<FM>({ ...EMPTY_FM });
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);

  const setT = (v: string) => { setTitle(v); if (auto) setSlug(toSlug(v)); };
  const isA = cfg.entryType === 'A';
  const lbl: Record<string, string> = { N: 'Секция', C: 'Категория', A: 'Страница' };
  const dIco: Record<string, string> = { N: 'book', C: 'folder', A: 'file-text' };

  const doSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic = icon.trim() || dIco[cfg.entryType];
      const slugSuffix = slug ? `{${slug}}` : '';
      const nm = `[${cfg.entryType}][${ic}]${title.trim()}${slugSuffix}`;
      if (isEdit && existing) {
        if (existing.type === 'file') await saveRenamedFile(existing, nm, onDone);
        else await saveRenamedDir(existing, nm, onDone);
      } else {
        if (isA) {
          const fp = `${cfg.parentPath}/${nm}.md`;
          await bridge.writeFile(fp, serializeFM({ ...fm, title: title.trim() }, `# ${title.trim()}\n\nНачните писать здесь...\n`));
          toast.success('Страница создана');
          onDone(fp);
        } else {
          await bridge.mkdir(`${cfg.parentPath}/${nm}`);
          toast.success('Создано');
          onDone();
        }
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 7,
    border: `1px solid ${t.border}`, background: t.inpBg, color: t.fg,
    fontSize: 12, outline: 'none', fontFamily: t.mono, boxSizing: 'border-box',
  };
  const lbS: React.CSSProperties = {
    fontSize: 12, color: t.fgSub, textTransform: 'uppercase',
    letterSpacing: '0.07em', marginBottom: 4, display: 'block',
  };

  return (
    <Modal onClose={onClose} width={isA && !isEdit ? 460 : 360} t={t}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Badge type={cfg.entryType} />
        <span style={{ fontSize: 13, fontWeight: 700, color: t.fg }}>
          {isEdit ? 'Редактировать' : 'Создать'}: {lbl[cfg.entryType]}
        </span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="entry-title" style={lbS}>Название *</label>
        <input
          id="entry-title"
          ref={ref}
          value={title}
          onChange={e => setT(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !isA) doSave();
            if (e.key === 'Escape') onClose();
          }}
          style={inp}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="entry-slug" style={lbS}>URL Slug</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input id="entry-slug" value={slug} onChange={e => { setSlug(e.target.value); setAuto(false); }} style={{ ...inp, flex: 1 }} />
          <button onClick={() => { setAuto(true); setSlug(toSlug(title)); }} style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${t.border}`, background: t.surfaceHov, color: t.fgMuted, cursor: 'pointer', fontSize: 13, fontFamily: t.mono }}>↺</button>
        </div>
      </div>
      <div style={{ marginBottom: isA && !isEdit ? 14 : 10 }}>
        <label htmlFor="entry-icon" style={lbS}>Иконка</label>
        <IconField inputId="entry-icon" value={icon} onChange={setIcon} t={t} placeholder={dIco[cfg.entryType]} />
      </div>
      {isA && !isEdit && (
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, marginBottom: 10 }}>
          <div style={{ ...lbS, marginBottom: 10 }}>Frontmatter</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 10px' }}>
            {([
              { k: 'description', l: 'Описание', sp: true }, { k: 'author', l: 'Автор' },
              { k: 'date', l: 'Дата', tp: 'date' }, { k: 'tags', l: 'Теги', sp: true },
              { k: 'lang', l: 'Lang' }, { k: 'robots', l: 'Robots' },
              { k: 'priority', l: 'Приоритет' }, { k: 'custom', l: 'Custom (slug)' },
            ] as Array<{ k: keyof FM; l: string; sp?: boolean; tp?: string }>).map(f => (
              <div key={f.k} style={{ gridColumn: f.sp ? '1 / -1' : 'auto' }}>
                <label htmlFor={`fm-${f.k}`} style={lbS}>{f.l}</label>
                <input id={`fm-${f.k}`} type={f.tp ?? 'text'} value={fm[f.k]} onChange={e => setFm(prev => ({ ...prev, [f.k]: e.target.value }))} style={inp} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 7, border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: 14, fontFamily: t.mono }}>Отмена</button>
        <button onClick={doSave} disabled={saving} style={{ flex: 1, padding: '8px', borderRadius: 7, border: `1px solid ${t.borderStrong}`, background: t.surfaceHov, color: t.fg, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: t.mono }}>
          {saving ? '...' : isEdit ? 'Применить' : 'Создать'}
        </button>
      </div>
    </Modal>
  );
}

function BlockPicker({ onInsert, t }: { readonly onInsert: (c: string) => void; readonly t: TTokens }) {
  const [open, setOpen] = useState(false);
  const [grp, setGrp] = useState(0);
  const [sub, setSub] = useState<BI | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const MENU_W = 360;

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const idealLeft = r.left + r.width / 2 - MENU_W / 2;
    const clampedLeft = Math.max(8, Math.min(idealLeft, globalThis.innerWidth - MENU_W - 8));
    setPos({ top: r.bottom + 4, left: clampedLeft });
    setOpen(true);
    setSub(null);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBtn = btnRef.current?.contains(target) ?? false;
      const insideMenu = menuRef.current?.contains(target) ?? false;
      if (!insideBtn && !insideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, [open]);

  const rs = (active?: boolean): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px',
    borderRadius: 5, border: 'none', cursor: 'pointer', textAlign: 'left' as const,
    background: active ? t.surfaceHov : 'transparent', color: t.fg, fontSize: 13, fontFamily: t.mono,
    justifyContent: 'space-between' as const,
  });

  const onHoverEnter = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = t.surfaceHov; };
  const onHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; };

  return (
    <>
      <button ref={btnRef} onClick={toggle} title="Вставить блок" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '3px 8px', height: 22, borderRadius: 5,
        border: `1px solid ${open ? t.borderStrong : t.border}`,
        background: open ? t.surfaceHov : 'transparent',
        color: open ? t.fg : t.fgMuted, cursor: 'pointer', fontSize: 13, fontFamily: t.mono, gap: 4,
      }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = t.surfaceHov; e.currentTarget.style.color = t.fg; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.fgMuted; } }}
      ><Plus size={11} /> Блок</button>

      {open && createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 100030,
          width: MENU_W, maxHeight: 340,
          background: t.bg, border: `1px solid ${t.borderStrong}`,
          borderRadius: 10, boxShadow: t.shadow,
          display: 'flex', overflow: 'hidden', fontFamily: t.mono,
        }}>
          <div style={{ width: 100, borderRight: `1px solid ${t.border}`, overflowY: 'auto', flexShrink: 0 }} className="adm-scroll">
            {BG.map((g, gi) => (
              <button key={g.g} onClick={() => { setGrp(gi); setSub(null); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 9px', border: 'none', textAlign: 'left', cursor: 'pointer',
                background: grp === gi ? t.surfaceHov : 'transparent',
                color: grp === gi ? t.fg : t.fgMuted, fontSize: 10, fontFamily: t.mono,
                borderLeft: grp === gi ? `2px solid ${t.fg}` : '2px solid transparent',
              }}>
                {g.icon}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.g}</span>
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }} className="adm-scroll">
            {sub ? (
              <>
                <button onClick={() => setSub(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', border: 'none', background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: 10, fontFamily: t.mono, marginBottom: 3 }}>
                  <ChevronRight size={9} style={{ transform: 'rotate(180deg)' }} /> Назад
                </button>
                <div style={{ fontSize: 12, color: t.fgSub, padding: '0 8px 5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{sub.label}</div>
                {sub.variants?.map((v, vi) => (
                  <button key={v.label + vi} onClick={() => { onInsert(v.code); setOpen(false); }} style={{ ...rs(), justifyContent: 'flex-start' }} onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>{v.label}</button>
                ))}
              </>
            ) : BG[grp].items.map((item, ii) => (
              <button key={item.label + ii} onClick={() => { if (item.variants) { setSub(item); } else { onInsert(item.code ?? ''); setOpen(false); } }} style={rs()} onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: t.fgMuted }}>{item.icon}</span>{item.label}</div>
                {item.variants && <ChevronRight size={9} style={{ color: t.fgSub, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function MarkdownEditor({ filePath, onClose, t }: { readonly filePath: string; readonly onClose: () => void; readonly t: TTokens }) {
  const [fm, setFm] = useState<FM>({ ...EMPTY_FM });
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [, setHistory] = useState<string[]>([]);
  const [, setFuture] = useState<string[]>([]);
  const [fmOpen, setFmOpen] = useState(false);
  const [customPages, setCustomPages] = useState<Array<{ slug: string; folderName: string }>>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fmRef = useRef(fm);
  const bodyRef = useRef(body);
  useEffect(() => { fmRef.current = fm; }, [fm]);
  useEffect(() => { bodyRef.current = body; }, [body]);

  const bcRef = useRef<BroadcastChannel | null>(null);
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      bcRef.current = new BroadcastChannel('hub-dev-preview');
    }
    bridge.listCustomPages()
      .then(({ pages }) => setCustomPages(pages))
      .catch(() => setCustomPages([]));
    return () => { bcRef.current?.close(); };
  }, []);

  const broadcastPreview = useCallback((md: string) => {
    if (liveTimer.current) clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(async () => {
      try {
        const result = await bridge.renderPreview(md);
        bcRef.current?.postMessage({ type: 'preview', html: result.html ?? '', fm: fmRef.current });
      } catch { /* noop */ }
    }, 300);
  }, []);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  useEffect(() => {
    setLoading(true);
    bridge.readFile(filePath)
      .then(({ content }) => {
        const { fm: f, body: b } = parseFM(content);
        if (!f.icon) {
          const p = parseName(filePath.split('/').pop() ?? '');
          if (p.icon) f.icon = p.icon;
        }
        setFm(f); setBody(b); setDirty(false); setHistory([]); setFuture([]);
        broadcastPreview(b);
      })
      .catch(e => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [filePath, broadcastPreview]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await bridge.writeFile(filePath, serializeFM(fmRef.current, bodyRef.current));
      setDirty(false);
      toast.success('Сохранено');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [filePath]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    };
    globalThis.addEventListener('keydown', h);
    return () => globalThis.removeEventListener('keydown', h);
  }, [save]);

  const commitBody = useCallback((next: string) => {
    setHistory(prev => [...prev.slice(-49), bodyRef.current]);
    setFuture([]);
    setBody(next); setDirty(true); broadcastPreview(next);
  }, [broadcastPreview]);

  const undoBody = () => {
    setHistory(prev => {
      const last = prev.at(-1);
      if (last === undefined) return prev;
      setFuture(f => [bodyRef.current, ...f.slice(0, 49)]);
      setBody(last); setDirty(true); broadcastPreview(last);
      return prev.slice(0, -1);
    });
  };

  const redoBody = () => {
    setFuture(prev => {
      const next = prev[0];
      if (next === undefined) return prev;
      setHistory(h => [...h.slice(-49), bodyRef.current]);
      setBody(next); setDirty(true); broadcastPreview(next);
      return prev.slice(1);
    });
  };

  const insertAtCursor = useCallback((snippet: string) => {
    const ta = taRef.current;
    if (!ta) { setBody(prev => prev + snippet); setDirty(true); return; }
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    const savedScroll = ta.scrollTop;
    const nv = body.slice(0, s) + snippet + body.slice(e2);
    commitBody(nv);
    requestAnimationFrame(() => {
      ta.focus(); ta.scrollTop = savedScroll;
      ta.selectionStart = ta.selectionEnd = s + snippet.length;
    });
  }, [body, commitBody]);

  const handleInsert = (before: string, after = '') => {
    const ta = taRef.current;
    if (!ta) { insertAtCursor(before + after); return; }
    const s = ta.selectionStart, e2 = ta.selectionEnd, sel = body.slice(s, e2);
    const savedScroll = ta.scrollTop;
    const nv = body.slice(0, s) + before + sel + after + body.slice(e2);
    commitBody(nv);
    requestAnimationFrame(() => {
      ta.focus(); ta.scrollTop = savedScroll;
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + sel.length;
    });
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget, s = ta.selectionStart;
    const savedScroll = ta.scrollTop;
    const nv = body.slice(0, s) + '  ' + body.slice(ta.selectionEnd);
    commitBody(nv);
    requestAnimationFrame(() => { ta.scrollTop = savedScroll; ta.selectionStart = ta.selectionEnd = s + 2; });
  };

  const inpS: React.CSSProperties = {
    width: '100%', padding: '4px 7px', borderRadius: 5,
    border: `1px solid ${t.border}`, background: t.inpBg, color: t.fg,
    fontSize: 11, outline: 'none', fontFamily: t.mono, boxSizing: 'border-box',
  };

  // ── UPDATED: bigger toolbar buttons with labels below icons ──
  const toolBtn = (fn: () => void, ico: React.ReactNode, tip: string, label: string) => (
    <button key={tip} onClick={fn} title={tip} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 3,
      width: 36, height: 36, borderRadius: 6, border: 'none',
      background: 'transparent', color: t.fgMuted, cursor: 'pointer', flexShrink: 0,
      padding: '2px 3px',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHov; e.currentTarget.style.color = t.fg; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.fgMuted; }}
    >
      {ico}
      <span style={{ fontSize: 9, lineHeight: 1, letterSpacing: '0.01em', whiteSpace: 'nowrap', fontFamily: t.mono }}>{label}</span>
    </button>
  );

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={18} style={{ color: t.fgMuted, animation: 'devSpinAnim 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 6, border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: 13, fontFamily: t.mono, flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHov; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >← Назад</button>
        <span style={{ flex: 1, fontSize: 13, color: t.fg, fontFamily: t.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fm.title || parseName(fileName).title || fileName}{dirty && <span style={{ color: t.warning, marginLeft: 5 }}>●</span>}
        </span>
        <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: `1px solid ${dirty ? t.borderStrong : t.border}`, background: dirty ? t.surfaceHov : 'transparent', color: dirty ? t.fg : t.fgMuted, cursor: 'pointer', fontSize: 13, fontFamily: t.mono, flexShrink: 0, fontWeight: dirty ? 600 : 400 }}>
          {saving && <Loader2 size={11} style={{ animation: 'devSpinAnim 1s linear infinite' }} />}
          Сохранить
          <span style={{ fontSize: 12, color: t.fgSub, background: t.inpBg, border: `1px solid ${t.border}`, borderRadius: 3, padding: '1px 4px', fontFamily: t.mono }}>Ctrl+S</span>
        </button>
      </div>

      {/* FM collapse — FIXED: removed title display */}
      <div style={{ borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <button onClick={() => setFmOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: 'none', background: t.surface, color: t.fgSub, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', textAlign: 'left', fontFamily: t.mono }}>
          {fmOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Настройки страницы
        </button>
        {fmOpen && (
          <div style={{ padding: '12px 14px', background: t.surface }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 8, border: `1px solid ${fm.custom ? t.borderStrong : t.border}`, background: fm.custom ? t.accentSoft : t.inpBg, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!fm.custom}
                onChange={e => {
                  const fallback = customPages[0]?.slug || 'general';
                  const newFm = { ...fm, custom: e.target.checked ? (fm.custom || fallback) : '' };
                  setFm(newFm); setDirty(true);
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ flex: 1 }}>
                <strong style={{ display: 'block', color: t.fg, fontSize: 13 }}>Кастомная страница</strong>
                <span style={{ display: 'block', color: t.fgSub, fontSize: 12, lineHeight: 1.45 }}>Включено — будет показан код из src/custom. Выключено — будет показан обычный Markdown.</span>
                {!!fm.custom && (
                  <select
                    value={fm.custom}
                    onChange={e => { setFm({ ...fm, custom: e.target.value }); setDirty(true); }}
                    style={{ ...inpS, marginTop: 8, fontSize: 13, padding: '8px 10px' }}
                  >
                    {customPages.length === 0 && <option value={fm.custom}>{fm.custom}</option>}
                    {customPages.map(page => <option key={page.slug} value={page.slug}>{page.slug} — {page.folderName}</option>)}
                  </select>
                )}
              </span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
              {([
                { k: 'title', l: 'Заголовок', sp: true }, { k: 'description', l: 'Описание', sp: true },
                { k: 'author', l: 'Автор' }, { k: 'date', l: 'Дата', tp: 'date' },
                { k: 'updated', l: 'Обновлено', tp: 'date' }, { k: 'tags', l: 'Теги', sp: true },
                { k: 'lang', l: 'Язык' }, { k: 'robots', l: 'Robots' },
                { k: 'priority', l: 'Приоритет' },
              ] as Array<{ k: keyof FM; l: string; sp?: boolean; tp?: string }>).map(f => (
                <div key={f.k} style={{ gridColumn: f.sp ? '1 / -1' : 'auto' }}>
                  <div style={{ fontSize: 12, color: t.fgSub, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.l}</div>
                  <input
                    type={f.tp ?? 'text'}
                    value={fm[f.k]}
                    onChange={e => {
                      const newFm = { ...fm, [f.k]: e.target.value };
                      setFm(newFm); setDirty(true);
                      if (liveTimer.current) clearTimeout(liveTimer.current);
                      liveTimer.current = setTimeout(async () => {
                        try {
                          const result = await bridge.renderPreview(bodyRef.current);
                          bcRef.current?.postMessage({ type: 'preview', html: result.html ?? '', fm: newFm });
                        } catch { /* noop */ }
                      }, 200);
                    }}
                    style={{ ...inpS, fontSize: 13, padding: '8px 10px' }}
                  />
                </div>
              ))}
              {/* Icon field special */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, color: t.fgSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Иконка</div>
                <IconField
                  value={fm.icon}
                  onChange={v => { setFm({ ...fm, icon: v }); setDirty(true); }}
                  t={t}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── UPDATED Toolbar: bigger buttons with labels ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '2px 6px', borderBottom: `1px solid ${t.border}`, background: t.surface, flexShrink: 0 }}>
        {toolBtn(undoBody, <Undo2 size={14} />, 'Назад', 'Назад')}
        {toolBtn(redoBody, <Redo2 size={14} />, 'Вперёд', 'Вперёд')}
        <div style={{ width: 1, height: 20, background: t.border, margin: '0 2px' }} />
        {toolBtn(() => handleInsert('**', '**'), <Bold size={14} />, 'Жирный', 'Жирный')}
        {toolBtn(() => handleInsert('_', '_'), <Italic size={14} />, 'Курсив', 'Курсив')}
        {toolBtn(() => handleInsert('`', '`'), <Code size={14} />, 'Код', 'Код')}
        {toolBtn(() => handleInsert('\n## ', ''), <Hash size={14} />, 'H2', 'H2')}
        {toolBtn(() => handleInsert('\n- ', ''), <List size={14} />, 'Список', 'Список')}
        {toolBtn(() => handleInsert('[', '](url)'), <Link size={14} />, 'Ссылка', 'Ссылка')}
        {toolBtn(() => handleInsert('\n---\n', ''), <Minus size={14} />, 'HR', 'HR')}
        <div style={{ width: 1, height: 20, background: t.border, margin: '0 2px' }} />
        {!fm.custom && <BlockPicker onInsert={insertAtCursor} t={t} />}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: t.fgSub }}>{body.trim().split(/\s+/).filter(Boolean).length} слов</span>
      </div>

      {/* Editor */}
      <textarea
        ref={taRef}
        value={body}
        onChange={e => commitBody(e.target.value)}
        onKeyDown={handleTab}
        spellCheck={false}
        disabled={!!fm.custom}
        placeholder={fm.custom ? 'Markdown заблокирован: включён режим кастомной страницы.' : 'Начните писать...'}
        style={{
          flex: 1, padding: '12px 14px', border: 'none',
          background: fm.custom ? t.surface : t.inpBg,
          color: fm.custom ? t.fgSub : t.editorFg,
          fontSize: 12,
          fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
          lineHeight: 1.75, resize: 'none', outline: 'none',
          scrollbarWidth: 'thin', width: '100%', boxSizing: 'border-box',
        } as React.CSSProperties}
      />
    </div>
  );
}

function getNodeBackground(isDragOver: boolean, isDir: boolean, isActive: boolean, isHov: boolean, t: TTokens) {
  if (isDragOver) return isDir ? 'rgba(20,184,166,0.15)' : 'rgba(245,158,11,0.12)';
  if (isActive || isHov) return t.surfaceHov;
  return 'transparent';
}

function getNodeOutline(isDragOver: boolean, isDir: boolean) {
  if (!isDragOver) return 'none';
  return `1.5px dashed ${isDir ? '#14b8a6' : '#f59e0b'}`;
}

function TreeNode({ entry, onCreate, onDelete, onEdit, onSelect, onDrop,
  selectedPath, dragOverPath, setDragOverPath, t }: {
  readonly entry: TreeEntry;
  readonly onCreate: (c: CC) => void;
  readonly onDelete: (e: TreeEntry) => void;
  readonly onEdit: (e: TreeEntry) => void;
  readonly onSelect: (p: string) => void;
  readonly onDrop: (srcPath: string, dstPath: string) => void;
  readonly selectedPath: string;
  readonly dragOverPath: string | null;
  readonly setDragOverPath: (p: string | null) => void;
  readonly t: TTokens;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hov, setHov] = useState(false);
  const isDir = entry.type === 'dir';
  const isActive = entry.path === selectedPath;
  const isDragOver = dragOverPath === entry.path;
  const p = entry.parsed;

  const actionBtn = (ico: React.ReactNode, tip: string, fn: () => void, danger?: boolean) => (
    <button key={tip} title={tip}
      onClick={e => { e.stopPropagation(); fn(); }}
      style={{ height: 32, borderRadius: 6, border: `1px solid ${t.border}`, padding: '0 8px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', background: t.surfaceHov, color: danger ? t.danger : t.fgMuted, cursor: 'pointer', fontSize: 13, fontFamily: t.mono }}
      onMouseEnter={e => { e.currentTarget.style.color = danger ? t.danger : t.fg; e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : t.surfaceHov; }}
      onMouseLeave={e => { e.currentTarget.style.color = danger ? t.danger : t.fgMuted; e.currentTarget.style.background = t.surfaceHov; }}
    >{ico}<span>{tip}</span></button>
  );

  const nodeBg = getNodeBackground(isDragOver, isDir, isActive, hov, t);
  const nodeOutline = getNodeOutline(isDragOver, isDir);
  const fontWeightMap: Record<string, number> = { N: 600, C: 500, A: 400 };
  const fontWeight = p.type ? (fontWeightMap[p.type] ?? 400) : 400;
  const expandIcon = expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />;
  const chevronIcon = isDir ? expandIcon : null;

  return (
    <div>
      <button
        type="button"
        draggable
        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', entry.path); e.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragOverPath(entry.path); }}
        onDragLeave={e => { e.stopPropagation(); setDragOverPath(null); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragOverPath(null); const src = e.dataTransfer.getData('text/plain'); if (src && src !== entry.path) onDrop(src, entry.path); }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => { if (isDir) setExpanded(v => !v); else onSelect(entry.path); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, cursor: 'grab', userSelect: 'none',
          width: '100%', textAlign: 'left',
          padding: `5px 10px 5px ${12 + entry.depth * 14}px`,
          borderRadius: 7, border: 'none',
          background: nodeBg,
          outline: nodeOutline,
          outlineOffset: -1, minHeight: 28, transition: 'background 0.1s',
        }}
      >
        <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgSub, opacity: isDir ? 1 : 0.55 }}>
          {chevronIcon}
        </span>
        <span style={{ fontSize: 16, color: t.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight }}>
          {p.title || entry.name}
        </span>
        {hov && (
          <div role="toolbar" style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            {actionBtn(<Edit3 size={13} />, 'Редактировать', () => onEdit(entry))}
            {isDir && p.type === 'N' && actionBtn(<FolderPlus size={13} />, '+ Категория', () => onCreate({ parentPath: entry.path, entryType: 'C' }))}
            {isDir && (p.type === 'N' || p.type === 'C') && actionBtn(<FilePlus size={13} />, '+ Страница', () => onCreate({ parentPath: entry.path, entryType: 'A' }))}
            {actionBtn(<Trash2 size={13} />, 'Удалить', () => onDelete(entry), true)}
          </div>
        )}
      </button>
      {isDir && expanded && entry.children.length > 0 && (
        <div style={{ marginLeft: 13 + entry.depth * 14, borderLeft: `1px solid ${t.border}`, paddingLeft: 8 }}>
          {entry.children.map(c => (
            <TreeNode key={c.path} entry={c} onCreate={onCreate} onDelete={onDelete}
              onEdit={onEdit} onSelect={onSelect} onDrop={onDrop}
              selectedPath={selectedPath} dragOverPath={dragOverPath}
              setDragOverPath={setDragOverPath} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function filterTreeByQuery(entries: TreeEntry[], query: string): TreeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const walk = (items: TreeEntry[]): TreeEntry[] => items
    .map(item => {
      const title = (item.parsed.title || item.name).toLowerCase();
      const matchesSelf = title.includes(q) || item.path.toLowerCase().includes(q);
      const children = walk(item.children);
      if (matchesSelf || children.length > 0) return { ...item, children };
      return null;
    })
    .filter((x): x is TreeEntry => x !== null);
  return walk(entries);
}

function countFiles(entries: TreeEntry[]): number {
  return entries.reduce((acc, e) => {
    const childCount = e.children ? countFiles(e.children) : 0;
    return acc + (e.type === 'file' ? 1 : 0) + childCount;
  }, 0);
}

function flattenTree(entries: TreeEntry[]): TreeEntry[] {
  const result: TreeEntry[] = [];
  const stack = [...entries];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    result.push(node);
    stack.push(...node.children);
  }
  return result;
}

export default function DocsPanel() {
  const t = useContext(ThemeTokensContext);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [modalCfg, setModalCfg] = useState<{ cfg: CC; existing?: TreeEntry } | null>(null);
  const [toDelete, setToDelete] = useState<TreeEntry | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { entries } = await bridge.listDocs();
      setTree(buildTree(entries));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await bridge.deleteFile(toDelete.path);
      if (selected === toDelete.path) setSelected(null);
      setToDelete(null);
      setTimeout(load, 400);
      toast.success('Удалено');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const openEditorForFile = useCallback((path: string) => {
    openRouteForDoc(path);
    setSelected(path);
  }, []);

  const handleDone = useCallback((fp?: string) => {
    setTimeout(() => { load(); if (fp) openEditorForFile(fp); }, 400);
  }, [load, openEditorForFile]);

  const handleEdit = useCallback((entry: TreeEntry) => {
    if (entry.type === 'file') {
      openEditorForFile(entry.path);
      return;
    }
    const entryType = entry.parsed.type;
    if (!entryType) return;
    const cfg: CC = {
      parentPath: entry.path.split('/').slice(0, -1).join('/'),
      entryType,
    };
    setModalCfg({ cfg, existing: entry });
  }, [openEditorForFile]);

  const handleDrop = useCallback(async (srcPath: string, dstPath: string) => {
    const allEntries = flattenTree(tree);
    const src = allEntries.find(e => e.path === srcPath);
    const dst = allEntries.find(e => e.path === dstPath);
    if (!src || !dst) return;
    const targetDir = dst.type === 'dir' ? dst.path : dst.path.split('/').slice(0, -1).join('/');
    if (srcPath === targetDir || targetDir.startsWith(srcPath + '/')) {
      toast.error('Нельзя переместить папку внутрь себя');
      return;
    }
    const srcName = srcPath.split('/').pop();
    if (!srcName) return;
    const newPath = `${targetDir}/${srcName}`;
    if (newPath === srcPath) return;
    setMoving(true);
    try {
      if (src.type === 'dir') {
        await renameDir(srcPath, newPath);
      } else {
        const { content } = await bridge.readFile(srcPath);
        await bridge.writeFile(newPath, content);
        await bridge.deleteFile(srcPath);
        if (selected === srcPath) openEditorForFile(newPath);
      }
      toast.success(`Перемещено → ${targetDir.split('/').pop()}`);
      setTimeout(load, 400);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setMoving(false);
    }
  }, [tree, selected, load, openEditorForFile]);

  const visibleTree = filterTreeByQuery(tree, query);
  const fileCount = countFiles(tree);

  const renderTreeContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: t.fgMuted }}>
        <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Загрузка...</span>
      </div>
    );
    if (visibleTree.length === 0) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 28, color: t.fgMuted, textAlign: 'center' }}>
        <FolderOpen size={28} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: 14 }}>{query ? 'Ничего не найдено' : 'Docs/ пуста. Создай Секция'}</div>
      </div>
    );
    return visibleTree.map(e => (
      <TreeNode key={e.path} entry={e} onCreate={cfg => setModalCfg({ cfg })}
        onDelete={setToDelete} onEdit={handleEdit}
        onSelect={openEditorForFile} onDrop={handleDrop}
        selectedPath={selected ?? ''} dragOverPath={dragOverPath}
        setDragOverPath={setDragOverPath} t={t} />
    ));
  };

  if (selected) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MarkdownEditor filePath={selected} onClose={() => setSelected(null)} t={t} />
      {modalCfg && (
        <EntryModal cfg={modalCfg.cfg} existing={modalCfg.existing}
          onClose={() => setModalCfg(null)} onDone={handleDone} t={t} />
      )}
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, background: t.surface }}>
        <button onClick={() => setModalCfg({ cfg: { parentPath: 'Docs', entryType: 'N' } })} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: `1px solid ${t.borderStrong}`, background: t.surfaceHov, color: t.fg, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: t.mono }}>
          <Plus size={13} /> Секция
        </button>
        <button onClick={() => setModalCfg({ cfg: { parentPath: 'Docs', entryType: 'A' } })} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: `1px solid ${t.border}`, background: 'transparent', color: t.fg, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: t.mono }}>
          <FilePlus size={13} /> Страница
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 220, maxWidth: 340, width: '36%' }}>
          <Search size={12} style={{ color: t.fgSub }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск документа..." style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.inpBg, color: t.fg, fontSize: 14, fontFamily: t.mono, outline: 'none' }} />
        </div>
        {moving && <Loader2 size={12} style={{ color: t.fgMuted, animation: 'devSpinAnim 1s linear infinite' }} />}
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: 13, fontFamily: t.mono }}
          onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHov; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <RefreshCw size={11} /> Обновить
        </button>
      </div>

      <div style={{ padding: '4px 12px', fontSize: 12, color: t.fgSub, background: t.surface, borderBottom: `1px solid ${t.border}` }}>
        Перетащи страницу или категорию в другую папку
      </div>

      <section aria-label="Дерево документов" style={{ flex: 1, overflowY: 'auto', padding: '4px' }} className="adm-scroll"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const src = e.dataTransfer.getData('text/plain'); if (src) handleDrop(src, 'Docs'); }}
      >
        {renderTreeContent()}
      </section>

      <div style={{ padding: '5px 10px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: t.fgSub, background: t.surface, flexShrink: 0 }}>
        <span>{fileCount} страниц</span>
        <span style={{ fontFamily: t.mono }}>Docs/</span>
      </div>

      {modalCfg && (
        <EntryModal cfg={modalCfg.cfg} existing={modalCfg.existing}
          onClose={() => setModalCfg(null)} onDone={handleDone} t={t} />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Удалить «${toDelete.parsed.title || toDelete.name}»?`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          danger
          t={t}
        />
      )}
    </div>
  );
}
