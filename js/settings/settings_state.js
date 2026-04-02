(function(){

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
    S.profile = S.profile || {
      displayName: "",
      avatar: "default",
      instrumentPrimary: "guitar",
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
    S.releaseInfo = S.releaseInfo || {
      version: "0.9.0",
      build: 120,
      firstInstalled: 0,
      lastUpdated: 0
    };
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
