(function() {
  'use strict';

  class SparkFretboardOverlay {
    draw(ctx, expected, actual, options) {
      options = options || {};
      var fretWidth = options.fretWidth || 60;
      var stringSpacing = options.stringSpacing || 30;
      var offsetX = options.offsetX || 40;
      var offsetY = options.offsetY || 20;

      // Draw expected positions as green rectangles
      if (expected && expected.length) {
        ctx.fillStyle = options.expectedColor || 'rgba(0, 200, 0, 0.5)';
        for (var i = 0; i < expected.length; i++) {
          var ep = expected[i];
          var ex = offsetX + (ep.fret - 0.5) * fretWidth;
          var ey = offsetY + ep.string * stringSpacing;
          ctx.fillRect(ex - 12, ey - 8, 24, 16);
        }
      }

      // Draw actual detected positions as red circles
      if (actual && actual.length) {
        ctx.fillStyle = options.actualColor || 'rgba(220, 0, 0, 0.6)';
        for (var j = 0; j < actual.length; j++) {
          var ap = actual[j];
          var ax = offsetX + (ap.fret - 0.5) * fretWidth;
          var ay = offsetY + ap.string * stringSpacing;
          ctx.beginPath();
          ctx.arc(ax, ay, 8, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }

  window.SparkFretboardOverlay = SparkFretboardOverlay;
})();
