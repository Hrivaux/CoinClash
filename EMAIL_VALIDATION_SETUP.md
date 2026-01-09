# Configuration de la Validation par Email avec Supabase

## Vue d'ensemble

La validation par email a été implémentée pour sécuriser le processus d'inscription. Les utilisateurs doivent confirmer leur adresse email avant de pouvoir accéder à l'application.

## Configuration Supabase Dashboard

Pour activer la validation par email, vous devez configurer votre projet Supabase :

### 1. Activer la confirmation d'email

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Naviguez vers **Authentication** → **Settings**
4. Sous **Email Auth Settings**, configurez :
   - **Enable email confirmations** : ✅ Activé
   - **Confirm email** : ✅ Coché
   - **Double confirm email changes** : ✅ Coché (recommandé)

### 2. Configurer les templates d'email

Dans **Authentication** → **Email Templates**, personnalisez le template "Confirm signup" :

```html
<h2>Confirmer votre inscription</h2>
<p>Bonjour,</p>
<p>Merci de vous être inscrit sur Coin Clash ! Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
<p>L'équipe Coin Clash</p>
```

### 3. Configurer l'URL de redirection

Dans **Authentication** → **URL Configuration** :

- **Site URL** : `http://localhost:3000` (développement) ou votre URL de production
- **Redirect URLs** : Ajoutez les URLs suivantes :
  - `http://localhost:3000/auth/callback`
  - `https://votre-domaine.com/auth/callback` (production)

### 4. Configurer les politiques RLS (Row Level Security)

Assurez-vous que vos tables ont les bonnes politiques :

```sql
-- Politique pour la table users
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Politique pour user_profiles
CREATE POLICY "Users can insert their own user_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique pour user_stats
CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Flux d'inscription

1. **Utilisateur remplit le formulaire** sur `/login`
   - Username, Email, Mot de passe

2. **Inscription dans Supabase Auth**
   - L'utilisateur est créé dans `auth.users`
   - Un email de confirmation est envoyé automatiquement
   - Session non créée (email non confirmé)

3. **Utilisateur reçoit l'email**
   - Clique sur le lien de confirmation
   - Redirigé vers `/auth/callback`

4. **Page de callback**
   - Vérifie la session
   - Crée l'utilisateur dans la table `users`
   - Crée les profils associés (`user_profiles`, `user_stats`)
   - Connecte l'utilisateur via Socket.IO
   - Redirige vers la page d'accueil

## Développement local

### Désactiver temporairement la confirmation (optionnel)

Pour le développement, vous pouvez désactiver la confirmation email :

1. Dans Supabase Dashboard → **Authentication** → **Settings**
2. Décochez **Enable email confirmations**

⚠️ **Attention** : N'oubliez pas de réactiver cette option avant le déploiement en production !

### Tester avec des emails de test

Utilisez un service comme [Mailtrap](https://mailtrap.io) ou [Ethereal Email](https://ethereal.email) pour tester les emails en développement.

Configurez dans Supabase → **Settings** → **Auth** → **SMTP Settings** :

```
Host: smtp.mailtrap.io
Port: 2525
Username: votre-username
Password: votre-password
```

## Configuration SMTP personnalisée (Production)

Pour la production, configurez votre propre serveur SMTP :

### Avec Gmail

1. Créez un mot de passe d'application Gmail
2. Dans Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings** :

```
Host: smtp.gmail.com
Port: 465
Username: votre-email@gmail.com
Password: votre-mot-de-passe-application
Sender email: votre-email@gmail.com
Sender name: Coin Clash
```

### Avec SendGrid

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: votre-api-key-sendgrid
Sender email: noreply@votredomaine.com
Sender name: Coin Clash
```

## Fichiers modifiés

### 1. `/apps/web/src/lib/supabase.ts`
- Ajout de la configuration d'authentification
- `detectSessionInUrl: true` pour gérer les tokens dans l'URL

### 2. `/apps/web/src/app/login/page.tsx`
- Ajout de `successMessage` state
- Modification de `handleSignup` pour gérer la confirmation email
- Affichage du message de succès après inscription
- Stockage du username dans localStorage pour l'utiliser après confirmation

### 3. `/apps/web/src/app/auth/callback/page.tsx` (nouveau)
- Page de callback pour gérer la confirmation d'email
- Création de l'utilisateur dans la base de données
- Connexion automatique après confirmation

## Résolution de problèmes

### L'email de confirmation n'arrive pas

- Vérifiez les spams
- Vérifiez la configuration SMTP dans Supabase
- Vérifiez les logs dans Supabase → **Logs** → **Auth Logs**

### Erreur "Invalid token" sur la page de callback

- Vérifiez que l'URL de redirection est bien configurée dans Supabase
- Le token expire après 1 heure par défaut

### L'utilisateur n'est pas créé dans la base de données

- Vérifiez les politiques RLS
- Vérifiez les logs dans la console du navigateur
- Assurez-vous que les tables `users`, `user_profiles` et `user_stats` existent

## Variables d'environnement requises

Assurez-vous que ces variables sont configurées dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

## Sécurité

✅ **Bonnes pratiques implémentées** :
- Confirmation d'email obligatoire
- Vérification du username unique avant inscription
- Stockage sécurisé des mots de passe (hash automatique par Supabase)
- Tokens de session sécurisés
- Politiques RLS pour protéger les données

## Tests

Pour tester la fonctionnalité :

1. Allez sur `/login`
2. Cliquez sur "Inscription"
3. Remplissez le formulaire
4. Cliquez sur "Créer un compte"
5. Vérifiez votre email
6. Cliquez sur le lien de confirmation
7. Vous devriez être redirigé et connecté automatiquement

## Support

Pour plus d'informations, consultez la documentation officielle :
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Confirmation](https://supabase.com/docs/guides/auth/auth-email)
