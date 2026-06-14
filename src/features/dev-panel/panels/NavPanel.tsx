import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Map, FolderPlus, FilePlus, Plus, RefreshCw, Trash2, Edit3, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/toastBus';
import { ThemeTokensContext } from '../theme';
import type { TTokens } from '../theme';

type Parsed = { type: 'N' | 'C' | 'A' | null; icon: string | null; title: string; slug: string | null };
type NavEntry = { type: 'file' | 'dir'; path: string; name: string; depth: number; parsed: Parsed; meta?: Record<string, string>; children: NavEntry[] };
type EntryKind = 'N' | 'C' | 'A';

const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'new-entry';
const fileNameFor = (kind: EntryKind, title: string, slug: string, icon: string) => `${kind === 'A' ? '[A]' : `[${kind}][${icon || 'folder'}]`}${title}{${slug || toSlug(title)}}${kind === 'A' ? '.md' : ''}`;
const join = (a: string, b: string) => `${a.replace(/\/$/, '')}/${b}`;

function DragHandle() { return <GripVertical size={12} style={{ opacity: 0.55 }} />; }

function CreateEntryModal({ parentPath, kind, existing, onClose, onDone, t }: { parentPath: string; kind: EntryKind; existing?: NavEntry; onClose: () => void; onDone: () => void; t: TTokens }) {
  const [title, setTitle] = useState(existing?.parsed.title || 'Новая страница');
  const [slug, setSlug] = useState(existing?.parsed.slug || toSlug(existing?.parsed.title || 'Новая страница'));
  const [icon, setIcon] = useState(existing?.parsed.icon || (kind === 'A' ? '' : 'folder'));
  const save = async () => {
    const name = fileNameFor(kind, title, slug, icon);
    try {
      if (existing) await bridge.renameEntry(existing.path, name);
      else if (kind === 'A') await bridge.writeFile(join(parentPath, name), `---\ntitle: ${title}\ndate: ${new Date().toISOString().split('T')[0]}\nrobots: index, follow\n---\n\n# ${title}\n`);
      else await bridge.mkdir(join(parentPath, name));
      toast.success(existing ? 'Переименовано' : 'Создано');
      onDone(); onClose();
    } catch (e) { toast.error((e as Error).message); }
  };
  return <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 360, border: `1px solid ${t.borderStrong}`, borderRadius: 12, background: t.bg, boxShadow: t.shadow, padding: 14 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, color: t.fg }}>{existing ? 'Редактировать' : 'Создать'} {kind === 'N' ? 'секцию' : kind === 'C' ? 'категорию' : 'страницу'}</h3>
      {[['Название', title, setTitle], ['Slug', slug, setSlug], ['Иконка', icon, setIcon] as const].map(([label, value, setter]) => kind === 'A' && label === 'Иконка' ? null : <label key={label} style={{ display: 'block', marginBottom: 8, fontSize: 11, color: t.fgSub }}>{label}<input value={value} onChange={e => setter(e.target.value)} style={{ width: '100%', marginTop: 3, boxSizing: 'border-box', padding: '7px 9px', borderRadius: 7, border: `1px solid ${t.border}`, background: t.inpBg, color: t.fg, fontFamily: t.mono }} /></label>)}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}><button onClick={onClose}>Отмена</button><button onClick={save}>Сохранить</button></div>
    </div>
  </div>;
}

function NavNode({ node, onReload, onCreate, onEdit, t }: { node: NavEntry; onReload: () => void; onCreate: (parentPath: string, kind: EntryKind) => void; onEdit: (n: NavEntry) => void; t: TTokens }) {
  const [open, setOpen] = useState(node.depth < 2);
  const [over, setOver] = useState(false);
  const isDir = node.type === 'dir';
  const move = async (src: string) => { if (!src || src === node.path) return; try { await bridge.moveEntry(src, isDir ? node.path : node.path.split('/').slice(0, -1).join('/')); toast.success('Перемещено'); onReload(); } catch (e) { toast.error((e as Error).message); } };
  return <div>
    <div draggable onDragStart={e => e.dataTransfer.setData('text/plain', node.path)} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); move(e.dataTransfer.getData('text/plain')); }}
      title={`URL: /${node.parsed.slug || node.name.replace(/\.md$/, '')}`}
      style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '2px 6px', padding: `7px 8px 7px ${8 + node.depth * 14}px`, borderRadius: 8, background: over ? 'rgba(20,184,166,.14)' : t.surface, border: `1px solid ${over ? t.borderStrong : t.border}` }}>
      <DragHandle />
      <button onClick={() => setOpen(v => !v)} style={{ border: 0, background: 'transparent', color: t.fgSub }}>{isDir ? (open ? <ChevronDown size={12}/> : <ChevronRight size={12}/>) : null}</button>
      <span style={{ flex: 1, color: t.fg, fontSize: 12 }}>{node.parsed.icon ? `${node.parsed.icon} ` : ''}{node.parsed.title || node.name} <small style={{ color: t.fgSub }}>[{node.parsed.type || (isDir ? 'C' : 'A')}]</small></span>
      {isDir && node.parsed.type === 'N' && <button onClick={() => onCreate(node.path, 'C')} title="+ Категория"><FolderPlus size={13}/></button>}
      {isDir && <button onClick={() => onCreate(node.path, 'A')} title="+ Страница"><FilePlus size={13}/></button>}
      <button onClick={() => onEdit(node)} title="Редактировать"><Edit3 size={13}/></button>
      <button onClick={async () => { if (confirm(`Удалить ${node.name}?`)) { await bridge.deleteFile(node.path); onReload(); } }} title="Удалить"><Trash2 size={13}/></button>
    </div>
    {isDir && open && node.children.map(c => <NavNode key={c.path} node={c} onReload={onReload} onCreate={onCreate} onEdit={onEdit} t={t} />)}
  </div>;
}

function NavTree(props: { tree: NavEntry[]; onReload: () => void; onCreate: (parentPath: string, kind: EntryKind) => void; onEdit: (n: NavEntry) => void; t: TTokens }) {
  return <>{props.tree.map(n => <NavNode key={n.path} node={n} onReload={props.onReload} onCreate={props.onCreate} onEdit={props.onEdit} t={props.t} />)}</>;
}

export default function NavPanel() {
  const t = useContext(ThemeTokensContext);
  const [tree, setTree] = useState<NavEntry[]>([]);
  const [modal, setModal] = useState<{ parentPath: string; kind: EntryKind; existing?: NavEntry } | null>(null);
  const load = useCallback(async () => { try { const r = await bridge.readNavStructure(); setTree(r.tree as NavEntry[]); } catch (e) { toast.error((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  return <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: t.bg, position: 'relative' }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, borderBottom: `1px solid ${t.border}`, background: t.surface }}>
      <Map size={14}/><strong style={{ color: t.fg, fontSize: 12, flex: 1 }}>Навигация Docs/</strong>
      <button onClick={() => setModal({ parentPath: 'Docs', kind: 'N' })}><Plus size={13}/> Секция</button>
      <button onClick={load}><RefreshCw size={13}/></button>
    </div>
    <div className="adm-scroll" style={{ flex: 1, overflow: 'auto', padding: '8px 4px' }}><NavTree tree={tree} onReload={load} onCreate={(parentPath, kind) => setModal({ parentPath, kind })} onEdit={existing => setModal({ parentPath: existing.path.split('/').slice(0, -1).join('/'), kind: (existing.parsed.type || (existing.type === 'dir' ? 'C' : 'A')) as EntryKind, existing })} t={t} /></div>
    {modal && <CreateEntryModal {...modal} onClose={() => setModal(null)} onDone={load} t={t} />}
  </div>;
}
