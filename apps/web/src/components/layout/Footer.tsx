'use client'

import { motion } from 'framer-motion'
import { 
  Shield, 
  BookOpen, 
  Trophy, 
  MessageCircle, 
  Github, 
  Twitter, 
  Heart 
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 mt-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl float-gentle">💰</div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Coin Clash</h3>
                <p className="text-xs text-white/40">Arène en ligne</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Le jeu de stratégie et de bluff ultime. Affrontez vos amis dans des parties intenses où seul le meilleur gagne.
            </p>
            <div className="flex gap-3">
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Github size={18} />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Twitter size={18} />
              </motion.a>
              <motion.a
                href="#"
                className="liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <MessageCircle size={18} />
              </motion.a>
            </div>
          </div>

          {/* Jeu */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Jeu</h4>
            <ul className="space-y-2">
              {[
                { icon: BookOpen, label: 'Règles du jeu' },
                { icon: Trophy, label: 'Classement' },
                { icon: Shield, label: 'Tournois' },
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                  >
                    <item.icon size={14} className="group-hover:scale-110 transition-transform" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Communauté */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Communauté</h4>
            <ul className="space-y-2">
              {[
                'Discord',
                'Forum',
                'Événements',
                'Devenir partenaire',
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-white/60 hover:text-white transition-colors block"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Support</h4>
            <ul className="space-y-2">
              {[
                'Centre d\'aide',
                'Contact',
                'Signaler un bug',
                'Conditions d\'utilisation',
                'Confidentialité',
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-white/60 hover:text-white transition-colors block"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-minimal mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>© {currentYear} Coin Clash.</span>
            <span>Fait avec</span>
            <Heart size={14} className="text-red-400 fill-red-400 pulse-minimal" />
            <span>par l'équipe Arena</span>
          </div>
          
          <div className="flex items-center gap-6 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="status-online"></span>
              Serveur en ligne
            </span>
            <span>v1.0.0</span>
            <span className="liquid-glass px-3 py-1 rounded-full">
              Beta
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </footer>
  )
}

