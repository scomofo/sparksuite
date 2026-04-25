/* PianoSpark - Practice tab (home page) */

function pianoPracticeCardTextToken(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  var text = String(value).trim();
  if (!text) return "";
  var lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function pianoFirstPracticeCardTextToken() {
  for (var i = 0; i < arguments.length; i++) {
    var text = pianoPracticeCardTextToken(arguments[i]);
    if (text) return text;
  }
  return "";
}

function pianoNormalizePracticeNumber(value, fallback) {
  var num = typeof value === "number" ? value : Number(value);
  return isFinite(num) ? num : fallback;
}

function pianoGetActiveGuidedSessionView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  var view = core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
  return view &&
    view.plan &&
    view.plan.flow === "guided_session" &&
    view.runtimeState &&
    view.runtimeState.activeScreen === "guided_session"
    ? view
    : null;
}

function pianoGetActiveGuidedSessionNum() {
  var view = pianoGetActiveGuidedSessionView();
  var context = view && view.plan && view.plan.context ? view.plan.context : null;
  if (!view) return null;
  if (context && context.guidedSession != null) return pianoNormalizePracticeNumber(context.guidedSession, null);
  if (view.plan.lesson && view.plan.lesson.num != null) return pianoNormalizePracticeNumber(view.plan.lesson.num, null);
  return null;
}

function pianoSessionStepRuntimeLabel(step, phase) {
  if (step === "victoryLap") return "In progress - Cooldown block";
  if (step === "songSlice") return "In progress - Song block";
  if (step === "review") return "In progress - Review pass";
  if (step === "newMove") {
    if (pianoFirstPracticeCardTextToken(phase)) return "In progress - " + pianoFirstPracticeCardTextToken(phase);
    return "In progress - Drill block";
  }
  return "In progress - Warm engine";
}

function pianoGetGuidedSessionDurationMin(session, fallbackSec) {
  var totalSec = pianoNormalizePracticeNumber(fallbackSec, 0);
  var blocks = session && Array.isArray(session.blocks) ? session.blocks : [];
  var i;
  if (session && session.target_duration_min) return pianoNormalizePracticeNumber(session.target_duration_min, 0);
  if (!totalSec && blocks.length) {
    for (i = 0; i < blocks.length; i++) {
      totalSec += pianoNormalizePracticeNumber(blocks[i] && blocks[i].duration_sec, 0);
    }
  }
  return totalSec > 0 ? Math.max(1, Math.round(totalSec / 60)) : 0;
}

function pianoGetGuidedPrimaryNewElement(session) {
  var elements = session && Array.isArray(session.new_elements) ? session.new_elements : [];
  return pianoFirstPracticeCardTextToken(elements[0]);
}

function pianoBuildGuidedSessionSummary(sourcePlan, runtimeState, options) {
  var opts = options || {};
  return {
    title: pianoFirstPracticeCardTextToken(sourcePlan && sourcePlan.title, opts.fallbackTitle || "Guided session"),
    level: pianoNormalizePracticeNumber(sourcePlan && sourcePlan.level, pianoNormalizePracticeNumber(opts.level, 1)),
    blockCount: sourcePlan && Array.isArray(sourcePlan.blocks) ? sourcePlan.blocks.length : 0,
    targetDurationMin: pianoGetGuidedSessionDurationMin(sourcePlan, opts.guidedShellDurationSec),
    focusSong: pianoFirstPracticeCardTextToken(sourcePlan && sourcePlan.focus_song),
    newElement: pianoGetGuidedPrimaryNewElement(sourcePlan),
    isActive: !!opts.isActive,
    statusLabel: runtimeState ? pianoSessionStepRuntimeLabel(runtimeState.guidedStep || "spark", runtimeState.guidedNewMovePhase || null) : ""
  };
}

function pianoGetGuidedShellBits(summary) {
  var bits = [];
  if (summary && summary.blockCount > 0) bits.push(summary.blockCount + " blocks");
  if (summary && summary.targetDurationMin > 0) bits.push(summary.targetDurationMin + " min shell");
  return bits;
}

function pianoGetGuidedShellLabel(summary, fallbackText) {
  var bits = pianoGetGuidedShellBits(summary);
  var fallback = pianoFirstPracticeCardTextToken(fallbackText);
  return bits.length ? bits.join(" • ") : fallback;
}

function pianoGetGuidedShellBadge(summary) {
  if (summary && summary.blockCount > 0) return summary.blockCount + " blocks";
  if (summary && summary.targetDurationMin > 0) return summary.targetDurationMin + " min shell";
  return "Guided shell";
}

function pianoRenderGuidedSummaryMeta(summary, options) {
  var opts = options || {};
  var mutedClass = opts.mutedClass || "text-muted";
  var marginStyle = opts.marginStyle || "margin-top:4px";
  var shellLabel = "";
  var html = "";
  if (!summary) return html;
  if (summary.statusLabel) html += '<div class="' + mutedClass + '" style="' + marginStyle + '">' + escHTML(summary.statusLabel) + '</div>';
  shellLabel = pianoGetGuidedShellLabel(summary, opts.shellFallbackText || "");
  if (shellLabel) html += '<div class="' + mutedClass + '" style="' + marginStyle + '">' + escHTML(shellLabel) + '</div>';
  if (summary.focusSong) html += '<div class="' + mutedClass + '" style="' + marginStyle + '">Song hook: ' + escHTML(summary.focusSong) + '</div>';
  if (summary.newElement) html += '<div class="' + mutedClass + '" style="' + marginStyle + '">New move: ' + escHTML(summary.newElement) + '</div>';
  return html;
}

function pianoRenderGuidedFlowCard(summary, options) {
  var opts = options || {};
  var cardClass = opts.cardClass || "card mb16";
  var cardStyle = opts.cardStyle || "border:2px solid var(--accent)";
  var mutedClass = opts.mutedClass || "muted";
  var summaryTitleStyle = opts.summaryTitleStyle || "font-size:14px;font-weight:800;margin-top:4px";
  var h = '';
  if (!summary) return h;
  h += '<div class="' + cardClass + '" style="' + cardStyle + '">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px">';
  h += '<div style="font-size:15px;font-weight:800">Guided Session Flow</div>';
  h += '<div class="' + mutedClass + '">' + escHTML(pianoGetGuidedShellBadge(summary)) + '</div>';
  h += '</div>';
  h += '<div class="' + mutedClass + '" style="margin-bottom:10px">Your live guided shell is the plan right now.</div>';
  h += '<div style="padding:10px 12px;border-radius:14px;background:rgba(78,205,196,.12);margin-bottom:10px">';
  h += '<div style="font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)">Guided Session Live</div>';
  h += '<div style="' + summaryTitleStyle + '">' + escHTML(summary.title) + '</div>';
  h += pianoRenderGuidedSummaryMeta(summary, { mutedClass: mutedClass, marginStyle: "margin-top:4px", shellFallbackText: "Shell details loading" });
  h += '</div>';
  h += '<button class="btn" onclick="act(\'resume_guided_session\')" style="background:var(--accent);color:#fff;font-weight:700">Resume Guided Session</button>';
  h += '</div>';
  return h;
}

function pianoGetQuickStartGuidedSummary(plan) {
  var activeView = pianoGetActiveGuidedSessionView();
  var activeContext = activeView && activeView.plan && activeView.plan.context ? activeView.plan.context : null;
  var activePlan = activeContext && activeContext.guidedPlan ? activeContext.guidedPlan : null;
  var activeSessionNum = pianoGetActiveGuidedSessionNum();
  var sessionNum = pianoNormalizePracticeNumber(plan && plan.num, null);
  var useActivePlan = !!(activePlan && activeSessionNum != null && sessionNum != null && activeSessionNum === sessionNum);
  var sourcePlan = useActivePlan ? activePlan : plan;
  var runtimeState = useActivePlan && activeView && activeView.runtimeState ? activeView.runtimeState : null;
  return pianoBuildGuidedSessionSummary(sourcePlan, runtimeState, {
    level: pianoNormalizePracticeNumber(plan && plan.level, 1),
    guidedShellDurationSec: activeContext && activeContext.guidedShellDurationSec,
    isActive: useActivePlan,
    fallbackTitle: "Guided session"
  });
}

function pianoPracticeTab() {
  var inst = typeof getPianoPageInstrument === "function" ? getPianoPageInstrument() : (SparkInstruments.getActive ? SparkInstruments.getActive() : null);
  var D = inst && inst.getData ? inst.getData() : {};
  var CURRICULUM = D.CURRICULUM || [];
  var BADGES = D.BADGES || [];
  var html = '';
  var practiceIntention = pianoFirstPracticeCardTextToken(S.practiceIntention);

  // If-then intention reminder (stickiness #2)
  if (practiceIntention && !S.focusMode) {
    html += pianoIfThenCard("When I " + practiceIntention + ", I will open PianoSpark.");
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
    var guidedSummary = pianoGetQuickStartGuidedSummary(plan);
    var sessionTitle = guidedSummary.title;
    var levelTitle = pianoFirstPracticeCardTextToken(CURRICULUM[guidedSummary.level - 1] && CURRICULUM[guidedSummary.level - 1].title, "Level");
    var shouldResumeGuided = guidedSummary.isActive;
    var guidedMetaHtml = pianoRenderGuidedSummaryMeta(guidedSummary, {
      mutedClass: "text-muted",
      marginStyle: "margin-top:4px",
      shellFallbackText: "Guided shell"
    });
    html += pianoClickableDiv(
      "act('" + (shouldResumeGuided ? "resume_guided_session" : "start_guided_session") + "')",
      '<h3>Session ' + plan.num + ': ' + escHTML(sessionTitle) + '</h3>' +
      '<p>Level ' + guidedSummary.level + ' \u2022 ' + escHTML(levelTitle) + '</p>' +
      guidedMetaHtml,
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
    html += '<div class="' + cls + '" style="color:' + color + ';background:' + color + '15"' + (isLocked ? '' : ' role="button" tabindex="0" onclick="act(\'view_level\',' + lvl.num + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'view_level\',' + lvl.num + ')}"') + '>';
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
  var viewedLevelTitle = pianoFirstPracticeCardTextToken(viewedLvl && viewedLvl.title, "Level");
  var viewedLevelDesc = pianoFirstPracticeCardTextToken(viewedLvl && viewedLvl.desc, "Keep going.");
  var viewedLevelTip = pianoFirstPracticeCardTextToken(viewedLvl && viewedLvl.tip);
  html += '<div class="card">';
  html += '<h3 style="color:' + levelColor(viewedLvl.num) + '">' + viewedLvl.icon + ' Level ' + viewedLvl.num + ': ' + escHTML(viewedLevelTitle) + '</h3>';
  html += '<p>' + escHTML(viewedLevelDesc) + '</p>';
  if (viewedLevelTip) {
    html += '<div class="text-muted" style="margin-bottom:12px">\u{1F4A1} ' + escHTML(viewedLevelTip) + '</div>';
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
      var setName = pianoFirstPracticeCardTextToken(set && set.name, "Custom Set");
      html += '<div class="custom-set-row">';
      html += '<button class="btn btn-sm" onclick="act(\'drill_custom\',' + i + ')">' + escHTML(setName) + ' (' + set.chords.length + ')</button>';
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
      html += '<span class="badge ' + (earned ? 'earned' : 'locked') + '" title="' + escHTML(pianoFirstPracticeCardTextToken(b.desc, "Badge")) + '">' + pianoFirstPracticeCardTextToken(b.icon, "\u{1F3C5}") + '</span>';
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
  function isCompletedPlanItem(item){
    var value = item ? item.completed : null;
    return value === true ||
      value === 1 ||
      value === "1" ||
      (typeof value === "string" && value.trim().toLowerCase() === "true");
  }
  function getPlanItemId(item){
    var id = item && typeof item.id === "string" ? item.id.trim() : null;
    var lower = id ? id.toLowerCase() : "";
    if(!id || lower === "undefined" || lower === "null" || lower === "nan") return null;
    return id;
  }
  function isRenderablePlanItem(item){
    var label = prettyPianoPracticePlanToken(item ? item.label : null);
    var type = prettyPianoPracticePlanToken(item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!prettyPianoPracticePlanToken(value);
      if (typeof value === "number" || typeof value === "boolean") return false;
      if (typeof value === "object" || typeof value === "function" || typeof value === "symbol") return false;
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
  var activeGuidedView = pianoGetActiveGuidedSessionView();
  var activeGuidedContext = activeGuidedView && activeGuidedView.plan && activeGuidedView.plan.context ? activeGuidedView.plan.context : null;
  var activeGuided = activeGuidedContext && activeGuidedContext.guidedPlan
    ? pianoGetQuickStartGuidedSummary(activeGuidedContext.guidedPlan)
    : null;

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
      var target = item && typeof item.target === "string" ? item.target.trim() : null;
      var isCompleted = isCompletedPlanItem(item);
      var done = isCompleted ? ' style="opacity:0.5;text-decoration:line-through"' : '';
      h += '<div class="row"' + done + '>';
      h += '<span>' + escHTML(getPianoPracticePlanItemLabel(item)) + (target ? ' (' + escHTML(target) + ')' : '') + '</span>';
      if(!isCompleted){
        if(itemId){
          h += '<button class="btn btn-sm" data-item-id="'+escHTML(itemId)+'" onclick="act(\'practiceStartItem\', this.getAttribute(\'data-item-id\'))">Start</button>';
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
    if (activeGuided && activeGuided.isActive) {
      h += pianoRenderGuidedFlowCard(activeGuided, {
        cardClass: "card",
        cardStyle: "margin-top:12px;border:2px solid var(--accent)",
        mutedClass: "text-muted",
        summaryTitleStyle: "font-size:13px;font-weight:800;margin-top:4px"
      });
    } else {
      h += '<div class="card" style="margin-top:12px">';
      h += '<div><b>Today\'s Practice Plan</b></div>';
      h += '<div class="text-muted">No practice plan yet.</div>';
      h += '</div>';
    }
  }

  // Progression mastery summary
  if(typeof getAverageMastery === "function"){
    var chordsMastery = pianoNormalizePracticeNumber(getAverageMastery("chords"), 0);
    var rhythmMastery = pianoNormalizePracticeNumber(getAverageMastery("rhythm"), 0);
    var transitionsMastery = pianoNormalizePracticeNumber(getAverageMastery("transitions"), 0);
    var scalesMastery = pianoNormalizePracticeNumber(getAverageMastery("scales"), 0);
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Mastery</b></div>';
    h += '<div>Chords: '+Math.round(chordsMastery*100)+'%</div>';
    h += '<div>Rhythm: '+Math.round(rhythmMastery*100)+'%</div>';
    h += '<div>Transitions: '+Math.round(transitionsMastery*100)+'%</div>';
    h += '<div>Scales: '+Math.round(scalesMastery*100)+'%</div>';
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
  var text;
  var lower;
  if(value == null) return "";
  if(typeof value !== "string" && typeof value !== "number") return "";
  text = String(value || "").replace(/_/g, " ").trim();
  if(!text) return "";
  lower = text.toLowerCase();
  if(lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
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
  var label = prettyPianoPracticePlanToken(item ? item.label : null);
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
