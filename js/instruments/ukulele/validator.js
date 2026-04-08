// js/instruments/ukulele/validator.js
// Validates normalized ukulele chord chart objects produced by normalizeUkuleleChord().
//
// Public API (assigned to window):
//   validateChordChart(chart) -> string[]  (empty = valid)
//
// chart shape (from chord_normalizer.js):
//   { stringCount, tuning, stringLabels, open, muted, fingers, barre, ... }
//   open:   [true, false, true, false]  — booleans indexed by string
//   muted:  [0, 2]                      — array of muted string INDEX numbers
//   fingers: array of {stringIndex, fret, finger, color}
//            OR array form [stringIdx, fret, fingerNum, color]

(function () {
  'use strict';

  function validateChordChart(chart) {
    var errors = [];

    // 1. chart must exist
    if (chart === null || chart === undefined) {
      errors.push('chart is null or undefined');
      return errors;
    }

    var sc = chart.stringCount;

    // 2. stringCount must match tuning.length and stringLabels.length
    if (typeof sc !== 'number' || sc < 1) {
      errors.push('stringCount must be a positive number, got: ' + sc);
    } else {
      if (!Array.isArray(chart.tuning)) {
        errors.push('tuning must be an array');
      } else if (chart.tuning.length !== sc) {
        errors.push('tuning.length (' + chart.tuning.length + ') does not match stringCount (' + sc + ')');
      }

      if (!Array.isArray(chart.stringLabels)) {
        errors.push('stringLabels must be an array');
      } else if (chart.stringLabels.length !== sc) {
        errors.push('stringLabels.length (' + chart.stringLabels.length + ') does not match stringCount (' + sc + ')');
      }
    }

    // 3. open.length must match stringCount
    if (!Array.isArray(chart.open)) {
      errors.push('open must be an array');
    } else if (typeof sc === 'number' && sc >= 1 && chart.open.length !== sc) {
      errors.push('open.length (' + chart.open.length + ') does not match stringCount (' + sc + ')');
    }

    // 4. muted entries must be valid string indices
    if (!Array.isArray(chart.muted)) {
      errors.push('muted must be an array');
    } else if (typeof sc === 'number' && sc >= 1) {
      for (var mi = 0; mi < chart.muted.length; mi++) {
        var mIdx = chart.muted[mi];
        if (typeof mIdx !== 'number' || !Number.isInteger(mIdx) || mIdx < 0 || mIdx >= sc) {
          errors.push('muted[' + mi + '] is not a valid string index (0..' + (sc - 1) + '): ' + mIdx);
        }
      }
    }

    // 11. open and muted conflict: muted index cannot have open[idx] === true
    if (Array.isArray(chart.open) && Array.isArray(chart.muted)) {
      for (var omi = 0; omi < chart.muted.length; omi++) {
        var omIdx = chart.muted[omi];
        if (typeof omIdx === 'number' && Number.isInteger(omIdx) && omIdx >= 0 && omIdx < chart.open.length) {
          if (chart.open[omIdx] === true) {
            errors.push('string ' + omIdx + ' appears in muted but open[' + omIdx + '] is true');
          }
        }
      }
    }

    // Validate fingers array
    if (!Array.isArray(chart.fingers)) {
      errors.push('fingers must be an array');
    } else {
      // Build a set of muted indices for quick lookup
      var mutedSet = {};
      if (Array.isArray(chart.muted)) {
        for (var ms = 0; ms < chart.muted.length; ms++) {
          mutedSet[chart.muted[ms]] = true;
        }
      }

      // Track seen string+fret combinations for duplicate detection
      var seen = {};

      for (var fi = 0; fi < chart.fingers.length; fi++) {
        var raw = chart.fingers[fi];
        var sIdx, fret, fingerNum;

        // 13. Normalize array vs object form
        if (Array.isArray(raw)) {
          sIdx      = raw[0];
          fret      = raw[1];
          fingerNum = raw[2];
        } else if (raw !== null && typeof raw === 'object') {
          sIdx      = raw.stringIndex;
          fret      = raw.fret;
          fingerNum = raw.finger;
        } else {
          errors.push('fingers[' + fi + '] must be an object or array, got: ' + typeof raw);
          continue;
        }

        // 5. stringIndex must be within 0..stringCount-1
        if (typeof sc === 'number' && sc >= 1) {
          if (typeof sIdx !== 'number' || sIdx < 0 || sIdx >= sc) {
            errors.push('fingers[' + fi + '].stringIndex (' + sIdx + ') is outside 0..' + (sc - 1));
          }
        }

        // 6. fret must be >= 1
        if (typeof fret !== 'number' || fret < 1) {
          errors.push('fingers[' + fi + '].fret must be >= 1, got: ' + fret);
        }

        // 7. finger numbers should be 1..4 for ukulele
        if (typeof fingerNum !== 'number' || fingerNum < 1 || fingerNum > 4) {
          errors.push('fingers[' + fi + '].finger should be 1..4 for ukulele, got: ' + fingerNum);
        }

        // 8. No duplicate fingers at same string+fret
        var key = sIdx + ':' + fret;
        if (seen[key]) {
          errors.push('duplicate finger at string ' + sIdx + ', fret ' + fret);
        } else {
          seen[key] = true;
        }

        // 9. A string cannot be both open and fingered
        if (Array.isArray(chart.open) && typeof sIdx === 'number' && sIdx >= 0 && sIdx < chart.open.length) {
          if (chart.open[sIdx] === true) {
            errors.push('string ' + sIdx + ' is marked open but has a finger at fret ' + fret);
          }
        }

        // 10. A muted string cannot be fingered
        if (typeof sIdx === 'number' && mutedSet[sIdx]) {
          errors.push('string ' + sIdx + ' is muted but has a finger at fret ' + fret);
        }
      }
    }

    // 12. Barre validation (if present)
    if (chart.barre !== null && chart.barre !== undefined) {
      var b = chart.barre;

      if (typeof b.fret !== 'number' || b.fret < 1) {
        errors.push('barre.fret must be >= 1, got: ' + b.fret);
      }

      if (typeof sc === 'number' && sc >= 1) {
        if (typeof b.fromString !== 'number' || b.fromString < 0 || b.fromString >= sc) {
          errors.push('barre.fromString (' + b.fromString + ') is outside 0..' + (sc - 1));
        }
        if (typeof b.toString !== 'number' || b.toString < 0 || b.toString >= sc) {
          errors.push('barre.toString (' + b.toString + ') is outside 0..' + (sc - 1));
        }
      }
    }

    return errors;
  }

  window.validateChordChart = validateChordChart;
})();
