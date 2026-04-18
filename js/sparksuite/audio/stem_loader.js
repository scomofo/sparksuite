(function() {
  var STEM_NAMES = ["vocals", "drums", "bass", "guitar", "other"];
  var STEM_FORMATS = ["wav", "mp3", "ogg"];

  function probeStemPath(path, options) {
    return fetch(path, options || {}).then(function(res) {
      return !!(res && res.ok);
    }).catch(function() {
      return false;
    });
  }

  function StemLoader() { this._cache = {}; }

  StemLoader.prototype.loadFromDisk = function(trackId, ctx) {
    var basePath = "data/stems/" + trackId + "/";
    var self = this;
    if (this._cache[trackId]) return Promise.resolve(this._cache[trackId]);
    var promises = STEM_NAMES.map(function(name) {
      return self._findAndDecode(basePath + name, ctx).then(function(buf) { return { name: name, buffer: buf }; });
    });
    return Promise.all(promises).then(function(results) {
      var stems = {}, found = false;
      for (var i = 0; i < results.length; i++) { if (results[i].buffer) { stems[results[i].name] = results[i].buffer; found = true; } }
      if (found) self._cache[trackId] = stems;
      return found ? stems : null;
    });
  };

  StemLoader.prototype.loadFromFiles = function(files, ctx) {
    var promises = [], names = [];
    for (var name in files) { if (files[name]) { names.push(name);
      promises.push(files[name].arrayBuffer().then(function(ab) { return ctx.decodeAudioData(ab); })); } }
    return Promise.all(promises).then(function(bufs) { var s = {}; for (var i = 0; i < names.length; i++) s[names[i]] = bufs[i]; return s; });
  };

  StemLoader.prototype.separateWithDemucs = function(audioPath, outputDir, ctx) {
    if (typeof require === "undefined") return Promise.reject(new Error("StemLoader: demucs requires Node.js"));
    var cp = require("child_process"), path = require("path");
    var exe = path.resolve(__dirname, "../../demucs.cpp_Windows/build/demucs.exe");
    return new Promise(function(resolve, reject) {
      cp.exec('"' + exe + '" -i "' + audioPath + '" -o "' + outputDir + '"', { timeout: 300000 }, function(err) {
        if (err) return reject(err);
        var stems = {};
        Promise.all(STEM_NAMES.map(function(name) {
          return SparkAudioLoader.fromPath(path.join(outputDir, name + ".wav"))
            .then(function(ab) { return ctx.decodeAudioData(ab); })
            .then(function(buf) { stems[name] = buf; }).catch(function() {});
        })).then(function() { resolve(Object.keys(stems).length ? stems : null); });
      });
    });
  };

  StemLoader.prototype.hasStemsOnDisk = function(trackId) {
    var basePath = "data/stems/" + trackId + "/";

    function tryStemName(nameIndex) {
      if (nameIndex >= STEM_NAMES.length) return Promise.resolve(false);

      function tryFormat(formatIndex) {
        if (formatIndex >= STEM_FORMATS.length) return tryStemName(nameIndex + 1);
        return probeStemPath(basePath + STEM_NAMES[nameIndex] + "." + STEM_FORMATS[formatIndex], { method: "HEAD" })
          .then(function(found) {
            return found ? true : tryFormat(formatIndex + 1);
          });
      }

      return tryFormat(0);
    }

    return tryStemName(0);
  };

  StemLoader.prototype._findAndDecode = function(baseName, ctx) {
    function tryFmt(i) {
      if (i >= STEM_FORMATS.length) return Promise.resolve(null);
      return fetch(baseName + "." + STEM_FORMATS[i]).then(function(res) {
        if (!res.ok) return tryFmt(i + 1);
        return res.arrayBuffer().then(function(ab) { return ctx.decodeAudioData(ab); });
      }).catch(function() { return tryFmt(i + 1); });
    }
    return tryFmt(0);
  };

  StemLoader.prototype.clearCache = function() { this._cache = {}; };
  StemLoader.STEM_NAMES = STEM_NAMES;
  window.SparkStemLoader = StemLoader;
})();
