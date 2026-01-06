'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { socketManager } from '@/lib/socket'
import { LobbyInvitation } from '@coin-clash/shared'
import LobbyInvitationNotification from './LobbyInvitationNotification'

export default function NotificationManager() {
  const [invitations, setInvitations] = useState<LobbyInvitation[]>([])

  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket) {
      console.log('[NOTIF] No socket available')
      return
    }

    console.log('[NOTIF] Setting up invitation listener...')

    const handleLobbyInvitation = (invitation: LobbyInvitation) => {
      console.log('[NOTIF] ✅ Received lobby invitation:', invitation)
      setInvitations((prev) => {
        // Avoid duplicates
        if (prev.some((inv) => inv.id === invitation.id)) {
          console.log('[NOTIF] Duplicate invitation ignored')
          return prev
        }
        console.log('[NOTIF] Adding invitation to list')
        return [...prev, invitation]
      })
    }

    socket.on('lobby:invitation_received', handleLobbyInvitation)
    console.log('[NOTIF] Listener registered for lobby:invitation_received')

    // Load pending invitations from database
    const loadPendingInvitations = async () => {
      // This could be implemented to load from database
      // For now, we rely on real-time notifications
    }
    loadPendingInvitations()

    return () => {
      socket.off('lobby:invitation_received', handleLobbyInvitation)
    }
  }, [])

  const handleAccept = (invitationId: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
  }

  const handleReject = (invitationId: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
  }

  if (invitations.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] max-w-sm w-full">
      <AnimatePresence>
        {invitations.map((invitation) => (
          <LobbyInvitationNotification
            key={invitation.id}
            invitation={invitation}
            onAccept={() => handleAccept(invitation.id)}
            onReject={() => handleReject(invitation.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

