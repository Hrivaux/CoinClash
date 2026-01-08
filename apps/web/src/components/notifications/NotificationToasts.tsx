'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore, Notification } from '@/stores/useNotificationStore'
import { 
  UserPlus, 
  Gamepad2, 
  MessageCircle, 
  Trophy,
  Star,
  X
} from 'lucide-react'

export default function NotificationToasts() {
  const { notifications, removeNotification } = useNotificationStore()

  // Afficher seulement les 3 dernières notifications non lues
  const recentNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 3)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="text-blue-400" size={18} />
      case 'friend_accepted':
        return <UserPlus className="text-green-400" size={18} />
      case 'game_invitation':
        return <Gamepad2 className="text-purple-400" size={18} />
      case 'message':
        return <MessageCircle className="text-cyan-400" size={18} />
      case 'achievement':
        return <Trophy className="text-yellow-400" size={18} />
      case 'level_up':
        return <Star className="text-orange-400" size={18} />
      default:
        return null
    }
  }

  return (
    <div className="fixed top-20 right-4 z-[90] max-w-sm w-full space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {recentNotifications.map((notif, index) => (
          <motion.div
            key={notif.id}
            layout
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              delay: index * 0.1
            }}
            className="liquid-glass-strong p-4 rounded-2xl pointer-events-auto shadow-2xl"
          >
            <div className="flex gap-3 items-start">
              {/* Icon */}
              <div className="flex-shrink-0 p-2 rounded-xl liquid-glass">
                {getNotificationIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-1">{notif.title}</h4>
                <p className="text-xs text-white/70 line-clamp-2">{notif.message}</p>
              </div>

              {/* Close button */}
              <motion.button
                onClick={() => removeNotification(notif.id)}
                className="flex-shrink-0 p-1 rounded-lg liquid-glass-hover text-white/40 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
