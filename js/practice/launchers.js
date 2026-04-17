(function(){

  function launchPracticeItem(item){
    if(!item) return false;
    if(item.type==="warmup") return launchWarmupItem(item);
    if(item.type==="transition") return launchTransitionItem(item);
    if(item.type==="rhythm_highway") return launchRhythmHighwayItem(item);
    if(isModuleExerciseItem(item)) return launchModuleExerciseItem(item);
    if(item.type==="performance_song") return launchPerformanceSongItem(item);
    if(item.type==="performance_phrase") return launchPerformancePhraseItem(item);
    if(item.type==="performance_technique") return launchPerformanceTechniqueItem(item);
    if(item.type==="rhythm") return launchRhythmItem(item);
    if(item.type==="finger") return launchFingerItem(item);
    if(item.type==="guided_session" && typeof launchGuidedSessionItem==="function"){
      return launchGuidedSessionItem(item);
    }
    if(item.type==="left_hand_pattern" && typeof launchLeftHandItem==="function"){
      return launchLeftHandItem(item);
    }
    console.warn("Spark: no launcher for item type", item.type);
    return false;
  }

  function launchWarmupItem(item){
    if(item.meta && item.meta.exerciseId && typeof act==="function"){
      act("planStartWarmup", item.meta.exerciseId);
      return true;
    }
    if(typeof act==="function"){
      act("tab", TAB.PRACTICE);
      return true;
    }
    return false;
  }

  function launchTransitionItem(item){
    if(!item.meta) return false;
    var from = item.meta.from || "";
    var to = item.meta.to || "";
    var key = item.meta.key || (from && to ? (from + "|" + to) : "");
    if(typeof act==="function"){
      act("planStartTransition", key);
      return true;
    }
    return false;
  }

  function launchPerformanceSongItem(item){
    if(!item.meta || typeof act!=="function") return false;
    var songId = item.meta.songId || "";
    var arrangementType = item.meta.arrangementType || "chords";
    var difficultyId = item.meta.difficultyId || "normal";
    act("planStartPerformanceSong", songId + "|" + arrangementType + "|" + difficultyId);
    return true;
  }

  function launchPerformancePhraseItem(item){
    if(!item.meta || typeof act!=="function") return false;
    var songId = item.meta.songId || "";
    var arrangementType = item.meta.arrangementType || "chords";
    var difficultyId = item.meta.difficultyId || "normal";
    var phraseId = item.meta.phraseId != null ? item.meta.phraseId : "";
    act("planStartPerformancePhrase", songId + "|" + arrangementType + "|" + difficultyId + "|" + phraseId);
    return true;
  }

  function launchPerformanceTechniqueItem(item){
    if(!item.meta || typeof act!=="function") return false;
    var songId = item.meta.songId || "";
    var arrangementType = item.meta.arrangementType || "imported_chart";
    var difficultyId = item.meta.difficultyId || "normal";
    var techniqueKey = item.meta.techniqueKey || "";
    act("planStartPerformanceTechnique", songId + "|" + arrangementType + "|" + difficultyId + "|" + techniqueKey);
    return true;
  }

  function launchRhythmItem(item){
    var bpm = item && item.meta && item.meta.bpm ? item.meta.bpm : 90;
    if(typeof act==="function"){
      act("planStartRhythm", String(bpm));
      return true;
    }
    return false;
  }

  function launchFingerItem(item){
    if(typeof act!=="function") return false;
    var exerciseId = item && item.meta && item.meta.exerciseId ? item.meta.exerciseId : "";
    act("planStartWarmup", exerciseId);
    return true;
  }

  function launchRhythmHighwayItem(item){
    if(typeof act!=="function") return false;
    act("planStartRhythmHighway", item.id);
    return true;
  }

  function isModuleExerciseItem(item){
    if(!item || !item.meta || !item.meta.instrument || !item.meta.exerciseId) return false;
    var types = {
      lesson: true,
      bassline: true,
      groove: true,
      technique: true,
      arpeggio: true,
      improv: true,
      melody: true,
      strum_pattern: true
    };
    return !!types[item.type];
  }

  function launchModuleExerciseItem(item){
    if(typeof act!=="function" || !item || !item.meta) return false;
    act("planStartModuleExercise", JSON.stringify({
      instrument: item.meta.instrument || null,
      lessonId: item.meta.lessonId || null,
      skill: item.meta.skill || null,
      exerciseId: item.meta.exerciseId || null,
      exerciseName: item.meta.exerciseName || null,
      exerciseFocus: item.meta.exerciseFocus || null,
      exerciseType: item.meta.exerciseType || item.type || null
    }));
    return true;
  }

  window.launchPracticeItem = launchPracticeItem;
  window.launchWarmupItem = launchWarmupItem;
  window.launchTransitionItem = launchTransitionItem;
  window.launchPerformanceSongItem = launchPerformanceSongItem;
  window.launchPerformancePhraseItem = launchPerformancePhraseItem;
  window.launchPerformanceTechniqueItem = launchPerformanceTechniqueItem;
  window.launchRhythmItem = launchRhythmItem;
  window.launchRhythmHighwayItem = launchRhythmHighwayItem;
  window.launchFingerItem = launchFingerItem;
  window.launchModuleExerciseItem = launchModuleExerciseItem;
  window.launchPracticePlanItem = launchPracticeItem;

})();

/* ChordSpark extension: guided session launcher */
(function(){

  function getPracticeLauncherInstrumentType(){
    var inst;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
      inst = SparkInstruments.getActive();
      if (inst) {
        if (inst.instrument) return inst.instrument;
        candidate = inst.id || inst.appId || inst.instrumentId || null;
        if (candidate && typeof SparkInstruments.getAll === "function") {
          all = SparkInstruments.getAll() || [];
          for (i = 0; i < all.length; i++) {
            entry = all[i] || {};
            if (entry.id === candidate || entry.appId === candidate) {
              return entry.instrument || entry.instrumentType || null;
            }
          }
        }
      }
    }
    if (typeof SparkInstrumentAdapter !== "undefined" && SparkInstrumentAdapter.getInstrumentType) {
      return SparkInstrumentAdapter.getInstrumentType();
    }
    return null;
  }

  function launchGuidedSessionItem(item){
    if(typeof act!=="function") return false;
    var sessionNum = item && item.meta && item.meta.guidedSession || S.guidedSession || 1;
    if(getPracticeLauncherInstrumentType()==="piano"){
      act("tab", TAB.PRACTICE);
      act("start_guided_session", sessionNum);
      return true;
    }
    act("guidedStart", sessionNum);
    return true;
  }

  window.launchGuidedSessionItem = launchGuidedSessionItem;

})();
