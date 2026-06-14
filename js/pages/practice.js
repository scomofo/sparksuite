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
  var exerciseType = meta && typeof meta.exerciseType === "string"
    ? meta.exerciseType.trim()
    : meta.exerciseType;
  if (type === "song" && meta.songId) return "performance_song";
  if (type === "practice") {
    if (meta.guidedSession != null) return "guided_session";
    if (meta.from || meta.to || meta.key) return "transition";
    if (meta.bpm != null) return "rhythm";
    if (exerciseType) return exerciseType;
    if (meta.exerciseId) return "finger";
  }
  return type;
}

function prettyPracticeSummaryToken(value) {
  var text;
  var lower;
  if (value == null) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";
  text = String(value || "").replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function normalizePracticeSummaryItemId(value) {
  var text;
  var lower;
  if (typeof value !== "string") return null;
  text = value.trim();
  if (!text) return null;
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return null;
  return text;
}

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizePracticePageNumber(value, fallback) { return SparkNormalize.number(value, fallback); }

function firstPrettyPracticeSummaryToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = prettyPracticeSummaryToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function normalizePracticeTextInputValue(value) {
  if (typeof value !== "string") return "";
  if (!prettyPracticeSummaryToken(value)) return "";
  return value;
}

// Wrapper — see js/utils/normalize.js for the canonical implementation.
// Uses strictNumber: practice goal values must come from a typed source,
// not be coerced from strings (avoids silently masking type bugs).
function normalizePracticeGoalNumber(value, fallback) { return SparkNormalize.strictNumber(value, fallback); }

function normalizePracticeGoalReached(value) {
  return value === true || value === 1 || value === "true" || value === "1";
}

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizePracticeDisplayCount(value, fallback) { return SparkNormalize.count(value, fallback); }

function getPracticeGoalMetrics() {
  var dailyGoalMinutes = normalizePracticeGoalNumber(S.dailyGoalMinutes, 10);
  var todayPracticeSeconds = normalizePracticeGoalNumber(S.todayPracticeSeconds, 0);
  var goalStreak = normalizePracticeGoalNumber(S.goalStreak, 0);
  var goalReachedToday = normalizePracticeGoalReached(S.goalReachedToday);
  var goalMins = Math.floor(todayPracticeSeconds / 60);
  var goalPct = dailyGoalMinutes > 0
    ? Math.min(100, Math.round((todayPracticeSeconds / (dailyGoalMinutes * 60)) * 100))
    : 0;
  return {
    dailyGoalMinutes: dailyGoalMinutes,
    todayPracticeSeconds: todayPracticeSeconds,
    goalStreak: goalStreak,
    goalReachedToday: goalReachedToday,
    goalMins: goalMins,
    goalPct: goalPct
  };
}

function normalizePracticeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getPracticeChordProgressValue(chordName) {
  var legacyProgress;
  var value;
  if (typeof SparkChordProgress !== "undefined" && SparkChordProgress && typeof SparkChordProgress.get === "function") {
    return normalizePracticePageNumber(SparkChordProgress.get(chordName), 0);
  }
  legacyProgress = S && S.chordProgress && typeof S.chordProgress === "object" ? S.chordProgress : null;
  value = legacyProgress ? legacyProgress[chordName] : 0;
  return normalizePracticePageNumber(value, 0);
}

function getPracticeMasteredChordCount(allChords) {
  var list = Array.isArray(allChords) ? allChords : [];
  var legacyProgress;
  var keys;
  var count = 0;
  var i;
  if (typeof SparkChordProgress !== "undefined" && SparkChordProgress && typeof SparkChordProgress.masteredCount === "function") {
    return normalizePracticeDisplayCount(SparkChordProgress.masteredCount(), 0);
  }
  legacyProgress = S && S.chordProgress && typeof S.chordProgress === "object" ? S.chordProgress : null;
  if (legacyProgress) {
    keys = Object.keys(legacyProgress);
    for (i = 0; i < keys.length; i++) {
      if (getPracticeChordProgressValue(keys[i]) >= 100) count++;
    }
    return count;
  }
  for (i = 0; i < list.length; i++) {
    if (getPracticeChordProgressValue(list[i] && list[i].name) >= 100) count++;
  }
  return count;
}

function getPracticeSummaryItemLabel(item) {
  var meta = item && item.meta ? item.meta : {};
  var label = prettyPracticeSummaryToken(item ? item.label : null);
  return label
    ? label
    : firstPrettyPracticeSummaryToken(
        meta.exerciseName,
        meta.songTitle,
        meta.songId,
        meta.exerciseFocus,
        meta.skill,
        meta.exerciseId,
        getPracticeSummaryItemType(item),
        item && item.type,
        "practice"
      );
}

function getPracticeSummaryItemDesc(item) {
  var meta = item && item.meta ? item.meta : {};
  var parts = [];
  var instrument = prettyPracticeSummaryToken(meta.instrument);
  var exerciseFocus = prettyPracticeSummaryToken(meta.exerciseFocus);
  var skill = prettyPracticeSummaryToken(meta.skill);
  var itemType = prettyPracticeSummaryToken(getPracticeSummaryItemType(item));
  if (instrument) parts.push(instrument);
  if (exerciseFocus) parts.push(exerciseFocus);
  else if (skill) parts.push(skill);
  if (itemType) parts.push(itemType);
  var desc = prettyPracticeSummaryToken(item ? item.desc : null);
  return desc
    ? desc
    : (parts.join(" - ") || firstPrettyPracticeSummaryToken(getPracticeSummaryItemType(item), item && item.type, "practice"));
}

function getPracticeSummaryProgress(plan) {
  var rawItems = plan && Array.isArray(plan.items) ? plan.items : [];
  var items = rawItems.filter(isRenderablePracticeSummaryItem);
  var hasSparseItems = rawItems.length !== items.length;
  var derivedTotalItems = items.length;
  var rawTotalItems = !hasSparseItems && plan && typeof plan.totalItems === "number" && Number.isInteger(plan.totalItems)
    ? plan.totalItems
    : null;
  var totalItems = rawTotalItems && rawTotalItems > 0 ? rawTotalItems : derivedTotalItems;
  var derivedCompletedItems = items.filter(isCompletedPracticeSummaryItem).length;
  var rawCompletedItems = !hasSparseItems && plan && typeof plan.completedItems === "number" && Number.isInteger(plan.completedItems)
    ? plan.completedItems
    : null;
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
  var focus = prettyPracticeSummaryToken(plan ? plan.focus : null);
  return focus ? focus : "No practice focus yet.";
}

function isCompletedPracticeSummaryItem(item) {
  var value = item ? item.completed : null;
  return value === true ||
    value === 1 ||
    value === "1" ||
    (typeof value === "string" && value.trim().toLowerCase() === "true");
}

function isRenderablePracticeSummaryItem(item) {
  var id = normalizePracticeSummaryItemId(item ? item.id : null);
  var label = prettyPracticeSummaryToken(item ? item.label : null);
  var type = prettyPracticeSummaryToken(item ? item.type : null);
  var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
    var value = item.meta[key];
    if (value == null) return false;
    if (typeof value === "string") return !!prettyPracticeSummaryToken(value);
    if (typeof value === "number") return false;
    if (typeof value === "boolean") return false;
    if (typeof value === "object" || typeof value === "function" || typeof value === "symbol") return false;
    return true;
  }));
  return !!(
    item &&
    (id ||
     label ||
     type ||
     metaHasValue)
  );
}

function hasRenderablePracticeSummaryItems(plan) {
  return !!(plan && Array.isArray(plan.items) && plan.items.some(isRenderablePracticeSummaryItem));
}

function getPracticeHeroProgress(inst, data) {
  var instrumentType = getPracticePageInstrumentType(inst);
  var allChords = data && data.ALL_CHORDS;
  var lessons;
  var count = 0;
  var mastered = 0;
  var label = "chords";

  if (Array.isArray(allChords) && allChords.length) {
    return {
      mastered: getPracticeMasteredChordCount(allChords),
      count: allChords.length,
      label: "chords"
    };
  }

  if (allChords && typeof allChords === "object") {
    count = Object.keys(allChords).length;
    if (count > 0) {
      return {
        mastered: getPracticeMasteredChordCount(Object.keys(allChords)),
        count: count,
        label: "chords"
      };
    }
  }

  if (inst && typeof inst.getLessons === "function") {
    try { lessons = inst.getLessons() || []; } catch (e) { lessons = []; }
  }
  if ((!lessons || !lessons.length) && data && Array.isArray(data.CURRICULUM)) {
    lessons = data.CURRICULUM;
  }

  if (Array.isArray(lessons) && lessons.length) {
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i] && S.completedLessons && S.completedLessons.indexOf(lessons[i].id) >= 0) mastered++;
    }
    if (instrumentType === "drums") label = "lessons";
    else if (instrumentType === "vocals") label = "lessons";
    else label = "items";
    return { mastered: mastered, count: lessons.length, label: label };
  }

  return { mastered: 0, count: 0, label: "items" };
}

function renderSv2HomeHero(inst, levelName, currentLevel, currentXp, currentStreak, progress) {
  var instTabs = inst.tabs || [];
  var hasSongs = false;
  var hasDrill = false;
  var ti;
  var tabId;
  var h = '<div class="sv2-home-hero sv2-anim-hero">';
  h += '<div class="sv2-home-hero__header">';
  h += '<div class="sv2-icon sv2-icon--lg sv2-anim-glow">' + (inst.icon || "\uD83C\uDFB8") + '</div>';
  h += '<div class="sv2-home-hero__info">';
  h += '<h2 class="sv2-home-hero__name">' + escHTML(inst.name) + '</h2>';
  h += '<div class="sv2-home-hero__level">' + escHTML(levelName) + ' &mdash; Level ' + currentLevel + '</div>';
  h += '<div class="sv2-home-hero__badges">';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.1s">' + currentXp + ' XP</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.15s;background:rgba(255,215,61,0.12);color:#ffd93d">\uD83D\uDD25 ' + currentStreak + '</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.2s;background:rgba(107,203,119,0.12);color:#6bcb77">' + progress.mastered + '/' + progress.count + ' ' + escHTML(progress.label) + '</span>';
  h += '</div></div></div>';
  for (ti = 0; ti < instTabs.length; ti++) {
    tabId = typeof instTabs[ti] === "string" ? instTabs[ti] : instTabs[ti].id;
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
  return h;
}

function renderSv2InstrumentRow(activeInstrumentId, allInstruments) {
  var otherInstruments = [];
  var j;
  var h = "";
  for (j = 0; j < allInstruments.length; j++) {
    if (allInstruments[j].id !== activeInstrumentId && allInstruments[j].available !== false) {
      otherInstruments.push(allInstruments[j]);
    }
  }
  if (!otherInstruments.length) return h;
  h += '<div class="sv2-inst-row sv2-anim-stagger-1">';
  for (j = 0; j < otherInstruments.length; j++) {
    var oi = otherInstruments[j];
    var oiColor = typeof SparkTheme !== "undefined" ? SparkTheme.getColor(getPracticePageInstrumentType(oi)) : "#888";
    h += '<div class="sv2-inst-row__item" role="button" tabindex="0" onclick="act(\'switchInstrument\',\'' + oi.id + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();act(\'switchInstrument\',\'' + oi.id + '\')}">';
    h += '<div class="sv2-icon sv2-icon--sm" style="background:' + oiColor + '">' + (oi.icon || "\uD83C\uDFB5") + '</div>';
    h += '<div style="font-size:' + 'var(--text-micro)' + ';color:' + oiColor + ';font-weight:700;font-family:var(--font-body-v2)">' + escHTML(oi.name) + '</div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function renderSv2DailyGoal(goalMetrics) {
  var goalPct = goalMetrics.goalPct;
  var goalMins = goalMetrics.goalMins;
  var ringR = 16;
  var ringC = 2 * Math.PI * ringR;
  var ringOff = ringC - (goalPct / 100) * ringC;
  var h = '<div class="sv2-daily-goal sv2-anim-stagger-2">';
  h += '<div class="sv2-ring" style="width:40px;height:40px">';
  h += '<svg width="40" height="40" style="transform:rotate(-90deg)"><circle cx="20" cy="20" r="' + ringR + '" fill="none" stroke="var(--border)" stroke-width="4"/>';
  h += '<circle cx="20" cy="20" r="' + ringR + '" fill="none" stroke="var(--inst-primary)" stroke-width="4" stroke-dasharray="' + ringC + '" stroke-dashoffset="' + ringOff + '" stroke-linecap="round" style="transition:stroke-dashoffset 0.8s ease"/></svg>';
  h += '<div class="sv2-ring__label" style="font-size:10px">' + goalPct + '%</div>';
  h += '</div>';
  h += '<div style="flex:1">';
  h += '<div style="font-size:var(--text-caption);font-weight:700;color:var(--text-primary);font-family:var(--font-body-v2)">' + (goalMetrics.goalReachedToday ? "\u2705 Goal reached!" : "Daily Goal: " + goalMetrics.dailyGoalMinutes + " min") + '</div>';
  h += '<div style="font-size:var(--text-micro);color:var(--text-muted)">' + goalMins + ' / ' + goalMetrics.dailyGoalMinutes + ' min today' + (goalMetrics.goalStreak > 0 ? " &middot; \uD83D\uDD25 " + goalMetrics.goalStreak + " day streak" : "") + '</div>';
  h += '</div></div>';
  return h;
}

function renderHomeTabBar(instTabs) {
  var h = '<div class="tabs" role="tablist">';
  var i;
  for (i = 0; i < instTabs.length; i++) {
    var t = instTabs[i];
    var tid = typeof t === "string" ? t : t.id;
    var ticon = typeof t === "object" && t.icon ? t.icon : "";
    var tlabel = typeof t === "object" && t.label ? t.label : tid.charAt(0).toUpperCase() + tid.slice(1);
    h += '<button class="tab' + (S.tab === tid ? " active" : "") + '" onclick="act(\'tab\',\'' + tid + '\')" role="tab" aria-selected="' + (S.tab === tid) + '" aria-label="' + tlabel + ' tab"><span class="tab-icon">' + ticon + '</span><span class="tab-label">' + tlabel + '</span></button>';
  }
  h += '</div>';
  return h;
}

function getSharedHomeTabRenderers() {
  var sharedPractice = typeof SparkSharedPracticeRenderers !== "undefined" ? SparkSharedPracticeRenderers : null;
  var sharedGames = typeof SparkSharedGameRenderers !== "undefined" ? SparkSharedGameRenderers : null;
  var sharedTools = typeof SparkSharedToolRenderers !== "undefined" ? SparkSharedToolRenderers : null;
  return {
    practice: typeof practiceTab === "function" ? practiceTab : null,
    drill: sharedPractice && typeof sharedPractice.drillTab === "function" ? sharedPractice.drillTab : (typeof drillTab === "function" ? drillTab : null),
    daily: sharedPractice && typeof sharedPractice.dailyTab === "function" ? sharedPractice.dailyTab : (typeof dailyTab === "function" ? dailyTab : null),
    quiz: sharedPractice && typeof sharedPractice.quizTab === "function" ? sharedPractice.quizTab : (typeof quizTab === "function" ? quizTab : null),
    ear: sharedPractice && typeof sharedPractice.earTrainTab === "function" ? sharedPractice.earTrainTab : (typeof earTrainTab === "function" ? earTrainTab : null),
    strum: typeof strumTab === "function" ? strumTab : null,
    songs: typeof songsTab === "function" ? songsTab : null,
    rhythm: sharedGames && typeof sharedGames.rhythmTab === "function" ? sharedGames.rhythmTab : (typeof rhythmTab === "function" ? rhythmTab : null),
    runner: sharedGames && typeof sharedGames.runnerTab === "function" ? sharedGames.runnerTab : (typeof runnerTab === "function" ? runnerTab : null),
    build: sharedGames && typeof sharedGames.buildTab === "function" ? sharedGames.buildTab : (typeof buildTab === "function" ? buildTab : null),
    tuner: sharedTools && typeof sharedTools.tunerTab === "function" ? sharedTools.tunerTab : (typeof tunerTab === "function" ? tunerTab : null),
    dual: typeof dualTab === "function" ? dualTab : null,
    stats: sharedTools && typeof sharedTools.statsTab === "function" ? sharedTools.statsTab : (typeof statsTab === "function" ? statsTab : null),
    guide: sharedTools && typeof sharedTools.guideTab === "function" ? sharedTools.guideTab : (typeof guideTab === "function" ? guideTab : null),
    games: typeof gamesTab === "function" ? gamesTab : null,
    tools: typeof toolsTab === "function" ? toolsTab : null
  };
}

function resolveHomeTabRenderer(inst, tabId) {
  var instrumentRenderers = inst && inst.tabRenderers ? inst.tabRenderers : {};
  var sharedRenderers = getSharedHomeTabRenderers();
  return instrumentRenderers[tabId] || sharedRenderers[tabId] || null;
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
  var currentLevel = normalizePracticeDisplayCount(S.level, 1);
  var currentXp = normalizePracticeDisplayCount(S.xp, 0);
  var currentStreak = normalizePracticeDisplayCount(S.streak, 0);
  var levelName = levelNames[currentLevel] || ("Level " + currentLevel);
  var heroProgress = getPracticeHeroProgress(inst, D);

  var goalMetrics = getPracticeGoalMetrics();
  var h = '';
  h += renderSv2HomeHero(inst, levelName, currentLevel, currentXp, currentStreak, heroProgress);
  h += renderSv2InstrumentRow(inst.id, allInstruments);
  h += renderSv2DailyGoal(goalMetrics);

  return h;
}

function homePage(){
  // V2 Dashboard
  var v2Home = typeof sv2HomeDashboard === "function" && document.body.classList.contains("sv2") ? sv2HomeDashboard() : "";

  // Build tab bar from active instrument's tabs array
  var inst = getPracticePageInstrument();
  var instTabs = inst && inst.tabs ? inst.tabs : [];
  var h = renderHomeTabBar(instTabs);

  // Route to tab content — check instrument-specific renderer first, then shared
  var _renderer = resolveHomeTabRenderer(inst, S.tab);
  if (_renderer) h += _renderer();
  // Desktop two-pane: dashboard rail left, tab content right (desktop.css).
  // Below 1100px the wrappers are display:contents — layout is unchanged.
  if (v2Home) {
    return '<div class="home-split"><div class="home-rail">' + v2Home + '</div><div class="home-main">' + h + '</div></div>';
  }
  return v2Home + h;
}

function renderPracticeSectionStack(title, subtitle, sections, emptyCopy) {
  var h = '<div class="home-section-stack">';
  var rendered = 0;
  var i;
  var section;
  var body;
  h += '<div class="card mb12"><div style="font-size:18px;font-weight:900;color:var(--text-primary)">' + escHTML(title) + '</div>';
  h += '<div class="muted" style="margin-top:4px">' + escHTML(subtitle) + '</div></div>';
  for (i = 0; i < sections.length; i++) {
    section = sections[i];
    if (!section || typeof section.render !== "function") continue;
    body = section.render();
    if (!body) continue;
    rendered++;
    h += '<section class="home-section-stack__item" aria-label="' + escHTML(section.label) + '">' + body + '</section>';
  }
  if (!rendered) {
    h += '<div class="card"><div class="muted">' + escHTML(emptyCopy) + '</div></div>';
  }
  h += '</div>';
  return h;
}

function gamesTab(){
  return renderPracticeSectionStack("Games", "Skill games use your current instrument data and shared runtime state.", [
    { label: "Rhythm game", render: typeof rhythmTab === "function" ? rhythmTab : null },
    { label: "Chord runner", render: typeof runnerTab === "function" ? runnerTab : null },
    { label: "Progression builder", render: typeof buildTab === "function" ? buildTab : null }
  ], "No game modules loaded yet.");
}

function toolsTab(){
  return renderPracticeSectionStack("Tools", "Utilities reflect the active instrument, profile, and runtime state.", [
    { label: "Tuner", render: typeof tunerTab === "function" ? tunerTab : null },
    { label: "Practice stats", render: typeof statsTab === "function" ? statsTab : null },
    { label: "Guide", render: typeof guideTab === "function" ? guideTab : null }
  ], "No tool modules loaded yet.");
}

function getPracticeCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function resolvePracticeCoreDailyPlan(coreView) {
  var corePlan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? coreView.plan
    : null;
  var bridgedPlan;
  if (!corePlan) return null;
  if (window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function") {
    bridgedPlan = SparkPracticeBridge.toLegacyPlan(corePlan);
    if (bridgedPlan) return bridgedPlan;
  }
  if (corePlan._legacyPlan) return corePlan._legacyPlan;
  return Array.isArray(corePlan.items) ? corePlan : null;
}

function resolvePracticeSummaryPlan() {
  var coreView = getPracticeCoreView();
  var plan = resolvePracticeCoreDailyPlan(coreView);
  return plan || S.practicePlan;
}

function renderPracticeGoalCard(practiceGoalMetrics) {
  // The daily-goal ring + progress already shows in the persistent home glance
  // (renderSv2DailyGoal) above the tabs, so this card is just the goal SELECTOR
  // — repeating the ring/progress here duplicated it on the Practice tab.
  var goals = [5, 10, 15, 20, 30];
  var h = '<div class="card mb12"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div style="font-size:13px;font-weight:700;color:var(--text-primary)">Adjust daily goal</div><div style="display:flex;gap:4px;margin-left:auto">';
  for(var i=0;i<goals.length;i++){
    h += '<button onclick="act(\'setGoal\',\''+goals[i]+'\')" aria-label="Set daily goal to '+goals[i]+' minutes" style="width:28px;height:28px;border-radius:8px;font-size:11px;font-weight:700;background:'+(practiceGoalMetrics.dailyGoalMinutes===goals[i]?"#4ECDC4":"var(--input-bg)")+';color:'+(practiceGoalMetrics.dailyGoalMinutes===goals[i]?"#fff":"var(--text-muted)")+'">'+goals[i]+'</button>';
  }
  h += '</div></div></div>';
  return h;
}

function renderPracticeGuidedSessionCard(D) {
  var gs = getPracticeGuidedSessionSummary(D);
  var completedGuidedSessions;
  var gsDone;
  var totalSessions;
  var shellBits = [];
  var statusLabel = "";
  var buttonLabel;
  var h = "";
  if(!gs) return h;
  completedGuidedSessions = normalizePracticeArray(S.completedGuidedSessions);
  gsDone = normalizePracticeDisplayCount(gs.completedCount, completedGuidedSessions.length);
  totalSessions = normalizePracticeDisplayCount(gs.totalSessions, Array.isArray(D.SESSIONS) ? D.SESSIONS.length : 0);
  if (gs.blockCount > 0) shellBits.push(gs.blockCount + " blocks");
  if (gs.targetDurationMin > 0) shellBits.push(gs.targetDurationMin + " min shell");
  if (gs.isActive) {
    statusLabel = getPracticeGuidedRuntimeLabel(gs);
  }
  buttonLabel = gs.isActive
    ? (gs.targetDurationMin > 0 ? ("Resume " + gs.targetDurationMin + "-Min Session") : "Resume Session")
    : (gs.targetDurationMin > 0 ? ("Start " + gs.targetDurationMin + "-Min Session") : "Start Session");
  h += '<div class="card mb12" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);border:none;text-align:center;padding:16px">';
  h += '<div style="font-size:24px;margin-bottom:4px">&#127919;</div>';
  h += '<div class="practice-quick-title" style="font-size:15px">Guided Session '+gs.num+'</div>';
  h += '<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 10px">'+escHTML(gs.title)+' &bull; Level '+gs.level+' &bull; '+gsDone+'/'+totalSessions+' done</div>';
  if (statusLabel) {
    h += '<div class="guided-status-line" style="color:#fff;margin:-2px 0 8px">' + escHTML(statusLabel) + '</div>';
  }
  if (shellBits.length) {
    h += '<div class="guided-status-line" style="color:#fff;margin:-2px 0 8px">' + escHTML(shellBits.join(' • ')) + '</div>';
  }
  if (gs.focusSong) {
    h += '<div style="font-size:12px;color:rgba(255,255,255,.92);margin:0 0 6px">Song hook: ' + escHTML(gs.focusSong) + '</div>';
  }
  if (gs.newElement) {
    h += '<div style="font-size:12px;color:rgba(255,255,255,.82);margin:0 0 10px">New move: ' + escHTML(gs.newElement) + '</div>';
  }
  h += '<button onclick="act(\'' + (gs.isActive ? 'resume_guided_session' : 'start_guided_session') + '\')" style="background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 28px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">' + escHTML(buttonLabel) + ' &#9654;</button>';
  h += '</div>';
  return h;
}

function getPracticeGuidedPrimaryNewElement(newElements) {
  return Array.isArray(newElements) && newElements.length && typeof newElements[0] === "string"
    ? newElements[0]
    : "";
}

function getPracticeGuidedRuntimeLabel(summary) {
  if (!summary || !summary.isActive) return "";
  if (summary.guidedStep === "victoryLap") return "In progress - Cooldown block";
  if (summary.guidedStep === "songSlice") return "In progress - Song block";
  if (summary.guidedStep === "review") return "In progress - Review pass";
  if (summary.guidedStep === "newMove") {
    if (summary.guidedNewMovePhase) {
      return "In progress - " + summary.guidedNewMovePhase;
    }
    return "In progress - Drill block";
  }
  return "In progress - Warm engine";
}

function getPracticeGuidedShellBits(summary) {
  var bits = [];
  if (summary && normalizePracticeDisplayCount(summary.blockCount, 0) > 0) {
    bits.push(normalizePracticeDisplayCount(summary.blockCount, 0) + " blocks");
  }
  if (summary && normalizePracticeDisplayCount(summary.targetDurationMin, 0) > 0) {
    bits.push(normalizePracticeDisplayCount(summary.targetDurationMin, 0) + " min shell");
  }
  return bits;
}

function getPracticeGuidedShellLabel(summary, fallbackLabel) {
  var bits = getPracticeGuidedShellBits(summary);
  var fallback = prettyPracticeSummaryToken(fallbackLabel);
  return bits.length ? bits.join(" • ") : fallback;
}

function getPracticeGuidedStatusWithShell(summary, options) {
  var opts = options || {};
  var status = prettyPracticeSummaryToken(opts.statusLabel != null ? opts.statusLabel : (summary && summary.statusLabel));
  var shellLabel = getPracticeGuidedShellLabel(summary, opts.shellFallback);
  if (opts.trimProgressPrefix && status.indexOf("In progress - ") === 0) {
    status = status.slice("In progress - ".length);
  }
  if (status && shellLabel) return status + " • " + shellLabel;
  return status || shellLabel;
}

function getPracticeTrackSessionShellLabel(session, fallbackLabel) {
  var blockCount = Array.isArray(session && session.blocks) ? session.blocks.length : 0;
  var durationMin = getPracticeGuidedSessionDurationMin(session, 0);
  var bits = [];
  var fallback = prettyPracticeSummaryToken(fallbackLabel) || "Shell details loading";
  if (blockCount > 0) bits.push(blockCount + " blocks");
  if (durationMin > 0) bits.push(durationMin + " min shell");
  return bits.length ? bits.join(" • ") : fallback;
}

function getPracticeActiveGuidedSummary() {
  var coreView = getPracticeCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var guidedContext = coreView && coreView.plan && coreView.plan.context ? coreView.plan.context : null;
  var guidedPlan = coreView
    && coreView.plan
    && coreView.plan.flow === "guided_session"
    && guidedContext
    ? guidedContext.guidedPlan || null
    : null;
  if (!guidedPlan || !runtimeState || runtimeState.activeScreen !== "guided_session") return null;
  return {
    num: guidedPlan.num || guidedPlan.day || 1,
    title: guidedPlan.title || guidedPlan.id || "Guided Session",
    blockCount: Array.isArray(guidedPlan.blocks) ? guidedPlan.blocks.length : 0,
    targetDurationMin: getPracticeGuidedSessionDurationMin(guidedPlan, guidedContext && guidedContext.guidedShellDurationSec),
    guidedStep: runtimeState.guidedStep || "spark",
    guidedNewMovePhase: runtimeState.guidedNewMovePhase || null,
    statusLabel: getPracticeGuidedRuntimeLabel({
      isActive: true,
      guidedStep: runtimeState.guidedStep || "spark",
      guidedNewMovePhase: runtimeState.guidedNewMovePhase || null
    })
  };
}

function getPracticeGuidedSessionDurationMin(session, fallbackSec) {
  var totalSec = normalizePracticeDisplayCount(fallbackSec, 0);
  var blocks = session && Array.isArray(session.blocks) ? session.blocks : [];
  var i;
  if (session && session.target_duration_min) {
    return normalizePracticeDisplayCount(session.target_duration_min, 0);
  }
  if (!totalSec && blocks.length) {
    for (i = 0; i < blocks.length; i++) {
      totalSec += normalizePracticeDisplayCount(blocks[i] && blocks[i].duration_sec, 0);
    }
  }
  return totalSec > 0 ? Math.max(1, Math.round(totalSec / 60)) : 0;
}

function getPracticeGuidedSessionSummary(D) {
  var guidedIndex = Math.max(0, normalizePracticeDisplayCount(S.guidedSession, 1) - 1);
  var sessions = D && Array.isArray(D.SESSIONS) ? D.SESSIONS : [];
  var coreView;
  var runtimeState;
  var guidedPlan;
  var guidedContext;
  var instrumentType;
  var summary;
  var nextSession;
  if (sessions[guidedIndex]) {
    return {
      num: sessions[guidedIndex].num || (guidedIndex + 1),
      title: sessions[guidedIndex].title || "Guided Session",
      level: sessions[guidedIndex].level || 1,
      blockCount: Array.isArray(sessions[guidedIndex].blocks) ? sessions[guidedIndex].blocks.length : 0,
      targetDurationMin: getPracticeGuidedSessionDurationMin(sessions[guidedIndex], 0),
      focusSong: sessions[guidedIndex].focus_song || "",
      newElement: getPracticeGuidedPrimaryNewElement(sessions[guidedIndex].new_elements),
      completedCount: normalizePracticeArray(S.completedGuidedSessions).length,
      totalSessions: sessions.length
    };
  }
  coreView = getPracticeCoreView();
  runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  guidedContext = coreView && coreView.plan && coreView.plan.context ? coreView.plan.context : null;
  guidedPlan = coreView
    && coreView.plan
    && coreView.plan.flow === "guided_session"
    && guidedContext
    ? guidedContext.guidedPlan || null
    : null;
  if (guidedPlan) {
    return {
      num: guidedPlan.num || guidedPlan.day || (guidedIndex + 1),
      title: guidedPlan.title || guidedPlan.id || "Guided Session",
      level: guidedPlan.level || 1,
      blockCount: Array.isArray(guidedPlan.blocks) ? guidedPlan.blocks.length : 0,
      targetDurationMin: getPracticeGuidedSessionDurationMin(guidedPlan, guidedContext && guidedContext.guidedShellDurationSec),
      focusSong: guidedPlan.focus_song || "",
      newElement: getPracticeGuidedPrimaryNewElement(guidedPlan.new_elements),
      completedCount: normalizePracticeDisplayCount(guidedContext && guidedContext.completedGuidedSessions, 0),
      isActive: runtimeState && runtimeState.activeScreen === "guided_session",
      guidedStep: runtimeState && runtimeState.guidedStep ? runtimeState.guidedStep : "spark",
      guidedNewMovePhase: runtimeState && runtimeState.guidedNewMovePhase ? runtimeState.guidedNewMovePhase : null,
      totalSessions: guidedContext.totalGuidedSessions || 0
    };
  }
  instrumentType = getPracticePageInstrumentType(getPracticePageInstrument());
  if (window.SparkCurriculumV2 && typeof SparkCurriculumV2.getTrackSummary === "function") {
    summary = SparkCurriculumV2.getTrackSummary(instrumentType);
    nextSession = summary && summary.nextSession ? summary.nextSession : null;
    if (nextSession) {
      return {
        num: nextSession.day || guidedIndex + 1,
        title: nextSession.title || nextSession.id || "Guided Session",
        level: nextSession.level || 1,
        blockCount: Array.isArray(nextSession.blocks) ? nextSession.blocks.length : 0,
        targetDurationMin: getPracticeGuidedSessionDurationMin(nextSession, 0),
        focusSong: nextSession.focus_song || "",
        newElement: getPracticeGuidedPrimaryNewElement(nextSession.new_elements),
        completedCount: summary.completedCount || 0,
        totalSessions: summary.sessionCount || 0
      };
    }
  }
  return null;
}

function getPracticeActiveShellSummary() {
  if (typeof SparkSessionShellUI === "undefined" || !SparkSessionShellUI || typeof SparkSessionShellUI.buildDailyShellSummary !== "function") {
    return null;
  }
  return SparkSessionShellUI.buildDailyShellSummary(getPracticeCoreView(), {
    focusFormatter: function(plan) {
      return prettyPracticeSummaryToken(plan && plan.focus) || "Practice Session";
    },
    segmentFormatter: function(segment) {
      return prettyPracticeSummaryToken(segment && segment.label) || firstPrettyPracticeSummaryToken(segment && segment.type, "practice block");
    },
    fallbackTitle: "Practice Session",
    fallbackSegmentLabel: "practice block"
  });
}

function isPracticeCurriculumReviewSession(session) {
  var title = session && typeof session.title === "string" ? session.title.toLowerCase() : "";
  var focusSong = session && typeof session.focus_song === "string" ? session.focus_song.toLowerCase() : "";
  return title.indexOf("review") >= 0 || focusSong === "user picks";
}

function getPracticeTrackCadenceLabel(summary, nextSession, followupSession) {
  if (!nextSession) return "Track complete";
  if (isPracticeCurriculumReviewSession(nextSession)) return "Review day now";
  if (followupSession && isPracticeCurriculumReviewSession(followupSession)) return "Review day after this session";
  if (summary.completedCount <= 0) return "Fresh start";
  if (summary.completedCount >= Math.max(0, summary.sessionCount - 2)) return "Showcase runway";
  return "New move day";
}

function getPracticeTrackMomentumCopy(summary, nextSession, followupSession) {
  if (!nextSession) return "Every Phase 1 session is already in the bank.";
  if (summary.completedCount <= 0) return "Day 1 is ready when you are.";
  if (isPracticeCurriculumReviewSession(nextSession)) return "You have enough in the bank to slow down and consolidate.";
  if (followupSession && isPracticeCurriculumReviewSession(followupSession)) {
    return "One more push and then you get a review day.";
  }
  return "You've banked " + summary.completedCount + " sessions. Day " + (nextSession.day || "?") + " is next.";
}

function getPracticeTrackSessionByDay(track, dayNumber) {
  var sessions = track && Array.isArray(track.sessions) ? track.sessions : [];
  var normalizedDay = normalizePracticeDisplayCount(dayNumber, 0);
  var i;
  for (i = 0; i < sessions.length; i++) {
    if (normalizePracticeDisplayCount(sessions[i] && (sessions[i].day || sessions[i].num), 0) === normalizedDay) {
      return {
        index: i,
        session: sessions[i]
      };
    }
  }
  return null;
}

function renderPracticePlanSummaryCard(plan) {
  var activeGuided = getPracticeActiveGuidedSummary();
  var activeShell = activeGuided ? null : getPracticeActiveShellSummary();
  var h = "";
  var planProgress;
  var item;
  var isCompleted;
  var itemId;
  if(hasRenderablePracticeSummaryItems(plan)){
    planProgress = getPracticeSummaryProgress(plan);
    h += '<div class="card mb20" style="border:2px solid '+(planProgress.completedItems>=planProgress.totalItems?"#4ECDC4":"#45B7D1")+'">';
    h += '<div class="split-row" style="margin-bottom:8px">';
    h += '<h3 class="practice-card-heading">&#128221; Today\'s Practice Plan</h3>';
    h += '<span style="font-size:12px;font-weight:700;color:var(--text-muted)">'+planProgress.completedItems+'/'+planProgress.totalItems+'</span>';
    h += '</div>';
    if (activeGuided) {
      h += '<div style="margin-bottom:10px;padding:10px 12px;border-radius:14px;background:rgba(78,205,196,.12);color:var(--text-primary)">';
      h += '<div class="metric-label" style="font-size:11px;text-transform:uppercase;color:#2f8f89">Guided Session Live</div>';
      h += '<div class="card-micro-heading" style="margin-top:4px">' + escHTML(activeGuided.title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">' + escHTML(activeGuided.statusLabel + " - Resume when you're ready.") + '</div>';
      h += '</div>';
    } else if (activeShell) {
      h += SparkSessionShellUI.renderCompactSummary(activeShell, {
        label: "Practice Session Live",
        accent: "#45B7D1",
        background: "rgba(69,183,209,.12)",
        marginTop: "0"
      });
    }
    h += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">Focus: '+escHTML(getPracticeSummaryFocus(plan))+'</div>';
    for(var pi=0;pi<plan.items.length;pi++){
      item = plan.items[pi];
      if(!isRenderablePracticeSummaryItem(item)) continue;
      isCompleted = isCompletedPracticeSummaryItem(item);
      h += '<div class="practice-summary-item">';
      h += '<span style="font-size:16px">'+(isCompleted?"&#9989;":"&#9744;")+'</span>';
      h += '<div class="practice-summary-copy"><div style="font-size:13px;font-weight:700;color:'+(isCompleted?"var(--text-muted)":"var(--text-primary)")+';'+(isCompleted?"text-decoration:line-through":"")+'">'+escHTML(getPracticeSummaryItemLabel(item))+'</div>';
      h += '<div style="font-size:11px;color:var(--text-dim)">'+escHTML(getPracticeSummaryItemDesc(item))+'</div></div>';
      if(!isCompleted){
        itemId = normalizePracticeSummaryItemId(item ? item.id : null);
        if(itemId){
          h += '<button class="btn btn-sm" data-item-id="'+escHTML(itemId)+'" onclick="act(\'completePlanItem\', this.getAttribute(\'data-item-id\'))" style="background:#4ECDC4;color:#fff;font-size:11px;padding:4px 8px">Done</button>';
        }else{
          h += '<span class="text-muted">Unavailable</span>';
        }
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  }
  if (activeGuided) {
    h += '<div class="card mb20" style="border:2px solid #4ECDC4">';
    h += '<div class="split-row" style="margin-bottom:8px">';
    h += '<h3 class="practice-card-heading">&#128221; Guided Session Flow</h3>';
    h += '<span style="font-size:12px;font-weight:700;color:var(--text-muted)">' + escHTML(getPracticeGuidedShellLabel(activeGuided, "Guided shell")) + '</span>';
    h += '</div>';
    h += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">Your live guided shell is the plan right now.</div>';
    h += '<div style="padding:10px 12px;border-radius:14px;background:rgba(78,205,196,.12);margin-bottom:10px">';
    h += '<div class="card-micro-heading">' + escHTML(activeGuided.title) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:3px">' + escHTML(activeGuided.statusLabel) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:3px">' + escHTML(getPracticeGuidedShellLabel(activeGuided, "Shell details loading")) + '</div>';
    h += '</div>';
    h += '<button class="btn" onclick="act(\'resume_guided_session\')" style="background:#4ECDC4;color:#fff;font-weight:800">Resume Guided Session</button>';
    h += '</div>';
    return h;
  }
  if (activeShell) {
    h += '<div class="card mb20" style="border:2px solid #45B7D1">';
    h += '<div class="split-row" style="margin-bottom:8px">';
    h += '<h3 class="practice-card-heading">&#128221; Practice Session Live</h3>';
    h += '<span style="font-size:12px;font-weight:700;color:var(--text-muted)">' + escHTML("Block " + (activeShell.activeIndex + 1) + "/" + activeShell.blockCount) + '</span>';
    h += '</div>';
    h += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">The shared session shell is already in motion.</div>';
    h += SparkSessionShellUI.renderCompactSummary(activeShell, {
      label: "Practice Session Live",
      accent: "#45B7D1",
      background: "rgba(69,183,209,.12)",
      marginTop: "0",
      renderExtraButtons: function() {
        return '<button class="btn btn-sm" onclick="act(\'openPlan\')" style="background:var(--input-bg);color:var(--text-primary);font-size:11px;padding:4px 8px">Open Plan</button>';
      }
    });
    h += '</div>';
    return h;
  }
  h += '<div class="card mb20">';
  h += '<h3 class="practice-card-heading" style="margin-bottom:8px">&#128221; Today\'s Practice Plan</h3>';
  h += '<div style="font-size:12px;color:var(--text-dim)">No practice plan yet.</div>';
  h += '</div>';
  return h;
}

function renderPracticeQuickStartCard() {
  var activeGuided = getPracticeActiveGuidedSummary();
  var activeShell = activeGuided ? null : getPracticeActiveShellSummary();
  var h = '<div class="card mb12" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);border:none;text-align:center;padding:20px">';
  h += '<div style="font-size:28px;margin-bottom:4px">&#9889;</div>';
  if (activeGuided) {
    h += '<div class="practice-quick-title">Guided Session Live</div>';
    h += '<div style="font-size:12px;color:rgba(255,255,255,.88);margin:4px 0 6px">' + escHTML(activeGuided.title) + '</div>';
    h += '<div style="font-size:12px;color:rgba(255,255,255,.82);margin:0 0 12px">' + escHTML(getPracticeGuidedStatusWithShell(activeGuided, { shellFallback: "" })) + '</div>';
    h += '<div style="display:flex;gap:8px;justify-content:center">';
    h += '<button onclick="act(\'resume_guided_session\')" style="background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">Resume Guided</button>';
    h += '<button onclick="act(\'quickStart\')" style="background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:rgba(255,255,255,.85);cursor:pointer">Quick Chord</button>';
    h += '</div>';
  } else if (activeShell) {
    h += '<div class="practice-quick-title">Practice Session Live</div>';
    h += '<div style="font-size:12px;color:rgba(255,255,255,.88);margin:4px 0 6px">' + escHTML(activeShell.title) + '</div>';
    h += '<div style="font-size:12px;color:rgba(255,255,255,.82);margin:0 0 12px">' + escHTML(activeShell.statusLabel + " • Block " + (activeShell.activeIndex + 1) + " of " + activeShell.blockCount) + '</div>';
    h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
    h += '<button onclick="act(\'' + activeShell.primaryAction + '\')" style="background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">' + escHTML(activeShell.primaryLabel) + '</button>';
    h += '<button onclick="act(\'openPlan\')" style="background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:rgba(255,255,255,.85);cursor:pointer">Open Plan</button>';
    h += '</div>';
  } else if(S.lastChordName){
    h += '<div class="practice-quick-title">Pick Up Where You Left Off</div>';
    h += '<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 12px">Continue practicing: <strong>'+escHTML(S.lastChordName)+'</strong></div>';
    h += '<div style="display:flex;gap:8px;justify-content:center">';
    h += '<button onclick="act(\'resumeSession\')" style="background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:#fff;cursor:pointer">Continue</button>';
    h += '<button onclick="act(\'quickStart\')" style="background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 24px;font-size:15px;font-weight:800;color:rgba(255,255,255,.85);cursor:pointer">Random</button>';
    h += '</div>';
  } else {
    h += '<div class="practice-quick-title">Quick Start</div>';
    h += '<div style="font-size:12px;color:rgba(255,255,255,.85);margin:4px 0 12px">Jump right in &mdash; we\'ll pick a chord for you!</div>';
    h += '<button onclick="act(\'quickStart\')" style="background:rgba(255,255,255,.25);border:2px solid rgba(255,255,255,.5);border-radius:14px;padding:10px 32px;font-size:16px;font-weight:800;color:#fff;cursor:pointer">Let\'s Go!</button>';
  }
  h += '</div>';
  return h;
}

function renderPracticeChordPicker(D, UI) {
  var currentLevel = normalizePracticeDisplayCount(S.level, 1);
  var cs = D.CHORDS[S.selectedLevel]||[];
  var h = '<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Pick a Chord &#9889;</h2></div><div class="lvl-tabs">';
  for(var l=1;l<=8;l++){
    var sel=S.selectedLevel===l,lk=l>S.level;
    h += '<button class="lvl-tab" onclick="act(\'selLevel\',\''+l+'\')" style="background:'+(sel?D.LC[l]:"var(--tab-bg)")+';color:'+(sel?"#fff":"var(--tab-inactive)")+';opacity:'+(lk?0.4:1)+'" aria-label="Level '+l+' '+D.LN[l]+'">'+(lk?"&#128274; ":"")+l+'</button>';
  }
  h += '</div>';
  h += '<div style="text-align:center;margin-bottom:12px"><span class="card-section-heading" style="display:inline;color:'+D.LC[S.selectedLevel]+'">'+D.LN[S.selectedLevel]+'</span>';
  if(D.CURRICULUM&&D.CURRICULUM[S.selectedLevel-1]) h += '<span style="font-size:12px;color:var(--text-muted);margin-left:8px">'+D.CURRICULUM[S.selectedLevel-1].sub+'</span>';
  h += '</div>';
  h += '<div class="flex-col">';
  for(var i=0;i<cs.length;i++){
    var c=cs[i],p=getPracticeChordProgressValue(c.name),locked=S.selectedLevel>currentLevel;
    var tier=getChordTier(c.name);
    var tierStyle=tier.tier!=="none"?";border-left:4px solid "+tier.color:"";
    h += '<div class="card chord-card" style="opacity:'+(locked?0.5:1)+tierStyle+'"'+(locked?'':clickableDiv("act(\'startSession\',\'"+c.name+"\')"))+'>'+UI.chord(c,90)+'<div style="flex:1"><h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-primary)">'+c.name+tierBadgeHTML(c.name)+'</h3><div class="prog-bar"><div class="prog-fill" style="width:'+p+'%;background:linear-gradient(90deg,'+D.LC[S.selectedLevel]+','+D.LC[S.selectedLevel]+'88)"></div></div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">'+(p>=100?"&#9989; Mastered":p>0?p+"%":"Not started")+'</div></div>';
    if(!locked) h += '<button onclick="act(\'previewChord\',\''+c.name+'\')" style="background:none;font-size:18px;padding:6px" aria-label="Preview '+c.name+' sound">&#128264;</button><div style="font-size:22px;color:'+D.LC[S.selectedLevel]+'">&#9654;</div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function renderPracticeProgressAndLibrary(currentLevel) {
  var earnedBadges = normalizePracticeArray(S.earnedBadges);
  var sessionCount = normalizePracticeDisplayCount(S.sessions, 0);
  var mas = getPracticeMasteredChordCount();
  var h = '<div class="card mt16"><h3 class="practice-card-heading" style="margin-bottom:10px">&#128202; Progress</h3><div style="display:flex;justify-content:space-around;text-align:center"><div><div class="metric-value" style="font-size:24px;color:#FF6B6B">'+sessionCount+'</div><div class="metric-label" style="font-size:10px">Sessions</div></div><div><div class="metric-value" style="font-size:24px;color:#4ECDC4">'+mas+'</div><div class="metric-label" style="font-size:10px">Mastered</div></div><div><div class="metric-value" style="font-size:24px;color:#45B7D1">Lvl '+currentLevel+'</div><div class="metric-label" style="font-size:10px">Current</div></div></div></div>';
  h += strumTrackCard();
  h += fingerExerciseCard();
  h += customSetsSection();
  h += '<div class="card" style="margin-top:12px"><h3 class="practice-card-heading" style="margin-bottom:10px">&#127942; Badges</h3><div style="display:flex;flex-wrap:wrap;gap:8px">';
  for(var i=0;i<BADGES.length;i++){
    var b=BADGES[i],e=earnedBadges.indexOf(b.id)!==-1;
    h += '<div style="width:56px;text-align:center;opacity:'+(e?1:0.3)+'" aria-label="Badge: '+b.label+(e?" (earned)":" (locked)")+'"><div style="font-size:24px;filter:'+(e?"none":"grayscale(1)")+'">'+b.icon+'</div><div style="font-size:8px;color:var(--text-label);font-weight:600">'+b.label+'</div></div>';
  }
  h += '</div></div>';
  h += '<div style="text-align:center;margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  h += '<button class="reset-btn" onclick="act(\'exportProgress\')" style="border-color:#4ECDC4;color:#4ECDC4">&#128190; Export</button>';
  h += '<button class="reset-btn" onclick="act(\'importProgress\')" style="border-color:#45B7D1;color:#45B7D1">&#128194; Import</button>';
  h += '<button class="reset-btn" onclick="act(\'reset\')">Reset Progress</button>';
  h += '</div>';
  if(S.importMsg) h += '<div style="text-align:center;margin-top:8px;font-size:12px;color:'+(S.importMsg.ok?"#4ECDC4":"#FF6B6B")+'">'+S.importMsg.text+'</div>';
  return h;
}

function renderCustomSetEditor(D, customSetChords) {
  var customSetNameValue = normalizePracticeTextInputValue(S.customSetName);
  var h='<input class="set-input mb12" id="set-name-input" type="text" placeholder="Set name..." value="'+escHTML(customSetNameValue)+'" oninput="act(\'setName\',this.value)" aria-label="Practice set name"/>';
  h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Select chords (min 2):</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  for(var l=1;l<=S.level;l++){
    var cs=D.CHORDS[l]||[];
    for(var i=0;i<cs.length;i++){
      var c=cs[i],sel=customSetChords.indexOf(c.name)!==-1;
      h+='<span class="chord-chip'+(sel?" selected":"")+'"'+clickableDiv("act(\'toggleSetChord\',\'"+c.name+"\')")+'>'+c.short+'</span>';
    }
  }
  h+='</div>';
  h+='<div style="display:flex;gap:8px"><button class="btn" onclick="act(\'saveSet\')" style="flex:1;padding:10px;font-size:14px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff'+(customSetChords.length<2||!S.customSetName.trim()?';opacity:0.5':'')+'">'+(S.editingSetIdx>=0?"Update":"Save")+'</button><button class="btn" onclick="act(\'cancelSet\')" style="flex:1;padding:10px;font-size:14px;background:var(--input-bg);color:var(--text-primary)">Cancel</button></div>';
  return h;
}

function renderCustomSetList(customSets) {
  var h='';
  if(customSets.length===0){
    h+='<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Create custom chord groups to practice together.</p>';
  } else {
    for(var i=0;i<customSets.length;i++){
      var cs=customSets[i];
      h+='<div class="set-card mb12"><div class="split-row" style="margin-bottom:8px"><h4 class="card-micro-heading" style="margin:0">'+escHTML(cs.name)+'</h4><div style="display:flex;gap:6px">';
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
  return h;
}

function renderDrillOverviewCard(drillCount) {
  return '<div class="card"><div style="font-size:48px;margin-bottom:12px">&#127947;&#65039;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Completed: <strong>'+drillCount+'</strong></p><button class="btn" onclick="act(\'startDrill\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Start Drill</button></div>';
}

function renderSuggestedDrillCard(hardest) {
  if(!hardest) return '';
return '<div class="card mt16"><h3 class="card-section-heading" style="margin-bottom:8px">&#128161; Suggested Drill</h3><p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Your hardest transition: <strong>'+hardest.from+'</strong> &#8594; <strong>'+hardest.to+'</strong> (avg '+normalizePracticePageNumber(hardest.avg, 0).toFixed(1)+'s)</p><button class="btn" onclick="act(\'drillTransition\',\''+hardest.from+'|'+hardest.to+'\')" style="padding:10px 20px;font-size:13px;background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary)">&#9889; Practice This</button></div>';
}

function renderDailyChallengeCard(dc) {
  return '<div class="card"><div style="font-size:48px;margin-bottom:8px">'+dc.icon+'</div><h3 style="margin:0 0 6px;font-size:18px;font-weight:800;color:var(--text-primary)">'+dc.title+'</h3><p style="color:var(--text-label);font-size:14px;margin-bottom:8px">'+dc.desc+'</p><div style="display:inline-block;background:#FFF3E0;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;color:#E65100;margin-bottom:16px">+'+dc.xp+' XP</div><br><button class="btn" onclick="act(\'startDaily\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">Accept Challenge</button></div>';
}

function renderQuizOverviewCard(quizScore) {
  return '<div class="card"><div style="font-size:48px;margin-bottom:12px">&#129504;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Correct: <strong>'+quizScore+'</strong></p><button class="btn" onclick="act(\'startQuiz\')" style="background:linear-gradient(135deg,#45B7D1,#4ECDC4);color:#fff">Start Quiz</button></div>';
}

function renderEarTrainOverviewCard(runtime) {
  return '<div class="card"><div style="font-size:48px;margin-bottom:12px">&#127911;</div><p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">Score: <strong>'+runtime.score+'</strong> correct all time</p><button class="btn" onclick="act(\'startEarTrain\')" style="background:linear-gradient(135deg,#FF6B6B,#4ECDC4);color:#fff">&#127911; Start Listening</button></div>';
}

function renderEarTrainScoreHeader(runtime) {
  return '<div style="display:flex;justify-content:center;gap:16px;margin-bottom:12px"><div style="background:#4ECDC422;padding:6px 14px;border-radius:14px"><span style="font-weight:700;color:#4ECDC4">'+runtime.score+'/'+runtime.total+'</span></div><div style="background:#FF6B6B22;padding:6px 14px;border-radius:14px">&#128293;<span style="font-weight:700;color:#FF6B6B">'+runtime.streak+'</span></div></div>';
}

function renderEarTrainOptions(runtime) {
  var h='<div style="display:flex;flex-direction:column;gap:8px;max-width:300px;margin:0 auto">';
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
  return h;
}

function renderPracticeStatsCard(stats) {
  return '<div class="card mb16"><div class="card-section-heading">Practice Stats</div><div class="split-row"><span class="metric-label">Streak</span><span class="metric-value">'+stats.streak+' days</span></div><div class="split-row"><span class="metric-label">Today</span><span class="metric-value">'+stats.todayMinutes+' min</span></div><div class="split-row"><span class="metric-label">Total</span><span class="metric-value">'+stats.totalMinutes+' min</span></div></div>';
}

function renderPracticePlanRows(plan) {
  var activeGuided = getPracticeActiveGuidedSummary();
  var activeShell = activeGuided ? null : getPracticeActiveShellSummary();
  var h='<div class="card mb16"><div class="card-section-heading">' + escHTML(activeGuided ? 'Guided Session Flow' : (activeShell ? 'Practice Session Live' : 'Today\'s Practice Plan')) + '</div>';
  if (activeGuided) {
    h += '<div class="muted" style="margin-top:6px">' + escHTML(activeGuided.statusLabel) + '</div>';
  } else if (activeShell) {
    h += '<div class="muted" style="margin-top:6px">' + escHTML(activeShell.statusLabel + ' • Block ' + (activeShell.activeIndex + 1) + ' of ' + activeShell.blockCount) + '</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 6px">';
    h += '<button data-action="' + escHTML(activeShell.primaryAction) + '" onclick="act(this.getAttribute(\'data-action\'))">' + escHTML(activeShell.primaryLabel) + '</button>';
    if (activeShell.canSkip) {
      h += '<button onclick="act(\'sessionSkipBlock\')">Skip Block</button>';
    }
    h += '</div>';
  }
  if(hasRenderablePracticeSummaryItems(plan)){
    for(var i=0;i<plan.items.length;i++){
      var item = plan.items[i];
      var itemId;
      var isCompleted;
      var done;
      var actionHtml;
      if(!isRenderablePracticeSummaryItem(item)) continue;
      itemId = normalizePracticeSummaryItemId(item ? item.id : null);
      isCompleted = isCompletedPracticeSummaryItem(item);
      done = isCompleted ? ' style="opacity:0.5;text-decoration:line-through"' : '';
      actionHtml = isCompleted
        ? '<span class="text-muted">Done</span>'
        : (itemId
          ? '<button data-item-id="'+escHTML(itemId)+'" onclick="act(\'practiceStartItem\', this.getAttribute(\'data-item-id\'))">Start</button>'
          : '<span class="text-muted">Unavailable</span>');
      h += '<div class="split-row">';
      h += '<span class="card-micro-heading"'+done+'>'+escHTML(getPracticeSummaryItemLabel(item))+'</span>';
      h += actionHtml;
      h += '</div>';
    }
  } else {
    h += '<div class="muted">' + escHTML(activeGuided ? 'Your live guided shell is the plan right now.' : (activeShell ? 'The shared session shell is already in motion.' : 'No practice plan yet.')) + '</div>';
  }
  h += '</div>';
  return h;
}

function renderPracticeCurriculumV2Card(inst) {
  var instrumentType = getPracticePageInstrumentType(inst);
  var service = window.SparkCurriculumV2;
  var summary;
  var track;
  var nextSession;
  var followupSession;
  var activeGuided;
  var sessionLookup;
  var completedPct;
  var progressLabel;
  var nextLabel;
  var upcomingLabel;
  var shellLabel;
  var unlockLabel;
  var cadenceLabel;
  var momentumCopy;
  var h;
  if (!service || typeof service.getTrackSummary !== "function") return "";
  summary = service.getTrackSummary(instrumentType);
  if (!summary) return "";
  track = typeof service.getTrack === "function" ? service.getTrack(instrumentType) : null;
  nextSession = summary.nextSession;
  activeGuided = getPracticeActiveGuidedSummary();
  followupSession = null;
  if (track && Array.isArray(track.sessions)) {
    sessionLookup = activeGuided
      ? getPracticeTrackSessionByDay(track, activeGuided.num)
      : getPracticeTrackSessionByDay(track, nextSession && (nextSession.day || nextSession.num));
    followupSession = sessionLookup ? (track.sessions[sessionLookup.index + 1] || null) : null;
  }
  completedPct = summary.sessionCount > 0
    ? Math.max(0, Math.min(100, Math.round((summary.completedCount / summary.sessionCount) * 100)))
    : 0;
  progressLabel = summary.sessionCount > 0
    ? (summary.completedCount + " of " + summary.sessionCount + " sessions completed")
    : "Track ready";
  nextLabel = activeGuided
    ? ("Live now: Day " + activeGuided.num + ": " + activeGuided.title)
    : (nextSession
      ? ("Day " + (nextSession.day || "?") + ": " + (nextSession.title || nextSession.id || "Next session"))
      : "Track complete");
  upcomingLabel = followupSession
    ? ((activeGuided ? "After this: Day " : "After that: Day ") + (followupSession.day || "?") + " - " + (followupSession.title || followupSession.id || "Coming up"))
    : "After that: More free play and review";
  shellLabel = activeGuided
    ? getPracticeGuidedStatusWithShell(activeGuided, {
        trimProgressPrefix: true,
        shellFallback: "Shell details loading"
      })
    : (nextSession
      ? getPracticeTrackSessionShellLabel(nextSession, "Shell details loading")
      : "Track complete");
  unlockLabel = activeGuided
    ? ("Unlock path: Day " + activeGuided.num + " in motion")
    : (nextSession && Array.isArray(nextSession.prerequisites) && nextSession.prerequisites.length
      ? ("Unlock path: Day " + normalizePracticeDisplayCount((nextSession.day || 1) - 1, 0) + " already banked")
      : "Unlock path: ready now");
  cadenceLabel = activeGuided
    ? "Session in motion"
    : getPracticeTrackCadenceLabel(summary, nextSession, followupSession);
  momentumCopy = activeGuided
    ? (activeGuided.statusLabel + ". Resume when you're ready.")
    : getPracticeTrackMomentumCopy(summary, nextSession, followupSession);
  h = '<div class="card mb12">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">';
  h += '<div>';
  h += '<div style="font-size:12px;font-weight:800;color:var(--text-muted);letter-spacing:.04em;text-transform:uppercase">Phase 1 Track</div>';
  h += '<div style="font-size:18px;font-weight:900;color:var(--text-primary)">' + escHTML(summary.title || "30-Day Track") + '</div>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + escHTML(progressLabel) + '</div>';
  h += '</div>';
  h += '<div style="padding:8px 10px;border-radius:999px;background:var(--chip-bg);color:var(--chip-color);font-size:12px;font-weight:800">Curriculum V2</div>';
  h += '</div>';
  h += '<div style="margin-top:12px;height:10px;border-radius:999px;background:var(--input-bg);overflow:hidden">';
  h += '<div style="height:100%;width:' + escHTML(String(completedPct)) + '%;background:linear-gradient(90deg,#4ECDC4,#45B7D1)"></div>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px">';
  h += '<div style="padding:10px;border-radius:14px;background:var(--input-bg)"><div class="metric-label">Up Next</div><div class="card-micro-heading" style="margin-top:4px">' + escHTML(nextLabel) + '</div></div>';
  h += '<div style="padding:10px;border-radius:14px;background:var(--input-bg)"><div class="metric-label">Track Rhythm</div><div class="card-micro-heading" style="margin-top:4px">' + escHTML(shellLabel) + '</div></div>';
  h += '<div style="padding:10px;border-radius:14px;background:var(--input-bg)"><div class="metric-label">Unlock Path</div><div class="card-micro-heading" style="margin-top:4px">' + escHTML(unlockLabel) + '</div></div>';
  h += '</div>';
  h += '<div class="split-row" style="margin-top:10px">';
  h += '<div class="card-micro-heading">' + escHTML(cadenceLabel) + '</div>';
  h += '<div style="font-size:12px;color:var(--text-secondary);text-align:right">' + escHTML(momentumCopy) + '</div>';
  h += '</div>';
  h += '<div style="margin-top:10px;font-size:12px;color:var(--text-secondary)">' + escHTML(upcomingLabel) + '</div>';
  h += '</div>';
  return h;
}
// ===== PRACTICE TAB =====
function practiceTab(){
  var inst = getPracticePageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var practiceGoalMetrics = getPracticeGoalMetrics();
  var currentLevel = normalizePracticeDisplayCount(S.level, 1);
  var plan = resolvePracticeSummaryPlan();
  var activeGuided = getPracticeActiveGuidedSummary();
  var h = renderPracticeGoalCard(practiceGoalMetrics);

  // Practice Plan CTA
  h+='<div class="card mb12" style="text-align:center">';
  h+='<button class="btn" onclick="act(\'' + (activeGuided ? 'resume_guided_session' : 'openPlan') + '\')" style="background:var(--accent);color:#fff;font-weight:700">&#128218; ' + escHTML(activeGuided ? 'Resume Guided Session' : 'Today\'s Practice Plan') + '</button>';
  h+='</div>';

  // Guided Session CTA
  h += renderPracticeGuidedSessionCard(D);

  // Adaptive Practice Plan
  h += renderPracticePlanSummaryCard(plan);

  // Canonical curriculum preview
  h += renderPracticeCurriculumV2Card(inst);

  // Quick Start / Resume
  h += renderPracticeQuickStartCard();

  h += renderPracticeChordPicker(D, UI);
  // Secondary activities the instrument moved out of its tab bar — every
  // id stays routable, this grid is their navigation home now.
  h += renderPracticeToolboxCard(inst);
  h += renderPracticeProgressAndLibrary(currentLevel);
  return h;
}

function renderPracticeToolboxCard(inst){
  var toolbox = inst && Array.isArray(inst.toolbox) ? inst.toolbox : [];
  if (!toolbox.length) return "";
  var h = '<div class="card mb16">';
  h += '<h3 class="card-section-heading" style="margin-bottom:10px">&#129520; Toolbox</h3>';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px">';
  for (var i = 0; i < toolbox.length; i++) {
    var tool = toolbox[i];
    if (!tool || !tool.id) continue;
    h += '<button class="btn" data-tool-id="' + escHTML(tool.id) + '" onclick="act(\'tab\', this.getAttribute(\'data-tool-id\'))"'
       + ' style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;background:var(--input-bg);color:var(--text-secondary);font-size:12px;font-weight:700">'
       + '<span style="font-size:18px" aria-hidden="true">' + (tool.icon || "&#127925;") + '</span>'
       + '<span>' + escHTML(tool.label || tool.id) + '</span>'
       + '</button>';
  }
  h += '</div></div>';
  return h;
}

// ===== CUSTOM PRACTICE SETS =====
function customSetsSection(){
  var inst = getPracticePageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var customSets = normalizePracticeArray(S.customSets);
  var customSetChords = normalizePracticeArray(S.customSetChords);
var h='<div class="card" style="margin-top:12px"><h3 class="practice-card-heading" style="margin-bottom:10px">&#127912; My Practice Sets</h3>';

  if(S.editingSet){
    h+=renderCustomSetEditor(D, customSetChords);
  } else {
    h+=renderCustomSetList(customSets);
  }
  h+='</div>';
  return h;
}

// escHTML() is defined in ui.js (loaded before page scripts)

// ===== DRILL TAB =====
function drillTab(){
  var drillCount = normalizePracticeDisplayCount(S.drillCount, 0);
  var h='<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Chord Switching &#9889;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">60 seconds - switch fast!</p>';
  h+=renderDrillOverviewCard(drillCount);
  // Suggested drill from transition stats
  var hardest=getHardestTransition();
  h+=renderSuggestedDrillCard(hardest);
  h+='</div>';
  return h;
}

function getHardestTransition(){
  var ts=typeof SparkTransitionStats !== "undefined" ? SparkTransitionStats.all() : (S.transitionStats || {});
  var worst=null,worstAvg=0;
  for(var k in ts){
    if(ts[k] && ts[k].attempts>=2){
      var avg=ts[k].avgTime;
      avg = normalizePracticePageNumber(avg, 0);
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
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Daily Challenge &#127941;</h2>'+renderDailyChallengeCard(dc)+'</div>';
}

// ===== QUIZ TAB =====
function quizTab(){
  var runtime = getPracticeCoreView();
  runtime = runtime && runtime.runtimeState ? runtime.runtimeState : null;
  var quizScore = normalizePracticeDisplayCount(runtime && runtime.legacyQuizScore, normalizePracticeDisplayCount(S.quizCorrect, 0));
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Chord Quiz &#129504;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Name &#8594; pick the right diagram!</p>'+renderQuizOverviewCard(quizScore)+'</div>';
}

// ===== EAR TRAINING TAB =====
function getLegacyEarTrainingRuntime(){
  var runtime = getPracticeCoreView();
  runtime = runtime && runtime.runtimeState ? runtime.runtimeState : null;
  var hasCoreEarTraining = !!(runtime && (
    runtime.legacyEarTrainQuestion != null ||
    runtime.legacyEarTrainAnswer != null ||
    runtime.legacyEarTrainScore != null ||
    runtime.legacyEarTrainTotal != null ||
    runtime.legacyEarTrainStreak != null
  ));
  return {
    question: hasCoreEarTraining && typeof runtime.legacyEarTrainQuestion === "string" ? runtime.legacyEarTrainQuestion : (typeof S.earTrainQ === "string" ? S.earTrainQ : null),
    options: hasCoreEarTraining && Array.isArray(runtime.legacyEarTrainOptions) && runtime.legacyEarTrainOptions.length ? runtime.legacyEarTrainOptions : (Array.isArray(S.earTrainOpts) && S.earTrainOpts.length ? S.earTrainOpts : []),
    answer: hasCoreEarTraining && typeof runtime.legacyEarTrainAnswer === "string" ? runtime.legacyEarTrainAnswer : (typeof S.earTrainAns === "string" ? S.earTrainAns : null),
    score: normalizePracticeDisplayCount(hasCoreEarTraining ? runtime.legacyEarTrainScore : null, normalizePracticeDisplayCount(S.earTrainScore, 0)),
    total: normalizePracticeDisplayCount(hasCoreEarTraining ? runtime.legacyEarTrainTotal : null, normalizePracticeDisplayCount(S.earTrainTotal, 0)),
    streak: normalizePracticeDisplayCount(hasCoreEarTraining ? runtime.legacyEarTrainStreak : null, normalizePracticeDisplayCount(S.earTrainStreak, 0))
  };
}

function earTrainTab(){
  var runtime = getLegacyEarTrainingRuntime();
  if(runtime.question)return earTrainPage();
  return '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Ear Training &#128066;</h2><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Listen to a chord, then identify it!</p>'+renderEarTrainOverviewCard(runtime)+'</div>';
}

function earTrainPage(){
  var runtime = getLegacyEarTrainingRuntime();
  var h='<div class="text-center"><button class="back-btn" onclick="act(\'tab\',\'ear\')">&#8592; Back</button>';
  h+=renderEarTrainScoreHeader(runtime);
  h+='<h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:8px 0">What chord is this?</h2>';
  h+='<button class="btn mb16" onclick="act(\'replayEarTrain\')" style="padding:10px 20px;font-size:14px;background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:var(--text-primary)">&#128264; Replay</button>';
  h+=renderEarTrainOptions(runtime);
  if(runtime.answer){
    var ok=runtime.answer===runtime.question;
    h+='<div style="margin-top:16px;font-size:20px;font-weight:800;color:'+(ok?"#4ECDC4":"#FF6B6B")+';animation:bn .4s ease">'+(ok?"&#9989; Correct! +15 XP":"&#10060; It was "+runtime.question)+'</div>';
  }
  h+='</div>';
  return h;
}

// ===== PRACTICE PLAN PAGE (Brain System) =====
function practicePage(){
  var stats = getPracticeStats();
  var plan = resolvePracticeSummaryPlan();
  return renderPracticeStatsCard(stats) + renderPracticePlanRows(plan);
}

function startPracticeItem(id){
  var view = getPracticeCoreView();
  var plan = resolvePracticeCoreDailyPlan(view);
  var runtime = typeof window !== "undefined" && window.SparkSessionRuntime ? window.SparkSessionRuntime : (typeof SparkSessionRuntime !== "undefined" ? SparkSessionRuntime : null);
  var segments = plan && Array.isArray(plan.segments) ? plan.segments : [];
  var previousScreen = typeof S !== "undefined" && S ? S.screen : null;
  var launched;
  var si;
  if(!plan) plan = S.practicePlan;
  if(!plan || !Array.isArray(plan.items)) return;
  if(runtime && typeof runtime.runSegmentById === "function" && plan.flow === "daily_practice"){
    for(si=0;si<segments.length;si++){
      if(segments[si] && segments[si].id === id){
        if(typeof sparkCore !== "undefined" && sparkCore && typeof sparkCore.syncSessionRuntime === "function"){
          sparkCore.syncSessionRuntime({
            segmentId: id,
            status: segments[si].meta && segments[si].meta.ukuleleMiniSessionId ? "running" : "ready",
            positionMs: 0,
            autoAdvance: true,
            scheduleTick: false,
            syncState: false
          });
        }
        if(segments[si].meta && segments[si].meta.ukuleleMiniSessionId){
          if(typeof S !== "undefined" && S){
            S.screen = typeof SCR !== "undefined" && SCR && SCR.SESSION ? SCR.SESSION : "session";
          }
          if(typeof render === "function") render();
          return;
        }
        launched = runtime.runSegmentById(id, { autoAdvance: true }) !== false;
        if(launched){
          if(typeof S !== "undefined" && S && S.screen === previousScreen){
            S.screen = typeof SCR !== "undefined" && SCR && SCR.SESSION ? SCR.SESSION : "session";
          }
          if(typeof render === "function") render();
          return;
        }
        break;
      }
    }
  }
  for(var i=0;i<plan.items.length;i++){
    var item = plan.items[i];
    var candidateId = normalizePracticeSummaryItemId(item ? item.id : null);
    if(item && candidateId === id){
      launchPracticeItem(item);
      return;
    }
  }
}

(function(root){
  if(!root)return;
  root.SparkSharedPracticeRenderers = {
    drillTab: drillTab,
    dailyTab: dailyTab,
    quizTab: quizTab,
    earTrainTab: earTrainTab
  };
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : null));
