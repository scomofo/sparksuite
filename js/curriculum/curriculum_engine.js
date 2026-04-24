(function(){

  function getActiveCurriculumInstrument() {
    var inst;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    inst = SparkInstruments.getActive();
    if (!inst) return null;
    if (typeof inst.getCurriculumMap === "function" || typeof inst.getCurriculumMapV2 === "function") return inst;
    candidate = inst.id || inst.appId || inst.instrumentId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return inst;
  }

  function getInstrumentCurriculumMap(inst) {
    var map = typeof inst.getCurriculumMap === "function" ? inst.getCurriculumMap() : [];
    if (Array.isArray(map) && map.length) return map;
    map = typeof inst.getCurriculumMapV2 === "function" ? inst.getCurriculumMapV2() : [];
    return Array.isArray(map) ? map : [];
  }

  function getCompletedCurriculumLessonIds(inst) {
    var completedLessons = [];
    var lessonMasteryMap;
    var instrumentKey;
    var v2Completed;
    if (typeof S !== "undefined") {
      completedLessons = Array.isArray(S.completedLessons) ? S.completedLessons.slice() : [];
      lessonMasteryMap = typeof SparkMastery !== "undefined"
        ? SparkMastery.category("lessons")
        : ((S.mastery && S.mastery.lessons) || {});
      for (var lessonId in lessonMasteryMap) {
        if (lessonMasteryMap[lessonId] && completedLessons.indexOf(lessonId) === -1) {
          completedLessons.push(lessonId);
        }
      }
      instrumentKey = inst && (inst.instrument || inst.instrumentType) ? (inst.instrument || inst.instrumentType) : null;
      v2Completed = instrumentKey && S.curriculumV2CompletedSessions ? S.curriculumV2CompletedSessions[instrumentKey] : null;
      if (Array.isArray(v2Completed)) {
        for (var i = 0; i < v2Completed.length; i++) {
          if (completedLessons.indexOf(v2Completed[i]) === -1) completedLessons.push(v2Completed[i]);
        }
      }
    }
    return completedLessons;
  }

  function getCurriculumLessonById(lessonId, inst) {
    var lesson;
    var currMap;
    var i;
    if (typeof getCurriculumItem === "function") {
      lesson = getCurriculumItem("lessons", lessonId);
      if (lesson) return lesson;
    }
    currMap = inst ? getInstrumentCurriculumMap(inst) : [];
    for (i = 0; i < currMap.length; i++) {
      if (currMap[i] && currMap[i].id === lessonId) return currMap[i];
    }
    return null;
  }

  function isFlatLessonUnlocked(lesson, inst) {
    var curriculumMap;
    var completedLessons;
    var lessonIds = {};
    var i;
    var prerequisites;
    if (!lesson) return true;
    curriculumMap = getInstrumentCurriculumMap(inst);
    completedLessons = getCompletedCurriculumLessonIds(inst);
    for (i = 0; i < curriculumMap.length; i++) {
      if (curriculumMap[i] && curriculumMap[i].id) lessonIds[curriculumMap[i].id] = true;
    }
    prerequisites = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
    for (i = 0; i < prerequisites.length; i++) {
      if (lessonIds[prerequisites[i]] && completedLessons.indexOf(prerequisites[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  function getNextLessonFromCurriculum(curriculumId, completedLessons){
    var curriculum = getCurriculumItem("curriculums", curriculumId);
    if(!curriculum) return null;
    for(var t=0;t<curriculum.tracks.length;t++){
      var track = getCurriculumItem("tracks", curriculum.tracks[t]);
      if(!track) continue;
      for(var u=0;u<track.units.length;u++){
        var unit = getCurriculumItem("units", track.units[u]);
        if(!unit) continue;
        for(var l=0;l<unit.lessons.length;l++){
          var lessonId = unit.lessons[l];
          if(completedLessons.indexOf(lessonId) < 0){
            return lessonId;
          }
        }
      }
    }
    return null;
  }

  function checkLessonUnlockRules(lessonId){
    var lesson = typeof getCurriculumItem === "function" ? getCurriculumItem("lessons", lessonId) : null;
    var activeInstrument;
    if(!lesson){
      activeInstrument = getActiveCurriculumInstrument();
      lesson = getCurriculumLessonById(lessonId, activeInstrument);
      if (!lesson) return true;
      return isFlatLessonUnlocked(lesson, activeInstrument);
    }
    if(!lesson.unlockRules) return true; // no rules = unlocked
    var rules = lesson.unlockRules;

    if(rules.lessonsCompleted && Array.isArray(rules.lessonsCompleted)){
      var completedLessons = typeof SparkMastery !== "undefined"
        ? SparkMastery.category("lessons")
        : ((S.mastery && S.mastery.lessons) || {});
      for(var i=0;i<rules.lessonsCompleted.length;i++){
        if(!completedLessons[rules.lessonsCompleted[i]]) return false;
      }
    }

    if(rules.playerLevel && (S.playerLevel || 1) < rules.playerLevel){
      return false;
    }

    if(rules.mastery && rules.mastery.chords){
      var chordMastery = typeof SparkMastery !== "undefined"
        ? SparkMastery.category("chords")
        : ((S.mastery && S.mastery.chords) || {});
      for(var j=0;j<rules.mastery.chords.length;j++){
        if(!chordMastery[rules.mastery.chords[j]]) return false;
      }
    }

    return true;
  }

  window.getNextLessonFromCurriculum = getNextLessonFromCurriculum;
  window.checkLessonUnlockRules = checkLessonUnlockRules;

  // Service wrapper for engine-first architecture (Phase 5)
  window.SparkCurriculumService = {
    getNextLesson: function(curriculumId, completedLessons) {
      return getNextLessonFromCurriculum(curriculumId, completedLessons);
    },

    isLessonUnlocked: function(lessonId) {
      return checkLessonUnlockRules(lessonId);
    },

    getLessonById: function(lessonId) {
      return getCurriculumLessonById(lessonId, getActiveCurriculumInstrument());
    },

    getReviewTargets: function(userContext) {
      userContext = userContext || {};
      var targets = [];
      var chordMastery = {};
      var lessonMastery = {};

      // Read mastery data from global state or userContext
      if (typeof SparkMastery !== "undefined") {
        chordMastery = SparkMastery.category("chords");
        lessonMastery = SparkMastery.category("lessons");
      } else if (typeof S !== "undefined" && S.mastery) {
        chordMastery = S.mastery.chords || {};
        lessonMastery = S.mastery.lessons || {};
      }
      if (userContext.chordMastery) chordMastery = userContext.chordMastery;
      if (userContext.lessonMastery) lessonMastery = userContext.lessonMastery;

      // Find chords below mastery threshold (below 75 = needs review)
      var chordProgress = typeof SparkChordProgress !== "undefined"
        ? SparkChordProgress.all()
        : ((typeof S !== "undefined" && S.chordProgress) || {});
      for (var chordName in chordProgress) {
        if (!Object.prototype.hasOwnProperty.call(chordProgress, chordName)) continue;
        var progress = chordProgress[chordName];
        if (progress > 0 && progress < 75) {
          targets.push({
            type: "chord",
            id: chordName,
            mastery: progress,
            priority: progress < 25 ? "high" : progress < 50 ? "medium" : "low"
          });
        }
      }

      // Sort by priority: high first (lowest mastery)
      targets.sort(function(a, b) { return a.mastery - b.mastery; });

      // Limit to top 5 review targets
      return targets.slice(0, 5);
    },

    buildLearningQueue: function(userContext) {
      userContext = userContext || {};
      var queue = [];

      // 1. Get review targets (chords needing practice)
      var reviews = this.getReviewTargets(userContext);
      for (var i = 0; i < reviews.length && i < 2; i++) {
        queue.push({
          type: "review",
          id: reviews[i].id,
          label: "Review: " + reviews[i].id,
          priority: reviews[i].priority,
          mastery: reviews[i].mastery
        });
      }

      // 2. Get next lesson from curriculum
      // Try to find next lesson from active instrument's curriculum map
      // currMap is an array of lesson/level objects (not a curriculum root ID),
      // so iterate directly for the first incomplete lesson.
      var inst = getActiveCurriculumInstrument();
      if (inst) {
        var completedLessons = getCompletedCurriculumLessonIds(inst);
        var currMap = getInstrumentCurriculumMap(inst);
        for (var ci = 0; ci < currMap.length; ci++) {
          var cmItem = currMap[ci];
          var cmId = cmItem && cmItem.id ? cmItem.id : null;
          if (cmId && completedLessons.indexOf(cmId) === -1) {
            queue.push({
              type: "lesson",
              id: cmId,
              label: cmItem.title || cmItem.name || cmId,
              priority: "normal"
            });
            break;
          }
        }
      }

      // 3. Add a practice/drill suggestion if queue is short
      if (queue.length < 3 && reviews.length > 0) {
        queue.push({
          type: "drill",
          id: "review_drill",
          label: "Drill: " + reviews[0].id + " practice",
          priority: "low"
        });
      }

      return queue;
    }
  };

})();
