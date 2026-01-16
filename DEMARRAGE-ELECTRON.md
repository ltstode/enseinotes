# 🚀 Guide de Démarrage Rapide - EnseiNotes Electron

## ⚠️ IMPORTANT : N'utilisez PAS Electron Fiddle

**Electron Fiddle** n'est pas compatible avec ce projet car il essaie d'installer des versions expérimentales de React. 

## ✅ Utilisation Correcte

### 1️⃣ Lancer l'application en mode développement

Ouvrez un terminal dans le dossier du projet et tapez :

```bash
npm run electron:dev
```

Cette commande va :
- ✅ Démarrer le serveur web Vite
- ✅ Attendre que le serveur soit prêt
- ✅ Lancer automatiquement Electron
- ✅ Ouvrir l'application dans une fenêtre native

**Résultat** : Une fenêtre Electron s'ouvre avec votre application ! 🎉

### 2️⃣ Tester uniquement dans le navigateur

Si vous voulez juste tester dans le navigateur :

```bash
npm run dev
```

Puis ouvrez http://localhost:8080

### 3️⃣ Créer un installateur Windows

Pour distribuer l'application :

```bash
# 1. Construire l'application
npm run build

# 2. Créer l'installateur
npm run electron:build:win
```

L'installateur `.exe` sera dans le dossier `dist-electron/`

## 🔧 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur web uniquement |
| `npm run electron:dev` | **Application Electron + Hot Reload** ⭐ |
| `npm run electron` | Lancer Electron (nécessite `npm run build` avant) |
| `npm run electron:build:win` | Créer installateur Windows |
| `npm run electron:build:mac` | Créer installateur macOS |
| `npm run electron:build:linux` | Créer installateur Linux |

## 🐛 Dépannage

### L'application ne se lance pas ?

1. Fermez tous les processus Electron :
```bash
taskkill /F /IM electron.exe
```

2. Relancez :
```bash
npm run electron:dev
```

### Erreur de modules ?

Réinstallez les dépendances :
```bash
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

## 📝 Notes

- **Données** : Sauvegardées automatiquement dans localStorage
- **DevTools** : S'ouvrent automatiquement en mode dev
- **Hot Reload** : Les changements de code rechargent automatiquement l'app
- **Production** : L'app fonctionne 100% hors-ligne

---

**Commande recommandée pour développer** : `npm run electron:dev` ⭐
