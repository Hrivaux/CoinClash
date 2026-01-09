'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  LogIn,
  Sparkles,
  Zap,
  Shield,
  Users as UsersIcon,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'

export default function LoginPage() {
  const router = useRouter()
  const { setUsername, setPlayerId } = useGameStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsernameInput] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('id, username')
        .eq('email', session.user.email)
        .single()

      if (user) {
        setUsername(user.username)
        setPlayerId(user.id)
        socketManager.connect(user.username, user.id)
        router.push('/')
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existing) {
        setError("Ce nom d'utilisateur est déjà pris")
        setLoading(false)
        return
      }

      // Configuration pour l'inscription avec confirmation par email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: username,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Échec de la création du compte')

      // Si la confirmation email est requise, on affiche un message
      if (authData.user && !authData.session) {
        setSuccessMessage(
          "Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte."
        )
        // Stocker temporairement le username pour l'utiliser après confirmation
        localStorage.setItem('pending_username', username)
        setLoading(false)
        return
      }

      // Si l'email est automatiquement confirmé (développement)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username,
          email,
        })
        .select()
        .single()

      if (userError) throw userError

      await supabase.from('user_profiles').insert({ id: authData.user.id })
      await supabase.from('user_stats').insert({ user_id: authData.user.id })

      setUsername(username)
      setPlayerId(authData.user.id)
      socketManager.connect(username, authData.user.id)

      router.push('/')
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Échec de la connexion')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError

      setUsername(userData.username)
      setPlayerId(userData.id)
      socketManager.connect(userData.username, userData.id)

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Échec de la connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestMode = () => {
    const guestUsername = `Invité_${Math.random().toString(36).substr(2, 6)}`
    setUsername(guestUsername)
    setPlayerId(guestUsername)
    socketManager.connect(guestUsername, guestUsername)
    router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl fluid-orb-1" />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/15 blur-3xl fluid-orb-2" />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="text-7xl mb-4 inline-block float-gentle"
          >
            💰
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">Coin Clash</h1>
          <p className="text-subtitle">Jeu de stratégie multijoueur</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="status-online"></span>
            <span className="text-white/40 text-xs font-medium">Serveur en ligne</span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          className="card-liquid glow-white-strong"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8 p-1 liquid-glass rounded-2xl">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold text-[15px] transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LogIn size={16} />
              Connexion
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold text-[15px] transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <UserPlus size={16} />
              Inscription
            </button>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={mode === 'login' ? handleLogin : handleSignup}
              className="space-y-5"
            >
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70 flex items-center gap-2">
                    <User size={14} />
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Votre pseudo"
                    className="input-apple"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70 flex items-center gap-2">
                  <Mail size={14} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="input-apple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70 flex items-center gap-2">
                  <Lock size={14} />
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-apple"
                  required
                  minLength={6}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 liquid-glass border border-red-500/30 rounded-xl text-red-300 text-sm font-medium flex items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 liquid-glass border border-green-500/30 rounded-xl text-green-300 text-sm font-medium flex items-center gap-2"
                  >
                    <Mail size={16} />
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="btn-apple w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="spinner-apple"></span>
                    Chargement...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' ? (
                      <>
                        <LogIn size={18} />
                        Se connecter
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Créer un compte
                      </>
                    )}
                  </span>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="my-8 divider-minimal" />

          {/* Guest Mode */}
          <motion.button
            onClick={handleGuestMode}
            className="btn-apple-secondary w-full flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-lg">🎭</span>
            <span>Jouer en invité</span>
          </motion.button>

          <p className="text-xs text-center mt-4 text-white/40">
            Mode invité : aucune progression sauvegardée
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="badge-minimal flex items-center gap-1.5">
            <Sparkles size={12} />
            Cartes
          </div>
          <div className="badge-minimal flex items-center gap-1.5">
            <Zap size={12} />
            Événements
          </div>
          <div className="badge-minimal flex items-center gap-1.5">
            <Shield size={12} />
            Rôles
          </div>
          <div className="badge-minimal flex items-center gap-1.5">
            <UsersIcon size={12} />
            2-6 joueurs
          </div>
        </motion.div>
      </motion.div>
    </main>
  )
}
