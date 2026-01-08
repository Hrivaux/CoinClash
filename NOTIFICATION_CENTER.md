# Centre de Notifications - Coin Clash

## Fonctionnalités

Le centre de notifications centralise toutes les notifications en temps réel de l'application :

### Types de notifications

1. **Demandes d'amis** (`friend_request`)
   - Affiche qui souhaite devenir votre ami
   - Actions : Accepter / Refuser
   - Données : `friendId`, `username`, `level`

2. **Ami accepté** (`friend_accepted`)
   - Notification quand quelqu'un accepte votre demande d'ami
   - Données : `friendId`, `username`

3. **Invitations de partie** (`game_invitation`)
   - Invitations à rejoindre une partie
   - Actions : Rejoindre / Refuser
   - Données : `roomCode`, `fromUsername`, `fromId`, `inviteId`

4. **Messages privés** (`message`)
   - Messages reçus d'autres joueurs
   - Données : `fromId`, `fromUsername`, `messageId`

5. **Succès débloqués** (`achievement`)
   - Notifications quand un badge est obtenu
   - Données : `badgeId`, `badgeName`

6. **Montée de niveau** (`level_up`)
   - Notification de passage au niveau supérieur
   - Données : `newLevel`, `xpGained`

## Composants

### `NotificationCenter.tsx`
Panel principal du centre de notifications avec :
- Liste complète des notifications
- Filtres (Toutes / Non lues / À traiter)
- Actions sur les notifications
- Gestion de l'état lu/non lu

### `NotificationToasts.tsx`
Toasts flottants pour les 3 dernières notifications non lues
- Affichage en temps réel
- Auto-dismiss possible
- Position : top-right de l'écran

### `NotificationManager.tsx`
Gestionnaire d'événements Socket.IO qui écoute tous les événements de notification et les ajoute au store

### `useNotificationStore.ts`
Store Zustand pour gérer l'état des notifications :
- `notifications`: Liste de toutes les notifications
- `unreadCount`: Nombre de notifications non lues
- `addNotification()`: Ajouter une nouvelle notification
- `markAsRead()`: Marquer comme lue
- `markAllAsRead()`: Tout marquer comme lu
- `removeNotification()`: Supprimer une notification
- `clearAll()`: Tout effacer

## Événements Socket

### Côté serveur (émis vers le client)
- `friend:request` - Demande d'ami reçue
- `friend:accepted` - Ami accepté
- `lobby:invitation_received` - Invitation de partie
- `message:private` - Message privé reçu
- `achievement:unlocked` - Succès débloqué
- `player:level_up` - Montée de niveau

### Côté client (émis vers le serveur)
- `friend:accept` - Accepter une demande d'ami
- `friend:reject` - Refuser une demande d'ami
- `invite:accept` - Accepter une invitation
- `invite:reject` - Refuser une invitation

## Utilisation

### Ouvrir le centre de notifications
Le bouton avec l'icône de cloche dans le header affiche le nombre de notifications non lues et ouvre le centre

### Ajouter un nouveau type de notification
1. Ajouter le type dans `useNotificationStore.ts`
2. Ajouter l'événement Socket dans `ServerToClientEvents` (shared/types)
3. Ajouter le listener dans `NotificationManager.tsx`
4. Ajouter l'icône dans `getNotificationIcon()` 
5. (Optionnel) Ajouter les actions spécifiques dans `NotificationCenter.tsx`

## Style
Utilise le système de design "Liquid Glass" de l'application avec :
- Effet de verre dépoli
- Animations fluides (Framer Motion)
- Badges de compteur de notifications
- Indicateurs visuels (points rouges pour non lues)
