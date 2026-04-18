const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sparkDesktop', {
  saveJson: (payload) => ipcRenderer.invoke('save-json', payload),
  openJson: (options) => ipcRenderer.invoke('open-json', options || null),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});
