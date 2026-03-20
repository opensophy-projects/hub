/**
 * DocsPanel — объединённая панель Навигация + Страницы
 *
 * Левая колонка: дерево Docs/ (NavEditorPanel)
 * Правая колонка: редактор выбранного файла (PageEditorPanel)
 *
 * Создание статьи: заполняешь весь frontmatter сразу, жмёшь Create →
 * файл создаётся + bridge.runGenerate() → страница сразу доступна на сайте.
 *
 * Редактирование: клик по файлу в дереве → открывается только markdown-редактор
 * (frontmatter отдельно). Сохранение = Ctrl+S или кнопка → runGenerate().
 *
 * Preview: открывает реальную страницу в браузере (window.open).
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import {
  T, Btn, ScrollArea, EmptyState, StatusBar, Badge, ConfirmDialog,
} from '../components/ui';
import { marked } from 'marked';
import {
  FolderOpen, Folder, FileText, Plus, Trash2,
  ChevronRight, ChevronDown, FolderPlus, FilePlus,
  Loader2, Save, Eye, Bold, Italic, Code, Link, Hash, List,
  RefreshCw, X, Search,
} from 'lucide-react';

marked.setOptions({ breaks: true, gfm: true });

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatEntry {
  type: 'file' | 'dir';
  path: string;
  name: string;
  depth: number;
}

interface TreeEntry extends FlatEntry {
  children: TreeEntry[];
  parsed: {
    type: 'N' | 'C' | 'A' | null;
    icon: string | null;
    title: string;
    slug: string | null;
  };
}

interface FM {
  title: string;
  description: string;
  author: string;
  date: string;
  updated: string;
  tags: string;
  icon: string;
  lang: string;
  robots: string;
}

const EMPTY_FM: FM = {
  title: '', description: '', author: '',
  date: new Date().toISOString().split('T')[0],
  updated: '', tags: '', icon: '', lang: 'ru', robots: 'index, follow',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[а-яё]/g, c => TRANSLIT[c] ?? c)
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseName(name: string) {
  name = name.replace(/\.md$/, '');
  const typeMatch = name.match(/^\[([NCA])\]/);
  const type = typeMatch?.[1] as 'N' | 'C' | 'A' | null ?? null;
  const rest = typeMatch ? name.slice(typeMatch[0].length) : name;
  const iconMatch = rest.match(/^\[([^\]]+)\]/);
  const icon = iconMatch?.[1] ?? null;
  const afterIcon = iconMatch ? rest.slice(iconMatch[0].length) : rest;
  const slugMatch = afterIcon.match(/^(.+?)\{([^}]+)\}$/);
  const title = slugMatch ? slugMatch[1].trim() : afterIcon.trim();
  const slug  = slugMatch ? slugMatch[2].trim() : null;
  return { type, icon, title, slug };
}

function buildTree(flat: FlatEntry[]): TreeEntry[] {
  const byPath = new Map<string, TreeEntry>();
  const tree: TreeEntry[] = [];
  flat.forEach(e => {
    byPath.set(e.path, { ...e, children: [], parsed: parseName(e.name) });
  });
  flat.forEach(e => {
    const node = byPath.get(e.path)!;
    const parentPath = e.path.split('/').slice(0, -1).join('/');
    const parent = byPath.get(parentPath);
    if (parent) parent.children.push(node);
    else tree.push(node);
  });
  return tree;
}

function parseFM(raw: string): { fm: FM; body: string } {
  if (!raw.startsWith('---\n')) return { fm: { ...EMPTY_FM }, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { fm: { ...EMPTY_FM }, body: raw };
  const block = raw.slice(4, end);
  const body  = raw.slice(end + 5);
  const fm: FM = { ...EMPTY_FM };
  for (const line of block.split('\n')) {
    const ci = line.indexOf(':');
    if (ci < 1) continue;
    const k = line.slice(0, ci).trim() as keyof FM;
    const v = line.slice(ci + 1).trim().replace(/^["']|["']$/g, '');
    if (k in fm) (fm as any)[k] = v;
  }
  return { fm, body };
}

function serializeFM(fm: FM, body: string): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(fm) as [keyof FM, string][]) {
    if (!v) continue;
    const needsQuote = /[:#\[\]{}&*!|>'",%@`]/.test(v);
    lines.push(`${k}: ${needsQuote ? `"${v.replace(/"/g, '\\"')}"` : v}`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateConfig {
  parentPath: string;
  entryType: 'N' | 'C' | 'A';
}

function CreateModal({
  config, onClose, onCreated,
}: {
  config: CreateConfig;
  onClose: () => void;
  onCreated: (filePath?: string) => void;
}) {
  const [title, setTitle]     = useState('');
  const [slug, setSlug]       = useState('');
  const [icon, setIcon]       = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [fm, setFm]           = useState<FM>({ ...EMPTY_FM });
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const handleTitle = (v: string) => {
    setTitle(v);
    setFm(prev => ({ ...prev, title: v }));
    if (autoSlug) setSlug(slugify(v));
  };

  const setFmField = (k: keyof FM, v: string) => setFm(prev => ({ ...prev, [k]: v }));

  const typeLabels = { N: 'Nav Popover [N]', C: 'Категория [C]', A: 'Статья [A]' };
  const defaultIcons: Record<string, string> = { N: 'book', C: 'folder', A: 'file-text' };
  const isArticle = config.entryType === 'A';

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic = icon.trim() || defaultIcons[config.entryType];
      const iconPart = ic ? `[${ic}]` : '';
      const slugPart = slug.trim() ? `{${slug.trim()}}` : '';
      const entryName = `[${config.entryType}]${iconPart}${title.trim()}${slugPart}`;

      if (isArticle) {
        const filePath = `${config.parentPath}/${entryName}.md`;
        const finalFm = { ...fm, title: title.trim() };
        const content = serializeFM(finalFm, `# ${title.trim()}\n\nНачните писать здесь...\n`);
        await bridge.writeFile(filePath, content);

        // Generate immediately so page is accessible
        const gen = await bridge.runGenerate();
        if (!gen.ok) toast.warning('Файл создан, но генерация завершилась с ошибкой');
        else toast.success(`Статья "${title.trim()}" создана и опубликована`);

        onCreated(filePath);
      } else {
        const dirPath = `${config.parentPath}/${entryName}`;
        await bridge.writeFile(`${dirPath}/.gitkeep`, '');
        await bridge.runGenerate();
        toast.success(`${config.entryType === 'N' ? 'Nav popover' : 'Категория'} "${title.trim()}" создана`);
        onCreated();
      }
      onClose();
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', borderRadius: 5,
    border: `1px solid ${T.border}`,
    background: T.bgHov, color: T.fg, fontSize: 11,
    outline: 'none', boxSizing: 'border-box', fontFamily: T.mono,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: T.fgSub, textTransform: 'uppercase',
    letterSpacing: '0.07em', marginBottom: 3, display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100010,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: T.bgPanel, border: `1px solid ${T.borderHov}`,
          borderRadius: 12, width: isArticle ? 480 : 360,
          maxHeight: '90vh', overflowY: 'auto',
          padding: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          fontFamily: T.mono,
        }}
        onKeyDown={e => { if (e.key === 'Enter' && !isArticle) create(); if (e.key === 'Escape') onClose(); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Badge type={config.entryType} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>
            Создать: {typeLabels[config.entryType]}
          </span>
        </div>

        {/* Common fields */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Название *</label>
          <input ref={inputRef} value={title} onChange={e => handleTitle(e.target.value)}
            placeholder={isArticle ? 'Название статьи' : 'Название раздела'} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>URL Slug</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={slug}
              onChange={e => { setSlug(e.target.value); setAutoSlug(false); }}
              placeholder="my-page-slug" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => { setAutoSlug(true); setSlug(slugify(title)); }}
              style={{ padding: '5px 8px', borderRadius: 5, border: `1px solid ${T.border}`,
                background: T.bgHov, color: T.fgMuted, fontSize: 10, cursor: 'pointer', fontFamily: T.mono }}>
              ↺
            </button>
          </div>
        </div>

        <div style={{ marginBottom: isArticle ? 16 : 10 }}>
          <label style={labelStyle}>Иконка (lucide.dev)</label>
          <input value={icon} onChange={e => setIcon(e.target.value)}
            placeholder={defaultIcons[config.entryType]} style={inputStyle} />
        </div>

        {/* Article-only frontmatter fields */}
        {isArticle && (
          <>
            <div style={{
              borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 12,
              fontSize: 10, color: T.fgSub, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Frontmatter статьи
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginBottom: 10 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Описание</label>
                <input value={fm.description} onChange={e => setFmField('description', e.target.value)}
                  placeholder="Краткое описание для SEO" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Автор</label>
                <input value={fm.author} onChange={e => setFmField('author', e.target.value)}
                  placeholder="veilosophy" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Дата</label>
                <input type="date" value={fm.date} onChange={e => setFmField('date', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Теги (через запятую)</label>
                <input value={fm.tags} onChange={e => setFmField('tags', e.target.value)}
                  placeholder="linux, security, devops" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Lang</label>
                <input value={fm.lang} onChange={e => setFmField('lang', e.target.value)}
                  placeholder="ru" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Robots</label>
                <input value={fm.robots} onChange={e => setFmField('robots', e.target.value)}
                  placeholder="index, follow" style={inputStyle} />
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Btn fullWidth onClick={onClose}>Отмена</Btn>
          <Btn variant="accent" fullWidth loading={saving} onClick={create} style={{ fontWeight: 700 }}>
            {isArticle ? 'Создать и опубликовать' : 'Создать'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────

function ActionIconBtn({ icon, title, onClick, danger }: {
  icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 20, height: 20, borderRadius: 4, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? (danger ? T.dangerSoft : T.bgActive) : 'transparent',
        color: hov ? (danger ? T.danger : T.fg) : T.fgSub,
        cursor: 'pointer', transition: 'all 0.1s',
      }}
    >{icon}</button>
  );
}

function TreeNode({
  entry, onCreateChild, onDelete, onSelect, selectedPath,
}: {
  entry: TreeEntry;
  onCreateChild: (cfg: CreateConfig) => void;
  onDelete: (entry: TreeEntry) => void;
  onSelect: (path: string) => void;
  selectedPath: string;
}) {
  const [expanded, setExpanded] = useState(entry.depth < 2);
  const [hov, setHov] = useState(false);
  const isDir    = entry.type === 'dir';
  const isActive = entry.path === selectedPath;
  const p = entry.parsed;
  const iconMap: Record<string, string> = { N: T.accent, C: '#22c55e', A: '#f59e0b' };
  const entryColor = iconMap[p.type ?? ''] ?? T.fgSub;

  return (
    <div>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        onClick={() => { if (isDir) setExpanded(v => !v); else onSelect(entry.path); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: `4px 8px 4px ${10 + entry.depth * 14}px`,
          borderRadius: 5, cursor: 'pointer',
          background: isActive ? T.accentSoft : hov ? T.bgHov : 'transparent',
          userSelect: 'none',
        }}
      >
        {isDir
          ? (expanded ? <ChevronDown size={11} style={{ color: T.fgSub, flexShrink: 0 }} />
                      : <ChevronRight size={11} style={{ color: T.fgSub, flexShrink: 0 }} />)
          : <span style={{ width: 11, flexShrink: 0 }} />
        }
        {isDir
          ? (expanded ? <FolderOpen size={12} style={{ color: entryColor, flexShrink: 0 }} />
                      : <Folder     size={12} style={{ color: entryColor, flexShrink: 0 }} />)
          : <FileText size={12} style={{ color: T.fgSub, flexShrink: 0 }} />
        }
        {p.type && <Badge type={p.type} />}
        {p.icon && <span style={{ fontSize: 9, color: T.fgSub, flexShrink: 0 }}>⬡{p.icon}</span>}
        <span style={{
          fontSize: 12, color: isActive ? T.accent : T.fg,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {p.title || entry.name}
        </span>
        {p.slug && hov && (
          <span style={{ fontSize: 9, color: T.fgSub, fontFamily: T.mono, flexShrink: 0 }}>
            /{p.slug}
          </span>
        )}
        {hov && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {isDir && p.type === 'N' && (
              <ActionIconBtn icon={<FolderPlus size={10}/>} title="Добавить категорию [C]"
                onClick={() => onCreateChild({ parentPath: entry.path, entryType: 'C' })} />
            )}
            {isDir && (p.type === 'N' || p.type === 'C') && (
              <ActionIconBtn icon={<FilePlus size={10}/>} title="Добавить статью [A]"
                onClick={() => onCreateChild({ parentPath: entry.path, entryType: 'A' })} />
            )}
            <ActionIconBtn icon={<Trash2 size={10}/>} title="Удалить" danger
              onClick={() => onDelete(entry)} />
          </div>
        )}
      </div>

      {isDir && expanded && entry.children.length > 0 && (
        <div style={{ borderLeft: `1px solid ${T.border}`, marginLeft: 10 + entry.depth * 14 + 5 }}>
          {entry.children.map(child => (
            <TreeNode key={child.path} entry={child}
              onCreateChild={onCreateChild} onDelete={onDelete}
              onSelect={onSelect} selectedPath={selectedPath} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Markdown Editor ──────────────────────────────────────────────────────────

const PREVIEW_CSS = `
  .dp { font-size:13px; color:rgba(255,255,255,0.85); line-height:1.7; font-family:system-ui,sans-serif; }
  .dp h1,.dp h2,.dp h3,.dp h4 { color:rgba(255,255,255,0.95); margin-top:1.3em; margin-bottom:.4em; }
  .dp h1{font-size:1.6em;font-weight:700} .dp h2{font-size:1.3em;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:.25em}
  .dp h3{font-size:1.1em;font-weight:700} .dp p{margin:.6em 0}
  .dp code{background:rgba(255,255,255,0.08);padding:2px 5px;border-radius:3px;font-family:ui-monospace,monospace;font-size:.85em}
  .dp pre{background:#080810;padding:10px 12px;border-radius:7px;overflow-x:auto;margin:.8em 0}
  .dp pre code{background:none;padding:0}
  .dp blockquote{border-left:3px solid rgba(124,92,252,0.6);padding:.1em .75em;margin:.7em 0;color:rgba(255,255,255,.6);background:rgba(124,92,252,0.05);border-radius:0 5px 5px 0}
  .dp ul,.dp ol{padding-left:1.4em;margin:.4em 0} .dp li{margin:.2em 0}
  .dp a{color:#7c5cfc} .dp hr{border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1.2em 0}
  .dp table{border-collapse:collapse;width:100%;margin:.7em 0;font-size:.9em}
  .dp td,.dp th{border:1px solid rgba(255,255,255,0.1);padding:5px 9px}
  .dp th{background:rgba(255,255,255,0.06);font-weight:600}
  .dp strong{color:rgba(255,255,255,.96);font-weight:700} .dp em{font-style:italic}
  .dp img{max-width:100%;border-radius:5px}
`;

function MarkdownEditor({
  filePath, onClose,
}: {
  filePath: string;
  onClose: () => void;
}) {
  const [fm, setFm]           = useState<FM>({ ...EMPTY_FM });
  const [body, setBody]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [fmOpen, setFmOpen]   = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';

  // Derive slug for preview URL
  const previewSlug = useMemo(() => {
    // path like Docs/[N]..../[A][icon]Title{slug}.md
    const parts = filePath.replace(/^Docs\//, '').split('/');
    const slugParts: string[] = [];
    for (const p of parts) {
      const parsed = parseName(p);
      if (parsed.slug) slugParts.push(parsed.slug);
      else if (parsed.title) slugParts.push(slugify(parsed.title));
    }
    return slugParts.join('/');
  }, [filePath]);

  useEffect(() => {
    bridge.readFile(filePath)
      .then(({ content }) => {
        const { fm: f, body: b } = parseFM(content);
        setFm(f); setBody(b); setDirty(false);
      })
      .catch(e => toast.error(`Ошибка: ${e.message}`))
      .finally(() => setLoading(false));
  }, [filePath]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await bridge.writeFile(filePath, serializeFM(fm, body));
      await bridge.runGenerate();
      setDirty(false);
      toast.success('Сохранено');
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [filePath, fm, body]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  const handleInsert = (before: string, after = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = body.slice(s, e);
    const nv = body.slice(0, s) + before + sel + after + body.slice(e);
    setBody(nv); setDirty(true);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd   = s + before.length + sel.length;
    }, 0);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const s = ta.selectionStart;
    const nv = body.slice(0, s) + '  ' + body.slice(ta.selectionEnd);
    setBody(nv); setDirty(true);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; }, 0);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 6px', borderRadius: 4,
    border: `1px solid ${T.border}`,
    background: T.bgHov, color: T.fg, fontSize: 10,
    outline: 'none', fontFamily: T.mono, boxSizing: 'border-box',
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={18} style={{ color: T.accent, animation: 'devSpinAnim 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px',
        borderBottom: `1px solid ${T.border}`, background: T.bgPanel, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px',
          borderRadius: 4, border: `1px solid ${T.border}`,
          background: 'transparent', color: T.fgMuted, fontSize: 10, cursor: 'pointer', fontFamily: T.mono,
        }}>← Назад</button>

        <span style={{
          fontSize: 11, color: T.fg, flex: 1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: T.mono,
        }}>
          {fileName}{dirty && <span style={{ color: T.warning, marginLeft: 4 }}>●</span>}
        </span>

        {/* Open in browser */}
        <button
          onClick={() => window.open(`/${previewSlug}`, '_blank')}
          title="Открыть на сайте"
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            borderRadius: 4, border: `1px solid ${T.border}`,
            background: 'transparent', color: T.fgMuted, fontSize: 10, cursor: 'pointer', fontFamily: T.mono,
          }}
        >
          <Eye size={11} /> Открыть
        </button>

        <Btn
          icon={saving
            ? <Loader2 size={11} style={{ animation: 'devSpinAnim 1s linear infinite' }} />
            : <Save size={11} />
          }
          variant={dirty ? 'accent' : 'default'}
          size="sm" loading={saving} onClick={save}
        >
          Ctrl+S
        </Btn>
      </div>

      {/* Frontmatter accordion */}
      <div style={{ borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <button
          onClick={() => setFmOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', border: 'none', background: T.bgPanel,
            color: T.fgSub, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            cursor: 'pointer', textAlign: 'left', fontFamily: T.mono,
          }}
        >
          {fmOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
          Frontmatter
          {fm.title && <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 9, color: T.fgSub }}>— {fm.title.slice(0, 28)}</span>}
        </button>
        {fmOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', padding: '6px 10px 8px' }}>
            {([
              { k: 'title',       label: 'Title',       span: true  },
              { k: 'description', label: 'Description', span: true  },
              { k: 'author',      label: 'Author' },
              { k: 'date',        label: 'Date',        type: 'date' },
              { k: 'updated',     label: 'Updated',     type: 'date' },
              { k: 'tags',        label: 'Tags',        span: true  },
              { k: 'icon',        label: 'Icon' },
              { k: 'lang',        label: 'Lang' },
              { k: 'robots',      label: 'Robots' },
            ] as Array<{ k: keyof FM; label: string; span?: boolean; type?: string }>).map(f => (
              <div key={f.k} style={{ gridColumn: f.span ? '1 / -1' : 'auto' }}>
                <div style={{ fontSize: 9, color: T.fgSub, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</div>
                <input type={f.type ?? 'text'} value={fm[f.k]}
                  onChange={e => { setFm(prev => ({ ...prev, [f.k]: e.target.value })); setDirty(true); }}
                  style={inputStyle} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Syntax toolbar */}
      <div style={{ display: 'flex', gap: 2, padding: '3px 8px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.bgPanel }}>
        {[
          { icon: <Bold size={11}/>,   b: '**', a: '**' },
          { icon: <Italic size={11}/>, b: '_',  a: '_'  },
          { icon: <Code size={11}/>,   b: '`',  a: '`'  },
          { icon: <Hash size={11}/>,   b: '\n## ', a: '' },
          { icon: <List size={11}/>,   b: '\n- ',  a: '' },
          { icon: <Link size={11}/>,   b: '[',  a: '](url)' },
        ].map((btn, i) => (
          <button key={i} onClick={() => handleInsert(btn.b, btn.a)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 20, borderRadius: 3,
              border: 'none', background: 'transparent', color: T.fgMuted, cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgHov; (e.currentTarget as HTMLButtonElement).style.color = T.fg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted; }}
          >{btn.icon}</button>
        ))}
      </div>

      {/* Editor only — preview is the real site */}
      <textarea
        ref={taRef}
        value={body}
        onChange={e => { setBody(e.target.value); setDirty(true); }}
        onKeyDown={handleTab}
        spellCheck={false}
        style={{
          flex: 1, padding: '10px 12px',
          border: 'none', background: T.bgHov,
          color: '#e2e8f0', fontSize: 12,
          fontFamily: T.mono, lineHeight: 1.75,
          resize: 'none', outline: 'none',
          scrollbarWidth: 'thin',
        }}
      />

      <StatusBar
        left={`${body.trim().split(/\s+/).filter(Boolean).length} слов`}
        right={dirty ? '● не сохранено' : '✓ сохранено'}
      />
    </div>
  );
}

// ─── DocsPanel ────────────────────────────────────────────────────────────────

export default function DocsPanel() {
  const [tree, setTree]           = useState<TreeEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedFile, setSelected] = useState<string | null>(null);
  const [createConfig, setCreate]   = useState<CreateConfig | null>(null);
  const [toDelete, setToDelete]     = useState<TreeEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { entries } = await bridge.listDocs();
      setTree(buildTree(entries));
    } catch (e: any) {
      toast.error(`Ошибка загрузки: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await bridge.deleteFile(toDelete.path);
      if (selectedFile === toDelete.path) setSelected(null);
      setToDelete(null);
      await load();
      await bridge.runGenerate();
      toast.success(`Удалено: ${toDelete.parsed.title || toDelete.name}`);
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const handleCreated = useCallback((filePath?: string) => {
    load();
    if (filePath) setSelected(filePath);
  }, [load]);

  const fileCount = tree.reduce(function count(acc: number, e: TreeEntry): number {
    return acc + (e.type === 'file' ? 1 : 0) + (e.children ? e.children.reduce(count, 0) : 0);
  }, 0);

  // Show editor if file selected
  if (selectedFile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MarkdownEditor filePath={selectedFile} onClose={() => setSelected(null)} />

        {createConfig && (
          <CreateModal config={createConfig} onClose={() => setCreate(null)} onCreated={handleCreated} />
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 10px', borderBottom: `1px solid ${T.border}`,
        flexShrink: 0, background: T.bgPanel,
      }}>
        <Btn icon={<Plus size={11}/>} variant="accent" size="sm"
          onClick={() => setCreate({ parentPath: 'Docs', entryType: 'N' })}>
          Nav Popover
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn icon={<RefreshCw size={11}/>} size="sm" onClick={load}>Обновить</Btn>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ScrollArea style={{ height: '100%', padding: '6px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: T.fgSub }}>
              <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }} />
              <span style={{ fontSize: 12 }}>Загрузка...</span>
            </div>
          ) : tree.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={32} />}
              title="Docs/ пуста"
              desc="Создай первый Nav Popover чтобы начать"
            />
          ) : (
            tree.map(entry => (
              <TreeNode
                key={entry.path}
                entry={entry}
                onCreateChild={setCreate}
                onDelete={setToDelete}
                onSelect={path => setSelected(path)}
                selectedPath={selectedFile ?? ''}
              />
            ))
          )}
        </ScrollArea>
      </div>

      <StatusBar left={`${fileCount} файлов`} right="Docs/" />

      {createConfig && (
        <CreateModal config={createConfig} onClose={() => setCreate(null)} onCreated={handleCreated} />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Удалить "${toDelete.parsed.title || toDelete.name}"? Необратимо.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          danger
        />
      )}
    </div>
  );
}