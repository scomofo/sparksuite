(function(){

  function createPerformanceChartShell(){
    return { id:"", songId:"", title:"", artist:"", arrangementType:"", bpm:80, phrases:[], events:[] };
  }

  function createPerformanceEventShell(){
    return { id:null, t:0, dur:0, type:"", target:{}, hand:null, performance:{ laneLabel:"", phraseId:null } };
  }

  function createPerformanceResultShell(){
    return { songId:"", arrangementType:"", difficultyId:"", accuracy:0, stars:0, score:0, maxCombo:0, phrases:[] };
  }

  function createPracticePlanShell(){
    return { generatedDate:"", focus:"", items:[] };
  }

  function createPracticePlanItemShell(){
    return { id:"", type:"", label:"", durationSec:0, meta:{} };
  }

  function createAnalyticsSummaryShell(){
    return { weakestTransitions:[], weakestSongs:[], weakestPhrases:[], strongestSkills:[], recentImprovement:[], practiceConsistency:{}, recommendations:[] };
  }

  function createSkillTreeNodeShell(){
    return { id:"", branch:"", label:"", status:"locked", progress:0, meta:{}, children:[] };
  }

  function createRecommendationItemShell(){
    return { type:"", label:"", reason:"", priority:0, meta:{} };
  }

  window.createPerformanceChartShell = createPerformanceChartShell;
  window.createPerformanceEventShell = createPerformanceEventShell;
  window.createPerformanceResultShell = createPerformanceResultShell;
  window.createPracticePlanShell = createPracticePlanShell;
  window.createPracticePlanItemShell = createPracticePlanItemShell;
  window.createAnalyticsSummaryShell = createAnalyticsSummaryShell;
  window.createSkillTreeNodeShell = createSkillTreeNodeShell;
  window.createRecommendationItemShell = createRecommendationItemShell;

})();
