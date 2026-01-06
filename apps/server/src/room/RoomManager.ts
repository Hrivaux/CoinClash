import { nanoid } from "nanoid";
import {
  Room,
  RoomCode,
  Player,
  PlayerId,
  GameOptions,
  BotDifficulty,
  DEFAULT_GAME_OPTIONS,
} from "@coin-clash/shared";
import { BotFactory } from "@coin-clash/shared";
import { GameManager } from "../game/GameManager";

/**
 * Room Manager - Handles room creation, joining, and management
 */
export class RoomManager {
  private rooms: Map<RoomCode, Room> = new Map();
  private playerToRoom: Map<PlayerId, RoomCode> = new Map();
  private socketToPlayer: Map<string, PlayerId> = new Map();

  constructor(private gameManager: GameManager) {}

  /**
   * Create a new room
   */
  createRoom(
    hostPlayer: Player,
    options: GameOptions = DEFAULT_GAME_OPTIONS
  ): RoomCode {
    const code = this.generateRoomCode();

    hostPlayer.isReady = false;

    const room: Room = {
      code,
      hostId: hostPlayer.id,
      players: [hostPlayer],
      options,
      status: "waiting",
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.playerToRoom.set(hostPlayer.id, code);

    console.log(`[ROOM] Created room ${code} by ${hostPlayer.username}`);

    return code;
  }

  /**
   * Join a room
   */
  joinRoom(roomCode: RoomCode, player: Player): boolean {
    const room = this.rooms.get(roomCode);

    if (!room) {
      console.log(`[ROOM] Room ${roomCode} not found`);
      return false;
    }

    // Allow joining even if game started (for reconnections)
    // Only block if room doesn't exist or is full
    if (
      room.status === "waiting" &&
      room.players.length >= room.options.maxPlayers
    ) {
      console.log(`[ROOM] Room ${roomCode} is full`);
      return false;
    }

    // If game has started, only allow reconnection (player already in room)
    if (room.status !== "waiting") {
      const existingPlayer = room.players.find(
        (p) => p.id === player.id || p.username === player.username
      );
      if (existingPlayer) {
        // Reconnection - update socket.id if needed
        if (existingPlayer.id !== player.id) {
          console.log(
            `[ROOM] Reconnecting player ${player.username} (socket.id changed)`
          );
          const oldSocketId = existingPlayer.id;
          existingPlayer.id = player.id;
          existingPlayer.isConnected = true;
          this.playerToRoom.delete(oldSocketId);
          this.playerToRoom.set(player.id, roomCode);
        } else {
          existingPlayer.isConnected = true;
        }
        return true;
      }
      // New player trying to join started game - not allowed
      console.log(
        `[ROOM] Room ${roomCode} already started - cannot join new players`
      );
      return false;
    }

    if (room.players.length >= room.options.maxPlayers) {
      console.log(`[ROOM] Room ${roomCode} is full`);
      return false;
    }

    // Check if player already in room
    if (room.players.some((p) => p.id === player.id)) {
      console.log(`[ROOM] Player ${player.username} already in room`);
      return true;
    }

    player.isReady = false;
    room.players.push(player);
    this.playerToRoom.set(player.id, roomCode);

    console.log(`[ROOM] ${player.username} joined room ${roomCode}`);

    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(playerId: PlayerId): boolean {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return false;

    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // Remove player
    room.players = room.players.filter((p) => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    console.log(`[ROOM] Player ${playerId} left room ${roomCode}`);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      console.log(`[ROOM] Room ${roomCode} deleted (empty)`);
      return true;
    }

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
      console.log(`[ROOM] New host: ${room.players[0].username}`);
    }

    return true;
  }

  /**
   * Set player ready status
   */
  setPlayerReady(playerId: PlayerId, ready: boolean): boolean {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return false;

    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.isReady = ready;

    return true;
  }

  /**
   * Add bot to room
   */
  addBot(roomCode: RoomCode, difficulty: BotDifficulty): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    if (room.players.length >= room.options.maxPlayers) {
      return false;
    }

    const bot = BotFactory.createBot(difficulty);
    bot.coins = room.options.startingCoins;

    room.players.push(bot);

    console.log(`[ROOM] Bot added to room ${roomCode}: ${bot.username}`);

    return true;
  }

  /**
   * Start game
   */
  startGame(roomCode: RoomCode, hostId: PlayerId): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) {
      console.log(`[ROOM] Room ${roomCode} not found`);
      return false;
    }

    console.log(
      `[ROOM] startGame - Room: ${roomCode}, Host: ${room.hostId}, Requester: ${hostId}`
    );

    if (room.hostId !== hostId) {
      console.log(
        `[ROOM] Only host can start game (host: ${room.hostId}, requester: ${hostId})`
      );
      return false;
    }

    if (room.players.length < 2) {
      console.log(
        `[ROOM] Need at least 2 players (current: ${room.players.length})`
      );
      return false;
    }

    // Check if all non-bot players (except host) are ready
    const humanPlayers = room.players.filter((p) => !p.isBot);
    const nonHostPlayers = humanPlayers.filter((p) => p.id !== room.hostId);
    const allReady = nonHostPlayers.every((p) => p.isReady);

    console.log(
      `[ROOM] Human players: ${humanPlayers.length}, Non-host players: ${nonHostPlayers.length}, All ready: ${allReady}`
    );
    console.log(
      `[ROOM] Players status:`,
      humanPlayers.map((p) => ({
        username: p.username,
        isHost: p.id === room.hostId,
        isReady: p.isReady,
      }))
    );

    if (!allReady && nonHostPlayers.length > 0) {
      console.log(`[ROOM] Not all non-host players are ready`);
      return false;
    }

    room.status = "starting";

    // Create game
    const game = this.gameManager.createGame(
      roomCode,
      room.players,
      room.options
    );

    room.status = "in_progress";

    console.log(`[ROOM] Game started in room ${roomCode}`);

    return true;
  }

  /**
   * Get room
   */
  getRoom(roomCode: RoomCode): Room | undefined {
    return this.rooms.get(roomCode);
  }

  /**
   * Get room by player
   */
  getRoomByPlayer(playerId: PlayerId): Room | undefined {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode);
  }

  /**
   * Get room by socket
   */
  getRoomBySocket(socketId: string): Room | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return undefined;
    return this.getRoomByPlayer(playerId);
  }

  /**
   * Get Supabase player ID from socket ID
   */
  getPlayerIdFromSocket(socketId: string): PlayerId | undefined {
    return this.socketToPlayer.get(socketId);
  }

  /**
   * Link socket to player
   */
  linkSocket(socketId: string, playerId: PlayerId): void {
    this.socketToPlayer.set(socketId, playerId);
  }

  /**
   * Unlink socket
   */
  unlinkSocket(socketId: string): void {
    this.socketToPlayer.delete(socketId);
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = false;

      // If game hasn't started, remove player after timeout
      if (room.status === "waiting") {
        setTimeout(() => {
          if (player && !player.isConnected) {
            this.leaveRoom(playerId);
          }
        }, 30000); // 30 seconds to reconnect
      }
    }

    this.unlinkSocket(socketId);
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get all public rooms (waiting status, not private)
   */
  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => !room.options.isPrivate && room.status === "waiting"
    );
  }

  /**
   * Generate unique room code
   */
  private generateRoomCode(): RoomCode {
    let code: string;
    let attempts = 0;

    do {
      code = nanoid(5).toUpperCase();
      attempts++;
    } while (this.rooms.has(code) && attempts < 10);

    return code;
  }
}
