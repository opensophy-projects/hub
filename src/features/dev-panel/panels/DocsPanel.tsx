/**
 * DocsPanel v3
 * - Preview рендерит через тот же парсер что и сайт (preprocessMarkdownExtensions + marked)
 * - НЕТ автосохранения — сохранение только Ctrl+S или кнопка
 * - Сайт перезагружается только при сохранении
 * - Split view: редактор слева, live preview справа (обновляется по мере печати)
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
  Loader2, Save, Bold, Italic, Code, Link, Hash, List,
  RefreshCw, Eye, Columns,
} from 'lucide-react';

marked.setOptions({ breaks: true, gfm: true });

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatEntry { type: 'file'|'dir'; path: string; name: string; depth: number; }
interface TreeEntry extends FlatEntry {
  children: TreeEntry[];
  parsed: { type: 'N'|'C'|'A'|null; icon: string|null; title: string; slug: string|null; };
}
interface FM {
  title: string; description: string; author: string; date: string;
  updated: string; tags: string; icon: string; lang: string; robots: string;
}
const EMPTY_FM: FM = {
  title:'', description:'', author:'',
  date: new Date().toISOString().split('T')[0],
  updated:'', tags:'', icon:'', lang:'ru', robots:'index, follow',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRANSLIT: Record<string,string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};
function slugify(s: string) {
  return s.toLowerCase().replace(/[а-яё]/g,c=>TRANSLIT[c]??c)
    .replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
function parseName(name: string) {
  name = name.replace(/\.md$/, '');
  const tm = name.match(/^\[([NCA])\]/);
  const type = tm?.[1] as 'N'|'C'|'A'|null ?? null;
  const rest = tm ? name.slice(tm[0].length) : name;
  const im = rest.match(/^\[([^\]]+)\]/);
  const icon = im?.[1] ?? null;
  const ai = im ? rest.slice(im[0].length) : rest;
  const sm = ai.match(/^(.+?)\{([^}]+)\}$/);
  return { type, icon, title: sm?sm[1].trim():ai.trim(), slug: sm?sm[2].trim():null };
}
function buildTree(flat: FlatEntry[]): TreeEntry[] {
  const m = new Map<string,TreeEntry>();
  const tree: TreeEntry[] = [];
  flat.forEach(e => m.set(e.path, { ...e, children:[], parsed:parseName(e.name) }));
  flat.forEach(e => {
    const node = m.get(e.path)!;
    const parent = m.get(e.path.split('/').slice(0,-1).join('/'));
    if (parent) parent.children.push(node); else tree.push(node);
  });
  return tree;
}
function parseFM(raw: string): { fm: FM; body: string } {
  if (!raw.startsWith('---\n')) return { fm:{...EMPTY_FM}, body:raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { fm:{...EMPTY_FM}, body:raw };
  const fm: FM = {...EMPTY_FM};
  raw.slice(4,end).split('\n').forEach(line => {
    const ci = line.indexOf(':'); if (ci<1) return;
    const k = line.slice(0,ci).trim() as keyof FM;
    const v = line.slice(ci+1).trim().replace(/^["']|["']$/g,'');
    if (k in fm) (fm as any)[k] = v;
  });
  return { fm, body: raw.slice(end+5) };
}
function serializeFM(fm: FM, body: string): string {
  const lines: string[] = [];
  for (const [k,v] of Object.entries(fm) as [keyof FM,string][]) {
    if (!v) continue;
    const q = /[:#\[\]{}&*!|>'",%@`]/.test(v);
    lines.push(`${k}: ${q?`"${v.replace(/"/g,'\\"')}"`:`${v}`}`);
  }
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ─── Markdown renderer with custom blocks ─────────────────────────────────────
// Реализуем те же кастомные блоки что и в docUtils.mjs но на клиенте

function renderCustomBlocks(md: string): string {
  // :::note / :::tip / :::warning / :::caution / :::important
  md = md.replace(/^:::(\w+)\s*\n([\s\S]*?)^:::\s*$/gm, (_, type, content) => {
    const alertTypes = ['note','tip','important','warning','caution'];
    if (alertTypes.includes(type)) {
      const colors: Record<string,string> = {
        note:'#3b82f6', tip:'#22c55e', important:'#a855f7',
        warning:'#f59e0b', caution:'#ef4444',
      };
      const labels: Record<string,string> = {
        note:'Примечание', tip:'Совет', important:'Важно',
        warning:'Предупреждение', caution:'Осторожно',
      };
      const c = colors[type] ?? '#3b82f6';
      return `<div style="border-left:3px solid ${c};padding:0.5em 0.75em;margin:0.8em 0;background:${c}22;border-radius:0 6px 6px 0">
<strong style="color:${c};font-size:0.8em;text-transform:uppercase;letter-spacing:0.06em">${labels[type]}</strong>
<div>${marked(content.trim()) as string}</div></div>\n`;
    }
    return `<div class="custom-block custom-${type}">${marked(content.trim()) as string}</div>\n`;
  });

  // :::details summary
  md = md.replace(/^:::details\s+(.*?)\n([\s\S]*?)^:::\s*$/gm, (_, summary, content) => {
    return `<details><summary>${summary.trim()}</summary><div>${marked(content.trim()) as string}</div></details>\n`;
  });

  // :::cards / :::card
  md = md.replace(/^:::card(?:s)?\s*(?:\[([^\]]*)\])?\s*\n([\s\S]*?)^:::\s*$/gm, (_, params, content) => {
    return `<div style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:1em;margin:0.8em 0;background:rgba(255,255,255,0.03)">${marked(content.trim()) as string}</div>\n`;
  });

  // :::steps
  md = md.replace(/^:::steps\s*\n([\s\S]*?)^:::\s*$/gm, (_, content) => {
    return `<div style="border-left:2px solid rgba(124,92,252,0.5);padding-left:1em;margin:0.8em 0">${marked(content.trim()) as string}</div>\n`;
  });

  return md;
}

function renderMarkdown(raw: string): string {
  try {
    // 1. Remove frontmatter
    let md = raw;
    if (md.startsWith('---\n')) {
      const end = md.indexOf('\n---\n', 4);
      if (end !== -1) md = md.slice(end + 5);
    }
    // 2. Process custom blocks first
    md = renderCustomBlocks(md);
    // 3. Render remaining markdown
    return marked(md) as string;
  } catch {
    return '<p style="color:#ef4444">Ошибка парсинга</p>';
  }
}

// ─── Preview CSS ──────────────────────────────────────────────────────────────

const PREVIEW_CSS = `
  .dp-wrap{font-size:13px;color:rgba(255,255,255,0.85);line-height:1.75;font-family:system-ui,sans-serif;padding:14px;overflow-y:auto;height:100%;box-sizing:border-box}
  .dp-wrap h1,.dp-wrap h2,.dp-wrap h3,.dp-wrap h4{color:rgba(255,255,255,0.96);margin-top:1.3em;margin-bottom:.4em;line-height:1.3}
  .dp-wrap h1{font-size:1.6em;font-weight:700}
  .dp-wrap h2{font-size:1.3em;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:.25em}
  .dp-wrap h3{font-size:1.1em;font-weight:700}
  .dp-wrap p{margin:.6em 0}
  .dp-wrap code{background:rgba(255,255,255,0.09);padding:2px 5px;border-radius:3px;font-family:ui-monospace,monospace;font-size:.85em}
  .dp-wrap pre{background:#080810;padding:10px 12px;border-radius:7px;overflow-x:auto;margin:.8em 0}
  .dp-wrap pre code{background:none;padding:0}
  .dp-wrap blockquote{border-left:3px solid rgba(124,92,252,0.7);padding:.1em .75em;margin:.7em 0;color:rgba(255,255,255,.6);background:rgba(124,92,252,0.06);border-radius:0 5px 5px 0}
  .dp-wrap ul,.dp-wrap ol{padding-left:1.4em;margin:.4em 0}
  .dp-wrap li{margin:.2em 0}
  .dp-wrap a{color:#7c5cfc;text-decoration:underline}
  .dp-wrap hr{border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1.2em 0}
  .dp-wrap table{border-collapse:collapse;width:100%;margin:.7em 0;font-size:.9em}
  .dp-wrap td,.dp-wrap th{border:1px solid rgba(255,255,255,0.12);padding:5px 9px}
  .dp-wrap th{background:rgba(255,255,255,0.07);font-weight:600}
  .dp-wrap strong{color:rgba(255,255,255,.96);font-weight:700}
  .dp-wrap em{font-style:italic}
  .dp-wrap img{max-width:100%;border-radius:5px}
  .dp-wrap del{opacity:.5;text-decoration:line-through}
  .dp-wrap details{border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:.5em;margin:.7em 0}
  .dp-wrap summary{cursor:pointer;font-weight:600;padding:.2em 0}
`;

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateConfig { parentPath: string; entryType: 'N'|'C'|'A'; }

function CreateModal({ config, onClose, onCreated }: {
  config: CreateConfig; onClose: () => void; onCreated: (f?: string) => void;
}) {
  const [title, setTitle]       = useState('');
  const [slug, setSlug]         = useState('');
  const [icon, setIcon]         = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [fm, setFm]             = useState<FM>({...EMPTY_FM});
  const [saving, setSaving]     = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 50); }, []);

  const handleTitle = (v: string) => {
    setTitle(v); setFm(p=>({...p,title:v}));
    if (autoSlug) setSlug(slugify(v));
  };
  const isA = config.entryType === 'A';
  const defIco: Record<string,string> = { N:'book', C:'folder', A:'file-text' };
  const labels = { N:'Nav Popover [N]', C:'Категория [C]', A:'Статья [A]' };

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic   = icon.trim() || defIco[config.entryType];
      const name = `[${config.entryType}][${ic}]${title.trim()}${slug.trim()?`{${slug}}`:''}`;
      if (isA) {
        const fp = `${config.parentPath}/${name}.md`;
        await bridge.writeFile(fp, serializeFM({...fm,title:title.trim()},
          `# ${title.trim()}\n\nНачните писать здесь...\n`));
        toast.success(`Статья создана`);
        onCreated(fp);
      } else {
        await bridge.mkdir(`${config.parentPath}/${name}`);
        toast.success(`Создано`);
        onCreated();
      }
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = {
    width:'100%', padding:'6px 8px', borderRadius:5,
    border:`1px solid ${T.border}`, background:T.bgHov, color:T.fg,
    fontSize:11, outline:'none', boxSizing:'border-box' as const, fontFamily:T.mono,
  };
  const lbl: React.CSSProperties = {
    fontSize:9, color:T.fgSub, textTransform:'uppercase' as const,
    letterSpacing:'0.07em', marginBottom:3, display:'block',
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:100010,background:'rgba(0,0,0,0.8)',
      display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgPanel,border:`1px solid ${T.borderHov}`,borderRadius:12,
        width:isA?480:360,maxHeight:'90vh',overflowY:'auto',padding:20,
        boxShadow:'0 24px 64px rgba(0,0,0,0.7)',fontFamily:T.mono}}
        onKeyDown={e=>{if(e.key==='Enter'&&!isA)create();if(e.key==='Escape')onClose();}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <Badge type={config.entryType}/>
          <span style={{fontSize:13,fontWeight:700,color:T.fg}}>Создать: {labels[config.entryType]}</span>
        </div>
        <div style={{marginBottom:10}}>
          <label style={lbl}>Название *</label>
          <input ref={ref} value={title} onChange={e=>handleTitle(e.target.value)}
            placeholder={isA?'Название статьи':'Название раздела'} style={inp}/>
        </div>
        <div style={{marginBottom:10}}>
          <label style={lbl}>URL Slug</label>
          <div style={{display:'flex',gap:6}}>
            <input value={slug} onChange={e=>{setSlug(e.target.value);setAutoSlug(false);}}
              placeholder="my-page-slug" style={{...inp,flex:1}}/>
            <button onClick={()=>{setAutoSlug(true);setSlug(slugify(title));}}
              style={{padding:'5px 8px',borderRadius:5,border:`1px solid ${T.border}`,
                background:T.bgHov,color:T.fgMuted,fontSize:10,cursor:'pointer',fontFamily:T.mono}}>↺</button>
          </div>
        </div>
        <div style={{marginBottom:isA?16:10}}>
          <label style={lbl}>Иконка (lucide.dev)</label>
          <input value={icon} onChange={e=>setIcon(e.target.value)}
            placeholder={defIco[config.entryType]} style={inp}/>
        </div>
        {isA&&(<>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,marginBottom:12,
            fontSize:10,color:T.fgSub,textTransform:'uppercase',letterSpacing:'0.08em'}}>Frontmatter</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 10px',marginBottom:10}}>
            {([{k:'description',l:'Описание',span:true},{k:'author',l:'Автор'},
               {k:'date',l:'Дата',t:'date'},{k:'tags',l:'Теги',span:true},
               {k:'lang',l:'Lang'},{k:'robots',l:'Robots'}] as any[]).map(f=>(
              <div key={f.k} style={{gridColumn:f.span?'1 / -1':'auto'}}>
                <label style={lbl}>{f.l}</label>
                <input type={f.t??'text'} value={(fm as any)[f.k]}
                  onChange={e=>setFm(p=>({...p,[f.k]:e.target.value}))} style={inp}/>
              </div>
            ))}
          </div>
        </>)}
        <div style={{display:'flex',gap:8,marginTop:16}}>
          <Btn fullWidth onClick={onClose}>Отмена</Btn>
          <Btn variant="accent" fullWidth loading={saving} onClick={create} style={{fontWeight:700}}>Создать</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────

function TreeNode({ entry, onCreateChild, onDelete, onSelect, selectedPath }: {
  entry: TreeEntry; onCreateChild: (c: CreateConfig)=>void;
  onDelete: (e: TreeEntry)=>void; onSelect: (p: string)=>void; selectedPath: string;
}) {
  const [expanded, setExpanded] = useState(entry.depth < 2);
  const [hov, setHov] = useState(false);
  const isDir = entry.type === 'dir';
  const isActive = entry.path === selectedPath;
  const p = entry.parsed;
  const clr: Record<string,string> = { N:T.accent, C:'#22c55e', A:'#f59e0b' };

  const iconBtn = (icon: React.ReactNode, title: string, onClick: ()=>void, danger?: boolean) => (
    <button title={title} onClick={onClick}
      style={{width:18,height:18,borderRadius:3,border:'none',display:'flex',alignItems:'center',
        justifyContent:'center',background:'transparent',color:T.fgSub,cursor:'pointer'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=danger?T.danger:T.fg}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=T.fgSub}}>
      {icon}
    </button>
  );

  return (
    <div>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        onClick={()=>{if(isDir)setExpanded(v=>!v);else onSelect(entry.path);}}
        style={{display:'flex',alignItems:'center',gap:5,
          padding:`4px 8px 4px ${10+entry.depth*14}px`,borderRadius:5,cursor:'pointer',
          background:isActive?T.accentSoft:hov?T.bgHov:'transparent',userSelect:'none'}}>
        {isDir
          ?(expanded?<ChevronDown size={11} style={{color:T.fgSub,flexShrink:0}}/>
                    :<ChevronRight size={11} style={{color:T.fgSub,flexShrink:0}}/>)
          :<span style={{width:11,flexShrink:0}}/>}
        {isDir
          ?(expanded?<FolderOpen size={12} style={{color:clr[p.type??'']??T.fgSub,flexShrink:0}}/>
                    :<Folder size={12} style={{color:clr[p.type??'']??T.fgSub,flexShrink:0}}/>)
          :<FileText size={12} style={{color:T.fgSub,flexShrink:0}}/>}
        {p.type&&<Badge type={p.type}/>}
        {p.icon&&<span style={{fontSize:9,color:T.fgSub,flexShrink:0}}>⬡{p.icon}</span>}
        <span style={{fontSize:12,color:isActive?T.accent:T.fg,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
          {p.title||entry.name}
        </span>
        {p.slug&&hov&&<span style={{fontSize:9,color:T.fgSub,fontFamily:T.mono,flexShrink:0}}>/{p.slug}</span>}
        {hov&&(
          <div style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            {isDir&&p.type==='N'&&iconBtn(<FolderPlus size={10}/>,'Категория',()=>onCreateChild({parentPath:entry.path,entryType:'C'}))}
            {isDir&&(p.type==='N'||p.type==='C')&&iconBtn(<FilePlus size={10}/>,'Статья',()=>onCreateChild({parentPath:entry.path,entryType:'A'}))}
            {iconBtn(<Trash2 size={10}/>,'Удалить',()=>onDelete(entry),true)}
          </div>
        )}
      </div>
      {isDir&&expanded&&entry.children.length>0&&(
        <div style={{borderLeft:`1px solid ${T.border}`,marginLeft:10+entry.depth*14+5}}>
          {entry.children.map(c=>(
            <TreeNode key={c.path} entry={c} onCreateChild={onCreateChild}
              onDelete={onDelete} onSelect={onSelect} selectedPath={selectedPath}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Markdown Editor ──────────────────────────────────────────────────────────

type ViewMode = 'editor'|'split'|'preview';

function MarkdownEditor({ filePath, onClose }: { filePath: string; onClose: ()=>void }) {
  const [fm, setFm]           = useState<FM>({...EMPTY_FM});
  const [body, setBody]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [fmOpen, setFmOpen]   = useState(false);
  const [viewMode, setMode]   = useState<ViewMode>('split');
  const taRef   = useRef<HTMLTextAreaElement>(null);
  const fmRef   = useRef(fm);
  const bodyRef = useRef(body);
  useEffect(() => { fmRef.current = fm; }, [fm]);
  useEffect(() => { bodyRef.current = body; }, [body]);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/,'') ?? '';
  const previewSlug = useMemo(() => {
    return filePath.replace(/^Docs\//,'').split('/')
      .map(p => { const pr=parseName(p); return pr.slug??slugify(pr.title); })
      .filter(Boolean).join('/');
  }, [filePath]);

  // Live preview — rendered on every keystroke, NO save triggered
  const previewHtml = useMemo(() => renderMarkdown(body), [body]);

  useEffect(() => {
    bridge.readFile(filePath)
      .then(({content}) => {
        const {fm:f, body:b} = parseFM(content);
        setFm(f); setBody(b); setDirty(false);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [filePath]);

  // SAVE — only on Ctrl+S or button click, never automatically
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await bridge.writeFile(filePath, serializeFM(fmRef.current, bodyRef.current));
      // bridge runs generate + full-reload on save
      setDirty(false);
      toast.success('Сохранено и опубликовано');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }, [filePath]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [save]);

  const handleInsert = (before: string, after='') => {
    const ta = taRef.current; if (!ta) return;
    const s=ta.selectionStart, e=ta.selectionEnd, sel=body.slice(s,e);
    const nv = body.slice(0,s)+before+sel+after+body.slice(e);
    setBody(nv); setDirty(true);
    setTimeout(()=>{ ta.focus(); ta.selectionStart=s+before.length; ta.selectionEnd=s+before.length+sel.length; },0);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key!=='Tab') return; e.preventDefault();
    const ta=e.currentTarget, s=ta.selectionStart;
    const nv=body.slice(0,s)+'  '+body.slice(ta.selectionEnd);
    setBody(nv); setDirty(true);
    setTimeout(()=>{ ta.selectionStart=ta.selectionEnd=s+2; },0);
  };

  const inpS: React.CSSProperties = {
    width:'100%', padding:'4px 6px', borderRadius:4,
    border:`1px solid ${T.border}`, background:T.bgHov, color:T.fg,
    fontSize:10, outline:'none', fontFamily:T.mono, boxSizing:'border-box',
  };

  if (loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Loader2 size={18} style={{color:T.accent,animation:'devSpinAnim 1s linear infinite'}}/>
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:4,padding:'5px 8px',
        borderBottom:`1px solid ${T.border}`,background:T.bgPanel,flexShrink:0}}>
        <button onClick={onClose} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 7px',
          borderRadius:4,border:`1px solid ${T.border}`,background:'transparent',
          color:T.fgMuted,fontSize:10,cursor:'pointer',fontFamily:T.mono}}>← Назад</button>
        <span style={{fontSize:11,color:T.fg,flex:1,overflow:'hidden',
          textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:T.mono}}>
          {fileName}{dirty&&<span style={{color:T.warning,marginLeft:4}}>●</span>}
        </span>
        {(['editor','split','preview'] as ViewMode[]).map(mode=>{
          const icons = {editor:<FileText size={10}/>,split:<Columns size={10}/>,preview:<Eye size={10}/>};
          const lbls  = {editor:'MD',split:'Split',preview:'Preview'};
          const active = viewMode===mode;
          return (
            <button key={mode} onClick={()=>setMode(mode)}
              style={{display:'flex',alignItems:'center',gap:3,padding:'3px 6px',borderRadius:4,
                border:`1px solid ${active?T.accent+'55':T.border}`,
                background:active?T.accentSoft:'transparent',
                color:active?T.accent:T.fgMuted,fontSize:9,cursor:'pointer',fontFamily:T.mono}}>
              {icons[mode]} {lbls[mode]}
            </button>
          );
        })}
        <button onClick={()=>window.open(`/${previewSlug}`,'_blank')}
          style={{display:'flex',alignItems:'center',gap:4,padding:'3px 7px',borderRadius:4,
            border:`1px solid ${T.border}`,background:'transparent',
            color:T.fgMuted,fontSize:10,cursor:'pointer',fontFamily:T.mono}}>
          <Eye size={10}/> Сайт
        </button>
        <Btn
          icon={saving?<Loader2 size={11} style={{animation:'devSpinAnim 1s linear infinite'}}/>:<Save size={11}/>}
          variant={dirty?'accent':'default'} size="sm" loading={saving} onClick={save}>
          Сохранить
        </Btn>
      </div>

      {/* Frontmatter */}
      <div style={{borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <button onClick={()=>setFmOpen(v=>!v)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
            border:'none',background:T.bgPanel,color:T.fgSub,fontSize:10,fontWeight:700,
            textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer',textAlign:'left',fontFamily:T.mono}}>
          {fmOpen?<ChevronDown size={10}/>:<ChevronRight size={10}/>}
          Frontmatter
          {fm.title&&<span style={{fontWeight:400,marginLeft:6,fontSize:9,color:T.fgSub}}>— {fm.title.slice(0,28)}</span>}
        </button>
        {fmOpen&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 8px',padding:'6px 10px 8px'}}>
            {([{k:'title',l:'Title',span:true},{k:'description',l:'Description',span:true},
               {k:'author',l:'Author'},{k:'date',l:'Date',t:'date'},{k:'updated',l:'Updated',t:'date'},
               {k:'tags',l:'Tags',span:true},{k:'icon',l:'Icon'},{k:'lang',l:'Lang'},{k:'robots',l:'Robots'},
            ] as Array<{k:keyof FM;l:string;span?:boolean;t?:string}>).map(f=>(
              <div key={f.k} style={{gridColumn:f.span?'1 / -1':'auto'}}>
                <div style={{fontSize:9,color:T.fgSub,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.l}</div>
                <input type={f.t??'text'} value={fm[f.k]}
                  onChange={e=>{setFm(p=>({...p,[f.k]:e.target.value}));setDirty(true);}}
                  style={inpS}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Syntax toolbar */}
      <div style={{display:'flex',gap:2,padding:'3px 8px',borderBottom:`1px solid ${T.border}`,
        flexShrink:0,background:T.bgPanel}}>
        {[{icon:<Bold size={11}/>,b:'**',a:'**'},{icon:<Italic size={11}/>,b:'_',a:'_'},
          {icon:<Code size={11}/>,b:'`',a:'`'},{icon:<Hash size={11}/>,b:'\n## ',a:''},
          {icon:<List size={11}/>,b:'\n- ',a:''},{icon:<Link size={11}/>,b:'[',a:'](url)'},
        ].map((btn,i)=>(
          <button key={i} onClick={()=>handleInsert(btn.b,btn.a)}
            style={{display:'flex',alignItems:'center',justifyContent:'center',
              width:22,height:20,borderRadius:3,border:'none',background:'transparent',
              color:T.fgMuted,cursor:'pointer'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=T.bgHov;(e.currentTarget as HTMLButtonElement).style.color=T.fg}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.color=T.fgMuted}}>
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor + Preview */}
      <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>
        {(viewMode==='editor'||viewMode==='split')&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,
            borderRight:viewMode==='split'?`1px solid ${T.border}`:'none'}}>
            <div style={{padding:'2px 8px',fontSize:8,color:T.fgSub,background:T.bgPanel,
              borderBottom:`1px solid ${T.border}44`,letterSpacing:'0.08em',flexShrink:0}}>
              MARKDOWN
            </div>
            <textarea ref={taRef} value={body}
              onChange={e=>{setBody(e.target.value);setDirty(true);}}
              onKeyDown={handleTab} spellCheck={false}
              style={{flex:1,padding:'10px 12px',border:'none',background:T.bgHov,
                color:'#e2e8f0',fontSize:12,fontFamily:T.mono,lineHeight:1.75,
                resize:'none',outline:'none',scrollbarWidth:'thin' as const}}/>
          </div>
        )}
        {(viewMode==='preview'||viewMode==='split')&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
            <div style={{padding:'2px 8px',fontSize:8,color:T.accent,background:T.bgPanel,
              borderBottom:`1px solid ${T.border}44`,letterSpacing:'0.08em',flexShrink:0}}>
              LIVE PREVIEW
            </div>
            <style>{PREVIEW_CSS}</style>
            <div className="dp-wrap"
              style={{flex:1,overflowY:'auto',scrollbarWidth:'thin' as const}}
              dangerouslySetInnerHTML={{__html:previewHtml}}/>
          </div>
        )}
      </div>

      <StatusBar
        left={`${body.trim().split(/\s+/).filter(Boolean).length} слов`}
        right={dirty ? '● Ctrl+S для сохранения' : '✓ Сохранено'}
      />
    </div>
  );
}

// ─── DocsPanel ────────────────────────────────────────────────────────────────

export default function DocsPanel() {
  const [tree, setTree]             = useState<TreeEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedFile, setSelected] = useState<string|null>(null);
  const [createConfig, setCreate]   = useState<CreateConfig|null>(null);
  const [toDelete, setToDelete]     = useState<TreeEntry|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const {entries}=await bridge.listDocs(); setTree(buildTree(entries)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await bridge.deleteFile(toDelete.path);
      if (selectedFile===toDelete.path) setSelected(null);
      setToDelete(null);
      setTimeout(load, 500);
      toast.success('Удалено');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreated = useCallback((fp?: string) => {
    setTimeout(()=>{ load(); if(fp) setSelected(fp); }, 500);
  }, [load]);

  const fileCount = tree.reduce(function c(acc: number, e: TreeEntry): number {
    return acc+(e.type==='file'?1:0)+(e.children?e.children.reduce(c,0):0);
  }, 0);

  if (selectedFile) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <MarkdownEditor filePath={selectedFile} onClose={()=>setSelected(null)}/>
      {createConfig&&<CreateModal config={createConfig} onClose={()=>setCreate(null)} onCreated={handleCreated}/>}
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',
        borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bgPanel}}>
        <Btn icon={<Plus size={11}/>} variant="accent" size="sm"
          onClick={()=>setCreate({parentPath:'Docs',entryType:'N'})}>
          Nav Popover
        </Btn>
        <div style={{flex:1}}/>
        <Btn icon={<RefreshCw size={11}/>} size="sm" onClick={load}>Обновить</Btn>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        <ScrollArea style={{height:'100%',padding:'6px'}}>
          {loading
            ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:24,color:T.fgSub}}>
                <Loader2 size={14} style={{animation:'devSpinAnim 1s linear infinite'}}/>
                <span style={{fontSize:12}}>Загрузка...</span>
              </div>
            :tree.length===0
              ?<EmptyState icon={<FolderOpen size={32}/>} title="Docs/ пуста" desc="Создай первый Nav Popover"/>
              :tree.map(e=>(
                <TreeNode key={e.path} entry={e} onCreateChild={setCreate}
                  onDelete={setToDelete} onSelect={p=>setSelected(p)} selectedPath={selectedFile??''}/>
              ))
          }
        </ScrollArea>
      </div>
      <StatusBar left={`${fileCount} файлов`} right="Docs/"/>
      {createConfig&&<CreateModal config={createConfig} onClose={()=>setCreate(null)} onCreated={handleCreated}/>}
      {toDelete&&(
        <ConfirmDialog message={`Удалить "${toDelete.parsed.title||toDelete.name}"?`}
          onConfirm={confirmDelete} onCancel={()=>setToDelete(null)} danger/>
      )}
    </div>
  );
}