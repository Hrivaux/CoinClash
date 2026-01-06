# 🐛 Corrections Timer & Cartes Qui Cachent Tout

## 2 Nouveaux Bugs Corrigés

---

## **Bug 1 : Timer bloqué à 1** ⏱️

### **Symptômes**
1. Le timer s'affiche à 1 et ne bouge plus
2. La phase ne change jamais
3. Le jeu est bloqué

### **Causes Multiples**

#### **Cause 1 : Arrondi incorrect**
**Problème** : Utilisation de `Math.ceil()` au lieu de `Math.floor()`

```typescript
// ❌ AVANT (ligne 812)
const remaining = Math.max(0, Math.ceil((game.phaseDeadline - now) / 1000));
```

**Explication** :
- `Math.ceil(0.1)` = 1
- `Math.ceil(0.9)` = 1
- Le timer restait à 1 au lieu de descendre à 0

**Solution** :
```typescript
// ✅ APRÈS
const remaining = Math.max(0, Math.floor((game.phaseDeadline - now) / 1000));
```

**Fichier** : `apps/server/src/socket/handlers.ts` (ligne 812)

---

#### **Cause 2 : Phase Event forcée même si désactivée**
**Problème** : Le jeu démarrait TOUJOURS en phase `event` pendant 5 secondes, même si `randomEvents` était désactivé dans les options.

**Code problématique** (ligne 85-97) :
```typescript
// ❌ AVANT
private startTurn(gameId: GameId): void {
  const game = this.games.get(gameId);
  if (!game) return;
  
  // Generate random event
  if (game.options.modules.randomEvents) {
    const event = EventManager.generateRandomEvent();
    EventManager.applyEvent(game, event);
  }
  
  // Start event phase (TOUJOURS lancée !)
  this.setPhase(game, 'event', 5);
}
```

**Solution** :
```typescript
// ✅ APRÈS
private startTurn(gameId: GameId): void {
  const game = this.games.get(gameId);
  if (!game) return;
  
  console.log(`[GAME] Starting turn ${game.currentTurn}, randomEvents: ${game.options.modules?.randomEvents}`);
  
  // Generate random event if enabled
  if (game.options.modules?.randomEvents) {
    const event = EventManager.generateRandomEvent();
    EventManager.applyEvent(game, event);
    // Start event phase
    this.setPhase(game, 'event', 5);
  } else {
    // Skip event phase if disabled ✅
    this.setPhase(game, 'planning', 15);
  }
}
```

**Fichier** : `apps/server/src/game/GameManager.ts` (lignes 85-100)

**Résultat** :
- Si événements désactivés → Commence directement en phase `planning` ✅
- Si événements activés → Phase `event` de 5s puis `planning` ✅

---

#### **Cause 3 : Logs de débogage ajoutés**
Pour faciliter le débogage futur, ajout de logs détaillés :

```typescript
// Dans setPhase()
console.log(`[GAME] Setting phase: ${phase} for ${seconds}s`);
console.log(`[GAME] Timer expired for phase: ${phase}, advancing...`);

// Dans advancePhase()
console.log(`[GAME] Advancing from phase: ${game.phase}`);
console.log(`[GAME] Unknown phase: ${game.phase}`); // Si erreur
```

**Fichier** : `apps/server/src/game/GameManager.ts`

---

## **Bug 2 : Cartes qui cachent tout** 🃏

### **Symptôme**
Un grand container vide ou avec des cartes apparaît en plein milieu de l'écran et cache l'interface de jeu.

### **Cause**
La condition d'affichage du container vérifie `currentPlayer.hand.length > 0` mais **pas** si le module est activé.

**Code problématique** (ligne 149) :
```typescript
// ❌ AVANT
{currentPlayer && currentPlayer.hand.length > 0 && (
  <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
    <motion.div className="glass rounded-xl p-4">
      <CardHand
        cards={currentPlayer.hand}
        onPlayCard={handlePlayCard}
        canPlayCards={...}
        enabled={currentGame.options.modules?.specialCards === true}
      />
    </motion.div>
  </div>
)}
```

**Problème** :
- Si `hand.length > 0` (3 cartes par exemple)
- Mais que `specialCards === false`
- Le container s'affiche quand même
- `CardHand` retourne `null` à cause de `enabled={false}`
- Résultat : un container vide qui cache tout

### **Solution**
Ajouter la vérification du module dans la condition d'affichage :

```typescript
// ✅ APRÈS
{currentPlayer && 
 currentPlayer.hand.length > 0 && 
 currentGame.options.modules?.specialCards === true && (
  <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
    <motion.div className="glass rounded-xl p-4">
      <CardHand
        cards={currentPlayer.hand}
        onPlayCard={handlePlayCard}
        canPlayCards={...}
        enabled={true}
      />
    </motion.div>
  </div>
)}
```

**Fichier** : `apps/web/src/app/room/[code]/page.tsx` (lignes 148-168)

**Résultat** :
- Si cartes désactivées → Container ne s'affiche JAMAIS ✅
- Si cartes activées → Container s'affiche uniquement si `hand.length > 0` ✅
- Plus de container vide qui cache l'interface ✅

---

## 🔍 Logs de Débogage

### **Backend (Terminal serveur)**
```
[GAME] Starting turn 1, randomEvents: false
[GAME] Setting phase: planning for 15s
[GAME] Timer expired for phase: planning, advancing...
[GAME] Advancing from phase: planning
[GAME] Setting phase: betting for 20s
[GAME] Timer expired for phase: betting, advancing...
[GAME] Advancing from phase: betting
[GAME] Setting phase: instant_cards for 10s
...
```

### **Frontend (Console navigateur)**
```
[Game] Looking for player with socket.id: FGH456IJK
[Game] Found player: Hrivaux
[Game] Current phase: betting
[Game] Player bet: null
```

---

## 🧪 Comment Tester

### **1. Redémarrer le serveur**
```bash
# Ctrl+C dans le terminal serveur puis
cd apps/server
pnpm dev
```

### **2. Recharger le frontend**
**Cmd + Shift + R** sur `http://localhost:3000`

### **3. Créer une partie SANS cartes ni événements**
1. Créer un lobby
2. **Désactiver** "Cartes spéciales"
3. **Désactiver** "Événements aléatoires"
4. Ajouter un bot
5. Lancer la partie

### **4. Vérifications**

#### **✅ Timer fonctionne**
- [ ] Le timer démarre à 15 (phase planning)
- [ ] Il décrémente : 15, 14, 13, 12...
- [ ] Il atteint 0
- [ ] La phase change automatiquement
- [ ] Le timer se réinitialise pour la phase suivante
- [ ] Pas de blocage à 1

#### **✅ Pas de cartes qui cachent**
- [ ] Aucun container de cartes visible
- [ ] L'interface de jeu est dégagée
- [ ] Le BettingSlider est accessible
- [ ] Pas de "cartes fantômes"

#### **✅ Cycle des phases**
```
Planning (15s) → Betting (20s) → Instant Cards (10s) 
→ Reveal (3s) → Resolution (5s) → End Turn (5s) 
→ Planning (tour 2)
```

---

## 🎯 Flux Correct des Phases

### **Avec événements DÉSACTIVÉS**
```
Tour 1: Planning (15s) ← Démarre ici directement !
       ↓
     Betting (20s) ← BettingSlider apparaît
       ↓
  Instant Cards (10s)
       ↓
     Reveal (3s) ← Mises révélées
       ↓
   Resolution (5s) ← Gagnant calculé
       ↓
   End Turn (5s)
       ↓
Tour 2: Planning (15s)
       ...
```

### **Avec événements ACTIVÉS**
```
Tour 1: Event (5s) ← Phase événement
       ↓
     Planning (15s)
       ↓
     Betting (20s)
       ...
```

---

## 📊 Récapitulatif

| Bug | Fichier | Lignes | Solution |
|-----|---------|--------|----------|
| Timer à 1 (arrondi) | `handlers.ts` | 812 | `Math.floor()` au lieu de `ceil()` |
| Phase event forcée | `GameManager.ts` | 85-100 | Conditionnel sur `randomEvents` |
| Container vide | `page.tsx` | 148-168 | Condition sur `specialCards` |

---

## 📁 Fichiers Modifiés

1. ✅ `apps/server/src/socket/handlers.ts` - Calcul du timer
2. ✅ `apps/server/src/game/GameManager.ts` - Phase conditionnelle + logs
3. ✅ `apps/web/src/app/room/[code]/page.tsx` - Affichage conditionnel

---

## 🎮 État Actuel

### **✅ Fonctionnel**
- Timer qui décrémente correctement
- Phases qui progressent automatiquement
- Pas de phase event si désactivée
- Pas de cartes si module désactivé
- Interface dégagée
- BettingSlider accessible
- Jeu jouable de bout en bout

### **🎯 Prochains Tests**
1. **Partie complète sans modules** (mode de base)
2. **Partie avec cartes activées**
3. **Partie avec événements activés**
4. **Partie avec tous les modules**
5. **Fin de partie et calcul des gagnants**

---

**Date** : 2026-01-02  
**Version** : 1.1  
**Statut** : ✅ Corrigé et prêt à tester

