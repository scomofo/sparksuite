(function(){

  function launchPracticeItem(item){
    if(!item) return false;
    if(item.type==="warmup") return launchWarmupItem(item);
    if(item.type==="transition") return launchTransitionItem(item);
    if(item.type==="performance_song") return launchPerformanceSongItem(item);
    if(item.type==="performance_phrase") return launchPerformancePhraseItem(item);
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

  window.launchPracticeItem = launchPracticeItem;
  window.launchWarmupItem = launchWarmupItem;
  window.launchTransitionItem = launchTransitionItem;
  window.launchPerformanceSongItem = launchPerformanceSongItem;
  window.launchPerformancePhraseItem = launchPerformancePhraseItem;
  window.launchRhythmItem = launchRhythmItem;
  window.launchFingerItem = launchFingerItem;

})();

/* ChordSpark extension: guided session launcher */
(function(){

  function launchGuidedSessionItem(item){
    if(typeof act!=="function") return false;
    act("tab", TAB.PRACTICE);
    act("start_guided_session", item && item.meta && item.meta.guidedSession || S.guidedSession || 1);
    return true;
  }

  window.launchGuidedSessionItem = launchGuidedSessionItem;

})();
