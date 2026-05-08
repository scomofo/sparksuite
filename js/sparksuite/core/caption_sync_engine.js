(function() {
  /**
   * SparkCaptionSyncEngine
   *
   * Engine-owned caption/lyric sync. It consumes transport snapshots and emits
   * active caption state. UI should render this state only; UI should not own
   * cue timing, cue lookup, or sync logic.
   */

  function _num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function _clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function _parseTime(hh, mm, ss, ms) {
    return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
  }

  function _sanitizeText(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .split("\n")
      .map(function(line) { return line.trim(); })
      .filter(Boolean)
      .join("\n");
  }

  function SparkCaptionSyncEngine(options) {
    options = options || {};
    this.preloadSec = Math.max(0, _num(options.preloadSec, 2));
    this.cues = [];
    this.activeCue = null;
    this.nextCue = null;
  }

  SparkCaptionSyncEngine.prototype.parseSrt = function(srtText) {
    var text = String(srtText || "").replace(/\r/g, "");
    var blocks = text.split(/\n\s*\n/g);
    var cues = [];

    for (var i = 0; i < blocks.length; i++) {
      var lines = blocks[i].split("\n").map(function(line) { return line.trim(); }).filter(Boolean);
      if (!lines.length) continue;

      var timingIndex = -1;
      for (var j = 0; j < lines.length; j++) {
        if (lines[j].indexOf("-->") >= 0) {
          timingIndex = j;
          break;
        }
      }
      if (timingIndex < 0) continue;

      var match = lines[timingIndex].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!match) continue;

      cues.push({
        id: lines[0] && timingIndex > 0 ? lines[0] : "cue_" + (cues.length + 1),
        startSec: _parseTime(match[1], match[2], match[3], match[4]),
        endSec: _parseTime(match[5], match[6], match[7], match[8]),
        text: _sanitizeText(lines.slice(timingIndex + 1).join("\n"))
      });
    }

    return this.normalizeCues(cues);
  };

  SparkCaptionSyncEngine.prototype.normalizeCues = function(cues) {
    cues = Array.isArray(cues) ? cues : [];
    return cues
      .map(function(cue, index) {
        return {
          id: cue.id || "cue_" + (index + 1),
          startSec: Math.max(0, _num(cue.startSec != null ? cue.startSec : cue.start, 0)),
          endSec: Math.max(0, _num(cue.endSec != null ? cue.endSec : cue.end, 0)),
          text: _sanitizeText(cue.text)
        };
      })
      .filter(function(cue) {
        return cue.endSec > cue.startSec && cue.text;
      })
      .sort(function(a, b) {
        return a.startSec - b.startSec;
      });
  };

  SparkCaptionSyncEngine.prototype.loadCues = function(cues) {
    this.cues = typeof cues === "string" ? this.parseSrt(cues) : this.normalizeCues(cues);
    this.activeCue = null;
    this.nextCue = this.cues.length ? this.cues[0] : null;
    return this.getState({ positionSec: 0, status: "ready" });
  };

  SparkCaptionSyncEngine.prototype.getCueAt = function(positionSec) {
    positionSec = Math.max(0, _num(positionSec, 0));
    for (var i = 0; i < this.cues.length; i++) {
      if (positionSec >= this.cues[i].startSec && positionSec < this.cues[i].endSec) {
        return this.cues[i];
      }
    }
    return null;
  };

  SparkCaptionSyncEngine.prototype.getNextCueAfter = function(positionSec) {
    positionSec = Math.max(0, _num(positionSec, 0));
    for (var i = 0; i < this.cues.length; i++) {
      if (this.cues[i].startSec > positionSec) return this.cues[i];
    }
    return null;
  };

  SparkCaptionSyncEngine.prototype.getPreloadCues = function(positionSec, preloadSec) {
    positionSec = Math.max(0, _num(positionSec, 0));
    preloadSec = Math.max(0, _num(preloadSec, this.preloadSec));
    var endSec = positionSec + preloadSec;

    return this.cues.filter(function(cue) {
      return cue.startSec >= positionSec && cue.startSec <= endSec;
    }).map(_clone);
  };

  SparkCaptionSyncEngine.prototype.update = function(transportSnapshot) {
    transportSnapshot = transportSnapshot || {};
    var positionSec = Math.max(0, _num(transportSnapshot.positionSec, 0));
    this.activeCue = this.getCueAt(positionSec);
    this.nextCue = this.getNextCueAfter(positionSec);
    return this.getState(transportSnapshot);
  };

  SparkCaptionSyncEngine.prototype.getState = function(transportSnapshot) {
    transportSnapshot = transportSnapshot || {};
    var positionSec = Math.max(0, _num(transportSnapshot.positionSec, 0));
    var active = this.activeCue ? _clone(this.activeCue) : null;
    var next = this.nextCue ? _clone(this.nextCue) : null;

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
