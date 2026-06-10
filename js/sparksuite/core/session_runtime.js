(function() {
  /**
   * SparkSessionRuntime — single authoritative session loop.
   *
   * All gameplay MUST flow through this:
   *   startSessionLoop() -> runSegment() -> completeSegment() -> next
   *
   * UI calls runSegment(). Nothing else.
   */

  var _activeSession = null;
  var _activeSegmentIndex = -1;
  var _sessionEvents = [];
  var _segmentTransport = {
    status: "idle",
    positionMs: 0,
    durationMs: 0,
    startedAtMs: 0,
    pauseStartedAtMs: 0,
    autoAdvance: true,
    tickHandle: null
  };

  function findExerciseById(session, exerciseId) {
    var exercises = session && Array.isArray(session.exercises) ? session.exercises : [];
    var i;
    for (i = 0; i < exercises.length; i++) {
      if (exercises[i] && exercises[i].id === exerciseId) return exercises[i];
    }
    return null;
  }

  function resolveSegmentExercise(segment) {
    var ids = segment && Array.isArray(segment.exerciseIds) ? segment.exerciseIds : [];
    if (!_activeSession || !ids.length) return null;
    return findExerciseById(_activeSession, ids[0]);
  }

  function findSegmentIndexById(session, segmentId) {
    var segments = session && Array.isArray(session.segments) ? session.segments : [];
    var i;
    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === segmentId) return i;
    }
    return -1;
  }

  function getExecutionGateway() {
    if (typeof window !== "undefined" && window.SparkExecutionGateway) return window.SparkExecutionGateway;
    if (typeof SparkExecutionGateway !== "undefined") return SparkExecutionGateway;
    return null;
  }

  function buildSegmentLaunchOptions(segment, exercise) {
    return {
      source: "session_runtime",
      session: _activeSession,
      segment: segment,
      exercise: exercise,
      segmentIndex: _activeSegmentIndex
    };
  }

  function getSparkCoreHandle() {
    if (typeof window !== "undefined" && window.sparkCore) return window.sparkCore;
    if (typeof sparkCore !== "undefined") return sparkCore;
    return null;
  }

  function buildStartSessionRequest(options) {
    var context = options && options.context && typeof options.context === "object"
      ? options.context
      : {};
    var request = {};
    var key;
    for (key in context) {
      if (Object.prototype.hasOwnProperty.call(context, key)) {
        request[key] = context[key];
      }
    }
    request.flow = options && options.flow
      ? options.flow
      : (request.flow || (typeof SparkSessionTypes !== "undefined" ? SparkSessionTypes.FLOW_DAILY_PRACTICE : "daily_practice"));
    return request;
  }

  function stopTransportTicker() {
    if (_segmentTransport.tickHandle && typeof clearInterval === "function") {
      clearInterval(_segmentTransport.tickHandle);
    }
    _segmentTransport.tickHandle = null;
  }

  function resetSegmentTransport() {
    stopTransportTicker();
    _segmentTransport.status = "idle";
    _segmentTransport.positionMs = 0;
    _segmentTransport.durationMs = 0;
    _segmentTransport.startedAtMs = 0;
    _segmentTransport.pauseStartedAtMs = 0;
    _segmentTransport.autoAdvance = true;
  }

  function computeTransportPosition(nowMs) {
    if (_segmentTransport.status === "paused" || _segmentTransport.status === "completed") {
      return Math.max(0, Math.round(_segmentTransport.positionMs || 0));
    }
    if (_segmentTransport.startedAtMs <= 0) {
      return Math.max(0, Math.round(_segmentTransport.positionMs || 0));
    }
    return Math.max(0, Math.round((nowMs || Date.now()) - _segmentTransport.startedAtMs));
  }

  function syncSparkCoreTransport(status, positionMs) {
    var core = getSparkCoreHandle();
    var segment = getActiveSegment();
    var patch;
    if (!core) return null;
    patch = {
      activeSegmentId: segment && segment.id ? segment.id : null,
      transport: {
        status: status || _segmentTransport.status,
        positionMs: Math.max(0, Math.round(positionMs != null ? positionMs : _segmentTransport.positionMs || 0))
      }
    };
    if (
      _activeSession &&
      _activeSession.flow === "guided_session" &&
      typeof core.syncGuidedRuntimeState === "function"
    ) {
      return core.syncGuidedRuntimeState(patch);
    }
    if (typeof core.updateRuntimeState === "function") {
      return core.updateRuntimeState(patch);
    }
    return null;
  }

  function finalizeSegmentCompletion(result, options) {
    var segment = getActiveSegment();
    var nextIndex;
    options = options || {};

    stopTransportTicker();
    _segmentTransport.status = "completed";
    if (_segmentTransport.durationMs > 0) {
      _segmentTransport.positionMs = Math.min(_segmentTransport.durationMs, Math.max(0, Math.round(_segmentTransport.positionMs || 0)));
    }
    if (segment) {
      segment.completed = true;
      segment.skipped = !!options.skipped;
    }
    syncSparkCoreTransport("completed", _segmentTransport.positionMs);

    if (typeof SparkEventLogger !== "undefined") {
      SparkEventLogger.log("segment_complete", {
        segmentIndex: _activeSegmentIndex,
        accuracy: result ? result.accuracy : 0,
        skipped: !!options.skipped
      });
    }

    if (typeof S !== "undefined") {
      S.lastSessionEvents = _sessionEvents.slice();
    }

    nextIndex = _activeSegmentIndex + 1;
    if (_activeSession && nextIndex < _activeSession.segments.length) {
      if (options.autoAdvance) {
        runSegment(nextIndex, { autoAdvance: true });
      }
      return { hasNext: true, nextIndex: nextIndex };
    }
    return { hasNext: false, nextIndex: -1 };
  }

  function scheduleTransportTicker() {
    if (typeof setInterval !== "function") return;
    stopTransportTicker();
    _segmentTransport.tickHandle = setInterval(function() {
      syncSegmentTransport("tick");
    }, 250);
    if (_segmentTransport.tickHandle && typeof _segmentTransport.tickHandle.unref === "function") {
      _segmentTransport.tickHandle.unref();
    }
  }

  function startSegmentTransport(segment, options) {
    var durationMs = Math.max(0, Math.round(((segment && segment.durationSec) || 0) * 1000));
    var nowMs = options && options.nowMs != null ? options.nowMs : Date.now();
    _segmentTransport.status = "running";
    _segmentTransport.positionMs = 0;
    _segmentTransport.durationMs = durationMs;
    _segmentTransport.startedAtMs = nowMs;
    _segmentTransport.pauseStartedAtMs = 0;
    _segmentTransport.autoAdvance = !options || options.autoAdvance !== false;
    syncSparkCoreTransport("running", 0);
    if (!options || options.scheduleTick !== false) {
      scheduleTransportTicker();
    }
  }

  function syncSegmentTransport(action, options) {
    var nowMs;
    var nextPositionMs;
    var completed;
    options = options || {};
    if (_activeSegmentIndex < 0 || !getActiveSegment()) {
      if (action === "complete") return { hasNext: false, nextIndex: -1 };
      return false;
    }
    nowMs = options.nowMs != null ? options.nowMs : Date.now();

    if (action === "pause") {
      if (_segmentTransport.status !== "running") return _segmentTransport;
      _segmentTransport.positionMs = computeTransportPosition(nowMs);
      _segmentTransport.status = "paused";
      _segmentTransport.pauseStartedAtMs = nowMs;
      stopTransportTicker();
      syncSparkCoreTransport("paused", _segmentTransport.positionMs);
      return _segmentTransport;
    }

    if (action === "resume") {
      if (_segmentTransport.status !== "paused") return _segmentTransport;
      _segmentTransport.status = "running";
      _segmentTransport.startedAtMs = nowMs - Math.max(0, Math.round(_segmentTransport.positionMs || 0));
      _segmentTransport.pauseStartedAtMs = 0;
      syncSparkCoreTransport("running", _segmentTransport.positionMs);
      if (options.scheduleTick !== false) scheduleTransportTicker();
      return _segmentTransport;
    }

    if (action === "seek") {
      nextPositionMs = Math.max(0, Math.round(options.positionMs || 0));
      if (_segmentTransport.durationMs > 0) nextPositionMs = Math.min(_segmentTransport.durationMs, nextPositionMs);
      _segmentTransport.positionMs = nextPositionMs;
      if (_segmentTransport.status === "running") {
        _segmentTransport.startedAtMs = nowMs - nextPositionMs;
      }
      syncSparkCoreTransport(_segmentTransport.status, _segmentTransport.positionMs);
      return _segmentTransport;
    }

    if (action === "complete") {
      if (Object.prototype.hasOwnProperty.call(options, "positionMs")) {
        _segmentTransport.positionMs = Math.max(0, Math.round(options.positionMs || 0));
      } else {
        _segmentTransport.positionMs = computeTransportPosition(nowMs);
      }
      if (_segmentTransport.durationMs > 0) {
        _segmentTransport.positionMs = Math.min(_segmentTransport.durationMs, _segmentTransport.positionMs);
      }
      return finalizeSegmentCompletion(options.result || null, {
        autoAdvance: options.autoAdvance === true,
        skipped: options.skipped === true
      });
    }

    nextPositionMs = Object.prototype.hasOwnProperty.call(options, "positionMs")
      ? Math.max(0, Math.round(options.positionMs || 0))
      : computeTransportPosition(nowMs);
    if (_segmentTransport.durationMs > 0) {
      nextPositionMs = Math.min(_segmentTransport.durationMs, nextPositionMs);
    }
    _segmentTransport.positionMs = nextPositionMs;
    syncSparkCoreTransport(_segmentTransport.status || "running", _segmentTransport.positionMs);

    completed = _segmentTransport.durationMs > 0 && _segmentTransport.positionMs >= _segmentTransport.durationMs;
    if (completed) {
      return finalizeSegmentCompletion(null, { autoAdvance: _segmentTransport.autoAdvance });
    }
    return _segmentTransport;
  }

  // Start a new session loop via SessionEngine
  function startSessionLoop(options) {
    var core;
    var engine;
    var flow;
    options = options || {};
    _sessionEvents = [];
    _activeSegmentIndex = -1;
    resetSegmentTransport();

    // Build session through the engine (single authoritative path)
    core = getSparkCoreHandle();
    if (core && typeof core.startSession === "function") {
      _activeSession = core.startSession(buildStartSessionRequest(options));
    } else if (typeof SparkSuiteSessionEngine !== "undefined") {
      // Fallback: direct engine call
      flow = options.flow || (typeof SparkSessionTypes !== "undefined" ? SparkSessionTypes.FLOW_DAILY_PRACTICE : "daily_practice");
      engine = new SparkSuiteSessionEngine(
        window.SparkSuitePracticeEngine || { buildDailyPracticePlan: function() { return { segments: [], exercises: [] }; } },
        window.SparkSuiteCurriculumEngine || { getDailyPracticeContext: function() { return {}; } }
      );
      _activeSession = engine.buildSession(flow, options.context || {});
    }

    if (_activeSession && typeof assertSessionPlan === "function") {
      assertSessionPlan(_activeSession);
    }

    if (_activeSession) {
      if (Array.isArray(_activeSession.segments) && _activeSession.segments.length) {
        attachSession(_activeSession, {
          segmentIndex: 0,
          status: "ready",
          positionMs: 0,
          autoAdvance: options.autoAdvance !== false,
          scheduleTick: false,
          syncState: false,
          preserveEvents: true
        });
      }
      console.log("[SparkRuntime] SESSION PLAN", _activeSession);
    }

    return _activeSession;
  }

  function attachSession(session, options) {
    var segmentIndex;
    var nowMs;
    var segment;
    options = options || {};
    if (session && typeof assertSessionPlan === "function") {
      assertSessionPlan(session);
    }
    if (!session || !Array.isArray(session.segments) || !session.segments.length) {
      resetSegmentTransport();
      _activeSession = session || null;
      _activeSegmentIndex = -1;
      return false;
    }

    _activeSession = session;
    if (!options.preserveEvents) _sessionEvents = [];
    segmentIndex = Object.prototype.hasOwnProperty.call(options, "segmentIndex")
      ? parseInt(options.segmentIndex, 10)
      : findSegmentIndexById(session, options.segmentId || null);
    if (isNaN(segmentIndex) || segmentIndex < 0 || segmentIndex >= session.segments.length) {
      segmentIndex = 0;
    }
    _activeSegmentIndex = segmentIndex;
    stopTransportTicker();

    segment = getActiveSegment();
    nowMs = options.nowMs != null ? options.nowMs : Date.now();
    _segmentTransport.status = options.status || "ready";
    _segmentTransport.positionMs = Math.max(0, Math.round(options.positionMs || 0));
    _segmentTransport.durationMs = Math.max(0, Math.round(((segment && segment.durationSec) || 0) * 1000));
    if (_segmentTransport.durationMs > 0) {
      _segmentTransport.positionMs = Math.min(_segmentTransport.durationMs, _segmentTransport.positionMs);
    }
    _segmentTransport.autoAdvance = !!options.autoAdvance;
    _segmentTransport.startedAtMs = 0;
    _segmentTransport.pauseStartedAtMs = 0;
    if (_segmentTransport.status === "running") {
      _segmentTransport.startedAtMs = nowMs - _segmentTransport.positionMs;
      if (options.scheduleTick !== false) scheduleTransportTicker();
    } else if (_segmentTransport.status === "paused") {
      _segmentTransport.pauseStartedAtMs = nowMs;
    }
    if (segment && _segmentTransport.status === "completed") {
      segment.completed = true;
    }
    if (options.syncState !== false) {
      syncSparkCoreTransport(_segmentTransport.status, _segmentTransport.positionMs);
    }
    return true;
  }

  // Run a specific segment from the active session
  function runSegment(segmentIndex, options) {
    if (!_activeSession || !_activeSession.segments) return false;
    if (segmentIndex < 0 || segmentIndex >= _activeSession.segments.length) return false;

    options = options || {};
    _activeSegmentIndex = segmentIndex;
    var segment = _activeSession.segments[segmentIndex];
    var exercise = resolveSegmentExercise(segment);
    var gateway = getExecutionGateway();

    // Log session start event
    if (typeof SparkEventLogger !== "undefined") {
      SparkEventLogger.log("session_start", { segmentId: segment.id, segmentType: segment.type, exerciseId: exercise ? exercise.id : null });
    }

    if (segment && segment.meta && segment.meta.ukuleleMiniSessionId) {
      startSegmentTransport(segment, options);
      return true;
    }

    if (gateway && typeof gateway.runSessionSegment === "function") {
      var launched = gateway.runSessionSegment(_activeSession, segment, buildSegmentLaunchOptions(segment, exercise));
      if (launched) {
        startSegmentTransport(segment, options);
        return launched;
      }
    }

    // Dispatch to appropriate launcher based on segment type
    if (segment.type === "song") {
      var launchedSong = _launchSong(segment, exercise);
      if (launchedSong) startSegmentTransport(segment, options);
      return launchedSong;
    } else if (segment.type === "challenge") {
      var launchedChallenge = _launchChallenge(segment, exercise);
      if (launchedChallenge) startSegmentTransport(segment, options);
      return launchedChallenge;
    } else {
      var launchedPractice = _launchPractice(segment, exercise);
      if (launchedPractice) startSegmentTransport(segment, options);
      return launchedPractice;
    }
  }

  function runSegmentById(segmentId, options) {
    var segmentIndex = findSegmentIndexById(_activeSession, segmentId);
    if (segmentIndex < 0) return false;
    return runSegment(segmentIndex, options || {});
  }

  function completeSegmentById(segmentId, result, options) {
    var segmentIndex = findSegmentIndexById(_activeSession, segmentId);
    options = options || {};
    if (segmentIndex < 0) return false;
    if (_activeSegmentIndex !== segmentIndex) {
      attachSession(_activeSession, {
        segmentIndex: segmentIndex,
        status: options.status || "ready",
        positionMs: Object.prototype.hasOwnProperty.call(options, "positionMs") ? options.positionMs : 0,
        autoAdvance: options.autoAdvance === true,
        scheduleTick: false,
        syncState: false,
        preserveEvents: true,
        nowMs: options.nowMs
      });
    }
    return completeActiveSegment(result, options);
  }

  function pauseActiveSegment(options) {
    return syncSegmentTransport("pause", options || {});
  }

  function resumeActiveSegment(options) {
    return syncSegmentTransport("resume", options || {});
  }

  function completeActiveSegment(result, options) {
    options = options || {};
    options.result = result || null;
    return syncSegmentTransport("complete", options);
  }

  function skipActiveSegment(options) {
    options = options || {};
    options.skipped = true;
    if (!Object.prototype.hasOwnProperty.call(options, "autoAdvance")) {
      options.autoAdvance = true;
    }
    if (!Object.prototype.hasOwnProperty.call(options, "positionMs")) {
      options.positionMs = _segmentTransport.durationMs > 0
        ? _segmentTransport.durationMs
        : computeTransportPosition(options.nowMs);
    }
    return syncSegmentTransport("complete", options);
  }

  // Record a gameplay event (hit, miss, etc.)
  function recordEvent(event) {
    _sessionEvents.push(event);
  }

  // Complete current segment and advance
  function completeSegment(result) {
    return syncSegmentTransport("complete", { result: result });
  }

  // Get active session info
  function getActiveSession() { return _activeSession; }
  function getActiveSegmentIndex() { return _activeSegmentIndex; }
  function getActiveSegment() {
    if (!_activeSession || !Array.isArray(_activeSession.segments)) return null;
    if (_activeSegmentIndex < 0 || _activeSegmentIndex >= _activeSession.segments.length) return null;
    return _activeSession.segments[_activeSegmentIndex] || null;
  }
  function getActiveExercise() { return resolveSegmentExercise(getActiveSegment()); }
  function getSessionEvents() { return _sessionEvents.slice(); }
  function getSegmentTransport() {
    return {
      status: _segmentTransport.status,
      positionMs: _segmentTransport.positionMs,
      durationMs: _segmentTransport.durationMs,
      autoAdvance: _segmentTransport.autoAdvance
    };
  }

  // --- Internal launchers (delegate to existing functions) ---

  function _normalizeInstrumentType(instrument) {
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

  function _launchPractice(segment, exercise) {
    var payload = null;
    var core = exercise && exercise.data && exercise.data.core ? exercise.data.core : {};
    if (exercise && exercise.data && exercise.data.gameplay && exercise.data.gameplay.payload) {
      payload = exercise.data.gameplay.payload;
    }

    // Try playable rhythm highway for practice drills
    if (payload && typeof startPlayableRhythmHighwayPayload === "function") {
      var instrument = _normalizeInstrumentType(core.instrument || (payload && payload.adapterType)) || "guitar";
      return startPlayableRhythmHighwayPayload(payload, {
        source: "session_runtime",
        label: (exercise && exercise.data && exercise.data.core && exercise.data.core.skill) || "Practice",
        segmentId: segment.id,
        instrument: instrument
      });
    }

    // Try rhythm highway segment
    if (segment.id && typeof startRhythmHighwaySegment === "function") {
      return startRhythmHighwaySegment(segment.id);
    }

    return false;
  }

  function _launchSong(segment, exercise) {
    var songId = exercise && exercise.data && exercise.data.core ? exercise.data.core.songId : null;
    var arrangementType = exercise && exercise.data && exercise.data.core ? exercise.data.core.arrangementType : "chords";
    var difficultyId = exercise && exercise.data && exercise.data.core ? exercise.data.core.difficultyId : "normal";

    if (typeof startPerformance === "function" && songId) {
      startPerformance(songId, { difficulty: difficultyId, arrangementType: arrangementType });
      return true;
    }
    return false;
  }

  function _launchChallenge(segment, exercise) {
    // Challenges are practice drills with higher tempo
    return _launchPractice(segment, exercise);
  }

  var SparkSessionRuntime = {
    startSessionLoop: startSessionLoop,
    runSegment: runSegment,
    recordEvent: recordEvent,
    completeSegment: completeSegment,
    getActiveSession: getActiveSession,
    getActiveSegmentIndex: getActiveSegmentIndex,
    getActiveSegment: getActiveSegment,
    getActiveExercise: getActiveExercise,
    getSessionEvents: getSessionEvents,
    getSegmentTransport: getSegmentTransport,
    runSegmentById: runSegmentById,
    completeSegmentById: completeSegmentById,
    pauseActiveSegment: pauseActiveSegment,
    resumeActiveSegment: resumeActiveSegment,
    completeActiveSegment: completeActiveSegment,
    skipActiveSegment: skipActiveSegment,
    syncSegmentTransport: syncSegmentTransport,
    attachSession: attachSession
  };

  if (typeof window !== "undefined") window.SparkSessionRuntime = SparkSessionRuntime;
  if (typeof module !== "undefined") module.exports = SparkSessionRuntime;
})();
