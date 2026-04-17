// ===== ChordSpark: Home page and practice-related tabs =====

function getPracticePageInstrument() {
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
  if (typeof inst.getData === "function" || inst.ui || inst.tabs || inst.tabRenderers) return inst;
  candidate = inst.id || inst.appId || inst.instrumentId || null;
  if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
  all = SparkInstruments.getAll() || [];
  for (i = 0; i < all.length; i++) {
    entry = all[i] || {};
    if (entry.id === candidate || entry.appId === candidate) return entry;
  }
  return inst;
}

function getPracticePageInstrumentType(inst) {
  return (inst && (inst.instrument || inst.instrumentType)) || "guitar";
}

function getPracticeSummaryItemType(item) {
  var meta = item && item.meta ? item.meta : {};
  var type = item && item.type ? item.type : null;
  if (type === "song" && meta.songId) return "performance_song";
  if (type === "practice") {
    if (meta.guidedSession != null) return "guided_session";
    if (meta.from || meta.to || meta.key) return "transition";
    if (meta.bpm != null) return "rhythm";
    if (meta.exerciseType) return meta.exerciseType;
    if (meta.exerciseId) return "finger";
  }
  return type;
}

function prettyPracticeSummaryToken(value) {
  return String(value || "").replace(/_/g, " ");
}

function getPracticeSummaryItemLabel(item) {
  var meta = item && item.meta ? item.meta : {};
  return item && item.label
    ? item.label
    : prettyPracticeSummaryToken(
        meta.exerciseName ||
        meta.songTitle ||
        meta.songId ||
        meta.exerciseFocus ||
        meta.skill ||
        meta.exerciseId ||
        getPracticeSummaryItemType(item) ||
        (item && item.type) ||
        "practice"
      );
}

function getPracticeSummaryItemDesc(item) {
  var meta = item && item.meta ? item.meta : {};
  var parts = [];
  if (meta.instrument) parts.push(prettyPracticeSummaryToken(meta.instrument));
  if (meta.exerciseFocus) parts.push(prettyPracticeSummaryToken(meta.exerciseFocus));
  else if (meta.skill) parts.push(prettyPracticeSummaryToken(meta.skill));
  if (getPracticeSummaryItemType(item)) parts.push(prettyPracticeSummaryToken(getPracticeSummaryItemType(item)));
  return item && item.desc
    ? item.desc
    : (parts.join(" - ") || prettyPracticeSummaryToken(getPracticeSummaryItemType(item) || (item && item.type) || "practice"));
}

function getPracticeSummaryProgress(plan) {
  var items = plan && Array.isArray(plan.items) ? plan.items : [];
  var derivedTotalItems = items.length;
  var rawTotalItems = plan && typeof plan.totalItems === "number" ? plan.totalItems : null;
  var totalItems = rawTotalItems && rawTotalItems > 0 ? rawTotalItems : derivedTotalItems;
  var derivedCompletedItems = items.filter(function(item) { return !!(item && item.completed); }).length;
  var rawCompletedItems = plan && typeof plan.completedItems === "number" ? plan.completedItems : null;
  var completedItems = rawCompletedItems != null ? rawCompletedItems : derivedCompletedItems;
  if (completedItems < 0) completedItems = 0;
  if (totalItems < 0) totalItems = 0;
  if (totalItems > 0 && completedItems > totalItems) completedItems = totalItems;
  return {
    completedItems: completedItems,
    totalItems: totalItems
  };
}

function getPracticeSummaryFocus(plan) {
  return plan && plan.focus ? plan.focus : "No practice focus yet.";
}

function sv2HomeDashboard() {
  var inst = getPracticePageInstrument();
  if (!inst) return "";
  var D = inst.getData ? inst.getData() : {};
  var instrumentType = getPracticePageInstrumentType(inst);
  var theme = typeof SparkTheme !== "undefined" ? SparkTheme.get(instrumentType) : null;
  if (!theme) return "";

  var allInstruments = typeof SparkInstruments !== "undefined" ? SparkInstruments.getAll() : [];
  var levelNames = D.LN || {};
  var levelName = levelNames[S.level] || ("Level " + S.level);
  var chordCount = D.ALL_CHORDS ? D.ALL_CHORDS.length : 0;
  var masteredCount = 0;
  if (D.ALL_CHORDS) {
    for (var i = 0; i < D.ALL_CHORDS.length; i++) {
      if ((S.chordProgress[D.ALL_CHORDS[i].name] || 0) >= 100) masteredCount++;
    }
  }

  // Daily goal
  var goalPct = Math.min(100, Math.round((S.todayPracticeSeconds / (S.dailyGoalMinutes * 60)) * 100));
  var goalMins = Math.floor(S.todayPracticeSeconds / 60);

  var h = '';

  // Hero card
  h += '<div class="sv2-home-hero sv2-anim-hero">';
  h += '<div class="sv2-home-hero__header">';
  h += '<div class="sv2-icon sv2-icon--lg sv2-anim-glow">' + (inst.icon || "\uD83C\uDFB8") + '</div>';
  h += '<div class="sv2-home-hero__info">';
  h += '<h2 class="sv2-home-hero__name">' + escHTML(inst.name) + '</h2>';
  h += '<div class="sv2-home-hero__level">' + escHTML(levelName) + ' &mdash; Level ' + S.level + '</div>';
  h += '<div class="sv2-home-hero__badges">';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.1s">' + S.xp + ' XP</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.15s;background:rgba(255,215,61,0.12);color:#ffd93d">\uD83D\uDD25 ' + S.streak + '</span>';
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
      var oiColor = typeof SparkTheme !== "undefined" ? SparkTheme.getColor(getPracticePageInstrumentType(oi)) : "#888";
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
  h += '<div style="font-size:var(--text-caption);font-weight:700;color:var(--text-primary);font-family:var(--font-body-v2)">' + (S.goalReachedToday ? "\u2705 Goal reached!" : "Daily Goal: " + S.dailyGoalMinutes + " min") + '</div>';
  h += '<div style="font-size:var(--text-micro);color:var(--text-muted)">' + goalMins + ' / ' + S.dailyGoalMinutes + ' min today' + (S.goalStreak > 0 ? " &middot; \uD83D\uDD25 " + S.goalStreak + " day streak" : "") + '</div>';
  h += '</div></div>';

  return h;
}

function homePage(){
  // V2 Dashboard
  var v2Home = typeof sv2HomeDashboard === "function" && document.body.classList.contains("sv2") ? sv2HomeDashboard() : "";

  // Build tab bar from active instrument's tabs array
  var inst = getPracticePageInstrument();
  var instTabs = inst && inst.tabs ? inst.tabs : [];
  var h='<div class="tabs" role="tablist">';
  for(var i=0;i<instTabs.length;i++){
    var t=instTabs[i];
    var tid = typeof t === "string" ? t : t.id;
    var ticon = typeof t === "object" && t.icon ? t.icon : "";
    var tlabel = typeof t === "object" && t.label ? t.label : tid.charAt(0).toUpperCase()+tid.slice(1);
    h+='<button class="tab'+(S.tab===tid?" active":"")+'" onclick="act(\'tab\',\''+tid+'\')" role="tab" aria-selected="'+(S.tab===tid)+'" aria-label="'+tlabel+' tab"><span class="tab-icon">'+ticon+'</span><span class="tab-label">'+tlabel+'</span></button>';
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
  var _renderer = _tabRenderers[S.tab] || _sharedTabRenderers[S.tab] || null;
  if (_renderer) h += _renderer();
  return v2Home + h;
}

// ===== STUB TABS (games, tools) =====
function gamesTab(){ return '<div class="card"><div><b>Games</b></div><div class="muted">Mini-games and challenges.</div></div>'; }
function toolsTab(){ return '<div class="card"><div><b>Tools</b></div><div class="muted">Tuner, metronome, and utilities.</div></div>'; }
// ===== PRACTICE TAB =====
function practiceTab(){
  var inst = getPracticePageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  // Daily goal progress at top
  var goalPct=Math.min(100,Math.round((S.todayPracticeSeconds/(S.dailyGoalMinutes*60))*100));
  var goalMins=Math.floor(S.todayPracticeSeconds/60);
  var h='<div class="card mb12"><div style="display:flex;align-items:center;gap:12px"><div class="flex-center">'+ringHTML(goalPct,56,5,S.goalReachedToday?"#4ECDC4":"#FF6B6B",'<div style="font-size:12px;font-weight:900;color:var(--text-primary)">'+goalMins+'m</div>',"Daily goal progress")+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text-primary)">'+(S.goalReachedToday?"&#9989; Goal reached!":"Daily Goal: "+S.dailyGoalMinutes+" min")+'</div><div style="font-size:11px;color:var(--text-muted)">'+goalMins+'/'+S.dailyGoalMinutes+' min today'+(S.goalStreak>0?" | &#128293; "+S.goalStreak+" day streak":"")+'</div></div><div style="display:flex;gap:4px">';
  var goals=[5,10,15,20,30];
  for(var i=0;i<goals.length;i++){
    h+='<button onclick="act(\'setGoal\',\''+goals[i]+'\')" style="width:28px;height:28px;border-radius:8px;font-size:11px;font-weight:700;background:'+(S.dailyGoalMinutes===goals[i]?"#4ECDC4":"var(--input-bg)")+';color:'+(S.dailyGoalMinutes===goals[i]?"#fff":"var(--text-muted)")+'">'+goals[i]+'</button>';
  }
  h+='</div></div></div>';

  // Practice Plan CTA
  h+='<div class="card mb12" style="text-align:center">';
  h+='<button class="btn" onclick="act(\'openPlan\')" style="background:var(--accent);color:#fff;font-weight:700">&#128218; Today\'s Practice Plan</button>';
  h+='</div>';

  // Guided Session CTA
  var gs=D.SESSIONS[S.guidedSession-1];
  if(gs){
    var gsDone=S.completedGuidedSessions?S.completedGuidedSessions.length:0;
    h+='<div class="card mb12" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);border:none;text-align:center;padding:16px">';
    h+='<div style="font-size:24px;margin-bottom:4px">&#127919;</div>';
    h+='<div style="font-size:15px;font-weight:900;color:#fff">Guided Session '+gs.num+'</div>';
    h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 10px">'+escHTML(gs.title)+' &bull; Level '+gs.level+' &bull; '+gsDone+'/'+D.SESSIONS.length+' done</div>';
    h+='<button onclick="act(\'guidedStart\')" style="background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 28px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">Start Session &#9654;</button>';
    h+='</div>';
  }

  // Adaptive Practice Plan
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
  if(!plan) plan = S.practicePlan;
  if(plan&&plan.items&&plan.items.length){
    var planProgress = getPracticeSummaryProgress(plan);
    h+='<div class="card mb20" style="border:2px solid '+(planProgress.completedItems>=planProgress.totalItems?"#4ECDC4":"#45B7D1")+'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    h+='<h3 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary)">&#128221; Today\'s Practice Plan</h3>';
    h+='<span style="font-size:12px;font-weight:700;color:var(--text-muted)">'+planProgress.completedItems+'/'+planProgress.totalItems+'</span>';
    h+='</div>';
    h+='<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">Focus: '+escHTML(getPracticeSummaryFocus(plan))+'</div>';
    for(var pi=0;pi<plan.items.length;pi++){
      var item=plan.items[pi];
      h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border)">';
      h+='<span style="font-size:16px">'+(item.completed?"&#9989;":"&#9744;")+'</span>';
      h+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(item.completed?"var(--text-muted)":"var(--text-primary)")+';'+(item.completed?"text-decoration:line-through":"")+'">'+escHTML(getPracticeSummaryItemLabel(item))+'</div>';
      h+='<div style="font-size:11px;color:var(--text-dim)">'+escHTML(getPracticeSummaryItemDesc(item))+'</div></div>';
      if(!item.completed){
        if(item && item.id){
          h+='<button class="btn btn-sm" onclick="act(\'completePlanItem\',\''+item.id+'\')" style="background:#4ECDC4;color:#fff;font-size:11px;padding:4px 8px">Done</button>';
        }else{
          h+='<span class="text-muted">Unavailable</span>';
        }
      }
      h+='</div>';
    }
    h+='</div>';
  } else {
    h+='<div class="card mb20">';
    h+='<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:var(--text-primary)">&#128221; Today\'s Practice Plan</h3>';
    h+='<div style="font-size:12px;color:var(--text-dim)">No practice plan yet.</div>';
    h+='</div>';
  }

  // Quick Start / Resume
  h+='<div class="card mb12" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);border:none;text-align:center;padding:20px">';
  h+='<div style="font-size:28px;margin-bottom:4px">&#9889;</div>';
  if(S.lastChordName){
    h+='<div style="font-size:16px;font-weight:900;color:#fff">Pick Up Where You Left Off</div>';
    h+='<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 12px">Continue practicing: <strong>'+escHTML(S.lastChordName)+'</strong></div>';
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
    var sel=S.selectedLevel===l,lk=l>S.level;
    h+='<button class="lvl-tab" onclick="act(\'selLevel\',\''+l+'\')" style="background:'+(sel?D.LC[l]:"var(--tab-bg)")+';color:'+(sel?"#fff":"var(--tab-inactive)")+';opacity:'+(lk?0.4:1)+'" aria-label="Level '+l+' '+D.LN[l]+'">'+(lk?"&#128274; ":"")+l+'</button>';
  }
  h+='</div>';
  h+='<div style="text-align:center;margin-bottom:12px"><span style="font-size:14px;font-weight:800;color:'+D.LC[S.selectedLevel]+'">'+D.LN[S.selectedLevel]+'</span>';
  if(D.CURRICULUM&&D.CURRICULUM[S.selectedLevel-1])h+='<span style="font-size:12px;color:var(--text-muted);margin-left:8px">'+D.CURRICULUM[S.selectedLevel-1].sub+'</span>';
  h+='</div>';
  h+='<div class="flex-col">';
  var cs=D.CHORDS[S.selectedLevel]||[];
  for(var i=0;i<cs.length;i++){
    var c=cs[i],p=S.chordProgress[c.name]||0,lk=S.selectedLevel>S.level;
    var tier=getChordTier(c.name);
    var tierStyle=tier.tier!=="none"?";border-left:4px solid "+tier.color:"";
    h+='<div class="card chord-card" style="opacity:'+(lk?0.5:1)+tierStyle+'"'+(lk?'':clickableDiv("act(\'startSession\',\'"+c.name+"\')"))+'>'+UI.chord(c,90)+'<div style="flex:1"><h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-primary)">'+c.name+tierBadgeHTML(c.name)+'</h3><div class="prog-bar"><div class="prog-fill" style="width:'+p+'%;background:linear-gradient(90deg,'+D.LC[S.selectedLevel]+','+D.LC[S.selectedLevel]+'88)"></div></div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">'+(p>=100?"&#9989; Mastered":p>0?p+"%":"Not started")+'</div></div>';
    if(!lk)h+='<button onclick="event.stopPropagation();act(\'previewChord\',\''+c.name+'\')" style="background:none;font-size:18px;padding:6px" aria-label="Preview '+c.name+' sound">&#128264;</button><div style="font-size:22px;color:'+D.LC[S.selectedLevel]+'">&#9654;</div>';
    h+='</div>';
  }
  h+='</div>';

  // Progress summary
  var mas=0;for(var k in S.chordProgress)if(S.chordProgress[k]>=100)mas++;
  h+='<div class="card mt16"><h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#128202; Progress</h3><div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:24px;font-weight:900;color:#FF6B6B">'+S.sessions+'</div><div style="font-size:10px;color:var(--text-muted)">Sessions</div></div><div><div style="font-size:24px;font-weight:900;color:#4ECDC4">'+mas+'</div><div style="font-size:10px;color:var(--text-muted)">Mastered</div></div><div><div style="font-size:24px;font-weight:900;color:#45B7D1">Lvl '+S.level+'</div><div style="font-size:10px;color:var(--text-muted)">Current</div></div></div></div>';

  // Strum track recommendation (S1-S7 progression from addendum)
  h+=strumTrackCard();

  // Finger Exercises
  h+=fingerExerciseCard();

  // Custom Practice Sets
  h+=customSetsSection();

  // Badges
  h+='<div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127942; Badges</h3><div style="display:flex;flex-wrap:wrap;gap:8px">';
  for(var i=0;i<BADGES.length;i++){
    var b=BADGES[i],e=S.earnedBadges.indexOf(b.id)!==-1;
    h+='<div style="width:56px;text-align:center;opacity:'+(e?1:0.3)+'" aria-label="Badge: '+b.label+(e?" (earned)":" (locked)")+'"><div style="font-size:24px;filter:'+(e?"none":"grayscale(1)")+'">'+b.icon+'</div><div style="font-size:8px;color:var(--text-label);font-weight:600">'+b.label+'</div></div>';
  }
  h+='</div></div>';

  // Export/Import & Reset
  h+='<div style="text-align:center;margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  h+='<button class="reset-btn" onclick="act(\'exportProgress\')" style="border-color:#4ECDC4;color:#4ECDC4">&#128190; Export</button>';
  h+='<button class="reset-btn" onclick="act(\'importProgress\')" style="border-color:#45B7D1;color:#45B7D1">&#128194; Import</button>';
  h+='<button class="reset-btn" onclick="resetProgress()">Reset Progress</button>';
  h+='</div>';
  if(S.importMsg)h+='<div style="text-align:center;margin-top:8px;font-size:12px;color:'+(S.importMsg.ok?"#4ECDC4":"#FF6B6B")+'">'+S.importMsg.text+'</div>';
  return h;
}

// ===== CUSTOM PRACTICE SETS =====
function customSetsSection(){
  var inst = getPracticePageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var h='<div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127912; My Practice Sets</h3>';

  if(S.editingSet){
    h+='<input class="set-input mb12" id="set-name-input" type="text" placeholder="Set name..." value="'+escHTML(S.customSetName)+'" oninput="act(\'setName\',this.value)" aria-label="Practice set name"/>';
    h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Select chords (min 2):</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
    for(var l=1;l<=S.level;l++){
      var cs=D.CHORDS[l]||[];
      for(var i=0;i<cs.length;i++){
        var c=cs[i],sel=S.customSetChords.indexOf(c.name)!==-1;
        h+='<span class="chord-chip'+(sel?" selected":"")+'"'+clickableDiv("act(\'toggleSetChord\',\'"+c.name+"\')")+'>'+c.short+'</span>';
      }
    }
    h+='</div>';
    h+='<div style="display:flex;gap:8px"><button class="btn" onclick="act(\'saveSet\')" style="flex:1;padding:10px;font-size:14px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff'+(S.customSetChords.length<2||!S.customSetName.trim()?';opacity:0.5':'')+'">'+(S.editingSetIdx>=0?"Update":"Save")+'</button><button class="btn" onclick="act(\'cancelSet\')" style="flex:1;padding:10px;font-size:14px;background:var(--input-bg);color:var(--text-primary)">Cancel</button></div>';
  } else {
    if(S.customSets.length===0){
      h+='<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Create custom chord groups to practice together.</p>';
    } else {
      for(var i=0;i<S.customSets.length;i++){
        var cs=S.customSets[i];
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
  var h='<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Chord Switching &#9889;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">60 seconds - switch fast!</p><div class="card"><div style="font-size:48px;margin-bottom:12px">&#127947;&#65039;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Completed: <strong>'+S.drillCount+'</strong></p><button class="btn" onclick="act(\'startDrill\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Start Drill</button></div>';
  // Suggested drill from transition stats
  var hardest=getHardestTransition();
  if(hardest){
    h+='<div class="card mt16"><h3 style="margin:0 0 8px;font-size:14px;font-weight:800;color:var(--text-primary)">&#128161; Suggested Drill</h3><p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Your hardest transition: <strong>'+hardest.from+'</strong> &#8594; <strong>'+hardest.to+'</strong> (avg '+hardest.avg.toFixed(1)+'s)</p><button class="btn" onclick="act(\'drillTransition\',\''+hardest.from+'|'+hardest.to+'\')" style="padding:10px 20px;font-size:13px;background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary)">&#9889; Practice This</button></div>';
  }
  h+='</div>';
  return h;
}

function getHardestTransition(){
  var ts=S.transitionStats;
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
  if(!S.dailyChallenge)return '';
  var dc=S.dailyChallenge;
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Daily Challenge &#127941;</h2><div class="card"><div style="font-size:48px;margin-bottom:8px">'+dc.icon+'</div><h3 style="margin:0 0 6px;font-size:18px;font-weight:800;color:var(--text-primary)">'+dc.title+'</h3><p style="color:var(--text-label);font-size:14px;margin-bottom:8px">'+dc.desc+'</p><div style="display:inline-block;background:#FFF3E0;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;color:#E65100;margin-bottom:16px">+'+dc.xp+' XP</div><br><button class="btn" onclick="act(\'startDaily\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">Accept Challenge</button></div></div>';
}

// ===== QUIZ TAB =====
function quizTab(){
  var runtime = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  runtime = runtime && runtime.runtimeState ? runtime.runtimeState : null;
  var quizScore = typeof S.quizCorrect === "number"
    ? S.quizCorrect
    : (runtime && typeof runtime.legacyQuizScore === "number" ? runtime.legacyQuizScore : 0);
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Chord Quiz &#129504;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Name &#8594; pick the right diagram!</p><div class="card"><div style="font-size:48px;margin-bottom:12px">&#129504;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Correct: <strong>'+quizScore+'</strong></p><button class="btn" onclick="act(\'startQuiz\')" style="background:linear-gradient(135deg,#45B7D1,#4ECDC4);color:#fff">Start Quiz</button></div></div>';
}

// ===== EAR TRAINING TAB =====
function getLegacyEarTrainingRuntime(){
  var runtime = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  runtime = runtime && runtime.runtimeState ? runtime.runtimeState : null;
  return {
    question: typeof S.earTrainQ === "string" ? S.earTrainQ : (runtime ? runtime.legacyEarTrainQuestion : null),
    options: Array.isArray(S.earTrainOpts) && S.earTrainOpts.length ? S.earTrainOpts : (runtime && Array.isArray(runtime.legacyEarTrainOptions) ? runtime.legacyEarTrainOptions : []),
    answer: typeof S.earTrainAns === "string" ? S.earTrainAns : (runtime ? runtime.legacyEarTrainAnswer : null),
    score: typeof S.earTrainScore === "number" ? S.earTrainScore : (runtime && typeof runtime.legacyEarTrainScore === "number" ? runtime.legacyEarTrainScore : 0),
    total: typeof S.earTrainTotal === "number" ? S.earTrainTotal : (runtime && typeof runtime.legacyEarTrainTotal === "number" ? runtime.legacyEarTrainTotal : 0),
    streak: typeof S.earTrainStreak === "number" ? S.earTrainStreak : (runtime && typeof runtime.legacyEarTrainStreak === "number" ? runtime.legacyEarTrainStreak : 0)
  };
}

function earTrainTab(){
  var runtime = getLegacyEarTrainingRuntime();
  if(runtime.question)return earTrainPage();
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Ear Training &#128066;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Listen to a chord, then identify it!</p><div class="card"><div style="font-size:48px;margin-bottom:12px">&#127911;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">Score: <strong>'+runtime.score+'</strong> correct all time</p><button class="btn" onclick="act(\'startEarTrain\')" style="background:linear-gradient(135deg,#FF6B6B,#4ECDC4);color:#fff">&#127911; Start Listening</button></div></div>';
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
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";

  var stats = getPracticeStats();
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
  if(!plan) plan = S.practicePlan;

  var h = '<div class="card mb16">';
  h += '<div><b>Practice Stats</b></div>';
  h += '<div>Streak: '+stats.streak+' days</div>';
  h += '<div>Today: '+stats.todayMinutes+' min</div>';
  h += '<div>Total: '+stats.totalMinutes+' min</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div><b>Today\'s Practice Plan</b></div>';
  if(plan && Array.isArray(plan.items) && plan.items.length){
    for(var i=0;i<plan.items.length;i++){
      var item = plan.items[i];
      var done = item.completed ? ' style="opacity:0.5;text-decoration:line-through"' : '';
      var actionHtml = item.completed
        ? '<span class="text-muted">Done</span>'
        : (item && item.id
          ? '<button onclick="act(\'practiceStartItem\', \''+item.id+'\')">Start</button>'
          : '<span class="text-muted">Unavailable</span>');
      h += '<div class="row">';
      h += '<span'+done+'>'+escHTML(getPracticeSummaryItemLabel(item))+'</span>';
      h += actionHtml;
      h += '</div>';
    }
  } else {
    h += '<div class="muted">No practice plan yet.</div>';
  }
  h += '</div>';

  return h;
}

function startPracticeItem(id){
  var plan = null;
  if(window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"){
    var view = window.sparkCore.getActiveSessionView();
    if(view && view.plan && view.plan.flow === "daily_practice" && window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"){
      plan = SparkPracticeBridge.toLegacyPlan(view.plan);
    }
  }
  if(!plan) plan = S.practicePlan;
  if(!plan) return;
  for(var i=0;i<plan.items.length;i++){
    if(plan.items[i].id === id){
      launchPracticeItem(plan.items[i]);
      return;
    }
  }
}
