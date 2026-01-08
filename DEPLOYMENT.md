# 🚀 Guide de Déploiement CoinClash

## Configuration pour coinclash.hugo-rivaux.fr

### Architecture recommandée

- **Frontend** : `https://coinclash.hugo-rivaux.fr` (Next.js)
- **Backend** : `https://coinclashapi.hugo-rivaux.fr` (Node.js + Socket.io)

---

## Option 1 : Déploiement avec un VPS (Serveur Linux)

### Prérequis sur le serveur

```bash
# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer pnpm
npm install -g pnpm

# Installer Nginx (pour le reverse proxy)
sudo apt-get install nginx

# Installer PM2 (pour gérer les processus)
npm install -g pm2
```

### 1. Transférer le projet sur le serveur

```bash
# Sur votre machine locale
scp -r j:/Projet_Cours/CoinClash user@votre-serveur:/var/www/

# Ou via Git
ssh user@votre-serveur
cd /var/www
git clone https://github.com/Hrivaux/CoinClash.git
cd CoinClash
```

### 2. Installation et build

```bash
# Sur le serveur
cd /var/www/CoinClash
pnpm install
pnpm build
```

### 3. Configuration des variables d'environnement

**Backend** : `/var/www/CoinClash/apps/server/.env`
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://coinclash.hugo-rivaux.fr

# Supabase (vos vraies valeurs)
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_KEY=votre-cle-service
```

**Frontend** : `/var/www/CoinClash/apps/web/.env.production`
```env
NEXT_PUBLIC_SERVER_URL=https://coinclashapi.hugo-rivaux.fr
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### 4. Démarrer les services avec PM2

```bash
# Backend
cd /var/www/CoinClash/apps/server
pm2 start dist/index.js --name coinclash-server

# Frontend
cd /var/www/CoinClash/apps/web
pm2 start npm --name coinclash-web -- start

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

### 5. Configuration Nginx

Créer `/etc/nginx/sites-available/coinclash` :

```nginx
# Backend API
server {
    listen 80;
    server_name coinclashapi.hugo-rivaux.fr;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name coinclash.hugo-rivaux.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer la configuration :

```bash
sudo ln -s /etc/nginx/sites-available/coinclash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Activer HTTPS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir les certificats SSL
sudo certbot --nginx -d coinclash.hugo-rivaux.fr -d coinclashapi.hugo-rivaux.fr

# Le renouvellement automatique est configuré
```

---

## Option 2 : Déploiement avec Vercel (Frontend) + VPS (Backend)

### Frontend sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer depuis le dossier web
cd apps/web
vercel

# Configurer le domaine personnalisé dans Vercel Dashboard
# Ajouter coinclash.hugo-rivaux.fr
```

Variables d'environnement Vercel :
- `NEXT_PUBLIC_SERVER_URL` = `https://coinclashapi.hugo-rivaux.fr`
- `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé Supabase

### Backend sur VPS

Suivre les étapes 1-4 ci-dessus uniquement pour le backend.

---

## Option 3 : Déploiement Docker (Recommandé pour la production)

### 1. Créer les Dockerfiles (voir docker/ dans le projet)

### 2. Build et déployer

```bash
# Sur le serveur
cd /var/www/CoinClash
docker-compose up -d
```

---

## 🔒 Checklist de sécurité

- [ ] Firewall configuré (ouvrir uniquement 80, 443, 22)
- [ ] SSL/TLS activé (Let's Encrypt)
- [ ] Variables d'environnement sécurisées (pas de commit)
- [ ] CORS correctement configuré
- [ ] Rate limiting sur l'API
- [ ] Logs configurés (PM2 ou Docker)
- [ ] Backups automatiques de la base de données

---

## 📊 Monitoring

```bash
# Voir les logs PM2
pm2 logs

# Voir le statut
pm2 status

# Redémarrer un service
pm2 restart coinclash-server
pm2 restart coinclash-web
```

---

## 🔄 Mises à jour

```bash
# Sur le serveur
cd /var/www/CoinClash
git pull
pnpm install
pnpm build
pm2 restart all
```

---

## 🆘 Dépannage

### Le backend ne se connecte pas
- Vérifier que le port 3001 est ouvert
- Vérifier les logs : `pm2 logs coinclash-server`
- Vérifier la config Nginx : `sudo nginx -t`

### Socket.io ne fonctionne pas
- Vérifier la configuration WebSocket dans Nginx
- S'assurer que `proxy_set_header Upgrade` est présent

### Next.js erreur de build
- Vérifier les variables d'environnement
- Rebuild : `cd apps/web && pnpm build`
