(function(){

  function getEffectivePracticeItemType(item){
    var meta = item && item.meta ? item.meta : {};
    var type = item && item.type ? item.type : null;

    if (type === "song" && meta.songId) return "performance_song";
    if (type === "practice") {
      if (meta.guidedSession != null) return "guided_session";
      if (meta.from || meta.to || meta.key) return "transition";
      if (meta.bpm != null) return "rhythm";
      if (meta.exerciseId && meta.instrument && meta.exerciseType) return meta.exerciseType;
      if (meta.exerciseId) return "finger";
    }

    return type;
  }

  function launchPracticeItem(item){
    if(!item) return false;
    var type = getEffectivePracticeItemType(item);
    if(type==="warmup") return launchWarmupItem(item);
    if(type==="chord_practice") return launchChordPracticeItem(item);
    if(type==="transition") return launchTransitionItem(item);
    if(type==="explore") return launchExploreItem(item);
    if(type==="rhythm_highway") return launchRhythmHighwayItem(item);
    if(isModuleExerciseItem(item)) return launchModuleExerciseItem(item);
    if(type==="performance_song") return launchPerformanceSongItem(item);
    if(type==="performance_phrase") return launchPerformancePhraseItem(item);
    if(type==="performance_technique") return launchPerformanceTechniqueItem(item);
    if(type==="rhythm") return launchRhythmItem(item);
    if(type==="finger") return launchFingerItem(item);
    if(type==="guided_session" && typeof launchGuidedSessionItem==="function"){
      return launchGuidedSessionItem(item);
    }
    if(type==="left_hand_pattern" && typeof launchLeftHandItem==="function"){
      return launchLeftHandItem(item);
    }
    if(item.type==="strum") { if(typeof act==="function") act("tab","strum"); return true; }
    if(item.type==="song") { if(typeof act==="function"){ if(item.meta&&item.meta.songId){act("selectSong",item.meta.songId);}else{act("tab","songs");} } return true; }
    if(item.type==="daily") { if(typeof act==="function") act("tab","daily"); return true; }
    if(item.type==="drill") { if(typeof act==="function") act("tab","drill"); return true; }
    if(item.type==="quiz") { if(typeof act==="function") act("tab","quiz"); return true; }
    if(item.type==="ear_training"||item.type==="ear") { if(typeof act==="function") act("tab","ear"); return true; }
    if(item.type==="scale") { if(typeof act==="function") act("tab","tools"); return true; }
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

  function launchChordPracticeItem(item){
    if(typeof act!=="function") return false;
    var chordName = item && item.chord
      ? item.chord
      : (item && item.meta && item.meta.chordName ? item.meta.chordName : "");
    if(!chordName) return launchWarmupItem(item);
    act("startSession", chordName);
    return true;
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

  function launchExploreItem(item){
    var requestResult;
    if(typeof openPerformanceSongSelectionRequest==="function"){
      requestResult = openPerformanceSongSelectionRequest({});
      if(requestResult != null) return true;
    }
    if(typeof act==="function"){
      act("tab", TAB && TAB.SONGS ? TAB.SONGS : "songs");
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
  window.launchChordPracticeItem = launchChordPracticeItem;
  window.launchTransitionItem = launchTransitionItem;
  window.launchPerformanceSongItem = launchPerformanceSongItem;
  window.launchPerformancePhraseItem = launchPerformancePhraseItem;
  window.launchPerformanceTechniqueItem = launchPerformanceTechniqueItem;
  window.launchRhythmItem = launchRhythmItem;
  window.launchRhythmHighwayItem = launchRhythmHighwayItem;
  window.launchExploreItem = launchExploreItem;
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
