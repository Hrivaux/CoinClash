'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card as CardType } from '@coin-clash/shared'
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import CardHand from './CardHand'

interface CardPanelProps {
  cards: CardType[]
  onPlayCard: (cardId: string, targetId?: string) => void
  canPlayCards: boolean
  otherPlayers?: Array<{ id: string; username: string }> // For target selection
}

const CARDS_NEEDING_TARGET = ['spy', 'scan', 'silence', 'sabotage']

export default function CardPanel({ cards, onPlayCard, canPlayCards, otherPlayers = [] }: CardPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)

  if (cards.length === 0) return null

  const handleCardClick = (card: CardType) => {
    if (!canPlayCards) return
    
    // Check if card needs a target
    if (CARDS_NEEDING_TARGET.includes(card.type) && otherPlayers.length > 0) {
      setSelectedCard(card)
    } else {
      // Play card directly
      onPlayCard(card.id)
      setIsOpen(false)
    }
  }

  const handleTargetSelect = (targetId: string) => {
    if (selectedCard) {
      onPlayCard(selectedCard.id, targetId)
      setSelectedCard(null)
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Toggle Button (always visible) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          x: isOpen ? 0 : 0,
        }}
      >
        <div className="relative">
          {/* Button with card count */}
          <motion.div
            className={`
              liquid-glass-strong px-4 py-3 rounded-l-2xl
              flex items-center gap-2
              ${canPlayCards ? 'ring-2 ring-green-400/50' : ''}
            `}
            animate={canPlayCards ? {
              boxShadow: [
                '0 0 10px rgba(74, 222, 128, 0.3)',
                '0 0 20px rgba(74, 222, 128, 0.5)',
                '0 0 10px rgba(74, 222, 128, 0.3)',
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CreditCard size={20} className={canPlayCards ? 'text-green-400' : 'text-white/70'} />
            
            {/* Card count badge */}
            <motion.div
              key={cards.length}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className={`text-xl font-bold ${canPlayCards ? 'text-green-400' : 'text-white'}`}>
                {cards.length}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                {cards.length === 1 ? 'Carte' : 'Cartes'}
              </div>
            </motion.div>

            {/* Arrow indicator */}
            <motion.div
              animate={{ x: isOpen ? [-3, 0] : [0, -3] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
            >
              {isOpen ? (
                <ChevronRight size={16} className="text-white/50" />
              ) : (
                <ChevronLeft size={16} className="text-white/50" />
              )}
            </motion.div>
          </motion.div>

          {/* Pulse indicator when playable */}
          {canPlayCards && !isOpen && (
            <motion.div
              className="absolute inset-0 rounded-l-2xl bg-green-400/20"
              animate={{ scale: [1, 1.1], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      </motion.button>

      {/* Card Panel (slides from right) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50"
            >
              <div className="h-full backdrop-blur-2xl bg-black/60 border-l border-white/10 flex flex-col">
                {/* Header */}
                <div className="liquid-glass-strong p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="liquid-glass p-2 rounded-lg">
                      <CreditCard size={20} className="text-white/70" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Vos Cartes</h3>
                      <p className="text-xs text-white/50">
                        {canPlayCards ? '✨ Vous pouvez jouer maintenant !' : '⏳ En attente de la phase...'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="liquid-glass-hover p-2 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-3">
                    {cards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CardHorizontal 
                          card={card}
                          onPlay={() => handleCardClick(card)}
                          canPlay={canPlayCards}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Footer hint */}
                <div className="liquid-glass p-3 text-center border-t border-white/10">
                  <p className="text-xs text-white/40">
                    Cliquez sur une carte pour la jouer
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Target Selection Modal */}
      <AnimatePresence>
        {selectedCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[59]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md px-4"
            >
              <div className="card-liquid-strong p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-2">Sélectionner une cible</h3>
                <p className="text-sm text-white/60 mb-4">
                  Choisissez un joueur pour la carte "{selectedCard.name}"
                </p>
                
                <div className="space-y-2">
                  {otherPlayers.map((player) => (
                    <motion.button
                      key={player.id}
                      onClick={() => handleTargetSelect(player.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full liquid-glass p-3 rounded-xl text-left flex items-center justify-between"
                    >
                      <span className="font-medium">{player.username}</span>
                      <span className="text-sm text-white/50">→</span>
                    </motion.button>
                  ))}
                </div>
                
                <button
                  onClick={() => setSelectedCard(null)}
                  className="mt-4 w-full liquid-glass-hover p-2 rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Horizontal Card Component
interface CardHorizontalProps {
  card: CardType
  onPlay: () => void
  canPlay: boolean
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

const RARITY_COLORS = {
  common: 'from-slate-600/20 to-slate-700/20 border-slate-500/50',
  rare: 'from-blue-600/20 to-blue-700/20 border-blue-500/50',
  epic: 'from-purple-600/20 to-purple-700/20 border-purple-500/50',
}

const RARITY_TEXT = {
  common: { label: 'Commune', color: 'text-slate-400' },
  rare: { label: 'Rare', color: 'text-blue-400' },
  epic: { label: 'Épique', color: 'text-purple-400' },
}

function CardHorizontal({ card, onPlay, canPlay }: CardHorizontalProps) {
  const rarityColors = RARITY_COLORS[card.rarity]
  const rarityText = RARITY_TEXT[card.rarity]

  return (
    <motion.button
      onClick={onPlay}
      disabled={!canPlay}
      whileHover={canPlay ? { scale: 1.02, x: -5 } : {}}
      whileTap={canPlay ? { scale: 0.98 } : {}}
      className={`
        w-full backdrop-blur-xl bg-gradient-to-r border-2 rounded-xl p-3
        flex items-center gap-3 transition-all
        ${rarityColors}
        ${canPlay ? 'cursor-pointer hover:shadow-xl' : 'opacity-50 cursor-not-allowed'}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 text-4xl">
        {CARD_ICONS[card.type] || '🎴'}
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-sm">{card.name}</h4>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${rarityText.color} bg-black/30`}>
            {rarityText.label}
          </span>
        </div>
        <p className="text-xs text-white/60 leading-tight line-clamp-2">
          {card.description}
        </p>
      </div>

      {/* Play indicator */}
      {canPlay && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex-shrink-0 text-green-400"
        >
          ▶
        </motion.div>
      )}
    </motion.button>
  )
}

