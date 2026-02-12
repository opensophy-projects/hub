import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import BottomSheet from './BottomSheet';

interface ContactsPanelProps {
  onClose: () => void;
}

const ContactLink: React.FC<{
  href: string;
  title: string;
  subtitle: string;
}> = ({ href, title, subtitle }) => {
  const { isDark } = useTheme();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col gap-1 px-4 py-4 rounded-lg transition-colors ${
        isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
      }`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm opacity-70">{subtitle}</div>
    </a>
  );
};

const ContactsPanel: React.FC<ContactsPanelProps> = ({ onClose }) => {
  return (
    <BottomSheet title="Контакты" onClose={onClose}>
      <div className="p-4">
        <div className="space-y-2">
          <ContactLink
            href="https://opensophy.com/"
            title="Главный сайт"
            subtitle="opensophy.com"
          />
          <ContactLink
            href="mailto:opensophy@gmail.com"
            title="Email"
            subtitle="opensophy@gmail.com"
          />
          <ContactLink
            href="https://t.me/veilosophy"
            title="Telegram"
            subtitle="@veilosophy"
          />
          <ContactLink
            href="https://github.com/opensophy-projects"
            title="GitHub"
            subtitle="opensophy"
          />
          <ContactLink
            href="https://habr.com/ru/users/opensophy/"
            title="Habr"
            subtitle="opensophy"
          />
        </div>
      </div>
    </BottomSheet>
  );
};

export default ContactsPanel;
