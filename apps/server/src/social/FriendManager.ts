import {
  Friend,
  Invitation,
  PlayerId,
  RoomCode,
  UserStatus,
} from '@coin-clash/shared';
import { nanoid } from 'nanoid';

/**
 * Friend Manager - Handles friend system and invitations
 */
export class FriendManager {
  private friendships: Map<PlayerId, Set<PlayerId>> = new Map();
  private userStatuses: Map<PlayerId, UserStatus> = new Map();
  private invitations: Map<string, Invitation> = new Map();
  private pendingFriendRequests: Map<PlayerId, Set<PlayerId>> = new Map();
  
  /**
   * Send friend request
   */
  sendFriendRequest(fromId: PlayerId, toId: PlayerId): boolean {
    if (fromId === toId) return false;
    
    // Check if already friends
    if (this.areFriends(fromId, toId)) {
      return false;
    }
    
    // Check if request already exists
    const pendingTo = this.pendingFriendRequests.get(toId);
    if (pendingTo && pendingTo.has(fromId)) {
      return false;
    }
    
    // Add to pending requests
    if (!this.pendingFriendRequests.has(toId)) {
      this.pendingFriendRequests.set(toId, new Set());
    }
    this.pendingFriendRequests.get(toId)!.add(fromId);
    
    console.log(`[FRIENDS] Friend request: ${fromId} -> ${toId}`);
    
    return true;
  }
  
  /**
   * Accept friend request
   */
  acceptFriendRequest(userId: PlayerId, requesterId: PlayerId): boolean {
    const pending = this.pendingFriendRequests.get(userId);
    if (!pending || !pending.has(requesterId)) {
      return false;
    }
    
    // Add friendship (bidirectional)
    if (!this.friendships.has(userId)) {
      this.friendships.set(userId, new Set());
    }
    if (!this.friendships.has(requesterId)) {
      this.friendships.set(requesterId, new Set());
    }
    
    this.friendships.get(userId)!.add(requesterId);
    this.friendships.get(requesterId)!.add(userId);
    
    // Remove from pending
    pending.delete(requesterId);
    
    console.log(`[FRIENDS] Friendship created: ${userId} <-> ${requesterId}`);
    
    return true;
  }
  
  /**
   * Reject friend request
   */
  rejectFriendRequest(userId: PlayerId, requesterId: PlayerId): boolean {
    const pending = this.pendingFriendRequests.get(userId);
    if (!pending || !pending.has(requesterId)) {
      return false;
    }
    
    pending.delete(requesterId);
    return true;
  }
  
  /**
   * Remove friend
   */
  removeFriend(userId: PlayerId, friendId: PlayerId): boolean {
    const userFriends = this.friendships.get(userId);
    const friendFriends = this.friendships.get(friendId);
    
    if (!userFriends || !friendFriends) {
      return false;
    }
    
    userFriends.delete(friendId);
    friendFriends.delete(userId);
    
    console.log(`[FRIENDS] Friendship removed: ${userId} <-> ${friendId}`);
    
    return true;
  }
  
  /**
   * Get friends list
   */
  getFriends(userId: PlayerId): PlayerId[] {
    const friends = this.friendships.get(userId);
    return friends ? Array.from(friends) : [];
  }
  
  /**
   * Get pending friend requests
   */
  getPendingRequests(userId: PlayerId): PlayerId[] {
    const pending = this.pendingFriendRequests.get(userId);
    return pending ? Array.from(pending) : [];
  }
  
  /**
   * Check if users are friends
   */
  areFriends(userId: PlayerId, otherId: PlayerId): boolean {
    const friends = this.friendships.get(userId);
    return friends ? friends.has(otherId) : false;
  }
  
  /**
   * Set user status
   */
  setUserStatus(userId: PlayerId, status: UserStatus): void {
    this.userStatuses.set(userId, status);
  }
  
  /**
   * Get user status
   */
  getUserStatus(userId: PlayerId): UserStatus {
    return this.userStatuses.get(userId) || 'offline';
  }
  
  /**
   * Send room invitation
   */
  sendInvitation(
    fromId: PlayerId,
    fromUsername: string,
    toId: PlayerId,
    roomCode: RoomCode
  ): Invitation {
    const inviteId = nanoid();
    
    const invitation: Invitation = {
      id: inviteId,
      fromId,
      fromUsername,
      toId,
      roomCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    
    this.invitations.set(inviteId, invitation);
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      this.invitations.delete(inviteId);
    }, 5 * 60 * 1000);
    
    console.log(`[INVITES] Invitation sent: ${fromUsername} -> ${toId} (room: ${roomCode})`);
    
    return invitation;
  }
  
  /**
   * Get invitation
   */
  getInvitation(inviteId: string): Invitation | undefined {
    return this.invitations.get(inviteId);
  }
  
  /**
   * Delete invitation
   */
  deleteInvitation(inviteId: string): void {
    this.invitations.delete(inviteId);
  }
  
  /**
   * Get invitations for user
   */
  getInvitationsForUser(userId: PlayerId): Invitation[] {
    const now = Date.now();
    return Array.from(this.invitations.values())
      .filter(inv => inv.toId === userId && inv.expiresAt > now);
  }
}

