# 🔐 Authentication Setup - IMPORTANT

## ⚠️ MISE À JOUR REQUISE

Le système d'authentification a été ajouté ! Vous devez **mettre à jour le schéma Supabase**.

---

## 🚀 Étapes Rapides (5 minutes)

### 1. Mettre à jour Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor**
4. **SUPPRIMEZ les anciennes tables** (si elles existent) :

```sql
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS game_history CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP MATERIALIZED VIEW IF EXISTS leaderboard_global;
```

5. **Copiez tout le contenu de `supabase-schema.sql`**
6. **Collez dans l'éditeur SQL**
7. **Exécutez** (Run ou Ctrl+Enter)

✅ Le schéma est mis à jour avec authentification !

---

### 2. Configurer l'authentification Email dans Supabase

1. Dans Supabase Dashboard, allez dans **Authentication > Providers**
2. Activez **Email** (devrait être activé par défaut)
3. Dans **Email Templates**, vous pouvez personnaliser les emails (optionnel)
4. Pour le développement, désactivez la confirmation d'email :
   - Allez dans **Authentication > Settings**
   - Cherchez "Enable email confirmations"
   - **Désactivez** cette option (pour faciliter les tests)

---

### 3. Recharger l'application

```bash
# Le serveur tourne déjà, rechargez simplement votre navigateur
# Ou redémarrez avec :
pnpm dev
```

Allez sur http://localhost:3000

---

## 🎮 Utilisation

### Page de Login

Vous verrez maintenant une **page de login** avec 3 options :

#### Option 1 : **Sign Up** (Créer un compte)

1. Cliquez sur "Sign Up"
2. Entrez :
   - **Username** : `Player1` (ou autre, 3-20 caractères)
   - **Email** : `test@example.com`
   - **Password** : `password123` (min 6 caractères)
3. Cliquez "Create Account"
4. ✅ Vous êtes connecté !

#### Option 2 : **Login** (Se connecter)

1. Utilisez les identifiants d'un compte existant
2. Cliquez "Login"
3. ✅ Vous êtes connecté !

#### Option 3 : **Guest Mode** (Mode invité)

1. Cliquez "Continue as Guest"
2. Un username aléatoire sera généré (`Guest_abc123`)
3. ⚠️ **Aucune progression sauvegardée en mode invité**

---

## ✅ Après connexion

Une fois connecté, vous verrez :

```
Playing as: YourUsername   [Logout]
```

Maintenant vous pouvez :

- ✅ **Créer une Room**
- ✅ **Rejoindre une Room**
- ✅ **Voir votre profil** (stats, badges, progression)
- ✅ **Ajouter des amis**

---

## 🎯 Fonctionnalités avec Authentification

### Comptes Persistants

- ✅ Username unique
- ✅ Email & mot de passe sécurisé (Supabase Auth)
- ✅ Session persistante (reste connecté)

### Progression Sauvegardée

- ✅ Level & XP
- ✅ Statistiques globales
- ✅ Badges débloqués
- ✅ Cosmétiques (skins, titres, animations)
- ✅ Historique des parties

### Social

- ✅ Liste d'amis
- ✅ Invitations
- ✅ Classement global

---

## 🧪 Test Rapide

### Créer 2 comptes pour tester :

**Compte 1:**

```
Username: Alice
Email: alice@test.com
Password: 123456
```

**Compte 2:**

```
Username: Bob
Email: bob@test.com
Password: 123456
```

Ensuite :

1. Alice crée une room → obtient un code (ex: `AB7KQ`)
2. Bob rejoint avec le code
3. Lancez une partie !

---

## 🐛 Dépannage

### Erreur "Username already taken"

→ Choisissez un autre username

### Erreur "Email already registered"

→ Utilisez un autre email OU connectez-vous avec Login

### Page blanche après login

→ Rechargez la page (F5)

### "Failed to create user"

→ Vérifiez que vous avez bien exécuté le nouveau schéma SQL

### Guest mode ne fonctionne pas

→ Le guest mode fonctionne sans base de données, mais pas de sauvegarde

---

## 📋 Checklist Complète

- [ ] Supabase : Anciennes tables supprimées
- [ ] Supabase : Nouveau schéma exécuté
- [ ] Supabase : Email confirmation désactivée (Settings)
- [ ] Browser : Page rechargée (http://localhost:3000)
- [ ] Test : Création de compte réussie
- [ ] Test : Login réussi
- [ ] Test : Création de room fonctionne
- [ ] Test : Join room fonctionne

---

## 🎉 C'est Prêt !

Une fois ces étapes complétées, vous pouvez :

1. **Créer un compte** ou utiliser **Guest Mode**
2. **Créer une room** avec vos options
3. **Inviter des amis** ou **ajouter des bots**
4. **Jouer** et voir votre **progression sauvegardée** !

---

## 💡 Pro Tips

### Pour développer rapidement

- Utilisez Guest Mode pour tester sans créer de compte
- Ou créez un compte test : `dev@test.com` / `123456`

### Pour tester le multijoueur

- Ouvrez 2 onglets en navigation privée
- Créez 2 comptes différents
- Jouez ensemble !

### Pour voir les stats

- Après quelques parties, cliquez sur "Profile"
- Vos badges et niveaux s'affichent
- Le leaderboard montre votre classement

---

**Amusez-vous bien !** 🎮💰🎲
