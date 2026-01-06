# ⚡ Quick Start - Coin Clash Online

## 🚀 Installation & Lancement Rapide

```bash
# 1. Installer les dépendances
pnpm install

# 2. Créer les fichiers d'environnement (voir ci-dessous)

# 3. Configurer Supabase (voir SUPABASE_SETUP.md)

# 4. Lancer en développement
pnpm dev
```

Le jeu sera disponible sur :
- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:3001

---

## 📝 Configuration des Variables d'Environnement

### Étape 1 : Backend (`apps/server/.env`)

Créez le fichier et ajoutez :

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Supabase
SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
SUPABASE_SERVICE_KEY=7mrcMB7CpW0TnK1YyP8Z5Q_fFuPRU9G
```

**Commande rapide** :
```bash
cat > apps/server/.env << 'EOF'
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
SUPABASE_SERVICE_KEY=7mrcMB7CpW0TnK1YyP8Z5Q_fFuPRU9G
EOF
```

---

### Étape 2 : Frontend (`apps/web/.env.local`)

Créez le fichier et ajoutez :

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
```

**Commande rapide** :
```bash
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
EOF
```

---

## 🗄️ Configuration Supabase (5 minutes)

### Option 1 : Via Interface Web

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor**
4. Ouvrez le fichier `supabase-schema.sql` à la racine du projet
5. Copiez tout le contenu
6. Collez dans l'éditeur SQL
7. Cliquez sur **Run** (ou Ctrl+Enter)

✅ **Le schéma est créé !** (tables, indexes, badges, etc.)

### Option 2 : Via CLI Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Lien avec votre projet
supabase link --project-ref ggiwdkdflwnzeznmogcq

# Exécuter le schéma
supabase db push
```

---

## ✅ Vérification

### Test de la Base de Données

Dans SQL Editor de Supabase :
```sql
-- Vérifier les badges
SELECT COUNT(*) FROM badges;
-- Devrait retourner : 10

-- Vérifier les tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Test du Serveur

```bash
# Terminal 1 : Backend
cd apps/server
pnpm dev

# Terminal 2 : Frontend
cd apps/web
pnpm dev
```

Ouvrez http://localhost:3000 et testez :
1. Créer une room
2. Ajouter des bots
3. Lancer une partie

---

## 🎮 Jouer au Jeu

1. **Page d'accueil** : http://localhost:3000
2. **Créer une room** : Configurez les options
3. **Code de room** : Partagez avec des amis (ex: `AB7KQ`)
4. **Ou ajouter des bots** : Cliquez sur "Add Bot"
5. **Démarrer** : Host clique sur "Start Game"

---

## 🐛 Troubleshooting

### Erreur : "Cannot find module '@coin-clash/shared'"
```bash
cd packages/shared
pnpm build
```

### Erreur : "Supabase connection failed"
Vérifiez que :
- Les fichiers `.env` existent
- Les clés Supabase sont correctes
- Le schéma SQL a été exécuté

### Port déjà utilisé
Changez le port dans les `.env` :
```env
PORT=3002  # Backend
```

### Réinstaller proprement
```bash
pnpm clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

---

## 📚 Documentation Complète

- **SETUP.md** : Guide détaillé du projet
- **SUPABASE_SETUP.md** : Guide complet Supabase
- **README.md** : Vue d'ensemble du projet

---

## 🎉 Prêt à Jouer !

Vous êtes maintenant prêt à jouer à **Coin Clash Online** ! 🎮💰

Pour toute question, consultez la documentation ou les commentaires dans le code.

**Have fun!** 🚀

