'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, TrendingUp, Zap, Check } from 'lucide-react'
import clsx from 'clsx'

interface BettingSliderProps {
  min: number
  max: number
  currentCoins: number
  onPlaceBet: (amount: number) => void
  disabled?: boolean
}

export default function BettingSlider({
  min,
  max,
  currentCoins,
  onPlaceBet,
  disabled = false,
}: BettingSliderProps) {
  const [bet, setBet] = useState(min)
  const [isConfirming, setIsConfirming] = useState(false)
  const maxBet = Math.min(max, currentCoins)

  // Generate quick bet amounts
  const quickBets: number[] = []
  const step = Math.max(1, Math.floor(maxBet / 5))
  for (let i = 1; i <= 5; i++) {
    const amount = Math.min(min + (step * i) - step, maxBet)
    if (amount >= min && !quickBets.includes(amount)) {
      quickBets.push(amount)
    }
  }
  if (!quickBets.includes(maxBet) && maxBet >= min) {
    quickBets[quickBets.length - 1] = maxBet
  }

  const handleBet = async () => {
    if (bet >= min && bet <= maxBet && !disabled) {
      setIsConfirming(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      onPlaceBet(bet)
    }
  }

  const percentage = ((bet - min) / (maxBet - min)) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-liquid p-6 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl mb-2"
        >
          💰
        </motion.div>
        <h3 className="text-2xl font-bold mb-1">Placez votre mise</h3>
        <div className="flex items-center justify-center gap-1.5 text-sm text-white/50">
          <Coins size={14} />
          <span>Vous avez <span className="text-green-400 font-semibold">{currentCoins}</span> pièces</span>
        </div>
      </div>

      {/* Current Bet Display */}
      <motion.div
        className="liquid-glass p-6 rounded-2xl text-center mb-6 relative overflow-hidden"
        key={bet}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ width: `${percentage}%` }}
        />

        <div className="relative z-10">
          <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
            {bet}
          </div>
          <div className="text-xs text-white/40 uppercase tracking-wide">Mise actuelle</div>
        </div>
      </motion.div>

      {/* Slider */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={maxBet}
            value={bet}
            onChange={(e) => setBet(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-5 
                       [&::-webkit-slider-thumb]:h-5 
                       [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-gradient-to-br
                       [&::-webkit-slider-thumb]:from-yellow-400
                       [&::-webkit-slider-thumb]:to-yellow-600
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-yellow-500/50
                       [&::-webkit-slider-thumb]:hover:scale-125
                       [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:border-2
                       [&::-webkit-slider-thumb]:border-white/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        <div className="flex justify-between items-center text-xs text-white/40 mt-2">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>Min: {min}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} />
            <span>Max: {maxBet}</span>
          </div>
        </div>
      </div>

      {/* Quick Bet Buttons */}
      {quickBets.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-white/40 uppercase tracking-wide text-center mb-3">
            Mises rapides
          </div>
          <div className="grid grid-cols-5 gap-2">
            {quickBets.map((amount) => (
              <motion.button
                key={amount}
                onClick={() => !disabled && setBet(amount)}
                disabled={disabled}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  'py-2.5 px-3 text-sm font-semibold rounded-lg transition-all relative overflow-hidden',
                  bet === amount
                    ? 'liquid-glass-strong text-yellow-400 ring-1 ring-yellow-400/50'
                    : 'liquid-glass text-white/70 hover:text-white',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {bet === amount && (
                  <motion.div
                    layoutId="activeBet"
                    className="absolute inset-0 bg-yellow-400/10 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{amount}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <motion.button
        onClick={handleBet}
        disabled={disabled || bet < min || bet > maxBet || isConfirming}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={clsx(
          'w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden',
          disabled || isConfirming
            ? 'bg-white/5 text-white/30 cursor-not-allowed'
            : 'btn-apple'
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isConfirming ? (
            <>
              <Check size={20} />
              <span>Confirmé !</span>
            </>
          ) : (
            <>
              <Coins size={20} />
              <span>Confirmer la mise</span>
            </>
          )}
        </span>
      </motion.button>

      {disabled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-white/40 mt-3 flex items-center justify-center gap-1.5"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            ⏳
          </motion.span>
          <span>En attente de la phase de mise...</span>
        </motion.p>
      )}
    </motion.div>
  )
}
