(function(){

  function insightSnapshotRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function insightSnapshotRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = insightSnapshotRoot();
    if(!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function insightSnapshotWrite(path, value){
    if(typeof SparkState!=="undefined" && typeof SparkState.write==="function"){
      return SparkState.write(path, value);
    }
    var root = insightSnapshotRoot();
    if(root) root[path] = value;
    return value;
  }

  function getCareerProgressSnapshot(){
    return insightSnapshotRead("careerProgress", {}) || {};
  }

  function buildInsightSnapshot(){
    var practiceHistory = Array.isArray(insightSnapshotRead("practiceHistory", [])) ? insightSnapshotRead("practiceHistory", []) : [];
    var metaProgress = insightSnapshotRead("metaProgress", {}) || {};
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
        streak: insightSnapshotRead("practiceStreak", 0) || 0,
        totalMinutes: insightSnapshotRead("totalPracticeMinutes", 0) || 0,
        sessions: practiceHistory.length,
        avgAccuracy: typeof getAverageAccuracy === "function" ? getAverageAccuracy() : 0
      },
      meta: {
        xp: insightSnapshotRead("playerXP", insightSnapshotRead("xp", 0)) || 0,
        level: insightSnapshotRead("playerLevel", insightSnapshotRead("level", 1)) || 1,
        challengesCompleted: metaProgress.challengesCompleted || 0,
        goalsCompleted: metaProgress.goalsCompleted || 0
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
    var snapshots = Array.isArray(insightSnapshotRead("insightSnapshots", [])) ? insightSnapshotRead("insightSnapshots", []) : [];
    snapshots.push(snap);
    if(snapshots.length > 200){
      snapshots = snapshots.slice(snapshots.length - 200);
    }
    insightSnapshotWrite("insightSnapshots", snapshots);
    saveState();
    return snap;
  }

  function safeAvgMastery(type){
    return typeof getAverageMastery === "function" ? getAverageMastery(type) : 0;
  }

  function getCareerClearedSongCount(){
    var ratings = getCareerProgressSnapshot().songRatings || {};
    var count = 0;
    for(var k in ratings){
      if((ratings[k].bestStars || 0) >= 2) count++;
    }
    return count;
  }

  function getAverageCareerStars(){
    var ratings = getCareerProgressSnapshot().songRatings || {};
    var total = 0, count = 0;
    for(var k in ratings){
      total += ratings[k].bestStars || 0;
      count++;
    }
    return count ? total / count : 0;
  }

  function getCompletedCareerStageCount(){
    var stages = getCareerProgressSnapshot().stageCompletion || {};
    var count = 0;
    for(var k in stages){
      if(stages[k]) count++;
    }
    return count;
  }

  window.buildInsightSnapshot = buildInsightSnapshot;
  window.recordInsightSnapshot = recordInsightSnapshot;

})();
