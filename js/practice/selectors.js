(function(){

  function practiceSelectorRoot(){
    if(typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"){
      return SparkState.getRoot();
    }
    return typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function practiceSelectorRead(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = practiceSelectorRoot();
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function getPracticeSelectorState(){
    return {
      completedLessons: Array.isArray(practiceSelectorRead("completedLessons", [])) ? practiceSelectorRead("completedLessons", []) : [],
      mastery: practiceSelectorRead("mastery", {}) || {},
      performanceStats: practiceSelectorRead("performanceStats", {}) || {},
      transitionStats: practiceSelectorRead("transitionStats", {}) || {},
      rhythmResults: practiceSelectorRead("rhythmResults", null),
      rhythmBpm: practiceSelectorRead("rhythmBpm", 90),
      fingerStats: practiceSelectorRead("fingerStats", {}) || {},
      guidedSession: practiceSelectorRead("guidedSession", 1),
      ukuleleSkillProgress: practiceSelectorRead("ukuleleSkillProgress", {}) || {},
      bassSkillProgress: practiceSelectorRead("bassSkillProgress", {}) || {}
    };
  }

  function getActiveInstrumentModule(){
    if(typeof SparkInstruments==="undefined" || !SparkInstruments.getActive) return null;
    return SparkInstruments.getActive();
  }

  function getActiveInstrumentProgressView(module){
    module = module || getActiveInstrumentModule();
    var instrumentId = module && module.instrument ? module.instrument : null;
    if(window.sparkCore && typeof window.sparkCore.getInstrumentProgressView==="function" && instrumentId){
      return window.sparkCore.getInstrumentProgressView(instrumentId) || {};
    }
    return {};
  }

  function getCompletedLessonIds(){
    if(window.sparkCore && typeof window.sparkCore.getCompletedLessonIds==="function"){
      return window.sparkCore.getCompletedLessonIds();
    }
    var state = getPracticeSelectorState();
    var completed = Array.isArray(state.completedLessons) ? state.completedLessons.slice() : [];
    var mastery = state.mastery && state.mastery.lessons ? state.mastery.lessons : {};
    for(var lessonId in mastery){
      if(mastery[lessonId] && completed.indexOf(lessonId) < 0) completed.push(lessonId);
    }
    return completed;
  }

  function getNextModuleLesson(module){
    if(!module || typeof module.getCurriculumMap!=="function") return null;
    var curriculum = module.getCurriculumMap() || [];
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
    return curriculum[0];
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
    var progressView = getActiveInstrumentProgressView(module);
    var namedSkillProgress = progressView && progressView.namedSkillProgress ? progressView.namedSkillProgress : {};
    var state = getPracticeSelectorState();
    var rhythmMastery = progressView && progressView.rhythmMastery ? progressView.rhythmMastery : ((state.mastery && state.mastery.rhythm) || {});
    var ukuleleSkillProgress = module.instrument === "ukulele" && Object.keys(namedSkillProgress).length
      ? namedSkillProgress
      : (state.ukuleleSkillProgress || {});
    var bassSkillProgress = module.instrument === "bass" && Object.keys(namedSkillProgress).length
      ? namedSkillProgress
      : (state.bassSkillProgress || {});
    var moduleState = {
      completedLessonIds: completedLessonIds,
      mastery: {
        lessons: (state.mastery && state.mastery.lessons) || {},
        rhythm: rhythmMastery
      },
      performanceStats: state.performanceStats || {},
      ukuleleSkillProgress: ukuleleSkillProgress,
      bassSkillProgress: bassSkillProgress
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
    var ts = getPracticeSelectorState().transitionStats || {};
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
    var perf = getPracticeSelectorState().performanceStats || {};
    var weakest = null;
    var buckets = normalizePerformanceBuckets(perf);
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

  function selectImportedTechniqueCandidate(){
    var perf = getPracticeSelectorState().performanceStats || {};
    var buckets = normalizePerformanceBuckets(perf);
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
    var state = getPracticeSelectorState();
    if(!state.rhythmResults || typeof state.rhythmResults.accuracy!=="number") return null;
    if(state.rhythmResults.accuracy >= 75) return null;
    return {
      id:"rhythm_fix",
      type:"rhythm",
      priority:80 - state.rhythmResults.accuracy,
      label:"Rhythm timing practice",
      reason:"Recent rhythm accuracy is low",
      meta:{
        accuracy:state.rhythmResults.accuracy,
        bpm:state.rhythmBpm || 90
      }
    };
  }

  function selectFingerCandidate(){
    var stats = getPracticeSelectorState().fingerStats || {};
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
      selectInstrumentModuleCandidate,
      selectWarmupCandidate,
      selectWeakTransitionCandidate,
      selectImportedTechniqueCandidate,
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

  function normalizePerformanceBuckets(perf){
    var buckets = [];
    for(var key in perf){
      var row = perf[key];
      if(!row) continue;
      if(row.songId || row.arrangement || row.difficulty){
        buckets.push({
          key:key,
          songId:row.songId || key,
          arrangementType:row.arrangement || "chords",
          difficultyId:row.difficulty || "normal",
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

  function readGuidedSessionState(path, fallback){
    if(typeof SparkState!=="undefined" && typeof SparkState.read==="function"){
      return SparkState.read(path, fallback);
    }
    var root = typeof SparkState!=="undefined" && typeof SparkState.getRoot==="function"
      ? SparkState.getRoot()
      : (typeof globalThis!=="undefined" ? (globalThis.__sparkState || globalThis.S || null) : null);
    if(!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function selectGuidedSessionCandidate(){
    var guidedSession = readGuidedSessionState("guidedSession", 1);
    return {
      id:"guided_session_" + (guidedSession || 1),
      type:"guided_session",
      priority:45,
      label:"Continue guided session",
      reason:"Stay aligned with current progression",
      meta:{
        guidedSession:guidedSession || 1
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
