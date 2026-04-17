(function(){

  function curriculumStateRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function curriculumStateRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = curriculumStateRoot();
    if (!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function getProgressSnapshot() {
    if (window.sparkCore && typeof window.sparkCore.getLegacyProgressSnapshot === "function") {
      return window.sparkCore.getLegacyProgressSnapshot() || {};
    }
    var mastery = curriculumStateRead("mastery", {}) || {};
    return {
      completedLessonIds: getCompletedLessonIds(),
      mastery: {
        lessons: mastery.lessons || {},
        chords: mastery.chords || {},
        rhythm: mastery.rhythm || {}
      },
      chordProgress: curriculumStateRead("chordProgress", {}) || {},
      skillMastery: curriculumStateRead("skillMastery", {}) || {},
      unlockedLessonIds: curriculumStateRead("unlockedLessonIds", []) || [],
      ukuleleSkillProgress: curriculumStateRead("ukuleleSkillProgress", {}) || {},
      bassSkillProgress: curriculumStateRead("bassSkillProgress", {}) || {}
    };
  }

  function getCompletedLessonIds() {
    if (window.sparkCore && typeof window.sparkCore.getCompletedLessonIds === "function") {
      return window.sparkCore.getCompletedLessonIds();
    }
    var completedLessons = Array.isArray(curriculumStateRead("completedLessons", [])) ? curriculumStateRead("completedLessons", []).slice() : [];
    var mastery = curriculumStateRead("mastery", {}) || {};
    var lessonMastery = mastery.lessons || {};
    for (var lessonId in lessonMastery) {
      if (lessonMastery[lessonId] && completedLessons.indexOf(lessonId) === -1) {
        completedLessons.push(lessonId);
      }
    }
    return completedLessons;
  }

  function resolveActiveCurriculumInstrument() {
    var active;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    active = SparkInstruments.getActive();
    if (!active) return null;
    if (typeof active.getCurriculumMap === "function") return active;
    candidate = active.id || active.appId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return active;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) return entry;
    }
    return active;
  }

  function getActiveCurriculumMap(instrumentContext) {
    instrumentContext = instrumentContext || {};
    if (Array.isArray(instrumentContext.curriculumMap)) return instrumentContext.curriculumMap.slice();
    if (typeof SparkInstrumentAdapter !== "undefined" && typeof SparkInstrumentAdapter.getCurriculumMap === "function") {
      var map = SparkInstrumentAdapter.getCurriculumMap();
      if (Array.isArray(map)) return map.slice();
    }
    var activeInstrument = resolveActiveCurriculumInstrument();
    if (activeInstrument && typeof activeInstrument.getCurriculumMap === "function") {
      var activeMap = activeInstrument.getCurriculumMap();
      if (Array.isArray(activeMap)) return activeMap.slice();
    }
    return [];
  }

  function getLessonIdFromMapItem(item) {
    if (!item) return null;
    if (item.id) return item.id;
    if (item.lessonId) return item.lessonId;
    if (item.num != null) return "session_" + item.num;
    return null;
  }

  function getLessonForSkill(skillId, instrumentContext) {
    var completedLessons = getCompletedLessonIds();
    var curriculumMap = getActiveCurriculumMap(instrumentContext);
    var i;
    for (i = 0; i < curriculumMap.length; i++) {
      var lessonId = getLessonIdFromMapItem(curriculumMap[i]);
      if (lessonId && completedLessons.indexOf(lessonId) === -1) return lessonId;
    }
    return skillId || null;
  }

  function getNextSkillLesson(skillId, instrumentContext) {
    var completedLessons = getCompletedLessonIds();
    var curriculumMap = getActiveCurriculumMap(instrumentContext);
    var i;
    var foundCurrent = false;
    var currentLessonId = getLessonForSkill(skillId, instrumentContext);
    if (!currentLessonId) return null;

    for (i = 0; i < curriculumMap.length; i++) {
      var lessonId = getLessonIdFromMapItem(curriculumMap[i]);
      if (!lessonId || completedLessons.indexOf(lessonId) >= 0) continue;
      if (foundCurrent) return lessonId;
      if (lessonId === currentLessonId) foundCurrent = true;
    }

    return null;
  }

  function getNextLessonForSkillProgress(skillId, mastery, instrumentContext, threshold) {
    threshold = typeof threshold === "number" && isFinite(threshold) ? threshold : 0.75;
    if (mastery < threshold) return getLessonForSkill(skillId, instrumentContext);
    return getNextSkillLesson(skillId, instrumentContext) || getLessonForSkill(skillId, instrumentContext);
  }

  function getAdaptiveSkills(userContext, progressSnapshot) {
    userContext = userContext || {};
    progressSnapshot = progressSnapshot || getProgressSnapshot();
    if (userContext.skills && typeof userContext.skills === "object") return userContext.skills;
    if (progressSnapshot.skillMastery && typeof progressSnapshot.skillMastery === "object") {
      return progressSnapshot.skillMastery;
    }
    return {};
  }

  function getAdaptiveReviewTarget(userContext) {
    var progressSnapshot = getProgressSnapshot();
    var skills = getAdaptiveSkills(userContext, progressSnapshot);
    var selection = typeof selectAdaptiveNextSkill === "function"
      ? selectAdaptiveNextSkill(skills, { returnMeta: true })
      : null;
    return selection || null;
  }

  function getAdaptiveNextLesson(userContext, instrumentContext) {
    var selection = getAdaptiveReviewTarget(userContext);
    if (selection && selection.skillId) {
      return getLessonForSkill(selection.skillId, instrumentContext) || getNextSkillLesson(selection.skillId, instrumentContext);
    }
    return getLessonForSkill(null, instrumentContext);
  }

  function buildAdaptiveSessionContext(userContext, instrumentContext) {
    var review = getAdaptiveReviewTarget(userContext);
    var nextLessonId = getAdaptiveNextLesson(userContext, instrumentContext);
    return {
      reviewSkillId: review ? review.skillId : null,
      reviewScore: review ? review.score : null,
      reviewDaysSincePractice: review ? review.daysSincePractice : null,
      reviewMastery: review ? review.mastery : null,
      nextLessonId: nextLessonId
    };
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
    var lesson = getCurriculumItem("lessons", lessonId);
    if(!lesson || !lesson.unlockRules) return true; // no rules = unlocked
    var rules = lesson.unlockRules;

    if(rules.lessonsCompleted && Array.isArray(rules.lessonsCompleted)){
      var completedLessons = getCompletedLessonIds();
      for(var i=0;i<rules.lessonsCompleted.length;i++){
        if(completedLessons.indexOf(rules.lessonsCompleted[i]) < 0) return false;
      }
    }

    if(rules.playerLevel && curriculumStateRead("playerLevel", curriculumStateRead("level", 1)) < rules.playerLevel){
      return false;
    }

    if(rules.mastery && rules.mastery.chords){
      var progressSnapshot = getProgressSnapshot();
      var chordMastery = progressSnapshot.mastery && progressSnapshot.mastery.chords ? progressSnapshot.mastery.chords : {};
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

    getLessonForSkill: function(skillId, instrumentContext) {
      return getLessonForSkill(skillId, instrumentContext);
    },

    getNextSkillLesson: function(skillId, instrumentContext) {
      return getNextSkillLesson(skillId, instrumentContext);
    },

    getNextLessonForSkillProgress: function(skillId, mastery, instrumentContext, threshold) {
      return getNextLessonForSkillProgress(skillId, mastery, instrumentContext, threshold);
    },

    buildAdaptiveSessionContext: function(userContext, instrumentContext) {
      return buildAdaptiveSessionContext(userContext, instrumentContext);
    },

    isLessonUnlocked: function(lessonId) {
      return checkLessonUnlockRules(lessonId);
    },

    getLessonById: function(lessonId) {
      if (typeof getCurriculumItem === "function") {
        return getCurriculumItem("lessons", lessonId);
      }
      return null;
    },

    getReviewTargets: function(userContext) {
      userContext = userContext || {};
      var targets = [];
      var chordMastery = {};
      var lessonMastery = {};
      var progressSnapshot = getProgressSnapshot();

      // Read mastery data from global state or userContext
      chordMastery = progressSnapshot.mastery && progressSnapshot.mastery.chords ? progressSnapshot.mastery.chords : {};
      lessonMastery = progressSnapshot.mastery && progressSnapshot.mastery.lessons ? progressSnapshot.mastery.lessons : {};
      if (userContext.chordMastery) chordMastery = userContext.chordMastery;
      if (userContext.lessonMastery) lessonMastery = userContext.lessonMastery;

      // Find chords below mastery threshold (below 75 = needs review)
      var chordProgress = progressSnapshot.chordProgress || {};
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
      var adaptiveContext = buildAdaptiveSessionContext(userContext, userContext.instrumentContext || null);
      var reviewSkillId = adaptiveContext.reviewSkillId;
      var reviews;

      if (reviewSkillId) {
        queue.push({
          type: "review",
          id: reviewSkillId,
          label: "Review: " + reviewSkillId,
          priority: "high",
          mastery: adaptiveContext.reviewMastery,
          reviewScore: adaptiveContext.reviewScore,
          daysSincePractice: adaptiveContext.reviewDaysSincePractice
        });
      } else {
        reviews = this.getReviewTargets(userContext);
        for (var i = 0; i < reviews.length && i < 2; i++) {
          queue.push({
            type: "review",
            id: reviews[i].id,
            label: "Review: " + reviews[i].id,
            priority: reviews[i].priority,
            mastery: reviews[i].mastery
          });
        }
      }

      // 2. Get next lesson from curriculum
      var completedLessons = getCompletedLessonIds();

      // Try to find next lesson from active instrument's curriculum map
      // currMap is an array of lesson/level objects (not a curriculum root ID),
      // so iterate directly for the first incomplete lesson.
      var inst = typeof SparkInstruments !== "undefined" ? SparkInstruments.getActive() : null;
      if (inst) {
        var currMap = typeof inst.getCurriculumMap === "function" ? inst.getCurriculumMap() : [];
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

      if (adaptiveContext.nextLessonId && !queue.some(function(item) { return item.id === adaptiveContext.nextLessonId; })) {
        queue.push({
          type: "lesson",
          id: adaptiveContext.nextLessonId,
          label: adaptiveContext.nextLessonId,
          priority: "normal"
        });
      }

      // 3. Add a practice/drill suggestion if queue is short
      if (queue.length < 3 && reviewSkillId) {
        queue.push({
          type: "drill",
          id: "review_drill",
          label: "Drill: " + reviewSkillId + " practice",
          priority: "low"
        });
      } else if (queue.length < 3) {
        reviews = reviews || this.getReviewTargets(userContext);
        if (reviews.length > 0) {
        queue.push({
          type: "drill",
          id: "review_drill",
          label: "Drill: " + reviews[0].id + " practice",
          priority: "low"
        });
        }
      }

      return queue;
    }
  };

})();
