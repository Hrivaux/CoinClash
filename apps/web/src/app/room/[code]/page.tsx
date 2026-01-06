'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  Check,
  Users,
  UserPlus,
  Bot,
  Play,
  ArrowLeft,
  Share2,
} from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'
import GameTable from '@/components/game/GameTable'
import BettingSlider from '@/components/game/BettingSlider'
import CardPanel from '@/components/game/CardPanel'
import GameNotifications from '@/components/game/GameNotifications'
import SpyReveal from '@/components/game/SpyReveal'
import GameEndScreen from '@/components/game/GameEndScreen'
import GameMenu from '@/components/game/GameMenu'
import GameChat from '@/components/game/GameChat'
import LobbyConfig from '@/components/room/LobbyConfig'
import InviteFriendsButton from '@/components/room/InviteFriendsButton'
import FriendsPanel from '@/components/social/FriendsPanel'
import ConfirmLeaveModal from '@/components/room/ConfirmLeaveModal'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string
  
  const { currentRoom, currentGame, playerId, setCurrentRoom, setCurrentGame } = useGameStore()
  const [username, setUsername] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [gameEndData, setGameEndData] = useState<{ game: any; rankings: any[] } | null>(null)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected')

  // Track if we've already joined to avoid rejoining on every render
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false)

  useEffect(() => {
    const socket = socketManager.getSocket()
    
    if (!socket) {
      router.push('/')
      return
    }

    // Auto-join room on mount only
    if (!hasAttemptedJoin && socket.connected) {
      console.log('[Room] Auto-joining room:', roomCode)
      setHasAttemptedJoin(true)
      socket.emit('room:join', roomCode, (success) => {
        if (success) {
          setIsJoined(true)
          setConnectionStatus('connected')
          console.log('[Room] Successfully joined room, waiting for game state...')
        } else {
          console.error('[Room] Failed to join room')
          router.push('/')
        }
      })
    } else if (!hasAttemptedJoin && !socket.connected) {
      console.log('[Room] Socket not connected, waiting...')
      const handleConnect = () => {
        console.log('[Room] Socket connected, joining room...')
        setHasAttemptedJoin(true)
        socket.emit('room:join', roomCode, (success) => {
          if (success) {
            setIsJoined(true)
            setConnectionStatus('connected')
          } else {
            router.push('/')
          }
        })
        socket.off('connect', handleConnect)
      }
      socket.on('connect', handleConnect)
    }

    // Connection status listeners
    socket.on('disconnect', () => {
      console.log('[Room] Socket disconnected')
      setConnectionStatus('disconnected')
    })

    // Listen for room updates
    socket.on('room:updated', (room) => {
      setCurrentRoom(room)
    })

    socket.on('room:joined', (room) => {
      console.log('[Room] Successfully joined room:', room.code)
      setCurrentRoom(room)
      setIsJoined(true)
      setConnectionStatus('connected')
    })

    socket.on('room:player_joined', (player) => {
      console.log('[Room] Player joined:', player.username)
    })

    socket.on('room:player_left', (data) => {
      console.log('[Room] Player left:', data)
    })

    socket.on('game:started', (game) => {
      setCurrentGame(game)
    })

    socket.on('game:state', (game) => {
      console.log('[Room] Game state updated, status:', game.status)
      setCurrentGame(game)
      // Save room code and game status to localStorage for reconnection
      if (game.status === 'playing') {
        localStorage.setItem('lastRoomCode', roomCode)
        localStorage.setItem('lastGameStatus', 'playing')
      }
    })

    socket.on('game:ended', (game, rankings) => {
      console.log('[Game] Game ended!', game, rankings)
      setCurrentGame(game)
      setGameEndData({ game, rankings })
      // Clean up localStorage - game is finished
      localStorage.removeItem('lastRoomCode')
      localStorage.removeItem('lastGameStatus')
    })

    return () => {
      socket.off('disconnect')
      socket.off('room:updated')
      socket.off('room:joined')
      socket.off('room:player_joined')
      socket.off('room:player_left')
      socket.off('game:started')
      socket.off('game:state')
      socket.off('game:ended')
    }
  }, [roomCode, router, setCurrentRoom, setCurrentGame, hasAttemptedJoin])

  const handleReady = () => {
    const socket = socketManager.getSocket()
    if (!socket) return
    
    const currentPlayer = currentRoom?.players.find(p => p.id === playerId)
    socket.emit('room:ready', !currentPlayer?.isReady)
  }

  const handleStart = () => {
    const socket = socketManager.getSocket()
    if (!socket) return
    
    socket.emit('room:start')
  }

  const handlePlaceBet = (amount: number) => {
    const socket = socketManager.getSocket()
    if (!socket) return
    
    socket.emit('game:place_bet', amount)
  }

  const handlePlayCard = (cardId: string, targetId?: string) => {
    const socket = socketManager.getSocket()
    if (!socket) return
    
    socket.emit('game:play_card', cardId, targetId)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddBot = () => {
    const socket = socketManager.getSocket()
    if (!socket) return
    
    socket.emit('room:add_bot', 'analyst') // Valid difficulties: 'rookie', 'analyst', 'trickster', 'shark'
  }

  const handleUpdateOptions = (updates: any) => {
    const socket = socketManager.getSocket()
    if (!socket) return
    
    // Émettre la mise à jour des options
    socket.emit('room:update_options', updates)
  }

  const handleLeave = () => {
    setShowConfirmLeave(true)
  }

  const confirmLeave = () => {
    const socket = socketManager.getSocket()
    if (socket) {
      socket.emit('room:leave')
    }
    // Clear saved room when explicitly leaving
    localStorage.removeItem('lastRoomCode')
    localStorage.removeItem('lastGameStatus')
    setIsJoined(false)
    router.push('/')
  }

  // If game is active, show game table
  if (currentGame && playerId) {
    const socket = socketManager.getSocket()
    const currentSocketId = socket?.id
    const currentPlayer = currentGame.players.find(p => p.id === currentSocketId)
    
    console.log('[Game] Looking for player with socket.id:', currentSocketId)
    console.log('[Game] Found player:', currentPlayer?.username)
    console.log('[Game] Current phase:', currentGame.phase)
    console.log('[Game] Player bet:', currentPlayer?.currentBet)
    
    return (
      <div className="relative">
        {/* Game End Screen */}
        {gameEndData && (
          <GameEndScreen
            game={gameEndData.game}
            rankings={gameEndData.rankings}
            onClose={() => setGameEndData(null)}
          />
        )}
        
        <GameNotifications />
        <SpyReveal />
        <GameMenu
          currentPlayerId={currentSocketId || playerId}
          players={currentGame.players.map(p => ({
            id: p.id,
            username: p.username,
            avatar: p.avatar
          }))}
          onLeave={handleLeave}
        />
        <GameChat
          roomCode={roomCode}
          enabled={currentGame.options.modules?.chat === true}
        />
        <GameTable game={currentGame} currentPlayerId={currentSocketId || playerId} />
        
        {/* Betting UI (overlay) */}
        {currentPlayer && currentGame.phase === 'betting' && currentPlayer.currentBet === null && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <BettingSlider
              min={currentGame.options.minBet}
              max={currentGame.options.maxBet}
              currentCoins={currentPlayer.coins}
              onPlaceBet={handlePlaceBet}
            />
          </div>
        )}

        {/* Card Panel (right side) */}
        {currentPlayer && 
         currentGame.options.modules?.specialCards === true && (
          <CardPanel
            cards={currentPlayer.hand}
            onPlayCard={handlePlayCard}
            canPlayCards={
              currentGame.phase === 'planning' || // Permet de jouer les cartes "before_bet" avant de miser
              currentGame.phase === 'instant_cards' // Permet de jouer les cartes "instant" après avoir misé
            }
            otherPlayers={currentGame.players
              .filter(p => p.id !== currentSocketId && !p.isInBreak)
              .map(p => ({ id: p.id, username: p.username }))}
          />
        )}
      </div>
    )
  }

  // Pour vérifier si on est l'hôte, on compare avec notre socket.id (qui est notre player.id dans le jeu)
  const socket = socketManager.getSocket()
  const currentSocketId = socket?.id
  const currentPlayer = currentRoom?.players.find(p => p.id === currentSocketId)
  const isHost = currentRoom?.hostId === currentSocketId
  
  console.log('[Lobby] isHost:', isHost, 'hostId:', currentRoom?.hostId, 'socketId:', currentSocketId, 'playerId:', playerId)

  // Otherwise show room lobby
  return (
    <main style={{
      background: 'var(--room-bg, linear-gradient(to bottom right, rgb(10, 10, 10) 0%, rgb(17, 17, 17) 50%, rgb(10, 10, 10) 100%))'
    }} className="min-h-screen relative overflow-hidden">
      {/* Connection Status Banner */}
      {connectionStatus !== 'connected' && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500/20 border-b border-orange-500/50 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent" />
            <span className="text-sm font-medium text-orange-300">
              {connectionStatus === 'disconnected' 
                ? 'Déconnecté - Reconnexion en cours...' 
                : 'Reconnexion au lobby...'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Confirm Leave Modal */}
      <ConfirmLeaveModal
        isOpen={showConfirmLeave}
        onClose={() => setShowConfirmLeave(false)}
        onConfirm={confirmLeave}
        isInGame={!!currentGame}
      />
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)]" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Header with Code */}
          <div className="card-liquid p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLeave}
                  className="liquid-glass-hover p-3 rounded-xl"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">Lobby</h1>
                  <p className="text-white/50 text-sm">
                    {isHost ? 'Vous êtes l\'hôte' : 'En attente de l\'hôte'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="liquid-glass px-4 py-3 rounded-xl">
                  <div className="text-xs text-white/50 mb-1">Code de la salle</div>
                  <div className="text-2xl font-bold tracking-wider">{roomCode}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="liquid-glass-hover p-3 rounded-xl"
                  title="Copier le code"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
                <button
                  onClick={() => setShowFriends(true)}
                  className="btn-apple flex items-center gap-2"
                >
                  <Share2 size={18} />
                  Inviter des amis
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Players List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Players */}
              {currentRoom && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card-liquid p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} />
                      Joueurs ({currentRoom.players.length}/{currentRoom.options.maxPlayers})
                    </h2>
                    <div className="flex items-center gap-2">
                      {isHost && (
                        <InviteFriendsButton 
                          roomCode={roomCode} 
                          isHost={isHost} 
                        />
                      )}
                      {isHost && currentRoom.players.length < currentRoom.options.maxPlayers && (
                        <button
                          onClick={handleAddBot}
                          className="liquid-glass-hover px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <Bot size={16} />
                          Ajouter un bot
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentRoom.players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="liquid-glass p-4 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                            {player.isBot ? '🤖' : player.username[0]}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {player.username}
                              {player.id === currentRoom.hostId && (
                                <span className="text-yellow-400">👑</span>
                              )}
                            </div>
                            {player.isBot && (
                              <div className="text-xs text-white/50 capitalize">
                                {player.botDifficulty}
                              </div>
                            )}
                          </div>
                        </div>
                        {player.isReady && (
                          <div className="text-green-400">
                            <Check size={24} />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: currentRoom.options.maxPlayers - currentRoom.players.length }).map((_, i) => (
                      <motion.div
                        key={`empty-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: (currentRoom.players.length + i) * 0.05 }}
                        className="liquid-glass p-4 rounded-xl flex items-center justify-center border-2 border-dashed border-white/10"
                      >
                        <div className="flex items-center gap-2 text-white/30">
                          <UserPlus size={20} />
                          <span className="text-sm">En attente...</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Configuration */}
              {currentRoom && (
                <LobbyConfig
                  currentOptions={currentRoom.options}
                  onUpdate={handleUpdateOptions}
                  isHost={isHost}
                />
              )}
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="card-liquid p-6 space-y-4"
              >
                <h3 className="font-semibold mb-4">Actions</h3>

                {!isHost && (
                  <button
                    onClick={handleReady}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      currentRoom?.players.find(p => p.id === playerId)?.isReady
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {currentRoom?.players.find(p => p.id === playerId)?.isReady
                      ? '✅ Prêt'
                      : 'Se mettre prêt'}
                  </button>
                )}

                {isHost && currentRoom && (
                  <button
                    onClick={handleStart}
                    disabled={currentRoom.players.length < 2}
                    className="w-full btn-apple flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={18} />
                    Lancer la partie
                  </button>
                )}

                <button
                  onClick={handleLeave}
                  className="w-full liquid-glass-hover py-3 rounded-xl"
                >
                  Quitter le lobby
                </button>
              </motion.div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="liquid-glass p-6 space-y-3 text-sm"
              >
                <h4 className="font-semibold text-white/70">💡 Astuce</h4>
                <p className="text-white/50">
                  {isHost
                    ? 'En tant qu\'hôte, vous pouvez configurer la partie, ajouter des bots et inviter des amis.'
                    : 'Partagez le code de la salle avec vos amis pour qu\'ils vous rejoignent !'}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Friends Panel Modal */}
      <AnimatePresence>
        {showFriends && (
          <FriendsPanel onClose={() => setShowFriends(false)} />
        )}
      </AnimatePresence>
    </main>
  )
}

