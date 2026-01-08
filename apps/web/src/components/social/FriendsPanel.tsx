'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Search, 
  X, 
  Check,
  Send,
  MoreVertical,
  UserMinus,
  Crown,
  Gamepad2,
  Clock,
  Loader2
} from 'lucide-react'
import { socketManager } from '@/lib/socket'
import { useGameStore } from '@/stores/useGameStore'

interface FriendsPanelProps {
  onClose: () => void
}

type Tab = 'friends' | 'requests' | 'add'

interface Friend {
  id: string
  username: string
  status: 'online' | 'offline' | 'playing'
  level: number
  avatar?: string
  lastSeen?: string
}

interface FriendRequest {
  id: string
  username: string
  level: number
  avatar?: string
  requestedAt: number
}

interface SearchResult {
  id: string
  username: string
  level: number
  avatar?: string
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: number
}

export default function FriendPanel({ onClose }: FriendsPanelProps) {
  const router = useRouter()
  const { playerId, setCurrentRoom } = useGameStore()
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    loadFriends()
    loadRequests()

    const socket = socketManager.getSocket()
    if (!socket) return

    // Listen for real-time messages
    const handleMessageReceived = (data: any) => {
      if (selectedFriend && (data.from === selectedFriend.id || data.to === selectedFriend.id)) {
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: data.from,
          text: data.message,
          timestamp: data.timestamp
        }
        setMessages(prev => [...prev, newMessage])
      }
    }

    // Listen for game invitations
    const handleInvitationReceived = (data: any) => {
      if (confirm(`${data.fromUsername} vous invite à rejoindre une partie ! Accepter ?`)) {
        window.location.href = `/room/${data.roomCode}`
      }
    }

    // @ts-ignore - message:received event not in type definitions
    socket.on('message:received', handleMessageReceived)
    // @ts-ignore - game:invitation_received event not in type definitions
    socket.on('game:invitation_received', handleInvitationReceived)

    // Listen for friend updates
    // @ts-ignore - friends:request_received event not in type definitions
    socket.on('friends:request_received', () => {
      loadRequests()
    })

    // @ts-ignore - friends:request_accepted event not in type definitions
    socket.on('friends:request_accepted', () => {
      loadFriends()
      loadRequests()
    })

    // @ts-ignore - friends:removed event not in type definitions
    socket.on('friends:removed', () => {
      loadFriends()
    })

    return () => {
      // @ts-ignore - message:received event not in type definitions
      socket.off('message:received', handleMessageReceived)
      // @ts-ignore - game:invitation_received event not in type definitions
      socket.off('game:invitation_received', handleInvitationReceived)
      // @ts-ignore - friends:request_received event not in type definitions
      socket.off('friends:request_received')
      // @ts-ignore - friends:request_accepted event not in type definitions
      socket.off('friends:request_accepted')
      // @ts-ignore - friends:removed event not in type definitions
      socket.off('friends:removed')
    }
  }, [selectedFriend, messages])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadFriends = async () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    setLoading(true)
    // @ts-ignore - friends:list event not in type definitions
    socket.emit('friends:list', (friendsList: Friend[]) => {
      setFriends(friendsList)
      setLoading(false)
    })
  }

  const loadRequests = async () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    // @ts-ignore - friends:requests event not in type definitions
    socket.emit('friends:requests', (requestsList: FriendRequest[]) => {
      setRequests(requestsList)
    })
  }

  const searchUsers = async () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    setSearchLoading(true)
    // @ts-ignore - friends:search event not in type definitions
    socket.emit('friends:search', searchQuery, (results: SearchResult[]) => {
      // Filter out yourself and existing friends
      const filtered = results.filter(user => 
        user.id !== playerId && 
        !friends.some(f => f.id === user.id)
      )
      setSearchResults(filtered)
      setSearchLoading(false)
    })
  }

  const sendFriendRequest = async (userId: string) => {
    const socket = socketManager.getSocket()
    if (!socket) {
      alert('Non connecté au serveur')
      return
    }

    console.log('[Friends] Envoi demande ami à:', userId)

    // @ts-ignore - friends:request event not in type definitions
    socket.emit('friends:request', userId, (success: boolean) => {
      console.log('[Friends] Résultat demande:', success)
      if (success) {
        // Remove from search results
        setSearchResults(searchResults.filter(u => u.id !== userId))
        alert('Demande d\'ami envoyée avec succès ! ✅')
      } else {
        alert('Erreur lors de l\'envoi de la demande')
      }
    })
  }

  const acceptRequest = async (requesterId: string) => {
    const socket = socketManager.getSocket()
    if (!socket) return

    // @ts-ignore - friends:accept event not in type definitions
    socket.emit('friends:accept', requesterId, (success: boolean) => {
      if (success) {
        loadFriends()
        loadRequests()
      }
    })
  }

  const rejectRequest = async (requesterId: string) => {
    const socket = socketManager.getSocket()
    if (!socket) return

    // @ts-ignore - friends:reject event not in type definitions
    socket.emit('friends:reject', requesterId, (success: boolean) => {
      if (success) {
        setRequests(requests.filter(r => r.id !== requesterId))
      }
    })
  }

  const removeFriend = async (friendId: string) => {
    const socket = socketManager.getSocket()
    if (!socket) return

    if (!confirm('Êtes-vous sûr de vouloir retirer cet ami ?')) return

    // @ts-ignore - friends:remove event not in type definitions
    socket.emit('friends:remove', friendId, (success: boolean) => {
      if (success) {
        setFriends(friends.filter(f => f.id !== friendId))
        if (selectedFriend?.id === friendId) {
          setSelectedFriend(null)
        }
      }
    })
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedFriend) return
    
    const socket = socketManager.getSocket()
    if (!socket) {
      alert('Non connecté au serveur')
      return
    }

    const messageText = messageInput
    setMessageInput('') // Clear input immediately for better UX

    // @ts-ignore - message:send event not in type definitions
    socket.emit('message:send', selectedFriend.id, messageText, (success: boolean) => {
      if (success) {
        // Add message to local state
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: playerId || 'me',
          text: messageText,
          timestamp: Date.now()
        }
        setMessages([...messages, newMessage])
      } else {
        alert('Erreur lors de l\'envoi du message')
        setMessageInput(messageText) // Restore message on error
      }
    })
  }

  const inviteToGame = async (friendId: string) => {
    const socket = socketManager.getSocket()
    if (!socket) {
      alert('Non connecté au serveur')
      return
    }

    console.log('[INVITE] Sending invitation to:', friendId)

    // @ts-ignore - game:invite event not in type definitions
    socket.emit('game:invite', friendId, (result: { success: boolean, roomCode: string | null }) => {
      console.log('[INVITE] Result:', result)
      if (result.success && result.roomCode) {
        // Listen for room:joined event to get the room data before navigating
        const handleRoomJoined = (room: any) => {
          console.log('[INVITE] Received room data:', room)
          setCurrentRoom(room)
          socket.off('room:joined', handleRoomJoined)
          // Navigate after receiving room data
          router.push(`/room/${result.roomCode}`)
        }
        
        socket.once('room:joined', handleRoomJoined)
        
        // Fallback: navigate after a short delay if room:joined doesn't arrive
        setTimeout(() => {
          socket.off('room:joined', handleRoomJoined)
          router.push(`/room/${result.roomCode}`)
        }, 500)
      } else {
        alert('Erreur lors de l\'envoi de l\'invitation')
      }
    })
  }

  const loadMessages = async (friendId: string) => {
    const socket = socketManager.getSocket()
    if (!socket) return

    // @ts-ignore - message:get event not in type definitions
    socket.emit('message:get', friendId, (msgs: any[]) => {
      const formattedMessages: Message[] = msgs.map((msg) => ({
        id: msg.id,
        senderId: msg.from_user_id,
        text: msg.message,
        timestamp: new Date(msg.created_at).getTime()
      }))
      setMessages(formattedMessages)
    })
  }

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'bg-green-400'
      case 'playing': return 'bg-blue-400'
      case 'offline': return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'En ligne'
      case 'playing': return 'En partie'
      case 'offline': return 'Hors ligne'
    }
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
        initial={{ opacity: 0, scale: 0.95, x: 300 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 300 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="card-liquid glow-white-strong w-full max-w-4xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Centre social</h2>
                <p className="text-body text-sm">Gérez vos amis et conversations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="liquid-glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 liquid-glass rounded-2xl">
            {[
              { id: 'friends', label: 'Amis', icon: Users, count: friends.length },
              { id: 'requests', label: 'Demandes', icon: UserPlus, count: requests.length },
              { id: 'add', label: 'Ajouter', icon: Search, count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-black/10' : 'bg-white/10'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Left Panel - List */}
            <div className={`flex-1 overflow-y-auto scrollbar-minimal ${selectedFriend ? 'hidden md:block' : ''}`}>
              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-white/40" size={32} />
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto mb-4 text-white/20" />
                      <p className="text-body">Aucun ami pour le moment</p>
                      <p className="text-xs text-white/40 mt-2">Ajoutez des amis pour jouer ensemble !</p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        className="liquid-glass-hover p-4 rounded-xl cursor-pointer group"
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setSelectedFriend(friend)
                          loadMessages(friend.id)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                                {friend.avatar || friend.username[0]}
                              </div>
                              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${getStatusColor(friend.status)}`} />
                            </div>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {friend.username}
                                {friend.level && friend.level > 20 && (
                                  <Crown size={14} className="text-yellow-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-white/50">
                                <span>{getStatusLabel(friend.status)}</span>
                                {friend.level && (
                                  <>
                                    <span>•</span>
                                    <span>Niveau {friend.level}</span>
                                  </>
                                )}
                                {friend.lastSeen && (
                                  <>
                                    <span>•</span>
                                    <span>{friend.lastSeen}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {friend.status === 'online' && (
                              <button 
                                className="liquid-glass-hover p-2 rounded-lg text-white/60 hover:text-blue-400"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  inviteToGame(friend.id)
                                }}
                                title="Inviter à une partie"
                              >
                                <Gamepad2 size={16} />
                              </button>
                            )}
                            <button 
                              className="liquid-glass-hover p-2 rounded-lg text-white/60 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFriend(friend)
                                loadMessages(friend.id)
                              }}
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button 
                              className="liquid-glass-hover p-2 rounded-lg text-white/60 hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFriend(friend.id)
                              }}
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-2">
                  {requests.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus size={48} className="mx-auto mb-4 text-white/20" />
                      <p className="text-body">Aucune demande d'ami</p>
                    </div>
                  ) : (
                    requests.map((request) => (
                      <div key={request.id} className="liquid-glass p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                              {request.avatar || request.username[0]}
                            </div>
                            <div>
                              <div className="font-semibold">{request.username}</div>
                              <div className="text-xs text-white/50">
                                Niveau {request.level}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => rejectRequest(request.id)}
                              className="btn-apple-secondary px-4 py-2 text-sm flex items-center gap-2"
                            >
                              <X size={14} />
                              Refuser
                            </button>
                            <button 
                              onClick={() => acceptRequest(request.id)}
                              className="btn-apple px-4 py-2 text-sm flex items-center gap-2"
                            >
                              <Check size={14} />
                              Accepter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Add Friends Tab */}
              {activeTab === 'add' && (
                <div>
                  <div className="mb-4">
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un joueur..."
                        className="input-apple pl-12"
                      />
                    </div>
                  </div>

                  {searchLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-white/40" size={32} />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div key={user.id} className="liquid-glass p-4 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                              {user.avatar || user.username[0]}
                            </div>
                            <div>
                              <div className="font-semibold">{user.username}</div>
                              <div className="text-xs text-white/50">Niveau {user.level}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            className="btn-apple px-4 py-2 text-sm flex items-center gap-2"
                          >
                            <UserPlus size={14} />
                            Ajouter
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-12">
                      <Search size={48} className="mx-auto mb-4 text-white/20" />
                      <p className="text-body">Aucun résultat</p>
                    </div>
                  ) : (
                    <div className="liquid-glass p-6 rounded-2xl text-center">
                      <UserPlus size={48} className="mx-auto mb-4 text-white/30" />
                      <h3 className="font-semibold mb-2">Ajouter des amis</h3>
                      <p className="text-body text-sm mb-4">
                        Recherchez des joueurs par leur nom d'utilisateur pour les ajouter à votre liste d'amis.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Chat */}
            {selectedFriend && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex-1 liquid-glass rounded-2xl flex flex-col ${activeTab === 'friends' ? '' : 'hidden'}`}
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedFriend(null)}
                      className="md:hidden liquid-glass-hover p-2 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                    <div className="relative">
                      <div className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {selectedFriend.avatar || selectedFriend.username[0]}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${getStatusColor(selectedFriend.status)}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{selectedFriend.username}</div>
                      <div className="text-xs text-white/50">{getStatusLabel(selectedFriend.status)}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => inviteToGame(selectedFriend.id)}
                    className="liquid-glass-hover p-2 rounded-lg group/btn"
                    title="Inviter à une partie"
                  >
                    <Gamepad2 size={18} className="group-hover/btn:text-blue-400 transition-colors" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-minimal p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle size={48} className="mx-auto mb-4 text-white/20" />
                      <p className="text-body text-sm">Aucun message</p>
                      <p className="text-xs text-white/40 mt-1">Envoyez un message pour commencer la conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === playerId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.senderId === playerId
                              ? 'bg-white text-black'
                              : 'liquid-glass'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-[10px] opacity-50 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Écrivez un message..."
                      className="flex-1 input-apple"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="btn-apple px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}
