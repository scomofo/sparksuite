(function() {
  'use strict';

  function getTimeline(song) {
    if (!song) return [];
    if (Array.isArray(song.timeline)) return song.timeline;
    if (typeof song.getTimeline === 'function') return song.getTimeline() || [];
    return [];
  }

  function getTimeSignature(song) {
    if (!song) return 4;
    if (typeof song.timeSignature === 'number') return song.timeSignature;
    if (song.timeSignature && typeof song.timeSignature.numerator === 'number') {
      return song.timeSignature.numerator;
    }
    return 4;
  }

  function getEventTimeMs(song, event) {
    if (!event) return null;
    if (typeof event.time === 'number') return event.time;
    if (typeof event.timeMs === 'number') return event.timeMs;

    if (typeof event.bar === 'number' && typeof event.beat === 'number' && song && typeof song.bpm === 'number') {
      var beatsPerBar = getTimeSignature(song);
      return (((event.bar - 1) * beatsPerBar) + (event.beat - 1)) * (60000 / song.bpm);
    }

    return null;
  }

  function getExpectedLabel(event) {
    if (!event) return null;
    if (event.chord != null) return event.chord;
    if (event.note != null) return event.note;
    return null;
  }

  function getExpectedEvent(song, timeMs) {
    var timeline = getTimeline(song);
    var closest = { time: null, chord: null, event: null };
    var bestDistance = Infinity;

    for (var i = 0; i < timeline.length; i++) {
      var event = timeline[i];
      var eventTime = getEventTimeMs(song, event);
      if (eventTime == null) continue;

      var distance = Math.abs(eventTime - timeMs);
      if (distance < bestDistance) {
        bestDistance = distance;
        closest = {
          time: eventTime,
          chord: getExpectedLabel(event),
          event: event
        };
      }
    }

    return closest;
  }

  function calculateTimingOffsetMs(expectedTimeMs, actualTimeMs) {
    if (typeof expectedTimeMs !== 'number' || typeof actualTimeMs !== 'number') return null;
    return actualTimeMs - expectedTimeMs;
  }

  window.SparkPlayAlongTiming = {
    getEventTimeMs: getEventTimeMs,
    getExpectedEvent: getExpectedEvent,
    calculateTimingOffsetMs: calculateTimingOffsetMs
  };
})();
