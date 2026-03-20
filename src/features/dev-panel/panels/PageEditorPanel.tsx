/**
 * PageEditorPanel — полноценный редактор страниц
 * Два режима: split (редактор + preview) и fullscreen preview
 * Поддержка frontmatter через GUI форму
 */

import React, {
  useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense,
} from 'react';
import { bridge } from '../useDevBridge';
import { T } from '../DevPanel';
import { marked } from 'marked';
import {
  FileText, Save, Eye, EyeOff, Columns, RefreshCw,
  Plus, Loader2, ChevronDown, ChevronRight, AlertCircle,
  Maximize2, Minimize2,
} from 'lucide-react';

// ─── Markdown preview ──────────────────────────────────────────────────────────

marked.setOptions({ breaks: true, gfm: true });

function renderPreview(md: string): string {
  try {
    return marked(md) as string;
  } catch {
    return '<p style="color:red">Ошибка парсинга</p>';
  }
}

// ─── Frontmatter parser/serializer ────────────────────────────────────────────

interface FrontmatterData {
  title: string;
  description: string;
  author: string;
  date: string;
  updated: string;
  tags: string;
  lang: string;
  icon: string;
  robots: string;
}

const EMPTY_FM: FrontmatterData = {
  title: '', description: '', author: '', date: '',
  updated: '', tags: '', lang: 'ru', icon: '', robots: 'index, follow',
};

function parseFrontmatter(raw: string): { fm: FrontmatterData; body: string } {
  if (!raw.startsWith('---\n')) return { fm: EMPTY_FM, body: raw };
  const closeIdx = raw.indexOf('\n---\n', 4);
  if (closeIdx === -1) return { fm: EMPTY_FM, body: raw };

  const fmBlock = raw.slice(4, closeIdx);
  const body = raw.slice(closeIdx + 5);
  const fm = { ...EMPTY_FM };

  fmBlock.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 1) return;
    const key = line.slice(0, colonIdx).trim() as keyof FrontmatterData;
    const val = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key in fm) (fm as Record<string, string>)[key] = val;
  });

  return { fm, body };
}

function serializeFrontmatter(fm: FrontmatterData, body: string): string {
  const lines = Object.entries(fm)
    .filter(([_, v]) => v !== '')
    .map(([k, v]) => `${k}: ${v.includes(':') || v.includes('"') ? `"${v}"` : v}`);
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ─── Docs file picker ─────────────────────────────────────────────────────────

interface DocEntry { path: string; name: string; depth: number; type: 'file' | 'dir'; }

function FilePicker({ onSelect }: { onSelect: (path: string) => void }) {
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    bridge.listDocs().then(({ entries }) => {
      setEntries(entries.filter(e => e.type === 'file'));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? entries.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()) || e.path.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
        <input
          type="text"
          placeholder="Поиск файла..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: '100%', padding: '6px 8px', borderRadius: 5,
            border: `1px solid ${T.border}`, background: T.bgHov,
            color: T.fg, fontSize: 11, outline: 'none',
            boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.fgSub, fontSize: 12 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.map(e => (
          <button
            key={e.path}
            onClick={() => onSelect(e.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              width: '100%', padding: `6px 10px 6px ${10 + e.depth * 10}px`,
              border: 'none', background: 'transparent',
              color: T.fg, cursor: 'pointer', textAlign: 'left',
              fontSize: 11, fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <FileText size={11} style={{ color: T.fgMuted, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.name.replace(/\.md$/, '')}
            </span>
          </button>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Frontmatter Form ─────────────────────────────────────────────────────────

function FrontmatterForm({ fm, onChange }: { fm: FrontmatterData; onChange: (fm: FrontmatterData) => void }) {
  const [open, setOpen] = useState(true);
  const set = (key: keyof FrontmatterData, val: string) => onChange({ ...fm, [key]: val });

  const fields: Array<{ key: keyof FrontmatterData; label: string; placeholder?: string }> = [
    { key: 'title', label: 'Title', placeholder: 'Название страницы' },
    { key: 'description', label: 'Description', placeholder: 'Краткое описание...' },
    { key: 'author', label: 'Author', placeholder: 'veilosophy' },
    { key: 'date', label: 'Date', placeholder: '2026-01-01' },
    { key: 'updated', label: 'Updated', placeholder: '2026-03-20' },
    { key: 'tags', label: 'Tags', placeholder: 'тег1, тег2, тег3' },
    { key: 'icon', label: 'Icon', placeholder: 'book-open, shield...' },
    { key: 'lang', label: 'Lang', placeholder: 'ru' },
    { key: 'robots', label: 'Robots', placeholder: 'index, follow' },
  ];

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', border: 'none', background: T.bgPanel,
          color: T.fgMuted, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Frontmatter
      </button>
      {open && (
        <div style={{ padding: '4px 0 8px' }}>
          {fields.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px' }}>
              <span style={{ width: 80, fontSize: 10, color: T.fgSub, flexShrink: 0, fontFamily: 'ui-monospace, monospace' }}>
                {f.label}
              </span>
              <input
                type={f.key === 'date' || f.key === 'updated' ? 'date' : 'text'}
                value={fm[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{
                  flex: 1, padding: '3px 6px', borderRadius: 4,
                  border: `1px solid ${T.border}`,
                  background: T.bgHov, color: T.fg, fontSize: 11,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PageEditorPanel ──────────────────────────────────────────────────────────

type ViewMode = 'split' | 'editor' | 'preview';

export default function PageEditorPanel() {
  const [view, setView] = useState<'picker' | 'editor'>('picker');
  const [filePath, setFilePath] = useState('');
  const [fm, setFm] = useState<FrontmatterData>(EMPTY_FM);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const preview = useMemo(() => renderPreview(body), [body]);

  const openFile = useCallback(async (path: string) => {
    setLoading(true);
    setError('');
    try {
      const { content } = await bridge.readFile(path);
      const { fm: parsedFm, body: parsedBody } = parseFrontmatter(content);
      setFilePath(path);
      setFm(parsedFm);
      setBody(parsedBody);
      setView('editor');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!filePath) return;
    setSaving(true);
    setError('');
    try {
      const content = serializeFrontmatter(fm, body);
      await bridge.writeFile(filePath, content);
      await bridge.runGenerate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [filePath, fm, body]);

  // Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && view === 'editor') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, view]);

  // Tab in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newVal = body.slice(0, start) + '  ' + body.slice(end);
      setBody(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  if (view === 'picker') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: T.fgSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Выберите файл для редактирования
          </span>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.fgSub }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <FilePicker onSelect={openFile} />
        )}
        {error && (
          <div style={{ padding: '8px 12px', color: T.danger, fontSize: 11, flexShrink: 0 }}>
            <AlertCircle size={11} /> {error}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Editor view
  const fileName = filePath.split('/').pop() ?? '';

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      ...(fullscreen ? {
        position: 'fixed', inset: 0, zIndex: 100000,
        background: T.bg,
      } : {}),
    }}>
      {/* Editor toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderBottom: `1px solid ${T.border}`,
        background: T.bgPanel, flexShrink: 0, flexWrap: 'nowrap',
      }}>
        <button
          onClick={() => setView('picker')}
          style={{ ...toolBtn, paddingLeft: 6 }}
        >
          ← Файлы
        </button>
        <span style={{ fontSize: 10, color: T.fgSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {fileName}
        </span>

        {/* View mode */}
        {(['editor', 'split', 'preview'] as ViewMode[]).map(mode => {
          const icons = { editor: <FileText size={11}/>, split: <Columns size={11}/>, preview: <Eye size={11}/> };
          const labels = { editor: 'MD', split: '||', preview: 'Preview' };
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                ...toolBtn,
                background: viewMode === mode ? T.accentSoft : undefined,
                color: viewMode === mode ? T.accent : undefined,
                border: viewMode === mode ? `1px solid ${T.accent}44` : toolBtn.border,
              }}
            >
              {icons[mode]}
            </button>
          );
        })}

        <button onClick={() => setFullscreen(f => !f)} style={toolBtn}>
          {fullscreen ? <Minimize2 size={11}/> : <Maximize2 size={11}/>}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...toolBtn,
            background: saved ? 'rgba(34,197,94,0.12)' : T.accentSoft,
            color: saved ? T.success : T.accent,
            border: `1px solid ${saved ? T.success + '44' : T.accent + '44'}`,
            fontWeight: 700, minWidth: 70,
          }}
        >
          {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={11}/>}
          {saved ? 'OK' : 'Сохранить'}
        </button>
      </div>

      {/* Frontmatter form */}
      <FrontmatterForm fm={fm} onChange={setFm} />

      {/* Split editor */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Markdown editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            borderRight: viewMode === 'split' ? `1px solid ${T.border}` : 'none',
            minWidth: 0,
          }}>
            <div style={{ padding: '4px 10px', fontSize: 9, color: T.fgSub, borderBottom: `1px solid ${T.border}44`, background: T.bgPanel }}>
              MARKDOWN
            </div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                flex: 1, padding: '12px 14px',
                border: 'none', background: T.bgHov,
                color: T.fg, fontSize: 12,
                fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                lineHeight: 1.7, resize: 'none', outline: 'none',
                scrollbarWidth: 'thin',
              }}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ padding: '4px 10px', fontSize: 9, color: T.fgSub, borderBottom: `1px solid ${T.border}44`, background: T.bgPanel }}>
              PREVIEW
            </div>
            <div
              className="prose max-w-none"
              style={{
                flex: 1, overflowY: 'auto', padding: '12px 16px',
                fontSize: 13, lineHeight: 1.7,
                color: T.fg, scrollbarWidth: 'thin',
                background: T.bg,
              }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '6px 12px', color: T.danger, fontSize: 11,
          background: T.dangerSoft, borderTop: `1px solid ${T.danger}33`,
          flexShrink: 0,
        }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}

      <div style={{ padding: '4px 12px', borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.bgPanel }}>
        <span style={{ fontSize: 9, color: T.fgSub }}>
          Ctrl+S — сохранить · {body.split(/\s+/).filter(Boolean).length} слов · {body.length} символов
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const toolBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '4px 8px', borderRadius: 5,
  border: `1px solid ${T.border}`,
  background: 'transparent', color: T.fgMuted,
  fontSize: 11, cursor: 'pointer',
  whiteSpace: 'nowrap', fontFamily: 'inherit',
};