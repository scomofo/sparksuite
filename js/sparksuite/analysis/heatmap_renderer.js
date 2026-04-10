(function() {
  /**
   * SparkHeatmapRenderer -- draws mistake heatmaps on a canvas.
   * Red = frequent misses, green = consistent hits.
   */
  function HeatmapRenderer() {}

  /**
   * Draw a heatmap overlay.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} heatmap - from HeatmapGenerator.generate()
   * @param {Object} [options] - { cellWidth, cellHeight, offsetX, offsetY }
   */
  HeatmapRenderer.prototype.draw = function(ctx, heatmap, options) {
    options = options || {};
    var cellW = options.cellWidth || 50;
    var cellH = options.cellHeight || 20;
    var offX = options.offsetX || 0;
    var offY = options.offsetY || 0;

    for (var key in heatmap) {
      var b = heatmap[key];
      var x = offX + b.timeBucket * cellW;
      var y = offY + b.lane * cellH;
      var r = Math.round(255 * b.intensity);
      var g = Math.round(255 * (1 - b.intensity));

      ctx.fillStyle = "rgba(" + r + "," + g + ",0,0.6)";
      ctx.fillRect(x, y, cellW - 2, cellH - 2);
    }
  };

  window.SparkHeatmapRenderer = HeatmapRenderer;
})();
