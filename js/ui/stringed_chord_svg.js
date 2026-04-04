// js/ui/stringed_chord_svg.js
// Generic stringed-instrument chord SVG renderer.
// Works for any string count: ukulele (4), bass (4), guitar (6), etc.
// Replaces the hardcoded sC=6 assumption in the legacy chordSVG() in js/ui.js.
//
// Public API (assigned to window):
//   stringedChordSVG(chart, options) -> SVG string
//
// chart object:
//   { name, instrument, stringCount, stringLabels,
//     fretCountVisible, startFret,
//     open,   // array of booleans indexed by string (true = open ring)
//     muted,  // array of string indices to mark X
//     fingers,// array of [stringIdx, fret, fingerNum, color]
//             //   OR {stringIndex, fret, finger, color}
//     barre   // { fret, fromString, toString } OR legacy {barFret, barStrings[]}
//   }
//
// options object:
//   { width, label, animate }

(function() {
  'use strict';

  // Normalise a single finger entry to [stringIdx, fret, fingerNum, color].
  function normFinger(f) {
    if (Array.isArray(f)) {
      return [f[0], f[1], f[2] !== undefined ? f[2] : 1, f[3] || '#FF6B6B'];
    }
    // Object format
    return [
      f.stringIndex !== undefined ? f.stringIndex : (f.string || 0),
      f.fret || 0,
      f.finger !== undefined ? f.finger : 1,
      f.color || '#FF6B6B'
    ];
  }

  // Normalise barre from either new format { fret, fromString, toString }
  // or legacy format { barFret, barStrings } (array of string indices).
  function normBarre(chart) {
    // New explicit barre field
    if (chart.barre) {
      var b = chart.barre;
      if (b.fret !== undefined) {
        return { fret: b.fret, fromString: b.fromString, toString: b.toString };
      }
    }
    // Legacy guitar format
    if (chart.barFret && chart.barStrings && chart.barStrings.length >= 2) {
      var bs = chart.barStrings;
      var mn = bs[0], mx = bs[0];
      for (var k = 1; k < bs.length; k++) {
        if (bs[k] < mn) mn = bs[k];
        if (bs[k] > mx) mx = bs[k];
      }
      return { fret: chart.barFret, fromString: mn, toString: mx };
    }
    return null;
  }

  function stringedChordSVG(chart, options) {
    chart   = chart   || {};
    options = options || {};

    var sz    = options.width  || 200;
    var label = options.label  || chart.name || 'chord';
    var animate = !!options.animate;

    // Layout constants — scale proportionally to base size 200
    var scale = sz / 200;
    var pL = Math.round(35 * scale);  // left pad (room for fret number / muted X)
    var pR = Math.round(20 * scale);  // right pad
    var pT = Math.round(30 * scale);  // top pad (room for open/muted markers)
    var pB = Math.round(20 * scale);  // bottom pad (room for string labels)
    var w  = sz;
    var h  = Math.round(sz * 1.3);

    var fC = chart.fretCountVisible || 4;   // number of fret rows visible
    var sC = chart.stringCount       || 6;  // number of strings

    var fH = (h - pT - pB) / fC;           // height of one fret row
    var sW = (w - pL - pR) / (sC - 1);     // horizontal gap between strings

    // Finger dots (normalised)
    var rawFingers = chart.fingers || [];
    var fingers = [];
    for (var fi = 0; fi < rawFingers.length; fi++) {
      fingers.push(normFinger(rawFingers[fi]));
    }

    // Barre (normalised)
    var barre = normBarre(chart);

    // ---- Auto-compute startFret ----
    var startFret = chart.startFret !== undefined ? chart.startFret : 0;
    if (chart.startFret === undefined) {
      var minF = 99, maxF = 0;
      for (var fi2 = 0; fi2 < fingers.length; fi2++) {
        var ff = fingers[fi2];
        if (ff[1] > 0) {
          if (ff[1] < minF) minF = ff[1];
          if (ff[1] > maxF) maxF = ff[1];
        }
      }
      if (barre) {
        if (barre.fret < minF) minF = barre.fret;
        if (barre.fret > maxF) maxF = barre.fret;
      }
      if (maxF > fC && minF < 99) startFret = minF - 1;
    }

    // ---- Build accessible description ----
    var accDesc = 'Chord diagram for ' + escHTML(label) + '.';
    if (fingers.length > 0) {
      accDesc += ' Fingers:';
      for (var fi3 = 0; fi3 < fingers.length; fi3++) {
        var fd = fingers[fi3];
        accDesc += ' finger ' + fd[2] + ' on string ' + (fd[0] + 1) + ' fret ' + fd[1];
        if (fi3 < fingers.length - 1) accDesc += ',';
      }
      accDesc += '.';
    }
    if (barre) accDesc += ' Barre at fret ' + barre.fret + '.';

    // ---- SVG open + ARIA ----
    var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"'
          + ' role="img" aria-label="' + escHTML(accDesc) + '">'
          + '<title>' + escHTML(accDesc) + '</title>';

    // ---- Nut or fret-number label ----
    if (startFret === 0) {
      s += '<rect x="' + pL + '" y="' + pT + '" width="' + (w - pL - pR) + '"'
         + ' height="' + Math.max(3, Math.round(4 * scale)) + '"'
         + ' fill="var(--svg-nut)" rx="2"/>';
    } else {
      s += '<line x1="' + pL + '" y1="' + pT + '" x2="' + (w - pR) + '" y2="' + pT + '"'
         + ' stroke="var(--svg-fret)" stroke-width="2"/>';
      s += '<text x="' + (pL - Math.round(18 * scale)) + '" y="' + (pT + fH * 0.5 + 5) + '"'
         + ' text-anchor="middle" font-size="' + Math.round(13 * scale) + '"'
         + ' fill="var(--text-muted)" font-weight="bold">' + (startFret + 1) + '</text>';
    }

    // ---- Fret lines ----
    for (var i = 0; i < fC; i++) {
      s += '<line x1="' + pL + '" y1="' + (pT + fH * (i + 1)) + '"'
         + ' x2="' + (w - pR) + '" y2="' + (pT + fH * (i + 1)) + '"'
         + ' stroke="var(--svg-fret)" stroke-width="1.5"/>';
    }

    // ---- String lines ----
    for (var i2 = 0; i2 < sC; i2++) {
      // Thicker strings toward the bass side (string 0); thinner toward treble.
      var strW = i2 < Math.floor(sC / 2) ? 2 : 1.2;
      s += '<line x1="' + (pL + i2 * sW) + '" y1="' + pT + '"'
         + ' x2="' + (pL + i2 * sW) + '" y2="' + (h - pB) + '"'
         + ' stroke="var(--svg-string)" stroke-width="' + strW + '"/>';
    }

    // ---- Muted strings (X markers) ----
    var muted = chart.muted || [];
    var mutedY = pT - Math.round(10 * scale);
    for (var i3 = 0; i3 < muted.length; i3++) {
      s += '<text x="' + (pL + muted[i3] * sW) + '" y="' + mutedY + '"'
         + ' text-anchor="middle" font-size="' + Math.round(14 * scale) + '"'
         + ' fill="#FF6B6B" font-weight="bold">X</text>';
    }

    // ---- Open string circles ----
    var openArr = chart.open || [];
    if (startFret === 0) {
      var openCY = pT - Math.round(12 * scale);
      var openR  = Math.round(6 * scale);
      for (var i4 = 0; i4 < openArr.length; i4++) {
        if (openArr[i4]) {
          s += '<circle cx="' + (pL + i4 * sW) + '" cy="' + openCY + '"'
             + ' r="' + openR + '" fill="none" stroke="#4ECDC4" stroke-width="2"/>';
        }
      }
    }

    // ---- Barre ----
    var isBarre = !!barre;
    var fDur     = 0.5;
    var fStagger = isBarre ? 0.2 : 0.3;
    var fDelay   = isBarre ? 0.6 : 0;

    if (barre) {
      var barFromX = pL + barre.fromString * sW - Math.round(10 * scale);
      var barToX   = pL + barre.toString  * sW + Math.round(10 * scale);
      var barW     = barToX - barFromX;
      var barH     = Math.round(16 * scale);
      var barY     = pT + (barre.fret - startFret - 0.5) * fH - barH / 2;
      var barCX    = barFromX + barW / 2;
      var barCY    = barY + barH / 2;
      var barAnim  = animate
        ? 'style="opacity:0;transform-origin:' + barCX + 'px ' + barCY + 'px;'
          + 'transform:scaleX(0);animation:barreIn 0.8s ease-out 0s forwards"'
        : 'style="opacity:0.85"';
      s += '<rect x="' + barFromX + '" y="' + barY + '"'
         + ' width="' + barW + '" height="' + barH + '"'
         + ' rx="' + (barH / 2) + '" fill="#FF6B6B" ' + barAnim + '/>';
    }

    // ---- Finger dots ----
    var dotR = Math.min(Math.round(12 * scale), Math.round(sz / 16));
    var dotFS = Math.min(Math.round(11 * scale), Math.round(sz / 18));
    for (var i5 = 0; i5 < fingers.length; i5++) {
      var f  = fingers[i5];
      var cx = pL + f[0] * sW;
      var cy = pT + (f[1] - startFret - 0.5) * fH;
      var animStyle = animate
        ? 'style="opacity:0;animation:fingerIn ' + fDur + 's ease-out '
          + (fDelay + i5 * fStagger) + 's forwards"'
        : '';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + dotR + '"'
         + ' fill="' + escHTML(f[3]) + '" stroke="#fff" stroke-width="2" ' + animStyle + '/>';
      s += '<text x="' + cx + '" y="' + (cy + Math.round(4 * scale)) + '"'
         + ' text-anchor="middle" font-size="' + dotFS + '"'
         + ' fill="#fff" font-weight="bold" ' + animStyle + '>' + f[2] + '</text>';
    }

    // ---- String labels ----
    var strLabels = chart.stringLabels || [];
    var labelY = h - Math.round(4 * scale);
    var labelFS = Math.round(10 * scale);
    for (var i6 = 0; i6 < sC; i6++) {
      var lbl = strLabels[i6] !== undefined ? strLabels[i6] : '';
      if (lbl === '') continue;
      s += '<text x="' + (pL + i6 * sW) + '" y="' + labelY + '"'
         + ' text-anchor="middle" font-size="' + labelFS + '"'
         + ' fill="var(--text-muted)">' + escHTML(String(lbl)) + '</text>';
    }

    return s + '</svg>';
  }

  window.stringedChordSVG = stringedChordSVG;
})();
