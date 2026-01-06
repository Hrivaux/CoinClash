-- ============================================
-- COIN CLASH ONLINE - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Note: id references auth.users for Supabase Auth integration
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER PROFILES (Progression)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  
  -- Cosmetics
  unlocked_skins TEXT[] DEFAULT ARRAY['default'],
  unlocked_titles TEXT[] DEFAULT ARRAY['Novice'],
  unlocked_animations TEXT[] DEFAULT ARRAY['default'],
  equipped_skin TEXT DEFAULT 'default',
  equipped_title TEXT DEFAULT 'Novice',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GLOBAL STATS
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_coins INTEGER DEFAULT 0,
  unique_wins INTEGER DEFAULT 0,
  cards_played INTEGER DEFAULT 0,
  favorite_card TEXT,
  win_rate DECIMAL(5, 4) DEFAULT 0,
  average_bet DECIMAL(10, 2) DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  time_played_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- User badges (many-to-many)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id < friend_id) -- Prevent duplicates (A-B and B-A)
);

-- Friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

-- ============================================
-- GAME HISTORY (for statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL,
  game_mode TEXT NOT NULL,
  
  -- Game settings
  starting_coins INTEGER,
  coin_cap INTEGER,
  points_to_win INTEGER,
  max_turns INTEGER,
  
  -- Modules enabled
  modules JSONB,
  
  -- Results
  winner_id UUID REFERENCES users(id),
  total_turns INTEGER,
  duration_seconds INTEGER,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Player participation in games
CREATE TABLE IF NOT EXISTS game_participants (
  game_id UUID REFERENCES game_history(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  final_points INTEGER DEFAULT 0,
  final_coins INTEGER DEFAULT 0,
  turns_won INTEGER DEFAULT 0,
  cards_played INTEGER DEFAULT 0,
  xp_gained INTEGER DEFAULT 0,
  PRIMARY KEY (game_id, user_id)
);

-- ============================================
-- LEADERBOARDS (materialized view for performance)
-- ============================================
CREATE MATERIALIZED VIEW leaderboard_global AS
SELECT 
  u.id,
  u.username,
  u.avatar,
  p.level,
  p.xp,
  s.games_played,
  s.games_won,
  s.win_rate,
  s.total_points,
  ROW_NUMBER() OVER (ORDER BY p.level DESC, p.xp DESC) as rank
FROM users u
JOIN user_profiles p ON u.id = p.id
JOIN user_stats s ON u.id = s.user_id
ORDER BY rank;

-- Index for faster queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_game_history_winner ON game_history(winner_id);
CREATE INDEX idx_game_participants_user ON game_participants(user_id);
CREATE INDEX idx_friendships_user ON friendships(user_id, friend_id);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id, status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update user profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT BADGES
-- ============================================
INSERT INTO badges (id, name, description, icon, rarity) VALUES
  ('first_win', 'First Victory', 'Win your first game', '🏆', 'common'),
  ('high_roller', 'High Roller', 'Win a turn with max bet', '💎', 'rare'),
  ('underdog', 'Underdog', 'Win 5 turns with bet ≤3', '🐭', 'epic'),
  ('survivor', 'Survivor', 'Use recovery mode twice', '💪', 'rare'),
  ('win_streak', 'On Fire', 'Win 3 turns in a row', '🔥', 'epic'),
  ('card_master', 'Card Master', 'Play 10 cards in one game', '🃏', 'rare'),
  ('veteran', 'Veteran', 'Play 100 games', '⭐', 'legendary'),
  ('champion', 'Champion', 'Win 50 games', '👑', 'legendary'),
  ('economist', 'Economist', 'Finish with max coins', '💰', 'epic'),
  ('bluffer', 'Master Bluffer', 'Win with bet 1 five times', '🎭', 'rare')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User stats policies
CREATE POLICY "Anyone can view stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Anyone can view badges" ON user_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their friendships" ON friendships
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests policies
CREATE POLICY "Users can view their friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can manage their received requests" ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- ===========================================
-- MESSAGES TABLE
-- ===========================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_from_user ON messages(from_user_id, created_at DESC);
CREATE INDEX idx_messages_to_user ON messages(to_user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(from_user_id, to_user_id, created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can read their messages" ON messages
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (auth.uid() = to_user_id);

-- ===========================================
-- GAME INVITATIONS TABLE
-- ===========================================
CREATE TABLE game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Index for performance
CREATE INDEX idx_invitations_to_user ON game_invitations(to_user_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for invitations
CREATE POLICY "Users can read their invitations" ON game_invitations
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create invitations" ON game_invitations
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received invitations" ON game_invitations
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Refresh leaderboard function
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW leaderboard_global;
END;
$$ LANGUAGE plpgsql;

