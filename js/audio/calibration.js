function calibrationPage(){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Latency Calibration</div>';
  h += '<div>Play a key exactly on each click.</div>';
  h += '<div class="action-row" style="margin-top:8px">';
  if (S.calibrationRunning) h += '<button onclick="act(\'performCalibrateStop\')">Stop</button>';
  else h += '<button onclick="act(\'performCalibrate\')">Start Calibration</button>';
  h += '</div>';
  h += '<div style="margin-top:8px">Detected Latency: '+Math.round(S.inputLatencyMs)+' ms</div>';
  h += '<div>Samples: '+(S.calibrationOffsets||[]).length+'</div>';
  h += '</div>';
  return h;
}

function startCalibration(){
  var nextState = getCalibrationPracticeEngine().startCalibration(S, { bpm: 80 });
  Object.assign(S, nextState);
  getCalibrationMetronomeStarter()(nextState.calibrationBpm);
  if (typeof render === "function") render();
}

function stopCalibration(){
  var nextState = getCalibrationPracticeEngine().stopCalibration(S);
  Object.assign(S, nextState);
  getCalibrationMetronomeStopper()();
  if (typeof render === "function") render();
}

function getCalibrationPracticeEngine() {
  var core = window.sparkCore || null;
  var engine = core && core.practiceEngine ? core.practiceEngine : null;
  if (!engine || typeof engine.startCalibration !== "function" || typeof engine.stopCalibration !== "function") throw new Error("Calibration practice engine unavailable");
  return engine;
}

function getCalibrationMetronomeStarter() {
  if (typeof window.startCalibrationMetronome === "function") return window.startCalibrationMetronome;
  throw new Error("Calibration unavailable: missing window.startCalibrationMetronome");
}

function getCalibrationMetronomeStopper() {
  if (typeof window.stopCalibrationMetronome === "function") return window.stopCalibrationMetronome;
  throw new Error("Calibration unavailable: missing window.stopCalibrationMetronome");
}
