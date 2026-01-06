'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Gamepad2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LobbyInvitation } from '@coin-clash/shared'

interface LobbyInvitationNotificationProps {
  invitation: LobbyInvitation
  onAccept: () => void
  onReject: () => void
}

export default function LobbyInvitationNotification({
  invitation,
  onAccept,
  onReject,
}: LobbyInvitationNotificationProps) {
  const router = useRouter()

  const handleAccept = () => {
    router.push(`/room/${invitation.roomCode}`)
    onAccept()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="liquid-glass p-4 rounded-xl mb-3 border border-white/10 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
          <Gamepad2 size={20} className="text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm truncate">
              {invitation.fromUsername}
            </h4>
            <button
              onClick={onReject}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X size={14} className="text-white/60" />
            </button>
          </div>
          <p className="text-xs text-white/70 mb-3">
            Vous invite à rejoindre son lobby
          </p>
          <div className="flex gap-2">
            <motion.button
              onClick={handleAccept}
              className="flex-1 btn-apple text-xs py-2 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Check size={14} />
              Rejoindre
            </motion.button>
            <motion.button
              onClick={onReject}
              className="px-3 py-2 liquid-glass-hover rounded-lg text-xs"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Refuser
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

