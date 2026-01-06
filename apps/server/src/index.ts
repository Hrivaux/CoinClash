import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameManager } from './game/GameManager';
import { RoomManager } from './room/RoomManager';
import { FriendManager } from './social/FriendManager';
import { ProgressionManager } from './progression/ProgressionManager';
import { setupSocketHandlers } from './socket/handlers';
import { UserService } from './db/UserService';
import './db/supabase'; // Initialize Supabase connection

dotenv.config();

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// CORS
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// Initialize Services & Managers
const userService = new UserService();
const gameManager = new GameManager();
const roomManager = new RoomManager(gameManager);
const friendManager = new FriendManager();
const progressionManager = new ProgressionManager();

// Track connected users: userId -> socketId
const connectedUsers = new Map<string, string>();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    rooms: roomManager.getRoomCount(),
    games: gameManager.getGameCount(),
  });
});

// Socket connection
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  
  // Store auth data in socket
  const auth = socket.handshake.auth;
  socket.data.username = auth.username;
  socket.data.playerId = auth.playerId;
  
  console.log(`[WS] User: ${auth.username}, PlayerID: ${auth.playerId}`);
  
  // Track connected user
  if (auth.playerId) {
    connectedUsers.set(auth.playerId, socket.id);
    console.log(`[WS] Tracking user: ${auth.playerId} -> ${socket.id}`);
  }
  
  setupSocketHandlers(
    socket,
    io,
    roomManager,
    gameManager,
    friendManager,
    progressionManager,
    userService,
    connectedUsers
  );
  
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
    
    // Remove from connected users
    if (auth.playerId) {
      connectedUsers.delete(auth.playerId);
      console.log(`[WS] Untracking user: ${auth.playerId}`);
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🎮 COIN CLASH ONLINE - SERVER      ║
╠═══════════════════════════════════════╣
║   Port: ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║   CORS: ${CORS_ORIGIN}         ║
╚═══════════════════════════════════════╝
  `);
});

export { io, gameManager, roomManager, friendManager, progressionManager, userService };

