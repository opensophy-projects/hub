import React, {
  useState, useEffect, useCallback, useRef, useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import { Badge, ConfirmDialog } from '../components/ui';
import { ThemeTokensContext } from '../DevPanel';
import type { TTokens } from '../DevPanel';
import {
  FolderOpen, Plus, Trash2,
  ChevronRight, ChevronDown, FolderPlus, FilePlus,
  Loader2, Bold, Italic, Code, Link, Hash, List,
  RefreshCw, Minus, Image, BarChart2, Table,
  Columns, AlertCircle, Calculator, Footprints, LayoutGrid, Type,
  Edit3,
} from 'lucide-react';

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

const TRANSLIT: Record<string,string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

// Транслитерация + нормализация строки в slug
const slugify = (s: string) =>
  s.toLowerCase()
   .replaceAll(/[а-яё]/g, c => TRANSLIT[c] ?? c)
   .replaceAll(/[^\w\s-]/g, '')
   .replaceAll(/\s+/g, '-')
   .replaceAll(/-+/g, '-')
   .replaceAll(/^-|-$/g, '');

const parseName = (name: string) => {
  const cleaned = name.replace(/\.md$/, '');
  const tm = /^\[([NCA])\]/.exec(cleaned);
  const type = (tm?.[1] ?? null) as 'N'|'C'|'A'|null;
  const rest = tm ? cleaned.slice(tm[0].length) : cleaned;
  const im = /^\[([^\]]+)\]/.exec(rest);
  const icon = im?.[1] ?? null;
  const ai = im ? rest.slice(im[0].length) : rest;
  const sm = /^(.+?)\{([^}]+)\}$/.exec(ai);
  return { type, icon, title: sm ? sm[1].trim() : ai.trim(), slug: sm ? sm[2].trim() : null };
};

const buildTree = (flat: FlatEntry[]): TreeEntry[] => {
  const m = new Map<string,TreeEntry>();
  const tree: TreeEntry[] = [];
  flat.forEach(e => m.set(e.path, { ...e, children:[], parsed:parseName(e.name) }));
  flat.forEach(e => {
    const node = m.get(e.path);
    if (!node) return;
    const parent = m.get(e.path.split('/').slice(0,-1).join('/'));
    if (parent) parent.children.push(node); else tree.push(node);
  });
  return tree;
};

const parseFM = (raw: string): { fm: FM; body: string } => {
  if (!raw.startsWith('---\n')) return { fm:{...EMPTY_FM}, body:raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { fm:{...EMPTY_FM}, body:raw };
  const fm: FM = {...EMPTY_FM};
  raw.slice(4,end).split('\n').forEach(line => {
    const ci = line.indexOf(':');
    if (ci < 1) return;
    const k = line.slice(0,ci).trim() as keyof FM;
    const v = line.slice(ci+1).trim().replaceAll(/^["']|["']$/g, '');
    if (k in fm) (fm as Record<string,string>)[k] = v;
  });
  return { fm, body: raw.slice(end+5) };
};

const serializeFM = (fm: FM, body: string): string => {
  const lines: string[] = [];
  for (const [k,v] of Object.entries(fm) as [keyof FM,string][]) {
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
    try { await bridge.deleteFile(d.path); } catch {}
  }
  try { await bridge.deleteFile(oldPath); } catch {}
}

interface BV { label: string; code: string; }
interface BI { label: string; icon: React.ReactNode; code?: string; variants?: BV[]; }
const BG: { g: string; icon: React.ReactNode; items: BI[] }[] = [
  { g:'Текст', icon:<Type size={11}/>, items:[
    { label:'Заголовок', icon:<Hash size={10}/>, variants:[
      {label:'H1', code:'\n# Заголовок\n'},{label:'H2', code:'\n## Заголовок\n'},
      {label:'H3', code:'\n### Заголовок\n'},{label:'H4', code:'\n#### Заголовок\n'},
    ]},
    { label:'Блок кода', icon:<Code size={10}/>, variants:[
      {label:'JavaScript', code:'\n```javascript\nconst x = 1;\n```\n'},
      {label:'TypeScript', code:'\n```typescript\nconst x: number = 1;\n```\n'},
      {label:'Python',     code:'\n```python\ndef hello():\n    print("Hi")\n```\n'},
      {label:'Bash',       code:'\n```bash\nnpm install\n```\n'},
      {label:'JSON',       code:'\n```json\n{\n  "key": "value"\n}\n```\n'},
    ]},
    { label:'Список', icon:<List size={10}/>, variants:[
      {label:'Маркированный', code:'\n- Элемент 1\n- Элемент 2\n- Элемент 3\n'},
      {label:'Нумерованный',  code:'\n1. Элемент 1\n2. Элемент 2\n3. Элемент 3\n'},
      {label:'Задачи',        code:'\n- [x] Выполнено\n- [ ] Не выполнено\n'},
    ]},
    { label:'Цитата', icon:<ChevronRight size={10}/>, variants:[
      {label:'Простая',   code:'\n> Текст цитаты.\n'},
      {label:'Вложенная', code:'\n> Уровень 1\n>> Уровень 2\n'},
    ]},
    { label:'HR линия', icon:<Minus size={10}/>, code:'\n---\n' },
    { label:'Детали', icon:<ChevronDown size={10}/>, code:'\n<details>\n<summary>Нажмите, чтобы развернуть</summary>\n\nСкрытый контент.\n\n</details>\n' },
  ]},
  { g:'Алерты', icon:<AlertCircle size={11}/>, items:[
    {label:'Note',      icon:<AlertCircle size={10}/>, code:'\n:::note\nПолезная информация.\n:::\n'},
    {label:'Tip',       icon:<AlertCircle size={10}/>, code:'\n:::tip\nПолезный совет.\n:::\n'},
    {label:'Important', icon:<AlertCircle size={10}/>, code:'\n:::important\nВажная информация.\n:::\n'},
    {label:'Warning',   icon:<AlertCircle size={10}/>, code:'\n:::warning\nПредупреждение.\n:::\n'},
    {label:'Caution',   icon:<AlertCircle size={10}/>, code:'\n:::caution\nОсторожно.\n:::\n'},
  ]},
  { g:'Таблица', icon:<Table size={11}/>, items:[
    { label:'Таблица', icon:<Table size={10}/>, variants:[
      {label:'2 колонки',    code:'\n| H1 | H2 |\n|----|----|\n| A  | B  |\n| C  | D  |\n'},
      {label:'3 колонки',    code:'\n| H1 | H2 | H3 |\n|----|----|----|  \n| A  | B  | C  |\n'},
      {label:'Выравнивание', code:'\n| Лево | Центр | Право |\n|:-----|:-----:|------:|\n| A    |   B   |     C |\n'},
    ]},
  ]},
  { g:'Карточки', icon:<LayoutGrid size={11}/>, items:[
    { label:'Карточка', icon:<LayoutGrid size={10}/>, variants:[
      {label:'Простая',    code:'\n:::card\n[title]Заголовок\nОписание.\n:::\n'},
      {label:'С иконкой',  code:'\n:::card\n[title]Заголовок\n[icon]rocket\nОписание.\n:::\n'},
      {label:'Синяя',      code:'\n:::card[color=#3b82f6]\n[title]Заголовок\n[icon]book-open\nОписание.\n:::\n'},
      {label:'Зелёная',    code:'\n:::card[color=#22c55e]\n[title]Заголовок\n[icon]check-circle\nОписание.\n:::\n'},
      {label:'Красная',    code:'\n:::card[color=#ef4444]\n[title]Заголовок\n[icon]shield-alert\nОписание.\n:::\n'},
    ]},
    {label:'Сетка 2×2', icon:<LayoutGrid size={10}/>, code:'\n:::cards[cols=2]\n:::card[color=#3b82f6]\n[title]Первая\n[icon]book-open\nОписание.\n:::\n:::card[color=#22c55e]\n[title]Вторая\n[icon]code-2\nОписание.\n:::\n:::card[color=#f59e0b]\n[title]Третья\n[icon]layers\nОписание.\n:::\n:::card[color=#ef4444]\n[title]Четвёртая\n[icon]shield-check\nОписание.\n:::\n:::\n'},
    {label:'Сетка 3×1', icon:<LayoutGrid size={10}/>, code:'\n:::cards[cols=3]\n:::card[color=#8b5cf6]\n[title]Первая\n[icon]zap\nОписание.\n:::\n:::card[color=#06b6d4]\n[title]Вторая\n[icon]plug\nОписание.\n:::\n:::card[color=#f43f5e]\n[title]Третья\n[icon]life-buoy\nОписание.\n:::\n:::\n'},
  ]},
  { g:'Колонки', icon:<Columns size={11}/>, items:[
    { label:'Колонки', icon:<Columns size={10}/>, variants:[
      {label:'50/50',       code:'\n:::columns[layout=equal]\n:::col\nЛевая.\n:::\n:::col\nПравая.\n:::\n:::\n'},
      {label:'70/30 лево',  code:'\n:::columns[layout=wide-left]\n:::col\n## Заголовок\n\nОсновной текст.\n:::\n:::col\nДоп.\n:::\n:::\n'},
      {label:'30/70 право', code:'\n:::columns[layout=wide-right]\n:::col\nДоп.\n:::\n:::col\n## Заголовок\n\nОсновной текст.\n:::\n:::\n'},
      {label:'Фото слева',  code:'\n:::columns[layout=image-left]\n:::col\n![](/assets/image.png)\n:::\n:::col\n## Заголовок\nТекст.\n:::\n:::\n'},
      {label:'Фото справа', code:'\n:::columns[layout=image-right]\n:::col\n## Заголовок\nТекст.\n:::\n:::col\n![](/assets/image.png)\n:::\n:::\n'},
    ]},
  ]},
  { g:'Steps', icon:<Footprints size={11}/>, items:[
    { label:'Шаги', icon:<Footprints size={10}/>, variants:[
      {label:'Простые',      code:'\n:::steps\n:::step Первый шаг\nОписание.\n:::\n\n:::step Второй шаг\nОписание.\n:::\n:::\n'},
      {label:'Со статусами', code:'\n:::steps\n:::step[status=done] Установка\n`npm install`\n:::\n\n:::step[status=active] Настройка\n`.env`\n:::\n\n:::step[status=pending] Запуск\n`npm run dev`\n:::\n:::\n'},
      {label:'С цветами',    code:'\n:::steps\n:::step[status=done,color=#f59e0b] Подготовка\nДанные.\n:::\n\n:::step[status=active,color=#3b82f6] Обработка\nСкрипт.\n:::\n\n:::step[status=pending,color=#8b5cf6] Публикация\nДеплой.\n:::\n:::\n'},
    ]},
  ]},
  { g:'Математика', icon:<Calculator size={11}/>, items:[
    { label:'Формула', icon:<Calculator size={10}/>, variants:[
      {label:'Инлайн',        code:' $E = mc^2$ '},
      {label:'Блок',          code:'\n:::math\nE = mc^2\n:::\n'},
      {label:'Блок с рамкой', code:'\n:::math[display]\nx = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\n:::\n'},
      {label:'Интеграл',      code:'\n:::math[display]\n\\int_{-\\infty}^{+\\infty} e^{-x^2}dx = \\sqrt{\\pi}\n:::\n'},
      {label:'Эйлер',         code:'\n:::math[display]\ne^{i\\pi} + 1 = 0\n:::\n'},
    ]},
  ]},
  { g:'Графики', icon:<BarChart2 size={11}/>, items:[
    { label:'Area', icon:<BarChart2 size={10}/>, variants:[
      {label:'Area',         code:'\n:::chart\n[title]Посещаемость\n[type]area\n[colors]#555, #888\n\n| Месяц | Визиты | Уники |\n|-------|--------|-------|\n| Янв   | 4200   | 3100  |\n| Фев   | 3800   | 2900  |\n:::\n'},
      {label:'Area Stacked', code:'\n:::chart\n[title]Трафик\n[type]area-stacked\n[colors]#555, #888, #aaa\n\n| Месяц | Орг | Рекл | Прям |\n|-------|-----|------|------|\n| Янв   | 2100| 800  | 500  |\n:::\n'},
    ]},
    { label:'Bar', icon:<BarChart2 size={10}/>, variants:[
      {label:'Bar',            code:'\n:::chart\n[title]Продажи\n[type]bar\n[colors]#555, #888\n\n| Квартал | Север | Юг  |\n|---------|-------|-----|\n| Q1      | 1200  | 900 |\n:::\n'},
      {label:'Bar Stacked',    code:'\n:::chart\n[title]Расходы\n[type]bar-stacked\n[colors]#555, #888, #aaa\n\n| Месяц | ЗП   | Инфра |\n|-------|------|-------|\n| Янв   | 3200 | 800   |\n:::\n'},
      {label:'Bar Horizontal', code:'\n:::chart\n[title]Языки\n[type]bar-horizontal\n[colors]#555, #888\n\n| Язык   | % |\n|--------|---|\n| Python | 28|\n| JS     | 24|\n:::\n'},
    ]},
    { label:'Pie', icon:<BarChart2 size={10}/>, variants:[
      {label:'Pie',       code:'\n:::chart\n[title]Источники\n[type]pie\n[colors]#444, #666, #888\n\n| Источник | Доля |\n|----------|------|\n| Органика | 42   |\n| Прямой   | 28   |\n| Реклама  | 30   |\n:::\n'},
      {label:'Pie Donut', code:'\n:::chart\n[title]Браузеры\n[type]pie-donut\n[colors]#444, #666, #888\n\n| Браузер | Доля |\n|---------|------|\n| Chrome  | 63   |\n| Firefox | 10   |\n| Safari  | 27   |\n:::\n'},
    ]},
    {label:'Radar', icon:<BarChart2 size={10}/>, code:'\n:::chart\n[title]Навыки\n[type]radar\n[colors]#555, #888\n\n| Навык | Фронт | Бэк |\n|-------|-------|-----|\n| TS    | 90    | 60  |\n| Py    | 40    | 95  |\n:::\n'},
  ]},
  { g:'Изображение', icon:<Image size={11}/>, items:[
    { label:'Изображение', icon:<Image size={10}/>, variants:[
      {label:'Простое',     code:'[image.png]'},
      {label:'С описанием', code:'![Текст](/assets/image.png "Заголовок")'},
      {label:'Кликабельное',code:'[![Текст](/assets/image.png)](https://example.com)'},
    ]},
  ]},
];

function Modal({ onClose, children, width, t }: {
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly width?: number;
  readonly t: TTokens;
}) {
  return createPortal(
    <dialog
      open
      style={{
        position:'fixed', inset:0, zIndex:100020,
        border:'none', padding:0, margin:0,
        maxWidth:'100vw', maxHeight:'100vh', width:'100%', height:'100%',
        background:'rgba(0,0,0,0.6)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        style={{
          position:'absolute', inset:0, width:'100%', height:'100%',
          background:'transparent', border:'none', cursor:'default', padding:0,
        }}
      />
      <div
        style={{
          position:'relative', zIndex:1,
          background:t.bg, border:`1px solid ${t.borderStrong}`,
          borderRadius:12, padding:22, width:width ?? 360,
          boxShadow:t.shadow, fontFamily:t.mono,
          maxHeight:'90vh', overflowY:'auto',
        }}
      >
        {children}
      </div>
    </dialog>,
    document.body
  );
}

interface CC { parentPath: string; entryType: 'N'|'C'|'A'; }

// Сохранение переименованного файла
async function saveRenamedFile(existing: TreeEntry, nm: string, onDone: (fp?: string) => void) {
  const parent = existing.path.split('/').slice(0, -1).join('/');
  const newPath = `${parent}/${nm}.md`;
  if (newPath === existing.path) {
    toast.info('Имя не изменилось');
    onDone();
    return;
  }
  const { content } = await bridge.readFile(existing.path);
  await bridge.writeFile(newPath, content);
  await bridge.deleteFile(existing.path);
  toast.success('Страница переименована');
  onDone(newPath);
}

// Сохранение переименованной директории
async function saveRenamedDir(existing: TreeEntry, nm: string, onDone: (fp?: string) => void) {
  const parent = existing.path.split('/').slice(0, -1).join('/');
  const newPath = `${parent}/${nm}`;
  if (newPath === existing.path) {
    toast.info('Имя не изменилось');
    onDone();
    return;
  }
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
  const [slug,  setSlug]  = useState(p?.slug ?? (p?.title ? slugify(p.title) : ''));
  const [icon,  setIcon]  = useState(p?.icon ?? '');
  const [auto,  setAuto]  = useState(!isEdit);
  const [fm,    setFm]    = useState<FM>({...EMPTY_FM});
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);

  const setT = (v: string) => { setTitle(v); if (auto) setSlug(slugify(v)); };
  const isA = cfg.entryType === 'A';
  const lbl: Record<string,string> = {N:'Секция', C:'Категория', A:'Страница'};
  const dIco: Record<string,string> = {N:'book', C:'folder', A:'file-text'};

  const doSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic = icon.trim() || dIco[cfg.entryType];
      const slugSuffix = slug ? `{${slug}}` : '';
      const nm = `[${cfg.entryType}][${ic}]${title.trim()}${slugSuffix}`;
      if (isEdit && existing) {
        await saveEditEntry(existing, nm);
      } else {
        await saveNewEntry(nm);
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveEditEntry = async (existing: TreeEntry, nm: string) => {
    if (existing.type === 'file') {
      await saveRenamedFile(existing, nm, onDone);
    } else {
      await saveRenamedDir(existing, nm, onDone);
    }
  };

  const saveNewEntry = async (nm: string) => {
    if (isA) {
      const fp = `${cfg.parentPath}/${nm}.md`;
      await bridge.writeFile(fp, serializeFM(
        { ...fm, title: title.trim() },
        `# ${title.trim()}\n\nНачните писать здесь...\n`
      ));
      toast.success('Страница создана');
      onDone(fp);
    } else {
      await bridge.mkdir(`${cfg.parentPath}/${nm}`);
      toast.success('Создано');
      onDone();
    }
  };

  const inp: React.CSSProperties = {
    width:'100%', padding:'7px 10px', borderRadius:7,
    border:`1px solid ${t.border}`, background:t.inpBg, color:t.fg,
    fontSize:12, outline:'none', fontFamily:t.mono, boxSizing:'border-box',
  };
  const lbS: React.CSSProperties = {
    fontSize:9, color:t.fgSub, textTransform:'uppercase',
    letterSpacing:'0.07em', marginBottom:4, display:'block',
  };
  // Текст кнопки сохранения зависит от состояния и режима (создание/редактирование)
  const idleLabel = isEdit ? 'Применить' : 'Создать';
  const saveBtnLabel = saving ? '...' : idleLabel;

  return (
    <Modal onClose={onClose} width={isA && !isEdit ? 440 : 340} t={t}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:16}}>
        <Badge type={cfg.entryType}/>
        <span style={{fontSize:13, fontWeight:700, color:t.fg}}>
          {isEdit ? 'Редактировать' : 'Создать'}: {lbl[cfg.entryType]}
        </span>
      </div>
      <div style={{marginBottom:10}}>
        <label htmlFor="entry-title" style={lbS}>Название *</label>
        <input
          id="entry-title"
          ref={ref as React.RefObject<HTMLInputElement>}
          value={title}
          onChange={e => setT(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !isA) doSave();
            if (e.key === 'Escape') onClose();
          }}
          style={inp}
        />
      </div>
      <div style={{marginBottom:10}}>
        <label htmlFor="entry-slug" style={lbS}>URL Slug</label>
        <div style={{display:'flex', gap:6}}>
          <input id="entry-slug" value={slug} onChange={e => { setSlug(e.target.value); setAuto(false); }} style={{...inp, flex:1}}/>
          <button
            onClick={() => { setAuto(true); setSlug(slugify(title)); }}
            style={{padding:'7px 10px', borderRadius:7, border:`1px solid ${t.border}`, background:t.surfaceHov, color:t.fgMuted, cursor:'pointer', fontSize:11, fontFamily:t.mono}}
          >↺</button>
        </div>
      </div>
      <div style={{marginBottom: isA && !isEdit ? 14 : 10}}>
        <label htmlFor="entry-icon" style={lbS}>Иконка lucide.dev</label>
        <input id="entry-icon" value={icon} onChange={e => setIcon(e.target.value)} placeholder={dIco[cfg.entryType]} style={inp}/>
      </div>
      {isA && !isEdit && (
        <div style={{borderTop:`1px solid ${t.border}`, paddingTop:12, marginBottom:10}}>
          <div style={{...lbS, marginBottom:10}}>Frontmatter</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px 10px'}}>
            {([
              {k:'description', l:'Описание', sp:true}, {k:'author', l:'Автор'},
              {k:'date', l:'Дата', tp:'date'},          {k:'tags', l:'Теги', sp:true},
              {k:'lang', l:'Lang'},                     {k:'robots', l:'Robots'},
            ] as Array<{k: keyof FM; l: string; sp?: boolean; tp?: string}>).map(f => (
              <div key={f.k} style={{gridColumn: f.sp ? '1 / -1' : 'auto'}}>
                <label htmlFor={`fm-${f.k}`} style={lbS}>{f.l}</label>
                <input
                  id={`fm-${f.k}`}
                  type={f.tp ?? 'text'}
                  value={fm[f.k]}
                  onChange={e => setFm(prev => ({...prev, [f.k]: e.target.value}))}
                  style={inp}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{display:'flex', gap:8, marginTop:16}}>
        <button onClick={onClose} style={{flex:1, padding:'8px', borderRadius:7, border:`1px solid ${t.border}`, background:'transparent', color:t.fgMuted, cursor:'pointer', fontSize:12, fontFamily:t.mono}}>Отмена</button>
        <button onClick={doSave} disabled={saving} style={{flex:1, padding:'8px', borderRadius:7, border:`1px solid ${t.borderStrong}`, background:t.surfaceHov, color:t.fg, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:t.mono}}>
          {saveBtnLabel}
        </button>
      </div>
    </Modal>
  );
}

function BlockPicker({ onInsert, t }: { readonly onInsert: (c:string) => void; readonly t: TTokens }) {
  const [open, setOpen] = useState(false);
  const [grp,  setGrp]  = useState(0);
  const [sub,  setSub]  = useState<BI|null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({top:0, left:0});
  const MENU_W = 360;

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const idealLeft = r.left + r.width / 2 - MENU_W / 2;
    const clampedLeft = Math.max(8, Math.min(idealLeft, globalThis.innerWidth - MENU_W - 8));
    setPos({top: r.bottom + 4, left: clampedLeft});
    setOpen(true);
    setSub(null);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBtn  = btnRef.current?.contains(target) ?? false;
      const insideMenu = menuRef.current?.contains(target) ?? false;
      if (!insideBtn && !insideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, [open]);

  const rs = (active?: boolean): React.CSSProperties => ({
    width:'100%', display:'flex', alignItems:'center', gap:7, padding:'6px 10px',
    borderRadius:5, border:'none', cursor:'pointer', textAlign:'left' as const,
    background: active ? t.surfaceHov : 'transparent', color:t.fg, fontSize:11, fontFamily:t.mono,
    justifyContent:'space-between' as const,
  });

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Вставить блок"
        style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'3px 8px', height:22, borderRadius:5,
          border:`1px solid ${open ? t.borderStrong : t.border}`,
          background: open ? t.surfaceHov : 'transparent',
          color: open ? t.fg : t.fgMuted, cursor:'pointer', fontSize:11, fontFamily:t.mono, gap:4,
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov; (e.currentTarget as HTMLButtonElement).style.color = t.fg; } }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; } }}
      ><Plus size={11}/> Блок</button>

      {open && createPortal(
        <div ref={menuRef} style={{
          position:'fixed', top:pos.top, left:pos.left, zIndex:100030,
          width:MENU_W, maxHeight:340,
          background:t.bg, border:`1px solid ${t.borderStrong}`,
          borderRadius:10, boxShadow:t.shadow,
          display:'flex', overflow:'hidden', fontFamily:t.mono,
        }}>
          <div style={{width:100, borderRight:`1px solid ${t.border}`, overflowY:'auto', flexShrink:0}} className="adm-scroll">
            {BG.map((g, gi) => (
              <button key={g.g} onClick={() => { setGrp(gi); setSub(null); }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:6,
                padding:'7px 9px', border:'none', textAlign:'left', cursor:'pointer',
                background: grp === gi ? t.surfaceHov : 'transparent',
                color: grp === gi ? t.fg : t.fgMuted, fontSize:10, fontFamily:t.mono,
                borderLeft: grp === gi ? `2px solid ${t.fg}` : '2px solid transparent',
              }}>
                {g.icon}<span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{g.g}</span>
              </button>
            ))}
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'4px'}} className="adm-scroll">
            {sub ? (
              <>
                <button onClick={() => setSub(null)} style={{display:'flex', alignItems:'center', gap:4, padding:'5px 8px', border:'none', background:'transparent', color:t.fgMuted, cursor:'pointer', fontSize:10, fontFamily:t.mono, marginBottom:3}}>
                  <ChevronRight size={9} style={{transform:'rotate(180deg)'}}/> Назад
                </button>
                <div style={{fontSize:9, color:t.fgSub, padding:'0 8px 5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em'}}>{sub.label}</div>
                {sub.variants!.map((v, vi) => (
                  <button
                    key={v.label + vi}
                    onClick={() => { onInsert(v.code); setOpen(false); }}
                    style={{...rs(), justifyContent:'flex-start'}}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                  >
                    {v.label}
                  </button>
                ))}
              </>
            ) : BG[grp].items.map((item, ii) => (
              <button
                key={item.label + ii}
                onClick={() => { if (item.variants) { setSub(item); } else { onInsert(item.code ?? ''); setOpen(false); } }}
                style={rs()}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
              >
                <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{color:t.fgMuted}}>{item.icon}</span>{item.label}</div>
                {item.variants && <ChevronRight size={9} style={{color:t.fgSub, flexShrink:0}}/>}
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
  const [fm, setFm]           = useState<FM>({...EMPTY_FM});
  const [body, setBody]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [fmOpen, setFmOpen]   = useState(false);
  const taRef    = useRef<HTMLTextAreaElement>(null);
  const fmRef    = useRef(fm);
  const bodyRef  = useRef(body);
  useEffect(() => { fmRef.current = fm; }, [fm]);
  useEffect(() => { bodyRef.current = body; }, [body]);

  const bcRef     = useRef<BroadcastChannel|null>(null);
  const liveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      bcRef.current = new BroadcastChannel('hub-dev-preview');
    }
    return () => { bcRef.current?.close(); };
  }, []);

  const broadcastPreview = useCallback((md: string) => {
    if (liveTimer.current) clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(async () => {
      try {
        const result = await bridge.renderPreview(md);
        bcRef.current?.postMessage({ type: 'preview', html: result.html ?? '', fm: fmRef.current });
      } catch {}
    }, 300);
  }, []);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  const isDark = t.bg === '#111112';

  useEffect(() => {
    setLoading(true);
    bridge.readFile(filePath)
      .then(({ content }) => {
        const { fm: f, body: b } = parseFM(content);
        if (!f.icon) {
          const p = parseName(filePath.split('/').pop() ?? '');
          if (p.icon) f.icon = p.icon;
        }
        setFm(f); setBody(b); setDirty(false);
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

  const insertAtCursor = useCallback((snippet: string) => {
    const ta = taRef.current;
    if (!ta) { setBody(p => p + snippet); setDirty(true); return; }
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    const savedScroll = ta.scrollTop;
    const nv = body.slice(0, s) + snippet + body.slice(e2);
    setBody(nv); setDirty(true); broadcastPreview(nv);
    requestAnimationFrame(() => {
      ta.focus(); ta.scrollTop = savedScroll;
      ta.selectionStart = ta.selectionEnd = s + snippet.length;
    });
  }, [body, broadcastPreview]);

  const handleInsert = (before: string, after = '') => {
    const ta = taRef.current;
    if (!ta) { insertAtCursor(before + after); return; }
    const s = ta.selectionStart, e2 = ta.selectionEnd, sel = body.slice(s, e2);
    const savedScroll = ta.scrollTop;
    const nv = body.slice(0, s) + before + sel + after + body.slice(e2);
    setBody(nv); setDirty(true); broadcastPreview(nv);
    requestAnimationFrame(() => {
      ta.focus(); ta.scrollTop = savedScroll;
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + sel.length;
    });
  };

  const handleChange = (v: string) => { setBody(v); setDirty(true); broadcastPreview(v); };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget, s = ta.selectionStart;
    const savedScroll = ta.scrollTop;
    const nv = body.slice(0, s) + '  ' + body.slice(ta.selectionEnd);
    setBody(nv); setDirty(true); broadcastPreview(nv);
    requestAnimationFrame(() => { ta.scrollTop = savedScroll; ta.selectionStart = ta.selectionEnd = s + 2; });
  };

  const inpS: React.CSSProperties = {
    width:'100%', padding:'4px 7px', borderRadius:5,
    border:`1px solid ${t.border}`, background:t.inpBg, color:t.fg,
    fontSize:11, outline:'none', fontFamily:t.mono, boxSizing:'border-box',
  };

  const toolBtn = (fn: () => void, ico: React.ReactNode, tip: string) => (
    <button key={tip} onClick={fn} title={tip} style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      width:24, height:22, borderRadius:4, border:'none',
      background:'transparent', color:t.fgMuted, cursor:'pointer', flexShrink:0,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov; (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
    >{ico}</button>
  );

  if (loading) return (
    <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <Loader2 size={18} style={{color:t.fgMuted, animation:'devSpinAnim 1s linear infinite'}}/>
    </div>
  );

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0}}>
      <div style={{display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderBottom:`1px solid ${t.border}`, background:t.surface, flexShrink:0}}>
        <button onClick={onClose} style={{display:'flex', alignItems:'center', gap:4, padding:'5px 9px', borderRadius:6, border:`1px solid ${t.border}`, background:'transparent', color:t.fgMuted, cursor:'pointer', fontSize:11, fontFamily:t.mono, flexShrink:0}}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
        >← Назад</button>
        <span style={{flex:1, fontSize:11, color:t.fg, fontFamily:t.mono, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {fileName}{dirty && <span style={{color:t.warning, marginLeft:5}}>●</span>}
        </span>
        <button onClick={save} style={{display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:6, border:`1px solid ${dirty ? t.borderStrong : t.border}`, background:dirty ? t.surfaceHov : 'transparent', color:dirty ? t.fg : t.fgMuted, cursor:'pointer', fontSize:11, fontFamily:t.mono, flexShrink:0, fontWeight:dirty ? 600 : 400}}>
          {saving && <Loader2 size={11} style={{animation:'devSpinAnim 1s linear infinite'}}/>}
          Сохранить
          <span style={{fontSize:9, color:t.fgSub, background:t.inpBg, border:`1px solid ${t.border}`, borderRadius:3, padding:'1px 4px', fontFamily:t.mono}}>Ctrl+S</span>
        </button>
      </div>

      <div style={{borderBottom:`1px solid ${t.border}`, flexShrink:0}}>
        <button onClick={() => setFmOpen(v => !v)} style={{width:'100%', display:'flex', alignItems:'center', gap:6, padding:'5px 10px', border:'none', background:t.surface, color:t.fgSub, fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer', textAlign:'left', fontFamily:t.mono}}>
          {fmOpen ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
          Frontmatter
          {fm.title && <span style={{fontWeight:400, letterSpacing:0, textTransform:'none', marginLeft:4, color:t.fgSub}}>— {fm.title.slice(0, 30)}</span>}
        </button>
        {fmOpen && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px', padding:'6px 10px 8px', background:t.surface}}>
            {([
              {k:'title', l:'Title', sp:true},       {k:'description', l:'Description', sp:true},
              {k:'author', l:'Author'},               {k:'date', l:'Date', tp:'date'},
              {k:'updated', l:'Updated', tp:'date'},  {k:'tags', l:'Tags', sp:true},
              {k:'icon', l:'Icon'},                   {k:'lang', l:'Lang'},
              {k:'robots', l:'Robots'},
            ] as Array<{k: keyof FM; l: string; sp?: boolean; tp?: string}>).map(f => (
              <div key={f.k} style={{gridColumn: f.sp ? '1 / -1' : 'auto'}}>
                <div style={{fontSize:9, color:t.fgSub, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.06em'}}>{f.l}</div>
                <input
                  type={f.tp ?? 'text'}
                  value={fm[f.k]}
                  onChange={e => {
                    const newFm = {...fm, [f.k]: e.target.value};
                    setFm(newFm); setDirty(true);
                    if (liveTimer.current) clearTimeout(liveTimer.current);
                    liveTimer.current = setTimeout(async () => {
                      try {
                        const result = await bridge.renderPreview(bodyRef.current);
                        bcRef.current?.postMessage({ type: 'preview', html: result.html ?? '', fm: newFm });
                      } catch {}
                    }, 200);
                  }}
                  style={inpS}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{display:'flex', alignItems:'center', gap:1, padding:'3px 8px', borderBottom:`1px solid ${t.border}`, background:t.surface, flexShrink:0}}>
        {toolBtn(() => handleInsert('**', '**'), <Bold size={11}/>,   'Жирный')}
        {toolBtn(() => handleInsert('_', '_'),   <Italic size={11}/>, 'Курсив')}
        {toolBtn(() => handleInsert('`', '`'),   <Code size={11}/>,   'Код')}
        {toolBtn(() => handleInsert('\n## ', ''), <Hash size={11}/>,  'H2')}
        {toolBtn(() => handleInsert('\n- ', ''), <List size={11}/>,   'Список')}
        {toolBtn(() => handleInsert('[', '](url)'), <Link size={11}/>, 'Ссылка')}
        {toolBtn(() => handleInsert('\n---\n', ''), <Minus size={11}/>, 'HR')}
        <div style={{width:1, height:14, background:t.border, margin:'0 3px'}}/>
        <BlockPicker onInsert={insertAtCursor} t={t}/>
        <div style={{flex:1}}/>
        <span style={{fontSize:10, color:t.fgSub}}>{body.trim().split(/\s+/).filter(Boolean).length} слов</span>
      </div>

      <textarea
        ref={taRef}
        value={body}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleTab}
        spellCheck={false}
        placeholder="Начните писать..."
        style={{
          flex:1, padding:'12px 14px', border:'none',
          background: isDark ? '#0d0d0e' : '#eceae5',
          color: isDark ? '#e2e8f0' : '#1e293b',
          fontSize:12,
          fontFamily:'ui-monospace, "Cascadia Code", "Fira Code", monospace',
          lineHeight:1.75, resize:'none', outline:'none',
          scrollbarWidth:'thin', width:'100%', boxSizing:'border-box',
        } as React.CSSProperties}
      />
    </div>
  );
}

// Вычисляет стили фона и обводки для узла дерева в зависимости от состояния drag/active/hover
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
  readonly dragOverPath: string|null;
  readonly setDragOverPath: (p: string|null) => void;
  readonly t: TTokens;
}) {
  const [expanded, setExpanded] = useState(entry.depth < 2);
  const [hov, setHov]           = useState(false);
  const isDir    = entry.type === 'dir';
  const isActive = entry.path === selectedPath;
  const isDragOver = dragOverPath === entry.path;
  const p = entry.parsed;
  const typeDot: Record<string,string> = { N:'#22c55e', C:'#14b8a6', A:'#f59e0b' };

  const actionBtn = (ico: React.ReactNode, tip: string, fn: () => void, danger?: boolean) => (
    <button key={tip} title={tip}
      onClick={e => { e.stopPropagation(); fn(); }}
      style={{width:28, height:28, borderRadius:5, border:'none', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:t.surfaceHov, color:danger ? t.danger : t.fgMuted, cursor:'pointer'}}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = danger ? t.danger : t.fg; (e.currentTarget as HTMLButtonElement).style.background = danger ? 'rgba(239,68,68,0.1)' : t.surfaceHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = danger ? t.danger : t.fgMuted; (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov; }}
    >{ico}</button>
  );

  const nodeBg      = getNodeBackground(isDragOver, isDir, isActive, hov, t);
  const nodeOutline = getNodeOutline(isDragOver, isDir);

  // Вес шрифта зависит от типа узла
  const fontWeightMap: Record<string, number> = { N: 600, C: 500, A: 400 };
  const fontWeight = p.type ? (fontWeightMap[p.type] ?? 400) : 400;
  // Иконка раскрытия для директории
  const expandIcon  = expanded ? <ChevronDown size={11}/> : <ChevronRight size={11}/>;
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
          display:'flex', alignItems:'center', gap:5, cursor:'grab', userSelect:'none',
          width:'100%', textAlign:'left',
          padding:`4px 8px 4px ${8 + entry.depth * 14}px`,
          borderRadius:6, border:'none',
          background: nodeBg,
          outline: nodeOutline,
          outlineOffset:-1, minHeight:28, transition:'background 0.1s',
        }}
      >
        <span style={{width:14, height:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:t.fgSub}}>
          {chevronIcon}
        </span>
        {p.type && <span style={{width:7, height:7, borderRadius:'50%', flexShrink:0, background:typeDot[p.type] ?? t.fgSub}}/>}
        {p.icon && <span style={{fontSize:9, color:t.fgSub, flexShrink:0, fontFamily:t.mono, maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.icon}</span>}
        <span style={{fontSize:12, color:t.fg, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight}}>
          {p.title || entry.name}
        </span>
        {hov && (
          <div
            role="toolbar"
            style={{display:'flex', gap:3, flexShrink:0}}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            {actionBtn(<Edit3 size={13}/>, 'Редактировать', () => onEdit(entry))}
            {isDir && p.type === 'N' && actionBtn(<FolderPlus size={13}/>, '+ Категория', () => onCreate({parentPath:entry.path, entryType:'C'}))}
            {isDir && (p.type === 'N' || p.type === 'C') && actionBtn(<FilePlus size={13}/>, '+ Страница', () => onCreate({parentPath:entry.path, entryType:'A'}))}
            {actionBtn(<Trash2 size={13}/>, 'Удалить', () => onDelete(entry), true)}
          </div>
        )}
      </button>
      {isDir && expanded && entry.children.length > 0 && (
        <div style={{marginLeft: 8 + entry.depth * 14 + 7, borderLeft:`1px solid ${t.border}`}}>
          {entry.children.map(c => (
            <TreeNode key={c.path} entry={c} onCreate={onCreate} onDelete={onDelete}
              onEdit={onEdit} onSelect={onSelect} onDrop={onDrop}
              selectedPath={selectedPath} dragOverPath={dragOverPath}
              setDragOverPath={setDragOverPath} t={t}/>
          ))}
        </div>
      )}
    </div>
  );
}

// Рекурсивный подсчёт файлов в дереве
function countFiles(entries: TreeEntry[]): number {
  return entries.reduce((acc, e) => {
    const childCount = e.children ? countFiles(e.children) : 0;
    return acc + (e.type === 'file' ? 1 : 0) + childCount;
  }, 0);
}

export default function DocsPanel() {
  const t = useContext(ThemeTokensContext);
  const [tree, setTree]             = useState<TreeEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<string|null>(null);
  const [modalCfg, setModalCfg]         = useState<{cfg:CC; existing?:TreeEntry}|null>(null);
  const [toDelete, setToDelete]         = useState<TreeEntry|null>(null);
  const [dragOverPath, setDragOverPath] = useState<string|null>(null);
  const [moving, setMoving]         = useState(false);

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

  const handleDone = useCallback((fp?: string) => {
    setTimeout(() => { load(); if (fp) setSelected(fp); }, 400);
  }, [load]);

  const handleEdit = useCallback((entry: TreeEntry) => {
    if (entry.type === 'file') {
      setSelected(entry.path);
      return;
    }
    const p = entry.parsed;
    const cfg: CC = {
      parentPath: entry.path.split('/').slice(0, -1).join('/'),
      entryType: p.type as 'N'|'C',
    };
    setModalCfg({ cfg, existing: entry });
  }, []);

  const handleDrop = useCallback(async (srcPath: string, dstPath: string) => {
    const allEntries: TreeEntry[] = [];
    const flatten = (entries: TreeEntry[]) => entries.forEach(e => { allEntries.push(e); flatten(e.children); });
    flatten(tree);

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
        if (selected === srcPath) setSelected(newPath);
      }
      toast.success(`Перемещено → ${targetDir.split('/').pop()}`);
      setTimeout(load, 400);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setMoving(false);
    }
  }, [tree, selected, load]);

  const fileCount = countFiles(tree);

  // Контент основного списка: загрузка / пусто / дерево
  const renderTreeContent = () => {
    if (loading) return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:24, color:t.fgMuted}}>
        <Loader2 size={14} style={{animation:'devSpinAnim 1s linear infinite'}}/>
        <span style={{fontSize:12}}>Загрузка...</span>
      </div>
    );
    if (tree.length === 0) return (
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:28, color:t.fgMuted, textAlign:'center'}}>
        <FolderOpen size={28} style={{opacity:0.3}}/>
        <div style={{fontSize:12}}>Docs/ пуста. Создай Секция</div>
      </div>
    );
    return tree.map(e => (
      <TreeNode key={e.path} entry={e} onCreate={cfg => setModalCfg({cfg})}
        onDelete={setToDelete} onEdit={handleEdit}
        onSelect={p => setSelected(p)} onDrop={handleDrop}
        selectedPath={selected ?? ''} dragOverPath={dragOverPath}
        setDragOverPath={setDragOverPath} t={t}/>
    ));
  };

  if (selected) return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <MarkdownEditor filePath={selected} onClose={() => setSelected(null)} t={t}/>
      {modalCfg && (
        <EntryModal cfg={modalCfg.cfg} existing={modalCfg.existing}
          onClose={() => setModalCfg(null)} onDone={handleDone} t={t}/>
      )}
    </div>
  );

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderBottom:`1px solid ${t.border}`, flexShrink:0, background:t.surface}}>
        <button onClick={() => setModalCfg({cfg:{parentPath:'Docs', entryType:'N'}})} style={{display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:`1px solid ${t.borderStrong}`, background:t.surfaceHov, color:t.fg, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:t.mono}}>
          <Plus size={12}/> Секция
        </button>
        <div style={{flex:1}}/>
        {moving && <Loader2 size={12} style={{color:t.fgMuted, animation:'devSpinAnim 1s linear infinite'}}/>}
        <button onClick={load} style={{display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:6, border:`1px solid ${t.border}`, background:'transparent', color:t.fgMuted, cursor:'pointer', fontSize:11, fontFamily:t.mono}}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
        >
          <RefreshCw size={11}/> Обновить
        </button>
      </div>

      <div style={{padding:'4px 12px', fontSize:9, color:t.fgSub, background:t.surface, borderBottom:`1px solid ${t.border}`}}>
        Перетащи страницу или категорию в другую папку
      </div>

      <section
        aria-label="Дерево документов"
        style={{flex:1, overflowY:'auto', padding:'4px'}}
        className="adm-scroll"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const src = e.dataTransfer.getData('text/plain'); if (src) handleDrop(src, 'Docs'); }}
      >
        {renderTreeContent()}
      </section>

      <div style={{padding:'5px 10px', borderTop:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:10, color:t.fgSub, background:t.surface, flexShrink:0}}>
        <span>{fileCount} страниц</span>
        <span style={{fontFamily:t.mono}}>Docs/</span>
      </div>

      {modalCfg && (
        <EntryModal cfg={modalCfg.cfg} existing={modalCfg.existing}
          onClose={() => setModalCfg(null)} onDone={handleDone} t={t}/>
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