import { GameEvent, EventEffect, GameState, PlayerId } from "../types";

/**
 * Random Events System - Keeps gameplay fresh
 */

export const EVENT_LIBRARY: Record<EventEffect, Omit<GameEvent, "id">> = {
  bets_doubled: {
    name: "Mises Doublées",
    description: "Toutes les mises sont x2 pour déterminer le gagnant",
    icon: "💥",
    effect: "bets_doubled",
    modifyRules: (game) => {
      // Handled in winner determination
    },
  },

  smallest_wins: {
    name: "Le Petit Gagne",
    description: "La plus petite mise unique remporte le tour",
    icon: "🐭",
    effect: "smallest_wins",
    modifyRules: (game) => {
      // Handled in winner determination
    },
  },

  ties_win: {
    name: "Égalité Payante",
    description: "Tous les joueurs à égalité gagnent +1 point",
    icon: "⚖️",
    effect: "ties_win",
    modifyRules: (game) => {
      // Multiple winners possible
    },
  },

  cards_blocked: {
    name: "Blocage",
    description: "Aucune carte ne peut être jouée ce tour",
    icon: "🚫",
    effect: "cards_blocked",
    modifyRules: (game) => {
      // Prevent card plays
    },
  },

  tax: {
    name: "Taxe",
    description: "Tous perdent 2 pièces, le gagnant reçoit +10",
    icon: "🏦",
    effect: "tax",
    modifyRules: (game) => {
      // Deduct 2 coins from everyone at start
      for (const player of game.players) {
        if (!player.isInBreak) {
          player.coins = Math.max(0, player.coins - 2);
        }
      }
    },
  },

  chaos: {
    name: "Chaos",
    description: "Les mises sont redistribuées aléatoirement !",
    icon: "🌀",
    effect: "chaos",
    modifyRules: (game) => {
      // Shuffle bets between players
      const bets: Array<{ playerId: PlayerId; bet: number }> = [];
      for (const player of game.players) {
        if (player.currentBet !== null && !player.isInBreak) {
          bets.push({ playerId: player.id, bet: player.currentBet });
        }
      }

      // Shuffle bets
      const shuffledBets = [...bets].sort(() => Math.random() - 0.5);

      // Redistribute
      for (let i = 0; i < bets.length; i++) {
        const player = game.players.find((p) => p.id === bets[i].playerId);
        if (player) {
          player.currentBet = shuffledBets[i].bet;
        }
      }
    },
  },

  lucky_seven: {
    name: "Lucky 7",
    description: "Miser 7 = récompenses doublées",
    icon: "🎰",
    effect: "lucky_seven",
    modifyRules: (game) => {
      // Handled in reward calculation
    },
  },

  copycat: {
    name: "Copycat",
    description: "Les mises identiques gagnent toutes",
    icon: "👯",
    effect: "copycat",
    modifyRules: (game) => {
      // Multiple winners with same bet
    },
  },

  bounty: {
    name: "Prime",
    description: "La mise la plus haute gagne +5 pièces bonus",
    icon: "💰",
    effect: "bounty",
    modifyRules: (game) => {
      // Handled in reward calculation
    },
  },

  charity: {
    name: "Charité",
    description: "Tous les perdants reçoivent +2 pièces",
    icon: "❤️",
    effect: "charity",
    modifyRules: (game) => {
      // Handled in reward calculation
    },
  },
};

/**
 * Event Manager - Handles random event selection and application
 */
export class EventManager {
  /**
   * Generate random event for turn
   */
  static generateRandomEvent(): GameEvent | null {
    // 70% chance of event occurring
    if (Math.random() > 0.7) {
      return null;
    }

    const effects = Object.keys(EVENT_LIBRARY) as EventEffect[];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    return {
      id: this.generateEventId(),
      ...EVENT_LIBRARY[randomEffect],
    };
  }

  /**
   * Apply event to game
   */
  static applyEvent(game: GameState, event: GameEvent | null): void {
    if (!event) {
      game.currentEvent = undefined;
      return;
    }

    game.currentEvent = event;
    event.modifyRules(game);
  }

  /**
   * Get event by effect type
   */
  static getEventByEffect(effect: EventEffect): GameEvent {
    return {
      id: this.generateEventId(),
      ...EVENT_LIBRARY[effect],
    };
  }

  /**
   * Check if event allows card plays
   */
  static canPlayCards(game: GameState): boolean {
    return game.currentEvent?.effect !== "cards_blocked";
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
