import { GameState, Player, GameOptions, TurnReward } from '../types';

/**
 * Economy System - Manages coins, rewards, and balance
 */

export class EconomyManager {
  /**
   * Calculate reward for winning a turn
   */
  static calculateWinReward(
    game: GameState,
    winner: Player
  ): TurnReward {
    const options = game.options;
    const bonuses: string[] = [];
    
    // Récompense de victoire dynamique basée sur la mise
    let pointsGained = 1;  // Base: 1 point
    let coinsGained = Math.ceil((winner.currentBet || 0) * 0.6); // 60% de la mise misée
    let coinsLost = winner.currentBet || 0;
    
    // Minimum de 2 pièces gagnées même si on mise petit
    if (coinsGained < 2) {
      coinsGained = 2;
    }
    
    // Bonus de risque: si tu mises beaucoup, tu gagnes plus
    const betRatio = (winner.currentBet || 0) / options.maxBet;
    if (betRatio >= 0.75) {
      pointsGained += 1;  // +1 point si tu mises 75% du max
      bonuses.push('Risk bonus: +1 point for high bet');
    }
    
    // Module: Dynamic Economy
    if (options.modules.dynamicEconomy) {
      // Anti-snowball: if winner is far ahead, reduce rewards
      const avgCoins = game.players.reduce((sum, p) => sum + p.coins, 0) / game.players.length;
      if (winner.coins > avgCoins * 1.5) {
        coinsGained = Math.max(1, Math.floor(coinsGained * 0.7));
        bonuses.push('Leader penalty: -30% coins');
      }
      
      // Comeback bonus: if winner is below average
      if (winner.coins < avgCoins * 0.6) {
        coinsGained = Math.ceil(coinsGained * 1.5);
        bonuses.push('Comeback bonus: +50% coins');
      }
    }
    
    return {
      pointsGained,
      coinsGained,
      coinsLost,
      bonuses,
    };
  }
  
  /**
   * Calculate reward for losing a turn
   */
  static calculateLoseReward(
    game: GameState,
    player: Player
  ): TurnReward {
    const options = game.options;
    const bonuses: string[] = [];
    
    let pointsGained = 0;
    let coinsGained = 0;
    let coinsLost = player.currentBet || 0;
    
    // Losers with very low coins get a small recovery boost
    const avgCoins = game.players.reduce((sum, p) => sum + p.coins, 0) / game.players.length;
    if (player.coins - coinsLost < avgCoins * 0.3) {
      // If you'd fall below 30% of average, get some compensation
      coinsGained = Math.ceil(coinsLost * 0.25); // Recover 25% of your lost bet
      bonuses.push('Low balance recovery: +' + coinsGained + ' coins');
    }
    
    // Check for "shield" card: player doesn't lose coins
    if (game.shieldedPlayers?.has(player.id)) {
      coinsLost = 0;
      bonuses.push('Shield card: coins protected');
    }
    
    // Event modifiers
    if (game.currentEvent) {
      if (game.currentEvent.effect === 'charity') {
        coinsGained += 3; // Charity gives more help
        bonuses.push('Charity event: +3 coins');
      }
    }
    
    return {
      pointsGained,
      coinsGained,
      coinsLost,
      bonuses,
    };
  }
  
  /**
   * Calculate reward when no one wins (no unique bet)
   */
  static calculateNoWinnerReward(
    game: GameState,
    player: Player
  ): TurnReward {
    const bonuses: string[] = [];
    
    let coinsLost = player.currentBet || 0;
    let coinsGained = Math.ceil(coinsLost * 0.5); // Return 50% of bet as compensation
    if (coinsGained < 1) coinsGained = 1;
    
    bonuses.push('Tie compensation: +'  + coinsGained + ' coin(s)');
    
    return {
      pointsGained: 0,
      coinsGained,
      coinsLost,
      bonuses,
    };
  }
  
  /**
   * Handle "break" mode when player reaches 0 coins
   */
  static handleBreakMode(player: Player): void {
    player.isInBreak = true;
    player.coins = 10; // Reduced from 18 to 10 - more risky
  }
  
  /**
   * Apply coin cap
   */
  static applyCoinCap(player: Player, cap: number): void {
    if (player.coins > cap) {
      player.coins = cap;
    }
  }
  
  /**
   * Check if player is in last place (by points)
   */
  static isLastPlace(game: GameState, player: Player): boolean {
    const minPoints = Math.min(...game.players.map(p => p.points));
    return player.points === minPoints && minPoints < Math.max(...game.players.map(p => p.points));
  }
  
  /**
   * Apply turn rewards to player
   */
  static applyReward(player: Player, reward: TurnReward, coinCap: number): void {
    player.points += reward.pointsGained;
    player.coins += reward.coinsGained;
    player.coins -= reward.coinsLost;
    
    // Ensure coins don't go negative
    if (player.coins < 0) {
      player.coins = 0;
    }
    
    // Apply coin cap
    this.applyCoinCap(player, coinCap);
    
    // Check for break mode
    if (player.coins === 0 && !player.isInBreak) {
      this.handleBreakMode(player);
    }
  }
  
  /**
   * Get XP for game result
   */
  static calculateXPGain(
    rank: number,
    totalPlayers: number,
    turnsWon: number,
    badgesEarned: number
  ): number {
    // Base XP
    let xp = 50;
    
    // Rank bonus (1st = 100, 2nd = 75, 3rd = 50, etc.)
    const rankBonus = Math.max(0, 100 - (rank - 1) * 25);
    xp += rankBonus;
    
    // Turn wins
    xp += turnsWon * 5;
    
    // Badge bonus
    xp += badgesEarned * 20;
    
    // Participation bonus
    xp += Math.floor(totalPlayers * 10);
    
    return xp;
  }
  
  /**
   * Calculate XP needed for next level
   */
  static getXPForLevel(level: number): number {
    // Progressive XP curve: level^1.5 * 100
    return Math.floor(Math.pow(level, 1.5) * 100);
  }
}

