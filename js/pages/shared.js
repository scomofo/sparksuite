// ===== ChordSpark: Shared rendering helpers =====

// Build chord check inner HTML (shared by sessionPage and updateChordCheckUI)
function _buildChordCheckInner(exp){
  // Note pills row — fixed height so layout doesn't jump
  var h='<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-bottom:10px;min-height:32px">';
  for(var i=0;i<exp.length;i++){
    var found=S.detectedNotes.indexOf(exp[i])!==-1;
    h+='<span class="note-pill" style="background:'+(found?"#4ECDC422":"var(--chip-bg)")+';color:'+(found?"#4ECDC4":"var(--text-muted)")+';border:2px solid '+(found?"#4ECDC4":"var(--border)")+'">'+(found?"&#9989;":"&#9675;")+' '+exp[i]+'</span>';
  }
  h+='</div>';
  // Match ring area — always same height to prevent layout shifts
  h+='<div style="text-align:center;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center">';
  if(S.chordMatch>=0){
    var mc=S.chordMatch>=80?"#4ECDC4":S.chordMatch>=50?"#FFE66D":"#FF6B6B";
    var ml=S.chordMatch>=80?"Great!":S.chordMatch>=50?"Getting there...":"Keep trying!";
    h+=ringHTML(S.chordMatch,70,5,mc,'<div style="font-size:16px;font-weight:900;color:'+mc+'">'+S.chordMatch+'%</div>',"Chord match")+'<div style="font-size:12px;font-weight:700;color:'+mc+';margin-top:4px">'+ml+'</div>';
  }else{h+='<div style="color:var(--text-muted);font-size:13px">Strum the chord...</div>';}
  h+='</div>';
  // AI Coach feedback — fixed min height
  h+='<div style="min-height:20px">';
  var tips=getCoachFeedback(S.currentChord?S.currentChord.name:"",S.detectedNotes,exp);
  if(tips.length>0&&S.chordMatch>=0&&S.chordMatch<100){
    h+='<div style="margin-top:10px;background:var(--input-bg);border-radius:12px;padding:10px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px">&#129302; Coach Tips:</div>';
    for(var i=0;i<tips.length;i++){
      h+='<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">&#8226; '+tips[i]+'</div>';
    }
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// Update chord check results without full DOM rebuild
function updateChordCheckUI(){
  var el=document.getElementById("chord-check-results");
  if(!el||!S.chordDetectOn)return;
  var exp=getExpectedNotes(S.currentChord?S.currentChord.name:"");
  el.innerHTML=_buildChordCheckInner(exp);
}

// Targeted tuner UI update (avoids full DOM rebuild at ~30fps)
function updateTunerUI(){
  var noteEl=document.getElementById("tuner-note-display");
  var freqEl=document.getElementById("tuner-freq-display");
  var needleEl=document.getElementById("tuner-needle");
  var statusEl=document.getElementById("tuner-status");
  var stringsEl=document.getElementById("tuner-strings");
  if(!noteEl)return; // not on tuner tab

  var inT=Math.abs(S.tunerCents)<5;
  var tC=inT?"#4ECDC4":Math.abs(S.tunerCents)<15?"#FFE66D":"#FF6B6B";

  noteEl.textContent=S.tunerNote||"\u2014";
  noteEl.style.color=tC;
  freqEl.textContent=S.tunerFreq>0?S.tunerFreq+" Hz":"Play a note...";

  if(needleEl){
    needleEl.style.left=(50+S.tunerCents/2)+"%";
    needleEl.style.background=tC;
  }

  if(statusEl){
    if(!S.tunerFreq)statusEl.innerHTML="&#128266; Listening...";
    else if(inT)statusEl.innerHTML="&#9989; In Tune!";
    else if(S.tunerCents>0)statusEl.innerHTML="&#11015; Too sharp (+"+S.tunerCents+"&#162;) &#8595;";
    else statusEl.innerHTML="&#11014; Too flat ("+S.tunerCents+"&#162;) &#8593;";
    statusEl.style.color=tC;
  }

  // Update string highlights
  if(stringsEl){
    var btns=stringsEl.children;
    for(var i=0;i<btns.length&&i<GUITAR_STRINGS.length;i++){
      var gs=GUITAR_STRINGS[i];
      var mt=S.tunerNote===gs.note;
      var sInT=mt&&Math.abs(S.tunerCents)<5;
      var sC=sInT?"#4ECDC4":mt&&Math.abs(S.tunerCents)<15?"#FFE66D":"#FF6B6B";
      btns[i].style.background=mt?sC+"22":"var(--chip-bg)";
      btns[i].style.borderColor=mt?sC:"var(--border)";
      btns[i].firstChild.style.color=mt?sC:"var(--text-muted)";
    }
  }
}

// ===== PARTIAL DOM UPDATES (avoid full rebuild for timer-tick screens) =====
function updateDrillTimerUI(){
  var timerEl=document.getElementById("drill-timer-ring");
  var switchEl=document.getElementById("drill-switch-count");
  var bpmEl=document.getElementById("drill-adaptive-bpm");
  if(!timerEl)return false;
  if(timerEl)timerEl.innerHTML=ringHTML((1-S.drillTimer/60)*100,70,6,"#FF6B6B",'<div style="font-size:18px;font-weight:900;color:var(--text-primary)">'+S.drillTimer+'s</div>',"Drill timer");
  if(switchEl)switchEl.textContent=S.drillSwitches;
  if(bpmEl)bpmEl.textContent=S.drillAdaptiveBpm;
  return true;
}

function updateDailyTimerUI(){
  var el=document.getElementById("daily-timer-ring");
  if(!el)return false;
  var dc=S.dailyChallenge;if(!dc)return false;
  var mx=dc.id==="hold"?30:dc.id==="marathon"?180:60;
  el.innerHTML=ringHTML((1-S.dailyTimer/mx)*100,100,7,"#FF6B6B",'<div style="font-size:28px;font-weight:900;color:var(--text-primary)">'+S.dailyTimer+'s</div>',"Daily challenge timer");
  return true;
}

// ===== FINGER EXERCISES CARD =====
function fingerExerciseCard(){
  var h='<div class="card" style="margin-top:12px">';
  h+='<h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#9995; Finger Exercises</h3>';

  // Active exercise
  if(S.fingerExActive&&S.fingerExId){
    var ex=null;
    for(var i=0;i<FINGER_EXERCISES.length;i++)if(FINGER_EXERCISES[i].id===S.fingerExId){ex=FINGER_EXERCISES[i];break;}
    if(ex){
      var m=Math.floor(S.fingerExTimer/60),s=S.fingerExTimer%60;
      h+='<div style="background:var(--input-bg);border-radius:14px;padding:14px;margin-bottom:10px;border-left:4px solid #FF6B6B">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      h+='<div style="font-size:14px;font-weight:800;color:var(--text-primary)">'+escHTML(ex.name)+'</div>';
      h+='<div style="font-size:20px;font-weight:900;color:#FF6B6B">'+m+':'+(s<10?'0':'')+s+'</div>';
      h+='</div>';
      h+='<p style="margin:0 0 8px;font-size:12px;color:var(--text-secondary);line-height:1.5">'+escHTML(ex.desc)+'</p>';
      if(ex.goal)h+='<div style="font-size:11px;color:#4ECDC4;font-weight:700">&#127919; '+escHTML(ex.goal)+'</div>';
      h+='<button onclick="act(\'stopFingerEx\')" style="margin-top:8px;background:#FF6B6B;color:#fff;padding:6px 16px;border-radius:10px;font-size:12px;font-weight:700">&#9632; Stop</button>';
      h+='</div>';
      h+='</div>';
      return h;
    }
  }

  // Exercise list by tier
  var tiers=[
    {num:1,label:"Off-Instrument",icon:"&#128400;",note:"No guitar needed \u2014 do anywhere!"},
    {num:2,label:"On-Instrument",icon:"&#127928;",note:"Single-string warm-ups"},
    {num:3,label:"Chord-Specific",icon:"&#9889;",note:"Transition speed builders"}
  ];
  for(var ti=0;ti<tiers.length;ti++){
    var t=tiers[ti];
    var exs=FINGER_EXERCISES.filter(function(e){return e.tier===t.num;});
    if(!exs.length)continue;
    h+='<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:8px 0 4px">'+t.icon+' Tier '+t.num+': '+t.label+'</div>';
    for(var ei=0;ei<exs.length;ei++){
      var ex=exs[ei];
      var done=(S.fingerStats&&S.fingerStats[ex.id])||0;
      var m=Math.floor(ex.duration/60),s=ex.duration%60;
      h+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;'+(ei>0?'border-top:1px solid var(--border);':'')+'">';
      h+='<div style="flex:1">';
      h+='<div style="font-size:13px;font-weight:700;color:var(--text-primary)">'+escHTML(ex.name);
      if(done>0)h+=' <span style="font-size:10px;color:#4ECDC4">&#9989; '+done+'x</span>';
      h+='</div>';
      h+='<div style="font-size:11px;color:var(--text-muted)">'+m+':'+(s<10?'0':'')+s+' &bull; '+escHTML(ex.frequency);
      if(ex.offInstrument)h+=' &bull; <span style="color:#FFE66D">no guitar</span>';
      h+='</div></div>';
      h+='<button onclick="act(\'startFingerEx\',\''+ex.id+'\')" style="padding:6px 14px;border-radius:10px;font-size:12px;font-weight:700;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Go</button>';
      h+='</div>';
    }
  }
  h+='</div>';
  return h;
}

// ===== STRUM TRACK RECOMMENDATION =====
// Maps session count to the recommended strum pattern index in STRUM_PATTERNS
// (S1-S7 progression from the curriculum addendum)
function _getRecommendedStrumIdx(){
  var n=S.sessions;
  if(n<8)  return 0; // S1: Basic Down (all downstrokes)
  if(n<13) return 1; // S2: Down-Up (first upstroke)
  if(n<19) return 2; // S3: Folk Strum (campfire pattern)
  if(n<25) return 3; // S4: Pop Rock (skip beats for drive)
  if(n<33) return 4; // S5: Island Strum (syncopated/reggae)
  return 5;          // S6: Ballad Strum (fingerpicking preview)
}

function strumTrackCard(){
  var idx=_getRecommendedStrumIdx();
  var sp=STRUM_PATTERNS[idx];
  if(!sp)return '';
  var isNext=idx>0&&S.sessions>0;
  var nextIdx=Math.min(idx+1,STRUM_PATTERNS.length-1);
  var nextSp=STRUM_PATTERNS[nextIdx];
  var h='<div class="card" style="margin-top:12px">';
  h+='<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127925; Your Strum Track</h3>';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">';
  h+='<div style="flex:1">';
  h+='<div style="font-size:14px;font-weight:700;color:#4ECDC4;margin-bottom:2px">'+sp.name+'</div>';
  h+='<div style="font-size:12px;color:var(--text-muted)">'+sp.desc+' &bull; '+sp.bpm+' BPM</div>';
  h+='</div>';
  h+='<button onclick="act(\'tab\',\'strum\')" style="padding:8px 14px;border-radius:12px;font-size:12px;font-weight:700;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">Practice</button>';
  h+='</div>';
  // Pattern preview
  h+='<div style="display:flex;gap:5px;flex-wrap:wrap">';
  for(var i=0;i<sp.pattern.length;i++){
    var d=sp.pattern[i];
    var bg=d==="D"?"#FF6B6B22":d==="U"?"#4ECDC422":"var(--input-bg)";
    var col=d==="D"?"#FF6B6B":d==="U"?"#4ECDC4":"var(--text-muted)";
    h+='<span style="width:32px;height:32px;border-radius:8px;background:'+bg+';color:'+col+';font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;border:1px solid '+col+'44">'+(d==="D"?"&#8595;":d==="U"?"&#8593;":"&times;")+'</span>';
  }
  h+='</div>';
  if(isNext&&nextSp&&nextSp.name!==sp.name){
    var sessionsNeeded={1:8,2:13,3:19,4:25,5:33};
    var need=sessionsNeeded[idx]||999;
    var remaining=Math.max(0,need-S.sessions);
    if(remaining>0)h+='<div style="font-size:11px;color:var(--text-muted);margin-top:8px">Next: <strong>'+nextSp.name+'</strong> in '+remaining+' session'+(remaining===1?"":"s")+'</div>';
  }
  h+='</div>';
  return h;
}

// Keyboard shortcut overlay
function shortcutOverlay(){
  var shortcuts=[
    ["Space","Pause / Resume"],
    ["Enter","Confirm (drill switch)"],
    ["Escape","Go back / close"],
    ["?","Toggle this help"],
    ["Left/Right","BPM -/+5"],
    ["Up/Down","Change level"],
    ["M","Toggle metronome"],
    ["Shift+S","Toggle sound"],
    ["D","Toggle dark mode"],
    ["1-9","Quick tab switch"],
    ["0","Stats tab"]
  ];
  var h='<div class="shortcut-overlay" onclick="act(\'toggleShortcuts\')" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">';
  h+='<div class="shortcut-modal" onclick="event.stopPropagation()">';
  h+='<h3 style="margin:0 0 16px;font-size:18px;font-weight:800;color:var(--text-primary)">&#9000; Keyboard Shortcuts</h3>';
  for(var i=0;i<shortcuts.length;i++){
    h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">';
    h+='<kbd style="background:var(--input-bg);padding:3px 10px;border-radius:6px;font-size:13px;font-weight:700;font-family:monospace;color:var(--text-primary);border:1px solid var(--border)">'+shortcuts[i][0]+'</kbd>';
    h+='<span style="font-size:13px;color:var(--text-muted)">'+shortcuts[i][1]+'</span>';
    h+='</div>';
  }
  h+='<button class="btn" id="shortcut-close-btn" onclick="act(\'toggleShortcuts\')" style="margin-top:16px;width:100%;padding:10px;font-size:14px;background:var(--input-bg);color:var(--text-primary)">Close</button>';
  h+='</div></div>';
  return h;
}

function formatTime(s){
  if(!s||isNaN(s))return "0:00";
  var m=Math.floor(s/60);
  var sec=Math.floor(s%60);
  return m+":"+(sec<10?"0":"")+sec;
}
