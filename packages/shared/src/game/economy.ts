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
    
    let pointsGained = 2; // Base win reward
    let coinsGained = 8;  // Base win reward
    let coinsLost = winner.currentBet || 0;
    
    // Module: Dynamic Economy
    if (options.modules.dynamicEconomy) {
      // Anti-snowball: if winner has > 90 coins, reduce coin reward
      if (winner.coins >= 90) {
        coinsGained = Math.max(4, coinsGained - 2);
        bonuses.push('High balance penalty: -2 coins');
      }
      
      // Comeback bonus: if winner is last in points
      const isLastPlace = this.isLastPlace(game, winner);
      if (isLastPlace) {
        coinsGained += 2;
        bonuses.push('Comeback bonus: +2 coins');
      }
    }
    
    // Event modifiers
    if (game.currentEvent) {
      switch (game.currentEvent.effect) {
        case 'bounty':
          coinsGained += 5;
          bonuses.push('Bounty event: +5 coins');
          break;
        case 'tax':
          coinsGained += 10;
          bonuses.push('Tax pot: +10 coins');
          break;
        case 'lucky_seven':
          if (winner.currentBet === 7) {
            pointsGained *= 2;
            coinsGained *= 2;
            bonuses.push('Lucky 7: rewards doubled!');
          }
          break;
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
    let coinsGained = 0; // Losers don't receive coins (except special events)
    let coinsLost = player.currentBet || 0;
    
    // Check for "shield" card: player doesn't lose coins
    if (game.shieldedPlayers?.has(player.id)) {
      coinsLost = 0;
      bonuses.push('Shield card: coins protected');
    }
    
    // Event modifiers (only charity event gives coins to losers)
    if (game.currentEvent) {
      if (game.currentEvent.effect === 'charity') {
        coinsGained += 2;
        bonuses.push('Charity event: +2 coins');
      }
    }
    
    // Note: Removed dynamic economy compensation for losers
    // Losers should not receive coins when they lose
    
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
    let coinsGained = 1; // Compensation to avoid total poverty
    bonuses.push('No winner compensation: +1 coin');
    
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
    player.coins = 18; // Recovery amount
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

