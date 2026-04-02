(function(){

  function selectWarmupCandidate(){
    var item = null;
    if(typeof selectFingerWarmupCandidate==="function"){
      item = selectFingerWarmupCandidate();
      if(item) return item;
    }
    return {
      id:"warmup_default",
      type:"warmup",
      priority:40,
      label:"Quick warmup",
      reason:"Start with a short warmup",
      meta:{ durationSec:120 }
    };
  }

  function selectWeakTransitionCandidate(){
    var ts = S.transitionStats || {};
    var best = null;
    for(var key in ts){
      var row = ts[key];
      if(!row || !row.attempts) continue;
      var avgMs = row.avgMs != null ? row.avgMs : row.avgTime != null ? row.avgTime : 0;
      var cleanRate = row.clean && row.attempts ? (row.clean / row.attempts) : 0;
      var weakness = (avgMs / 25) + ((1 - cleanRate) * 100);
      if(!best || weakness > best.priority){
        best = {
          id:"transition_" + key.replace(/[^a-zA-Z0-9]/g,"_"),
          type:"transition",
          priority:Math.round(weakness),
          label:formatTransitionLabel(key),
          reason:"Weak transition speed or cleanliness",
          meta:{
            key:key,
            avgMs:avgMs,
            cleanRate:cleanRate
          }
        };
      }
    }
    return best;
  }

  function selectWeakPerformanceCandidate(){
    var perf = S.performanceStats || {};
    var weakest = null;
    for(var songId in perf){
      var songStats = perf[songId];
      for(var arrangementType in songStats){
        for(var difficultyId in songStats[arrangementType]){
          var bucket = songStats[arrangementType][difficultyId];
          if(!bucket) continue;
          var acc = bucket.avgAccuracy || 0;
          var priority = 100 - acc;
          if(bucket.mastered) priority -= 25;
          if((bucket.attempts || 0) < 2) priority += 10;

          if(!weakest || priority > weakest.priority){
            weakest = {
              id:"perf_" + songId + "_" + arrangementType + "_" + difficultyId,
              type:"performance_song",
              priority:priority,
              label:"Replay " + prettySongId(songId),
              reason:"Low recent performance accuracy",
              meta:{
                songId:songId,
                arrangementType:arrangementType,
                difficultyId:difficultyId,
                accuracy:acc
              }
            };
          }

          var weakPhrase = getWeakestPhraseFromBucket(bucket);
          if(weakPhrase){
            var phrasePriority = priority + 8;
            if(!weakest || phrasePriority > weakest.priority){
              weakest = {
                id:"phrase_" + songId + "_" + weakPhrase.phraseId,
                type:"performance_phrase",
                priority:phrasePriority,
                label:"Practice weakest phrase in " + prettySongId(songId),
                reason:"Phrase accuracy is lagging",
                meta:{
                  songId:songId,
                  arrangementType:arrangementType,
                  difficultyId:difficultyId,
                  phraseId:weakPhrase.phraseId,
                  accuracy:weakPhrase.avgAccuracy || 0
                }
              };
            }
          }
        }
      }
    }
    return weakest;
  }

  function selectRhythmCandidate(){
    if(!S.rhythmResults || typeof S.rhythmResults.accuracy!=="number") return null;
    if(S.rhythmResults.accuracy >= 75) return null;
    return {
      id:"rhythm_fix",
      type:"rhythm",
      priority:80 - S.rhythmResults.accuracy,
      label:"Rhythm timing practice",
      reason:"Recent rhythm accuracy is low",
      meta:{
        accuracy:S.rhythmResults.accuracy,
        bpm:S.rhythmBpm || 90
      }
    };
  }

  function selectFingerCandidate(){
    var stats = S.fingerStats || {};
    var weakest = null;
    for(var key in stats){
      var row = stats[key];
      if(!row) continue;
      var completions = row.completions || 0;
      var bestSpeed = row.bestTrillSpeed || row.bestSpeed || 0;
      var priority = 50 - Math.min(40, completions * 4) - Math.min(10, bestSpeed);
      if(!weakest || priority > weakest.priority){
        weakest = {
          id:"finger_" + key,
          type:"finger",
          priority:priority,
          label:"Finger exercise " + key,
          reason:"Needs more repetition",
          meta:{
            exerciseId:key,
            completions:completions,
            bestSpeed:bestSpeed
          }
        };
      }
    }
    return weakest;
  }

  function buildPracticeCandidates(){
    var out = [];
    var fns = [
      selectWarmupCandidate,
      selectWeakTransitionCandidate,
      selectWeakPerformanceCandidate,
      selectRhythmCandidate,
      selectFingerCandidate
    ];
    for(var i=0;i<fns.length;i++){
      var item = fns[i]();
      if(item) out.push(item);
    }
    out.sort(function(a,b){ return (b.priority||0) - (a.priority||0); });
    return out;
  }

  function getWeakestPhraseFromBucket(bucket){
    if(!bucket || !bucket.phrases) return null;
    var weakest = null;
    for(var pid in bucket.phrases){
      var p = bucket.phrases[pid];
      var acc = typeof p.avgAccuracy==="number" ? p.avgAccuracy : 0;
      if(!weakest || acc < weakest.avgAccuracy){
        weakest = {
          phraseId:pid,
          avgAccuracy:acc
        };
      }
    }
    return weakest;
  }

  function formatTransitionLabel(key){
    if(key.indexOf("->") >= 0){
      var parts = key.split("->");
      return "Practice " + parts[0] + " \u2192 " + parts[1];
    }
    if(key.indexOf("_") >= 0){
      var p = key.split("_");
      return "Practice " + p[0] + " \u2192 " + p[1];
    }
    return "Practice " + key;
  }

  function prettySongId(songId){
    return String(songId || "").replace(/_/g," ");
  }

  window.selectWarmupCandidate = selectWarmupCandidate;
  window.selectWeakTransitionCandidate = selectWeakTransitionCandidate;
  window.selectWeakPerformanceCandidate = selectWeakPerformanceCandidate;
  window.selectRhythmCandidate = selectRhythmCandidate;
  window.selectFingerCandidate = selectFingerCandidate;
  window.buildPracticeCandidates = buildPracticeCandidates;

})();

/* ChordSpark extension: guided session candidate */
(function(){

  function selectGuidedSessionCandidate(){
    return {
      id:"guided_session_" + (S.guidedSession || 1),
      type:"guided_session",
      priority:45,
      label:"Continue guided session",
      reason:"Stay aligned with current progression",
      meta:{
        guidedSession:S.guidedSession || 1
      }
    };
  }

  var _baseBuildPracticeCandidates = buildPracticeCandidates;
  buildPracticeCandidates = function(){
    var out = _baseBuildPracticeCandidates();
    var g = selectGuidedSessionCandidate();
    if(g) out.push(g);
    out.sort(function(a,b){ return (b.priority||0) - (a.priority||0); });
    return out;
  };

  window.selectGuidedSessionCandidate = selectGuidedSessionCandidate;

})();
