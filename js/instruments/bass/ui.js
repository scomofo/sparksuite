// js/instruments/bass/ui.js
// Bass fretboard SVG renderer (4 strings)
(function() {

  function bassSVG(noteObj, size, label, animate) {
    if (!noteObj) return "";
    size = size || 120;
    var strings = 4;
    var frets = 5;
    var w = size;
    var h = size * 1.2;
    var padL = 20, padR = 10, padT = 20, padB = 10;
    var fretW = (w - padL - padR) / frets;
    var strH = (h - padT - padB) / (strings - 1);

    var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"' +
      (animate ? ' class="chord-morph"' : '') + '>';

    // Nut
    svg += '<rect x="' + padL + '" y="' + (padT - 2) + '" width="3" height="' + ((strings - 1) * strH + 4) + '" fill="var(--text-primary)" rx="1"/>';

    // Fret lines
    for (var f = 1; f <= frets; f++) {
      var fx = padL + f * fretW;
      svg += '<line x1="' + fx + '" y1="' + padT + '" x2="' + fx + '" y2="' + (padT + (strings - 1) * strH) + '" stroke="var(--border)" stroke-width="1.5"/>';
    }

    // String lines + labels
    var stringNames = ["E", "A", "D", "G"];
    for (var s = 0; s < strings; s++) {
      var sy = padT + s * strH;
      var thick = 3 - s * 0.5;
      svg += '<line x1="' + padL + '" y1="' + sy + '" x2="' + (w - padR) + '" y2="' + sy + '" stroke="var(--text-muted)" stroke-width="' + thick + '" opacity="0.6"/>';
      svg += '<text x="8" y="' + (sy + 4) + '" font-size="10" fill="var(--text-muted)" text-anchor="middle">' + stringNames[s] + '</text>';
    }

    // Finger dots
    var fingers = noteObj.fingers || [];
    for (var i = 0; i < fingers.length; i++) {
      var fg = fingers[i];
      var fStr = fg[0], fFret = fg[1], fFinger = fg[2], fColor = fg[3] || "#FF6B6B";
      if (fFret > 0) {
        var cx = padL + (fFret - 0.5) * fretW;
        var cy = padT + fStr * strH;
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.min(fretW * 0.35, 12) + '" fill="' + fColor + '"/>';
        if (fFinger) {
          svg += '<text x="' + cx + '" y="' + (cy + 4) + '" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">' + fFinger + '</text>';
        }
      }
    }

    // Open string indicators
    var fretArr = noteObj.frets || [];
    for (var s2 = 0; s2 < fretArr.length; s2++) {
      if (fretArr[s2] === 0) {
        var oy = padT + s2 * strH;
        svg += '<circle cx="' + (padL - 6) + '" cy="' + oy + '" r="4" fill="none" stroke="var(--accent)" stroke-width="1.5"/>';
      }
    }

    // Label
    if (label || noteObj.name) {
      svg += '<text x="' + (w / 2) + '" y="' + (h - 2) + '" font-size="12" fill="var(--text-primary)" text-anchor="middle" font-weight="700">' + (label || noteObj.short || noteObj.name) + '</text>';
    }

    svg += '</svg>';
    return svg;
  }

  window.bassSVG = bassSVG;
})();
