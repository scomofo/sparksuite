(function(){

  // Keyword heuristic: songIds like "ukulele_island_package" or
  // "bass_midnight_lock_package" have the instrument in the name.
  // Whole-token match to avoid false positives like "bass" in "bassoon".
  function keywordInstrumentFromKey(str) {
    if (typeof str !== "string" || !str) return null;
    var tokens = str.toLowerCase().split(/[^a-z0-9]+/);
    var known = ["ukulele","bass","piano","drums","guitar"];
    for (var i = 0; i < tokens.length; i++) {
      if (known.indexOf(tokens[i]) >= 0) return tokens[i];
    }
    return null;
  }

  // Resolve the instrument a performance bucket "belongs to". Priority:
  //   1. Authoritative chart manifest entry
  //   2. Keyword heuristic on the songId
  //   3. Explicit write-time fallback (active instrument) when caller opts in
  //
  // Deliberately does NOT fall back to SparkInstruments.getActive() on
  // plain reads. Doing so mis-attributes every legacy/unstamped bucket to
  // whoever is currently active — the exact bug that caused bass practice
  // plans to recommend "Replay Ukulele Island" (a malformed key whose
  // songId wasn't in the manifest, so the active-instrument fallback
  // stamped it "bass"). Leave unknown-origin buckets null and let
  // callers that filter by instrument drop them.
  function deriveInstrumentForSong(songId, opts) {
    opts = opts || {};
    var meta = typeof getPerformanceChartMeta === "function" ? getPerformanceChartMeta(songId) : null;
    if (meta && meta.instrument) return meta.instrument;
    var hint = keywordInstrumentFromKey(songId);
    if (hint) return hint;
    if (opts.fallbackToActive) {
      var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
        ? SparkInstruments.getActive()
        : null;
      return (active && (active.instrument || active.instrumentType)) || null;
    }
    return null;
  }

  function getPerformanceStats(songId, arrangementType, difficulty) {
    var key = songId + "_" + (arrangementType || "chords") + "_" + (difficulty || "normal");
    if (!S.performanceStats[key]) {
      // At create time, trust the active instrument as a last resort —
      // the user is actively playing this chart, so whatever instrument
      // is loaded is the right attribution when manifest/keyword don't
      // decide.
      S.performanceStats[key] = {
        songId: songId,
        arrangement: arrangementType || "chords",
        difficulty: difficulty || "normal",
        instrument: deriveInstrumentForSong(songId, { fallbackToActive: true }),
        bestScore: 0,
        bestAccuracy: 0,
        bestStars: 0,
        runs: 0,
        lastPlayed: null,
        mastery: "none",
        importedTechniqueTotals: {},
        lastFocusedTechnique: null,
        focusedTechniqueRuns: {}
      };
    } else if (!S.performanceStats[key].instrument) {
      // Lazy read-time backfill — NO active-instrument fallback; leave
      // it null if manifest/keyword can't identify it, so it'll get
      // filtered out rather than mis-attributed.
      var inferred = deriveInstrumentForSong(songId);
      if (inferred) S.performanceStats[key].instrument = inferred;
    }
    return S.performanceStats[key];
  }

  window.deriveInstrumentForPerformanceSong = deriveInstrumentForSong;

  function updatePerformanceStats(songId, arrangementType, difficulty, results) {
    var stats = getPerformanceStats(songId, arrangementType, difficulty);
    stats.runs++;
    stats.lastPlayed = new Date().toISOString().split("T")[0];
    if (results.score > stats.bestScore) stats.bestScore = results.score;
    if (results.accuracy > stats.bestAccuracy) stats.bestAccuracy = results.accuracy;
    if (results.stars > stats.bestStars) stats.bestStars = results.stars;
    stats.lastTechniqueSummary = results.importedTechniqueSummary || null;
    stats.lastFocusedTechnique = results.focusedTechnique || null;
    accumulateFocusedTechniqueRuns(stats, results.focusedTechnique);
    accumulateImportedTechniqueTotals(stats, results.importedTechniqueSummary);
    stats.mastery = computeMasteryLabel(stats);
    return stats;
  }

  function accumulateImportedTechniqueTotals(stats, summary) {
    if (!summary) return;
    if (!stats.importedTechniqueTotals) stats.importedTechniqueTotals = {};
    for (var key in summary) {
      if (!Object.prototype.hasOwnProperty.call(summary, key)) continue;
      if (!stats.importedTechniqueTotals[key]) {
        stats.importedTechniqueTotals[key] = { total: 0, hits: 0, misses: 0 };
      }
      stats.importedTechniqueTotals[key].total += summary[key].total || 0;
      stats.importedTechniqueTotals[key].hits += summary[key].hits || 0;
      stats.importedTechniqueTotals[key].misses += summary[key].misses || 0;
    }
  }

  function computeMasteryLabel(stats) {
    if (stats.bestStars >= 5 && stats.bestAccuracy >= 95) return "mastered";
    if (stats.bestStars >= 4 && stats.bestAccuracy >= 85) return "proficient";
    if (stats.bestStars >= 3 && stats.bestAccuracy >= 70) return "developing";
    if (stats.runs >= 1) return "attempted";
    return "none";
  }

  function accumulateFocusedTechniqueRuns(stats, focusedTechnique) {
    if (!focusedTechnique) return;
    if (!stats.focusedTechniqueRuns) stats.focusedTechniqueRuns = {};
    if (!stats.focusedTechniqueRuns[focusedTechnique]) stats.focusedTechniqueRuns[focusedTechnique] = 0;
    stats.focusedTechniqueRuns[focusedTechnique]++;
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
  window.accumulateImportedTechniqueTotals = accumulateImportedTechniqueTotals;
  window.accumulateFocusedTechniqueRuns = accumulateFocusedTechniqueRuns;

})();
