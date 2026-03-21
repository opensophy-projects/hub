/**
 * DocsPanel v5 — Страницы
 * - Переименован в "Страницы"
 * - Подсветка синтаксиса Markdown (lightweight overlay)
 * - Расширенная панель блоков Hub со всеми вариантами
 * - Редактирование/переименование nav popover / категорий / страниц при клике
 * - Тема light/dark
 */

import React, {
  useState, useEffect, useCallback, useRef, useContext,
} from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import {
  Btn, ScrollArea, EmptyState, StatusBar, Badge, ConfirmDialog,
} from '../components/ui';
import { ThemeTokensContext } from '../DevPanel';
import type { TTokens } from '../DevPanel';
import {
  FolderOpen, Folder, FileText, Plus, Trash2,
  ChevronRight, ChevronDown, FolderPlus, FilePlus,
  Loader2, Save, Bold, Italic, Code, Link, Hash, List,
  RefreshCw, Edit3, ChevronUp, Image, Type, LayoutGrid,
  AlertCircle, BarChart2, Table, Columns, Minus, AlignLeft,
  Braces, Calculator, Footprints,
} from 'lucide-react';

import {
  highlightMarkdown,
  MD_HIGHLIGHT_CSS_DARK,
  MD_HIGHLIGHT_CSS_LIGHT,
} from './mdHighlight';

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

interface BlockSnippet {
  label: string;
  icon: React.ReactNode;
  variants?: { label: string; code: string }[];
  code?: string;
}

const BLOCK_GROUPS: { group: string; icon: React.ReactNode; items: BlockSnippet[] }[] = [
  {
    group: 'Текст',
    icon: <Type size={13}/>,
    items: [
      { label: 'H1–H6', icon: <Hash size={12}/>, variants: [
        { label: 'H1 Заголовок', code: '\n# Заголовок\n' },
        { label: 'H2 Раздел',   code: '\n## Раздел\n' },
        { label: 'H3 Подраздел',code: '\n### Подраздел\n' },
        { label: 'H4',          code: '\n#### Заголовок 4\n' },
      ]},
      { label: 'Жирный', icon: <Bold size={12}/>, code: '**текст**' },
      { label: 'Курсив',  icon: <Italic size={12}/>, code: '_текст_' },
      { label: 'Код',     icon: <Code size={12}/>, code: '`код`' },
      { label: 'Блок кода', icon: <Braces size={12}/>, variants: [
        { label: 'JavaScript', code: '\n```javascript\nconst x = 1;\n```\n' },
        { label: 'TypeScript', code: '\n```typescript\nconst x: number = 1;\n```\n' },
        { label: 'Python',     code: '\n```python\ndef hello():\n    print("Hi")\n```\n' },
        { label: 'Bash',       code: '\n```bash\nnpm install\n```\n' },
        { label: 'JSON',       code: '\n```json\n{\n  "key": "value"\n}\n```\n' },
      ]},
      { label: 'Список', icon: <List size={12}/>, variants: [
        { label: 'Маркированный', code: '\n- Элемент 1\n- Элемент 2\n- Элемент 3\n' },
        { label: 'Нумерованный',  code: '\n1. Элемент 1\n2. Элемент 2\n3. Элемент 3\n' },
        { label: 'Задачи',        code: '\n- [x] Выполнено\n- [ ] Не выполнено\n- [ ] Ещё задача\n' },
      ]},
      { label: 'Ссылка', icon: <Link size={12}/>, variants: [
        { label: 'Обычная',    code: '[текст ссылки](https://example.com)' },
        { label: 'Авто-ссылка', code: 'https://example.com' },
      ]},
      { label: 'HR линия', icon: <Minus size={12}/>, code: '\n---\n' },
      { label: 'Цитата',   icon: <AlignLeft size={12}/>, variants: [
        { label: 'Простая',       code: '\n> Текст цитаты\n' },
        { label: 'Вложенная',     code: '\n> Первый уровень\n>> Второй уровень\n>>> Третий уровень\n' },
      ]},
      { label: 'Детали/Аккордеон', icon: <ChevronDown size={12}/>, code: '\n<details>\n<summary>Нажмите, чтобы развернуть</summary>\n\nСкрытый контент здесь.\n\n</details>\n' },
    ],
  },
  {
    group: 'Алерты',
    icon: <AlertCircle size={13}/>,
    items: [
      { label: 'Note',      icon: <AlertCircle size={12}/>, code: '\n:::note\nПолезная информация.\n:::\n' },
      { label: 'Tip',       icon: <AlertCircle size={12}/>, code: '\n:::tip\nПолезный совет.\n:::\n' },
      { label: 'Important', icon: <AlertCircle size={12}/>, code: '\n:::important\nКлючевая информация.\n:::\n' },
      { label: 'Warning',   icon: <AlertCircle size={12}/>, code: '\n:::warning\nПредупреждение.\n:::\n' },
      { label: 'Caution',   icon: <AlertCircle size={12}/>, code: '\n:::caution\nОсторожно.\n:::\n' },
    ],
  },
  {
    group: 'Таблицы',
    icon: <Table size={13}/>,
    items: [
      { label: 'Таблица',   icon: <Table size={12}/>, variants: [
        { label: '2 колонки', code: '\n| Заголовок 1 | Заголовок 2 |\n|-------------|-------------|\n| Ячейка 1    | Ячейка 2    |\n| Ячейка 3    | Ячейка 4    |\n' },
        { label: '3 колонки', code: '\n| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n|-------------|-------------|-------------|\n| Ячейка 1    | Ячейка 2    | Ячейка 3    |\n| Ячейка 4    | Ячейка 5    | Ячейка 6    |\n' },
        { label: 'С выравниванием', code: '\n| Слева       | По центру   | Справа      |\n|:------------|:-----------:|------------:|\n| Текст       | Текст       | Текст       |\n' },
      ]},
    ],
  },
  {
    group: 'Карточки',
    icon: <LayoutGrid size={13}/>,
    items: [
      { label: 'Одиночная',  icon: <LayoutGrid size={12}/>, variants: [
        { label: 'Простая',          code: '\n:::card\n[title]Заголовок\nОписание карточки.\n:::\n' },
        { label: 'С иконкой',        code: '\n:::card\n[title]Заголовок\n[icon]rocket\nОписание карточки.\n:::\n' },
        { label: 'С цветом',         code: '\n:::card[color=#7234ff]\n[title]Заголовок\n[icon]rocket\nОписание карточки.\n:::\n' },
        { label: 'Синяя',            code: '\n:::card[color=#3b82f6]\n[title]Заголовок\n[icon]book-open\nОписание карточки.\n:::\n' },
        { label: 'Зелёная',          code: '\n:::card[color=#22c55e]\n[title]Заголовок\n[icon]check-circle\nОписание карточки.\n:::\n' },
        { label: 'Красная',          code: '\n:::card[color=#ef4444]\n[title]Заголовок\n[icon]shield-alert\nОписание карточки.\n:::\n' },
      ]},
      { label: 'Сетка 2×2',   icon: <LayoutGrid size={12}/>, code: '\n:::cards[cols=2]\n:::card[color=#3b82f6]\n[title]Документация\n[icon]book-open\nОписание первой карточки.\n:::\n:::card[color=#22c55e]\n[title]API\n[icon]code-2\nОписание второй карточки.\n:::\n:::card[color=#f59e0b]\n[title]Компоненты\n[icon]layers\nОписание третьей карточки.\n:::\n:::card[color=#ef4444]\n[title]Безопасность\n[icon]shield-check\nОписание четвёртой карточки.\n:::\n:::\n' },
      { label: 'Сетка 3×1',   icon: <LayoutGrid size={12}/>, code: '\n:::cards[cols=3]\n:::card[color=#8b5cf6]\n[title]Быстрый старт\n[icon]zap\nОписание.\n:::\n:::card[color=#06b6d4]\n[title]Интеграции\n[icon]plug\nОписание.\n:::\n:::card[color=#f43f5e]\n[title]Поддержка\n[icon]life-buoy\nОписание.\n:::\n:::\n' },
    ],
  },
  {
    group: 'Колонки',
    icon: <Columns size={13}/>,
    items: [
      { label: 'Колонки', icon: <Columns size={12}/>, variants: [
        { label: 'Равные (50/50)',    code: '\n:::columns[layout=equal]\n:::col\nЛевая колонка.\n:::\n:::col\nПравая колонка.\n:::\n:::\n' },
        { label: 'Широкая левая (70/30)', code: '\n:::columns[layout=wide-left]\n:::col\n## Заголовок\n\nОсновной текст в широкой левой колонке.\n:::\n:::col\nКороткий контент.\n:::\n:::\n' },
        { label: 'Широкая правая (30/70)', code: '\n:::columns[layout=wide-right]\n:::col\nКороткий контент.\n:::\n:::col\n## Заголовок\n\nОсновной текст в широкой правой колонке.\n:::\n:::\n' },
        { label: 'Фото слева',       code: '\n:::columns[layout=image-left]\n:::col\n![Изображение](/assets/image.png "Подпись")\n:::\n:::col\n## Заголовок\n\nТекст рядом с изображением.\n:::\n:::\n' },
        { label: 'Фото справа',      code: '\n:::columns[layout=image-right]\n:::col\n## Заголовок\n\nТекст рядом с изображением.\n:::\n:::col\n![Изображение](/assets/image.png "Подпись")\n:::\n:::\n' },
      ]},
    ],
  },
  {
    group: 'Steps',
    icon: <Footprints size={13}/>,
    items: [
      { label: 'Шаги', icon: <Footprints size={12}/>, variants: [
        { label: 'Простые шаги', code: '\n:::steps\n:::step Первый шаг\nОписание первого шага.\n:::\n\n:::step Второй шаг\nОписание второго шага.\n:::\n\n:::step Третий шаг\nОписание третьего шага.\n:::\n:::\n' },
        { label: 'Со статусами', code: '\n:::steps\n:::step[status=done] Установка\nЗапустите `npm install`.\n:::\n\n:::step[status=active] Настройка\nЗаполните `.env` файл.\n:::\n\n:::step[status=pending] Запуск\nВыполните `npm run dev`.\n:::\n:::\n' },
        { label: 'С цветами',   code: '\n:::steps\n:::step[status=done,color=#f59e0b] Подготовка\nСоберите данные.\n:::\n\n:::step[status=active,color=#3b82f6] Обработка\nЗапустите скрипт.\n:::\n\n:::step[status=pending,color=#8b5cf6] Публикация\nРазверните результат.\n:::\n:::\n' },
      ]},
    ],
  },
  {
    group: 'Изображения',
    icon: <Image size={13}/>,
    items: [
      { label: 'Изображение', icon: <Image size={12}/>, variants: [
        { label: 'Простое',          code: '[image.png]' },
        { label: 'С описанием',      code: '![Альтернативный текст](/assets/image.png "Заголовок")' },
        { label: 'Ссылка на изобр.', code: '[![Текст](/assets/image.png)](https://example.com)' },
      ]},
    ],
  },
  {
    group: 'Математика',
    icon: <Calculator size={13}/>,
    items: [
      { label: 'Формула', icon: <Calculator size={12}/>, variants: [
        { label: 'Инлайн ($...)',      code: '$E = mc^2$' },
        { label: 'Блок без рамки',     code: '\n:::math\nE = mc^2\n:::\n' },
        { label: 'Блок с рамкой',      code: '\n:::math[display]\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n:::\n' },
        { label: 'Интеграл',           code: '\n:::math[display]\n\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}\n:::\n' },
        { label: 'Матрица',            code: '\n:::math[display]\nA = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}\n:::\n' },
        { label: 'Уравнение Эйлера',   code: '\n:::math[display]\ne^{i\\pi} + 1 = 0\n:::\n' },
      ]},
    ],
  },
  {
    group: 'Графики',
    icon: <BarChart2 size={13}/>,
    items: [
      { label: 'Area', icon: <BarChart2 size={12}/>, variants: [
        { label: 'Area', code: '\n:::chart\n[title]Посещаемость\n[type]area\n[colors]#7234ff, #22c55e\n\n| Месяц | Визиты | Уники |\n|-------|--------|-------|\n| Янв   | 4200   | 3100  |\n| Фев   | 3800   | 2900  |\n| Мар   | 5100   | 3900  |\n:::\n' },
        { label: 'Area Stacked', code: '\n:::chart\n[title]Трафик\n[type]area-stacked\n[colors]#7234ff, #22c55e, #f59e0b\n\n| Месяц | Органика | Реклама | Прямой |\n|-------|----------|---------|--------|\n| Янв   | 2100     | 800     | 500    |\n| Фев   | 2400     | 950     | 520    |\n:::\n' },
      ]},
      { label: 'Bar',  icon: <BarChart2 size={12}/>, variants: [
        { label: 'Bar',            code: '\n:::chart\n[title]Продажи\n[type]bar\n[colors]#7234ff, #22c55e\n\n| Квартал | Север | Юг  |\n|---------|-------|-----|\n| Q1      | 1200  | 900 |\n| Q2      | 1500  | 1100|\n| Q3      | 1800  | 1300|\n:::\n' },
        { label: 'Bar Stacked',    code: '\n:::chart\n[title]Расходы\n[type]bar-stacked\n[colors]#7234ff, #22c55e, #f59e0b\n\n| Месяц | Зарплаты | Инфра | Маркетинг |\n|-------|----------|-------|----------|\n| Янв   | 3200     | 800   | 400      |\n| Фев   | 3200     | 820   | 600      |\n:::\n' },
        { label: 'Bar Horizontal', code: '\n:::chart\n[title]Языки\n[type]bar-horizontal\n[colors]#7234ff, #22c55e, #f59e0b, #3b82f6\n\n| Язык       | Популярность |\n|------------|-------------|\n| Python     | 28           |\n| JavaScript | 24           |\n| TypeScript | 18           |\n| Go         | 14           |\n:::\n' },
      ]},
      { label: 'Pie',  icon: <BarChart2 size={12}/>, variants: [
        { label: 'Pie',       code: '\n:::chart\n[title]Источники\n[type]pie\n[colors]#7234ff, #22c55e, #f59e0b, #3b82f6\n\n| Источник | Доля |\n|----------|------|\n| Органика | 42   |\n| Прямой   | 28   |\n| Реклама  | 18   |\n| Соцсети  | 12   |\n:::\n' },
        { label: 'Pie Donut', code: '\n:::chart\n[title]Доли рынка\n[type]pie-donut\n[colors]#7234ff, #f59e0b, #22c55e, #3b82f6\n\n| Браузер | Доля |\n|---------|------|\n| Chrome  | 63   |\n| Firefox | 10   |\n| Safari  | 20   |\n| Другие  | 7    |\n:::\n' },
      ]},
      { label: 'Radar', icon: <BarChart2 size={12}/>, code: '\n:::chart\n[title]Навыки\n[type]radar\n[colors]#7234ff, #22c55e\n\n| Навык      | Фронтенд | Бэкенд |\n|------------|----------|---------|\n| TypeScript | 90       | 60     |\n| Python     | 40       | 95     |\n| SQL        | 55       | 88     |\n| DevOps     | 50       | 75     |\n| UI/UX      | 85       | 30     |\n:::\n' },
    ],
  },
];

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateConfig { parentPath: string; entryType: 'N'|'C'|'A'; }

function CreateModal({ config, onClose, onCreated, t }: {
  config: CreateConfig; onClose: () => void; onCreated: (f?: string) => void; t: TTokens;
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
    border:`1px solid ${t.border}`, background:t.bgHov, color:t.fg,
    fontSize:11, outline:'none', boxSizing:'border-box' as const, fontFamily:t.mono,
  };
  const lbl: React.CSSProperties = {
    fontSize:9, color:t.fgSub, textTransform:'uppercase' as const,
    letterSpacing:'0.07em', marginBottom:3, display:'block',
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:100010,background:'rgba(0,0,0,0.7)',
      display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:t.bgPanel,border:`1px solid ${t.borderHov}`,borderRadius:12,
        width:isA?480:360,maxHeight:'90vh',overflowY:'auto',padding:20,
        boxShadow:'0 24px 64px rgba(0,0,0,0.4)',fontFamily:t.mono}}
        onKeyDown={e=>{if(e.key==='Enter'&&!isA)create();if(e.key==='Escape')onClose();}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <Badge type={config.entryType}/>
          <span style={{fontSize:13,fontWeight:700,color:t.fg}}>Создать: {labels[config.entryType]}</span>
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
              style={{padding:'5px 8px',borderRadius:5,border:`1px solid ${t.border}`,
                background:t.bgHov,color:t.fgMuted,fontSize:10,cursor:'pointer',fontFamily:t.mono}}>↺</button>
          </div>
        </div>
        <div style={{marginBottom:isA?16:10}}>
          <label style={lbl}>Иконка (lucide.dev)</label>
          <input value={icon} onChange={e=>setIcon(e.target.value)}
            placeholder={defIco[config.entryType]} style={inp}/>
        </div>
        {isA&&(<>
          <div style={{borderTop:`1px solid ${t.border}`,paddingTop:14,marginBottom:12,
            fontSize:10,color:t.fgSub,textTransform:'uppercase',letterSpacing:'0.08em'}}>Frontmatter</div>
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
          <button onClick={onClose} style={{flex:1,padding:'7px',borderRadius:6,border:`1px solid ${t.border}`,background:'transparent',color:t.fgMuted,cursor:'pointer',fontSize:12,fontFamily:t.mono}}>Отмена</button>
          <button onClick={create} disabled={saving} style={{flex:1,padding:'7px',borderRadius:6,border:`1px solid ${t.accent}55`,background:t.accentSoft,color:t.accent,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:t.mono}}>
            {saving?'..':'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Modal (for existing N/C items) ────────────────────────────────────

function RenameModal({ entry, onClose, onRenamed, t }: {
  entry: TreeEntry; onClose: () => void; onRenamed: () => void; t: TTokens;
}) {
  const p = entry.parsed;
  const [title, setTitle] = useState(p.title);
  const [slug, setSlug]   = useState(p.slug || slugify(p.title));
  const [icon, setIcon]   = useState(p.icon || '');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 50); }, []);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ic = icon.trim() || (p.type === 'N' ? 'book' : 'folder');
      const newName = entry.type === 'file'
        ? `[${p.type}][${ic}]${title.trim()}${slug?`{${slug}}`:''}`.replace(/^\[null\]/, '') + '.md'
        : `[${p.type}][${ic}]${title.trim()}${slug?`{${slug}}`:''}`;

      const parent = entry.path.split('/').slice(0,-1).join('/');
      const newPath = `${parent}/${newName}`;

      // For directories: rename = copy subtree. Hub uses devBridge.
      // We'll use a rename action if available, or fallback message.
      // Since bridge doesn't have rename, we inform user.
      toast.info(`Переименование: переместите вручную или пересоздайте. Новое имя: ${newName}`);
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = {
    width:'100%', padding:'6px 8px', borderRadius:5,
    border:`1px solid ${t.border}`, background:t.bgHov, color:t.fg,
    fontSize:11, outline:'none', boxSizing:'border-box' as const, fontFamily:t.mono,
  };
  const lbl: React.CSSProperties = {
    fontSize:9, color:t.fgSub, textTransform:'uppercase' as const,
    letterSpacing:'0.07em', marginBottom:3, display:'block',
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:100010,background:'rgba(0,0,0,0.7)',
      display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:t.bgPanel,border:`1px solid ${t.borderHov}`,borderRadius:12,
        width:360,padding:20,boxShadow:'0 24px 64px rgba(0,0,0,0.4)',fontFamily:t.mono}}
        onKeyDown={e=>{if(e.key==='Enter')save();if(e.key==='Escape')onClose();}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <Edit3 size={14} style={{color:t.accent}}/>
          <span style={{fontSize:13,fontWeight:700,color:t.fg}}>Редактировать</span>
          {p.type && <Badge type={p.type}/>}
        </div>
        <div style={{marginBottom:10}}>
          <label style={lbl}>Название</label>
          <input ref={ref} value={title} onChange={e=>setTitle(e.target.value)} style={inp}/>
        </div>
        <div style={{marginBottom:10}}>
          <label style={lbl}>Slug</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} style={inp}/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={lbl}>Иконка (lucide.dev)</label>
          <input value={icon} onChange={e=>setIcon(e.target.value)} placeholder="book, folder, file-text..." style={inp}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'7px',borderRadius:6,border:`1px solid ${t.border}`,background:'transparent',color:t.fgMuted,cursor:'pointer',fontSize:12,fontFamily:t.mono}}>Отмена</button>
          <button onClick={save} disabled={saving} style={{flex:1,padding:'7px',borderRadius:6,border:`1px solid ${t.accent}55`,background:t.accentSoft,color:t.accent,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:t.mono}}>
            Применить
          </button>
        </div>
        <p style={{fontSize:10,color:t.fgSub,marginTop:10,lineHeight:1.5}}>
          ⚠️ Переименование папок требует ручного переноса файлов в файловой системе.
        </p>
      </div>
    </div>
  );
}

// ─── Block picker dropdown ────────────────────────────────────────────────────

function BlockPicker({ onInsert, t }: { onInsert: (code: string) => void; t: TTokens }) {
  const [open, setOpen]         = useState(false);
  const [activeGroup, setGroup] = useState(0);
  const [variantFor, setVariant] = useState<BlockSnippet|null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos]           = useState({ top: 0, left: 0 });

  const openPicker = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 420) });
    setOpen(true);
    setVariant(null);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!btnRef.current?.contains(target) && !(document.getElementById('hub-block-picker')?.contains(target))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPicker}
        title="Вставить блок"
        style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          width:22, height:20, borderRadius:3,
          border:'none', background: open ? t.bgActive : 'transparent',
          color: open ? t.accent : t.fgMuted, cursor:'pointer',
        }}
        onMouseEnter={e=>{if(!open)(e.currentTarget as HTMLButtonElement).style.background=t.bgHov;(e.currentTarget as HTMLButtonElement).style.color=t.fg;}}
        onMouseLeave={e=>{if(!open)(e.currentTarget as HTMLButtonElement).style.background='transparent';if(!open)(e.currentTarget as HTMLButtonElement).style.color=t.fgMuted;}}
      >
        <Plus size={12}/>
      </button>

      {open && typeof document !== 'undefined' && (
        <div
          id="hub-block-picker"
          style={{
            position:'fixed', top: pos.top, left: pos.left, zIndex:100020,
            width: 420, maxHeight: 380,
            background: t.bgPanel, border:`1px solid ${t.borderHov}`,
            borderRadius:10, boxShadow:'0 16px 48px rgba(0,0,0,0.5)',
            display:'flex', overflow:'hidden',
            fontFamily: t.mono,
          }}
        >
          {/* Group list */}
          <div style={{ width:110, borderRight:`1px solid ${t.border}`, overflowY:'auto', flexShrink:0 }}>
            {BLOCK_GROUPS.map((g, gi) => (
              <button key={gi} onClick={()=>{setGroup(gi);setVariant(null);}} style={{
                width:'100%', display:'flex', alignItems:'center', gap:6,
                padding:'8px 10px', border:'none', textAlign:'left', cursor:'pointer',
                background: activeGroup===gi ? t.accentSoft : 'transparent',
                color: activeGroup===gi ? t.accent : t.fgMuted,
                fontSize:11, fontWeight: activeGroup===gi ? 600 : 400,
                borderRight: activeGroup===gi ? `2px solid ${t.accent}` : '2px solid transparent',
              }}>
                {g.icon}
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.group}</span>
              </button>
            ))}
          </div>

          {/* Items / variants */}
          <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
            {!variantFor ? (
              BLOCK_GROUPS[activeGroup].items.map((item, ii) => (
                <button key={ii} onClick={()=>{
                  if (item.variants) { setVariant(item); }
                  else { onInsert(item.code!); setOpen(false); }
                }} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:8,
                  padding:'7px 10px', borderRadius:6, border:'none', cursor:'pointer',
                  background:'transparent', color:t.fg, fontSize:12, textAlign:'left',
                  justifyContent:'space-between',
                }}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=t.bgHov}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='transparent'}
                >
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <span style={{color:t.fgMuted}}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.variants && <ChevronRight size={10} style={{color:t.fgSub}}/>}
                </button>
              ))
            ) : (
              <>
                <button onClick={()=>setVariant(null)} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'5px 8px',
                  border:'none',background:'transparent',color:t.fgMuted,cursor:'pointer',
                  fontSize:11,marginBottom:4,
                }}>
                  <ChevronRight size={10} style={{transform:'rotate(180deg)'}}/> Назад
                </button>
                <div style={{fontSize:10,color:t.fgSub,padding:'2px 8px 6px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em'}}>
                  {variantFor.label}
                </div>
                {variantFor.variants!.map((v, vi) => (
                  <button key={vi} onClick={()=>{ onInsert(v.code); setOpen(false); }} style={{
                    width:'100%', display:'flex', alignItems:'center',
                    padding:'7px 10px', borderRadius:6, border:'none', cursor:'pointer',
                    background:'transparent', color:t.fg, fontSize:12, textAlign:'left',
                  }}
                    onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=t.bgHov}
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

// ─── Markdown highlighted textarea ────────────────────────────────────────────

function HighlightedEditor({ value, onChange, onKeyDown, isDark, t }: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isDark: boolean;
  t: TTokens;
}) {
  const taRef       = useRef<HTMLTextAreaElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState('');

  // Sync scroll between textarea and overlay
  const syncScroll = () => {
    if (taRef.current && overlayRef.current) {
      overlayRef.current.scrollTop  = taRef.current.scrollTop;
      overlayRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    setHighlighted(highlightMarkdown(value));
  }, [value]);

  const sharedStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    padding: '10px 12px',
    fontSize: 12,
    fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    lineHeight: 1.75,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    tabSize: 2,
    margin: 0,
    border: 'none',
    outline: 'none',
  };

  return (
    <div style={{ flex:1, position:'relative', overflow:'hidden', minHeight:0 }}>
      <style>{`
        .hub-md-overlay { ${isDark ? MD_HIGHLIGHT_CSS_DARK : MD_HIGHLIGHT_CSS_LIGHT} }
        .hub-md-overlay span { font-family: inherit; font-size: inherit; line-height: inherit; }
      `}</style>

      {/* Syntax highlight overlay */}
      <div
        ref={overlayRef}
        className="hub-md-overlay"
        style={{
          ...sharedStyle,
          overflow: 'hidden',
          color: 'transparent',
          background: t.bgHov,
          pointerEvents: 'none',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
        dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
      />

      {/* Actual textarea (transparent text, caret visible) */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => { onChange(e.target.value); syncScroll(); }}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        style={{
          ...sharedStyle,
          position: 'absolute',
          background: 'transparent',
          color: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
          caretColor: isDark ? '#e2e8f0' : '#1e293b',
          resize: 'none',
          zIndex: 2,
          scrollbarWidth: 'thin' as const,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// Export ref access helper
export function getEditorRef() { return null; }

// ─── Markdown Editor ──────────────────────────────────────────────────────────

function MarkdownEditor({ filePath, onClose, t, isDark }: {
  filePath: string; onClose: ()=>void; t: TTokens; isDark: boolean;
}) {
  const [fm, setFm]           = useState<FM>({...EMPTY_FM});
  const [body, setBody]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [fmOpen, setFmOpen]   = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const fmRef   = useRef(fm);
  const bodyRef = useRef(body);
  useEffect(() => { fmRef.current = fm; }, [fm]);
  useEffect(() => { bodyRef.current = body; }, [body]);

  const fileName = filePath.split('/').pop()?.replace(/\.md$/,'') ?? '';

  useEffect(() => {
    bridge.readFile(filePath)
      .then(({content}) => {
        const {fm:f, body:b} = parseFM(content);
        if (!f.icon) {
          const parsed = parseName(filePath.split('/').pop() ?? '');
          if (parsed.icon) f.icon = parsed.icon;
        }
        setFm(f); setBody(b); setDirty(false);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [filePath]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await bridge.writeFile(filePath, serializeFM(fmRef.current, bodyRef.current));
      setDirty(false);
      toast.success('Сохранено');
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

  // Insert at cursor
  const insertAtCursor = useCallback((snippet: string) => {
    // Find the hidden textarea via DOM
    const ta = document.querySelector('.hub-md-editor-area textarea') as HTMLTextAreaElement;
    if (!ta) {
      setBody(prev => prev + snippet);
      setDirty(true);
      return;
    }
    const s = ta.selectionStart ?? body.length;
    const e2 = ta.selectionEnd ?? body.length;
    const nv = body.slice(0,s) + snippet + body.slice(e2);
    setBody(nv);
    setDirty(true);
    setTimeout(()=>{
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + snippet.length;
    },0);
  }, [body]);

  const handleInsert = (before: string, after='') => {
    const ta = document.querySelector('.hub-md-editor-area textarea') as HTMLTextAreaElement;
    if (!ta) { insertAtCursor(before); return; }
    const s=ta.selectionStart, e2=ta.selectionEnd, sel=body.slice(s,e2);
    const nv = body.slice(0,s)+before+sel+after+body.slice(e2);
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
    border:`1px solid ${t.border}`, background:t.bgHov, color:t.fg,
    fontSize:10, outline:'none', fontFamily:t.mono, boxSizing:'border-box',
  };

  if (loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Loader2 size={18} style={{color:t.accent,animation:'devSpinAnim 1s linear infinite'}}/>
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:4,padding:'5px 8px',
        borderBottom:`1px solid ${t.border}`,background:t.bgPanel,flexShrink:0}}>
        <button onClick={onClose} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 7px',
          borderRadius:4,border:`1px solid ${t.border}`,
          background:'transparent',color:t.fgMuted,fontSize:10,cursor:'pointer',fontFamily:t.mono}}>← Назад</button>
        <span style={{fontSize:11,color:t.fg,flex:1,overflow:'hidden',
          textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:t.mono}}>
          {fileName}{dirty&&<span style={{color:t.warning,marginLeft:4}}>●</span>}
        </span>
        <button
          onClick={save}
          style={{
            display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:5,
            border:`1px solid ${dirty?t.accent+'55':t.border}`,
            background:dirty?t.accentSoft:'transparent',
            color:dirty?t.accent:t.fgMuted,fontSize:10,cursor:'pointer',fontFamily:t.mono,
          }}
        >
          {saving?<Loader2 size={11} style={{animation:'devSpinAnim 1s linear infinite'}}/>:<Save size={11}/>}
          Сохранить
        </button>
      </div>

      {/* Frontmatter */}
      <div style={{borderBottom:`1px solid ${t.border}`,flexShrink:0}}>
        <button onClick={()=>setFmOpen(v=>!v)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
            border:'none',background:t.bgPanel,color:t.fgSub,fontSize:10,fontWeight:700,
            textTransform:'uppercase',letterSpacing:'0.08em',cursor:'pointer',textAlign:'left',fontFamily:t.mono}}>
          {fmOpen?<ChevronDown size={10}/>:<ChevronRight size={10}/>}
          Frontmatter
          {fm.title&&<span style={{fontWeight:400,marginLeft:6,fontSize:9,color:t.fgSub}}>— {fm.title.slice(0,28)}</span>}
        </button>
        {fmOpen&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 8px',padding:'6px 10px 8px'}}>
            {([{k:'title',l:'Title',span:true},{k:'description',l:'Description',span:true},
               {k:'author',l:'Author'},{k:'date',l:'Date',tp:'date'},{k:'updated',l:'Updated',tp:'date'},
               {k:'tags',l:'Tags',span:true},{k:'icon',l:'Icon'},{k:'lang',l:'Lang'},{k:'robots',l:'Robots'},
            ] as Array<{k:keyof FM;l:string;span?:boolean;tp?:string}>).map(f=>(
              <div key={f.k} style={{gridColumn:f.span?'1 / -1':'auto'}}>
                <div style={{fontSize:9,color:t.fgSub,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.l}</div>
                <input type={f.tp??'text'} value={fm[f.k]}
                  onChange={e=>{setFm(p=>({...p,[f.k]:e.target.value}));setDirty(true);}}
                  style={inpS}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Syntax toolbar */}
      <div style={{display:'flex',gap:2,padding:'3px 8px',borderBottom:`1px solid ${t.border}`,
        flexShrink:0,background:t.bgPanel,flexWrap:'wrap'}}>
        {[
          {icon:<Bold size={11}/>,b:'**',a:'**',title:'Жирный'},
          {icon:<Italic size={11}/>,b:'_',a:'_',title:'Курсив'},
          {icon:<Code size={11}/>,b:'`',a:'`',title:'Код'},
          {icon:<Hash size={11}/>,b:'\n## ',a:'',title:'H2'},
          {icon:<List size={11}/>,b:'\n- ',a:'',title:'Список'},
          {icon:<Link size={11}/>,b:'[',a:'](url)',title:'Ссылка'},
          {icon:<Minus size={11}/>,b:'\n---\n',a:'',title:'HR'},
        ].map((btn,i)=>(
          <button key={i} onClick={()=>handleInsert(btn.b,btn.a)} title={btn.title}
            style={{display:'flex',alignItems:'center',justifyContent:'center',
              width:22,height:20,borderRadius:3,border:'none',background:'transparent',
              color:t.fgMuted,cursor:'pointer'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=t.bgHov;(e.currentTarget as HTMLButtonElement).style.color=t.fg}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent';(e.currentTarget as HTMLButtonElement).style.color=t.fgMuted}}>
            {btn.icon}
          </button>
        ))}
        {/* Divider */}
        <div style={{width:1,height:20,background:t.border,margin:'0 2px',alignSelf:'center'}}/>
        {/* Block picker */}
        <BlockPicker onInsert={insertAtCursor} t={t}/>
      </div>

      {/* Highlighted editor */}
      <div className="hub-md-editor-area" style={{flex:1,overflow:'hidden',minHeight:0}}>
        <HighlightedEditor
          value={body}
          onChange={v=>{setBody(v);setDirty(true);}}
          onKeyDown={handleTab}
          isDark={isDark}
          t={t}
        />
      </div>

      <StatusBar
        left={`${body.trim().split(/\s+/).filter(Boolean).length} слов`}
        right={saving ? '⟳ сохраняется...' : dirty ? '● Ctrl+S' : '✓ Сохранено'}
      />
    </div>
  );
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────

function TreeNode({ entry, onCreateChild, onDelete, onSelect, onEdit, selectedPath, t }: {
  entry: TreeEntry; onCreateChild: (c: CreateConfig)=>void;
  onDelete: (e: TreeEntry)=>void; onSelect: (p: string)=>void;
  onEdit: (e: TreeEntry)=>void;
  selectedPath: string; t: TTokens;
}) {
  const [expanded, setExpanded] = useState(entry.depth < 2);
  const [hov, setHov] = useState(false);
  const isDir = entry.type === 'dir';
  const isActive = entry.path === selectedPath;
  const p = entry.parsed;
  const clr: Record<string,string> = { N:t.accent, C:'#22c55e', A:'#f59e0b' };

  const iconBtn = (icon: React.ReactNode, title: string, onClick: ()=>void, danger?: boolean) => (
    <button title={title} onClick={e=>{e.stopPropagation();onClick();}}
      style={{width:18,height:18,borderRadius:3,border:'none',display:'flex',alignItems:'center',
        justifyContent:'center',background:'transparent',color:t.fgSub,cursor:'pointer'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=danger?t.danger:t.fg}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=t.fgSub}}>
      {icon}
    </button>
  );

  return (
    <div>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        onClick={()=>{
          if (isDir) setExpanded(v=>!v);
          else onSelect(entry.path);
        }}
        style={{display:'flex',alignItems:'center',gap:5,
          padding:`4px 8px 4px ${10+entry.depth*14}px`,borderRadius:5,cursor:'pointer',
          background:isActive?t.accentSoft:hov?t.bgHov:'transparent',userSelect:'none'}}>
        {isDir
          ?(expanded?<ChevronDown size={11} style={{color:t.fgSub,flexShrink:0}}/>
                    :<ChevronRight size={11} style={{color:t.fgSub,flexShrink:0}}/>)
          :<span style={{width:11,flexShrink:0}}/>}
        {isDir
          ?(expanded?<FolderOpen size={12} style={{color:clr[p.type??'']??t.fgSub,flexShrink:0}}/>
                    :<Folder size={12} style={{color:clr[p.type??'']??t.fgSub,flexShrink:0}}/>)
          :<FileText size={12} style={{color:t.fgSub,flexShrink:0}}/>}
        {p.type&&<Badge type={p.type}/>}
        {p.icon&&<span style={{fontSize:9,color:t.fgSub,flexShrink:0}}>⬡{p.icon}</span>}
        <span style={{fontSize:12,color:isActive?t.accent:t.fg,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
          {p.title||entry.name}
        </span>
        {p.slug&&hov&&<span style={{fontSize:9,color:t.fgSub,fontFamily:t.mono,flexShrink:0}}>/{p.slug}</span>}
        {hov&&(
          <div style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            {iconBtn(<Edit3 size={10}/>,'Редактировать',()=>onEdit(entry))}
            {isDir&&p.type==='N'&&iconBtn(<FolderPlus size={10}/>,'Категория',()=>onCreateChild({parentPath:entry.path,entryType:'C'}))}
            {isDir&&(p.type==='N'||p.type==='C')&&iconBtn(<FilePlus size={10}/>,'Статья',()=>onCreateChild({parentPath:entry.path,entryType:'A'}))}
            {iconBtn(<Trash2 size={10}/>,'Удалить',()=>onDelete(entry),true)}
          </div>
        )}
      </div>
      {isDir&&expanded&&entry.children.length>0&&(
        <div style={{borderLeft:`1px solid ${t.border}`,marginLeft:10+entry.depth*14+5}}>
          {entry.children.map(c=>(
            <TreeNode key={c.path} entry={c} onCreateChild={onCreateChild}
              onDelete={onDelete} onSelect={onSelect} onEdit={onEdit}
              selectedPath={selectedPath} t={t}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DocsPanel ────────────────────────────────────────────────────────────────

export default function DocsPanel() {
  const t = useContext(ThemeTokensContext);
  const isDark = t.bg === '#0c0c0e'; // dark bg check

  const [tree, setTree]             = useState<TreeEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedFile, setSelected] = useState<string|null>(null);
  const [createConfig, setCreate]   = useState<CreateConfig|null>(null);
  const [toDelete, setToDelete]     = useState<TreeEntry|null>(null);
  const [toEdit, setToEdit]         = useState<TreeEntry|null>(null);

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

  const handleEdit = useCallback((entry: TreeEntry) => {
    if (entry.type === 'file') {
      // Open editor for files
      setSelected(entry.path);
    } else {
      // Show rename modal for dirs
      setToEdit(entry);
    }
  }, []);

  const fileCount = tree.reduce(function c(acc: number, e: TreeEntry): number {
    return acc+(e.type==='file'?1:0)+(e.children?e.children.reduce(c,0):0);
  }, 0);

  if (selectedFile) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <MarkdownEditor filePath={selectedFile} onClose={()=>setSelected(null)} t={t} isDark={isDark}/>
      {createConfig&&<CreateModal config={createConfig} onClose={()=>setCreate(null)} onCreated={handleCreated} t={t}/>}
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',
        borderBottom:`1px solid ${t.border}`,flexShrink:0,background:t.bgPanel}}>
        <button
          onClick={()=>setCreate({parentPath:'Docs',entryType:'N'})}
          style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:6,
            border:`1px solid ${t.accent}55`,background:t.accentSoft,color:t.accent,
            fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:t.mono,
          }}
        >
          <Plus size={11}/> Nav Popover
        </button>
        <div style={{flex:1}}/>
        <button
          onClick={load}
          style={{display:'flex',alignItems:'center',gap:5,padding:'5px 9px',borderRadius:6,
            border:`1px solid ${t.border}`,background:'transparent',color:t.fgMuted,
            fontSize:11,cursor:'pointer',fontFamily:t.mono,}}
        >
          <RefreshCw size={11}/> Обновить
        </button>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        <ScrollArea style={{height:'100%',padding:'6px'}}>
          {loading
            ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:24,color:t.fgSub}}>
                <Loader2 size={14} style={{animation:'devSpinAnim 1s linear infinite'}}/>
                <span style={{fontSize:12}}>Загрузка...</span>
              </div>
            :tree.length===0
              ?<EmptyState icon={<FolderOpen size={32}/>} title="Docs/ пуста" desc="Создай первый Nav Popover"/>
              :tree.map(e=>(
                <TreeNode key={e.path} entry={e} onCreateChild={setCreate}
                  onDelete={setToDelete} onSelect={p=>setSelected(p)}
                  onEdit={handleEdit}
                  selectedPath={selectedFile??''} t={t}/>
              ))
          }
        </ScrollArea>
      </div>
      <StatusBar left={`${fileCount} страниц`} right="Docs/"/>
      {createConfig&&<CreateModal config={createConfig} onClose={()=>setCreate(null)} onCreated={handleCreated} t={t}/>}
      {toEdit&&<RenameModal entry={toEdit} onClose={()=>setToEdit(null)} onRenamed={()=>{setToEdit(null);load();}} t={t}/>}
      {toDelete&&(
        <ConfirmDialog message={`Удалить "${toDelete.parsed.title||toDelete.name}"?`}
          onConfirm={confirmDelete} onCancel={()=>setToDelete(null)} danger/>
      )}
    </div>
  );
}