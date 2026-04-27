// (Timer ticks, game loops, parsers, and stopAllTimers extracted to js/timers.js.)

// ===== ACTION DISPATCHER =====
// (Moved to js/actions.js — window.act dispatcher.)

// ===== RENDER =====
// (Moved to js/render.js — applyTheme, render, _renderInner,
//  _renderOverlays, _renderOnboardingOverlay, _writeAppHtml.)

// ===== KEYBOARD SHORTCUTS =====
// (Moved to js/shortcuts.js — global keydown listener.)

// ===== INITIALIZATION =====
function selectBootDailyChallenge(){
  var idx;
  var challengePool;
  var selected;
  if(typeof buildDefaultDailyChallenges==="function"){
    challengePool = buildDefaultDailyChallenges();
    if(Array.isArray(challengePool) && challengePool.length){
      idx = Math.floor(Date.now()/86400000)%challengePool.length;
      selected = challengePool[idx] || challengePool[0];
      return {
        id: selected.type || selected.id || "challenge",
        title: selected.title || "Challenge",
        desc: selected.description || "",
        xp: selected.rewards && typeof selected.rewards.xp === "number" ? selected.rewards.xp : 40,
        icon: "&#127942;",
        target: selected.target || 1,
        engineChallengeId: selected.id || null,
        category: selected.category || "daily"
      };
    }
  }
  idx = Math.floor(Date.now()/86400000)%DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}
S.dailyChallenge=selectBootDailyChallenge();
function runDeferredBootTasks(){
  try{if(typeof generatePracticePlan==="function")generatePracticePlan();}catch(e){console.error("ChordSpark: generatePracticePlan failed",e);}
  if(S.midiEnabled){try{initMIDI();}catch(e){console.error("ChordSpark: MIDI init failed",e);}}
  try{preloadGuitarAudio();}catch(e){console.error("ChordSpark: guitar audio preload failed",e);}
  try{if(typeof choosePerformanceDailyChallenge==="function")choosePerformanceDailyChallenge();}catch(e){console.error("ChordSpark: choosePerformanceDailyChallenge failed",e);}
}
if(window.SparkBootLoader&&typeof SparkBootLoader.afterDeferredScripts==="function")SparkBootLoader.afterDeferredScripts(runDeferredBootTasks);
else runDeferredBootTasks();
applyTheme();
S.activeInstrument=null;
S._showroomOverride=null;
S.launcherView="home";
document.getElementById("no-js").style.display="none";
document.getElementById("header").style.display=S.activeInstrument?"flex":"none";
document.getElementById("app").style.display="block";
if(S.activeInstrument){try{SparkInstruments.activate(S.activeInstrument);}catch(e){console.error("SparkSuite: instrument activate failed",e);}}

function loadSparkUiAddon(globalName, src, done){
  var script;
  if(window[globalName]){ if(typeof done==="function") done(); return; }
  script=document.createElement("script");
  script.src=src;
  script.onload=function(){ if(typeof done==="function") done(); };
  script.onerror=function(){ console.error("SparkSuite: failed to load "+src); };
  document.head.appendChild(script);
}

function bootLessonProductUi(){
  loadSparkUiAddon("SparkLessonProductLayer", "js/sparksuite/ui/lesson_product_layer.js", function(){
    loadSparkUiAddon("SparkLessonProgressService", "js/sparksuite/ui/lesson_progress_service.js", function(){
      loadSparkUiAddon("SparkLessonDashboardUI", "js/sparksuite/ui/lesson_dashboard_ui.js", function(){
        if(typeof render==="function") render();
      });
    });
  });
}
if(window.SparkBootLoader&&typeof SparkBootLoader.afterDeferredScripts==="function")SparkBootLoader.afterDeferredScripts(bootLessonProductUi);
else setTimeout(bootLessonProductUi,0);

// render() moved to index.html after all instrument pages register
