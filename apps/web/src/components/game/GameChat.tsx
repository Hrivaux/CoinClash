'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'

interface ChatMessage {
  id: string
  playerId: string
  username: string
  message: string
  timestamp: number
}

interface GameChatProps {
  roomCode: string
  enabled: boolean
}

export default function GameChat({ roomCode, enabled }: GameChatProps) {
  const { playerId } = useGameStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!enabled) return

    const socket = socketManager.getSocket()
    if (!socket) return

    const handleChatMessage = (data: {
      playerId: string
      username: string
      message: string
      timestamp: number
    }) => {
      const newMessage: ChatMessage = {
        id: `${data.playerId}-${data.timestamp}`,
        playerId: data.playerId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp,
      }
      setMessages((prev) => [...prev, newMessage])
    }

    socket.on('game:chat_message', handleChatMessage)

    return () => {
      socket.off('game:chat_message', handleChatMessage)
    }
  }, [enabled, roomCode])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isMinimized])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !enabled) return

    const socket = socketManager.getSocket()
    if (!socket) return

    socket.emit('game:chat_send', roomCode, messageInput.trim())
    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!enabled) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed right-4 ${
            isMinimized ? 'top-20' : 'top-20'
          } z-[60] w-full max-w-sm`}
        >
          <div className="card-liquid-strong rounded-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-white/70" />
                <span className="font-semibold text-sm">Chat</span>
                {messages.length > 0 && (
                  <span className="text-xs text-white/50">
                    ({messages.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="liquid-glass-hover p-1.5 rounded-lg"
                  title={isMinimized ? 'Agrandir' : 'Réduire'}
                >
                  {isMinimized ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="liquid-glass-hover p-1.5 rounded-lg"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto max-h-64 p-3 space-y-2 bg-black/20">
                  {messages.length === 0 ? (
                    <div className="text-center text-white/40 text-sm py-8">
                      Aucun message. Soyez le premier à écrire !
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwnMessage = msg.playerId === playerId
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${
                            isOwnMessage ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-2 ${
                              isOwnMessage
                                ? 'bg-blue-500/30 text-white'
                                : 'bg-white/10 text-white/90'
                            }`}
                          >
                            {!isOwnMessage && (
                              <div className="text-xs font-semibold mb-1 text-white/70">
                                {msg.username}
                              </div>
                            )}
                            <div className="text-sm break-words">
                              {msg.message}
                            </div>
                            <div className="text-[10px] text-white/40 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/10 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez un message..."
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    maxLength={200}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="liquid-glass-hover p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Envoyer (Entrée)"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Toggle Button (when closed) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-20 z-[60] liquid-glass-strong p-3 rounded-full shadow-lg"
          title="Ouvrir le chat"
        >
          <MessageSquare size={20} />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  )
}

