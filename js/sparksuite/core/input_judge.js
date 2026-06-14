(function() {
  function InputJudge() {}

  InputJudge.prototype.resolve = function(noteStates, inputEvent, preset) {
    if (!inputEvent || typeof inputEvent.atSec !== "number") {
      return { matched: false, reason: "no_target", judgement: "miss", note: null };
    }
    preset = preset || SparkEnginePresetRegistry.get("spark_learning");
    var missMs = preset.hitWindowMs.miss;
    var inputMask = inputEvent.laneMask || 0;

    var best = null;        // closest in-window note, any lane
    var bestDiff = Infinity;
    var bestMatch = null;   // closest in-window note whose lane matches the input
    var bestMatchDiff = Infinity;

    for (var i = 0; i < noteStates.length; i++) {
      var note = noteStates[i];
      if (note.hit || note.missed) continue;
      var diffMs = (inputEvent.atSec - note.timeSec) * 1000;
      var absDiff = Math.abs(diffMs);
      if (absDiff > missMs) continue;
      if (absDiff < bestDiff) {
        best = note;
        bestDiff = absDiff;
      }
      if (laneMaskMatches(note.laneMask, inputMask, preset.extraFretTolerance) && absDiff < bestMatchDiff) {
        bestMatch = note;
        bestMatchDiff = absDiff;
      }
    }

    if (!best) {
      return { matched: false, reason: "no_target", judgement: "miss", note: null };
    }

    // Prefer the closest LANE-MATCHING note in the window. Only emit a wrong_fret
    // verdict when there is genuinely no lane-matching note to hit — otherwise a
    // fractionally-closer wrong-lane note would steal the input and produce an
    // unearned wrong_fret miss while a correct-lane note was perfectly hittable
    // (common on fast lane changes within the miss window).
    if (!bestMatch) {
      return { matched: true, reason: "wrong_fret", judgement: "miss", note: best, diffMs: inputEvent.atSec * 1000 - best.timeSec * 1000 };
    }

    var target = bestMatch;
    var noteDiffMs = (inputEvent.atSec - target.timeSec) * 1000;
    var absNoteDiff = Math.abs(noteDiffMs);
    var judgement = "miss";
    var reason = noteDiffMs < 0 ? "early" : "late";
    if (absNoteDiff <= preset.hitWindowMs.perfect) judgement = "perfect";
    else if (absNoteDiff <= preset.hitWindowMs.good) judgement = "good";
    else if (absNoteDiff <= preset.hitWindowMs.miss) judgement = "ok";

    return {
      matched: true,
      reason: judgement === "miss" ? reason : "hit",
      judgement: judgement,
      note: target,
      diffMs: noteDiffMs
    };
  };

  function laneMaskMatches(expected, actual, allowExtraFretTolerance) {
    if (expected === actual) return true;
    if (!allowExtraFretTolerance) return false;
    return (actual & expected) === expected;
  }

  window.SparkInputJudge = InputJudge;
})();
