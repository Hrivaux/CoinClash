'use client'

import { motion } from 'framer-motion'
import { Player } from '@coin-clash/shared'
import { Trophy, Coins, CreditCard, Bot, Wifi, WifiOff, PauseCircle } from 'lucide-react'
import clsx from 'clsx'

interface PlayerCardProps {
  player: Player
  isCurrentPlayer: boolean
}

export default function PlayerCard({ player, isCurrentPlayer }: PlayerCardProps) {
  const showCards = player.hand && player.hand.length > 0

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden transition-all duration-300',
        isCurrentPlayer ? 'card-liquid-strong' : 'card-liquid',
        player.isInBreak && 'ring-2 ring-yellow-400/50',
        !player.isConnected && 'opacity-60'
      )}
      whileHover={{ scale: isCurrentPlayer ? 1 : 1.02 }}
      layout
    >
      {/* Glow effect for current player */}
      {isCurrentPlayer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/0"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Break Mode Banner */}
      {player.isInBreak && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm px-3 py-1.5 text-xs text-center font-semibold border-b border-yellow-400/30 flex items-center justify-center gap-1.5"
        >
          <PauseCircle size={12} />
          <span>Mode Repos</span>
        </motion.div>
      )}

      <div className={clsx('relative z-10 p-3', player.isInBreak && 'pt-8')}>
        {/* Header: Avatar + Name + Bot */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className={clsx(
            'liquid-glass flex-shrink-0 rounded-full flex items-center justify-center relative',
            isCurrentPlayer ? 'w-14 h-14 text-3xl' : 'w-12 h-12 text-2xl'
          )}>
            {player.avatar || '👤'}
            
            {/* Connection Status */}
            <div className="absolute -bottom-0.5 -right-0.5">
              {player.isConnected ? (
                <Wifi size={12} className="text-green-400 drop-shadow-glow" />
              ) : (
                <WifiOff size={12} className="text-red-400" />
              )}
            </div>
          </div>

          {/* Name + Bot */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate flex items-center gap-1.5">
              <span>{player.username}</span>
              {player.isBot && (
                <span className="text-xs liquid-glass px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Bot size={10} />
                  <span className="capitalize text-[10px]">{player.botDifficulty}</span>
                </span>
              )}
            </div>
            {!player.isConnected && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <WifiOff size={10} />
                Déconnecté
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={clsx(
          'grid gap-2',
          isCurrentPlayer ? 'grid-cols-3' : 'grid-cols-2'
        )}>
          {/* Points */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="liquid-glass p-2 rounded-lg text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Trophy size={12} className="text-yellow-400" />
            </div>
            <div className="text-xl font-bold text-yellow-400">
              {player.points}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Points</div>
          </motion.div>

          {/* Coins */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="liquid-glass p-2 rounded-lg text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Coins size={12} className="text-green-400" />
            </div>
            <div className="text-xl font-bold text-green-400">
              {player.coins}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Pièces</div>
          </motion.div>

          {/* Cards (ONLY for current player - hidden for others) */}
          {isCurrentPlayer && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="liquid-glass p-2 rounded-lg text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CreditCard size={12} className="text-blue-400" />
              </div>
              <div className="text-xl font-bold text-blue-400">
                {player.hand?.length || 0}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide">Cartes</div>
            </motion.div>
          )}
        </div>

        {/* Bet Status (for other players) */}
        {!isCurrentPlayer && player.currentBet !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-2 flex items-center justify-center gap-1.5 liquid-glass px-3 py-1.5 rounded-lg text-xs"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ✅
            </motion.div>
            <span className="font-medium">Mise placée</span>
          </motion.div>
        )}

        {/* Current Bet (for current player) */}
        {isCurrentPlayer && player.currentBet !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-2 flex items-center justify-center gap-2 bg-white/10 px-4 py-2 rounded-lg"
          >
            <Coins size={14} className="text-yellow-400" />
            <span className="text-sm text-white/50">Mise:</span>
            <span className="text-lg font-bold text-yellow-400">{player.currentBet}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
