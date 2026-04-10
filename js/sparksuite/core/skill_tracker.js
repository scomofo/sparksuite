(function() {
  var ALPHA = 0.3;
  var MAX_HISTORY = 30;

  function create() {
    return {
      timing: 0.5,
      rhythm: 0.5,
      chordAccuracy: 0.5,
      laneAccuracy: { 0: 0.5, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5 },
      history: []
    };
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smooth(current, observed) { return clamp01((1 - ALPHA) * current + ALPHA * observed); }

  function update(sg, result) {
    var timingScore = clamp01(1 - ((result.avgAbsDelta || 50) / 100));
    sg.timing = smooth(sg.timing, timingScore);
    sg.rhythm = smooth(sg.rhythm, result.accuracy || 0);
    if (result.chordHits != null && result.chordAttempts > 0) {
      sg.chordAccuracy = smooth(sg.chordAccuracy, result.chordHits / result.chordAttempts);
    }
    if (result.laneErrors && result.totalNotes > 0) {
      for (var lane = 0; lane < 6; lane++) {
        var errors = result.laneErrors[lane] || 0;
        var laneScore = 1 - (errors / result.totalNotes);
        sg.laneAccuracy[lane] = smooth(sg.laneAccuracy[lane] || 0.5, laneScore);
      }
    }
    sg.history.push({
      date: Date.now(),
      skills: { timing: sg.timing, rhythm: sg.rhythm, chordAccuracy: sg.chordAccuracy }
    });
    if (sg.history.length > MAX_HISTORY) sg.history.shift();
    return sg;
  }

  function getWeakestSkill(sg) {
    var skills = { timing: sg.timing, rhythm: sg.rhythm, chordAccuracy: sg.chordAccuracy };
    var weakest = null, lowest = 2;
    for (var key in skills) {
      if (skills[key] < lowest) { lowest = skills[key]; weakest = key; }
    }
    return weakest;
  }

  function getWeakestLane(sg) {
    var weakest = 0, lowest = 2;
    for (var lane in sg.laneAccuracy) {
      if (sg.laneAccuracy[lane] < lowest) { lowest = sg.laneAccuracy[lane]; weakest = parseInt(lane, 10); }
    }
    return weakest;
  }

  function getStrongestSkill(sg) {
    var skills = { timing: sg.timing, rhythm: sg.rhythm, chordAccuracy: sg.chordAccuracy };
    var strongest = null, highest = -1;
    for (var key in skills) {
      if (skills[key] > highest) { highest = skills[key]; strongest = key; }
    }
    return strongest;
  }

  function getSkillDelta(sg, previousSnapshot) {
    return {
      timing: Math.round((sg.timing - (previousSnapshot.timing || 0)) * 100) / 100,
      rhythm: Math.round((sg.rhythm - (previousSnapshot.rhythm || 0)) * 100) / 100,
      chordAccuracy: Math.round((sg.chordAccuracy - (previousSnapshot.chordAccuracy || 0)) * 100) / 100
    };
  }

  function summarize(sg) {
    if (!sg) return null;
    var weakestSkill = getWeakestSkill(sg);
    var strongestSkill = getStrongestSkill(sg);
    var weakestLane = getWeakestLane(sg);
    return {
      weakestSkill: weakestSkill,
      weakestValue: weakestSkill ? sg[weakestSkill] || 0 : 0,
      strongestSkill: strongestSkill,
      strongestValue: strongestSkill ? sg[strongestSkill] || 0 : 0,
      weakestLane: weakestLane,
      weakestLaneValue: sg.laneAccuracy && sg.laneAccuracy[weakestLane] != null ? sg.laneAccuracy[weakestLane] : null
    };
  }

  var SparkSkillTracker = {
    create: create, update: update,
    getWeakestSkill: getWeakestSkill, getWeakestLane: getWeakestLane,
    getStrongestSkill: getStrongestSkill,
    getSkillDelta: getSkillDelta,
    summarize: summarize
  };

  if (typeof window !== "undefined") window.SparkSkillTracker = SparkSkillTracker;
  if (typeof module !== "undefined") module.exports = SparkSkillTracker;
})();
