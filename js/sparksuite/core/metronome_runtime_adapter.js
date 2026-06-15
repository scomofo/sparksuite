(function() {
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function SparkMetronomeRuntimeAdapter(options) {
    options = options || {};
    this.subdivision = Math.max(1, Math.floor(num(options.subdivision, 1)));
    this.lookaheadSec = Math.max(0.01, num(options.lookaheadSec, 0.1));
    this.countInBars = Math.max(0, Math.floor(num(options.countInBars, 0)));
    this.lastBeat = null;
    this.events = [];
    this.enabled = options.enabled !== false;
  }

  SparkMetronomeRuntimeAdapter.prototype.setEnabled = function(enabled) {
    this.enabled = !!enabled;
  };

  SparkMetronomeRuntimeAdapter.prototype.reset = function() {
    this.lastBeat = null;
    this.events = [];
  };

  SparkMetronomeRuntimeAdapter.prototype.update = function(runtimeState) {
    if (!this.enabled) return [];
    runtimeState = runtimeState || {};
    var transport = runtimeState.transport || {};
    var beatGrid = transport.beatGrid || {};
    var barBeat = transport.barBeat || {};
    var secondsPerBeat = num(beatGrid.secondsPerBeat, 0.5);
    var beatsPerBar = Math.max(1, Math.floor(num(beatGrid.beatsPerBar, 4)));
    var positionSec = Math.max(0, num(transport.positionSec, 0));
    var absoluteBeat = num(barBeat.absoluteBeat, positionSec / secondsPerBeat);
    if (this.lastBeat !== null && absoluteBeat < this.lastBeat) {
      this.lastBeat = null;
    }
    var step = 1 / this.subdivision;
    var startStep = Math.floor(absoluteBeat / step);
    var endBeat = absoluteBeat + (this.lookaheadSec / secondsPerBeat);
    var endStep = Math.floor(endBeat / step);
    var due = [];

    for (var i = startStep; i <= endStep; i++) {
      var beat = i * step;
      if (this.lastBeat !== null && beat <= this.lastBeat) continue;
      var beatIndex = Math.floor(beat);
      var subdivisionIndex = Math.round((beat - beatIndex) / step);
      var beatInBar = beatIndex % beatsPerBar;
      var isDownbeat = subdivisionIndex === 0 && beatInBar === 0;
      var isBeat = subdivisionIndex === 0;
      var event = {
        type: isDownbeat ? "downbeat" : (isBeat ? "beat" : "subdivision"),
        beat: beat,
        beatIndex: beatIndex,
        beatNumber: beatInBar + 1,
        barNumber: Math.floor(beatIndex / beatsPerBar) + 1,
        subdivisionIndex: subdivisionIndex,
        timeSec: beat * secondsPerBeat,
        dueInMs: Math.max(0, Math.round(((beat * secondsPerBeat) - positionSec) * 1000))
      };
      due.push(event);
      this.events.push(event);
      this.lastBeat = beat;
    }

    return clone(due);
  };

  SparkMetronomeRuntimeAdapter.prototype.bindRuntimeSync = function(runtimeSyncEngine) {
    if (!runtimeSyncEngine || typeof runtimeSyncEngine.bind !== "function") return function() {};
    return runtimeSyncEngine.bind("metronome", this);
  };

  SparkMetronomeRuntimeAdapter.prototype.getEvents = function() {
    return clone(this.events);
  };

  if (typeof window !== "undefined") window.SparkMetronomeRuntimeAdapter = SparkMetronomeRuntimeAdapter;
  if (typeof module !== "undefined") module.exports = SparkMetronomeRuntimeAdapter;
})();
