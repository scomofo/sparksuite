// (Timer ticks, game loops, parsers, and stopAllTimers extracted to js/timers.js.)

// ===== ACTION DISPATCHER =====
// (Moved to js/actions.js — window.act dispatcher.)

// ===== RENDER =====
// (Moved to js/render.js — applyTheme, render, _renderInner,
//  _renderOverlays, _renderOnboardingOverlay, _writeAppHtml.)

// ===== KEYBOARD SHORTCUTS =====
// (Moved to js/shortcuts.js — global keydown listener.)

// ===== INITIALIZATION =====
S.dailyChallenge=DAILY_CHALLENGES[Math.floor(Date.now()/86400000)%DAILY_CHALLENGES.length];
try{if(typeof generatePracticePlan==="function")generatePracticePlan();}catch(e){}
applyTheme();
// Init MIDI if previously enabled
if(S.midiEnabled){try{initMIDI();}catch(e){console.error("ChordSpark: MIDI init failed",e);}}
// Preload guitar WAV samples
try{preloadGuitarAudio();}catch(e){console.error("ChordSpark: guitar audio preload failed",e);}
document.getElementById("no-js").style.display="none";
document.getElementById("header").style.display=S.activeInstrument?"flex":"none";
document.getElementById("app").style.display="block";
// Activate remembered instrument
if(S.activeInstrument){try{SparkInstruments.activate(S.activeInstrument);}catch(e){console.error("SparkSuite: instrument activate failed",e);}}
try{if(typeof choosePerformanceDailyChallenge==="function")choosePerformanceDailyChallenge();}catch(e){}

// Product-facing lesson helpers. Keep this as a safe bootstrap so the layer is
// available even when index.html script ordering changes during migrations.
(function(){
  if (window.SparkLessonProductLayer) return;
  var script=document.createElement("script");
  script.src="js/sparksuite/ui/lesson_product_layer.js";
  script.defer=false;
  document.head.appendChild(script);
})();

// Bass curriculum integration. Loaded after the core bass module so it can
// patch the existing implementation without replacing bass gameplay.
(function(){
  if (window.SparkBassCurriculumIntegration) return;
  var script=document.createElement("script");
  script.src="js/sparksuite/instruments/bass/bass_curriculum_integration.js";
  script.defer=false;
  document.head.appendChild(script);
})();

// render() moved to index.html after all instrument pages register
