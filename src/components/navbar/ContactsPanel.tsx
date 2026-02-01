import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from './BottomSheet';
import { MailIcon, SendIcon, GithubIcon, HabrIcon } from './icons';

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
    <a
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
  return (
    <BottomSheet title="Контакты" onClose={onClose}>
      <div className="p-4">
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
    </BottomSheet>
  );
};

export default ContactsPanel;
