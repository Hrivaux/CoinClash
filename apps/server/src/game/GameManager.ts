import {
  GameState,
  GameOptions,
  Player,
  PlayerId,
  GameId,
  RoomCode,
  GamePhase,
  DEFAULT_GAME_OPTIONS,
} from '@coin-clash/shared';
import {
  GameRules,
  CardManager,
  EventManager,
  RoleManager,
  BotAI,
} from '@coin-clash/shared';

/**
 * Game Manager - Handles game state and logic
 */
export class GameManager {
  private games: Map<GameId, GameState> = new Map();
  private botAIs: Map<PlayerId, BotAI> = new Map();
  private phaseTimers: Map<GameId, NodeJS.Timeout> = new Map();
  
  /**
   * Create a new game
   */
  createGame(roomCode: RoomCode, players: Player[], options: GameOptions): GameState {
    const gameId = this.generateGameId();
    
    // Initialize players
    for (const player of players) {
      player.coins = options.startingCoins;
      player.points = 0;
      player.currentBet = null;
      player.hand = options.modules?.specialCards ? CardManager.generateStartingHand() : [];
      player.stats = {
        wins: 0,
        uniqueWins: 0,
        totalBets: 0,
        averageBet: 0,
        cardsPlayed: 0,
        turnsInBreak: 0,
      };
      
      // Initialize bot AI
      if (player.isBot && player.botDifficulty) {
        this.botAIs.set(player.id, new BotAI(player.botDifficulty));
      }
    }
    
    // Assign secret roles
    if (options.modules.hiddenRoles) {
      RoleManager.assignRoles(players);
    }
    
    const game: GameState = {
      id: gameId,
      roomCode,
      options,
      players,
      hostId: players[0].id,
      status: 'playing',
      currentTurn: 1,
      phase: 'event',
      playedCards: [],
      turnHistory: [],
      doubledBets: new Set(),
      shieldedPlayers: new Set(),
      reverseMode: false,
      fakeBets: {},
      spyReveals: new Map(),
      createdAt: Date.now(),
      startedAt: Date.now(),
    };
    
    this.games.set(gameId, game);
    
    // Start first turn
    this.startTurn(gameId);
    
    return game;
  }
  
  /**
   * Start a new turn
   */
  private startTurn(gameId: GameId): void {
    const game = this.games.get(gameId);
    if (!game) return;
    
    console.log(`[GAME] Starting turn ${game.currentTurn}, randomEvents: ${game.options.modules?.randomEvents}`);
    
    // Generate random event if enabled
    if (game.options.modules?.randomEvents) {
      const event = EventManager.generateRandomEvent();
      EventManager.applyEvent(game, event);
      // Start event phase
      this.setPhase(game, 'event', 5);
    } else {
      // Skip event phase if disabled
      this.setPhase(game, 'planning', 15);
    }
  }
  
  /**
   * Set game phase with timer
   */
  private setPhase(game: GameState, phase: GamePhase, seconds: number): void {
    console.log(`[GAME] Setting phase: ${phase} for ${seconds}s`);
    game.phase = phase;
    game.phaseTimer = seconds;
    game.phaseDeadline = Date.now() + seconds * 1000;
    
    // Clear existing timer
    const existingTimer = this.phaseTimers.get(game.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Auto-advance after timer
    const timer = setTimeout(() => {
      console.log(`[GAME] Timer expired for phase: ${phase}, advancing...`);
      this.advancePhase(game.id);
    }, seconds * 1000);
    
    this.phaseTimers.set(game.id, timer);
  }
  
  /**
   * Advance to next phase
   */
  private advancePhase(gameId: GameId): void {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`[GAME] advancePhase: Game not found for id ${gameId}`);
      return;
    }
    
    console.log(`[GAME] Advancing from phase: ${game.phase}`);
    
    switch (game.phase) {
      case 'event':
        this.setPhase(game, 'planning', 15);
        break;
      
      case 'planning':
        this.setPhase(game, 'betting', 20);
        // Make bots bet
        this.handleBotActions(game);
        break;
      
      case 'betting':
        // Auto-bet for players who didn't bet
        this.autobet(game);
        
        // Only go to instant_cards phase if special cards are enabled
        if (game.options.modules?.specialCards) {
          this.setPhase(game, 'instant_cards', 10);
          // Make bots play cards
          this.handleBotCardPlays(game);
        } else {
          // Skip instant_cards phase if cards are disabled
          this.setPhase(game, 'reveal', 3);
        }
        break;
      
      case 'instant_cards':
        this.setPhase(game, 'reveal', 3);
        break;
      
      case 'reveal':
        this.setPhase(game, 'resolution', 5);
        this.resolvePhase(game);
        break;
      
      case 'resolution':
        this.setPhase(game, 'end_turn', 5);
        this.endTurn(game);
        break;
      
      case 'end_turn':
        this.nextTurn(game);
        break;
        
      default:
        console.log(`[GAME] Unknown phase: ${game.phase}`);
    }
  }
  
  /**
   * Handle bot betting
   */
  private handleBotActions(game: GameState): void {
    for (const player of game.players) {
      if (player.isBot && !player.isInBreak && player.currentBet === null) {
        const botAI = this.botAIs.get(player.id);
        if (botAI) {
          const bet = botAI.decideBet(game, player);
          player.currentBet = bet;
        }
      }
    }
  }
  
  /**
   * Handle bot card plays
   */
  private handleBotCardPlays(game: GameState): void {
    if (!game.options.modules.specialCards) return;
    
    for (const player of game.players) {
      if (player.isBot) {
        const botAI = this.botAIs.get(player.id);
        if (botAI) {
          const cardPlay = botAI.decideCard(game, player);
          if (cardPlay) {
            CardManager.playCard(game, player, cardPlay.cardId, cardPlay.targetId);
          }
        }
      }
    }
  }
  
  /**
   * Auto-bet for players who didn't bet
   */
  private autobet(game: GameState): void {
    for (const player of game.players) {
      if (!player.isInBreak && player.currentBet === null) {
        // Default bet: 1
        player.currentBet = Math.min(1, player.coins);
      }
    }
  }
  
  /**
   * Resolve turn
   */
  private resolvePhase(game: GameState): void {
    const result = GameRules.processTurnResults(game);
    game.turnHistory.push(result);
    
    // Check role conditions
    if (game.options.modules.hiddenRoles) {
      RoleManager.checkRoleConditions(game);
    }
    
    // Draw cards
    if (game.options.modules.specialCards && game.currentTurn % 2 === 0) {
      for (const player of game.players) {
        CardManager.drawCards(player, 1);
      }
    }
  }
  
  /**
   * End turn and check win condition
   */
  private endTurn(game: GameState): void {
    // Check if game is over
    if (GameRules.isGameOver(game)) {
      this.endGame(game.id);
    }
  }
  
  /**
   * Next turn
   */
  private nextTurn(game: GameState): void {
    game.currentTurn++;
    this.startTurn(game.id);
  }
  
  /**
   * End game
   */
  private endGame(gameId: GameId): void {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`[GAME] endGame: Game not found for id ${gameId}`);
      return;
    }
    
    console.log(`[GAME] Ending game ${gameId}, room: ${game.roomCode}`);
    console.log(`[GAME] Final scores:`, game.players.map(p => ({ username: p.username, points: p.points })));
    
    game.status = 'finished';
    game.endedAt = Date.now();
    
    // Award end-game role bonuses
    if (game.options.modules?.hiddenRoles) {
      RoleManager.awardEndGameRoles(game);
    }
    
    // Clear timer
    const timer = this.phaseTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.phaseTimers.delete(gameId);
    }
    
    // Cleanup bot AIs
    for (const player of game.players) {
      if (player.isBot) {
        this.botAIs.delete(player.id);
      }
    }
    
    console.log(`[GAME] Game ${gameId} ended, status: ${game.status}`);
  }
  
  /**
   * Player places bet
   */
  placeBet(gameId: GameId, playerId: PlayerId, amount: number): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'betting') return false;
    
    const player = game.players.find(p => p.id === playerId);
    if (!player || player.isInBreak) return false;
    
    if (!GameRules.isValidBet(amount, player, game)) return false;
    
    player.currentBet = amount;
    return true;
  }
  
  /**
   * Player plays card
   */
  playCard(
    gameId: GameId,
    playerId: PlayerId,
    cardId: string,
    targetId?: PlayerId
  ): boolean {
    const game = this.games.get(gameId);
    if (!game || !game.options.modules?.specialCards) return false;
    
    // Check if cards are blocked by event
    if (game.currentEvent?.effect === 'cards_blocked') {
      console.log(`[GAME] Cards are blocked by event: ${game.currentEvent.name}`);
      return false;
    }
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) return false;
    
    // Allow cards to be played in planning phase (before_bet cards) or instant_cards phase
    // Also allow in resolution phase for after_reveal cards
    const canPlayInPhase = game.phase === 'planning' || game.phase === 'instant_cards' || game.phase === 'resolution';
    if (!canPlayInPhase) {
      console.log(`[GAME] Cannot play card in phase: ${game.phase}`);
      return false;
    }
    
    return CardManager.playCard(game, player, cardId, targetId);
  }
  
  /**
   * Get game state
   */
  getGame(gameId: GameId): GameState | undefined {
    return this.games.get(gameId);
  }
  
  /**
   * Get game by room code
   */
  getGameByRoomCode(roomCode: RoomCode): GameState | undefined {
    return Array.from(this.games.values()).find(g => g.roomCode === roomCode);
  }
  
  /**
   * Delete game
   */
  deleteGame(gameId: GameId): void {
    const timer = this.phaseTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.phaseTimers.delete(gameId);
    }
    
    this.games.delete(gameId);
  }
  
  /**
   * Get game count
   */
  getGameCount(): number {
    return this.games.size;
  }
  
  /**
   * Generate unique game ID
   */
  private generateGameId(): GameId {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

