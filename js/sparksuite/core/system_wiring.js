/**
 * SparkCore System Wiring
 * Extends SparkCore with play-along subsystem initialization,
 * session lifecycle, input processing, mic detection, and voice commands.
 * Must be loaded AFTER spark_core.js.
 */
(function () {
  "use strict";

  if (typeof SparkCore === "undefined") return;

  function normalizeInstrumentType(instrument) {
    var candidate = instrument || "guitar";
    if (!window.SparkInstruments || typeof SparkInstruments.getAll !== "function") return candidate;
    var instruments = SparkInstruments.getAll() || [];
    for (var i = 0; i < instruments.length; i++) {
      var entry = instruments[i] || {};
      if (entry.id === candidate || entry.appId === candidate) {
        return entry.instrument || candidate;
      }
    }
    return candidate;
  }

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
    this.chordStabilizer = new SparkChordStabilizer();

    // Bind single time source (AudioEngine is master clock)
    SparkTimeSource.bind(this.audioEngine);

    SparkLog.info("SYSTEM", "All play-along subsystems initialized");
  };

  // ---------------------------------------------------------------
  // getPlaybackTimeMs
  // ---------------------------------------------------------------

  SparkCore.prototype.getPlaybackTimeMs = function () {
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
    params = params || {};

    return new Promise(function (resolve, reject) {
      try {
        // 1. Load learner model and get RL decision
        var model = self.learnerModel.load(params.userId);
        var decision = self.policyEngine.decide(model, {
          trackId: params.trackId,
          instrument: params.instrument
        });
        if (typeof SparkDebugState !== "undefined") SparkDebugState.update({ rlAction: decision.action });
        var difficulty = decision.difficulty || params.difficulty || "medium";

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
            instrument: normalizeInstrumentType(params.instrument)
          });
        } else {
          chartPromise = Promise.resolve(null);
        }

        chartPromise.then(function (chart) {
          // 4. Store active session state
          self._activeChart = chart;
          self._activeUserId = params.userId;

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
    var chart = this._activeChart;
    var visibleNotes = [];
    var prediction = null;

    if (chart && chart.timeline) {
      var windowStart = timeMs - 500;
      var windowEnd = timeMs + 3000;
      visibleNotes = chart.timeline.filter(function (note) {
        return note.time >= windowStart && note.time <= windowEnd;
      });
    }

    if (this.chordPredictor && typeof this.chordPredictor.predictWindow === "function") {
      prediction = this.chordPredictor.predictWindow(timeMs, timeMs + 3000);
    }

    if (this.voiceCoach && chart && chart.sections) {
      this.voiceCoach.markSectionBoundaries(chart.sections, timeMs);
    }

    // Update debug state
    if (typeof SparkDebugState !== "undefined") {
      SparkDebugState.update({
        time: timeMs,
        expected: visibleNotes.length ? (visibleNotes[0].lane != null ? visibleNotes[0].lane : visibleNotes[0].chord) : null,
        bpm: (this._activeChart && this._activeChart.getBpm) ? this._activeChart.getBpm() : 0,
        audioMode: this.audioEngine && this.audioEngine.isPlaying() ? "local" : (this.stemMixer && this.stemMixer.isPlaying() ? "stems" : "spotify"),
        latencyMs: this.latencyCalibrator ? this.latencyCalibrator.getOffset() : 0
      });
    }

    return {
      timeMs: timeMs,
      inputTimeMs: inputTimeMs,
      visibleNotes: visibleNotes,
      prediction: prediction,
      renderTimeMs: timeMs + 100
    };
  };

  // ---------------------------------------------------------------
  // processPlayAlongInput
  // ---------------------------------------------------------------

  SparkCore.prototype.processPlayAlongInput = function (inputEvent) {
    var chart = this._activeChart;
    var result = null;
    var chordResult = null;
    var delta = null;

    if (!chart || !chart.timeline) {
      // Update debug state with input
      if (typeof SparkDebugState !== "undefined") {
        SparkDebugState.update({
          detected: inputEvent.note || null,
          chord: inputEvent.chord || null,
          confidence: inputEvent.confidence || 0,
          delta: null,
          accuracy: this.performanceTracker ? this.performanceTracker.getAccuracy() : 0
        });
      }

      return { result: null, chordResult: null, delta: null };
    }

    // Find nearest expected note
    var nearest = null;
    var nearestDist = Infinity;
    for (var i = 0; i < chart.timeline.length; i++) {
      var dist = Math.abs(chart.timeline[i].time - inputEvent.time);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = chart.timeline[i];
      }
    }

    // Score via performance analyzer
    if (nearest && this.performanceAnalyzer) {
      result = this.performanceAnalyzer.analyze(inputEvent, nearest);
      delta = inputEvent.time - nearest.time;
    }

    // Chord confidence if applicable
    if (inputEvent.chord && this.chordConfidence) {
      chordResult = this.chordConfidence.evaluate(inputEvent.chord, inputEvent.confidence);
    }

    // Record to tracker
    if (this.performanceTracker && result) {
      this.performanceTracker.record(result);
    }

    // Voice coach evaluation
    if (this.voiceCoach && result) {
      this.voiceCoach.evaluate(result);
    }

    return {
      result: result,
      chordResult: chordResult,
      delta: delta
    };
  };

  // ---------------------------------------------------------------
  // completePlayAlongSession
  // ---------------------------------------------------------------

  SparkCore.prototype.completePlayAlongSession = function () {
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
    var performance = this.performanceTracker.computeSummary();
    var events = this.performanceTracker.getEvents();

    // 3. Heatmap and clusters
    var heatmap = this.heatmapGenerator.generate(events);
    var clusters = this.heatmapGenerator.findClusters ? this.heatmapGenerator.findClusters(heatmap) : [];

    // 4. Style analysis
    var style = this.styleAnalyzer.analyze(events);

    // 5. Compute reward
    var reward = this.rewardModel.compute(performance);

    // 6. Update learner model
    var userId = this._activeUserId || null;
    var model = this.learnerModel && typeof this.learnerModel.load === "function"
      ? this.learnerModel.load(userId)
      : null;
    var updatedModel = this.policyEngine && typeof this.policyEngine.update === "function"
      ? this.policyEngine.update(model, performance)
      : model;
    if (userId && this.learnerModel && typeof this.learnerModel.save === "function") {
      this.learnerModel.save(userId, updatedModel);
    }

    // 7. Generate feedback
    var feedback = this.feedbackEngine.generate(performance, style);

    // 8. Drills for weak areas
    var drills = this.drillGenerator.generate(clusters || []);

    // 9. Voice coach final message
    if (this.voiceCoach && typeof this.voiceCoach.sessionComplete === "function") {
      this.voiceCoach.sessionComplete(performance);
    }

    // 10. Compute accuracy
    var accuracy = this._computeAvgTiming(events);

    model = this.learnerModel && this.learnerModel.toJSON ? this.learnerModel.toJSON() : updatedModel;

    return {
      accuracy: accuracy,
      performance: performance,
      reward: reward,
      heatmap: heatmap,
      clusters: clusters,
      style: style,
      feedback: feedback,
      drills: drills,
      model: model,
      events: events
    };
  };

  // ---------------------------------------------------------------
  // startMicDetection
  // ---------------------------------------------------------------

  SparkCore.prototype.startMicDetection = function () {
    if (this._micActive) return; // guard against spawning duplicate rAF loops on re-entry
    var self = this;
    this._micActive = true;

    this.micInput.start().then(function () {
      function loop() {
        if (!self._micActive) return;

        var samples = self.micInput.getSamples();
        if (samples && samples.length > 0) {
          // detect() returns a frequency Number (or null), not an object, and
          // takes the sample rate as its 2nd arg. Note mapping lives on
          // SparkInputNoteMapper, not the detector.
          var freq = self.pitchDetector.detect(samples, self.micInput.getSampleRate());
          if (freq && freq > 0) {
            var note = (typeof window !== "undefined" && window.SparkInputNoteMapper)
              ? window.SparkInputNoteMapper.frequencyToNoteName(freq)
              : null;
            if (note) {
              self.processPlayAlongInput({
                time: self.getInputTimeMs(),
                note: note,
                confidence: 1,
                detectedNotes: [note]
              });
            }
          }
        }

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);
    }).catch(function () { /* mic permission denied or unavailable */ });
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

      // Each handler is typeof-guarded and routed to a method that actually
      // exists on the target (audioEngine: setSpeed/play/stop; stemMixer:
      // play/stop/seek). The previous code called setPlaybackRate/pause/seek
      // on audioEngine — none of which exist — throwing a TypeError per command.
      switch (command.action) {
        case "slow":
          if (self.audioEngine && typeof self.audioEngine.setSpeed === "function") self.audioEngine.setSpeed(0.75);
          if (self.stemMixer && typeof self.stemMixer.setSpeed === "function") self.stemMixer.setSpeed(0.75);
          break;
        case "fast":
          if (self.audioEngine && typeof self.audioEngine.setSpeed === "function") self.audioEngine.setSpeed(1.0);
          if (self.stemMixer && typeof self.stemMixer.setSpeed === "function") self.stemMixer.setSpeed(1.0);
          break;
        case "pause":
          if (self.audioEngine && typeof self.audioEngine.stop === "function") self.audioEngine.stop();
          if (self.stemMixer && typeof self.stemMixer.stop === "function") self.stemMixer.stop();
          break;
        case "play":
          if (self.audioEngine && typeof self.audioEngine.play === "function") self.audioEngine.play();
          if (self.stemMixer && typeof self.stemMixer.play === "function") self.stemMixer.play();
          break;
        case "restart":
          if (self.audioEngine && typeof self.audioEngine.play === "function") self.audioEngine.play(0);
          if (self.stemMixer && typeof self.stemMixer.play === "function") self.stemMixer.play(0);
          break;
        case "loop":
          if (self._activeChart && self._activeChart.sections && self._activeChart.sections.length > 0) {
            var first = self._activeChart.sections[0];
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
  // _generateChartFromAudio (helper)
  // ---------------------------------------------------------------

  SparkCore.prototype._generateChartFromAudio = function (audioFile, trackId, difficulty, instrument) {
    var self = this;
    var loadedAudio = null;
    return SparkAudioLoader.fromFile(audioFile).then(function (audioData) {
      loadedAudio = audioData;
      return self.audioEngine.load(audioData);
    }).then(function () {
      return self.audioChartGenerator.generate(loadedAudio, {
        trackId: trackId,
        difficulty: difficulty,
        instrument: normalizeInstrumentType(instrument)
      });
    });
  };

  // ---------------------------------------------------------------
  // _startAudioForSession (helper)
  // ---------------------------------------------------------------

  SparkCore.prototype._startAudioForSession = function (params, chart) {
    if (params.audioFile) {
      SparkTimeSource.bind(this.audioEngine);
      this.audioEngine.play();
    } else if (params.stems) {
      this.stemMixer.loadStems(params.stems);
      // (stemController already holds the mixer from its constructor — the
      // former stemController.attach(mixer) call referenced a method that does
      // not exist and threw a TypeError, aborting the stems playback path.)
      SparkTimeSource.bind(this.stemMixer);
      this.stemMixer.play();
    } else if (params.trackUri && this.playbackEngine) {
      this.playbackEngine.play(params.trackUri);
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

})();
