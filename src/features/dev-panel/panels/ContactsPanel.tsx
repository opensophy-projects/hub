import React, { useState, useEffect, useCallback, useContext } from 'react';
import { bridge } from '../useDevBridge';
import { ThemeTokensContext } from '../theme';
import { toast } from '../components/toastBus';
import { PlusIcon as Plus, TrashIcon as Trash2, CircleNotchIcon as Loader2, WarningCircleIcon as AlertCircle } from '@phosphor-icons/react';

interface Contact { href: string; title: string; subtitle: string; external: boolean; }

const RE_BLOCK    = /\{([^{}]{1,500})\}/g;
const RE_HREF     = /href:\s*'([^']{0,300})'/;
const RE_TITLE    = /title:\s*'([^']{0,300})'/;
const RE_SUBTITLE = /subtitle:\s*'([^']{0,300})'/;

function parseContacts(ts: string): Contact[] {
  const matches = [...ts.matchAll(RE_BLOCK)];
  const result: Contact[] = [];
  for (const m of matches) {
    const block    = m[1];
    const href     = RE_HREF.exec(block)?.[1]     ?? '';
    const title    = RE_TITLE.exec(block)?.[1]    ?? '';
    const subtitle = RE_SUBTITLE.exec(block)?.[1] ?? '';
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
  readonly t: ReturnType<typeof import('../theme').makeT>;
}) {
  const set = (key: keyof Contact, val: string) => onChange({ ...contact, [key]: val });

  const fieldStyle: React.CSSProperties = {
    flex: 1, padding: '5px 8px', borderRadius: 5,
    border: `1px solid ${t.border}`,
    background: t.inpBg, color: t.fg, fontSize: 14,
    outline: 'none', fontFamily: t.mono, minWidth: 0,
  };

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', background: t.surface,
        borderBottom: `1px solid ${t.border}`,
      }}>
        <span style={{ fontSize: 12, color: t.fgSub, fontFamily: t.mono }}>#{index + 1}</span>
        <span style={{ flex: 1, fontSize: 14, color: t.fg, fontWeight: 500 }}>
          {contact.title || 'Без названия'}
        </span>
        <span style={{
          fontSize: 11, padding: '1px 5px', borderRadius: 3,
          background: t.surfaceHov, color: t.fgMuted,
        }}>
          {contact.href.startsWith('mailto:') ? 'email' : 'external'}
        </span>
        <button
          onClick={onDelete}
          style={{ display: 'flex', padding: 3, borderRadius: 4, border: 'none', background: 'transparent', color: t.fgSub, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = t.danger; }}
          onMouseLeave={e => { e.currentTarget.style.color = t.fgSub; }}
        >
          <Trash2 size={14} weight="duotone" />
        </button>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

  const handleChange = useCallback((i: number, nc: Contact) => {
    setContacts(prev => prev.map((x, idx) => idx === i ? nc : x));
  }, []);

  const handleDelete = useCallback((i: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgSub, gap: 8 }}>
      <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }} weight="duotone" />
      <span style={{ fontSize: 12 }}>Загрузка...</span>
    </div>
  );

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
            padding: '11px', borderRadius: 7,
            border: `1px dashed ${t.border}`,
            background: 'transparent', color: t.fgMuted,
            fontSize: 14, cursor: 'pointer', fontFamily: t.mono,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderStrong; e.currentTarget.style.color = t.fg; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border;       e.currentTarget.style.color = t.fgMuted; }}
        >
          <Plus size={15} weight="duotone" /> Добавить контакт
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', color: t.danger, fontSize: 14, display: 'flex', gap: 8 }}>
          <AlertCircle size={11} weight="duotone" /> {error}
        </div>
      )}

      <div style={{
        padding: '8px 12px', borderTop: `1px solid ${t.border}`,
        background: t.surface, flexShrink: 0, display: 'flex', gap: 8,
      }}>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 11px', borderRadius: 7,
            border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted,
            fontSize: 14, cursor: 'pointer', fontFamily: t.mono,
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
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          {saving && <Loader2 size={11} style={{ animation: 'devSpinAnim 1s linear infinite' }} weight="duotone" />}
          {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}