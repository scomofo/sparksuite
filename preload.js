const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  stems: {
    openFile: function() { return ipcRenderer.invoke('stems:openFile'); },
    separate: function(filePath) { return ipcRenderer.invoke('stems:separate', filePath); },
    checkCache: function(filePath) { return ipcRenderer.invoke('stems:checkCache', filePath); },
    cancel: function() { ipcRenderer.send('stems:cancel'); },
    getFileUrl: function(stemPath) { return ipcRenderer.invoke('stems:getFileUrl', stemPath); },
    onProgress: function(cb) {
      var handler = function(event, data) { cb(data); };
      ipcRenderer.on('stems:progress', handler);
      return function() { ipcRenderer.removeListener('stems:progress', handler); };
    }
  },
  sparkgame: {
    launch: function(chartData) { return ipcRenderer.invoke('sparkgame:launch', chartData); },
    charter: function(mp3Path, instrument, difficulty) { return ipcRenderer.invoke('sparkgame:charter', mp3Path, instrument, difficulty); }
  }
});
