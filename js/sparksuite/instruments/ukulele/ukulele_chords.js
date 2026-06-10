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
    A: [2, 1, 0, 0],
    D: [2, 2, 2, 0],
    E7: [1, 2, 0, 2],
    Bb: [1, 1, 2, 3],
    C7: [0, 0, 0, 1],
    Bm: [4, 2, 2, 2],
    Em7: [0, 2, 0, 2],
    Am7: [0, 0, 0, 0],
    Cmaj7: [0, 0, 0, 2]
  };
  var NOTES = {
    C: ["C", "E", "G"],
    Am: ["A", "C", "E"],
    F: ["F", "A", "C"],
    G: ["G", "B", "D"],
    G7: ["G", "B", "D", "F"],
    Dm: ["D", "F", "A"],
    Em: ["E", "G", "B"],
    A: ["A", "C#", "E"],
    D: ["D", "F#", "A"],
    E7: ["E", "G#", "B", "D"],
    Bb: ["Bb", "D", "F"],
    C7: ["C", "E", "G", "Bb"],
    Bm: ["B", "D", "F#"],
    Em7: ["E", "G", "B", "D"],
    Am7: ["A", "C", "E", "G"],
    Cmaj7: ["C", "E", "G", "B"]
  };
  var LEVEL_MAP = {
    1: ["C", "Am"],
    2: ["F", "G", "D", "E7"],
    3: ["G7", "Dm", "Bb", "C7"],
    4: ["Em", "A", "Bm", "Em7", "Am7", "Cmaj7"]
  };

  // Explicit finger assignments for standard ukulele technique
  var FINGERINGS = {
    C:     [[3, 3, 3, COLORS[2]]],                                          // ring on A3
    Am:    [[0, 2, 2, COLORS[1]]],                                          // middle on G2
    F:     [[0, 2, 2, COLORS[1]], [2, 1, 1, COLORS[0]]],                    // middle G2, index E1
    G:     [[1, 2, 1, COLORS[0]], [2, 3, 3, COLORS[2]], [3, 2, 2, COLORS[1]]], // index C2, ring E3, middle A2
    G7:    [[1, 2, 2, COLORS[1]], [2, 1, 1, COLORS[0]], [3, 2, 3, COLORS[2]]], // middle C2, index E1, ring A2
    Dm:    [[0, 2, 2, COLORS[1]], [1, 2, 3, COLORS[2]], [2, 1, 1, COLORS[0]]], // middle G2, ring C2, index E1
    Em:    [[1, 4, 4, COLORS[3]], [2, 3, 3, COLORS[2]], [3, 2, 2, COLORS[1]]], // pinky C4, ring E3, middle A2
    A:     [[0, 2, 2, COLORS[1]], [1, 1, 1, COLORS[0]]],                    // middle G2, index C1
    D:     [[0, 2, 1, COLORS[0]], [1, 2, 2, COLORS[1]], [2, 2, 3, COLORS[2]]], // index G2, middle C2, ring E2
    E7:    [[0, 1, 1, COLORS[0]], [1, 2, 2, COLORS[1]], [3, 2, 3, COLORS[2]]], // index G1, middle C2, ring A2
    Bb:    [[0, 1, 1, COLORS[0]], [1, 1, 1, COLORS[0]], [2, 2, 2, COLORS[1]], [3, 3, 3, COLORS[2]]], // barre index G1+C1, middle E2, ring A3
    C7:    [[3, 1, 1, COLORS[0]]],                                          // index A1
    Bm:    [[0, 4, 4, COLORS[3]], [1, 2, 1, COLORS[0]], [2, 2, 1, COLORS[0]], [3, 2, 1, COLORS[0]]], // pinky G4, barre index C2+E2+A2
    Em7:   [[1, 2, 1, COLORS[0]], [3, 2, 2, COLORS[1]]],                    // index C2, middle A2
    Am7:   [],                                                               // all open
    Cmaj7: [[3, 2, 2, COLORS[1]]]                                           // middle A2
  };

  function buildFingerDots(shape, name) {
    if (FINGERINGS[name]) return FINGERINGS[name].map(function(f) { return f.slice(); });
    // Fallback: sequential assignment
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
      fingers: buildFingerDots(shape, name),
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
