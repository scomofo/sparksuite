/* ===== ChordSpark Performance: Highway Renderer (Canvas) ===== */

var _sparkHighway = null;

function ensureSparkHighway(canvasEl) {
  if (_sparkHighway && _sparkHighway.canvas === canvasEl) return _sparkHighway;
  if (_sparkHighway) _sparkHighway.destroy();
  _sparkHighway = new SparkHighway(canvasEl, SparkHighway.GUITAR_SKIN);
  return _sparkHighway;
}

function destroySparkHighway() {
  if (_sparkHighway) { _sparkHighway.destroy(); _sparkHighway = null; }
}

function feedChartToHighway(chart) {
  if (!_sparkHighway || !chart) return;
  _sparkHighway.setChart(chart.events || [], chart.phrases || []);
}

function updateSparkHighway(nowSec, combo) {
  if (!_sparkHighway) return;
  _sparkHighway.update(nowSec, combo);
}

function notifyHighwayHit(evt) {
  if (!_sparkHighway || !evt._screenX) return;
  _sparkHighway.notifyHit(evt._screenX, evt._screenY, evt._screenColor || [100, 255, 100]);
}

function renderPerformanceHighway(chart, nowSec) {
  var height = 400;
  var h = '<div class="perform-highway" style="height:' + height + 'px;padding:0;border:none;background:transparent">';
  h += '<canvas id="spark-highway-canvas" style="width:100%;height:100%;display:block"></canvas>';
  h += '</div>';
  return h;
}

function renderPerformancePhraseBanner(chart, nowSec) {
  var phrase = getPerformancePhraseForTime(chart, nowSec);
  if (!phrase) return "";
  return '<div class="perform-phrase-banner">' + escHTML(phrase.name) + '</div>';
}
