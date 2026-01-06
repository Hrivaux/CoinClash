// ============================================
// CORE TYPES - Coin Clash Online
// ============================================

export type PlayerId = string;
export type RoomCode = string;
export type GameId = string;

// ============================================
// PLAYER
// ============================================

export interface Player {
  id: PlayerId;
  username: string;
  avatar?: string;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  
  // In-game state
  coins: number;
  points: number;
  currentBet: number | null;
  hand: Card[];
  
  // Stats
  stats: PlayerStats;
  
  // Status
  isReady: boolean;
  isConnected: boolean;
  isInBreak: boolean; // "Travail" mode when at 0 coins
  
  // Hidden info (server-only)
  secretRole?: Role;
  
  // Role tracking
  saboteurTriggered?: boolean; // Track if saboteur role was already triggered
}

export interface PlayerStats {
  wins: number;
  uniqueWins: number;
  totalBets: number;
  averageBet: number;
  cardsPlayed: number;
  turnsInBreak: number;
}

export type BotDifficulty = 'rookie' | 'analyst' | 'trickster' | 'shark';

// ============================================
// GAME CONFIG
// ============================================

export interface GameOptions {
  mode: GameMode;
  
  // Economy
  startingCoins: number;
  coinCap: number;
  minBet: number;
  maxBet: number;
  
  // Win conditions
  pointsToWin: number;
  maxTurns: number;
  
  // Modules
  modules: {
    dynamicEconomy: boolean;
    specialCards: boolean;
    randomEvents: boolean;
    hiddenRoles: boolean;
    chat: boolean;
    leaderboard: boolean;
  };
  
  // Room settings
  maxPlayers: number;
  allowBots: boolean;
  isPrivate: boolean;
}

export type GameMode = 'standard' | 'sprint';

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  mode: 'standard',
  startingCoins: 60,
  coinCap: 120,
  minBet: 1,
  maxBet: 12,
  pointsToWin: 50,
  maxTurns: 30,
  modules: {
    dynamicEconomy: true,
    specialCards: true,
    randomEvents: true,
    hiddenRoles: true,
    chat: true,
    leaderboard: true,
  },
  maxPlayers: 6,
  allowBots: true,
  isPrivate: true,
};

export const SPRINT_MODE_OPTIONS: Partial<GameOptions> = {
  mode: 'sprint',
  pointsToWin: 20,
  maxTurns: 12,
};

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  id: GameId;
  roomCode: RoomCode;
  options: GameOptions;
  
  players: Player[];
  hostId: PlayerId;
  
  status: GameStatus;
  currentTurn: number;
  phase: GamePhase;
  
  // Turn state
  currentEvent?: GameEvent;
  playedCards: PlayedCard[];
  turnHistory: TurnResult[];
  
  // Card effects tracking
  doubledBets?: Set<PlayerId>; // Players who played "double" card
  shieldedPlayers?: Set<PlayerId>; // Players who played "shield" card
  reverseMode?: boolean; // If "reverse" card was played
  fakeBets?: Record<PlayerId, number>; // Fake bets for "mirage" card
  spyReveals?: Map<PlayerId, number | null>; // Spy reveals (playerId -> target's bet)
  
  // Timers
  phaseTimer?: number; // seconds remaining
  phaseDeadline?: number; // timestamp
  
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

export type GameStatus = 'waiting' | 'starting' | 'playing' | 'finished';

export type GamePhase = 
  | 'event'          // A: Event display
  | 'planning'       // B: Card usage, chat, spy
  | 'betting'        // C: Secret bet
  | 'instant_cards'  // D: Double, Shield, Sabotage
  | 'reveal'         // E: Simultaneous reveal
  | 'resolution'     // F: Calculate winner
  | 'end_turn';      // G: Stats update

// ============================================
// TURN & RESULTS
// ============================================

export interface TurnResult {
  turnNumber: number;
  event?: GameEvent;
  bets: Record<PlayerId, number>;
  playedCards: PlayedCard[];
  winner?: PlayerId;
  rewards: Record<PlayerId, TurnReward>;
  timestamp: number;
}

export interface TurnReward {
  pointsGained: number;
  coinsGained: number;
  coinsLost: number;
  bonuses: string[]; // Descriptions of bonuses
}

// ============================================
// CARDS
// ============================================

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  rarity: CardRarity;
  timing: CardTiming;
  canPlay: (game: GameState, player: Player) => boolean;
  effect: (game: GameState, player: Player, target?: Player) => void;
}

export type CardType = 
  // Before betting (Phase B)
  | 'spy'           // See opponent's bet
  | 'scan'          // See card count
  | 'silence'       // Block chat/emotes
  
  // During betting (Phase D)
  | 'double'        // Bet x2
  | 'shield'        // Don't lose coins
  | 'mirage'        // Fake bet display
  
  // After reveal (Phase F)
  | 'sabotage'      // Winner loses coins
  | 'steal'         // Gain point if unique but not highest
  | 'reverse';      // Lowest unique wins

export type CardRarity = 'common' | 'rare' | 'epic';

export type CardTiming = 'before_bet' | 'instant' | 'after_reveal';

export interface PlayedCard {
  cardId: string;
  cardType: CardType;
  playerId: PlayerId;
  targetId?: PlayerId;
  turnNumber: number;
  phase: GamePhase;
}

// ============================================
// EVENTS
// ============================================

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: EventEffect;
  modifyRules: (game: GameState) => void;
}

export type EventEffect =
  | 'bets_doubled'      // All bets x2 for calculation
  | 'smallest_wins'     // Lowest unique wins
  | 'ties_win'          // All tied players get +1 point
  | 'cards_blocked'     // No cards this turn
  | 'tax'               // -2 coins to all, +10 to winner
  | 'chaos'             // Random bet redistribution
  | 'lucky_seven'       // Bet 7 = double rewards
  | 'copycat'           // Same bets = both win
  | 'bounty'            // Highest bet wins +5 coins
  | 'charity';          // Losers get +2 coins

// ============================================
// ROLES
// ============================================

export interface Role {
  id: string;
  name: string;
  description: string;
  secret: boolean;
  checkCondition: (game: GameState, player: Player) => boolean;
  reward: number; // Points awarded
}

export type RoleType = 
  | 'banker'      // +1 point if ≥70 coins at turn end
  | 'saboteur'    // +2 points first time someone hits 0
  | 'fox'         // +6 points if never accused correctly
  | 'warrior'     // +1 point per 2-turn win streak
  | 'trickster'   // +2 points for winning with bet ≤3
  | 'economist';  // +1 point for each turn at exactly 50 coins

// ============================================
// SOCIAL
// ============================================

export interface Friend {
  id: PlayerId;
  username: string;
  avatar?: string;
  status: UserStatus;
  addedAt: number;
}

export type UserStatus = 'online' | 'in_game' | 'away' | 'offline';

export interface Invitation {
  id: string;
  fromId: PlayerId;
  fromUsername: string;
  toId: PlayerId;
  roomCode: RoomCode;
  createdAt: number;
  expiresAt: number;
}

export interface LobbyInvitation {
  id: string;
  fromId: string; // Supabase user ID
  fromUsername: string;
  roomCode: RoomCode;
  createdAt: number;
}

export interface Room {
  code: RoomCode;
  hostId: PlayerId;
  players: Player[];
  options: GameOptions;
  status: 'waiting' | 'starting' | 'in_progress';
  createdAt: number;
}

// ============================================
// PROGRESSION
// ============================================

export interface UserProfile {
  id: PlayerId;
  username: string;
  email?: string;
  avatar?: string;
  
  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Cosmetics
  unlockedSkins: string[];
  unlockedTitles: string[];
  unlockedAnimations: string[];
  equippedSkin?: string;
  equippedTitle?: string;
  
  // Stats
  globalStats: GlobalStats;
  badges: Badge[];
  
  // Social
  friends: PlayerId[];
  
  createdAt: number;
}

export interface GlobalStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  totalCoins: number;
  uniqueWins: number;
  cardsPlayed: number;
  favoriteCard?: CardType;
  winRate: number;
  averageBet: number;
  longestWinStreak: number;
  timePlayedMinutes: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: number;
}

// ============================================
// SOCKET EVENTS
// ============================================

export interface ServerToClientEvents {
  // Room events
  'room:joined': (room: Room) => void;
  'room:updated': (room: Room) => void;
  'room:player_joined': (player: Player) => void;
  'room:player_left': (playerId: PlayerId) => void;
  
  // Game events
  'game:started': (game: GameState) => void;
  'game:phase_changed': (phase: GamePhase, timer: number) => void;
  'game:event_triggered': (event: GameEvent) => void;
  'game:card_played': (card: PlayedCard) => void;
  'game:bets_revealed': (bets: Record<PlayerId, number>) => void;
  'game:turn_result': (result: TurnResult) => void;
  'game:ended': (finalState: GameState, rankings: PlayerRanking[]) => void;
  'game:state': (game: GameState) => void;
  'game:chat_message': (data: { playerId: PlayerId; username: string; message: string; timestamp: number }) => void;
  'leaderboard:updated': (entries: LeaderboardEntry[]) => void;
  'rooms:public_updated': (rooms: PublicRoomInfo[]) => void;
  
  // Social
  'friend:request': (from: Friend) => void;
  'friend:accepted': (friend: Friend) => void;
  'invitation:received': (invitation: Invitation) => void;
  'lobby:invitation_received': (invitation: LobbyInvitation) => void;
  
  // Errors
  'error': (message: string) => void;
}

export interface LeaderboardEntry {
  userId: string
  username: string
  level: number
  xp: number
  gamesWon: number
  gamesPlayed: number
  rank: number
}

export interface PublicRoomInfo {
  code: RoomCode
  hostUsername: string
  playerCount: number
  maxPlayers: number
  mode: GameMode
  pointsToWin: number
  maxTurns?: number
  modules: GameOptions['modules']
  createdAt: number
}

export interface ClientToServerEvents {
  // Room actions
  'room:create': (options: GameOptions, callback: (roomCode: RoomCode) => void) => void;
  'room:join': (roomCode: RoomCode, callback: (success: boolean) => void) => void;
  'room:leave': () => void;
  'room:ready': (ready: boolean) => void;
  'room:start': () => void;
  'room:add_bot': (difficulty: BotDifficulty) => void;
  
  // Game actions
  'game:place_bet': (amount: number) => void;
  'game:play_card': (cardId: string, targetId?: PlayerId) => void;
  'game:next_turn': () => void;
  'game:chat_send': (roomCode: RoomCode, message: string) => void;
  'leaderboard:get': (limit: number, callback: (entries: LeaderboardEntry[]) => void) => void;
  'rooms:public_list': (callback: (rooms: PublicRoomInfo[]) => void) => void;
  'room:invite_friends': (friendIds: string[], callback: (success: boolean) => void) => void;
  
  // Social
  'friend:add': (username: string) => void;
  'friend:accept': (friendId: PlayerId) => void;
  'friend:remove': (friendId: PlayerId) => void;
  'invite:send': (friendId: PlayerId, roomCode: RoomCode) => void;
  'invite:accept': (inviteId: string) => void;
}

export interface PlayerRanking {
  player: Player;
  rank: number;
  finalPoints: number;
  finalCoins: number;
  turnsWon: number;
  badges: Badge[];
  xpGained: number;
}

