# 🎯 Guide de Déploiement Rapide - CoinClash

## ✅ Sous-domaines créés
- ✅ coinclash.hugo-rivaux.fr
- ✅ coinclashapi.hugo-rivaux.fr

---

## 📋 ÉTAPE 1 : Configurer les variables d'environnement

### 1.1 Récupérer vos clés Supabase

Allez sur https://supabase.com → Votre projet → Settings → API

Vous aurez besoin de :
- **Project URL** (ex: `https://abcdefgh.supabase.co`)
- **anon/public key** (commence par `eyJ...`)
- **service_role key** (commence par `eyJ...`)

### 1.2 Mettre à jour les fichiers

**Frontend** : `apps/web/.env.production`
```env
NEXT_PUBLIC_SERVER_URL=https://coinclashapi.hugo-rivaux.fr
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...votre-cle
```

**Backend** : `apps/server/.env`
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://coinclash.hugo-rivaux.fr

SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...votre-cle
SUPABASE_SERVICE_KEY=eyJ...votre-service-key
```

---

## 📋 ÉTAPE 2 : Tester le build localement

```powershell
# Dans le terminal VS Code
cd j:\Projet_Cours\CoinClash

# Build tout le projet
pnpm build
```

Si ça build sans erreurs, on peut déployer !

---

## 📋 ÉTAPE 3 : Déployer le Frontend sur Vercel (GRATUIT)

### 3.1 Installer Vercel CLI

```powershell
npm install -g vercel
```

### 3.2 Déployer

```powershell
cd apps\web
vercel
```

Répondez aux questions :
- **Set up and deploy** → Yes
- **Which scope** → Votre compte personnel
- **Link to existing project** → No
- **Project name** → coinclash (ou laissez par défaut)
- **Directory** → ./ (appuyez Entrée)
- **Override settings** → No

### 3.3 Configurer le domaine personnalisé

Une fois déployé, allez sur https://vercel.com/dashboard :
1. Cliquez sur votre projet "coinclash"
2. Settings → Domains
3. Ajoutez : `coinclash.hugo-rivaux.fr`
4. Vercel va vous donner un CNAME - retournez sur Hostinger et ajustez si nécessaire

### 3.4 Ajouter les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables :
- `NEXT_PUBLIC_SERVER_URL` = `https://coinclashapi.hugo-rivaux.fr`
- `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anon

Puis redéployez : `vercel --prod`

---

## 📋 ÉTAPE 4 : Déployer le Backend sur Railway (GRATUIT)

### 4.1 Créer un compte Railway

Allez sur https://railway.app et connectez-vous avec GitHub

### 4.2 Créer un nouveau projet

1. **New Project** → **Deploy from GitHub repo**
2. Sélectionnez votre repo `CoinClash`
3. Railway va détecter automatiquement le monorepo

### 4.3 Configurer le service

1. **Root Directory** : `/apps/server`
2. **Build Command** : `cd ../.. && pnpm install && pnpm --filter @coin-clash/server build`
3. **Start Command** : `node dist/index.js`
4. **Watch Paths** : `/apps/server/**`

### 4.4 Ajouter les variables d'environnement

Dans Railway → Variables :
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://coinclash.hugo-rivaux.fr
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

### 4.5 Configurer le domaine personnalisé

1. Settings → Networking → **Custom Domain**
2. Ajoutez : `coinclashapi.hugo-rivaux.fr`
3. Railway va générer un CNAME - suivez les instructions pour Hostinger

---

## 🎉 C'EST FAIT !

Vos URLs :
- **Jeu** : https://coinclash.hugo-rivaux.fr
- **API** : https://coinclashapi.hugo-rivaux.fr

---

## 🔄 Pour mettre à jour plus tard

```powershell
# Push sur GitHub
git add .
git commit -m "update"
git push

# Vercel et Railway se redéploieront automatiquement !
```

---

## 🆘 Problèmes courants

**Erreur de connexion au serveur**
- Vérifiez que `NEXT_PUBLIC_SERVER_URL` dans Vercel pointe bien vers Railway
- Vérifiez que `CORS_ORIGIN` dans Railway pointe bien vers Vercel

**Socket.io ne connecte pas**
- Railway supporte WebSocket automatiquement, pas de config spéciale

**Build échoue**
- Vérifiez les logs dans Vercel/Railway Dashboard
- Testez `pnpm build` en local d'abord
