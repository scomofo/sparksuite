/* PianoSpark - Practice tab (home page) */

function pianoPracticeTab() {
  var inst = typeof getPianoPageInstrument === "function" ? getPianoPageInstrument() : (SparkInstruments.getActive ? SparkInstruments.getActive() : null);
  var D = inst && inst.getData ? inst.getData() : {};
  var CURRICULUM = D.CURRICULUM || [];
  var BADGES = D.BADGES || [];
  var html = '';

  // If-then intention reminder (stickiness #2)
  if (S.practiceIntention && !S.focusMode) {
    html += pianoIfThenCard("When I " + S.practiceIntention + ", I will open PianoSpark.");
  }

  // Daily goal progress
  var goalMin = S.dailyGoal;
  var pracMin = Math.floor(S.dailyPracticed / 60);
  var goalPct = Math.min(100, (pracMin / goalMin) * 100);
  html += '<div class="card"><div class="daily-goal">';
  html += '<div class="goal-header"><span>Daily Goal: ' + pracMin + '/' + goalMin + ' min</span>';
  html += (goalPct >= 100 ? '<span class="goal-done">\u2705 Done!</span>' : '') + '</div>';
  html += '<div class="progress-bar"><div class="progress-fill" style="width:' + goalPct + '%"></div></div>';
  html += '</div>';

  // Practice Plan CTA
  html += '<div style="text-align:center;margin:8px 0">';
  html += '<button class="btn" onclick="act(\'openPlan\')" style="background:var(--accent);color:#fff;font-weight:700">Today\'s Practice Plan</button>';
  html += '</div></div>';

  // Quick start / Resume session card
  var plan = getCurrentSessionPlan();
  if (plan) {
    html += pianoClickableDiv(
      "act('start_guided_session')",
      '<h3>Session ' + plan.num + ': ' + escHTML(plan.title) + '</h3>' +
      '<p>Level ' + plan.level + ' \u2022 ' + escHTML(CURRICULUM[plan.level - 1].title) + '</p>',
      "quick-start"
    );
  }

  // 8 level tabs
  var viewLvlNum = S._viewLevel || S.level;
  html += '<div class="level-tabs">';
  for (var i = 0; i < CURRICULUM.length; i++) {
    var lvl = CURRICULUM[i];
    var isActive = viewLvlNum === lvl.num;
    var isLocked = lvl.num > S.level + 1; // can see current + next
    var color = levelColor(lvl.num);
    var cls = "level-tab" + (isActive ? " active" : "") + (isLocked ? " locked" : "");
    html += '<div class="' + cls + '" style="color:' + color + ';background:' + color + '15" onclick="' + (isLocked ? '' : "act('view_level'," + lvl.num + ")") + '">';
    html += lvl.icon + ' ' + lvl.num;
    html += '</div>';
  }
  html += '</div>';

  // Viewed level chords
  var viewedLvl = null;
  for (var j = 0; j < CURRICULUM.length; j++) {
    if (CURRICULUM[j].num === viewLvlNum) { viewedLvl = CURRICULUM[j]; break; }
  }
  if (!viewedLvl) viewedLvl = getCurrentLevel();
  html += '<div class="card">';
  html += '<h3 style="color:' + levelColor(viewedLvl.num) + '">' + viewedLvl.icon + ' Level ' + viewedLvl.num + ': ' + escHTML(viewedLvl.title) + '</h3>';
  html += '<p>' + escHTML(viewedLvl.desc) + '</p>';
  if (viewedLvl.tip) {
    html += '<div class="text-muted" style="margin-bottom:12px">\u{1F4A1} ' + escHTML(viewedLvl.tip) + '</div>';
  }

  // Chord cards for the viewed level (or all unlocked when viewing current level)
  var unlocked = (viewLvlNum === S.level) ? chordsUpToLevel(S.level) : chordsForLevel(viewLvlNum);
  if (!S.chordProg) S.chordProg = {};
  html += '<div class="chord-grid">';
  unlocked.forEach(function(c) {
    var prog = S.chordProg[c.short] || 0;
    var tier = pianoTierBadgeHTML(prog);
    var color = c.color || "#888";
    html += pianoClickableDiv(
      "act('start_session','" + c.short + "')",
      '<div class="chord-card-inner">' +
        '<span class="chord-name" style="color:' + color + '">' + escHTML(c.short) + '</span>' +
        tier +
        '<div class="mini-progress"><div class="mini-fill" style="width:' + prog + '%;background:' + color + '"></div></div>' +
        '<span class="chord-pct">' + prog + '%</span>' +
      '</div>',
      "chord-card"
    );
  });
  html += '</div>';

  // Custom sets
  html += '<div class="custom-sets"><h4>Custom Practice Sets</h4>';
  if (S.customSets.length) {
    S.customSets.forEach(function(set, i) {
      html += '<div class="custom-set-row">';
      html += '<button class="btn btn-sm" onclick="act(\'drill_custom\',' + i + ')">' + escHTML(set.name) + ' (' + set.chords.length + ')</button>';
      html += '<button class="btn btn-sm btn-danger" onclick="act(\'del_custom\',' + i + ')">\u2715</button>';
      html += '</div>';
    });
  }
  html += '<button class="btn btn-sm" onclick="act(\'new_custom\')">+ New Set</button></div>';

  // Focus mode toggle
  html += '<div class="setting-row" style="margin-top:12px">';
  html += '<label>Focus Mode:</label>';
  html += '<button class="btn btn-sm ' + (S.focusMode ? 'btn-accent' : 'btn-secondary') + '" onclick="act(\'toggle_focus\')">' + (S.focusMode ? 'ON' : 'OFF') + '</button>';
  html += '</div>';

  // Badges
  if (!S.focusMode) {
    html += '<div class="badges-row">';
    BADGES.forEach(function(b) {
      var earned = S.earned.indexOf(b.id) >= 0;
      html += '<span class="badge ' + (earned ? 'earned' : 'locked') + '" title="' + escHTML(b.desc) + '">' + b.icon + '</span>';
    });
    html += '</div>';
  }

  html += '</div>'; // close card

  // Practice Plan + Stats section (brain systems)
  html += practicePlanSection();

  return html;
}

/* Practice Plan section – shows stats, today's plan, and progression overview */
function practicePlanSection(){
  function getPlanItemId(item){
    var id = item && typeof item.id === "string" ? item.id.trim() : (item ? item.id : null);
    return id || null;
  }
  function isRenderablePlanItem(item){
    var label = item && typeof item.label === "string" ? item.label.trim() : (item ? item.label : null);
    var type = item && typeof item.type === "string" ? item.type.trim() : (item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!value.trim();
      return true;
    }));
    return !!(
      item &&
      (getPlanItemId(item) ||
       label ||
       type ||
       metaHasValue)
    );
  }
  var h = '';

  // Practice stats card
  if(typeof getPracticeStats === "function"){
    var stats = getPracticeStats();
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Practice Stats</b></div>';
    h += '<div>Streak: '+stats.streak+' days</div>';
    h += '<div>Today: '+stats.todayMinutes+' min</div>';
    h += '<div>Total: '+stats.totalMinutes+' min</div>';
    h += '<div>Sessions: '+stats.sessions+'</div>';
    h += '</div>';
  }

  // Today's brain-generated practice plan
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
  if(!plan) plan = S.practicePlan;
  if(plan && Array.isArray(plan.items) && plan.items.some(isRenderablePlanItem)){
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Today\'s Practice Plan</b></div>';
    for(var i=0;i<plan.items.length;i++){
      var item = plan.items[i];
      if(!isRenderablePlanItem(item)) continue;
      var itemId = getPlanItemId(item);
      var done = item.completed ? ' style="opacity:0.5;text-decoration:line-through"' : '';
      h += '<div class="row"' + done + '>';
      h += '<span>' + escHTML(getPianoPracticePlanItemLabel(item)) + (item.target ? ' (' + escHTML(item.target) + ')' : '') + '</span>';
      if(!item.completed){
        if(itemId){
          h += '<button class="btn btn-sm" onclick="act(\'practiceStartItem\', \''+itemId+'\')">Start</button>';
        }else{
          h += '<span class="text-muted">Unavailable</span>';
        }
      }else{
        h += '<span class="text-muted">Done</span>';
      }
      h += '</div>';
    }
    h += '</div>';
  } else {
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Today\'s Practice Plan</b></div>';
    h += '<div class="text-muted">No practice plan yet.</div>';
    h += '</div>';
  }

  // Progression mastery summary
  if(typeof getAverageMastery === "function"){
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Mastery</b></div>';
    h += '<div>Chords: '+Math.round(getAverageMastery("chords")*100)+'%</div>';
    h += '<div>Rhythm: '+Math.round(getAverageMastery("rhythm")*100)+'%</div>';
    h += '<div>Transitions: '+Math.round(getAverageMastery("transitions")*100)+'%</div>';
    h += '<div>Scales: '+Math.round(getAverageMastery("scales")*100)+'%</div>';
    h += '</div>';
  }

  return h;
}

function getPianoPracticePlanItemType(item){
  var meta = item && item.meta ? item.meta : {};
  var type = item && item.type ? item.type : null;
  var exerciseType = meta && typeof meta.exerciseType === "string"
    ? meta.exerciseType.trim()
    : meta.exerciseType;
  if(type === "song" && meta.songId) return "performance_song";
  if(type === "practice"){
    if(meta.guidedSession != null) return "guided_session";
    if(meta.from || meta.to || meta.key) return "transition";
    if(meta.bpm != null) return "rhythm";
    if(exerciseType) return exerciseType;
    if(meta.exerciseId) return "finger";
  }
  return type;
}

function prettyPianoPracticePlanToken(value){
  return String(value || "").replace(/_/g, " ").trim();
}

function firstPrettyPianoPracticePlanToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = prettyPianoPracticePlanToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function getPianoPracticePlanItemLabel(item){
  var meta = item && item.meta ? item.meta : {};
  var label = item && typeof item.label === "string" ? item.label.trim() : (item ? item.label : null);
  return label
    ? label
    : firstPrettyPianoPracticePlanToken(
        meta.exerciseName,
        meta.songTitle,
        meta.songId,
        meta.exerciseFocus,
        meta.skill,
        meta.exerciseId,
        getPianoPracticePlanItemType(item),
        item && item.type,
        "practice"
      );
}
