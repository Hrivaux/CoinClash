# 🎉 CONFIGURATION TERMINÉE !

## ✅ Tout est prêt !

Les serveurs tournent avec les bonnes clés Supabase.

---

## 🚀 DERNIÈRE ÉTAPE : Configurer la base de données

### Exécuter le schéma SQL (5 minutes)

1. **Allez sur** https://app.supabase.com
2. **Sélectionnez votre projet**
3. **Cliquez sur "SQL Editor"** (dans le menu de gauche)
4. **Ouvrez le fichier** `supabase-schema.sql` (à la racine du projet)
5. **Copiez TOUT le contenu**
6. **Collez dans l'éditeur SQL**
7. **Cliquez sur "Run"** (ou appuyez sur Ctrl+Enter)

✅ Vous verrez : "Success. No rows returned"

### Désactiver la confirmation d'email (pour les tests)

1. Dans Supabase : **Authentication → Settings**
2. Cherchez **"Enable email confirmations"**
3. **Désactivez** cette option
4. Cliquez sur **Save**

---

## 🎮 TESTER LE JEU

### Option 1 : Mode Guest (Immédiat)

1. Allez sur http://localhost:3000
2. Rechargez avec **Cmd+Shift+R** (Mac) ou **Ctrl+Shift+R** (Windows)
3. Cliquez sur **"🎭 Continue as Guest"**
4. ✅ Créez une room et jouez !

### Option 2 : Créer un compte (Après SQL)

1. Sur la page de login
2. Cliquez sur **"Sign Up"**
3. Remplissez :
   ```
   Username: Player1
   Email: test@example.com
   Password: 123456
   ```
4. Cliquez sur **"Create Account"**
5. ✅ Vous êtes connecté avec un vrai compte !

---

## 🎯 Fonctionnalités disponibles

### Avec un compte (après SQL) :
- ✅ Login / Signup
- ✅ Progression sauvegardée (XP, levels)
- ✅ Stats globales
- ✅ Badges débloqués
- ✅ Cosmétiques (skins, titres)
- ✅ Système d'amis
- ✅ Historique des parties
- ✅ Leaderboard global

### En mode Guest :
- ✅ Créer des rooms
- ✅ Rejoindre avec un code
- ✅ Ajouter des bots (4 niveaux d'IA)
- ✅ Toutes les mécaniques de jeu
- ✅ Modules (cartes, événements, rôles)
- ❌ Pas de sauvegarde

---

## 🎲 Créer votre première partie

1. **Créer une Room**
   - Choisissez le mode : Standard (50 pts, 30 tours) ou Sprint (20 pts, 12 tours)
   - Activez les modules que vous voulez
   - Configurez l'économie (60 coins recommandé)

2. **Ajouter des joueurs**
   - Partagez le code de room avec des amis
   - OU ajoutez des bots :
     - 🤖 **Rookie** : Facile (random)
     - 🤖 **Analyst** : Moyen (analyse probabiliste)
     - 🤖 **Trickster** : Difficile (bluffe)
     - 🤖 **Shark** : Très difficile (meta-game)

3. **Cliquez sur "Ready"** puis **"Start Game"**

4. **Profitez du jeu !** 🎮

---

## 📊 Modules du jeu

### ✅ Économie Dynamique
- Comeback mechanics
- Recovery mode (18 coins à 0)
- Anti-snowball (coin cap 120)

### 🃏 Cartes Spéciales (9 types)
- **Espion** : Voir la mise d'un adversaire
- **Double** : Mise x2
- **Bouclier** : Ne pas perdre ses pièces
- **Sabotage** : Le gagnant perd 6 pièces
- Et 5 autres...

### 🎲 Événements Aléatoires (10+)
- **Mises Doublées** : Toutes les mises x2
- **Le Petit Gagne** : Plus petite mise unique gagne
- **Lucky 7** : Miser 7 = récompenses doublées
- Et bien d'autres...

### 🎭 Rôles Secrets (6 rôles)
- **Banquier** : +1 pt si ≥70 coins
- **Saboteur** : +2 pts quand quelqu'un tombe à 0
- **Renard** : +6 pts si jamais accusé
- **Guerrier** : +1 pt par série de 2 victoires
- Et plus...

---

## 🐛 Dépannage

### SQL Editor : Erreur lors de l'exécution
→ Supprimez les anciennes tables d'abord (voir AUTH_SETUP.md)

### "Invalid API key" encore
→ Rechargez la page avec Cmd+Shift+R (vider le cache)

### Ne peut pas créer de compte
→ Vérifiez que le schéma SQL a été exécuté

### Guest mode ne fonctionne pas
→ Le guest mode devrait toujours fonctionner, rechargez la page

---

## 📚 Documentation

- **README.md** : Vue d'ensemble du projet
- **SETUP.md** : Guide complet
- **AUTH_SETUP.md** : Configuration authentification
- **SUPABASE_SETUP.md** : Guide Supabase détaillé
- **QUICK_START.md** : Démarrage rapide

---

## 🎉 C'est Parti !

**Votre jeu Coin Clash Online est maintenant complètement opérationnel !**

1. ✅ Serveurs lancés
2. ✅ Clés Supabase configurées
3. ⏳ Schéma SQL à exécuter (5 min)
4. 🎮 Prêt à jouer !

---

## 💡 Conseils

- **Testez d'abord en Guest Mode** pour comprendre le jeu
- **Ajoutez des bots Shark** pour un vrai défi
- **Activez tous les modules** pour l'expérience complète
- **Mode Standard Long** pour des parties stratégiques (30 tours)
- **Mode Sprint** pour des parties rapides (12 tours)

---

**Amusez-vous bien !** 🎮💰🎲

*Un party game avec bluff, stratégie, et mind games*

