(function() {
  /**
   * SparkTimingCore
   *
   * Engine-owned timing primitives for lesson playback, rhythm gameplay,
   * cue scheduling, and future sync systems. UI code should consume snapshots
   * from this core rather than owning timing logic.
   */

  function _num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function _clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function _parseTimeSignature(value) {
    if (!value || typeof value !== "string") return { beatsPerBar: 4, beatUnit: 4 };
    var parts = value.split("/");
    return {
      beatsPerBar: Math.max(1, Math.floor(_num(parts[0], 4))),
      beatUnit: Math.max(1, Math.floor(_num(parts[1], 4)))
    };
  }

  function _normalizeBeatGrid(input) {
    input = input || {};
    var bpm = Math.max(1, _num(input.bpm || input.tempo_bpm, 120));
    var timeSignature = input.time_signature || input.timeSignature || "4/4";
    var parsed = _parseTimeSignature(timeSignature);
    var downbeats = Array.isArray(input.downbeats_s) ? input.downbeats_s.slice() : [];

    downbeats = downbeats
      .map(function(value) { return _num(value, null); })
      .filter(function(value) { return value !== null && value >= 0; })
      .sort(function(a, b) { return a - b; });

    if (!downbeats.length) downbeats.push(0);

    return {
      bpm: bpm,
      timeSignature: timeSignature,
      beatsPerBar: parsed.beatsPerBar,
      beatUnit: parsed.beatUnit,
      secondsPerBeat: 60 / bpm,
      secondsPerBar: (60 / bpm) * parsed.beatsPerBar,
      downbeats: downbeats
    };
  }

  function SparkTimingCore(options) {
    options = options || {};
    this.calibration = {
      globalOffsetMs: _num(options.globalOffsetMs, 0),
      audioOffsetMs: _num(options.audioOffsetMs, 0),
      midiOffsetMs: _num(options.midiOffsetMs, 0),
      micOffsetMs: _num(options.micOffsetMs, 0)
    };
  }

  SparkTimingCore.prototype.createBeatGrid = function(input) {
    return _normalizeBeatGrid(input || {});
  };

  SparkTimingCore.prototype.getInputOffsetMs = function(inputMode) {
    if (inputMode === "midi") return this.calibration.globalOffsetMs + this.calibration.midiOffsetMs;
    if (inputMode === "mic") return this.calibration.globalOffsetMs + this.calibration.micOffsetMs;
    return this.calibration.globalOffsetMs + this.calibration.audioOffsetMs;
  };

  SparkTimingCore.prototype.applyLatencyCompensation = function(timeSec, inputMode) {
    return Math.max(0, _num(timeSec, 0) - (this.getInputOffsetMs(inputMode) / 1000));
  };

  SparkTimingCore.prototype.secondsToBeat = function(timeSec, beatGrid) {
    var grid = _normalizeBeatGrid(beatGrid);
    var compensated = Math.max(0, _num(timeSec, 0));
    return compensated / grid.secondsPerBeat;
  };

  SparkTimingCore.prototype.beatToSeconds = function(beat, beatGrid) {
    var grid = _normalizeBeatGrid(beatGrid);
    return Math.max(0, _num(beat, 0)) * grid.secondsPerBeat;
  };

  SparkTimingCore.prototype.secondsToBarBeat = function(timeSec, beatGrid) {
    var grid = _normalizeBeatGrid(beatGrid);
    var absoluteBeat = this.secondsToBeat(timeSec, grid);
    var barIndex = Math.floor(absoluteBeat / grid.beatsPerBar);
    var beatInBar = absoluteBeat - (barIndex * grid.beatsPerBar);

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
    var grid = _normalizeBeatGrid(beatGrid);
    var beat = this.secondsToBeat(timeSec, grid);
    var nearestBeat = Math.round(beat);
    var nearestTimeSec = this.beatToSeconds(nearestBeat, grid);

    return {
      beat: nearestBeat,
      timeSec: nearestTimeSec,
      deltaMs: (timeSec - nearestTimeSec) * 1000
    };
  };

  SparkTimingCore.prototype.getNearestDownbeat = function(timeSec, beatGrid) {
    var grid = _normalizeBeatGrid(beatGrid);
    var best = grid.downbeats[0];
    var bestDelta = Math.abs(timeSec - best);

    for (var i = 1; i < grid.downbeats.length; i++) {
      var delta = Math.abs(timeSec - grid.downbeats[i]);
      if (delta < bestDelta) {
        best = grid.downbeats[i];
        bestDelta = delta;
      }
    }

    return {
      timeSec: best,
      deltaMs: (timeSec - best) * 1000
    };
  };

  SparkTimingCore.prototype.createTransport = function(options) {
    options = options || {};
    var grid = _normalizeBeatGrid(options.beatGrid || options);
    var durationSec = Math.max(0, _num(options.durationSec, options.duration_s || 0));
    var positionSec = _clamp(_num(options.positionSec, 0), 0, durationSec || Number.MAX_SAFE_INTEGER);
    var status = options.status || "idle";

    return {
      status: status,
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
    var nextPosition = _num(transport.positionSec, 0) + Math.max(0, _num(deltaSec, 0));
    var duration = _num(transport.durationSec, 0);
    if (duration > 0) nextPosition = Math.min(nextPosition, duration);

    return this.createTransport({
      status: duration > 0 && nextPosition >= duration ? "completed" : (transport.status || "running"),
      durationSec: duration,
      positionSec: nextPosition,
      beatGrid: transport.beatGrid
    });
  };

  SparkTimingCore.prototype.scheduleCues = function(cues, transport, options) {
    cues = Array.isArray(cues) ? cues : [];
    transport = transport || this.createTransport({});
    options = options || {};

    var lookaheadSec = Math.max(0, _num(options.lookaheadSec, 0.1));
    var startSec = _num(transport.positionSec, 0);
    var endSec = startSec + lookaheadSec;

    return cues
      .filter(function(cue) {
        var timeSec = _num(cue.timeSec != null ? cue.timeSec : cue.startSec, null);
        return timeSec !== null && timeSec >= startSec && timeSec <= endSec;
      })
      .map(function(cue) {
        var next = _clone(cue);
        next.dueInMs = Math.max(0, Math.round((_num(cue.timeSec != null ? cue.timeSec : cue.startSec, 0) - startSec) * 1000));
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
      durationSec: _num(manifest.duration_s, 0),
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
    var grid = _normalizeBeatGrid(input || {});
    var issues = [];

    if (grid.bpm <= 0) issues.push({ code: "invalid_bpm", message: "BPM must be greater than zero" });
    for (var i = 1; i < grid.downbeats.length; i++) {
      if (grid.downbeats[i] <= grid.downbeats[i - 1]) {
        issues.push({ code: "downbeats_not_ascending", message: "Downbeats must be strictly ascending" });
        break;
      }
    }

    return {
      ok: issues.length === 0,
      issues: issues,
      beatGrid: grid
    };
  };

  if (typeof window !== "undefined") window.SparkTimingCore = SparkTimingCore;
  if (typeof module !== "undefined") module.exports = SparkTimingCore;
})();
