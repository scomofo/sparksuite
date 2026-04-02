(function(){

  function getPerformanceStats(songId, arrangementType, difficulty) {
    var key = songId + "_" + (arrangementType || "chords") + "_" + (difficulty || "normal");
    if (!S.performanceStats[key]) {
      S.performanceStats[key] = {
        songId: songId,
        arrangement: arrangementType || "chords",
        difficulty: difficulty || "normal",
        bestScore: 0,
        bestAccuracy: 0,
        bestStars: 0,
        runs: 0,
        lastPlayed: null,
        mastery: "none"
      };
    }
    return S.performanceStats[key];
  }

  function updatePerformanceStats(songId, arrangementType, difficulty, results) {
    var stats = getPerformanceStats(songId, arrangementType, difficulty);
    stats.runs++;
    stats.lastPlayed = new Date().toISOString().split("T")[0];
    if (results.score > stats.bestScore) stats.bestScore = results.score;
    if (results.accuracy > stats.bestAccuracy) stats.bestAccuracy = results.accuracy;
    if (results.stars > stats.bestStars) stats.bestStars = results.stars;
    stats.mastery = computeMasteryLabel(stats);
    return stats;
  }

  function computeMasteryLabel(stats) {
    if (stats.bestStars >= 5 && stats.bestAccuracy >= 95) return "mastered";
    if (stats.bestStars >= 4 && stats.bestAccuracy >= 85) return "proficient";
    if (stats.bestStars >= 3 && stats.bestAccuracy >= 70) return "developing";
    if (stats.runs >= 1) return "attempted";
    return "none";
  }

  function getMasteryColor(mastery) {
    switch (mastery) {
      case "mastered": return "#FFE66D";
      case "proficient": return "#4ECDC4";
      case "developing": return "#45B7D1";
      case "attempted": return "#FF8A5C";
      default: return "var(--text-muted)";
    }
  }

  function getMasteryIcon(mastery) {
    switch (mastery) {
      case "mastered": return "\u2B50";
      case "proficient": return "\u2705";
      case "developing": return "\u{1F4C8}";
      case "attempted": return "\u{1F3AF}";
      default: return "\u26AA";
    }
  }

  function checkPerformanceUnlocks(songId, arrangementType, difficulty, stats) {
    var unlocks = [];
    var key = songId + "_" + arrangementType + "_" + difficulty;

    if (!S.performanceUnlocks[key + "_first"] && stats.runs === 1) {
      S.performanceUnlocks[key + "_first"] = true;
      unlocks.push({ type: "first_clear", label: "First Clear!", xp: 15 });
    }
    if (!S.performanceUnlocks[key + "_3star"] && stats.bestStars >= 3) {
      S.performanceUnlocks[key + "_3star"] = true;
      unlocks.push({ type: "3_star", label: "3 Stars!", xp: 10 });
    }
    if (!S.performanceUnlocks[key + "_5star"] && stats.bestStars >= 5) {
      S.performanceUnlocks[key + "_5star"] = true;
      unlocks.push({ type: "5_star", label: "5 Stars!", xp: 25 });
    }
    if (!S.performanceUnlocks[key + "_mastery"] && stats.mastery === "mastered") {
      S.performanceUnlocks[key + "_mastery"] = true;
      unlocks.push({ type: "mastery", label: "Mastered!", xp: 50 });
    }

    // Award XP for unlocks
    for (var i = 0; i < unlocks.length; i++) {
      S.xp += unlocks[i].xp;
    }

    return unlocks;
  }

  window.getPerformanceStats = getPerformanceStats;
  window.updatePerformanceStats = updatePerformanceStats;
  window.computeMasteryLabel = computeMasteryLabel;
  window.getMasteryColor = getMasteryColor;
  window.getMasteryIcon = getMasteryIcon;
  window.checkPerformanceUnlocks = checkPerformanceUnlocks;

})();
