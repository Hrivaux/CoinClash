# 🔔 Système de Notifications de Jeu

## ✨ Fonctionnalités Implémentées

Système complet de notifications en temps réel pour toutes les actions importantes du jeu.

---

## 🎯 Notifications Disponibles

### **1. Mises Révélées** 💰

**Quand** : Phase `reveal` (après que tout le monde ait misé)

**Message** : `"[Joueur] a misé X pièce(s)"`

**Affichage** :
- Badge bleu avec icône 💰
- Montant en jaune
- Une notification par joueur
- Toutes affichées en cascade

**Exemple** :
```
💰 Hrivaux a misé 5 pièces
💰 Bot1 a misé 3 pièces
💰 Bot2 a misé 7 pièces
```

---

### **2. Gagnant du Tour** 🏆

**Quand** : Phase `resolution` (après calcul)

**Message** : `"🏆 [Joueur] remporte ce tour avec X pièces !"`

**Affichage** :
- Badge jaune avec ring brillant
- Icône Trophy
- Montant de la mise gagnante
- Notification prioritaire (en haut)

**Exemple** :
```
🏆 Hrivaux remporte ce tour avec 7 pièces !
```

---

### **3. Cartes Jouées** 🃏

**Quand** : Quand un joueur joue une carte

**Message** : `"[Joueur] a joué la carte "[Nom de la carte]"`

**Affichage** :
- Badge violet avec icône Sparkles
- Nom de la carte jouée
- Notification discrète

**Exemple** :
```
🃏 Hrivaux a joué la carte "Espion"
🃏 Bot1 a joué la carte "Double"
```

---

### **4. Événements Aléatoires** 🎰

**Quand** : Phase `event` (si activée)

**Message** : `"🎰 [Nom] : [Description]"`

**Affichage** :
- Badge orange avec icône AlertCircle
- Nom et description de l'événement
- Notification importante

**Exemple** :
```
🎰 Double ou Rien : Toutes les mises sont doublées ce tour !
```

---

## 🎨 Design

### **Position**
- **Top center** de l'écran
- **Fixed** (ne bouge pas au scroll)
- **Z-index 50** (au-dessus de tout)
- **Max-width md** (responsive)

### **Animations**
- **Entrée** : Slide down + fade in + scale
- **Sortie** : Slide up + fade out + scale
- **Spring animation** (damping: 20)

### **Couleurs par Type**

| Type | Couleur | Ring | Icône |
|------|---------|------|-------|
| Bet | Bleu | `ring-blue-400/30` | 💰 Coins |
| Winner | Jaune | `ring-yellow-400/50` | 🏆 Trophy |
| Card | Violet | `ring-purple-400/30` | ✨ Sparkles |
| Event | Orange | `ring-orange-400/30` | ⚠️ AlertCircle |

### **Auto-Removal**
- Notifications disparaissent après **5 secondes**
- Nettoyage automatique toutes les secondes
- Maximum **10 notifications** affichées

---

## 🔧 Implémentation Technique

### **Composant**
**Fichier** : `apps/web/src/components/game/GameNotifications.tsx`

**Props** : Aucune (utilise Socket.io directement)

**État** :
```typescript
const [notifications, setNotifications] = useState<GameNotification[]>([])
```

**Interface** :
```typescript
interface GameNotification {
  id: string
  type: 'bet' | 'winner' | 'card' | 'event' | 'info'
  message: string
  playerName?: string
  amount?: number
  icon?: string
  timestamp: number
}
```

---

### **Socket Events Écoutés**

#### **1. `game:bets_revealed`**
```typescript
socket.on('game:bets_revealed', (bets: Record<string, number>, players?: Player[]) => {
  // Crée une notification pour chaque mise
})
```

**Backend** : `apps/server/src/socket/handlers.ts` (ligne 837)
```typescript
io.to(roomCode).emit('game:bets_revealed', bets, game.players);
```

#### **2. `game:turn_result`**
```typescript
socket.on('game:turn_result', (result: TurnResult) => {
  if (result.winner) {
    // Notification du gagnant
  }
})
```

**Backend** : Déjà implémenté (ligne 836)

#### **3. `game:card_played`**
```typescript
socket.on('game:card_played', (cardData: any) => {
  // Notification de carte jouée
})
```

**Backend** : `apps/server/src/socket/handlers.ts` (ligne 328)
```typescript
io.to(room.code).emit('game:card_played', {
  ...playedCard,
  playerName: player?.username || 'Un joueur',
  cardName: playedCard.card?.name || 'Une carte',
});
```

#### **4. `game:event_triggered`**
```typescript
socket.on('game:event_triggered', (event: GameEvent) => {
  // Notification d'événement
})
```

**Backend** : Déjà implémenté (ligne 826)

---

## 🎮 Intégration

### **Page de Jeu**
**Fichier** : `apps/web/src/app/room/[code]/page.tsx`

```typescript
return (
  <div className="relative">
    <GameNotifications /> {/* ✅ Ajouté ici */}
    <GameTable game={currentGame} ... />
    ...
  </div>
)
```

---

## 🔒 Sécurité & Confidentialité

### **Cacher le Nombre de Cartes** 🃏

**Problème** : Les autres joueurs pouvaient voir combien de cartes on avait

**Solution** : Affichage conditionnel dans `PlayerCard`

**Fichier** : `apps/web/src/components/game/PlayerCard.tsx` (ligne 115)

**Avant** :
```typescript
{(isCurrentPlayer || showCards) && (
  // Affiche le nombre de cartes
)}
```

**Après** :
```typescript
{isCurrentPlayer && ( // ✅ SEULEMENT pour le joueur actuel
  // Affiche le nombre de cartes
)}
```

**Résultat** :
- ✅ Vous voyez VOS cartes
- ❌ Les autres ne voient PAS vos cartes
- ❌ Vous ne voyez PAS les cartes des autres

---

## 🎯 Cartes Jouables Avant les Mises

### **Problème**
Certaines cartes doivent être jouées **AVANT** de placer sa mise (ex: "Espion" pour voir la mise d'un adversaire)

### **Solution**

#### **Backend** : `apps/server/src/game/GameManager.ts` (ligne 314)

**Avant** :
```typescript
// Pas de vérification de phase
return CardManager.playCard(game, player, cardId, targetId);
```

**Après** :
```typescript
// Permet de jouer en phase 'planning' (before_bet) ou 'instant_cards'
const canPlayInPhase = game.phase === 'planning' || game.phase === 'instant_cards';
if (!canPlayInPhase) {
  return false;
}
return CardManager.playCard(game, player, cardId, targetId);
```

#### **Frontend** : `apps/web/src/app/room/[code]/page.tsx` (ligne 156)

**Déjà correct** :
```typescript
canPlayCards={
  currentGame.phase === 'planning' || // ✅ Permet before_bet
  currentGame.phase === 'instant_cards' // ✅ Permet instant
}
```

### **Types de Cartes**

#### **Before Bet** (Phase Planning)
- **Espion** : Voir la mise d'un adversaire
- **Scan** : Voir le nombre de cartes
- **Silence** : Bloquer le chat

**Utilisation** :
1. Phase `planning` démarre (15s)
2. Ouvrir le panneau de cartes
3. Jouer "Espion" sur un adversaire
4. Voir sa mise prévue
5. Placer sa propre mise en connaissance de cause

#### **Instant** (Phase Instant Cards)
- **Double** : Double la mise
- **Bouclier** : Protection
- **Mirage** : Fausse mise

**Utilisation** :
1. Phase `betting` : Placer sa mise
2. Phase `instant_cards` : Jouer des cartes défensives/offensives

---

## 📊 Flux Complet avec Notifications

### **Tour Typique**

```
1. Planning (15s)
   → Bouton cartes vert ✨
   → Jouer "Espion" si besoin
   → Notification : "🃏 Hrivaux a joué la carte 'Espion'"

2. Betting (20s)
   → BettingSlider apparaît
   → Placer sa mise
   → Bot mise automatiquement

3. Instant Cards (10s)
   → Jouer cartes instant si besoin
   → Notification : "🃏 Bot1 a joué la carte 'Double'"

4. Reveal (3s)
   → Notifications : 
     "💰 Hrivaux a misé 5 pièces"
     "💰 Bot1 a misé 3 pièces"
     "💰 Bot2 a misé 7 pièces"

5. Resolution (5s)
   → Notification : "🏆 Bot2 remporte ce tour avec 7 pièces !"

6. End Turn (5s)
   → Résumé
   → Tour suivant
```

---

## 🧪 Comment Tester

### **1. Créer une partie**
1. Créer un lobby
2. **Activer** "Cartes spéciales" ✅
3. Ajouter 2 bots
4. Lancer !

### **2. Vérifications**

#### **Notifications de Mises**
- [ ] Phase `reveal` → Notifications apparaissent
- [ ] Une notification par joueur
- [ ] Montants corrects affichés
- [ ] Disparaissent après 5s

#### **Notification Gagnant**
- [ ] Phase `resolution` → Notification du gagnant
- [ ] Ring jaune brillant
- [ ] Montant de la mise gagnante

#### **Notifications Cartes**
- [ ] Jouer une carte → Notification apparaît
- [ ] Nom du joueur + nom de la carte
- [ ] Badge violet

#### **Cacher Cartes**
- [ ] Votre PlayerCard → Nombre de cartes visible ✅
- [ ] Autres PlayerCards → Pas de nombre de cartes ✅

#### **Cartes Avant Mises**
- [ ] Phase `planning` → Bouton cartes vert
- [ ] Jouer "Espion" → Fonctionne ✅
- [ ] Voir la mise d'un adversaire
- [ ] Placer sa mise en connaissance de cause

---

## 📁 Fichiers Modifiés

### **Créé**
- ✅ `apps/web/src/components/game/GameNotifications.tsx`

### **Modifié**
- ✅ `apps/web/src/components/game/PlayerCard.tsx` - Cacher cartes
- ✅ `apps/web/src/app/room/[code]/page.tsx` - Intégration notifications
- ✅ `apps/server/src/socket/handlers.ts` - Envoyer données complètes
- ✅ `apps/server/src/game/GameManager.ts` - Permettre cartes en planning

---

## 🚀 Prochaines Améliorations Possibles

1. **Notifications Persistantes** 📜
   - Historique des notifications
   - Scrollable si beaucoup

2. **Notifications Sonores** 🔊
   - Son différent par type
   - Option pour désactiver

3. **Notifications Ciblées** 🎯
   - Notification privée pour "Espion"
   - Seul le joueur voit le résultat

4. **Animations Avancées** ✨
   - Particules pour le gagnant
   - Confettis pour les victoires

5. **Notifications de Chat** 💬
   - Messages des joueurs
   - Emotes

---

**Date** : 2026-01-02  
**Version** : 1.0  
**Statut** : ✅ Implémenté et prêt à tester

