'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, LogOut } from 'lucide-react'

interface ConfirmLeaveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isInGame?: boolean
}

export default function ConfirmLeaveModal({ 
  isOpen,
  onClose, 
  onConfirm,
  isInGame = false 
}: ConfirmLeaveModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[201] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-liquid glow-white-strong max-w-md w-full p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <AlertTriangle size={24} className="text-orange-400" />
                </div>
                <h3 className="text-xl font-bold">Quitter le lobby ?</h3>
              </div>

              <p className="text-body mb-6">
                {isInGame ? (
                  <>
                    <strong className="text-orange-400">⚠️ Attention : Partie en cours</strong>
                    <br /><br />
                    Vous allez quitter une partie active. Si vous quittez maintenant:
                    <ul className="list-disc list-inside mt-2 ml-2 space-y-1 text-sm">
                      <li>Votre progression du tour sera perdue</li>
                      <li>Les autres joueurs seront notifiés</li>
                      <li>Vous pouvez vous reconnecter à la partie en accédant directement au lien</li>
                    </ul>
                    <br />
                    <strong>Êtes-vous vraiment sûr ?</strong>
                  </>
                ) : (
                  <>
                    Vous allez quitter le lobby. Les autres joueurs seront notifiés de votre départ.
                    <br /><br />
                    Souhaitez-vous vraiment quitter ?
                  </>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/50"
                >
                  <LogOut size={18} />
                  Quitter
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

