'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Users,
  Clock,
  Zap,
  Coins,
  TrendingUp,
  Sparkles,
  Shuffle,
  Theater,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { GameOptions } from '@coin-clash/shared'

interface LobbyConfigProps {
  currentOptions: GameOptions
  onUpdate: (options: Partial<GameOptions>) => void
  isHost: boolean
}

export default function LobbyConfig({ currentOptions, onUpdate, isHost }: LobbyConfigProps) {
  const [expanded, setExpanded] = useState(true) // Par défaut ouvert pour l'hôte

  console.log('[LobbyConfig] Rendering - isHost:', isHost, 'expanded:', expanded)

  const handleUpdate = (updates: Partial<GameOptions>) => {
    console.log('[LobbyConfig] Updating options:', updates)
    onUpdate(updates)
  }

  if (!isHost) {
    console.log('[LobbyConfig] Rendering in NON-HOST mode')
    // Affichage simple pour les non-hôtes
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-liquid p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings size={20} />
            Configuration de la partie
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Users size={14} />
              Joueurs max
            </div>
            <div className="font-semibold">{currentOptions.maxPlayers}</div>
          </div>

          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Clock size={14} />
              Durée
            </div>
            <div className="font-semibold">{currentOptions.maxTurns || '∞'} tours</div>
          </div>

          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <TrendingUp size={14} />
              Victoire
            </div>
            <div className="font-semibold">{currentOptions.pointsToWin} pts</div>
          </div>

          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Coins size={14} />
              Pièces départ
            </div>
            <div className="font-semibold">{currentOptions.startingCoins}</div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Interface complète pour l'hôte
  console.log('[LobbyConfig] Rendering in HOST mode')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-liquid p-6"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('[LobbyConfig] Button clicked! Current expanded:', expanded)
          setExpanded(!expanded)
        }}
        className="w-full flex items-center justify-between mb-4 group hover:opacity-80 transition-opacity cursor-pointer"
        style={{ pointerEvents: 'auto', zIndex: 10 }}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings size={20} className="group-hover:rotate-90 transition-transform" />
          Configuration de la partie
        </h3>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      {expanded ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="space-y-6"
        >
          {/* Game Mode */}
          <div>
            <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <Zap size={16} />
              Mode de jeu
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const updates: Partial<GameOptions> = { mode: 'standard' }
                  // Apply standard mode defaults
                  if (currentOptions.mode !== 'standard') {
                    updates.pointsToWin = 20
                    updates.maxTurns = 30
                  }
                  handleUpdate(updates)
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  currentOptions.mode === 'standard'
                    ? 'bg-white text-black'
                    : 'liquid-glass-hover'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => {
                  const updates: Partial<GameOptions> = { mode: 'sprint' }
                  // Apply sprint mode defaults
                  if (currentOptions.mode !== 'sprint') {
                    updates.pointsToWin = 20
                    updates.maxTurns = 12
                  }
                  handleUpdate(updates)
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  currentOptions.mode === 'sprint'
                    ? 'bg-white text-black'
                    : 'liquid-glass-hover'
                }`}
              >
                Sprint
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              {currentOptions.mode === 'sprint' 
                ? 'Parties rapides (12 tours max, 20 points)' 
                : 'Parties classiques (30 tours max, 20 points)'}
            </p>
          </div>

          {/* Max Players */}
          <div>
            <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <Users size={16} />
              Nombre de joueurs max
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => handleUpdate({ maxPlayers: num })}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    currentOptions.maxPlayers === num
                      ? 'bg-white text-black'
                      : 'liquid-glass-hover'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Points to Win */}
          <div>
            <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <TrendingUp size={16} />
              Points pour gagner
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20, 25, 30].map((pts) => (
                <button
                  key={pts}
                  onClick={() => handleUpdate({ pointsToWin: pts })}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    currentOptions.pointsToWin === pts
                      ? 'bg-white text-black'
                      : 'liquid-glass-hover'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>

          {/* Max Turns */}
          <div>
            <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <Clock size={16} />
              Nombre de tours max
            </label>
            <div className="flex gap-2">
              {[10, 15, 20, 0].map((turns) => (
                <button
                  key={turns}
                  onClick={() => handleUpdate({ maxTurns: turns === 0 ? undefined : turns })}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    (turns === 0 ? !currentOptions.maxTurns : currentOptions.maxTurns === turns)
                      ? 'bg-white text-black'
                      : 'liquid-glass-hover'
                  }`}
                >
                  {turns === 0 ? '∞' : turns}
                </button>
              ))}
            </div>
          </div>

          {/* Starting Coins */}
          <div>
            <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
              <Coins size={16} />
              Pièces de départ
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={currentOptions.startingCoins}
              onChange={(e) => handleUpdate({ startingCoins: parseInt(e.target.value) })}
              className="w-full accent-white"
            />
            <div className="text-center text-2xl font-bold mt-2">
              {currentOptions.startingCoins} 🪙
            </div>
          </div>

          {/* Min/Max Bet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <Zap size={16} />
                Mise minimum
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={currentOptions.minBet}
                onChange={(e) => handleUpdate({ minBet: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <Sparkles size={16} />
                Mise maximum
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={currentOptions.maxBet}
                onChange={(e) => handleUpdate({ maxBet: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 outline-none"
              />
            </div>
          </div>

          {/* Special Features */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentOptions.modules?.specialCards || false}
                onChange={(e) => handleUpdate({ 
                  modules: { 
                    ...currentOptions.modules, 
                    specialCards: e.target.checked 
                  } 
                })}
                className="w-5 h-5 accent-white"
              />
              <div className="flex-1 flex items-center gap-2">
                <Sparkles size={16} />
                <span>Cartes spéciales</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentOptions.modules?.randomEvents || false}
                onChange={(e) => handleUpdate({ 
                  modules: { 
                    ...currentOptions.modules, 
                    randomEvents: e.target.checked 
                  } 
                })}
                className="w-5 h-5 accent-white"
              />
              <div className="flex-1 flex items-center gap-2">
                <Shuffle size={16} />
                <span>Événements aléatoires</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentOptions.modules?.hiddenRoles || false}
                onChange={(e) => handleUpdate({ 
                  modules: { 
                    ...currentOptions.modules, 
                    hiddenRoles: e.target.checked 
                  } 
                })}
                className="w-5 h-5 accent-white"
              />
              <div className="flex-1 flex items-center gap-2">
                <Theater size={16} />
                <span>Rôles secrets</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentOptions.modules?.chat || false}
                onChange={(e) => handleUpdate({ 
                  modules: { 
                    ...currentOptions.modules, 
                    chat: e.target.checked 
                  } 
                })}
                className="w-5 h-5 accent-white"
              />
              <div className="flex-1 flex items-center gap-2">
                <MessageSquare size={16} />
                <span>Chat en jeu</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-white/10">
              <input
                type="checkbox"
                checked={!currentOptions.isPrivate}
                onChange={(e) => handleUpdate({ 
                  isPrivate: !e.target.checked 
                })}
                className="w-5 h-5 accent-white"
              />
              <div className="flex-1 flex items-center gap-2">
                <Users size={16} />
                <span>Partie publique</span>
              </div>
            </label>
          </div>
        </motion.div>
      ) : (
        // Vue compacte
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Users size={14} />
              Joueurs
            </div>
            <div className="font-semibold">{currentOptions.maxPlayers}</div>
          </div>

          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <TrendingUp size={14} />
              Victoire
            </div>
            <div className="font-semibold">{currentOptions.pointsToWin} pts</div>
          </div>

          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Clock size={14} />
              Tours
            </div>
            <div className="font-semibold">{currentOptions.maxTurns || '∞'}</div>
          </div>

          <div className="space-y-1">
            <div className="text-white/50 text-xs flex items-center gap-1">
              <Coins size={14} />
              Pièces
            </div>
            <div className="font-semibold">{currentOptions.startingCoins}</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

