// ===== ChordSpark: Active session/screen pages =====

function getSessionPageInstrument(){
  var inst;
  var candidate;
  var all;
  var i;
  var entry;
  if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
    return null;
  }
  inst = SparkInstruments.getActive();
  if (!inst) return null;
  if (typeof inst.getData === "function" || inst.ui) return inst;
  candidate = inst.id || inst.appId || inst.instrumentId || null;
  if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
  all = SparkInstruments.getAll() || [];
  for (i = 0; i < all.length; i++) {
    entry = all[i] || {};
    if (entry.id === candidate || entry.appId === candidate) return entry;
  }
  return inst;
}

function getSparkCoreRuntimeState(){
  if (!window.sparkCore || typeof window.sparkCore.getActiveSessionView !== "function") return null;
  var view = window.sparkCore.getActiveSessionView();
  return view && view.runtimeState ? view.runtimeState : null;
}

function findInstrumentChordByName(D, chordName){
  if (!D || !chordName || !Array.isArray(D.ALL_CHORDS)) return null;
  for (var i = 0; i < D.ALL_CHORDS.length; i++) {
    var chord = D.ALL_CHORDS[i];
    if (!chord) continue;
    if (chord.name === chordName || chord.short === chordName) return chord;
  }
  return null;
}

function normalizeSessionNumber(value, fallback){
  var num = typeof value === "number" ? value : Number(value);
  return isFinite(num) ? num : fallback;
}

function formatSessionBpm(value, fallback){
  var bpm = normalizeSessionNumber(value, null);
  if (bpm == null) return fallback;
  return String(Math.round(bpm));
}

function getLegacySessionRuntime(D){
  var runtime = getSparkCoreRuntimeState();
  return {
    chord: S.currentChord || findInstrumentChordByName(D, runtime && runtime.legacyPracticeChordName),
    timer: typeof S.timer === "number" ? S.timer : (runtime && typeof runtime.legacyPracticeRemainingSec === "number" ? runtime.legacyPracticeRemainingSec : (runtime && typeof runtime.legacyPracticeDurationSec === "number" ? runtime.legacyPracticeDurationSec : 0)),
    timerActive: typeof S.timerActive === "boolean" ? S.timerActive : !!(runtime && runtime.legacyPracticeTimerActive)
  };
}

function getLegacyDrillRuntime(D){
  var runtime = getSparkCoreRuntimeState();
  var drillChords = Array.isArray(S.drillChords) && S.drillChords.length ? S.drillChords : [];
  if (!drillChords.length && runtime && Array.isArray(runtime.legacyDrillChordNames)) {
    for (var i = 0; i < runtime.legacyDrillChordNames.length; i++) {
      var chord = findInstrumentChordByName(D, runtime.legacyDrillChordNames[i]);
      if (chord) drillChords.push(chord);
    }
  }
  return {
    chords: drillChords,
    timer: typeof S.drillTimer === "number" ? S.drillTimer : (runtime && typeof runtime.legacyPracticeRemainingSec === "number" ? runtime.legacyPracticeRemainingSec : (runtime && typeof runtime.legacyPracticeDurationSec === "number" ? runtime.legacyPracticeDurationSec : 0))
  };
}

function getLegacyDailyRuntime(){
  var runtime = getSparkCoreRuntimeState();
  return {
    timer: typeof S.dailyTimer === "number" ? S.dailyTimer : (runtime && typeof runtime.legacyDailyRemainingSec === "number" ? runtime.legacyDailyRemainingSec : (runtime && typeof runtime.legacyDailyDurationSec === "number" ? runtime.legacyDailyDurationSec : 0)),
    complete: typeof S.dailyComplete === "boolean" ? S.dailyComplete : !!(runtime && runtime.legacyDailyComplete)
  };
}

function getSessionMetronomeRuntime(){
  var runtime = getSparkCoreRuntimeState();
  return {
    active: typeof S.metronomeOn === "boolean" ? S.metronomeOn : !!(runtime && runtime.metronomeActive),
    bpm: normalizeSessionNumber(
      typeof S.metronomeBpm === "number" ? S.metronomeBpm : (runtime ? runtime.metronomeBpm : null),
      80
    ),
    beat: normalizeSessionNumber(
      typeof S._metroBeat === "number" ? S._metroBeat : (runtime ? runtime.metronomeBeat : null),
      0
    ),
    beatsPerBar: normalizeSessionNumber(
      typeof S._metroBeats === "number" ? S._metroBeats : (runtime ? runtime.metronomeBeatsPerBar : null),
      4
    )
  };
}

function getSessionChordDetectRuntime(){
  if (typeof getLegacyChordDetectRuntime === "function") return getLegacyChordDetectRuntime();
  var runtime = getSparkCoreRuntimeState();
  return {
    active: typeof S.chordDetectOn === "boolean" ? S.chordDetectOn : !!(runtime && runtime.chordDetectActive),
    notes: Array.isArray(S.detectedNotes) ? S.detectedNotes : (runtime && Array.isArray(runtime.chordDetectNotes) ? runtime.chordDetectNotes : []),
    match: typeof S.chordMatch === "number" ? S.chordMatch : (runtime && typeof runtime.chordDetectMatch === "number" ? runtime.chordDetectMatch : -1),
    error: S.chordDetectErr || (runtime && runtime.chordDetectError) || ""
  };
}

function _normalizeSessionSongTextToken(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function _firstSessionSongTextToken(){
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = _normalizeSessionSongTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

// ===== SESSION PAGES =====
function sessionPage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var runtime = getLegacySessionRuntime(D);
  var c = runtime.chord;
  if(!c)return '';
  // Check if voicings are available
  var voicings=VOICINGS[c.name];
  var displayChord=c;
  if(voicings&&S.selectedVoicing>0&&S.selectedVoicing<voicings.length){
    displayChord=voicings[S.selectedVoicing];
  }
  var timer = runtime.timer;
  var m=Math.floor(timer/60),s=timer%60;
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button><h2 style="font-size:26px;font-weight:900;color:var(--text-primary);margin:8px 0">'+c.name+'</h2>';

  // Voicing selector
  if(voicings&&voicings.length>1){
    h+='<div class="voicing-tabs">';
    for(var i=0;i<voicings.length;i++){
      h+='<button class="voicing-tab'+(S.selectedVoicing===i?" active":"")+'" onclick="act(\'selectVoicing\',\''+i+'\')">'+voicings[i].label+'</button>';
    }
    h+='</div>';
  }

  h+='<div class="flex-center mb12">'+ringHTML((1-timer/120)*100,90,7,"#FF6B6B",'<div style="font-size:22px;font-weight:900;color:var(--text-primary)">'+m+':'+(s<10?'0':'')+s+'</div>',"Session timer")+'</div>';
  var chordKey=c.name+"_v"+S.selectedVoicing;
  var chordChanged=_prevChordKey!==chordKey;
  var morphClass=(chordChanged&&_prevChordKey)?" chord-morph":"";
  // Only animate on first appearance or chord/voicing change, not every timer tick
  var shouldAnimate=chordChanged;
  h+='<div class="card'+morphClass+'" style="display:inline-block;margin-bottom:12px">'+UI.chord(displayChord,220,c.name,shouldAnimate)+'</div>';
  _prevChordKey=chordKey;
  h+='<button onclick="act(\'previewChord\',\''+c.name+'\')" style="background:none;font-size:14px;color:var(--text-muted);margin-bottom:8px" aria-label="Preview chord sound">&#128264; Listen to this chord</button>';

  // Metronome card
  var metronomeRuntime = getSessionMetronomeRuntime();
  h+='<div class="card mb12"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><h4 style="margin:0;font-size:14px;color:var(--text-primary)">&#127924; Metronome</h4><button class="btn" onclick="act(\'toggleMetro\')" style="padding:8px 16px;font-size:13px;background:'+(metronomeRuntime.active?"#FFE66D":"linear-gradient(135deg,#4ECDC4,#45B7D1)")+';color:'+(metronomeRuntime.active?"var(--text-primary)":"#fff")+'">'+(metronomeRuntime.active?"&#9632; Stop":"&#9654; Start")+'</button></div>';
  h+='<div style="display:flex;align-items:center;justify-content:center;gap:12px"><button onclick="act(\'metroBpm\',\''+(metronomeRuntime.bpm-5)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)" aria-label="Decrease BPM">-</button>';
  h+='<div style="text-align:center;min-width:60px"><div style="font-size:24px;font-weight:900;color:var(--text-primary)">'+metronomeRuntime.bpm+'</div><div style="font-size:10px;color:var(--text-muted)">BPM</div></div>';
  h+='<button onclick="act(\'metroBpm\',\''+(metronomeRuntime.bpm+5)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)" aria-label="Increase BPM">+</button></div>';
  if(metronomeRuntime.active){
    h+='<div style="display:flex;justify-content:center;gap:8px;margin-top:10px">';
    for(var i=0;i<metronomeRuntime.beatsPerBar;i++)h+='<div class="metro-dot'+(i===metronomeRuntime.beat?" active":"")+'"></div>';
    h+='</div>';
  }
  h+='</div>';
  // Chord detection card — detection results update via direct DOM (see updateChordCheckUI)
  var exp=getExpectedNotes(c.name);
  var chordDetectRuntime = getSessionChordDetectRuntime();
  h+='<div class="card mb16" style="min-height:80px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><h4 style="margin:0;font-size:14px;color:var(--text-primary)">&#127908; Chord Check</h4><button class="btn" id="chord-check-btn" onclick="act(\'toggleChordDetect\')" style="padding:8px 16px;font-size:13px;background:'+(chordDetectRuntime.active?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(chordDetectRuntime.active?"var(--text-primary)":"#fff")+'">'+(chordDetectRuntime.active?"&#9632; Stop":"&#127908; Listen")+'</button></div>';
  if(chordDetectRuntime.error)h+='<p style="color:#FF6B6B;font-size:12px;margin-bottom:8px">'+chordDetectRuntime.error+'</p>';
  h+='<div id="chord-check-results">';
  if(chordDetectRuntime.active){
    h+=_buildChordCheckInner(exp);
  }else{h+='<div style="text-align:center;color:var(--text-muted);font-size:12px">Enable mic to check your chord</div>';}
  h+='</div></div>';
  h+='<div class="card mb16" style="text-align:left"><h4 style="margin:0 0 6px;color:var(--text-primary);font-size:14px">&#128161; Tips</h4><p style="margin:0;font-size:13px;color:var(--text-label);line-height:1.5">Press firmly behind the fret. Strum each string to check for buzz. Keep your thumb relaxed!</p></div>';
  var practiceIntention = _firstSessionSongTextToken(S.practiceIntention);
  if(practiceIntention){
    h+='<div style="text-align:center;margin-bottom:12px;font-size:12px;color:var(--text-muted);font-style:italic">&#8220;When I '+escHTML(practiceIntention)+', I open ChordSpark.&#8221;</div>';
  }
  h+='<div style="display:flex;gap:10px;justify-content:center"><button class="btn" onclick="act(\'toggleTimer\')" style="background:'+(runtime.timerActive?"#FFE66D":"#4ECDC4")+';color:'+(runtime.timerActive?"var(--text-primary)":"#fff")+'">'+(runtime.timerActive?"&#9208; Pause":"&#9654; Resume")+'</button><button class="btn" onclick="act(\'doneSession\')" style="background:#FF6B6B;color:#fff">&#10003; Done</button></div></div>';
  return h;
}

function completePage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var runtime = getLegacySessionRuntime(D);
  var n=runtime.chord?runtime.chord.name:"";
  var p=normalizeSessionNumber(S.chordProgress[n], 0);
  var xpAmount = normalizeSessionNumber(S.xpToast && S.xpToast.amount, 10);
  var streak = normalizeSessionNumber(S.streak, 0);
  return '<div class="text-center" style="padding-top:30px"><div style="font-size:56px;margin-bottom:12px;animation:bn .6s ease">&#127881;</div><h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Awesome!</h2><p style="color:var(--text-dim);font-size:15px;margin-bottom:20px">You practiced <strong>'+n+'</strong></p><div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:28px;font-weight:900;color:#FFE66D">+'+xpAmount+'</div><div style="font-size:11px;color:var(--text-muted)">XP</div></div><div><div style="font-size:28px;font-weight:900;color:#FF6B6B">&#128293;'+streak+'</div><div style="font-size:11px;color:var(--text-muted)">Streak</div></div><div><div style="font-size:28px;font-weight:900;color:#4ECDC4">'+p+'%</div><div style="font-size:11px;color:var(--text-muted)">Mastery</div></div></div></div><div class="flex-col"><button class="btn" onclick="act(\'repeatLegacyPracticeSession\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128257; One More</button><button class="btn" onclick="act(\'completeSessionHome\')" style="background:#4ECDC4;color:#fff">&#127968; Home</button></div></div>';
}

function drillPage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var runtime = getLegacyDrillRuntime(D);
  if(runtime.chords.length<2)return '';
  var drillIdx = typeof S.drillIdx === "number" ? S.drillIdx : 0;
  var c=runtime.chords[drillIdx],nx=runtime.chords[(drillIdx+1)%2];
  var drillTimer = runtime.timer;
  var drillChanged=_prevChordKey!==c.name;
  var morphClass=(drillChanged&&_prevChordKey)?" chord-morph":"";
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button>';
  h+='<h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">Switch Drill &#9889;</h2>';
  h+='<div style="display:flex;justify-content:center;gap:20px;align-items:center;margin-bottom:12px"><span id="drill-timer-ring">'+ringHTML((1-drillTimer/60)*100,70,6,"#FF6B6B",'<div style="font-size:18px;font-weight:900;color:var(--text-primary)">'+drillTimer+'s</div>',"Drill timer")+'</span>';
  h+='<div><div id="drill-switch-count" style="font-size:32px;font-weight:900;color:#4ECDC4">'+S.drillSwitches+'</div><div style="font-size:11px;color:var(--text-muted)">switches</div></div>';
  h+='<div style="text-align:center"><div id="drill-adaptive-bpm" style="font-size:18px;font-weight:900;color:#FFE66D">'+formatSessionBpm(S.drillAdaptiveBpm, "0")+'</div><div style="font-size:11px;color:var(--text-muted)">target BPM</div></div></div>';
  h+='<div class="card'+morphClass+'" style="display:inline-block;margin-bottom:12px;border:3px solid '+D.LC[S.level]+'">';
  h+='<h3 style="margin:0 0 4px;font-size:16px;color:'+D.LC[S.level]+'">'+c.name+tierBadgeHTML(c.name,14)+'</h3>'+UI.chord(c,180,null,drillChanged)+'</div>';
  _prevChordKey=c.name;
  // Transition tip
  var tip=getTransitionTip(c.name,nx.name);
  if(tip){
    h+='<div style="background:var(--input-bg);border-radius:14px;padding:10px 14px;margin-bottom:10px;max-width:320px;display:inline-block;text-align:left">';
    h+='<div style="font-size:11px;font-weight:700;color:#4ECDC4;margin-bottom:4px">&#128161; Transition Tip</div>';
    h+='<div style="font-size:12px;color:var(--text-secondary);line-height:1.5">'+tip+'</div></div>';
  }
  h+='<div style="color:var(--text-muted);font-size:12px;margin-bottom:10px">Next: <strong>'+nx.name+tierBadgeHTML(nx.name,12)+'</strong></div>';
  h+='<button class="btn" onclick="act(\'drillSwitch\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary);font-size:18px;padding:16px 44px">&#128260; Switched!</button></div>';
  return h;
}

function drillDonePage(){
  return '<div class="text-center" style="padding-top:30px"><div style="font-size:56px;animation:bn .6s ease">&#9889;</div><h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Drill Complete!</h2><p style="color:var(--text-dim);margin-bottom:20px"><strong>'+S.drillSwitches+'</strong> switches in 60s</p><button class="btn" onclick="act(\'repeatLegacyPracticeDrill\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#9889; Again</button> <button class="btn" onclick="act(\'drillDoneHome\')" style="background:#4ECDC4;color:#fff;margin-left:10px">&#127968; Home</button></div>';
}

function dailyPage(){
  var dc=S.dailyChallenge;if(!dc)return '';
  var runtime = getLegacyDailyRuntime();
  var mx=dc.id==="hold"?30:dc.id==="marathon"?180:60;
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button><div style="font-size:48px;margin-bottom:8px">'+dc.icon+'</div><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">'+dc.title+'</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">'+dc.desc+'</p>';
  if(!runtime.complete)
    h+='<div class="flex-center"><span id="daily-timer-ring">'+ringHTML((1-runtime.timer/mx)*100,100,7,"#FF6B6B",'<div style="font-size:28px;font-weight:900;color:var(--text-primary)">'+runtime.timer+'s</div>',"Daily challenge timer")+'</span></div><div style="margin-top:16px"><button class="btn" onclick="act(\'completeDaily\')" style="background:#FF6B6B;color:#fff">&#10003; Complete</button></div>';
  else
    h+='<div style="font-size:56px;animation:bn .6s ease">&#127941;</div><h3 style="color:#4ECDC4;font-size:20px;font-weight:800;margin:12px 0">Challenge Complete!</h3><div class="card" style="margin:16px 0"><div style="font-size:28px;font-weight:900;color:#FFE66D">+'+dc.xp+' XP</div></div><button class="btn" onclick="act(\'dailyDoneHome\')" style="background:#4ECDC4;color:#fff">&#127968; Home</button>';
  return h+'</div>';
}

function quizPage(){
  var inst = getSessionPageInstrument();
  var UI = inst && inst.ui ? inst.ui : {};
  var runtime = null;
  if (window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function") {
    var view = window.sparkCore.getActiveSessionView();
    runtime = view && view.runtimeState ? view.runtimeState : null;
  }
  var quizQuestion = S.quizQ || (runtime && runtime.legacyQuizQuestion ? runtime.legacyQuizQuestion : null);
  var quizOptions = Array.isArray(S.quizOpts) && S.quizOpts.length ? S.quizOpts : (runtime && Array.isArray(runtime.legacyQuizOptions) ? runtime.legacyQuizOptions : []);
  var quizAnswer = typeof S.quizAns === "string" ? S.quizAns : (runtime ? runtime.legacyQuizAnswer : null);
  var quizScore = normalizeSessionNumber(S.quizScore, normalizeSessionNumber(runtime && runtime.legacyQuizScore, 0));
  var quizTotal = normalizeSessionNumber(S.quizTotal, normalizeSessionNumber(runtime && runtime.legacyQuizTotal, 0));
  var quizStreak = normalizeSessionNumber(S.quizStreak, normalizeSessionNumber(runtime && runtime.legacyQuizStreak, 0));
  if(!quizQuestion)return '';
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'tab\',\'quiz\')">&#8592; Back</button><div style="display:flex;justify-content:center;gap:16px;margin-bottom:12px"><div style="background:#4ECDC422;padding:6px 14px;border-radius:14px"><span style="font-weight:700;color:#4ECDC4">'+quizScore+'/'+quizTotal+'</span></div><div style="background:#FF6B6B22;padding:6px 14px;border-radius:14px">&#128293;<span style="font-weight:700;color:#FF6B6B">'+quizStreak+'</span></div></div>';
  h+='<h2 style="font-size:28px;font-weight:900;color:var(--text-primary);margin:8px 0 4px">Which is...</h2><div style="font-size:36px;font-weight:900;color:#FF6B6B;margin-bottom:16px">'+quizQuestion.name+'?</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
  for(var i=0;i<quizOptions.length;i++){
    var c=quizOptions[i],isA=quizAnswer!==null,isC=c.name===quizQuestion.name,isP=quizAnswer===c.name;
    h+='<div class="card"'+clickableDiv("act(\'answerQuiz\',\'"+c.name+"\')")+' style="cursor:'+(isA?"default":"pointer")+';padding:10px;border:3px solid '+(isA?(isC?"#4ECDC4":(isP?"#FF6B6B":"var(--border)")):"var(--border)")+';background:'+(isA&&isC?"#4ECDC411":isA&&isP&&!isC?"#FF6B6B11":"var(--card-bg)")+';transition:all .2s;transform:'+(isA&&isC?"scale(1.05)":"scale(1)")+'">'+UI.chord(c,100)+'</div>';
  }
  h+='</div>';
  if(quizAnswer){
    var ok=quizAnswer===quizQuestion.name;
    h+='<div style="margin-top:16px;font-size:20px;font-weight:800;color:'+(ok?"#4ECDC4":"#FF6B6B")+';animation:bn .4s ease">'+(ok?"&#9989; Correct! +10 XP":"&#10060; Not quite!")+'</div>';
  }
  return h+'</div>';
}

function strumDetailPage(){
  var runtime = null;
  if (window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function") {
    var view = window.sparkCore.getActiveSessionView();
    runtime = view && view.runtimeState ? view.runtimeState : null;
  }
  var sp = S.selectedStrum || (runtime && runtime.legacyStrumPattern ? runtime.legacyStrumPattern : null); if(!sp)return '';
  var strumActive = typeof S.strumActive === "boolean" ? S.strumActive : !!(runtime && runtime.legacyStrumActive);
  var curBeat = strumActive
    ? (typeof S._strumBeat === "number" ? S._strumBeat : (runtime && typeof runtime.legacyStrumBeat === "number" ? runtime.legacyStrumBeat : -1))
    : -1;
  var curDir=curBeat>=0?sp.pattern[curBeat]:"x";
  var strumBpm = formatSessionBpm(sp.bpm, "--");
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button>';
  h+='<h2 style="font-size:24px;font-weight:900;color:var(--text-primary);margin:8px 0">'+sp.name+'</h2>';
  h+='<p style="color:var(--text-dim);font-size:13px;margin-bottom:8px">'+sp.desc+'</p>';
  h+='<div style="display:inline-block;background:#FFF3E0;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;color:#E65100;margin-bottom:20px">'+strumBpm+' BPM</div>';
  // Strum hand animation
  h+='<div class="flex-center mb12">'+strumHandSVG(curDir,strumActive)+'</div>';
  h+='<div class="card mb20" style="padding:24px"><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">'+strumHTML(sp.pattern,curBeat)+'</div></div>';
  // Tone picker
  h+='<div class="card mb16"><h4 style="margin:0 0 8px;font-size:13px;font-weight:800;color:var(--text-primary)">&#127928; Strum Tone</h4><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">';
  var tones=["classic","nylon","steel","electric","guitar"];
  var toneLabels={"classic":"&#127928; Classic","nylon":"&#127931; Nylon","steel":"&#129529; Steel","electric":"&#9889; Electric","guitar":"&#127930; Guitar"};
  for(var i=0;i<tones.length;i++){
    var t=tones[i],sel=S.strumTone===t;
    h+='<button onclick="act(\'setTone\',\''+t+'\')" style="padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;background:'+(sel?"#4ECDC4":"var(--input-bg)")+';color:'+(sel?"#fff":"var(--text-muted)")+';border:2px solid '+(sel?"#4ECDC4":"var(--border)")+';transition:all .2s">'+toneLabels[t]+'</button>';
  }
  h+='</div></div>';
  h+='<button class="btn" onclick="act(\'toggleStrum\')" style="background:'+(strumActive?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(strumActive?"var(--text-primary)":"#fff")+'">'+(strumActive?"&#9208; Stop":"&#9654; Play Pattern")+'</button></div>';
  return h;
}

function songDetailPage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var songRuntime = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var sg = songRuntime && songRuntime.songSessionData ? songRuntime.songSessionData : S.selectedSong;
  if(!sg)return '';
  var songTitle = _firstSessionSongTextToken(sg.title, sg.songTitle, sg.id, "Song");
  var songArtist = _firstSessionSongTextToken(sg.artist, "Unknown Artist");
  var songBpm = formatSessionBpm(sg.bpm, "--");
  var songPlaying = songRuntime && typeof songRuntime.songPlaying === "boolean" ? songRuntime.songPlaying : S.songPlaying;
  var songBeat = songRuntime && typeof songRuntime.songBeat === "number" ? songRuntime.songBeat : S.songBeat;
  var patBeat=songPlaying?(songBeat%sg.pattern.length):-1;
  var curDir=patBeat>=0?sg.pattern[patBeat]:"x";
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'songBack\')">&#8592; Back</button><h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">'+escHTML(songTitle)+'</h2><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">'+escHTML(songArtist)+' &#8226; '+songBpm+' BPM</p>';
  h+='<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">';
  for(var i=0;i<sg.chords.length;i++)
    h+='<span style="background:var(--chip-bg);padding:4px 12px;border-radius:10px;font-size:13px;font-weight:700;color:var(--chip-color)">'+escHTML(sg.chords[i])+'</span>';
  h+='</div>';
  h+='<div class="card mb16"><h4 style="margin:0 0 10px;font-size:14px;color:var(--text-primary)">Chord Progression</h4><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">';
  for(var i=0;i<sg.progression.length;i++){
    var c=sg.progression[i],isA=songPlaying&&i===songBeat;
    h+='<div style="width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:'+(isA?"#FF6B6B":"var(--chip-bg)")+';color:'+(isA?"#fff":"var(--chip-color)")+';font-size:16px;font-weight:800;border:2px solid '+(isA?"#FF6B6B":"var(--border)")+';transition:all .15s;transform:'+(isA?"scale(1.15)":"scale(1)")+'">'+escHTML(c)+'</div>';
  }
  h+='</div></div>';
  if(songPlaying){
    var cn=sg.progression[songBeat],ch=null;
    for(var i=0;i<D.ALL_CHORDS.length;i++)if(D.ALL_CHORDS[i].short===cn||D.ALL_CHORDS[i].name===cn)ch=D.ALL_CHORDS[i];
    if(ch)h+='<div class="card mb16"><h4 style="margin:0 0 4px;font-size:14px;color:#FF6B6B">Now: '+ch.name+'</h4><div class="flex-center">'+UI.chord(ch,160)+'</div></div>';
  }
  // Strum hand + pattern
  h+='<div class="card mb16" style="padding:16px"><h4 style="margin:0 0 8px;font-size:14px;color:var(--text-primary)">Strum Pattern</h4>';
  h+='<div class="flex-center mb12">'+strumHandSVG(curDir,songPlaying)+'</div>';
  h+='<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">'+strumHTML(sg.pattern,patBeat)+'</div></div>';
  // Tone picker
  h+='<div class="card mb16"><h4 style="margin:0 0 8px;font-size:13px;font-weight:800;color:var(--text-primary)">&#127928; Strum Tone</h4><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">';
  var tones=["classic","nylon","steel","electric","guitar"];
  var toneLabels={"classic":"&#127928; Classic","nylon":"&#127931; Nylon","steel":"&#129529; Steel","electric":"&#9889; Electric","guitar":"&#127930; Guitar"};
  for(var i=0;i<tones.length;i++){
    var t=tones[i],sel=S.strumTone===t;
    h+='<button onclick="act(\'setTone\',\''+t+'\')" style="padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;background:'+(sel?"#4ECDC4":"var(--input-bg)")+';color:'+(sel?"#fff":"var(--text-muted)")+';border:2px solid '+(sel?"#4ECDC4":"var(--border)")+';transition:all .2s">'+toneLabels[t]+'</button>';
  }
  h+='</div></div>';
  h+='<div style="display:flex;gap:10px;justify-content:center"><button class="btn" onclick="act(\'toggleSong\')" style="background:'+(songPlaying?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(songPlaying?"var(--text-primary)":"#fff")+'">'+(songPlaying?"&#9208; Pause":"&#9654; Play Along")+'</button>';
  if(songPlaying)h+='<button class="btn" onclick="act(\'completeSong\')" style="background:#4ECDC4;color:#fff">&#10003; Done</button>';
  return h+'</div></div>';
}

function songDonePage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var songRuntime = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var runtimeSong = songRuntime && songRuntime.songSessionData ? songRuntime.songSessionData : null;
  var selectedSong = S.selectedSong || null;
  var t = escHTML(_firstSessionSongTextToken(
    runtimeSong && runtimeSong.title,
    runtimeSong && runtimeSong.songTitle,
    runtimeSong && runtimeSong.id,
    selectedSong && selectedSong.title,
    selectedSong && selectedSong.songTitle,
    selectedSong && selectedSong.id,
    "this song"
  ));
  return '<div class="text-center" style="padding-top:30px"><div style="font-size:56px;animation:bn .6s ease">&#127925;</div><h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Song Complete!</h2><p style="color:var(--text-dim);margin-bottom:20px">You played <strong>'+t+'</strong></p><div class="card mb20"><div style="font-size:28px;font-weight:900;color:#FFE66D">+40 XP</div></div><button class="btn" onclick="act(\'songDoneHome\')" style="background:#4ECDC4;color:#fff">&#127968; Home</button></div>';
}
