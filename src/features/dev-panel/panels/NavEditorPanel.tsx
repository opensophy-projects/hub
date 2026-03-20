/**
 * NavEditorPanel v2 — редактор навигации
 * - Дерево Docs/ с раскрытием/схлопыванием
 * - Создание [N] [C] [A] через модальное окно
 * - Переименование через двойной клик
 * - Удаление с подтверждением
 * - Auto-generate после изменений
 */

import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import {
  T, Btn, ConfirmDialog, EmptyState, ScrollArea, StatusBar,
  Input, Field, Badge,
} from '../components/ui';
import {
  FolderOpen, Folder, FileText, Plus, Trash2,
  ChevronRight, ChevronDown, RefreshCw, FolderPlus,
  FilePlus, Edit3, Check, X, Loader2, AlertCircle,
} from 'lucide-react';

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

// ─── Name parsing ─────────────────────────────────────────────────────────────

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

  // First pass — create nodes
  flat.forEach(e => {
    byPath.set(e.path, {
      ...e,
      children: [],
      parsed: parseName(e.name),
    });
  });

  // Second pass — build hierarchy
  flat.forEach(e => {
    const node = byPath.get(e.path)!;
    const parentPath = e.path.split('/').slice(0, -1).join('/');
    const parent = byPath.get(parentPath);
    if (parent) parent.children.push(node);
    else tree.push(node);
  });

  return tree;
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateConfig {
  parentPath: string;
  entryType: 'N' | 'C' | 'A';
}

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

function CreateModal({
  config,
  onClose,
  onCreated,
}: {
  config: CreateConfig;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle]   = useState('');
  const [slug, setSlug]     = useState('');
  const [icon, setIcon]     = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const handleTitle = (v: string) => {
    setTitle(v);
    if (autoSlug) setSlug(slugify(v));
  };

  const typeLabels = { N: 'Nav Popover [N]', C: 'Категория [C]', A: 'Статья [A]' };
  const defaultIcons: Record<string, string> = { N: 'book', C: 'folder', A: 'file-text' };

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic = (icon.trim() || defaultIcons[config.entryType]);
      const iconPart = ic ? `[${ic}]` : '';
      const slugPart = slug.trim() ? `{${slug.trim()}}` : '';
      const entryName = `[${config.entryType}]${iconPart}${title.trim()}${slugPart}`;

      if (config.entryType === 'A') {
        // Markdown file
        const filePath = `${config.parentPath}/${entryName}.md`;
        const date = new Date().toISOString().split('T')[0];
        const content = [
          '---',
          `title: "${title.trim()}"`,
          'description: ',
          'author: ',
          `date: ${date}`,
          'tags: ',
          'robots: index, follow',
          'lang: ru',
          '---',
          '',
          `# ${title.trim()}`,
          '',
          'Начните писать здесь...',
          '',
        ].join('\n');
        await bridge.writeFile(filePath, content);
        toast.success(`Статья "${title.trim()}" создана`);
      } else {
        // Directory — write .gitkeep placeholder
        const dirPath = `${config.parentPath}/${entryName}`;
        await bridge.writeFile(`${dirPath}/.gitkeep`, '');
        toast.success(`${config.entryType === 'N' ? 'Nav popover' : 'Категория'} "${title.trim()}" создана`);
      }

      await bridge.runGenerate();
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') create();
    if (e.key === 'Escape') onClose();
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
          borderRadius: 12, width: 380, padding: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          fontFamily: T.mono,
          animation: 'devFadeIn 0.18s ease',
        }}
        onKeyDown={handleKey}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Badge type={config.entryType} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>
            Создать: {typeLabels[config.entryType]}
          </span>
        </div>

        <Field label="Название *">
          <input
            ref={inputRef}
            value={title}
            onChange={e => handleTitle(e.target.value)}
            placeholder={config.entryType === 'A' ? 'Название статьи' : 'Название раздела'}
            style={{
              width: '100%', padding: '7px 9px',
              borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.bgHov, color: T.fg, fontSize: 12,
              outline: 'none', boxSizing: 'border-box', fontFamily: T.mono,
            }}
          />
        </Field>

        <Field label="URL Slug">
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setAutoSlug(false); }}
              placeholder="my-page-slug"
              style={{
                flex: 1, padding: '7px 9px',
                borderRadius: 6, border: `1px solid ${T.border}`,
                background: T.bgHov, color: T.fg, fontSize: 12,
                outline: 'none', fontFamily: T.mono,
              }}
            />
            <button
              onClick={() => { setAutoSlug(true); setSlug(slugify(title)); }}
              style={{
                padding: '5px 10px', borderRadius: 5,
                border: `1px solid ${T.border}`, background: T.bgHov,
                color: T.fgMuted, fontSize: 10, cursor: 'pointer', fontFamily: T.mono,
              }}
            >
              ↺ авто
            </button>
          </div>
          {slug && (
            <div style={{ fontSize: 10, color: T.fgSub, marginTop: 3, fontFamily: T.mono }}>
              URL: .../{slug}
            </div>
          )}
        </Field>

        <Field label="Иконка (Lucide)" hint="lucide.dev/icons — book-open, shield, zap, code-2...">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder={defaultIcons[config.entryType]}
            style={{
              width: '100%', padding: '7px 9px',
              borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.bgHov, color: T.fg, fontSize: 12,
              outline: 'none', boxSizing: 'border-box', fontFamily: T.mono,
            }}
          />
        </Field>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <Btn fullWidth onClick={onClose}>Отмена</Btn>
          <Btn
            variant="accent"
            fullWidth
            loading={saving}
            onClick={create}
            style={{ fontWeight: 700 }}
          >
            Создать
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────

function TreeNode({
  entry,
  onCreateChild,
  onDelete,
  onSelect,
  selectedPath,
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
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => {
          if (isDir) setExpanded(v => !v);
          else onSelect(entry.path);
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: `4px 8px 4px ${10 + entry.depth * 14}px`,
          borderRadius: 5, cursor: 'pointer',
          background: isActive ? T.accentSoft : hov ? T.bgHov : 'transparent',
          userSelect: 'none',
        }}
      >
        {/* Expand toggle */}
        {isDir ? (
          expanded
            ? <ChevronDown size={11} style={{ color: T.fgSub, flexShrink: 0 }} />
            : <ChevronRight size={11} style={{ color: T.fgSub, flexShrink: 0 }} />
        ) : (
          <span style={{ width: 11, flexShrink: 0 }} />
        )}

        {/* File/folder icon */}
        {isDir
          ? (expanded
              ? <FolderOpen size={12} style={{ color: entryColor, flexShrink: 0 }} />
              : <Folder     size={12} style={{ color: entryColor, flexShrink: 0 }} />)
          : <FileText size={12} style={{ color: T.fgSub, flexShrink: 0 }} />
        }

        {/* Badge */}
        {p.type && <Badge type={p.type} />}

        {/* Icon name */}
        {p.icon && (
          <span style={{ fontSize: 9, color: T.fgSub, flexShrink: 0 }}>⬡{p.icon}</span>
        )}

        {/* Title */}
        <span style={{
          fontSize: 12, color: isActive ? T.accent : T.fg,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {p.title || entry.name}
        </span>

        {/* Slug */}
        {p.slug && hov && (
          <span style={{ fontSize: 9, color: T.fgSub, fontFamily: T.mono, flexShrink: 0 }}>
            /{p.slug}
          </span>
        )}

        {/* Action buttons on hover */}
        {hov && (
          <div
            style={{ display: 'flex', gap: 2, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Create child buttons */}
            {isDir && p.type === 'N' && (
              <ActionIconBtn
                icon={<FolderPlus size={10}/>}
                title="Добавить категорию [C]"
                onClick={() => onCreateChild({ parentPath: entry.path, entryType: 'C' })}
              />
            )}
            {isDir && (p.type === 'N' || p.type === 'C') && (
              <ActionIconBtn
                icon={<FilePlus size={10}/>}
                title="Добавить статью [A]"
                onClick={() => onCreateChild({ parentPath: entry.path, entryType: 'A' })}
              />
            )}
            {/* Delete */}
            <ActionIconBtn
              icon={<Trash2 size={10}/>}
              title="Удалить"
              danger
              onClick={() => onDelete(entry)}
            />
          </div>
        )}
      </div>

      {/* Children */}
      {isDir && expanded && entry.children.length > 0 && (
        <div style={{ borderLeft: `1px solid ${T.border}`, marginLeft: 10 + entry.depth * 14 + 5 }}>
          {entry.children.map(child => (
            <TreeNode
              key={child.path}
              entry={child}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionIconBtn({
  icon, title, onClick, danger,
}: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 20, height: 20, borderRadius: 4,
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? (danger ? T.dangerSoft : T.bgActive) : 'transparent',
        color: hov ? (danger ? T.danger : T.fg) : T.fgSub,
        cursor: 'pointer', transition: 'all 0.1s',
      }}
    >
      {icon}
    </button>
  );
}

// ─── NavEditorPanel ────────────────────────────────────────────────────────────

export default function NavEditorPanel() {
  const [tree, setTree]           = useState<TreeEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGen]      = useState(false);
  const [selectedPath, setSelected] = useState('');
  const [createConfig, setCreate]  = useState<CreateConfig | null>(null);
  const [toDelete, setToDelete]    = useState<TreeEntry | null>(null);

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

  const handleCreated = useCallback(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await bridge.deleteFile(toDelete.path);
      setToDelete(null);
      await load();
      setGen(true);
      await bridge.runGenerate();
      toast.success(`Удалено: ${toDelete.parsed.title || toDelete.name}`);
    } catch (e: any) {
      toast.error(`Ошибка удаления: ${e.message}`);
    } finally {
      setGen(false);
    }
  };

  const fileCount = tree.reduce(function count(acc: number, e: TreeEntry): number {
    return acc + (e.type === 'file' ? 1 : 0) + (e.children ? e.children.reduce(count, 0) : 0);
  }, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 10px', borderBottom: `1px solid ${T.border}`,
        flexShrink: 0, background: T.bgPanel,
      }}>
        <Btn
          icon={<Plus size={11}/>}
          variant="accent"
          size="sm"
          onClick={() => setCreate({ parentPath: 'Docs', entryType: 'N' })}
        >
          Nav Popover
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn
          icon={generating ? <Loader2 size={11} style={{ animation: 'devSpinAnim 1s linear infinite' }}/> : <RefreshCw size={11}/>}
          size="sm"
          loading={generating}
          onClick={async () => {
            setGen(true);
            await load();
            await bridge.runGenerate();
            toast.success('Обновлено');
            setGen(false);
          }}
        >
          Обновить
        </Btn>
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
                onSelect={setSelected}
                selectedPath={selectedPath}
              />
            ))
          )}
        </ScrollArea>
      </div>

      <StatusBar left={`${fileCount} файлов`} right="Docs/" />

      {/* Create modal */}
      {createConfig && (
        <CreateModal
          config={createConfig}
          onClose={() => setCreate(null)}
          onCreated={handleCreated}
        />
      )}

      {/* Delete confirm */}
      {toDelete && (
        <ConfirmDialog
          message={`Удалить "${toDelete.parsed.title || toDelete.name}"? Это действие необратимо.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          danger
        />
      )}
    </div>
  );
}