const { app, BrowserWindow, ipcMain, dialog, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { registerDialogs } = require('./desktop/dialogs');
const { registerUpdater } = require('./desktop/updater');
const { runPackagedSmokeForWindow } = require('./desktop/packaged_smoke');

let mainWindow;
let demucsProcess = null;

function getResourcePath() {
  // In production: resources are in process.resourcesPath/resources/
  // In dev: resources are in __dirname/resources/
  var prodPath = path.join(process.resourcesPath, 'resources');
  if (fs.existsSync(prodPath)) return prodPath;
  return path.join(__dirname, 'resources');
}

function getStemsDir() {
  var dir = path.join(app.getPath('userData'), 'stems');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function hashFilePath(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 12);
}

// Kept byte-identical to the meta tag in index.html; the two used to
// disagree, so the effective policy depended on which one applied.
const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' file:; connect-src 'self' data:; font-src 'self'";

// The app is entirely local: index.html, its assets, and nothing else. Any
// navigation away from it, and any window the renderer tries to open, is
// therefore unexpected — send external https links to the system browser and
// refuse the rest, rather than letting them take over the app window or open
// a second unconstrained Electron window.
const ALLOWED_EXTERNAL_PREFIXES = ['https://github.com/scomofo/sparksuite'];

function isAllowedExternal(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return ALLOWED_EXTERNAL_PREFIXES.some(function(prefix) {
    return rawUrl === prefix || rawUrl.startsWith(prefix + '/');
  });
}

function hardenWindow(win) {
  win.webContents.setWindowOpenHandler(function(details) {
    if (isAllowedExternal(details.url)) shell.openExternal(details.url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', function(event, url) {
    // The renderer only ever navigates within its own file:// document.
    if (url === win.webContents.getURL()) return;
    event.preventDefault();
    if (isAllowedExternal(url)) shell.openExternal(url);
  });

  win.webContents.on('will-attach-webview', function(event) {
    event.preventDefault();
  });
}

function createWindow() {
  // Register the CSP before the load is requested. This used to run three
  // lines after loadFile(); asynchrony usually saved it, but the ordering was
  // a race by construction.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CONTENT_SECURITY_POLICY]
      }
    });
  });

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    resizable: true,
    title: 'SparkSuite',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  hardenWindow(mainWindow);

  if (process.env.SPARKSUITE_SMOKE_OUTPUT) {
    runPackagedSmokeForWindow(mainWindow, {
      outputPath: process.env.SPARKSUITE_SMOKE_OUTPUT,
      userId: process.env.SPARKSUITE_SMOKE_USER_ID || 'smoke_user',
      onComplete: function(result, error) {
        setTimeout(function() {
          app.exit(error ? 1 : 0);
        }, 50);
      }
    });
  }

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerDesktopBridgeHandlers() {
  registerDialogs();
  registerUpdater();
  ipcMain.handle('get-app-info', async () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      name: app.getName()
    };
  });
}

// ===== STEM SEPARATION IPC =====

// Open file dialog for audio files
ipcMain.handle('stems:openFile', async () => {
  var result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  var filePath = result.filePaths[0];
  return { filePath: filePath, fileName: path.basename(filePath) };
});

// Check if stems are already cached for a file
ipcMain.handle('stems:checkCache', async (event, filePath) => {
  var hash = hashFilePath(filePath);
  var outputDir = path.join(getStemsDir(), hash);
  var stemNames = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'];
  var stemPaths = {};
  var allExist = true;

  for (var i = 0; i < stemNames.length; i++) {
    var stemFile = path.join(outputDir, 'target_' + i + '_' + stemNames[i] + '.wav');
    if (fs.existsSync(stemFile)) {
      stemPaths[stemNames[i]] = stemFile;
    } else {
      allExist = false;
    }
  }

  if (allExist) return stemPaths;
  return null;
});

// Run demucs separation
ipcMain.handle('stems:separate', async (event, filePath) => {
  // Validate filePath exists and is a real file (prevent command injection via crafted paths)
  var resolvedInput = path.resolve(filePath);
  if (!fs.existsSync(resolvedInput) || !fs.statSync(resolvedInput).isFile()) {
    throw new Error('Invalid audio file path');
  }

  var resDir = getResourcePath();
  var demucsBinName = process.platform === 'win32' ? 'demucs.exe' : 'demucs';
  var demucsBin = path.join(resDir, demucsBinName);
  var modelFile = path.join(resDir, 'ggml-model-htdemucs-6s-f16.bin');

  // Check binary exists with platform-specific guidance
  if (!fs.existsSync(demucsBin)) {
    var platformHint = process.platform === 'win32'
      ? 'Build demucs.exe from demucs.cpp or download a pre-built Windows binary.'
      : process.platform === 'darwin'
      ? 'Build demucs from demucs.cpp: mkdir build && cd build && cmake .. && make -j$(sysctl -n hw.ncpu)'
      : 'Build demucs from demucs.cpp: mkdir build && cd build && cmake .. && make -j$(nproc)';
    throw new Error(demucsBinName + ' not found at ' + demucsBin + '.\n' + platformHint + '\nThen place the binary in the resources/ folder.');
  }
  if (!fs.existsSync(modelFile)) {
    throw new Error('Model file not found at ' + modelFile + '.\nDownload ggml-model-htdemucs-6s-f16.bin from HuggingFace and place it in the resources/ folder.');
  }

  var hash = hashFilePath(filePath);
  var outputDir = path.join(getStemsDir(), hash);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    // Spawn demucs: demucs.exe <model> <input> <output_dir> <num_threads>
    var numThreads = Math.max(1, Math.min(os.cpus().length, 8));
    demucsProcess = spawn(demucsBin, [modelFile, resolvedInput, outputDir + path.sep, String(numThreads)], {
      windowsHide: true
    });

    var stderr = '';
    var startTime = Date.now();

    demucsProcess.stdout.on('data', (data) => {
      var line = data.toString().trim();
      if (line && mainWindow) {
        mainWindow.webContents.send('stems:progress', { type: 'stdout', line: line });
      }
    });

    demucsProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      var line = data.toString().trim();
      if (line && mainWindow) {
        // Try to extract progress from stderr output
        mainWindow.webContents.send('stems:progress', { type: 'stderr', line: line });
      }
    });

    demucsProcess.on('error', (err) => {
      demucsProcess = null;
      reject(new Error('Failed to start demucs: ' + err.message));
    });

    demucsProcess.on('close', (code) => {
      demucsProcess = null;
      if (code === 0) {
        // Collect output stem paths
        var stemNames = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'];
        var stemPaths = {};
        for (var i = 0; i < stemNames.length; i++) {
          var stemFile = path.join(outputDir, 'target_' + i + '_' + stemNames[i] + '.wav');
          if (fs.existsSync(stemFile)) {
            stemPaths[stemNames[i]] = stemFile;
          }
        }
        var elapsed = Math.round((Date.now() - startTime) / 1000);
        resolve({ stemPaths: stemPaths, elapsed: elapsed });
      } else {
        reject(new Error('Demucs exited with code ' + code + ': ' + stderr.slice(-500)));
      }
    });
  });
});

// Cancel running demucs process
ipcMain.on('stems:cancel', () => {
  if (demucsProcess) {
    demucsProcess.kill();
    demucsProcess = null;
  }
});

// Convert file path to file:// URL for audio playback
ipcMain.handle('stems:getFileUrl', async (event, stemPath) => {
  // Validate path is within stems directory (prevent path traversal)
  var normalized = path.resolve(stemPath);
  var stemsDir = path.resolve(app.getPath('userData'), 'stems');
  var relativeStemPath = path.relative(stemsDir, normalized);
  if (!relativeStemPath || relativeStemPath.startsWith('..') || path.isAbsolute(relativeStemPath)) {
    throw new Error('Access denied: path outside stems directory');
  }
  return 'file://' + normalized.replace(/\\/g, '/');
});

// ===== SPARKGAME INTEGRATION =====

var sparkGameProcess = null;

ipcMain.handle('sparkgame:launch', async (event, chartData) => {
  var tmpDir = app.getPath('temp');
  var chartPath = path.join(tmpDir, 'spark_chart.json');
  var resultsPath = path.join(tmpDir, 'spark_results.json');

  // Write chart JSON
  require('fs').writeFileSync(chartPath, JSON.stringify(chartData, null, 2), 'utf-8');

  // Remove old results
  try { require('fs').unlinkSync(resultsPath); } catch(e) {}

  return new Promise((resolve, reject) => {
    sparkGameProcess = spawn('python', ['-m', 'spark_game', '--chart', chartPath, '--results', resultsPath], {
      cwd: path.resolve(__dirname, '..', '..', 'sparkgame'),
      windowsHide: false
    });

    sparkGameProcess.on('close', (code) => {
      sparkGameProcess = null;
      // Read results
      try {
        var resultsJson = require('fs').readFileSync(resultsPath, 'utf-8');
        resolve(JSON.parse(resultsJson));
      } catch(e) {
        resolve(null);
      }
    });

    sparkGameProcess.on('error', (err) => {
      sparkGameProcess = null;
      reject(err.message);
    });
  });
});

ipcMain.handle('sparkgame:charter', async (event, mp3Path, instrument, difficulty) => {
  var outputPath = mp3Path.replace(/\.[^.]+$/, '_' + instrument + '_' + difficulty + '.json');

  return new Promise((resolve, reject) => {
    var proc = spawn('python', ['-m', 'spark_charter', mp3Path, '--instrument', instrument, '--difficulty', difficulty, '--output', outputPath], {
      cwd: path.resolve(__dirname, '..', '..', 'sparkgame'),
      windowsHide: true
    });

    var stdout = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stdout += d; });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          var chart = JSON.parse(require('fs').readFileSync(outputPath, 'utf-8'));
          resolve(chart);
        } catch(e) {
          resolve(null);
        }
      } else {
        reject('Charter failed: ' + stdout);
      }
    });
  });
});

// ===== APP LIFECYCLE =====

// Single instance: a second launch focuses the existing window instead of
// spawning another process (multiple instances also confuse electron-updater's
// install-on-quit handoff).
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerDesktopBridgeHandlers();
    createWindow();
  });
}

app.on('window-all-closed', () => {
  if (demucsProcess) {
    demucsProcess.kill();
    demucsProcess = null;
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
