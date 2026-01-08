'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  User,
  Edit2,
  Trophy,
  Target,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  Crown,
  Zap,
  Shield,
  Coins,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Star
} from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'

interface ProfilePanelProps {
  onClose: () => void
  userId?: string // Optional: view another player's profile
}

interface UserProfile {
  id: string
  username: string
  email: string
  avatar: string | null
  level: number
  xp: number
  xpToNextLevel: number
  equippedSkin?: string
  equippedTitle?: string
  globalStats: {
    gamesPlayed: number
    gamesWon: number
    totalPoints: number
    totalCoins: number
    uniqueWins: number
    cardsPlayed: number
    winRate: number
    averageBet: number
    longestWinStreak: number
    timePlayedMinutes: number
    favoriteCard?: string
  }
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    unlockedAt: number
  }>
  createdAt: number
}

type TabType = 'overview' | 'stats' | 'badges' | 'settings'

export default function ProfilePanel({ onClose, userId: targetUserId }: ProfilePanelProps) {
  const { playerId, username } = useGameStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Use targetUserId if provided, otherwise use current playerId
  const profileUserId = targetUserId || playerId
  const isOwnProfile = !targetUserId || targetUserId === playerId

  useEffect(() => {
    if (profileUserId) {
      loadProfile()
    } else {
      setLoading(false)
      setError('Aucun utilisateur connecté')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]) // loadProfile est stable, pas besoin de le mettre dans les deps

  const loadProfile = async () => {
    console.log('[Profile] loadProfile called, profileUserId:', profileUserId)
    const socket = socketManager.getSocket()
    if (!socket || !profileUserId) {
      console.log('[Profile] No socket or profileUserId')
      setLoading(false)
      setError('Non connecté au serveur')
      return
    }

    console.log('[Profile] Starting profile load...')
    setLoading(true)
    setError(null)
    
    // Timeout pour éviter le chargement infini
    const timeout = setTimeout(() => {
      console.error('[Profile] Timeout loading profile after 5s')
      setLoading(false)
      setError('Timeout : Le chargement du profil a pris trop de temps')
    }, 5000)

    try {
      console.log('[Profile] Emitting profile:get for profileUserId:', profileUserId)
      // @ts-ignore - profile:get event not in type definitions
      socket.emit('profile:get', profileUserId, (profileData: UserProfile | null) => {
        console.log('[Profile] Callback received, profileData:', profileData ? 'exists' : 'null')
        clearTimeout(timeout)
        
        if (profileData) {
          console.log('[Profile] Setting profile data')
          setProfile(profileData)
          setEditUsername(profileData.username || '')
          setEditAvatar(profileData.avatar || '')
          setError(null)
        } else {
          console.error('[Profile] No profile data received')
          setError('Profil introuvable. Essayez de vous reconnecter.')
        }
        setLoading(false)
      })
    } catch (error) {
      clearTimeout(timeout)
      console.error('[Profile] Error loading profile:', error)
      setError('Erreur lors du chargement du profil')
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    const socket = socketManager.getSocket()
    if (!socket || !profile) return

    setSaving(true)
    const updates: any = {}
    if (editUsername !== profile.username) updates.username = editUsername
    if (editAvatar !== profile.avatar) updates.avatar = editAvatar

    // @ts-ignore - profile:update event not in type definitions
    socket.emit('profile:update', updates, (success: boolean) => {
      setSaving(false)
      if (success) {
        setSaveSuccess(true)
        setEditing(false)
        loadProfile()
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    })
  }

  const getXPPercentage = () => {
    if (!profile) return 0
    return (profile.xp / profile.xpToNextLevel) * 100
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      case 'rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'epic': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'legendary': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return Crown
      case 'epic': return Sparkles
      case 'rare': return Star
      default: return Award
    }
  }

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    if (hours < 1) return `${minutes}m`
    return `${hours}h ${minutes % 60}m`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="modal-backdrop-apple">
        <div className="card-liquid glow-white-strong max-w-4xl w-full h-[85vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin text-white/40 mx-auto mb-4" size={48} />
            <p className="text-white/60">Chargement du profil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="modal-backdrop-apple">
        <div className="card-liquid glow-white-strong max-w-4xl w-full h-[85vh] flex items-center justify-center">
          <div className="text-center p-8">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">Erreur de chargement</h3>
            <p className="text-white/60 mb-6">{error || 'Profil introuvable'}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={loadProfile}
                className="btn-apple px-6 py-2"
              >
                Réessayer
              </button>
              <button
                onClick={onClose}
                className="liquid-glass-hover px-6 py-2 rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        className="card-liquid glow-white-strong max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header with Banner */}
          <div className="relative">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 relative overflow-hidden">
              <div className="absolute inset-0 shimmer-subtle"></div>
            </div>

            {/* Avatar & Info */}
            <div className="absolute -bottom-12 left-8 flex items-end gap-4">
              <div className="liquid-glass w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-black border-4 border-[#0a0a0a] shadow-2xl relative">
                {profile.avatar || profile.username[0]}
                {profile.level >= 50 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center">
                    <Crown size={16} />
                  </div>
                )}
              </div>
              <div className="pb-4">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  {profile.username}
                  {profile.level >= 20 && <Crown size={24} className="text-yellow-400" />}
                </h2>
                <p className="text-body flex items-center gap-2">
                  {profile.equippedTitle || 'Joueur'}
                  <span>•</span>
                  <span>Membre depuis {formatDate(profile.createdAt)}</span>
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white z-10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Level Progress */}
          <div className="mt-16 px-8 mb-6">
            <div className="liquid-glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Zap size={20} className="text-purple-400" />
                  <span className="font-semibold">Niveau {profile.level}</span>
                </div>
                <span className="text-sm text-white/60">
                  {profile.xp} / {profile.xpToNextLevel} XP
                </span>
              </div>
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getXPPercentage()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
              <p className="text-xs text-white/40 mt-2">
                {Math.round(getXPPercentage())}% vers le niveau {profile.level + 1}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 mb-6">
            <div className="flex gap-2 p-1 liquid-glass rounded-2xl">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: User },
                { id: 'stats', label: 'Statistiques', icon: TrendingUp },
                { id: 'badges', label: 'Badges', icon: Award },
                ...(isOwnProfile ? [{ id: 'settings', label: 'Paramètres', icon: Edit2 }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-minimal px-8 pb-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card-liquid p-6 text-center">
                    <Trophy size={32} className="mx-auto mb-3 text-yellow-400" />
                    <div className="text-3xl font-bold mb-1">{profile.globalStats.gamesWon}</div>
                    <div className="text-xs text-white/60">Victoires</div>
                  </div>
                  <div className="card-liquid p-6 text-center">
                    <Target size={32} className="mx-auto mb-3 text-blue-400" />
                    <div className="text-3xl font-bold mb-1">{profile.globalStats.gamesPlayed}</div>
                    <div className="text-xs text-white/60">Parties jouées</div>
                  </div>
                  <div className="card-liquid p-6 text-center">
                    <Zap size={32} className="mx-auto mb-3 text-purple-400" />
                    <div className="text-3xl font-bold mb-1">{Math.round(profile.globalStats.winRate * 100)}%</div>
                    <div className="text-xs text-white/60">Taux de victoire</div>
                  </div>
                  <div className="card-liquid p-6 text-center">
                    <Clock size={32} className="mx-auto mb-3 text-green-400" />
                    <div className="text-3xl font-bold mb-1">{formatPlayTime(profile.globalStats.timePlayedMinutes)}</div>
                    <div className="text-xs text-white/60">Temps de jeu</div>
                  </div>
                </div>

                {/* Recent Badges */}
                <div className="card-liquid p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award size={20} className="text-purple-400" />
                    Badges récents
                  </h3>
                  {profile.badges.length === 0 ? (
                    <p className="text-body text-center py-8">Aucun badge débloqué</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {profile.badges.slice(0, 4).map((badge) => {
                        const RarityIcon = getRarityIcon(badge.rarity)
                        return (
                          <div
                            key={badge.id}
                            className={`card-liquid-hover p-4 text-center border ${getRarityColor(badge.rarity)}`}
                          >
                            <RarityIcon size={32} className="mx-auto mb-2" />
                            <div className="font-semibold text-sm mb-1">{badge.name}</div>
                            <div className="text-[10px] text-white/40 capitalize">{badge.rarity}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Parties jouées', value: profile.globalStats.gamesPlayed, icon: Target, color: 'text-blue-400' },
                    { label: 'Parties gagnées', value: profile.globalStats.gamesWon, icon: Trophy, color: 'text-yellow-400' },
                    { label: 'Points totaux', value: profile.globalStats.totalPoints.toLocaleString(), icon: Star, color: 'text-purple-400' },
                    { label: 'Pièces gagnées', value: profile.globalStats.totalCoins.toLocaleString(), icon: Coins, color: 'text-green-400' },
                    { label: 'Cartes jouées', value: profile.globalStats.cardsPlayed, icon: Sparkles, color: 'text-pink-400' },
                    { label: 'Victoires uniques', value: profile.globalStats.uniqueWins, icon: Crown, color: 'text-yellow-400' },
                    { label: 'Série de victoires', value: profile.globalStats.longestWinStreak, icon: Zap, color: 'text-orange-400' },
                    { label: 'Mise moyenne', value: Math.round(profile.globalStats.averageBet), icon: TrendingUp, color: 'text-cyan-400' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card-liquid p-6 flex items-center gap-4"
                    >
                      <div className={`liquid-glass w-14 h-14 rounded-xl flex items-center justify-center ${stat.color}`}>
                        <stat.icon size={24} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-white/60">{stat.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {profile.globalStats.favoriteCard && (
                  <div className="card-liquid p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles size={20} className="text-pink-400" />
                      Carte favorite
                    </h3>
                    <div className="text-center py-4">
                      <div className="text-4xl mb-2">🃏</div>
                      <div className="text-xl font-bold">{profile.globalStats.favoriteCard}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Collection de badges</h3>
                    <p className="text-sm text-white/60">{profile.badges.length} badges débloqués</p>
                  </div>
                </div>

                {profile.badges.length === 0 ? (
                  <div className="card-liquid p-12 text-center">
                    <Award size={64} className="mx-auto mb-4 text-white/20" />
                    <h4 className="text-lg font-semibold mb-2">Aucun badge</h4>
                    <p className="text-body">Jouez pour débloquer des badges !</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.badges.map((badge) => {
                      const RarityIcon = getRarityIcon(badge.rarity)
                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`card-liquid-hover p-6 text-center border-2 ${getRarityColor(badge.rarity)}`}
                        >
                          <RarityIcon size={48} className="mx-auto mb-3" />
                          <div className="font-bold mb-1">{badge.name}</div>
                          <div className="text-xs text-white/60 mb-3">{badge.description}</div>
                          <div className="text-[10px] text-white/40 capitalize">{badge.rarity}</div>
                          <div className="text-[10px] text-white/30 mt-2">
                            {formatDate(badge.unlockedAt)}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab - Only for own profile */}
            {activeTab === 'settings' && isOwnProfile && (
              <div className="space-y-6">
                <div className="card-liquid p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Edit2 size={20} className="text-purple-400" />
                      Modifier le profil
                    </h3>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="btn-apple-secondary px-4 py-2 text-sm"
                      >
                        Modifier
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white/70">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        disabled={!editing}
                        className="input-apple disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white/70">
                        Avatar (emoji)
                      </label>
                      <input
                        type="text"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        disabled={!editing}
                        placeholder="🎮"
                        maxLength={2}
                        className="input-apple disabled:opacity-50 text-center text-4xl"
                      />
                    </div>

                    {editing && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => {
                            setEditing(false)
                            setEditUsername(profile.username)
                            setEditAvatar(profile.avatar || '')
                          }}
                          className="btn-apple-secondary flex-1"
                          disabled={saving}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={saveProfile}
                          disabled={saving}
                          className="btn-apple flex-1 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Sauvegarder
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 liquid-glass border border-green-500/30 rounded-xl text-green-300 text-sm flex items-center gap-2"
                      >
                        <Check size={16} />
                        Profil mis à jour avec succès !
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                <div className="card-liquid p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-blue-400" />
                    Informations du compte
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Email</span>
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">ID Joueur</span>
                      <span className="font-mono text-xs">{profile.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Membre depuis</span>
                      <span>{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}
