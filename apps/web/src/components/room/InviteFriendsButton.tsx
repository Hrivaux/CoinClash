'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, X, Check, Users } from 'lucide-react'
import { socketManager } from '@/lib/socket'

interface InviteFriendsButtonProps {
  roomCode: string
  isHost: boolean
}

export default function InviteFriendsButton({ roomCode, isHost }: InviteFriendsButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const loadFriends = () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    setLoading(true)
    socket.emit('friends:list', (friendsList: any[]) => {
      setFriends(friendsList || [])
      setLoading(false)
    })
  }

  const handleOpen = () => {
    if (!isHost) return
    setShowModal(true)
    loadFriends()
  }

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(friendId)) {
        newSet.delete(friendId)
      } else {
        newSet.add(friendId)
      }
      return newSet
    })
  }

  const handleSendInvitations = () => {
    if (selectedFriends.size === 0) return

    const socket = socketManager.getSocket()
    if (!socket) return

    setSending(true)
    const friendIds = Array.from(selectedFriends)
    
    socket.emit('room:invite_friends', friendIds, (success: boolean) => {
      setSending(false)
      if (success) {
        alert(`Invitations envoyées à ${friendIds.length} ami${friendIds.length > 1 ? 's' : ''} !`)
        setShowModal(false)
        setSelectedFriends(new Set())
      } else {
        alert('Erreur lors de l\'envoi des invitations')
      }
    })
  }

  if (!isHost) return null

  return (
    <>
      <motion.button
        onClick={handleOpen}
        className="liquid-glass-hover px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <UserPlus size={18} />
        Inviter des amis
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-[201] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-liquid glow-white-strong max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <UserPlus size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Inviter des amis</h2>
                      <p className="text-white/50 text-sm">Sélectionnez les amis à inviter</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="liquid-glass-hover p-2 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="spinner-apple"></div>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto mb-4 text-white/20" />
                      <p className="text-white/60 mb-2">Aucun ami</p>
                      <p className="text-white/40 text-sm">Ajoutez des amis depuis le centre social</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <motion.label
                          key={friend.id}
                          className="flex items-center gap-3 p-3 rounded-xl liquid-glass-hover cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFriends.has(friend.id)}
                            onChange={() => handleToggleFriend(friend.id)}
                            className="w-5 h-5 accent-white"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{friend.username}</div>
                            <div className="text-xs text-white/50">
                              Niveau {friend.level} • {friend.status === 'online' ? 'En ligne' : 'Hors ligne'}
                            </div>
                          </div>
                          {selectedFriends.has(friend.id) && (
                            <Check size={18} className="text-green-400" />
                          )}
                        </motion.label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between">
                  <div className="text-sm text-white/60">
                    {selectedFriends.size} ami{selectedFriends.size > 1 ? 's' : ''} sélectionné{selectedFriends.size > 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 liquid-glass-hover rounded-xl text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Annuler
                    </motion.button>
                    <motion.button
                      onClick={handleSendInvitations}
                      disabled={selectedFriends.size === 0 || sending}
                      className="btn-apple px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={selectedFriends.size > 0 && !sending ? { scale: 1.05 } : {}}
                      whileTap={selectedFriends.size > 0 && !sending ? { scale: 0.95 } : {}}
                    >
                      {sending ? (
                        <>
                          <div className="spinner-apple-small"></div>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Envoyer ({selectedFriends.size})
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

