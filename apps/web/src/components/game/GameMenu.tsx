'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  User, 
  Users, 
  LogOut, 
  Settings,
  ChevronRight
} from 'lucide-react'
import ProfilePanel from '@/components/profile/ProfilePanel'
import ConfirmLeaveModal from '@/components/room/ConfirmLeaveModal'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'

interface GameMenuProps {
  currentPlayerId: string
  players: Array<{ id: string; username: string; avatar?: string }>
  onLeave: () => void
}

export default function GameMenu({ currentPlayerId, players, onLeave }: GameMenuProps) {
  const { playerId } = useGameStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showPlayerProfile, setShowPlayerProfile] = useState<string | null>(null)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)

  const getSupabaseId = (socketId: string, callback: (supabaseId: string | null) => void) => {
    const socket = socketManager.getSocket()
    if (!socket) {
      callback(null)
      return
    }

    // Si c'est le joueur actuel, utiliser playerId du store
    if (socketId === currentPlayerId && playerId) {
      callback(playerId)
      return
    }

    // Sinon, demander au serveur
    // @ts-ignore - TODO: Ajouter 'player:get_supabase_id' aux types Socket
    socket.emit('player:get_supabase_id', socketId, (supabaseId: string | null) => {
      callback(supabaseId)
    })
  }

  return (
    <>
      {/* Menu Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 liquid-glass-strong p-3 rounded-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-black/80 backdrop-blur-xl z-50 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="liquid-glass-hover p-2 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {/* My Profile */}
                  <button
                    onClick={() => {
                      if (playerId) {
                        setShowPlayerProfile(playerId)
                        setIsOpen(false)
                      }
                    }}
                    className="w-full liquid-glass-hover p-4 rounded-xl flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <User size={20} className="text-blue-400" />
                      </div>
                      <span className="font-semibold">Mon Profil</span>
                    </div>
                    <ChevronRight size={20} className="text-white/40 group-hover:text-white" />
                  </button>

                  {/* Other Players */}
                  <div className="space-y-2">
                    <div className="text-white/60 text-sm px-2 mb-2">Autres Joueurs</div>
                    {players
                      .filter(p => p.id !== currentPlayerId)
                      .map((player) => (
                        <button
                          key={player.id}
                          onClick={() => {
                            getSupabaseId(player.id, (supabaseId) => {
                              if (supabaseId) {
                                setShowPlayerProfile(supabaseId)
                                setIsOpen(false)
                              } else {
                                console.error('[GameMenu] Could not get Supabase ID for player:', player.id)
                                alert('Impossible d\'afficher le profil de ce joueur')
                              }
                            })
                          }}
                          className="w-full liquid-glass-hover p-4 rounded-xl flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{player.avatar || '👤'}</div>
                            <span className="font-semibold">{player.username}</span>
                          </div>
                          <ChevronRight size={20} className="text-white/40 group-hover:text-white" />
                        </button>
                      ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 border-t border-white/10 space-y-2">
                  <button
                    onClick={() => {
                      setShowConfirmLeave(true)
                      setIsOpen(false)
                    }}
                    className="w-full liquid-glass-hover p-4 rounded-xl flex items-center gap-3 text-red-400 hover:text-red-300"
                  >
                    <LogOut size={20} />
                    <span className="font-semibold">Quitter la partie</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Player Profile Modal */}
      {showPlayerProfile && (
        <ProfilePanel 
          userId={showPlayerProfile}
          onClose={() => setShowPlayerProfile(null)} 
        />
      )}

      {/* Confirm Leave Modal */}
      <ConfirmLeaveModal
        isOpen={showConfirmLeave}
        onClose={() => setShowConfirmLeave(false)}
        onConfirm={onLeave}
        isInGame={true}
      />
    </>
  )
}

