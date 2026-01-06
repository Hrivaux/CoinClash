import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@coin-clash/shared';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(username: string, playerId?: string) {
    if (this.socket?.connected) {
      console.log('[SOCKET] Already connected');
      return this.socket;
    }

    console.log('[SOCKET] Connecting to:', SERVER_URL, 'as:', username, 'ID:', playerId);

    this.socket = io(SERVER_URL, {
      auth: { username, playerId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[SOCKET] ✅ Connected! ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[SOCKET] ❌ Disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SOCKET] ❌ Connection error:', error.message);
    });

    this.socket.on('error', (message) => {
      console.error('[SOCKET] ❌ Error:', message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketManager = new SocketManager();

