(function(){

  function buildAnalyticsSummary(){
    var summary = createAnalyticsSummaryShell
      ? createAnalyticsSummaryShell()
      : {
          weakestTransitions:[],
          weakestSongs:[],
          weakestPhrases:[],
          strongestSkills:[],
          recentImprovement:[],
          practiceConsistency:{},
          recommendations:[]
        };
    summary.weakestTransitions = getWeakTransitions();
    summary.weakestSongs = getWeakSongs();
    summary.weakestPhrases = getWeakPhrases();
    summary.strongestSkills = getStrongSkills();
    summary.recentImprovement = getRecentImprovement();
    summary.practiceConsistency = getPracticeConsistency();
    summary.recommendations = buildAnalyticsRecommendations();
    return summary;
  }

  function getWeakTransitions(){
    var ts = S.transitionStats || {};
    var arr = [];
    for(var key in ts){
      var row = ts[key];
      if(!row || !row.attempts) continue;
      var avgMs = row.avgMs != null ? row.avgMs : row.avgTime != null ? row.avgTime : 0;
      var cleanRate = row.clean && row.attempts ? (row.clean / row.attempts) : 0;
      var score = (avgMs / 25) + ((1 - cleanRate) * 100);
      arr.push({
        label:formatTransitionLabelForAnalytics(key),
        score:Math.round(score),
        avgMs:avgMs,
        cleanRate:cleanRate
      });
    }
    arr.sort(function(a,b){ return b.score - a.score; });
    return arr.slice(0,5);
  }

  function getWeakSongs(){
    var perf = S.performanceStats || {};
    var out = [];
    for(var songId in perf){
      var bestAcc = 999;
      var mastered = false;
      for(var arrangementType in perf[songId]){
        for(var difficultyId in perf[songId][arrangementType]){
          var bucket = perf[songId][arrangementType][difficultyId];
          if(!bucket) continue;
          bestAcc = Math.min(bestAcc, bucket.avgAccuracy || 0);
          if(bucket.mastered) mastered = true;
        }
      }
      if(bestAcc===999) continue;
      out.push({
        songId:songId,
        label:prettySongIdForAnalytics(songId),
        accuracy:bestAcc,
        mastered:mastered
      });
    }
    out.sort(function(a,b){ return a.accuracy - b.accuracy; });
    return out.slice(0,5);
  }

  function getWeakPhrases(){
    var perf = S.performanceStats || {};
    var out = [];
    for(var songId in perf){
      for(var arrangementType in perf[songId]){
        for(var difficultyId in perf[songId][arrangementType]){
          var bucket = perf[songId][arrangementType][difficultyId];
          if(!bucket || !bucket.phrases) continue;
          for(var pid in bucket.phrases){
            var p = bucket.phrases[pid];
            var acc = typeof p.avgAccuracy==="number" ? p.avgAccuracy : 0;
            out.push({
              songId:songId,
              phraseId:pid,
              arrangementType:arrangementType,
              difficultyId:difficultyId,
              label:prettySongIdForAnalytics(songId) + " \u00b7 Phrase " + pid,
              accuracy:acc
            });
          }
        }
      }
    }
    out.sort(function(a,b){ return a.accuracy - b.accuracy; });
    return out.slice(0,5);
  }

  function getStrongSkills(){
    var out = [];
    if(S.streak){
      out.push({
        label:"Practice streak",
        value:S.streak
      });
    }
    if(S.level){
      out.push({
        label:"Current level",
        value:S.level
      });
    }
    if(S.performanceStats){
      var masteredSongs = 0;
      for(var songId in S.performanceStats){
        for(var arrangementType in S.performanceStats[songId]){
          for(var difficultyId in S.performanceStats[songId][arrangementType]){
            var bucket = S.performanceStats[songId][arrangementType][difficultyId];
            if(bucket && bucket.mastered) masteredSongs++;
          }
        }
      }
      if(masteredSongs){
        out.push({
          label:"Mastered performances",
          value:masteredSongs
        });
      }
    }
    return out.slice(0,5);
  }

  function getRecentImprovement(){
    var out = [];
    if(S.history && S.history.length >= 2){
      out.push({
        label:"Recent activity",
        value:"Consistent recent practice logged"
      });
    }
    if(S.rhythmResults && typeof S.rhythmResults.accuracy==="number"){
      out.push({
        label:"Rhythm benchmark",
        value:S.rhythmResults.accuracy + "% accuracy"
      });
    }
    return out.slice(0,5);
  }

  function getPracticeConsistency(){
    return {
      streak:S.streak || 0,
      sessions:S.sessions || 0,
      historyCount:(S.history || []).length
    };
  }

  function buildAnalyticsRecommendations(){
    var recs = [];
    var weakTransition = selectWeakTransitionCandidate ? selectWeakTransitionCandidate() : null;
    var weakPerformance = selectWeakPerformanceCandidate ? selectWeakPerformanceCandidate() : null;
    var rhythm = selectRhythmCandidate ? selectRhythmCandidate() : null;
    var finger = selectFingerCandidate ? selectFingerCandidate() : null;
    if(weakTransition) recs.push(toAnalyticsRec(weakTransition));
    if(weakPerformance) recs.push(toAnalyticsRec(weakPerformance));
    if(rhythm) recs.push(toAnalyticsRec(rhythm));
    if(finger) recs.push(toAnalyticsRec(finger));
    recs.sort(function(a,b){ return (b.priority||0) - (a.priority||0); });
    return recs.slice(0,5);
  }

  function toAnalyticsRec(candidate){
    return {
      type:candidate.type,
      label:candidate.label,
      reason:candidate.reason,
      priority:candidate.priority || 0,
      meta:candidate.meta || {}
    };
  }

  function formatTransitionLabelForAnalytics(key){
    if(key.indexOf("->")>=0){
      var a = key.split("->");
      return a[0] + " \u2192 " + a[1];
    }
    if(key.indexOf("_")>=0){
      var b = key.split("_");
      return b[0] + " \u2192 " + b[1];
    }
    return key;
  }

  function prettySongIdForAnalytics(songId){
    return String(songId || "").replace(/_/g," ");
  }

  window.buildAnalyticsSummary = buildAnalyticsSummary;
  window.getWeakTransitions = getWeakTransitions;
  window.getWeakSongs = getWeakSongs;
  window.getWeakPhrases = getWeakPhrases;
  window.getStrongSkills = getStrongSkills;
  window.getRecentImprovement = getRecentImprovement;
  window.getPracticeConsistency = getPracticeConsistency;
  window.buildAnalyticsRecommendations = buildAnalyticsRecommendations;

})();
