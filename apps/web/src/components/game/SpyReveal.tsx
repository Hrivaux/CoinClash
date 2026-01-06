'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socketManager } from '@/lib/socket'
import { Eye, X, Coins } from 'lucide-react'

interface SpyReveal {
  targetId: string
  targetName: string
  bet: number | null
  hasBet: boolean
}

export default function SpyReveal() {
  const [reveals, setReveals] = useState<SpyReveal[]>([])

  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket) return

    const handleSpyReveal = (data: SpyReveal) => {
      setReveals(prev => {
        // Remove old reveal for same target
        const filtered = prev.filter(r => r.targetId !== data.targetId)
        // Add new reveal
        return [...filtered, data]
      })
    }

    socket.on('game:spy_reveal', handleSpyReveal)

    return () => {
      socket.off('game:spy_reveal', handleSpyReveal)
    }
  }, [])

  const removeReveal = (targetId: string) => {
    setReveals(prev => prev.filter(r => r.targetId !== targetId))
  }

  if (reveals.length === 0) return null

  return (
    <div className="fixed top-32 right-4 z-50 w-80 space-y-2">
      <AnimatePresence>
        {reveals.map((reveal) => (
          <motion.div
            key={reveal.targetId}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="liquid-glass-strong p-4 rounded-xl border-2 border-purple-400/50 relative"
          >
            {/* Close button */}
            <button
              onClick={() => removeReveal(reveal.targetId)}
              className="absolute top-2 right-2 liquid-glass-hover p-1 rounded-lg"
            >
              <X size={14} className="text-white/60" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Eye size={18} className="text-purple-400" />
              <h4 className="font-bold text-sm">Espion</h4>
            </div>

            {/* Content */}
            <div>
              <p className="text-xs text-white/60 mb-2">
                Mise de <span className="font-semibold text-white">{reveal.targetName}</span>:
              </p>
              
              {reveal.hasBet && reveal.bet !== null ? (
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-yellow-400" />
                  <span className="text-xl font-bold text-yellow-400">
                    {reveal.bet}
                  </span>
                  <span className="text-xs text-white/50">pièce{reveal.bet > 1 ? 's' : ''}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50 italic">
                    Pas encore misé
                  </span>
                </div>
              )}
            </div>

            {/* Hint */}
            <p className="text-[10px] text-white/40 mt-2 italic">
              Cette information est privée
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

