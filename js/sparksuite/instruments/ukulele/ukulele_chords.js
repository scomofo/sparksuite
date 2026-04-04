(function() {
  var COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFE66D"];
  var SHAPES = {
    C: [0, 0, 0, 3],
    Am: [2, 0, 0, 0],
    F: [2, 0, 1, 0],
    G: [0, 2, 3, 2],
    G7: [0, 2, 1, 2],
    Dm: [2, 2, 1, 0],
    Em: [0, 4, 3, 2],
    A: [2, 1, 0, 0]
  };
  var NOTES = {
    C: ["C", "E", "G"],
    Am: ["A", "C", "E"],
    F: ["F", "A", "C"],
    G: ["G", "B", "D"],
    G7: ["G", "B", "D", "F"],
    Dm: ["D", "F", "A"],
    Em: ["E", "G", "B"],
    A: ["A", "C#", "E"]
  };
  var LEVEL_MAP = {
    1: ["C", "Am"],
    2: ["F", "G"],
    3: ["G7", "Dm"],
    4: ["Em", "A"]
  };

  function buildFingerDots(shape) {
    var fingers = [];
    var fingerNum = 1;
    for (var i = 0; i < shape.length; i++) {
      if (shape[i] <= 0) continue;
      fingers.push([i, shape[i], fingerNum, COLORS[(fingerNum - 1) % COLORS.length]]);
      fingerNum++;
    }
    return fingers;
  }

  function buildChord(name) {
    var shape = SHAPES[name] || [0, 0, 0, 0];
    return {
      name: name,
      short: name,
      frets: shape.slice(),
      open: shape.map(function(fret) { return fret === 0; }),
      muted: [],
      fingers: buildFingerDots(shape),
      stringCount: 4,
      stringNames: ["G", "C", "E", "A"]
    };
  }

  var levelChords = {};
  var allChords = [];
  for (var level in LEVEL_MAP) {
    if (!Object.prototype.hasOwnProperty.call(LEVEL_MAP, level)) continue;
    levelChords[level] = [];
    for (var i = 0; i < LEVEL_MAP[level].length; i++) {
      var chord = buildChord(LEVEL_MAP[level][i]);
      levelChords[level].push(chord);
      allChords.push(chord);
    }
  }

  window.SparkUkuleleChords = SHAPES;
  window.SparkUkuleleChordNotes = NOTES;
  window.SparkUkuleleLevelChords = levelChords;
  window.SparkUkuleleAllChords = allChords;

  // Dev validation: check all chords through normalizer + validator
  if (typeof normalizeUkuleleChord === "function" && typeof validateChordChart === "function") {
    for (var i = 0; i < allChords.length; i++) {
      var normalized = normalizeUkuleleChord(allChords[i]);
      var errors = validateChordChart(normalized);
      if (errors.length > 0) {
        console.warn("[UkuleleChords] Validation errors for " + allChords[i].name + ":", errors);
      }
    }
  }
})();
