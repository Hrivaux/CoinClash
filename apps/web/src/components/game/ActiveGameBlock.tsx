'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Play, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ActiveGameBlockProps {
  roomCode: string
  onReturn: () => void
}

export default function ActiveGameBlock({ roomCode, onReturn }: ActiveGameBlockProps) {
  const router = useRouter()

  const handleReturnToGame = () => {
    router.push(`/room/${roomCode}`)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="card-liquid glow-white-strong max-w-md w-full p-8 text-center relative"
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 rounded-xl -z-10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 200%',
            backgroundImage: 'linear-gradient(45deg, rgba(240,109,31,0.1) 0%, rgba(100,100,255,0.1) 50%, rgba(74,222,128,0.1) 100%)',
          }}
        />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 10 }}
          className="mb-6"
        >
          <AlertTriangle size={80} className="mx-auto text-orange-400 mb-4" />
        </motion.div>

        <h2 className="text-3xl font-bold mb-4 text-white">
          Partie déjà en cours
        </h2>

        <p className="text-body mb-6 text-white/80">
          Vous avez une partie active dans le lobby <span className="font-bold text-white">{roomCode}</span>.
          <br />
          <br />
          Vous ne pouvez pas créer ou rejoindre un nouveau lobby tant qu'une partie est en cours.
        </p>

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={handleReturnToGame}
            className="btn-primary w-full flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={18} />
            Retourner à la partie
          </motion.button>

          <motion.button
            onClick={onReturn}
            className="btn-secondary w-full flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={18} />
            Retour
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

