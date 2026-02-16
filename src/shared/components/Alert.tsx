import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Info, Lightbulb, AlertCircle, AlertTriangle, OctagonX } from 'lucide-react';

interface AlertProps {
  type: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ type, children }) => {
  const { isDark } = useTheme();

  const configs = {
    note: {
      icon: Info,
      title: 'Примечание',
      lightColors: 'bg-blue-50 border-blue-300 text-blue-900',
      darkColors: 'bg-blue-900/20 border-blue-500/50 text-blue-200',
      iconColor: 'text-blue-600',
      iconColorDark: 'text-blue-400',
    },
    tip: {
      icon: Lightbulb,
      title: 'Совет',
      lightColors: 'bg-green-50 border-green-300 text-green-900',
      darkColors: 'bg-green-900/20 border-green-500/50 text-green-200',
      iconColor: 'text-green-600',
      iconColorDark: 'text-green-400',
    },
    important: {
      icon: AlertCircle,
      title: 'Важно',
      lightColors: 'bg-purple-50 border-purple-300 text-purple-900',
      darkColors: 'bg-purple-900/20 border-purple-500/50 text-purple-200',
      iconColor: 'text-purple-600',
      iconColorDark: 'text-purple-400',
    },
    warning: {
      icon: AlertTriangle,
      title: 'Предупреждение',
      lightColors: 'bg-yellow-50 border-yellow-300 text-yellow-900',
      darkColors: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200',
      iconColor: 'text-yellow-600',
      iconColorDark: 'text-yellow-400',
    },
    caution: {
      icon: OctagonX,
      title: 'Осторожно',
      lightColors: 'bg-red-50 border-red-300 text-red-900',
      darkColors: 'bg-red-900/20 border-red-500/50 text-red-200',
      iconColor: 'text-red-600',
      iconColorDark: 'text-red-400',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border my-4 ${
        isDark ? config.darkColors : config.lightColors
      }`}
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${isDark ? config.iconColorDark : config.iconColor}`} />
      <div className="flex-1">
        <p className="font-bold text-sm mb-1">{config.title}</p>
        <div className="text-sm prose-sm max-w-none">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
