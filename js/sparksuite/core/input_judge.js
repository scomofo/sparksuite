(function() {
  function InputJudge() {}

  InputJudge.prototype.resolve = function(noteStates, inputEvent, preset) {
    if (!Array.isArray(noteStates) || !inputEvent || typeof inputEvent.atSec !== "number") {
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

  // Snapshot-model twin of resolve(): performance mode polls a continuous
  // input snapshot instead of consuming discrete input events, but target
  // selection follows the same rule — prefer the closest candidate whose
  // expected notes the input fully covers, and only fall back to the
  // closest partial match when nothing in the window matches fully.
  // candidates: [{ absDiffMs, fullMatch, ... }], pre-filtered to in-window
  // scorable events. Returns the chosen candidate, or null.
  InputJudge.prototype.selectSnapshotTarget = function(candidates) {
    if (!Array.isArray(candidates) || !candidates.length) return null;
    var best = null;
    var bestDiff = Infinity;
    var bestMatch = null;
    var bestMatchDiff = Infinity;
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      if (!candidate) continue;
      var absDiff = typeof candidate.absDiffMs === "number" ? candidate.absDiffMs : Infinity;
      if (absDiff < bestDiff) {
        best = candidate;
        bestDiff = absDiff;
      }
      if (candidate.fullMatch && absDiff < bestMatchDiff) {
        bestMatch = candidate;
        bestMatchDiff = absDiff;
      }
    }
    return bestMatch || best;
  };

  function laneMaskMatches(expected, actual, allowExtraFretTolerance) {
    if (expected === actual) return true;
    if (!allowExtraFretTolerance) return false;
    return (actual & expected) === expected;
  }

  window.SparkInputJudge = InputJudge;
})();
