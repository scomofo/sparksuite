(function(){

  function getActiveRecommendationInstrument(){
    var inst;
    var candidate;
    var all;
    var i;
    var entry;
    if(typeof SparkInstruments==="undefined" || !SparkInstruments || typeof SparkInstruments.getActive!=="function") return null;
    inst = SparkInstruments.getActive();
    if(!inst) return null;
    if(typeof inst.getCurriculumMap==="function" || typeof inst.getCurriculumMapV2==="function") return inst;
    candidate = inst.id || inst.appId || inst.instrumentId || null;
    if(!candidate || typeof SparkInstruments.getAll!=="function") return inst;
    all = SparkInstruments.getAll() || [];
    for(i=0;i<all.length;i++){
      entry = all[i] || {};
      if(entry.id===candidate || entry.appId===candidate) return entry;
    }
    return inst;
  }

  function getRecommendationCurriculumMap(inst){
    var map = inst && typeof inst.getCurriculumMap==="function" ? (inst.getCurriculumMap() || []) : [];
    if(Array.isArray(map) && map.length) return map;
    map = inst && typeof inst.getCurriculumMapV2==="function" ? (inst.getCurriculumMapV2() || []) : [];
    if(Array.isArray(map) && map.length) return map;
    var instrumentType = getRecommendationInstrumentType(inst);
    if(
      instrumentType &&
      typeof SparkCurriculumV2LegacyAdapter!=="undefined" &&
      SparkCurriculumV2LegacyAdapter &&
      typeof SparkCurriculumV2LegacyAdapter.toLegacyLessons==="function"
    ){
      map = SparkCurriculumV2LegacyAdapter.toLegacyLessons(instrumentType) || [];
      if(Array.isArray(map) && map.length) return map;
    }
    return Array.isArray(map) ? map : [];
  }

  function getRecommendationInstrumentType(inst){
    var candidate = inst && (inst.instrument || inst.instrumentType) ? (inst.instrument || inst.instrumentType) : null;
    if(candidate) return candidate;
    if(inst && (inst.id || inst.appId || inst.instrumentId)){
      candidate = inst.id || inst.appId || inst.instrumentId;
      if(candidate==="chordspark") return "guitar";
      if(candidate==="pianospark") return "piano";
      if(candidate==="bassspark") return "bass";
      if(candidate==="ukespark") return "ukulele";
    }
    return null;
  }

  function getRecommendationCurriculumId(appType){
    if(appType==="piano") return "curriculum_pianospark_main";
    if(appType==="guitar") return "curriculum_chordspark_main";
    return null;
  }

  function getCompletedLessons(){
    var completed = Array.isArray(S.completedLessons) ? S.completedLessons.slice() : [];
    var inst = getActiveRecommendationInstrument();
    var instrumentType = inst && (inst.instrument || inst.instrumentType) ? (inst.instrument || inst.instrumentType) : null;
    var v2Completed = instrumentType && S.curriculumV2CompletedSessions ? S.curriculumV2CompletedSessions[instrumentType] : null;
    if(Array.isArray(v2Completed)){
      for(var i=0;i<v2Completed.length;i++){
        if(completed.indexOf(v2Completed[i])===-1) completed.push(v2Completed[i]);
      }
    }
    return completed;
  }

  function collectRecommendationCandidates(appType){
    var out = [];
    out = out.concat(getCurriculumCandidates(appType));
    out = out.concat(getModuleProgressCandidates(appType));
    out = out.concat(getWeakSpotCandidates(appType));
    out = out.concat(getReviewCandidates(appType));
    out = out.concat(getChallengeCandidates(appType));
    out = out.concat(getUnlockOpportunityCandidates(appType));
    return out;
  }

  function getModuleProgressCandidates(){
    var out = [];
    if(typeof selectInstrumentModuleCandidate!=="function") return out;
    var candidate = selectInstrumentModuleCandidate();
    if(!candidate) return out;
    out.push({
      id: candidate.id,
      type: candidate.type,
      title: candidate.label,
      source: "module_progress",
      targetSkill: candidate.meta && candidate.meta.skill ? candidate.meta.skill : "module_progress",
      level: 1,
      score: 0,
      reasons: [candidate.reason || "Continue instrument module progression"],
      meta: candidate.meta || {}
    });
    return out;
  }

  function getCurriculumCandidates(appType){
    var out = [];
    var inst = getActiveRecommendationInstrument();
    var curriculumMap = getRecommendationCurriculumMap(inst);
    var curriculumId = getRecommendationCurriculumId(appType);
    var completedLessons = getCompletedLessons();
    var nextLessonId = null;
    var lesson = null;
    var i;
    if(curriculumMap.length){
      for(i=0;i<curriculumMap.length;i++){
        if(curriculumMap[i] && curriculumMap[i].id && completedLessons.indexOf(curriculumMap[i].id)===-1){
          nextLessonId = curriculumMap[i].id;
          lesson = curriculumMap[i];
          break;
        }
      }
    } else if(curriculumId) {
      nextLessonId = typeof getNextLessonFromCurriculum === "function"
        ? getNextLessonFromCurriculum(curriculumId, completedLessons)
        : null;
    }
    if(nextLessonId){
      if(!lesson) lesson = typeof getCurriculumItem === "function" ? getCurriculumItem("lessons", nextLessonId) : null;
      if(lesson){
        out.push({
          id: lesson.id,
          type: "lesson",
          title: lesson.title,
          source: "curriculum",
          targetSkill: "curriculum_progress",
          level: lesson.level || 1,
          score: 0,
          reasons: ["Next curriculum lesson"],
          meta: { lessonId: lesson.id }
        });
      }
    }
    return out;
  }

  function getWeakSpotCandidates(appType){
    var out = [];
    var weak = typeof getTopWeakSpots === "function" ? getTopWeakSpots() : null;
    if(!weak) return out;
    for(var i=0;i<(weak.transitions || []).length;i++){
      out.push({
        id: "weak_transition_" + weak.transitions[i].key,
        type: "drill",
        title: "Fix transition: " + weak.transitions[i].key,
        source: "weakspot",
        targetSkill: "transitions",
        level: 1,
        score: 0,
        reasons: ["Low transition accuracy"],
        meta: { weakSpot: weak.transitions[i].key }
      });
    }
    for(var p=0;p<(weak.phrases || []).length;p++){
      out.push({
        id: "weak_phrase_" + weak.phrases[p].key,
        type: "review",
        title: "Retry phrase: " + weak.phrases[p].key,
        source: "weakspot",
        targetSkill: "phrases",
        level: 1,
        score: 0,
        reasons: ["Weak phrase detected"],
        meta: { weakSpot: weak.phrases[p].key }
      });
    }
    return out;
  }

  function getReviewCandidates(){
    var out = [];
    var hist = S.practiceHistory || [];
    var recent = hist.slice(-10);
    for(var i=0;i<recent.length;i++){
      if((recent[i].accuracy || 0) < 0.75){
        out.push({
          id: "review_" + (recent[i].exerciseId || generateId("review")),
          type: "review",
          title: "Review recent weak item",
          source: "practice_history",
          targetSkill: "review",
          level: 1,
          score: 0,
          reasons: ["Recent low accuracy"],
          meta: { sourceExerciseId: recent[i].exerciseId || null }
        });
      }
    }
    return out;
  }

  function getChallengeCandidates(){
    var out = [];
    var daily = S.dailyChallenges || [];
    for(var i=0;i<daily.length;i++){
      if(!daily[i].completed){
        out.push({
          id: "challenge_" + daily[i].id,
          type: "challenge",
          title: "Complete challenge: " + daily[i].type,
          source: "challenge",
          targetSkill: daily[i].type,
          level: 1,
          score: 0,
          reasons: ["Supports daily challenge progress"],
          meta: { challengeId: daily[i].id }
        });
      }
    }
    return out;
  }

  function getUnlockOpportunityCandidates(){
    var out = [];
    var avgTransitions = typeof getAverageMastery === "function" ? getAverageMastery("transitions") : 0;
    if(avgTransitions < 70){
      out.push({
        id: "unlock_transitions_push",
        type: "drill",
        title: "Push transition mastery",
        source: "unlock",
        targetSkill: "transitions",
        level: 1,
        score: 0,
        reasons: ["Close to next unlock threshold"],
        meta: {}
      });
    }
    return out;
  }

  window.collectRecommendationCandidates = collectRecommendationCandidates;

})();
