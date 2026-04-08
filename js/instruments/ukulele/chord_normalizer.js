// js/instruments/ukulele/chord_normalizer.js
// Converts compact ukulele shape arrays into normalized chart objects
// consumed by stringedChordSVG().
//
// Public API (assigned to window):
//   normalizeUkuleleChord(source) -> chart object
//
// source object:
//   { name, shape OR frets, fingers (optional), barre (optional) }
//   shape/frets: array of 4 integers [G, C, E, A] where
//     0  = open string
//     >0 = fret number
//     -1 or "x"/"X" = muted

(function() {
  'use strict';

  var TUNING        = ['G4', 'C4', 'E4', 'A4'];
  var STRING_LABELS = ['G', 'C', 'E', 'A'];
  var FINGER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFE66D'];
  var STRING_COUNT  = 4;
  var FRET_VISIBLE  = 4;

  // Normalize a raw finger entry to the object form expected by the chart spec.
  // Accepts array [stringIdx, fret, num, color] or object {stringIndex, fret, finger, color}.
  function normFingerEntry(f, fallbackNum, fallbackColor) {
    if (Array.isArray(f)) {
      return {
        stringIndex: f[0],
        fret:        f[1],
        finger:      f[2] !== undefined ? f[2] : fallbackNum,
        color:       f[3] || fallbackColor
      };
    }
    return {
      stringIndex: f.stringIndex !== undefined ? f.stringIndex : (f.string || 0),
      fret:        f.fret  || 0,
      finger:      f.finger !== undefined ? f.finger : fallbackNum,
      color:       f.color || fallbackColor
    };
  }

  // Build auto-assigned finger objects from a shape array.
  // Assigns finger numbers 1,2,3,4 in order of encounter (skipping open/muted).
  function buildFingersFromShape(shape) {
    var fingers = [];
    var fingerNum = 1;
    for (var i = 0; i < shape.length; i++) {
      var fret = shape[i];
      if (typeof fret === 'string') fret = (fret === 'x' || fret === 'X') ? -1 : parseInt(fret, 10);
      if (fret <= 0) continue;
      fingers.push({
        stringIndex: i,
        fret:        fret,
        finger:      fingerNum,
        color:       FINGER_COLORS[(fingerNum - 1) % FINGER_COLORS.length]
      });
      fingerNum++;
    }
    return fingers;
  }

  // Resolve finger list from a source that provides explicit fingers array.
  // Ensures each entry becomes the normalized object form.
  function resolveFingers(sourceFingers) {
    var fingers = [];
    var fingerNum = 1;
    for (var i = 0; i < sourceFingers.length; i++) {
      var f = normFingerEntry(
        sourceFingers[i],
        fingerNum,
        FINGER_COLORS[(fingerNum - 1) % FINGER_COLORS.length]
      );
      fingers.push(f);
      fingerNum++;
    }
    return fingers;
  }

  // Compute startFret and possibly expand fretCountVisible.
  // Returns { startFret, fretCountVisible }.
  function computeFretWindow(fingers, barreObj) {
    var minF = Infinity;
    var maxF = 0;

    for (var i = 0; i < fingers.length; i++) {
      var fret = fingers[i].fret;
      if (fret > 0) {
        if (fret < minF) minF = fret;
        if (fret > maxF) maxF = fret;
      }
    }

    if (barreObj && barreObj.fret) {
      if (barreObj.fret < minF) minF = barreObj.fret;
      if (barreObj.fret > maxF) maxF = barreObj.fret;
    }

    // No fretted notes at all — open chord, show from fret 0
    if (maxF === 0 || minF === Infinity) {
      return { startFret: 0, fretCountVisible: FRET_VISIBLE };
    }

    var span = maxF - minF + 1;

    // All fingers fit within the default visible window starting at fret 0
    if (maxF <= FRET_VISIBLE) {
      return { startFret: 0, fretCountVisible: FRET_VISIBLE };
    }

    // Need to shift the window: start one fret below the lowest fretted note
    var startFret = Math.max(0, minF - 1);

    // If the span of frets exceeds the visible window, expand it
    var fretCountVisible = Math.max(FRET_VISIBLE, span);

    return { startFret: startFret, fretCountVisible: fretCountVisible };
  }

  function normalizeUkuleleChord(source) {
    source = source || {};

    var name  = source.name  || 'chord';
    var shape = source.shape || source.frets || [0, 0, 0, 0];

    // Normalise shape values: convert "x"/"X" to -1
    var normalizedShape = [];
    for (var i = 0; i < STRING_COUNT; i++) {
      var raw = shape[i] !== undefined ? shape[i] : 0;
      if (typeof raw === 'string') {
        raw = (raw === 'x' || raw === 'X') ? -1 : parseInt(raw, 10);
      }
      normalizedShape.push(raw);
    }

    // Build open / muted arrays
    var openArr  = [];
    var mutedArr = [];
    for (var j = 0; j < STRING_COUNT; j++) {
      openArr.push(normalizedShape[j] === 0);
      if (normalizedShape[j] === -1) mutedArr.push(j);
    }

    // Resolve fingers
    var fingers;
    if (source.fingers && source.fingers.length > 0) {
      fingers = resolveFingers(source.fingers);
    } else {
      fingers = buildFingersFromShape(normalizedShape);
    }

    // Resolve barre
    var barre = null;
    if (source.barre) {
      var b = source.barre;
      if (b.fret !== undefined) {
        barre = { fret: b.fret, fromString: b.fromString || 0, toString: b.toString || STRING_COUNT - 1 };
      }
    }

    // Compute fret window
    var window_ = computeFretWindow(fingers, barre);

    return {
      name:             name,
      instrument:       'ukulele',
      stringCount:      STRING_COUNT,
      tuning:           TUNING.slice(),
      stringLabels:     STRING_LABELS.slice(),
      fretCountVisible: window_.fretCountVisible,
      startFret:        window_.startFret,
      open:             openArr,
      muted:            mutedArr,
      fingers:          fingers,
      barre:            barre
    };
  }

  window.normalizeUkuleleChord = normalizeUkuleleChord;
})();
