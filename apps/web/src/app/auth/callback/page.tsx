'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setUsername, setPlayerId } = useGameStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirmation de votre email en cours...')

  useEffect(() => {
    handleEmailConfirmation()
  }, [])

  const handleEmailConfirmation = async () => {
    try {
      // Récupérer la session après confirmation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session) {
        throw new Error('Aucune session trouvée')
      }

      // Récupérer le username depuis les métadonnées ou le localStorage
      const username = session.user.user_metadata?.username || 
                      localStorage.getItem('pending_username') || 
                      `User_${session.user.id.substring(0, 8)}`

      // Vérifier si l'utilisateur existe déjà dans la base
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', session.user.id)

      const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null

      // Si l'utilisateur n'existe pas, le créer
      if (!existingUser) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            username: username,
            email: session.user.email,
          })

        if (userError) {
          // Si l'erreur est que l'utilisateur existe déjà, on l'ignore
          if (userError.code !== '23505') {
            throw userError
          }
        } else {
          // Créer les profils associés seulement si l'insertion a réussi
          await supabase.from('user_profiles').insert({ id: session.user.id })
          await supabase.from('user_stats').insert({ user_id: session.user.id })
        }
      }

      // Nettoyer le localStorage
      localStorage.removeItem('pending_username')

      // Configurer l'état du jeu
      setUsername(existingUser?.username || username)
      setPlayerId(session.user.id)
      socketManager.connect(existingUser?.username || username, session.user.id)

      setStatus('success')
      setMessage('Email confirmé avec succès ! Redirection...')

      // Rediriger vers la page d'accueil après 2 secondes
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error: any) {
      console.error('Error during email confirmation:', error)
      setStatus('error')
      setMessage(error.message || 'Échec de la confirmation de l\'email')
    }
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
        <motion.div
          className="card-liquid glow-white-strong p-12 text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 mx-auto text-blue-400 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 mx-auto text-red-400" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-bold mb-4"
          >
            {status === 'loading' && 'Confirmation en cours'}
            {status === 'success' && 'Email confirmé !'}
            {status === 'error' && 'Erreur'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-white/60"
          >
            {message}
          </motion.p>

          {status === 'error' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => router.push('/login')}
              className="btn-apple mt-8"
            >
              Retour à la connexion
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </main>
  )
}
