'use client'

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type?: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 밀리초 단위, 0이면 수동으로 닫을 때까지 유지
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-500',
    textColor: 'text-green-800 dark:text-green-300',
    iconColor: 'text-green-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-500',
    textColor: 'text-red-800 dark:text-red-300',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800 dark:text-blue-300',
    iconColor: 'text-blue-500'
  }
};

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
};

export const Notification = ({
  type = 'info',
  title,
  message,
  duration = 5000, // 기본 5초
  onClose,
  position = 'top-right',
  className
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];
  const IconComponent = config.icon;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (duration > 0) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleAnimationComplete = () => {
    if (!isVisible && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed z-50 max-w-md w-full transform-gpu',
            positionStyles[position],
            className
          )}
          initial={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.9 }}
          transition={{ 
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          onAnimationComplete={handleAnimationComplete}
        >
          <div 
            className={cn(
              'flex items-start p-5 rounded-lg shadow-xl border-l-4',
              config.bgColor,
              config.borderColor,
              'backdrop-blur-sm'
            )}
          >
            <div className={cn('flex-shrink-0 mr-4 mt-0.5', config.iconColor)}>
              <IconComponent size={24} className="animate-pulse" />
            </div>
            <div className="flex-grow">
              <h3 className={cn('font-bold text-lg', config.textColor)}>{title}</h3>
              {message && (
                <p className={cn('text-sm mt-1 whitespace-pre-line', config.textColor)}>
                  {message}
                </p>
              )}
            </div>
            <button 
              onClick={handleClose}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition hover:rotate-90"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 전역 알림 상태 관리
type NotificationItem = NotificationProps & { id: string };
type NotificationContextType = {
  notifications: NotificationItem[];
  showNotification: (props: NotificationProps) => string;
  hideNotification: (id: string) => void;
};

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = (props: NotificationProps): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const notificationItem = { ...props, id };
    
    // 동일한 타입의 이전 알림을 제거하고 새 알림만 표시 (중복 방지)
    if (props.type === 'error' || props.type === 'warning') {
      setNotifications(prev => {
        // 동일한 타입의 알림만 필터링
        const filtered = prev.filter(item => item.type !== props.type);
        return [...filtered, notificationItem];
      });
    } else {
      setNotifications(prev => [...prev, notificationItem]);
    }
    
    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 알림 위치별로 그룹화
  const groupedNotifications: Record<string, NotificationItem[]> = {};
  
  notifications.forEach(notification => {
    const position = notification.position || 'top-right';
    if (!groupedNotifications[position]) {
      groupedNotifications[position] = [];
    }
    groupedNotifications[position].push(notification);
  });

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, hideNotification }}>
      {children}
      {Object.entries(groupedNotifications).map(([position, notifs]) => (
        <div key={position} className="notification-group">
          {notifs.map((notification, index) => (
            <Notification
              key={notification.id}
              {...notification}
              // 위치에 따라 간격 조정
              className={cn(
                index > 0 && position.includes('top') ? `mt-${3 + index}` : '',
                index > 0 && position.includes('bottom') ? `mb-${3 + index}` : ''
              )}
              onClose={() => hideNotification(notification.id)}
            />
          ))}
        </div>
      ))}
    </NotificationContext.Provider>
  );
};

// 훅으로 사용하기 쉽게 만듦
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 