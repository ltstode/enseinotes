import { contextBridge, ipcRenderer } from 'electron';

// Exposer des APIs sécurisées au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemple d'API pour communiquer avec le processus principal
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // Ajouter d'autres APIs au besoin
  // send: (channel, data) => ipcRenderer.send(channel, data),
  // receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
