// ===== ChordSpark: Game tabs =====

function getGamesPageInstrument(){
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

function _normalizeGamesTextToken(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function _firstGamesTextToken(){
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = _normalizeGamesTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function _normalizeGamesBpm(value, fallback) {
  var numeric = Number(value);
  if (!isFinite(numeric)) return fallback;
  numeric = Math.round(numeric);
  if (numeric <= 0) return fallback;
  return numeric;
}

function _normalizeGamesCount(value, fallback) {
  var numeric = Number(value);
  if (!isFinite(numeric)) return fallback;
  return Math.round(numeric);
}

function getGamesCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function getGamesScaleRenderer() {
  var inst = getGamesPageInstrument();
  return inst && typeof inst.getScaleRenderer === "function" ? inst.getScaleRenderer() : null;
}

// ===== RHYTHM GAME TAB =====
function getLegacyRhythmRuntime(){
  var runtime = getGamesCoreView();
  runtime = runtime && runtime.runtimeState ? runtime.runtimeState : null;
  return {
    active: typeof S.rhythmActive === "boolean" ? S.rhythmActive : !!(runtime && runtime.legacyRhythmActive),
    beats: Array.isArray(S.rhythmBeats) ? S.rhythmBeats : (runtime && Array.isArray(runtime.legacyRhythmBeats) ? runtime.legacyRhythmBeats : []),
    score: _normalizeGamesCount(S.rhythmScore, _normalizeGamesCount(runtime && runtime.legacyRhythmScore, 0)),
    combo: _normalizeGamesCount(S.rhythmCombo, _normalizeGamesCount(runtime && runtime.legacyRhythmCombo, 0)),
    maxCombo: _normalizeGamesCount(S.rhythmMaxCombo, _normalizeGamesCount(runtime && runtime.legacyRhythmMaxCombo, 0)),
    startTimeMs: _normalizeGamesCount(S.rhythmStartTime, _normalizeGamesCount(runtime && runtime.legacyRhythmStartTimeMs, 0)),
    results: S.rhythmResults || (runtime ? runtime.legacyRhythmResults : null)
  };
}

function rhythmTab(){
  var runtime = getLegacyRhythmRuntime();
  var rhythmBpm = _normalizeGamesBpm(S.rhythmBpm, 90);
  if(runtime.results)return rhythmResultsPage();
  if(runtime.active)return rhythmGamePage();
  var h='<div class="text-center"><h2 class="card-section-heading">Rhythm Game &#129345;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Tap in time with the beat!</p>';
  h+='<div class="card"><div style="font-size:48px;margin-bottom:12px">&#127928;</div>';
  h+='<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px"><button onclick="act(\'rhythmBpm\',\''+(rhythmBpm-10)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)">-</button>';
  h+='<div style="text-align:center;min-width:60px"><div style="font-size:24px;font-weight:900;color:var(--text-primary)">'+rhythmBpm+'</div><div style="font-size:10px;color:var(--text-muted)">BPM</div></div>';
  h+='<button onclick="act(\'rhythmBpm\',\''+(rhythmBpm+10)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)">+</button></div>';
  h+='<button class="btn" onclick="act(\'startRhythm\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#9654; Start!</button>';
  h+='</div></div>';
  return h;
}

function rhythmGamePage(){
  var runtime = getLegacyRhythmRuntime();
  var elapsed=performance.now()-runtime.startTimeMs;
  var h='<div class="text-center"><h2 style="font-size:18px;font-weight:900;color:var(--text-primary);margin:0 0 8px">&#129345; Tap on the beat!</h2>';
  h+='<div style="display:flex;justify-content:center;gap:20px;margin-bottom:12px">';
  h+='<div><div style="font-size:24px;font-weight:900;color:#FFE66D">'+runtime.score+'</div><div style="font-size:10px;color:var(--text-muted)">Score</div></div>';
  h+='<div><div style="font-size:24px;font-weight:900;color:#FF6B6B">'+runtime.combo+'x</div><div style="font-size:10px;color:var(--text-muted)">Combo</div></div></div>';

  // Lane visualization
  h+='<div class="rhythm-lane"><div class="rhythm-hit-zone"></div>';
  var laneW=400;
  for(var i=0;i<runtime.beats.length;i++){
    var b=runtime.beats[i];
    if(b.hit)continue; // Already hit
    var timeUntil=b.time-elapsed;
    var pct=40+(timeUntil/3000)*360; // 40px = hit zone, scrolls from right
    if(pct<-40||pct>laneW)continue;
    h+='<div class="rhythm-beat '+(b.type==="D"?"down":"up")+'" style="left:'+pct+'px">'+(b.type==="D"?"\u2193":"\u2191")+'</div>';
  }
  h+='</div>';

  h+='<button class="btn" onclick="act(\'rhythmTap\')" style="width:100%;padding:24px;font-size:20px;font-weight:900;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;margin-top:8px">&#128308; TAP!</button>';
  h+='</div>';
  return h;
}

function rhythmResultsPage(){
  var runtime = getLegacyRhythmRuntime();
  var r=runtime.results || {};
  var rhythmScore = _normalizeGamesCount(r.score, 0);
  var rhythmAccuracy = _normalizeGamesCount(r.accuracy, 0);
  var rhythmMaxCombo = _normalizeGamesCount(r.maxCombo, 0);
  var h='<div class="text-center" style="padding-top:20px"><div style="font-size:56px;animation:bn .6s ease">&#129345;</div>';
  h+='<h2 class="card-section-heading">Results!</h2>';
  h+='<div class="card mb16" style="margin-top:12px"><div style="display:flex;justify-content:space-around;text-align:center">';
  h+='<div><div style="font-size:32px;font-weight:900;color:#FFE66D">'+rhythmScore+'</div><div style="font-size:11px;color:var(--text-muted)">Score</div></div>';
  h+='<div><div style="font-size:32px;font-weight:900;color:#4ECDC4">'+rhythmAccuracy+'%</div><div style="font-size:11px;color:var(--text-muted)">Accuracy</div></div>';
  h+='<div><div style="font-size:32px;font-weight:900;color:#FF6B6B">'+rhythmMaxCombo+'x</div><div style="font-size:11px;color:var(--text-muted)">Max Combo</div></div>';
  h+='</div></div>';
  h+='<div class="action-row" style="justify-content:center"><button class="btn" onclick="act(\'rhythmResultsReplay\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Play Again</button>';
  h+='<button class="btn" onclick="act(\'rhythmResultsBack\')" style="background:#4ECDC4;color:#fff">&#127968; Back</button></div>';
  h+='</div>';
  return h;
}

// ===== CHORD RUNNER TAB =====
function getLegacyRunnerRuntime(D){
  var runtime = getGamesCoreView();
  runtime = runtime && runtime.runtimeState ? runtime.runtimeState : null;
  var target = S.runnerTarget || null;
  if(!target && runtime && runtime.legacyRunnerTargetName && D && Array.isArray(D.ALL_CHORDS)){
    for(var i=0;i<D.ALL_CHORDS.length;i++){
      if(D.ALL_CHORDS[i] && D.ALL_CHORDS[i].name === runtime.legacyRunnerTargetName){
        target = D.ALL_CHORDS[i];
        break;
      }
    }
  }
  return {
    active: typeof S.runnerActive === "boolean" ? S.runnerActive : !!(runtime && runtime.legacyRunnerActive),
    score: _normalizeGamesCount(S.runnerScore, _normalizeGamesCount(runtime && runtime.legacyRunnerScore, 0)),
    combo: _normalizeGamesCount(S.runnerCombo, _normalizeGamesCount(runtime && runtime.legacyRunnerCombo, 0)),
    maxCombo: _normalizeGamesCount(S.runnerMaxCombo, _normalizeGamesCount(runtime && runtime.legacyRunnerMaxCombo, 0)),
    lives: _normalizeGamesCount(S.runnerLives, _normalizeGamesCount(runtime && runtime.legacyRunnerLives, 0)),
    distance: _normalizeGamesCount(S.runnerDistance, _normalizeGamesCount(runtime && runtime.legacyRunnerDistance, 0)),
    target: target,
    obstacles: Array.isArray(S.runnerObstacles) ? S.runnerObstacles : (runtime && Array.isArray(runtime.legacyRunnerObstacles) ? runtime.legacyRunnerObstacles : []),
    results: S.runnerResults || (runtime ? runtime.legacyRunnerResults : null)
  };
}

function runnerTab(){
  var inst = getGamesPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var runtime = getLegacyRunnerRuntime(D);
  if(runtime.results)return runnerResultsPage();
  if(runtime.active)return runnerGamePage();
  var h='<div class="text-center"><h2 class="card-section-heading">Chord Runner &#127918;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Strum the right chords as they scroll by!</p>';
  h+='<div class="card"><div style="font-size:48px;margin-bottom:12px">&#127928;</div>';
  h+='<div style="margin-bottom:16px;font-size:13px;color:var(--text-secondary);line-height:1.5">Chord names scroll across the screen.<br><strong>Strum</strong> when the <strong>target chord</strong> reaches you.<br>Let wrong chords pass! 3 lives.</div>';
  if(_normalizeGamesCount(S.runnerHighScore, 0)>0)h+='<div style="margin-bottom:12px;font-size:15px;font-weight:800;color:#FFE66D">&#127942; High Score: '+_normalizeGamesCount(S.runnerHighScore, 0)+'</div>';
  h+='<button class="btn" onclick="act(\'startRunner\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-size:18px;padding:16px 40px">&#9654; Start!</button>';
  h+='</div></div>';
  return h;
}

function runnerGamePage(){
  var inst = getGamesPageInstrument();
  var UI = inst && inst.ui ? inst.ui : {};
  var D = inst && inst.getData ? inst.getData() : {};
  var runtime = getLegacyRunnerRuntime(D);
  var h='<div>';
  // Lives, Score, Combo row
  h+='<div class="split-row" style="margin-bottom:8px;padding:0 4px">';
  h+='<div style="font-size:18px;letter-spacing:2px">';
  for(var i=0;i<3;i++)h+=(i<runtime.lives?'&#10084;&#65039;':'&#128420;');
  h+='</div>';
  h+='<div style="font-size:22px;font-weight:900;color:#FFE66D">'+runtime.score+'</div>';
  h+='<div style="font-size:16px;font-weight:800;color:'+(runtime.combo>=3?'#4ECDC4':'var(--text-muted)')+'">'+runtime.combo+'x</div>';
  h+='</div>';

  // Target chord card
  h+='<div class="card live-timer-surface mb12" style="padding:10px 16px;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(78,205,196,.12),rgba(69,183,209,.12));border:2px solid rgba(78,205,196,.3)">';
  if(runtime.target){
    var targetShort = _firstGamesTextToken(runtime.target.short, runtime.target.name, "?");
    var targetName = _firstGamesTextToken(runtime.target.name, runtime.target.short, "Target chord");
    h+=UI.chord(runtime.target,55);
    h+='<div style="flex:1"><div class="metric-label">Target Chord</div>';
    h+='<div style="font-size:22px;font-weight:900;color:var(--text-primary)">'+escHTML(targetShort)+'</div>';
    h+='<div style="font-size:11px;color:var(--text-muted)">'+escHTML(targetName)+'</div></div>';
  }
  h+='</div>';

  // Scrolling lane
  h+='<div class="runner-lane">';
  h+='<div class="runner-ground"></div>';
  h+='<div class="runner-hit-zone"></div>';
  h+='<div class="runner-player" id="runner-player">&#127928;</div>';
  for(var i=0;i<runtime.obstacles.length;i++){
    var o=runtime.obstacles[i];
    if(o.x<-80||o.x>500)continue;
    var cls="runner-obstacle";
    var obstacleShort = _firstGamesTextToken(o.short, o.name, "?");
    if(o.result==="correct")cls+=" correct";
    else if(o.result==="wrong")cls+=" wrong";
    else if(o.result==="missed")cls+=" missed";
    else cls+=" normal";
    h+='<div class="'+cls+'" style="left:'+Math.round(o.x)+'px">'+escHTML(obstacleShort)+'</div>';
  }
  // Scrolling ground dashes
  var offset=Math.round(runtime.distance%30);
  for(var i=-1;i<18;i++){
    var gx=i*30-offset;
    h+='<div style="position:absolute;bottom:10px;left:'+gx+'px;width:16px;height:2px;background:var(--text-muted);opacity:0.25;border-radius:1px"></div>';
  }
  h+='</div>';

  // Strum button
  h+='<button class="btn" onclick="act(\'runnerStrum\')" style="width:100%;padding:22px;font-size:20px;font-weight:900;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;border-radius:16px;margin-top:4px;user-select:none;-webkit-user-select:none">&#127928; STRUM!</button>';
  h+='<div style="text-align:center;margin-top:6px;font-size:11px;color:var(--text-muted)">Press <strong>Space</strong> or tap to strum</div>';
  h+='</div>';
  return h;
}

function runnerResultsPage(){
  var inst = getGamesPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var runtime = getLegacyRunnerRuntime(D);
  var r=runtime.results || {};
  var runnerScore = _normalizeGamesCount(r.score, 0);
  var runnerMaxCombo = _normalizeGamesCount(r.maxCombo, 0);
  var runnerDistance = _normalizeGamesCount(r.distance, 0);
  var runnerHighScore = _normalizeGamesCount(S.runnerHighScore, 0);
  var isHigh=runnerScore>=runnerHighScore&&runnerScore>0;
  var h='<div class="text-center" style="padding-top:20px"><div style="font-size:56px;animation:bn .6s ease">&#127918;</div>';
  h+='<h2 class="card-section-heading">Game Over!</h2>';
  if(isHigh)h+='<div style="font-size:16px;font-weight:800;color:#FFE66D;margin:8px 0;animation:bn .8s ease">&#127942; New High Score!</div>';
  h+='<div class="card mb16" style="margin-top:12px"><div style="display:flex;justify-content:space-around;text-align:center">';
  h+='<div><div style="font-size:32px;font-weight:900;color:#FFE66D">'+runnerScore+'</div><div style="font-size:11px;color:var(--text-muted)">Score</div></div>';
  h+='<div><div style="font-size:32px;font-weight:900;color:#4ECDC4">'+runnerMaxCombo+'x</div><div style="font-size:11px;color:var(--text-muted)">Max Combo</div></div>';
  h+='<div><div style="font-size:32px;font-weight:900;color:#FF6B6B">'+runnerDistance+'m</div><div style="font-size:11px;color:var(--text-muted)">Distance</div></div>';
  h+='</div></div>';
  h+='<div class="action-row" style="justify-content:center"><button class="btn" onclick="act(\'runnerResultsReplay\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Play Again</button>';
  h+='<button class="btn" onclick="act(\'runnerResultsBack\')" style="background:#4ECDC4;color:#fff">&#127968; Back</button></div>';
  h+='</div>';
  return h;
}

// ===== BUILD (PROGRESSION BUILDER) TAB =====
function buildTab(){
  var inst = getGamesPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var progBpm = _normalizeGamesBpm(S.progBpm, 80);
  var h='<div class="text-center mb16"><h2 class="card-section-heading">Progression Builder &#128295;</h2><p style="color:var(--text-dim);font-size:13px">Build and play chord progressions</p></div>';

  // Progression display
  h+='<div class="prog-blocks mb12">';
  if(S.progChords.length===0){
    h+='<div style="color:var(--text-muted);font-size:13px;padding:12px">Add chords to build a progression...</div>';
  } else {
    for(var i=0;i<S.progChords.length;i++){
      var cn=S.progChords[i];
      var ch=null;for(var j=0;j<D.ALL_CHORDS.length;j++)if(D.ALL_CHORDS[j].name===cn)ch=D.ALL_CHORDS[j];
      var short=ch?ch.short:cn;
      h+='<div class="prog-block'+(S.progPlaying&&S.progBeat===i?" active":"")+'"><button class="del-btn" onclick="act(\'progRemove\',\''+i+'\')" aria-label="Remove chord '+escHTML(String(short))+'">&times;</button>';
      h+='<div class="chord-label">'+short+'</div>';
      h+='<div class="move-btns">';
      if(i>0)h+='<button onclick="act(\'progMove\',\''+i+':left\')">&#8592;</button>';
      if(i<S.progChords.length-1)h+='<button onclick="act(\'progMove\',\''+i+':right\')">&#8594;</button>';
      h+='</div></div>';
    }
  }
  h+='<div style="min-width:48px;display:flex;align-items:center;justify-content:center"><button onclick="act(\'progPickerToggle\')" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff;font-size:24px;font-weight:700">+</button></div>';
  h+='</div>';

  // Chord picker
  if(S.progPickerOpen){
    h+='<div class="card mb12"><h4 class="card-micro-heading">Add Chord</h4><div class="chord-picker">';
    for(var l=1;l<=S.level;l++){
      var cs=D.CHORDS[l]||[];
      for(var i=0;i<cs.length;i++){
        h+='<button class="chord-pick-btn" onclick="act(\'progAdd\',\''+cs[i].name+'\')">'+cs[i].short+'</button>';
      }
    }
    h+='</div></div>';
  }

  // Templates
  h+='<div class="card mb12"><h4 class="card-micro-heading">&#127932; Templates</h4><div style="display:flex;flex-wrap:wrap;gap:6px">';
  for(var i=0;i<COMMON_PROGRESSIONS.length;i++){
    var cp=COMMON_PROGRESSIONS[i];
    h+='<button class="chord-pick-btn" onclick="act(\'progTemplate\',\''+i+'\')">'+cp.name+' ('+cp.key+')</button>';
  }
  h+='</div></div>';

  // Scale Explorer
  if(S.progChords.length>0){
    // Detect key from first chord
    var firstChord=S.progChords[0];
    var scaleKey=null;
    for(var i=0;i<D.ALL_CHORDS.length;i++){
      if(D.ALL_CHORDS[i].name===firstChord||D.ALL_CHORDS[i].short===firstChord){
        var nm=D.ALL_CHORDS[i].name.replace(/ (Major|Minor)$/,"");
        if(nm.length<=2)scaleKey=nm;
        else scaleKey=nm.charAt(0);
        break;
      }
    }
    if(scaleKey&&SCALES[scaleKey]){
      h+='<div class="card mb12"><h4 class="card-micro-heading">&#127926; Scale Explorer <span class="metric-label">(Key of '+scaleKey+')</span></h4>';
      h+='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">';
      var scaleTypes=["pentatonic","major","minor","minorPent","blues"];
      for(var i=0;i<scaleTypes.length;i++){
        var st=scaleTypes[i],sel=S.selectedScale===st;
        h+='<button onclick="act(\'selectScale\',\''+st+'\')" style="padding:6px 12px;border-radius:10px;font-size:11px;font-weight:700;background:'+(sel?"#4ECDC4":"var(--input-bg)")+';color:'+(sel?"#fff":"var(--text-muted)")+';border:2px solid '+(sel?"#4ECDC4":"var(--border)")+';transition:all .2s">'+SCALE_NAMES[st]+'</button>';
      }
      h+='</div>';
      var positions=getScaleFrets(scaleKey,S.selectedScale);
      var renderScale = getGamesScaleRenderer();
      h+='<div class="flex-center">'+(renderScale ? renderScale(positions,scaleKey,SCALE_NAMES[S.selectedScale]) : "")+'</div>';
      h+='</div>';
    }
  }

  // Current chord diagram when playing
  if(S.progPlaying&&S.progChords.length>0){
    var cn=S.progChords[S.progBeat];
    var ch=null;for(var i=0;i<D.ALL_CHORDS.length;i++)if(D.ALL_CHORDS[i].name===cn)ch=D.ALL_CHORDS[i];
    if(ch){
      h+='<div class="card live-timer-surface mb12 text-center"><h4 class="card-micro-heading" style="color:#FF6B6B">Now: '+ch.name+'</h4><div class="flex-center">'+UI.chord(ch,160)+'</div></div>';
    }
  }

  // Controls
  h+='<div class="card"><div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px">';
  h+='<button onclick="act(\'progBpm\',\''+(progBpm-5)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)">-</button>';
  h+='<div style="text-align:center;min-width:60px"><div style="font-size:20px;font-weight:900;color:var(--text-primary)">'+progBpm+'</div><div style="font-size:10px;color:var(--text-muted)">BPM</div></div>';
  h+='<button onclick="act(\'progBpm\',\''+(progBpm+5)+'\')" style="width:32px;height:32px;border-radius:50%;background:var(--input-bg);font-size:18px;font-weight:700;color:var(--text-secondary)">+</button></div>';
  var canPlay=S.progChords.length>=2;
  h+='<div class="action-row" style="justify-content:center">';
  h+='<button class="btn" onclick="act(\'progPlay\')" style="background:'+(S.progPlaying?"#FFE66D":"linear-gradient(135deg,#FF6B6B,#FF8A5C)")+';color:'+(S.progPlaying?"var(--text-primary)":"#fff")+';opacity:'+(canPlay?1:0.5)+'">'+(S.progPlaying?"&#9632; Stop":"&#9654; Play")+'</button>';
  if(S.progChords.length>0)h+='<button class="btn" onclick="act(\'progClear\')" style="background:var(--input-bg);color:var(--text-muted)">Clear</button>';
  h+='</div></div>';
  return h;
}

(function(root){
  if(!root)return;
  root.SparkSharedGameRenderers = {
    rhythmTab: rhythmTab,
    runnerTab: runnerTab,
    buildTab: buildTab
  };
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : null));
