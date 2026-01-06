'use client'

import { motion } from 'framer-motion'
import { GameEvent } from '@coin-clash/shared'
import { AlertCircle } from 'lucide-react'

interface EventBannerProps {
  event: GameEvent
}

export default function EventBanner({ event }: EventBannerProps) {
  return (
    <motion.div
      initial={{ y: -150, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -150, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
    >
      <motion.div
        className="card-liquid-strong relative overflow-hidden"
        animate={{
          scale: [1, 1.01, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Animated background effects */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-yellow-500/20"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 200%' }}
        />

        {/* Glow pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-orange-400/20 via-transparent to-transparent"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        <div className="relative z-10 p-8 text-center">
          {/* Alert Icon */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertCircle className="text-orange-400" size={24} />
            <span className="text-sm uppercase tracking-wider text-orange-400 font-bold">
              Événement Spécial !
            </span>
            <AlertCircle className="text-orange-400" size={24} />
          </motion.div>

          {/* Event Icon */}
          <motion.div
            className="text-7xl mb-4 drop-shadow-2xl"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            {event.icon}
          </motion.div>

          {/* Event Name */}
          <motion.h2
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-300 via-yellow-300 to-red-300 bg-clip-text text-transparent"
          >
            {event.name}
          </motion.h2>

          {/* Event Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto"
          >
            {event.description}
          </motion.p>

          {/* Decorative border animation */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
