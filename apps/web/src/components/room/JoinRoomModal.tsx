'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, Copy, Check } from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'
import { useRouter } from 'next/navigation'

interface JoinRoomModalProps {
  onClose: () => void
}

export default function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  const router = useRouter()
  const { setLoading } = useGameStore()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLocalLoading] = useState(false)

  const handleJoin = () => {
    if (roomCode.length !== 5) {
      setError('Le code doit contenir 5 caractères')
      return
    }

    setLocalLoading(true)
    setLoading(true)
    const socket = socketManager.getSocket()

    if (!socket || !socket.connected) {
      setError('Non connecté au serveur')
      setLocalLoading(false)
      setLoading(false)
      return
    }

    socket.emit('room:join', roomCode.toUpperCase(), (success) => {
      setLocalLoading(false)
      setLoading(false)
      if (success) {
        router.push(`/room/${roomCode.toUpperCase()}`)
        onClose()
      } else {
        setError('Partie introuvable ou complète')
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.length === 5) {
      handleJoin()
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleanCode = text.trim().toUpperCase().slice(0, 5)
      setRoomCode(cleanCode)
      setError('')
    } catch (err) {
      console.error('Failed to read clipboard')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop-apple"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="card-liquid glow-white-strong max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="liquid-glass w-14 h-14 rounded-2xl flex items-center justify-center">
                <LogIn size={28} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Rejoindre</h2>
                <p className="text-body">Entrez le code de la partie</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Code Input */}
          <div className="mb-8">
            <div className="liquid-glass p-10 rounded-3xl text-center shimmer-subtle">
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                    setRoomCode(value.slice(0, 5))
                    setError('')
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="• • • • •"
                  maxLength={5}
                  className="bg-transparent border-none outline-none text-6xl font-black text-center w-full tracking-[0.3em] placeholder:text-white/10 placeholder:tracking-[0.3em]"
                  autoFocus
                />
                <motion.button
                  onClick={handlePaste}
                  className="absolute right-0 top-1/2 -translate-y-1/2 liquid-glass-hover p-3 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Coller depuis le presse-papier"
                >
                  <Copy size={20} className="text-white/60" />
                </motion.button>
              </div>

              {/* Progress Dots */}
              <div className="mt-8 flex justify-center gap-3">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8 }}
                    animate={{
                      scale: i < roomCode.length ? 1.2 : 0.8,
                      backgroundColor: i < roomCode.length ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.2)'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-3 h-3 rounded-full"
                  />
                ))}
              </div>

              {roomCode.length === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-green-400"
                >
                  <Check size={16} />
                  <span className="font-medium">Code valide</span>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 liquid-glass border border-red-500/30 rounded-xl text-red-300 text-sm font-medium text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info Box */}
          <div className="liquid-glass p-4 rounded-2xl mb-8 text-center">
            <p className="text-xs text-white/50 leading-relaxed">
              Le code de partie est composé de <strong className="text-white/80">5 lettres majuscules</strong>.
              <br />
              Demandez-le à l'hôte de la partie ou utilisez le bouton de partage.
            </p>
          </div>

          <div className="divider-minimal mb-8" />

          {/* Actions */}
          <div className="flex gap-4">
            <motion.button
              onClick={onClose}
              className="btn-apple-secondary flex-1 py-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Annuler
            </motion.button>
            <button
              onClick={handleJoin}
              disabled={roomCode.length !== 5 || loading}
              className="btn-apple flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="spinner-apple"></span>
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Rejoindre la partie
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
  )
}
