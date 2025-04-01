'use client'

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from "@/shared/lib/utils"
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type?: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 밀리초 단위, 0이면 수동으로 닫을 때까지 유지
  onClose?: () => void;
  position?: 'center' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900',
    borderColor: 'border-green-500',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900',
    borderColor: 'border-red-500',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500'
  }
};

const positionStyles = {
  'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mx-auto w-[90%] sm:w-auto',
  'top-right': 'fixed top-4 right-4',
  'top-left': 'fixed top-4 left-4',
  'bottom-right': 'fixed bottom-4 right-4',
  'bottom-left': 'fixed bottom-4 left-4',
  'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 mx-auto w-[90%] sm:w-auto',
  'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 mx-auto w-[90%] sm:w-auto'
};

export const Notification = ({
  type = 'info',
  title,
  message,
  duration = 5000, // 기본 5초
  onClose,
  position = 'center', // 기본값을 center로 변경
  className
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];
  const IconComponent = config.icon;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (duration > 0) {
      timer = setTimeout(() => {
        // 페이드 아웃 없이 바로 제거
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    // 즉시 알림 닫기 (애니메이션 없음)
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 배경 오버레이 (center 위치일 때만) */}
          {position === 'center' && (
            <motion.div
              className="fixed inset-0 bg-black z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              // exit 애니메이션 제거
              exit={{ opacity: 0, transition: { duration: 0 } }}
            />
          )}
          
          {/* 알림 컴포넌트 */}
          <motion.div
            className={cn(
              'z-50',
              positionStyles[position],
              position === 'center' ? '!left-1/2 !transform !-translate-x-1/2' : '',
              className
            )}
            style={{
              maxWidth: position.includes('center') ? '90%' : '24rem', // max-w-md 대체
              margin: '0 auto'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            // exit 애니메이션 제거
            exit={{ opacity: 0, transition: { duration: 0 } }}
          >
            <div 
              className={cn(
                'flex items-start p-4 sm:p-6 rounded-lg shadow-2xl border-l-4',
                config.bgColor,
                config.borderColor,
                'backdrop-blur-lg',
                'opacity-100',
                position === 'center' ? 'min-w-0 sm:min-w-[320px]' : ''
              )}
            >
              <div className={cn('flex-shrink-0 mr-3 sm:mr-4 mt-0.5', config.iconColor)}>
                <IconComponent size={24} className={position === 'center' ? 'animate-bounce' : 'animate-pulse'} />
              </div>
              <div className="flex-grow">
                <h3 className={cn('font-bold text-base sm:text-lg', config.textColor)}>{title}</h3>
                {message && (
                  <p className={cn('text-xs sm:text-sm mt-1 sm:mt-2 whitespace-pre-line', config.textColor)}>
                    {message}
                  </p>
                )}
              </div>
              <button 
                onClick={handleClose}
                className="flex-shrink-0 ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        </>
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
    
    // 'center' 포지션은 한 번에 하나의 알림만 표시
    if (props.position === 'center' || props.position === undefined) {
      setNotifications(prev => {
        // 기존의 center 포지션 알림을 모두 제거
        const filtered = prev.filter(item => item.position !== 'center' && item.position !== undefined);
        return [...filtered, notificationItem];
      });
    }
    // 동일한 타입의 이전 알림을 제거하고 새 알림만 표시 (중복 방지)
    else if (props.type === 'error' || props.type === 'warning') {
      setNotifications(prev => {
        // 동일한 타입의 알림만 필터링
        const filtered = prev.filter(item => 
          item.type !== props.type || 
          (item.position !== props.position && item.position !== undefined)
        );
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
    const position = notification.position || 'center';
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
              className={cn(
                position !== 'center' && index > 0 && position.includes('top') ? `mt-${3 + index}` : '',
                position !== 'center' && index > 0 && position.includes('bottom') ? `mb-${3 + index}` : ''
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