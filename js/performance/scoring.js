/* ===== ChordSpark Performance: Scoring Engine ===== */

function performanceScoringRead(path, fallback) {
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(path, fallback);
  }
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (!cursor) return fallback;
  for (i = 0; i < parts.length; i++) {
    if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function getTimingWindows(difficulty) {
  var diff = typeof getPerformanceDifficulty === "function" ? getPerformanceDifficulty(difficulty) : null;
  return {
    perfectMs: diff && typeof diff.perfectMs === "number" ? diff.perfectMs : ((window.PERFORMANCE_TIMING_WINDOWS && window.PERFORMANCE_TIMING_WINDOWS.PERFECT) || 50),
    goodMs: diff && typeof diff.goodMs === "number" ? diff.goodMs : ((window.PERFORMANCE_TIMING_WINDOWS && window.PERFORMANCE_TIMING_WINDOWS.GOOD) || 100),
    okMs: (window.PERFORMANCE_TIMING_WINDOWS && window.PERFORMANCE_TIMING_WINDOWS.OK) || 160,
    missMs: diff && typeof diff.missMs === "number" ? diff.missMs : performanceScoringRead("performWindowMissMs", 220)
  };
}

function getPerformanceGraceWindowMs() {
  return typeof window.PERFORMANCE_GRACE_WINDOW_MS === "number"
    ? window.PERFORMANCE_GRACE_WINDOW_MS
    : 120;
}

function getDetectedPerformanceLane(event, snapshot, mode) {
  snapshot = snapshot || {};
  event = event || {};
  mode = mode || "midi";

  var chordDetector = typeof SparkChordDetector === "function" ? new SparkChordDetector() : null;
  var notes = snapshot.pitchClasses || [];
  var detectedChord = chordDetector && notes.length ? chordDetector.detect(notes) : null;

  if (typeof getPerformanceLane === "function") {
    var mapped = getPerformanceLane(detectedChord, null);
    if (mapped != null) return mapped;
  }

  if (event && typeof event.lane === "number" && event.lane >= 0) {
    if (performanceSnapshotHasActivity(snapshot, event, mode)) return event.lane;
  }

  return null;
}

function _getClosestCluster(eventTimeSec, clusters) {
  if (!clusters || clusters.length === 0) return null;
  var best = null;
  var bestDist = Infinity;
  for (var i = 0; i < clusters.length; i++) {
    var dist = Math.abs(clusters[i].tSec - eventTimeSec);
    if (dist < bestDist) { bestDist = dist; best = clusters[i]; }
  }
  return best;
}

function scoreStrumDirection(expectedDir, actualDir, diff) {
  if (!diff || !diff.checkStrumDirection) return 1;
  if (!actualDir) return diff.id === "pro" ? 0 : 0.5;
  return expectedDir === actualDir ? 1 : 0;
}

function performanceSnapshotHasActivity(snapshot, event, mode) {
  snapshot = snapshot || {};
  event = event || {};
  if ((snapshot.pitchClasses || []).length > 0) return true;
  if (mode === "midi") {
    if (event.type === "open" || event.type === "tap") {
      return !!_getClosestCluster(event.t, snapshot.attackClusters || []);
    }
    return (snapshot.heldMidiNotes || []).length > 0 || (snapshot.recentAttacks || []).length > 0;
  }
  return false;
}

function scorePerformanceEvent(event, snapshot, hitDeltaMs, difficulty, mode) {
  var targetNotes = event.notes || [];
  var inputNotes = snapshot.pitchClasses || [];
  var cluster = null;

  if (mode === "midi" && snapshot.attackClusters && snapshot.attackClusters.length > 0) {
    cluster = _getClosestCluster(event.t, snapshot.attackClusters);
  }

  if (event.type === "open") {
    return scoreOpenPerformanceEvent(event, cluster, hitDeltaMs, difficulty);
  }

  if (targetNotes.length === 0) return { score: 0, grade: "miss", noteScore: 0, timingScore: 0 };

  // For MIDI mode, prefer closest attack cluster for note matching
  var matchNotes = inputNotes;
  if (mode === "midi" && cluster) {
    if (cluster.pitchClasses.length > 0) {
      matchNotes = cluster.pitchClasses;
    }
  }

  var overlap = 0;
  for (var i = 0; i < targetNotes.length; i++) {
    if (matchNotes.indexOf(targetNotes[i]) >= 0) overlap++;
  }
  var noteScore = overlap / targetNotes.length;

  var diff = typeof getPerformanceDifficulty === "function" ? getPerformanceDifficulty(difficulty) : null;
  var windows = getTimingWindows(difficulty);
  var missMs = windows.missMs;
  var expectedLane = typeof getPerformanceLane === "function" ? getPerformanceLane(event.chord || event.laneLabel || null, event) : null;
  var detectedLane = getDetectedPerformanceLane(event, snapshot, mode);
  var laneMatch = expectedLane == null || detectedLane == null ? noteScore > 0 : expectedLane === detectedLane;
  var timingGrade = typeof getPerformanceTimingGrade === "function"
    ? getPerformanceTimingGrade(hitDeltaMs)
    : gradePerformanceScore(0);
  var timingScorePct = typeof getPerformanceTimingScore === "function"
    ? getPerformanceTimingScore(timingGrade)
    : 0;
  var timingScore = timingScorePct / 100;
  var graceUsed = false;

  if (event.type === "tap" && mode === "midi" && !cluster) {
    return {
      score: 0,
      points: 0,
      grade: "miss",
      noteScore: 0,
      timingScore: timingScore,
      timingGrade: "miss",
      expectedLane: expectedLane,
      detectedLane: detectedLane,
      laneMatch: false,
      hit: false,
      correct: false,
      graceUsed: false,
      offsetMs: hitDeltaMs
    };
  }

  var hit = laneMatch && noteScore > 0 && timingGrade !== "miss";
  if (!hit && laneMatch && noteScore > 0 && Math.abs(hitDeltaMs) <= (missMs + getPerformanceGraceWindowMs())) {
    graceUsed = true;
    hit = true;
  }
  var normalizedScore = hit && !graceUsed ? timingScore : 0;
  var points = hit && !graceUsed ? timingScorePct : 0;

  return {
    score: Math.round(normalizedScore * 100) / 100,
    points: points,
    grade: hit ? (graceUsed ? "grace" : timingGrade) : "miss",
    noteScore: noteScore,
    timingScore: timingScore,
    timingGrade: timingGrade,
    expectedLane: expectedLane,
    detectedLane: detectedLane,
    laneMatch: laneMatch,
    hit: hit,
    correct: hit,
    graceUsed: graceUsed,
    offsetMs: hitDeltaMs
  };
}

function scoreOpenPerformanceEvent(event, cluster, hitDeltaMs, difficulty) {
  var diff = typeof getPerformanceDifficulty === "function" ? getPerformanceDifficulty(difficulty) : null;
  var missMs = diff && typeof diff.missMs === "number"
    ? diff.missMs
    : performanceScoringRead("performWindowMissMs", 220);
  var timingGrade = typeof getPerformanceTimingGrade === "function"
    ? getPerformanceTimingGrade(hitDeltaMs)
    : "miss";
  var timingScorePct = typeof getPerformanceTimingScore === "function"
    ? getPerformanceTimingScore(timingGrade)
    : 0;
  var timingScore = timingScorePct / 100;
  var noteScore = cluster ? 1 : 0;
  var graceUsed = false;
  var hit = !!cluster && timingGrade !== "miss";
  if (!hit && !!cluster && Math.abs(hitDeltaMs) <= (missMs + getPerformanceGraceWindowMs())) {
    graceUsed = true;
    hit = true;
  }
  return {
    score: Math.round((hit && !graceUsed ? timingScore : 0) * 100) / 100,
    points: hit && !graceUsed ? timingScorePct : 0,
    grade: hit ? (graceUsed ? "grace" : timingGrade) : "miss",
    noteScore: noteScore,
    timingScore: timingScore,
    timingGrade: timingGrade,
    expectedLane: typeof getPerformanceLane === "function" ? getPerformanceLane(event.chord || event.laneLabel || null, event) : null,
    detectedLane: cluster ? (typeof getPerformanceLane === "function" ? getPerformanceLane(event.chord || event.laneLabel || null, event) : null) : null,
    laneMatch: !!cluster,
    hit: hit,
    correct: hit,
    graceUsed: graceUsed,
    offsetMs: hitDeltaMs
  };
}

function gradePerformanceScore(score) {
  if (score >= 0.9) return "perfect";
  if (score >= 0.7) return "good";
  if (score >= 0.45) return "ok";
  return "miss";
}

function createEmptyPhraseStats(chart) {
  var stats = [];
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    stats.push({
      phraseId: p.id,
      name: p.name,
      hits: 0,
      misses: 0,
      perfects: 0,
      goods: 0,
      oks: 0,
      total: 0,
      scoreSum: 0,
      maxCombo: 0,
      _currentCombo: 0
    });
  }
  return stats;
}

function updatePhraseStats(phraseStats, event, result) {
  var pIdx = -1;
  for (var i = 0; i < phraseStats.length; i++) {
    if (phraseStats[i].phraseId === event.phraseId) { pIdx = i; break; }
  }
  if (pIdx < 0) return;

  var ps = phraseStats[pIdx];
  ps.total++;
  ps.scoreSum += result.score;

  if (result.grade === "miss") {
    ps.misses++;
    ps._currentCombo = 0;
  } else {
    ps.hits++;
    if (result.grade !== "grace") {
      ps._currentCombo++;
      if (ps._currentCombo > ps.maxCombo) ps.maxCombo = ps._currentCombo;
    }
    if (result.grade === "perfect") ps.perfects++;
    else if (result.grade === "good") ps.goods++;
    else if (result.grade === "ok") ps.oks++;
  }
}

function finalizePerformanceResults(chart, phraseStats, options) {
  options = options || {};
  var totalEvents = chart.events.length;
  var totalScore = 0;
  var totalHits = 0;
  var maxCombo = 0;

  for (var i = 0; i < phraseStats.length; i++) {
    var ps = phraseStats[i];
    totalScore += ps.scoreSum;
    totalHits += ps.hits;
    if (ps.maxCombo > maxCombo) maxCombo = ps.maxCombo;
  }

  var accuracy = totalEvents > 0 ? Math.round((totalHits / totalEvents) * 100) : 0;
  var avgScore = totalEvents > 0 ? totalScore / totalEvents : 0;

  var stars = 0;
  if (avgScore >= 0.95) stars = 5;
  else if (avgScore >= 0.85) stars = 4;
  else if (avgScore >= 0.7) stars = 3;
  else if (avgScore >= 0.5) stars = 2;
  else if (avgScore >= 0.3) stars = 1;

  var importedTechniqueSummary = summarizeImportedTechniqueResults(chart);

  return {
    title: chart.title,
    artist: chart.artist,
    score: Math.round(totalScore * 100),
    accuracy: accuracy,
    maxCombo: maxCombo,
    stars: stars,
    phraseStats: phraseStats,
    totalEvents: totalEvents,
    importedTechniqueSummary: importedTechniqueSummary,
    focusedTechnique: Object.prototype.hasOwnProperty.call(options, "focusedTechnique")
      ? options.focusedTechnique
      : null
  };
}

function summarizeImportedTechniqueResults(chart) {
  var summary = {
    open: createImportedTechniqueBucket("Open"),
    tap: createImportedTechniqueBucket("Tap"),
    forced: createImportedTechniqueBucket("Forced"),
    specialPhrase: createImportedTechniqueBucket("Phrase")
  };
  if (!chart || !Array.isArray(chart.events)) return summary;

  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (!evt || !evt.sourceFlags) continue;
    if (evt.sourceFlags.open) updateImportedTechniqueBucket(summary.open, evt);
    if (evt.sourceFlags.tap) updateImportedTechniqueBucket(summary.tap, evt);
    if (evt.sourceFlags.forced) updateImportedTechniqueBucket(summary.forced, evt);
    if (evt.sourceFlags.specialPhrase) updateImportedTechniqueBucket(summary.specialPhrase, evt);
  }

  finalizeImportedTechniqueBucket(summary.open);
  finalizeImportedTechniqueBucket(summary.tap);
  finalizeImportedTechniqueBucket(summary.forced);
  finalizeImportedTechniqueBucket(summary.specialPhrase);
  return summary;
}

function createImportedTechniqueBucket(label) {
  return {
    label: label,
    total: 0,
    hits: 0,
    misses: 0,
    accuracy: 0
  };
}

function updateImportedTechniqueBucket(bucket, evt) {
  bucket.total++;
  if (evt._hit) bucket.hits++;
  else if (evt._miss) bucket.misses++;
}

function finalizeImportedTechniqueBucket(bucket) {
  bucket.accuracy = bucket.total > 0 ? Math.round((bucket.hits / bucket.total) * 100) : 0;
}

function buildPerformanceFeedbackLabel(event, result, targetTechnique) {
  var grade = result && result.grade ? String(result.grade).toUpperCase() : "MISS";
  if (!event || !event.sourceFlags || !targetTechnique || !event.sourceFlags[targetTechnique]) {
    return grade + "!";
  }
  return grade + " " + formatFocusedTechniqueShortLabel(targetTechnique) + "!";
}

function formatFocusedTechniqueShortLabel(key) {
  var labels = {
    open: "OPEN",
    tap: "TAP",
    forced: "FORCED",
    specialPhrase: "PHRASE"
  };
  return labels[key] || String(key || "TECH");
}
