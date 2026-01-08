# 🎯 DÉPLOIEMENT RAPIDE - Sans corriger les erreurs TypeScript

## ✅ Solution : Frontend Vercel + Backend Railway

On va déployer le backend **en mode dev** pour éviter les erreurs de build !

---

## 📋 ÉTAPE 1 : Déployer le Frontend sur Vercel

### 1.1 Installer Vercel CLI

```powershell
npm install -g vercel
```

### 1.2 Se connecter

```powershell
vercel login
```

### 1.3 Déployer

```powershell
cd j:\Projet_Cours\CoinClash\apps\web
vercel
```

Répondez :
- **Set up and deploy** → `Yes`
- **Which scope** → Votre compte
- **Link to existing project** → `No`
- **Project name** → `coinclash` ou laissez par défaut
- **Directory** → `./` (appuyez Entrée)
- **Override settings** → `No`

### 1.4 Ajouter les variables d'environnement

Dans le dashboard Vercel (https://vercel.com) :
1. Cliquez sur votre projet
2. **Settings** → **Environment Variables**
3. Ajoutez :
   - `NEXT_PUBLIC_SERVER_URL` = `https://coinclashapi.hugo-rivaux.fr`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ggiwdkdflwnzeznmogcq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODkzMTQsImV4cCI6MjA4Mjc2NTMxNH0.we0TXbxW2wTzEODo5VjyYse-xS-RGCVADU6FX-1jvTo`

### 1.5 Redéployer avec les variables

```powershell
vercel --prod
```

### 1.6 Configurer le domaine personnalisé

1. Dans Vercel → **Settings** → **Domains**
2. Ajoutez `coinclash.hugo-rivaux.fr`
3. Suivez les instructions pour configurer le DNS sur Hostinger

---

## 📋 ÉTAPE 2 : Déployer le Backend sur Railway (MODE DEV)

### 2.1 Créer un compte Railway

Allez sur https://railway.app et connectez-vous avec GitHub

### 2.2 Créer un nouveau projet

1. **New Project** → **Deploy from GitHub repo**
2. Autorisez l'accès à votre repo `CoinClash`
3. Sélectionnez le repo

### 2.3 Configuration du service

⚠️ **IMPORTANT** : On va démarrer en mode dev, pas de build !

1. Une fois le projet créé, cliquez sur **New Service** → **GitHub Repo**
2. Sélectionnez `CoinClash`
3. Allez dans **Settings** :

**Root Directory** : `apps/server`

**Build Command** : Laissez VIDE ou mettez `echo "No build"`

**Start Command** : `npm install -g pnpm && pnpm install && pnpm dev`

**Watch Paths** : `apps/server/**`

### 2.4 Ajouter les variables d'environnement

Dans Railway → **Variables** → **RAW Editor**, collez :

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://coinclash.hugo-rivaux.fr
SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODkzMTQsImV4cCI6MjA4Mjc2NTMxNH0.we0TXbxW2wTzEODo5VjyYse-xS-RGCVADU6FX-1jvTo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE4OTMxNCwiZXhwIjoyMDgyNzY1MzE0fQ.1L_wc62QnumxiDBPbWSMGV8pgJYYwlrB9cuHX71w_lA
```

### 2.5 Configurer le domaine personnalisé

1. Dans Railway → **Settings** → **Networking**
2. **Custom Domain** → Ajoutez `coinclashapi.hugo-rivaux.fr`
3. Railway va générer un CNAME
4. Allez sur **Hostinger** → **Noms de domaine** → `hugo-rivaux.fr` → **DNS**
5. Modifiez l'enregistrement A de `coinclashapi` en CNAME pointant vers l'URL Railway

### 2.6 Déployer

Cliquez sur **Deploy** dans Railway. Le serveur va démarrer en mode dev !

---

## 📋 ÉTAPE 3 : Configuration DNS Hostinger

### Pour le frontend (si pas déjà fait)

**Sous-domaine** : `coinclash`
- Si Vercel donne un **CNAME** → Utilisez-le
- Sinon, **A record** → IP que Vercel vous donne

### Pour le backend

**Sous-domaine** : `coinclashapi`
- **Type** : `CNAME`
- **Pointe vers** : L'URL que Railway vous a donnée (ex: `coinclash-server-production-abc.up.railway.app`)

---

## 🎉 C'EST FAIT !

Attendez 5-10 minutes que les DNS se propagent, puis :

- **Jeu** : https://coinclash.hugo-rivaux.fr
- **API** : https://coinclashapi.hugo-rivaux.fr

---

## 🔄 Pour mettre à jour

```powershell
# Commitez vos changements
git add .
git commit -m "update"
git push

# Vercel et Railway redéploient automatiquement !
```

---

## 🆘 Si ça ne marche pas

**Frontend ne charge pas**
- Vérifiez les variables d'environnement dans Vercel
- Vérifiez que `NEXT_PUBLIC_SERVER_URL` pointe vers Railway

**Backend ne répond pas**
- Vérifiez les logs dans Railway : **View Logs**
- Vérifiez que les variables d'environnement sont bonnes
- Le port doit être celui que Railway assigne automatiquement

**Socket.io ne connecte pas**
- Vérifiez que `CORS_ORIGIN` dans Railway = votre domaine Vercel
- Testez d'abord avec l'URL Railway directe avant le domaine personnalisé
