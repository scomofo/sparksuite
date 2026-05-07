function calibrationPage(){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Latency Calibration</div>';
  h += '<div>Play a key exactly on each click.</div>';
  h += '<div class="action-row" style="margin-top:8px"><button onclick="act(\'performCalibrate\')">Start Calibration</button>';
  h += '<button onclick="act(\'performCalibrateStop\')">Stop</button></div>';
  h += '<div style="margin-top:8px">Detected Latency: '+Math.round(S.inputLatencyMs)+' ms</div>';
  h += '<div>Samples: '+(S.calibrationOffsets||[]).length+'</div>';
  h += '</div>';
  return h;
}

function startCalibration(){
  S.calibrationOffsets = [];
  startCalibrationMetronome(80);
}

function stopCalibration(){
  stopCalibrationMetronome();
}
