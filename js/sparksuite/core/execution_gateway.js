(function() {
  /**
   * SparkExecutionGateway — unified execution layer for all gameplay entry points.
   *
   * Two modes:
   *   1. Session-driven: SparkSessionRuntime.startSessionLoop() -> runSegment()
   *   2. Direct (ad-hoc): runDirectExercise() for retry, preview, import, etc.
   *
   * ALL gameplay goes through this contract. No raw startPerformance/startRhythmHighway
   * calls should exist outside this gateway.
   */

  function normalizeToExercise(input) {
    // Already V2 exercise
    if (input && input.id && input.data) return input;

    var id = "ex_adhoc_" + Date.now();
    var type = "practice";

    // Detect type from input shape
    if (input && (input.songId || input.song || input.arrangementType)) type = "song";
    else if (input && input.chartId) type = "song";
    else if (typeof input === "string") type = "song"; // chartId string

    return {
      id: id,
      type: type,
      difficulty: (input && input.difficulty) || (input && input.difficultyId) || "normal",
      data: {
        core: {
          songId: (input && input.songId) || (typeof input === "string" ? input : null),
          chartId: (input && input.chartId) || (typeof input === "string" ? input : null),
          arrangementType: (input && input.arrangementType) || null,
          difficultyId: (input && input.difficultyId) || (input && input.difficulty) || null,
          speed: (input && input.speed) || null,
          mode: (input && input.mode) || null,
          preset: (input && input.preset) || null,
          durationSec: (input && input.durationSec) || 120
        },
        gameplay: {
          payload: (input && input.gameplayPayload) || null,
          chart: (input && input.chart) || (input && input.events ? input : null),
          preset: (input && input.preset) || null
        }
      }
    };
  }

  function runDirectExercise(input, options) {
    options = options || {};
    var exercise = normalizeToExercise(input);

    var session = {
      id: "adhoc_" + Date.now(),
      flow: "adhoc",
      segments: [{
        id: "seg_adhoc",
        type: exercise.type,
        exerciseIds: [exercise.id]
      }],
      exercises: [exercise],
      rewards: [],
      meta: {
        adhoc: true,
        source: options.source || "direct"
      }
    };

    // Log through event system
    if (typeof SparkEventLogger !== "undefined") {
      SparkEventLogger.log("direct_exercise", {
        source: options.source || "direct",
        exerciseType: exercise.type,
        exerciseId: exercise.id
      });
    }

    // Dispatch to appropriate launcher
    if (exercise.type === "song") {
      return _launchSongDirect(exercise, input, options);
    }
    return _launchPracticeDirect(exercise, input, options);
  }

  function _launchSongDirect(exercise, originalInput, options) {
    var chartIdOrChart = originalInput;
    var opts = {};

    // Extract options from exercise data
    if (exercise.data && exercise.data.core) {
      if (exercise.data.core.difficulty) opts.difficulty = exercise.data.core.difficulty;
      if (exercise.data.core.speed) opts.speed = exercise.data.core.speed;
      if (exercise.data.core.preset) opts.preset = exercise.data.core.preset;
      if (exercise.data.core.mode) opts.mode = exercise.data.core.mode;
    }

    // Merge caller options
    if (options.difficulty) opts.difficulty = options.difficulty;
    if (options.speed) opts.speed = options.speed;
    if (options.preset) opts.preset = options.preset;
    if (options.mode) opts.mode = options.mode;
    if (options.targetTechnique) opts.targetTechnique = options.targetTechnique;

    if (typeof startPerformance === "function") {
      startPerformance(chartIdOrChart, opts);
      return true;
    }
    return false;
  }

  function _launchPracticeDirect(exercise, originalInput, options) {
    if (exercise.data && exercise.data.gameplay && exercise.data.gameplay.payload) {
      if (typeof startPlayableRhythmHighwayPayload === "function") {
        startPlayableRhythmHighwayPayload(exercise.data.gameplay.payload, {
          source: options.source || "direct",
          instrument: options.instrument || "guitar"
        });
        return true;
      }
    }
    if (options.segmentId && typeof startRhythmHighwaySegment === "function") {
      startRhythmHighwaySegment(options.segmentId, options.preset || null, options.loopSpec || null);
      return true;
    }
    return false;
  }

  var SparkExecutionGateway = {
    runDirectExercise: runDirectExercise,
    normalizeToExercise: normalizeToExercise
  };

  if (typeof window !== "undefined") window.SparkExecutionGateway = SparkExecutionGateway;
  if (typeof module !== "undefined") module.exports = SparkExecutionGateway;
})();
