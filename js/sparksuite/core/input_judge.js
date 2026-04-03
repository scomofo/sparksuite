(function() {
  function InputJudge() {}

  InputJudge.prototype.resolve = function(noteStates, inputEvent, preset) {
    preset = preset || SparkEnginePresetRegistry.get("spark_learning");
    var best = null;
    var bestDiff = Infinity;
    var missMs = preset.hitWindowMs.miss;

    for (var i = 0; i < noteStates.length; i++) {
      var note = noteStates[i];
      if (note.hit || note.missed) continue;
      var diffMs = (inputEvent.atSec - note.timeSec) * 1000;
      var absDiff = Math.abs(diffMs);
      if (absDiff <= missMs && absDiff < bestDiff) {
        best = note;
        bestDiff = absDiff;
      }
    }

    if (!best) {
      return { matched: false, reason: "no_target", judgement: "miss", note: null };
    }

    var inputMask = inputEvent.laneMask || 0;
    if (!laneMaskMatches(best.laneMask, inputMask, preset.extraFretTolerance)) {
      return { matched: true, reason: "wrong_fret", judgement: "miss", note: best, diffMs: inputEvent.atSec * 1000 - best.timeSec * 1000 };
    }

    var noteDiffMs = (inputEvent.atSec - best.timeSec) * 1000;
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
      note: best,
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
