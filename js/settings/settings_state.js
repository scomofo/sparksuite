(function(){
  function getSettingsStateFacade(){
    return typeof SparkState !== "undefined" ? SparkState : null;
  }

  function getSettingsStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") return SparkState.getRoot();
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function readSettingsState(path, fallback){
    var facade = getSettingsStateFacade();
    var root = getSettingsStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(facade && typeof facade.read === "function") return facade.read(path, fallback);
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function writeSettingsState(path, value){
    var facade = getSettingsStateFacade();
    var root = getSettingsStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(facade && typeof facade.write === "function") return facade.write(path, value);
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function ensureSettingsDefaults(path, defaults){
    var current = readSettingsState(path, null);
    var key;
    if(!current || typeof current !== "object" || Array.isArray(current)) current = {};
    for(key in defaults){
      if(Object.prototype.hasOwnProperty.call(defaults, key) && !Object.prototype.hasOwnProperty.call(current, key)){
        current[key] = defaults[key];
      }
    }
    writeSettingsState(path, current);
    return current;
  }

  function initSettingsDefaults(){
    ensureSettingsDefaults("settings", {
      audioLatencyMs: 0,
      metronomeVolume: 0.6,
      noteSpeed: 1.0,
      difficultyAutoAdjust: true,
      theme: "dark",
      showFingerHints: true,
      practiceReminder: true,
      cloudSyncEnabled: true,
      uiVolume: 0.5
    });
    ensureSettingsDefaults("profile", {
      displayName: "",
      avatar: "default",
      instrumentPrimary: "guitar",
      instrumentSecondary: "piano",
      joinDate: 0,
      totalPracticeMinutes: 0,
      favoriteSongs: [],
      achievements: []
    });
    ensureSettingsDefaults("tutorialProgress", {
      completed: {},
      skipped: {}
    });
    ensureSettingsDefaults("releaseInfo", {
      version: "0.9.0",
      build: 120,
      firstInstalled: 0,
      lastUpdated: 0
    });
  }

  function applyThemeSetting(){
    var theme = readSettingsState(["settings", "theme"], "dark");
    document.body.className = document.body.className.replace(/theme-\w+/g, "");
    if(theme !== "dark"){
      document.body.classList.add("theme-" + theme);
    }
  }

  function playUISound(name){
    try{
      var audio = new Audio('audio/ui/' + name + '.wav');
      audio.volume = readSettingsState(["settings", "uiVolume"], 0.5) || 0.5;
      audio.play();
    }catch(e){ /* audio file may not exist yet */ }
  }

  window.initSettingsDefaults = initSettingsDefaults;
  window.applyThemeSetting = applyThemeSetting;
  window.playUISound = playUISound;

})();
