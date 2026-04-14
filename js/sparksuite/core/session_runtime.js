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

  // Start a new session loop via SessionEngine
  function startSessionLoop(options) {
    options = options || {};
    _sessionEvents = [];
    _activeSegmentIndex = -1;

    // Build session through the engine (single authoritative path)
    if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
      var startInput = {};
      var key;
      for (key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key) && key !== "context") startInput[key] = options[key];
      }
      if (options.context && typeof options.context === "object") {
        for (key in options.context) {
          if (Object.prototype.hasOwnProperty.call(options.context, key) && !Object.prototype.hasOwnProperty.call(startInput, key)) {
            startInput[key] = options.context[key];
          }
        }
      }
      if (!startInput.flow) {
        startInput.flow = (typeof SparkSessionTypes !== "undefined" ? SparkSessionTypes.FLOW_DAILY_PRACTICE : "daily_practice");
      }
      _activeSession = window.sparkCore.startSession(startInput);
    } else if (typeof SparkSuiteSessionEngine !== "undefined") {
      // Fallback: direct engine call
      var engine = new SparkSuiteSessionEngine(
        window.SparkSuitePracticeEngine || { buildDailyPracticePlan: function() { return { segments: [], exercises: [] }; } },
        window.SparkSuiteCurriculumEngine || { getDailyPracticeContext: function() { return {}; } }
      );
      _activeSession = engine.buildSession(options.flow || "daily_practice", options.context || {});
    }

    if (_activeSession) {
      console.log("[SparkRuntime] SESSION PLAN", _activeSession);
    }

    return _activeSession;
  }

  // Run a specific segment from the active session
  function runSegment(segmentIndex) {
    if (!_activeSession || !_activeSession.segments) return false;
    if (segmentIndex < 0 || segmentIndex >= _activeSession.segments.length) return false;

    _activeSegmentIndex = segmentIndex;
    var segment = _activeSession.segments[segmentIndex];

    // Find the exercise(s) for this segment
    var exercise = null;
    if (segment.exerciseIds && segment.exerciseIds.length && _activeSession.exercises) {
      for (var i = 0; i < _activeSession.exercises.length; i++) {
        if (_activeSession.exercises[i].id === segment.exerciseIds[0]) {
          exercise = _activeSession.exercises[i];
          break;
        }
      }
    }

    // Log session start event
    if (typeof SparkEventLogger !== "undefined") {
      SparkEventLogger.log("session_start", { segmentId: segment.id, segmentType: segment.type, exerciseId: exercise ? exercise.id : null });
    }

    // Dispatch to appropriate launcher based on segment type
    if (segment.type === "song") {
      return _launchSong(segment, exercise);
    } else if (segment.type === "challenge") {
      return _launchChallenge(segment, exercise);
    } else {
      return _launchPractice(segment, exercise);
    }
  }

  // Record a gameplay event (hit, miss, etc.)
  function recordEvent(event) {
    _sessionEvents.push(event);
  }

  // Complete current segment and advance
  function completeSegment(result) {
    if (typeof SparkEventLogger !== "undefined") {
      SparkEventLogger.log("segment_complete", {
        segmentIndex: _activeSegmentIndex,
        accuracy: result ? result.accuracy : 0
      });
    }

    // Store events for next session's LearningBrain
    if (typeof SparkState !== "undefined" && typeof SparkState.setLastSessionEvents === "function") {
      SparkState.setLastSessionEvents(_sessionEvents);
    } else if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      SparkState.write(["lastSessionEvents"], _sessionEvents.slice());
    }

    // Auto-advance to next segment
    var nextIndex = _activeSegmentIndex + 1;
    if (_activeSession && nextIndex < _activeSession.segments.length) {
      return { hasNext: true, nextIndex: nextIndex };
    }
    return { hasNext: false, nextIndex: -1 };
  }

  // Get active session info
  function getActiveSession() { return _activeSession; }
  function getActiveSegmentIndex() { return _activeSegmentIndex; }
  function getSessionEvents() { return _sessionEvents.slice(); }

  // --- Internal launchers (delegate to existing functions) ---

  function _launchPractice(segment, exercise) {
    if (window.SparkExecutionGateway && typeof window.SparkExecutionGateway.runSessionSegment === "function" && _activeSession) {
      return window.SparkExecutionGateway.runSessionSegment(_activeSession, segment, {
        source: "session_runtime"
      });
    }

    return false;
  }

  function _launchSong(segment, exercise) {
    if (window.SparkExecutionGateway && typeof window.SparkExecutionGateway.runSessionSegment === "function" && _activeSession) {
      return window.SparkExecutionGateway.runSessionSegment(_activeSession, segment, {
        source: "session_runtime"
      });
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
    getSessionEvents: getSessionEvents
  };

  if (typeof window !== "undefined") window.SparkSessionRuntime = SparkSessionRuntime;
  if (typeof module !== "undefined") module.exports = SparkSessionRuntime;
})();
