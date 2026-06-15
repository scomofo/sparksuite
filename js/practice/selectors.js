(function(){

  function getActiveInstrumentModule(){
    var module;
    var candidate;
    var all;
    var i;
    var entry;
    if(typeof SparkInstruments==="undefined" || !SparkInstruments.getActive) return null;
    module = SparkInstruments.getActive();
    if(!module) return null;
    if(typeof module.getCurriculumMap==="function" || typeof module.getExercises==="function") return module;
    candidate = module.id || module.appId || module.instrumentId || null;
    if(!candidate || typeof SparkInstruments.getAll!=="function") return module;
    all = SparkInstruments.getAll() || [];
    for(i=0;i<all.length;i++){
      entry = all[i] || {};
      if(entry.id===candidate || entry.appId===candidate) return entry;
    }
    return module;
  }

  function getCompletedLessonIds(){
    var completed = Array.isArray(S.completedLessons) ? S.completedLessons.slice() : [];
    var mastery = typeof SparkMastery !== "undefined"
      ? SparkMastery.category("lessons")
      : (S.mastery && S.mastery.lessons ? S.mastery.lessons : {});
    var instrumentModule = null;
    var instrumentType = null;
    var v2Completed = null;
    for(var lessonId in mastery){
      if(mastery[lessonId]) completed.push(lessonId);
    }
    instrumentModule = getActiveInstrumentModule();
    instrumentType = instrumentModule && (instrumentModule.instrument || instrumentModule.instrumentType)
      ? (instrumentModule.instrument || instrumentModule.instrumentType)
      : null;
    v2Completed = instrumentType && S.curriculumV2CompletedSessions ? S.curriculumV2CompletedSessions[instrumentType] : null;
    if(Array.isArray(v2Completed)){
      for(var i=0;i<v2Completed.length;i++){
        if(completed.indexOf(v2Completed[i])===-1) completed.push(v2Completed[i]);
      }
    }
    return completed;
  }

  function getNextModuleLesson(module){
    if(!module) return null;
    var curriculum = typeof module.getCurriculumMap==="function" ? (module.getCurriculumMap() || []) : [];
    if(!curriculum.length && typeof module.getCurriculumMapV2==="function"){
      curriculum = module.getCurriculumMapV2() || [];
    }
    if(!curriculum.length) return null;
    var completed = getCompletedLessonIds();
    if(curriculum[0] && curriculum[0].id && typeof getNextLessonFromCurriculum==="function"){
      var nextLessonId = getNextLessonFromCurriculum(curriculum[0].id, completed);
      if(nextLessonId){
        for(var i=0;i<curriculum.length;i++){
          if(curriculum[i] && curriculum[i].id===nextLessonId) return curriculum[i];
        }
      }
    }
    for(var j=0;j<curriculum.length;j++){
      if(curriculum[j] && curriculum[j].id && completed.indexOf(curriculum[j].id)===-1) return curriculum[j];
    }
    return null;
  }

  function selectInstrumentModuleCandidate(){
    var module = getActiveInstrumentModule();
    if(!module || typeof module.getExercises!=="function") return null;
    var lesson = getNextModuleLesson(module);
    if(!lesson || !lesson.skill) return null;
    var exercises = module.getExercises(lesson.skill) || [];
    if(!exercises.length) return null;
    var instrumentName = module.name || module.instrument || "Instrument";
    var completedLessonIds = getCompletedLessonIds();
    var moduleState = {
      completedLessonIds: completedLessonIds,
      // Pass the per-instrument mastery branch in the OLD flat shape
      // (chords/lessons/rhythm/…) — per-instrument module callbacks
      // still expect that layout.
      mastery: typeof SparkMastery !== "undefined" ? SparkMastery.all() : (S.mastery || {}),
      performanceStats: S.performanceStats || {},
      ukuleleSkillProgress: S.ukuleleSkillProgress || {},
      bassSkillProgress: S.bassSkillProgress || {}
    };
    var exercise = typeof module.pickPracticeExercise==="function"
      ? (module.pickPracticeExercise(lesson, exercises.slice(), moduleState) || exercises[0])
      : exercises[0];
    var recommendation = typeof module.getPracticeRecommendation==="function"
      ? (module.getPracticeRecommendation(lesson, exercise, moduleState) || {})
      : {};
    var label = instrumentName + ": " + (lesson.title || lesson.skill);
    if(recommendation.labelSuffix) label += " - " + recommendation.labelSuffix;
    if(exercise && exercise.name) label += " (" + exercise.name + ")";
    return {
      id:"module_" + (lesson.id || lesson.skill),
      type:exercise.type || "lesson",
      priority:96 + (recommendation.priorityBoost || 0),
      label:label,
      reason:recommendation.reason || ("Continue module progression with " + lesson.skill),
      meta:{
        lessonId:lesson.id || null,
        skill:lesson.skill,
        exerciseId:exercise.id || null,
        exerciseName:exercise.name || null,
        exerciseFocus:exercise.focus || null,
        exerciseType:exercise.type || null,
        instrument:module.instrument || null,
        recommendationFocus:recommendation.focusTag || null,
        progressSummary:recommendation.progressSummary || null
      }
    };
  }

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
    var ts = typeof SparkTransitionStats !== "undefined" ? SparkTransitionStats.all() : (S.transitionStats || {});
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

  function selectWeakPerformanceCandidate(instrumentFilter){
    var perf = S.performanceStats || {};
    var weakest = null;
    var buckets = normalizePerformanceBuckets(perf, instrumentFilter);
    for(var i=0;i<buckets.length;i++){
      var bucket = buckets[i];
      var acc = bucket.bestAccuracy != null ? bucket.bestAccuracy : bucket.avgAccuracy || 0;
      var priority = 100 - acc;
      if(bucket.mastery==="mastered" || bucket.mastered) priority -= 25;
      if((bucket.runs || bucket.attempts || 0) < 2) priority += 10;

      var weakTechnique = getWeakestTechniqueFromBucket(bucket);
      if(weakTechnique) priority += Math.round((85 - weakTechnique.accuracy) / 2);

      if(!weakest || priority > weakest.priority){
        weakest = {
          id:"perf_" + bucket.songId + "_" + bucket.arrangementType + "_" + bucket.difficultyId,
          type:"performance_song",
          priority:priority,
          label:"Replay " + prettySongId(bucket.songId),
          reason:weakTechnique
            ? ("Weak " + weakTechnique.label + " accuracy")
            : "Low recent performance accuracy",
          meta:{
            songId:bucket.songId,
            arrangementType:bucket.arrangementType,
            difficultyId:bucket.difficultyId,
            accuracy:acc,
            techniqueKey:weakTechnique ? weakTechnique.key : null
          }
        };
      }

      var weakPhrase = getWeakestPhraseFromBucket(bucket);
      if(weakPhrase){
        var phrasePriority = priority + 8;
        if(!weakest || phrasePriority > weakest.priority){
          weakest = {
            id:"phrase_" + bucket.songId + "_" + weakPhrase.phraseId,
            type:"performance_phrase",
            priority:phrasePriority,
            label:"Practice weakest phrase in " + prettySongId(bucket.songId),
            reason:"Phrase accuracy is lagging",
            meta:{
              songId:bucket.songId,
              arrangementType:bucket.arrangementType,
              difficultyId:bucket.difficultyId,
              phraseId:weakPhrase.phraseId,
              accuracy:weakPhrase.avgAccuracy || 0
            }
          };
        }
      }
    }
    return weakest;
  }

  function selectImportedTechniqueCandidate(instrumentFilter){
    var perf = S.performanceStats || {};
    var buckets = normalizePerformanceBuckets(perf, instrumentFilter);
    var strongestNeed = null;
    for(var i=0;i<buckets.length;i++){
      var bucket = buckets[i];
      var weakTechnique = getFocusedTechniqueNeed(bucket) || getWeakestTechniqueFromBucket(bucket);
      if(!weakTechnique) continue;
      var priority = (weakTechnique.fromFocus ? 195 : 120) - weakTechnique.accuracy;
      if((bucket.runs || bucket.attempts || 0) < 3) priority += 6;
      if(!strongestNeed || priority > strongestNeed.priority){
        strongestNeed = {
          id:"imported_technique_" + bucket.songId + "_" + weakTechnique.key,
          type:"performance_technique",
          priority:priority,
          label:(weakTechnique.fromFocus ? "Stay on " : "Fix ") + weakTechnique.label + " timing in " + prettySongId(bucket.songId),
          reason:weakTechnique.fromFocus
            ? ("Current focus block still has " + weakTechnique.label + " at " + weakTechnique.accuracy + "%")
            : ("Imported " + weakTechnique.label + " accuracy is at " + weakTechnique.accuracy + "%"),
          meta:{
            songId:bucket.songId,
            arrangementType:bucket.arrangementType,
            difficultyId:bucket.difficultyId,
            techniqueKey:weakTechnique.key,
            techniqueAccuracy:weakTechnique.accuracy,
            continuedFocus:!!weakTechnique.fromFocus
          }
        };
      }
    }
    return strongestNeed;
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
    var stats = typeof SparkFingerStats !== "undefined" ? SparkFingerStats.all() : (S.fingerStats || {});
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

  function resolveActiveInstrumentType(){
    var active = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive
      ? SparkInstruments.getActive()
      : null;
    return (active && (active.instrument || active.instrumentType)) || null;
  }

  function buildPracticeCandidates(){
    var activeType = resolveActiveInstrumentType();
    var out = [];
    var fns = [
      function(){ return selectInstrumentModuleCandidate(); },
      function(){ return selectWarmupCandidate(); },
      function(){ return selectWeakTransitionCandidate(); },
      function(){ return selectImportedTechniqueCandidate(activeType); },
      function(){ return selectWeakPerformanceCandidate(activeType); },
      function(){ return selectRhythmCandidate(); },
      function(){ return selectFingerCandidate(); }
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
    if(Array.isArray(bucket.phrases)){
      for(var i=0;i<bucket.phrases.length;i++){
        var arrPhrase = bucket.phrases[i];
        var arrAcc = typeof arrPhrase.avgAccuracy==="number" ? arrPhrase.avgAccuracy : 0;
        if(!weakest || arrAcc < weakest.avgAccuracy){
          weakest = {
            phraseId:arrPhrase.phraseId || arrPhrase.id || String(i),
            avgAccuracy:arrAcc
          };
        }
      }
      return weakest;
    }
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

  function getWeakestTechniqueFromBucket(bucket){
    var totals = bucket && bucket.importedTechniqueTotals;
    if(!totals) return null;
    var weakest = null;
    var labels = {
      open:"open-note",
      tap:"tap-note",
      forced:"forced-note",
      specialPhrase:"phrase"
    };
    for(var key in totals){
      var row = totals[key];
      if(!row || !row.total) continue;
      var accuracy = Math.round(((row.hits || 0) / row.total) * 100);
      if(accuracy >= 85) continue;
      if(!weakest || accuracy < weakest.accuracy){
        weakest = {
          key:key,
          accuracy:accuracy,
          label:labels[key] || key
        };
      }
    }
    return weakest;
  }

  function getFocusedTechniqueNeed(bucket){
    if(!bucket || !bucket.importedTechniqueTotals || !bucket.lastFocusedTechnique) return null;
    var focused = bucket.importedTechniqueTotals[bucket.lastFocusedTechnique];
    if(!focused || !focused.total) return null;
    var accuracy = Math.round(((focused.hits || 0) / focused.total) * 100);
    if(accuracy >= 90) return null;
    return {
      key: bucket.lastFocusedTechnique,
      label: formatTechniqueLabel(bucket.lastFocusedTechnique),
      accuracy: accuracy,
      fromFocus: true
    };
  }

  // Keyword heuristic: a songId/key that contains a known instrument
  // token (e.g. "ukulele_island_package_ukulele_strum") is almost
  // certainly that instrument's, even if the chart manifest doesn't know
  // the id (some malformed double-stamped keys exist in legacy saves).
  // Match whole-token only to avoid "bass"-in-"bassoon" style confusion.
  function keywordInstrumentFromKey(str){
    if(typeof str !== "string" || !str) return null;
    var tokens = str.toLowerCase().split(/[^a-z0-9]+/);
    var known = ["ukulele","bass","piano","drums","guitar"];
    for(var i=0;i<tokens.length;i++){
      if(known.indexOf(tokens[i]) >= 0) return tokens[i];
    }
    return null;
  }

  // READ-time instrument resolver for performance buckets. Intentionally
  // does NOT fall back to the active instrument — doing so would mis-
  // attribute every legacy unstamped bucket to whoever the user is now,
  // which is the exact bug that caused bass plans to recommend "Replay
  // Ukulele Island". Returns null for unknown-origin buckets so the
  // filter drops them rather than faking an instrument.
  function resolveBucketInstrument(row, songId, bucketKey){
    if(row && row.instrument) return row.instrument;
    if(typeof getPerformanceChartMeta === "function"){
      var meta = getPerformanceChartMeta(songId);
      if(meta && meta.instrument) return meta.instrument;
    }
    var hint = keywordInstrumentFromKey(songId) || keywordInstrumentFromKey(bucketKey);
    if(hint) return hint;
    return null;
  }

  function normalizePerformanceBuckets(perf, instrumentFilter){
    var buckets = [];
    for(var key in perf){
      var row = perf[key];
      if(!row) continue;
      if(row.songId || row.arrangement || row.difficulty){
        var songIdFlat = row.songId || key;
        var resolvedInst = resolveBucketInstrument(row, songIdFlat, key);
        buckets.push({
          key:key,
          songId:songIdFlat,
          arrangementType:row.arrangement || "chords",
          difficultyId:row.difficulty || "normal",
          instrument:resolvedInst,
          bestAccuracy:row.bestAccuracy,
          avgAccuracy:row.avgAccuracy,
          runs:row.runs,
          attempts:row.attempts,
          mastery:row.mastery,
          mastered:row.mastered,
          phrases:row.phrases,
          importedTechniqueTotals:row.importedTechniqueTotals,
          lastFocusedTechnique:row.lastFocusedTechnique
        });
        continue;
      }
      for(var arrangementType in row){
        var difficulties = row[arrangementType];
        if(!difficulties || typeof difficulties!=="object") continue;
        for(var difficultyId in difficulties){
          var bucket = difficulties[difficultyId];
          if(!bucket) continue;
          buckets.push({
            key:key,
            songId:key,
            arrangementType:arrangementType,
            difficultyId:difficultyId,
            instrument:resolveBucketInstrument(bucket, key, key),
            bestAccuracy:bucket.bestAccuracy,
            avgAccuracy:bucket.avgAccuracy,
            runs:bucket.runs,
            attempts:bucket.attempts,
            mastery:bucket.mastery,
            mastered:bucket.mastered,
            phrases:bucket.phrases,
            importedTechniqueTotals:bucket.importedTechniqueTotals,
            lastFocusedTechnique:bucket.lastFocusedTechnique
          });
        }
      }
    }
    // When a filter is supplied, only return buckets whose instrument matches.
    // Buckets with unknown instrument are excluded under a filter so we don't
    // mis-attribute legacy data across instruments — the candidate will simply
    // not surface until a run stamps a real instrument onto the bucket.
    if(instrumentFilter){
      buckets = buckets.filter(function(b){
        return b.instrument && b.instrument === instrumentFilter;
      });
    }
    return buckets;
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

  function formatTechniqueLabel(key){
    var labels = {
      open: "open-note",
      tap: "tap-note",
      forced: "forced-note",
      specialPhrase: "phrase section"
    };
    return labels[key] || String(key || "technique");
  }

  window.selectWarmupCandidate = selectWarmupCandidate;
  window.selectInstrumentModuleCandidate = selectInstrumentModuleCandidate;
  window.selectWeakTransitionCandidate = selectWeakTransitionCandidate;
  window.selectWeakPerformanceCandidate = selectWeakPerformanceCandidate;
  window.selectImportedTechniqueCandidate = selectImportedTechniqueCandidate;
  window.selectRhythmCandidate = selectRhythmCandidate;
  window.selectFingerCandidate = selectFingerCandidate;
  window.buildPracticeCandidates = buildPracticeCandidates;
  window.normalizePerformanceBuckets = normalizePerformanceBuckets;
  window.getWeakestTechniqueFromBucket = getWeakestTechniqueFromBucket;

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
