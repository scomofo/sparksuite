(function() {
  /**
   * SparkFretboardRenderer -- draws a guitar/ukulele fretboard on a canvas.
   * Used for visual play-along overlays during Spotify sessions.
   */
  var DEFAULTS = {
    strings: 6,
    frets: 12,
    stringSpacing: 20,
    fretSpacing: 60,
    dotColor: "#4CAF50",
    stringColor: "#888",
    fretColor: "#555",
    nutColor: "#333",
    dotRadius: 7
  };

  function FretboardRenderer(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.strings = options.strings || DEFAULTS.strings;
    this.frets = options.frets || DEFAULTS.frets;
    this.stringSpacing = options.stringSpacing || DEFAULTS.stringSpacing;
    this.fretSpacing = options.fretSpacing || DEFAULTS.fretSpacing;
  }

  FretboardRenderer.prototype.draw = function() {
    var ctx = this.ctx;
    var w = this.frets * this.fretSpacing;
    var h = (this.strings - 1) * this.stringSpacing;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw nut
    ctx.fillStyle = DEFAULTS.nutColor;
    ctx.fillRect(0, 0, 4, h + this.stringSpacing);

    // Draw frets
    ctx.strokeStyle = DEFAULTS.fretColor;
    ctx.lineWidth = 2;
    for (var f = 1; f <= this.frets; f++) {
      var x = f * this.fretSpacing;
      ctx.beginPath();
      ctx.moveTo(x, this.stringSpacing / 2);
      ctx.lineTo(x, h + this.stringSpacing / 2);
      ctx.stroke();
    }

    // Draw strings
    ctx.strokeStyle = DEFAULTS.stringColor;
    for (var s = 0; s < this.strings; s++) {
      var y = s * this.stringSpacing + this.stringSpacing / 2;
      ctx.lineWidth = 1 + (s * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  /**
   * Highlight a fret position on a specific string.
   * @param {number} stringIndex - 0-based (0 = high E)
   * @param {number} fret - fret number (0 = open)
   * @param {string} [color] - dot color
   */
  FretboardRenderer.prototype.highlight = function(stringIndex, fret, color) {
    if (fret < 0) return; // muted string
    var ctx = this.ctx;
    var x = fret === 0 ? 10 : (fret - 0.5) * this.fretSpacing;
    var y = stringIndex * this.stringSpacing + this.stringSpacing / 2;

    ctx.fillStyle = color || DEFAULTS.dotColor;
    ctx.beginPath();
    ctx.arc(x, y, DEFAULTS.dotRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  /**
   * Draw a chord shape on the fretboard.
   * @param {Array<number>} shape - fret per string [-1=muted, 0=open, 1+=fretted]
   * @param {string} [color]
   */
  FretboardRenderer.prototype.drawChordShape = function(shape, color) {
    if (!shape || !shape.length) return;
    for (var i = 0; i < shape.length; i++) {
      if (shape[i] >= 0) this.highlight(i, shape[i], color);
    }
  };

  window.SparkFretboardRenderer = FretboardRenderer;
})();
