function performCalibrationPage(){
  var calibrationView = getPerformanceCalibrationView();
  var source = calibrationView.source;
  var calibrationMode = calibrationView.mode;
  var globalOffsetMs = calibrationView.globalOffsetMs;
  var midiOffsetMs = calibrationView.midiOffsetMs;
  var micOffsetMs = calibrationView.micOffsetMs;
  var h = '';
  h += '<div class="card mb16">';
  h += '<h2>Performance Calibration</h2>';
  h += '<p style="color:var(--text-muted);font-size:13px">Calibrate timing so hits feel fair. Strum or play on each metronome click.</p>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div class="mb12"><b>Source</b></div>';
  h += '<button class="btn'+(source==="midi"?" btn-primary":"")+'" onclick="act(\'performCalibrateSource\',\'midi\')">MIDI</button> ';
  h += '<button class="btn'+(source==="mic"?" btn-primary":"")+'" onclick="act(\'performCalibrateSource\',\'mic\')">Mic</button>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div>Global Offset: '+globalOffsetMs+' ms</div>';
  h += '<div>MIDI Offset: '+midiOffsetMs+' ms</div>';
  h += '<div>Mic Offset: '+micOffsetMs+' ms</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  if(calibrationMode){
    h += '<div style="font-size:48px;text-align:center;margin:12px 0">'+(typeof getCalibrationBeatIndex==="function" ? getCalibrationBeatIndex() : 0)+'</div>';
    h += '<div style="text-align:center;color:var(--text-muted);font-size:13px">Strum on each click</div>';
    h += '<button class="btn" onclick="act(\'performCalibrateTap\')" style="width:100%;padding:16px;margin:12px 0;background:var(--accent);color:#fff;font-size:18px;font-weight:700">TAP</button>';
    h += '<button class="btn" onclick="act(\'performCalibrationStop\')">Stop</button>';
  } else {
    h += '<button class="btn btn-primary" onclick="act(\'performCalibrationStart\')">Start Calibration</button> ';
    h += '<button class="btn" onclick="act(\'performCalibrationApply\')">Apply Result</button> ';
    h += '<button class="btn" onclick="act(\'performCalibrationReset\')">Reset</button>';
  }
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div><b>Captured Hits:</b> '+((S.performCalibrationHits||[]).length)+'</div>';
  h += '<div>Suggested Offset: '+(typeof computeCalibrationOffsetMs==="function" ? computeCalibrationOffsetMs() : 0)+' ms</div>';
  h += '</div>';

  h += '<button class="btn" onclick="act(\'performCalibrationBack\')">Back</button>';
  return h;
}

function getPerformanceCalibrationView(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  return {
    source: runtimeState && runtimeState.performanceCalibrationSource
      ? runtimeState.performanceCalibrationSource
      : (S.performCalibrationSource || "midi"),
    mode: runtimeState && typeof runtimeState.performanceCalibrationMode === "boolean"
      ? runtimeState.performanceCalibrationMode
      : !!S.performCalibrationMode,
    globalOffsetMs: runtimeState && typeof runtimeState.performanceTimingOffsetMs === "number"
      ? runtimeState.performanceTimingOffsetMs
      : (S.performTimingOffsetMs || 0),
    midiOffsetMs: runtimeState && typeof runtimeState.performanceMidiOffsetMs === "number"
      ? runtimeState.performanceMidiOffsetMs
      : (S.performMidiOffsetMs || 0),
    micOffsetMs: runtimeState && typeof runtimeState.performanceMicOffsetMs === "number"
      ? runtimeState.performanceMicOffsetMs
      : (S.performMicOffsetMs || 0)
  };
}
