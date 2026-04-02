function performPage(){
  var chart = S.performChart;
  var phrase = chart ? getPerformancePhraseForTime(chart, S.performCurrentSec) : null;
  var h = '<div class="card mb16">';
  h += '<h2>'+escHTML(chart ? chart.title : "Performance")+'</h2>';
  h += '<div class="muted">'+escHTML(chart ? chart.artist : "")+'</div>';
  h += '<div style="margin-top:8px" id="perf-phrase">Phrase: '+escHTML(phrase ? phrase.name : "-")+'</div>';
  h += '<div id="perf-stats">Score: '+S.performScore+' · Combo: '+S.performCombo+' · Accuracy: '+S.performAccuracy+'%</div>';
  h += '<div id="perf-midi" style="font-size:12px;color:var(--text-muted)">Held MIDI: '+(S.performInputMidi||[]).join(", ")+'</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<button class="btn" onclick="act(\'pausePerform\')">Pause</button> ';
  h += '<button class="btn" onclick="act(\'resumePerform\')">Resume</button> ';
  h += '<button class="btn" onclick="act(\'stopPerform\')">Exit</button>';
  h += '</div>';

  h += '<div id="perf-highway-wrap">'+renderPerformanceHighway(chart, S.performCurrentSec)+'</div>';
  return h;
}

// Targeted per-frame update — avoids full DOM rebuild at 60fps
function updatePerformanceDOM(){
  var chart = S.performChart;

  // Drive canvas highway
  var canvas = document.getElementById('spark-highway-canvas');
  if (canvas) {
    var hw = _ensurePianoHighway(canvas);
    hw.setChart(chart ? chart.events : [], chart ? chart.phrases : []);
    hw.update(S.performCurrentSec, S.performCombo || 0);
  }

  // Update stats (targeted)
  var st = document.getElementById('perf-stats');
  if(st) st.textContent = 'Score: '+S.performScore+' \u00b7 Combo: '+S.performCombo+' \u00b7 Accuracy: '+S.performAccuracy+'%';
  var ph = document.getElementById('perf-phrase');
  if(ph){
    var phrase = getPerformancePhraseForTime(chart, S.performCurrentSec);
    ph.textContent = 'Phrase: '+(phrase ? phrase.name : '-');
  }
  var mi = document.getElementById('perf-midi');
  if(mi) mi.textContent = 'Held MIDI: '+(S.performInputMidi||[]).join(', ');
}

function performDonePage(){
  var r = S.performResults || {};
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
