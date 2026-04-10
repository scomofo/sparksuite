(function(){

  function collectRecommendationCandidates(appType){
    var out = [];
    out = out.concat(getCurriculumCandidates(appType));
    out = out.concat(getModuleProgressCandidates(appType));
    out = out.concat(getPlayAlongCandidates(appType));
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

  function getPlayAlongCandidates(){
    var out = [];
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome ? window.sparkCore.lastSessionOutcome : null;
    var recent = Array.isArray(S.playAlongRecent) ? S.playAlongRecent : [];
    var latest = recent.length ? recent[0] : null;
    var bookmarks = Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks : [];
    var weakAreas = outcome && outcome.performance && Array.isArray(outcome.performance.weakAreas)
      ? outcome.performance.weakAreas.slice(0, 2)
      : [];
    if (latest && outcome && outcome.sectionSummary) {
      out.push({
        id: "playalong_weak_section_" + (latest.trackId || "recent") + "_" + Number(outcome.sectionSummary.sectionIndex || 0),
        type: "play_along_section",
        title: "Play Along: Fix " + (outcome.sectionSummary.sectionLabel || "weak section"),
        source: "play_along",
        targetSkill: "play_along_section",
        level: 1,
        score: 0,
        reasons: ["Recent play-along weak section needs another pass"],
        meta: {
          action: "weak_section",
          trackId: latest.trackId || null,
          trackTitle: latest.title || latest.trackId || "Recent Song",
          sectionIndex: Number(outcome.sectionSummary.sectionIndex || 0),
          sectionLabel: outcome.sectionSummary.sectionLabel || "Weak section",
          weakAreas: weakAreas,
          transportMode: latest.transportMode || null
        }
      });
    }
    if (bookmarks.length) {
      var bookmark = bookmarks[0];
      out.push({
        id: "playalong_bookmark_" + (bookmark.trackId || "song") + "_" + Number(bookmark.sectionIndex || 0),
        type: "play_along_bookmark",
        title: "Replay bookmark: " + (bookmark.sectionLabel || "Saved section"),
        source: "play_along_bookmark",
        targetSkill: "play_along_bookmark",
        level: 1,
        score: 0,
        reasons: ["Saved section ready for another focused run"],
        meta: {
          action: "bookmark",
          trackId: bookmark.trackId || null,
          trackTitle: bookmark.title || bookmark.trackId || "Saved Song",
          sectionIndex: Number(bookmark.sectionIndex || 0),
          sectionLabel: bookmark.sectionLabel || "Saved section",
          startMs: bookmark.startMs != null ? bookmark.startMs : null
        }
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
