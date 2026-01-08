# 🚀 Déploiement via FileZilla (FTP/SFTP)

## ✅ Prérequis
- Un serveur VPS avec Node.js installé
- Accès SFTP à votre serveur

---

## 📋 ÉTAPE 1 : Préparer les fichiers localement

### 1.1 Build le frontend uniquement (il fonctionne)

```powershell
cd j:\Projet_Cours\CoinClash\apps\web
pnpm build
```

### 1.2 Pour le backend, on va le démarrer en mode dev sur le serveur

Pas besoin de build ! On utilisera `tsx` directement sur le serveur.

---

## 📋 ÉTAPE 2 : Configuration FileZilla

### 2.1 Récupérer vos identifiants SFTP

Sur Hostinger :
1. Allez dans **VPS** → Votre serveur
2. Notez :
   - **Hôte** : IP de votre serveur (ex: `89.116.147.229`)
   - **Port** : `22` (SFTP)
   - **Utilisateur** : `root` ou votre user
   - **Mot de passe** : Celui de votre VPS

### 2.2 Connexion FileZilla

1. Ouvrez FileZilla
2. Fichier → Gestionnaire de sites → Nouveau site
3. Configurez :
   - **Protocole** : SFTP
   - **Hôte** : `89.116.147.229` (votre IP)
   - **Port** : 22
   - **Type d'authentification** : Normale
   - **Identifiant** : root
   - **Mot de passe** : votre mot de passe VPS
4. Connexion

---

## 📋 ÉTAPE 3 : Upload des fichiers

### 3.1 Structure à créer sur le serveur

```
/var/www/CoinClash/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   ├── package.json
│   │   └── .env
│   └── web/
│       ├── .next/          (build)
│       ├── public/
│       ├── src/
│       ├── package.json
│       └── .env.production
├── packages/
│   └── shared/
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

### 3.2 Fichiers à uploader

**Dans FileZilla :**

1. **Créez le dossier** `/var/www/CoinClash` sur le serveur (côté droit)

2. **Uploadez TOUT le projet** :
   - Glissez-déposez le dossier `j:\Projet_Cours\CoinClash` entier
   - ⏳ Ça va prendre 5-10 minutes

---

## 📋 ÉTAPE 4 : Installation sur le serveur

### 4.1 Connexion SSH (via PuTTY ou Terminal)

```bash
ssh root@89.116.147.229
```

### 4.2 Installation des dépendances

```bash
cd /var/www/CoinClash

# Installer Node.js si pas déjà fait
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer pnpm
npm install -g pnpm

# Installer PM2
npm install -g pm2

# Installer les dépendances du projet
pnpm install
```

### 4.3 Build uniquement le frontend

```bash
cd /var/www/CoinClash/apps/web
pnpm build
```

### 4.4 Démarrer les serveurs avec PM2

```bash
# Backend (mode dev avec tsx, évite les erreurs TypeScript)
cd /var/www/CoinClash/apps/server
pm2 start "pnpm dev" --name coinclash-server

# Frontend
cd /var/www/CoinClash/apps/web
pm2 start "pnpm start" --name coinclash-web

# Sauvegarder
pm2 save
pm2 startup
```

---

## 📋 ÉTAPE 5 : Configuration Nginx

### 5.1 Installer Nginx

```bash
sudo apt-get install nginx
```

### 5.2 Créer la configuration

```bash
sudo nano /etc/nginx/sites-available/coinclash
```

Collez :

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
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
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
    }
}
```

### 5.3 Activer la configuration

```bash
sudo ln -s /etc/nginx/sites-available/coinclash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.4 Installer SSL

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d coinclash.hugo-rivaux.fr -d coinclashapi.hugo-rivaux.fr
```

---

## 🎉 C'EST FAIT !

Vos sites sont en ligne :
- https://coinclash.hugo-rivaux.fr
- https://coinclashapi.hugo-rivaux.fr

---

## 🔄 Pour mettre à jour plus tard

### Via FileZilla :
1. Modifiez vos fichiers localement
2. Uploadez uniquement les fichiers modifiés via FileZilla
3. Redémarrez les services :

```bash
ssh root@89.116.147.229
cd /var/www/CoinClash
pm2 restart all
```

---

## 🆘 Commandes utiles

```bash
# Voir les logs
pm2 logs

# Voir le statut
pm2 status

# Redémarrer
pm2 restart coinclash-server
pm2 restart coinclash-web

# Arrêter
pm2 stop all
```
