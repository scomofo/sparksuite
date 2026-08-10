(function() {
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function parseTimeSignature(value) {
    if (!value || typeof value !== "string") return { beatsPerBar: 4, beatUnit: 4 };
    var parts = value.split("/");
    return {
      beatsPerBar: Math.max(1, Math.floor(num(parts[0], 4))),
      beatUnit: Math.max(1, Math.floor(num(parts[1], 4)))
    };
  }

  function normalizeBeatGrid(input) {
    input = input || {};
    var bpm = Math.max(1, num(input.bpm || input.tempo_bpm, 120));
    var timeSignature = input.time_signature || input.timeSignature || "4/4";
    var parsed = parseTimeSignature(timeSignature);
    var downbeats = Array.isArray(input.downbeats_s) ? input.downbeats_s.slice() : [];

    downbeats = downbeats
      .map(function(value) { return num(value, null); })
      .filter(function(value) { return value !== null && value >= 0; });

    var isAscending = true;
    for (var i = 1; i < downbeats.length; i++) {
      if (downbeats[i] <= downbeats[i - 1]) isAscending = false;
    }

    downbeats.sort(function(a, b) { return a - b; });

    if (!downbeats.length) downbeats.push(0);

    return {
      bpm: bpm,
      timeSignature: timeSignature,
      beatsPerBar: parsed.beatsPerBar,
      beatUnit: parsed.beatUnit,
      secondsPerBeat: 60 / bpm,
      secondsPerBar: (60 / bpm) * parsed.beatsPerBar,
      downbeats: downbeats,
      downbeatsAscending: isAscending
    };
  }

  function SparkTimingCore(options) {
    options = options || {};
    this.calibration = {
      globalOffsetMs: num(options.globalOffsetMs, 0),
      audioOffsetMs: num(options.audioOffsetMs, 0),
      midiOffsetMs: num(options.midiOffsetMs, 0),
      micOffsetMs: num(options.micOffsetMs, 0)
    };
  }

  SparkTimingCore.prototype.createBeatGrid = function(input) {
    return normalizeBeatGrid(input || {});
  };

  SparkTimingCore.prototype.getInputOffsetMs = function(inputMode) {
    if (inputMode === "midi") return this.calibration.globalOffsetMs + this.calibration.midiOffsetMs;
    if (inputMode === "mic") return this.calibration.globalOffsetMs + this.calibration.micOffsetMs;
    return this.calibration.globalOffsetMs + this.calibration.audioOffsetMs;
  };

  SparkTimingCore.prototype.applyLatencyCompensation = function(timeSec, inputMode) {
    // Subtracting the offset from an INPUT timestamp is equivalent to adding
    // it to the SONG clock (calibration_engine) or to the raw delta at
    // judgment time (performance session): all three application points yield
    // the same corrected delta. This model is the single source for the
    // offset values themselves.
    return Math.max(0, num(timeSec, 0) - this.getInputOffsetMs(inputMode) / 1000);
  };

  // Build the latency model from the persisted performance calibration store
  // (S.performTimingOffsetMs / performMidiOffsetMs / performMicOffsetMs) —
  // the one place users' measured offsets live. Both performance mode and the
  // rhythm gameplay clock resolve offsets through this.
  SparkTimingCore.fromPerformanceState = function(state) {
    state = state || {};
    return new SparkTimingCore({
      globalOffsetMs: state.performTimingOffsetMs,
      midiOffsetMs: state.performMidiOffsetMs,
      micOffsetMs: state.performMicOffsetMs
    });
  };

  SparkTimingCore.prototype.secondsToBeat = function(timeSec, beatGrid) {
    var grid = normalizeBeatGrid(beatGrid);
    return Math.max(0, num(timeSec, 0)) / grid.secondsPerBeat;
  };

  SparkTimingCore.prototype.beatToSeconds = function(beat, beatGrid) {
    var grid = normalizeBeatGrid(beatGrid);
    return Math.max(0, num(beat, 0)) * grid.secondsPerBeat;
  };

  SparkTimingCore.prototype.secondsToBarBeat = function(timeSec, beatGrid) {
    var grid = normalizeBeatGrid(beatGrid);
    var absoluteBeat = this.secondsToBeat(timeSec, grid);
    var barIndex = Math.floor(absoluteBeat / grid.beatsPerBar);
    var beatInBar = absoluteBeat - barIndex * grid.beatsPerBar;
    return {
      barIndex: barIndex,
      barNumber: barIndex + 1,
      beatIndex: Math.floor(beatInBar),
      beatNumber: Math.floor(beatInBar) + 1,
      beatProgress: beatInBar - Math.floor(beatInBar),
      absoluteBeat: absoluteBeat
    };
  };

  SparkTimingCore.prototype.getNearestBeat = function(timeSec, beatGrid) {
    var grid = normalizeBeatGrid(beatGrid);
    var beat = this.secondsToBeat(timeSec, grid);
    var nearestBeat = Math.round(beat);
    var nearestTimeSec = this.beatToSeconds(nearestBeat, grid);
    return {
      beat: nearestBeat,
      timeSec: nearestTimeSec,
      deltaMs: (timeSec - nearestTimeSec) * 1000
    };
  };

  SparkTimingCore.prototype.createTransport = function(options) {
    options = options || {};
    var grid = normalizeBeatGrid(options.beatGrid || options);
    var durationSec = Math.max(0, num(options.durationSec, options.duration_s || 0));
    var positionSec = clamp(num(options.positionSec, 0), 0, durationSec || Number.MAX_SAFE_INTEGER);
    return {
      status: options.status || "idle",
      durationSec: durationSec,
      positionSec: positionSec,
      positionMs: Math.round(positionSec * 1000),
      beatGrid: grid,
      barBeat: this.secondsToBarBeat(positionSec, grid),
      nearestBeat: this.getNearestBeat(positionSec, grid)
    };
  };

  SparkTimingCore.prototype.advanceTransport = function(transport, deltaSec) {
    transport = transport || this.createTransport({});
    var durationSec = num(transport.durationSec, 0);
    var positionSec = num(transport.positionSec, 0) + Math.max(0, num(deltaSec, 0));
    if (durationSec > 0) positionSec = Math.min(positionSec, durationSec);
    return this.createTransport({
      status: durationSec > 0 && positionSec >= durationSec ? "completed" : transport.status || "running",
      durationSec: durationSec,
      positionSec: positionSec,
      beatGrid: transport.beatGrid
    });
  };

  SparkTimingCore.prototype.scheduleCues = function(cues, transport, options) {
    cues = Array.isArray(cues) ? cues : [];
    transport = transport || this.createTransport({});
    options = options || {};
    var lookaheadSec = Math.max(0, num(options.lookaheadSec, 0.1));
    var startSec = num(transport.positionSec, 0);
    var endSec = startSec + lookaheadSec;
    return cues.filter(function(cue) {
      var timeSec = num(cue.timeSec != null ? cue.timeSec : cue.startSec, null);
      return timeSec !== null && timeSec >= startSec && timeSec <= endSec;
    }).map(function(cue) {
      var next = clone(cue);
      var cueTime = num(cue.timeSec != null ? cue.timeSec : cue.startSec, 0);
      next.dueInMs = Math.max(0, Math.round((cueTime - startSec) * 1000));
      return next;
    });
  };

  SparkTimingCore.prototype.createLessonTiming = function(manifest) {
    manifest = manifest || {};
    var beatGrid = this.createBeatGrid(manifest.beat_grid || {
      bpm: manifest.tempo_bpm,
      time_signature: manifest.time_signature,
      downbeats_s: [0]
    });
    return {
      lessonId: manifest.lesson_id || null,
      title: manifest.title || null,
      durationSec: num(manifest.duration_s, 0),
      tempoBpm: beatGrid.bpm,
      timeSignature: beatGrid.timeSignature,
      beatGrid: beatGrid,
      transport: this.createTransport({
        durationSec: manifest.duration_s,
        beatGrid: beatGrid,
        status: "ready",
        positionSec: 0
      })
    };
  };

  SparkTimingCore.prototype.validateBeatGrid = function(input) {
    var grid = normalizeBeatGrid(input || {});
    var issues = [];
    if (grid.bpm <= 0) issues.push({ code: "invalid_bpm", message: "BPM must be greater than zero" });
    if (!grid.downbeatsAscending) issues.push({ code: "downbeats_not_ascending", message: "Downbeats must be strictly ascending" });
    return { ok: issues.length === 0, issues: issues, beatGrid: grid };
  };

  if (typeof window !== "undefined") window.SparkTimingCore = SparkTimingCore;
  if (typeof module !== "undefined") module.exports = SparkTimingCore;
})();
