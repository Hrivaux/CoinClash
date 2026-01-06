# 🎮 Nouveau Système de Lobby

## ✅ Fonctionnalités Implémentées

### **1. Création de Lobby Simplifiée**
- ✅ Bouton "Créer un lobby" sur la page d'accueil
- ✅ Création instantanée sans modal
- ✅ Paramètres par défaut (modifiables dans le lobby)
- ✅ Redirection automatique vers `/room/[code]`

### **2. Interface de Lobby Complète**
- ✅ **Code de la salle** : Affichage grand format + bouton copier
- ✅ **Inviter des amis** : Bouton qui ouvre le centre social
- ✅ **Liste des joueurs** : Avatars, status prêt, couronne pour l'hôte
- ✅ **Slots vides** : Visuels en pointillés pour slots disponibles
- ✅ **Configuration** : Panel complet pour l'hôte

### **3. Configuration dans le Lobby**
- ✅ **Nombre de joueurs** : 2-6 joueurs
- ✅ **Points de victoire** : 10-30 points
- ✅ **Nombre de tours** : 10, 15, 20 ou infini
- ✅ **Pièces de départ** : Slider 50-200
- ✅ **Mises min/max** : Inputs numériques
- ✅ **Fonctionnalités** : Cartes spéciales, événements, rôles secrets
- ✅ **Expandable** : Vue compacte / Vue détaillée
- ✅ **Temps réel** : Tous les joueurs voient les changements

### **4. Actions de Lobby**
- ✅ **Ajouter un bot** : Bouton pour l'hôte
- ✅ **Se mettre prêt** : Toggle pour les joueurs
- ✅ **Lancer la partie** : Pour l'hôte (minimum 2 joueurs)
- ✅ **Quitter** : Retour à l'accueil

### **5. Intégration Sociale**
- ✅ Invitation directe depuis le lobby
- ✅ Le destinataire rejoint avec le code
- ✅ L'inviteur est déjà dans le lobby

---

## 🎯 Flux Utilisateur

### **Créer et Configurer**

```
1. PAGE D'ACCUEIL
   → Clic sur "Créer un lobby"
   → Création instantanée (paramètres par défaut)

2. REDIRECTION LOBBY
   → Affichage du code : ABCD1234
   → Bouton "Inviter des amis"
   → Configuration visible (hôte)

3. CONFIGURATION
   → Hôte ouvre le panel de configuration
   → Modifie les paramètres
   → Tous les joueurs voient les changements en temps réel

4. INVITER
   → Clic sur "Inviter des amis"
   → Sélection d'un ami
   → Clic sur 🎮 Gamepad2
   → L'ami reçoit l'invitation
   → L'ami rejoint le lobby

5. LANCEMENT
   → Minimum 2 joueurs
   → Hôte clique "Lancer la partie"
   → Game start !
```

### **Rejoindre un Lobby**

```
1. INVITATION REÇUE
   → Popup : "UserX vous invite !"
   → Clic "OK"
   → Redirection vers /room/[code]

2. OU CODE MANUEL
   → Page d'accueil → "Rejoindre avec code"
   → Saisie du code
   → Redirection vers /room/[code]

3. DANS LE LOBBY
   → Voir les joueurs présents
   → Voir la configuration
   → Se mettre prêt
   → Attendre le lancement
```

---

## 📁 Fichiers Modifiés/Créés

### **Frontend**

#### **`apps/web/src/app/page.tsx`**
- ❌ Supprimé : Modal CreateRoomModal
- ✅ Ajouté : Fonction `handleCreateLobby()`
- ✅ Modifié : Bouton "Créer un lobby" (création directe)
- ✅ État : `creating` pour loading

#### **`apps/web/src/app/room/[code]/page.tsx`**
- ✅ Refonte complète de l'UI du lobby
- ✅ Import : LobbyConfig, FriendsPanel
- ✅ États : `copied`, `showFriends`
- ✅ Fonctions : 
  - `handleCopyCode()` : Copier le code
  - `handleAddBot()` : Ajouter un bot
  - `handleUpdateOptions()` : Mettre à jour config
  - `handleLeave()` : Quitter le lobby
- ✅ UI : 
  - Header avec code et actions
  - Grid : Joueurs (2/3) + Actions (1/3)
  - Slots vides visualisés
  - Panel de configuration intégré
  - Bouton inviter amis

#### **`apps/web/src/components/room/LobbyConfig.tsx`** (NOUVEAU)
- ✅ Composant de configuration
- ✅ Deux modes :
  - **Vue non-hôte** : Lecture seule, compact
  - **Vue hôte** : Éditable, expandable
- ✅ Paramètres :
  - Nombre de joueurs (boutons 2-6)
  - Points de victoire (boutons 10-30)
  - Tours max (boutons + infini)
  - Pièces de départ (slider 50-200)
  - Mises min/max (inputs)
  - Features (checkboxes)
- ✅ Animations : Framer Motion
- ✅ Icons : Lucide React

### **Backend**

#### **`apps/server/src/socket/handlers.ts`**
- ✅ Nouvel événement : `room:update_options`
- ✅ Validation : Seul l'hôte peut modifier
- ✅ Mise à jour : `room.options = { ...room.options, ...updates }`
- ✅ Broadcast : `io.to(room.code).emit('room:updated', room)`
- ✅ Logs : `[ROOM] Options updated`

---

## 🔌 Events Socket

### **Frontend → Backend**

| Event | Params | Description |
|-------|--------|-------------|
| `room:create` | `defaultOptions` | Créer un lobby |
| `room:update_options` | `updates` | Mettre à jour la config (hôte) |
| `room:add_bot` | `difficulty` | Ajouter un bot (hôte) |
| `room:ready` | `boolean` | Toggle prêt (joueur) |
| `room:start` | - | Lancer la partie (hôte) |
| `room:leave` | - | Quitter le lobby |

### **Backend → Frontend**

| Event | Payload | Description |
|-------|---------|-------------|
| `room:updated` | `Room` | État du lobby mis à jour |
| `game:started` | `Game` | La partie a démarré |
| `error` | `string` | Erreur (permissions, etc.) |

---

## 🎨 Design

### **Style**
- **Apple Minimalist** : Liquid glass, frosted backgrounds
- **Animations** : Framer Motion (fade, slide, stagger)
- **Colors** : Noir profond + blanc + accents colorés
- **Icons** : Lucide React

### **Composants**
- **card-liquid** : Cartes avec effet verre liquide
- **btn-apple** : Boutons style Apple
- **liquid-glass-hover** : Hover effect subtil

### **Responsive**
- Grid adaptatif (1 col → 3 cols)
- Boutons full-width sur mobile
- Sidebar qui passe en bas sur petit écran

---

## 🧪 Tests à Faire

### **Test 1 : Création de Lobby**

1. Aller sur la page d'accueil
2. Cliquer "Créer un lobby"
3. **Vérifier** :
   - [ ] Redirection vers `/room/[CODE]`
   - [ ] Code affiché en grand
   - [ ] Vous êtes marqué comme hôte (👑)
   - [ ] Configuration visible et éditable

### **Test 2 : Configuration**

1. En tant qu'hôte, ouvrir le panel de configuration
2. Modifier le nombre de joueurs → 6
3. Modifier les points de victoire → 25
4. Activer les cartes spéciales
5. **Vérifier** :
   - [ ] Changements instantanés
   - [ ] Vue compacte mise à jour

### **Test 3 : Invitations**

1. **Hôte** : Créer un lobby
2. **Hôte** : Cliquer "Inviter des amis"
3. **Hôte** : Inviter UserB
4. **UserB** : Recevoir la popup
5. **UserB** : Accepter
6. **Vérifier** :
   - [ ] UserB apparaît dans la liste des joueurs
   - [ ] UserB voit la configuration (lecture seule)
   - [ ] UserB peut se mettre prêt

### **Test 4 : Ajout de Bot**

1. **Hôte** : Cliquer "Ajouter un bot"
2. **Vérifier** :
   - [ ] Bot ajouté avec emoji 🤖
   - [ ] Difficulté affichée ("medium")
   - [ ] Compte dans le total des joueurs

### **Test 5 : Lancer la Partie**

1. **Hôte** : Attendre 2+ joueurs
2. **Hôte** : Cliquer "Lancer la partie"
3. **Vérifier** :
   - [ ] Transition vers le jeu
   - [ ] Table de jeu affichée
   - [ ] Tous les joueurs présents

### **Test 6 : Quitter**

1. **Joueur** : Cliquer "Quitter le lobby"
2. **Vérifier** :
   - [ ] Retour à la page d'accueil
   - [ ] Disparaît de la liste des joueurs (pour les autres)

---

## ⚙️ Configuration par Défaut

```typescript
const defaultOptions = {
  maxPlayers: 4,
  privateRoom: false,
}
```

**Note** : Tous les autres paramètres utilisent les valeurs par défaut du backend (définis dans `@coin-clash/shared`).

---

## 🔍 Logs de Debug

### **Frontend (Console Navigateur)**

```javascript
// Lors de la création
"[LOBBY] Creating with options:", { maxPlayers: 4, privateRoom: false }

// Lors de la mise à jour
"[LOBBY] Updating options:", { pointsToWin: 25 }

// Lors du copier
"[LOBBY] Code copied:", "ABCD1234"
```

### **Backend (Console Serveur)**

```bash
[ROOM] Room created: ABCD1234 by xyz789
[ROOM] Options updated in ABCD1234: { pointsToWin: 25 }
[ROOM] Bot added to ABCD1234
[ROOM] Game starting in ABCD1234
```

---

## 🎯 Avantages du Nouveau Système

### **Avant** ❌

- Modal complexe avec trop d'options
- Configuration avant création
- Difficile d'inviter des amis
- Pas de partage de code facile
- Configuration figée après création

### **Après** ✅

- ✅ **Création instantanée** : 1 clic → dans le lobby
- ✅ **Code visible** : Copie facile, partage simple
- ✅ **Invitations intégrées** : Bouton direct vers amis
- ✅ **Configuration flexible** : Modifiable à tout moment
- ✅ **Temps réel** : Tous voient les changements
- ✅ **UX intuitive** : Workflow naturel
- ✅ **Mobile-friendly** : Responsive design

---

## 🚀 Démarrage

### **1. Redémarrer le Serveur**

```bash
cd /Users/hugorivaux/CoinClashV2

# Ctrl+C pour arrêter
pnpm dev
```

### **2. Recharger le Frontend**

```
http://localhost:3000
Cmd + Shift + R
```

### **3. Tester**

1. Page d'accueil → "Créer un lobby"
2. Voir le lobby avec le code
3. Copier le code
4. Inviter un ami
5. Configurer la partie
6. Lancer !

---

## 📊 Résumé des Changements

```
✅ Page d'accueil : Création directe (sans modal)
✅ Page lobby : Refonte complète
✅ Composant LobbyConfig : Configuration in-lobby
✅ Backend : Événement room:update_options
✅ UI : Design Apple Minimalist
✅ UX : Workflow optimisé
✅ Social : Invitations intégrées
✅ Responsive : Mobile-friendly
```

---

**Le nouveau système de lobby est complet et prêt à l'emploi ! 🎉**

