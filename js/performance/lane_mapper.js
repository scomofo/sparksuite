(function() {
  'use strict';

  var CHORD_LANES = {
    C: 0,
    G: 1,
    Am: 2,
    F: 3
  };

  function getLaneLabelLane(label) {
    if (label == null) return null;
    var normalized = String(label).trim();
    if (!normalized) return null;
    if (Object.prototype.hasOwnProperty.call(CHORD_LANES, normalized)) {
      return CHORD_LANES[normalized];
    }
    return null;
  }

  function getLane(chord, event) {
    if (event) {
      if (typeof event.lane === 'number' && event.lane >= 0) return event.lane;
      if (typeof event.laneMask === 'number' && event.laneMask > 0 && typeof getPrimaryPerformanceLane === 'function') {
        return getPrimaryPerformanceLane(event.laneMask);
      }
      if (event.laneLabel != null) {
        var fromLabel = getLaneLabelLane(event.laneLabel);
        if (fromLabel != null) return fromLabel;
      }
    }
    if (!chord) return null;
    return getLaneLabelLane(chord);
  }

  window.PERFORMANCE_CHORD_LANES = CHORD_LANES;
  window.getPerformanceLane = getLane;
})();
