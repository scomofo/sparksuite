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

function getSessionCoreView(){
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function getSparkCoreRuntimeState(){
  var view = getSessionCoreView();
  return view && view.runtimeState ? view.runtimeState : null;
}

function shouldPreferSessionCoreRuntime() {
  var view = getSessionCoreView();
  return !!(view && view.plan && view.plan.flow === "daily_practice");
}

function isSessionFiniteNumber(value) {
  return typeof value === "number" && isFinite(value);
}

function getPreferredSessionNumber(preferCore, runtimeValue, legacyValue, fallback) {
  if (preferCore && isSessionFiniteNumber(runtimeValue)) return runtimeValue;
  if (isSessionFiniteNumber(legacyValue)) return legacyValue;
  if (isSessionFiniteNumber(runtimeValue)) return runtimeValue;
  return fallback;
}

function getPreferredSessionBoolean(preferCore, runtimeValue, legacyValue, fallback) {
  if (preferCore && typeof runtimeValue === "boolean") return runtimeValue;
  if (typeof legacyValue === "boolean") return legacyValue;
  if (typeof runtimeValue === "boolean") return runtimeValue;
  return fallback;
}

function getPreferredSessionString(preferCore, runtimeValue, legacyValue, fallback) {
  var runtimeToken = _firstSessionSongTextToken(runtimeValue);
  var legacyToken = _firstSessionSongTextToken(legacyValue);
  if (preferCore && runtimeToken) return runtimeToken;
  if (legacyToken) return legacyToken;
  if (runtimeToken) return runtimeToken;
  return fallback || "";
}

function getPreferredSessionArray(preferCore, runtimeValue, legacyValue) {
  if (preferCore && Array.isArray(runtimeValue)) return runtimeValue;
  if (Array.isArray(legacyValue)) return legacyValue;
  if (Array.isArray(runtimeValue)) return runtimeValue;
  return [];
}

function getSessionPageActiveShellSummary(){
  var shell;
  if (typeof SparkSessionShellUI === "undefined" || !SparkSessionShellUI || typeof SparkSessionShellUI.buildDailyShellSummary !== "function") {
    return null;
  }
  shell = SparkSessionShellUI.buildDailyShellSummary(getSessionCoreView(), {
    focusFormatter: function(plan) {
      return _firstSessionSongTextToken(plan && plan.focus, plan && plan.title, "Practice Session");
    },
    segmentFormatter: function(segment) {
      return _firstSessionSongTextToken(segment && segment.label, segment && segment.title, segment && segment.type, "Practice block");
    },
    fallbackTitle: "Practice Session",
    fallbackSegmentLabel: "Practice block"
  });
  if (shell) return shell;
  if (typeof S !== "undefined" && S && S.practicePlan && S.practicePlan.flow === "daily_practice" && Array.isArray(S.practicePlan.items)) {
    return SparkSessionShellUI.buildDailyShellSummary({
      plan: {
        flow: "daily_practice",
        focus: S.practicePlan.focus || "Practice Session",
        segments: S.practicePlan.items
      },
      runtimeState: {
        activeSegmentId: S.practicePlan.items[0] && S.practicePlan.items[0].id ? S.practicePlan.items[0].id : null,
        transport: { status: "running", positionMs: 0 }
      }
    }, {
      focusFormatter: function(plan) {
        return _firstSessionSongTextToken(plan && plan.focus, plan && plan.title, "Practice Session");
      },
      segmentFormatter: function(segment) {
        return _firstSessionSongTextToken(segment && segment.label, segment && segment.title, segment && segment.type, "Practice block");
      },
      fallbackTitle: "Practice Session",
      fallbackSegmentLabel: "Practice block"
    });
  }
  return null;
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

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizeSessionNumber(value, fallback){ return SparkNormalize.number(value, fallback); }

function getSessionChordProgressValue(chordName){
  var legacyProgress;
  var value;
  if (typeof SparkChordProgress !== "undefined" && SparkChordProgress && typeof SparkChordProgress.get === "function") {
    return normalizeSessionNumber(SparkChordProgress.get(chordName), 0);
  }
  legacyProgress = S && S.chordProgress && typeof S.chordProgress === "object" ? S.chordProgress : null;
  value = legacyProgress ? legacyProgress[chordName] : 0;
  return normalizeSessionNumber(value, 0);
}

function formatSessionBpm(value, fallback){
  var bpm = normalizeSessionNumber(value, null);
  if (bpm == null) return fallback;
  return String(Math.round(bpm));
}

function getLegacySessionRuntime(D){
  var runtime = getSparkCoreRuntimeState();
  var preferCore = shouldPreferSessionCoreRuntime();
  var runtimeChord = findInstrumentChordByName(D, runtime && runtime.legacyPracticeChordName);
  var legacyChord = S.currentChord || findInstrumentChordByName(D, S && S.chord) || null;
  return {
    chord: preferCore ? (runtimeChord || legacyChord) : (legacyChord || runtimeChord),
    timer: getPreferredSessionNumber(
      preferCore,
      runtime && typeof runtime.legacyPracticeRemainingSec === "number"
        ? runtime.legacyPracticeRemainingSec
        : (runtime && typeof runtime.legacyPracticeDurationSec === "number" ? runtime.legacyPracticeDurationSec : null),
      typeof S.timer === "number" ? S.timer : null,
      0
    ),
    timerActive: getPreferredSessionBoolean(
      preferCore,
      runtime ? !!runtime.legacyPracticeTimerActive : null,
      typeof S.timerActive === "boolean" ? S.timerActive : null,
      false
    )
  };
}

function getLegacyDrillRuntime(D){
  var runtime = getSparkCoreRuntimeState();
  var preferCore = shouldPreferSessionCoreRuntime();
  var legacyDrillChords = Array.isArray(S.drillChords) && S.drillChords.length ? S.drillChords : null;
  var runtimeDrillChords = [];
  if (runtime && Array.isArray(runtime.legacyDrillChordNames)) {
    for (var i = 0; i < runtime.legacyDrillChordNames.length; i++) {
      var chord = findInstrumentChordByName(D, runtime.legacyDrillChordNames[i]);
      if (chord) runtimeDrillChords.push(chord);
    }
  }
  var drillChords = getPreferredSessionArray(preferCore, runtimeDrillChords.length ? runtimeDrillChords : null, legacyDrillChords);
  return {
    chords: drillChords,
    timer: getPreferredSessionNumber(
      preferCore,
      runtime && typeof runtime.legacyPracticeRemainingSec === "number"
        ? runtime.legacyPracticeRemainingSec
        : (runtime && typeof runtime.legacyPracticeDurationSec === "number" ? runtime.legacyPracticeDurationSec : null),
      typeof S.drillTimer === "number" ? S.drillTimer : null,
      0
    )
  };
}

function getLegacyDailyRuntime(){
  var runtime = getSparkCoreRuntimeState();
  var preferCore = shouldPreferSessionCoreRuntime();
  return {
    timer: getPreferredSessionNumber(
      preferCore,
      runtime && typeof runtime.legacyDailyRemainingSec === "number"
        ? runtime.legacyDailyRemainingSec
        : (runtime && typeof runtime.legacyDailyDurationSec === "number" ? runtime.legacyDailyDurationSec : null),
      typeof S.dailyTimer === "number" ? S.dailyTimer : null,
      0
    ),
    complete: getPreferredSessionBoolean(
      preferCore,
      runtime ? !!runtime.legacyDailyComplete : null,
      typeof S.dailyComplete === "boolean" ? S.dailyComplete : null,
      false
    )
  };
}

function getSessionMetronomeRuntime(){
  var runtime = getSparkCoreRuntimeState();
  var preferCore = shouldPreferSessionCoreRuntime();
  return {
    active: getPreferredSessionBoolean(
      preferCore,
      runtime ? !!runtime.metronomeActive : null,
      typeof S.metronomeOn === "boolean" ? S.metronomeOn : null,
      false
    ),
    bpm: getPreferredSessionNumber(
      preferCore,
      runtime ? runtime.metronomeBpm : null,
      typeof S.metronomeBpm === "number" ? S.metronomeBpm : null,
      80
    ),
    beat: getPreferredSessionNumber(
      preferCore,
      runtime ? runtime.metronomeBeat : null,
      typeof S._metroBeat === "number" ? S._metroBeat : null,
      0
    ),
    beatsPerBar: getPreferredSessionNumber(
      preferCore,
      runtime ? runtime.metronomeBeatsPerBar : null,
      typeof S._metroBeats === "number" ? S._metroBeats : null,
      4
    )
  };
}

function getSessionChordDetectRuntime(){
  if (typeof getLegacyChordDetectRuntime === "function") return getLegacyChordDetectRuntime();
  var runtime = getSparkCoreRuntimeState();
  var preferCore = shouldPreferSessionCoreRuntime();
  return {
    active: getPreferredSessionBoolean(
      preferCore,
      runtime ? !!runtime.chordDetectActive : null,
      typeof S.chordDetectOn === "boolean" ? S.chordDetectOn : null,
      false
    ),
    notes: getPreferredSessionArray(
      preferCore,
      runtime && Array.isArray(runtime.chordDetectNotes) ? runtime.chordDetectNotes : null,
      Array.isArray(S.detectedNotes) ? S.detectedNotes : null
    ),
    match: getPreferredSessionNumber(
      preferCore,
      runtime && typeof runtime.chordDetectMatch === "number" ? runtime.chordDetectMatch : null,
      typeof S.chordMatch === "number" ? S.chordMatch : null,
      -1
    ),
    error: getPreferredSessionString(
      preferCore,
      runtime && runtime.chordDetectError,
      S.chordDetectErr,
      ""
    )
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

function renderSessionVoicingTabs(voicings){
  var h='<div class="voicing-tabs">';
  for(var i=0;i<voicings.length;i++){
    h+='<button class="voicing-tab'+(S.selectedVoicing===i?" active":"")+'" onclick="act(\'selectVoicing\',\''+i+'\')">'+voicings[i].label+'</button>';
  }
  h+='</div>';
  return h;
}

function renderSessionMetronomeCard(metronomeRuntime){
  var h='<div class="card mb12"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><h4 style="margin:0;font-size:14px;color:var(--text-primary)">&#127924; Metronome</h4><button class="btn" onclick="act(\'toggleMetro\')" style="padding:8px 16px;font-size:13px;background:'+(metronomeRuntime.active?"#FFE66D":"linear-gradient(135deg,#4ECDC4,#45B7D1)")+';color:'+(metronomeRuntime.active?"var(--text-primary)":"#fff")+'">'+(metronomeRuntime.active?"&#9632; Stop":"&#9654; Start")+'</button></div>';
  h+='<div style="display:flex;align-items:center;justify-content:center;gap:12px"><button onclick="act(\'metroBpm\',\''+(metronomeRuntime.bpm-5)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)" aria-label="Decrease BPM">-</button>';
  h+='<div style="text-align:center;min-width:60px"><div style="font-size:24px;font-weight:900;color:var(--text-primary)">'+metronomeRuntime.bpm+'</div><div style="font-size:10px;color:var(--text-muted)">BPM</div></div>';
  h+='<button onclick="act(\'metroBpm\',\''+(metronomeRuntime.bpm+5)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)" aria-label="Increase BPM">+</button></div>';
  if(metronomeRuntime.active){
    h+='<div style="display:flex;justify-content:center;gap:8px;margin-top:10px">';
    for(var i=0;i<metronomeRuntime.beatsPerBar;i++)h+='<div class="metro-dot'+(i===metronomeRuntime.beat?" active":"")+'"></div>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function renderSessionChordCheckCard(chordName){
  var exp=getExpectedNotes(chordName);
  var chordDetectRuntime = getSessionChordDetectRuntime();
  var h='<div class="card mb16" style="min-height:80px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><h4 style="margin:0;font-size:14px;color:var(--text-primary)">&#127908; Chord Check</h4><button class="btn" id="chord-check-btn" onclick="act(\'toggleChordDetect\')" style="padding:8px 16px;font-size:13px;background:'+(chordDetectRuntime.active?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(chordDetectRuntime.active?"var(--text-primary)":"#fff")+'">'+(chordDetectRuntime.active?"&#9632; Stop":"&#127908; Listen")+'</button></div>';
  if(chordDetectRuntime.error)h+='<p style="color:#FF6B6B;font-size:12px;margin-bottom:8px">'+chordDetectRuntime.error+'</p>';
  h+='<div id="chord-check-results">';
  if(chordDetectRuntime.active){
    h+=_buildChordCheckInner(exp);
  }else{
    h+='<div style="text-align:center;color:var(--text-muted);font-size:12px">Enable mic to check your chord</div>';
  }
  h+='</div></div>';
  return h;
}

function renderSessionTipsCard(inst){
  var text = isPianoSessionInstrument(inst)
    ? "Curve your fingers, keep your wrist loose, and press the highlighted keys together with an even sound."
    : "Press firmly behind the fret. Strum each string to check for buzz. Keep your thumb relaxed!";
  return '<div class="card mb16" style="text-align:left"><h4 style="margin:0 0 6px;color:var(--text-primary);font-size:14px">&#128161; Tips</h4><p style="margin:0;font-size:13px;color:var(--text-label);line-height:1.5">'+escHTML(text)+'</p></div>';
}

function renderPracticeIntentionCard(practiceIntention, inst){
  var appName = isPianoSessionInstrument(inst) ? "PianoSpark" : "ChordSpark";
  if(!practiceIntention) return '';
  return '<div style="text-align:center;margin-bottom:12px;font-size:12px;color:var(--text-muted);font-style:italic">&#8220;When I '+escHTML(practiceIntention)+', I open '+appName+'.&#8221;</div>';
}

function renderSessionShellCard(shell){
  if (typeof SparkSessionShellUI === "undefined" || !SparkSessionShellUI || typeof SparkSessionShellUI.renderLiveCard !== "function") {
    return "";
  }
  return SparkSessionShellUI.renderLiveCard(shell, {
    label: "Practice Session Live",
    accent: "#4ECDC4",
    fill: "linear-gradient(90deg,#4ECDC4,#45B7D1)"
  });
}

function getSessionPageFallbackShell(){
  return {
    title: "Practice Session",
    segmentLabel: "Practice block",
    blockCount: 1,
    activeIndex: 0,
    completedCount: 0,
    status: "running",
    statusLabel: "In progress - Practice block",
    targetDurationMin: 0,
    durationMin: 0,
    progressPct: 0,
    elapsedLabel: "0m 0s in block",
    remainingLabel: "0m 0s left",
    primaryAction: "sessionPauseBlock",
    primaryLabel: "Pause Block",
    canSkip: false,
    segments: []
  };
}

function renderSessionActionButtons(runtime){
  return '<div style="display:flex;gap:10px;justify-content:center"><button class="btn" onclick="act(\'toggleTimer\')" style="background:'+(runtime.timerActive?"#FFE66D":"#4ECDC4")+';color:'+(runtime.timerActive?"var(--text-primary)":"#fff")+'">'+(runtime.timerActive?"&#9208; Pause":"&#9654; Resume")+'</button><button class="btn" onclick="act(\'doneSession\')" style="background:#FF6B6B;color:#fff">&#10003; Done</button></div>';
}

function renderStrumTonePicker(selectedTone){
  var tones=["classic","nylon","steel","electric","guitar"];
  var toneLabels={"classic":"&#127928; Classic","nylon":"&#127931; Nylon","steel":"&#129529; Steel","electric":"&#9889; Electric","guitar":"&#127930; Guitar"};
  var h='<div class="card mb16"><h4 style="margin:0 0 8px;font-size:13px;font-weight:800;color:var(--text-primary)">&#127928; Strum Tone</h4><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">';
  for(var i=0;i<tones.length;i++){
    var t=tones[i],sel=selectedTone===t;
    h+='<button onclick="act(\'setTone\',\''+t+'\')" style="padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;background:'+(sel?"#4ECDC4":"var(--input-bg)")+';color:'+(sel?"#fff":"var(--text-muted)")+';border:2px solid '+(sel?"#4ECDC4":"var(--border)")+';transition:all .2s">'+toneLabels[t]+'</button>';
  }
  h+='</div></div>';
  return h;
}

function renderDrillHeader(drillTimer){
  var h='<h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">Switch Drill &#9889;</h2>';
  h+='<div style="display:flex;justify-content:center;gap:20px;align-items:center;margin-bottom:12px"><span id="drill-timer-ring">'+ringHTML((1-drillTimer/60)*100,70,6,"#FF6B6B",'<div style="font-size:18px;font-weight:900;color:var(--text-primary)">'+drillTimer+'s</div>',"Drill timer")+'</span>';
  h+='<div><div id="drill-switch-count" style="font-size:32px;font-weight:900;color:#4ECDC4">'+S.drillSwitches+'</div><div style="font-size:11px;color:var(--text-muted)">switches</div></div>';
  h+='<div style="text-align:center"><div id="drill-adaptive-bpm" style="font-size:18px;font-weight:900;color:#FFE66D">'+formatSessionBpm(S.drillAdaptiveBpm, "0")+'</div><div style="font-size:11px;color:var(--text-muted)">target BPM</div></div></div>';
  return h;
}

function renderDrillTransitionTip(currentChord, nextChord){
  var tip=getTransitionTip(currentChord.name,nextChord.name);
  if(!tip) return '';
  return '<div style="background:var(--input-bg);border-radius:14px;padding:10px 14px;margin-bottom:10px;max-width:320px;display:inline-block;text-align:left"><div style="font-size:11px;font-weight:700;color:#4ECDC4;margin-bottom:4px">&#128161; Transition Tip</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.5">'+tip+'</div></div>';
}

function renderQuizScoreHeader(quizScore, quizTotal, quizStreak){
  return '<div style="display:flex;justify-content:center;gap:16px;margin-bottom:12px"><div style="background:#4ECDC422;padding:6px 14px;border-radius:14px"><span style="font-weight:700;color:#4ECDC4">'+quizScore+'/'+quizTotal+'</span></div><div style="background:#FF6B6B22;padding:6px 14px;border-radius:14px">&#128293;<span style="font-weight:700;color:#FF6B6B">'+quizStreak+'</span></div></div>';
}

function renderQuizOptions(quizOptions, quizQuestion, quizAnswer, UI){
  var h='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
  for(var i=0;i<quizOptions.length;i++){
    var c=quizOptions[i],isA=quizAnswer!==null,isC=c.name===quizQuestion.name,isP=quizAnswer===c.name;
    h+='<div class="card"'+clickableDiv("act(\'answerQuiz\',\'"+c.name+"\')")+' style="cursor:'+(isA?"default":"pointer")+';padding:10px;border:3px solid '+(isA?(isC?"#4ECDC4":(isP?"#FF6B6B":"var(--border)")):"var(--border)")+';background:'+(isA&&isC?"#4ECDC411":isA&&isP&&!isC?"#FF6B6B11":"var(--card-bg)")+';transition:all .2s;transform:'+(isA&&isC?"scale(1.05)":"scale(1)")+'">'+UI.chord(c,100)+'</div>';
  }
  h+='</div>';
  return h;
}

function renderSongChordChips(chords){
  var h='<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">';
  var capoFret = getSessionCapoModeFret();
  var mapped = mapSessionCapoChords(chords, capoFret);
  for(var i=0;i<chords.length;i++){
    h+='<span style="background:var(--chip-bg);padding:4px 12px;border-radius:10px;font-size:13px;font-weight:700;color:var(--chip-color)">'+escHTML(mapped[i].label)+'</span>';
  }
  h+='</div>';
  return h;
}

function isPianoSessionInstrument(inst){
  var id = inst && (inst.instrument || inst.id || inst.appId || inst.instrumentId || "");
  id = String(id).toLowerCase();
  return id === "piano" || id === "pianospark";
}

function buildPianoSessionVoicings(chord){
  var defs = [
    ["rootPosition", "Root Position"],
    ["firstInversion", "1st Inversion"],
    ["secondInversion", "2nd Inversion"],
    ["thirdInversion", "3rd Inversion"]
  ];
  var voicings = [];
  var part;
  var v;
  if (!chord) return voicings;
  for (var i = 0; i < defs.length; i++) {
    part = chord[defs[i][0]];
    if (!part || !Array.isArray(part.midi)) continue;
    v = {};
    for (var key in chord) v[key] = chord[key];
    v.rootPosition = part;
    v.label = defs[i][1];
    voicings.push(v);
  }
  return voicings;
}

function getSessionChordVoicings(inst, D, chord){
  var source;
  if (isPianoSessionInstrument(inst)) return buildPianoSessionVoicings(chord);
  source = D && D.VOICINGS ? D.VOICINGS : (typeof VOICINGS !== "undefined" ? VOICINGS : null);
  return source && chord && Array.isArray(source[chord.name]) ? source[chord.name] : null;
}

function renderSongProgressionCard(progression, songPlaying, songBeat){
  var capoFret = getSessionCapoModeFret();
  var mapped = mapSessionCapoChords(progression, capoFret);
  var h='<div class="card mb16"><h4 style="margin:0 0 10px;font-size:14px;color:var(--text-primary)">Chord Progression</h4><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">';
  for(var i=0;i<progression.length;i++){
    var c=mapped[i],isA=songPlaying&&i===songBeat;
    h+='<div title="'+escHTML(c.label)+'" style="width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:'+(isA?"#FF6B6B":"var(--chip-bg)")+';color:'+(isA?"#fff":"var(--chip-color)")+';font-size:16px;font-weight:800;border:2px solid '+(isA?"#FF6B6B":"var(--border)")+';transition:all .15s;transform:'+(isA?"scale(1.15)":"scale(1)")+'">'+escHTML(c.display)+'</div>';
  }
  h+='</div></div>';
  return h;
}

function renderSongCurrentChordCard(songData, songBeat, D, UI){
  var ch=null;
  var currentName = songData.progression[songBeat];
  var capoChord = getSessionCapoDisplayChord(currentName);
  var displayName = capoChord.display;
  if(!currentName) return '';
  for(var i=0;i<D.ALL_CHORDS.length;i++) if(D.ALL_CHORDS[i].short===displayName||D.ALL_CHORDS[i].name===displayName||D.ALL_CHORDS[i].short===currentName||D.ALL_CHORDS[i].name===currentName) ch=D.ALL_CHORDS[i];
  if(!ch) return '';
  return '<div class="card mb16"><h4 style="margin:0 0 4px;font-size:14px;color:#FF6B6B">Now: '+escHTML(capoChord.label)+'</h4><div class="flex-center">'+UI.chord(ch,160)+'</div></div>';
}

function getSessionCapoModeFret(){
  if(typeof SparkCapoMode !== "undefined" && SparkCapoMode && typeof SparkCapoMode.normalizeCapoFret === "function") {
    return SparkCapoMode.normalizeCapoFret(S.capoModeFret);
  }
  return 0;
}

function getSessionCapoDisplayChord(chordName){
  if(typeof SparkCapoMode !== "undefined" && SparkCapoMode && typeof SparkCapoMode.getDisplayChord === "function") {
    return SparkCapoMode.getDisplayChord(chordName, getSessionCapoModeFret());
  }
  return { original: chordName, sounding: chordName, display: chordName, capoFret: 0, label: chordName };
}

function mapSessionCapoChords(chords, capoFret){
  if(typeof SparkCapoMode !== "undefined" && SparkCapoMode && typeof SparkCapoMode.mapProgression === "function") {
    return SparkCapoMode.mapProgression(chords, capoFret);
  }
  var mapped = [];
  chords = Array.isArray(chords) ? chords : [];
  for(var i=0;i<chords.length;i++) mapped.push({ original: chords[i], sounding: chords[i], display: chords[i], capoFret: 0, label: chords[i] });
  return mapped;
}

function renderCapoModeControl(capoFret){
  var h='<div class="card mb16" style="padding:12px"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">';
  h+='<div style="text-align:left"><div style="font-size:12px;font-weight:900;color:var(--text-primary)">Capo '+capoFret+'</div><div style="font-size:11px;color:var(--text-muted)">Shows playable shapes while keeping song chords sounding original.</div></div>';
  h+='<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">';
  for(var i=0;i<=5;i++){
    h+='<button onclick="act(\'setCapoMode\',\''+i+'\')" style="min-width:34px;padding:6px 8px;border-radius:9px;font-size:12px;font-weight:800;background:'+(capoFret===i?"#4ECDC4":"var(--input-bg)")+';color:'+(capoFret===i?"#fff":"var(--text-muted)")+';border:1px solid '+(capoFret===i?"#4ECDC4":"var(--border)")+'">'+i+'</button>';
  }
  h+='</div></div></div>';
  return h;
}

function renderSongPlaybackButtons(songPlaying){
  var h='<div style="display:flex;gap:10px;justify-content:center"><button class="btn" onclick="act(\'toggleSong\')" style="background:'+(songPlaying?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(songPlaying?"var(--text-primary)":"#fff")+'">'+(songPlaying?"&#9208; Pause":"&#9654; Play Along")+'</button>';
  if(songPlaying)h+='<button class="btn" onclick="act(\'completeSong\')" style="background:#4ECDC4;color:#fff">&#10003; Done</button>';
  h+='</div>';
  return h;
}

function renderDailyChallengeHeader(dc){
  return '<button class="back-btn" onclick="act(\'back\')">&#8592; Back</button><div style="font-size:48px;margin-bottom:8px">'+dc.icon+'</div><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">'+dc.title+'</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">'+dc.desc+'</p>';
}

function renderDailyChallengeTimer(timer, maxTimer){
  return '<div class="flex-center"><span id="daily-timer-ring">'+ringHTML((1-timer/maxTimer)*100,100,7,"#FF6B6B",'<div style="font-size:28px;font-weight:900;color:var(--text-primary)">'+timer+'s</div>',"Daily challenge timer")+'</span></div><div style="margin-top:16px"><button class="btn" onclick="act(\'completeDaily\')" style="background:#FF6B6B;color:#fff">&#10003; Complete</button></div>';
}

function renderDailyChallengeComplete(dc){
  return '<div style="font-size:56px;animation:bn .6s ease">&#127941;</div><h3 style="color:#4ECDC4;font-size:20px;font-weight:800;margin:12px 0">Challenge Complete!</h3><div class="card" style="margin:16px 0"><div style="font-size:28px;font-weight:900;color:#FFE66D">+'+dc.xp+' XP</div></div><button class="btn" onclick="act(\'dailyDoneHome\')" style="background:#4ECDC4;color:#fff">&#127968; Home</button>';
}

// ===== SESSION PAGES =====
function sessionPage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var runtime = getLegacySessionRuntime(D);
  var shell = getSessionPageActiveShellSummary();
  var c = runtime.chord;
  if(!c)return renderSessionShellCard(shell || getSessionPageFallbackShell());
  // Check if voicings are available
  var voicings=getSessionChordVoicings(inst, D, c);
  var displayChord=c;
  if(voicings&&S.selectedVoicing>0&&S.selectedVoicing<voicings.length){
    displayChord=voicings[S.selectedVoicing];
  }
  var timer = runtime.timer;
  var m=Math.floor(timer/60),s=timer%60;
  var h='<div class="text-center legacy-session-live"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button><h2 style="font-size:26px;font-weight:900;color:var(--text-primary);margin:8px 0">'+c.name+'</h2>';

  // Voicing selector
  if(voicings&&voicings.length>1){
    h+=renderSessionVoicingTabs(voicings);
  }

  if(shell) h+=renderSessionShellCard(shell);
  h+='<div class="flex-center mb12">'+ringHTML((1-timer/120)*100,90,7,"#FF6B6B",'<div style="font-size:22px;font-weight:900;color:var(--text-primary)">'+m+':'+(s<10?'0':'')+s+'</div>',"Session timer")+'</div>';
  var chordKey=c.name+"_v"+S.selectedVoicing;
  var chordChanged=_prevChordKey!==chordKey;
  var morphClass=(chordChanged&&_prevChordKey)?" chord-morph":"";
  // Only animate on first appearance or chord/voicing change, not every timer tick
  var shouldAnimate=chordChanged;
  h+='<div class="card'+morphClass+'" style="display:inline-block;margin-bottom:12px">'+UI.chord(displayChord,220,c.name,shouldAnimate)+'</div>';
  _prevChordKey=chordKey;
  h+='<button onclick="act(\'previewChord\',\''+c.name+'\')" style="background:none;font-size:14px;color:var(--text-muted);margin-bottom:8px" aria-label="Preview chord sound">&#128264; Listen to this chord</button>';
  h+=renderSessionMetronomeCard(getSessionMetronomeRuntime());
  h+=renderSessionChordCheckCard(c.name);
  h+=renderSessionTipsCard(inst);
  var practiceIntention = _firstSessionSongTextToken(S.practiceIntention);
  h+=renderPracticeIntentionCard(practiceIntention, inst);
  h+=renderSessionActionButtons(runtime);
  h+='</div>';
  return h;
}

function completePage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var runtime = getLegacySessionRuntime(D);
  var n=runtime.chord?runtime.chord.name:"";
  var p=getSessionChordProgressValue(n);
  var xpAmount = normalizeSessionNumber(S.xpToast && S.xpToast.amount, 10);
  var streak = normalizeSessionNumber(S.streak, 0);
  return '<div class="text-center" style="padding-top:30px"><div style="font-size:56px;margin-bottom:12px;animation:bn .6s ease">&#127881;</div><h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Awesome!</h2><p style="color:var(--text-dim);font-size:15px;margin-bottom:20px">You practiced <strong>'+n+'</strong></p><div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:28px;font-weight:900;color:#FFE66D">+'+xpAmount+'</div><div style="font-size:11px;color:var(--text-muted)">XP</div></div><div><div style="font-size:28px;font-weight:900;color:#FF6B6B">&#128293;'+streak+'</div><div style="font-size:11px;color:var(--text-muted)">Streak</div></div><div><div style="font-size:28px;font-weight:900;color:#4ECDC4">'+p+'%</div><div style="font-size:11px;color:var(--text-muted)">Mastery</div></div></div></div><div class="flex-col"><button class="btn" onclick="act(\'repeatLegacyPracticeSession\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128257; One More</button><button class="btn" onclick="act(\'completeSessionHome\')" style="background:#4ECDC4;color:#fff">&#127968; Home</button></div></div>';
}

function drillPage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var runtime = getLegacyDrillRuntime(D);
  var shell = getSessionPageActiveShellSummary();
  if(runtime.chords.length<2)return '';
  var drillIdx = typeof S.drillIdx === "number" ? S.drillIdx : 0;
  var c=runtime.chords[drillIdx],nx=runtime.chords[(drillIdx+1)%2];
  var drillTimer = runtime.timer;
  var drillChanged=_prevChordKey!==c.name;
  var morphClass=(drillChanged&&_prevChordKey)?" chord-morph":"";
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button>';
  if(shell) h+=renderSessionShellCard(shell);
  h+=renderDrillHeader(drillTimer);
  h+='<div class="card live-timer-surface'+morphClass+'" style="display:inline-block;margin-bottom:12px;border:3px solid '+D.LC[S.level]+'">';
  h+='<h3 style="margin:0 0 4px;font-size:16px;color:'+D.LC[S.level]+'">'+c.name+tierBadgeHTML(c.name,14)+'</h3>'+UI.chord(c,180,null,drillChanged)+'</div>';
  _prevChordKey=c.name;
  h+=renderDrillTransitionTip(c, nx);
  h+='<div style="color:var(--text-muted);font-size:12px;margin-bottom:10px">Next: <strong>'+nx.name+tierBadgeHTML(nx.name,12)+'</strong></div>';
  h+='<button class="btn" onclick="act(\'drillSwitch\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary);font-size:18px;padding:16px 44px">&#128260; Switched!</button></div>';
  return h;
}

function drillDonePage(){
  return '<div class="text-center" style="padding-top:30px"><div style="font-size:56px;animation:bn .6s ease">&#9889;</div><h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Drill Complete!</h2><p style="color:var(--text-dim);margin-bottom:20px"><strong>'+S.drillSwitches+'</strong> switches in 60s</p><div class="result-actions"><button class="btn" onclick="act(\'repeatLegacyPracticeDrill\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#9889; Again</button><button class="btn" onclick="act(\'drillDoneHome\')" style="background:#4ECDC4;color:#fff">&#127968; Home</button></div></div>';
}

function dailyPage(){
  var dc=S.dailyChallenge;if(!dc)return '';
  var runtime = getLegacyDailyRuntime();
  var shell = getSessionPageActiveShellSummary();
  var mx=dc.id==="hold"?30:dc.id==="marathon"?180:60;
  var h='<div class="text-center">';
  if(shell) h+=renderSessionShellCard(shell);
  h+=renderDailyChallengeHeader(dc);
  if(!runtime.complete) h+=renderDailyChallengeTimer(runtime.timer, mx);
  else h+=renderDailyChallengeComplete(dc);
  return h+'</div>';
}

function quizPage(){
  var inst = getSessionPageInstrument();
  var UI = inst && inst.ui ? inst.ui : {};
  var view = getSessionCoreView();
  var runtime = view && view.runtimeState ? view.runtimeState : null;
  var hasCoreQuiz = !!(runtime && (
    runtime.legacyQuizQuestion != null ||
    runtime.legacyQuizAnswer != null ||
    runtime.legacyQuizScore != null ||
    runtime.legacyQuizTotal != null ||
    runtime.legacyQuizStreak != null
  ));
  var quizQuestion = hasCoreQuiz && runtime.legacyQuizQuestion ? runtime.legacyQuizQuestion : (S.quizQ || null);
  var quizOptions = hasCoreQuiz && Array.isArray(runtime.legacyQuizOptions) && runtime.legacyQuizOptions.length ? runtime.legacyQuizOptions : (Array.isArray(S.quizOpts) && S.quizOpts.length ? S.quizOpts : []);
  var quizAnswer = hasCoreQuiz && typeof runtime.legacyQuizAnswer === "string" ? runtime.legacyQuizAnswer : (typeof S.quizAns === "string" ? S.quizAns : null);
  var quizScore = normalizeSessionNumber(hasCoreQuiz ? runtime.legacyQuizScore : null, normalizeSessionNumber(S.quizScore, 0));
  var quizTotal = normalizeSessionNumber(hasCoreQuiz ? runtime.legacyQuizTotal : null, normalizeSessionNumber(S.quizTotal, 0));
  var quizStreak = normalizeSessionNumber(hasCoreQuiz ? runtime.legacyQuizStreak : null, normalizeSessionNumber(S.quizStreak, 0));
  if(!quizQuestion)return '';
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'tab\',\'quiz\')">&#8592; Back</button>';
  h+=renderQuizScoreHeader(quizScore, quizTotal, quizStreak);
  h+='<h2 style="font-size:28px;font-weight:900;color:var(--text-primary);margin:8px 0 4px">Which is...</h2><div style="font-size:36px;font-weight:900;color:#FF6B6B;margin-bottom:16px">'+quizQuestion.name+'?</div>';
  h+=renderQuizOptions(quizOptions, quizQuestion, quizAnswer, UI);
  if(quizAnswer){
    var ok=quizAnswer===quizQuestion.name;
    h+='<div style="margin-top:16px;font-size:20px;font-weight:800;color:'+(ok?"#4ECDC4":"#FF6B6B")+';animation:bn .4s ease">'+(ok?"&#9989; Correct! +10 XP":"&#10060; Not quite!")+'</div>';
  }
  return h+'</div>';
}

function strumDetailPage(){
  var view = getSessionCoreView();
  var runtime = view && view.runtimeState ? view.runtimeState : null;
  var hasCoreStrum = !!(runtime && (
    runtime.legacyStrumPattern ||
    runtime.legacyStrumActive != null ||
    runtime.legacyStrumBeat != null
  ));
  var sp = hasCoreStrum && runtime.legacyStrumPattern ? runtime.legacyStrumPattern : (S.selectedStrum || null); if(!sp)return '';
  var strumActive = hasCoreStrum && typeof runtime.legacyStrumActive === "boolean" ? runtime.legacyStrumActive : (typeof S.strumActive === "boolean" ? S.strumActive : false);
  var curBeat = strumActive
    ? (hasCoreStrum && typeof runtime.legacyStrumBeat === "number" ? runtime.legacyStrumBeat : (typeof S._strumBeat === "number" ? S._strumBeat : -1))
    : -1;
  var curDir=curBeat>=0?sp.pattern[curBeat]:"x";
  var strumBpm = formatSessionBpm(sp.bpm, "--");
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'back\')">&#8592; Back</button>';
  h+='<h2 style="font-size:24px;font-weight:900;color:var(--text-primary);margin:8px 0">'+sp.name+'</h2>';
  h+='<p style="color:var(--text-dim);font-size:13px;margin-bottom:8px">'+sp.desc+'</p>';
  h+='<div style="display:inline-block;background:#FFF3E0;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;color:#E65100;margin-bottom:20px">'+strumBpm+' BPM</div>';
  // Strum hand animation
  h+='<div class="flex-center mb12">'+strumHandSVG(curDir,strumActive)+'</div>';
  h+='<div class="card mb20'+(strumActive?' live-timer-surface':'')+'" style="padding:24px"><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">'+strumHTML(sp.pattern,curBeat)+'</div></div>';
  h+=renderStrumTonePicker(S.strumTone);
  h+='<button class="btn" onclick="act(\'toggleStrum\')" style="background:'+(strumActive?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(strumActive?"var(--text-primary)":"#fff")+'">'+(strumActive?"&#9208; Stop":"&#9654; Play Pattern")+'</button></div>';
  return h;
}

function songDetailPage(){
  var inst = getSessionPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var coreView = getSessionCoreView();
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
  var capoFret = getSessionCapoModeFret();
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'songBack\')">&#8592; Back</button><h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">'+escHTML(songTitle)+'</h2><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">'+escHTML(songArtist)+' &#8226; '+songBpm+' BPM</p>';
  h+=renderCapoModeControl(capoFret);
  h+=renderSongChordChips(sg.chords);
  h+=renderSongProgressionCard(sg.progression, songPlaying, songBeat);
  if(songPlaying) h+=renderSongCurrentChordCard(sg, songBeat, D, UI);
  // Strum hand + pattern
  h+='<div class="card mb16'+(songPlaying?' live-timer-surface':'')+'" style="padding:16px"><h4 style="margin:0 0 8px;font-size:14px;color:var(--text-primary)">Strum Pattern</h4>';
  h+='<div class="flex-center mb12">'+strumHandSVG(curDir,songPlaying)+'</div>';
  h+='<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">'+strumHTML(sg.pattern,patBeat)+'</div></div>';
  h+=renderStrumTonePicker(S.strumTone);
  h+=renderSongPlaybackButtons(songPlaying);
  return h+'</div>';
}

function songDonePage(){
  var coreView = getSessionCoreView();
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
