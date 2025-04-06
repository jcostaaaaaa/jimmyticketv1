import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Set background color based on notification type
  const bgColor = 
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

  // Handle close animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300); // Animation duration
  };

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id]);

  if (!isVisible) return null;

  return (
    <div 
      className={`${bgColor} text-white rounded-md shadow-lg p-4 mb-4 transform transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100'
      }`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm">{message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="text-white hover:text-gray-200 ml-4"
          aria-label="Close notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification;
