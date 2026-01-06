# 🐛 Correction Icônes Lucide React

## ❌ Problème

L'erreur `Element type is invalid` était causée par l'import d'une icône qui **n'existe pas** dans lucide-react :

```typescript
❌ import { Mask } from 'lucide-react'  // N'EXISTE PAS !
```

---

## ✅ Solution

Remplacement par une icône existante similaire :

```typescript
// AVANT ❌
import { Mask } from 'lucide-react'

const modules = [
  { key: 'hiddenRoles', icon: Mask, ... }
]

// APRÈS ✅
import { Theater } from 'lucide-react'

const modules = [
  { key: 'hiddenRoles', icon: Theater, ... }
]
```

**Theater** (🎭) représente parfaitement les "rôles secrets" - c'est une icône de théâtre/masque de comédie.

---

## 📋 Icônes Lucide Utilisées (Vérifiées)

### ✅ Icônes Valides :
- `X` - Fermeture
- `Clock` - Mode standard
- `Zap` - Mode sprint / Événements
- `Coins` - Économie
- `TrendingUp` - Économie dynamique
- `Sparkles` - Cartes spéciales / Création
- `Shuffle` - Événements aléatoires
- `Theater` - Rôles secrets (✨ NOUVEAU)
- `Users` - Joueurs / Amis
- `ChevronRight` - Sélection
- `Info` - Information
- `User` - Profil
- `LogIn` / `LogOut` - Connexion
- `Crown` - VIP / Gagnant
- `Shield` - Protection / Paramètres
- `Trophy` - Victoires
- `Target` - Objectifs
- `Star` - Favoris
- `Award` - Badges
- `MessageCircle` - Chat
- `Search` - Recherche
- `UserPlus` / `UserMinus` - Ajouter/Retirer ami
- `Send` - Envoyer message
- `Check` - Validation
- `Copy` - Copier
- `Edit2` - Éditer
- `Save` - Sauvegarder
- `Loader2` - Chargement
- `AlertCircle` - Erreur
- `MoreVertical` - Menu
- `Gamepad2` - Inviter en partie

### ❌ Icônes Inexistantes :
- `Mask` → Remplacée par `Theater`

---

## 🔍 Comment Vérifier une Icône

```bash
# Méthode 1 : Node
node -e "const lucide = require('lucide-react'); console.log('IconName' in lucide);"

# Méthode 2 : Documentation
https://lucide.dev/icons/
```

---

## 📝 Fichier Corrigé

**CreateRoomModal.tsx** :
- ✅ Import `Mask` remplacé par `Theater`
- ✅ Module "Rôles secrets" mis à jour
- ✅ Pas d'erreurs linter

---

## 🎭 Icône Theater

L'icône `Theater` (🎭) est parfaite pour représenter les rôles secrets car :
- Elle évoque le théâtre et les masques
- Elle représente les personnages et rôles
- Elle est visuellement claire et reconnaissable
- Elle existe dans lucide-react !

---

## ✅ Test

Rechargez la page : **http://localhost:3000**

L'erreur devrait être **complètement résolue** ! 🎉

---

**Plus aucune icône inexistante ! ✅**

