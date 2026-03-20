/**
 * NavEditorPanel — редактор навигационной структуры
 * Показывает дерево Docs/, позволяет создавать/удалять [N], [C], [A] папки и файлы
 */

import React, { useState, useEffect, useCallback } from 'react';
import { bridge } from '../useDevBridge';
import { T } from '../DevPanel';
import {
  FolderOpen, FileText, Plus, Trash2, ChevronRight, ChevronDown,
  Loader2, RefreshCw, FolderPlus, FilePlus, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Entry {
  type: 'file' | 'dir';
  path: string;
  name: string;
  depth: number;
  children?: Entry[];
}

interface CreateModalState {
  open: boolean;
  parentPath: string;
  entryType: 'N' | 'C' | 'A';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(flat: Entry[]): Entry[] {
  const root: Entry[] = [];
  const map = new Map<string, Entry>();

  flat.forEach(e => {
    map.set(e.path, { ...e, children: e.type === 'dir' ? [] : undefined });
  });

  flat.forEach(e => {
    const node = map.get(e.path)!;
    const parentPath = e.path.split('/').slice(0, -1).join('/');
    const parent = map.get(parentPath);
    if (parent && parent.children) {
      parent.children.push(node);
    } else if (e.depth === 0) {
      root.push(node);
    }
  });

  return root;
}

function parseEntryName(name: string) {
  const typeMatch = name.match(/^\[([NCA])\]/);
  const type = typeMatch?.[1] ?? null;
  const rest = typeMatch ? name.slice(typeMatch[0].length) : name;
  const iconMatch = rest.match(/^\[([^\]]+)\]/);
  const icon = iconMatch?.[1] ?? null;
  const afterIcon = iconMatch ? rest.slice(iconMatch[0].length) : rest;
  const slugMatch = afterIcon.match(/^(.+)\{([^}]+)\}(?:\.md)?$/);
  const title = slugMatch ? slugMatch[1].trim() : afterIcon.replace(/\.md$/, '');
  const slug = slugMatch ? slugMatch[2].trim() : null;
  return { type, icon, title, slug };
}

function EntryLabel({ name, type }: { name: string; type: 'file' | 'dir' }) {
  const parsed = parseEntryName(name);
  const badge = parsed.type ? (
    <span style={{
      fontSize: 9, fontWeight: 700, color: T.accent,
      background: T.accentSoft, borderRadius: 3, padding: '1px 4px',
      letterSpacing: '0.06em',
    }}>
      [{parsed.type}]
    </span>
  ) : null;

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {badge}
      {parsed.icon && (
        <span style={{ fontSize: 10, color: T.fgSub }}>⬡{parsed.icon}</span>
      )}
      <span style={{ fontSize: 12, color: T.fg }}>{parsed.title}</span>
      {parsed.slug && (
        <span style={{ fontSize: 10, color: T.fgSub, fontFamily: 'ui-monospace, monospace' }}>
          /{parsed.slug}
        </span>
      )}
    </span>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function TreeNode({
  entry,
  onDelete,
  onCreateChild,
  onSelectFile,
  selectedPath,
}: {
  entry: Entry;
  onDelete: (path: string, type: 'file' | 'dir') => void;
  onCreateChild: (parentPath: string, type: 'N' | 'C' | 'A') => void;
  onSelectFile: (path: string) => void;
  selectedPath: string;
}) {
  const [expanded, setExpanded] = useState(entry.depth < 1);
  const [hov, setHov] = useState(false);
  const isSelected = entry.path === selectedPath;
  const hasChildren = entry.type === 'dir' && (entry.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `4px 8px 4px ${8 + entry.depth * 14}px`,
          borderRadius: 5,
          background: isSelected ? T.accentSoft : hov ? T.bgHov : 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => {
          if (entry.type === 'dir') setExpanded(e => !e);
          else onSelectFile(entry.path);
        }}
      >
        {entry.type === 'dir' ? (
          expanded ? <ChevronDown size={11} style={{ color: T.fgSub, flexShrink: 0 }} />
                   : <ChevronRight size={11} style={{ color: T.fgSub, flexShrink: 0 }} />
        ) : (
          <span style={{ width: 11, flexShrink: 0 }} />
        )}

        {entry.type === 'dir'
          ? <FolderOpen size={12} style={{ color: T.accent, flexShrink: 0 }} />
          : <FileText size={12} style={{ color: T.fgMuted, flexShrink: 0 }} />
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <EntryLabel name={entry.name} type={entry.type} />
        </div>

        {hov && (
          <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
            {entry.type === 'dir' && (
              <>
                {entry.depth === 0 && (
                  <ActionBtn icon={<FolderPlus size={10} />} title="Категория [C]"
                    onClick={() => onCreateChild(entry.path, 'C')} />
                )}
                <ActionBtn icon={<FilePlus size={10} />} title="Статья [A]"
                  onClick={() => onCreateChild(entry.path, 'A')} />
              </>
            )}
            <ActionBtn
              icon={<Trash2 size={10} />}
              title="Удалить"
              danger
              onClick={() => onDelete(entry.path, entry.type)}
            />
          </div>
        )}
      </div>

      {entry.type === 'dir' && expanded && entry.children?.map(child => (
        <TreeNode
          key={child.path}
          entry={child}
          onDelete={onDelete}
          onCreateChild={onCreateChild}
          onSelectFile={onSelectFile}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger }: {
  icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, borderRadius: 4,
        border: 'none',
        background: hov ? (danger ? T.dangerSoft : T.bgActive) : 'transparent',
        color: hov ? (danger ? T.danger : T.fg) : T.fgSub,
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  state,
  onClose,
  onCreate,
}: {
  state: CreateModalState;
  onClose: () => void;
  onCreate: (path: string, content?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const slugify = (s: string) => s.toLowerCase()
    .replace(/[а-яё]/g, c => ({ а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }[c] ?? c))
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (autoSlug) setSlug(slugify(v));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const iconPart = icon.trim() ? `[${icon.trim()}]` : '';
      const slugPart = slug.trim() ? `{${slug.trim()}}` : '';
      const name = `[${state.entryType}]${iconPart}${title.trim()}${slugPart}`;

      if (state.entryType === 'A') {
        const filePath = `${state.parentPath}/${name}.md`;
        const content = `---\ntitle: "${title.trim()}"\ndescription: \nauthor: \ndate: ${new Date().toISOString().split('T')[0]}\ntags: \nrobots: index, follow\nlang: ru\n---\n\n# ${title.trim()}\n\nНачните писать здесь...\n`;
        await onCreate(filePath, content);
      } else {
        // Директория — создаём .gitkeep
        const dirPath = `${state.parentPath}/${name}`;
        await onCreate(`${dirPath}/.gitkeep`, '');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = { N: 'Nav Popover [N]', C: 'Категория [C]', A: 'Статья [A]' }[state.entryType];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100001,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: T.bgPanel, border: `1px solid ${T.border}`,
        borderRadius: 12, width: 380, padding: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        fontFamily: 'ui-monospace, monospace',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.fg, marginBottom: 16 }}>
          Создать: {typeLabel}
        </div>

        <ModalField label="Название">
          <input
            autoFocus
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Название раздела или страницы"
            style={inputStyle}
          />
        </ModalField>

        <ModalField label="Slug (URL)">
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setAutoSlug(false); }}
              placeholder="my-slug"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => { setAutoSlug(true); setSlug(slugify(title)); }}
              style={{ ...btnStyle, padding: '4px 8px', fontSize: 10 }}
            >
              ↺ авто
            </button>
          </div>
        </ModalField>

        <ModalField label="Иконка (Lucide)">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="book-open, shield, zap..."
            style={inputStyle}
          />
        </ModalField>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...btnStyle, flex: 1 }}>
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || saving}
            style={{
              ...btnStyle, flex: 2,
              background: T.accentSoft, color: T.accent,
              border: `1px solid ${T.accent}44`,
              fontWeight: 700,
            }}
          >
            {saving ? '...' : `Создать`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: T.fgSub, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: 6,
  border: `1px solid ${T.border}`,
  background: T.bgHov,
  color: T.fg,
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'ui-monospace, monospace',
};

const btnStyle: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 6,
  border: `1px solid ${T.border}`,
  background: T.bgHov,
  color: T.fgMuted,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'ui-monospace, monospace',
};

// ─── NavEditorPanel ───────────────────────────────────────────────────────────

export default function NavEditorPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [createModal, setCreateModal] = useState<CreateModalState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { entries: flat } = await bridge.listDocs();
      setEntries(buildTree(flat));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (path: string, type: 'file' | 'dir') => {
    if (deleteConfirm !== path) {
      setDeleteConfirm(path);
      return;
    }
    try {
      await bridge.deleteFile(path);
      await load();
      await bridge.runGenerate();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreate = async (filePath: string, content?: string) => {
    await bridge.writeFile(filePath, content ?? '');
    await load();
    await bridge.runGenerate();
  };

  const treeEntries = entries;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: 10, color: T.fgSub }}>Структура Docs/</span>
        <button
          onClick={() => setCreateModal({ open: true, parentPath: 'Docs', entryType: 'N' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 9px', borderRadius: 5,
            border: `1px solid ${T.accent}44`,
            background: T.accentSoft, color: T.accent,
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={11} /> Nav Popover
        </button>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', padding: '5px',
            border: `1px solid ${T.border}`, borderRadius: 5,
            background: T.bgHov, color: T.fgMuted, cursor: 'pointer',
          }}
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px', scrollbarWidth: 'thin' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: T.fgSub, fontSize: 12 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Загрузка...
          </div>
        ) : error ? (
          <div style={{ padding: 16, color: T.danger, fontSize: 11, display: 'flex', gap: 6 }}>
            <AlertCircle size={13} /> {error}
          </div>
        ) : treeEntries.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.fgSub, fontSize: 12 }}>
            Папка Docs/ пуста
          </div>
        ) : (
          treeEntries.map(e => (
            <TreeNode
              key={e.path}
              entry={e}
              onDelete={handleDelete}
              onCreateChild={(parentPath, type) =>
                setCreateModal({ open: true, parentPath, entryType: type })
              }
              onSelectFile={setSelectedPath}
              selectedPath={selectedPath}
            />
          ))
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{
          padding: '10px 12px', background: T.dangerSoft,
          borderTop: `1px solid ${T.danger}33`,
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <AlertCircle size={12} style={{ color: T.danger }} />
          <span style={{ flex: 1, fontSize: 11, color: T.danger }}>Кликни ещё раз чтобы удалить</span>
          <button
            onClick={() => setDeleteConfirm(null)}
            style={{ fontSize: 11, color: T.fgMuted, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Отмена
          </button>
        </div>
      )}

      {createModal && (
        <CreateModal
          state={createModal}
          onClose={() => setCreateModal(null)}
          onCreate={handleCreate}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}