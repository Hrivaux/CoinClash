# 💬 Système de Messagerie et Invitations - Implémentation Complète

## ✅ Fonctionnalités Ajoutées

### **1. Messagerie en Temps Réel**

- ✅ Envoi/réception de messages entre amis via Socket.io
- ✅ Stockage persistant dans Supabase (table `messages`)
- ✅ Affichage temps réel des nouveaux messages
- ✅ Historique des conversations chargé depuis la BDD
- ✅ Marquage des messages comme lus
- ✅ Compteur de messages non lus

### **2. Invitations à des Parties**

- ✅ Bouton **Gamepad2** (🎮) pour inviter un ami
- ✅ Création automatique d'une salle privée
- ✅ Notification en temps réel pour le destinataire
- ✅ Stockage des invitations dans Supabase (table `game_invitations`)
- ✅ Expiration automatique après 5 minutes
- ✅ Statuts : pending, accepted, rejected, expired

---

## 📊 Nouvelles Tables Supabase

### **Table `messages`**

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes** :

- `idx_messages_from_user` : Performance pour expéditeur
- `idx_messages_to_user` : Performance pour destinataire
- `idx_messages_conversation` : Performance pour conversations

**Policies RLS** :

- Lecture : Accès aux messages envoyés/reçus
- Insertion : Uniquement l'expéditeur
- Mise à jour : Uniquement le destinataire (pour marquer comme lu)

---

### **Table `game_invitations`**

```sql
CREATE TABLE game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);
```

**Index** :

- `idx_invitations_to_user` : Performance pour destinataire

**Policies RLS** :

- Lecture : Accès aux invitations envoyées/reçues
- Insertion : Uniquement l'expéditeur
- Mise à jour : Uniquement le destinataire (accepter/refuser)

---

## 🔧 Backend - Nouvelles Méthodes

### **UserService.ts** - Messagerie

```typescript
// Envoyer un message
sendMessage(fromUserId, toUserId, message): Promise<boolean>

// Récupérer les messages entre deux utilisateurs
getMessages(userId1, userId2, limit): Promise<any[]>

// Marquer les messages comme lus
markMessagesAsRead(userId, fromUserId): Promise<boolean>

// Compter les messages non lus
getUnreadMessageCount(userId): Promise<number>
```

### **UserService.ts** - Invitations

```typescript
// Créer une invitation
createGameInvitation(fromUserId, toUserId, roomCode): Promise<string | null>

// Récupérer les invitations en attente
getPendingInvitations(userId): Promise<any[]>

// Mettre à jour le statut d'une invitation
updateInvitationStatus(invitationId, status): Promise<boolean>
```

---

## 🔌 Socket Events - Backend

### **Messagerie**

| Event                  | Params                | Response                         | Description              |
| ---------------------- | --------------------- | -------------------------------- | ------------------------ |
| `message:send`         | `toUserId`, `message` | `boolean`                        | Envoyer un message       |
| `message:get`          | `otherUserId`         | `message[]`                      | Récupérer l'historique   |
| `message:unread_count` | -                     | `number`                         | Compter messages non lus |
| `message:received`     | -                     | `{from, to, message, timestamp}` | **Événement temps réel** |

### **Invitations**

| Event                      | Params         | Response                             | Description              |
| -------------------------- | -------------- | ------------------------------------ | ------------------------ |
| `game:invite`              | `toUserId`     | `{success, roomCode}`                | Inviter à une partie     |
| `game:invitations`         | -              | `invitation[]`                       | Récupérer invitations    |
| `game:accept_invitation`   | `invitationId` | `roomCode`                           | Accepter invitation      |
| `game:reject_invitation`   | `invitationId` | `boolean`                            | Refuser invitation       |
| `game:invitation_received` | -              | `{id, from, fromUsername, roomCode}` | **Événement temps réel** |

---

## 🎨 Frontend - Modifications

### **FriendsPanel.tsx**

#### **Nouvelles Fonctions** :

```typescript
// Envoyer un message (maintenant via Socket.io)
sendMessage();

// Charger l'historique des messages
loadMessages(friendId);

// Inviter un ami à une partie
inviteToGame(friendId);
```

#### **Listeners Temps Réel** :

```typescript
// Écouter les nouveaux messages
socket.on("message:received", handleMessageReceived);

// Écouter les invitations
socket.on("game:invitation_received", handleInvitationReceived);
```

#### **Boutons Ajoutés** :

1. **Dans la liste des amis** (ligne 434) :

   - 🎮 Bouton **Gamepad2** : Inviter directement
   - 💬 Bouton **MessageCircle** : Ouvrir le chat

2. **Dans le header du chat** (ligne 598) :
   - 🎮 Bouton **Gamepad2** : Inviter l'ami sélectionné

---

## 🔄 Flux Complet

### **Messagerie** :

```
1. USER A clique sur 💬 MessageCircle
   → Frontend : setSelectedFriend(friend)
   → Frontend : loadMessages(friend.id)
   → Socket   : emit('message:get', friendId)
   → Backend  : userService.getMessages()
   → Supabase : SELECT * FROM messages
   → Frontend : Affiche l'historique

2. USER A tape un message et appuie sur Entrée
   → Frontend : emit('message:send', toUserId, message)
   → Backend  : userService.sendMessage()
   → Supabase : INSERT INTO messages
   → Backend  : io.emit('message:received')
   → Frontend : USER B reçoit le message en temps réel
```

### **Invitation à une Partie** :

```
1. USER A clique sur 🎮 Gamepad2 (ami USER B)
   → Frontend : inviteToGame(friendId)
   → Socket   : emit('game:invite', toUserId)
   → Backend  : roomManager.createRoom() (salle privée)
   → Backend  : userService.createGameInvitation()
   → Supabase : INSERT INTO game_invitations
   → Backend  : io.emit('game:invitation_received')
   → Frontend : USER B voit une notification

2. USER B accepte (confirm dialog)
   → Frontend : Redirige vers /room/[code]
   → Frontend : Rejoint la salle automatiquement
   → Backend  : roomManager.joinRoom()
   → Backend  : userService.updateInvitationStatus('accepted')

3. Les deux joueurs sont dans la salle !
```

---

## 🎯 Points Clés

### **Messages** :

- ✅ **Persistants** : Stockés dans Supabase
- ✅ **Temps réel** : Via Socket.io
- ✅ **Privés** : Seulement entre amis
- ✅ **Horodatés** : Avec format français (HH:MM)
- ✅ **Lus/Non lus** : Marquage automatique

### **Invitations** :

- ✅ **Création automatique** : Salle privée générée
- ✅ **Notification instantanée** : Via Socket.io
- ✅ **Expiration** : 5 minutes max
- ✅ **Statuts trackés** : pending → accepted/rejected/expired
- ✅ **Rejoint automatique** : En cliquant sur le lien

---

## 🧪 Tests à Faire

### **Messagerie** :

1. **Utilisateur A** :

   - [ ] Se connecter
   - [ ] Ouvrir Centre social
   - [ ] Cliquer sur 💬 pour un ami

2. **Vérifications** :

   - [ ] L'historique se charge (si messages précédents)
   - [ ] Taper un message → Entrée
   - [ ] Le message apparaît à droite (blanc)

3. **Utilisateur B** (autre navigateur) :

   - [ ] Voir le message arriver en temps réel
   - [ ] Le message apparaît à gauche (liquid-glass)
   - [ ] Répondre → Le message arrive chez A

4. **Rechargement** :
   - [ ] Recharger la page
   - [ ] Rouvrir le chat
   - [ ] L'historique est conservé ✅

---

### **Invitations** :

1. **Utilisateur A** :

   - [ ] Ouvrir Centre social
   - [ ] Cliquer sur 🎮 Gamepad2 pour un ami en ligne

2. **Vérifications** :

   - [ ] Alert : "Invitation envoyée ! Code : XXXX"
   - [ ] Console : Logs d'invitation

3. **Utilisateur B** (autre navigateur) :

   - [ ] Voir popup : "UserA vous invite à rejoindre une partie !"
   - [ ] Cliquer "OK"
   - [ ] Redirigé vers `/room/XXXX`
   - [ ] Voir UserA déjà dans la salle

4. **Dans la salle** :
   - [ ] Les deux joueurs sont présents
   - [ ] Peuvent ajouter des bots
   - [ ] Démarrer la partie normalement

---

## 📝 SQL à Exécuter dans Supabase

```sql
-- Copier/coller dans l'éditeur SQL de Supabase

-- MESSAGES TABLE
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_from_user ON messages(from_user_id, created_at DESC);
CREATE INDEX idx_messages_to_user ON messages(to_user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(from_user_id, to_user_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their messages" ON messages
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (auth.uid() = to_user_id);

-- GAME INVITATIONS TABLE
CREATE TABLE game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE INDEX idx_invitations_to_user ON game_invitations(to_user_id, status, created_at DESC);

ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their invitations" ON game_invitations
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create invitations" ON game_invitations
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received invitations" ON game_invitations
  FOR UPDATE USING (auth.uid() = to_user_id);
```

---

## 🚀 Démarrage

### **1. Mettre à jour la BDD Supabase** :

```sql
-- Exécuter le SQL ci-dessus dans Supabase Dashboard
-- SQL Editor → New Query → Coller → Run
```

### **2. Redémarrer le serveur** :

```bash
cd /Users/hugorivaux/CoinClashV2
pnpm dev
```

### **3. Recharger le frontend** :

```
http://localhost:3000
Cmd + Shift + R
```

### **4. Tester** :

- Se connecter avec 2 comptes différents (ou 2 navigateurs)
- Devenir amis
- Tester la messagerie 💬
- Tester l'invitation à une partie 🎮

---

## 🎨 UI/UX

### **Bouton Gamepad (🎮)** :

- **Couleur par défaut** : `text-white/60`
- **Hover** : `hover:text-blue-400`
- **Visible** : Uniquement si l'ami est **en ligne**
- **Position** :
  - Dans la liste des amis (à côté du chat)
  - Dans le header du chat (en haut à droite)

### **Messages** :

- **Mes messages** : Fond blanc, texte noir, alignés à droite
- **Messages reçus** : Liquid-glass, alignés à gauche
- **Timestamp** : Format HH:MM en français
- **Empty state** : Icône MessageCircle + texte d'encouragement

### **Notifications** :

- **Invitation reçue** : Popup native `confirm()`
- **Message envoyé** : Ajout instantané dans la liste
- **Message reçu** : Apparition temps réel si chat ouvert

---

## 📊 Fichiers Modifiés

```
✅ supabase-schema.sql
   + Table messages
   + Table game_invitations

✅ apps/server/src/db/UserService.ts
   + 8 nouvelles méthodes

✅ apps/server/src/socket/handlers.ts
   + 8 nouveaux événements socket

✅ apps/web/src/components/social/FriendsPanel.tsx
   + Messagerie temps réel
   + Invitations de jeu
   + Boutons Gamepad2
```

**Total** : 4 fichiers

---

## ✅ Résultat Final

**Avant** ❌ :

- Messages stockés en local (perdus au refresh)
- Aucun système d'invitation
- Bouton gamepad non fonctionnel

**Après** ✅ :

- ✅ **Messagerie complète** avec historique persistant
- ✅ **Invitations de jeu** avec création de salle automatique
- ✅ **Notifications temps réel** via Socket.io
- ✅ **UI/UX premium** avec boutons Gamepad2
- ✅ **Base de données** complète avec RLS
- ✅ **Expiration automatique** des invitations
- ✅ **Statuts trackés** pour tout le système

---

**Le système social est maintenant COMPLET ! 🎉**
