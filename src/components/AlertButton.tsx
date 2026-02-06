import React from 'react';

interface AlertButtonProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const AlertButton: React.FC<AlertButtonProps> = ({ type, children }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-600 dark:text-green-400',
          icon: '✓',
        };
      case 'warning':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-600 dark:text-orange-400',
          icon: '!',
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-600 dark:text-red-400',
          icon: '✕',
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-600 dark:text-blue-400',
          icon: '?',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${styles.bg} ${styles.border} ${styles.text} my-2`}
    >
      <span className="font-bold text-lg">{styles.icon}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
};

export default AlertButton;
