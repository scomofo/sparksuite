(function(){
  function insightsStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function insightsStateRead(path, fallback){
    var root = insightsStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function insightsStateWrite(path, value){
    var root = insightsStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function getPlayAlongView() {
    var core = window.sparkCore || null;
    if (core && typeof core.getPlayAlongDashboardView === "function") {
      return core.getPlayAlongDashboardView();
    }
    return null;
  }

  function generatePersonalInsights(){
    var existing = insightsStateRead("personalInsights", {});
    var nextInsights = {
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
    insightsStateWrite("personalInsights", nextInsights);
    insightsStateWrite("lastInsightRun", Date.now());
    return nextInsights;
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
    var playAlongView = getPlayAlongView();
    var outcome = playAlongView && Object.prototype.hasOwnProperty.call(playAlongView, "outcome")
      ? playAlongView.outcome
      : (window.sparkCore && typeof window.sparkCore.getLastSessionOutcome === "function"
        ? window.sparkCore.getLastSessionOutcome()
        : (window.sparkCore ? window.sparkCore.lastSessionOutcome : null));
    var recent = playAlongView && Array.isArray(playAlongView.recent)
      ? playAlongView.recent
      : insightsStateRead("playAlongRecent", []);
    var latest = recent.length ? recent[0] : null;
    var weakAreas = playAlongView && Array.isArray(playAlongView.weakAreas)
      ? playAlongView.weakAreas.slice(0, 3)
      : (outcome && outcome.performance && Array.isArray(outcome.performance.weakAreas)
        ? outcome.performance.weakAreas.slice(0, 3)
        : []);
    return mergeObjects({
      recentTitle: latest ? (latest.title || latest.trackId || null) : null,
      transportMode: playAlongView && playAlongView.transportMode != null
        ? playAlongView.transportMode
        : (latest ? (latest.transportMode || null) : null),
      accuracy: outcome && typeof outcome.accuracy === "number" ? (outcome.accuracy <= 1 ? Math.round(outcome.accuracy * 100) : Math.round(outcome.accuracy)) : null,
      weakAreas: weakAreas,
      hasDrill: playAlongView ? !!playAlongView.hasDrill : !!(outcome && Array.isArray(outcome.drills) && outcome.drills.length),
      weakSection: playAlongView && playAlongView.weakSection
        ? playAlongView.weakSection.sectionLabel || null
        : (outcome && outcome.sectionSummary ? outcome.sectionSummary.sectionLabel : null),
      bookmarks: playAlongView && Array.isArray(playAlongView.bookmarks)
        ? playAlongView.bookmarks.slice(0, 2)
        : insightsStateRead("playAlongBookmarks", []).slice(0, 2)
    }, existing || {});
  }

  window.generatePersonalInsights = generatePersonalInsights;

})();
