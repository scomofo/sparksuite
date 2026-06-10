const { ipcMain, app, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

const RELEASES_URL = 'https://github.com/scomofo/sparksuite/releases/latest';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// install-on-quit alone proved unreliable (a downloaded update sat in
// pending/ across launches), so offer an explicit restart as the primary
// path and keep install-on-quit as the fallback.
autoUpdater.on('update-downloaded', function(info) {
  var version = info && info.version ? info.version : 'new version';
  dialog.showMessageBox({
    type: 'info',
    title: 'Update ready',
    message: 'SparkSuite ' + version + ' is ready to install.',
    detail: 'Restart now to update, or it will install when you quit.',
    buttons: ['Restart now', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then(function(choice) {
    if (choice.response === 0) autoUpdater.quitAndInstall();
  });
});

function compareVersions(a, b) {
  var pa = String(a || '0').split('.').map(Number);
  var pb = String(b || '0').split('.').map(Number);
  for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
    var na = pa[i] || 0;
    var nb = pb[i] || 0;
    if (na !== nb) return na > nb ? 1 : -1;
  }
  return 0;
}

function flattenReleaseNotes(notes) {
  if (!notes) return '';
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) {
    return notes.map(function(n) { return n && n.note ? n.note : ''; }).join('\n');
  }
  return '';
}

function registerUpdater() {
  // Kick off a background check once at startup; updates install on quit.
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(function() {
      // Offline or no releases yet — the manual check surfaces errors.
    });
  }

  ipcMain.handle('check-for-updates', async () => {
    var currentVersion = app.getVersion();
    if (!app.isPackaged) {
      return { ok: false, error: 'Update checks only run in the packaged app', currentVersion: currentVersion };
    }
    try {
      var result = await autoUpdater.checkForUpdates();
      var info = result && result.updateInfo ? result.updateInfo : null;
      var latestVersion = info ? info.version : null;
      return {
        ok: true,
        currentVersion: currentVersion,
        latestVersion: latestVersion,
        updateAvailable: latestVersion ? compareVersions(latestVersion, currentVersion) > 0 : false,
        notes: info ? flattenReleaseNotes(info.releaseNotes) : '',
        url: RELEASES_URL
      };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e), currentVersion: currentVersion };
    }
  });

  ipcMain.handle('open-releases-page', async () => {
    await shell.openExternal(RELEASES_URL);
    return { ok: true };
  });
}

module.exports = { registerUpdater };
