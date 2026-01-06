import { Card, CardType, GameState, Player } from '../types';

/**
 * Special Cards System - Mind games & strategic depth
 */

export const CARD_LIBRARY: Record<CardType, Omit<Card, 'id'>> = {
  // ========================================
  // BEFORE BETTING (Phase B)
  // ========================================
  
  spy: {
    type: 'spy',
    name: 'Espion',
    description: 'Révèle la mise prévue d\'un adversaire',
    rarity: 'common',
    timing: 'before_bet',
    canPlay: (game, player) => {
      return game.phase === 'planning' && 
             game.players.filter(p => p.id !== player.id && !p.isInBreak).length > 0;
    },
    effect: (game, player, target) => {
      // Server-side: reveal target's bet to player
      // The bet will be sent via socket event in the handler
      // If target hasn't bet yet, we'll send null and update when they do
    },
  },
  
  scan: {
    type: 'scan',
    name: 'Scan',
    description: 'Révèle le nombre de cartes d\'un adversaire',
    rarity: 'common',
    timing: 'before_bet',
    canPlay: (game, player) => {
      return game.phase === 'planning' && 
             game.players.filter(p => p.id !== player.id).length > 0;
    },
    effect: (game, player, target) => {
      // Server-side: reveal target's card count
    },
  },
  
  silence: {
    type: 'silence',
    name: 'Silence',
    description: 'Bloque le chat/emotes d\'un joueur pour 1 tour',
    rarity: 'rare',
    timing: 'before_bet',
    canPlay: (game, player) => {
      return game.phase === 'planning' && 
             game.options.modules.chat &&
             game.players.filter(p => p.id !== player.id).length > 0;
    },
    effect: (game, player, target) => {
      // Server-side: mute target for this turn
    },
  },
  
  // ========================================
  // INSTANT (Phase D - During betting window)
  // ========================================
  
  double: {
    type: 'double',
    name: 'Double',
    description: 'Ta mise est doublée pour le calcul du gagnant',
    rarity: 'rare',
    timing: 'instant',
    canPlay: (game, player) => {
      return game.phase === 'instant_cards' && 
             player.currentBet !== null &&
             player.currentBet > 0;
    },
    effect: (game, player) => {
      // Mark player's bet as doubled for winner calculation
      if (!game.doubledBets) {
        game.doubledBets = new Set();
      }
      game.doubledBets.add(player.id);
    },
  },
  
  shield: {
    type: 'shield',
    name: 'Bouclier',
    description: 'Tu ne perds pas tes pièces si tu perds ce tour',
    rarity: 'rare',
    timing: 'instant',
    canPlay: (game, player) => {
      return game.phase === 'instant_cards' && 
             player.currentBet !== null;
    },
    effect: (game, player) => {
      // Mark player as shielded for this turn
      if (!game.shieldedPlayers) {
        game.shieldedPlayers = new Set();
      }
      game.shieldedPlayers.add(player.id);
    },
  },
  
  mirage: {
    type: 'mirage',
    name: 'Mirage',
    description: 'Les autres voient une fausse mise (révélée à la fin)',
    rarity: 'epic',
    timing: 'instant',
    canPlay: (game, player) => {
      return game.phase === 'instant_cards' && 
             player.currentBet !== null;
    },
    effect: (game, player) => {
      // Generate a fake bet (random between min and max, different from real bet)
      if (!game.fakeBets) {
        game.fakeBets = {};
      }
      const realBet = player.currentBet || 1;
      let fakeBet = realBet;
      while (fakeBet === realBet) {
        fakeBet = Math.floor(Math.random() * (game.options.maxBet - game.options.minBet + 1)) + game.options.minBet;
      }
      game.fakeBets[player.id] = fakeBet;
    },
  },
  
  // ========================================
  // AFTER REVEAL (Phase F)
  // ========================================
  
  sabotage: {
    type: 'sabotage',
    name: 'Sabotage',
    description: 'Le gagnant perd 6 pièces',
    rarity: 'epic',
    timing: 'after_reveal',
    canPlay: (game, player) => {
      return game.phase === 'resolution';
    },
    effect: (game, player, target) => {
      // Target should be the winner (set in CardManager.playCard)
      // The actual coin reduction is handled in processTurnResults
      // This just marks the card as played
    },
  },
  
  steal: {
    type: 'steal',
    name: 'Vol',
    description: 'Si tu as une mise unique mais pas la plus haute, +1 point',
    rarity: 'rare',
    timing: 'after_reveal',
    canPlay: (game, player) => {
      return game.phase === 'resolution';
    },
    effect: (game, player) => {
      // The effect is checked in processTurnResults after winner determination
      // This just marks the card as played
    },
  },
  
  reverse: {
    type: 'reverse',
    name: 'Reverse',
    description: 'Pour ce tour, la plus petite mise unique gagne',
    rarity: 'epic',
    timing: 'instant',
    canPlay: (game, player) => {
      return game.phase === 'instant_cards';
    },
    effect: (game, player) => {
      // Enable reverse mode for this turn
      game.reverseMode = true;
    },
  },
};

/**
 * Card Manager - Handles card operations
 */
export class CardManager {
  /**
   * Generate a random card
   */
  static generateRandomCard(): Card {
    const types = Object.keys(CARD_LIBRARY) as CardType[];
    const rarityWeights = {
      common: 0.6,
      rare: 0.3,
      epic: 0.1,
    };
    
    // Weighted random selection based on rarity
    const rand = Math.random();
    let targetRarity: 'common' | 'rare' | 'epic';
    
    if (rand < rarityWeights.common) {
      targetRarity = 'common';
    } else if (rand < rarityWeights.common + rarityWeights.rare) {
      targetRarity = 'rare';
    } else {
      targetRarity = 'epic';
    }
    
    // Filter cards by rarity
    const validTypes = types.filter(
      type => CARD_LIBRARY[type].rarity === targetRarity
    );
    
    // Fallback if no cards of that rarity
    const selectedType = validTypes.length > 0
      ? validTypes[Math.floor(Math.random() * validTypes.length)]
      : types[Math.floor(Math.random() * types.length)];
    
    return {
      id: this.generateCardId(),
      ...CARD_LIBRARY[selectedType],
    };
  }
  
  /**
   * Generate starting hand
   */
  static generateStartingHand(count: number = 3): Card[] {
    const hand: Card[] = [];
    for (let i = 0; i < count; i++) {
      hand.push(this.generateRandomCard());
    }
    return hand;
  }
  
  /**
   * Draw cards for player
   */
  static drawCards(player: Player, count: number, maxHandSize: number = 5): void {
    const currentSize = player.hand.length;
    const canDraw = Math.min(count, maxHandSize - currentSize);
    
    for (let i = 0; i < canDraw; i++) {
      player.hand.push(this.generateRandomCard());
    }
  }
  
  /**
   * Play a card
   */
  static playCard(
    game: GameState,
    player: Player,
    cardId: string,
    targetId?: string
  ): boolean {
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return false;
    }
    
    const card = player.hand[cardIndex];
    
    // Check if card can be played
    if (!card.canPlay(game, player)) {
      return false;
    }
    
    // Get target player if needed
    let target: Player | undefined;
    if (targetId) {
      target = game.players.find(p => p.id === targetId);
      if (!target) {
        return false;
      }
    }
    
    // Special handling for sabotage card: target will be set to winner in processTurnResults
    let actualTargetId = targetId;
    if (card.type === 'sabotage' && game.phase === 'resolution') {
      // Target will be determined after winner is known
      // For now, we'll record the card and handle it in processTurnResults
    }
    
    // Execute card effect
    card.effect(game, player, target);
    
    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    
    // Record played card
    game.playedCards.push({
      cardId,
      cardType: card.type,
      playerId: player.id,
      targetId: actualTargetId,
      turnNumber: game.currentTurn,
      phase: game.phase,
    });
    
    // Update stats
    player.stats.cardsPlayed++;
    
    return true;
  }
  
  /**
   * Check if player has specific card type
   */
  static hasCardType(player: Player, type: CardType): boolean {
    return player.hand.some(card => card.type === type);
  }
  
  /**
   * Generate unique card ID
   */
  private static generateCardId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get card by ID from player's hand
   */
  static getCard(player: Player, cardId: string): Card | undefined {
    return player.hand.find(c => c.id === cardId);
  }
}

