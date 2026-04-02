(function(){

  function generatePersonalInsights(){
    S.personalInsights = {
      weakestSkills: typeof getWeakestMasterySkills === "function" ? getWeakestMasterySkills(5) : [],
      strongestSkills: typeof getStrongestMasterySkills === "function" ? getStrongestMasterySkills(5) : [],
      masteryTrend: typeof buildMasteryTrend === "function" ? buildMasteryTrend() : {},
      practiceTrend: typeof buildPracticeTrendSeries === "function" ? buildPracticeTrendSeries() : {},
      recommendationQuality: typeof buildRecommendationInsights === "function" ? buildRecommendationInsights() : {},
      careerTrend: typeof buildCareerInsights === "function" ? buildCareerInsights() : {},
      packProgress: buildPackInsights()
    };
    S.lastInsightRun = Date.now();
    return S.personalInsights;
  }

  function buildPackInsights(){
    var out = {};
    // Starter placeholder. Later map pack includes -> completion counts.
    return out;
  }

  window.generatePersonalInsights = generatePersonalInsights;

})();
