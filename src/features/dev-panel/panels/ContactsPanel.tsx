import React, { useState, useEffect, useCallback, useContext } from 'react';
import { bridge } from '../useDevBridge';
import { ThemeTokensContext } from '../DevPanel';
import { toast } from '../components/Toast';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface Contact { href: string; title: string; subtitle: string; external: boolean; }

// Регексы с ограниченной длиной совпадения для защиты от ReDoS
const RE_BLOCK    = /\{([^{}]{1,500})\}/g;
const RE_HREF     = /href:\s*'([^']{0,300})'/;
const RE_TITLE    = /title:\s*'([^']{0,300})'/;
const RE_SUBTITLE = /subtitle:\s*'([^']{0,300})'/;

function parseContacts(ts: string): Contact[] {
  const matches = [...ts.matchAll(RE_BLOCK)];
  const result: Contact[] = [];
  for (const m of matches) {
    const block    = m[1];
    const href     = block.match(RE_HREF)?.[1]     ?? '';
    const title    = block.match(RE_TITLE)?.[1]    ?? '';
    const subtitle = block.match(RE_SUBTITLE)?.[1] ?? '';
    const external = block.includes('external: true');
    if (href) result.push({ href, title, subtitle, external });
  }
  return result;
}

function serializeContacts(contacts: Contact[]): string {
  const items = contacts.map(c => {
    const isExternal = !c.href.startsWith('mailto:');
    return `  { href: '${c.href}', title: '${c.title}', subtitle: '${c.subtitle}', external: ${isExternal} },`;
  }).join('\n');
  return `export interface ContactItem {
  href: string;
  title: string;
  subtitle: string;
  external: boolean;
}

export const CONTACTS: ContactItem[] = [
${items}
];
`;
}

function ContactRow({ contact, index, onChange, onDelete, t }: {
  readonly contact: Contact;
  readonly index: number;
  readonly onChange: (c: Contact) => void;
  readonly onDelete: () => void;
  readonly t: ReturnType<typeof import('../DevPanel').makeT>;
}) {
  const set = (key: keyof Contact, val: string) => onChange({ ...contact, [key]: val });

  const fieldStyle: React.CSSProperties = {
    flex: 1, padding: '5px 8px', borderRadius: 5,
    border: `1px solid ${t.border}`,
    background: t.inpBg, color: t.fg, fontSize: 11,
    outline: 'none', fontFamily: t.mono, minWidth: 0,
  };

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', background: t.surface,
        borderBottom: `1px solid ${t.border}`,
      }}>
        <span style={{ fontSize: 10, color: t.fgSub, fontFamily: t.mono }}>#{index + 1}</span>
        <span style={{ flex: 1, fontSize: 11, color: t.fg, fontWeight: 500 }}>
          {contact.title || 'Без названия'}
        </span>
        <span style={{
          fontSize: 9, padding: '1px 5px', borderRadius: 3,
          background: t.surfaceHov, color: t.fgMuted,
        }}>
          {contact.href.startsWith('mailto:') ? 'email' : 'external'}
        </span>
        <button
          onClick={onDelete}
          style={{ display: 'flex', padding: 3, borderRadius: 4, border: 'none', background: 'transparent', color: t.fgSub, cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.danger; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fgSub; }}
        >
          <Trash2 size={11}/>
        </button>
      </div>
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={contact.title}    onChange={e => set('title',    e.target.value)} placeholder="Название (GitHub, Telegram...)" style={fieldStyle}/>
          <input value={contact.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Подпись"                        style={fieldStyle}/>
        </div>
        <input value={contact.href} onChange={e => set('href', e.target.value)}
          placeholder="https://... или mailto:..."
          style={{ ...fieldStyle, fontFamily: t.mono }}/>
      </div>
    </div>
  );
}

export default function ContactsPanel() {
  const t = useContext(ThemeTokensContext);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { content } = await bridge.readContacts();
      setContacts(parseContacts(content));
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await bridge.writeContacts(serializeContacts(contacts));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Контакты сохранены');
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const addContact = () =>
    setContacts(prev => [...prev, { href: '', title: '', subtitle: '', external: true }]);

  // Коллбэки вынесены из JSX, чтобы не превышать допустимую глубину вложенности функций
  const handleChange = useCallback((i: number, nc: Contact) => {
    setContacts(prev => prev.map((x, idx) => idx === i ? nc : x));
  }, []);

  const handleDelete = useCallback((i: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgSub, gap: 8 }}>
      <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }}/>
      <span style={{ fontSize: 12 }}>Загрузка...</span>
    </div>
  );

  // Фон кнопки "Сохранить" в состоянии saved зависит от текущей темы
  const savedBg = t.isDark ? 'rgba(34,197,94,0.1)' : 'rgba(22,163,74,0.08)';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }} className="adm-scroll">
        {contacts.map((c, i) => (
          <ContactRow
            key={c.href || `new-${i}`}
            contact={c}
            index={i}
            t={t}
            onChange={nc => handleChange(i, nc)}
            onDelete={() => handleDelete(i)}
          />
        ))}
        <button
          onClick={addContact}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px', borderRadius: 7,
            border: `1px dashed ${t.border}`,
            background: 'transparent', color: t.fgMuted,
            fontSize: 11, cursor: 'pointer', fontFamily: t.mono,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.borderStrong; (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;       (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
        >
          <Plus size={13}/> Добавить контакт
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', color: t.danger, fontSize: 11, display: 'flex', gap: 5 }}>
          <AlertCircle size={11}/> {error}
        </div>
      )}

      <div style={{
        padding: '8px 12px', borderTop: `1px solid ${t.border}`,
        background: t.surface, flexShrink: 0, display: 'flex', gap: 8,
      }}>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 11px', borderRadius: 7,
            border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted,
            fontSize: 11, cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          Обновить
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 7,
            border: `1px solid ${saved ? t.success + '66' : t.borderStrong}`,
            background: saved ? savedBg : t.surfaceHov,
            color: saved ? t.success : t.fg,
            fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          {saving && <Loader2 size={11} style={{ animation: 'devSpinAnim 1s linear infinite' }}/>}
          {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
