'use client'

import { motion } from 'framer-motion'
import { GameState } from '@coin-clash/shared'
import { Trophy, Coins, Timer, Hash } from 'lucide-react'
import PlayerCard from './PlayerCard'
import EventBanner from './EventBanner'
import PhaseIndicator from './PhaseIndicator'

interface GameTableProps {
  game: GameState
  currentPlayerId: string
}

const phaseMessages = {
  betting: { title: 'Placez vos mises', emoji: '🎲', subtitle: 'Choisissez votre montant' },
  planning: { title: 'Planifiez votre stratégie', emoji: '🎯', subtitle: 'Réfléchissez à votre prochain coup' },
  reveal: { title: 'Révélation des mises', emoji: '🔮', subtitle: 'Le moment de vérité...' },
  resolution: { title: 'Calcul des résultats', emoji: '⚡', subtitle: 'Qui va remporter ce tour ?' },
  instant_cards: { title: 'Cartes instantanées', emoji: '🃏', subtitle: 'Jouez vos cartes maintenant' },
  end_turn: { title: 'Tour terminé', emoji: '✨', subtitle: 'Préparez-vous pour le prochain tour' },
  event: { title: 'Événement aléatoire', emoji: '🎰', subtitle: 'Les règles changent !' },
  game_end: { title: 'Partie terminée', emoji: '🏆', subtitle: 'Félicitations au gagnant !' }
}

export default function GameTable({ game, currentPlayerId }: GameTableProps) {
  const currentPlayer = game.players.find(p => p.id === currentPlayerId)
  const otherPlayers = game.players.filter(p => p.id !== currentPlayerId)
  const phaseInfo = phaseMessages[game.phase] || phaseMessages.betting
  
  // Calculate pot from all players' current bets
  const pot = game.players.reduce((sum, player) => sum + (player.currentBet || 0), 0)

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />
      
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/5"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Turn Info */}
            <div className="flex items-center gap-4">
              <div className="liquid-glass px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-white/50" />
                  <div>
                    <div className="text-xs text-white/40">Tour</div>
                    <div className="text-lg font-bold">
                      {game.currentTurn}{game.options.maxTurns ? ` / ${game.options.maxTurns}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="liquid-glass px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-400" />
                  <div>
                    <div className="text-xs text-white/40">Objectif</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {game.options.pointsToWin} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Phase */}
            <PhaseIndicator phase={game.phase} timer={game.phaseTimer} />

            {/* Right: Room Code */}
            <div className="liquid-glass px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-white/50" />
                <div>
                  <div className="text-xs text-white/40">Code</div>
                  <div className="text-lg font-mono font-bold tracking-wider">
                    {game.roomCode}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Event Banner */}
      {game.currentEvent && game.phase === 'event' && (
        <EventBanner event={game.currentEvent} />
      )}

      {/* Main Game Area */}
      <div className="container mx-auto px-4 pt-24 pb-40 relative z-10">
        {/* Other Players Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8"
        >
          {otherPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <PlayerCard player={player} isCurrentPlayer={false} />
            </motion.div>
          ))}
        </motion.div>

        {/* Center Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <div className="card-liquid p-8 text-center relative overflow-hidden">
            {/* Animated Background */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                background: [
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Content */}
            <motion.div
              key={game.phase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {phaseInfo.emoji}
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                {phaseInfo.title}
              </h2>

              <p className="text-white/50 text-sm md:text-base">
                {phaseInfo.subtitle}
              </p>

              {/* Pot Display */}
              {pot > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-6 inline-flex items-center gap-2 liquid-glass px-6 py-3 rounded-full"
                >
                  <Coins size={20} className="text-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-400">{pot}</span>
                  <span className="text-white/50 text-sm">dans le pot</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Current Player (Bottom Bar) */}
      {currentPlayer && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-t border-white/5"
        >
          <div className="container mx-auto px-4 py-3">
            <PlayerCard player={currentPlayer} isCurrentPlayer={true} />
          </div>
        </motion.div>
      )}
    </div>
  )
}
