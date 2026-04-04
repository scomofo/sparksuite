// js/instruments/ukulele/ukulele_svg.js
// Ukulele-specific chord renderer wrapper.
// Normalizes input, validates in dev mode, then calls the generic renderer.
(function() {

  function ukuleleSVG(chordObj, options) {
    options = options || {};
    var source = chordObj || {};

    // If already a normalized chart with instrument=ukulele, use directly
    var chart;
    if (source.instrument === "ukulele" && source.stringCount === 4 && source.fingers) {
      chart = source;
    } else {
      // Normalize from compact source
      chart = normalizeUkuleleChord(source);
    }

    // Dev-mode validation (log warnings, don't break rendering)
    if (typeof validateChordChart === "function") {
      var errors = validateChordChart(chart);
      if (errors.length > 0) {
        console.warn("[UkuleleSVG] Validation errors for " + (chart.name || "unknown") + ":", errors);
      }
    }

    // Merge options with ukulele defaults
    var renderOpts = {
      width: options.width || options.size || 170,
      label: options.label || chart.name,
      animate: options.animate || false
    };

    return stringedChordSVG(chart, renderOpts);
  }

  window.ukuleleSVG = ukuleleSVG;
})();
