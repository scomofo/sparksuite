/**
 * SparkCore System Wiring
 * Extends SparkCore with play-along subsystem initialization,
 * session lifecycle, input processing, mic detection, and voice commands.
 * Must be loaded AFTER spark_core.js.
 */
(function () {
  "use strict";

  if (typeof SparkCore === "undefined") return;

  // ---------------------------------------------------------------
  // initPlayAlongSystems
  // ---------------------------------------------------------------

  SparkCore.prototype.initPlayAlongSystems = function () {
    // Audio pipeline
    this.audioEngine = new SparkAudioEngine();
    this.audioTransport = new SparkAudioTransport();
    this.audioScheduler = new SparkAudioScheduler();

    // Stem handling
    this.stemLoader = new SparkStemLoader();
    this.stemMixer = new SparkStemMixer();
    this.stemController = new SparkStemController();
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
          chartPromise = self.chartService.generate(params.trackId, difficulty, params.instrument);
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
    var performance = this.performanceTracker.getSummary();
    var events = this.performanceTracker.getEvents ? this.performanceTracker.getEvents() : [];

    // 3. Heatmap and clusters
    var heatmap = this.heatmapGenerator.generate(events);
    var clusters = this.heatmapGenerator.findClusters ? this.heatmapGenerator.findClusters(heatmap) : [];

    // 4. Style analysis
    var style = this.styleAnalyzer.analyze(events);

    // 5. Compute reward
    var reward = this.rewardModel.compute(performance);

    // 6. Update learner model
    this.policyEngine.update(this.learnerModel, reward, performance);
    this.learnerModel.save(this._activeUserId);

    // 7. Generate feedback
    var feedback = this.feedbackEngine.generate(performance, style);

    // 8. Drills for weak areas
    var drills = this.drillGenerator.generate(performance.weakAreas || []);

    // 9. Voice coach final message
    if (this.voiceCoach && typeof this.voiceCoach.sessionComplete === "function") {
      this.voiceCoach.sessionComplete(performance);
    }

    // 10. Compute accuracy
    var accuracy = this._computeAvgTiming(events);

    var model = this.learnerModel.toJSON ? this.learnerModel.toJSON() : null;

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
    var self = this;
    this._micActive = true;

    this.micInput.init().then(function () {
      function loop() {
        if (!self._micActive) return;

        var samples = self.micInput.getSamples();
        if (samples && samples.length > 0) {
          var detection = self.pitchDetector.detect(samples);
          if (detection && detection.frequency > 0) {
            var note = self.pitchDetector.frequencyToNote
              ? self.pitchDetector.frequencyToNote(detection.frequency)
              : detection.note;

            self.processPlayAlongInput({
              time: self.getInputTimeMs(),
              note: note,
              confidence: detection.confidence || 0,
              detectedNotes: detection.notes || [note]
            });
          }
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
    return SparkAudioLoader.fromFile(audioFile).then(function (audioData) {
      return self.audioEngine.load(audioData);
    }).then(function () {
      return self.audioChartGenerator.generate(trackId, difficulty, instrument);
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
      this.stemController.attach(this.stemMixer);
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
