'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socketManager } from '@/lib/socket'
import { Trophy, Coins, Award, TrendingUp, Clock, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PlayerRanking {
  player: {
    id: string
    username: string
    points: number
    coins: number
    stats: {
      wins: number
      totalBets: number
      cardsPlayed: number
    }
  }
  rank: number
  finalPoints: number
  finalCoins: number
  turnsWon: number
  badges: any[]
  xpGained: number
}

interface GameEndScreenProps {
  game: any
  rankings: PlayerRanking[]
  onClose?: () => void
}

export default function GameEndScreen({ game, rankings, onClose }: GameEndScreenProps) {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)
  const winner = rankings[0]

  const handleReturnToLobby = () => {
    router.push('/')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl"
        >
          {/* Main Card */}
          <div className="card-liquid-strong p-8 rounded-3xl relative overflow-hidden">
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 200%' }}
            />

            <div className="relative z-10">
              {/* Winner Announcement */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-8xl mb-4"
                >
                  🏆
                </motion.div>
                
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Partie Terminée !
                </h1>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <div className="text-2xl text-white/80 mb-2">Le gagnant est</div>
                  <div className="text-4xl font-bold text-yellow-400 flex items-center justify-center gap-3">
                    <Trophy size={40} className="text-yellow-400" />
                    {winner?.player.username || 'Inconnu'}
                    <Trophy size={40} className="text-yellow-400" />
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="liquid-glass px-4 py-2 rounded-xl">
                      <div className="text-sm text-white/60">Points finaux</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {winner?.finalPoints || 0}
                      </div>
                    </div>
                    <div className="liquid-glass px-4 py-2 rounded-xl">
                      <div className="text-sm text-white/60">Pièces finales</div>
                      <div className="text-2xl font-bold text-green-400">
                        {winner?.finalCoins || 0}
                      </div>
                    </div>
                    <div className="liquid-glass px-4 py-2 rounded-xl">
                      <div className="text-sm text-white/60">Tours gagnés</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {winner?.turnsWon || 0}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Rankings */}
              <div className="mt-8">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full liquid-glass-hover p-4 rounded-xl mb-4 flex items-center justify-between"
                >
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Award size={24} />
                    Classement Final
                  </h2>
                  <motion.div
                    animate={{ rotate: showDetails ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ▼
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {rankings.map((ranking, index) => (
                        <motion.div
                          key={ranking.player.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            liquid-glass p-4 rounded-xl flex items-center gap-4
                            ${index === 0 ? 'ring-2 ring-yellow-400/50' : ''}
                            ${index === 1 ? 'ring-1 ring-slate-400/30' : ''}
                            ${index === 2 ? 'ring-1 ring-orange-400/30' : ''}
                          `}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full liquid-glass-strong flex items-center justify-center font-bold text-xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${ranking.rank}`}
                          </div>

                          {/* Player Info */}
                          <div className="flex-1">
                            <div className="font-bold text-lg">{ranking.player.username}</div>
                            <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                              <span className="flex items-center gap-1">
                                <Trophy size={14} />
                                {ranking.finalPoints} pts
                              </span>
                              <span className="flex items-center gap-1">
                                <Coins size={14} />
                                {ranking.finalCoins} pièces
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp size={14} />
                                {ranking.turnsWon} victoires
                              </span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-right text-sm">
                            <div className="text-white/60">XP gagné</div>
                            <div className="font-bold text-green-400">+{ranking.xpGained}</div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Game Stats Summary */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="liquid-glass p-4 rounded-xl text-center">
                  <Clock size={20} className="text-white/60 mx-auto mb-2" />
                  <div className="text-sm text-white/60">Tours joués</div>
                  <div className="text-2xl font-bold">{game?.currentTurn || 0}</div>
                </div>
                <div className="liquid-glass p-4 rounded-xl text-center">
                  <Users size={20} className="text-white/60 mx-auto mb-2" />
                  <div className="text-sm text-white/60">Joueurs</div>
                  <div className="text-2xl font-bold">{rankings.length}</div>
                </div>
                <div className="liquid-glass p-4 rounded-xl text-center">
                  <Trophy size={20} className="text-white/60 mx-auto mb-2" />
                  <div className="text-sm text-white/60">Objectif</div>
                  <div className="text-2xl font-bold">{game?.options?.pointsToWin || 0} pts</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-4">
                <motion.button
                  onClick={handleReturnToLobby}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 btn-apple py-4 rounded-xl font-bold text-lg"
                >
                  Retour au Lobby
                </motion.button>
                {onClose && (
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 liquid-glass-hover py-4 rounded-xl font-bold text-lg"
                  >
                    Fermer
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

