const { ipcMain } = require('electron');
const https = require('https');
const { app } = require('electron');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function registerUpdater() {
  ipcMain.handle('check-for-updates', async () => {
    try {
      const remote = await fetchJson('https://your-domain.example/releases/latest.json');
      const currentVersion = app.getVersion();
      return {
        ok: true,
        currentVersion,
        latestVersion: remote.version,
        updateAvailable: remote.version !== currentVersion,
        notes: remote.notes || '',
        url: remote.url || null
      };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });
}

module.exports = { registerUpdater };
