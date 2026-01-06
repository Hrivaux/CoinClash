import { create } from 'zustand';
import { GameState, Room, PlayerId } from '@coin-clash/shared';

interface GameStore {
  // Connection
  isConnected: boolean;
  username: string | null;
  playerId: PlayerId | null;
  
  // Room
  currentRoom: Room | null;
  
  // Game
  currentGame: GameState | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setUsername: (username: string) => void;
  setPlayerId: (playerId: PlayerId) => void;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentGame: (game: GameState | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  isConnected: false,
  username: null,
  playerId: null,
  currentRoom: null,
  currentGame: null,
  isLoading: false,
  error: null,
  
  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setUsername: (username) => {
    set({ username });
    if (typeof window !== 'undefined') {
      if (username) {
        localStorage.setItem('username', username);
      } else {
        localStorage.removeItem('username');
      }
    }
  },
  setPlayerId: (playerId) => {
    set({ playerId });
    if (typeof window !== 'undefined') {
      if (playerId) {
        localStorage.setItem('playerId', playerId);
      } else {
        localStorage.removeItem('playerId');
      }
    }
  },
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentGame: (game) => set({ currentGame: game }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    currentRoom: null,
    currentGame: null,
    isLoading: false,
    error: null,
  }),
}));

