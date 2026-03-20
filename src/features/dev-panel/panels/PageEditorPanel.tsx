/**
 * PageEditorPanel v3
 * - Fullscreen режим (на весь экран через портал)
 * - Корректный парсинг frontmatter включая icon, updated и все поля
 * - Preview рендерит все markdown блоки через marked
 * - Split / Editor / Preview режимы
 * - Syntax toolbar
 * - Ctrl+S сохранение
 */

import React, {
  useState, useCallback, useEffect, useRef, useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import { T, Btn, ScrollArea, EmptyState, StatusBar, Field } from '../components/ui';
import { marked } from 'marked';
import {
  FileText, Save, Eye, Columns, Maximize2, Minimize2,
  Search, Loader2, Bold, Italic, Code, Link, Hash, List,
  FileSearch, X, ChevronDown, ChevronRight,
} from 'lucide-react';

marked.setOptions({ breaks: true, gfm: true });

// ─── Frontmatter ──────────────────────────────────────────────────────────────

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
  date: '', updated: '', tags: '',
  icon: '', lang: 'ru', robots: 'index, follow',
};

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
    // Value: strip quotes, handle values with colons (e.g. URLs)
    const v = line.slice(ci + 1).trim().replace(/^["']|["']$/g, '');
    if (k in fm) (fm as any)[k] = v;
  }
  return { fm, body };
}

function serializeFM(fm: FM, body: string): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(fm) as [keyof FM, string][]) {
    if (!v) continue;
    // Quote values that contain colons or special chars
    const needsQuote = /[:#\[\]{}&*!|>'",%@`]/.test(v) || v.startsWith(' ') || v.endsWith(' ');
    lines.push(`${k}: ${needsQuote ? `"${v.replace(/"/g, '\\"')}"` : v}`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ─── File picker ──────────────────────────────────────────────────────────────

interface DocFile { path: string; name: string; depth: number; }

function FilePicker({ onSelect }: { onSelect: (path: string) => void }) {
  const [files, setFiles]     = useState<DocFile[]>([]);
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bridge.listDocs()
      .then(({ entries }) => setFiles(entries.filter(e => e.type === 'file') as DocFile[]))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? files.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase()) ||
        f.path.toLowerCase().includes(filter.toLowerCase()))
    : files;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{
            position: 'absolute', left: 8, top: '50%',
            transform: 'translateY(-50%)', color: T.fgSub, pointerEvents: 'none',
          }} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Поиск файла..."
            autoFocus
            style={{
              width: '100%', padding: '6px 8px 6px 26px',
              borderRadius: 5, border: `1px solid ${T.border}`,
              background: T.bgHov, color: T.fg, fontSize: 11,
              outline: 'none', boxSizing: 'border-box' as const, fontFamily: T.mono,
            }}
          />
        </div>
      </div>
      <ScrollArea style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.fgSub, fontSize: 11 }}>
            <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FileSearch size={24}/>} title="Файлы не найдены" />
        ) : filtered.map(f => (
          <button
            key={f.path}
            onClick={() => onSelect(f.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: `6px 10px 6px ${10 + f.depth * 10}px`,
              border: 'none', background: 'transparent',
              color: T.fg, cursor: 'pointer', textAlign: 'left', fontSize: 11,
              fontFamily: T.mono,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <FileText size={11} style={{ color: T.fgSub, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {f.name.replace(/\.md$/, '')}
            </span>
          </button>
        ))}
      </ScrollArea>
      <StatusBar left={`${filtered.length} файлов`} />
    </div>
  );
}

// ─── Frontmatter Form ─────────────────────────────────────────────────────────

function FmForm({ fm, onChange }: { fm: FM; onChange: (fm: FM) => void }) {
  const [open, setOpen] = useState(true);
  const set = (k: keyof FM, v: string) => onChange({ ...fm, [k]: v });

  const fields: Array<{ key: keyof FM; label: string; span?: boolean; type?: string }> = [
    { key: 'title',       label: 'Title *',     span: true },
    { key: 'description', label: 'Description', span: true },
    { key: 'author',      label: 'Author' },
    { key: 'date',        label: 'Date',        type: 'date' },
    { key: 'updated',     label: 'Updated',     type: 'date' },
    { key: 'tags',        label: 'Tags',        span: true },
    { key: 'icon',        label: 'Icon (lucide)' },
    { key: 'lang',        label: 'Lang' },
    { key: 'robots',      label: 'Robots' },
  ];

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 10px', border: 'none', background: T.bgPanel,
          color: T.fgSub, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: 'pointer', textAlign: 'left', fontFamily: T.mono,
        }}
      >
        {open ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
        Frontmatter
        {fm.title && (
          <span style={{ marginLeft: 6, fontSize: 9, color: T.fgSub, fontWeight: 400 }}>
            — {fm.title.slice(0, 30)}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '4px 8px', padding: '6px 10px 8px',
        }}>
          {fields.map(f => (
            <div key={f.key} style={{ gridColumn: f.span ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: 9, color: T.fgSub, marginBottom: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {f.label}
              </div>
              <input
                type={f.type ?? 'text'}
                value={fm[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.key === 'icon' ? 'shield, zap, file-text...' : undefined}
                style={{
                  width: '100%', padding: '4px 6px',
                  borderRadius: 4, border: `1px solid ${T.border}`,
                  background: T.bgHov, color: T.fg, fontSize: 10,
                  outline: 'none', fontFamily: T.mono, boxSizing: 'border-box' as const,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Syntax toolbar ────────────────────────────────────────────────────────────

function SyntaxToolbar({ onInsert }: { onInsert: (before: string, after?: string) => void }) {
  const buttons = [
    { icon: <Bold size={12}/>,   label: 'Жирный',  before: '**', after: '**'  },
    { icon: <Italic size={12}/>, label: 'Курсив',  before: '_',  after: '_'   },
    { icon: <Code size={12}/>,   label: 'Код',     before: '`',  after: '`'   },
    { icon: <Hash size={12}/>,   label: 'H2',      before: '\n## ', after: '' },
    { icon: <List size={12}/>,   label: 'Список',  before: '\n- ', after: '' },
    { icon: <Link size={12}/>,   label: 'Ссылка',  before: '[', after: '](url)' },
  ];

  return (
    <div style={{
      display: 'flex', gap: 2, padding: '4px 8px',
      borderBottom: `1px solid ${T.border}`,
      flexShrink: 0, background: T.bgPanel,
    }}>
      {buttons.map(btn => (
        <button
          key={btn.label}
          title={btn.label}
          onClick={() => onInsert(btn.before, btn.after)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 22, borderRadius: 4,
            border: 'none', background: 'transparent',
            color: T.fgMuted, cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = T.bgHov;
            (e.currentTarget as HTMLButtonElement).style.color = T.fg;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted;
          }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}

// ─── Preview styles injected once ────────────────────────────────────────────

const PREVIEW_CSS = `
  .dev-preview { font-size: 13px; color: rgba(255,255,255,0.82); line-height: 1.7; font-family: system-ui, sans-serif; }
  .dev-preview h1,.dev-preview h2,.dev-preview h3,.dev-preview h4 { color: rgba(255,255,255,0.95); margin-top:1.4em; margin-bottom:.5em; line-height:1.3; }
  .dev-preview h1 { font-size:1.7em; font-weight:700; }
  .dev-preview h2 { font-size:1.35em; font-weight:700; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:.3em; }
  .dev-preview h3 { font-size:1.1em; font-weight:700; }
  .dev-preview h4 { font-size:1em; font-weight:600; }
  .dev-preview p { margin:.7em 0; }
  .dev-preview code { background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; font-family:ui-monospace,monospace; font-size:.85em; }
  .dev-preview pre { background:#080810; padding:12px 14px; border-radius:8px; overflow-x:auto; margin:1em 0; }
  .dev-preview pre code { background:none; padding:0; font-size:.88em; }
  .dev-preview blockquote { border-left:3px solid rgba(124,92,252,0.6); padding:.2em .8em; color:rgba(255,255,255,.6); margin:.8em 0; background:rgba(124,92,252,0.06); border-radius:0 6px 6px 0; }
  .dev-preview ul,.dev-preview ol { padding-left:1.4em; margin:.5em 0; }
  .dev-preview li { margin:.25em 0; }
  .dev-preview a { color:#7c5cfc; }
  .dev-preview hr { border:none; border-top:1px solid rgba(255,255,255,0.1); margin:1.5em 0; }
  .dev-preview table { border-collapse:collapse; width:100%; margin:.8em 0; }
  .dev-preview td,.dev-preview th { border:1px solid rgba(255,255,255,0.1); padding:6px 10px; font-size:.9em; }
  .dev-preview th { background:rgba(255,255,255,0.06); font-weight:700; }
  .dev-preview strong { color:rgba(255,255,255,.96); font-weight:700; }
  .dev-preview img { max-width:100%; border-radius:6px; margin:.5em 0; }
  .dev-preview del { opacity:.5; text-decoration:line-through; }
`;

// ─── Editor core ──────────────────────────────────────────────────────────────

type ViewMode = 'editor' | 'split' | 'preview';

interface EditorCoreProps {
  filePath: string;
  fm: FM;
  body: string;
  dirty: boolean;
  saving: boolean;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  onFmChange: (fm: FM) => void;
  onBodyChange: (body: string) => void;
  onSave: () => void;
  onBack: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

function EditorCore({
  filePath, fm, body, dirty, saving, viewMode, setViewMode,
  onFmChange, onBodyChange, onSave, onBack, onToggleFullscreen, isFullscreen,
}: EditorCoreProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const bodyOrig = useRef(body);

  const preview = useMemo(() => {
    try { return marked(body) as string; }
    catch { return '<p style="color:#ef4444">Parse error</p>'; }
  }, [body]);

  const wordCount = useMemo(() =>
    body.trim().split(/\s+/).filter(Boolean).length, [body]);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';

  const handleInsert = useCallback((before: string, after = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = body.slice(start, end);
    const newVal = body.slice(0, start) + before + sel + after + body.slice(end);
    onBodyChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd   = start + before.length + sel.length;
    }, 0);
  }, [body, onBodyChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const newVal = body.slice(0, s) + '  ' + body.slice(ta.selectionEnd);
      onBodyChange(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; }, 0);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 8px', borderBottom: `1px solid ${T.border}`,
        background: T.bgPanel, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 7px', borderRadius: 4,
            border: `1px solid ${T.border}`,
            background: 'transparent', color: T.fgMuted,
            fontSize: 10, cursor: 'pointer', fontFamily: T.mono,
          }}
        >
          ← Файлы
        </button>

        <span style={{
          fontSize: 11, color: T.fg, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: T.mono,
        }}>
          {fileName}
          {dirty && <span style={{ color: T.warning, marginLeft: 4 }}>●</span>}
        </span>

        {/* View mode buttons */}
        {(['editor', 'split', 'preview'] as ViewMode[]).map(mode => {
          const icons = {
            editor: <FileText size={11}/>,
            split: <Columns size={11}/>,
            preview: <Eye size={11}/>,
          };
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={mode}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 22, borderRadius: 4,
                border: `1px solid ${active ? T.accent + '55' : T.border}`,
                background: active ? T.accentSoft : 'transparent',
                color: active ? T.accent : T.fgMuted,
                cursor: 'pointer',
              }}
            >
              {icons[mode]}
            </button>
          );
        })}

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Свернуть' : 'На весь экран'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 22, borderRadius: 4,
            border: `1px solid ${T.border}`,
            background: 'transparent', color: T.fgMuted, cursor: 'pointer',
          }}
        >
          {isFullscreen ? <Minimize2 size={11}/> : <Maximize2 size={11}/>}
        </button>

        <Btn
          icon={saving
            ? <Loader2 size={11} style={{ animation: 'devSpinAnim 1s linear infinite' }}/>
            : <Save size={11}/>
          }
          variant={dirty ? 'accent' : 'default'}
          size="sm"
          loading={saving}
          onClick={onSave}
        >
          {saving ? '...' : 'Ctrl+S'}
        </Btn>
      </div>

      {/* Frontmatter */}
      <FmForm fm={fm} onChange={fm => { onFmChange(fm); }} />

      {/* Syntax toolbar */}
      {viewMode !== 'preview' && <SyntaxToolbar onInsert={handleInsert} />}

      {/* Editor/Preview area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Markdown editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
            borderRight: viewMode === 'split' ? `1px solid ${T.border}` : 'none',
          }}>
            <div style={{
              padding: '3px 8px', fontSize: 8, color: T.fgSub,
              borderBottom: `1px solid ${T.border}44`,
              background: T.bgPanel, letterSpacing: '0.08em',
            }}>
              MARKDOWN
            </div>
            <textarea
              ref={taRef}
              value={body}
              onChange={e => onBodyChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                flex: 1, padding: '10px 12px',
                border: 'none', background: T.bgHov,
                color: '#e2e8f0', fontSize: 12,
                fontFamily: T.mono,
                lineHeight: 1.75, resize: 'none', outline: 'none',
                scrollbarWidth: 'thin' as const,
                tabSize: 2,
              }}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{
              padding: '3px 8px', fontSize: 8, color: T.fgSub,
              borderBottom: `1px solid ${T.border}44`,
              background: T.bgPanel, letterSpacing: '0.08em',
            }}>
              PREVIEW
            </div>
            <div
              style={{
                flex: 1, overflowY: 'auto', padding: '10px 14px',
                background: T.bg, scrollbarWidth: 'thin' as const,
              }}
            >
              <style>{PREVIEW_CSS}</style>
              <div
                className="dev-preview"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          </div>
        )}
      </div>

      <StatusBar
        left={`${wordCount} слов · ${body.length} симв`}
        right={dirty ? '● Несохранённые изменения' : '✓ Сохранено'}
      />
    </div>
  );
}

// ─── PageEditorPanel ──────────────────────────────────────────────────────────

export default function PageEditorPanel() {
  const [view, setView]         = useState<'picker' | 'edit'>('picker');
  const [filePath, setPath]     = useState('');
  const [fm, setFm]             = useState<FM>({ ...EMPTY_FM });
  const [body, setBody]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [fullscreen, setFS]     = useState(false);
  const bodyOrig = useRef('');
  const fmOrig   = useRef<FM>({ ...EMPTY_FM });

  const openFile = async (path: string) => {
    setLoading(true);
    try {
      const { content } = await bridge.readFile(path);
      const { fm: parsedFm, body: parsedBody } = parseFM(content);
      setPath(path);
      setFm(parsedFm);
      setBody(parsedBody);
      bodyOrig.current = parsedBody;
      fmOrig.current   = { ...parsedFm };
      setDirty(false);
      setView('edit');
    } catch (e: any) {
      toast.error(`Ошибка открытия: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    setDirty(true);
  };

  const handleFmChange = (newFm: FM) => {
    setFm(newFm);
    setDirty(true);
  };

  const save = useCallback(async () => {
    if (!filePath) return;
    setSaving(true);
    try {
      await bridge.writeFile(filePath, serializeFM(fm, body));
      await bridge.runGenerate();
      bodyOrig.current = body;
      fmOrig.current   = { ...fm };
      setDirty(false);
      toast.success('Сохранено и manifest обновлён');
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [filePath, fm, body]);

  // Ctrl+S globally when in edit mode
  useEffect(() => {
    if (view !== 'edit') return;
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [view, save]);

  // Esc closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFS(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fullscreen]);

  // ── File picker ──────────────────────────────────────────────────────────────
  if (view === 'picker') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '7px 10px', borderBottom: `1px solid ${T.border}`,
          fontSize: 10, color: T.fgSub, textTransform: 'uppercase', letterSpacing: '0.08em',
          background: T.bgPanel,
        }}>
          Выберите файл для редактирования
        </div>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={18} style={{ color: T.accent, animation: 'devSpinAnim 1s linear infinite' }} />
          </div>
        ) : (
          <FilePicker onSelect={openFile} />
        )}
      </div>
    );
  }

  // Shared editor props
  const editorProps: EditorCoreProps = {
    filePath, fm, body, dirty, saving, viewMode,
    setViewMode,
    onFmChange: handleFmChange,
    onBodyChange: handleBodyChange,
    onSave: save,
    onBack: () => setView('picker'),
    onToggleFullscreen: () => setFS(v => !v),
    isFullscreen: fullscreen,
  };

  // ── Fullscreen portal ────────────────────────────────────────────────────────
  if (fullscreen && typeof document !== 'undefined') {
    return (
      <>
        {/* Keep normal panel visible but empty */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.fgSub, fontSize: 12 }}>
          Редактор открыт на весь экран
        </div>

        {createPortal(
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: T.bg,
            display: 'flex', flexDirection: 'column',
            fontFamily: T.mono,
          }}>
            <EditorCore {...editorProps} />
          </div>,
          document.body
        )}
      </>
    );
  }

  // ── Inline editor ────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <EditorCore {...editorProps} />
    </div>
  );
}