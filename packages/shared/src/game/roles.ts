import { Role, RoleType, GameState, Player } from '../types';

/**
 * Secret Roles System - Long-term strategy & bluffing
 */

export const ROLE_LIBRARY: Record<RoleType, Omit<Role, 'id'>> = {
  banker: {
    name: 'Banquier',
    description: '+1 point à chaque fin de tour si tu as ≥70 pièces',
    secret: true,
    reward: 1,
    checkCondition: (game, player) => {
      return player.coins >= 70;
    },
  },
  
  saboteur: {
    name: 'Saboteur',
    description: '+2 points la première fois qu\'un joueur tombe à 0',
    secret: true,
    reward: 2,
    checkCondition: (game, player) => {
      // Check if any player just hit 0 coins
      return game.players.some(p => p.id !== player.id && p.coins === 0);
    },
  },
  
  fox: {
    name: 'Renard',
    description: '+6 points en fin de partie si personne ne t\'a accusé',
    secret: true,
    reward: 6,
    checkCondition: (game, player) => {
      // Checked at game end
      return true;
    },
  },
  
  warrior: {
    name: 'Guerrier',
    description: '+1 point chaque fois que tu gagnes 2 tours d\'affilée',
    secret: true,
    reward: 1,
    checkCondition: (game, player) => {
      const history = game.turnHistory;
      if (history.length < 2) return false;
      
      const lastTwo = history.slice(-2);
      return lastTwo.every(turn => turn.winner === player.id);
    },
  },
  
  trickster: {
    name: 'Trickster',
    description: '+2 points chaque fois que tu gagnes avec une mise ≤3',
    secret: true,
    reward: 2,
    checkCondition: (game, player) => {
      const lastTurn = game.turnHistory[game.turnHistory.length - 1];
      return lastTurn?.winner === player.id && 
             (lastTurn.bets[player.id] ?? 0) <= 3;
    },
  },
  
  economist: {
    name: 'Économiste',
    description: '+1 point à chaque tour où tu as exactement 50 pièces',
    secret: true,
    reward: 1,
    checkCondition: (game, player) => {
      return player.coins === 50;
    },
  },
};

/**
 * Role Manager - Handles secret role assignment and checking
 */
export class RoleManager {
  /**
   * Assign random roles to players
   */
  static assignRoles(players: Player[]): void {
    const roleTypes = Object.keys(ROLE_LIBRARY) as RoleType[];
    const shuffled = this.shuffle([...roleTypes]);
    
    players.forEach((player, index) => {
      if (index < shuffled.length) {
        player.secretRole = {
          id: this.generateRoleId(),
          ...ROLE_LIBRARY[shuffled[index]],
        };
      }
    });
  }
  
  /**
   * Check and award role bonuses at turn end
   */
  static checkRoleConditions(game: GameState): void {
    for (const player of game.players) {
      if (!player.secretRole || player.isBot) {
        continue;
      }
      
      const role = player.secretRole;
      
      // Handle one-time roles
      if (role.name === 'Saboteur') {
        // Check if already triggered
        if (player.saboteurTriggered) {
          continue;
        }
        
        // Check condition
        if (role.checkCondition(game, player)) {
          player.points += role.reward;
          player.saboteurTriggered = true; // Mark as triggered
        }
        continue;
      }
      
      // Skip end-game roles
      if (role.name === 'Renard') {
        continue;
      }
      
      // Check condition for recurring roles
      if (role.checkCondition(game, player)) {
        player.points += role.reward;
      }
    }
  }
  
  /**
   * Award end-game role bonuses
   */
  static awardEndGameRoles(game: GameState): void {
    for (const player of game.players) {
      if (!player.secretRole) {
        continue;
      }
      
      const role = player.secretRole;
      
      if (role.name === 'Renard') {
        // Award fox bonus (assume no accusations for now)
        player.points += role.reward;
      }
    }
  }
  
  /**
   * Get role by type
   */
  static getRoleByType(type: RoleType): Role {
    return {
      id: this.generateRoleId(),
      ...ROLE_LIBRARY[type],
    };
  }
  
  /**
   * Shuffle array (Fisher-Yates)
   */
  private static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Generate unique role ID
   */
  private static generateRoleId(): string {
    return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

