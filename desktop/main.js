const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerDialogs } = require('./dialogs');
const { createAppMenu } = require('./menu');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  registerDialogs();
  createAppMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    name: app.getName()
  };
});

process.on('uncaughtException', (err) => {
  try { require('./crash').logCrash(err.stack || String(err)); } catch(e) {}
});
