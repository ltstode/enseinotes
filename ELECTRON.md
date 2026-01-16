# EnseiNotes - Application de Bureau

## 🚀 Lancement de l'application

### Mode Développement Web
```bash
npm run dev
```
Ouvre l'application dans le navigateur sur http://localhost:8080

### Mode Développement Electron (Application de Bureau)
```bash
npm run electron:dev
```
Lance simultanément le serveur de développement et l'application Electron

### Mode Production Electron
```bash
# 1. D'abord, construire l'application
npm run build

# 2. Puis lancer Electron
npm run electron
```

## 📦 Création d'un installateur

### Windows
```bash
npm run electron:build:win
```
Crée un installateur `.exe` dans le dossier `dist-electron/`

### macOS
```bash
npm run electron:build:mac
```
Crée un fichier `.dmg` dans le dossier `dist-electron/`

### Linux
```bash
npm run electron:build:linux
```
Crée un fichier `.AppImage` dans le dossier `dist-electron/`

### Tous les systèmes
```bash
npm run electron:build
```

## 📝 Notes importantes

- **Données persistantes** : Les données sont sauvegardées dans le localStorage du navigateur/Electron
- **Export/Import** : Utilisez la page Paramètres pour exporter et importer vos données
- **Mode hors-ligne** : L'application Electron fonctionne entièrement hors-ligne

## 🔧 Structure du projet

```
enseinotes/
├── electron/           # Configuration Electron
│   ├── main.js        # Processus principal
│   └── preload.js     # Script de préchargement
├── src/               # Code source React
├── dist/              # Build de production (web)
└── dist-electron/     # Installateurs Electron
```

## 🛠️ Technologies utilisées

- **React** + **TypeScript** + **Vite**
- **Electron** pour l'application de bureau
- **TailwindCSS** pour le design
- **shadcn/ui** pour les composants
- **LocalStorage** pour la persistance des données
