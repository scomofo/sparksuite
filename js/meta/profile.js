function normalizeLegacyProfileText(value) {
  var text;
  var lower;
  if (value == null) return "";
  if (typeof value !== "string" && typeof value !== "number") return "";
  text = String(value).replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function legacyProfileInstrumentName(value) {
  var normalized = normalizeLegacyProfileText(value).toLowerCase();
  if (!normalized) return "Instrument not set";
  if (normalized === "guitar" || normalized === "chordspark") return "Guitar";
  if (normalized === "piano" || normalized === "pianospark") return "Piano";
  if (normalized === "bass" || normalized === "bassspark") return "Bass";
  if (normalized === "ukulele" || normalized === "ukespark") return "Ukulele";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function loadLegacyProfileSnapshot() {
  if (typeof SparkStorage === "undefined" || !SparkStorage || typeof SparkStorage.load !== "function") return null;
  try { return SparkStorage.load(); }
  catch (_error) { return null; }
}

function getLegacyProfilePrimaryInstrument(profile) {
  var appKey;
  var apps = profile && profile.apps;
  var stateProfile = typeof S !== "undefined" ? (S.profile || S.sparkProfile || {}) : {};
  var candidate = normalizeLegacyProfileText(profile && (profile.selectedInstrument || profile.instrumentPrimary || profile.instrument))
    || normalizeLegacyProfileText(stateProfile.instrumentPrimary)
    || normalizeLegacyProfileText(typeof S !== "undefined" ? S.activeInstrument : "");
  if (candidate) return legacyProfileInstrumentName(candidate);
  if (apps) {
    for (appKey in apps) {
      if (!Object.prototype.hasOwnProperty.call(apps, appKey)) continue;
      candidate = normalizeLegacyProfileText((apps[appKey] || {}).instrument || appKey);
      if (candidate) return legacyProfileInstrumentName(candidate);
    }
  }
  return "Instrument not set";
}

function getLegacyProfileStatNumber() {
  var i;
  var value;
  for (i = 0; i < arguments.length; i++) {
    value = arguments[i];
    if (typeof value === "number" && isFinite(value)) return value;
  }
  return 0;
}

function getLegacyProfileAggregateStats(profile) {
  var apps = profile && profile.apps;
  var id;
  var totals = {
    xp: 0,
    level: 1,
    lessonsCompleted: 0,
    sessionsCompleted: 0,
    streakBest: 0
  };
  if (!apps) return totals;
  for (id in apps) {
    if (!Object.prototype.hasOwnProperty.call(apps, id)) continue;
    var stats = (apps[id] || {}).stats || {};
    totals.xp += getLegacyProfileStatNumber(stats.xp, 0);
    totals.level = Math.max(totals.level, getLegacyProfileStatNumber(stats.level, 1));
    totals.lessonsCompleted += getLegacyProfileStatNumber(stats.lessonsCompleted, 0);
    totals.sessionsCompleted += getLegacyProfileStatNumber(stats.sessionsCompleted, 0);
    totals.streakBest = Math.max(totals.streakBest, getLegacyProfileStatNumber(stats.streakDays, 0));
  }
  return totals;
}

function profilePage(){
  var profile = loadLegacyProfileSnapshot();
  var totals = getLegacyProfileAggregateStats(profile);
  var stateProfile = typeof S !== "undefined" ? (S.profile || S.sparkProfile || {}) : {};
  var ps = (typeof S !== "undefined" && S.playerStats) ? S.playerStats : {};
  var badgeCount = profile && profile.suiteRewards && Array.isArray(profile.suiteRewards.badges)
    ? profile.suiteRewards.badges.length
    : 0;
  var name = normalizeLegacyProfileText(profile && (profile.displayName || profile.name))
    || normalizeLegacyProfileText(stateProfile.displayName)
    || "Spark Player";
  var level = Math.max(1, getLegacyProfileStatNumber(totals.level, typeof S !== "undefined" ? S.playerLevel : null, 1));
  var xp = getLegacyProfileStatNumber(totals.xp, typeof S !== "undefined" ? S.playerXP : null, 0);
  var lessonsCompleted = getLegacyProfileStatNumber(totals.lessonsCompleted, ps.lessonsCompleted, 0);
  var sessionsCompleted = getLegacyProfileStatNumber(totals.sessionsCompleted, ps.sessionsCompleted, 0);
  var practiceMinutes = getLegacyProfileStatNumber(ps.totalPracticeMinutes, typeof S !== "undefined" && typeof S.todayPracticeSeconds === "number" ? Math.round(S.todayPracticeSeconds / 60) : null, 0);
  var exercisesCompleted = getLegacyProfileStatNumber(ps.exercisesCompleted, 0);
  var bestStreak = getLegacyProfileStatNumber(totals.streakBest, ps.streakBest, typeof S !== "undefined" ? S.practiceStreak : null, 0);
  var instrumentName = getLegacyProfilePrimaryInstrument(profile);
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Player Profile</div>';
  h += '<div>Name: ' + escHTML(name) + '</div>';
  h += '<div>Primary Instrument: ' + escHTML(instrumentName) + '</div>';
  h += '<div>Level: ' + level + '</div>';
  h += '<div>XP: ' + xp + '</div>';
  h += '<div>Lessons Completed: ' + lessonsCompleted + '</div>';
  h += '<div>Sessions Completed: ' + sessionsCompleted + '</div>';
  h += '<div>Practice Minutes: ' + practiceMinutes + '</div>';
  h += '<div>Exercises Completed: ' + exercisesCompleted + '</div>';
  h += '<div>Best Streak: ' + bestStreak + '</div>';
  h += '<div>Badges Unlocked: ' + badgeCount + '</div>';
  h += '</div>';
  return h;
}
