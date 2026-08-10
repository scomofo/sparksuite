(function() {
  function RhythmGameplayEngine(options) {
    options = options || {};
    this.chart = options.chart;
    this.adapter = options.adapter;
    this.eventBus = options.eventBus || null;
    this.performanceMonitor = options.performanceMonitor || null;
    this.preset = options.preset || SparkEnginePresetRegistry.get("spark_learning");
    this.timingEngine = options.timingEngine || new SparkTimingEngine(new SparkCalibrationEngine());
    this.inputJudge = options.inputJudge || new SparkInputJudge();
    this.scoringEngine = options.scoringEngine || new SparkScoringEngine(this.preset);
    if (this.scoringEngine && typeof this.scoringEngine.setEventBus === "function") {
      this.scoringEngine.setEventBus(this.eventBus);
    }
    if (this.scoringEngine && typeof this.scoringEngine.setPerformanceMonitor === "function") {
      this.scoringEngine.setPerformanceMonitor(this.performanceMonitor);
    }
    this.replayEngine = options.replayEngine || new SparkReplayEngine();
    this.assistConfig = typeof SparkNormalizePracticeAssist === "function"
      ? SparkNormalizePracticeAssist(options.assistConfig || {})
      : (options.assistConfig || null);
    this.noteStates = buildNoteStates(this.chart, this.timingEngine);
    this.songEndSec = getSongEndSec(this.noteStates);
    this.completed = false;
    this.lastSnapshot = null;
    this.runtimeUnsubscribe = null;
  }

  RhythmGameplayEngine.prototype.update = function(songTimeSec) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("runtime.frame", "frameRenderMs", function() {
        return self._updateInternal(songTimeSec);
      });
    }
    return this._updateInternal(songTimeSec);
  };

  RhythmGameplayEngine.prototype.updateFromRuntimeState = function(runtimeState) {
    runtimeState = runtimeState || {};
    var transport = runtimeState.transport || {};
    var songTimeSec = typeof transport.positionSec === "number" ? transport.positionSec : 0;
    return this.update(songTimeSec);
  };

  RhythmGameplayEngine.prototype.bindRuntimeSync = function(runtimeSyncEngine) {
    if (!runtimeSyncEngine || typeof runtimeSyncEngine.bind !== "function") return function() {};
    var self = this;
    if (this.runtimeUnsubscribe) {
      try { this.runtimeUnsubscribe(); } catch (err) {}
      this.runtimeUnsubscribe = null;
    }
    this.runtimeUnsubscribe = runtimeSyncEngine.bind("rhythm_gameplay", {
      update: function(state) {
        // Return the snapshot so the sync engine can merge it into the
        // emitted runtime state's gameplay slot.
        return self.updateFromRuntimeState(state);
      }
    });
    return this.runtimeUnsubscribe;
  };

  RhythmGameplayEngine.prototype.unbindRuntimeSync = function() {
    if (this.runtimeUnsubscribe) {
      try { this.runtimeUnsubscribe(); } catch (err) {}
      this.runtimeUnsubscribe = null;
    }
  };

  RhythmGameplayEngine.prototype._updateInternal = function(songTimeSec) {
    songTimeSec = this.getDisplaySongTimeSec(songTimeSec);
    if (this.completed) return this.getSnapshot(songTimeSec);
    var missMs = this.preset.hitWindowMs.miss;
    for (var i = 0; i < this.noteStates.length; i++) {
      var note = this.noteStates[i];
      if (!note.hit && !note.missed && songTimeSec > note.timeSec + (missMs / 1000)) {
        note.missed = true;
        this.scoringEngine.apply({ note: note, judgement: "miss", reason: "late" });
        this.emit("runtime.note.missed", {
          noteId: note.id,
          timeSec: note.timeSec,
          laneMask: note.laneMask,
          reason: "late"
        });
      }
    }
    if (songTimeSec > this.songEndSec + 1 && this.isFinished()) {
      this.completed = true;
    }
    this.emit("runtime.session.frame", {
      songTimeSec: songTimeSec,
      finished: this.completed
    });
    return this.getSnapshot(songTimeSec);
  };

  RhythmGameplayEngine.prototype.handleInput = function(inputEvent) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("input.process", "inputProcessingMs", function() {
        return self._handleInputInternal(inputEvent);
      });
    }
    return this._handleInputInternal(inputEvent);
  };

  RhythmGameplayEngine.prototype._handleInputInternal = function(inputEvent) {
    if (this.completed) return null;
    this.emit("runtime.input.received", {
      input: inputEvent
    });
    this.replayEngine.record(inputEvent);
    var resolution = this.inputJudge.resolve(this.noteStates, inputEvent, this.preset);
    if (resolution.note && resolution.judgement !== "miss") {
      resolution.note.hit = true;
      resolution.note.result = resolution.judgement;
    } else if (resolution.note && resolution.judgement === "miss" && resolution.reason === "wrong_fret") {
      resolution.note.result = "wrong_fret";
    }
    var applied = this.scoringEngine.apply(resolution);
    this.emit("runtime.input.resolved", {
      judgement: resolution.judgement,
      reason: resolution.reason || null,
      noteId: resolution.note && resolution.note.id ? resolution.note.id : null,
      scoreDelta: applied.scoreDelta
    });
    return {
      resolution: resolution,
      applied: applied
    };
  };

  RhythmGameplayEngine.prototype.getSnapshot = function(songTimeSec) {
    songTimeSec = this.getDisplaySongTimeSec(songTimeSec);
    var upcoming = [];
    for (var i = 0; i < this.noteStates.length; i++) {
      var note = this.noteStates[i];
      if (note.missed) continue;
      if (note.timeSec < songTimeSec - 0.5 || note.timeSec > songTimeSec + 4) continue;
      upcoming.push({
        id: note.id,
        tick: note.tick,
        tickLength: note.tickLength,
        timeSec: note.timeSec,
        laneMask: note.laneMask,
        label: note.label,
        flags: note.flags,
        hit: note.hit,
        missed: note.missed,
        result: note.result || null
      });
    }

    var summary = this.scoringEngine.toSummary();
    this.lastSnapshot = {
      songTimeSec: songTimeSec,
      notes: upcoming,
      gameplay: summary.gameplay,
      assistConfig: this.assistConfig,
      finished: this.completed
    };
    return JSON.parse(JSON.stringify(this.lastSnapshot));
  };

  RhythmGameplayEngine.prototype.finalize = function() {
    var summary = this.scoringEngine.toSummary();
    this.emit("runtime.session.finalized", {
      gameplay: summary.gameplay,
      learning: buildLearningSummary(summary.learning)
    });
    return new SparkGameplayResult({
      gameplay: summary.gameplay,
      learning: buildLearningSummary(summary.learning),
      replay: this.replayEngine.export()
    });
  };

  RhythmGameplayEngine.prototype.emit = function(type, payload) {
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      this.eventBus.emit(type, payload || {});
    }
  };

  RhythmGameplayEngine.prototype.isFinished = function() {
    for (var i = 0; i < this.noteStates.length; i++) {
      if (!this.noteStates[i].hit && !this.noteStates[i].missed) return false;
    }
    return true;
  };

  RhythmGameplayEngine.prototype.getDisplaySongTimeSec = function(songTimeSec) {
    if (typeof SparkResolveLoopedPositionMs !== "function" || !this.assistConfig || !this.assistConfig.loopRange) {
      return songTimeSec;
    }
    return SparkResolveLoopedPositionMs(Math.round(songTimeSec * 1000), this.assistConfig) / 1000;
  };

  function buildNoteStates(chart, timingEngine) {
    var notes = chart && chart.tracks && chart.tracks.guitar ? chart.tracks.guitar.notes : [];
    var out = [];
    for (var i = 0; i < notes.length; i++) {
      out.push({
        id: notes[i].id,
        tick: notes[i].tick,
        tickLength: notes[i].tickLength,
        timeSec: timingEngine.tickToSeconds(chart.tempoMap, notes[i].tick),
        laneMask: notes[i].laneMask,
        flags: notes[i].flags || {},
        label: notes[i].label || "",
        skillId: notes[i].skillId || null,
        hit: false,
        missed: false,
        result: null
      });
    }
    return out;
  }

  function getSongEndSec(noteStates) {
    var end = 0;
    for (var i = 0; i < noteStates.length; i++) {
      if (noteStates[i].timeSec > end) end = noteStates[i].timeSec;
    }
    return end;
  }

  function buildLearningSummary(raw) {
    var skills = [];
    for (var skillId in raw.skillHits) {
      skills.push({ id: skillId, delta: Number((raw.skillHits[skillId] * 0.02).toFixed(2)) });
    }
    var weakAreas = [];
    for (var reason in raw.weakReasons) weakAreas.push(reason);
    for (var lane in raw.laneErrors) if (weakAreas.indexOf(lane) < 0) weakAreas.push(lane);
    return {
      skills: skills,
      weakAreas: weakAreas
    };
  }

  window.SparkRhythmGameplayEngine = RhythmGameplayEngine;
  if (typeof module !== "undefined") {
    module.exports = {
      SparkRhythmGameplayEngine: RhythmGameplayEngine
    };
  }
})();
