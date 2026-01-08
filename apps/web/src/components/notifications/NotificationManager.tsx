'use client'

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { socketManager } from '@/lib/socket'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useGameStore } from '@/stores/useGameStore'

export default function NotificationManager() {
  const { addNotification } = useNotificationStore()
  const { playerId } = useGameStore()

  console.log('[NOTIF] NotificationManager mounted, playerId:', playerId)

  useEffect(() => {
    // Attendre que le socket soit connecté
    const setupListeners = () => {
      const socket = socketManager.getSocket()
      if (!socket || !socket.connected) {
        console.log('[NOTIF] Socket not ready yet, waiting...')
        return false
      }

      console.log('[NOTIF] Socket ready! Setting up notification listeners...')

      // Test: Ajouter une notification de test au démarrage
      setTimeout(() => {
        console.log('[NOTIF] Adding test notification...')
        addNotification({
          type: 'system',
          title: 'Centre de notifications actif',
          message: 'Les notifications sont prêtes à fonctionner !',
          actionable: false,
        })
      }, 1000)

      // Invitations de lobby
      const handleLobbyInvitation = (invitation: any) => {
        console.log('[NOTIF] ✅ Received lobby invitation:', invitation)
        addNotification({
          type: 'game_invitation',
          title: 'Invitation de partie',
          message: `${invitation.fromUsername} vous invite à rejoindre sa partie`,
          actionable: true,
          data: {
            roomCode: invitation.roomCode,
            fromUsername: invitation.fromUsername,
            fromId: invitation.fromId,
            inviteId: invitation.id,
          }
        })
      }

      // Demandes d'amis
      const handleFriendRequest = (data: any) => {
        console.log('[NOTIF] ✅ Received friend request:', data)
        addNotification({
          type: 'friend_request',
          title: 'Demande d\'ami',
          message: `${data.username} souhaite devenir votre ami`,
          actionable: true,
          data: {
            friendId: data.id,
            username: data.username,
            level: data.level,
          }
        })
      }

      // Ami accepté
      const handleFriendAccepted = (data: any) => {
        console.log('[NOTIF] ✅ Friend request accepted:', data)
        addNotification({
          type: 'friend_accepted',
          title: 'Ami ajouté',
          message: `${data.username} a accepté votre demande d'ami`,
          actionable: false,
          data: {
            friendId: data.id,
            username: data.username,
          }
        })
      }

      // Messages privés
      const handlePrivateMessage = (data: any) => {
        console.log('[NOTIF] ✅ Received private message:', data)
        addNotification({
          type: 'message',
          title: `Message de ${data.fromUsername}`,
          message: data.message,
          actionable: true,
          data: {
            fromId: data.fromId,
            fromUsername: data.fromUsername,
            messageId: data.id,
          }
        })
      }

      // Nouveau succès débloqué
      const handleAchievementUnlocked = (data: any) => {
        console.log('[NOTIF] ✅ Achievement unlocked:', data)
        addNotification({
          type: 'achievement',
          title: 'Succès débloqué !',
          message: `Vous avez obtenu le badge "${data.name}"`,
          actionable: false,
          data: {
            badgeId: data.id,
            badgeName: data.name,
          }
        })
      }

      // Montée de niveau
      const handleLevelUp = (data: any) => {
        console.log('[NOTIF] ✅ Level up:', data)
        addNotification({
          type: 'level_up',
          title: 'Niveau supérieur !',
          message: `Félicitations ! Vous êtes maintenant niveau ${data.newLevel}`,
          actionable: false,
          data: {
            newLevel: data.newLevel,
            xpGained: data.xpGained,
          }
        })
      }

      // Enregistrer tous les listeners
      socket.on('lobby:invitation_received', handleLobbyInvitation)
      socket.on('friend:request', handleFriendRequest)
      socket.on('friend:accepted', handleFriendAccepted)
      socket.on('message:private', handlePrivateMessage)
      socket.on('achievement:unlocked', handleAchievementUnlocked)
      socket.on('player:level_up', handleLevelUp)

      console.log('[NOTIF] All listeners registered')

      return true
    }

    // Essayer de configurer immédiatement
    if (setupListeners()) {
      return
    }

    // Sinon, attendre la connexion
    const checkInterval = setInterval(() => {
      if (setupListeners()) {
        clearInterval(checkInterval)
      }
    }, 500)

    return () => {
      clearInterval(checkInterval)
      const socket = socketManager.getSocket()
      if (socket) {
        socket.off('lobby:invitation_received')
        socket.off('friend:request')
        socket.off('friend:accepted')
        socket.off('message:private')
        socket.off('achievement:unlocked')
        socket.off('player:level_up')
      }
    }
  }, [addNotification, playerId])

  return null // Pas de rendu, juste la gestion des événements
}

