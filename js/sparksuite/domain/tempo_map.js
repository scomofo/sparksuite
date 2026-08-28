(function() {
  function TempoMap(input) {
    input = input || {};
    this.ppq = input.ppq || 480;
    this.segments = Array.isArray(input.segments) && input.segments.length ? input.segments : [{
      tick: 0,
      bpm: input.bpm || 100
    }];
  }

  TempoMap.prototype.tickToSeconds = function(tick) {
    var sec = 0;
    var ppq = this.ppq;
    var segs = this.segments;
    for (var i = 0; i < segs.length; i++) {
      var cur = segs[i];
      var next = segs[i + 1];
      var endTick = next ? Math.min(next.tick, tick) : tick;
      if (tick <= cur.tick) break;
      if (endTick > cur.tick) {
        sec += ((endTick - cur.tick) / ppq) * (60 / cur.bpm);
      }
      if (!next || tick < next.tick) break;
    }
    return sec;
  };

  // Inverse of tickToSeconds — walks the same segments to find which one
  // contains `sec`, then solves for the tick within it.
  TempoMap.prototype.secondsToTick = function(sec) {
    var ppq = this.ppq;
    var segs = this.segments;
    var accumSec = 0;
    for (var i = 0; i < segs.length; i++) {
      var cur = segs[i];
      var next = segs[i + 1];
      var segDurSec = next ? ((next.tick - cur.tick) / ppq) * (60 / cur.bpm) : Infinity;
      if (!next || sec <= accumSec + segDurSec) {
        var remainingSec = sec - accumSec;
        var ticksIntoSeg = (remainingSec / (60 / cur.bpm)) * ppq;
        return Math.round(cur.tick + ticksIntoSeg);
      }
      accumSec += segDurSec;
    }
    return 0;
  };

  window.SparkTempoMap = TempoMap;
})();
