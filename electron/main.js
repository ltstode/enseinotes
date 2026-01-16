import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer si on est en développement ou en production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    title: 'EnseiNotes',
    backgroundColor: '#F9FAFB',
    show: false, // Ne pas afficher tant que le contenu n'est pas chargé
  });

  // Afficher la fenêtre une fois prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Charger l'application
  if (isDev) {
    // En développement, charger depuis le serveur Vite
    mainWindow.loadURL('http://localhost:8080');
    // Ouvrir les DevTools automatiquement
    mainWindow.webContents.openDevTools();
  } else {
    // En production, charger depuis les fichiers buildés
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Gestion du menu (optionnel - retirer le menu par défaut)
  // mainWindow.setMenu(null);
}

// Créer la fenêtre quand Electron est prêt
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Sur macOS, recréer une fenêtre si aucune n'existe
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quitter quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
