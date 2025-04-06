import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType } from '../components/Notification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    console.log(`Adding notification: ${id}`, notification);
    
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  // Remove a notification by ID
  const removeNotification = useCallback((id: string) => {
    console.log(`Removing notification: ${id}`);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
