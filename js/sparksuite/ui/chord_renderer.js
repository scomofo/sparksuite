(function() {
  /**
   * SparkChordRenderer -- draws chord diagrams and transitions.
   * Used alongside FretboardRenderer for play-along visualization.
   */

  // Standard chord shapes (guitar, standard tuning)
  var CHORD_SHAPES = {
    "C":  [-1, 3, 2, 0, 1, 0],
    "D":  [-1, -1, 0, 2, 3, 2],
    "E":  [0, 2, 2, 1, 0, 0],
    "F":  [1, 3, 3, 2, 1, 1],
    "G":  [3, 2, 0, 0, 0, 3],
    "A":  [-1, 0, 2, 2, 2, 0],
    "B":  [-1, 2, 4, 4, 4, 2],
    "Am": [-1, 0, 2, 2, 1, 0],
    "Bm": [-1, 2, 4, 4, 3, 2],
    "Cm": [-1, 3, 5, 5, 4, 3],
    "Dm": [-1, -1, 0, 2, 3, 1],
    "Em": [0, 2, 2, 0, 0, 0],
    "Fm": [1, 3, 3, 1, 1, 1]
  };

  function ChordRenderer() {}

  /**
   * Draw a chord shape on a canvas context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<number>} chordShape - fret per string
   * @param {Object} [options] - { x, y, scale, color }
   */
  ChordRenderer.prototype.drawChord = function(ctx, chordShape, options) {
    options = options || {};
    var x = options.x || 0;
    var y = options.y || 0;
    var scale = options.scale || 1;
    var color = options.color || "#4CAF50";

    if (!chordShape || !chordShape.length) return;

    for (var s = 0; s < chordShape.length; s++) {
      var fret = chordShape[s];
      if (fret < 0) continue; // muted
      var dotX = x + (fret === 0 ? 10 : (fret - 0.5) * 60) * scale;
      var dotY = y + s * 20 * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /**
   * Get the standard chord shape for a chord name.
   * @param {string} chordName
   * @returns {Array<number>|null}
   */
  ChordRenderer.prototype.getShape = function(chordName) {
    return CHORD_SHAPES[chordName] || null;
  };

  /**
   * Draw a named chord using standard shapes.
   */
  ChordRenderer.prototype.drawNamedChord = function(ctx, chordName, options) {
    var shape = this.getShape(chordName);
    if (shape) this.drawChord(ctx, shape, options);
  };

  window.SparkChordRenderer = ChordRenderer;
  window.SparkChordShapes = CHORD_SHAPES;
})();
