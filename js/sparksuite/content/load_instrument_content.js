(function() {
  function joinPath() {
    return Array.prototype.slice.call(arguments).join("/").replace(/\\/g, "/");
  }

  function readJsonSync(filePath, options) {
    options = options || {};
    var fs = options.fs || null;
    if (!fs || typeof fs.readFileSync !== "function") {
      throw new Error("readJsonSync requires fs.readFileSync");
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  function resolveBaseDir(options) {
    options = options || {};
    if (options.baseDir) return options.baseDir;
    if (typeof process !== "undefined" && process.cwd) {
      return joinPath(process.cwd(), "content", "instruments");
    }
    return "/content/instruments";
  }

  function getFileMap(instrumentId, options) {
    var baseDir = resolveBaseDir(options);
    var instrumentDir = joinPath(baseDir, instrumentId);
    return {
      instrument: joinPath(instrumentDir, "instrument.json"),
      skills: joinPath(instrumentDir, "skills.json"),
      lessons: joinPath(instrumentDir, "lessons.json"),
      chords: joinPath(instrumentDir, "chords.json"),
      exercises: joinPath(instrumentDir, "exercises.json"),
      songs: joinPath(instrumentDir, "songs", "index.json")
    };
  }

  function loadInstrumentContentSync(instrumentId, options) {
    var files = getFileMap(instrumentId, options);
    return {
      instrument: readJsonSync(files.instrument, options),
      skills: readJsonSync(files.skills, options),
      lessons: readJsonSync(files.lessons, options),
      chords: readJsonSync(files.chords, options),
      exercises: readJsonSync(files.exercises, options),
      songs: readJsonSync(files.songs, options)
    };
  }

  async function fetchJson(url, options) {
    options = options || {};
    var fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch.bind(typeof window !== "undefined" ? window : globalThis) : null);
    if (!fetchImpl) {
      throw new Error("No fetch implementation available for loadInstrumentContent");
    }
    var response = await fetchImpl(url);
    if (!response || !response.ok) {
      throw new Error("Failed to load content: " + url);
    }
    return response.json();
  }

  async function loadInstrumentContent(instrumentId, options) {
    options = options || {};
    if (options.fs && typeof options.fs.readFileSync === "function") {
      return loadInstrumentContentSync(instrumentId, options);
    }
    var files = getFileMap(instrumentId, options);
    return {
      instrument: await fetchJson(files.instrument, options),
      skills: await fetchJson(files.skills, options),
      lessons: await fetchJson(files.lessons, options),
      chords: await fetchJson(files.chords, options),
      exercises: await fetchJson(files.exercises, options),
      songs: await fetchJson(files.songs, options)
    };
  }

  if (typeof window !== "undefined") {
    window.loadInstrumentContent = loadInstrumentContent;
    window.loadInstrumentContentSync = loadInstrumentContentSync;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      loadInstrumentContent: loadInstrumentContent,
      loadInstrumentContentSync: loadInstrumentContentSync
    };
  }
})();
