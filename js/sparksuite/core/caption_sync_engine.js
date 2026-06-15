(function() {
  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function sanitizeText(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .split("\n")
      .map(function(line) { return line.trim(); })
      .filter(Boolean)
      .join("\n");
  }

  function SparkCaptionSyncEngine(options) {
    options = options || {};
    this.preloadSec = Math.max(0, num(options.preloadSec, 2));
    this.cues = [];
    this.activeCue = null;
    this.nextCue = null;
  }

  SparkCaptionSyncEngine.prototype.normalizeCues = function(cues) {
    cues = Array.isArray(cues) ? cues : [];
    return cues.map(function(cue, index) {
      return {
        id: cue.id || "cue_" + (index + 1),
        startSec: Math.max(0, num(cue.startSec != null ? cue.startSec : cue.start, 0)),
        endSec: Math.max(0, num(cue.endSec != null ? cue.endSec : cue.end, 0)),
        text: sanitizeText(cue.text)
      };
    }).filter(function(cue) {
      return cue.endSec > cue.startSec && cue.text;
    }).sort(function(a, b) {
      return a.startSec - b.startSec;
    });
  };

  SparkCaptionSyncEngine.prototype.loadCues = function(cues) {
    this.cues = this.normalizeCues(cues);
    this.activeCue = null;
    this.nextCue = this.cues.length ? this.cues[0] : null;
    return this.getState({ positionSec: 0, status: "ready" });
  };

  SparkCaptionSyncEngine.prototype.getCueAt = function(positionSec) {
    positionSec = Math.max(0, num(positionSec, 0));
    for (var i = 0; i < this.cues.length; i++) {
      if (positionSec >= this.cues[i].startSec && positionSec < this.cues[i].endSec) {
        return this.cues[i];
      }
    }
    return null;
  };

  SparkCaptionSyncEngine.prototype.getNextCueAfter = function(positionSec) {
    positionSec = Math.max(0, num(positionSec, 0));
    for (var i = 0; i < this.cues.length; i++) {
      if (this.cues[i].startSec > positionSec) return this.cues[i];
    }
    return null;
  };

  SparkCaptionSyncEngine.prototype.getPreloadCues = function(positionSec, preloadSec) {
    positionSec = Math.max(0, num(positionSec, 0));
    preloadSec = Math.max(0, num(preloadSec, this.preloadSec));
    var endSec = positionSec + preloadSec;

    return this.cues.filter(function(cue) {
      return cue.startSec >= positionSec && cue.startSec <= endSec;
    }).map(clone);
  };

  SparkCaptionSyncEngine.prototype.update = function(transportSnapshot) {
    transportSnapshot = transportSnapshot || {};
    var positionSec = Math.max(0, num(transportSnapshot.positionSec, 0));
    this.activeCue = this.getCueAt(positionSec);
    this.nextCue = this.getNextCueAfter(positionSec);
    return this.getState(transportSnapshot);
  };

  SparkCaptionSyncEngine.prototype.getState = function(transportSnapshot) {
    transportSnapshot = transportSnapshot || {};
    var positionSec = Math.max(0, num(transportSnapshot.positionSec, 0));
    var active = this.activeCue ? clone(this.activeCue) : null;
    var next = this.nextCue ? clone(this.nextCue) : null;

    return {
      status: transportSnapshot.status || "idle",
      positionSec: positionSec,
      activeCue: active,
      activeText: active ? active.text : "",
      nextCue: next,
      preloadCues: this.getPreloadCues(positionSec, this.preloadSec),
      cueCount: this.cues.length
    };
  };

  SparkCaptionSyncEngine.prototype.bindTransport = function(transportEngine) {
    if (!transportEngine || typeof transportEngine.subscribe !== "function") return function() {};
    var self = this;
    return transportEngine.subscribe(function(snapshot) {
      self.update(snapshot);
    });
  };

  if (typeof window !== "undefined") window.SparkCaptionSyncEngine = SparkCaptionSyncEngine;
  if (typeof module !== "undefined") module.exports = SparkCaptionSyncEngine;
})();
