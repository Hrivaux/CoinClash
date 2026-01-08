'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socketManager } from '@/lib/socket'
import { Trophy, Coins, Sparkles, AlertCircle } from 'lucide-react'

export interface GameNotification {
  id: string
  type: 'bet' | 'winner' | 'card' | 'event' | 'info'
  message: string
  playerName?: string
  amount?: number
  icon?: string
  timestamp: number
}

export default function GameNotifications() {
  const [notifications, setNotifications] = useState<GameNotification[]>([])
  const processedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket) return

    // Listen for bet reveals
    const handleBetsRevealed = (bets: Record<string, number>, players?: any[]) => {
      // Create a unique key for this batch of bets
      const betsKey = JSON.stringify(bets)
      const uniqueId = `bets-${betsKey}`
      
      // Skip if already processed
      if (processedIdsRef.current.has(uniqueId)) {
        return
      }
      processedIdsRef.current.add(uniqueId)
      
      const newNotifications: GameNotification[] = []
      
      // If players array is provided, use it. Otherwise, just show amounts
      for (const [playerId, amount] of Object.entries(bets)) {
        const player = players?.find(p => p.id === playerId)
        const playerName = player?.username || `Joueur ${playerId.slice(0, 4)}`
        
        newNotifications.push({
          id: `bet-${playerId}-${Date.now()}`,
          type: 'bet' as const,
          message: `${playerName} a misé ${amount} pièce${amount > 1 ? 's' : ''}`,
          playerName,
          amount,
          icon: '💰',
          timestamp: Date.now(),
        })
      }
      
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 10))
    }

    // Listen for winner announcement
    const handleTurnResult = (result: any) => {
      // Use enriched winner info if available, otherwise fall back to winner ID
      const winnerInfo = result.winnerInfo || (result.winner && { id: result.winner });
      
      if (winnerInfo) {
        const winnerUsername = winnerInfo.username || 'Joueur inconnu';
        const winnerBet = winnerInfo.currentBet || result.bets?.[winnerInfo.id] || 0;
        
        // Create unique ID based on turn result
        const uniqueId = `winner-${winnerInfo.id}-${result.turnNumber || Date.now()}`
        
        // Skip if already processed
        if (processedIdsRef.current.has(uniqueId)) {
          return
        }
        processedIdsRef.current.add(uniqueId)
        
        setNotifications(prev => [{
          id: uniqueId,
          type: 'winner' as const,
          message: `🏆 ${winnerUsername} remporte ce tour avec ${winnerBet} pièces !`,
          playerName: winnerUsername,
          amount: winnerBet,
          icon: '🏆',
          timestamp: Date.now(),
        }, ...prev].slice(0, 10))
      }
    }

    // Listen for card plays
    const handleCardPlayed = (cardData: any) => {
      // Create unique ID based on card play data
      const uniqueId = `card-${cardData.playerId || 'unknown'}-${cardData.cardId || Date.now()}`
      
      // Skip if already processed
      if (processedIdsRef.current.has(uniqueId)) {
        return
      }
      processedIdsRef.current.add(uniqueId)
      
      setNotifications(prev => [{
        id: uniqueId,
        type: 'card' as const,
        message: `${cardData.playerName || 'Un joueur'} a joué la carte "${cardData.cardName}"`,
        playerName: cardData.playerName,
        icon: '🃏',
        timestamp: Date.now(),
      }, ...prev].slice(0, 10))
    }

    // Listen for events
    const handleEvent = (event: any) => {
      // Create unique ID based on event
      const uniqueId = `event-${event.type || event.name}-${event.id || Date.now()}`
      
      // Skip if already processed
      if (processedIdsRef.current.has(uniqueId)) {
        return
      }
      processedIdsRef.current.add(uniqueId)
      
      setNotifications(prev => [{
        id: uniqueId,
        type: 'event' as const,
        message: `🎰 ${event.name}: ${event.description}`,
        icon: '🎰',
        timestamp: Date.now(),
      }, ...prev].slice(0, 10))
    }

    // @ts-ignore - game:bets_revealed event not in type definitions
    socket.on('game:bets_revealed', handleBetsRevealed)
    // @ts-ignore - game:turn_result event not in type definitions
    socket.on('game:turn_result', handleTurnResult)
    // @ts-ignore - game:card_played event not in type definitions
    socket.on('game:card_played', handleCardPlayed)
    // @ts-ignore - game:event_triggered event not in type definitions
    socket.on('game:event_triggered', handleEvent)

    return () => {
      // @ts-ignore - game:bets_revealed event not in type definitions
      socket.off('game:bets_revealed', handleBetsRevealed)
      // @ts-ignore - game:turn_result event not in type definitions
      socket.off('game:turn_result', handleTurnResult)
      // @ts-ignore - game:card_played event not in type definitions
      socket.off('game:card_played', handleCardPlayed)
      // @ts-ignore - game:event_triggered event not in type definitions
      socket.off('game:event_triggered', handleEvent)
    }
  }, [])

  // Auto-remove notifications after 5 seconds and clean processed IDs
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setNotifications(prev => prev.filter(n => now - n.timestamp < 5000))
      
      // Clean processed IDs older than 30 seconds (keep Set small)
      // We'll just clear it periodically since we use unique keys per event
      if (processedIdsRef.current.size > 100) {
        processedIdsRef.current.clear()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="mb-2 pointer-events-auto"
          >
            <div className={`
              liquid-glass-strong p-3 rounded-xl
              flex items-center gap-3
              ${notification.type === 'winner' ? 'ring-2 ring-yellow-400/50' : ''}
              ${notification.type === 'bet' ? 'ring-1 ring-blue-400/30' : ''}
              ${notification.type === 'card' ? 'ring-1 ring-purple-400/30' : ''}
              ${notification.type === 'event' ? 'ring-1 ring-orange-400/30' : ''}
            `}>
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">
                {notification.icon || '💬'}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {notification.message}
                </p>
                {notification.amount !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <Coins size={12} className="text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-bold">
                      {notification.amount}
                    </span>
                  </div>
                )}
              </div>

              {/* Type icon */}
              <div className="flex-shrink-0">
                {notification.type === 'winner' && (
                  <Trophy size={16} className="text-yellow-400" />
                )}
                {notification.type === 'bet' && (
                  <Coins size={16} className="text-blue-400" />
                )}
                {notification.type === 'card' && (
                  <Sparkles size={16} className="text-purple-400" />
                )}
                {notification.type === 'event' && (
                  <AlertCircle size={16} className="text-orange-400" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

