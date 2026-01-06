'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card as CardType } from '@coin-clash/shared'
import { Sparkles, Zap, Shield } from 'lucide-react'
import clsx from 'clsx'

interface CardHandProps {
  cards: CardType[]
  onPlayCard: (cardId: string) => void
  canPlayCards: boolean
  enabled?: boolean // NEW: to control if cards should be shown
}

const RARITY_COLORS = {
  common: 'from-slate-600/20 to-slate-700/20 border-slate-500/30',
  rare: 'from-blue-600/20 to-blue-700/20 border-blue-500/50',
  epic: 'from-purple-600/20 to-purple-700/20 border-purple-500/50',
}

const RARITY_TEXT = {
  common: { label: 'Commune', color: 'text-slate-400' },
  rare: { label: 'Rare', color: 'text-blue-400' },
  epic: { label: 'Épique', color: 'text-purple-400' },
}

const CARD_ICONS: Record<string, string> = {
  spy: '🕵️',
  scan: '🔍',
  silence: '🤐',
  double: '✖️2️⃣',
  shield: '🛡️',
  mirage: '🌀',
  sabotage: '💣',
  steal: '🦹',
  reverse: '🔄',
}

const TIMING_INFO = {
  before_bet: { label: 'Avant la mise', icon: Zap },
  instant: { label: 'Instantané', icon: Sparkles },
  after_reveal: { label: 'Après révélation', icon: Shield },
}

export default function CardHand({ cards, onPlayCard, canPlayCards, enabled = true }: CardHandProps) {
  // Don't show if module is disabled
  if (!enabled) {
    return null
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-6 text-white/40">
        <p className="text-sm">Aucune carte en main</p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 justify-center flex-wrap py-2">
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => {
          const rarityColors = RARITY_COLORS[card.rarity]
          const rarityText = RARITY_TEXT[card.rarity]
          const timingInfo = TIMING_INFO[card.timing]
          const TimingIcon = timingInfo.icon

          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              transition={{ 
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ y: -12, scale: 1.05, rotateZ: index % 2 === 0 ? 2 : -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => canPlayCards && onPlayCard(card.id)}
              disabled={!canPlayCards}
              className={clsx(
                'relative w-36 h-52 rounded-2xl transition-all',
                'backdrop-blur-xl bg-gradient-to-br border-2',
                'hover:shadow-2xl',
                rarityColors,
                !canPlayCards && 'opacity-40 cursor-not-allowed hover:scale-100'
              )}
            >
              {/* Animated glow */}
              {canPlayCards && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              <div className="relative z-10 h-full flex flex-col p-3">
                {/* Rarity Badge */}
                <div className={clsx(
                  'absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide',
                  'backdrop-blur-sm bg-black/40',
                  rarityText.color
                )}>
                  {rarityText.label}
                </div>

                {/* Card Icon */}
                <motion.div
                  animate={canPlayCards ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-2 mt-4 text-center drop-shadow-lg"
                >
                  {CARD_ICONS[card.type] || '🎴'}
                </motion.div>

                {/* Card Name */}
                <div className="text-base font-bold text-center mb-2 px-1 leading-tight">
                  {card.name}
                </div>

                {/* Card Description */}
                <div className="text-[10px] text-white/60 text-center flex-1 leading-snug px-1">
                  {card.description}
                </div>

                {/* Timing Badge */}
                <div className="liquid-glass px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5">
                  <TimingIcon size={12} className="text-white/70" />
                  <span className="text-[10px] font-medium text-white/70">
                    {timingInfo.label}
                  </span>
                </div>
              </div>

              {/* Play indicator */}
              {canPlayCards && (
                <motion.div
                  className="absolute inset-0 rounded-2xl ring-2 ring-white/50"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
