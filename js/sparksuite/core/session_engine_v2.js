(function() {
  function SessionEngineV2(practiceEngine, curriculumEngine, psychologyEngine) {
    this.practiceEngine = practiceEngine || null;
    this.curriculumEngine = curriculumEngine || null;
    this.psychologyEngine = psychologyEngine || null;
  }

  SessionEngineV2.prototype.buildSession = function(flow, context) {
    context = context || {};

    // V2 reference: Learning Brain analysis for focus skill
    var focus = "timing";
    if (typeof SparkLearningBrain !== "undefined" && typeof S !== "undefined" && S.skillGraph) {
      var analysis = SparkLearningBrain.analyzeUser(S.skillGraph, null);
      if (analysis && analysis.focusSkill) focus = analysis.focusSkill;
    }
    context._learningBrainFocus = focus;

    if (flow === SparkSessionTypes.FLOW_DAILY_PRACTICE) return this.buildDailyPracticeSession(context);
    if (flow === SparkSessionTypes.FLOW_GUIDED_SESSION) return this.buildGuidedSession(context);
    if (flow === SparkSessionTypes.FLOW_PERFORMANCE_SONG) return this.buildPerformanceSongSession(context);
    return this.buildEmptySession(flow, context);
  };

  SessionEngineV2.prototype.buildDailyPracticeSession = function(context) {
    var curriculumContext = this.curriculumEngine && typeof this.curriculumEngine.getDailyPracticeContext === "function"
      ? this.curriculumEngine.getDailyPracticeContext(context.instrumentContext || {})
      : {};
    // V2 reference: resolve instrument module for exercise delegation
    var instrumentId = context.instrumentContext ? context.instrumentContext.appId : null;
    var instrumentModule = (typeof SparkInstruments !== "undefined" && instrumentId)
      ? SparkInstruments.getModule(instrumentId)
      : null;

    // V2 reference: instrument-driven exercise building (future path)
    // If instrumentModule.buildRhythmExercise() or instrumentModule.buildSongExercise()
    // become available, delegate exercise creation to the instrument module.
    // For now, use PracticeEngineV2 as the exercise builder.

    var practicePlan = this.practiceEngine && typeof this.practiceEngine.buildDailyPracticePlan === "function"
      ? this.practiceEngine.buildDailyPracticePlan({
        curriculum: curriculumContext,
        instrumentContext: context.instrumentContext || {},
        difficulty: deriveDifficulty(typeof S !== "undefined" ? S.skillGraph : null)
      })
      : { focus: "practice", segments: [], exercises: [], rewards: { xp: 0 } };
    var lesson = curriculumContext.nextLesson || null;
    var difficulty = resolveDifficulty(lesson, this.psychologyEngine, context, practicePlan);

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      instrumentId: instrumentId,
      focus: context._learningBrainFocus || practicePlan.focus || "practice",
      lesson: lesson,
      difficulty: difficulty,
      segments: Array.isArray(practicePlan.segments) ? practicePlan.segments : [],
      exercises: Array.isArray(practicePlan.exercises) ? practicePlan.exercises : [],
      rewards: normalizeRewards(practicePlan.rewards),
      context: {
        curriculum: curriculumContext
      }
    });
  };

  SessionEngineV2.prototype.buildGuidedSession = function(context) {
    var instrumentContext = context.instrumentContext || {};
    var sessions = Array.isArray(instrumentContext.sessions) ? instrumentContext.sessions : [];
    var sessionNum = parsePositiveInt(context.sessionNum, 1);
    var sessionIndex = Math.max(0, Math.min(sessions.length - 1, sessionNum - 1));
    var guidedPlan = sessions.length ? clone(sessions[sessionIndex]) : null;

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      instrumentId: instrumentContext.appId || null,
      focus: guidedPlan ? guidedPlan.title || ("Session " + sessionNum) : "Guided session",
      lesson: guidedPlan,
      difficulty: resolveDifficulty(guidedPlan, this.psychologyEngine, context, null),
      segments: guidedPlan ? [createSegment("guided_segment_" + sessionNum, "practice", [createExerciseId("guided", sessionNum)])] : [],
      exercises: guidedPlan ? [{
        id: createExerciseId("guided", sessionNum),
        type: "guided",
        difficulty: resolveDifficulty(guidedPlan, this.psychologyEngine, context, null),
        data: {
          presentation: {
            label: guidedPlan.title || ("Session " + sessionNum),
            reason: ""
          },
          core: {
            sessionNum: guidedPlan.num || sessionNum,
            spark: guidedPlan.spark || null,
            newMove: guidedPlan.newMove || null
          },
          gameplay: null
        }
      }] : [],
      rewards: createRewards(30),
      context: {
        guidedPlan: guidedPlan,
        guidedSession: guidedPlan && guidedPlan.num ? guidedPlan.num : sessionNum,
        totalGuidedSessions: sessions.length
      }
    });
  };

  SessionEngineV2.prototype.buildPerformanceSongSession = function(context) {
    var instrumentContext = context.instrumentContext || {};
    var songs = Array.isArray(instrumentContext.songs) ? instrumentContext.songs : [];
    var selection = resolveSongSelection(songs, context);
    var song = selection.song;
    var songId = selection.songId;
    var arrangementType = context.arrangementType || "chords";
    var difficultyId = context.difficultyId || "normal";
    var exerciseId = createExerciseId("song", songId || 1);

    return new SessionPlan({
      flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
      instrumentId: instrumentContext.appId || null,
      focus: song ? "Perform " + (song.title || "song") : "Performance song",
      lesson: song ? { id: songId, title: song.title || "Performance song" } : null,
      difficulty: difficultyId,
      segments: song ? [createSegment("song_segment_" + songId, "song", [exerciseId])] : [],
      exercises: song ? [{
        id: exerciseId,
        type: "song",
        difficulty: difficultyId,
        data: {
          presentation: {
            label: song.title || "Performance song",
            reason: ""
          },
          core: {
            songId: songId,
            song: clone(song),
            arrangementType: arrangementType,
            difficultyId: difficultyId,
            durationSec: estimateSongDurationSec(song)
          },
          gameplay: null
        }
      }] : [],
      rewards: createRewards(25),
      context: {
        performanceSong: {
          songData: song ? clone(song) : null,
          songId: songId,
          arrangementType: arrangementType,
          difficultyId: difficultyId
        }
      }
    });
  };

  SessionEngineV2.prototype.buildEmptySession = function(flow, context) {
    return new SessionPlan({
      flow: flow,
      instrumentId: context.instrumentContext ? context.instrumentContext.appId : null,
      lesson: null,
      difficulty: "easy",
      segments: [],
      exercises: [],
      rewards: createRewards(0)
    });
  };

  // V2 reference: derive difficulty from skill graph
  function deriveDifficulty(skillGraph) {
    if (!skillGraph) return "easy";
    var skills = [skillGraph.timing || 0, skillGraph.rhythm || 0, skillGraph.chordAccuracy || 0];
    var avg = (skills[0] + skills[1] + skills[2]) / 3;
    if (avg > 0.8) return "hard";
    if (avg > 0.6) return "medium";
    return "easy";
  }

  function createSegment(id, type, exerciseIds) {
    return {
      id: id,
      type: type,
      exerciseIds: Array.isArray(exerciseIds) ? exerciseIds.slice() : []
    };
  }

  function normalizeRewards(rewards) {
    if (rewards && typeof rewards === "object" && !Array.isArray(rewards)) {
      return createRewards(rewards.xp || 0, rewards.unlocks || [], rewards.achievements || []);
    }
    if (Array.isArray(rewards)) return rewardsArrayToObject(rewards);
    return createRewards(0);
  }

  function rewardsArrayToObject(rewards) {
    var xp = 0;
    var unlocks = [];
    var achievements = [];
    var i;
    for (i = 0; i < rewards.length; i++) {
      if (!rewards[i]) continue;
      if (rewards[i].type === "xp") xp += rewards[i].amount || 0;
      if (rewards[i].type === "unlock") unlocks.push(rewards[i]);
      if (rewards[i].type === "achievement") achievements.push(rewards[i]);
    }
    return createRewards(xp, unlocks, achievements);
  }

  function createRewards(xp, unlocks, achievements) {
    return {
      xp: typeof xp === "number" ? xp : 0,
      unlocks: Array.isArray(unlocks) ? unlocks : [],
      achievements: Array.isArray(achievements) ? achievements : []
    };
  }

  function resolveDifficulty(lesson, psychologyEngine, context, practicePlan) {
    if (psychologyEngine && typeof psychologyEngine.getSessionDifficulty === "function") {
      return psychologyEngine.getSessionDifficulty({
        lesson: lesson,
        context: context,
        practicePlan: practicePlan
      });
    }
    if (lesson && typeof lesson.level === "string" && lesson.level) return lesson.level;
    if (lesson && typeof lesson.level === "number") {
      if (lesson.level <= 1) return "easy";
      if (lesson.level <= 3) return "normal";
      return "hard";
    }
    if (lesson && lesson.id) return inferDifficultyFromLessonId(lesson.id);
    return "easy";
  }

  function inferDifficultyFromLessonId(lessonId) {
    var match = String(lessonId || "").match(/(\d+)/);
    var ordinal = match ? parseInt(match[1], 10) : 1;
    if (ordinal <= 3) return "easy";
    if (ordinal <= 6) return "normal";
    return "hard";
  }

  function createExerciseId(prefix, value) {
    return String(prefix || "exercise") + "_" + String(value || "1");
  }

  function parsePositiveInt(value, fallback) {
    value = parseInt(value, 10);
    return isNaN(value) || value < 1 ? fallback : value;
  }

  function resolveSongSelection(songs, context) {
    var songIndex = parseInt(context.songIndex, 10);
    var i;
    if (!isNaN(songIndex) && songs[songIndex]) {
      return {
        song: clone(songs[songIndex]),
        songId: toSongId(songs[songIndex])
      };
    }
    var songId = String(context.songId || "").trim();
    if (songId) {
      for (i = 0; i < songs.length; i++) {
        if (toSongId(songs[i]) === songId) {
          return {
            song: clone(songs[i]),
            songId: songId
          };
        }
      }
    }
    return {
      song: null,
      songId: songId || ""
    };
  }

  function estimateSongDurationSec(song) {
    if (!song) return 0;
    if (song.durationSec) return song.durationSec;
    if (song.duration) return song.duration;
    return 240;
  }

  function toSongId(song) {
    return String(song && song.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  function getExercise(segment, session) {
    var exercises = session && Array.isArray(session.exercises) ? session.exercises : [];
    var exerciseId = segment && Array.isArray(segment.exerciseIds) ? segment.exerciseIds[0] : null;
    var i;
    for (i = 0; i < exercises.length; i++) {
      if (exercises[i] && exercises[i].id === exerciseId) return exercises[i];
    }
    return null;
  }

  window.SparkSuiteSessionEngineV2 = SessionEngineV2;
  window.SparkSessionV2 = {
    getExercise: getExercise
  };
})();
