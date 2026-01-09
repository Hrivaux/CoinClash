'use client'

import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Users, 
  Coins, 
  Trophy, 
  Zap, 
  Shield, 
  Eye,
  Shuffle,
  Target,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function ReglesPage() {
  const cards = [
    { icon: Eye, name: 'Espion', desc: 'Révèle la mise prévue d\'un adversaire', rarity: 'Commun', timing: 'Avant paris' },
    { icon: Target, name: 'Scan', desc: 'Révèle le nombre de cartes d\'un adversaire', rarity: 'Commun', timing: 'Avant paris' },
    { icon: Zap, name: 'Double', desc: 'Ta mise est doublée pour le calcul du gagnant', rarity: 'Rare', timing: 'Instant' },
    { icon: Shield, name: 'Bouclier', desc: 'Tu ne perds pas tes pièces si tu perds', rarity: 'Rare', timing: 'Instant' },
    { icon: Shuffle, name: 'Swap', desc: 'Échange ta main avec un adversaire', rarity: 'Épique', timing: 'Avant paris' },
    { icon: AlertCircle, name: 'Silence', desc: 'Bloque le chat d\'un joueur pour 1 tour', rarity: 'Rare', timing: 'Avant paris' },
  ]

  const roles = [
    { name: 'Banquier', desc: '+1 point à chaque fin de tour si tu as ≥70 pièces', reward: '+1 pt' },
    { name: 'Saboteur', desc: '+2 points la première fois qu\'un joueur tombe à 0', reward: '+2 pts' },
    { name: 'Renard', desc: '+6 points en fin de partie si personne ne t\'a accusé', reward: '+6 pts' },
    { name: 'Guerrier', desc: '+1 point chaque fois que tu gagnes 2 tours d\'affilée', reward: '+1 pt' },
  ]

  return (
    <main className="min-h-screen p-6 sm:p-8 relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl fluid-orb-1" />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/15 blur-3xl fluid-orb-2" />
      </div>

      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <BookOpen className="w-12 h-12 text-blue-400" />
            <h1 className="text-5xl font-bold">Règles du Jeu</h1>
          </div>
          <p className="text-xl text-white/60">Maîtrise l'art de la stratégie et du bluff</p>
          <Link href="/" className="inline-block mt-6 text-sm text-blue-400 hover:text-blue-300">
            ← Retour à l'accueil
          </Link>
        </motion.div>

        {/* Objectif */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-liquid mb-8"
        >
          <div className="flex items-start gap-4">
            <Trophy className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-3">🎯 Objectif</h2>
              <p className="text-white/70 leading-relaxed">
                Sois le premier à atteindre <span className="text-yellow-400 font-bold">50 points</span> en mode Standard 
                ou <span className="text-yellow-400 font-bold">20 points</span> en mode Sprint. 
                Mise intelligemment, bluff tes adversaires et utilise tes cartes au bon moment !
              </p>
            </div>
          </div>
        </motion.section>

        {/* Déroulement d'un tour */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-liquid mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shuffle className="w-7 h-7 text-purple-400" />
            Déroulement d'un Tour
          </h2>
          <div className="space-y-4">
            {[
              { num: '1', title: 'Événement', desc: 'Une carte événement est révélée et modifie les règles du tour' },
              { num: '2', title: 'Planification', desc: 'Consulte tes cartes, discute dans le chat, espionne si tu as les cartes' },
              { num: '3', title: 'Mise secrète', desc: 'Chaque joueur choisit de miser entre 1 et 12 pièces en secret' },
              { num: '4', title: 'Cartes instant', desc: 'Fenêtre de 5 secondes pour jouer Double, Bouclier, etc.' },
              { num: '5', title: 'Révélation', desc: 'Toutes les mises sont révélées simultanément avec animation' },
              { num: '6', title: 'Résolution', desc: 'Le gagnant est calculé et reçoit +2 points et +8 pièces' },
              { num: '7', title: 'Fin de tour', desc: 'Préparation du tour suivant, nouvelles cartes distribuées' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-4 liquid-glass p-4 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Règle du gagnant */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-liquid mb-8 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Règle Cœur : Qui Gagne ?
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <p className="text-white/80">
                <span className="font-bold text-green-400">Le gagnant</span> est celui qui a la 
                <span className="font-bold text-yellow-400"> mise UNIQUE la plus élevée</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <p className="text-white/80">
                Il reçoit <span className="font-bold text-yellow-400">+2 points</span> et 
                <span className="font-bold text-blue-400"> +8 pièces</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚖️</span>
              <p className="text-white/80">
                <span className="font-bold text-red-400">Pas de gagnant ?</span> Tout le monde perd sa mise 
                et reçoit +1 pièce de compensation
              </p>
            </div>
          </div>
        </motion.section>

        {/* Cartes spéciales */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-liquid mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-7 h-7 text-purple-400" />
            Cartes Spéciales
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="liquid-glass p-4 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-white">{card.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                        {card.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">{card.desc}</p>
                    <span className="text-xs text-blue-400">{card.timing}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Rôles secrets */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card-liquid mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users className="w-7 h-7 text-pink-400" />
            Rôles Secrets
          </h2>
          <p className="text-white/60 mb-6">
            Chaque joueur reçoit un rôle secret en début de partie. Accomplis ta mission pour gagner des points bonus !
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.05 }}
                className="liquid-glass p-4 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{role.name}</h3>
                  <span className="text-sm font-bold text-yellow-400">{role.reward}</span>
                </div>
                <p className="text-sm text-white/60">{role.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Conseils */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card-liquid mb-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-blue-400" />
            Conseils Stratégiques
          </h2>
          <ul className="space-y-3">
            {[
              '💡 Varie tes mises pour être imprévisible',
              '🎭 Bluff ! Mise gros même avec peu de pièces',
              '👀 Observe les patterns de tes adversaires',
              '⏰ Utilise les cartes Instant au dernier moment',
              '🎯 Protège ton rôle secret jusqu\'à la fin',
              '🤝 En mode équipe, coordonne-toi avec tes alliés',
            ].map((tip, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.05 }}
                className="text-white/70 pl-2"
              >
                {tip}
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <Link href="/" className="btn-apple inline-flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Jouer maintenant
          </Link>
          <p className="text-sm text-white/40 mt-4">
            Prêt à devenir le maître du bluff ?
          </p>
        </motion.div>
      </div>
    </main>
  )
}
