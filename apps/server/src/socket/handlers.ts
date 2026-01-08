import { Socket, Server } from 'socket.io';
import {
  Player,
  GameOptions,
  BotDifficulty,
  ClientToServerEvents,
  ServerToClientEvents,
  SPRINT_MODE_OPTIONS,
} from '@coin-clash/shared';
import { GameManager } from '../game/GameManager';
import { RoomManager } from '../room/RoomManager';
import { FriendManager } from '../social/FriendManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UserService } from '../db/UserService';
import { GameRules, EconomyManager } from '@coin-clash/shared';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

/**
 * Setup Socket.io event handlers
 */
export function setupSocketHandlers(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  gameManager: GameManager,
  friendManager: FriendManager,
  progressionManager: ProgressionManager,
  userService: UserService,
  connectedUsers: Map<string, string>
) {
  // ==========================================
  // ROOM HANDLERS
  // ==========================================
  
  /**
   * Create a room
   */
  socket.on('room:create', (options, callback) => {
    try {
      // Apply sprint mode options if mode is 'sprint'
      if (options.mode === 'sprint') {
        options = { ...options, ...SPRINT_MODE_OPTIONS };
        console.log('[SOCKET] Applied sprint mode options:', options);
      }
      
      // Create player from socket
      const player: Player = {
        id: socket.id,
        username: (socket.data.username as string) || `Player_${socket.id.slice(0, 4)}`,
        isBot: false,
        coins: 0,
        points: 0,
        currentBet: null,
        hand: [],
        stats: {
          wins: 0,
          uniqueWins: 0,
          totalBets: 0,
          averageBet: 0,
          cardsPlayed: 0,
          turnsInBreak: 0,
        },
        isReady: false,
        isConnected: true,
        isInBreak: false,
      };
      
      const roomCode = roomManager.createRoom(player, options);
      roomManager.linkSocket(socket.id, player.id);
      
      // Join socket room
      socket.join(roomCode);
      
      callback(roomCode);
      
      // Broadcast room update
      const room = roomManager.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:updated', room);
        // Update public rooms list if room is public
        if (!room.options.isPrivate) {
          setTimeout(() => {
            const publicRooms = roomManager.getPublicRooms();
            const formattedRooms = publicRooms.map((r) => ({
              code: r.code,
              hostUsername: r.players.find((p) => p.id === r.hostId)?.username || 'Hôte',
              playerCount: r.players.length,
              maxPlayers: r.options.maxPlayers,
              mode: r.options.mode,
              pointsToWin: r.options.pointsToWin,
              maxTurns: r.options.maxTurns,
              modules: r.options.modules,
              createdAt: r.createdAt,
            }));
            io.emit('rooms:public_updated', formattedRooms);
          }, 100);
        }
      }
    } catch (error) {
      console.error('[SOCKET] Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });
  
  /**
   * Join a room
   */
  socket.on('room:join', (roomCode, callback) => {
    try {
      // Check if player was already in this room (reconnection)
      // First, try to find by socket.id (if same socket reconnects)
      const existingRoom = roomManager.getRoomBySocket(socket.id);
      if (existingRoom && existingRoom.code === roomCode) {
        // Reconnection: just update connection status
        const player = existingRoom.players.find(p => p.id === socket.id);
        if (player) {
          player.isConnected = true;
          roomManager.linkSocket(socket.id, player.id);
          socket.join(roomCode);
          
          console.log(`[SOCKET] Player ${player.username} reconnected to room ${roomCode}`);
          
          // Check if game is active and send game state
          const activeGame = gameManager.getGameByRoomCode(roomCode);
          if (activeGame) {
            console.log(`[SOCKET] Game is active, sending game state to reconnected player`);
            socket.emit('game:state', activeGame);
            socket.emit('game:started', activeGame);
          }
          
          // Notify others of reconnection
          socket.to(roomCode).emit('room:player_reconnected', player);
          
          // Send room state
          socket.emit('room:joined', existingRoom);
          io.to(roomCode).emit('room:updated', existingRoom);
          
          callback(true);
          return;
        }
      }
      
      // Check if room exists - try to reconnect player by username or Supabase ID
      const room = roomManager.getRoom(roomCode);
      if (room) {
        const username = socket.data.username as string;
        const supabaseId = socket.data.playerId as string;
        
        // Try to find player by username (in case socket.id changed after page refresh)
        // Remove the !p.isConnected check - we want to reconnect even if marked as connected
        // because the socket.id might have changed
        let existingPlayer = room.players.find(p => 
          !p.isBot && 
          p.username === username &&
          p.id !== socket.id // Make sure it's not the same socket
        );
        
        // If not found by username, try to find by Supabase ID if we have it
        if (!existingPlayer && supabaseId) {
          // We can't directly match by Supabase ID in the room, but we can check
          // if there's a player with the same username that might be the same user
          existingPlayer = room.players.find(p => 
            !p.isBot && 
            p.username === username
          );
        }
        
        if (existingPlayer) {
          // Player was in room - reconnect them with new socket.id
          console.log(`[SOCKET] Reconnecting player ${username} to room ${roomCode} (socket changed from ${existingPlayer.id} to ${socket.id})`);
          
          // Update player's socket.id
          const oldSocketId = existingPlayer.id;
          existingPlayer.id = socket.id;
          existingPlayer.isConnected = true;
          
          // Update hostId if this player was the host
          if (room.hostId === oldSocketId) {
            room.hostId = socket.id;
            console.log(`[SOCKET] Updated hostId from ${oldSocketId} to ${socket.id}`);
          }
          
          // Update socket mappings
          roomManager.unlinkSocket(oldSocketId);
          roomManager.linkSocket(socket.id, socket.id); // In room context, player.id = socket.id
          roomManager.playerToRoom.delete(oldSocketId);
          roomManager.playerToRoom.set(socket.id, roomCode);
          
          socket.join(roomCode);
          
          // Check if game is active and send game state
          const activeGame = gameManager.getGameByRoomCode(roomCode);
          if (activeGame) {
            console.log(`[SOCKET] Game is active, sending game state to reconnected player`);
            // Update player ID in game if needed
            const gamePlayer = activeGame.players.find(p => p.id === oldSocketId);
            if (gamePlayer) {
              gamePlayer.id = socket.id;
              gamePlayer.isConnected = true;
            }
            socket.emit('game:state', activeGame);
            socket.emit('game:started', activeGame);
          }
          
          // Notify others of reconnection
          socket.to(roomCode).emit('room:player_reconnected', existingPlayer);
          
          // Send room state
          socket.emit('room:joined', room);
          io.to(roomCode).emit('room:updated', room);
          
          callback(true);
          return;
        }
      }
      
      // New join
      const player: Player = {
        id: socket.id,
        username: (socket.data.username as string) || `Player_${socket.id.slice(0, 4)}`,
        isBot: false,
        coins: 0,
        points: 0,
        currentBet: null,
        hand: [],
        stats: {
          wins: 0,
          uniqueWins: 0,
          totalBets: 0,
          averageBet: 0,
          cardsPlayed: 0,
          turnsInBreak: 0,
        },
        isReady: false,
        isConnected: true,
        isInBreak: false,
      };
      
      const success = roomManager.joinRoom(roomCode, player);
      
      if (success) {
        roomManager.linkSocket(socket.id, player.id);
        socket.join(roomCode);
        
        // Check if game is active and send game state
        const activeGame = gameManager.getGameByRoomCode(roomCode);
        if (activeGame) {
          console.log(`[SOCKET] Game is active, sending game state to new joiner`);
          // Update player ID in game if needed (match by username)
          const gamePlayer = activeGame.players.find(p => 
            !p.isBot && 
            p.username === player.username &&
            p.id !== socket.id
          );
          if (gamePlayer) {
            console.log(`[SOCKET] Updating game player ID from ${gamePlayer.id} to ${socket.id}`);
            const oldGamePlayerId = gamePlayer.id;
            gamePlayer.id = socket.id;
            gamePlayer.isConnected = true;
            
            // Update any references to the old player ID in the game state
            // (e.g., in playedCards, turnHistory, etc.)
            // This is handled by the game state being sent with updated player.id
          } else {
            // Player not found in game - might be a spectator or new player
            console.log(`[SOCKET] Player ${player.username} not found in active game`);
          }
          // Always send game state so player can see the game
          socket.emit('game:state', activeGame);
          socket.emit('game:started', activeGame);
        }
        
        // Notify others
        socket.to(roomCode).emit('room:player_joined', player);
        
        // Send room state to joiner
        const room = roomManager.getRoom(roomCode);
        if (room) {
          socket.emit('room:joined', room);
          io.to(roomCode).emit('room:updated', room);
        }
      }
      
      callback(success);
    } catch (error) {
      console.error('[SOCKET] Error joining room:', error);
      socket.emit('error', 'Failed to join room');
      callback(false);
    }
  });
  
  /**
   * Leave room
   */
  socket.on('room:leave', () => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) {
        console.log('[SOCKET] No room found for socket:', socket.id);
        return;
      }
      
      const player = room.players.find(p => p.id === socket.id);
      const playerId = socket.id;
      const playerUsername = player?.username || 'Un joueur';
      const wasHost = room.hostId === playerId;
      
      // Leave room (this will assign new host if needed)
      roomManager.leaveRoom(playerId);
      
      socket.leave(room.code);
      roomManager.unlinkSocket(socket.id);
      
      // Get updated room to check if host changed
      const updatedRoom = roomManager.getRoom(room.code);
      
      if (updatedRoom) {
        // Check if host changed
        if (wasHost && updatedRoom.hostId !== playerId && updatedRoom.players.length > 0) {
          const newHost = updatedRoom.players.find(p => p.id === updatedRoom.hostId);
          const newHostUsername = newHost?.username || 'Un joueur';
          
          console.log(`[SOCKET] Host changed: ${playerUsername} -> ${newHostUsername}`);
          
          // Notify all players about host change
          io.to(room.code).emit('room:host_changed', {
            oldHost: playerUsername,
            newHost: newHostUsername,
            newHostId: updatedRoom.hostId,
            message: `${playerUsername} a quitté le lobby. ${newHostUsername} est maintenant l'hôte.`,
          });
        } else {
          // Just notify about player leaving
          io.to(room.code).emit('room:player_left', {
            playerId,
            username: playerUsername,
            message: `${playerUsername} a quitté le lobby`,
          });
        }
        
        // Always send room update
        io.to(room.code).emit('room:updated', updatedRoom);
        
        // Update public rooms list if room is public
        if (updatedRoom && !updatedRoom.options.isPrivate) {
          setTimeout(() => {
            const publicRooms = roomManager.getPublicRooms();
            const formattedRooms = publicRooms.map((r) => ({
              code: r.code,
              hostUsername: r.players.find((p) => p.id === r.hostId)?.username || 'Hôte',
              playerCount: r.players.length,
              maxPlayers: r.options.maxPlayers,
              mode: r.options.mode,
              pointsToWin: r.options.pointsToWin,
              maxTurns: r.options.maxTurns,
              modules: r.options.modules,
              createdAt: r.createdAt,
            }));
            io.emit('rooms:public_updated', formattedRooms);
          }, 100);
        }
      }
      
      console.log(`[SOCKET] Player ${playerUsername} left room ${room.code}`);
    } catch (error) {
      console.error('[SOCKET] Error leaving room:', error);
    }
  });
  
  /**
   * Set ready status
   */
  socket.on('room:ready', (ready) => {
    try {
      const playerId = socket.id;
      roomManager.setPlayerReady(playerId, ready);
      
      const room = roomManager.getRoomByPlayer(playerId);
      if (room) {
        io.to(room.code).emit('room:updated', room);
      }
    } catch (error) {
      console.error('[SOCKET] Error setting ready:', error);
    }
  });
  
  /**
   * Update room options
   */
  socket.on('room:update_options', (updates) => {
    try {
      console.log('[SOCKET] Received room:update_options:', updates);
      
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) {
        console.log('[SOCKET] No room found for socket:', socket.id);
        return;
      }

      console.log(`[SOCKET] Current room: ${room.code}, Host: ${room.hostId}, Socket: ${socket.id}`);

      // Only host can update options
      if (room.hostId !== socket.id) {
        console.log('[SOCKET] Permission denied: not the host');
        socket.emit('error', 'Only the host can update room options');
        return;
      }

      // Update the room options
      const oldOptions = { ...room.options };
      room.options = { ...room.options, ...updates };
      
      console.log(`[ROOM] Options updated in ${room.code}:`, {
        old: oldOptions,
        updates,
        new: room.options
      });

      // Broadcast update to all players
      io.to(room.code).emit('room:updated', room);
      console.log(`[ROOM] Broadcasted update to room ${room.code}`);
    } catch (error) {
      console.error('[SOCKET] Error updating options:', error);
    }
  });

  /**
   * Add bot
   */
  socket.on('room:add_bot', (difficulty) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;
      
      // Only host can add bots
      if (room.hostId !== socket.id) {
        socket.emit('error', 'Only host can add bots');
        return;
      }
      
      // Validate and normalize difficulty
      const validDifficulties: BotDifficulty[] = ['rookie', 'analyst', 'trickster', 'shark'];
      let normalizedDifficulty: BotDifficulty = difficulty;
      
      // Map common aliases
      if (difficulty === 'medium' || difficulty === 'normal') {
        normalizedDifficulty = 'analyst';
      } else if (!validDifficulties.includes(difficulty as BotDifficulty)) {
        console.warn(`[SOCKET] Invalid bot difficulty: ${difficulty}, defaulting to 'analyst'`);
        normalizedDifficulty = 'analyst';
      }
      
      const success = roomManager.addBot(room.code, normalizedDifficulty);
      
      if (success) {
        const updatedRoom = roomManager.getRoom(room.code);
        if (updatedRoom) {
          io.to(room.code).emit('room:updated', updatedRoom);
        }
      }
    } catch (error) {
      console.error('[SOCKET] Error adding bot:', error);
    }
  });
  
  /**
   * Start game
   */
  socket.on('room:start', () => {
    try {
      console.log('[SOCKET] room:start called by socket:', socket.id);
      
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) {
        console.log('[SOCKET] No room found for socket:', socket.id);
        socket.emit('error', 'Room not found');
        return;
      }
      
      console.log(`[SOCKET] Room ${room.code} - Host: ${room.hostId}, Requester: ${socket.id}, Players: ${room.players.length}`);
      
      const success = roomManager.startGame(room.code, socket.id);
      
      if (success) {
        const game = gameManager.getGameByRoomCode(room.code);
        if (game) {
          console.log('[SOCKET] Game started successfully:', game.id);
          io.to(room.code).emit('game:started', game);
          
          // Start phase timer broadcasts
          startPhaseUpdates(io, room.code, game.id, gameManager, userService, connectedUsers);
        } else {
          console.log('[SOCKET] Game created but not found');
          socket.emit('error', 'Failed to initialize game');
        }
      } else {
        console.log('[SOCKET] startGame returned false');
        socket.emit('error', 'Failed to start game');
      }
    } catch (error) {
      console.error('[SOCKET] Error starting game:', error);
      socket.emit('error', 'Failed to start game');
    }
  });
  
  // ==========================================
  // GAME HANDLERS
  // ==========================================
  
  /**
   * Place bet
   */
  socket.on('game:place_bet', (amount) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;
      
      const game = gameManager.getGameByRoomCode(room.code);
      if (!game) return;
      
      const success = gameManager.placeBet(game.id, socket.id, amount);
      
      if (success) {
        // Check if anyone spied on this player
        const player = game.players.find(p => p.id === socket.id);
        if (player) {
          // Find all players who played spy on this player
          const spyCards = game.playedCards.filter(
            pc => pc.cardType === 'spy' && 
                  pc.targetId === socket.id &&
                  pc.turnNumber === game.currentTurn
          );
          
          // Notify each spy player about the bet
          for (const spyCard of spyCards) {
            const spyPlayer = game.players.find(p => p.id === spyCard.playerId);
            if (spyPlayer) {
              const spySocket = Array.from(io.sockets.sockets.values()).find(
                s => s.id === spyCard.playerId
              );
              if (spySocket) {
                spySocket.emit('game:spy_reveal', {
                  targetId: player.id,
                  targetName: player.username,
                  bet: amount,
                  hasBet: true,
                });
              }
            }
          }
        }
        
        // Don't broadcast bet amount (secret!)
        // Just notify that player has bet
        socket.emit('game:state', game);
      } else {
        socket.emit('error', 'Invalid bet');
      }
    } catch (error) {
      console.error('[SOCKET] Error placing bet:', error);
    }
  });
  
  /**
   * Play card
   */
  socket.on('game:play_card', (cardId, targetId) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;
      
      const game = gameManager.getGameByRoomCode(room.code);
      if (!game) return;
      
      const player = game.players.find(p => p.id === socket.id);
      const success = gameManager.playCard(game.id, socket.id, cardId, targetId);
      
      if (success) {
        const playedCard = game.playedCards[game.playedCards.length - 1];
        
        // Handle spy card: reveal target's bet to the player who played it
        if (playedCard.cardType === 'spy' && targetId) {
          const target = game.players.find(p => p.id === targetId);
          if (target) {
            // Send private revelation to the player who played the card
            socket.emit('game:spy_reveal', {
              targetId: target.id,
              targetName: target.username,
              bet: target.currentBet, // null if not bet yet
              hasBet: target.currentBet !== null,
            });
            
            // Also set up a listener to update when target bets
            // This will be handled in the place_bet handler
          }
        }
        
        // Send card play with player info
        io.to(room.code).emit('game:card_played', {
          ...playedCard,
          playerName: player?.username || 'Un joueur',
          cardName: playedCard.card?.name || 'Une carte',
        });
        io.to(room.code).emit('game:state', game);
      } else {
        socket.emit('error', 'Cannot play card');
      }
    } catch (error) {
      console.error('[SOCKET] Error playing card:', error);
    }
  });
  
  // ==========================================
  // GAME CHAT HANDLERS
  // ==========================================

  /**
   * Send chat message in game
   */
  socket.on('game:chat_send', (roomCode: string, message: string) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Check if chat is enabled
      const activeGame = gameManager.getGameByRoomCode(roomCode);
      if (activeGame && !activeGame.options.modules?.chat) {
        socket.emit('error', 'Chat is disabled in this game');
        return;
      }

      // Get player info
      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', 'Player not found in room');
        return;
      }

      // Validate message
      if (!message || message.trim().length === 0) {
        return;
      }

      if (message.length > 200) {
        socket.emit('error', 'Message too long (max 200 characters)');
        return;
      }

      // Broadcast message to all players in the room
      io.to(roomCode).emit('game:chat_message', {
        playerId: socket.id,
        username: player.username,
        message: message.trim(),
        timestamp: Date.now(),
      });

      console.log(`[CHAT] ${player.username} sent message in room ${roomCode}`);
    } catch (error) {
      console.error('[SOCKET] Error sending chat message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // ==========================================
  // LEADERBOARD HANDLERS
  // ==========================================
  
  /**
   * Get leaderboard
   */
  socket.on('leaderboard:get', async (limit, callback) => {
    try {
      const leaderboard = await userService.getLeaderboard(limit || 50)
      callback(leaderboard)
    } catch (error) {
      console.error('[SOCKET] Error getting leaderboard:', error)
      callback([])
    }
  })

  // ==========================================
  // PUBLIC GAMES HANDLERS
  // ==========================================
  
  /**
   * Get list of public rooms
   */
  socket.on('rooms:public_list', (callback) => {
    try {
      if (typeof callback !== 'function') {
        console.error('[SOCKET] rooms:public_list callback is not a function')
        return
      }
      
      const publicRooms = roomManager.getPublicRooms()
      // Format rooms for client (remove sensitive info)
      const formattedRooms = publicRooms.map((room) => ({
        code: room.code,
        hostUsername: room.players.find((p) => p.id === room.hostId)?.username || 'Hôte',
        playerCount: room.players.length,
        maxPlayers: room.options.maxPlayers,
        mode: room.options.mode,
        pointsToWin: room.options.pointsToWin,
        maxTurns: room.options.maxTurns,
        modules: room.options.modules,
        createdAt: room.createdAt,
      }))
      
      console.log(`[SOCKET] Sending ${formattedRooms.length} public rooms to client`)
      callback(formattedRooms)
    } catch (error) {
      console.error('[SOCKET] Error getting public rooms:', error)
      if (typeof callback === 'function') {
        callback([])
      }
    }
  })

  /**
   * Broadcast public rooms update to all clients
   */
  function broadcastPublicRooms() {
    const publicRooms = roomManager.getPublicRooms()
    const formattedRooms = publicRooms.map((room) => ({
      code: room.code,
      hostUsername: room.players.find((p) => p.id === room.hostId)?.username || 'Hôte',
      playerCount: room.players.length,
      maxPlayers: room.options.maxPlayers,
      mode: room.options.mode,
      pointsToWin: room.options.pointsToWin,
      maxTurns: room.options.maxTurns,
      modules: room.options.modules,
      createdAt: room.createdAt,
    }))
    io.emit('rooms:public_updated', formattedRooms)
  }

  // Broadcast public rooms when a room is created/updated/deleted
  const originalCreateRoom = roomManager.createRoom.bind(roomManager)
  roomManager.createRoom = function(...args) {
    const result = originalCreateRoom(...args)
    setTimeout(broadcastPublicRooms, 100) // Small delay to ensure room is fully created
    return result
  }

  // ==========================================
  // SOCIAL HANDLERS
  // ==========================================
  
  /**
   * Add friend
   */
  socket.on('friend:add', (username) => {
    try {
      // Find user by username (simplified - in real app, use database)
      const targetId = username; // Placeholder
      
      const success = friendManager.sendFriendRequest(socket.id, targetId);
      
      if (success) {
        // Notify target user
        io.to(targetId).emit('friend:request', {
          id: socket.id,
          username: socket.data.username || 'Unknown',
          status: 'online',
          addedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('[SOCKET] Error adding friend:', error);
    }
  });
  
  /**
   * Accept friend request
   */
  socket.on('friend:accept', (friendId) => {
    try {
      const success = friendManager.acceptFriendRequest(socket.id, friendId);
      
      if (success) {
        // Notify both users
        socket.emit('friend:accepted', {
          id: friendId,
          username: 'Friend', // Get from database
          status: 'online',
          addedAt: Date.now(),
        });
        
        io.to(friendId).emit('friend:accepted', {
          id: socket.id,
          username: socket.data.username || 'Unknown',
          status: 'online',
          addedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('[SOCKET] Error accepting friend:', error);
    }
  });
  
  /**
   * Send invitation
   */
  socket.on('invite:send', (friendId, roomCode) => {
    try {
      const invitation = friendManager.sendInvitation(
        socket.id,
        socket.data.username || 'Unknown',
        friendId,
        roomCode
      );
      
      io.to(friendId).emit('invitation:received', invitation);
    } catch (error) {
      console.error('[SOCKET] Error sending invitation:', error);
    }
  });

  /**
   * Reject invitation
   */
  socket.on('invite:reject', (inviteId) => {
    try {
      const invitation = friendManager.getInvitation(inviteId);
      if (invitation) {
        friendManager.deleteInvitation(inviteId);
        console.log(`[SOCKET] Invitation ${inviteId} rejected by ${socket.id}`);
      }
    } catch (error) {
      console.error('[SOCKET] Error rejecting invitation:', error);
    }
  });

  // ========================================
  // FRIEND SYSTEM (Database-backed)
  // ========================================

  /**
   * Get friends list
   */
  socket.on('friends:list', async (callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback([]);

      const friends = await userService.getFriendsWithDetails(userId);
      callback(friends);
    } catch (error) {
      console.error('[SOCKET] Error getting friends:', error);
      callback([]);
    }
  });

  /**
   * Get friend requests
   */
  socket.on('friends:requests', async (callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback([]);

      const requests = await userService.getFriendRequests(userId);
      callback(requests);
    } catch (error) {
      console.error('[SOCKET] Error getting friend requests:', error);
      callback([]);
    }
  });

  /**
   * Search users
   */
  socket.on('friends:search', async (query, callback) => {
    try {
      const users = await userService.searchUsers(query, 10);
      callback(users);
    } catch (error) {
      console.error('[SOCKET] Error searching users:', error);
      callback([]);
    }
  });

  /**
   * Send friend request
   */
  socket.on('friends:request', async (toUserId, callback) => {
    try {
      const fromUserId = socket.data.playerId;
      if (!fromUserId) return callback(false);

      const success = await userService.sendFriendRequest(fromUserId, toUserId);
      callback(success);

      if (success) {
        // Get sender profile for notification
        const senderProfile = await userService.getUserProfile(fromUserId);
        
        // Notify the other user with full details
        const recipientSocketId = connectedUsers.get(toUserId);
        if (recipientSocketId && senderProfile) {
          io.to(recipientSocketId).emit('friend:request', {
            id: fromUserId,
            username: senderProfile.username,
            level: senderProfile.level,
            avatar: senderProfile.avatar,
          });
          console.log(`[FRIENDS] Request notification sent to ${toUserId}`);
        }
      }
    } catch (error) {
      console.error('[SOCKET] Error sending friend request:', error);
      callback(false);
    }
  });

  /**
   * Accept friend request
   */
  socket.on('friends:accept', async (requesterId, callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback(false);

      const success = await userService.acceptFriendRequest(userId, requesterId);
      callback(success);

      if (success) {
        // Get both profiles for notifications
        const userProfile = await userService.getUserProfile(userId);
        const requesterProfile = await userService.getUserProfile(requesterId);
        
        // Notify the requester that their request was accepted
        const requesterSocketId = connectedUsers.get(requesterId);
        if (requesterSocketId && userProfile) {
          io.to(requesterSocketId).emit('friend:accepted', {
            id: userId,
            username: userProfile.username,
            level: userProfile.level,
            avatar: userProfile.avatar,
          });
          console.log(`[FRIENDS] Acceptance notification sent to ${requesterId}`);
        }
      }
    } catch (error) {
      console.error('[SOCKET] Error accepting friend request:', error);
      callback(false);
    }
  });

  /**
   * Reject friend request
   */
  socket.on('friends:reject', async (requesterId, callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback(false);

      const success = await userService.rejectFriendRequest(userId, requesterId);
      callback(success);
    } catch (error) {
      console.error('[SOCKET] Error rejecting friend request:', error);
      callback(false);
    }
  });

  /**
   * Remove friend
   */
  socket.on('friends:remove', async (friendId, callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback(false);

      const success = await userService.removeFriend(userId, friendId);
      callback(success);

      if (success) {
        // Notify both users
        io.emit('friends:removed', { userId, friendId });
      }
    } catch (error) {
      console.error('[SOCKET] Error removing friend:', error);
      callback(false);
    }
  });

  // ========================================
  // USER PROFILE
  // ========================================

  /**
   * Get user profile
   */
  socket.on('profile:get', async (userId, callback) => {
    try {
      const targetUserId = userId || socket.data.playerId;
      if (!targetUserId) {
        console.error('[SOCKET] No userId provided for profile:get');
        callback(null);
        return;
      }
      
      let profile = await userService.getUserProfile(targetUserId);
      
      // If profile doesn't exist, try to initialize it
      if (!profile) {
        console.log(`[SOCKET] Profile not found for ${targetUserId}, attempting to initialize...`);
        const username = socket.data.username as string;
        if (username) {
          await userService.createOrGetUser(username);
          profile = await userService.getUserProfile(targetUserId);
        }
      }
      
      callback(profile);
    } catch (error) {
      console.error('[SOCKET] Error getting profile:', error);
      callback(null);
    }
  });

  /**
   * Update user profile
   */
  socket.on('profile:update', async (updates, callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback(false);

      const success = await userService.updateUserProfile(userId, updates);
      callback(success);
    } catch (error) {
      console.error('[SOCKET] Error updating profile:', error);
      callback(false);
    }
  });

  /**
   * Get Supabase ID from socket ID (for viewing profiles in-game)
   */
  socket.on('player:get_supabase_id', (socketId: string, callback) => {
    try {
      // Find the playerId (Supabase ID) from socketId
      const playerId = roomManager.getPlayerIdFromSocket(socketId);
      if (playerId) {
        callback(playerId);
      } else {
        // Try to find in connectedUsers map
        for (const [supabaseId, connectedSocketId] of connectedUsers.entries()) {
          if (connectedSocketId === socketId) {
            callback(supabaseId);
            return;
          }
        }
        callback(null);
      }
    } catch (error) {
      console.error('[SOCKET] Error getting Supabase ID:', error);
      callback(null);
    }
  });

  // MESSAGING HANDLERS
  // ==========================================

  /**
   * Send message
   */
  socket.on('message:send', async (toUserId: string, message: string, callback) => {
    try {
      const fromUserId = socket.data.playerId;
      if (!fromUserId) return callback(false);

      const success = await userService.sendMessage(fromUserId, toUserId, message);
      
      if (success) {
        // Get sender profile for notification
        const senderProfile = await userService.getUserProfile(fromUserId);
        
        // Notify recipient in real-time if they're connected
        const recipientSocketId = connectedUsers.get(toUserId);
        if (recipientSocketId && senderProfile) {
          io.to(recipientSocketId).emit('message:private', {
            fromId: fromUserId,
            fromUsername: senderProfile.username,
            message,
            timestamp: Date.now(),
            id: `${Date.now()}-${Math.random()}`,
          });
          console.log(`[MESSAGE] Sent to ${toUserId} (socket: ${recipientSocketId})`);
        }
      }

      callback(success);
    } catch (error) {
      console.error('[SOCKET] Error sending message:', error);
      callback(false);
    }
  });

  /**
   * Get messages with a user
   */
  socket.on('message:get', async (otherUserId: string, callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback([]);

      const messages = await userService.getMessages(userId, otherUserId);
      
      // Mark messages as read
      await userService.markMessagesAsRead(userId, otherUserId);

      callback(messages);
    } catch (error) {
      console.error('[SOCKET] Error fetching messages:', error);
      callback([]);
    }
  });

  /**
   * Get unread message count
   */
  socket.on('message:unread_count', async (callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback(0);

      const count = await userService.getUnreadMessageCount(userId);
      callback(count);
    } catch (error) {
      console.error('[SOCKET] Error getting unread count:', error);
      callback(0);
    }
  });

  // GAME INVITATION HANDLERS
  // ==========================================

  /**
   * Invite friends to lobby from lobby page
   */
  socket.on('room:invite_friends', async (friendIds: string[], callback) => {
    try {
      const fromUserId = socket.data.playerId as string;
      const fromUsername = socket.data.username as string;
      
      if (!fromUserId) {
        callback(false);
        return;
      }

      // Get current room
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) {
        console.log('[INVITE] No room found for socket:', socket.id);
        callback(false);
        return;
      }

      console.log(`[INVITE] Inviting ${friendIds.length} friends to room ${room.code}`);

      // Send invitations to each friend
      for (const friendId of friendIds) {
        // Check if friend is online
        const friendSocketId = connectedUsers.get(friendId);
        
        if (friendSocketId) {
          // Friend is online - send real-time notification
          const invitation: any = {
            id: `lobby_${room.code}_${Date.now()}`,
            fromId: fromUserId,
            fromUsername: fromUsername,
            roomCode: room.code,
            createdAt: Date.now(),
          };
          
          io.to(friendSocketId).emit('lobby:invitation_received', invitation);
          console.log(`[INVITE] Sent lobby invitation to online friend ${friendId}`);
        } else {
          // Friend is offline - save to database for later
          try {
            await userService.createGameInvitation({
              fromUserId,
              toUserId: friendId,
              roomCode: room.code,
            });
            console.log(`[INVITE] Saved lobby invitation for offline friend ${friendId}`);
          } catch (error) {
            console.error(`[INVITE] Error saving invitation for ${friendId}:`, error);
          }
        }
      }

      callback(true);
    } catch (error) {
      console.error('[SOCKET] Error inviting friends to lobby:', error);
      callback(false);
    }
  });

  /**
   * Send game invitation (creates lobby if needed)
   */
  socket.on('game:invite', async (toUserId: string, callback) => {
    try {
      const fromUserId = socket.data.playerId;
      const fromUsername = socket.data.username;
      if (!fromUserId || !fromUsername) return callback(null);

      // Get or create a room for this invitation
      const player = {
        id: socket.id,
        username: fromUsername,
        isBot: false,
        coins: 0,
        points: 0,
        currentBet: null,
        hand: [],
        stats: {
          wins: 0,
          uniqueWins: 0,
          totalBets: 0,
          averageBet: 0,
          cardsPlayed: 0,
          turnsInBreak: 0,
        },
        isReady: false,
        isConnected: true,
        isInBreak: false,
      };

      // Create room with default options
      const defaultOptions: GameOptions = {
        mode: 'standard',
        startingCoins: 60,
        coinCap: 120,
        minBet: 1,
        maxBet: 12,
        pointsToWin: 20,
        maxTurns: 30,
        modules: {
          dynamicEconomy: true,
          specialCards: false,
          randomEvents: false,
          hiddenRoles: false,
          chat: true,
          leaderboard: true,
        },
        maxPlayers: 4,
        allowBots: true,
        isPrivate: true,
      };

      const roomCode = roomManager.createRoom(player, defaultOptions);
      roomManager.linkSocket(socket.id, player.id);
      socket.join(roomCode);

      // Notify the creator that they joined the room
      const room = roomManager.getRoom(roomCode);
      if (room) {
        socket.emit('room:joined', room);
        io.to(roomCode).emit('room:updated', room);
        console.log(`[INVITE] Notified creator of room ${roomCode}`);
      }

      // Send invitation to friend
      console.log(`[INVITE] Looking for friend ${toUserId} in connectedUsers...`)
      console.log(`[INVITE] Connected users:`, Array.from(connectedUsers.entries()))
      const friendSocketId = connectedUsers.get(toUserId);
      
      if (friendSocketId) {
        // Friend is online - send real-time notification
        const invitation: any = {
          id: `lobby_${roomCode}_${Date.now()}`,
          fromId: fromUserId,
          fromUsername: fromUsername,
          roomCode: roomCode,
          createdAt: Date.now(),
        };
        
        console.log(`[INVITE] Sending invitation to socket ${friendSocketId} for user ${toUserId}`)
        io.to(friendSocketId).emit('lobby:invitation_received', invitation);
        console.log(`[INVITE] ✅ Sent lobby invitation to online friend ${toUserId} (socket: ${friendSocketId})`);
      } else {
        console.log(`[INVITE] ❌ Friend ${toUserId} not found in connectedUsers (offline or not connected)`);
        // Friend is offline - save to database
        try {
          await userService.createGameInvitation({
            fromUserId,
            toUserId,
            roomCode: roomCode,
          });
          console.log(`[INVITE] Saved lobby invitation for offline friend ${toUserId}`);
        } catch (error) {
          console.error(`[INVITE] Error saving invitation:`, error);
        }
      }

      callback({ success: true, roomCode });
    } catch (error) {
      console.error('[SOCKET] Error sending invitation:', error);
      callback({ success: false, roomCode: null });
    }
  });

  /**
   * Get pending invitations
   */
  socket.on('game:invitations', async (callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback([]);

      const invitations = await userService.getPendingInvitations(userId);
      callback(invitations);
    } catch (error) {
      console.error('[SOCKET] Error fetching invitations:', error);
      callback([]);
    }
  });

  /**
   * Accept invitation
   */
  socket.on('game:accept_invitation', async (invitationId: string, callback) => {
    try {
      const userId = socket.data.playerId;
      if (!userId) return callback(null);

      const success = await userService.updateInvitationStatus(invitationId, 'accepted');
      
      if (success) {
        // Get invitation details
        const invitations = await userService.getPendingInvitations(userId);
        const invitation = invitations.find((inv: any) => inv.id === invitationId);
        
        if (invitation) {
          callback(invitation.room_code);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    } catch (error) {
      console.error('[SOCKET] Error accepting invitation:', error);
      callback(null);
    }
  });

  /**
   * Reject invitation
   */
  socket.on('game:reject_invitation', async (invitationId: string, callback) => {
    try {
      const success = await userService.updateInvitationStatus(invitationId, 'rejected');
      callback(success);
    } catch (error) {
      console.error('[SOCKET] Error rejecting invitation:', error);
      callback(false);
    }
  });
}

// Track active intervals to prevent duplicates
const activePhaseIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Start broadcasting phase updates
 */
function startPhaseUpdates(
  io: TypedServer,
  roomCode: string,
  gameId: string,
  gameManager: GameManager,
  userService: UserService,
  connectedUsers: Map<string, string>
) {
  // Clear existing interval for this game if any
  const existingInterval = activePhaseIntervals.get(gameId);
  if (existingInterval) {
    console.log(`[SOCKET] Clearing existing interval for game ${gameId}`);
    clearInterval(existingInterval);
  }
  
  // Track which events have been sent for this phase
  const sentEvents = new Map<string, Set<string>>();
  
  const interval = setInterval(async () => {
    const game = gameManager.getGame(gameId);
    if (!game) {
      clearInterval(interval);
      activePhaseIntervals.delete(gameId);
      return;
    }
    
    if (game.status === 'finished') {
      clearInterval(interval);
      activePhaseIntervals.delete(gameId);
      sentEvents.delete(gameId);
      
      console.log(`[SOCKET] Game finished, sending end event to room ${roomCode}`);
      
      // Send final rankings
      const rankings = GameRules.getFinalRankings(game);
      const playerRankings = rankings.map((player, index) => ({
        player,
        rank: index + 1,
        finalPoints: player.points,
        finalCoins: player.coins,
        turnsWon: player.stats.wins,
        badges: [],
        xpGained: EconomyManager.calculateXPGain(
          index + 1,
          game.players.length,
          player.stats.wins,
          0
        ),
      }));
      
      console.log(`[SOCKET] Final rankings:`, playerRankings.map(r => ({ rank: r.rank, username: r.player.username, points: r.finalPoints })));
      
      // Update stats for all players in Supabase
      await updatePlayerStats(game, playerRankings, userService, connectedUsers);
      
      io.to(roomCode).emit('game:ended', game, playerRankings);
      return;
    }
    
    // Calculate remaining time based on deadline
    if (game.phaseDeadline) {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((game.phaseDeadline - now) / 1000));
      game.phaseTimer = remaining;
      
      // Log timer updates for debugging (only every 5 seconds to avoid spam)
      if (remaining % 5 === 0 || remaining <= 3) {
        console.log(`[TIMER] Game ${gameId}, Phase: ${game.phase}, Remaining: ${remaining}s, Deadline: ${game.phaseDeadline}, Now: ${now}`);
      }
    } else {
      // Fallback: if no deadline, use phaseTimer directly
      if (game.phaseTimer !== undefined && game.phaseTimer > 0) {
        game.phaseTimer = Math.max(0, game.phaseTimer - 1);
      }
    }
    
    // Broadcast game state
    io.to(roomCode).emit('game:state', game);
    
    // Broadcast phase changes
    if (game.phase && game.phaseTimer !== undefined) {
      io.to(roomCode).emit('game:phase_changed', game.phase, game.phaseTimer);
    }
    
    // Initialize sent events set for this game if needed
    if (!sentEvents.has(gameId)) {
      sentEvents.set(gameId, new Set());
    }
    const sent = sentEvents.get(gameId)!;
    const phaseKey = `${game.phase}-${game.currentTurn}`;
    
    // Broadcast events (only once per phase)
    if (game.currentEvent && game.phase === 'event') {
      const eventKey = `event-${phaseKey}`;
      if (!sent.has(eventKey)) {
        io.to(roomCode).emit('game:event_triggered', game.currentEvent);
        sent.add(eventKey);
      }
    }
    
    // Broadcast reveals (only once per phase)
    if (game.phase === 'reveal') {
      const revealKey = `reveal-${phaseKey}`;
      if (!sent.has(revealKey)) {
        const bets: Record<string, number> = {};
        for (const player of game.players) {
          if (player.currentBet !== null) {
            bets[player.id] = player.currentBet;
          }
        }
        // Send bets with player info
        io.to(roomCode).emit('game:bets_revealed', bets, game.players);
        sent.add(revealKey);
      }
    }
    
    // Broadcast turn results (only once per phase)
    if (game.phase === 'resolution' && game.turnHistory.length > 0) {
      const resultKey = `result-${phaseKey}`;
      if (!sent.has(resultKey)) {
        const lastResult = game.turnHistory[game.turnHistory.length - 1];
        
        // Enrich result with winner player info
        let enrichedResult = { ...lastResult };
        if (lastResult.winner) {
          const winnerPlayer = game.players.find(p => p.id === lastResult.winner);
          if (winnerPlayer) {
            enrichedResult = {
              ...enrichedResult,
              winnerInfo: {
                id: winnerPlayer.id,
                username: winnerPlayer.username,
                currentBet: winnerPlayer.currentBet,
              }
            };
          }
        }
        
        io.to(roomCode).emit('game:turn_result', enrichedResult);
        sent.add(resultKey);
      }
    }
    
    // Clean up old phase keys (keep only current turn)
    if (sent.size > 10) {
      const keysToDelete: string[] = [];
      for (const key of sent) {
        if (!key.includes(phaseKey)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(k => sent.delete(k));
    }
  }, 1000); // Update every second
  
  // Store interval to prevent duplicates
  activePhaseIntervals.set(gameId, interval);
  console.log(`[SOCKET] Started phase updates interval for game ${gameId}`);
}

/**
 * Update player stats in Supabase after game ends
 */
async function updatePlayerStats(
  game: any,
  rankings: any[],
  userService: UserService,
  connectedUsers: Map<string, string>
): Promise<void> {
  console.log('[STATS] Updating player stats after game end');
  
  // Create reverse mapping: socketId -> playerId (Supabase)
  const socketIdToPlayerId = new Map<string, string>();
  for (const [playerId, socketId] of connectedUsers.entries()) {
    socketIdToPlayerId.set(socketId, playerId);
  }
  
  // Calculate game duration
  const gameDuration = game.endedAt && game.startedAt 
    ? Math.floor((game.endedAt - game.startedAt) / 60000) 
    : 0;
  const gameDurationSeconds = game.endedAt && game.startedAt 
    ? Math.floor((game.endedAt - game.startedAt) / 1000) 
    : 0;
  
  // Save game history
  const winnerRanking = rankings.find(r => r.rank === 1);
  const winnerSupabaseId = winnerRanking 
    ? socketIdToPlayerId.get(winnerRanking.player.id) 
    : undefined;
  
  try {
    await userService.saveGameHistory({
      roomCode: game.roomCode,
      gameMode: game.options.mode || 'standard',
      startingCoins: game.options.startingCoins,
      coinCap: game.options.coinCap,
      pointsToWin: game.options.pointsToWin,
      maxTurns: game.options.maxTurns || 0,
      modules: game.options.modules || {},
      winnerId: winnerSupabaseId,
      totalTurns: game.currentTurn,
      durationSeconds: gameDurationSeconds,
      participants: rankings
        .filter(r => !r.player.isBot && socketIdToPlayerId.has(r.player.id))
        .map(r => ({
          userId: socketIdToPlayerId.get(r.player.id)!,
          rank: r.rank,
          finalPoints: r.finalPoints,
          finalCoins: r.finalCoins,
          turnsWon: r.turnsWon,
          cardsPlayed: r.player.stats.cardsPlayed || 0,
          xpGained: r.xpGained,
        })),
    });
    console.log('[STATS] Game history saved');
  } catch (error) {
    console.error('[STATS] Error saving game history:', error);
  }
  
  // Update stats for each player
  for (const ranking of rankings) {
    const player = ranking.player;
    const socketId = player.id; // In game, player.id = socket.id
    const supabasePlayerId = socketIdToPlayerId.get(socketId);
    
    // Skip bots and players without Supabase ID
    if (player.isBot || !supabasePlayerId) {
      console.log(`[STATS] Skipping ${player.username} (bot: ${player.isBot}, hasId: ${!!supabasePlayerId})`);
      continue;
    }
    
    console.log(`[STATS] Updating stats for ${player.username} (Supabase ID: ${supabasePlayerId})`);
    
    try {
      // Get cards played by this player in this game
      const playerPlayedCards = game.playedCards
        .filter(pc => pc.playerId === socketId)
        .map(pc => ({ cardType: pc.cardType }));
      
      // Update stats
      await userService.updateStatsAfterGame(supabasePlayerId, {
        gamesPlayed: 1,
        gamesWon: ranking.rank === 1 ? 1 : 0,
        totalPoints: player.points,
        totalCoins: player.coins,
        uniqueWins: player.stats.uniqueWins || 0,
        cardsPlayed: player.stats.cardsPlayed || 0,
        timePlayedMinutes: gameDuration,
        totalBets: player.stats.totalBets || 0,
        turnsPlayed: game.currentTurn,
        playedCards: playerPlayedCards,
      });
      
      // Update XP
      const xpResult = await userService.updateXP(supabasePlayerId, ranking.xpGained);
      if (xpResult.leveled) {
        console.log(`[STATS] ${player.username} leveled up to level ${xpResult.newLevel}!`);
      }
      
      // Check and award badges (after stats are updated)
      await checkAndAwardBadges(supabasePlayerId, ranking, userService, ranking.rank === 1);
      
      console.log(`[STATS] Successfully updated stats for ${player.username}`);
    } catch (error) {
      console.error(`[STATS] Error updating stats for ${player.username}:`, error);
    }
  }
}

/**
 * Check and award badges based on game results
 */
async function checkAndAwardBadges(
  userId: string,
  ranking: any,
  userService: UserService,
  won: boolean
): Promise<void> {
  try {
    // Get profile AFTER stats update to check current totals
    const profile = await userService.getUserProfile(userId);
    if (!profile) return;
    
    // First win
    if (won && profile.globalStats.gamesWon === 1) {
      await userService.awardBadge(userId, 'first_win');
      console.log(`[BADGES] Awarded 'first_win' badge to user ${userId}`);
    }
    
    // Champion (50 wins)
    if (won && profile.globalStats.gamesWon === 50) {
      await userService.awardBadge(userId, 'champion');
      console.log(`[BADGES] Awarded 'champion' badge to user ${userId}`);
    }
    
    // 100 games played (Veteran)
    if (profile.globalStats.gamesPlayed === 100) {
      await userService.awardBadge(userId, 'veteran');
      console.log(`[BADGES] Awarded 'veteran' badge to user ${userId}`);
    }
    
    // Card Master (10 cards in one game - check from ranking)
    if (ranking.player.stats.cardsPlayed >= 10) {
      await userService.awardBadge(userId, 'card_master');
      console.log(`[BADGES] Awarded 'card_master' badge to user ${userId}`);
    }
  } catch (error) {
    console.error(`[BADGES] Error checking badges for user ${userId}:`, error);
  }
}

