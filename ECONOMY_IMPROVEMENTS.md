# 🎯 Améliorations du Système Économique - Coin Clash

## Problèmes Identifiés

### Ancien Système (BRISÉ)
- **40 pièces de départ** avec **maxBet 8** = Très peu de tension
- **Récompense: 8 pièces** pour une victoire = Trop généreuse
- **50 points pour gagner** = Trop long
- **Break mode: 18 pièces** = Récupération trop facile
- **Jeu trop prévisible** = Pas d'incitation à prendre des risques

---

## Nouvelles Valeurs Implémentées

### Économie de Base
```typescript
startingCoins: 40        // Assez pour ~4-5 tours
maxBet: 8                // Équilibré pour 2+ joueurs
pointsToWin: 30          // Parties plus rapides
maxTurns: 20             // Tempo serré
coinCap: 100             // Réduit
```

### Système de Récompense Dynamique
- **Win**: `(bet * 0.6)` → Pas de bonus gratuit
- **Risk Bonus**: +1 point si tu mises 75%+ du max
- **Leader Penalty**: -30% coins si tu es trop loin devant
- **Comeback Bonus**: +50% coins si tu es trop loin derrière

### Gestion des Perdants
- **Récupération Progressive**: Si tu tombes trop bas, +25% du bet perdu
- **Tie Compensation**: +50% de ton bet en retour si personne ne gagne
- **Break Mode**: Réduit de 18 à **10 pièces** (plus risqué)

---

## Dynamiques Créées

### Avant (Trop Facile)
```
Tour 1: 40 coins, tu mises 8 → Gagne 8 coins → T'as 40 coins
        (Même si tu perds, tu as 32, donc tu récupères facilement)
```

### Après (Tension!)
```
Tour 1: 40 coins, tu mises 8 → Gagne ~4 coins nette → T'as 36 coins
        Tu perds: Tu as 32 coins (récupère 2 pièces, donc 34)
        
Tour 2-3: À 34 coins tu dois prendre des risques pour rattraper
          Si tu échoues encore, tu descends sous 25 coins (tension!)
          À 25 coins, le break mode à 10 te laisse très peu de marge
```

### Incitations Claires
1. **Miser petit** = Gagne peu, pas de progression
2. **Miser gros** = Risque grand, bonus de +1 point
3. **Être derrière** = Comeback bonus pour rattraper
4. **Être devant** = Pénalité pour éviter la domination

---

## Cas: 2 Joueurs (Ton Problème Principal)

### Avant
```
J1 vs J2
Tour 1: J1 mise 8, J2 mise 7 → J1 gagne (40 vs 33)
        Presque égal, jeu n'a pas de saveur
```

### Après
```
J1 vs J2
Tour 1: J1 mise 8, J2 mise 7 → J1 gagne ~5 coins net (40 vs 35)
        J1 a 40, J2 a 35 = Écart se creuse rapidement

Tour 2: J2 doit miser plus gros pour rattraper
        Si J2 mise 8 et perd: J2 a 27 coins (danger!)
        J2 est en "comeback mode" maintenant, get boosted rewards

Tour 3: J1 (leader) reçoit -30% coins
        J2 (behind) reçoit +50% coins
        La dynamique se rééquilibre naturellement
        
Si J2 gagne avec comeback: J2 gagne ~8 coins boosted
J2 passe de 27 à 35+ coins, remonte en jeu!
```

---

## Résultats Attendus

✅ **Plus de Tension**: Chaque pièce compte
✅ **Jeu Dynamique**: Les leaders ne dominent pas tout
✅ **Incitation au Bluff**: Miser gros = bonus point
✅ **Comebacks Possibles**: Même en retard, tu peux revenir
✅ **Partie Plus Courte**: 30 points vs 50 = Moins lassant
✅ **Équilibre 1v1**: Maxbet de 8 vs ancien 12

---

## À Tester

1. **2 joueurs**: Vérifier que maxBet de 8 est plus équilibré
2. **Cascade d'erreurs**: Vérifier que tu ne sombres pas si tu perds 2x
3. **Domination**: Vérifier que le leader ne peut pas s'enfuir
4. **Récupération**: Vérifier que le come-back est possible

