(function() {
  var CHORD_TONES = {
    "C": ["C","E","G"], "D": ["D","F#","A"], "E": ["E","G#","B"], "F": ["F","A","C"],
    "G": ["G","B","D"], "A": ["A","C#","E"], "B": ["B","D#","F#"],
    "Am": ["A","C","E"], "Dm": ["D","F","A"], "Em": ["E","G","B"],
    "Bm": ["B","D","F#"], "Cm": ["C","D#","G"], "Fm": ["F","G#","C"],
    "C7": ["C","E","G","Bb"], "D7": ["D","F#","A","C"], "G7": ["G","B","D","F"],
    "A7": ["A","C#","E","G"], "E7": ["E","G#","B","D"]
  };

  function ChordConfidence() {}

  ChordConfidence.prototype.score = function(expectedChord, detectedNotes, options) {
    options = options || {};
    var expected = CHORD_TONES[expectedChord];
    if (!expected || !expected.length) return { chord: expectedChord, confidence: 0, issues: ["unknown chord"], timing: null };
    if (!detectedNotes || !detectedNotes.length) return { chord: expectedChord, confidence: 0, issues: ["no notes detected"], timing: null };

    var matches = 0;
    var missing = [];
    for (var i = 0; i < expected.length; i++) {
      if (detectedNotes.indexOf(expected[i]) >= 0) matches++;
      else missing.push("missing " + expected[i]);
    }

    var coverage = matches / expected.length;

    var extra = [];
    for (var j = 0; j < detectedNotes.length; j++) {
      if (expected.indexOf(detectedNotes[j]) < 0) extra.push("extra " + detectedNotes[j]);
    }
    var penalty = extra.length * 0.1;

    var harmonicScore = Math.max(0, coverage - penalty);

    var timingFactor = 1;
    var timingLabel = null;
    if (options.timingErrorMs != null) {
      var absErr = Math.abs(options.timingErrorMs);
      timingFactor = Math.max(0, 1 - (absErr / 150));
      timingLabel = absErr < 40 ? "perfect" : (options.timingErrorMs > 0 ? "late" : "early");
    }

    var stabilityFactor = options.stability != null ? Math.max(0, Math.min(1, options.stability)) : 1;

    var confidence = harmonicScore * timingFactor * stabilityFactor;
    confidence = Math.round(confidence * 100) / 100;

    return {
      chord: expectedChord,
      confidence: confidence,
      harmonicScore: Math.round(harmonicScore * 100) / 100,
      coverage: Math.round(coverage * 100) / 100,
      issues: missing.concat(extra),
      timing: timingLabel,
      rating: confidence > 0.85 ? "green" : (confidence > 0.6 ? "yellow" : "red")
    };
  };

  ChordConfidence.prototype.getChordTones = function(chord) {
    return CHORD_TONES[chord] || [];
  };

  window.SparkChordConfidence = ChordConfidence;
})();
