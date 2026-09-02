/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Legacy practice family: sessions, drills, exercises and mini-games
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.startLegacyPracticeSession = function(input) {
    input = input || {};
    var instrumentContext = this.instrumentManager.getActiveContext();
    var plan = input.mode === "drill"
      ? this.sessionEngine.buildLegacyPracticeDrill({
        instrumentContext: instrumentContext,
        level: input.level,
        chordNames: input.chordNames
      })
      : this.sessionEngine.buildLegacyPracticeSession({
        instrumentContext: instrumentContext,
        level: input.level,
        mode: input.mode,
        chordName: input.chordName
      });
    var legacy = plan.context && plan.context.legacyPractice ? plan.context.legacyPractice : {};

    this.currentPlan = plan;
    this.createSessionStateMachine(plan);
    this.storage.setCurrentPlanId(plan.id);
    this.updateRuntimeState({
      activeFlow: plan.flow,
      activeInstrumentId: plan.instrumentId || plan.instrumentType || null,
      activeInstrumentType: instrumentContext.instrumentType || null,
      activePlanId: plan.id,
      activeSegmentId: plan.segments && plan.segments.length ? plan.segments[0].id : null,
      activeScreen: this.deriveRuntimeScreen(plan.flow),
      activeTab: "practice",
      legacyPracticeMode: legacy.mode || null,
      legacyPracticeChordName: Object.prototype.hasOwnProperty.call(legacy, "chordName") ? legacy.chordName : null,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: legacy.durationSec || null,
      legacyPracticeRemainingSec: legacy.durationSec || null,
      legacyDrillChordNames: this.cloneValue(legacy.chordNames || null),
      transport: { status: "ready", positionMs: 0 }
    });
    return plan;
  };

  SparkCore.prototype.openDailyPracticePlan = function(options) {
    options = options || {};
    return this.startSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      forceRebuild: !!(options.forceRebuild || options.lessonId || options.practiceTemplateId || options.ukuleleMiniSessionId),
      lessonId: options.lessonId || null,
      practiceTemplateId: options.practiceTemplateId || null,
      ukuleleMiniSessionId: options.ukuleleMiniSessionId || null,
      favoriteSongs: options.favoriteSongs || []
    });
  };

  SparkCore.prototype.openDashboardPracticePlan = function(options) {
    return this.openDailyPracticePlan(options || {});
  };

  SparkCore.prototype.openPracticePlanScreen = function(options) {
    var plan = this.openDashboardPracticePlan(options || {});
    this.updateRuntimeState({
      activeScreen: "practice_plan",
      activeTab: "practice"
    });
    return plan;
  };

  SparkCore.prototype.openLegacyPracticeSession = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_session",
      activeScreen: "session",
      activeTab: "practice",
      legacyPracticeMode: options.mode || "chord",
      legacyPracticeChordName: Object.prototype.hasOwnProperty.call(options, "chordName") ? options.chordName : null,
      legacyPracticeTimerActive: true,
      legacyPracticeDurationSec: durationSec,
      legacyPracticeRemainingSec: durationSec,
      legacyDrillChordNames: null,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyPracticeDrill = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_drill",
      activeScreen: "drill",
      activeTab: "practice",
      legacyPracticeMode: "drill",
      legacyPracticeChordName: null,
      legacyPracticeTimerActive: true,
      legacyPracticeDurationSec: durationSec,
      legacyPracticeRemainingSec: durationSec,
      legacyDrillChordNames: this.cloneValue(options.chordNames || null),
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyPracticeRuntimeState = function(action, options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_practice_session",
      activeScreen: runtimeState.activeScreen || "session",
      activeTab: runtimeState.activeTab || "practice",
      legacyPracticeMode: runtimeState.legacyPracticeMode || "chord",
      legacyPracticeChordName: runtimeState.legacyPracticeChordName,
      legacyPracticeTimerActive: !!runtimeState.legacyPracticeTimerActive,
      legacyPracticeDurationSec: runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: runtimeState.legacyPracticeRemainingSec,
      legacyFingerExerciseId: runtimeState.legacyFingerExerciseId,
      legacyFingerExerciseActive: !!runtimeState.legacyFingerExerciseActive,
      legacyFingerExerciseCount: runtimeState.legacyFingerExerciseCount || 0,
      legacyDrillChordNames: this.cloneValue(runtimeState.legacyDrillChordNames),
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "remainingSec")) next.legacyPracticeRemainingSec = options.remainingSec;
    if (Object.prototype.hasOwnProperty.call(options, "durationSec")) next.legacyPracticeDurationSec = options.durationSec;
    if (Object.prototype.hasOwnProperty.call(options, "timerActive")) next.legacyPracticeTimerActive = !!options.timerActive;
    if (Object.prototype.hasOwnProperty.call(options, "mode")) next.legacyPracticeMode = options.mode || next.legacyPracticeMode;
    if (Object.prototype.hasOwnProperty.call(options, "chordName")) next.legacyPracticeChordName = options.chordName;
    if (Object.prototype.hasOwnProperty.call(options, "chordNames")) next.legacyDrillChordNames = this.cloneValue(options.chordNames || null);
    if (Object.prototype.hasOwnProperty.call(options, "fingerExerciseId")) next.legacyFingerExerciseId = options.fingerExerciseId;
    if (Object.prototype.hasOwnProperty.call(options, "fingerExerciseActive")) next.legacyFingerExerciseActive = !!options.fingerExerciseActive;
    if (Object.prototype.hasOwnProperty.call(options, "fingerExerciseCount")) next.legacyFingerExerciseCount = options.fingerExerciseCount;

    if (action === "tick") {
      if (typeof next.legacyPracticeRemainingSec === "number") {
        next.legacyPracticeRemainingSec = Math.max(0, next.legacyPracticeRemainingSec);
      }
      next.legacyPracticeTimerActive = true;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "pause") {
      next.legacyPracticeTimerActive = false;
      next.transport = { status: "paused", positionMs: 0 };
    } else if (action === "resume") {
      next.legacyPracticeTimerActive = true;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "set_remaining") {
      next.transport = { status: next.legacyPracticeTimerActive ? "running" : "paused", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyPracticeSession = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_session",
      activeScreen: "complete",
      activeTab: "practice",
      legacyPracticeMode: options.mode || this.runtimeState.legacyPracticeMode || "chord",
      legacyPracticeChordName: Object.prototype.hasOwnProperty.call(options, "chordName") ? options.chordName : this.runtimeState.legacyPracticeChordName,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : this.runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: 0,
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.completeLegacyPracticeDrill = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_practice_drill",
      activeScreen: "drill_done",
      activeTab: "practice",
      legacyPracticeMode: "drill",
      legacyPracticeChordName: null,
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : this.runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: 0,
      legacyDrillChordNames: Object.prototype.hasOwnProperty.call(options, "chordNames")
        ? this.cloneValue(options.chordNames || null)
        : this.cloneValue(this.runtimeState.legacyDrillChordNames),
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.returnFromLegacyPracticeFamily = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeScreen: "home",
      activeTab: options.activeTab || "practice",
      legacyPracticeTimerActive: false,
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.repeatLegacyPracticeSession = function(options) {
    return this.openLegacyPracticeSession(options || {});
  };

  SparkCore.prototype.repeatLegacyPracticeDrill = function(options) {
    return this.openLegacyPracticeDrill(options || {});
  };

  SparkCore.prototype.openLegacyFingerExercise = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_finger_exercise",
      activeScreen: "home",
      activeTab: "practice",
      legacyPracticeMode: "finger_exercise",
      legacyPracticeTimerActive: true,
      legacyPracticeDurationSec: durationSec,
      legacyPracticeRemainingSec: durationSec,
      legacyFingerExerciseId: Object.prototype.hasOwnProperty.call(options, "exerciseId") ? options.exerciseId : null,
      legacyFingerExerciseActive: true,
      legacyFingerExerciseCount: Object.prototype.hasOwnProperty.call(options, "exerciseCount") ? options.exerciseCount : 0,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.completeLegacyFingerExercise = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_finger_exercise",
      activeScreen: "home",
      activeTab: "practice",
      legacyPracticeMode: "finger_exercise",
      legacyPracticeTimerActive: false,
      legacyPracticeDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec")
        ? options.durationSec
        : this.runtimeState.legacyPracticeDurationSec,
      legacyPracticeRemainingSec: 0,
      legacyFingerExerciseId: Object.prototype.hasOwnProperty.call(options, "exerciseId")
        ? options.exerciseId
        : this.runtimeState.legacyFingerExerciseId,
      legacyFingerExerciseActive: false,
      legacyFingerExerciseCount: Object.prototype.hasOwnProperty.call(options, "exerciseCount")
        ? options.exerciseCount
        : this.runtimeState.legacyFingerExerciseCount,
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyStrumPattern = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_strum_pattern",
      activeScreen: "strum",
      activeTab: "strum",
      legacyStrumPattern: Object.prototype.hasOwnProperty.call(options, "pattern")
        ? this.cloneValue(options.pattern)
        : null,
      legacyStrumActive: false,
      legacyStrumBeat: -1,
      transport: { status: "ready", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyStrumRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || "legacy_strum_pattern",
      activeScreen: this.runtimeState.activeScreen || "strum",
      activeTab: "strum",
      legacyStrumPattern: Object.prototype.hasOwnProperty.call(options, "pattern")
        ? this.cloneValue(options.pattern)
        : this.cloneValue(this.runtimeState.legacyStrumPattern),
      legacyStrumActive: Object.prototype.hasOwnProperty.call(options, "active")
        ? !!options.active
        : !!this.runtimeState.legacyStrumActive,
      legacyStrumBeat: Object.prototype.hasOwnProperty.call(options, "beat")
        ? options.beat
        : this.runtimeState.legacyStrumBeat,
      transport: {
        status: Object.prototype.hasOwnProperty.call(options, "active")
          ? (options.active ? "running" : "idle")
          : ((this.runtimeState.transport && this.runtimeState.transport.status) || "idle"),
        positionMs: 0
      }
    });
  };

  SparkCore.prototype.syncLegacyQuizRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || "legacy_quiz",
      activeScreen: this.runtimeState.activeScreen || "quiz",
      activeTab: "quiz",
      legacyQuizQuestion: Object.prototype.hasOwnProperty.call(options, "question")
        ? this.cloneValue(options.question)
        : this.cloneValue(this.runtimeState.legacyQuizQuestion),
      legacyQuizOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyQuizOptions || []),
      legacyQuizAnswer: Object.prototype.hasOwnProperty.call(options, "answer")
        ? options.answer
        : this.runtimeState.legacyQuizAnswer,
      legacyQuizScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : this.runtimeState.legacyQuizScore,
      legacyQuizTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : this.runtimeState.legacyQuizTotal,
      legacyQuizStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : this.runtimeState.legacyQuizStreak
    });
  };

  SparkCore.prototype.openLegacyQuiz = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_quiz",
      activeScreen: "quiz",
      activeTab: "quiz",
      legacyQuizQuestion: Object.prototype.hasOwnProperty.call(options, "question")
        ? this.cloneValue(options.question)
        : this.cloneValue(this.runtimeState.legacyQuizQuestion),
      legacyQuizOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyQuizOptions || []),
      legacyQuizAnswer: Object.prototype.hasOwnProperty.call(options, "answer")
        ? options.answer
        : null,
      legacyQuizScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : 0,
      legacyQuizTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : 0,
      legacyQuizStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : 0
    });
  };

  SparkCore.prototype.syncLegacyEarTrainingRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || "legacy_ear_training",
      activeScreen: this.runtimeState.activeScreen || "home",
      activeTab: "ear",
      legacyEarTrainQuestion: Object.prototype.hasOwnProperty.call(options, "question") ? options.question : this.runtimeState.legacyEarTrainQuestion,
      legacyEarTrainOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyEarTrainOptions || []),
      legacyEarTrainAnswer: Object.prototype.hasOwnProperty.call(options, "answer") ? options.answer : this.runtimeState.legacyEarTrainAnswer,
      legacyEarTrainScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : this.runtimeState.legacyEarTrainScore,
      legacyEarTrainTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : this.runtimeState.legacyEarTrainTotal,
      legacyEarTrainStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : this.runtimeState.legacyEarTrainStreak
    });
  };

  SparkCore.prototype.openLegacyEarTraining = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_ear_training",
      activeScreen: "home",
      activeTab: "ear",
      legacyEarTrainQuestion: Object.prototype.hasOwnProperty.call(options, "question")
        ? options.question
        : this.runtimeState.legacyEarTrainQuestion,
      legacyEarTrainOptions: Object.prototype.hasOwnProperty.call(options, "options")
        ? this.cloneValue(options.options || [])
        : this.cloneValue(this.runtimeState.legacyEarTrainOptions || []),
      legacyEarTrainAnswer: Object.prototype.hasOwnProperty.call(options, "answer")
        ? options.answer
        : null,
      legacyEarTrainScore: Object.prototype.hasOwnProperty.call(options, "score")
        ? options.score
        : (this.runtimeState.legacyEarTrainScore || 0),
      legacyEarTrainTotal: Object.prototype.hasOwnProperty.call(options, "total")
        ? options.total
        : (this.runtimeState.legacyEarTrainTotal || 0),
      legacyEarTrainStreak: Object.prototype.hasOwnProperty.call(options, "streak")
        ? options.streak
        : (this.runtimeState.legacyEarTrainStreak || 0)
    });
  };

  SparkCore.prototype.openLegacyDailyChallenge = function(options) {
    options = options || {};
    var durationSec = Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : null;
    return this.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "daily",
      activeTab: "daily",
      legacyDailyChallengeId: Object.prototype.hasOwnProperty.call(options, "challengeId") ? options.challengeId : null,
      legacyDailyTimerActive: true,
      legacyDailyDurationSec: durationSec,
      legacyDailyRemainingSec: durationSec,
      legacyDailyComplete: false,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyDailyRuntimeState = function(action, options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_daily_challenge",
      activeScreen: runtimeState.activeScreen || "daily",
      activeTab: runtimeState.activeTab || "daily",
      legacyDailyChallengeId: runtimeState.legacyDailyChallengeId,
      legacyDailyTimerActive: !!runtimeState.legacyDailyTimerActive,
      legacyDailyDurationSec: runtimeState.legacyDailyDurationSec,
      legacyDailyRemainingSec: runtimeState.legacyDailyRemainingSec,
      legacyDailyComplete: !!runtimeState.legacyDailyComplete,
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "challengeId")) next.legacyDailyChallengeId = options.challengeId;
    if (Object.prototype.hasOwnProperty.call(options, "remainingSec")) next.legacyDailyRemainingSec = options.remainingSec;
    if (Object.prototype.hasOwnProperty.call(options, "durationSec")) next.legacyDailyDurationSec = options.durationSec;
    if (Object.prototype.hasOwnProperty.call(options, "timerActive")) next.legacyDailyTimerActive = !!options.timerActive;
    if (Object.prototype.hasOwnProperty.call(options, "dailyComplete")) next.legacyDailyComplete = !!options.dailyComplete;

    if (action === "tick") {
      if (typeof next.legacyDailyRemainingSec === "number") {
        next.legacyDailyRemainingSec = Math.max(0, next.legacyDailyRemainingSec);
      }
      next.legacyDailyTimerActive = true;
      next.legacyDailyComplete = false;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "pause") {
      next.legacyDailyTimerActive = false;
      next.transport = { status: "paused", positionMs: 0 };
    } else if (action === "resume") {
      next.legacyDailyTimerActive = true;
      next.transport = { status: "running", positionMs: 0 };
    } else if (action === "set_remaining") {
      next.transport = { status: next.legacyDailyTimerActive ? "running" : "paused", positionMs: 0 };
    }

    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyDailyChallenge = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "daily",
      activeTab: "daily",
      legacyDailyChallengeId: Object.prototype.hasOwnProperty.call(options, "challengeId") ? options.challengeId : this.runtimeState.legacyDailyChallengeId,
      legacyDailyTimerActive: false,
      legacyDailyDurationSec: Object.prototype.hasOwnProperty.call(options, "durationSec") ? options.durationSec : this.runtimeState.legacyDailyDurationSec,
      legacyDailyRemainingSec: 0,
      legacyDailyComplete: true,
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.returnFromLegacyDailyChallenge = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_daily_challenge",
      activeScreen: "home",
      activeTab: options.activeTab || "daily",
      legacyDailyTimerActive: false,
      transport: { status: "idle", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyRunnerGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_runner_game",
      activeScreen: "home",
      activeTab: "runner",
      legacyRunnerActive: true,
      legacyRunnerTargetName: Object.prototype.hasOwnProperty.call(options, "targetName") ? options.targetName : null,
      legacyRunnerScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : 0,
      legacyRunnerCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : 0,
      legacyRunnerMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : 0,
      legacyRunnerLives: Object.prototype.hasOwnProperty.call(options, "lives") ? options.lives : 3,
      legacyRunnerDistance: Object.prototype.hasOwnProperty.call(options, "distance") ? options.distance : 0,
      legacyRunnerObstacles: this.cloneValue(options.obstacles || []),
      legacyRunnerResults: null,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyRunnerRuntimeState = function(options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_runner_game",
      activeScreen: runtimeState.activeScreen || "home",
      activeTab: runtimeState.activeTab || "runner",
      legacyRunnerActive: !!runtimeState.legacyRunnerActive,
      legacyRunnerTargetName: runtimeState.legacyRunnerTargetName,
      legacyRunnerScore: runtimeState.legacyRunnerScore || 0,
      legacyRunnerCombo: runtimeState.legacyRunnerCombo || 0,
      legacyRunnerMaxCombo: runtimeState.legacyRunnerMaxCombo || 0,
      legacyRunnerLives: runtimeState.legacyRunnerLives || 0,
      legacyRunnerDistance: runtimeState.legacyRunnerDistance || 0,
      legacyRunnerObstacles: this.cloneValue(runtimeState.legacyRunnerObstacles || []),
      legacyRunnerResults: this.cloneValue(runtimeState.legacyRunnerResults || null),
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "active")) next.legacyRunnerActive = !!options.active;
    if (Object.prototype.hasOwnProperty.call(options, "targetName")) next.legacyRunnerTargetName = options.targetName;
    if (Object.prototype.hasOwnProperty.call(options, "score")) next.legacyRunnerScore = options.score;
    if (Object.prototype.hasOwnProperty.call(options, "combo")) next.legacyRunnerCombo = options.combo;
    if (Object.prototype.hasOwnProperty.call(options, "maxCombo")) next.legacyRunnerMaxCombo = options.maxCombo;
    if (Object.prototype.hasOwnProperty.call(options, "lives")) next.legacyRunnerLives = options.lives;
    if (Object.prototype.hasOwnProperty.call(options, "distance")) next.legacyRunnerDistance = options.distance;
    if (Object.prototype.hasOwnProperty.call(options, "obstacles")) next.legacyRunnerObstacles = this.cloneValue(options.obstacles || []);
    if (Object.prototype.hasOwnProperty.call(options, "results")) next.legacyRunnerResults = this.cloneValue(options.results || null);

    next.transport = { status: next.legacyRunnerActive ? "running" : "idle", positionMs: 0 };
    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyRunnerGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_runner_game",
      activeScreen: "home",
      activeTab: "runner",
      legacyRunnerActive: false,
      legacyRunnerTargetName: Object.prototype.hasOwnProperty.call(options, "targetName") ? options.targetName : this.runtimeState.legacyRunnerTargetName,
      legacyRunnerScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : this.runtimeState.legacyRunnerScore,
      legacyRunnerCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : this.runtimeState.legacyRunnerCombo,
      legacyRunnerMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : this.runtimeState.legacyRunnerMaxCombo,
      legacyRunnerLives: Object.prototype.hasOwnProperty.call(options, "lives") ? options.lives : this.runtimeState.legacyRunnerLives,
      legacyRunnerDistance: Object.prototype.hasOwnProperty.call(options, "distance") ? options.distance : this.runtimeState.legacyRunnerDistance,
      legacyRunnerObstacles: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "obstacles") ? (options.obstacles || []) : (this.runtimeState.legacyRunnerObstacles || [])),
      legacyRunnerResults: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "results") ? (options.results || null) : null),
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.openLegacyRhythmGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_rhythm_game",
      activeScreen: "home",
      activeTab: "rhythm",
      legacyRhythmActive: true,
      legacyRhythmBeats: this.cloneValue(options.beats || []),
      legacyRhythmScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : 0,
      legacyRhythmCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : 0,
      legacyRhythmMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : 0,
      legacyRhythmStartTimeMs: Object.prototype.hasOwnProperty.call(options, "startTimeMs") ? options.startTimeMs : 0,
      legacyRhythmResults: null,
      transport: { status: "running", positionMs: 0 }
    });
  };

  SparkCore.prototype.syncLegacyRhythmRuntimeState = function(options) {
    var runtimeState = this.getRuntimeState();
    var next = {
      activeFlow: runtimeState.activeFlow || "legacy_rhythm_game",
      activeScreen: runtimeState.activeScreen || "home",
      activeTab: runtimeState.activeTab || "rhythm",
      legacyRhythmActive: !!runtimeState.legacyRhythmActive,
      legacyRhythmBeats: this.cloneValue(runtimeState.legacyRhythmBeats || []),
      legacyRhythmScore: runtimeState.legacyRhythmScore || 0,
      legacyRhythmCombo: runtimeState.legacyRhythmCombo || 0,
      legacyRhythmMaxCombo: runtimeState.legacyRhythmMaxCombo || 0,
      legacyRhythmStartTimeMs: runtimeState.legacyRhythmStartTimeMs || 0,
      legacyRhythmResults: this.cloneValue(runtimeState.legacyRhythmResults || null),
      transport: runtimeState.transport || { status: "idle", positionMs: 0 }
    };
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "active")) next.legacyRhythmActive = !!options.active;
    if (Object.prototype.hasOwnProperty.call(options, "beats")) next.legacyRhythmBeats = this.cloneValue(options.beats || []);
    if (Object.prototype.hasOwnProperty.call(options, "score")) next.legacyRhythmScore = options.score;
    if (Object.prototype.hasOwnProperty.call(options, "combo")) next.legacyRhythmCombo = options.combo;
    if (Object.prototype.hasOwnProperty.call(options, "maxCombo")) next.legacyRhythmMaxCombo = options.maxCombo;
    if (Object.prototype.hasOwnProperty.call(options, "startTimeMs")) next.legacyRhythmStartTimeMs = options.startTimeMs;
    if (Object.prototype.hasOwnProperty.call(options, "results")) next.legacyRhythmResults = this.cloneValue(options.results || null);

    next.transport = { status: next.legacyRhythmActive ? "running" : "idle", positionMs: 0 };
    return this.updateRuntimeState(next);
  };

  SparkCore.prototype.completeLegacyRhythmGame = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      activeFlow: "legacy_rhythm_game",
      activeScreen: "home",
      activeTab: "rhythm",
      legacyRhythmActive: false,
      legacyRhythmBeats: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "beats") ? (options.beats || []) : (this.runtimeState.legacyRhythmBeats || [])),
      legacyRhythmScore: Object.prototype.hasOwnProperty.call(options, "score") ? options.score : this.runtimeState.legacyRhythmScore,
      legacyRhythmCombo: Object.prototype.hasOwnProperty.call(options, "combo") ? options.combo : this.runtimeState.legacyRhythmCombo,
      legacyRhythmMaxCombo: Object.prototype.hasOwnProperty.call(options, "maxCombo") ? options.maxCombo : this.runtimeState.legacyRhythmMaxCombo,
      legacyRhythmStartTimeMs: Object.prototype.hasOwnProperty.call(options, "startTimeMs") ? options.startTimeMs : this.runtimeState.legacyRhythmStartTimeMs,
      legacyRhythmResults: this.cloneValue(Object.prototype.hasOwnProperty.call(options, "results") ? (options.results || null) : null),
      transport: { status: "completed", positionMs: 0 }
    });
  };

  SparkCore.prototype.completeDailyPracticePlan = function(options) {
    options = options || {};
    return this.completeSession({
      flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
      markPlanComplete: true,
      itemId: Object.prototype.hasOwnProperty.call(options, "itemId") ? options.itemId : undefined
    });
  };

  SparkCore.prototype.startPracticeFromLesson = function(lesson) {
    if (!lesson) return false;
    var payload = {
      chartId: lesson.type + "_drill",
      chart: {
        chartId: lesson.type,
        tempo: lesson.tempo,
        lanes: [],
        notes: []
      },
      mode: "practice"
    };
    if (typeof startPlayableRhythmHighwayPayload === "function") {
      return startPlayableRhythmHighwayPayload(payload, {
        source: "lesson_generator",
        label: lesson.label,
        instrument: this.runtimeState.activeInstrumentType || this.runtimeState.activeInstrumentId || "guitar"
      });
    }
    return false;
  };
})();
