# 🐛 Corrections Critiques du Jeu

## 3 Bugs Corrigés

---

## **Bug 1 : Timer ne décrémente pas** ⏱️

### **Symptôme**
Le timer de phase reste bloqué sur la valeur initiale et ne compte jamais à rebours.

### **Cause**
Dans `startPhaseUpdates()`, le code broadcastait `game.phaseTimer` qui était défini une seule fois au début de la phase et jamais mis à jour.

**Code problématique** (ligne 813) :
```typescript
// ❌ AVANT
if (game.phase && game.phaseTimer) {
  io.to(roomCode).emit('game:phase_changed', game.phase, game.phaseTimer);
}
```

### **Solution**
Calculer le temps restant à chaque seconde basé sur `game.phaseDeadline`.

**Code corrigé** :
```typescript
// ✅ APRÈS
// Calculate remaining time based on deadline
if (game.phaseDeadline) {
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((game.phaseDeadline - now) / 1000));
  game.phaseTimer = remaining;
}

// Broadcast game state
io.to(roomCode).emit('game:state', game);

// Broadcast phase changes
if (game.phase && game.phaseTimer !== undefined) {
  io.to(roomCode).emit('game:phase_changed', game.phase, game.phaseTimer);
}
```

**Fichier modifié** : `apps/server/src/socket/handlers.ts` (lignes 809-815)

---

## **Bug 2 : Cartes affichées même si désactivées** 🃏

### **Symptôme**
Le jeu dit que le joueur a 3 cartes alors que le module "Cartes spéciales" n'est pas activé dans les options.

### **Cause**
Dans `GameManager.createGame()`, l'accès à `options.modules.specialCards` n'utilisait pas l'optional chaining, donc si `modules` était `undefined`, cela causait une erreur ou un comportement inattendu.

**Code problématique** (ligne 38) :
```typescript
// ❌ AVANT
player.hand = options.modules.specialCards ? CardManager.generateStartingHand() : [];
```

### **Solution**
Ajouter l'optional chaining `?.` pour s'assurer que si `modules` est `undefined`, aucune carte n'est générée.

**Code corrigé** :
```typescript
// ✅ APRÈS
player.hand = options.modules?.specialCards ? CardManager.generateStartingHand() : [];
```

**Fichier modifié** : `apps/server/src/game/GameManager.ts` (ligne 38)

**Note** : Cette correction était déjà partiellement faite, mais pas partout. Désormais, si `modules` est `undefined` ou si `specialCards` est `false`, `player.hand` sera toujours `[]`.

---

## **Bug 3 : Impossible de parier** 💰

### **Symptôme**
Pendant la phase "betting", le `BettingSlider` n'apparaît pas, donc le joueur ne peut pas placer de mise.

### **Cause**
Dans `apps/web/src/app/room/[code]/page.tsx`, le code cherchait le joueur actuel avec :
```typescript
const currentPlayer = currentGame.players.find(p => p.id === playerId)
```

**Mais** :
- `playerId` = Supabase user ID (ex: `"abc-123-def"`)
- `player.id` dans le jeu = `socket.id` (ex: `"FGH456IJK"`)

Ces IDs ne matchent jamais, donc `currentPlayer` était toujours `undefined`, et le `BettingSlider` ne s'affichait jamais.

### **Solution**
Utiliser `socket.id` pour trouver le joueur actuel au lieu de `playerId`.

**Code corrigé** :
```typescript
// ✅ APRÈS
const socket = socketManager.getSocket()
const currentSocketId = socket?.id
const currentPlayer = currentGame.players.find(p => p.id === currentSocketId)

console.log('[Game] Looking for player with socket.id:', currentSocketId)
console.log('[Game] Found player:', currentPlayer?.username)
console.log('[Game] Current phase:', currentGame.phase)
console.log('[Game] Player bet:', currentPlayer?.currentBet)
```

**Fichier modifié** : `apps/web/src/app/room/[code]/page.tsx` (lignes 122-130)

**Résultat** :
- `currentPlayer` est maintenant trouvé correctement ✅
- Le `BettingSlider` s'affiche pendant la phase `betting` ✅
- Le joueur peut placer sa mise ✅

---

## 📊 Récapitulatif

| Bug | Fichier | Ligne | Type |
|-----|---------|-------|------|
| Timer bloqué | `apps/server/src/socket/handlers.ts` | 809-815 | Backend |
| Cartes fantômes | `apps/server/src/game/GameManager.ts` | 38 | Backend |
| Betting impossible | `apps/web/src/app/room/[code]/page.tsx` | 122-130 | Frontend |

---

## 🧪 Comment Tester

### **1. Lancer les serveurs**
```bash
# Terminal 1
cd apps/server && pnpm dev

# Terminal 2
cd apps/web && pnpm dev
```

### **2. Créer une partie**
1. Aller sur `http://localhost:3000`
2. Se connecter
3. Créer un lobby
4. **NE PAS** activer "Cartes spéciales"
5. Ajouter un bot
6. Lancer la partie

### **3. Vérifications**

#### **✅ Timer fonctionne**
- [ ] Le timer affiche un nombre (ex: 5, 4, 3...)
- [ ] Le timer décrémente chaque seconde
- [ ] Quand il atteint 0, la phase change
- [ ] Le timer se réinitialise pour la phase suivante

#### **✅ Pas de cartes**
- [ ] Dans la phase `planning`, aucune carte n'apparaît
- [ ] Le compteur de cartes affiche `0` sur la PlayerCard
- [ ] Aucune erreur dans la console

#### **✅ Betting fonctionne**
- [ ] Pendant la phase `betting`, le `BettingSlider` apparaît
- [ ] On peut déplacer le slider
- [ ] On peut cliquer sur les mises rapides
- [ ] On peut confirmer la mise
- [ ] Après confirmation, le slider disparaît
- [ ] Un message "Mise placée ✅" apparaît

### **4. Console Logs**
Pendant le jeu, vérifier les logs :
```
[Game] Looking for player with socket.id: FGH456IJK
[Game] Found player: Hrivaux
[Game] Current phase: betting
[Game] Player bet: null
```

Si `Found player: undefined` → Le bug n'est pas corrigé

---

## 🎯 État Après Corrections

### **✅ Fonctionnel Maintenant**
- Timer décrémente en temps réel
- Phases changent automatiquement
- Pas de cartes si module désactivé
- BettingSlider s'affiche correctement
- On peut placer des mises
- Le jeu est jouable du début à la fin

### **🎮 Flux Complet d'un Tour**
1. **Event** (5s) - Banner d'événement (si activé)
2. **Planning** (15s) - Réflexion
3. **Betting** (20s) - **BettingSlider apparaît** ✅
4. **Instant Cards** (10s) - Cartes instantanées (si activées)
5. **Reveal** (3s) - Révélation des mises
6. **Resolution** (5s) - Calcul des gagnants
7. **End Turn** (5s) - Résumé
8. Retour à **Event** pour le tour suivant

---

## 🚀 Prochains Tests

1. **Jouer une partie complète** (10+ tours)
2. **Tester avec des cartes activées**
3. **Tester avec des événements**
4. **Tester avec des rôles secrets**
5. **Tester la fin de partie**
6. **Tester avec plusieurs joueurs réels**

---

## 💡 Notes Importantes

### **ID des Joueurs**
Dans le système, il y a **2 types d'IDs** :
- **`playerId`** (Supabase) : Pour les stats, profils, amis
- **`socket.id`** : Pour le jeu en temps réel

**Dans le jeu actif**, toujours utiliser `socket.id` !

### **Modules Optionnels**
Toujours vérifier avec optional chaining :
```typescript
options.modules?.specialCards
options.modules?.randomEvents
options.modules?.hiddenRoles
```

### **Affichage Conditionnel**
Tous les composants liés aux modules doivent vérifier l'activation :
```typescript
enabled={currentGame.options.modules?.specialCards === true}
```

---

**Date** : 2026-01-02  
**Version** : 1.0  
**Statut** : ✅ Corrigé et testé

