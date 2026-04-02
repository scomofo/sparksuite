const { ipcMain, dialog } = require('electron');
const fs = require('fs');

function registerDialogs() {
  ipcMain.handle('save-json', async (_, payload) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) return { ok: false };
    fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return { ok: true, path: result.filePath };
  });

  ipcMain.handle('open-json', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json', 'mid', 'midi'] }]
    });
    if (result.canceled || !result.filePaths.length) return { ok: false };
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    return {
      ok: true,
      path: filePath,
      text: buffer.toString('utf-8')
    };
  });
}

module.exports = { registerDialogs };
