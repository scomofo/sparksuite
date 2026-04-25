(function() {
  /**
   * SparkExecutionGateway -- unified execution layer for all gameplay entry points.
   *
   * Canonical flow:
   *   Session -> segments -> exerciseIds -> exercises -> runExercise()
   */

  var _handlers = {};
  var _missingCounts = {};
  var _defaultHandlersInstalled = false;
  var _sparkCoreHandle = null;
  var _strict = true;
  var _lastAction = null;
  var _lastResult = null;

  function getSparkErrorApi() {
    function SparkFallbackError(code, message, context) {
      this.name = "SparkError";
      this.code = code;
      this.message = message || code;
      this.context = context || {};
    }
    SparkFallbackError.prototype = Object.create(Error.prototype);
    SparkFallbackError.prototype.constructor = SparkFallbackError;
    SparkFallbackError.prototype.toString = function() {
      return this.name + ": " + this.message;
    };
    if (typeof SparkError !== "undefined" && typeof SparkErrorCodes !== "undefined") {
      return {
        SparkError: SparkError,
        SparkErrorCodes: SparkErrorCodes
      };
    }
    if (typeof window !== "undefined" && window.SparkError && window.SparkErrorCodes) {
      return {
        SparkError: window.SparkError,
        SparkErrorCodes: window.SparkErrorCodes
      };
    }
    if (typeof require === "function") {
      try {
        return {
          SparkError: require("./spark_error.js").SparkError,
          SparkErrorCodes: require("./error_codes.js").SparkErrorCodes
        };
      } catch (error) {}
    }
    return {
      SparkError: SparkFallbackError,
      SparkErrorCodes: {
        ACTION_UNKNOWN: "ACTION_UNKNOWN",
        ACTION_HANDLER_MISSING: "ACTION_HANDLER_MISSING",
        SESSION_INVALID: "SESSION_INVALID",
        SESSION_INVALID_EXERCISE_REFERENCE: "SESSION_INVALID_EXERCISE_REFERENCE"
      }
    };
  }

  function createGatewayError(code, message, context) {
    var api = getSparkErrorApi();
    return new api.SparkError(code, message, context || {});
  }

  function getActionRegistryApi() {
    if (typeof window !== "undefined" && typeof window.isKnownSparkAction === "function") {
      return {
        isKnownSparkAction: window.isKnownSparkAction,
        listKnownSparkActions: typeof window.listKnownSparkActions === "function"
          ? window.listKnownSparkActions
          : function() { return []; }
      };
    }
    if (typeof require === "function") {
      try {
        return require("./action_registry.js");
      } catch (error) {}
    }
    return {
      isKnownSparkAction: function() { return true; },
      listKnownSparkActions: function() { return []; }
    };
  }

  function isKnownSparkAction(name) {
    return !!getActionRegistryApi().isKnownSparkAction(name);
  }

  function listKnownSparkActions() {
    return getActionRegistryApi().listKnownSparkActions();
  }

  function register(name, handler) {
    if (typeof name !== "string" || !name) {
      throw createGatewayError(
        getSparkErrorApi().SparkErrorCodes.ACTION_UNKNOWN,
        "SparkExecutionGateway: handler name must be a non-empty string"
      );
    }
    if (!isKnownSparkAction(name)) {
      throw createGatewayError(
        getSparkErrorApi().SparkErrorCodes.ACTION_UNKNOWN,
        'SparkExecutionGateway: unknown action "' + name + '"',
        { actionName: name }
      );
    }
    if (typeof handler !== "function") {
      throw createGatewayError(
        getSparkErrorApi().SparkErrorCodes.ACTION_HANDLER_MISSING,
        'SparkExecutionGateway: handler "' + name + '" must be a function',
        { actionName: name }
      );
    }
    _handlers[name] = handler;
    return handler;
  }

  function unregister(name) {
    if (name && Object.prototype.hasOwnProperty.call(_handlers, name)) {
      delete _handlers[name];
    }
  }

  function getRegisteredHandler(name) {
    return name && Object.prototype.hasOwnProperty.call(_handlers, name) ? _handlers[name] : null;
  }

  function listRegisteredHandlers() {
    return Object.keys(_handlers).sort();
  }

  function logMissingHandler(name) {
    _missingCounts[name] = (_missingCounts[name] || 0) + 1;
    if (typeof console !== "undefined" && console.warn) {
      console.warn('SparkExecutionGateway: missing handler "' + name + '"');
    }
  }

  function getMissingHandlerReport() {
    var result = {};
    var key;
    for (key in _missingCounts) {
      if (Object.prototype.hasOwnProperty.call(_missingCounts, key)) result[key] = _missingCounts[key];
    }
    return result;
  }

  function clearHandlers() {
    _handlers = {};
    _missingCounts = {};
    _defaultHandlersInstalled = false;
    _lastAction = null;
    _lastResult = null;
  }

  function execute(name, payload, fallback) {
    var actionPayload = payload || {};
    _lastAction = {
      actionName: name,
      payload: actionPayload,
      at: new Date().toISOString()
    };
    if (!isKnownSparkAction(name)) {
      return handleMissingAction(name, actionPayload, fallback, "unknown_action");
    }
    var handler = getRegisteredHandler(name);
    if (handler) {
      return recordExecutionResult(name, handler(actionPayload));
    }
    return handleMissingAction(name, actionPayload, fallback, "unregistered_handler");
  }

  function handleMissingAction(name, payload, fallback, reason) {
    var codes = getSparkErrorApi().SparkErrorCodes;
    logMissingHandler(name);
    if (typeof fallback === "function") {
      return recordExecutionResult(name, fallback(payload || {}));
    }
    if (_strict) {
      throw createGatewayError(
        reason === "unknown_action" ? codes.ACTION_UNKNOWN : codes.ACTION_HANDLER_MISSING,
        'SparkExecutionGateway: missing handler "' + name + '" (' + reason + ')',
        {
          actionName: name,
          reason: reason,
          payload: payload || {},
          missingHandlers: getMissingHandlerReport()
        }
      );
    }
    return recordExecutionResult(name, false);
  }

  function recordExecutionResult(name, result) {
    _lastResult = {
      actionName: name,
      result: result,
      at: new Date().toISOString()
    };
    return result;
  }

  function setStrict(value) {
    _strict = value !== false;
    return _strict;
  }

  function isStrict() {
    return _strict;
  }

  function getLastAction() {
    return _lastAction;
  }

  function getLastResult() {
    return _lastResult;
  }

  function normalizeToExercise(input) {
    if (input && input.id && input.data) return input;

    var meta = input && input.meta ? input.meta : {};
    var id = (input && input.id) || ("ex_adhoc_" + Date.now());
    var type = inferExerciseType(input);

    return {
      id: id,
      type: type,
      difficulty: (input && input.difficulty) || meta.difficultyId || meta.difficulty || "normal",
      data: {
        core: {
          songId: (input && input.songId) || meta.songId || (typeof input === "string" ? input : null),
          chartId: (input && input.chartId) || meta.chartId || (typeof input === "string" ? input : null),
          arrangementType: (input && input.arrangementType) || meta.arrangementType || null,
          difficultyId: (input && input.difficultyId) || meta.difficultyId || (input && input.difficulty) || null,
          speed: (input && input.speed) || meta.speed || null,
          mode: (input && input.mode) || meta.mode || null,
          preset: (input && input.preset) || meta.enginePreset || meta.preset || null,
          durationSec: (input && input.durationSec) || meta.durationSec || 120,
          skill: meta.skill || null,
          instrument: meta.instrument || null,
          chords: meta.chords || meta.chordNames || (meta.chordName ? [meta.chordName] : null),
          pattern: meta.pattern || null
        },
        gameplay: {
          payload: (input && input.gameplayPayload) || meta.gameplayPayload || null,
          chart: (input && input.chart) || (input && input.events ? input : null),
          preset: (input && input.preset) || meta.enginePreset || meta.preset || null
        }
      }
    };
  }

  function inferExerciseType(input) {
    if (typeof input === "string") return "song";
    if (input && input.type) {
      if (input.type === "performance_song" || input.type === "performance_phrase" || input.type === "performance_technique") return "song";
      if (input.type === "challenge") return "challenge";
      if (input.type === "song") return "song";
      if (input.type === "rhythm_highway" || input.type === "rhythm" || input.type === "warmup" || input.type === "transition" || input.type === "finger" || input.type === "practice") return "practice";
    }
    if (input && (input.songId || input.song || input.arrangementType || input.chartId)) return "song";
    if (input && input.spotifyTrackUri) return "song";
    return "practice";
  }

  function setSparkCoreHandle(core) {
    _sparkCoreHandle = core || null;
    return _sparkCoreHandle;
  }

  function getSparkCoreHandle() {
    if (_sparkCoreHandle) return _sparkCoreHandle;
    if (typeof window !== "undefined" && window.sparkCore) return window.sparkCore;
    if (typeof sparkCore !== "undefined") return sparkCore;
    return null;
  }

  function registerDefaultHandler(name, handler, options) {
    if (options && options.force === true) unregister(name);
    if (!getRegisteredHandler(name)) register(name, handler);
  }

  function runDefaultSegment(payload) {
    if (!payload || !payload.exercise) return false;
    return runExercise(payload.exercise, payload.options);
  }

  function startDefaultSong(payload) {
    if (!payload || !payload.target || typeof startPerformance !== "function") return false;
    startPerformance(payload.target, payload.options || {});
    return true;
  }

  function startDefaultPractice(payload) {
    if (!payload || !payload.payload || typeof startPlayableRhythmHighwayPayload !== "function") return false;
    startPlayableRhythmHighwayPayload(payload.payload, payload.options || {});
    return true;
  }

  function installDefaultHandlers(options) {
    var segmentTypes;
    var i;
    options = options || {};

    if (Object.prototype.hasOwnProperty.call(options, "sparkCore")) {
      setSparkCoreHandle(options.sparkCore);
    }
    if (_defaultHandlersInstalled && options.force !== true) return false;

    segmentTypes = [
      "practice",
      "song",
      "challenge",
      "warm_engine",
      "drill",
      "cooldown",
      "review",
      "newMove",
      "songSlice",
      "victoryLap"
    ];

    for (i = 0; i < segmentTypes.length; i++) {
      registerDefaultHandler("session.segment." + segmentTypes[i], runDefaultSegment, options);
    }
    registerDefaultHandler("session.segment.start", runDefaultSegment, options);
    registerDefaultHandler("song.start", startDefaultSong, options);
    registerDefaultHandler("practice.start", startDefaultPractice, options);
    registerDefaultHandler("challenge.start", startDefaultPractice, options);

    _defaultHandlersInstalled = true;
    return true;
  }

  function findSegmentById(session, segmentId) {
    var segments = session && Array.isArray(session.segments) ? session.segments : [];
    for (var i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === segmentId) return segments[i];
    }
    return null;
  }

  function findExerciseById(session, exerciseId) {
    var exercises = session && Array.isArray(session.exercises) ? session.exercises : [];
    for (var i = 0; i < exercises.length; i++) {
      if (exercises[i] && exercises[i].id === exerciseId) return exercises[i];
    }
    return null;
  }

  function resolveSegmentExercises(session, segment) {
    var resolved = [];
    var ids = segment && Array.isArray(segment.exerciseIds) ? segment.exerciseIds : [];
    var i;

    for (i = 0; i < ids.length; i++) {
      var exercise = findExerciseById(session, ids[i]);
      if (exercise) resolved.push(exercise);
    }

    return resolved;
  }

  function resolvePrimaryExercise(session, segment) {
    var exercises = resolveSegmentExercises(session, segment);
    return exercises.length ? exercises[0] : null;
  }

  function failExecution(message, detail, code, context) {
    if (typeof console !== "undefined" && console.error) {
      console.error("SparkExecutionGateway: " + message, detail || null);
    }
    throw createGatewayError(
      code || getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
      "SparkExecutionGateway: " + message,
      Object.assign({ detail: detail || null }, context || {})
    );
  }

  function normalizeInstrumentType(instrument) {
    var all;
    var i;
    var entry;
    if (!instrument) return null;
    if (instrument === "guitar" || instrument === "bass" || instrument === "piano" || instrument === "ukulele" || instrument === "drums") {
      return instrument;
    }
    if (typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getAll === "function") {
      all = SparkInstruments.getAll() || [];
      for (i = 0; i < all.length; i++) {
        entry = all[i] || {};
        if (entry.id === instrument || entry.appId === instrument || entry.instrumentId === instrument) {
          return entry.instrument || entry.instrumentType || instrument;
        }
      }
    }
    return instrument;
  }

  function runSessionSegment(session, segment, options) {
    options = options || {};
    if (!session || !segment) return false;
    if (typeof assertSessionPlan === "function") {
      assertSessionPlan(session);
    }

    var exercises = resolveSegmentExercises(session, segment);
    var primaryExercise;
    var segmentType;
    var segmentPayload;
    if (!exercises.length) {
      failExecution(
        "segment requires resolved exercises",
        segment && segment.id ? segment.id : null,
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID_EXERCISE_REFERENCE,
        {
          segmentId: segment && segment.id ? segment.id : null,
          sessionId: session && session.id ? session.id : null
        }
      );
    }

    primaryExercise = exercises[0];
    segmentType = segment && segment.type ? String(segment.type) : "practice";
    segmentPayload = {
      session: session,
      segment: segment,
      exercise: primaryExercise,
      exercises: exercises.slice(),
      options: mergeLaunchOptions(options, {
        session: session,
        segment: segment,
        exerciseIndex: 0,
        exerciseCount: exercises.length
      }),
      source: options.source || "session_segment"
    };

    return execute("session.segment." + segmentType, segmentPayload, function(payload) {
      return execute("session.segment.start", payload, function(fallbackPayload) {
        return runExercise(fallbackPayload.exercise, fallbackPayload.options);
      });
    });
  }

  function runSessionSegmentById(session, segmentId, options) {
    return runSessionSegment(session, findSegmentById(session, segmentId), options);
  }

  function runPlanItem(item, options) {
    options = options || {};
    var core = getSparkCoreHandle();

    var activeView = (core && typeof core.getActiveSessionView === "function")
      ? core.getActiveSessionView()
      : null;
    var session = activeView && activeView.plan ? activeView.plan : null;
    var segment = session && item && item.id ? findSegmentById(session, item.id) : null;

    if (session && segment) {
      return runSessionSegment(session, segment, mergeLaunchOptions(options, {
        source: options.source || "plan_item"
      }));
    }

    return runDirectExercise(item, options);
  }

  function runDirectExercise(input, options) {
    options = options || {};
    var exercise = normalizeToExercise(input);

    if (typeof SparkEventLogger !== "undefined") {
      SparkEventLogger.log("direct_exercise", {
        source: options.source || "direct",
        exerciseType: exercise.type,
        exerciseId: exercise.id
      });
    }

    return runExercise(exercise, mergeLaunchOptions(options, {
      source: options.source || "direct",
      directInput: input,
      segment: options.segment || null
    }));
  }

  function runPlayablePayload(payload, options) {
    options = options || {};
    if (!payload) return false;

    return runDirectExercise({
      id: options.exerciseId || ("ex_playable_" + Date.now()),
      type: "practice",
      gameplayPayload: payload,
      chartId: payload.chartId || (payload.chart && payload.chart.chartId) || null,
      instrument: options.instrument || payload.adapterType || null,
      meta: {
        skill: options.exerciseFocus || null,
        enginePreset: options.preset || null,
        audioOffsetMs: options.audioOffsetMs != null ? options.audioOffsetMs : null
      }
    }, mergeLaunchOptions(options, {
      source: options.source || "playable_payload"
    }));
  }

  function runRhythmHighwaySegment(segmentId, options) {
    options = options || {};
    var core = getSparkCoreHandle();

    var activeView = (core && typeof core.getActiveSessionView === "function")
      ? core.getActiveSessionView()
      : null;
    var session = activeView && activeView.plan ? activeView.plan : null;
    var segment = session ? findSegmentById(session, segmentId) : null;

    if (session && segment) {
      return runSessionSegment(session, segment, mergeLaunchOptions(options, {
        source: options.source || "rhythm_segment"
      }));
    }

    return false;
  }

  function runExercise(exercise, options) {
    options = options || {};
    if (!exercise || !exercise.data) return false;

    if (exercise.type === "song") return launchSongExercise(exercise, options);
    if (exercise.type === "challenge") return launchChallengeExercise(exercise, options);
    return launchPracticeExercise(exercise, options);
  }

  function launchSongExercise(exercise, options) {
    var core = exercise.data && exercise.data.core ? exercise.data.core : {};
    var gameplay = exercise.data && exercise.data.gameplay ? exercise.data.gameplay : {};
    var launchTarget = gameplay.chart || core.songId || core.chartId || options.directInput || null;
    var launchOptions = {};

    if (core.difficulty) launchOptions.difficulty = core.difficulty;
    if (core.difficultyId) launchOptions.difficulty = core.difficultyId;
    if (core.speed) launchOptions.speed = core.speed;
    if (core.preset) launchOptions.preset = core.preset;
    if (core.mode) launchOptions.mode = core.mode;
    if (core.arrangementType) launchOptions.arrangementType = core.arrangementType;

    if (options.difficulty) launchOptions.difficulty = options.difficulty;
    if (options.speed) launchOptions.speed = options.speed;
    if (options.preset) launchOptions.preset = options.preset;
    if (options.mode) launchOptions.mode = options.mode;
    if (options.arrangementType) launchOptions.arrangementType = options.arrangementType;
    if (options.targetTechnique) launchOptions.targetTechnique = options.targetTechnique;
    if (typeof options.onComplete === "function") launchOptions.onComplete = options.onComplete;

    // Spotify play-along: if exercise has a playAlongChart, launch via SparkPlaybackEngine
    if (gameplay.playAlongChart && typeof window.sparkCore !== "undefined" && window.sparkCore.playbackEngine) {
      if (typeof startPlayableRhythmHighwayPayload === "function" && gameplay.chart) {
        var spotifyInstrument = normalizeInstrumentType(core.instrument) || "guitar";
        var spotifyPayload = {
          songChart: gameplay.chart,
          chartId: gameplay.chart.metadata ? gameplay.chart.metadata.source : "spotify",
          enginePreset: gameplay.preset || "spark_learning",
          laneCount: (gameplay.chart.metadata && gameplay.chart.metadata.laneCount) || 4,
          adapterType: spotifyInstrument,
          spotifyTrackUri: core.spotifyTrackUri,
          playAlongChart: gameplay.playAlongChart
        };
        startPlayableRhythmHighwayPayload(spotifyPayload, {
          source: "spotify_play_along",
          label: gameplay.chart.song ? gameplay.chart.song.title : "Spotify Track",
          instrument: spotifyInstrument
        });
        return true;
      }
    }

    if (launchTarget) {
      return execute("song.start", {
        exercise: exercise,
        target: launchTarget,
        options: launchOptions,
        source: options.source || "exercise"
      }, function(payload) {
        if (typeof startPerformance !== "function") return false;
        startPerformance(payload.target, payload.options);
        return true;
      });
    }
    return false;
  }

  function launchPracticeExercise(exercise, options) {
    var core = exercise.data && exercise.data.core ? exercise.data.core : {};
    var gameplay = exercise.data && exercise.data.gameplay ? exercise.data.gameplay : {};
    var payload = gameplay.payload || null;

    if (!payload) {
      failExecution(
        "practice exercise missing gameplay payload",
        exercise && exercise.id ? exercise.id : null,
        getSparkErrorApi().SparkErrorCodes.SESSION_INVALID,
        {
          exerciseId: exercise && exercise.id ? exercise.id : null
        }
      );
    }

    if (payload) {
      var practiceInstrument = normalizeInstrumentType(options.instrument || core.instrument || (payload && payload.adapterType)) || "guitar";
      return execute("practice.start", {
        exercise: exercise,
        payload: payload,
        options: {
          source: options.source || "exercise",
          label: options.label || core.skill || core.chartId || core.songId || "Practice",
          instrument: practiceInstrument,
          segmentId: options.segment ? options.segment.id : (options.segmentId || null),
          exerciseId: exercise.id,
          exerciseFocus: core.skill || null,
          song: options.song || null,
          playlist: Array.isArray(options.playlist) ? options.playlist.slice() : null,
          options: mergeLaunchOptions(options.options || {}, buildPlayableLaunchOptions(core, gameplay, options))
        },
        source: options.source || "exercise"
      }, function(payloadOptions) {
        if (typeof startPlayableRhythmHighwayPayload !== "function") return false;
        startPlayableRhythmHighwayPayload(payloadOptions.payload, payloadOptions.options);
        return true;
      });
    }

    return false;
  }

  function launchChallengeExercise(exercise, options) {
    return launchPracticeExercise(exercise, options);
  }

  function buildPlayableLaunchOptions(core, gameplay, options) {
    var result = {};
    var audioOffsetMs = options.audioOffsetMs;
    if (audioOffsetMs == null && core) audioOffsetMs = core.audioOffsetMs;
    if (audioOffsetMs == null && gameplay) audioOffsetMs = gameplay.audioOffsetMs;
    if (audioOffsetMs != null) result.audioOffsetMs = audioOffsetMs;
    return result;
  }

  function mergeLaunchOptions(base, patch) {
    var result = {};
    var key;
    base = base || {};
    patch = patch || {};
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) result[key] = base[key];
    }
    for (key in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) result[key] = patch[key];
    }
    return result;
  }

  var SparkExecutionGateway = {
    register: register,
    unregister: unregister,
    execute: execute,
    setStrict: setStrict,
    isStrict: isStrict,
    setSparkCoreHandle: setSparkCoreHandle,
    installDefaultHandlers: installDefaultHandlers,
    getMissingHandlerReport: getMissingHandlerReport,
    getLastAction: getLastAction,
    getLastResult: getLastResult,
    getRegisteredHandler: getRegisteredHandler,
    listRegisteredHandlers: listRegisteredHandlers,
    isKnownSparkAction: isKnownSparkAction,
    listKnownSparkActions: listKnownSparkActions,
    clearHandlers: clearHandlers,
    normalizeToExercise: normalizeToExercise,
    resolveSegmentExercises: resolveSegmentExercises,
    resolvePrimaryExercise: resolvePrimaryExercise,
    runExercise: runExercise,
    runSessionSegment: runSessionSegment,
    runSessionSegmentById: runSessionSegmentById,
    runPlanItem: runPlanItem,
    runDirectExercise: runDirectExercise,
    runPlayablePayload: runPlayablePayload,
    runRhythmHighwaySegment: runRhythmHighwaySegment
  };

  if (typeof window !== "undefined") window.SparkExecutionGateway = SparkExecutionGateway;
  if (typeof module !== "undefined") module.exports = SparkExecutionGateway;
})();
