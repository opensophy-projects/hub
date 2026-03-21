/**
 * DocsPanel v5 — Страницы
 * - Рабочий textarea редактор с подсветкой через CSS (без overlay)
 * - Кнопка + для вставки всех Hub блоков
 * - Дизайн в стиле проекта
 */

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
  FolderOpen, Folder, FileText, Plus, Trash2,
  ChevronRight, ChevronDown, FolderPlus, FilePlus,
  Loader2, Save, Bold, Italic, Code, Link, Hash, List,
  RefreshCw, Edit3, Minus, Image, BarChart2, Table,
  Columns, AlertCircle, Calculator, Footprints, LayoutGrid,
  Type,
} from 'lucide-react';

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

// ─── Block snippets ───────────────────────────────────────────────────────────

interface BlockVariant { label: string; code: string; }
interface BlockItem { label: string; icon: React.ReactNode; code?: string; variants?: BlockVariant[]; }
interface BlockGroup { group: string; icon: React.ReactNode; items: BlockItem[]; }

const BLOCK_GROUPS: BlockGroup[] = [
  { group: 'Текст', icon: <Type size={12}/>, items: [
    { label: 'Заголовок', icon: <Hash size={11}/>, variants: [
      { label: '# H1', code: '\n# Заголовок\n' },
      { label: '## H2', code: '\n## Заголовок\n' },
      { label: '### H3', code: '\n### Заголовок\n' },
      { label: '#### H4', code: '\n#### Заголовок\n' },
    ]},
    { label: 'Блок кода', icon: <Code size={11}/>, variants: [
      { label: 'JavaScript', code: '\n```javascript\nconst x = 1;\n```\n' },
      { label: 'TypeScript', code: '\n```typescript\nconst x: number = 1;\n```\n' },
      { label: 'Python',     code: '\n```python\ndef hello():\n    print("Hi")\n```\n' },
      { label: 'Bash',       code: '\n```bash\nnpm install\n```\n' },
      { label: 'JSON',       code: '\n```json\n{\n  "key": "value"\n}\n```\n' },
      { label: 'SQL',        code: '\n```sql\nSELECT * FROM table;\n```\n' },
    ]},
    { label: 'Список', icon: <List size={11}/>, variants: [
      { label: 'Маркированный', code: '\n- Элемент 1\n- Элемент 2\n- Элемент 3\n' },
      { label: 'Нумерованный',  code: '\n1. Элемент 1\n2. Элемент 2\n3. Элемент 3\n' },
      { label: 'Задачи',        code: '\n- [x] Выполнено\n- [ ] Не выполнено\n' },
    ]},
    { label: 'Цитата', icon: <ChevronRight size={11}/>, variants: [
      { label: 'Простая', code: '\n> Текст цитаты.\n' },
      { label: 'Вложенная', code: '\n> Первый уровень\n>> Второй уровень\n' },
    ]},
    { label: 'HR линия', icon: <Minus size={11}/>, code: '\n---\n' },
    { label: 'Детали', icon: <ChevronDown size={11}/>, code: '\n<details>\n<summary>Нажмите, чтобы развернуть</summary>\n\nСкрытый контент.\n\n</details>\n' },
  ]},
  { group: 'Алерты', icon: <AlertCircle size={12}/>, items: [
    { label: 'Note',      icon: <AlertCircle size={11}/>, code: '\n:::note\nПолезная информация.\n:::\n' },
    { label: 'Tip',       icon: <AlertCircle size={11}/>, code: '\n:::tip\nПолезный совет.\n:::\n' },
    { label: 'Important', icon: <AlertCircle size={11}/>, code: '\n:::important\nВажная информация.\n:::\n' },
    { label: 'Warning',   icon: <AlertCircle size={11}/>, code: '\n:::warning\nПредупреждение.\n:::\n' },
    { label: 'Caution',   icon: <AlertCircle size={11}/>, code: '\n:::caution\nОсторожно.\n:::\n' },
  ]},
  { group: 'Таблица', icon: <Table size={12}/>, items: [
    { label: 'Таблица', icon: <Table size={11}/>, variants: [
      { label: '2 колонки', code: '\n| Заголовок 1 | Заголовок 2 |\n|-------------|-------------|\n| Ячейка 1    | Ячейка 2    |\n| Ячейка 3    | Ячейка 4    |\n' },
      { label: '3 колонки', code: '\n| H1 | H2 | H3 |\n|----|----|----|  \n| A  | B  | C  |\n' },
      { label: 'С выравниванием', code: '\n| Лево | Центр | Право |\n|:-----|:-----:|------:|\n| A    |   B   |     C |\n' },
    ]},
  ]},
  { group: 'Карточки', icon: <LayoutGrid size={12}/>, items: [
    { label: 'Карточка', icon: <LayoutGrid size={11}/>, variants: [
      { label: 'Простая',      code: '\n:::card\n[title]Заголовок\nОписание.\n:::\n' },
      { label: 'С иконкой',   code: '\n:::card\n[title]Заголовок\n[icon]rocket\nОписание.\n:::\n' },
      { label: 'Фиолетовая',  code: '\n:::card[color=#7234ff]\n[title]Заголовок\n[icon]zap\nОписание.\n:::\n' },
      { label: 'Синяя',       code: '\n:::card[color=#3b82f6]\n[title]Заголовок\n[icon]book-open\nОписание.\n:::\n' },
      { label: 'Зелёная',     code: '\n:::card[color=#22c55e]\n[title]Заголовок\n[icon]check-circle\nОписание.\n:::\n' },
      { label: 'Красная',     code: '\n:::card[color=#ef4444]\n[title]Заголовок\n[icon]shield-alert\nОписание.\n:::\n' },
    ]},
    { label: 'Сетка 2×2', icon: <LayoutGrid size={11}/>, code: '\n:::cards[cols=2]\n:::card[color=#3b82f6]\n[title]Первая\n[icon]book-open\nОписание.\n:::\n:::card[color=#22c55e]\n[title]Вторая\n[icon]code-2\nОписание.\n:::\n:::card[color=#f59e0b]\n[title]Третья\n[icon]layers\nОписание.\n:::\n:::card[color=#ef4444]\n[title]Четвёртая\n[icon]shield-check\nОписание.\n:::\n:::\n' },
    { label: 'Сетка 3×1', icon: <LayoutGrid size={11}/>, code: '\n:::cards[cols=3]\n:::card[color=#8b5cf6]\n[title]Первая\n[icon]zap\nОписание.\n:::\n:::card[color=#06b6d4]\n[title]Вторая\n[icon]plug\nОписание.\n:::\n:::card[color=#f43f5e]\n[title]Третья\n[icon]life-buoy\nОписание.\n:::\n:::\n' },
  ]},
  { group: 'Колонки', icon: <Columns size={12}/>, items: [
    { label: 'Колонки', icon: <Columns size={11}/>, variants: [
      { label: '50/50 равные',      code: '\n:::columns[layout=equal]\n:::col\nЛевая колонка.\n:::\n:::col\nПравая колонка.\n:::\n:::\n' },
      { label: '70/30 широко лево', code: '\n:::columns[layout=wide-left]\n:::col\n## Заголовок\n\nОсновной текст.\n:::\n:::col\nДополнительно.\n:::\n:::\n' },
      { label: '30/70 широко право',code: '\n:::columns[layout=wide-right]\n:::col\nДополнительно.\n:::\n:::col\n## Заголовок\n\nОсновной текст.\n:::\n:::\n' },
      { label: 'Фото слева',        code: '\n:::columns[layout=image-left]\n:::col\n![Фото](/assets/image.png)\n:::\n:::col\n## Заголовок\nТекст.\n:::\n:::\n' },
      { label: 'Фото справа',       code: '\n:::columns[layout=image-right]\n:::col\n## Заголовок\nТекст.\n:::\n:::col\n![Фото](/assets/image.png)\n:::\n:::\n' },
    ]},
  ]},
  { group: 'Steps', icon: <Footprints size={12}/>, items: [
    { label: 'Шаги', icon: <Footprints size={11}/>, variants: [
      { label: 'Простые',       code: '\n:::steps\n:::step Первый шаг\nОписание.\n:::\n\n:::step Второй шаг\nОписание.\n:::\n\n:::step Третий шаг\nОписание.\n:::\n:::\n' },
      { label: 'Со статусами',  code: '\n:::steps\n:::step[status=done] Установка\nЗапустите `npm install`.\n:::\n\n:::step[status=active] Настройка\nЗаполните `.env`.\n:::\n\n:::step[status=pending] Запуск\nВыполните `npm run dev`.\n:::\n:::\n' },
      { label: 'С цветами',     code: '\n:::steps\n:::step[status=done,color=#f59e0b] Подготовка\nДанные.\n:::\n\n:::step[status=active,color=#3b82f6] Обработка\nСкрипт.\n:::\n\n:::step[status=pending,color=#8b5cf6] Публикация\nДеплой.\n:::\n:::\n' },
    ]},
  ]},
  { group: 'Математика', icon: <Calculator size={12}/>, items: [
    { label: 'Формула', icon: <Calculator size={11}/>, variants: [
      { label: 'Инлайн',            code: ' $E = mc^2$ ' },
      { label: 'Блок',              code: '\n:::math\nE = mc^2\n:::\n' },
      { label: 'Блок с рамкой',     code: '\n:::math[display]\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n:::\n' },
      { label: 'Интеграл',          code: '\n:::math[display]\n\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}\n:::\n' },
      { label: 'Формула Эйлера',    code: '\n:::math[display]\ne^{i\\pi} + 1 = 0\n:::\n' },
      { label: 'Матрица',           code: '\n:::math[display]\nA = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\n:::\n' },
    ]},
  ]},
  { group: 'Графики', icon: <BarChart2 size={12}/>, items: [
    { label: 'Area', icon: <BarChart2 size={11}/>, variants: [
      { label: 'Area',         code: '\n:::chart\n[title]Посещаемость\n[type]area\n[colors]#7234ff, #22c55e\n\n| Месяц | Визиты | Уники |\n|-------|--------|-------|\n| Янв   | 4200   | 3100  |\n| Фев   | 3800   | 2900  |\n| Мар   | 5100   | 3900  |\n:::\n' },
      { label: 'Area Stacked', code: '\n:::chart\n[title]Трафик\n[type]area-stacked\n[colors]#7234ff, #22c55e, #f59e0b\n\n| Месяц | Органика | Реклама | Прямой |\n|-------|----------|---------|--------|\n| Янв   | 2100     | 800     | 500    |\n| Фев   | 2400     | 950     | 520    |\n:::\n' },
    ]},
    { label: 'Bar', icon: <BarChart2 size={11}/>, variants: [
      { label: 'Bar',            code: '\n:::chart\n[title]Продажи\n[type]bar\n[colors]#7234ff, #22c55e\n\n| Квартал | Север | Юг  |\n|---------|-------|-----|\n| Q1      | 1200  | 900 |\n| Q2      | 1500  | 1100|\n:::\n' },
      { label: 'Bar Stacked',    code: '\n:::chart\n[title]Расходы\n[type]bar-stacked\n[colors]#7234ff, #22c55e, #f59e0b\n\n| Месяц | Зарплаты | Инфра | Маркетинг |\n|-------|----------|-------|----------|\n| Янв   | 3200     | 800   | 400      |\n:::\n' },
      { label: 'Bar Horizontal', code: '\n:::chart\n[title]Языки\n[type]bar-horizontal\n[colors]#7234ff, #22c55e, #f59e0b, #3b82f6\n\n| Язык       | % |\n|------------|---|\n| Python     | 28|\n| JavaScript | 24|\n| TypeScript | 18|\n:::\n' },
    ]},
    { label: 'Pie',   icon: <BarChart2 size={11}/>, variants: [
      { label: 'Pie',       code: '\n:::chart\n[title]Источники\n[type]pie\n[colors]#7234ff, #22c55e, #f59e0b, #3b82f6\n\n| Источник | Доля |\n|----------|------|\n| Органика | 42   |\n| Прямой   | 28   |\n| Реклама  | 30   |\n:::\n' },
      { label: 'Pie Donut', code: '\n:::chart\n[title]Браузеры\n[type]pie-donut\n[colors]#7234ff, #f59e0b, #22c55e\n\n| Браузер | Доля |\n|---------|------|\n| Chrome  | 63   |\n| Firefox | 10   |\n| Safari  | 27   |\n:::\n' },
    ]},
    { label: 'Radar', icon: <BarChart2 size={11}/>, code: '\n:::chart\n[title]Навыки\n[type]radar\n[colors]#7234ff, #22c55e\n\n| Навык      | Фронт | Бэк |\n|------------|-------|-----|\n| TypeScript | 90    | 60  |\n| Python     | 40    | 95  |\n| SQL        | 55    | 88  |\n| DevOps     | 50    | 75  |\n:::\n' },
  ]},
  { group: 'Изображение', icon: <Image size={12}/>, items: [
    { label: 'Изображение', icon: <Image size={11}/>, variants: [
      { label: 'Простое',       code: '[image.png]' },
      { label: 'С описанием',   code: '![Текст](/assets/image.png "Заголовок")' },
      { label: 'Кликабельное',  code: '[![Текст](/assets/image.png)](https://example.com)' },
    ]},
  ]},
];

// ─── CreateModal ──────────────────────────────────────────────────────────────

interface CreateConfig { parentPath: string; entryType: 'N'|'C'|'A'; }

function Modal({ onClose, children, t }: { onClose: ()=>void; children: React.ReactNode; t: TTokens }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100020,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{
        background:t.bg, border:`1px solid ${t.borderStrong}`,
        borderRadius:14, padding:24,
        boxShadow:t.shadow, fontFamily:t.mono,
        maxHeight:'90vh', overflowY:'auto',
        animation:'adminPanelIn 0.15s ease',
      }} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, children, t }: { label: string; children: React.ReactNode; t: TTokens }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize:9, color:t.fgSub, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{label}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type='text', t }: {
  value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; t:TTokens;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      style={{
        width:'100%', padding:'7px 10px', borderRadius:8,
        border:`1px solid ${focus ? t.accentBorder : t.border}`,
        background:t.inpBg, color:t.fg, fontSize:12, outline:'none',
        fontFamily:t.mono, boxSizing:'border-box',
        transition:'border-color 0.15s',
      }}
    />
  );
}

function CreateModal({ config, onClose, onCreated, t }: {
  config: CreateConfig; onClose:()=>void; onCreated:(f?:string)=>void; t:TTokens;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug]   = useState('');
  const [icon, setIcon]   = useState('');
  const [auto, setAuto]   = useState(true);
  const [fm, setFm]       = useState<FM>({...EMPTY_FM});
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(), 60); },[]);

  const setTitle2 = (v:string) => { setTitle(v); setFm(p=>({...p,title:v})); if(auto) setSlug(slugify(v)); };
  const isA = config.entryType === 'A';
  const labels = { N:'Nav Popover', C:'Категория', A:'Статья' };
  const icons  = { N:'book', C:'folder', A:'file-text' };

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic = icon.trim() || icons[config.entryType];
      const name = `[${config.entryType}][${ic}]${title.trim()}${slug?`{${slug}}`:''}`;
      if (isA) {
        const fp = `${config.parentPath}/${name}.md`;
        await bridge.writeFile(fp, serializeFM({...fm,title:title.trim()},`# ${title.trim()}\n\nНачните писать здесь...\n`));
        toast.success('Статья создана'); onCreated(fp);
      } else {
        await bridge.mkdir(`${config.parentPath}/${name}`);
        toast.success('Создано'); onCreated();
      }
      onClose();
    } catch(e:any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} t={t}>
      <div style={{ width: isA ? 440 : 340 }}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
          <Badge type={config.entryType}/>
          <span style={{fontSize:14,fontWeight:700,color:t.fg}}>Создать: {labels[config.entryType]}</span>
        </div>

        <FieldRow label="Название *" t={t}>
          <input ref={ref as any} value={title} onChange={e=>setTitle2(e.target.value)}
            placeholder={isA?'Название статьи':'Название'} onKeyDown={e=>{if(e.key==='Enter'&&!isA)create();if(e.key==='Escape')onClose();}}
            style={{width:'100%',padding:'7px 10px',borderRadius:8,border:`1px solid ${t.border}`,background:t.inpBg,color:t.fg,fontSize:12,outline:'none',fontFamily:t.mono,boxSizing:'border-box'}}/>
        </FieldRow>
        <FieldRow label="URL Slug" t={t}>
          <div style={{display:'flex',gap:6}}>
            <input value={slug} onChange={e=>{setSlug(e.target.value);setAuto(false);}} placeholder="url-slug"
              style={{flex:1,padding:'7px 10px',borderRadius:8,border:`1px solid ${t.border}`,background:t.inpBg,color:t.fg,fontSize:12,outline:'none',fontFamily:t.mono}}/>
            <button onClick={()=>{setAuto(true);setSlug(slugify(title));}}
              style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${t.border}`,background:t.surface,color:t.fgMuted,cursor:'pointer',fontSize:11,fontFamily:t.mono}}>↺</button>
          </div>
        </FieldRow>
        <FieldRow label="Иконка lucide.dev" t={t}>
          <input value={icon} onChange={e=>setIcon(e.target.value)} placeholder={icons[config.entryType]}
            style={{width:'100%',padding:'7px 10px',borderRadius:8,border:`1px solid ${t.border}`,background:t.inpBg,color:t.fg,fontSize:12,outline:'none',fontFamily:t.mono,boxSizing:'border-box'}}/>
        </FieldRow>

        {isA && (
          <div style={{borderTop:`1px solid ${t.border}`,paddingTop:14,marginBottom:10}}>
            <div style={{fontSize:9,color:t.fgSub,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Frontmatter</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 10px'}}>
              {([{k:'description',l:'Описание',span:true},{k:'author',l:'Автор'},
                {k:'date',l:'Дата',tp:'date'},{k:'tags',l:'Теги',span:true},
                {k:'lang',l:'Lang'},{k:'robots',l:'Robots'}] as any[]).map(f=>(
                <div key={f.k} style={{gridColumn:f.span?'1 / -1':'auto'}}>
                  <div style={{fontSize:9,color:t.fgSub,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.l}</div>
                  <input type={f.tp??'text'} value={(fm as any)[f.k]} onChange={e=>setFm(p=>({...p,[f.k]:e.target.value}))}
                    style={{width:'100%',padding:'5px 8px',borderRadius:6,border:`1px solid ${t.border}`,background:t.inpBg,color:t.fg,fontSize:11,outline:'none',fontFamily:t.mono,boxSizing:'border-box'}}/>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button onClick={onClose} style={{flex:1,padding:'8px',borderRadius:8,border:`1px solid ${t.border}`,background:'transparent',color:t.fgMuted,cursor:'pointer',fontSize:12,fontFamily:t.mono}}>Отмена</button>
          <button onClick={create} disabled={saving} style={{flex:1,padding:'8px',borderRadius:8,border:`1px solid ${t.accentBorder}`,background:t.accentSoft,color:t.accent,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:t.mono}}>
            {saving ? '...' : 'Создать'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Block Picker ─────────────────────────────────────────────────────────────

function BlockPicker({ onInsert, t }: { onInsert:(code:string)=>void; t:TTokens }) {
  const [open, setOpen]   = useState(false);
  const [grp, setGrp]     = useState(0);
  const [sub, setSub]     = useState<BlockItem|null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos]     = useState({ top:0, right:0 });

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // Position relative to viewport
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setOpen(true); setSub(null);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const el = document.getElementById('hub-block-menu');
      if (!el?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const rowStyle = (active?: boolean): React.CSSProperties => ({
    width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
    borderRadius:6, border:'none', cursor:'pointer', textAlign:'left',
    background: active ? t.accentSoft : 'transparent',
    color: active ? t.accent : t.fg, fontSize:12,
    justifyContent: 'space-between',
    fontFamily: t.mono,
  });

  return (
    <>
      <button ref={btnRef} onClick={toggle} title="Вставить блок Hub"
        style={{
          display:'flex',alignItems:'center',justifyContent:'center',
          width:22,height:20,borderRadius:4,border:'none',
          background: open ? t.accentSoft : 'transparent',
          color: open ? t.accent : t.fgMuted,
          cursor:'pointer',
        }}
        onMouseEnter={e=>{ if(!open){ (e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov; (e.currentTarget as HTMLButtonElement).style.color=t.fg; }}}
        onMouseLeave={e=>{ if(!open){ (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color=t.fgMuted; }}}
      >
        <Plus size={12}/>
      </button>

      {open && createPortalDiv(
        <div id="hub-block-menu" style={{
          position:'fixed', top:pos.top, right:pos.right, zIndex:100030,
          width:380, maxHeight:360,
          background:t.bg, border:`1px solid ${t.borderStrong}`,
          borderRadius:12, boxShadow:t.shadow,
          display:'flex', overflow:'hidden',
          fontFamily:t.mono,
          animation:'adminPanelIn 0.13s ease',
        }}>
          {/* Groups */}
          <div style={{ width:110, borderRight:`1px solid ${t.border}`, overflowY:'auto', flexShrink:0 }}
            className="admin-scroll">
            {BLOCK_GROUPS.map((g,gi)=>(
              <button key={gi} onClick={()=>{setGrp(gi);setSub(null);}} style={{
                width:'100%', display:'flex', alignItems:'center', gap:7,
                padding:'8px 10px', border:'none', textAlign:'left', cursor:'pointer',
                background: grp===gi ? t.accentSoft : 'transparent',
                color: grp===gi ? t.accent : t.fgMuted,
                fontSize:11, fontWeight: grp===gi ? 600 : 400, fontFamily:t.mono,
                borderRight: grp===gi ? `2px solid ${t.accent}` : '2px solid transparent',
              }}
                onMouseEnter={e=>{ if(grp!==gi)(e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov; }}
                onMouseLeave={e=>{ if(grp!==gi)(e.currentTarget as HTMLButtonElement).style.background='transparent'; }}
              >
                <span style={{flexShrink:0}}>{g.icon}</span>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.group}</span>
              </button>
            ))}
          </div>

          {/* Items */}
          <div style={{ flex:1, overflowY:'auto', padding:'6px' }} className="admin-scroll">
            {!sub ? (
              BLOCK_GROUPS[grp].items.map((item,ii)=>(
                <button key={ii} onClick={()=>{
                  if(item.variants) setSub(item);
                  else { onInsert(item.code!); setOpen(false); }
                }} style={rowStyle()}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
                >
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <span style={{color:t.fgMuted}}>{item.icon}</span>
                    {item.label}
                  </div>
                  {item.variants && <ChevronRight size={10} style={{color:t.fgSub}}/>}
                </button>
              ))
            ) : (
              <>
                <button onClick={()=>setSub(null)} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'5px 8px',
                  border:'none',background:'transparent',color:t.fgMuted,cursor:'pointer',
                  fontSize:11,marginBottom:4,fontFamily:t.mono,
                }}>
                  <ChevronRight size={10} style={{transform:'rotate(180deg)'}}/> Назад
                </button>
                <div style={{fontSize:9,color:t.fgSub,padding:'2px 8px 6px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em'}}>
                  {sub.label}
                </div>
                {sub.variants!.map((v,vi)=>(
                  <button key={vi} onClick={()=>{ onInsert(v.code); setOpen(false); }}
                    style={{...rowStyle(), justifyContent:'flex-start'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov}
                    onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
                  >
                    {v.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function createPortalDiv(el: React.ReactElement) {
  return createPortal(el, document.body);
}

// ─── Markdown Editor ──────────────────────────────────────────────────────────

function MarkdownEditor({ filePath, onClose, t }: {
  filePath: string; onClose:()=>void; t:TTokens;
}) {
  const [fm, setFm]       = useState<FM>({...EMPTY_FM});
  const [body, setBody]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [fmOpen, setFmOpen]   = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fmRef = useRef(fm); const bodyRef = useRef(body);
  useEffect(()=>{ fmRef.current=fm; },[fm]);
  useEffect(()=>{ bodyRef.current=body; },[body]);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/,'') ?? '';

  useEffect(()=>{
    setLoading(true);
    bridge.readFile(filePath)
      .then(({content})=>{
        const {fm:f, body:b} = parseFM(content);
        if(!f.icon){ const p=parseName(filePath.split('/').pop()??''); if(p.icon) f.icon=p.icon; }
        setFm(f); setBody(b); setDirty(false);
      })
      .catch(e=>toast.error(e.message))
      .finally(()=>setLoading(false));
  },[filePath]);

  const save = useCallback(async()=>{
    setSaving(true);
    try {
      await bridge.writeFile(filePath, serializeFM(fmRef.current, bodyRef.current));
      setDirty(false); toast.success('Сохранено');
    } catch(e:any){ toast.error(e.message); }
    finally{ setSaving(false); }
  },[filePath]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if((e.ctrlKey||e.metaKey)&&e.key==='s'){ e.preventDefault(); save(); } };
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[save]);

  // Insert at cursor position in textarea
  const insertAtCursor = useCallback((snippet:string)=>{
    const ta = taRef.current;
    if (!ta) { setBody(p=>p+snippet); setDirty(true); return; }
    const s=ta.selectionStart, e2=ta.selectionEnd;
    const nv = body.slice(0,s)+snippet+body.slice(e2);
    setBody(nv); setDirty(true);
    requestAnimationFrame(()=>{
      ta.focus();
      ta.selectionStart=ta.selectionEnd=s+snippet.length;
    });
  },[body]);

  const handleInsert = (before:string, after='')=>{
    const ta=taRef.current;
    if(!ta){ insertAtCursor(before+after); return; }
    const s=ta.selectionStart,e2=ta.selectionEnd,sel=body.slice(s,e2);
    const nv=body.slice(0,s)+before+sel+after+body.slice(e2);
    setBody(nv); setDirty(true);
    requestAnimationFrame(()=>{ ta.focus(); ta.selectionStart=s+before.length; ta.selectionEnd=s+before.length+sel.length; });
  };

  const handleTab=(e:React.KeyboardEvent<HTMLTextAreaElement>)=>{
    if(e.key!=='Tab') return; e.preventDefault();
    const ta=e.currentTarget,s=ta.selectionStart;
    const nv=body.slice(0,s)+'  '+body.slice(ta.selectionEnd);
    setBody(nv); setDirty(true);
    requestAnimationFrame(()=>{ ta.selectionStart=ta.selectionEnd=s+2; });
  };

  const isDark = t.bg === '#0F0F0F';

  const btnSm = (onClick:()=>void, icon:React.ReactNode, title:string, active?:boolean): React.ReactNode => (
    <button key={title} onClick={onClick} title={title} style={{
      display:'flex',alignItems:'center',justifyContent:'center',
      width:22,height:20,borderRadius:4,border:'none',
      background:active?t.accentSoft:'transparent',
      color:active?t.accent:t.fgMuted,cursor:'pointer',flexShrink:0,
    }}
      onMouseEnter={e=>{ if(!active){ (e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov; (e.currentTarget as HTMLButtonElement).style.color=t.fg; }}}
      onMouseLeave={e=>{ if(!active){ (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color=t.fgMuted; }}}
    >{icon}</button>
  );

  const inpSm: React.CSSProperties = {
    width:'100%', padding:'4px 7px', borderRadius:6,
    border:`1px solid ${t.border}`, background:t.inpBg, color:t.fg,
    fontSize:11, outline:'none', fontFamily:t.mono, boxSizing:'border-box',
  };

  if(loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Loader2 size={20} style={{color:t.accent,animation:'devSpinAnim 1s linear infinite'}}/>
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>

      {/* Top bar */}
      <div style={{
        display:'flex',alignItems:'center',gap:6,padding:'7px 12px',
        borderBottom:`1px solid ${t.border}`,background:t.surface,flexShrink:0,
      }}>
        <button onClick={onClose} style={{
          display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:6,
          border:`1px solid ${t.border}`,background:'transparent',color:t.fgMuted,
          cursor:'pointer',fontSize:11,fontFamily:t.mono,
        }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
        >
          <ChevronRight size={11} style={{transform:'rotate(180deg)'}}/>
          Назад
        </button>

        <div style={{
          flex:1, fontSize:11, color:t.fg, fontFamily:t.mono,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <FileText size={11} style={{color:t.fgMuted,flexShrink:0}}/>
          <span>{fileName}</span>
          {dirty && <span style={{color:t.warning,fontSize:10}}>●</span>}
        </div>

        <button onClick={save} style={{
          display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:7,
          border:`1px solid ${dirty?t.accentBorder:t.border}`,
          background:dirty?t.accentSoft:'transparent',
          color:dirty?t.accent:t.fgMuted,cursor:'pointer',fontSize:11,fontFamily:t.mono,
          transition:'all 0.15s',
        }}>
          {saving
            ?<Loader2 size={11} style={{animation:'devSpinAnim 1s linear infinite'}}/>
            :<Save size={11}/>
          }
          {saving?'Сохранение...':'Ctrl+S'}
        </button>
      </div>

      {/* Frontmatter collapsible */}
      <div style={{borderBottom:`1px solid ${t.border}`,flexShrink:0}}>
        <button onClick={()=>setFmOpen(v=>!v)} style={{
          width:'100%',display:'flex',alignItems:'center',gap:6,padding:'6px 12px',
          border:'none',background:fmOpen?t.surfaceHov:t.surface,color:t.fgSub,
          cursor:'pointer',textAlign:'left',fontSize:10,fontWeight:600,
          textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:t.mono,
        }}>
          {fmOpen?<ChevronDown size={10}/>:<ChevronRight size={10}/>}
          Frontmatter
          {fm.title&&<span style={{fontWeight:400,color:t.fgSub,textTransform:'none',letterSpacing:0}}>— {fm.title.slice(0,30)}</span>}
        </button>
        {fmOpen && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 10px',padding:'8px 12px 10px',background:t.surface}}>
            {([
              {k:'title',l:'Title',span:true},{k:'description',l:'Description',span:true},
              {k:'author',l:'Author'},{k:'date',l:'Date',tp:'date'},
              {k:'updated',l:'Updated',tp:'date'},{k:'tags',l:'Tags',span:true},
              {k:'icon',l:'Icon'},{k:'lang',l:'Lang'},{k:'robots',l:'Robots'},
            ] as Array<{k:keyof FM;l:string;span?:boolean;tp?:string}>).map(f=>(
              <div key={f.k} style={{gridColumn:f.span?'1 / -1':'auto'}}>
                <div style={{fontSize:9,color:t.fgSub,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.l}</div>
                <input type={f.tp??'text'} value={fm[f.k]}
                  onChange={e=>{setFm(p=>({...p,[f.k]:e.target.value}));setDirty(true);}}
                  style={inpSm}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formatting toolbar */}
      <div style={{
        display:'flex',alignItems:'center',gap:2,padding:'4px 10px',
        borderBottom:`1px solid ${t.border}`,background:t.surface,
        flexShrink:0, flexWrap:'wrap',
      }}>
        {btnSm(()=>handleInsert('**','**'), <Bold size={11}/>, 'Жирный')}
        {btnSm(()=>handleInsert('_','_'),   <Italic size={11}/>, 'Курсив')}
        {btnSm(()=>handleInsert('`','`'),   <Code size={11}/>, 'Код')}
        {btnSm(()=>handleInsert('\n## ',''), <Hash size={11}/>, 'H2')}
        {btnSm(()=>handleInsert('\n- ',''), <List size={11}/>, 'Список')}
        {btnSm(()=>handleInsert('[','](url)'), <Link size={11}/>, 'Ссылка')}
        {btnSm(()=>handleInsert('\n---\n',''), <Minus size={11}/>, 'HR')}
        <div style={{width:1,height:16,background:t.border,margin:'0 2px'}}/>
        <BlockPicker onInsert={insertAtCursor} t={t}/>
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:t.fgSub}}>
          {body.trim().split(/\s+/).filter(Boolean).length} слов
        </span>
      </div>

      {/* Textarea — plain, no overlay */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
        <textarea
          ref={taRef}
          value={body}
          onChange={e=>{ setBody(e.target.value); setDirty(true); }}
          onKeyDown={handleTab}
          spellCheck={false}
          placeholder="Начните писать..."
          style={{
            flex:1,
            padding:'12px 14px',
            border:'none',
            background: isDark ? '#0d0d0d' : '#F0EFEB',
            color: isDark ? '#e2e8f0' : '#1e293b',
            fontSize:12,
            fontFamily:'ui-monospace, "Cascadia Code", "Fira Code", monospace',
            lineHeight:1.75,
            resize:'none',
            outline:'none',
            scrollbarWidth:'thin',
            width:'100%',
            boxSizing:'border-box',
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function TreeNode({ entry, onCreate, onDelete, onSelect, selectedPath, t }: {
  entry:TreeEntry; onCreate:(c:CreateConfig)=>void; onDelete:(e:TreeEntry)=>void;
  onSelect:(p:string)=>void; selectedPath:string; t:TTokens;
}) {
  const [expanded, setExpanded] = useState(entry.depth<2);
  const [hov, setHov]           = useState(false);
  const isDir   = entry.type==='dir';
  const isActive= entry.path===selectedPath;
  const p       = entry.parsed;
  const clr: Record<string,string> = { N:t.accent, C:'#22c55e', A:'#f59e0b' };

  const ib = (ico:React.ReactNode, tip:string, fn:()=>void, danger?:boolean) => (
    <button key={tip} title={tip} onClick={e=>{e.stopPropagation();fn();}} style={{
      width:18,height:18,borderRadius:3,border:'none',
      display:'flex',alignItems:'center',justifyContent:'center',
      background:'transparent',color:t.fgSub,cursor:'pointer',flexShrink:0,
    }}
      onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color=danger?t.danger:t.fg}
      onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color=t.fgSub}
    >{ico}</button>
  );

  return (
    <div>
      <div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        onClick={()=>{ if(isDir) setExpanded(v=>!v); else onSelect(entry.path); }}
        style={{
          display:'flex',alignItems:'center',gap:5,cursor:'pointer',userSelect:'none',
          padding:`4px 10px 4px ${12+entry.depth*14}px`,
          borderRadius:7,
          background:isActive?t.accentSoft:hov?t.surfaceHov:'transparent',
          transition:'background 0.1s',
        }}
      >
        {isDir
          ?(expanded?<ChevronDown size={11} style={{color:t.fgMuted,flexShrink:0}}/>:<ChevronRight size={11} style={{color:t.fgMuted,flexShrink:0}}/>)
          :<span style={{width:11,flexShrink:0}}/>
        }
        {isDir
          ?(expanded
            ?<FolderOpen size={12} style={{color:clr[p.type??'']??t.fgMuted,flexShrink:0}}/>
            :<Folder size={12} style={{color:clr[p.type??'']??t.fgMuted,flexShrink:0}}/>)
          :<FileText size={12} style={{color:t.fgMuted,flexShrink:0}}/>
        }
        {p.type && <Badge type={p.type}/>}
        {p.icon && <span style={{fontSize:9,color:t.fgSub}}>{p.icon}</span>}
        <span style={{fontSize:12,color:isActive?t.accent:t.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
          {p.title||entry.name}
        </span>
        {p.slug && hov && <span style={{fontSize:9,color:t.fgSub,fontFamily:t.mono}}>/{p.slug}</span>}
        {hov && (
          <div style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            {isDir&&p.type==='N'&&ib(<FolderPlus size={10}/>,'+ Категория',()=>onCreate({parentPath:entry.path,entryType:'C'}))}
            {isDir&&(p.type==='N'||p.type==='C')&&ib(<FilePlus size={10}/>,'+ Статья',()=>onCreate({parentPath:entry.path,entryType:'A'}))}
            {ib(<Trash2 size={10}/>,'Удалить',()=>onDelete(entry),true)}
          </div>
        )}
      </div>
      {isDir&&expanded&&entry.children.length>0&&(
        <div style={{borderLeft:`1px solid ${t.border}`,marginLeft:12+entry.depth*14+5}}>
          {entry.children.map(c=>(
            <TreeNode key={c.path} entry={c} onCreate={onCreate} onDelete={onDelete}
              onSelect={onSelect} selectedPath={selectedPath} t={t}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DocsPanel ────────────────────────────────────────────────────────────────

export default function DocsPanel() {
  const t = useContext(ThemeTokensContext);
  const [tree, setTree]           = useState<TreeEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string|null>(null);
  const [createCfg, setCreate]    = useState<CreateConfig|null>(null);
  const [toDelete, setToDelete]   = useState<TreeEntry|null>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try { const {entries}=await bridge.listDocs(); setTree(buildTree(entries)); }
    catch(e:any){ toast.error(e.message); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const confirmDelete = async()=>{
    if(!toDelete) return;
    try {
      await bridge.deleteFile(toDelete.path);
      if(selected===toDelete.path) setSelected(null);
      setToDelete(null); setTimeout(load,400);
      toast.success('Удалено');
    } catch(e:any){ toast.error(e.message); }
  };

  const handleCreated = useCallback((fp?:string)=>{
    setTimeout(()=>{ load(); if(fp) setSelected(fp); },400);
  },[load]);

  const fileCount = tree.reduce(function c(a:number,e:TreeEntry):number{
    return a+(e.type==='file'?1:0)+(e.children?e.children.reduce(c,0):0);
  },0);

  // Editor open
  if (selected) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <MarkdownEditor filePath={selected} onClose={()=>setSelected(null)} t={t}/>
      {createCfg&&<CreateModal config={createCfg} onClose={()=>setCreate(null)} onCreated={handleCreated} t={t}/>}
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Toolbar */}
      <div style={{
        display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
        borderBottom:`1px solid ${t.border}`,flexShrink:0,background:t.surface,
      }}>
        <button onClick={()=>setCreate({parentPath:'Docs',entryType:'N'})} style={{
          display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,
          border:`1px solid ${t.accentBorder}`,background:t.accentSoft,color:t.accent,
          fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:t.mono,
        }}>
          <Plus size={12}/> Nav Popover
        </button>
        <div style={{flex:1}}/>
        <button onClick={load} style={{
          display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:7,
          border:`1px solid ${t.border}`,background:'transparent',color:t.fgMuted,
          cursor:'pointer',fontSize:11,fontFamily:t.mono,
        }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=t.surfaceHov}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
        >
          <RefreshCw size={11}/> Обновить
        </button>
      </div>

      {/* Tree */}
      <div style={{flex:1,overflowY:'auto',padding:'6px'}} className="admin-scroll">
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:32,color:t.fgMuted}}>
            <Loader2 size={16} style={{animation:'devSpinAnim 1s linear infinite'}}/>
            <span style={{fontSize:12}}>Загрузка...</span>
          </div>
        ) : tree.length===0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:32,color:t.fgMuted,textAlign:'center'}}>
            <FolderOpen size={32} style={{opacity:0.3}}/>
            <div style={{fontSize:13,fontWeight:600}}>Docs/ пуста</div>
            <div style={{fontSize:11,color:t.fgSub}}>Создай первый Nav Popover</div>
          </div>
        ) : tree.map(e=>(
          <TreeNode key={e.path} entry={e} onCreate={setCreate}
            onDelete={setToDelete} onSelect={p=>setSelected(p)}
            selectedPath={selected??''} t={t}/>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding:'6px 12px',borderTop:`1px solid ${t.border}`,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        fontSize:10,color:t.fgSub,background:t.surface,flexShrink:0,
      }}>
        <span>{fileCount} {fileCount===1?'страница':fileCount<5?'страницы':'страниц'}</span>
        <span style={{fontFamily:t.mono}}>Docs/</span>
      </div>

      {createCfg&&<CreateModal config={createCfg} onClose={()=>setCreate(null)} onCreated={handleCreated} t={t}/>}
      {toDelete&&(
        <ConfirmDialog
          message={`Удалить «${toDelete.parsed.title||toDelete.name}»?`}
          onConfirm={confirmDelete} onCancel={()=>setToDelete(null)} danger
        />
      )}
    </div>
  );
}