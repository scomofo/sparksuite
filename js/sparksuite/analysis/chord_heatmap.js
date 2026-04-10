(function() {
  var BUCKET_MS = 2000;

  function ChordHeatmap() {}

  ChordHeatmap.prototype.generate = function(chordEvents) {
    if (!chordEvents || !chordEvents.length) return [];
    var buckets = {};
    for (var i = 0; i < chordEvents.length; i++) {
      var e = chordEvents[i];
      var key = Math.floor(e.time / BUCKET_MS);
      if (!buckets[key]) buckets[key] = { total: 0, count: 0, chords: {} };
      buckets[key].total += e.confidence;
      buckets[key].count++;
      var c = e.chord || "?";
      buckets[key].chords[c] = (buckets[key].chords[c] || 0) + 1;
    }
    var result = [];
    for (var k in buckets) {
      var b = buckets[k];
      var conf = b.total / b.count;
      var topChord = null, topCount = 0;
      for (var ch in b.chords) { if (b.chords[ch] > topCount) { topCount = b.chords[ch]; topChord = ch; } }
      result.push({
        time: parseInt(k, 10) * BUCKET_MS,
        confidence: Math.round(conf * 100) / 100,
        chord: topChord,
        rating: conf > 0.85 ? "green" : (conf > 0.6 ? "yellow" : "red")
      });
    }
    return result.sort(function(a, b) { return a.time - b.time; });
  };

  ChordHeatmap.prototype.getWeakSections = function(heatmapData, threshold) {
    threshold = threshold || 0.6;
    return heatmapData.filter(function(b) { return b.confidence < threshold; });
  };

  ChordHeatmap.prototype.render = function(ctx, heatmapData, options) {
    options = options || {};
    var cellW = options.cellWidth || 40;
    var cellH = options.cellHeight || 30;
    var x = options.offsetX || 0;
    var y = options.offsetY || 0;
    for (var i = 0; i < heatmapData.length; i++) {
      var b = heatmapData[i];
      var r = Math.round(255 * (1 - b.confidence));
      var g = Math.round(255 * b.confidence);
      ctx.fillStyle = "rgba(" + r + "," + g + ",0,0.7)";
      ctx.fillRect(x + i * cellW, y, cellW - 2, cellH);
      ctx.fillStyle = "#fff";
      ctx.font = "10px sans-serif";
      ctx.fillText(b.chord || "", x + i * cellW + 4, y + cellH - 6);
    }
  };

  window.SparkChordHeatmap = ChordHeatmap;
})();
