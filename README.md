# 🎮 Coin Clash Online

**Un party game stratégique multijoueur ultra stylé avec vraie profondeur long-terme**

## 🌟 Vision

Coin Clash Online combine bluff, stratégie économique et mind games dans un environnement casino futuriste. Avec des parties de 25-40 tours, système de progression, cartes spéciales, événements aléatoires et bots IA intelligents.

## 🎯 Features Principales

### 🎲 Gameplay
- **2-6 joueurs** : duels ou parties en groupe
- **Économie stable** : 60 pièces de départ, système de comeback
- **Règle unique** : la mise unique la plus élevée gagne
- **Parties longues** : 25-40 tours viables économiquement

### 🔧 Modules Activables
- ✅ **Économie dynamique** : comeback mechanics, protection anti-snowball
- 🃏 **Cartes spéciales** : 15+ cartes (Espion, Double, Sabotage, etc.)
- 🎲 **Événements aléatoires** : 10-20 événements qui changent les règles
- 🎭 **Rôles secrets** : objectifs cachés pour stratégie long-terme
- 💬 **Chat/Emotes** : interactions sociales
- 🏆 **Leaderboards** : stats et classements

### 🌐 Social
- 👥 Système d'amis complet
- 🔑 Rooms privées par code (pas de lobby public)
- 📨 Invitations directes
- 🤖 Bots IA pour remplissage

### 📈 Progression
- ⭐ Système XP et niveaux
- 🏅 Badges et achievements
- 🎨 Cosmétiques (skins, animations, titres)
- 📊 Saisons et leaderboards

## 🏗️ Architecture

```
coin-clash-online/
├── apps/
│   ├── web/          # Frontend Next.js + Framer Motion
│   └── server/       # Backend Express + Socket.io
└── packages/
    └── shared/       # Logique partagée (types, règles, bots)
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run dev (all apps)
pnpm dev

# Build for production
pnpm build

# Start production
pnpm start
```

## 🎮 Game Rules

### Déroulement d'un Tour
1. **Événement** : carte événement affichée (si activé)
2. **Planification** : consultation cartes, chat, espionnage
3. **Mise secrète** : chaque joueur choisit 1-12 pièces
4. **Cartes instant** : fenêtre pour jouer Double, Bouclier, etc.
5. **Révélation** : reveal simultané animé
6. **Résolution** : calcul gagnant, distribution points/pièces
7. **Fin de tour** : mise à jour stats et préparation tour suivant

### Règle Cœur
- ✅ **Gagnant** : mise UNIQUE la plus élevée
- 🎁 **Récompenses** : +2 points, +8 pièces
- ⚖️ **Pas de gagnant** : tout le monde perd sa mise, +1 pièce de compensation

### Conditions de Victoire
- **Mode Standard** : 50 points OU 30 tours
- **Mode Sprint** : 20 points OU 12 tours

## 🤖 Bots IA

4 niveaux d'intelligence :
- **Rookie** : aléatoire pondéré
- **Analyst** : suit historiques et probas
- **Trickster** : bluffe avec petites mises
- **Shark** : méta-game et pattern recognition

## 🎨 Design

- **Style** : Casino futuriste premium
- **Animations** : Framer Motion pour micro-interactions
- **UI** : TailwindCSS + composants personnalisés
- **VFX** : Effets visuels et sonores immersifs

## 📦 Tech Stack

- **Frontend** : Next.js 14, React 18, Framer Motion, TailwindCSS
- **Backend** : Node.js, Express, Socket.io
- **Language** : TypeScript
- **Build** : Turborepo
- **Package Manager** : pnpm

## 📝 License

MIT

