import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invitation'
  | 'message'
  | 'achievement'
  | 'level_up'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any; // Données spécifiques selon le type
  actionable?: boolean; // Si la notification nécessite une action
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
  
  addNotification: (notification) => set((state) => {
    console.log('[NOTIF STORE] Adding notification:', notification);
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    };
    
    const newNotifications = [newNotification, ...state.notifications];
    const unreadCount = newNotifications.filter(n => !n.read).length;
    
    console.log('[NOTIF STORE] New notifications count:', newNotifications.length);
    console.log('[NOTIF STORE] Unread count:', unreadCount);
    
    return {
      notifications: newNotifications,
      unreadCount,
    };
  }),
  
  markAsRead: (id) => set((state) => {
    const newNotifications = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    const unreadCount = newNotifications.filter(n => !n.read).length;
    
    return {
      notifications: newNotifications,
      unreadCount,
    };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  removeNotification: (id) => set((state) => {
    const newNotifications = state.notifications.filter(n => n.id !== id);
    const unreadCount = newNotifications.filter(n => !n.read).length;
    
    return {
      notifications: newNotifications,
      unreadCount,
    };
  }),
  
  clearAll: () => set({
    notifications: [],
    unreadCount: 0,
  }),
}),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
