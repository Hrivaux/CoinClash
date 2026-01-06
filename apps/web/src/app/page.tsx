'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  LogIn, 
  Users, 
  User,
  LogOut,
  Crown,
  Zap,
  Shield,
  Trophy,
  TrendingUp,
  Clock,
  Gamepad2,
  Star,
  Award
} from 'lucide-react'
import JoinRoomModal from '@/components/room/JoinRoomModal'
import FriendsPanel from '@/components/social/FriendsPanel'
import ProfilePanel from '@/components/profile/ProfilePanel'
import LeaderboardPanel from '@/components/leaderboard/LeaderboardPanel'
import PublicGamesList from '@/components/room/PublicGamesList'
import Footer from '@/components/layout/Footer'
import ActiveGameBlock from '@/components/game/ActiveGameBlock'
import { useGameStore } from '@/stores/useGameStore'
import { supabase } from '@/lib/supabase'
import { socketManager } from '@/lib/socket'

export default function Home() {
  const router = useRouter()
  const { username, playerId, setUsername, setPlayerId, currentGame, currentRoom } = useGameStore()
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isPrivateLobby, setIsPrivateLobby] = useState(true)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [checkingGame, setCheckingGame] = useState(true)
  const [userStats, setUserStats] = useState<{
    level: number
    xp: number
    gamesWon: number
    gamesPlayed: number
    badges: number
  } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Vérifier si une partie est en cours
    if (!loading && socketManager.isConnected()) {
      checkActiveGame()
      loadUserStats()
    }
  }, [loading, currentGame, currentRoom, playerId])

  const checkAuth = async () => {
    if (!username || !playerId) {
      router.push('/login')
      return
    }

    if (!socketManager.isConnected()) {
      socketManager.connect(username, playerId)
    }

    setLoading(false)
  }

  const checkActiveGame = () => {
    const socket = socketManager.getSocket()
    if (!socket) {
      setCheckingGame(false)
      return
    }

    // Si on a déjà une partie en cours dans le store, on l'affiche
    if (currentGame && currentGame.status === 'playing' && currentRoom) {
      setCheckingGame(false)
      return
    }

    // Sinon, on vérifie avec le serveur
    // Le serveur devrait nous renvoyer l'état de la partie si on est dans une room
    setCheckingGame(false)
  }

  const loadUserStats = () => {
    if (!playerId) return

    const socket = socketManager.getSocket()
    if (!socket) return

    socket.emit('profile:get', playerId, (profile: any) => {
      if (profile) {
        setUserStats({
          level: profile.level || 1,
          xp: profile.xp || 0,
          gamesWon: profile.globalStats?.gamesWon || 0,
          gamesPlayed: profile.globalStats?.gamesPlayed || 0,
          badges: profile.badges?.length || 0,
        })
      }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    socketManager.disconnect()
    setUsername(null)
    setPlayerId(null)
    router.push('/login')
  }

  const handleCreateLobby = () => {
    // Bloquer si une partie est en cours
    if (currentGame && currentGame.status === 'playing') {
      return
    }

    const socket = socketManager.getSocket()
    if (!socket) {
      alert('Non connecté au serveur')
      return
    }

    setCreating(true)

    // Créer un lobby simple avec paramètres par défaut complets
    const defaultOptions = {
      mode: 'standard' as const,
      startingCoins: 60,
      coinCap: 120,
      minBet: 1,
      maxBet: 12,
      pointsToWin: 20,
      maxTurns: 30,
      modules: {
        dynamicEconomy: true,
        specialCards: false, // Désactivé par défaut
        randomEvents: false, // Désactivé par défaut
        hiddenRoles: false, // Désactivé par défaut
        chat: true,
        leaderboard: true,
      },
      maxPlayers: 4,
      allowBots: true,
      isPrivate: isPrivateLobby, // Utilise le choix de l'utilisateur
    }

    socket.emit('room:create', defaultOptions, (roomCode: string) => {
      setCreating(false)
      if (roomCode) {
        // Rediriger vers le lobby
        router.push(`/room/${roomCode}`)
      } else {
        alert('Erreur lors de la création du lobby')
      }
    })
  }

  if (loading || checkingGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-7xl mb-6"
          >
            💎
          </motion.div>
          <div className="spinner-apple mx-auto mb-4"></div>
          <p className="text-body">Chargement de l'arène...</p>
        </div>
      </div>
    )
  }

  // Afficher l'écran de blocage si une partie est en cours
  if (currentGame && currentGame.status === 'playing' && currentRoom) {
    return (
      <ActiveGameBlock
        roomCode={currentRoom.code}
        onReturn={() => {
          // Ne rien faire, juste afficher le blocage
        }}
      />
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Fluid Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl fluid-orb-1" />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/15 blur-3xl fluid-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-3xl fluid-orb-3" />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 grid-pattern opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 header-frosted">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="text-4xl float-gentle">💰</div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Coin Clash</h1>
                <p className="text-xs text-white/40 font-medium">Arène multijoueur</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowProfile(true)}
                className="liquid-glass-hover px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <User size={18} />
                  <span className="absolute -top-0.5 -right-0.5 status-online"></span>
                </div>
                <span className="hidden sm:inline">{username}</span>
              </motion.button>

              <motion.button
                onClick={handleLogout}
                className="liquid-glass-hover px-3 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium flex items-center gap-2"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Quitter</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-20 flex-1">
        {/* Hero Section - Premium Design */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo/Icon with subtle animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl liquid-glass-strong mb-6 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              <span className="relative z-10 text-5xl">💰</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-balance tracking-tighter"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
          >
            <span className="bg-gradient-to-r from-white via-purple-100 via-pink-100 to-white bg-clip-text text-transparent">
              Coin Clash
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className="text-lg sm:text-xl text-white/70 mb-4 max-w-xl mx-auto font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Le jeu de bluff stratégique multijoueur
          </motion.p>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-4 mb-12 flex-wrap"
          >
            {['Bluff', 'Stratégie', 'Multijoueur'].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-xs sm:text-sm text-white/40 font-medium px-3 py-1.5 rounded-full liquid-glass"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>

          {/* User Stats Quick View */}
          {userStats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center gap-4 mb-10 flex-wrap"
            >
              <motion.div 
                className="liquid-glass px-5 py-3 rounded-2xl flex items-center gap-3"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-2 rounded-xl bg-yellow-500/20">
                  <Trophy size={18} className="text-yellow-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-white/50">Niveau</div>
                  <div className="text-base font-bold">{userStats.level}</div>
                </div>
              </motion.div>
              <motion.div 
                className="liquid-glass px-5 py-3 rounded-2xl flex items-center gap-3"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <Star size={18} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-white/50">Victoires</div>
                  <div className="text-base font-bold">{userStats.gamesWon}</div>
                </div>
              </motion.div>
              <motion.div 
                className="liquid-glass px-5 py-3 rounded-2xl flex items-center gap-3"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Award size={18} className="text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-white/50">Badges</div>
                  <div className="text-base font-bold">{userStats.badges}</div>
                </div>
              </motion.div>
            </motion.div>
          )}
          
              {/* Action Buttons */}
              <motion.div 
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                {/* Public/Private Toggle */}
                <motion.div
                  className="liquid-glass px-6 py-3 rounded-2xl flex items-center gap-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  <span className="text-sm text-white/70 font-medium">Type de lobby :</span>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setIsPrivateLobby(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        !isPrivateLobby
                          ? 'bg-white text-black'
                          : 'liquid-glass-hover text-white/60'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Users size={16} className="inline mr-2" />
                      Public
                    </motion.button>
                    <motion.button
                      onClick={() => setIsPrivateLobby(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isPrivateLobby
                          ? 'bg-white text-black'
                          : 'liquid-glass-hover text-white/60'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Shield size={16} className="inline mr-2" />
                      Privé
                    </motion.button>
                  </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <motion.button
                    onClick={handleCreateLobby}
                    disabled={creating || (currentGame && currentGame.status === 'playing')}
                    className="btn-apple w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base py-4"
                    whileHover={!creating && !(currentGame && currentGame.status === 'playing') ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!creating && !(currentGame && currentGame.status === 'playing') ? { scale: 0.98 } : {}}
                  >
                    <Gamepad2 size={20} className={creating ? 'animate-spin' : ''} />
                    {creating ? 'Création...' : 'Créer un lobby'}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowJoinRoom(true)}
                    disabled={currentGame && currentGame.status === 'playing'}
                    className="btn-apple-secondary w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base py-4"
                    whileHover={!(currentGame && currentGame.status === 'playing') ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!(currentGame && currentGame.status === 'playing') ? { scale: 0.98 } : {}}
                  >
                    <LogIn size={20} />
                    Rejoindre avec code
                  </motion.button>
                </div>
              </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="card-liquid-hover text-center group shimmer-subtle p-6"
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="relative mb-4">
              <Sparkles size={56} className="mx-auto text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              <motion.div
                className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">Cartes spéciales</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Manipulez le jeu à votre avantage avec des cartes stratégiques
            </p>
          </motion.div>

          <motion.div
            className="card-liquid-hover text-center group shimmer-subtle p-6"
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="relative mb-4">
              <Zap size={56} className="mx-auto text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
              <motion.div
                className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              />
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">Événements aléatoires</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Adaptez-vous au chaos avec des événements imprévisibles
            </p>
          </motion.div>

          <motion.div
            className="card-liquid-hover text-center group shimmer-subtle p-6"
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="relative mb-4">
              <Shield size={56} className="mx-auto text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              <motion.div
                className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              />
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">Rôles secrets</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Découvrez des pouvoirs cachés pour une stratégie unique
            </p>
          </motion.div>

          <motion.div
            className="card-liquid-hover text-center group shimmer-subtle cursor-pointer p-6"
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => setShowFriends(true)}
          >
            <div className="relative mb-4">
              <Users size={56} className="mx-auto text-green-400 group-hover:scale-110 transition-transform duration-300" />
              <motion.div
                className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              />
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">Centre social</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Invitez vos amis et jouez ensemble
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Section - Premium Layout */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          {/* Game Info */}
          <motion.div
            className="card-liquid p-8 relative overflow-hidden"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Gamepad2 size={20} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Informations de jeu</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 rounded-xl liquid-glass-hover">
                  <div className="text-3xl font-bold mb-1.5 tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    2-6
                  </div>
                  <div className="text-white/50 text-xs font-medium uppercase tracking-wider">Joueurs</div>
                </div>
                <div className="text-center p-4 rounded-xl liquid-glass-hover">
                  <div className="text-3xl font-bold mb-1.5 tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    25-40
                  </div>
                  <div className="text-white/50 text-xs font-medium uppercase tracking-wider">Tours</div>
                </div>
                <div className="text-center p-4 rounded-xl liquid-glass-hover">
                  <div className="text-3xl font-bold mb-1.5 tracking-tight bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    ∞
                  </div>
                  <div className="text-white/50 text-xs font-medium uppercase tracking-wider">Stratégies</div>
                </div>
                <div className="text-center p-4 rounded-xl liquid-glass-hover">
                  <div className="flex items-center justify-center gap-1 text-3xl font-bold mb-1.5">
                    <Crown size={24} className="text-yellow-400" />
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">1</span>
                  </div>
                  <div className="text-white/50 text-xs font-medium uppercase tracking-wider">Gagnant</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          {userStats && (
            <motion.div
              className="card-liquid p-8 relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-green-500/20">
                    <TrendingUp size={20} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold">Vos statistiques</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl liquid-glass-hover">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Trophy size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider">Niveau</div>
                        <div className="text-lg font-bold">{userStats.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50 uppercase tracking-wider">XP</div>
                      <div className="text-base font-semibold">{userStats.xp}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl liquid-glass-hover">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Star size={18} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider">Victoires</div>
                        <div className="text-lg font-bold">{userStats.gamesWon}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50 uppercase tracking-wider">Parties</div>
                      <div className="text-base font-semibold">{userStats.gamesPlayed}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl liquid-glass-hover">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Award size={18} className="text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider">Badges</div>
                        <div className="text-lg font-bold">{userStats.badges}</div>
                      </div>
                    </div>
                    {userStats.gamesPlayed > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-white/50 uppercase tracking-wider">Taux</div>
                        <div className="text-base font-semibold">
                          {Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowProfile(true)}
                    className="flex-1 btn-apple-secondary text-sm py-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Voir le profil complet
                  </motion.button>
                  <motion.button
                    onClick={() => setShowLeaderboard(true)}
                    className="flex-1 btn-apple text-sm py-3 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trophy size={16} />
                    Classement
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Public Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mb-20"
        >
          <PublicGamesList />
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {showJoinRoom && <JoinRoomModal onClose={() => setShowJoinRoom(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showFriends && <FriendsPanel onClose={() => setShowFriends(false)} />}
      </AnimatePresence>
          <AnimatePresence>
            {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
          </AnimatePresence>
          <AnimatePresence>
            {showLeaderboard && <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />}
          </AnimatePresence>
        </div>
      )
    }
