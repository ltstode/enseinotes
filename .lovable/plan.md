

## Plan : Sélecteur de date Apple-style pour les évaluations

### Constat

- `SchoolYear` n'a pas de `startDate`/`endDate` — seul le nom (ex: "2024-2025") existe
- `Period` a des `startDate`/`endDate` optionnels mais rarement renseignés
- Les évaluations reçoivent `date: new Date()` automatiquement, sans choix utilisateur

### Approche

On déduit la plage de l'année scolaire directement depuis le nom "YYYY-YYYY" : **1er septembre de l'année de début → 31 juillet de l'année de fin**. Cela couvre la rentrée jusqu'à la fin de l'année scolaire, sans ajouter de champs supplémentaires au modèle.

### Modifications

#### 1. `src/types/enseinotes.ts` — Ajouter dates optionnelles à SchoolYear
Ajouter `startDate?: Date` et `endDate?: Date` à l'interface `SchoolYear` pour permettre un override futur, mais la logique par défaut les déduira du nom.

#### 2. `src/components/grades/CreateEvaluationDialog.tsx` — Ajouter le date picker
- Ajouter un état `evalDate` (initialisé à aujourd'hui)
- Calculer `yearRange` depuis le nom de l'année scolaire active (ex: "2024-2025" → sept 2024 – juil 2025)
- Insérer dans l'étape 3 (Paramètres) un **Popover + Calendar** style Apple :
  - Bouton arrondi affichant la date formatée en français (ex: "15 mars 2025")
  - Calendrier contraint via `fromDate` / `toDate` à la plage de l'année
  - `pointer-events-auto` sur le Calendar pour fonctionner dans le Dialog
  - Jours hors période grisés automatiquement
- Remplacer `date: new Date()` par `date: evalDate` dans `handleSubmit`

#### 3. `src/components/grades/GradeSheet.tsx` — Afficher la date sous chaque éval
- Sous le nom de l'évaluation dans le `thead`, afficher la date en `text-[9px]` format "dd/MM"
- Trier les évaluations par date croissante dans chaque catégorie

#### 4. `src/store/appStore.ts` — Sérialisation
- S'assurer que les nouveaux champs `startDate`/`endDate` de SchoolYear sont correctement sérialisés/désérialisés dans le localStorage

### Design du sélecteur

```text
┌─────────────────────────────────┐
│  📅  15 mars 2025               │  ← Bouton Popover, rounded-2xl
└─────────────────────────────────┘
        ↓ click
┌─────────────────────────────────┐
│     ◀   Mars 2025   ▶          │
│  Lu Ma Me Je Ve Sa Di           │
│                    1  2         │
│   3  4  5  6  7  8  9          │
│  10 11 12 13 14 [15] 16        │  ← [15] = sélectionné
│  17 18 19 20 21 22 23          │
│  24 25 26 27 28 29 30 31       │
│                                 │
│  Sept 2024 ──────── Juil 2025  │  ← Plage contrainte
└─────────────────────────────────┘
```

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/types/enseinotes.ts` | `startDate?` / `endDate?` sur SchoolYear |
| `src/components/grades/CreateEvaluationDialog.tsx` | Date picker Popover+Calendar, plage année scolaire |
| `src/components/grades/GradeSheet.tsx` | Date affichée sous nom éval, tri chronologique |
| `src/store/appStore.ts` | Sérialisation des nouvelles dates |

