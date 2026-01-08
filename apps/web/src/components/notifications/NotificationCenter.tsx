'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  Users, 
  MessageCircle, 
  Gamepad2, 
  Trophy,
  Star,
  Check,
  XCircle,
  UserPlus,
  Mail,
  CheckCheck,
  Trash2,
  Settings
} from 'lucide-react'
import { useNotificationStore, Notification } from '@/stores/useNotificationStore'
import { useGameStore } from '@/stores/useGameStore'
import { socketManager } from '@/lib/socket'

interface NotificationCenterProps {
  onClose: () => void
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll, addNotification } = useNotificationStore()
  const { playerId, currentGame } = useGameStore()
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all')

  console.log('[NOTIF CENTER] Rendering with', notifications.length, 'notifications')

  const addTestNotification = () => {
    console.log('[NOTIF CENTER] Adding test notification manually')
    addNotification({
      type: 'message',
      title: 'Test de notification',
      message: 'Ceci est une notification de test pour vérifier que le système fonctionne',
      actionable: false,
    })
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'actionable') return notif.actionable && !notif.read
    return true
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="text-blue-400" size={20} />
      case 'friend_accepted':
        return <Users className="text-green-400" size={20} />
      case 'game_invitation':
        return <Gamepad2 className="text-purple-400" size={20} />
      case 'message':
        return <MessageCircle className="text-cyan-400" size={20} />
      case 'achievement':
        return <Trophy className="text-yellow-400" size={20} />
      case 'level_up':
        return <Star className="text-orange-400" size={20} />
      default:
        return <Bell className="text-white/60" size={20} />
    }
  }

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id)

    switch (notif.type) {
      case 'friend_request':
        // Ouvrir le panneau des amis sur l'onglet demandes
        break
      case 'game_invitation':
        if (notif.data?.roomCode && !currentGame) {
          router.push(`/room/${notif.data.roomCode}`)
        }
        break
      case 'message':
        // Ouvrir le panneau des messages
        break
    }
  }

  const handleAcceptFriendRequest = (notif: Notification) => {
    const socket = socketManager.getSocket()
    if (!socket || !notif.data?.friendId) return

    socket.emit('friend:accept', notif.data.friendId)
    removeNotification(notif.id)
  }

  const handleRejectFriendRequest = (notif: Notification) => {
    const socket = socketManager.getSocket()
    if (!socket || !notif.data?.friendId) return

    // @ts-ignore - friend:reject event
    socket.emit('friend:reject', notif.data.friendId)
    removeNotification(notif.id)
  }

  const handleAcceptGameInvitation = (notif: Notification) => {
    if (currentGame && currentGame.status === 'playing') {
      alert('Vous êtes déjà dans une partie en cours')
      return
    }

    if (notif.data?.roomCode) {
      router.push(`/room/${notif.data.roomCode}`)
      removeNotification(notif.id)
    }
  }

  const handleRejectGameInvitation = (notif: Notification) => {
    const socket = socketManager.getSocket()
    if (!socket) return

    // Notifier le serveur du refus
    // @ts-ignore - invite:reject event
    socket.emit('invite:reject', notif.data?.inviteId)
    removeNotification(notif.id)
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col liquid-glass-strong rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Bell size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Centre de notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-white/50">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-xl liquid-glass-hover"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <motion.button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'liquid-glass-hover text-white/60'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Toutes
            </motion.button>
            <motion.button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                filter === 'unread'
                  ? 'bg-white text-black'
                  : 'liquid-glass-hover text-white/60'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mail size={16} />
              Non lues
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-xs">
                  {unreadCount}
                </span>
              )}
            </motion.button>
            <motion.button
              onClick={() => setFilter('actionable')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === 'actionable'
                  ? 'bg-white text-black'
                  : 'liquid-glass-hover text-white/60'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCheck size={16} className="inline mr-2" />
              À traiter
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 items-center">
            {/* Test Button */}
            <motion.button
              onClick={addTestNotification}
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Bell size={16} />
              Test
            </motion.button>
            
            {unreadCount > 0 && (
              <motion.button
                onClick={markAllAsRead}
                className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCheck size={16} />
                Tout marquer comme lu
              </motion.button>
            )}
            {notifications.length > 0 && (
              <motion.button
                onClick={clearAll}
                className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-2 ml-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 size={16} />
                Tout effacer
              </motion.button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/40 text-lg mb-2">Aucune notification</p>
              <p className="text-white/30 text-sm">
                {filter === 'unread' 
                  ? 'Toutes vos notifications ont été lues' 
                  : filter === 'actionable'
                  ? "Aucune action n'est requise pour le moment"
                  : 'Vous êtes à jour !'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all ${
                    notif.read
                      ? 'liquid-glass-hover'
                      : 'liquid-glass-strong border border-purple-500/30'
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500" />
                  )}

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 p-3 rounded-xl liquid-glass">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-sm">{notif.title}</h4>
                        <span className="text-xs text-white/40 whitespace-nowrap">
                          {formatTimestamp(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{notif.message}</p>

                      {/* Action buttons for specific notification types */}
                      {notif.actionable && !notif.read && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {notif.type === 'friend_request' && (
                            <>
                              <motion.button
                                onClick={() => handleAcceptFriendRequest(notif)}
                                className="btn-apple-sm flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Check size={14} />
                                Accepter
                              </motion.button>
                              <motion.button
                                onClick={() => handleRejectFriendRequest(notif)}
                                className="btn-apple-secondary-sm flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle size={14} />
                                Refuser
                              </motion.button>
                            </>
                          )}
                          {notif.type === 'game_invitation' && (
                            <>
                              <motion.button
                                onClick={() => handleAcceptGameInvitation(notif)}
                                className="btn-apple-sm flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Check size={14} />
                                Rejoindre
                              </motion.button>
                              <motion.button
                                onClick={() => handleRejectGameInvitation(notif)}
                                className="btn-apple-secondary-sm flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircle size={14} />
                                Refuser
                              </motion.button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notif.id)
                      }}
                      className="flex-shrink-0 p-2 rounded-lg liquid-glass-hover text-white/40 hover:text-red-400"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
