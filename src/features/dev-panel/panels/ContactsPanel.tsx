/**
 * ContactsPanel — редактор контактов
 * Парсит contacts.ts, показывает GUI для редактирования,
 * сериализует обратно и сохраняет через бридж
 */

import React, { useState, useEffect, useCallback } from 'react';
import { bridge } from '../useDevBridge';
import { T } from '../DevPanel';
import { Plus, Trash2, Save, Loader2, GripVertical, AlertCircle, ExternalLink } from 'lucide-react';

interface Contact {
  href: string;
  title: string;
  subtitle: string;
  external: boolean;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseContacts(ts: string): Contact[] {
  const matches = [...ts.matchAll(/\{([^}]+)\}/g)];
  const result: Contact[] = [];

  for (const m of matches) {
    const block = m[1];
    const href     = block.match(/href:\s*'([^']+)'/)?.[1] ?? '';
    const title    = block.match(/title:\s*'([^']+)'/)?.[1] ?? '';
    const subtitle = block.match(/subtitle:\s*'([^']+)'/)?.[1] ?? '';
    const external = block.includes('external: true');
    if (href) result.push({ href, title, subtitle, external });
  }

  return result;
}

function serializeContacts(contacts: Contact[]): string {
  const items = contacts.map(c =>
    `  { href: '${c.href}', title: '${c.title}', subtitle: '${c.subtitle}', external: ${c.external} },`
  ).join('\n');

  return `export interface ContactItem {
  href: string;
  title: string;
  subtitle: string;
  /** Открывать в новой вкладке */
  external: boolean;
}

export const CONTACTS: ContactItem[] = [
${items}
];
`;
}

// ─── ContactRow ───────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  index,
  onChange,
  onDelete,
}: {
  contact: Contact;
  index: number;
  onChange: (c: Contact) => void;
  onDelete: () => void;
}) {
  const set = (key: keyof Contact, val: string | boolean) =>
    onChange({ ...contact, [key]: val });

  const fieldStyle: React.CSSProperties = {
    flex: 1, padding: '5px 7px', borderRadius: 5,
    border: `1px solid ${T.border}`,
    background: T.bgHov, color: T.fg, fontSize: 11,
    outline: 'none', fontFamily: 'inherit',
    minWidth: 0,
  };

  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 8, marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', background: T.bgPanel,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{ fontSize: 10, color: T.fgSub, fontFamily: 'ui-monospace, monospace' }}>
          #{index + 1}
        </span>
        <span style={{ flex: 1, fontSize: 11, color: T.fg, fontWeight: 600 }}>
          {contact.title || 'Без названия'}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.fgSub, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={contact.external}
            onChange={e => set('external', e.target.checked)}
            style={{ accentColor: T.accent }}
          />
          <ExternalLink size={10} />
          external
        </label>
        <button
          onClick={onDelete}
          style={{
            display: 'flex', padding: 3, borderRadius: 4,
            border: 'none', background: 'transparent',
            color: T.fgSub, cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.danger; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.fgSub; }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={contact.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Название (GitHub, Telegram...)"
            style={{ ...fieldStyle }}
          />
          <input
            value={contact.subtitle}
            onChange={e => set('subtitle', e.target.value)}
            placeholder="Подпись (@veilosophy...)"
            style={{ ...fieldStyle }}
          />
        </div>
        <input
          value={contact.href}
          onChange={e => set('href', e.target.value)}
          placeholder="https://... или mailto:..."
          style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace' }}
        />
      </div>
    </div>
  );
}

// ─── ContactsPanel ────────────────────────────────────────────────────────────

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { content } = await bridge.readContacts();
      setContacts(parseContacts(content));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const ts = serializeContacts(contacts);
      await bridge.writeContacts(ts);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    setContacts(prev => [...prev, { href: '', title: '', subtitle: '', external: true }]);
  };

  const updateContact = (i: number, c: Contact) => {
    setContacts(prev => prev.map((x, idx) => idx === i ? c : x));
  };

  const deleteContact = (i: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== i));
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.fgSub, gap: 8 }}>
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 12 }}>Загрузка...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', scrollbarWidth: 'thin' }}>
        {contacts.map((c, i) => (
          <ContactRow
            key={i}
            contact={c}
            index={i}
            onChange={nc => updateContact(i, nc)}
            onDelete={() => deleteContact(i)}
          />
        ))}

        <button
          onClick={addContact}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px', borderRadius: 7,
            border: `1px dashed ${T.border}`,
            background: 'transparent', color: T.fgMuted,
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent; (e.currentTarget as HTMLButtonElement).style.color = T.accent; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted; }}
        >
          <Plus size={13} /> Добавить контакт
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', color: T.danger, fontSize: 11, display: 'flex', gap: 5 }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}

      <div style={{
        padding: '10px 12px', borderTop: `1px solid ${T.border}`,
        background: T.bg, flexShrink: 0,
        display: 'flex', gap: 8,
      }}>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 10px', borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: T.bgHov, color: T.fgMuted,
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Loader2 size={11} /> Перезагрузить
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px', borderRadius: 6,
            border: `1px solid ${saved ? T.success + '55' : T.accent + '55'}`,
            background: saved ? 'rgba(34,197,94,0.1)' : T.accentSoft,
            color: saved ? T.success : T.accent,
            fontSize: 11, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={11} />}
          {saved ? 'Сохранено!' : 'Сохранить contacts.ts'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}