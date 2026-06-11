(function(){

  function inferPrimaryInstrumentFromName(name) {
    var value = String(name || "").toLowerCase();
    if (value.indexOf("piano") >= 0) return "piano";
    if (value.indexOf("ukulele") >= 0 || value.indexOf("uke") >= 0) return "ukulele";
    if (value.indexOf("bass") >= 0) return "bass";
    if (value.indexOf("drum") >= 0) return "drums";
    return "guitar";
  }

  function inferPrimaryInstrumentDefault() {
    if (typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function") {
      var active = SparkInstruments.getActive();
      var candidate = active ? (active.instrument || active.instrumentType || active.id || active.appId || null) : null;
      if (candidate && typeof SparkInstruments.getAll === "function") {
        var entries = SparkInstruments.getAll() || [];
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i] || {};
          if (entry.id === candidate || entry.appId === candidate) {
            candidate = entry.instrument || entry.instrumentType || candidate;
            break;
          }
        }
      }
      if (candidate) return candidate;
    }
    return inferPrimaryInstrumentFromName(typeof APP_NAME !== "undefined" ? APP_NAME : "");
  }

  function initSettingsDefaults(){
    S.settings = S.settings || {
      audioLatencyMs: 0,
      metronomeVolume: 0.6,
      noteSpeed: 1.0,
      difficultyAutoAdjust: true,
      theme: "dark",
      showFingerHints: true,
      practiceReminder: true,
      cloudSyncEnabled: true,
      uiVolume: 0.5
    };
    if (!S.settings.accessibility) {
      S.settings.accessibility = typeof SparkNormalizeAccessibilitySettings === "function"
        ? SparkNormalizeAccessibilitySettings({})
        : {
            reducedMotion: false,
            highContrast: false,
            noteSize: "normal",
            laneLabels: true,
            colorblindSafeLanes: false,
            metronomeVisualOnly: false,
            disableFailureAnimations: false,
            keyboardRemapping: {},
            leftHandedLayout: false,
            slowerDefaultSpeed: false,
            audioCueVolume: 0.8,
            metronomeVolume: 0.6
          };
    }
    S.profile = S.profile || {
      displayName: "",
      avatar: "default",
      instrumentPrimary: inferPrimaryInstrumentDefault(),
      instrumentSecondary: "piano",
      joinDate: 0,
      totalPracticeMinutes: 0,
      favoriteSongs: [],
      achievements: []
    };
    S.tutorialProgress = S.tutorialProgress || {
      completed: {},
      skipped: {}
    };
    // Unknown until release/manifest.json loads — must not impersonate a real
    // release, or a failed manifest fetch shows a stale version in About,
    // feedback exports, and debug bundles.
    S.releaseInfo = S.releaseInfo || {
      version: "dev",
      buildNumber: 0,
      firstInstalled: 0,
      lastUpdated: 0
    };
    // releaseInfo is persisted, and pre-1.3.x installs saved it with `build`
    // instead of `buildNumber` — migrate so About/debug surfaces don't show
    // Build: 0 until the manifest fetch replaces the object. The legacy key
    // is dropped whenever it appears (a state saved by the copy-only
    // migration carries BOTH keys); the value only copies when buildNumber
    // is still missing.
    if (S.releaseInfo.build !== undefined) {
      if (S.releaseInfo.buildNumber === undefined) {
        S.releaseInfo.buildNumber = S.releaseInfo.build;
      }
      delete S.releaseInfo.build;
    }
  }

  function applyThemeSetting(){
    var theme = (S.settings && S.settings.theme) || "dark";
    document.body.className = document.body.className.replace(/theme-\w+/g, "");
    if(theme !== "dark"){
      document.body.classList.add("theme-" + theme);
    }
  }

  function playUISound(name){
    try{
      var audio = new Audio('audio/ui/' + name + '.wav');
      audio.volume = (S.settings && S.settings.uiVolume) || 0.5;
      audio.play();
    }catch(e){ /* audio file may not exist yet */ }
  }

  window.initSettingsDefaults = initSettingsDefaults;
  window.applyThemeSetting = applyThemeSetting;
  window.playUISound = playUISound;

})();
