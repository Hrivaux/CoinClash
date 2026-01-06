# 📊 Mise à Jour des Stats Après Partie

## ✅ Fonctionnalités Implémentées

Système complet de mise à jour des statistiques, XP, badges et historique de partie dans Supabase après chaque partie.

---

## 🎯 Ce Qui Est Mis à Jour

### **1. Statistiques Globales** 📈

**Table** : `user_stats`

**Mises à jour** :
- ✅ `games_played` : +1
- ✅ `games_won` : +1 si rank = 1
- ✅ `total_points` : Points finaux du joueur
- ✅ `total_coins` : Pièces finales du joueur
- ✅ `unique_wins` : Victoires uniques
- ✅ `cards_played` : Cartes jouées dans la partie
- ✅ `time_played_minutes` : Durée de la partie
- ✅ `win_rate` : Recalculé automatiquement

### **2. XP et Niveaux** ⭐

**Table** : `user_profiles`

**Mises à jour** :
- ✅ `xp` : XP gagné selon le classement
- ✅ `level` : Niveau mis à jour si level up
- ✅ `xp_to_next_level` : Recalculé pour le nouveau niveau

**Calcul XP** :
```typescript
EconomyManager.calculateXPGain(rank, totalPlayers, turnsWon, 0)
```

### **3. Badges** 🏅

**Table** : `user_badges`

**Badges vérifiés et attribués** :
- ✅ **First Win** : Première victoire (`first_win`)
- ✅ **Champion** : 50 victoires (`champion`)
- ✅ **Veteran** : 100 parties jouées (`veteran`)
- ✅ **Card Master** : 10+ cartes jouées dans une partie (`card_master`)

### **4. Historique de Partie** 📜

**Table** : `game_history` + `game_participants`

**Sauvegardé** :
- ✅ Code de la salle
- ✅ Mode de jeu
- ✅ Paramètres (coins, cap, points, tours)
- ✅ Modules activés
- ✅ Gagnant
- ✅ Nombre de tours
- ✅ Durée
- ✅ Participants avec leurs stats

---

## 🔧 Implémentation Technique

### **Fonction Principale**

**Fichier** : `apps/server/src/socket/handlers.ts`

**Fonction** : `updatePlayerStats()`

**Appelée** : Quand `game.status === 'finished'` dans `startPhaseUpdates()`

### **Mapping Socket ID → Supabase ID**

**Problème** : Dans le jeu, `player.id = socket.id`, mais Supabase utilise `playerId` (Supabase user ID)

**Solution** : Mapping inverse de `connectedUsers`
```typescript
const socketIdToPlayerId = new Map<string, string>();
for (const [playerId, socketId] of connectedUsers.entries()) {
  socketIdToPlayerId.set(socketId, playerId);
}
```

### **Flux Complet**

```
1. Partie se termine
   ↓
2. GameManager.endGame() → status = 'finished'
   ↓
3. startPhaseUpdates() détecte status = 'finished'
   ↓
4. updatePlayerStats() appelée
   ↓
5. Pour chaque joueur (non-bot) :
   ├─ Trouve playerId Supabase via mapping
   ├─ Met à jour stats (updateStatsAfterGame)
   ├─ Met à jour XP (updateXP)
   ├─ Vérifie badges (checkAndAwardBadges)
   └─ Sauvegarde historique (saveGameHistory)
   ↓
6. Event 'game:ended' émis avec rankings
```

---

## 📊 Détails des Mises à Jour

### **Stats Mises à Jour**

```typescript
await userService.updateStatsAfterGame(supabasePlayerId, {
  gamesPlayed: 1,                    // +1 partie
  gamesWon: ranking.rank === 1 ? 1 : 0,  // +1 si gagnant
  totalPoints: player.points,        // Points finaux
  totalCoins: player.coins,          // Pièces finales
  uniqueWins: player.stats.uniqueWins || 0,
  cardsPlayed: player.stats.cardsPlayed || 0,
  timePlayedMinutes: gameDuration,  // Durée en minutes
});
```

### **XP Gagné**

```typescript
const xpGained = EconomyManager.calculateXPGain(
  rank,              // Position finale (1, 2, 3...)
  totalPlayers,     // Nombre de joueurs
  turnsWon,         // Tours gagnés
  0                 // Bonus (pour l'instant)
);

await userService.updateXP(supabasePlayerId, xpGained);
```

**Level Up** :
- Si `newXP >= xpToNextLevel` → Level up automatique
- Nouveau `xpToNextLevel` calculé : `(level + 1)^1.5 * 100`

### **Badges Attribués**

**Conditions** :
- **First Win** : `won === true && gamesWon === 1`
- **Champion** : `won === true && gamesWon === 50`
- **Veteran** : `gamesPlayed === 100`
- **Card Master** : `cardsPlayed >= 10` dans cette partie

**Note** : Les badges sont vérifiés APRÈS la mise à jour des stats pour avoir les totaux corrects.

---

## 🧪 Comment Tester

### **1. Redémarrer le serveur**
```bash
cd apps/server
pnpm dev
```

### **2. Jouer une partie complète**
1. Créer un lobby
2. Ajouter des bots
3. Jouer jusqu'à la fin
4. Vérifier les logs du serveur

### **3. Vérifications**

#### **Logs Serveur**
```
[STATS] Updating player stats after game end
[STATS] Updating stats for Hrivaux (Supabase ID: abc-123)
[STATS] Hrivaux leveled up to level 2!
[BADGES] Awarded 'first_win' badge to user abc-123
[STATS] Successfully updated stats for Hrivaux
[STATS] Game history saved
```

#### **Dans Supabase**
1. Aller dans `user_stats` → Vérifier que `games_played` a augmenté
2. Aller dans `user_profiles` → Vérifier que `xp` et `level` ont changé
3. Aller dans `user_badges` → Vérifier les nouveaux badges
4. Aller dans `game_history` → Vérifier l'historique sauvegardé

#### **Dans le Frontend**
1. Ouvrir le profil utilisateur
2. Vérifier :
   - [ ] XP a augmenté
   - [ ] Niveau a peut-être augmenté
   - [ ] Stats mises à jour (parties jouées, victoires)
   - [ ] Nouveaux badges débloqués

---

## 🔍 Détails Techniques

### **Mapping des IDs**

**Dans le jeu** :
- `player.id` = `socket.id` (ex: `"FGH456IJK"`)

**Dans Supabase** :
- `user.id` = `playerId` (ex: `"abc-123-def-456"`)

**Mapping** :
- `connectedUsers` : `playerId` → `socket.id`
- `socketIdToPlayerId` : `socket.id` → `playerId` (inverse)

### **Gestion des Bots**

Les bots sont **ignorés** :
```typescript
if (player.isBot || !supabasePlayerId) {
  console.log(`[STATS] Skipping ${player.username} (bot: ${player.isBot})`);
  continue;
}
```

### **Gestion des Erreurs**

Chaque mise à jour est dans un `try/catch` :
- Si une mise à jour échoue, les autres continuent
- Les erreurs sont loggées mais n'empêchent pas la fin de partie

---

## 📁 Fichiers Modifiés

### **Backend**
- ✅ `apps/server/src/socket/handlers.ts`
  - Fonction `updatePlayerStats()` ajoutée
  - Fonction `checkAndAwardBadges()` ajoutée
  - Appel dans `startPhaseUpdates()`
  - Paramètres ajoutés à `startPhaseUpdates()`

### **Services Existants (utilisés)**
- ✅ `apps/server/src/db/UserService.ts`
  - `updateStatsAfterGame()` - Déjà existant
  - `updateXP()` - Déjà existant
  - `awardBadge()` - Déjà existant
  - `saveGameHistory()` - Déjà existant

---

## 🎯 Badges Disponibles

### **Badges Implémentés**
- ✅ `first_win` - Première victoire
- ✅ `champion` - 50 victoires
- ✅ `veteran` - 100 parties
- ✅ `card_master` - 10+ cartes dans une partie

### **Badges Disponibles (pas encore implémentés)**
- `high_roller` - Gagner avec mise max
- `underdog` - Gagner 5 tours avec mise ≤3
- `survivor` - Utiliser recovery mode 2 fois
- `win_streak` - Gagner 3 tours d'affilée
- `economist` - Finir avec max coins
- `bluffer` - Gagner avec mise 1 cinq fois

**Note** : Ces badges nécessitent un tracking plus avancé pendant la partie.

---

## 🚀 Prochaines Améliorations

1. **Badges Avancés** 🏅
   - Tracking des conditions pendant la partie
   - Badges de stratégie (high_roller, bluffer, etc.)

2. **Notifications de Badges** 🔔
   - Notification quand un badge est débloqué
   - Animation dans l'écran de fin

3. **Leaderboard** 📊
   - Mise à jour automatique après chaque partie
   - Refresh du materialized view

4. **Achievements** 🎖️
   - Système d'achievements plus complexe
   - Progression visible

---

## 📊 Exemple de Logs

```
[STATS] Updating player stats after game end
[STATS] Skipping Bot1 (bot: true, hasId: false)
[STATS] Skipping Bot2 (bot: true, hasId: false)
[STATS] Updating stats for Hrivaux (Supabase ID: abc-123-def)
[STATS] Hrivaux leveled up to level 2!
[BADGES] Awarded 'first_win' badge to user abc-123-def
[STATS] Successfully updated stats for Hrivaux
[STATS] Game history saved
[SOCKET] Final rankings: [
  { rank: 1, username: 'Hrivaux', points: 20 },
  { rank: 2, username: 'Bot1', points: 15 },
  { rank: 3, username: 'Bot2', points: 10 }
]
```

---

**Date** : 2026-01-02  
**Version** : 1.0  
**Statut** : ✅ Implémenté et prêt à tester

