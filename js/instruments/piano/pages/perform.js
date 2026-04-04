var sc = window.sparkCore;
function pianoPerformPage(){
  try{ return _pianoPerformPageInner(); }catch(e){
    console.error("Piano perform render error:",e);
    return '<div class="card"><p>Performance error: '+escHTML(String(e.message||e))+'</p><button class="btn" onclick="act(&apos;stopPerform&apos;)">Exit</button></div>';
  }
}
function _pianoPerformPageInner(){
  var chart = sc.r("performChart");
  var phrase = chart ? getPerformancePhraseForTime(chart, sc.r("performCurrentSec")) : null;
  var h = '<div class="card mb16">';
  h += '<h2>'+escHTML(chart ? chart.title : "Performance")+'</h2>';
  h += '<div class="muted">'+escHTML(chart ? chart.artist : "")+'</div>';
  h += '<div style="margin-top:8px" id="perf-phrase">Phrase: '+escHTML(phrase ? phrase.name : "-")+'</div>';
  h += '<div id="perf-stats">Score: '+sc.r("performScore")+' · Combo: '+sc.r("performCombo")+' · Accuracy: '+sc.r("performAccuracy")+'%</div>';
  h += '<div id="perf-midi" style="font-size:12px;color:var(--text-muted)">Held MIDI: '+(sc.r("performInputMidi")||[]).join(", ")+'</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<button class="btn" onclick="act(\'pausePerform\')">Pause</button> ';
  h += '<button class="btn" onclick="act(\'resumePerform\')">Resume</button> ';
  h += '<button class="btn" onclick="act(\'stopPerform\')">Exit</button>';
  h += '</div>';

  h += '<div id="perf-highway-wrap">'+renderPerformanceHighway(chart, sc.r("performCurrentSec"))+'</div>';
  return h;
}

// Targeted per-frame update — avoids full DOM rebuild at 60fps
function updatePerformanceDOM(){
  var chart = sc.r("performChart");

  // Drive canvas highway
  var canvas = document.getElementById('spark-highway-canvas');
  if (canvas) {
    var hw = _ensurePianoHighway(canvas);
    hw.setChart(chart ? chart.events : [], chart ? chart.phrases : []);
    hw.update(sc.r("performCurrentSec"), sc.r("performCombo") || 0);
  }

  // Update stats (targeted)
  var st = document.getElementById('perf-stats');
  if(st) st.textContent = 'Score: '+sc.r("performScore")+' \u00b7 Combo: '+sc.r("performCombo")+' \u00b7 Accuracy: '+sc.r("performAccuracy")+'%';
  var ph = document.getElementById('perf-phrase');
  if(ph){
    var phrase = getPerformancePhraseForTime(chart, sc.r("performCurrentSec"));
    ph.textContent = 'Phrase: '+(phrase ? phrase.name : '-');
  }
  var mi = document.getElementById('perf-midi');
  if(mi) mi.textContent = 'Held MIDI: '+(sc.r("performInputMidi")||[]).join(', ');
}

function pianoPerformDonePage(){
  if(typeof pianoPerformanceResultsPage === "function") return pianoPerformanceResultsPage();
  var r = sc.r("performResults") || {};
  var best = getPerformanceBest(r.songId, r.arrangementType || "block_chords", r.difficultyId || "normal");
  var mastery = getPerformanceMasteryLabel(best);

  var h = '<div class="card mb16">';
  h += '<h2>Performance Complete</h2>';
  h += '<div class="muted">'+escHTML(r.title || "")+'</div>';
  h += '<div>Score: '+(r.score||0)+'</div>';
  h += '<div>Accuracy: '+(r.accuracy||0)+'%</div>';
  h += '<div>Stars: '+(r.stars||0)+'</div>';
  h += '<div>Max Combo: '+(r.maxCombo||0)+'</div>';
  h += '<div>Mastery: '+escHTML(mastery)+'</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<button class="btn" onclick="act(\'performRetry\')">Retry</button> ';
  h += '<button class="btn" onclick="act(\'stopPerform\')">Back to Songs</button>';
  h += '</div>';

  return h;
}
