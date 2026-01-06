'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, Medal, TrendingUp, Star, Award } from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { LeaderboardEntry } from '@coin-clash/shared'

interface LeaderboardPanelProps {
  onClose: () => void
}

export default function LeaderboardPanel({ onClose }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket) {
      setLoading(false)
      return
    }

    // Request leaderboard
    socket.emit('leaderboard:get', 50, (entries: LeaderboardEntry[]) => {
      setLeaderboard(entries)
      setLoading(false)
    })

    return () => {
      // Cleanup
    }
  }, [])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-400" size={24} />
    if (rank === 2) return <Medal className="text-gray-300" size={24} />
    if (rank === 3) return <Medal className="text-orange-400" size={24} />
    return <span className="text-white/40 font-bold text-lg w-6">{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-yellow-600/10'
    if (rank === 2) return 'from-gray-400/20 to-gray-500/10'
    if (rank === 3) return 'from-orange-500/20 to-orange-600/10'
    return 'from-white/5 to-white/0'
  }

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 flex items-center justify-center z-[201] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card-liquid glow-white-strong max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <Trophy size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Classement Global</h2>
                  <p className="text-white/50 text-sm">Top 50 joueurs</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="liquid-glass-hover p-2 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="spinner-apple mx-auto mb-4"></div>
                    <p className="text-white/60">Chargement du classement...</p>
                  </div>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Trophy size={48} className="mx-auto mb-4 text-white/20" />
                    <p className="text-white/60">Aucun joueur dans le classement</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`liquid-glass-hover p-4 rounded-xl bg-gradient-to-r ${getRankColor(entry.rank)} flex items-center gap-4`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold">{entry.username}</h3>
                          {entry.rank <= 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">
                              Top {entry.rank}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <TrendingUp size={14} />
                            <span>Niveau {entry.level}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} />
                            <span>{entry.gamesWon} victoires</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award size={14} />
                            <span>{entry.gamesPlayed} parties</span>
                          </div>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <div className="text-2xl font-bold">{entry.xp.toLocaleString()}</div>
                        <div className="text-xs text-white/50">XP</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

