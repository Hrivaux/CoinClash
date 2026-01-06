'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Clock, 
  Zap, 
  Coins, 
  TrendingUp, 
  Sparkles, 
  Shuffle, 
  Theater,
  Users,
  ChevronRight,
  Info
} from 'lucide-react'
import { GameOptions, DEFAULT_GAME_OPTIONS, SPRINT_MODE_OPTIONS } from '@coin-clash/shared'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'
import { useRouter } from 'next/navigation'

interface CreateRoomModalProps {
  onClose: () => void
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const router = useRouter()
  const { setLoading } = useGameStore()
  const [options, setOptions] = useState<GameOptions>(DEFAULT_GAME_OPTIONS)
  const [loading, setLocalLoading] = useState(false)

  const handleCreate = () => {
    console.log('[CreateRoom] Bouton cliqué')
    setLocalLoading(true)
    setLoading(true)
    const socket = socketManager.getSocket()

    if (!socket || !socket.connected) {
      console.error('[CreateRoom] Socket non connecté')
      alert('Non connecté au serveur. Veuillez rafraîchir la page.')
      setLocalLoading(false)
      setLoading(false)
      return
    }

    console.log('[CreateRoom] Émission room:create', options)

    socket.emit('room:create', options, (roomCode) => {
      console.log('[CreateRoom] Partie créée:', roomCode)
      setLocalLoading(false)
      setLoading(false)
      router.push(`/room/${roomCode}`)
      onClose()
    })
  }

  const modules = [
    { 
      key: 'dynamicEconomy', 
      icon: TrendingUp, 
      label: 'Économie dynamique',
      desc: 'Mécaniques de retour pour les perdants',
      color: 'text-green-400'
    },
    { 
      key: 'specialCards', 
      icon: Sparkles, 
      label: 'Cartes spéciales',
      desc: '15+ cartes avec effets uniques',
      color: 'text-purple-400'
    },
    { 
      key: 'randomEvents', 
      icon: Shuffle, 
      label: 'Événements aléatoires',
      desc: '10+ événements chaos imprévisibles',
      color: 'text-orange-400'
    },
    { 
      key: 'hiddenRoles', 
      icon: Theater, 
      label: 'Rôles secrets',
      desc: 'Objectifs cachés et pouvoirs uniques',
      color: 'text-blue-400'
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop-apple"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="card-liquid glow-white-strong max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-minimal"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="liquid-glass w-14 h-14 rounded-2xl flex items-center justify-center">
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Créer une partie</h2>
                <p className="text-body">Configurez votre partie personnalisée</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Mode Selection */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Mode de jeu</h3>
              <div className="liquid-glass px-2 py-1 rounded-lg">
                <Info size={14} className="text-white/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                onClick={() => setOptions({ ...DEFAULT_GAME_OPTIONS })}
                className={`card-liquid p-6 transition-all duration-300 group relative overflow-hidden ${
                  options.mode === 'standard' ? 'border-white/30 bg-white/10' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-2 right-2">
                  {options.mode === 'standard' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="liquid-glass w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      <ChevronRight size={14} />
                    </motion.div>
                  )}
                </div>
                <Clock size={32} className="mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-lg mb-1">Standard</div>
                <div className="text-sm text-white/50 mb-3">Partie complète et stratégique</div>
                <div className="flex gap-2 text-xs">
                  <span className="badge-minimal">30 points</span>
                  <span className="badge-minimal">20 tours</span>
                  <span className="badge-minimal">35 pièces</span>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setOptions({ ...options, ...SPRINT_MODE_OPTIONS, mode: 'sprint' })}
                className={`card-liquid p-6 transition-all duration-300 group relative overflow-hidden ${
                  options.mode === 'sprint' ? 'border-white/30 bg-white/10' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-2 right-2">
                  {options.mode === 'sprint' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="liquid-glass w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      <ChevronRight size={14} />
                    </motion.div>
                  )}
                </div>
                <Zap size={32} className="mb-3 text-yellow-400 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-lg mb-1">Sprint</div>
                <div className="text-sm text-white/50 mb-3">Partie rapide et intense</div>
                <div className="flex gap-2 text-xs">
                  <span className="badge-minimal">20 points</span>
                  <span className="badge-minimal">12 tours</span>
                  <span className="badge-minimal">25 pièces</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Economy Settings */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Coins size={20} className="text-yellow-400" />
              <h3 className="text-lg font-semibold">Économie</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass p-5 rounded-2xl">
                <label className="text-sm text-white/70 mb-3 block font-medium">
                  Pièces de départ
                </label>
                <input
                  type="number"
                  value={options.startingCoins}
                  onChange={(e) => setOptions({ ...options, startingCoins: parseInt(e.target.value) })}
                  className="input-apple text-center text-2xl font-bold"
                  min="30"
                  max="100"
                />
                <div className="mt-2 flex justify-between text-xs text-white/40">
                  <span>Min: 30</span>
                  <span>Max: 100</span>
                </div>
              </div>

              <div className="liquid-glass p-5 rounded-2xl">
                <label className="text-sm text-white/70 mb-3 block font-medium">
                  Maximum de pièces
                </label>
                <input
                  type="number"
                  value={options.coinCap}
                  onChange={(e) => setOptions({ ...options, coinCap: parseInt(e.target.value) })}
                  className="input-apple text-center text-2xl font-bold"
                  min="60"
                  max="200"
                />
                <div className="mt-2 flex justify-between text-xs text-white/40">
                  <span>Min: 60</span>
                  <span>Max: 200</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-purple-400" />
              <h3 className="text-lg font-semibold">Modules de jeu</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modules.map((module) => (
                <motion.label
                  key={module.key}
                  className={`card-liquid-hover p-4 cursor-pointer transition-all duration-300 ${
                    options.modules[module.key as keyof typeof options.modules]
                      ? 'border-white/30 bg-white/10'
                      : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={options.modules[module.key as keyof typeof options.modules]}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          modules: { ...options.modules, [module.key]: e.target.checked },
                        })
                      }
                      className="mt-1 w-5 h-5 rounded-lg border-white/20 text-white bg-white/10 focus:ring-white/30"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <module.icon size={18} className={module.color} />
                        <span className="font-semibold text-sm">{module.label}</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{module.desc}</p>
                    </div>
                  </div>
                </motion.label>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-green-400" />
              <h3 className="text-lg font-semibold">Nombre de joueurs</h3>
            </div>
            <div className="liquid-glass p-6 rounded-2xl">
              <input
                type="range"
                min="2"
                max="6"
                value={options.maxPlayers}
                onChange={(e) => setOptions({ ...options, maxPlayers: parseInt(e.target.value) })}
                className="w-full accent-white h-2 rounded-full"
              />
              <div className="text-center mt-6">
                <div className="text-5xl font-black mb-2">{options.maxPlayers}</div>
                <div className="text-sm text-white/50">joueurs maximum</div>
              </div>
              <div className="flex justify-between mt-4 text-xs text-white/40">
                <span>2 joueurs</span>
                <span>6 joueurs</span>
              </div>
            </div>
          </div>

          <div className="divider-minimal mb-8" />

          {/* Actions */}
          <div className="flex gap-4">
            <motion.button
              onClick={onClose}
              className="btn-apple-secondary flex-1 py-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Annuler
            </motion.button>
            <motion.button
              onClick={handleCreate}
              disabled={loading}
              className="btn-apple flex-1 py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <span className="spinner-apple"></span>
                  Création...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Créer la partie
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
  )
}
