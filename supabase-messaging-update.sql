-- =====================================================
-- MISE À JOUR SUPABASE - MESSAGERIE ET INVITATIONS
-- =====================================================
-- À exécuter dans le SQL Editor de Supabase
-- https://supabase.com/dashboard → SQL Editor → New Query
-- =====================================================

-- ===========================================
-- TABLE MESSAGES
-- ===========================================

-- Supprimer si existe (pour réexécution)
DROP TABLE IF EXISTS messages CASCADE;

-- Créer la table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_messages_from_user ON messages(from_user_id, created_at DESC);
CREATE INDEX idx_messages_to_user ON messages(to_user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(from_user_id, to_user_id, created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their messages" ON messages
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (auth.uid() = to_user_id);

-- ===========================================
-- TABLE GAME_INVITATIONS
-- ===========================================

-- Supprimer si existe (pour réexécution)
DROP TABLE IF EXISTS game_invitations CASCADE;

-- Créer la table
CREATE TABLE game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Index pour performance
CREATE INDEX idx_invitations_to_user ON game_invitations(to_user_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their invitations" ON game_invitations
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create invitations" ON game_invitations
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received invitations" ON game_invitations
  FOR UPDATE USING (auth.uid() = to_user_id);

-- ===========================================
-- VÉRIFICATION
-- ===========================================

-- Afficher les tables créées
SELECT 'messages' as table_name, count(*) as row_count FROM messages
UNION ALL
SELECT 'game_invitations', count(*) FROM game_invitations;

-- ✅ Si vous voyez ce résultat sans erreur, c'est bon !

