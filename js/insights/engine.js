(function(){

  function generatePersonalInsights(){
    var existing = S.personalInsights || {};
    S.personalInsights = {
      weakestSkills: typeof getWeakestMasterySkills === "function" ? getWeakestMasterySkills(5) : [],
      strongestSkills: typeof getStrongestMasterySkills === "function" ? getStrongestMasterySkills(5) : [],
      masteryTrend: typeof buildMasteryTrend === "function" ? buildMasteryTrend() : {},
      practiceTrend: typeof buildPracticeTrendSeries === "function" ? buildPracticeTrendSeries() : {},
      recommendationQuality: mergeObjects(typeof buildRecommendationInsights === "function" ? buildRecommendationInsights() : {}, existing.recommendationQuality || {}),
      careerTrend: typeof buildCareerInsights === "function" ? buildCareerInsights() : {},
      packProgress: buildPackInsights(),
      coach: existing.coach || null,
      playAlongSummary: buildPlayAlongInsightSummary(existing.playAlongSummary)
    };
    S.lastInsightRun = Date.now();
    return S.personalInsights;
  }

  function buildPackInsights(){
    var out = {};
    // Starter placeholder. Later map pack includes -> completion counts.
    return out;
  }

  function mergeObjects(primary, secondary) {
    var out = {};
    var key;
    primary = primary || {};
    secondary = secondary || {};
    for (key in secondary) if (Object.prototype.hasOwnProperty.call(secondary, key)) out[key] = secondary[key];
    for (key in primary) if (Object.prototype.hasOwnProperty.call(primary, key)) out[key] = primary[key];
    return out;
  }

  function buildPlayAlongInsightSummary(existing) {
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome ? window.sparkCore.lastSessionOutcome : null;
    var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent : [];
    var latest = recent.length ? recent[0] : null;
    var weakAreas = outcome && outcome.performance && Array.isArray(outcome.performance.weakAreas)
      ? outcome.performance.weakAreas.slice(0, 3)
      : [];
    return mergeObjects({
      recentTitle: latest ? (latest.title || latest.trackId || null) : null,
      transportMode: latest ? (latest.transportMode || null) : null,
      accuracy: outcome && typeof outcome.accuracy === "number" ? (outcome.accuracy <= 1 ? Math.round(outcome.accuracy * 100) : Math.round(outcome.accuracy)) : null,
      weakAreas: weakAreas,
      hasDrill: !!(outcome && Array.isArray(outcome.drills) && outcome.drills.length),
      weakSection: outcome && outcome.sectionSummary ? outcome.sectionSummary.sectionLabel : null,
      bookmarks: Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks.slice(0, 2) : []
    }, existing || {});
  }

  window.generatePersonalInsights = generatePersonalInsights;

})();
