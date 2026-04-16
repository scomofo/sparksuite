// ===== ChordSpark: Home page and practice-related tabs =====

function practiceStateRead(path, fallback) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(path, fallback);
  }
  if (!cursor) return fallback;
  for (i = 0; i < parts.length; i++) {
    if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function practiceStateWrite(path, value) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
    return SparkState.write(path, value);
  }
  if (!cursor || !parts.length) return value;
  for (i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  return value;
}

function getPracticeRuntimeState() {
  var view = getSparkCoreLegacySnapshotBundle();
  return view && view.runtimeState ? view.runtimeState : null;
}

function getPracticeHomeSnapshot() {
  return {
    tab: practiceStateRead("tab", "practice"),
    lastBrainAnalysis: practiceStateRead("lastBrainAnalysis", null),
    personalInsights: practiceStateRead("personalInsights", null),
    recommendedFocus: practiceStateRead("recommendedFocus", null),
    guidedSession: practiceStateRead("guidedSession", 1),
    completedGuidedSessions: Array.isArray(practiceStateRead("completedGuidedSessions", [])) ? practiceStateRead("completedGuidedSessions", []) : [],
    lastChordName: practiceStateRead("lastChordName", ""),
    selectedLevel: practiceStateRead("selectedLevel", 1),
    sessions: practiceStateRead("sessions", 0),
    earnedBadges: Array.isArray(practiceStateRead("earnedBadges", [])) ? practiceStateRead("earnedBadges", []) : [],
    importMsg: practiceStateRead("importMsg", null),
    drillCount: practiceStateRead("drillCount", 0),
    practicePlan: practiceStateRead("practicePlan", null)
  };
}

function getPracticeGoalSnapshot() {
  return {
    todayPracticeSeconds: practiceStateRead("todayPracticeSeconds", 0),
    dailyGoalMinutes: practiceStateRead("dailyGoalMinutes", 15),
    goalReachedToday: !!practiceStateRead("goalReachedToday", false),
    goalStreak: practiceStateRead("goalStreak", 0)
  };
}

function getPracticeCustomSetSnapshot() {
  return {
    editingSet: !!practiceStateRead("editingSet", false),
    editingSetIdx: practiceStateRead("editingSetIdx", -1),
    customSetName: practiceStateRead("customSetName", "") || "",
    customSetChords: Array.isArray(practiceStateRead("customSetChords", [])) ? practiceStateRead("customSetChords", []) : [],
    customSets: Array.isArray(practiceStateRead("customSets", [])) ? practiceStateRead("customSets", []) : [],
    customSetError: practiceStateRead("customSetError", "") || ""
  };
}

function getPracticeSkillSnapshot() {
  return {
    transitionStats: practiceStateRead("transitionStats", {}) || {},
    dailyChallenge: practiceStateRead("dailyChallenge", null)
  };
}

function getSparkCoreLegacySnapshotBundle() {
  if (!window.sparkCore || typeof window.sparkCore.getActiveSessionView !== "function") return null;
  return window.sparkCore.getActiveSessionView() || null;
}

function getPracticePlayerSnapshot() {
  var view = getSparkCoreLegacySnapshotBundle();
  var fallback = {
    xp: practiceStateRead("xp", 0),
    level: practiceStateRead("playerLevel", practiceStateRead("level", 1)),
    streak: practiceStateRead("streak", 0),
    sessions: practiceStateRead("sessions", 0)
  };
  if (!view || !view.player) return fallback;
  return {
    xp: typeof view.player.xp === "number" ? view.player.xp : fallback.xp,
    level: typeof view.player.level === "number" ? view.player.level : fallback.level,
    streak: typeof view.player.streak === "number" ? view.player.streak : fallback.streak,
    sessions: typeof view.player.sessions === "number" ? view.player.sessions : fallback.sessions
  };
}

function getPracticeProgressSnapshot() {
  var view = getSparkCoreLegacySnapshotBundle();
  return view && view.progress ? view.progress : {
    chordProgress: practiceStateRead("chordProgress", {})
  };
}

function getPracticeLevelName(levelNames, level) {
  return levelNames && levelNames[level] ? levelNames[level] : ("Level " + level);
}

function sv2HomeDashboard() {
  var inst = SparkInstruments.getActive();
  if (!inst) return "";
  var D = inst.getData ? inst.getData() : {};
  var instrumentType = inst.instrument || "guitar";
  var theme = typeof SparkTheme !== "undefined" ? SparkTheme.get(instrumentType) : null;
  if (!theme) return "";

  var allInstruments = typeof SparkInstruments !== "undefined" ? SparkInstruments.getAll() : [];
  var levelNames = D.LN || {};
  var player = getPracticePlayerSnapshot();
  var progress = getPracticeProgressSnapshot();
  var goal = getPracticeGoalSnapshot();
  var playerLevel = player.level || 1;
  var chordProgress = progress.chordProgress || {};
  var levelName = levelNames[playerLevel] || ("Level " + playerLevel);
  var chordCount = D.ALL_CHORDS ? D.ALL_CHORDS.length : 0;
  var masteredCount = 0;
  if (D.ALL_CHORDS) {
    for (var i = 0; i < D.ALL_CHORDS.length; i++) {
      if ((chordProgress[D.ALL_CHORDS[i].name] || 0) >= 100) masteredCount++;
    }
  }

  // Daily goal
  var goalPct = Math.min(100, Math.round((goal.todayPracticeSeconds / (goal.dailyGoalMinutes * 60)) * 100));
  var goalMins = Math.floor(goal.todayPracticeSeconds / 60);

  var h = '';

  // Hero card
  h += '<div class="sv2-home-hero sv2-anim-hero">';
  h += '<div class="sv2-home-hero__header">';
  h += '<div class="sv2-icon sv2-icon--lg sv2-anim-glow">' + (inst.icon || "\uD83C\uDFB8") + '</div>';
  h += '<div class="sv2-home-hero__info">';
  h += '<h2 class="sv2-home-hero__name">' + escHTML(inst.name) + '</h2>';
  h += '<div class="sv2-home-hero__level">' + escHTML(levelName) + ' &mdash; Level ' + playerLevel + '</div>';
  h += '<div class="sv2-home-hero__badges">';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.1s">' + player.xp + ' XP</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.15s;background:rgba(255,215,61,0.12);color:#ffd93d">\uD83D\uDD25 ' + player.streak + '</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.2s;background:rgba(107,203,119,0.12);color:#6bcb77">' + masteredCount + '/' + chordCount + ' chords</span>';
  h += '</div></div></div>';

  // Action buttons inside hero
  // Build action buttons based on available tabs
  var instTabs = inst.tabs || [];
  var hasSongs = false, hasDrill = false;
  for (var ti = 0; ti < instTabs.length; ti++) {
    var tabId = typeof instTabs[ti] === "string" ? instTabs[ti] : instTabs[ti].id;
    if (tabId === "songs") hasSongs = true;
    if (tabId === "drill") hasDrill = true;
  }
  h += '<div class="sv2-home-hero__actions">';
  h += '<button class="sv2-btn sv2-btn--primary" onclick="act(\'quickStart\')">&#9654; Practice</button>';
  if (hasSongs) h += '<button class="sv2-btn sv2-btn--ghost" onclick="act(\'tab\',\'songs\')">\uD83C\uDFB5 Songs</button>';
  if (hasDrill) h += '<button class="sv2-btn sv2-btn--ghost" onclick="act(\'tab\',\'drill\')">&#9889; Drill</button>';
  if (!hasSongs && !hasDrill) h += '<button class="sv2-btn sv2-btn--ghost" onclick="act(\'tab\',\'stats\')">&#128202; Stats</button>';
  h += '</div>';
  h += '</div>';

  // Inactive instruments row
  var otherInstruments = [];
  for (var j = 0; j < allInstruments.length; j++) {
    if (allInstruments[j].id !== inst.id && allInstruments[j].available !== false) {
      otherInstruments.push(allInstruments[j]);
    }
  }
  if (otherInstruments.length > 0) {
    h += '<div class="sv2-inst-row sv2-anim-stagger-1">';
    for (var k = 0; k < otherInstruments.length; k++) {
      var oi = otherInstruments[k];
      var oiColor = typeof SparkTheme !== "undefined" ? SparkTheme.getColor(oi.instrument) : "#888";
      h += '<div class="sv2-inst-row__item" onclick="act(\'switchInstrument\',\'' + oi.id + '\')">';
      h += '<div class="sv2-icon sv2-icon--sm" style="background:' + oiColor + '">' + (oi.icon || "\uD83C\uDFB5") + '</div>';
      h += '<div style="font-size:' + 'var(--text-micro)' + ';color:' + oiColor + ';font-weight:700;font-family:var(--font-body-v2)">' + escHTML(oi.name) + '</div>';
      h += '</div>';
    }
    h += '</div>';
  }

  // Daily goal
  h += '<div class="sv2-daily-goal sv2-anim-stagger-2">';
  h += '<div class="sv2-ring" style="width:40px;height:40px">';
  var ringR = 16, ringC = 2 * Math.PI * ringR, ringOff = ringC - (goalPct / 100) * ringC;
  h += '<svg width="40" height="40" style="transform:rotate(-90deg)"><circle cx="20" cy="20" r="' + ringR + '" fill="none" stroke="var(--border)" stroke-width="4"/>';
  h += '<circle cx="20" cy="20" r="' + ringR + '" fill="none" stroke="var(--inst-primary)" stroke-width="4" stroke-dasharray="' + ringC + '" stroke-dashoffset="' + ringOff + '" stroke-linecap="round" style="transition:stroke-dashoffset 0.8s ease"/></svg>';
  h += '<div class="sv2-ring__label" style="font-size:10px">' + goalPct + '%</div>';
  h += '</div>';
  h += '<div style="flex:1">';
  h += '<div style="font-size:var(--text-caption);font-weight:700;color:var(--text-primary);font-family:var(--font-body-v2)">' + (goal.goalReachedToday ? "\u2705 Goal reached!" : "Daily Goal: " + goal.dailyGoalMinutes + " min") + '</div>';
  h += '<div style="font-size:var(--text-micro);color:var(--text-muted)">' + goalMins + ' / ' + goal.dailyGoalMinutes + ' min today' + (goal.goalStreak > 0 ? " &middot; \uD83D\uDD25 " + goal.goalStreak + " day streak" : "") + '</div>';
  h += '</div></div>';

  return h;
}

function homePage(){
  // V2 Dashboard
  var v2Home = typeof sv2HomeDashboard === "function" && document.body.classList.contains("sv2") ? sv2HomeDashboard() : "";
  var homeState = getPracticeHomeSnapshot();

  // Build tab bar from active instrument's tabs array
  var inst = SparkInstruments.getActive();
  var instTabs = inst && inst.tabs ? inst.tabs : [];
  var h='<div class="tabs" role="tablist">';
  for(var i=0;i<instTabs.length;i++){
    var t=instTabs[i];
    var tid = typeof t === "string" ? t : t.id;
    var ticon = typeof t === "object" && t.icon ? t.icon : "";
    var tlabel = typeof t === "object" && t.label ? t.label : tid.charAt(0).toUpperCase()+tid.slice(1);
    h+='<button class="tab'+(homeState.tab===tid?" active":"")+'" onclick="act(\'tab\',\''+tid+'\')" role="tab" aria-selected="'+(homeState.tab===tid)+'" aria-label="'+tlabel+' tab"><span class="tab-icon">'+ticon+'</span><span class="tab-label">'+tlabel+'</span></button>';
  }
  h+='</div>';

  // Route to tab content — check instrument-specific renderer first, then shared
  var _tabRenderers = (inst && inst.tabRenderers) ? inst.tabRenderers : {};
  var _sharedTabRenderers = {
    practice: typeof practiceTab === "function" ? practiceTab : null,
    drill: typeof drillTab === "function" ? drillTab : null,
    daily: typeof dailyTab === "function" ? dailyTab : null,
    quiz: typeof quizTab === "function" ? quizTab : null,
    ear: typeof earTrainTab === "function" ? earTrainTab : null,
    strum: typeof strumTab === "function" ? strumTab : null,
    songs: typeof songsTab === "function" ? songsTab : null,
    rhythm: typeof rhythmTab === "function" ? rhythmTab : null,
    runner: typeof runnerTab === "function" ? runnerTab : null,
    build: typeof buildTab === "function" ? buildTab : null,
    tuner: typeof tunerTab === "function" ? tunerTab : null,
    dual: typeof dualTab === "function" ? dualTab : null,
    stats: typeof statsTab === "function" ? statsTab : null,
    guide: typeof guideTab === "function" ? guideTab : null,
    games: typeof gamesTab === "function" ? gamesTab : null,
    tools: typeof toolsTab === "function" ? toolsTab : null
  };
  var _renderer = _tabRenderers[homeState.tab] || _sharedTabRenderers[homeState.tab] || null;
  if (_renderer) h += _renderer();
  return v2Home + h;
}

// ===== STUB TABS (games, tools) =====
function gamesTab(){ return '<div class="card"><div><b>Games</b></div><div class="muted">Mini-games and challenges.</div></div>'; }
function toolsTab(){ return '<div class="card"><div><b>Tools</b></div><div class="muted">Tuner, metronome, and utilities.</div></div>'; }
// ===== PRACTICE TAB =====
function practiceTab(){
  var D = SparkInstruments.getActive() ? SparkInstruments.getActive().getData() : {};
  var UI = SparkInstruments.getActive() ? SparkInstruments.getActive().ui : {};
  var player = getPracticePlayerSnapshot();
  var progress = getPracticeProgressSnapshot();
  var goal = getPracticeGoalSnapshot();
  var homeState = getPracticeHomeSnapshot();
  var skillState = getPracticeSkillSnapshot();
  var chordProgress = progress.chordProgress || {};
  var playerLevel = player.level || 1;
  var guidedSessions = Array.isArray(D.SESSIONS) ? D.SESSIONS : [];
  var hasPracticeBundle = !!(D && D.LC && D.CHORDS && Array.isArray(D.ALL_CHORDS) && UI && typeof UI.chord === "function");
  if(!hasPracticeBundle){
    return '<div class="card"><div><b>Loading practice dashboard...</b></div><div class="muted">Preparing your instrument content.</div></div>';
  }
  // Daily goal progress at top
  var goalPct=Math.min(100,Math.round((goal.todayPracticeSeconds/(goal.dailyGoalMinutes*60))*100));
  var goalMins=Math.floor(goal.todayPracticeSeconds/60);
  var h='<div class="card mb12"><div style="display:flex;align-items:center;gap:12px"><div class="flex-center">'+ringHTML(goalPct,56,5,goal.goalReachedToday?"#4ECDC4":"#FF6B6B",'<div style="font-size:12px;font-weight:900;color:var(--text-primary)">'+goalMins+'m</div>',"Daily goal progress")+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text-primary)">'+(goal.goalReachedToday?"&#9989; Goal reached!":"Daily Goal: "+goal.dailyGoalMinutes+" min")+'</div><div style="font-size:11px;color:var(--text-muted)">'+goalMins+'/'+goal.dailyGoalMinutes+' min today'+(goal.goalStreak>0?" | &#128293; "+goal.goalStreak+" day streak":"")+'</div></div><div style="display:flex;gap:4px">';
  var goals=[5,10,15,20,30];
  for(var i=0;i<goals.length;i++){
    h+='<button onclick="act(\'setGoal\',\''+goals[i]+'\')" style="width:28px;height:28px;border-radius:8px;font-size:11px;font-weight:700;background:'+(goal.dailyGoalMinutes===goals[i]?"#4ECDC4":"var(--input-bg)")+';color:'+(goal.dailyGoalMinutes===goals[i]?"#fff":"var(--text-muted)")+'">'+goals[i]+'</button>';
  }
  h+='</div></div></div>';

  // Practice Plan CTA
  h+='<div class="card mb12" style="text-align:center">';
  h+='<button class="btn" onclick="act(\'openPlan\')" style="background:var(--accent);color:#fff;font-weight:700">&#128218; Today\'s Practice Plan</button>';
  h+='</div>';


  // Play Along CTA
  h+='<div class="card mb12" style="background:linear-gradient(135deg,#1DB954,#191414);border:none;text-align:center;padding:16px">';
  h+='<div style="font-size:24px;margin-bottom:4px">&#127911;</div>';
  h+='<div style="font-size:15px;font-weight:900;color:#fff">Play Along</div>';
  h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 10px">Search any song, play along in real time</div>';
  h+='<button onclick="act(\'openPlayAlongHome\')" style="background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 28px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">Find a Song &#9654;</button>';
  h+='</div>';
  h+='</div>';

  // Progress Dashboard CTA
  h+='<div class="card mb12" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);border:none;text-align:center;padding:16px">';
  h+='<div style="font-size:24px;margin-bottom:4px">&#128200;</div>';
  h+='<div style="font-size:15px;font-weight:900;color:#fff">Your Progress</div>';
  h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 10px">Skills, mastery, and practice goals</div>';
  h+='<button onclick="act(\'openProgressDashboard\')" style="background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 28px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">View Progress &#9654;</button>';
  h+='</div>';

  if (homeState.lastBrainAnalysis || (homeState.personalInsights && homeState.personalInsights.coach)) {
    var coachMsg = homeState.personalInsights && homeState.personalInsights.coach ? homeState.personalInsights.coach.message : "";
    var focusSkill = homeState.recommendedFocus || (homeState.lastBrainAnalysis && homeState.lastBrainAnalysis.focusSkill) || null;
    var focusLabel = focusSkill ? String(focusSkill).replace(/_/g, " ") : "consistency";
    h += '<div class="card mb12" style="border:2px solid #45B7D1">';
    h += '<div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:6px">&#129504; Smart Coach</div>';
    if (coachMsg) h += '<div style="font-size:12px;color:#8fd5c4;margin-bottom:8px">' + escHTML(coachMsg) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-dim)">Recommended focus: <strong style="color:var(--text-primary)">' + escHTML(focusLabel) + '</strong></div>';
    if (homeState.lastBrainAnalysis && homeState.lastBrainAnalysis.recommendedDifficultyId) {
      h += '<div style="font-size:12px;color:var(--text-dim);margin-top:4px">Suggested difficulty: <strong style="color:var(--text-primary)">' + escHTML(homeState.lastBrainAnalysis.recommendedDifficultyId) + '</strong></div>';
    }
    if (homeState.lastBrainAnalysis && homeState.lastBrainAnalysis.weakLane != null) {
      h += '<div style="font-size:12px;color:var(--text-dim);margin-top:4px">Weak lane: <strong style="color:var(--text-primary)">' + (homeState.lastBrainAnalysis.weakLane + 1) + '</strong></div>';
    }
    h += '</div>';
  }
  // Guided Session CTA
  var gs=guidedSessions[homeState.guidedSession-1];
  if(gs){
    var gsDone=homeState.completedGuidedSessions.length;
    h+='<div class="card mb12" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);border:none;text-align:center;padding:16px">';
    h+='<div style="font-size:24px;margin-bottom:4px">&#127919;</div>';
    h+='<div style="font-size:15px;font-weight:900;color:#fff">Guided Session '+gs.num+'</div>';
    h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 10px">'+escHTML(gs.title)+' &bull; Level '+gs.level+' &bull; '+gsDone+'/'+guidedSessions.length+' done</div>';
    h+='<button onclick="act(\'guidedStart\',\''+gs.num+'\')" style="background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 28px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">Start Session &#9654;</button>';
    h+='</div>';
  }

  // Adaptive Practice Plan
  if(typeof ensurePracticePlan==="function"){
    var plan=ensurePracticePlan();
    if(plan&&plan.items&&plan.items.length){
      h+='<div class="card mb20" style="border:2px solid '+(plan.completedItems>=plan.totalItems?"#4ECDC4":"#45B7D1")+'">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      h+='<h3 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary)">&#128221; Today\'s Practice Plan</h3>';
      h+='<span style="font-size:12px;font-weight:700;color:var(--text-muted)">'+plan.completedItems+'/'+plan.totalItems+'</span>';
      h+='</div>';
      h+='<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">Focus: '+escHTML(plan.focus)+'</div>';
      for(var pi=0;pi<plan.items.length;pi++){
        var item=plan.items[pi];
        h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border)">';
        h+='<span style="font-size:16px">'+(item.completed?"&#9989;":"&#9744;")+'</span>';
        h+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(item.completed?"var(--text-muted)":"var(--text-primary)")+';'+(item.completed?"text-decoration:line-through":"")+'">'+escHTML(item.label)+'</div>';
        h+='<div style="font-size:11px;color:var(--text-dim)">'+escHTML(item.desc)+'</div></div>';
        if(!item.completed){
          h+='<button class="btn btn-sm" onclick="act(\'completePlanItem\',\''+item.id+'\')" style="background:#4ECDC4;color:#fff;font-size:11px;padding:4px 8px">Done</button>';
        }
        h+='</div>';
      }
      h+='</div>';
    }
  }

  // Quick Start / Resume
  h+='<div class="card mb12" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);border:none;text-align:center;padding:20px">';
  h+='<div style="font-size:28px;margin-bottom:4px">&#9889;</div>';
  if(homeState.lastChordName){
    h+='<div style="font-size:16px;font-weight:900;color:#fff">Pick Up Where You Left Off</div>';
    h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 12px">Continue practicing: <strong>'+escHTML(homeState.lastChordName)+'</strong></div>';
    h+='<div style="display:flex;gap:8px;justify-content:center">';
    h+='<button onclick="act(\'resumeSession\')" style="background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">Continue</button>';
    h+='<button onclick="act(\'quickStart\')" style="background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:rgba(255,255,255,.85);cursor:pointer">Random</button>';
    h+='</div>';
  } else {
    h+='<div style="font-size:16px;font-weight:900;color:#fff">Quick Start</div>';
    h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 12px">Jump right in &mdash; we\'ll pick a chord for you!</div>';
    h+='<button onclick="act(\'quickStart\')" style="background:rgba(255,255,255,.25);border:2px solid rgba(255,255,255,.5);border-radius:14px;padding:10px 32px;font-size:16px;font-weight:800;color:#fff;cursor:pointer">Let\'s Go!</button>';
  }
  h+='</div>';

  h+='<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Pick a Chord &#9889;</h2></div><div class="lvl-tabs">';
  for(var l=1;l<=8;l++){
    var sel=homeState.selectedLevel===l,lk=l>playerLevel,levelLabel=getPracticeLevelName(D.LN, l);
    h+='<button class="lvl-tab" onclick="act(\'selLevel\',\''+l+'\')" style="background:'+(sel?D.LC[l]:"var(--tab-bg)")+';color:'+(sel?"#fff":"var(--tab-inactive)")+';opacity:'+(lk?0.4:1)+'" aria-label="Level '+l+' '+levelLabel+'">'+(lk?"&#128274; ":"")+l+'</button>';
  }
  h+='</div>';
  h+='<div style="text-align:center;margin-bottom:12px"><span style="font-size:14px;font-weight:800;color:'+D.LC[homeState.selectedLevel]+'">'+getPracticeLevelName(D.LN, homeState.selectedLevel)+'</span>';
  if(D.CURRICULUM&&D.CURRICULUM[homeState.selectedLevel-1])h+='<span style="font-size:12px;color:var(--text-muted);margin-left:8px">'+D.CURRICULUM[homeState.selectedLevel-1].sub+'</span>';
  h+='</div>';
  h+='<div class="flex-col">';
  var cs=D.CHORDS[homeState.selectedLevel]||[];
  for(var i=0;i<cs.length;i++){
    var c=cs[i],p=chordProgress[c.name]||0,lk=homeState.selectedLevel>playerLevel;
    var tier=getChordTier(c.name);
    var tierStyle=tier.tier!=="none"?";border-left:4px solid "+tier.color:"";
    h+='<div class="card chord-card" style="opacity:'+(lk?0.5:1)+tierStyle+'"'+(lk?'':clickableDiv("act(\'startSession\',\'"+c.name+"\')"))+'>'+UI.chord(c,90)+'<div style="flex:1"><h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-primary)">'+c.name+tierBadgeHTML(c.name)+'</h3><div class="prog-bar"><div class="prog-fill" style="width:'+p+'%;background:linear-gradient(90deg,'+D.LC[homeState.selectedLevel]+','+D.LC[homeState.selectedLevel]+'88)"></div></div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">'+(p>=100?"&#9989; Mastered":p>0?p+"%":"Not started")+'</div></div>';
    if(!lk)h+='<button onclick="event.stopPropagation();act(\'previewChord\',\''+c.name+'\')" style="background:none;font-size:18px;padding:6px" aria-label="Preview '+c.name+' sound">&#128264;</button><div style="font-size:22px;color:'+D.LC[homeState.selectedLevel]+'">&#9654;</div>';
    h+='</div>';
  }
  h+='</div>';

  // Progress summary
  var mas=0;for(var k in chordProgress)if(chordProgress[k]>=100)mas++;
  h+='<div class="card mt16"><h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#128202; Progress</h3><div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:24px;font-weight:900;color:#FF6B6B">'+player.sessions+'</div><div style="font-size:10px;color:var(--text-muted)">Sessions</div></div><div><div style="font-size:24px;font-weight:900;color:#4ECDC4">'+mas+'</div><div style="font-size:10px;color:var(--text-muted)">Mastered</div></div><div><div style="font-size:24px;font-weight:900;color:#45B7D1">Lvl '+playerLevel+'</div><div style="font-size:10px;color:var(--text-muted)">Current</div></div></div></div>';

  // Strum track recommendation (S1-S7 progression from addendum)
  h+=strumTrackCard();

  // Finger Exercises
  h+=fingerExerciseCard();

  // Custom Practice Sets
  h+=customSetsSection();

  // Badges
  h+='<div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127942; Badges</h3><div style="display:flex;flex-wrap:wrap;gap:8px">';
  for(var i=0;i<BADGES.length;i++){
    var b=BADGES[i],e=homeState.earnedBadges.indexOf(b.id)!==-1;
    h+='<div style="width:56px;text-align:center;opacity:'+(e?1:0.3)+'" aria-label="Badge: '+b.label+(e?" (earned)":" (locked)")+'"><div style="font-size:24px;filter:'+(e?"none":"grayscale(1)")+'">'+b.icon+'</div><div style="font-size:8px;color:var(--text-label);font-weight:600">'+b.label+'</div></div>';
  }
  h+='</div></div>';

  // Export/Import & Reset
  h+='<div style="text-align:center;margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  h+='<button class="reset-btn" onclick="act(\'exportProgress\')" style="border-color:#4ECDC4;color:#4ECDC4">&#128190; Export</button>';
  h+='<button class="reset-btn" onclick="act(\'importProgress\')" style="border-color:#45B7D1;color:#45B7D1">&#128194; Import</button>';
  h+='<button class="reset-btn" onclick="act(\'resetProgress\')">Reset Progress</button>';
  h+='</div>';
  if(homeState.importMsg)h+='<div style="text-align:center;margin-top:8px;font-size:12px;color:'+(homeState.importMsg.ok?"#4ECDC4":"#FF6B6B")+'">'+homeState.importMsg.text+'</div>';
  return h;
}

// ===== CUSTOM PRACTICE SETS =====
function customSetsSection(){
  var D = SparkInstruments.getActive() ? SparkInstruments.getActive().getData() : {};
  var customState = getPracticeCustomSetSnapshot();
  var player = getPracticePlayerSnapshot();
  var h='<div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127912; My Practice Sets</h3>';

  if(customState.editingSet){
    if(customState.customSetError){
      h+='<div style="margin-bottom:10px;padding:10px 12px;border-radius:10px;background:#FF6B6B22;color:#FF6B6B;font-size:12px;font-weight:700">'+escHTML(customState.customSetError)+'</div>';
    }
    h+='<input class="set-input mb12" id="set-name-input" type="text" placeholder="Set name..." value="'+escHTML(customState.customSetName)+'" oninput="act(\'setName\',this.value)" aria-label="Practice set name"/>';
    h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Select chords (min 2):</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
    for(var l=1;l<=player.level;l++){
      var cs=D.CHORDS[l]||[];
      for(var i=0;i<cs.length;i++){
        var c=cs[i],sel=customState.customSetChords.indexOf(c.name)!==-1;
        h+='<span class="chord-chip'+(sel?" selected":"")+'"'+clickableDiv("act(\'toggleSetChord\',\'"+c.name+"\')")+'>'+c.short+'</span>';
      }
    }
    h+='</div>';
    h+='<div style="display:flex;gap:8px"><button class="btn" onclick="act(\'saveSet\')" style="flex:1;padding:10px;font-size:14px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff'+(customState.customSetChords.length<2||!customState.customSetName.trim()?';opacity:0.5':'')+'">'+(customState.editingSetIdx>=0?"Update":"Save")+'</button><button class="btn" onclick="act(\'cancelSet\')" style="flex:1;padding:10px;font-size:14px;background:var(--input-bg);color:var(--text-primary)">Cancel</button></div>';
  } else {
    if(customState.customSets.length===0){
      h+='<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Create custom chord groups to practice together.</p>';
    } else {
      for(var i=0;i<customState.customSets.length;i++){
        var cs=customState.customSets[i];
        h+='<div class="set-card mb12"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary)">'+escHTML(cs.name)+'</h4><div style="display:flex;gap:6px">';
        h+='<button onclick="act(\'drillCustomSet\',\''+i+'\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:6px 12px;border-radius:10px;font-size:12px;font-weight:700" aria-label="Start drill with '+escHTML(cs.name)+'">&#9889; Drill</button>';
        h+='<button onclick="act(\'editSet\',\''+i+'\')" style="background:var(--input-bg);color:var(--text-muted);padding:6px 10px;border-radius:10px;font-size:12px;font-weight:700" aria-label="Edit set">&#9998;</button>';
        h+='<button onclick="act(\'deleteSet\',\''+i+'\')" style="background:var(--input-bg);color:#FF6B6B;padding:6px 10px;border-radius:10px;font-size:12px;font-weight:700" aria-label="Delete set">&#128465;</button>';
        h+='</div></div>';
        h+='<div style="display:flex;flex-wrap:wrap;gap:4px">';
        for(var j=0;j<cs.chords.length;j++){
          h+='<span style="background:var(--chip-bg);padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;color:var(--chip-color)">'+escHTML(cs.chords[j])+'</span>';
        }
        h+='</div></div>';
      }
    }
    h+='<button class="btn" onclick="act(\'newSet\')" style="width:100%;padding:10px;font-size:14px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">+ Create Practice Set</button>';
  }
  h+='</div>';
  return h;
}

// escHTML() is defined in ui.js (loaded before page scripts)

// ===== DRILL TAB =====
function drillTab(){
  var homeState = getPracticeHomeSnapshot();
  var drillError = practiceStateRead("drillError", "") || "";
  var h='<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Chord Switching &#9889;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">60 seconds - switch fast!</p><div class="card"><div style="font-size:48px;margin-bottom:12px">&#127947;&#65039;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Completed: <strong>'+homeState.drillCount+'</strong></p>';
  if(drillError) h+='<div style="margin-bottom:12px;padding:10px 12px;border-radius:10px;background:#FF6B6B22;color:#FF6B6B;font-size:12px;font-weight:700">'+escHTML(drillError)+'</div>';
  h+='<button class="btn" onclick="act(\'startDrill\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Start Drill</button></div>';
  // Suggested drill from transition stats
  var hardest=getHardestTransition();
  if(hardest){
    h+='<div class="card mt16"><h3 style="margin:0 0 8px;font-size:14px;font-weight:800;color:var(--text-primary)">&#128161; Suggested Drill</h3><p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Your hardest transition: <strong>'+hardest.from+'</strong> &#8594; <strong>'+hardest.to+'</strong> (avg '+hardest.avg.toFixed(1)+'s)</p><button class="btn" onclick="act(\'drillTransition\',\''+hardest.from+'|'+hardest.to+'\')" style="padding:10px 20px;font-size:13px;background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary)">&#9889; Practice This</button></div>';
  }
  h+='</div>';
  return h;
}

function getHardestTransition(){
  var ts=getPracticeSkillSnapshot().transitionStats;
  var worst=null,worstAvg=0;
  for(var k in ts){
    if(ts[k].attempts>=2){
      var avg=ts[k].avgTime;
      if(avg>worstAvg){
        worstAvg=avg;
        var parts=k.split("->");
        worst={from:parts[0],to:parts[1],avg:avg};
      }
    }
  }
  return worst;
}

// ===== DAILY TAB =====
function dailyTab(){
  var dc=getPracticeSkillSnapshot().dailyChallenge;
  if(!dc)return '';
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Daily Challenge &#127941;</h2><div class="card"><div style="font-size:48px;margin-bottom:8px">'+dc.icon+'</div><h3 style="margin:0 0 6px;font-size:18px;font-weight:800;color:var(--text-primary)">'+dc.title+'</h3><p style="color:var(--text-label);font-size:14px;margin-bottom:8px">'+dc.desc+'</p><div style="display:inline-block;background:#FFF3E0;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;color:#E65100;margin-bottom:16px">+'+dc.xp+' XP</div><br><button class="btn" onclick="act(\'startDaily\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">Accept Challenge</button></div></div>';
}

// ===== QUIZ TAB =====
function quizTab(){
  var runtime = getPracticeRuntimeState();
  var quizScore = typeof practiceStateRead("quizCorrect", null) === "number"
    ? practiceStateRead("quizCorrect", null)
    : (runtime && typeof runtime.legacyQuizScore === "number" ? runtime.legacyQuizScore : 0);
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Chord Quiz &#129504;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Name &#8594; pick the right diagram!</p><div class="card"><div style="font-size:48px;margin-bottom:12px">&#129504;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Correct: <strong>'+quizScore+'</strong></p><button class="btn" onclick="act(\'startQuiz\')" style="background:linear-gradient(135deg,#45B7D1,#4ECDC4);color:#fff">Start Quiz</button></div></div>';
}

// ===== EAR TRAINING TAB =====
function getLegacyEarTrainingRuntime(){
  var runtime = getPracticeRuntimeState();
  return {
    question: typeof practiceStateRead("earTrainQ", null) === "string" ? practiceStateRead("earTrainQ", null) : (runtime ? runtime.legacyEarTrainQuestion : null),
    options: Array.isArray(practiceStateRead("earTrainOpts", [])) && practiceStateRead("earTrainOpts", []).length ? practiceStateRead("earTrainOpts", []) : (runtime && Array.isArray(runtime.legacyEarTrainOptions) ? runtime.legacyEarTrainOptions : []),
    answer: typeof practiceStateRead("earTrainAns", null) === "string" ? practiceStateRead("earTrainAns", null) : (runtime ? runtime.legacyEarTrainAnswer : null),
    score: typeof practiceStateRead("earTrainScore", null) === "number" ? practiceStateRead("earTrainScore", null) : (runtime && typeof runtime.legacyEarTrainScore === "number" ? runtime.legacyEarTrainScore : 0),
    total: typeof practiceStateRead("earTrainTotal", null) === "number" ? practiceStateRead("earTrainTotal", null) : (runtime && typeof runtime.legacyEarTrainTotal === "number" ? runtime.legacyEarTrainTotal : 0),
    streak: typeof practiceStateRead("earTrainStreak", null) === "number" ? practiceStateRead("earTrainStreak", null) : (runtime && typeof runtime.legacyEarTrainStreak === "number" ? runtime.legacyEarTrainStreak : 0),
    error: practiceStateRead("earTrainError", "") || ""
  };
}

function earTrainTab(){
  var runtime = getLegacyEarTrainingRuntime();
  if(runtime.question)return earTrainPage();
  var h='<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Ear Training &#128066;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Listen to a chord, then identify it!</p><div class="card"><div style="font-size:48px;margin-bottom:12px">&#127911;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">Score: <strong>'+runtime.score+'</strong> correct all time</p>';
  if(runtime.error) h+='<div style="margin-bottom:12px;padding:10px 12px;border-radius:10px;background:#FF6B6B22;color:#FF6B6B;font-size:12px;font-weight:700">'+escHTML(runtime.error)+'</div>';
  h+='<button class="btn" onclick="act(\'startEarTrain\')" style="background:linear-gradient(135deg,#FF6B6B,#4ECDC4);color:#fff">&#127911; Start Listening</button></div></div>';
  return h;
}

function earTrainPage(){
  var runtime = getLegacyEarTrainingRuntime();
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'tab\',\'ear\')">&#8592; Back</button>';
  h+='<div style="display:flex;justify-content:center;gap:16px;margin-bottom:12px"><div style="background:#4ECDC422;padding:6px 14px;border-radius:14px"><span style="font-weight:700;color:#4ECDC4">'+runtime.score+'/'+runtime.total+'</span></div><div style="background:#FF6B6B22;padding:6px 14px;border-radius:14px">&#128293;<span style="font-weight:700;color:#FF6B6B">'+runtime.streak+'</span></div></div>';
  h+='<h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">What chord is this?</h2>';
  h+='<button class="btn mb16" onclick="act(\'replayEarTrain\')" style="padding:10px 20px;font-size:14px;background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary)">&#128264; Replay</button>';
  h+='<div style="display:flex;flex-direction:column;gap:8px;max-width:300px;margin:0 auto">';
  for(var i=0;i<runtime.options.length;i++){
    var opt=runtime.options[i];
    var isA=runtime.answer!==null;
    var isC=opt===runtime.question;
    var isP=runtime.answer===opt;
    var bg=isA?(isC?"#4ECDC4":(isP?"#FF6B6B":"var(--input-bg)")):"var(--card-bg)";
    var clr=isA?(isC||isP?"#fff":"var(--text-muted)"):"var(--text-primary)";
    h+='<button class="btn" onclick="act(\'answerEarTrain\',\''+opt+'\')" style="width:100%;padding:14px;font-size:16px;font-weight:700;background:'+bg+';color:'+clr+';border:2px solid '+(isA?(isC?"#4ECDC4":(isP?"#FF6B6B":"var(--border)")):"var(--border)")+'">'+opt+'</button>';
  }
  h+='</div>';
  if(runtime.answer){
    var ok=runtime.answer===runtime.question;
    h+='<div style="margin-top:16px;font-size:20px;font-weight:800;color:'+(ok?"#4ECDC4":"#FF6B6B")+';animation:bn .4s ease">'+(ok?"&#9989; Correct! +15 XP":"&#10060; It was "+runtime.question)+'</div>';
  }
  h+='</div>';
  return h;
}

// ===== PRACTICE PLAN PAGE (Brain System) =====
function practicePage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var homeState = getPracticeHomeSnapshot();
  if(!homeState.practicePlan && !(coreView && coreView.plan && coreView.plan.flow === "daily_practice") && typeof generateDailyPracticePlan === "function") generateDailyPracticePlan();

  var stats = getPracticeStats();
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    && typeof SparkPracticeBridge !== "undefined" && SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"
    ? SparkPracticeBridge.toLegacyPlan(coreView.plan)
    : homeState.practicePlan;
  var planItems = plan && Array.isArray(plan.items) ? plan.items : [];

  var h = '<div class="card mb16">';
  h += '<div><b>Practice Stats</b></div>';
  h += '<div>Streak: '+stats.streak+' days</div>';
  h += '<div>Today: '+stats.todayMinutes+' min</div>';
  h += '<div>Total: '+stats.totalMinutes+' min</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div><b>Today\'s Practice Plan</b></div>';
  if(planItems.length){
    for(var i=0;i<planItems.length;i++){
      var item = planItems[i];
      h += '<div class="row">';
      h += '<span>'+escHTML(item.type)+'</span>';
      h += '<button onclick="act(\'startPracticeItem\',\''+item.id+'\')">'+(item.completed?'Done':'Start')+'</button>';
      h += '</div>';
    }
  } else {
    h += '<div class="muted">No practice plan is available right now.</div>';
  }
  h += '</div>';

  return h;
}

function startPracticeItem(id){
  var plan = null;
  if(window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"){
    var view = window.sparkCore.getActiveSessionView();
    if(view && view.plan && view.plan.flow === "daily_practice" && typeof SparkPracticeBridge !== "undefined" && SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"){
      plan = SparkPracticeBridge.toLegacyPlan(view.plan);
    }
  }
  if(!plan) plan = practiceStateRead("practicePlan", null);
  if(!plan || !Array.isArray(plan.items)){
    if (typeof showToast === "function") showToast("That practice item couldn't be started right now.");
    return;
  }
  for(var i=0;i<plan.items.length;i++){
    if(plan.items[i].id === id){
      if(!launchPracticeItem(plan.items[i]) && typeof showToast === "function"){
        showToast("That practice item couldn't be started right now.");
      }
      return;
    }
  }
  if (typeof showToast === "function") showToast("That practice item couldn't be started right now.");
}

window.startPracticeItem = startPracticeItem;
