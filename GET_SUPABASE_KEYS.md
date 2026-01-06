# 🔑 Comment Récupérer les Vraies Clés Supabase

## ⚠️ Les clés que vous avez ne sont PAS les bonnes

Les clés comme `sb_publishable_YCkoQ8YUinoFEqccZHprag_zwgWcstL` ne sont PAS les clés API complètes.

---

## 📋 Étapes pour récupérer les VRAIES clés

### 1. Allez sur Supabase Dashboard

https://app.supabase.com

### 2. Sélectionnez votre projet

Cliquez sur votre projet dans la liste

### 3. Allez dans Settings → API

1. Cliquez sur l'icône **⚙️ Settings** en bas à gauche
2. Dans le menu Settings, cliquez sur **API**

### 4. Copiez les clés

Vous verrez une section **Project API keys** avec :

```
Project URL
https://ggiwdkdflwnzeznmogcq.supabase.co

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1MjEyMzQsImV4cCI6MjAwNTA5NzIzNH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[Révéler] [Copier]

service_role
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTUyMTIzNCwiZXhwIjoyMDA1MDk3MjM0fQ.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
[Révéler] [Copier]
```

### 5. Cliquez sur "Révéler" puis "Copier"

Les vraies clés ressemblent à ça :
- Commencent par `eyJ...`
- Font environ 200-300 caractères
- Contiennent des points (`.`) qui séparent 3 parties

---

## 📸 Capture d'écran pour vous aider

Voici où trouver les clés :

```
Supabase Dashboard
├── Votre Projet
│   └── ⚙️ Settings (en bas à gauche)
│       └── API
│           ├── Project URL: https://...
│           ├── anon public: eyJ... [Révéler] [Copier]
│           └── service_role: eyJ... [Révéler] [Copier]
```

---

## ✅ Une fois que vous avez les clés

Envoyez-moi les 3 informations :

1. **Project URL** : `https://ggiwdkdflwnzeznmogcq.supabase.co` ✅ (vous l'avez déjà)
2. **anon public** : `eyJ...` (la clé complète, ~200 caractères)
3. **service_role** : `eyJ...` (la clé complète, ~200 caractères)

---

## 🎭 En attendant : Mode Guest

Vous pouvez jouer MAINTENANT en mode Guest :

1. Allez sur http://localhost:3000
2. Cliquez sur **"🎭 Continue as Guest"**
3. Créez des rooms et jouez !

⚠️ Limites du mode Guest :
- Pas de sauvegarde
- Pas de stats
- Pas de badges
- Pas d'amis

Mais vous pouvez créer des rooms et jouer normalement ! 🎮

---

## ❓ Questions Fréquentes

### Q: Pourquoi mes clés ne fonctionnent pas ?
R: Les clés que vous avez données sont des références de projet, pas les clés API JWT.

### Q: Où est le bouton "Révéler" ?
R: Dans Settings → API, à côté de chaque clé (anon public et service_role)

### Q: C'est dangereux de partager ces clés ?
R: La clé **anon public** peut être partagée (elle est dans votre frontend)
   La clé **service_role** est sensible mais OK pour le développement local

### Q: Je ne vois pas les clés ?
R: Assurez-vous d'être dans Settings → API (pas Settings → General)

---

**Récupérez les vraies clés et envoyez-les moi !** 🔐

