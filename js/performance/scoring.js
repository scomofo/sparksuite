/* ===== ChordSpark Performance: Scoring Engine ===== */

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

function scorePerformanceEvent(event, snapshot, hitDeltaMs, difficulty, mode) {
  var targetNotes = event.notes || [];
  var inputNotes = snapshot.pitchClasses || [];

  if (targetNotes.length === 0) return { score: 0, grade: "miss", noteScore: 0, timingScore: 0 };

  // For MIDI mode, prefer closest attack cluster for note matching
  var matchNotes = inputNotes;
  if (mode === "midi" && snapshot.attackClusters && snapshot.attackClusters.length > 0) {
    var cluster = _getClosestCluster(event.t, snapshot.attackClusters);
    if (cluster && cluster.pitchClasses.length > 0) {
      matchNotes = cluster.pitchClasses;
    }
  }

  var overlap = 0;
  for (var i = 0; i < targetNotes.length; i++) {
    if (matchNotes.indexOf(targetNotes[i]) >= 0) overlap++;
  }
  var noteScore = overlap / targetNotes.length;

  var diff = typeof getPerformanceDifficulty === "function" ? getPerformanceDifficulty(difficulty) : null;
  var perfectMs = diff ? diff.perfectMs : S.performWindowPerfectMs;
  var goodMs = diff ? diff.goodMs : S.performWindowGoodMs;
  var missMs = diff ? diff.missMs : S.performWindowMissMs;
  var nw = diff ? diff.noteWeight : 0.75;
  var tw = diff ? diff.timingWeight : 0.25;

  var absDelta = Math.abs(hitDeltaMs);
  var timingScore = 0;
  if (absDelta <= perfectMs) timingScore = 1.0;
  else if (absDelta <= goodMs) timingScore = 0.7;
  else if (absDelta <= missMs) timingScore = 0.3;
  else timingScore = 0;

  var total;
  if (event.type === "strum" && event.rhythm && diff) {
    var dirScore = scoreStrumDirection(event.rhythm.dir, snapshot.strumDir || null, diff);
    var dw = diff.directionWeight || 0;
    // Renormalize weights: note + timing + direction should sum to ~1
    var sumW = nw + tw + dw;
    total = (noteScore * nw + timingScore * tw + dirScore * dw) / (sumW || 1);
  } else {
    total = noteScore * nw + timingScore * tw;
  }

  return {
    score: Math.round(total * 100) / 100,
    grade: gradePerformanceScore(total),
    noteScore: noteScore,
    timingScore: timingScore
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
    ps._currentCombo++;
    if (ps._currentCombo > ps.maxCombo) ps.maxCombo = ps._currentCombo;
    if (result.grade === "perfect") ps.perfects++;
    else if (result.grade === "good") ps.goods++;
    else if (result.grade === "ok") ps.oks++;
  }
}

function finalizePerformanceResults(chart, phraseStats) {
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

  return {
    title: chart.title,
    artist: chart.artist,
    score: Math.round(totalScore * 100),
    accuracy: accuracy,
    maxCombo: maxCombo,
    stars: stars,
    phraseStats: phraseStats,
    totalEvents: totalEvents
  };
}
