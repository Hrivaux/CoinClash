import { GameState, Player, PlayerId, TurnResult, TurnReward } from '../types';
import { EconomyManager } from './economy';

/**
 * Core Game Rules - Coin Clash Online
 */

export class GameRules {
  /**
   * Determine the winner of a turn based on bets
   * Core rule: UNIQUE highest bet wins
   */
  static determineWinner(
    bets: Record<PlayerId, number>,
    game?: GameState
  ): PlayerId | null {
    const betEntries = Object.entries(bets);
    
    if (betEntries.length === 0) {
      return null;
    }
    
    // Apply card effects: double
    const effectiveBets: Record<PlayerId, number> = {};
    for (const [playerId, bet] of betEntries) {
      let effectiveBet = bet;
      
      // Apply "double" card effect
      if (game?.doubledBets?.has(playerId)) {
        effectiveBet = bet * 2;
      }
      
      // Apply event "bets_doubled"
      if (game?.currentEvent?.effect === 'bets_doubled') {
        effectiveBet = bet * 2;
      }
      
      effectiveBets[playerId] = effectiveBet;
    }
    
    // Count occurrences of each effective bet amount
    const betCounts = new Map<number, number>();
    const betToPlayer = new Map<number, PlayerId[]>();
    
    for (const [playerId, bet] of Object.entries(effectiveBets)) {
      betCounts.set(bet, (betCounts.get(bet) || 0) + 1);
      
      if (!betToPlayer.has(bet)) {
        betToPlayer.set(bet, []);
      }
      betToPlayer.get(bet)!.push(playerId);
    }
    
    // Find unique bets (count === 1)
    const uniqueBets: number[] = [];
    for (const [bet, count] of betCounts.entries()) {
      if (count === 1) {
        uniqueBets.push(bet);
      }
    }
    
    // No unique bets = no winner
    if (uniqueBets.length === 0) {
      return null;
    }
    
    // Check for reverse mode (smallest unique wins)
    if (game?.reverseMode) {
      const lowestUnique = Math.min(...uniqueBets);
      const winners = betToPlayer.get(lowestUnique);
      return winners && winners.length > 0 ? winners[0] : null;
    }
    
    // Highest unique bet wins (standard)
    const highestUnique = Math.max(...uniqueBets);
    const winners = betToPlayer.get(highestUnique);
    
    return winners && winners.length > 0 ? winners[0] : null;
  }
  
  /**
   * Determine winner with event modification
   */
  static determineWinnerWithEvent(
    game: GameState,
    bets: Record<PlayerId, number>
  ): PlayerId | null {
    const event = game.currentEvent;
    
    // Handle special event rules
    if (event) {
      switch (event.effect) {
        case 'smallest_wins':
          return this.determineSmallestUniqueWinner(bets, game);
        
        case 'ties_win':
          return this.determineTieWinners(bets, game);
        
        case 'copycat':
          return this.determineCopycatWinners(bets, game);
        
        default:
          // Standard rule for other events (includes bets_doubled handling)
          return this.determineWinner(bets, game);
      }
    }
    
    // Standard rule (includes double card and reverse mode)
    return this.determineWinner(bets, game);
  }
  
  /**
   * Smallest unique bet wins (event rule)
   */
  private static determineSmallestUniqueWinner(
    bets: Record<PlayerId, number>,
    game?: GameState
  ): PlayerId | null {
    // Apply card effects: double
    const effectiveBets: Record<PlayerId, number> = {};
    for (const [playerId, bet] of Object.entries(bets)) {
      let effectiveBet = bet;
      if (game?.doubledBets?.has(playerId)) {
        effectiveBet = bet * 2;
      } else if (game?.currentEvent && game.currentEvent.effect === 'bets_doubled') {
        effectiveBet = bet * 2;
      }
      effectiveBets[playerId] = effectiveBet;
    }
    
    const betEntries = Object.entries(effectiveBets);
    const betCounts = new Map<number, number>();
    const betToPlayer = new Map<number, PlayerId[]>();
    
    for (const [playerId, bet] of betEntries) {
      betCounts.set(bet, (betCounts.get(bet) || 0) + 1);
      if (!betToPlayer.has(bet)) {
        betToPlayer.set(bet, []);
      }
      betToPlayer.get(bet)!.push(playerId);
    }
    
    const uniqueBets: number[] = [];
    for (const [bet, count] of betCounts.entries()) {
      if (count === 1) {
        uniqueBets.push(bet);
      }
    }
    
    if (uniqueBets.length === 0) {
      return null;
    }
    
    // LOWEST unique wins
    const lowestUnique = Math.min(...uniqueBets);
    const winners = betToPlayer.get(lowestUnique);
    
    return winners && winners.length > 0 ? winners[0] : null;
  }
  
  /**
   * Tied players all win (event rule)
   * Note: Returns first winner, but rewards should be applied to all tied players
   */
  private static determineTieWinners(
    bets: Record<PlayerId, number>,
    game?: GameState
  ): PlayerId | null {
    // Apply card effects (double card only, bets_doubled event doesn't apply here)
    const effectiveBets: Record<PlayerId, number> = {};
    for (const [playerId, bet] of Object.entries(bets)) {
      let effectiveBet = bet;
      if (game?.doubledBets?.has(playerId)) {
        effectiveBet = bet * 2;
      }
      effectiveBets[playerId] = effectiveBet;
    }
    
    // Find highest bet (can be multiple)
    const maxBet = Math.max(...Object.values(effectiveBets));
    const winners = Object.entries(effectiveBets)
      .filter(([_, bet]) => bet === maxBet)
      .map(([playerId]) => playerId);
    
    // Return first winner (rewards will be applied to all in processTurnResults)
    return winners.length > 0 ? winners[0] : null;
  }
  
  /**
   * Same bets = both win (event rule)
   * Note: Returns first winner, but rewards should be applied to all with same bet
   */
  private static determineCopycatWinners(
    bets: Record<PlayerId, number>,
    game?: GameState
  ): PlayerId | null {
    // Apply card effects (double card only, bets_doubled event doesn't apply here)
    const effectiveBets: Record<PlayerId, number> = {};
    for (const [playerId, bet] of Object.entries(bets)) {
      let effectiveBet = bet;
      if (game?.doubledBets?.has(playerId)) {
        effectiveBet = bet * 2;
      }
      effectiveBets[playerId] = effectiveBet;
    }
    
    // Find highest bet
    const maxBet = Math.max(...Object.values(effectiveBets));
    const winners = Object.entries(effectiveBets)
      .filter(([_, bet]) => bet === maxBet)
      .map(([playerId]) => playerId);
    
    // Return first winner (rewards will be applied to all in processTurnResults)
    return winners.length > 0 ? winners[0] : null;
  }
  
  /**
   * Check if game is over
   */
  static isGameOver(game: GameState): boolean {
    // Check point victory
    const hasPointWinner = game.players.some(
      p => p.points >= game.options.pointsToWin
    );
    
    // Check max turns
    const maxTurnsReached = game.currentTurn >= game.options.maxTurns;
    
    return hasPointWinner || maxTurnsReached;
  }
  
  /**
   * Get final rankings
   */
  static getFinalRankings(game: GameState): Player[] {
    return [...game.players].sort((a, b) => {
      // Sort by points (descending)
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      
      // Tiebreaker 1: coins
      if (a.coins !== b.coins) {
        return b.coins - a.coins;
      }
      
      // Tiebreaker 2: unique wins
      return b.stats.uniqueWins - a.stats.uniqueWins;
    });
  }
  
  /**
   * Validate bet amount
   */
  static isValidBet(amount: number, player: Player, game: GameState): boolean {
    const { minBet, maxBet } = game.options;
    
    // Check range
    if (amount < minBet || amount > maxBet) {
      return false;
    }
    
    // Check player has enough coins
    if (amount > player.coins) {
      return false;
    }
    
    // Check if player is in break mode
    if (player.isInBreak) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Process turn results
   */
  static processTurnResults(game: GameState): TurnResult {
    const bets: Record<PlayerId, number> = {};
    
    // Collect all bets
    for (const player of game.players) {
      if (player.currentBet !== null && !player.isInBreak) {
        bets[player.id] = player.currentBet;
      }
    }
    
    // Determine winner
    const winnerId = this.determineWinnerWithEvent(game, bets);
    
    // Handle special events: ties_win and copycat (multiple winners)
    let winners: PlayerId[] = [winnerId!].filter(Boolean);
    if (game.currentEvent) {
      if (game.currentEvent.effect === 'ties_win' || game.currentEvent.effect === 'copycat') {
        // Find all players with same effective bet as winner
        const effectiveBets: Record<PlayerId, number> = {};
        for (const [playerId, bet] of Object.entries(bets)) {
          let effectiveBet = bet;
          if (game.doubledBets?.has(playerId)) {
            effectiveBet = bet * 2;
          }
          // Note: bets_doubled event doesn't apply in ties_win/copycat events
          effectiveBets[playerId] = effectiveBet;
        }
        
        if (winnerId) {
          const winnerEffectiveBet = effectiveBets[winnerId];
          winners = Object.entries(effectiveBets)
            .filter(([_, bet]) => bet === winnerEffectiveBet)
            .map(([playerId]) => playerId);
        }
      }
    }
    
    // Apply sabotage card effect (reduce winner's coins by 6)
    for (const playedCard of game.playedCards) {
      if (playedCard.cardType === 'sabotage' && winnerId && playedCard.targetId === winnerId) {
        const winner = game.players.find(p => p.id === winnerId);
        if (winner) {
          winner.coins = Math.max(0, winner.coins - 6);
        }
      }
    }
    
    // Calculate rewards
    const rewards: Record<PlayerId, TurnReward> = {};
    
    for (const player of game.players) {
      if (player.isInBreak) {
        // Skip players in break mode
        rewards[player.id] = {
          pointsGained: 0,
          coinsGained: 18,
          coinsLost: 0,
          bonuses: ['Recovery mode: +18 coins'],
        };
        player.isInBreak = false;
        continue;
      }
      
      let reward: TurnReward;
      
      if (winners.includes(player.id)) {
        // Winner (or tied winner)
        reward = EconomyManager.calculateWinReward(game, player);
        player.stats.wins++;
        player.stats.uniqueWins++;
      } else if (winnerId === null) {
        // No winner
        reward = EconomyManager.calculateNoWinnerReward(game, player);
      } else {
        // Loser
        reward = EconomyManager.calculateLoseReward(game, player);
        
        // Check for "steal" card: if player had unique bet but didn't win, +1 point
        const playerBet = bets[player.id];
        if (playerBet !== undefined) {
          const betCount = Object.values(bets).filter(b => b === playerBet).length;
          if (betCount === 1) {
            // Player had unique bet
            const maxBet = Math.max(...Object.values(bets));
            if (playerBet < maxBet) {
              // Had unique bet but not highest - check if steal card was played
              const stealCard = game.playedCards.find(
                pc => pc.cardType === 'steal' && pc.playerId === player.id
              );
              if (stealCard) {
                player.points += 1;
                reward.pointsGained += 1;
                reward.bonuses.push('Steal card: +1 point');
              }
            }
          }
        }
      }
      
      // Apply reward
      EconomyManager.applyReward(player, reward, game.options.coinCap);
      rewards[player.id] = reward;
      
      // Update stats
      if (player.currentBet !== null) {
        player.stats.totalBets += player.currentBet;
        player.stats.averageBet = 
          player.stats.totalBets / (game.currentTurn + 1);
      }
    }
    
    // Create turn result
    const result: TurnResult = {
      turnNumber: game.currentTurn,
      event: game.currentEvent,
      bets,
      playedCards: game.playedCards,
      winner: winnerId ?? undefined,
      rewards,
      timestamp: Date.now(),
    };
    
    // Reset turn state
    for (const player of game.players) {
      player.currentBet = null;
    }
    game.playedCards = [];
    
    // Reset card effects for next turn
    if (game.doubledBets) game.doubledBets.clear();
    if (game.shieldedPlayers) game.shieldedPlayers.clear();
    game.reverseMode = false;
    game.fakeBets = {};
    if (game.spyReveals) game.spyReveals.clear();
    
    return result;
  }
  
  /**
   * Check if all players have bet
   */
  static allPlayersReady(game: GameState): boolean {
    return game.players.every(
      p => p.isInBreak || p.currentBet !== null || p.isBot
    );
  }
}

