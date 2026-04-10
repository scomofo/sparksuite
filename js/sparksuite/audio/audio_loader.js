(function() {
  /**
   * SparkAudioLoader -- loads audio from files, URLs, or drag-and-drop.
   * Returns ArrayBuffers ready for AudioEngine.load().
   */
  function AudioLoader() {}

  /**
   * Load from a File object (from <input> or drag-and-drop).
   */
  AudioLoader.fromFile = function(file) {
    return file.arrayBuffer();
  };

  /**
   * Load from a URL (local or remote).
   */
  AudioLoader.fromUrl = function(url) {
    return fetch(url).then(function(res) {
      if (!res.ok) throw new Error("AudioLoader: HTTP " + res.status);
      return res.arrayBuffer();
    });
  };

  /**
   * Load from a local file path (Electron/Tauri).
   */
  AudioLoader.fromPath = function(path) {
    if (typeof require !== "undefined") {
      return new Promise(function(resolve, reject) {
        var fs = require("fs");
        fs.readFile(path, function(err, data) {
          if (err) return reject(err);
          resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
        });
      });
    }
    return AudioLoader.fromUrl(path);
  };

  /**
   * Check if a local audio file exists for a track.
   * @returns {Promise<string|null>} path if found, null otherwise
   */
  AudioLoader.findLocal = function(trackId) {
    var paths = [
      "data/audio/" + trackId + ".mp3",
      "data/audio/" + trackId + ".ogg",
      "data/audio/" + trackId + ".wav"
    ];

    function tryPath(i) {
      if (i >= paths.length) return Promise.resolve(null);
      return fetch(paths[i], { method: "HEAD" }).then(function(res) {
        return res.ok ? paths[i] : tryPath(i + 1);
      }).catch(function() { return tryPath(i + 1); });
    }

    return tryPath(0);
  };

  window.SparkAudioLoader = AudioLoader;
})();
