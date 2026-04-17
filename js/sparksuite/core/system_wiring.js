/**
 * SparkCore System Wiring
 * Extends SparkCore with play-along subsystem initialization,
 * session lifecycle, input processing, mic detection, and voice commands.
 * Must be loaded AFTER spark_core.js.
 */
(function () {
  "use strict";

  var SparkCore = window.SparkCoreRuntime;
  if (typeof SparkCore === "undefined" || !SparkCore) return;

  // ---------------------------------------------------------------
  // initPlayAlongSystems
  // ---------------------------------------------------------------

  SparkCore.prototype.initPlayAlongSystems = function () {
    // Audio pipeline
    this.audioEngine = new SparkAudioEngine();
    this.audioTransport = new SparkAudioTransport(this.audioEngine);
    this.audioScheduler = new SparkAudioScheduler(this.audioEngine);

    // Stem handling
    this.stemLoader = new SparkStemLoader();
    this.stemMixer = new SparkStemMixer();
    this.stemController = new SparkStemController(this.stemMixer);
    this.sourceSeparator = new SparkSourceSeparator();

    // Beat and chart
    this.beatDetector = new SparkBeatDetector();
    this.audioChartGenerator = new SparkAudioChartGenerator();

    // Performance analysis
    this.performanceTracker = new SparkPerformanceTracker();
    this.performanceAnalyzer = new SparkPerformanceAnalyzer();
    this.heatmapGenerator = new SparkHeatmapGenerator();
    this.chordHeatmap = new SparkChordHeatmap();
    this.chordConfidence = new SparkChordConfidence();
    this.styleAnalyzer = new SparkStyleAnalyzer();

    // Input detection
    this.micInput = new SparkMicInput();
    this.pitchDetector = new SparkPitchDetector();
    this.chordDetector = new SparkChordDetector();
    this.chordStabilizer = new SparkChordStabilizer();
    this.multiChordDetector = typeof SparkMultiFrequencyChordDetector === "function"
      ? new SparkMultiFrequencyChordDetector({
        chordDetector: this.chordDetector,
        stabilizer: this.chordStabilizer,
        minConfidence: 0.6
      })
      : null;

    // Learning / RL pipeline
    this.learnerModel = new SparkLearnerModel();
    this.rewardModel = new SparkRewardModel();
    this.policyEngine = new SparkPolicyEngine();
    this.lessonPlanner = new SparkLessonPlanner();
    this.drillGenerator = new SparkDrillGenerator();
    this.chordPredictor = new SparkChordPredictor();
    this.fingeringOptimizer = new SparkFingeringOptimizer();
    this.feedbackEngine = new SparkFeedbackEngine();
    this.tabGenerator = new SparkTabGenerator(new SparkFretboardMapper());

    // Voice
    this.ttsEngine = new SparkTTSEngine();
    this.voiceQueue = new SparkVoiceQueue(this.ttsEngine);
    this.voiceCoach = new SparkVoiceCoach(this.voiceQueue);
    this.voiceInput = new SparkVoiceInput();
    this.voiceCommandRouter = new SparkVoiceCommandRouter();

    // Calibration
    this.latencyCalibrator = new SparkLatencyCalibrator();

    // Charting
    this.multiChartBuilder = new SparkMultiChartBuilder();

    // Optional Spotify
    if (this.spotifyClient) {
      this.spotifySearch = new SparkSpotifySearch(this.spotifyClient);
    }

    // Chord stabilizer
    if (this.multiChordDetector && typeof this.chordStabilizer.setBufferSize === "function") {
      this.chordStabilizer.setBufferSize(10);
    }

    // Bind single time source (AudioEngine is master clock)
    SparkTimeSource.bind(this.audioEngine);

    SparkLog.info("SYSTEM", "All play-along subsystems initialized");
  };

  function clonePlayAlongParams(core, params) {
    if (core && typeof core.cloneValue === "function") {
      return core.cloneValue(params);
    }
    return JSON.parse(JSON.stringify(params || {}));
  }

  function getRegisteredInstrumentType(instrumentId) {
    var all;
    var i;
    var inst;
    if (!instrumentId || typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
      return null;
    }
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      inst = all[i] || {};
      if (inst.id === instrumentId || inst.appId === instrumentId) {
        return inst.instrument || null;
      }
    }
    return null;
  }

  function getPlayAlongRuntimeState(core) {
    if (!core || typeof core.getRuntimeState !== "function") return null;
    return core.getRuntimeState() || null;
  }

  function getPlayAlongInstrumentContext(core) {
    if (!core || !core.instrumentManager || typeof core.instrumentManager.getActiveContext !== "function") {
      return null;
    }
    return core.instrumentManager.getActiveContext() || null;
  }

  function resolvePlayAlongInstrumentType(core, params) {
    var runtimeState = getPlayAlongRuntimeState(core) || {};
    var instrumentContext = getPlayAlongInstrumentContext(core) || {};
    var candidate = params.instrumentType
      || params.instrument
      || params.instrumentId
      || runtimeState.activeInstrumentType
      || runtimeState.activeInstrumentId
      || instrumentContext.instrumentType
      || instrumentContext.appId
      || null;
    var resolvedType = getRegisteredInstrumentType(candidate);
    return resolvedType || candidate || "guitar";
  }

  function resolvePlayAlongInstrumentId(core, params, instrumentType) {
    var runtimeState = getPlayAlongRuntimeState(core) || {};
    var instrumentContext = getPlayAlongInstrumentContext(core) || {};
    var candidateId = params.instrumentId || null;
    if (!candidateId && params.instrument && params.instrument !== instrumentType) {
      candidateId = params.instrument;
    }
    if (!candidateId && runtimeState.activeInstrumentId && runtimeState.activeInstrumentId !== instrumentType) {
      candidateId = runtimeState.activeInstrumentId;
    }
    if (!candidateId && instrumentContext.appId && instrumentContext.appId !== instrumentType) {
      candidateId = instrumentContext.appId;
    }
    return candidateId || null;
  }

  function setPlayAlongSessionState(core, patch) {
    if (core && typeof core.setPlayAlongSession === "function") {
      return core.setPlayAlongSession(patch);
    }

    patch = patch || {};
    if (Object.prototype.hasOwnProperty.call(patch, "params")) {
      core._activeParams = patch.params;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "chart")) {
      core._activeChart = patch.chart;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "userId")) {
      core._activeUserId = patch.userId;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "startedAtMs")) {
      core._sessionStartWallTime = patch.startedAtMs;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "pausedPlaybackTimeMs")) {
      core._pausedPlaybackTimeMs = patch.pausedPlaybackTimeMs;
    }

    return patch;
  }

  function getPlayAlongSessionState(core) {
    if (core && typeof core.getPlayAlongSession === "function") {
      return core.getPlayAlongSession();
    }
    return {
      params: core && core._activeParams ? core._activeParams : null,
      chart: core && core._activeChart ? core._activeChart : null,
      userId: core && core._activeUserId ? core._activeUserId : null,
      startedAtMs: core && typeof core._sessionStartWallTime === "number" ? core._sessionStartWallTime : null,
      pausedPlaybackTimeMs: core && typeof core._pausedPlaybackTimeMs === "number" ? core._pausedPlaybackTimeMs : null
    };
  }

  function getPlayAlongChart(core) {
    return core && typeof core.getActivePlayAlongChart === "function"
      ? core.getActivePlayAlongChart()
      : (core ? core._activeChart || null : null);
  }

  function getPlayAlongParams(core) {
    return core && typeof core.getActivePlayAlongParams === "function"
      ? core.getActivePlayAlongParams()
      : (core ? core._activeParams || null : null);
  }

  function getPausedPlayAlongTime(core) {
    return core && typeof core.getPausedPlayAlongTimeMs === "function"
      ? core.getPausedPlayAlongTimeMs()
      : (core && typeof core._pausedPlaybackTimeMs === "number" ? core._pausedPlaybackTimeMs : null);
  }

  function clearPausedPlayAlongTime(core) {
    if (core && typeof core.clearPausedPlayAlongTimeMs === "function") {
      core.clearPausedPlayAlongTimeMs();
      return;
    }
    if (core) core._pausedPlaybackTimeMs = null;
  }

  function setPausedPlayAlongTime(core, timeMs) {
    if (core && typeof core.setPausedPlayAlongTimeMs === "function") {
      core.setPausedPlayAlongTimeMs(timeMs);
      return;
    }
    if (core) core._pausedPlaybackTimeMs = typeof timeMs === "number" ? timeMs : null;
  }

  function getExpectedPlayAlongEvent(chart, timeMs) {
    if (window.SparkPlayAlongTiming && typeof window.SparkPlayAlongTiming.getExpectedEvent === "function") {
      return window.SparkPlayAlongTiming.getExpectedEvent(chart, timeMs);
    }

    var timeline = chart && chart.timeline ? chart.timeline : [];
    var closest = { time: null, chord: null, event: null };
    var bestDistance = Infinity;
    for (var i = 0; i < timeline.length; i++) {
      var event = timeline[i];
      if (typeof event.time !== "number") continue;
      var distance = Math.abs(event.time - timeMs);
      if (distance < bestDistance) {
        bestDistance = distance;
        closest = {
          time: event.time,
          chord: event.chord != null ? event.chord : (event.note != null ? event.note : event.lane),
          event: event
        };
      }
    }
    return closest;
  }

  function calculateTimingOffsetMs(expectedTimeMs, actualTimeMs) {
    if (window.SparkPlayAlongTiming && typeof window.SparkPlayAlongTiming.calculateTimingOffsetMs === "function") {
      return window.SparkPlayAlongTiming.calculateTimingOffsetMs(expectedTimeMs, actualTimeMs);
    }
    if (typeof expectedTimeMs !== "number" || typeof actualTimeMs !== "number") return null;
    return actualTimeMs - expectedTimeMs;
  }

  function updatePlayAlongDebug(patch) {
    if (typeof SparkDebugState !== "undefined") {
      SparkDebugState.update(patch);
    }
  }

  function summarizeAICoachChordErrors(chordErrors) {
    var labels = [];
    var chordName;
    chordErrors = chordErrors && typeof chordErrors === "object" ? chordErrors : {};
    for (chordName in chordErrors) {
      if (!Object.prototype.hasOwnProperty.call(chordErrors, chordName)) continue;
      labels.push(chordName + ":" + chordErrors[chordName]);
    }
    return labels.length ? labels.join(", ") : null;
  }

  function normalizePlayAlongAIEvents(events) {
    var normalized = [];
    var source = Array.isArray(events) ? events : [];
    var i;
    var event;
    for (i = 0; i < source.length; i++) {
      event = source[i] || {};
      normalized.push({
        correct: !!event.hit,
        expectedChord: event.expectedChord || event.expected || event.chord || null,
        detectedChord: event.detectedChord || event.detected || null,
        offsetMs: typeof event.offsetMs === "number"
          ? event.offsetMs
          : (typeof event.error === "number" ? event.error : 0)
      });
    }
    return normalized;
  }

  // ---------------------------------------------------------------
  // getPlaybackTimeMs
  // ---------------------------------------------------------------

  SparkCore.prototype.getPlaybackTimeMs = function () {
    var pausedTimeMs = getPausedPlayAlongTime(this);
    if (typeof pausedTimeMs === "number") {
      return pausedTimeMs;
    }
    // Single time source: SparkTimeSource (bound in initPlayAlongSystems)
    if (typeof SparkTimeSource !== "undefined" && SparkTimeSource.isPlaying()) {
      return SparkTimeSource.getTimeMs();
    }
    // Fallback chain if TimeSource not yet bound
    if (this.audioEngine && this.audioEngine.isPlaying()) return this.audioEngine.getTimeMs();
    if (this.stemMixer && this.stemMixer.isPlaying()) return this.stemMixer.getTimeMs();
    if (this.playbackEngine && this.playbackEngine.isPlaying()) return this.playbackEngine.getTimeMs();
    return 0;
  };

  // ---------------------------------------------------------------
  // getInputTimeMs
  // ---------------------------------------------------------------

  SparkCore.prototype.getInputTimeMs = function () {
    var offset = 0;
    if (this.latencyCalibrator && typeof this.latencyCalibrator.getOffset === "function") {
      offset = this.latencyCalibrator.getOffset();
    }
    return this.getPlaybackTimeMs() - offset;
  };

  // ---------------------------------------------------------------
  // startPlayAlongSession
  // ---------------------------------------------------------------

  SparkCore.prototype.startPlayAlongSession = function (params) {
    var self = this;
    var originalInstrument;
    var originalInstrumentId;
    params = params || {};
    params = clonePlayAlongParams(this, params);
    originalInstrument = params.instrument;
    originalInstrumentId = params.instrumentId;
    params.instrument = resolvePlayAlongInstrumentType(this, params);
    params.instrumentType = params.instrument;
    params.instrumentId = resolvePlayAlongInstrumentId(this, {
      instrument: originalInstrument,
      instrumentId: originalInstrumentId
    }, params.instrument);
    setPlayAlongSessionState(this, {
      params: clonePlayAlongParams(this, params),
      chart: null,
      userId: params.userId || null,
      startedAtMs: null,
      pausedPlaybackTimeMs: null
    });
    clearPausedPlayAlongTime(this);

    return new Promise(function (resolve, reject) {
      try {
        // Auto-init if not done yet
        if (!self.learnerModel && typeof self.initPlayAlongSystems === "function") self.initPlayAlongSystems();
        // 1. Load learner model and get RL decision
        var model = self.learnerModel.load(params.userId);
        var decision = self.policyEngine.decide(model, {
          trackId: params.trackId,
          instrument: params.instrument
        });
        if (typeof SparkDebugState !== "undefined") SparkDebugState.update({ rlAction: decision.action });
        var difficulty = decision.difficulty || params.difficulty || "medium";
        if (typeof self.updateRuntimeState === "function") {
          self.updateRuntimeState({
            playAlongTransportMode: params.audioFile ? "local" : (params.stems ? "stems" : (params.trackUri ? "spotify" : "generated")),
            playAlongTrackId: params.trackId || null
          });
        }

        // 2. Reset trackers
        self.performanceTracker.reset();
        if (self.chordPredictor && typeof self.chordPredictor.reset === "function") {
          self.chordPredictor.reset();
        }
        if (self.fingeringOptimizer && typeof self.fingeringOptimizer.reset === "function") {
          self.fingeringOptimizer.reset();
        }

        // 3. Generate chart
        var chartPromise;
        if (params.audioFile) {
          chartPromise = self._generateChartFromAudio(
            params.audioFile, params.trackId, difficulty, params.instrument
          );
        } else if (params.trackId && self.chartService) {
          chartPromise = self.chartService.generate({
            trackId: params.trackId,
            difficulty: difficulty,
            instrument: params.instrument
          });
        } else {
          chartPromise = Promise.resolve(null);
        }

        chartPromise.then(function (chart) {
          // Cache generated chart to localStorage if we have a track ID
          if (self.chartService && params.trackId && chart) {
            var diff = difficulty || params.difficulty || "easy";
            var inst = params.instrument || "guitar";
            if (typeof self.chartService.cacheChart === "function") {
              self.chartService.cacheChart(params.trackId, chart, diff, inst);
            }
          }

          // 4. Store active session state
          setPlayAlongSessionState(self, {
            chart: chart,
            userId: params.userId || null,
            startedAtMs: performance.now()
          });
          if (chart && params.title && chart.songChart && chart.songChart.song) chart.songChart.song.title = params.title;
          if (chart && params.artist && chart.songChart && chart.songChart.song) chart.songChart.song.artist = params.artist;
          if (chart && params.trackUri && !chart.trackUri) chart.trackUri = params.trackUri;
          if (chart && chart.audio) {
            if (params.audioOffsetMs != null) {
              chart.audio.offset_ms = params.audioOffsetMs;
              chart.audio.offsetMs = params.audioOffsetMs;
            }
          }

          // 5. Start audio
          self._startAudioForSession(params, chart);

          resolve({
            chart: chart,
            decision: decision,
            difficulty: difficulty,
            model: model
          });
        }).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  };

  // ---------------------------------------------------------------
  // processPlayAlongFrame
  // ---------------------------------------------------------------

  SparkCore.prototype.processPlayAlongFrame = function () {
    var timeMs = this.getPlaybackTimeMs();
    var inputTimeMs = this.getInputTimeMs();
    var chart = getPlayAlongChart(this);
    var visibleNotes = [];
    var prediction = null;
    var expectedEvent = null;

    if (chart) {
      var timeline = chart.timeline || (typeof chart.getTimeline === "function" ? chart.getTimeline() : []);
      var windowStart = timeMs - 500;
      var windowEnd = timeMs + 3000;
      visibleNotes = timeline.filter(function (note) {
        return note.time >= windowStart && note.time <= windowEnd;
      });
    }

    if (this.chordPredictor && typeof this.chordPredictor.predictWindow === "function") {
      prediction = this.chordPredictor.predictWindow(timeMs, chart ? (chart.timeline || (typeof chart.getTimeline === "function" ? chart.getTimeline() : [])) : [], 3000);
    }

    if (this.voiceCoach && chart && chart.sections && chart.sections.length) {
      if (isNearSectionBoundary(chart.sections, timeMs)) {
        if (typeof this.voiceCoach.markSectionBoundary === "function") this.voiceCoach.markSectionBoundary();
      } else if (typeof this.voiceCoach.clearSectionBoundary === "function") {
        this.voiceCoach.clearSectionBoundary();
      }
    }

    expectedEvent = chart ? getExpectedPlayAlongEvent(chart, inputTimeMs) : null;

    updatePlayAlongDebug({
      time: timeMs,
      expected: expectedEvent ? expectedEvent.chord : null,
      bpm: (chart && chart.getBpm) ? chart.getBpm() : (chart && chart.bpm ? chart.bpm : 0),
      audioMode: this.audioEngine && this.audioEngine.isPlaying() ? "local" : (this.stemMixer && this.stemMixer.isPlaying() ? "stems" : "spotify"),
      latencyMs: this.latencyCalibrator ? this.latencyCalibrator.getOffset() : 0
    });

    return {
      timeMs: timeMs,
      inputTimeMs: inputTimeMs,
      visibleNotes: visibleNotes,
      prediction: prediction,
      renderTimeMs: timeMs + 100,
      expectedEvent: expectedEvent
    };
  };

  // ---------------------------------------------------------------
  // processPlayAlongInput
  // ---------------------------------------------------------------

  SparkCore.prototype.processPlayAlongInput = function (inputEvent) {
    var chart = getPlayAlongChart(this);
    var result = null;
    var chordResult = null;
    var delta = null;
    var expectedEvent = null;
    var expectedLabel = null;
    var timingLabel = null;
    var score = 0;
    var detectedLabel = inputEvent.note || inputEvent.chord || null;
    var realtimeFeedback = null;

    if (!chart || !chart.timeline) {
      updatePlayAlongDebug({
        detected: detectedLabel,
        chord: inputEvent.chord || null,
        detectedChord: inputEvent.chord || null,
        detectedNotes: inputEvent.detectedNotes || (inputEvent.note ? [inputEvent.note] : []),
        confidence: inputEvent.confidence || 0,
        feedback: null,
        delta: 0,
        accuracy: this.performanceTracker ? this.performanceTracker.getAccuracy() : 0,
        timing: null,
        score: 0
      });

      return { result: null, chordResult: null, delta: null, expectedEvent: null, feedback: null };
    }

    expectedEvent = getExpectedPlayAlongEvent(chart, inputEvent.time);
    expectedLabel = expectedEvent ? expectedEvent.chord : null;

    // Score via performance analyzer
    if (expectedEvent && this.performanceAnalyzer) {
      delta = calculateTimingOffsetMs(expectedEvent.time, inputEvent.time);
      result = this.performanceAnalyzer.analyze(expectedLabel, detectedLabel, delta);
      timingLabel = result ? result.rating : null;
      score = result && typeof result.score === "number" ? result.score : 0;
    }

    if (this.aiEngine && typeof this.aiEngine.generateRealtimeFeedback === "function") {
      realtimeFeedback = this.aiEngine.generateRealtimeFeedback({
        expected: expectedLabel,
        detected: detectedLabel,
        offsetMs: delta
      });
    }

    // Chord confidence if applicable
    if (expectedLabel && this.chordConfidence) {
      chordResult = this.chordConfidence.score(
        expectedLabel,
        inputEvent.detectedNotes || (inputEvent.note ? [inputEvent.note] : []),
        {
          timingErrorMs: delta,
          stability: inputEvent.confidence
        }
      );
    }

    // Record to tracker
    if (this.performanceTracker && result) {
      this.performanceTracker.record(result);
    }

    // Voice coach evaluation
    if (this.voiceCoach && result) {
      this.voiceCoach.evaluate(result, inputEvent.time || this.getInputTimeMs());
    }

    updatePlayAlongDebug({
      expected: expectedLabel,
      detected: detectedLabel,
      chord: inputEvent.chord || expectedLabel || null,
      detectedChord: inputEvent.chord || null,
      detectedNotes: inputEvent.detectedNotes || (inputEvent.note ? [inputEvent.note] : []),
      confidence: inputEvent.confidence || 0,
      feedback: realtimeFeedback,
      delta: delta || 0,
      timing: chordResult && chordResult.timing ? chordResult.timing : timingLabel,
      score: chordResult && typeof chordResult.confidence === "number" ? chordResult.confidence : score,
      accuracy: this.performanceTracker ? this.performanceTracker.getAccuracy() : 0
    });

    return {
      result: result,
      chordResult: chordResult,
      delta: delta,
      expectedEvent: expectedEvent,
      feedback: realtimeFeedback
    };
  };

  // ---------------------------------------------------------------
  // completePlayAlongSession
  // ---------------------------------------------------------------

  SparkCore.prototype.completePlayAlongSession = function () {
    var session = getPlayAlongSessionState(this);
    var userId = session && session.userId ? session.userId : null;
    var model = null;

    // 1. Stop all audio
    if (this.audioEngine && typeof this.audioEngine.stop === "function") {
      this.audioEngine.stop();
    }
    if (this.stemMixer && typeof this.stemMixer.stop === "function") {
      this.stemMixer.stop();
    }
    if (this.playbackEngine && typeof this.playbackEngine.stop === "function") {
      this.playbackEngine.stop();
    }

    // 2. Performance summary
    var performance = this.performanceTracker.getSummary();
    var events = this.performanceTracker.getEvents ? this.performanceTracker.getEvents() : [];
    if (!Array.isArray(events) || !events.length) {
      events = Array.isArray(performance) ? performance.slice() : [];
    }
    var performanceSummary = summarizePerformanceEvents(
      Array.isArray(performance) ? performance : events,
      this.performanceTracker && typeof this.performanceTracker.getAccuracy === "function"
        ? this.performanceTracker.getAccuracy()
        : null
    );
    var aiInsights = this.aiEngine && typeof this.aiEngine.analyzeSession === "function"
      ? this.aiEngine.analyzeSession(normalizePlayAlongAIEvents(events))
      : { chordErrors: {}, lateHits: 0, earlyHits: 0 };

    // 3. Heatmap and clusters
    var heatmap = this.heatmapGenerator.generate(events);
    var clusters = this.heatmapGenerator.findClusters ? this.heatmapGenerator.findClusters(heatmap) : [];

    // 4. Style analysis
    var style = this.styleAnalyzer.analyze(performanceSummary, {});

    // 5. Compute reward
    var reward = this.rewardModel.compute(performanceSummary);

    // 6. Update learner model
    if (userId && this.learnerModel && typeof this.learnerModel.load === "function") {
      model = this.learnerModel.load(userId);
    } else if (this.learnerModel && typeof this.learnerModel.toJSON === "function") {
      model = this.learnerModel.toJSON();
    }

    var updatedModel = this.policyEngine && typeof this.policyEngine.update === "function"
      ? this.policyEngine.update(model, performanceSummary)
      : model;
    if (userId && this.learnerModel && typeof this.learnerModel.save === "function") {
      this.learnerModel.save(userId, updatedModel);
    }

    // 7. Generate feedback
    var feedback = this.feedbackEngine.generate(performanceSummary, style);

    // 8. Drills for weak areas
    var drills = this.drillGenerator.generate(clusters, getPlayAlongChart(this));

    // 9. Voice coach final message
    if (this.voiceCoach && typeof this.voiceCoach.sessionComplete === "function") {
      this.voiceCoach.sessionComplete(performanceSummary);
    }

    // 10. Compute accuracy
    var accuracy = this._computeAvgTiming(events);

    model = this.learnerModel && typeof this.learnerModel.toJSON === "function"
      ? this.learnerModel.toJSON()
      : updatedModel;

    updatePlayAlongDebug({
      aiChordErrors: summarizeAICoachChordErrors(aiInsights.chordErrors),
      aiLateHits: aiInsights.lateHits,
      aiEarlyHits: aiInsights.earlyHits
    });

    return {
      accuracy: performanceSummary.accuracy,
      timing: performanceSummary.timing,
      consistency: performanceSummary.consistency,
      performance: performanceSummary,
      reward: reward,
      heatmap: heatmap,
      clusters: clusters,
      style: style,
      feedback: feedback,
      aiInsights: aiInsights,
      coaching: aiInsights,
      drills: drills,
      model: model,
      events: events
    };
  };

  // ---------------------------------------------------------------
  // startMicDetection
  // ---------------------------------------------------------------

  SparkCore.prototype.startMicDetection = function () {
    var self = this;
    this._micActive = true;
    if (this.multiChordDetector && typeof this.multiChordDetector.reset === "function") {
      this.multiChordDetector.reset();
    } else if (this.chordStabilizer && typeof this.chordStabilizer.reset === "function") {
      this.chordStabilizer.reset();
    }

    return this.micInput.start().then(function () {
      var analyser = self.micInput.getAnalyser();
      if (analyser && typeof SparkHarmonicAnalyzer === "function") {
        self.harmonicAnalyzer = new SparkHarmonicAnalyzer(analyser);
      }

      function loop() {
        if (!self._micActive) return;

        var samples = self.micInput.getTimeDomainData ? self.micInput.getTimeDomainData() : self.micInput.getSamples();
        var sampleRate = self.micInput.getSampleRate ? self.micInput.getSampleRate() : null;
        var detection = self.multiChordDetector && typeof self.multiChordDetector.detect === "function"
          ? self.multiChordDetector.detect(analyser, sampleRate, self.pitchDetector, samples)
          : null;

        if (detection && detection.notes && detection.notes.length) {
          self.processPlayAlongInput({
            time: self.getInputTimeMs(),
            note: detection.pitchNote || detection.chord || detection.notes[0] || null,
            chord: detection.chord,
            confidence: detection.confidence || 0,
            detectedNotes: detection.notes,
            rawChord: detection.rawChord,
            frequencies: detection.frequencies
          });
        } else {
          updatePlayAlongDebug({
            detected: null,
            detectedChord: null,
            detectedNotes: [],
            confidence: 0
          });
        }

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);
    });
  };

  // ---------------------------------------------------------------
  // stopMicDetection
  // ---------------------------------------------------------------

  SparkCore.prototype.stopMicDetection = function () {
    this._micActive = false;
    if (this.micInput && typeof this.micInput.stop === "function") {
      this.micInput.stop();
    }
  };

  // ---------------------------------------------------------------
  // startVoiceCommands
  // ---------------------------------------------------------------

  SparkCore.prototype.startVoiceCommands = function () {
    var self = this;

    this.voiceInput.start(function (transcript) {
      var command = self.voiceCommandRouter.route(transcript);
      if (!command) return;

      switch (command.action) {
        case "slow":
          if (self.audioEngine) self.audioEngine.setPlaybackRate(0.75);
          if (self.stemMixer) self.stemMixer.setPlaybackRate(0.75);
          break;
        case "fast":
          if (self.audioEngine) self.audioEngine.setPlaybackRate(1.0);
          if (self.stemMixer) self.stemMixer.setPlaybackRate(1.0);
          break;
        case "pause":
          if (self.audioEngine) self.audioEngine.pause();
          if (self.stemMixer) self.stemMixer.pause();
          break;
        case "play":
          if (self.audioEngine) self.audioEngine.play();
          if (self.stemMixer) self.stemMixer.play();
          break;
        case "restart":
          if (self.audioEngine) self.audioEngine.seek(0);
          if (self.stemMixer) self.stemMixer.seek(0);
          break;
        case "loop":
          var activeChart = self.getActivePlayAlongChart();
          if (activeChart && activeChart.sections && activeChart.sections.length > 0) {
            var first = activeChart.sections[0];
            if (self.audioEngine && typeof self.audioEngine.setLoop === "function") {
              self.audioEngine.setLoop(first.start, first.end);
            }
          }
          break;
        default:
          break;
      }
    });
  };

  // ---------------------------------------------------------------
  // Play-along transport helpers
  // ---------------------------------------------------------------

  SparkCore.prototype.setPlayAlongPlaybackRate = function (speed) {
    if (typeof speed !== "number" || !isFinite(speed) || speed <= 0) return false;
    if (this.audioEngine && typeof this.audioEngine.setPlaybackRate === "function") {
      this.audioEngine.setPlaybackRate(speed);
    }
    if (this.stemMixer && typeof this.stemMixer.setPlaybackRate === "function") {
      this.stemMixer.setPlaybackRate(speed);
    }
    return true;
  };

  SparkCore.prototype.pausePlayAlongTransport = function () {
    var pausedMs = this.getPlaybackTimeMs();
    setPausedPlayAlongTime(this, pausedMs);

    if (this.audioEngine && typeof this.audioEngine.pause === "function") this.audioEngine.pause();
    else if (this.audioEngine && typeof this.audioEngine.stop === "function") this.audioEngine.stop();

    if (this.stemMixer && typeof this.stemMixer.pause === "function") this.stemMixer.pause();
    else if (this.stemMixer && typeof this.stemMixer.stop === "function") this.stemMixer.stop();

    if (this.playbackEngine && typeof this.playbackEngine.pause === "function") this.playbackEngine.pause();
    else if (this.playbackEngine && typeof this.playbackEngine.stop === "function") this.playbackEngine.stop();

    return pausedMs;
  };

  SparkCore.prototype.resumePlayAlongTransport = function () {
    var offsetMs = getPausedPlayAlongTime(this) || 0;
    var params = getPlayAlongParams(this) || {};

    if (this.audioEngine && this.audioEngine.buffer && typeof this.audioEngine.play === "function") {
      this.audioEngine.play(offsetMs / 1000);
    } else if (this.stemMixer && typeof this.stemMixer.seek === "function") {
      this.stemMixer.seek(offsetMs / 1000);
      if (!this.stemMixer.isPlaying || !this.stemMixer.isPlaying()) {
        this.stemMixer.play(offsetMs / 1000);
      }
    } else if (params.trackUri && this.playbackEngine && typeof this.playbackEngine.resume === "function") {
      this.playbackEngine.resume(offsetMs, {
        audioOffsetMs: params.audioOffsetMs || 0,
        deviceId: params.deviceId
      }).catch(function () {});
    } else if (params.trackUri && this.playbackEngine && typeof this.playbackEngine.start === "function") {
      var playbackEngine = this.playbackEngine;
      playbackEngine.start(params.trackUri, {
        audioOffsetMs: params.audioOffsetMs || 0,
        deviceId: params.deviceId
      }).then(function () {
        if (typeof playbackEngine.seekTo === "function") {
          return playbackEngine.seekTo(offsetMs);
        }
      }).catch(function () {});
    }

    clearPausedPlayAlongTime(this);
    return offsetMs;
  };

  SparkCore.prototype.seekPlayAlongToMs = function (targetMs) {
    setPausedPlayAlongTime(this, targetMs);

    if (this.audioEngine && this.audioEngine.buffer && typeof this.audioEngine.play === "function") {
      this.audioEngine.play(targetMs / 1000);
      clearPausedPlayAlongTime(this);
      return true;
    }

    if (this.stemMixer && typeof this.stemMixer.seek === "function") {
      this.stemMixer.seek(targetMs / 1000);
      clearPausedPlayAlongTime(this);
      return true;
    }

    if (this.playbackEngine && typeof this.playbackEngine.seekTo === "function") {
      var self = this;
      this.playbackEngine.seekTo(targetMs).then(function () {
        clearPausedPlayAlongTime(self);
      }).catch(function () {});
      return true;
    }

    return false;
  };

  SparkCore.prototype.startPlayAlongRenderLoop = function (options) {
    var self = this;
    options = options || {};

    this.stopPlayAlongRenderLoop();

    function loop() {
      var result;
      if (typeof options.beforeFrame === "function") {
        options.beforeFrame();
      }
      if (typeof options.enforceLoopWindow === "function" && options.enforceLoopWindow()) {
        self._playAlongLoopFrameId = null;
        return;
      }

      result = self.processPlayAlongFrame();
      if (result && typeof options.onFrame === "function") {
        options.onFrame(result);
      }

      self._playAlongLoopFrameId = requestAnimationFrame(loop);
    }

    this._playAlongLoopFrameId = requestAnimationFrame(loop);
    return this._playAlongLoopFrameId;
  };

  SparkCore.prototype.stopPlayAlongRenderLoop = function () {
    if (this._playAlongLoopFrameId) {
      cancelAnimationFrame(this._playAlongLoopFrameId);
      this._playAlongLoopFrameId = null;
      return true;
    }
    return false;
  };

  // ---------------------------------------------------------------
  // _generateChartFromAudio (helper)
  // ---------------------------------------------------------------

  SparkCore.prototype._generateChartFromAudio = function (audioFile, trackId, difficulty, instrument) {
    var self = this;
    return SparkAudioLoader.fromFile(audioFile).then(function (audioData) {
      return self.audioEngine.load(audioData);
    }).then(function () {
      return self.audioChartGenerator.generate(self.audioEngine.buffer, { trackId: trackId || audioFile.name, difficulty: difficulty, instrument: instrument || "guitar", title: audioFile.name || "Local Track" });
    });
  };

  // ---------------------------------------------------------------
  // _startAudioForSession (helper)
  // ---------------------------------------------------------------

  SparkCore.prototype._startAudioForSession = function (params, chart) {
    console.log("[PlayAlong] _startAudioForSession:", params.audioFile ? "local" : (params.stems ? "stems" : (params.trackUri ? "spotify:" + params.trackUri : "none")));
    clearPausedPlayAlongTime(this);
    if (params.audioFile) {
      SparkTimeSource.bind(this.audioEngine);
      this.audioEngine.play();
    } else if (params.stems) {
      this.stemMixer.loadStems(params.stems);
      this.stemController.attach(this.stemMixer);
      SparkTimeSource.bind(this.stemMixer);
      this.stemMixer.play();
    } else if (params.trackUri && this.playbackEngine && typeof this.playbackEngine.start === "function") {
      var playbackResult;
      console.log("[PlayAlong] Starting Spotify playback:", params.trackUri);
      playbackResult = this.playbackEngine.start(params.trackUri, {
        audioOffsetMs: params.audioOffsetMs || 0,
        deviceId: params.deviceId
      });
      if (playbackResult && typeof playbackResult.catch === "function") {
        playbackResult.catch(function(e) { console.warn("[PlayAlong] Spotify playback failed (open Spotify app):", e.message); });
      }
    }
  };

  // ---------------------------------------------------------------
  // _computeAvgTiming (helper)
  // ---------------------------------------------------------------

  SparkCore.prototype._computeAvgTiming = function (events) {
    if (!events || events.length === 0) return 0;
    var sum = 0;
    for (var i = 0; i < events.length; i++) {
      sum += (events[i].error || 0);
    }
    return sum / events.length;
  };

  function isNearSectionBoundary(sections, timeMs) {
    for (var i = 0; i < sections.length; i++) {
      var start = sections[i] && sections[i].start != null ? sections[i].start : null;
      if (start == null) continue;
      if (Math.abs(start - timeMs) <= 150) return true;
    }
    return false;
  }

  function summarizePerformanceEvents(events, accuracyOverride) {
    events = Array.isArray(events) ? events : [];
    var total = events.length;
    var hits = 0;
    var sumAbsError = 0;
    var varianceSeed = [];
    var weakAreas = [];
    for (var i = 0; i < events.length; i++) {
      var event = events[i] || {};
      if (event.hit) hits++;
      var err = Math.abs(event.error || 0);
      sumAbsError += err;
      varianceSeed.push(err);
      if (!event.hit) {
        if (event.lane != null && weakAreas.indexOf("lane_" + event.lane) < 0) weakAreas.push("lane_" + event.lane);
        if (event.judgement && weakAreas.indexOf(event.judgement) < 0) weakAreas.push(event.judgement);
      }
    }
    var accuracy = typeof accuracyOverride === "number" ? accuracyOverride : (total ? hits / total : 0);
    var avgAbsError = total ? (sumAbsError / total) : 0;
    var timing = Math.max(0, Math.min(1, 1 - (avgAbsError / 200)));
    var consistency = 1;
    if (varianceSeed.length > 1) {
      var mean = avgAbsError;
      var variance = 0;
      for (var j = 0; j < varianceSeed.length; j++) {
        variance += Math.pow(varianceSeed[j] - mean, 2);
      }
      variance = variance / varianceSeed.length;
      consistency = Math.max(0, Math.min(1, 1 - (Math.sqrt(variance) / 200)));
    }
    return {
      totalEvents: total,
      hits: hits,
      misses: Math.max(0, total - hits),
      accuracy: accuracy,
      timing: timing,
      consistency: consistency,
      avgTiming: avgAbsError,
      weakAreas: weakAreas
    };
  }

})();
