# 🎴 Panneau de Cartes Latéral - Interface Améliorée

## ✨ Nouvelle Fonctionnalité

Les cartes ne sont plus affichées en plein milieu de l'écran ! Elles sont maintenant dans un **panneau latéral coulissant** à droite, accessible via un bouton interactif.

---

## 🎯 Fonctionnalités

### **1. Bouton Flottant à Droite** 🔘

**Position** : Fixé à droite de l'écran, centré verticalement

**Affichage** :
- 🃏 Icône de carte
- **Nombre de cartes** en gros (ex: `3`)
- Label "Carte" ou "Cartes"
- Flèche animée `◀` qui pulse

**États** :
- **Normal** : Blanc/gris, calme
- **Jouable** : 
  - Vert brillant ✨
  - Ring vert qui pulse
  - Glow animé
  - Flèche qui bouge

**Interaction** :
- Clic → Ouvre le panneau
- Hover → Scale 1.05
- Tap → Scale 0.95

---

### **2. Panneau Coulissant** 📱

**Animation** :
- Slide depuis la droite (spring animation)
- Backdrop blur + assombrissement
- Fermeture en cliquant sur le backdrop ou le bouton X

**Structure** :

#### **Header**
- Icône de carte dans un badge
- Titre : "Vos Cartes"
- Statut :
  - ✨ "Vous pouvez jouer maintenant !" (vert)
  - ⏳ "En attente de la phase..." (gris)
- Bouton fermer (X)

#### **Body (scrollable)**
- Liste verticale des cartes
- Cartes horizontales (pas verticales)
- Chaque carte affiche :
  - Emoji (gauche)
  - Nom + Badge de rareté
  - Description (2 lignes max)
  - Flèche ▶ si jouable

#### **Footer**
- Hint : "Cliquez sur une carte pour la jouer"

---

### **3. Cartes Horizontales** 🎴

**Design** :
- Format horizontal (largeur complète)
- Gradient par rareté
- Bordure colorée
- Padding généreux

**Layout** :
```
┌─────────────────────────────────────┐
│ 🕵️  Espion          [Rare]          │
│     Révèle la mise d'un adversaire  │
│                                  ▶  │
└─────────────────────────────────────┘
```

**Interactions** :
- Hover → Scale + déplacement gauche
- Clic → Joue la carte + ferme le panneau
- Disabled si pas jouable

**Animations** :
- Apparition en cascade (delay par index)
- Slide depuis la droite
- Flèche qui pulse si jouable

---

## 🎨 Design

### **Couleurs par Rareté**

| Rareté | Gradient | Bordure | Badge |
|--------|----------|---------|-------|
| Commune | Slate (gris) | `border-slate-500/50` | Gris |
| Rare | Blue (bleu) | `border-blue-500/50` | Bleu |
| Épique | Purple (violet) | `border-purple-500/50` | Violet |

### **États Visuels**

#### **Bouton Flottant**
- **Inactif** : `text-white/70`, pas d'effet
- **Actif** : `text-green-400`, ring vert, glow pulsant

#### **Cartes**
- **Jouable** : Hover actif, flèche verte, cursor pointer
- **Non jouable** : `opacity-50`, cursor not-allowed

---

## 🔧 Implémentation Technique

### **Nouveau Composant**
**Fichier** : `apps/web/src/components/game/CardPanel.tsx`

**Props** :
```typescript
interface CardPanelProps {
  cards: CardType[]           // Liste des cartes
  onPlayCard: (cardId: string) => void  // Callback
  canPlayCards: boolean       // Si jouable maintenant
}
```

**État Local** :
```typescript
const [isOpen, setIsOpen] = useState(false)
```

**Composants Internes** :
1. `CardPanel` - Container principal
2. `CardHorizontal` - Carte individuelle

---

### **Intégration**

**Fichier modifié** : `apps/web/src/app/room/[code]/page.tsx`

**Avant** (ligne 148-169) :
```typescript
// ❌ Cartes en plein milieu de l'écran
<div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
  <CardHand cards={...} />
</div>
```

**Après** (ligne 148-158) :
```typescript
// ✅ Panneau latéral à droite
{currentPlayer && 
 currentGame.options.modules?.specialCards === true && (
  <CardPanel
    cards={currentPlayer.hand}
    onPlayCard={handlePlayCard}
    canPlayCards={
      currentGame.phase === 'planning' ||
      currentGame.phase === 'instant_cards'
    }
  />
)}
```

---

## 🎯 Avantages

### **1. Interface Dégagée** ✅
- Les cartes ne cachent plus le jeu
- Vue complète de la table
- BettingSlider toujours accessible

### **2. UX Moderne** ✅
- Panneau slide élégant
- Animations fluides
- Feedback visuel clair

### **3. Mobile-Friendly** ✅
- Panneau pleine hauteur
- Scrollable si beaucoup de cartes
- Touch-friendly

### **4. Indicateurs Clairs** ✅
- Nombre de cartes visible
- État jouable/non jouable
- Glow quand on peut jouer

---

## 🧪 Comment Tester

### **1. Créer une partie avec cartes**
1. Créer un lobby
2. **Activer** "Cartes spéciales" ✅
3. Ajouter un bot
4. Lancer la partie

### **2. Vérifications**

#### **Bouton Flottant**
- [ ] Apparaît à droite de l'écran
- [ ] Affiche le nombre de cartes (ex: `3`)
- [ ] Flèche animée visible
- [ ] Devient vert pendant les phases `planning` et `instant_cards`
- [ ] Glow pulsant quand jouable

#### **Panneau**
- [ ] S'ouvre en cliquant sur le bouton
- [ ] Slide depuis la droite (animation fluide)
- [ ] Backdrop blur visible
- [ ] Se ferme en cliquant dehors
- [ ] Se ferme en cliquant sur X

#### **Cartes**
- [ ] Affichées horizontalement
- [ ] Emoji + nom + description
- [ ] Badge de rareté
- [ ] Flèche ▶ si jouable
- [ ] Hover scale si jouable
- [ ] Clic joue la carte + ferme le panneau

#### **Phases**
- [ ] **Planning** : Bouton vert, cartes jouables
- [ ] **Betting** : Bouton gris, cartes non jouables
- [ ] **Instant Cards** : Bouton vert, cartes jouables
- [ ] **Autres phases** : Bouton gris, cartes non jouables

---

## 📊 Comparaison Avant/Après

### **❌ Avant**
```
┌─────────────────────────────┐
│                             │
│      GAME TABLE             │
│                             │
│  ┌─────────────────────┐   │
│  │  🃏  🃏  🃏         │   │ ← Cartes en plein milieu
│  └─────────────────────┘   │
│                             │
│  [BettingSlider caché]      │
└─────────────────────────────┘
```

### **✅ Après**
```
┌─────────────────────────────┬──┐
│                             │🃏│ ← Bouton
│      GAME TABLE             │3 │
│      (dégagée)              │  │
│                             │  │
│  [BettingSlider visible]    │  │
│                             │  │
└─────────────────────────────┴──┘

Clic sur le bouton →

┌──────────────────┬──────────────┐
│                  │ Vos Cartes   │
│   GAME TABLE     │              │
│                  │ 🕵️ Espion    │
│                  │ 🔍 Scanner   │
│                  │ 🛡️ Bouclier  │
│                  │              │
└──────────────────┴──────────────┘
```

---

## 🎮 Flux Utilisateur

### **Scénario : Jouer une carte**

1. **Phase Planning démarre**
   - Bouton devient vert ✨
   - Glow pulsant
   - Message : "Vous pouvez jouer maintenant !"

2. **Joueur clique sur le bouton**
   - Panneau slide depuis la droite
   - Backdrop apparaît
   - Cartes affichées en liste

3. **Joueur survole une carte**
   - Carte scale + déplacement
   - Flèche ▶ pulse

4. **Joueur clique sur une carte**
   - Carte jouée (socket emit)
   - Panneau se ferme automatiquement
   - Retour au jeu

5. **Phase Betting démarre**
   - Bouton redevient gris
   - Plus de glow
   - Cartes non jouables

---

## 📁 Fichiers

### **Créé**
- ✅ `apps/web/src/components/game/CardPanel.tsx` (230 lignes)

### **Modifié**
- ✅ `apps/web/src/app/room/[code]/page.tsx` (imports + intégration)

### **Conservé (non utilisé)**
- `apps/web/src/components/game/CardHand.tsx` (pour référence)

---

## 🚀 Prochaines Améliorations Possibles

1. **Drag & Drop** 🎯
   - Glisser la carte vers la table pour la jouer
   - Animation de vol de la carte

2. **Preview Hover** 👁️
   - Hover sur le bouton → Mini preview des cartes
   - Tooltip avec le nom des cartes

3. **Raccourcis Clavier** ⌨️
   - `C` pour ouvrir/fermer le panneau
   - `1`, `2`, `3` pour jouer les cartes

4. **Historique** 📜
   - Section "Cartes jouées ce tour"
   - Afficher l'effet des cartes

5. **Notifications** 🔔
   - Badge rouge si nouvelle carte reçue
   - Animation d'arrivée de carte

---

## 💡 Notes Techniques

### **Z-Index Layers**
```
z-40 : Backdrop
z-50 : Bouton + Panneau
```

### **Animations**
- **Spring** : Panneau slide (damping: 30, stiffness: 300)
- **Pulse** : Glow du bouton (2s loop)
- **Cascade** : Cartes (delay: index * 0.1s)

### **Responsive**
- Mobile : Panneau pleine largeur
- Desktop : `max-w-md` (28rem)

### **Performance**
- `AnimatePresence` pour les animations de sortie
- `motion.div` pour les animations fluides
- Pas de re-render inutile (état local isolé)

---

**Date** : 2026-01-02  
**Version** : 1.0  
**Statut** : ✅ Implémenté et prêt à tester

