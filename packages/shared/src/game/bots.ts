import { Player, BotDifficulty, GameState, CardType } from "../types";
import { GameRules } from "./rules";
import { CardManager } from "./cards";

/**
 * Bot AI System - Smart, adaptive bots with personalities
 */

interface BotPersonality {
  aggression: number; // 0-1: how likely to bet high
  riskAversion: number; // 0-1: how much they fear losing
  cardPreference: "attack" | "defense" | "info";
  tilt: number; // 0-1: increases after losses
  copycat: number; // 0-1: tendency to copy others
}

interface BetHistory {
  playerId: string;
  bets: number[]; // Last N bets
  wins: number;
  losses: number;
  avgBet: number;
}

/**
 * Bot AI Engine
 */
export class BotAI {
  private personality: BotPersonality;
  private difficulty: BotDifficulty;
  private betHistory: Map<string, BetHistory> = new Map();

  constructor(difficulty: BotDifficulty) {
    this.difficulty = difficulty;
    this.personality = this.generatePersonality(difficulty);
  }

  /**
   * Generate personality based on difficulty
   */
  private generatePersonality(difficulty: BotDifficulty): BotPersonality {
    switch (difficulty) {
      case "rookie":
        return {
          aggression: 0.3 + Math.random() * 0.2,
          riskAversion: 0.6 + Math.random() * 0.2,
          cardPreference: "defense",
          tilt: 0,
          copycat: 0.1,
        };

      case "analyst":
        return {
          aggression: 0.4 + Math.random() * 0.2,
          riskAversion: 0.4 + Math.random() * 0.2,
          cardPreference: "info",
          tilt: 0,
          copycat: 0.2,
        };

      case "trickster":
        return {
          aggression: 0.2 + Math.random() * 0.2,
          riskAversion: 0.3 + Math.random() * 0.2,
          cardPreference: "attack",
          tilt: 0,
          copycat: 0.05,
        };

      case "shark":
        return {
          aggression: 0.5 + Math.random() * 0.2,
          riskAversion: 0.2 + Math.random() * 0.2,
          cardPreference: "attack",
          tilt: 0,
          copycat: 0.3,
        };

      default:
        return this.generatePersonality("rookie");
    }
  }

  /**
   * Decide bet amount
   */
  decideBet(game: GameState, bot: Player): number {
    const { minBet, maxBet } = game.options;

    // Ensure bot has enough coins
    const maxAffordable = Math.min(maxBet, bot.coins);

    if (maxAffordable < minBet) {
      return minBet;
    }

    let bet: number;

    switch (this.difficulty) {
      case "rookie":
        bet = this.rookieBet(game, bot, minBet, maxAffordable);
        break;

      case "analyst":
        bet = this.analystBet(game, bot, minBet, maxAffordable);
        break;

      case "trickster":
        bet = this.tricksterBet(game, bot, minBet, maxAffordable);
        break;

      case "shark":
        bet = this.sharkBet(game, bot, minBet, maxAffordable);
        break;

      default:
        bet = this.rookieBet(game, bot, minBet, maxAffordable);
    }

    // Apply event modifiers
    bet = this.applyEventModifier(game, bet, minBet, maxAffordable);

    // Ensure valid bet
    return Math.max(minBet, Math.min(maxAffordable, Math.round(bet)));
  }

  /**
   * Rookie: Random with slight weighting
   */
  private rookieBet(
    game: GameState,
    bot: Player,
    min: number,
    max: number
  ): number {
    // Weighted towards middle values
    const range = max - min;
    const center = min + range / 2;
    const variance = range / 4;

    // Normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return center + z0 * variance;
  }

  /**
   * Analyst: Uses history and probabilities
   */
  private analystBet(
    game: GameState,
    bot: Player,
    min: number,
    max: number
  ): number {
    this.updateBetHistory(game);

    // Calculate average opponent bets
    const opponentAvg = this.getAverageOpponentBet(game, bot);

    // Calculate uniqueness probability for each bet
    const uniquenessProbability = this.calculateUniquenessProbability(
      game,
      min,
      max
    );

    // Find bet with highest expected value
    let bestBet = min;
    let bestScore = -Infinity;

    for (let bet = min; bet <= max; bet++) {
      const uniqueProb = uniquenessProbability.get(bet) || 0.5;
      const winProb = bet > opponentAvg ? 0.6 : 0.4;
      const expectedValue = uniqueProb * winProb * 10 - bet;

      if (expectedValue > bestScore) {
        bestScore = expectedValue;
        bestBet = bet;
      }
    }

    // Add some randomness
    const variance = (max - min) * 0.15;
    return bestBet + (Math.random() - 0.5) * variance;
  }

  /**
   * Trickster: Bluffs with small unique bets
   */
  private tricksterBet(
    game: GameState,
    bot: Player,
    min: number,
    max: number
  ): number {
    // 60% of time: bet very low (1-3)
    if (Math.random() < 0.6) {
      return Math.min(min + Math.floor(Math.random() * 3), max);
    }

    // 30% of time: bet medium
    if (Math.random() < 0.75) {
      const mid = min + (max - min) / 2;
      return mid + (Math.random() - 0.5) * (max - min) * 0.3;
    }

    // 10% of time: surprise high bet
    return max - Math.floor(Math.random() * 2);
  }

  /**
   * Shark: Meta-game, pattern recognition, optimal play
   */
  private sharkBet(
    game: GameState,
    bot: Player,
    min: number,
    max: number
  ): number {
    this.updateBetHistory(game);

    // Analyze patterns
    const patterns = this.analyzePatterns(game, bot);

    // Calculate bankroll management
    const bankrollFactor = bot.coins / game.options.startingCoins;
    const maxSafeBet = Math.floor(bot.coins * 0.2); // Never bet more than 20% of stack

    // Determine strategy based on game state
    let targetBet: number;

    if (game.currentTurn < 5) {
      // Early game: conservative
      targetBet = min + (max - min) * 0.3;
    } else if (game.currentTurn > game.options.maxTurns * 0.75) {
      // Late game: aggressive if behind
      const isLeading = this.isLeading(game, bot);
      if (isLeading) {
        targetBet = min + (max - min) * 0.4;
      } else {
        targetBet = max * 0.8;
      }
    } else {
      // Mid game: exploit patterns
      targetBet = this.exploitPatterns(patterns, min, max);
    }

    // Apply bankroll management
    targetBet = Math.min(targetBet, maxSafeBet);

    // Add controlled randomness to avoid being predictable
    const variance = (max - min) * 0.1;
    return targetBet + (Math.random() - 0.5) * variance;
  }

  /**
   * Apply event modifier to bet
   */
  private applyEventModifier(
    game: GameState,
    bet: number,
    min: number,
    max: number
  ): number {
    if (!game.currentEvent) return bet;

    switch (game.currentEvent.effect) {
      case "smallest_wins":
        // Bet low
        return Math.min(bet * 0.5, min + 2);

      case "bets_doubled":
        // Bet conservatively (effective bet is doubled)
        return bet * 0.7;

      case "lucky_seven":
        // 50% chance to bet 7
        return Math.random() < 0.5 ? 7 : bet;

      case "bounty":
        // Bet high
        return Math.max(bet * 1.3, max * 0.8);

      default:
        return bet;
    }
  }

  /**
   * Decide which card to play
   */
  decideCard(
    game: GameState,
    bot: Player
  ): { cardId: string; targetId?: string } | null {
    if (bot.hand.length === 0) return null;

    // Filter playable cards
    const playableCards = bot.hand.filter((card) => card.canPlay(game, bot));

    if (playableCards.length === 0) return null;

    // Prioritize cards based on difficulty and personality
    const prioritized = this.prioritizeCards(game, bot, playableCards);

    if (prioritized.length === 0) return null;

    const selectedCard = prioritized[0];

    // Select target if needed
    let targetId: string | undefined;
    if (this.cardNeedsTarget(selectedCard.type)) {
      targetId = this.selectTarget(game, bot, selectedCard.type);
    }

    return { cardId: selectedCard.id, targetId };
  }

  /**
   * Prioritize which cards to play
   */
  private prioritizeCards(game: GameState, bot: Player, cards: any[]): any[] {
    const scores = cards.map((card) => ({
      card,
      score: this.scoreCard(game, bot, card),
    }));

    scores.sort((a, b) => b.score - a.score);

    return scores.map((s) => s.card);
  }

  /**
   * Score card value
   */
  private scoreCard(game: GameState, bot: Player, card: any): number {
    let score = 0;

    switch (card.type) {
      case "spy":
        score = this.difficulty === "shark" ? 8 : 5;
        break;

      case "double":
        // High value if we have a good bet
        score = (bot.currentBet ?? 0) > 6 ? 9 : 3;
        break;

      case "shield":
        // High value if we're betting a lot
        score = (bot.currentBet ?? 0) > 8 ? 10 : 4;
        break;

      case "sabotage":
        // Use if we're losing
        score = this.isLeading(game, bot) ? 2 : 7;
        break;

      case "steal":
        score = 6;
        break;

      default:
        score = 5;
    }

    // Personality modifier
    if (
      this.personality.cardPreference === "attack" &&
      ["sabotage", "double"].includes(card.type)
    ) {
      score += 3;
    }

    if (
      this.personality.cardPreference === "defense" &&
      ["shield", "mirage"].includes(card.type)
    ) {
      score += 3;
    }

    if (
      this.personality.cardPreference === "info" &&
      ["spy", "scan"].includes(card.type)
    ) {
      score += 3;
    }

    return score;
  }

  /**
   * Check if card needs a target
   */
  private cardNeedsTarget(type: CardType): boolean {
    return ["spy", "scan", "silence", "sabotage"].includes(type);
  }

  /**
   * Select target for card
   */
  private selectTarget(
    game: GameState,
    bot: Player,
    cardType: CardType
  ): string {
    const opponents = game.players.filter(
      (p) => p.id !== bot.id && !p.isInBreak
    );

    if (opponents.length === 0) {
      return game.players[0].id;
    }

    // Target leader for sabotage
    if (cardType === "sabotage") {
      const leader = opponents.reduce((prev, curr) =>
        curr.points > prev.points ? curr : prev
      );
      return leader.id;
    }

    // Random for others
    return opponents[Math.floor(Math.random() * opponents.length)].id;
  }

  /**
   * Helper methods
   */

  private updateBetHistory(game: GameState): void {
    const lastTurn = game.turnHistory[game.turnHistory.length - 1];
    if (!lastTurn) return;

    for (const [playerId, bet] of Object.entries(lastTurn.bets)) {
      if (!this.betHistory.has(playerId)) {
        this.betHistory.set(playerId, {
          playerId,
          bets: [],
          wins: 0,
          losses: 0,
          avgBet: 0,
        });
      }

      const history = this.betHistory.get(playerId)!;
      history.bets.push(bet);

      if (history.bets.length > 5) {
        history.bets.shift();
      }

      history.avgBet =
        history.bets.reduce((a, b) => a + b, 0) / history.bets.length;

      if (lastTurn.winner === playerId) {
        history.wins++;
      } else {
        history.losses++;
      }
    }
  }

  private getAverageOpponentBet(game: GameState, bot: Player): number {
    const opponents = game.players.filter((p) => p.id !== bot.id);
    const avgBets = opponents.map(
      (p) => this.betHistory.get(p.id)?.avgBet ?? 6
    );
    return avgBets.reduce((a, b) => a + b, 0) / avgBets.length;
  }

  private calculateUniquenessProbability(
    game: GameState,
    min: number,
    max: number
  ): Map<number, number> {
    const probabilities = new Map<number, number>();

    // Simple model: less common bets have higher uniqueness probability
    for (let bet = min; bet <= max; bet++) {
      const frequency = this.getBetFrequency(bet);
      const uniqueProb = 1 / (1 + frequency);
      probabilities.set(bet, uniqueProb);
    }

    return probabilities;
  }

  private getBetFrequency(bet: number): number {
    let count = 0;
    for (const history of this.betHistory.values()) {
      count += history.bets.filter((b) => b === bet).length;
    }
    return count;
  }

  private analyzePatterns(game: GameState, bot: Player): any {
    // Simplified pattern analysis
    return {
      aggressivePlayers: this.findAggressivePlayers(game, bot),
      conservativePlayers: this.findConservativePlayers(game, bot),
      copycat: this.findCopycatPlayers(game, bot),
    };
  }

  private findAggressivePlayers(game: GameState, bot: Player): string[] {
    return game.players
      .filter((p) => p.id !== bot.id)
      .filter((p) => {
        const history = this.betHistory.get(p.id);
        return history && history.avgBet > 8;
      })
      .map((p) => p.id);
  }

  private findConservativePlayers(game: GameState, bot: Player): string[] {
    return game.players
      .filter((p) => p.id !== bot.id)
      .filter((p) => {
        const history = this.betHistory.get(p.id);
        return history && history.avgBet < 5;
      })
      .map((p) => p.id);
  }

  private findCopycatPlayers(game: GameState, bot: Player): string[] {
    // Simplified: players who often bet similar amounts
    return [];
  }

  private exploitPatterns(patterns: any, min: number, max: number): number {
    // Bet just above aggressive players' average
    if (patterns.aggressivePlayers.length > 0) {
      return min + (max - min) * 0.7;
    }

    // Bet medium if most are conservative
    if (patterns.conservativePlayers.length > 2) {
      return min + (max - min) * 0.5;
    }

    return min + (max - min) * 0.6;
  }

  private isLeading(game: GameState, bot: Player): boolean {
    const maxPoints = Math.max(...game.players.map((p) => p.points));
    return bot.points === maxPoints;
  }
}

/**
 * Bot Factory
 */
export class BotFactory {
  /**
   * Create a bot player
   */
  static createBot(difficulty: BotDifficulty, username?: string): Player {
    const botNames = {
      rookie: ["Novice", "Apprentice", "Débutant", "Rookie"],
      analyst: ["Calculateur", "Stratège", "Analyste", "Penseur"],
      trickster: ["Bluffeur", "Farceur", "Illusionniste", "Trickster"],
      shark: ["Requin", "Pro", "Champion", "Légende"],
    };

    // Validate difficulty, default to 'analyst' if invalid
    if (!difficulty || !botNames[difficulty as keyof typeof botNames]) {
      difficulty = "analyst";
    }

    const names = botNames[difficulty];
    if (!names || names.length === 0) {
      difficulty = "analyst";
    }

    const finalNames = botNames[difficulty];
    const randomName =
      finalNames[Math.floor(Math.random() * finalNames.length)];

    return {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: username || `${randomName} 🤖`,
      isBot: true,
      botDifficulty: difficulty,
      coins: 0, // Set by game initialization
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
      isReady: true,
      isConnected: true,
      isInBreak: false,
    };
  }
}
