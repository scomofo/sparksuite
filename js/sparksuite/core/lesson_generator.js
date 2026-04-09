(function() {
  function generate(skillGraph) {
    if (!skillGraph) return null;

    if (skillGraph.timing < 0.6) {
      return { type: "timing_drill", mode: "practice", tempo: 60, pattern: "D D D D", lane: null, duration: 30, label: "Timing: Steady Beat" };
    }

    var weakLane = findWeakLane(skillGraph.laneAccuracy);
    if (weakLane !== null) {
      return { type: "lane_drill", mode: "practice", tempo: 80, pattern: "D D D D", lane: weakLane, duration: 30, label: "Lane Focus: Lane " + (weakLane + 1) };
    }

    if (skillGraph.chordAccuracy < 0.7) {
      return { type: "chord_drill", mode: "practice", tempo: 70, pattern: "D D U U D U", lane: null, duration: 30, label: "Chord Transitions" };
    }

    return null;
  }

  function findWeakLane(laneAccuracy) {
    if (!laneAccuracy) return null;
    var weakest = null, lowest = 0.5;
    for (var lane in laneAccuracy) {
      if (laneAccuracy[lane] < lowest) { lowest = laneAccuracy[lane]; weakest = parseInt(lane, 10); }
    }
    return weakest;
  }

  var SparkLessonGenerator = { generate: generate };
  if (typeof window !== "undefined") window.SparkLessonGenerator = SparkLessonGenerator;
  if (typeof module !== "undefined") module.exports = SparkLessonGenerator;
})();
