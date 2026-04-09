const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

let mainWindow;
let demucsProcess = null;
let ffmpegProcess = null;

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

function getFfmpegBinaryPath() {
  var resDir = getResourcePath();
  var candidates = process.platform === 'win32'
    ? [
        path.join(resDir, 'ffmpeg.exe'),
        path.join(resDir, 'resources', 'ffmpeg.exe'),
        'ffmpeg.exe',
        'ffmpeg'
      ]
    : [
        path.join(resDir, 'ffmpeg'),
        path.join(resDir, 'resources', 'ffmpeg'),
        'ffmpeg'
      ];

  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i].indexOf(path.sep) >= 0) {
      if (fs.existsSync(candidates[i])) return candidates[i];
      continue;
    }
    return candidates[i];
  }
  return null;
}

function convertAudioTo44100(inputPath, outputPath) {
  var ffmpegBin = getFfmpegBinaryPath();
  if (!ffmpegBin) {
    return Promise.reject(new Error('ffmpeg not found'));
  }

  return new Promise((resolve, reject) => {
    ffmpegProcess = spawn(ffmpegBin, [
      '-y',
      '-i', inputPath,
      '-ar', '44100',
      '-ac', '2',
      '-vn',
      outputPath
    ], {
      windowsHide: true
    });

    var stderr = '';

    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpegProcess.on('error', (err) => {
      ffmpegProcess = null;
      reject(new Error('Failed to start ffmpeg: ' + err.message));
    });

    ffmpegProcess.on('close', (code) => {
      ffmpegProcess = null;
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error('ffmpeg exited with code ' + code + ': ' + stderr.slice(-500)));
      }
    });
  });
}

function runDemucsProcess(demucsBin, modelFile, inputPath, outputDir, startTime, resolve, reject) {
  var numThreads = Math.max(1, Math.min(os.cpus().length, 8));
  demucsProcess = spawn(demucsBin, [modelFile, inputPath, outputDir + path.sep, String(numThreads)], {
    windowsHide: true
  });

  var stderr = '';

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
      mainWindow.webContents.send('stems:progress', { type: 'stderr', line: line });
    }
  });

  demucsProcess.on('error', (err) => {
    demucsProcess = null;
    reject(new Error('Failed to start demucs: ' + err.message));
  });

  demucsProcess.on('close', async (code) => {
    demucsProcess = null;
    if (code === 0) {
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
      return;
    }

    reject(new Error('Demucs exited with code ' + code + ': ' + stderr.slice(-500)));
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 850,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    title: 'SparkSuite',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Enforce Content Security Policy headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' file:; connect-src 'self' http://localhost:3456; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com"]
      }
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
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

  var normalizedInput = resolvedInput;
  var tempResampledPath = path.join(outputDir, 'input_44100.wav');
  var ffmpegBin = getFfmpegBinaryPath();

  if (ffmpegBin) {
    try {
      if (mainWindow) {
        mainWindow.webContents.send('stems:progress', { type: 'stdout', line: 'Preparing audio at 44.1kHz for Demucs...' });
      }
      normalizedInput = await convertAudioTo44100(resolvedInput, tempResampledPath);
    } catch (err) {
      if (mainWindow) {
        mainWindow.webContents.send('stems:progress', { type: 'stderr', line: 'ffmpeg preprocessing failed, falling back to original audio.' });
      }
      normalizedInput = resolvedInput;
    }
  }

  return new Promise((resolve, reject) => {
    var startTime = Date.now();
    runDemucsProcess(demucsBin, modelFile, normalizedInput, outputDir, startTime, resolve, async function(err) {
      var message = err && err.message ? err.message : String(err || '');
      var needs44100 = message.indexOf('only supports the following sample rate (Hz): 44100') >= 0;

      if (!needs44100 || normalizedInput === tempResampledPath || !ffmpegBin) {
        if (needs44100 && !ffmpegBin) {
          reject(new Error(
            'Demucs requires 44.1kHz audio, and ffmpeg was not found to convert it automatically.\n' +
            'Install ffmpeg on PATH or place ffmpeg' + (process.platform === 'win32' ? '.exe' : '') + ' in the resources/ folder.\n' +
            'Original error: ' + message
          ));
          return;
        }
        reject(err);
        return;
      }

      try {
        if (mainWindow) {
          mainWindow.webContents.send('stems:progress', { type: 'stdout', line: 'Resampling unsupported audio to 44.1kHz and retrying Demucs...' });
        }
        normalizedInput = await convertAudioTo44100(resolvedInput, tempResampledPath);
        runDemucsProcess(demucsBin, modelFile, normalizedInput, outputDir, startTime, resolve, reject);
      } catch (convertErr) {
        reject(new Error(
          'Demucs requires 44.1kHz audio. Automatic conversion failed.\n' +
          (convertErr && convertErr.message ? convertErr.message : String(convertErr))
        ));
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
  if (ffmpegProcess) {
    ffmpegProcess.kill();
    ffmpegProcess = null;
  }
});

// Convert file path to file:// URL for audio playback
ipcMain.handle('stems:getFileUrl', async (event, stemPath) => {
  // Validate path is within stems directory (prevent path traversal)
  var normalized = path.resolve(stemPath);
  var stemsDir = path.resolve(app.getPath('userData'), 'stems');
  if (!normalized.startsWith(stemsDir)) {
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

app.whenReady().then(createWindow);

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
