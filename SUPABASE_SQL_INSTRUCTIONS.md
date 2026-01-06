# 📊 Instructions SQL Supabase - Messagerie & Invitations

## 🎯 Objectif

Ajouter **2 nouvelles tables** à votre base Supabase existante :
- ✅ `messages` - Pour la messagerie entre amis
- ✅ `game_invitations` - Pour les invitations de jeu

---

## 🚀 Étapes à Suivre

### **1. Ouvrir Supabase Dashboard**

```
https://supabase.com/dashboard/project/ggiwdkdflwnzeznmogcq
```

### **2. Aller dans SQL Editor**

- Dans le menu de gauche, cliquer sur **"SQL Editor"**
- Cliquer sur **"New query"**

### **3. Copier le SQL**

Ouvrir le fichier : **`supabase-messaging-update.sql`**

Tout sélectionner (`Cmd+A`) et copier (`Cmd+C`)

### **4. Coller et Exécuter**

- Coller dans l'éditeur SQL de Supabase
- Cliquer sur **"Run"** (ou `Cmd+Enter`)

### **5. Vérifier le Résultat**

Vous devriez voir :

```
✅ messages: 0 rows
✅ game_invitations: 0 rows
```

Cela signifie que les tables ont été créées avec succès !

---

## 🔍 Vérifications Supplémentaires

### **Voir les Tables Créées**

Dans Supabase Dashboard :
- Aller dans **"Table Editor"** (menu gauche)
- Vous devriez voir :
  - ✅ `messages`
  - ✅ `game_invitations`

### **Vérifier les Policies RLS**

Pour chaque table :
1. Cliquer sur la table
2. Cliquer sur l'onglet **"Policies"**
3. Vérifier que vous voyez 2-3 policies activées

**Pour `messages`** :
- ✅ "Users can read their messages"
- ✅ "Users can send messages"
- ✅ "Users can update their received messages"

**Pour `game_invitations`** :
- ✅ "Users can read their invitations"
- ✅ "Users can create invitations"
- ✅ "Users can update received invitations"

---

## ❌ En Cas d'Erreur

### **Erreur : "relation already exists"**

Si vous avez déjà exécuté le script :
- ✅ C'est normal, les tables existent déjà
- ✅ Le script utilise `DROP TABLE IF EXISTS`
- ✅ Vous pouvez réexécuter sans problème

### **Erreur : "permission denied"**

Vérifiez que vous êtes bien connecté avec le bon compte Supabase (propriétaire du projet).

### **Erreur : "foreign key violation"**

Si `auth.users` n'existe pas, c'est que l'authentification Supabase n'est pas activée.
→ Aller dans **Authentication** > **Settings** et activer.

---

## ✅ Après Exécution Réussie

### **Redémarrer le Backend**

```bash
cd /Users/hugorivaux/CoinClashV2

# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis relancer :
pnpm dev
```

### **Recharger le Frontend**

```
http://localhost:3000
Cmd + Shift + R (hard refresh)
```

### **Tester**

1. Se connecter avec 2 comptes différents
2. Devenir amis
3. Tester la messagerie (💬)
4. Tester l'invitation de jeu (🎮)

---

## 📊 Structure des Tables

### **Table `messages`**

| Colonne        | Type      | Description                |
| -------------- | --------- | -------------------------- |
| id             | UUID      | ID unique du message       |
| from_user_id   | UUID      | ID de l'expéditeur         |
| to_user_id     | UUID      | ID du destinataire         |
| message        | TEXT      | Contenu du message         |
| read           | BOOLEAN   | Lu ou non lu               |
| created_at     | TIMESTAMP | Date/heure d'envoi         |

**Indexes** :
- Performance pour requêtes par expéditeur
- Performance pour requêtes par destinataire
- Performance pour conversations

---

### **Table `game_invitations`**

| Colonne        | Type      | Description                |
| -------------- | --------- | -------------------------- |
| id             | UUID      | ID unique de l'invitation  |
| from_user_id   | UUID      | ID de l'inviteur           |
| to_user_id     | UUID      | ID de l'invité             |
| room_code      | TEXT      | Code de la salle de jeu    |
| status         | TEXT      | pending/accepted/rejected  |
| created_at     | TIMESTAMP | Date/heure de création     |
| expires_at     | TIMESTAMP | Date/heure d'expiration    |

**Index** :
- Performance pour requêtes par destinataire et statut

---

## 🎯 Points Importants

✅ **RLS Activé** : Sécurité au niveau des lignes
✅ **Policies Créées** : Accès contrôlé par utilisateur
✅ **Cascade Delete** : Suppression auto si user supprimé
✅ **Expiration Auto** : Invitations expirent après 5 min
✅ **Indexes** : Performance optimale

---

## 📝 Résumé

```sql
-- Ce que fait le script :

1. ✅ Supprime les tables si elles existent (pour réexécution)
2. ✅ Crée la table messages
3. ✅ Crée 3 indexes pour messages
4. ✅ Active RLS sur messages
5. ✅ Crée 3 policies pour messages
6. ✅ Crée la table game_invitations
7. ✅ Crée 1 index pour game_invitations
8. ✅ Active RLS sur game_invitations
9. ✅ Crée 3 policies pour game_invitations
10. ✅ Affiche un résumé de vérification
```

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs dans la console SQL de Supabase
2. Vérifier que vous êtes sur le bon projet
3. Vérifier que l'authentification est activée
4. Essayer de réexécuter le script (safe avec DROP IF EXISTS)

---

**Une fois le SQL exécuté avec succès, le système de messagerie et d'invitations fonctionnera ! 🎉**

