// (Timer ticks, game loops, parsers, and stopAllTimers extracted to js/timers.js.)

// ===== ACTION DISPATCHER =====
// (Moved to js/actions.js — window.act dispatcher.)

// ===== RENDER =====
// (Moved to js/render.js — applyTheme, render, _renderInner,
//  _renderOverlays, _renderOnboardingOverlay, _writeAppHtml.)

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown",function(e){
  // Ignore when typing in inputs
  var tag=document.activeElement&&document.activeElement.tagName;
  if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;

  var key=e.key;

  // ? - toggle shortcut help
  if(key==="?"){e.preventDefault();act("toggleShortcuts");return;}

  // Escape - close overlay or go back
  if(key==="Escape"){
    if(S.showShortcuts){S.showShortcuts=false;render();return;}
    if(S.screen!==SCR.HOME){act("back");}
    return;
  }

  // Space - pause/resume
  if(key===" "){
    e.preventDefault();
    if(S.screen===SCR.RHYTHM_HIGHWAY){act("rhythmHighwayStrum");return;}
    if(S.screen===SCR.SESSION){act("toggleTimer");return;}
    if(S.screen===SCR.STRUM){act("toggleStrum");return;}
    if(S.screen===SCR.SONG){act("toggleSong");return;}
    if(S.screen===SCR.PERFORM){
      if(S.performPaused){act("resumePerform");return;}
      // Spacebar = simulate strum hit (injects the exact target notes the scorer expects)
      if(S.performPlaying && S.performChart){
        var nowSec=PerformanceTransport.now();
        var chart=S.performChart;
        for(var si=0;si<chart.events.length;si++){
          var evt=chart.events[si];
          if(evt._scored)continue;
          var delta=Math.abs(nowSec-evt.t)*1000;
          if(delta<(S.performWindowMissMs||220)){
            // Use the exact same notes the scorer checks: event.notes
            var tn=evt.notes;
            if(!tn||!tn.length){
              // Try CHORD_NOTES lookup
              if(evt.chord&&typeof CHORD_NOTES!=="undefined"&&CHORD_NOTES[evt.chord]){
                tn=CHORD_NOTES[evt.chord];
              }
            }
            if(!tn||!tn.length) tn=["C","E","G"];
            PerformanceInput.latestPitchClasses=tn.slice();
            // Also inject a fake MIDI attack so cluster-based scoring works
            PerformanceInput.recentMidiNoteOns.push({note:60,tSec:nowSec});
            break;
          }
        }
      }
      return;
    }
    if(S.screen===SCR.HOME&&S.tab===TAB.RHYTHM&&S.rhythmActive){act("rhythmTap");return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.RUNNER&&S.runnerActive){act("runnerStrum");return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.BUILD&&S.progChords.length>=2){act("progPlay");return;}
    return;
  }

  // Enter - context-sensitive confirm
  if(key==="Enter"){
    if(S.screen===SCR.RHYTHM_HIGHWAY){act("rhythmHighwayStrum");return;}
    if(S.screen===SCR.DRILL){act("drillSwitch");return;}
    return;
  }

  if(S.screen===SCR.RHYTHM_HIGHWAY&&key>="1"&&key<="5"){
    act("rhythmHighwayLane", String(parseInt(key,10)-1));
    return;
  }

  // Arrow keys - BPM adjustment
  if(key==="ArrowLeft"||key==="ArrowRight"){
    var delta=key==="ArrowRight"?5:-5;
    if(S.screen===SCR.SESSION&&S.metronomeOn){act("metroBpm",""+(S.metronomeBpm+delta));return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.RHYTHM&&!S.rhythmActive){act("rhythmBpm",""+(S.rhythmBpm+(delta>0?10:-10)));return;}
    if(S.screen===SCR.HOME&&S.tab===TAB.BUILD){act("progBpm",""+(S.progBpm+delta));return;}
    return;
  }

  // Up/Down - level navigation
  if(key==="ArrowUp"||key==="ArrowDown"){
    if(S.screen===SCR.HOME&&S.tab===TAB.PRACTICE){
      var nl=S.selectedLevel+(key==="ArrowUp"?-1:1);
      if(nl>=1&&nl<=S.level){act("selLevel",""+nl);}
      return;
    }
    return;
  }

  // Perform mode shortcuts
  if(S.screen===SCR.PERFORM||S.screen===SCR.PERFORM_DONE){
    if(key==="l"||key==="L"){act("performLoopPhrase");return;}
    if(key==="c"||key==="C"){act("performClearLoop");return;}
    if(key==="r"||key==="R"){act("performRetry");return;}
    if(key==="1"){act("performSpeed",0.5);return;}
    if(key==="2"){act("performSpeed",0.75);return;}
    if(key==="3"){act("performSpeed",1);return;}
    if(key==="4"){act("performSpeed",1.25);return;}
    if(key==="m"||key==="M"){act("performMode","midi");return;}
    if(key==="n"||key==="N"){act("performMode","mic");return;}
    if(key==="p"||key==="P"){act("performRetryPhrase");return;}
    if(key==="Escape"){act("stopPerform");return;}
    if(key==="d"||key==="D"){act("performDebug");return;}
  }

  // M - toggle metronome
  if(key==="m"||key==="M"){
    if(S.screen===SCR.SESSION){act("toggleMetro");return;}
    return;
  }

  // S - toggle sound (shift+S to avoid conflict)
  if(key==="S"){
    S.soundOn=!S.soundOn;saveState();render();return;
  }

  // D - toggle dark mode
  if(key==="d"||key==="D"){
    act("toggleDark");return;
  }

  // Number keys 1-9 for quick tab switching
  if(key>="1"&&key<="9"&&S.screen===SCR.HOME){
    var tabList=[TAB.PRACTICE,TAB.DRILL,TAB.DAILY,TAB.QUIZ,TAB.EAR,TAB.STRUM,TAB.SONGS,TAB.RHYTHM,TAB.BUILD];
    var idx=parseInt(key)-1;
    if(idx<tabList.length){act("tab",tabList[idx]);}
    return;
  }
  // 0 for stats, - for tuner, = for guide
  if(key==="0"&&S.screen===SCR.HOME){act("tab",TAB.STATS);return;}
});

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
// render() moved to index.html after all instrument pages register
