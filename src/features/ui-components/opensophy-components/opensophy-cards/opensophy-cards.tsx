import { useState } from "react";

const tokens = {
  dark: {
    bg: "#0f0f0f",
    bg2: "#161616",
    bg3: "#1c1c1c",
    border: "rgba(255,255,255,0.10)",
    borderHov: "rgba(255,255,255,0.20)",
    fg: "rgba(255,255,255,0.88)",
    fgMuted: "rgba(255,255,255,0.52)",
    fgSub: "rgba(255,255,255,0.30)",
    accent: "#a78bfa",
    accentSoft: "rgba(167,139,250,0.12)",
    shadow: "0 2px 12px rgba(0,0,0,0.5)",
    shadowSoft: "0 1px 4px rgba(0,0,0,0.3)",
    inputBg: "#0f0f0f",
    tag: "rgba(255,255,255,0.06)",
  },
  light: {
    bg: "#E8E7E3",
    bg2: "#dddcd8",
    bg3: "#d4d3cf",
    border: "rgba(0,0,0,0.11)",
    borderHov: "rgba(0,0,0,0.22)",
    fg: "rgba(0,0,0,0.85)",
    fgMuted: "rgba(0,0,0,0.50)",
    fgSub: "rgba(0,0,0,0.30)",
    accent: "#7c3aed",
    accentSoft: "rgba(124,58,237,0.10)",
    shadow: "0 2px 10px rgba(0,0,0,0.10)",
    shadowSoft: "0 1px 3px rgba(0,0,0,0.08)",
    inputBg: "#f0efe9",
    tag: "rgba(0,0,0,0.05)",
  },
};

const darkAlerts = {
  green:  ["rgba(34,197,94,0.07)",  "rgba(34,197,94,0.18)",  "rgba(134,239,172,0.92)"],
  purple: ["rgba(168,85,247,0.07)", "rgba(168,85,247,0.18)", "rgba(216,180,254,0.92)"],
  yellow: ["rgba(234,179,8,0.08)",  "rgba(234,179,8,0.20)",  "rgba(253,224,71,0.92)"],
  orange: ["rgba(249,115,22,0.08)", "rgba(249,115,22,0.20)", "rgba(253,186,116,0.92)"],
  red:    ["rgba(239,68,68,0.08)",  "rgba(239,68,68,0.20)",  "rgba(252,165,165,0.92)"],
  blue:   ["rgba(59,130,246,0.07)", "rgba(59,130,246,0.18)", "rgba(147,197,253,0.92)"],
};
const lightAlerts = {
  green:  ["#d4ddd4", "rgba(82,130,90,0.22)",   "#446a4c"],
  purple: ["#dad4e0", "rgba(122,90,160,0.22)",  "#664888"],
  yellow: ["#dedad0", "rgba(143,120,48,0.22)",  "#7a6428"],
  orange: ["#dfd7d0", "rgba(170,101,43,0.22)",  "#8a5428"],
  red:    ["#ddd4d4", "rgba(160,82,82,0.22)",   "#884040"],
  blue:   ["#d4d9e0", "rgba(85,128,160,0.22)",  "#4a6f8a"],
};

const radiusMap = { round: 24, soft: 14, sharp: 2 };

// ── Icons (inline SVG to avoid import deps) ──────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IconCheck    = (p) => <Icon {...p} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IconInfo     = (p) => <Icon {...p} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IconWarn     = (p) => <Icon {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />;
const IconError    = (p) => <Icon {...p} d="M18.364 18.364A9 9 0 105.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />;
const IconBell     = (p) => <Icon {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />;
const IconStar     = (p) => <Icon {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
const IconCode     = (p) => <Icon {...p} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />;
const IconKey      = (p) => <Icon {...p} d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />;
const IconLock     = (p) => <Icon {...p} d="M19 11H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zm-7-4a4 4 0 00-4 4v1h8V7a4 4 0 00-4-4z" />;
const IconBolt     = (p) => <Icon {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
const IconSun      = (p) => <Icon {...p} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z" />;
const IconMoon     = (p) => <Icon {...p} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />;
const IconCopy     = (p) => <Icon {...p} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />;
const IconOk       = (p) => <Icon {...p} d="M5 13l4 4L19 7" />;

// ── Card component (self-contained) ──────────────────────────────────────────
function Card({ title, description, icon, radius = "soft", alert, children, t, isDark, hoverLift = true }) {
  const [hov, setHov] = useState(false);
  const alertColors = alert ? (isDark ? darkAlerts : lightAlerts)[alert] : undefined;
  const bg     = alertColors?.[0] ?? (isDark ? "#0f0f0f" : "rgba(0,0,0,0.02)");
  const border = alertColors?.[1] ?? t.border;
  const iconClr = alertColors?.[2] ?? t.fgMuted;
  const r = radiusMap[radius] ?? 14;

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", overflow: "hidden", minHeight: 120, padding: 18,
        borderRadius: r, border: `1px solid ${hov && !alert ? t.borderHov : border}`,
        background: bg, color: t.fg,
        boxShadow: alert ? "none" : (hov ? t.shadow : t.shadowSoft),
        transform: hov && hoverLift ? "translateY(-2px)" : "translateY(0)",
        transition: "transform .15s ease, box-shadow .15s ease, border-color .15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {icon && (
          <div style={{
            width: 34, height: 34, borderRadius: Math.max(2, r - 8),
            display: "grid", placeItems: "center", color: iconClr, flexShrink: 0,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${border}`,
          }}>
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          {title && <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: t.fg }}>{title}</h3>}
          {description && <p style={{ margin: "5px 0 0", color: alert ? iconClr : t.fgMuted, fontSize: 13, lineHeight: 1.55 }}>{description}</p>}
          {children && <div style={{ marginTop: 10, color: t.fgMuted, fontSize: 13, lineHeight: 1.6 }}>{children}</div>}
        </div>
      </div>
    </article>
  );
}

// ── Code block ────────────────────────────────────────────────────────────────
function CodeBlock({ code, t, isDark }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return (
    <div style={{ position: "relative", borderRadius: 10, border: `1px solid ${t.border}`, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 14px", background: isDark ? "#111" : t.bg3,
        borderBottom: `1px solid ${t.border}`,
      }}>
        <span style={{ fontSize: 11, color: t.fgSub, fontFamily: "monospace", letterSpacing: "0.05em" }}>TSX</span>
        <button onClick={copy} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6,
          border: `1px solid ${t.border}`, background: "transparent", cursor: "pointer",
          color: copied ? t.accent : t.fgMuted, fontSize: 11, transition: "color .15s",
        }}>
          {copied ? <IconOk size={12} /> : <IconCopy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: "14px 16px", overflowX: "auto", fontSize: 12.5, lineHeight: 1.65,
        fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
        background: isDark ? "#0a0a0a" : "#f5f4f0", color: t.fg,
        whiteSpace: "pre",
      }}>
        <code dangerouslySetInnerHTML={{ __html: highlightTsx(code) }} />
      </pre>
    </div>
  );
}

function highlightTsx(code) {
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#86efac">$1</span>')
    .replace(/\b(import|export|default|from|const|let|type|interface|return|function|if|else|true|false|undefined|null)\b/g, '<span style="color:#c4b5fd">$1</span>')
    .replace(/\b(string|number|boolean|React|ReactNode|FC)\b/g, '<span style="color:#93c5fd">$1</span>')
    .replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280">$1</span>')
    .replace(/\b([A-Z][a-zA-Z]+)(?=[ &lt;])/g, '<span style="color:#fbbf24">$1</span>');
}

// ── Prop table ────────────────────────────────────────────────────────────────
function PropRow({ name, type, def, desc, t }) {
  return (
    <tr>
      <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12.5, color: "#a78bfa", fontWeight: 600, whiteSpace: "nowrap" }}>{name}</td>
      <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: t.fgMuted, whiteSpace: "nowrap" }}>{type}</td>
      <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: t.fgSub }}>{def ?? "—"}</td>
      <td style={{ padding: "9px 12px", fontSize: 13, color: t.fgMuted, lineHeight: 1.4 }}>{desc}</td>
    </tr>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ label, title, t }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: t.accent }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.accent }}>{label}</span>
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: t.fg, lineHeight: 1.25 }}>{title}</h2>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
function Tag({ children, t }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 5,
      background: t.tag, border: `1px solid ${t.border}`,
      fontSize: 11, color: t.fgMuted, fontFamily: "monospace",
    }}>{children}</span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OpensophyCardDocs() {
  const [isDark, setIsDark] = useState(true);
  const t = tokens[isDark ? "dark" : "light"];

  const alertTones = ["green", "purple", "yellow", "orange", "red", "blue"];
  const alertIcons = {
    green:  <IconCheck size={16} />,
    purple: <IconBell  size={16} />,
    yellow: <IconWarn  size={16} />,
    orange: <IconBolt  size={16} />,
    red:    <IconError size={16} />,
    blue:   <IconInfo  size={16} />,
  };
  const alertTitles = {
    green: "Success", purple: "Notice", yellow: "Warning",
    orange: "Caution", red: "Error", blue: "Info",
  };
  const alertDescs = {
    green:  "Your changes were saved successfully.",
    purple: "You have a new message in your inbox.",
    yellow: "This action may have unintended effects.",
    orange: "Proceed carefully — this step is irreversible.",
    red:    "Something went wrong. Please try again.",
    blue:   "This feature is currently in beta.",
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.fg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", transition: "background .2s, color .2s" }}>

      {/* ── Top bar ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, borderBottom: `1px solid ${t.border}`, background: isDark ? "rgba(15,15,15,0.88)" : "rgba(232,231,227,0.88)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.fg, letterSpacing: "-0.01em" }}>OpensophyCard</span>
            <Tag t={t}>v1.0</Tag>
          </div>
          <button onClick={() => setIsDark(d => !d)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${t.border}`, background: t.bg2, color: t.fgMuted, fontSize: 12,
          }}>
            {isDark ? <IconSun size={13} /> : <IconMoon size={13} />}
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: t.accentSoft, border: `1px solid ${t.border}`, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: t.accent, textTransform: "uppercase" }}>Component</span>
          </div>
          <h1 style={{ margin: "0 0 14px", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, color: t.fg }}>
            OpensophyCard
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 15, color: t.fgMuted, lineHeight: 1.65, maxWidth: 560 }}>
            Универсальный блок-карточка с поддержкой иконок, цветовых тонов алертов и трёх радиусов скругления. Подходит для информационных блоков, уведомлений и акцентных секций.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["alert", "icon", "radius", "children", "hover"].map(tag => <Tag key={tag} t={t}>{tag}</Tag>)}
          </div>
        </div>

        {/* ── Separator ── */}
        <div style={{ height: 1, background: t.border, marginBottom: 52 }} />

        {/* ── Import ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Setup" title="Импорт" t={t} />
          <CodeBlock t={t} isDark={isDark} code={`import { OpensophyCard } from '@/components/OpensophyCard';`} />
        </div>

        {/* ── Basic usage ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Usage" title="Базовые варианты" t={t} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12, marginBottom: 20 }}>
            <Card t={t} isDark={isDark} title="Без иконки"
              description="Самый минимальный вариант — только заголовок и описание." />
            <Card t={t} isDark={isDark} title="С иконкой" icon={<IconStar size={16} />}
              description="Иконка задаётся через проп icon и принимает любой ReactNode." />
            <Card t={t} isDark={isDark} title="С children" icon={<IconCode size={16} />}
              description="Дополнительный контент через children.">
              <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: t.tag, border: `1px solid ${t.border}`, fontFamily: "monospace", fontSize: 12, color: t.fgMuted }}>
                {'<OpensophyCard title="..." />'}
              </div>
            </Card>
          </div>
          <CodeBlock t={t} isDark={isDark} code={`// Без иконки
<OpensophyCard
  title="Без иконки"
  description="Самый минимальный вариант." />

// С иконкой
<OpensophyCard
  title="С иконкой"
  icon={<Star size={18} />}
  description="Иконка принимает любой ReactNode." />

// С children
<OpensophyCard title="С children" icon={<Code size={18} />}>
  <span>Дополнительный контент</span>
</OpensophyCard>`} />
        </div>

        {/* ── Radius ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Prop: radius" title="Скругление углов" t={t} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[["sharp", "Острые", "radius=\"sharp\""], ["soft", "Мягкие", "radius=\"soft\""], ["round", "Круглые", "radius=\"round\""]].map(([r, label, hint]) => (
              <Card key={r} t={t} isDark={isDark} radius={r} icon={<IconStar size={16} />}
                title={label}
                description={hint} />
            ))}
          </div>
          <CodeBlock t={t} isDark={isDark} code={`type OpensophyRadius = 'round' | 'soft' | 'sharp';

// radius="sharp"  → borderRadius: 2px
// radius="soft"   → borderRadius: 14px  (default)
// radius="round"  → borderRadius: 24px

<OpensophyCard radius="round" title="Круглые" icon={<Star />} />`} />
        </div>

        {/* ── Alert tones grid ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Prop: alert" title="Цветовые тоны (alert)" t={t} />
          <p style={{ margin: "0 0 20px", fontSize: 13, color: t.fgMuted, lineHeight: 1.6 }}>
            Проп <code style={{ fontFamily: "monospace", color: t.accent }}>alert</code> задаёт цветовую тему карточки: фон, рамку и цвет иконки/описания автоматически адаптируются под светлую и тёмную темы.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 12, marginBottom: 20 }}>
            {alertTones.map(tone => (
              <Card key={tone} t={t} isDark={isDark}
                alert={tone} radius="soft"
                icon={alertIcons[tone]}
                title={alertTitles[tone]}
                description={alertDescs[tone]}
              />
            ))}
          </div>
          <CodeBlock t={t} isDark={isDark} code={`type OpensophyAlertTone =
  | 'green' | 'purple' | 'yellow'
  | 'orange' | 'red' | 'blue';

// Каждый тон включает три цвета: [bg, border, iconColor]
// Автоматически переключаются между dark/light темой

<OpensophyCard
  alert="green"
  icon={<CheckCircle2 size={18} />}
  title="Success"
  description="Your changes were saved." />

<OpensophyCard
  alert="red"
  icon={<OctagonX size={18} />}
  title="Error"
  description="Something went wrong." />`} />
        </div>

        {/* ── Alert tones dark/light comparison ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Theming" title="Dark / Light адаптация" t={t} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* dark side */}
            <div style={{ borderRadius: 14, border: `1px solid ${tokens.dark.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: "#111", borderBottom: `1px solid ${tokens.dark.border}`, fontSize: 11, color: tokens.dark.fgSub, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dark</div>
              <div style={{ padding: 14, background: tokens.dark.bg, display: "flex", flexDirection: "column", gap: 10 }}>
                {["green", "red", "blue"].map(tone => (
                  <Card key={tone} t={tokens.dark} isDark={true} alert={tone} radius="soft" hoverLift={false}
                    icon={alertIcons[tone]} title={alertTitles[tone]} description={alertDescs[tone]} />
                ))}
              </div>
            </div>
            {/* light side */}
            <div style={{ borderRadius: 14, border: `1px solid ${tokens.light.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: tokens.light.bg3, borderBottom: `1px solid ${tokens.light.border}`, fontSize: 11, color: tokens.light.fgSub, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Light</div>
              <div style={{ padding: 14, background: tokens.light.bg, display: "flex", flexDirection: "column", gap: 10 }}>
                {["green", "red", "blue"].map(tone => (
                  <Card key={tone} t={tokens.light} isDark={false} alert={tone} radius="soft" hoverLift={false}
                    icon={alertIcons[tone]} title={alertTitles[tone]} description={alertDescs[tone]} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Combination examples ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Examples" title="Составные примеры" t={t} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))", gap: 12, marginBottom: 20 }}>
            <Card t={t} isDark={isDark} title="API Key" icon={<IconKey size={16} />} radius="soft"
              description="Ваш ключ активен и не истекает до конца расчётного периода.">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "6px 10px", borderRadius: 7, background: t.tag, border: `1px solid ${t.border}` }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: t.fgMuted, letterSpacing: "0.05em" }}>sk-••••••••••••4f2a</span>
                <button style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", color: t.fgSub, display: "flex" }}><IconCopy size={13} /></button>
              </div>
            </Card>
            <Card t={t} isDark={isDark} alert="yellow" title="Устаревший метод" icon={<IconWarn size={16} />} radius="soft"
              description="Этот метод помечен как deprecated и будет удалён в v3.0. Используйте новый API.">
            </Card>
            <Card t={t} isDark={isDark} title="Безопасность" icon={<IconLock size={16} />} radius="round"
              description="Двухфакторная аутентификация включена.">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: 12, color: t.fgMuted }}>2FA активна</span>
              </div>
            </Card>
            <Card t={t} isDark={isDark} alert="blue" title="Новая возможность" icon={<IconBolt size={16} />} radius="soft"
              description="Автодополнение кода теперь работает в 3× быстрее благодаря новому движку.">
            </Card>
            <Card t={t} isDark={isDark} alert="green" title="Деплой завершён" icon={<IconCheck size={16} />} radius="sharp"
              description="Версия 2.4.1 успешно задеплоена на production.">
            </Card>
            <Card t={t} isDark={isDark} title="Статистика" icon={<IconStar size={16} />} radius="soft"
              description="Сводка за текущий месяц.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                {[["Запросов", "12 840"], ["Ошибок", "0.2%"]].map(([k, v]) => (
                  <div key={k} style={{ padding: "8px 10px", borderRadius: 7, background: t.tag, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 11, color: t.fgSub, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.fg, fontFamily: "monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── Props table ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="API" title="Props" t={t} />
          <div style={{ borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: isDark ? "#111" : t.bg3 }}>
                  {["Prop", "Type", "Default", "Description"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: t.fgSub, borderBottom: `1px solid ${t.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["title",       "string",                 "—",        "Заголовок карточки"],
                  ["description", "string",                 "—",        "Текст описания под заголовком"],
                  ["icon",        "ReactNode",              "—",        "Иконка — любой JSX-элемент (рекомендуется size=18)"],
                  ["radius",      "'round'|'soft'|'sharp'", "'soft'",   "Скругление: 24px / 14px / 2px"],
                  ["alert",       "OpensophyAlertTone",     "—",        "Цветовой тон: green, purple, yellow, orange, red, blue"],
                  ["children",    "ReactNode",              "—",        "Произвольный контент под описанием"],
                ].map(([name, type, def, desc]) => (
                  <tr key={name} style={{ borderTop: `1px solid ${t.border}` }}>
                    <PropRow name={name} type={type} def={def} desc={desc} t={t} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Full example code ── */}
        <div style={{ marginBottom: 52 }}>
          <SectionHead label="Full example" title="Полный пример" t={t} />
          <CodeBlock t={t} isDark={isDark} code={`import { OpensophyCard } from '@/components/OpensophyCard';
import { CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

export function MyPage() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>

      {/* Базовая карточка */}
      <OpensophyCard
        title="API Key"
        icon={<Lock size={18} />}
        description="Ваш ключ активен."
      />

      {/* Алерт-предупреждение */}
      <OpensophyCard
        alert="yellow"
        icon={<AlertTriangle size={18} />}
        title="Устаревший метод"
        description="Используйте новый API начиная с v3.0."
      />

      {/* Алерт-успех с round radius */}
      <OpensophyCard
        alert="green"
        radius="round"
        icon={<CheckCircle2 size={18} />}
        title="Деплой завершён"
        description="Версия 2.4.1 успешно задеплоена."
      />

    </div>
  );
}`} />
        </div>

        {/* ── Footer ── */}
        <div style={{ height: 1, background: t.border, marginBottom: 28 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: t.fgSub }}>OpensophyCard · Hub Design System</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["component", "ui", "hub"].map(tag => <Tag key={tag} t={t}>{tag}</Tag>)}
          </div>
        </div>

      </div>
    </div>
  );
}