// js/instruments/piano/helpers.js
// Piano-specific helper functions extracted from PianoSpark state.js
// These use PIANO_DATA globals and are needed by piano pages and app engine.
(function() {

  function getCurrentSessionPlan() {
    var plans = typeof PIANO_SESSIONS !== "undefined" ? PIANO_SESSIONS : [];
    if (!S || S.currentSession < 1 || S.currentSession > plans.length) return null;
    return plans[S.currentSession - 1];
  }

  function getCurrentLevel() {
    var curriculum = typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : [];
    for (var i = 0; i < curriculum.length; i++) {
      if (curriculum[i].num === S.level) return curriculum[i];
    }
    return curriculum[0] || null;
  }

  function levelForSession(sessionNum) {
    var curriculum = typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : [];
    for (var i = 0; i < curriculum.length; i++) {
      var parts = curriculum[i].sessions.split("-");
      var start = parseInt(parts[0]);
      var end = parseInt(parts[1]);
      if (sessionNum >= start && sessionNum <= end) return curriculum[i].num;
    }
    return 8;
  }

  function addPracticeSecond() {
    if (typeof S !== "undefined") {
      S.dailyPracticed = (S.dailyPracticed || 0) + 1;
      if (S.dailyPracticed % 60 === 0 && typeof saveState === "function") saveState();
    }
  }

  function addXP(n) {
    if (typeof S !== "undefined") {
      S.xp = (S.xp || 0) + n;
      if (typeof saveState === "function") saveState();
    }
  }

  function addHistory(type, detail) {
    if (typeof S === "undefined") return;
    if (!Array.isArray(S.history)) S.history = [];
    var entry = { type: type, ts: Date.now() };
    if (detail && detail.chord !== undefined) entry.chord = detail.chord;
    if (detail && detail.dur !== undefined) entry.dur = detail.dur;
    if (detail && detail.chords !== undefined) entry.chords = detail.chords;
    if (detail && detail.score !== undefined) entry.score = detail.score;
    if (detail && detail.session !== undefined) entry.session = detail.session;
    S.history.push(entry);
    if (typeof saveState === "function") saveState();
  }

  function checkStreak() {
    if (typeof S === "undefined") return;
    var today = new Date().toISOString().slice(0, 10);
    if (S.lastPracticeDate === today) return;
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (S.lastPracticeDate === yesterday) {
      S.streak = (S.streak || 0) + 1;
    } else if (S.lastPracticeDate !== today) {
      S.streak = 1;
    }
    S.lastPracticeDate = today;
  }

  function recordTransition(fromChord, toChord, wasClean, timeMs) {
    if (typeof S === "undefined") return;
    if (!S.transitionStats) S.transitionStats = {};
    var key = fromChord + "_" + toChord;
    if (!S.transitionStats[key]) {
      S.transitionStats[key] = { attempts: 0, clean: 0, avgMs: 0 };
    }
    var stat = S.transitionStats[key];
    stat.attempts++;
    if (wasClean) stat.clean++;
    stat.avgMs = Math.round((stat.avgMs * (stat.attempts - 1) + timeMs) / stat.attempts);
  }

  // Clickable div helper (used by piano pages for onclick divs)
  function clickableDiv(action, html) {
    return '<div onclick="' + action + '" style="cursor:pointer" role="button" tabindex="0">' + html + '</div>';
  }

  // If-then card for practice intention
  function ifThenCard(text) {
    return '<div class="card" style="background:linear-gradient(135deg,rgba(78,205,196,.08),rgba(69,183,209,.08));border:1px solid rgba(78,205,196,.2);text-align:center;padding:12px"><div style="font-size:14px;color:var(--text-muted);font-style:italic">' + (typeof escHTML === "function" ? escHTML(text) : text) + '</div></div>';
  }

  // Chord match helper
  function getChordMatch(chord) {
    var chords = typeof PIANO_CHORDS_FULL !== "undefined" ? PIANO_CHORDS_FULL : {};
    if (typeof chord === "string") return chords[chord] || null;
    return chord;
  }

  // Micro achievement helper (simplified)
  function fireMicro(elapsed, total) {
    if (!total || total <= 0) return null;
    var pct = elapsed / total;
    if (pct >= 1) return "Session complete!";
    if (pct >= 0.75 && pct < 0.76) return "Almost there!";
    if (pct >= 0.5 && pct < 0.51) return "Halfway!";
    return null;
  }

  function checkPracticeDate() {
    if (typeof S === "undefined") return;
    var today = new Date().toDateString();
    if (S.lastPractice !== today) {
      var yesterday = new Date(Date.now() - 86400000).toDateString();
      if (S.lastPractice === yesterday) {
        S.streak = (S.streak || 0) + 1;
      } else {
        S.streak = 1;
      }
      S.dailyPracticed = 0;
    }
    S.lastPractice = today;
    if (!S.personalBests) S.personalBests = { streak: 0 };
    if (S.streak > S.personalBests.streak) S.personalBests.streak = S.streak;
  }

  // Get reward phase for current session
  function getRewardPhase(sessionNum) {
    var phases = typeof PIANO_DATA !== "undefined" && PIANO_DATA.REWARD_PHASES ? PIANO_DATA.REWARD_PHASES : [];
    for (var i = phases.length - 1; i >= 0; i--) {
      if (sessionNum >= phases[i].after) return phases[i];
    }
    return null;
  }

  // Expose all as globals
  window.getCurrentSessionPlan = getCurrentSessionPlan;
  window.getCurrentLevel = getCurrentLevel;
  window.levelForSession = levelForSession;
  window.addPracticeSecond = addPracticeSecond;
  window.addXP = addXP;
  window.addHistory = addHistory;
  window.checkStreak = checkStreak;
  window.recordTransition = recordTransition;
  window.clickableDiv = typeof window.clickableDiv === "undefined" ? clickableDiv : window.clickableDiv;
  window.ifThenCard = typeof window.ifThenCard === "undefined" ? ifThenCard : window.ifThenCard;
  window.getChordMatch = typeof window.getChordMatch === "undefined" ? getChordMatch : window.getChordMatch;
  window.fireMicro = typeof window.fireMicro === "undefined" ? fireMicro : window.fireMicro;
  window.checkPracticeDate = checkPracticeDate;
  window.getRewardPhase = getRewardPhase;

})();
