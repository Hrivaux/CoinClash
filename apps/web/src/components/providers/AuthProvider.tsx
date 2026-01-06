'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/useGameStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUsername, setPlayerId } = useGameStore()

  useEffect(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedUsername = localStorage.getItem('username')
      const savedPlayerId = localStorage.getItem('playerId')
      
      if (savedUsername) setUsername(savedUsername)
      if (savedPlayerId) setPlayerId(savedPlayerId)
    }
  }, [setUsername, setPlayerId])

  return <>{children}</>
}

