import { supabase } from './supabase';
import { PlayerId, UserProfile, GlobalStats, Badge } from '@coin-clash/shared';

/**
 * User Service - Handle user operations with Supabase
 */
export class UserService {
  /**
   * Create or get user by username
   */
  async createOrGetUser(username: string, email?: string): Promise<{ id: PlayerId; username: string }> {
    // Check if user exists
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (existing) {
      return { id: existing.id, username: existing.username };
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({ username, email })
      .select('id, username')
      .single();

    if (error) {
      console.error('[DB] Error creating user:', error);
      throw error;
    }

    // Create profile and stats
    await this.initializeUserProfile(data.id);

    return { id: data.id, username: data.username };
  }

  /**
   * Initialize user profile and stats
   */
  private async initializeUserProfile(userId: PlayerId): Promise<void> {
    // Create profile
    await supabase.from('user_profiles').insert({
      id: userId,
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
    });

    // Create stats
    await supabase.from('user_stats').insert({
      user_id: userId,
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: PlayerId): Promise<UserProfile | null> {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: badges } = await supabase
      .from('user_badges')
      .select('badge_id, badges(*), unlocked_at')
      .eq('user_id', userId);

    const userBadges: Badge[] = badges?.map((b: any) => ({
      id: b.badges.id,
      name: b.badges.name,
      description: b.badges.description,
      icon: b.badges.icon,
      rarity: b.badges.rarity,
      unlockedAt: new Date(b.unlocked_at).getTime(),
    })) || [];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      level: profile?.level || 1,
      xp: profile?.xp || 0,
      xpToNextLevel: profile?.xp_to_next_level || 100,
      unlockedSkins: profile?.unlocked_skins || ['default'],
      unlockedTitles: profile?.unlocked_titles || ['Novice'],
      unlockedAnimations: profile?.unlocked_animations || ['default'],
      equippedSkin: profile?.equipped_skin,
      equippedTitle: profile?.equipped_title,
      globalStats: {
        gamesPlayed: stats?.games_played || 0,
        gamesWon: stats?.games_won || 0,
        totalPoints: stats?.total_points || 0,
        totalCoins: stats?.total_coins || 0,
        uniqueWins: stats?.unique_wins || 0,
        cardsPlayed: stats?.cards_played || 0,
        favoriteCard: stats?.favorite_card,
        winRate: parseFloat(stats?.win_rate || '0'),
        averageBet: parseFloat(stats?.average_bet || '0'),
        longestWinStreak: stats?.longest_win_streak || 0,
        timePlayedMinutes: stats?.time_played_minutes || 0,
      },
      badges: userBadges,
      friends: [],
      createdAt: new Date(user.created_at).getTime(),
    };
  }

  /**
   * Update user XP
   */
  async updateXP(userId: PlayerId, xpGained: number): Promise<{ leveled: boolean; newLevel?: number }> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return { leveled: false };

    let newXP = profile.xp + xpGained;
    let newLevel = profile.level;
    let leveled = false;

    // Check for level up
    while (newXP >= profile.xpToNextLevel) {
      newXP -= profile.xpToNextLevel;
      newLevel++;
      leveled = true;
    }

    // Calculate new XP requirement
    const xpToNextLevel = Math.floor(Math.pow(newLevel + 1, 1.5) * 100);

    // Update profile
    await supabase
      .from('user_profiles')
      .update({
        level: newLevel,
        xp: newXP,
        xp_to_next_level: xpToNextLevel,
      })
      .eq('id', userId);

    return { leveled, newLevel: leveled ? newLevel : undefined };
  }

  /**
   * Update user stats after game
   */
  async updateStatsAfterGame(
    userId: PlayerId,
    stats: {
      gamesPlayed: number;
      gamesWon: number;
      totalPoints: number;
      totalCoins: number;
      uniqueWins: number;
      cardsPlayed: number;
      timePlayedMinutes: number;
      totalBets?: number; // Total bets in this game
      turnsPlayed?: number; // Number of turns in this game
      playedCards?: Array<{ cardType: string }>; // Cards played in this game
    }
  ): Promise<void> {
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentStats) return;

    const newStats: any = {
      games_played: currentStats.games_played + stats.gamesPlayed,
      games_won: currentStats.games_won + stats.gamesWon,
      total_points: currentStats.total_points + stats.totalPoints,
      total_coins: currentStats.total_coins + stats.totalCoins,
      unique_wins: currentStats.unique_wins + stats.uniqueWins,
      cards_played: currentStats.cards_played + stats.cardsPlayed,
      time_played_minutes: currentStats.time_played_minutes + stats.timePlayedMinutes,
    };

    // Calculate win rate
    newStats.win_rate = newStats.games_played > 0
      ? newStats.games_won / newStats.games_played
      : 0;

    // Calculate average bet (weighted average across all games)
    if (stats.totalBets !== undefined && stats.turnsPlayed !== undefined && stats.turnsPlayed > 0) {
      const currentAverageBet = currentStats.average_bet || 0;
      const currentGamesPlayed = currentStats.games_played || 0;
      const gameAverageBet = stats.totalBets / stats.turnsPlayed;
      
      // Weighted average: (old_avg * old_games + new_avg * new_games) / total_games
      if (currentGamesPlayed > 0) {
        newStats.average_bet = (currentAverageBet * currentGamesPlayed + gameAverageBet * stats.gamesPlayed) / (currentGamesPlayed + stats.gamesPlayed);
      } else {
        newStats.average_bet = gameAverageBet;
      }
    }

    // Calculate favorite card
    // For now, we'll update it based on the most played card in this game
    // A more sophisticated approach would require storing card usage in game_participants
    if (stats.playedCards && stats.playedCards.length > 0) {
      // Count card types played in this game
      const cardCounts = new Map<string, number>();
      for (const playedCard of stats.playedCards) {
        const count = cardCounts.get(playedCard.cardType) || 0;
        cardCounts.set(playedCard.cardType, count + 1);
      }
      
      // Find most played card in this game
      let mostPlayedCard: string | null = null;
      let maxCount = 0;
      for (const [cardType, count] of cardCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostPlayedCard = cardType;
        }
      }
      
      // Update favorite card to the most played in this game
      // (In a full implementation, we'd count across all games)
      if (mostPlayedCard) {
        newStats.favorite_card = mostPlayedCard;
      }
    }

    // Calculate longest win streak
    // Get recent game history to calculate streak
    const { data: recentGames } = await supabase
      .from('game_history')
      .select('id, ended_at')
      .order('ended_at', { ascending: false })
      .limit(10); // Check last 10 games
    
    let currentStreak = stats.gamesWon > 0 ? 1 : 0; // Start with this game if won
    
    if (recentGames && recentGames.length > 0) {
      const gameIds = recentGames.map(g => g.id);
      
      // Get participants for these games
      const { data: recentParticipants } = await supabase
        .from('game_participants')
        .select('rank, game_id')
        .eq('user_id', userId)
        .in('game_id', gameIds);
      
      if (recentParticipants && recentParticipants.length > 0) {
        // Sort by game order (most recent first)
        const participantsByGame = new Map(recentParticipants.map(p => [p.game_id, p]));
        const sortedParticipants = recentGames
          .map(g => participantsByGame.get(g.id))
          .filter(p => p !== undefined);
        
        // Count consecutive wins from most recent (excluding current game)
        for (const participant of sortedParticipants) {
          if (participant && participant.rank === 1) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
        }
      }
    }
    
    // Update longest streak if current is longer
    const currentLongestStreak = currentStats.longest_win_streak || 0;
    if (currentStreak > currentLongestStreak) {
      newStats.longest_win_streak = currentStreak;
    } else {
      newStats.longest_win_streak = currentLongestStreak;
    }

    await supabase.from('user_stats').update(newStats).eq('user_id', userId);
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId: PlayerId, badgeId: string): Promise<void> {
    // Check if already has badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existing) return;

    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badgeId,
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_global')
        .select('*')
        .limit(limit)
        .order('xp', { ascending: false });
      
      if (error) throw error;
      
      // Format leaderboard entries
      return (data || []).map((entry: any, index: number) => ({
        userId: entry.user_id,
        username: entry.username || 'Joueur',
        level: entry.level || 1,
        xp: entry.xp || 0,
        gamesWon: entry.games_won || 0,
        gamesPlayed: entry.games_played || 0,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('[DB] Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Add friend
   */
  async addFriend(userId: PlayerId, friendId: PlayerId): Promise<void> {
    // Ensure userId < friendId to prevent duplicates
    const [user1, user2] = userId < friendId ? [userId, friendId] : [friendId, userId];

    await supabase.from('friendships').insert({
      user_id: user1,
      friend_id: user2,
    });
  }

  /**
   * Get friends
   */
  async getFriends(userId: PlayerId): Promise<PlayerId[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error || !data) return [];

    return data.map((f: any) => (f.user_id === userId ? f.friend_id : f.user_id));
  }

  /**
   * Get friends with details
   */
  async getFriendsWithDetails(userId: PlayerId): Promise<any[]> {
    const friendIds = await this.getFriends(userId);
    
    const friends = [];
    for (const friendId of friendIds) {
      const profile = await this.getUserProfile(friendId);
      if (profile) {
        friends.push({
          id: profile.id,
          username: profile.username,
          avatar: profile.avatar,
          level: profile.level,
          status: 'online', // TODO: Get real status
        });
      }
    }
    
    return friends;
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUserId: PlayerId, toUserId: PlayerId): Promise<boolean> {
    if (fromUserId === toUserId) return false;

    // Check if already friends
    const friends = await this.getFriends(fromUserId);
    if (friends.includes(toUserId)) return false;

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .single();

    if (existing) return false;

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending',
      });

    return !error;
  }

  /**
   * Get friend requests (received)
   */
  async getFriendRequests(userId: PlayerId): Promise<any[]> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('from_user_id, created_at')
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    if (error || !data) return [];

    const requests = [];
    for (const req of data) {
      const profile = await this.getUserProfile(req.from_user_id);
      if (profile) {
        requests.push({
          id: profile.id,
          username: profile.username,
          avatar: profile.avatar,
          level: profile.level,
          requestedAt: new Date(req.created_at).getTime(),
        });
      }
    }

    return requests;
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: PlayerId, requesterId: PlayerId): Promise<boolean> {
    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('from_user_id', requesterId)
      .eq('to_user_id', userId);

    if (updateError) return false;

    // Create friendship
    await this.addFriend(userId, requesterId);

    return true;
  }

  /**
   * Reject friend request
   */
  async rejectFriendRequest(userId: PlayerId, requesterId: PlayerId): Promise<boolean> {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('from_user_id', requesterId)
      .eq('to_user_id', userId);

    return !error;
  }

  /**
   * Remove friend
   */
  async removeFriend(userId: PlayerId, friendId: PlayerId): Promise<boolean> {
    const [user1, user2] = userId < friendId ? [userId, friendId] : [friendId, userId];

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', user1)
      .eq('friend_id', user2);

    return !error;
  }

  /**
   * Search users by username
   */
  async searchUsers(query: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error || !data) return [];

    // Get profiles for each user
    const users = [];
    for (const user of data) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('level')
        .eq('id', user.id)
        .single();

      users.push({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        level: profile?.level || 1,
      });
    }

    return users;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: PlayerId, updates: {
    username?: string;
    avatar?: string;
    equipped_skin?: string;
    equipped_title?: string;
  }): Promise<boolean> {
    // Update user table if username or avatar changed
    if (updates.username || updates.avatar) {
      const userUpdates: any = {};
      if (updates.username) userUpdates.username = updates.username;
      if (updates.avatar) userUpdates.avatar = updates.avatar;

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) return false;
    }

    // Update profile table if equipped items changed
    if (updates.equipped_skin || updates.equipped_title) {
      const profileUpdates: any = {};
      if (updates.equipped_skin) profileUpdates.equipped_skin = updates.equipped_skin;
      if (updates.equipped_title) profileUpdates.equipped_title = updates.equipped_title;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) return false;
    }

    return true;
  }

  /**
   * Get all badges
   */
  async getAllBadges(): Promise<any[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: false });

    return data || [];
  }

  /**
   * Save game history
   */
  async saveGameHistory(gameData: {
    roomCode: string;
    gameMode: string;
    startingCoins: number;
    coinCap: number;
    pointsToWin: number;
    maxTurns: number;
    modules: any;
    winnerId?: PlayerId;
    totalTurns: number;
    durationSeconds: number;
    participants: Array<{
      userId: PlayerId;
      rank: number;
      finalPoints: number;
      finalCoins: number;
      turnsWon: number;
      cardsPlayed: number;
      xpGained: number;
    }>;
  }): Promise<void> {
    // Insert game
    const { data: game, error } = await supabase
      .from('game_history')
      .insert({
        room_code: gameData.roomCode,
        game_mode: gameData.gameMode,
        starting_coins: gameData.startingCoins,
        coin_cap: gameData.coinCap,
        points_to_win: gameData.pointsToWin,
        max_turns: gameData.maxTurns,
        modules: gameData.modules,
        winner_id: gameData.winnerId,
        total_turns: gameData.totalTurns,
        duration_seconds: gameData.durationSeconds,
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !game) {
      console.error('[DB] Error saving game:', error);
      return;
    }

    // Insert participants
    const participants = gameData.participants.map((p) => ({
      game_id: game.id,
      user_id: p.userId,
      rank: p.rank,
      final_points: p.finalPoints,
      final_coins: p.finalCoins,
      turns_won: p.turnsWon,
      cards_played: p.cardsPlayed,
      xp_gained: p.xpGained,
    }));

    await supabase.from('game_participants').insert(participants);
  }

  // ===========================================
  // MESSAGING
  // ===========================================

  /**
   * Send message between users
   */
  async sendMessage(fromUserId: string, toUserId: string, message: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message,
          read: false,
        });

      if (error) {
        console.error('[UserService] Error sending message:', error);
        return false;
      }

      console.log(`[UserService] Message sent: ${fromUserId} -> ${toUserId}`);
      return true;
    } catch (error) {
      console.error('[UserService] Exception sending message:', error);
      return false;
    }
  }

  /**
   * Get messages between two users
   */
  async getMessages(userId1: string, userId2: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          from_user_id,
          to_user_id,
          message,
          read,
          created_at
        `)
        .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('[UserService] Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[UserService] Exception fetching messages:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, fromUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('to_user_id', userId)
        .eq('from_user_id', fromUserId)
        .eq('read', false);

      if (error) {
        console.error('[UserService] Error marking messages as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserService] Exception marking messages as read:', error);
      return false;
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('[UserService] Error counting unread messages:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[UserService] Exception counting unread messages:', error);
      return 0;
    }
  }

  // ===========================================
  // GAME INVITATIONS
  // ===========================================

  /**
   * Create game invitation
   */
  async createGameInvitation(params: { fromUserId: string; toUserId: string; roomCode: string }): Promise<string | null> {
    const { fromUserId, toUserId, roomCode } = params;
    try {
      const { data, error } = await supabase
        .from('game_invitations')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          room_code: roomCode,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[UserService] Error creating invitation:', error);
        return null;
      }

      console.log(`[UserService] Game invitation created: ${fromUserId} -> ${toUserId} (${roomCode})`);
      return data.id;
    } catch (error) {
      console.error('[UserService] Exception creating invitation:', error);
      return null;
    }
  }

  /**
   * Get pending invitations for user
   */
  async getPendingInvitations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('game_invitations')
        .select(`
          id,
          from_user_id,
          room_code,
          created_at,
          expires_at,
          users!game_invitations_from_user_id_fkey(username)
        `)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[UserService] Error fetching invitations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[UserService] Exception fetching invitations:', error);
      return [];
    }
  }

  /**
   * Update invitation status
   */
  async updateInvitationStatus(invitationId: string, status: 'accepted' | 'rejected'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_invitations')
        .update({ status })
        .eq('id', invitationId);

      if (error) {
        console.error('[UserService] Error updating invitation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[UserService] Exception updating invitation:', error);
      return false;
    }
  }
}

