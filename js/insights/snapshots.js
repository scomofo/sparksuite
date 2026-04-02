(function(){

  function buildInsightSnapshot(){
    return {
      ts: Date.now(),
      mastery: {
        chords: safeAvgMastery("chords"),
        transitions: safeAvgMastery("transitions"),
        rhythm: safeAvgMastery("rhythm"),
        scales: safeAvgMastery("scales"),
        songs: safeAvgMastery("songs")
      },
      practice: {
        streak: S.practiceStreak || 0,
        totalMinutes: S.totalPracticeMinutes || 0,
        sessions: (S.practiceHistory || []).length,
        avgAccuracy: typeof getAverageAccuracy === "function" ? getAverageAccuracy() : 0
      },
      meta: {
        xp: S.playerXP || 0,
        level: S.playerLevel || 1,
        challengesCompleted: (S.metaProgress && S.metaProgress.challengesCompleted) || 0,
        goalsCompleted: (S.metaProgress && S.metaProgress.goalsCompleted) || 0
      },
      career: {
        clearedSongs: getCareerClearedSongCount(),
        avgStars: getAverageCareerStars(),
        completedStages: getCompletedCareerStageCount()
      }
    };
  }

  function recordInsightSnapshot(){
    var snap = buildInsightSnapshot();
    S.insightSnapshots.push(snap);
    if(S.insightSnapshots.length > 200){
      S.insightSnapshots = S.insightSnapshots.slice(S.insightSnapshots.length - 200);
    }
    saveState();
    return snap;
  }

  function safeAvgMastery(type){
    return typeof getAverageMastery === "function" ? getAverageMastery(type) : 0;
  }

  function getCareerClearedSongCount(){
    var ratings = (S.careerProgress && S.careerProgress.songRatings) || {};
    var count = 0;
    for(var k in ratings){
      if((ratings[k].bestStars || 0) >= 2) count++;
    }
    return count;
  }

  function getAverageCareerStars(){
    var ratings = (S.careerProgress && S.careerProgress.songRatings) || {};
    var total = 0, count = 0;
    for(var k in ratings){
      total += ratings[k].bestStars || 0;
      count++;
    }
    return count ? total / count : 0;
  }

  function getCompletedCareerStageCount(){
    var stages = (S.careerProgress && S.careerProgress.stageCompletion) || {};
    var count = 0;
    for(var k in stages){
      if(stages[k]) count++;
    }
    return count;
  }

  window.buildInsightSnapshot = buildInsightSnapshot;
  window.recordInsightSnapshot = recordInsightSnapshot;

})();
