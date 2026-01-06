'use client'

import { motion } from 'framer-motion'
import { GamePhase } from '@coin-clash/shared'
import { Clock, Zap } from 'lucide-react'

interface PhaseIndicatorProps {
  phase: GamePhase
  timer?: number
}

const PHASE_INFO: Record<GamePhase, { label: string; icon: string; color: string; bgColor: string }> = {
  betting: { label: 'Mises', icon: '💰', color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-yellow-600/20' },
  planning: { label: 'Planification', icon: '🧠', color: 'text-blue-400', bgColor: 'from-blue-500/20 to-blue-600/20' },
  instant_cards: { label: 'Cartes Instant', icon: '⚡', color: 'text-purple-400', bgColor: 'from-purple-500/20 to-purple-600/20' },
  reveal: { label: 'Révélation', icon: '🔮', color: 'text-cyan-400', bgColor: 'from-cyan-500/20 to-cyan-600/20' },
  resolution: { label: 'Résolution', icon: '🎯', color: 'text-green-400', bgColor: 'from-green-500/20 to-green-600/20' },
  end_turn: { label: 'Fin de Tour', icon: '✅', color: 'text-white/60', bgColor: 'from-white/10 to-white/5' },
  event: { label: 'Événement', icon: '🎰', color: 'text-orange-400', bgColor: 'from-orange-500/20 to-red-500/20' },
  game_end: { label: 'Fin de Partie', icon: '🏆', color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-yellow-600/20' },
}

export default function PhaseIndicator({ phase, timer }: PhaseIndicatorProps) {
  const info = PHASE_INFO[phase] || PHASE_INFO.betting
  const showTimer = timer !== undefined && timer > 0
  const isUrgent = timer !== undefined && timer <= 5

  return (
    <motion.div
      key={phase}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3"
    >
      {/* Phase Info */}
      <div className={`liquid-glass-strong px-4 py-2 rounded-xl bg-gradient-to-r ${info.bgColor} relative overflow-hidden`}>
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          {/* Icon */}
          <motion.div
            animate={
              phase === 'betting' || phase === 'instant_cards'
                ? { rotate: [0, 10, -10, 0] }
                : { scale: [1, 1.1, 1] }
            }
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
          >
            {info.icon}
          </motion.div>

          {/* Label */}
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Phase</div>
            <div className={`text-sm font-bold ${info.color}`}>
              {info.label}
            </div>
          </div>
        </div>
      </div>

      {/* Timer */}
      {showTimer && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: isUrgent ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
          className="relative"
        >
          <div className={`
            liquid-glass-strong w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden
            ${isUrgent ? 'ring-2 ring-red-400/50' : 'ring-1 ring-white/10'}
          `}>
            {/* Urgent pulse */}
            {isUrgent && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/20"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}

            {/* Timer value */}
            <div className="relative z-10 flex flex-col items-center">
              <Clock size={14} className={isUrgent ? 'text-red-400' : 'text-white/50'} />
              <div className={`text-xl font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                {timer}
              </div>
            </div>

            {/* Progress ring */}
            {timer <= 10 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke={isUrgent ? 'rgba(248, 113, 113, 0.5)' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 20 }}
                />
              </svg>
            )}
          </div>

          {/* Urgent warning */}
          {isUrgent && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Zap size={16} className="text-red-400 drop-shadow-glow" fill="currentColor" />
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
