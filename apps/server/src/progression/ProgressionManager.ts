import {
  UserProfile,
  PlayerId,
  Badge,
  GlobalStats,
  Player,
  GameState,
} from '@coin-clash/shared';
import { EconomyManager } from '@coin-clash/shared';

/**
 * Progression Manager - Handles XP, levels, badges, cosmetics
 */
export class ProgressionManager {
  private profiles: Map<PlayerId, UserProfile> = new Map();
  
  /**
   * Get or create user profile
   */
  getProfile(userId: PlayerId, username: string): UserProfile {
    let profile = this.profiles.get(userId);
    
    if (!profile) {
      profile = this.createProfile(userId, username);
      this.profiles.set(userId, profile);
    }
    
    return profile;
  }
  
  /**
   * Create new profile
   */
  private createProfile(userId: PlayerId, username: string): UserProfile {
    return {
      id: userId,
      username,
      level: 1,
      xp: 0,
      xpToNextLevel: EconomyManager.getXPForLevel(2),
      unlockedSkins: ['default'],
      unlockedTitles: ['Novice'],
      unlockedAnimations: ['default'],
      globalStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalPoints: 0,
        totalCoins: 0,
        uniqueWins: 0,
        cardsPlayed: 0,
        winRate: 0,
        averageBet: 0,
        longestWinStreak: 0,
        timePlayedMinutes: 0,
      },
      badges: [],
      friends: [],
      createdAt: Date.now(),
    };
  }
  
  /**
   * Award XP and handle level up
   */
  awardXP(userId: PlayerId, xp: number): { leveled: boolean; newLevel?: number } {
    const profile = this.profiles.get(userId);
    if (!profile) return { leveled: false };
    
    profile.xp += xp;
    
    // Check for level up
    let leveled = false;
    let newLevel = profile.level;
    
    while (profile.xp >= profile.xpToNextLevel) {
      profile.xp -= profile.xpToNextLevel;
      profile.level++;
      newLevel = profile.level;
      leveled = true;
      
      profile.xpToNextLevel = EconomyManager.getXPForLevel(profile.level + 1);
      
      // Award level-up rewards
      this.awardLevelRewards(profile);
    }
    
    return { leveled, newLevel };
  }
  
  /**
   * Award rewards for leveling up
   */
  private awardLevelRewards(profile: UserProfile): void {
    const level = profile.level;
    
    // Unlock skins at certain levels
    if (level === 5) {
      profile.unlockedSkins.push('gold');
    } else if (level === 10) {
      profile.unlockedSkins.push('diamond');
    } else if (level === 20) {
      profile.unlockedSkins.push('cosmic');
    }
    
    // Unlock titles
    if (level === 5) {
      profile.unlockedTitles.push('Veteran');
    } else if (level === 10) {
      profile.unlockedTitles.push('Expert');
    } else if (level === 20) {
      profile.unlockedTitles.push('Master');
    } else if (level === 50) {
      profile.unlockedTitles.push('Legend');
    }
    
    // Unlock animations
    if (level === 15) {
      profile.unlockedAnimations.push('sparkle');
    } else if (level === 30) {
      profile.unlockedAnimations.push('explosion');
    }
  }
  
  /**
   * Update stats after game
   */
  updateStatsAfterGame(userId: PlayerId, game: GameState, rank: number): void {
    const profile = this.profiles.get(userId);
    if (!profile) return;
    
    const player = game.players.find(p => p.id === userId);
    if (!player) return;
    
    const stats = profile.globalStats;
    
    // Update stats
    stats.gamesPlayed++;
    if (rank === 1) {
      stats.gamesWon++;
    }
    
    stats.totalPoints += player.points;
    stats.totalCoins += player.coins;
    stats.uniqueWins += player.stats.uniqueWins;
    stats.cardsPlayed += player.stats.cardsPlayed;
    
    // Recalculate win rate
    stats.winRate = stats.gamesWon / stats.gamesPlayed;
    
    // Update average bet
    const totalBets = player.stats.totalBets;
    const turnsPlayed = game.currentTurn;
    if (turnsPlayed > 0) {
      stats.averageBet = totalBets / turnsPlayed;
    }
    
    // Time played (approximate)
    const gameDuration = game.endedAt ? (game.endedAt - (game.startedAt || 0)) : 0;
    stats.timePlayedMinutes += Math.floor(gameDuration / 60000);
    
    // Check for new badges
    this.checkBadges(profile, player, game);
  }
  
  /**
   * Check and award badges
   */
  private checkBadges(profile: UserProfile, player: Player, game: GameState): void {
    const newBadges: Badge[] = [];
    
    // First Win
    if (profile.globalStats.gamesWon === 1 && !this.hasBadge(profile, 'first_win')) {
      newBadges.push(this.createBadge('first_win', 'First Victory', 'Win your first game', '🏆', 'common'));
    }
    
    // High Roller (win with bet 12)
    const wonWithMax = game.turnHistory.some(
      turn => turn.winner === player.id && turn.bets[player.id] === 12
    );
    if (wonWithMax && !this.hasBadge(profile, 'high_roller')) {
      newBadges.push(this.createBadge('high_roller', 'High Roller', 'Win a turn with max bet', '💎', 'rare'));
    }
    
    // Underdog (win with bet 1-3 five times)
    const underdogWins = game.turnHistory.filter(
      turn => turn.winner === player.id && (turn.bets[player.id] ?? 0) <= 3
    ).length;
    if (underdogWins >= 5 && !this.hasBadge(profile, 'underdog')) {
      newBadges.push(this.createBadge('underdog', 'Underdog', 'Win 5 turns with bet ≤3', '🐭', 'epic'));
    }
    
    // Survivor (survive at 0 coins twice)
    if (player.stats.turnsInBreak >= 2 && !this.hasBadge(profile, 'survivor')) {
      newBadges.push(this.createBadge('survivor', 'Survivor', 'Use recovery mode twice', '💪', 'rare'));
    }
    
    // Win Streak (win 3 turns in a row)
    let maxStreak = 0;
    let currentStreak = 0;
    for (const turn of game.turnHistory) {
      if (turn.winner === player.id) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    if (maxStreak >= 3 && !this.hasBadge(profile, 'win_streak')) {
      newBadges.push(this.createBadge('win_streak', 'On Fire', 'Win 3 turns in a row', '🔥', 'epic'));
    }
    
    // Card Master (play 10 cards in one game)
    if (player.stats.cardsPlayed >= 10 && !this.hasBadge(profile, 'card_master')) {
      newBadges.push(this.createBadge('card_master', 'Card Master', 'Play 10 cards in one game', '🃏', 'rare'));
    }
    
    // 100 Games
    if (profile.globalStats.gamesPlayed === 100 && !this.hasBadge(profile, 'veteran')) {
      newBadges.push(this.createBadge('veteran', 'Veteran', 'Play 100 games', '⭐', 'legendary'));
    }
    
    // Add new badges
    for (const badge of newBadges) {
      profile.badges.push(badge);
    }
  }
  
  /**
   * Check if profile has badge
   */
  private hasBadge(profile: UserProfile, badgeId: string): boolean {
    return profile.badges.some(b => b.id === badgeId);
  }
  
  /**
   * Create badge
   */
  private createBadge(
    id: string,
    name: string,
    description: string,
    icon: string,
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  ): Badge {
    return {
      id,
      name,
      description,
      icon,
      rarity,
      unlockedAt: Date.now(),
    };
  }
  
  /**
   * Get leaderboard (top players by XP)
   */
  getLeaderboard(limit: number = 10): UserProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => {
        if (a.level !== b.level) {
          return b.level - a.level;
        }
        return b.xp - a.xp;
      })
      .slice(0, limit);
  }
}

