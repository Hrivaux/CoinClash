'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Zap, Clock, TrendingUp, Gamepad2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { socketManager } from '@/lib/socket'
import { PublicRoomInfo } from '@coin-clash/shared'

export default function PublicGamesList() {
  const router = useRouter()
  const [publicRooms, setPublicRooms] = useState<PublicRoomInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const socket = socketManager.getSocket()
    if (!socket) {
      setLoading(false)
      return
    }

    let isMounted = true

    // Request public rooms list
    const loadPublicRooms = () => {
      if (!isMounted) return
      
      console.log('[PublicGamesList] Requesting public rooms list')
      socket.emit('rooms:public_list', (rooms: PublicRoomInfo[]) => {
        if (!isMounted) return
        console.log('[PublicGamesList] Received public rooms:', rooms?.length || 0)
        setPublicRooms(rooms || [])
        setLoading(false)
        setRefreshing(false)
      })
    }

    // Initial load with timeout
    loadPublicRooms()
    
    // Fallback: stop loading after 5 seconds if no response
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[PublicGamesList] Timeout loading public rooms')
        setLoading(false)
        setRefreshing(false)
      }
    }, 5000)

    // Listen for updates
    const handlePublicRoomsUpdate = (rooms: PublicRoomInfo[]) => {
      if (!isMounted) return
      console.log('[PublicGamesList] Public rooms updated:', rooms?.length || 0)
      setPublicRooms(rooms || [])
      setLoading(false)
      setRefreshing(false)
    }

    socket.on('rooms:public_updated', handlePublicRoomsUpdate)

    return () => {
      isMounted = false
      clearTimeout(timeout)
      socket.off('rooms:public_updated', handlePublicRoomsUpdate)
    }
  }, []) // Empty dependency array - only run once on mount

  const handleRefresh = () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    setRefreshing(true)
    socket.emit('rooms:public_list', (rooms: PublicRoomInfo[]) => {
      setPublicRooms(rooms)
      setRefreshing(false)
    })
  }

  const handleJoinRoom = (roomCode: string) => {
    router.push(`/room/${roomCode}`)
  }

  const getModuleIcons = (modules: PublicRoomInfo['modules']) => {
    const activeModules = []
    if (modules?.specialCards) activeModules.push('🃏')
    if (modules?.randomEvents) activeModules.push('🎲')
    if (modules?.hiddenRoles) activeModules.push('🎭')
    if (modules?.chat) activeModules.push('💬')
    return activeModules
  }

  if (loading) {
    return (
      <div className="card-liquid p-8 text-center">
        <div className="spinner-apple mx-auto mb-4"></div>
        <p className="text-white/60">Chargement des parties publiques...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-liquid p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Users size={24} className="text-blue-400" />
            Parties Publiques
          </h3>
          <p className="text-white/50 text-sm">
            {publicRooms.length} partie{publicRooms.length > 1 ? 's' : ''} disponible{publicRooms.length > 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          onClick={handleRefresh}
          className="liquid-glass-hover p-2 rounded-xl"
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          disabled={refreshing}
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {publicRooms.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-2">Aucune partie publique disponible</p>
          <p className="text-white/40 text-sm">Créez votre propre partie publique !</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {publicRooms.map((room, index) => (
            <motion.div
              key={room.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="liquid-glass-hover p-4 rounded-xl cursor-pointer group"
              onClick={() => handleJoinRoom(room.code)}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono text-lg font-bold tracking-wider">
                      {room.code}
                    </div>
                    <div className="text-sm text-white/60">
                      Hôte: <span className="text-white font-semibold">{room.hostUsername}</span>
                    </div>
                    {room.mode === 'sprint' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">
                        Sprint
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{room.playerCount}/{room.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      <span>{room.pointsToWin} pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{room.maxTurns || '∞'} tours</span>
                    </div>
                    {getModuleIcons(room.modules).length > 0 && (
                      <div className="flex items-center gap-1">
                        {getModuleIcons(room.modules).map((icon, i) => (
                          <span key={i} className="text-base">{icon}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <motion.button
                  className="btn-apple px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleJoinRoom(room.code)
                  }}
                >
                  <Zap size={16} />
                  Rejoindre
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

