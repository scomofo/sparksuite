(function() {
  function RhythmGameplayEngine(options) {
    options = options || {};
    this.chart = options.chart;
    this.adapter = options.adapter;
    this.preset = options.preset || SparkEnginePresetRegistry.get("spark_learning");
    this.timingEngine = options.timingEngine || new SparkTimingEngine(new SparkCalibrationEngine());
    this.inputJudge = options.inputJudge || new SparkInputJudge();
    this.scoringEngine = options.scoringEngine || new SparkScoringEngine(this.preset);
    this.replayEngine = options.replayEngine || new SparkReplayEngine();
    this.noteStates = buildNoteStates(this.chart, this.timingEngine);
    this.songEndSec = getSongEndSec(this.noteStates);
    this.completed = false;
    this.lastSnapshot = null;
  }

  RhythmGameplayEngine.prototype.update = function(songTimeSec) {
    if (this.completed) return this.getSnapshot(songTimeSec);
    var missMs = this.preset.hitWindowMs.miss;
    for (var i = 0; i < this.noteStates.length; i++) {
      var note = this.noteStates[i];
      if (!note.hit && !note.missed && songTimeSec > note.timeSec + (missMs / 1000)) {
        note.missed = true;
        this.scoringEngine.apply({ note: note, judgement: "miss", reason: "late" });
      }
    }
    if (songTimeSec > this.songEndSec + 1 && this.isFinished()) {
      this.completed = true;
    }
    return this.getSnapshot(songTimeSec);
  };

  RhythmGameplayEngine.prototype.handleInput = function(inputEvent) {
    if (this.completed) return null;
    this.replayEngine.record(inputEvent);
    var resolution = this.inputJudge.resolve(this.noteStates, inputEvent, this.preset);
    if (resolution.note && resolution.judgement !== "miss") {
      resolution.note.hit = true;
      resolution.note.result = resolution.judgement;
    } else if (resolution.note && resolution.judgement === "miss" && resolution.reason === "wrong_fret") {
      resolution.note.result = "wrong_fret";
    }
    var applied = this.scoringEngine.apply(resolution);
    return {
      resolution: resolution,
      applied: applied
    };
  };

  RhythmGameplayEngine.prototype.getSnapshot = function(songTimeSec) {
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
        lane: note.lane != null ? note.lane : laneFromMask(note.laneMask),
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
      finished: this.completed
    };
    return JSON.parse(JSON.stringify(this.lastSnapshot));
  };

  RhythmGameplayEngine.prototype.finalize = function() {
    var summary = this.scoringEngine.toSummary();
    return new SparkGameplayResult({
      gameplay: summary.gameplay,
      learning: buildLearningSummary(summary.learning),
      replay: this.replayEngine.export(),
      output: {
        accuracy: summary.gameplay.accuracy,
        timing: summary.gameplay.timing,
        mistakes: summary.gameplay.mistakes
      }
    });
  };

  RhythmGameplayEngine.prototype.isFinished = function() {
    for (var i = 0; i < this.noteStates.length; i++) {
      if (!this.noteStates[i].hit && !this.noteStates[i].missed) return false;
    }
    return true;
  };

  function buildNoteStates(chart, timingEngine) {
    var track = getChartTrack(chart);
    var notes = track.notes || [];
    var out = [];
    for (var i = 0; i < notes.length; i++) {
      out.push({
        id: notes[i].id,
        tick: notes[i].tick,
        tickLength: notes[i].tickLength,
        timeSec: timingEngine.tickToSeconds(chart.tempoMap, notes[i].tick),
        lane: notes[i].lane != null ? notes[i].lane : laneFromMask(notes[i].laneMask),
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

  function mapChartToPerformanceNotes(chart, timingEngine) {
    var notes = buildNoteStates(chart, timingEngine || new SparkTimingEngine(new SparkCalibrationEngine()));
    var mapped = [];
    for (var i = 0; i < notes.length; i++) {
      mapped.push({
        time: Math.round(notes[i].timeSec * 1000),
        type: notes[i].flags && notes[i].flags.tap ? "note" : "chord",
        value: notes[i].label || notes[i].laneMask,
        lane: notes[i].lane != null ? notes[i].lane : laneFromMask(notes[i].laneMask),
        laneMask: notes[i].laneMask,
        skillId: notes[i].skillId || null
      });
    }
    return mapped;
  }

  function scorePerformanceInput(inputModel, noteModel, timingWindow) {
    timingWindow = timingWindow || { perfect: 50, good: 100 };
    var delta = Math.abs((inputModel.timestamp || 0) - (noteModel.time || 0));
    if (delta < timingWindow.perfect) return "perfect";
    if (delta < timingWindow.good) return "good";
    return "miss";
  }

  window.SparkRhythmGameplayEngine = RhythmGameplayEngine;
  window.SparkPerformanceEngine = RhythmGameplayEngine;
  window.SparkPerformanceNoteMapper = {
    fromChart: mapChartToPerformanceNotes
  };
  window.SparkPerformanceTimingWindow = {
    score: scorePerformanceInput
  };
  window.SparkPerformanceInputHandler = window.SparkInputJudge;
  window.SparkPerformanceScoringSystem = window.SparkScoringEngine;

  function getChartTrack(chart) {
    if (!chart || !chart.tracks) return { notes: [], phrases: [] };
    var trackId = chart.metadata && chart.metadata.defaultTrackId ? chart.metadata.defaultTrackId : null;
    if (trackId && chart.tracks[trackId]) return chart.tracks[trackId];
    for (var key in chart.tracks) {
      if (chart.tracks[key]) return chart.tracks[key];
    }
    return { notes: [], phrases: [] };
  }

  function laneFromMask(laneMask) {
    for (var i = 0; i < 32; i++) {
      if (laneMask & (1 << i)) return i;
    }
    return 0;
  }
})();
