import React from 'react';
import { Info, Lightbulb, AlertTriangle, AlertCircle, OctagonAlert } from 'lucide-react';

interface CalloutProps {
  type: 'note' | 'tip' | 'warning' | 'important' | 'caution';
  children: React.ReactNode;
  isDark: boolean;
}

const Callout: React.FC<CalloutProps> = ({ type, children, isDark }) => {
  const configs = {
    note: {
      icon: Info,
      bgLight: 'bg-blue-50',
      bgDark: 'bg-blue-950/30',
      borderLight: 'border-blue-200',
      borderDark: 'border-blue-800',
      iconLight: 'text-blue-600',
      iconDark: 'text-blue-400',
      textLight: 'text-blue-900',
      textDark: 'text-blue-100',
      label: 'NOTE'
    },
    tip: {
      icon: Lightbulb,
      bgLight: 'bg-green-50',
      bgDark: 'bg-green-950/30',
      borderLight: 'border-green-200',
      borderDark: 'border-green-800',
      iconLight: 'text-green-600',
      iconDark: 'text-green-400',
      textLight: 'text-green-900',
      textDark: 'text-green-100',
      label: 'TIP'
    },
    warning: {
      icon: AlertTriangle,
      bgLight: 'bg-yellow-50',
      bgDark: 'bg-yellow-950/30',
      borderLight: 'border-yellow-200',
      borderDark: 'border-yellow-800',
      iconLight: 'text-yellow-600',
      iconDark: 'text-yellow-400',
      textLight: 'text-yellow-900',
      textDark: 'text-yellow-100',
      label: 'WARNING'
    },
    important: {
      icon: AlertCircle,
      bgLight: 'bg-purple-50',
      bgDark: 'bg-purple-950/30',
      borderLight: 'border-purple-200',
      borderDark: 'border-purple-800',
      iconLight: 'text-purple-600',
      iconDark: 'text-purple-400',
      textLight: 'text-purple-900',
      textDark: 'text-purple-100',
      label: 'IMPORTANT'
    },
    caution: {
      icon: OctagonAlert,
      bgLight: 'bg-red-50',
      bgDark: 'bg-red-950/30',
      borderLight: 'border-red-200',
      borderDark: 'border-red-800',
      iconLight: 'text-red-600',
      iconDark: 'text-red-400',
      textLight: 'text-red-900',
      textDark: 'text-red-100',
      label: 'CAUTION'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border-l-4 p-4 my-4 ${
      isDark 
        ? `${config.bgDark} ${config.borderDark}` 
        : `${config.bgLight} ${config.borderLight}`
    }`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          isDark ? config.iconDark : config.iconLight
        }`} />
        <div className={`flex-1 ${isDark ? config.textDark : config.textLight}`}>
          <div className="font-bold text-sm mb-1">{config.label}</div>
          <div className="text-sm prose-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Callout;
