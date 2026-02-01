import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const MailIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const HabrIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="M7 7h10M7 12h10M7 17h10" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ContactsPanelProps {
  onClose: () => void;
}

const ContactLink: React.FC<{
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ href, icon, title, subtitle }) => {
  const { isDark } = useTheme();

  return (
    
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-4 px-4 py-4 rounded-lg transition-colors ${
        isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
      }`}
    >
      <div className="w-6 h-6">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm opacity-70">{subtitle}</div>
      </div>
    </a>
  );
};

const ContactsPanel: React.FC<ContactsPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div 
        className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`} 
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contacts-panel-title"
        className={`relative w-full rounded-t-2xl border-t ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 id="contacts-panel-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              aria-label="Закрыть контакты"
            >
              <XIcon />
            </button>
          </div>
          <div className="space-y-2">
            <ContactLink
              href="mailto:opensophy@gmail.com"
              icon={<MailIcon className="w-6 h-6" />}
              title="Email"
              subtitle="opensophy@gmail.com"
            />
            <ContactLink
              href="https://t.me/veilosophy"
              icon={<SendIcon className="w-6 h-6" />}
              title="Telegram"
              subtitle="@veilosophy"
            />
            <ContactLink
              href="https://github.com/opensophy-projects"
              icon={<GithubIcon className="w-6 h-6" />}
              title="GitHub"
              subtitle="opensophy"
            />
            <ContactLink
              href="https://habr.com/ru/users/opensophy/"
              icon={<HabrIcon className="w-6 h-6" />}
              title="Habr"
              subtitle="opensophy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsPanel;