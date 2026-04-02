(function(){

  function collectRecommendationCandidates(appType){
    var out = [];
    out = out.concat(getCurriculumCandidates(appType));
    out = out.concat(getWeakSpotCandidates(appType));
    out = out.concat(getReviewCandidates(appType));
    out = out.concat(getChallengeCandidates(appType));
    out = out.concat(getUnlockOpportunityCandidates(appType));
    return out;
  }

  function getCurriculumCandidates(appType){
    var out = [];
    var curriculumId = appType === "piano"
      ? "curriculum_pianospark_main"
      : "curriculum_chordspark_main";
    var completedLessons = getCompletedLessons();
    var nextLessonId = typeof getNextLessonFromCurriculum === "function"
      ? getNextLessonFromCurriculum(curriculumId, completedLessons)
      : null;
    if(nextLessonId){
      var lesson = typeof getCurriculumItem === "function" ? getCurriculumItem("lessons", nextLessonId) : null;
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
    if(avgTransitions < 0.7){
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

  function getCompletedLessons(){
    return S.completedLessons || [];
  }

  window.collectRecommendationCandidates = collectRecommendationCandidates;

})();
