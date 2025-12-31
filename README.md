<<<<<<< HEAD
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
=======
<div align="center">
  <br />
  <h1>🎓 EnseiNotes</h1>
  <h3>La référence de la productivité pédagogique.</h3>
  <p><i>Structurer la rigueur scolaire pour les enseignants exigeants.</i></p>

  <p>
    <img src="https://img.shields.io/badge/Status-In%20Development-blue?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Tailwind-black?style=flat-square" alt="Tech Stack" />
    <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="License" />
  </p>
  <br /> 
</div>

---

## ✨ Pourquoi EnseiNotes ?

Parce que l’enseignement ne devrait pas être synonyme de tâches administratives répétitives. **EnseiNotes** a été conçu pour éliminer l'approximation et la redondance.

Un enseignant ne devrait jamais :
- ❌ **Ressaisir** deux fois la même liste d’élèves.
- ❌ **Recalculer** manuellement des moyennes.
- ❌ **Justifier** une incohérence de notes due à une erreur de calcul.

> **EnseiNotes remplace la charge mentale par une structure fiable.**

---

## 🧠 Philosophie du Produit

Nous croyons en une hiérarchie stricte et logique des données :

| Concept | Description |
| :--- | :--- |
| **🟦 Univers Fermé** | Une année scolaire est un conteneur hermétique. Rien ne fuite d'une année à l'autre sans action explicite. |
| **🟪 Source Unique** | Une classe = **une seule** liste officielle d’élèves. Finis les doublons. |
| **🟩 Unité Pédagogique** | Chaque matière a ses propres règles de jeu (coefficients, formules), indépendantes des autres. |

---

## 🗂️ Architecture Fonctionnelle

### 1. Structure Temporelle (L'Année)
L'année scolaire est la fondation. À sa création, le découpage est gravé dans le marbre :
- **Trimestres** ou **Semestres**.
- Ce choix structure l'ensemble des calculs et ne peut être modifié en cours de route.

### 2. Structure Administrative (La Classe)
La classe (ex: *Tle D*) est le conteneur administratif.
- **Saisie unique** : On importe ou saisit les élèves une seule fois.
- **Intégrité** : Un élève ne peut exister qu'une seule fois par classe.

### 3. Structure Pédagogique (L'Unité)
C'est ici que l'enseignement a lieu (ex: *Mathématiques - Analyse*).
- Hérite automatiquement de la liste d'élèves de la classe.
- Aucune ressaisie.
- **Règles locales** : Deux unités d'une même classe peuvent avoir des règles de calcul totalement différentes.

---

## ⚙️ Puissance de Calcul & Traçabilité

EnseiNotes se distingue par son moteur de règles et sa sécurité.

### Règles Avancées
Chaque unité définit sa "loi" :
- Coefficients personnalisés.
- Formules de moyenne spécifiques.
- Règles d’arrondi.
- Mode d’affichage.

### 🛡️ Sécurité des Notes
La crédibilité d'un bulletin repose sur la fiabilité des notes.
- **Modification** : Une note validée ne peut être modifiée qu'avec un **motif obligatoire**.
- **Traçabilité** : Horodatage automatique de toute modification.
- **Historique** : Chaque note possède un journal d'audit complet.

---

## 🎨 Design System & Interface

L'interface a été pensée pour réduire la charge cognitive : **Lisibilité maximale, aucune surcharge.**

### Typographie
- **Titres** : `Clash Display` (Bold / Semi-bold) — *Pour l'impact et la modernité.*
- **Corps** : `Satoshi` (Regular / Medium) — *Pour une lisibilité technique parfaite.*

### Palette Chromatique
Une esthétique "propre" et apaisante.

| Usage | Couleur | Note |
| :--- | :--- | :--- |
| **Fond** | `Blanc Cassé` | Évite la fatigue oculaire du blanc pur. |
| **Texte** | `Gris Foncé` | Contraste doux mais suffisant. |
| **Accent** | `Bleu Glacier` | Professionnel et technologique. |
| **États** | 🟩 Succès / 🟥 Erreur / 🟪 Info | Codes couleurs universels mais adoucis. |

---

## 🚀 Ambition

EnseiNotes n’est pas qu'un carnet de notes numérique.

C’est :
1. Une **infrastructure pédagogique**.
2. Un **standard de rigueur** scolaire.
3. Un outil pensé pour **inspirer confiance** aux enseignants, aux élèves et aux parents.

---

<<<<<<< HEAD
un standard de rigueur scolaire

un outil pensé pour durer, évoluer et inspirer confiance

📌 Statut

🛠️ En cours de développement
📐 Logique métier finalisée
🎨 UI/UX strictement cadrée
🔒 Règles critiques verrouillées dès la conception
>>>>>>> 9d33d5c (chore: initial sandbox commit)
=======
<div align="center">
  <br/>
  <p>�️ <b>Statut :</b> En cours de développement actif</p>
  <p><i>Logique métier finalisée • UI/UX cadrée • Règles critiques implémentées</i></p>
</div>
>>>>>>> dc429e4 (feat: arrangement du fichier ReadMe.md pour plus de clarté sur l'appli)
