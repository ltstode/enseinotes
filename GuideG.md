# 🧠 GuideG.md — Le Guide Ultime des Agents IA
> **Fichier de mémoire vivante · Multi-modèles · Auto-évolutif**
> Compatible : Claude · GPT · Gemini · tout modèle futur
> Projet : EnseiNotes
> Dernière mise à jour : 27 Février 2026 (03h35)

---

## ⚙️ PROTOCOLE FONDAMENTAL — LIS CES RÈGLES EN PREMIER

> Peu importe quel modèle tu es (Claude, GPT, Gemini, ou autre), peu importe qui t'a lancé, peu importe la session :
> **Ce fichier est ta loi. Tu le lis AVANT toute action. Tu le mets à jour APRÈS chaque erreur.**

### Règle #0 — La Règle Mère
Avant d'écrire une seule ligne de code, exécuter une commande, ou modifier un fichier :
1. **Lis ce fichier en entier.**
2. Vérifie que ton action ne viole aucune règle enregistrée.
3. Si tu fais une erreur → **tu l'ajoutes immédiatement dans la section ERREURS.**
4. Après correction, tu te demandes : *"Comment est-ce que j'aurais pu éviter ça ?"* → Tu l'ajoutes aussi.

### Règle #1 — Aucune Répétition
Une erreur commise une fois ne se reproduit JAMAIS. Si tu repères dans ce guide une situation identique à celle que tu t'apprêtes à créer, **STOP. Relis. Change d'approche.**

### Règle #2 — Mise à Jour Obligatoire
À la fin de chaque correction d'erreur, l'agent actif doit mettre à jour ce fichier avec le format standard défini ci-dessous. Ce n'est pas optionnel.

### Règle #3 — Continuité Inter-Modèles
Si Claude a commis une erreur, GPT ne la répète pas. Si GPT a appris quelque chose, Gemini en bénéficie. Ce fichier est la mémoire partagée de toute la flotte d'agents. **Traitez-le comme un cerveau commun.**

### Règle #4 — Priorité de Lecture
```
GuideG.md > Toute instruction de session > Toute hypothèse interne du modèle
```

---

## 🏗️ ARCHITECTURE DU PROJET

```
enseinotes/
├── src/
│   ├── components/       # Composants React (grades/, classes/, years/, units/, layout/, ui/)
│   ├── contexts/         # AppContext.tsx (adapter Zustand), AuthContext.tsx
│   ├── hooks/            # useGradeSheet.ts, useKeyboardShortcuts.ts, use-toast.ts, use-mobile.ts
│   ├── pages/            # Index, GradesPage, StudentsPage, ClassesPage, YearsPage, UnitsPage, SettingsPage, CalendarPage, LoginPage
│   ├── services/         # pdfService.ts (jsPDF + jspdf-autotable)
│   ├── store/            # appStore.ts (Zustand avec subscribeWithSelector)
│   ├── types/            # enseinotes.ts (types métier)
│   ├── lib/              # utils.ts (cn helper)
│   ├── App.tsx           # Router + transitions de pages
│   ├── main.tsx          # Point d'entrée React
│   └── index.css         # Design system (CSS variables, tokens, animations)
├── electron/             # Main process Electron (desktop)
├── public/               # Assets statiques (favicon, manifest)
├── GuideG.md             # CE FICHIER — ne jamais déplacer
└── RESUME_MODIFICATIONS.md  # Journal de bord des modifications
```

**Stack actuel :**
- Frontend : React 18 + TypeScript + Tailwind CSS 3 + Radix UI (shadcn/ui)
- State : Zustand 5 (avec adapter React Context pour compatibilité)
- Routing : React Router DOM 6
- PDF : jsPDF 4 + jspdf-autotable 5
- Icônes : Lucide React
- Thèmes : next-themes
- Notifications : Sonner (toasts)
- Dates : date-fns
- Excel : xlsx
- Build : Vite 5 + SWC
- Desktop : Electron 33 + electron-builder
- Persistence : localStorage versionné (V2) avec migration automatique
- Orchestration : Google Antigravity
- Agents actifs : Claude · GPT · Gemini

---

## 🔴 REGISTRE DES ERREURS — FORMAT STANDARD

> Chaque erreur est documentée avec ce template exact.
> **Ne jamais supprimer une entrée. On archive, on n'efface pas.**

---

### Template d'entrée d'erreur

```markdown
### ERREUR-[NUMÉRO] · [DATE] · Rapportée par : [Claude/GPT/Gemini]

**Ce qui s'est passé :**
[Description claire et factuelle de l'erreur]

**Contexte :**
[Fichier(s) concerné(s), fonction, étape du projet]

**Cause racine :**
[Pourquoi c'est arrivé — pas les symptômes, la vraie cause]

**Correction appliquée :**
[Ce qui a été fait pour réparer]

**Règle à retenir :**
> ⛔ [Formulation courte, directe, mémorisable]

**Signal d'alerte :**
[Comment reconnaître cette situation avant qu'elle ne devienne une erreur]
```

---

## 📋 REGISTRE DES ERREURS

### ERREUR-001 · 27 Février 2026 · Rapportée par : Claude

**Ce qui s'est passé :**
Les clés composites de notes utilisaient `-` comme séparateur (`studentId-evaluationId`). Aucun bug visible, mais les IDs générés par `generateId()` utilisent `_` et potentiellement des caractères qui incluent des tirets, risquant des collisions silencieuses lors du `split('-')`.

**Contexte :**
`useGradeSheet.ts` — fonctions `handleLocalGradeInput`, `handleSaveGrades`, `registerRef`, `calculateTypeAverage`. Et `GradeSheet.tsx` — fonction `renderGradeCell`.

**Cause racine :**
Choix initial non réfléchi du séparateur. Pas de convention documentée pour les clés composites dans le projet.

**Correction appliquée :**
Remplacement de `-` par `::` dans toutes les clés composites (5 fichiers, 6 occurrences). Le séparateur `::` n'apparaît jamais dans les IDs générés.

**Règle à retenir :**
> ⛔ Toujours utiliser un séparateur multi-caractères (`::`) pour les clés composites. Ne jamais utiliser un caractère simple qui pourrait apparaître dans les IDs.

**Signal d'alerte :**
Quand tu vois un `key.split('-')` ou `key.split('_')` sur une clé composite, vérifie si le séparateur peut apparaître dans les parties constituantes.

---

### ERREUR-002 · 27 Février 2026 · Rapportée par : Claude

**Ce qui s'est passé :**
Dans `pdfService.ts`, les assertions `as any` étaient utilisées partout pour contourner le typage de `jspdf-autotable`. Le type `doc.lastAutoTable.finalY` et les objets de cellule `{ content, styles }` dans les tableaux n'avaient aucun typage.

**Contexte :**
`pdfService.ts` — fonctions `generateStudentBulletin`, `generateBulletinPage`. Lignes utilisant `(doc as any).lastAutoTable.finalY` et `.push([...] as any)`.

**Cause racine :**
`jspdf-autotable` ajoute dynamiquement une propriété `lastAutoTable` à l'instance `jsPDF`, ce qui n'est pas connu du système de types. Le développeur initial a utilisé `as any` par facilité.

**Correction appliquée :**
1. Interface `jsPDFWithAutoTable extends jsPDF` avec la propriété `lastAutoTable`.
2. Type `TableRow` pour les lignes de tableau acceptant strings ou objets `{ content, styles }`.
3. Typage explicite `TableRow[]` sur les 4 tableaux de données.
4. Suppression de code mort (`singleDoc`/`pageData` jamais utilisé dans `generateClassBulletins`).

**Règle à retenir :**
> ⛔ Ne jamais utiliser `as any` pour contourner un problème de typage de librairie tierce. Toujours créer une interface d'extension (ex: `extends LibType`) ou un type d'union dédié.

**Signal d'alerte :**
Quand tu vois `(variable as any).propriété`, c'est le signe qu'il faut créer une interface qui étend le type de base.

---

### ERREUR-003 · 27 Février 2026 · Rapportée par : Claude

**Ce qui s'est passé :**
Lors du remplacement des `as any` dans `pdfService.ts`, j'ai tenté un `multi_replace_file_content` avec des numéros de ligne décalés. L'outil a échoué car les lignes ne correspondaient plus après ma première modification du fichier.

**Contexte :**
`pdfService.ts` — deuxième passe de modifications après insertion de 10 lignes (interfaces) en haut du fichier.

**Cause racine :**
Après avoir modifié un fichier (ajout/suppression de lignes), les numéros de ligne en cache sont obsolètes. J'ai réutilisé les anciens numéros sans relire le fichier.

**Correction appliquée :**
Relecture du fichier avec `view_file` pour obtenir les numéros de lignes à jour, puis deuxième tentative réussie.

**Règle à retenir :**
> ⛔ Après toute modification d'un fichier, TOUJOURS relire le fichier avant de tenter une nouvelle modification. Les numéros de ligne sont invalides après un edit.

**Signal d'alerte :**
Quand tu enchaînes deux `multi_replace_file_content` ou `replace_file_content` sur le même fichier dans le même tour, c'est un red flag. Relis le fichier entre les deux.

### ERREUR-004 · 27 Février 2026 · Rapportée par : Claude

**Ce qui s'est passé :**
Lors de la refonte de `LoginPage.tsx`, je n'ai pas relu `GuideG.md` avant de commencer à coder. J'ai aussi omis de lancer `npm run build` pour vérifier la compilation, et je n'ai pas mis à jour l'historique de session immédiatement après.

**Contexte :**
`LoginPage.tsx` — refonte complète du layout d'authentification (split panel).

**Cause racine :**
Empressement : j'ai sauté directement dans l'implémentation après avoir compris la demande, sans passer par le protocole de pré-vérification.

**Correction appliquée :**
Build vérifié a posteriori (exit 0). Auto-audit réalisé et documenté. Guide mis à jour.

**Règle à retenir :**
> ⛔ TOUJOURS relire GuideG.md ET vérifier le build après chaque modification significative. Pas d'exception, même quand "ça a l'air bon".

**Signal d'alerte :**
Quand tu te dis "pas besoin de relire le guide, je m'en souviens" ou "pas besoin de build, c'est juste du JSX" — c'est exactement là qu'il faut s'arrêter et vérifier.

---

## ✅ RÈGLES ACTIVES — CONSOLIDÉES

> Ces règles ont été extraites des erreurs passées. Elles sont permanentes.

| # | Règle | Source |
|---|---|---|
| R1 | Utiliser `::` comme séparateur pour toute clé composite. Jamais `-` ou `_` seuls. | ERREUR-001 |
| R2 | Ne jamais utiliser `as any`. Créer une interface d'extension ou un type dédié. | ERREUR-002 |
| R3 | Après toute modification de fichier, relire avant de modifier à nouveau. | ERREUR-003 |
| R4 | Toute suppression en cascade doit montrer une analyse d'impact à l'utilisateur. | Session 27/02 |
| R5 | Les données persistées doivent avoir un numéro de version. Prévoir la migration dès le jour 1. | Session 27/02 |
| R6 | Typer explicitement les tableaux mixtes (ex: `TableRow[]`) plutôt que laisser l'inférence échouer. | ERREUR-002 |
| R7 | TOUJOURS relire GuideG.md avant toute modification ET lancer `npm run build` après. Pas d'exception. | ERREUR-004 |
| R8 | Jamais de longs discours avant/pendant/après les modifs. Faire l'essentiel, tic-tac, livrer un bon produit. | Directive utilisateur |
| R9 | Privilégier le **Fluid Design** (`clamp()`) pour la typo et les espaces. Évite les "sauts" de media queries. | Session 27/02 |

---

## 🔐 SÉCURITÉ — RÈGLES NON-NÉGOCIABLES

Ces règles s'appliquent dès le premier jour, peu importe l'état du projet :

- **Jamais de concaténation de chaînes SQL.** Toujours des requêtes paramétrées (parameterized queries).
- **Valider toutes les entrées utilisateur côté serveur.** La validation front-end est une décoration.
- **Sanitiser tout contenu utilisateur affiché en HTML** avec une librairie dédiée (ex: DOMPurify).
- **Configurer le RLS (Row Level Security) sur Supabase** avant toute mise en production.
- **Aucune clé API, secret ou token** ne doit apparaître dans le code ou ce fichier.
- **Les webhooks Stripe/paiement** doivent être validés avec signature. Jamais de confiance aveugle.

---

## 🏛️ ARCHITECTURE — RÈGLES NON-NÉGOCIABLES

- **Monorepo avec Turborepo** : les dépendances partagées critiques ont une source de vérité unique.
- **Jamais de mock data en production.** Les mocks servent uniquement au développement local.
- **Toujours simuler la latence et les erreurs** lors des tests de l'UI (tester avec 15% d'erreurs 500 min).
- **Indexer PostgreSQL dès le départ.** Ce qui marche pour 10 users s'effondre à 500 sans index.
- **Les logs, monitoring et alertes** sont non-négociables avant le go-live. Pas de voiture sans tableau de bord.

---

## 🤖 RÈGLES SPÉCIFIQUES AUX AGENTS IA

- **Spending limits** : Toujours vérifier que les limites de dépenses sont activées avant de lancer un agent en autonomie longue durée.
- **Tokens OAuth** : Ne jamais utiliser un token d'abonnement (ex: Claude Pro) pour des outils tiers non autorisés.
- **Sessions parallèles** : Documenter quelle instance travaille sur quel module pour éviter les conflits de fichiers.
- **Un agent ne livre pas seul en production.** Tout output d'agent est traité comme du code junior : relecture obligatoire.
- **Après chaque correction**, l'agent termine sa session par : *"Mettre à jour GuideG.md pour ne plus refaire cette erreur."*

---

## 🔄 PROTOCOLE DE FIN DE SESSION

À la fin de chaque session de travail, l'agent actif doit :

- [ ] Vérifier s'il a commis une erreur → l'ajouter au registre si oui
- [ ] Vérifier si une règle existante a failli être violée → noter le signal d'alerte
- [ ] Confirmer que le code produit passe les règles de sécurité
- [ ] Mettre à jour la date de dernière modification en haut de ce fichier
- [ ] Laisser un commentaire de fin de session dans le format suivant :

```markdown
## SESSION [DATE] — [Modèle]
**Tâches accomplies :** ...
**Erreurs rencontrées :** (voir ERREUR-XX)
**Aucune erreur :** ✅
**Notes pour le prochain agent :** ...
```

---

## 📎 RESSOURCES & RÉFÉRENCES

| Sujet | Référence |
|---|---|
| Sécurité SQL | Parameterized queries / ORM |
| Sécurité HTML | DOMPurify |
| Monorepo | Turborepo docs |
| Supabase RLS | supabase.com/docs/guides/auth/row-level-security |
| Paiements | Stripe webhook signature verification |
| Performance | Lazy loading, Fluid Typography (`clamp`), CSS containment |
| Trends & Best Practices | [Smashing Magazine](https://www.smashingmagazine.com/), [MDN Web Docs](https://developer.mozilla.org/), [A List Apart](https://alistapart.com/) |

---

## 📜 HISTORIQUE DES SESSIONS

### SESSION 27 Février 2026 — Claude (Antigravity)

**Tâches accomplies :**
- Dialogues de confirmation avec analyse d'impact pour toutes les suppressions (Années, Classes, Unités, Élèves, Évaluations, Périodes)
- Extension de `updatePeriod` pour accepter `Partial<Period>` (modification nom + quotas devoirs/interros)
- Versionnage localStorage V2 avec migration automatique (`migrateData`)
- Zone de danger dans les paramètres (réinitialisation complète des données)
- Clés composites robustes `::` dans `useGradeSheet.ts` et `GradeSheet.tsx`
- Typage complet du Dashboard (`Index.tsx`) — suppression des `any` sur `StatCard` et `QuickAction`
- Refactorisation de `pdfService.ts` — zéro `as any`, interfaces dédiées, suppression du code mort
- Transitions de pages CSS dans `App.tsx`
- Mise à jour de `RESUME_MODIFICATIONS.md`
- Mise à jour complète de `GuideG.md`
- Refonte `LoginPage.tsx` : layout split (panneau branding + formulaire), inspiré Chariow, adapté à l'identité visuelle EnseiNotes
- Mode clair forcé sur les pages d'auth via `useTheme` (restauration du thème précédent au démontage)
- Finalisation esthétique LoginPage : Panneau gauche flottant (surcouche), badges avec icônes colorées sur fond blanc, fond global blanc pur.
- Audit Lighthouse & Console : Fix des Future Flags React Router v7, optimisation des contrastes (Accessibilité 100%), suppression des animations lourdes pour la performance.
- Optimisation Layout Auth : Réduction drastique des espaces blancs ("whitespace") sur le formulaire et redistribution du contenu branding pour un rendu plus dense et pro, fidèle au style Chariow.
- Correction Branding Panel : Réduction des tailles de police jugées "énormissimes" (3.2rem -> 4xl), resserrement des paddings et marges pour supprimer les vides inutiles sur la carte de gauche.
- Typographie Fluide : Migration vers un système de polices et espacements dynamiques via `clamp()` dans `index.css`. Les titres d'authentification se réduisent désormais progressivement en fonction de la largeur de fenêtre, assurant un rendu parfait sur n'importe quel écran (fluid responsive).
- **Apprentissage Design System** : Intégration de la règle R9 dans le guide pour pérenniser l'usage du Fluid Design sur le projet. Documentation des sources de référence pour la performance.
- **Layout Mobile Ultra-Compact** : Conversion du logo vertical en horizontal sur mobile, réduction drastique des marges (`mb-6`) et déportation des badges de branding en bas de page pour garantir que le formulaire de connexion soit visible sans scroll sur les petits écrans.
- **Police Poppins** : Intégration et application de la police Poppins sur les pages d'authentification pour un look plus moderne et accessible.
- **Raffinage Typographique Final** : Réduction des échelles de police fluides, passage des titres en `extrabold` pour un impact maximum, réduction du `letter-spacing` (tracking) pour un look plus dense et moderne, et labels en `text-[12px] font-medium`.

**Erreurs rencontrées :** voir ERREUR-001, ERREUR-002, ERREUR-003, ERREUR-004

**Notes pour le prochain agent :**
- Les `any` restants dans `appStore.ts` (lignes ~16-93) sont **volontaires** : ils typent du JSON brut issu de `localStorage` dans `migrateData` et `loadTeacherData`. C'est acceptable car l'input est non typé par nature (données externes). Ne pas tenter de les remplacer par `unknown` sans revoir toute la logique d'hydratation.
- Le type `TableRow` dans `pdfService.ts` contient `styles?: any` car les styles de `jspdf-autotable` sont un objet complexe sans types exportés stables. C'est un compromis acceptable.
- Le build passe sans erreur (`npm run build` → exit 0).
- La `LoginPage.tsx` a été entièrement réécrite avec un layout split. Le panneau gauche (branding) est caché en mobile et remplacé par des orbes de fond + un logo centré.
- Aucune feature en cours ou incomplète.

---

> **Ce fichier appartient au projet, pas à un modèle.**
> Il vit, grandit, et protège l'équipe de ses propres erreurs passées.
> Traite-le avec respect. Il te sauvera la mise un vendredi soir à 17h.
