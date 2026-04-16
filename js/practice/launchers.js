(function(){

  function getCurrentPracticePlan(){
    if(typeof window.sparkCore !== "undefined" && window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"){
      var view = window.sparkCore.getActiveSessionView();
      if(view && view.plan && view.plan.flow === "daily_practice" && typeof SparkPracticeBridge !== "undefined" && SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"){
        return SparkPracticeBridge.toLegacyPlan(view.plan);
      }
    }
    if(typeof SparkState !== "undefined" && SparkState && typeof SparkState.read === "function"){
      var statePlan = SparkState.read(["practicePlan"], null);
      if(statePlan && Array.isArray(statePlan.items)) return statePlan;
    }
    if(typeof ensurePracticePlan === "function"){
      var ensuredPlan = ensurePracticePlan();
      if(ensuredPlan && Array.isArray(ensuredPlan.items)) return ensuredPlan;
    }
    return null;
  }

  function resolvePracticePlanItem(itemOrId){
    var plan;
    var i;
    if(itemOrId && typeof itemOrId === "object") return itemOrId;
    if(!itemOrId) return null;
    plan = getCurrentPracticePlan();
    if(!plan || !Array.isArray(plan.items)) return null;
    for(i = 0; i < plan.items.length; i++){
      if(plan.items[i] && plan.items[i].id === itemOrId) return plan.items[i];
    }
    return null;
  }

  function launchPracticeItem(item){
    if(!item) return false;
    if(item.type==="play_along_section") return launchPlayAlongSectionItem(item);
    if(item.type==="play_along_bookmark") return launchPlayAlongBookmarkItem(item);
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

  function launchPracticePlanItem(itemOrId){
    return launchPracticeItem(resolvePracticePlanItem(itemOrId));
  }

  function getActivePracticeInstrumentId(){
    if(typeof SparkState!=="undefined" && SparkState && typeof SparkState.read==="function"){
      return SparkState.read(["activeInstrument"], null);
    }
    if(typeof globalThis!=="undefined"){
      var root = globalThis.__sparkState || globalThis.S || null;
      return root && root.activeInstrument ? root.activeInstrument : null;
    }
    return null;
  }

  function isPianoPracticeLauncher(){
    return getActivePracticeInstrumentId() === "pianospark";
  }

  function launchWarmupItem(item){
    if(typeof act==="function"){
      var exerciseId = item && item.meta && item.meta.exerciseId ? item.meta.exerciseId : "";
      act("planStartWarmup", exerciseId);
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
      if(isPianoPracticeLauncher()){
        act("go_home");
        act("tab", "games");
        act("start_drill", "level");
        return true;
      }
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
      if(isPianoPracticeLauncher()){
        act("go_home");
        act("tab", "games");
        act("start_rhythm");
        return true;
      }
      act("planStartRhythm", String(bpm));
      return true;
    }
    return false;
  }

  function launchFingerItem(item){
    if(typeof act!=="function") return false;
    if(isPianoPracticeLauncher()){
      act("go_home");
      act("tab", "games");
      act("start_drill", "level");
      return true;
    }
    var exerciseId = item && item.meta && item.meta.exerciseId ? item.meta.exerciseId : "";
    act("planStartWarmup", exerciseId);
    return true;
  }

  function launchRhythmHighwayItem(item){
    if(typeof act!=="function") return false;
    act("planStartRhythmHighway", item.id);
    return true;
  }

  function launchPlayAlongSectionItem(item){
    if(!item || !item.meta) return false;
    if(typeof sparkPlayAlongJumpToSectionRecommendation === "function"){
      return sparkPlayAlongJumpToSectionRecommendation(item.meta.trackId, item.meta.sectionIndex);
    }
    return false;
  }

  function launchPlayAlongBookmarkItem(item){
    if(!item || !item.meta) return false;
    if(typeof sparkPlayAlongLaunchBookmarkByKey === "function"){
      return sparkPlayAlongLaunchBookmarkByKey(item.meta.trackId, item.meta.sectionIndex);
    }
    return false;
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
  window.launchPlayAlongSectionItem = launchPlayAlongSectionItem;
  window.launchPlayAlongBookmarkItem = launchPlayAlongBookmarkItem;
  window.launchPracticePlanItem = launchPracticePlanItem;

})();

/* ChordSpark extension: guided session launcher */
(function(){

  function getGuidedSessionNumber(item){
    if(item && item.meta && item.meta.guidedSession) return item.meta.guidedSession;
    if(typeof SparkState!=="undefined"&&typeof SparkState.read==="function"){
      return SparkState.read(["guidedSession"], 1);
    }
    return 1;
  }

  function launchGuidedSessionItem(item){
    if(typeof act!=="function") return false;
    var sessionNum = getGuidedSessionNumber(item);
    if(typeof SparkInstrumentAdapter!=="undefined" && SparkInstrumentAdapter.getInstrumentType && SparkInstrumentAdapter.getInstrumentType()==="piano"){
      act("tab", TAB.PRACTICE);
      act("start_guided_session", sessionNum);
      return true;
    }
    act("guidedStart", sessionNum);
    return true;
  }

  window.launchGuidedSessionItem = launchGuidedSessionItem;

})();
