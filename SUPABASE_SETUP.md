# 🗄️ Supabase Database Setup

## 1. Configuration Supabase

Vos identifiants Supabase :

- **URL** : `https://ggiwdkdflwnzeznmogcq.supabase.co`
- **Anon Key** : `YCkoQ8YUinoFEqccZHprag_zwgWcstL`
- **Service Key** : `7mrcMB7CpW0TnK1YyP8Z5Q_fFuPRU9G`

## 2. Créer les Variables d'Environnement

### Backend (`apps/server/.env`)

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Supabase
SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
SUPABASE_SERVICE_KEY=7mrcMB7CpW0TnK1YyP8Z5Q_fFuPRU9G
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
```

## 3. Créer le Schéma de Base de Données

1. **Accédez à Supabase Dashboard** : https://app.supabase.com
2. **Sélectionnez votre projet**
3. **Allez dans "SQL Editor"**
4. **Collez le contenu de `supabase-schema.sql`**
5. **Exécutez le script** (bouton "Run" ou Ctrl+Enter)

Le script créera :

- ✅ Tables : `users`, `user_profiles`, `user_stats`, `badges`, `user_badges`
- ✅ Tables : `friendships`, `friend_requests`, `game_history`, `game_participants`
- ✅ Vue matérialisée : `leaderboard_global`
- ✅ Indexes pour performances
- ✅ Fonctions et triggers
- ✅ Badges par défaut (10 badges)
- ✅ Row Level Security (RLS) optionnel

## 4. Tables Créées

### `users`

Informations de base des utilisateurs

- `id` (UUID, PK)
- `username` (unique)
- `email`
- `avatar`

### `user_profiles`

Progression des joueurs

- `level`, `xp`, `xp_to_next_level`
- `unlocked_skins`, `unlocked_titles`, `unlocked_animations`
- `equipped_skin`, `equipped_title`

### `user_stats`

Statistiques globales

- `games_played`, `games_won`, `win_rate`
- `total_points`, `total_coins`
- `unique_wins`, `cards_played`
- `favorite_card`, `average_bet`
- `longest_win_streak`, `time_played_minutes`

### `badges`

Liste des badges disponibles

### `user_badges`

Badges débloqués par utilisateur

### `friendships`

Relations d'amitié (bidirectionnelles)

### `friend_requests`

Demandes d'amitié en attente

### `game_history`

Historique des parties jouées

### `game_participants`

Participation des joueurs aux parties

### `leaderboard_global` (Vue matérialisée)

Classement global optimisé

## 5. Vérification

Pour vérifier que tout fonctionne :

```sql
-- Compter les badges
SELECT COUNT(*) FROM badges;
-- Devrait retourner 10

-- Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

## 6. Services Disponibles

### Backend - `UserService`

Méthodes disponibles :

- `createOrGetUser(username, email?)` - Créer ou récupérer un utilisateur
- `getUserProfile(userId)` - Récupérer le profil complet
- `updateXP(userId, xpGained)` - Mettre à jour l'XP et gérer les level-ups
- `updateStatsAfterGame(userId, stats)` - Mettre à jour les stats après une partie
- `awardBadge(userId, badgeId)` - Attribuer un badge
- `getLeaderboard(limit)` - Récupérer le classement
- `addFriend(userId, friendId)` - Ajouter un ami
- `getFriends(userId)` - Récupérer la liste d'amis
- `saveGameHistory(gameData)` - Sauvegarder l'historique d'une partie

## 7. Utilisation

### Créer un utilisateur

```typescript
const user = await userService.createOrGetUser(
  "PlayerOne",
  "player@example.com"
);
```

### Récupérer un profil

```typescript
const profile = await userService.getUserProfile(userId);
console.log(`Level ${profile.level}, XP: ${profile.xp}`);
```

### Mettre à jour l'XP

```typescript
const result = await userService.updateXP(userId, 150);
if (result.leveled) {
  console.log(`Level Up! Nouveau niveau: ${result.newLevel}`);
}
```

### Attribuer un badge

```typescript
await userService.awardBadge(userId, "first_win");
```

## 8. Badges Disponibles

- 🏆 **first_win** - First Victory (common)
- 💎 **high_roller** - High Roller (rare)
- 🐭 **underdog** - Underdog (epic)
- 💪 **survivor** - Survivor (rare)
- 🔥 **win_streak** - On Fire (epic)
- 🃏 **card_master** - Card Master (rare)
- ⭐ **veteran** - Veteran (legendary)
- 👑 **champion** - Champion (legendary)
- 💰 **economist** - Economist (epic)
- 🎭 **bluffer** - Master Bluffer (rare)

## 9. Sécurité

Le script active **Row Level Security (RLS)** avec des politiques :

- Les utilisateurs peuvent voir et modifier leur propre profil
- Les leaderboards sont publics en lecture
- Les données sensibles sont protégées

## 10. Maintenance

### Rafraîchir le leaderboard

Le leaderboard est une vue matérialisée pour performances. Pour le rafraîchir :

```sql
SELECT refresh_leaderboard();
```

Ou configurez un job automatique :

1. Allez dans **Database > Cron Jobs**
2. Créez un job qui exécute `SELECT refresh_leaderboard()` toutes les 5 minutes

## 🚀 Next Steps

Une fois le schéma créé :

1. Créez les fichiers `.env` avec vos identifiants
2. Lancez le serveur : `pnpm dev`
3. Les utilisateurs seront automatiquement créés lors de leur première connexion
4. Les stats et badges seront attribués après chaque partie

## 🔗 Liens Utiles

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Documentation](https://supabase.com/docs)
- [SQL Editor](https://app.supabase.com/project/ggiwdkdflwnzeznmogcq/sql)
