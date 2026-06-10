// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizePerformCalibrationNumber(value, fallback){ return SparkNormalize.number(value, fallback); }

function normalizePerformCalibrationSource(value){
  var text;
  if(typeof value !== "string") return "midi";
  text = value.trim().toLowerCase();
  if(text === "midi" || text === "mic") return text;
  return "midi";
}

function getPerformanceCalibrationCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function performCalibrationPage(){
  var calibrationView = getPerformanceCalibrationView();
  var source = calibrationView.source;
  var calibrationMode = calibrationView.mode;
  var globalOffsetMs = calibrationView.globalOffsetMs;
  var midiOffsetMs = calibrationView.midiOffsetMs;
  var micOffsetMs = calibrationView.micOffsetMs;
  var capturedHits = Array.isArray(S.performCalibrationHits) ? S.performCalibrationHits : [];
  var suggestedOffsetMs = typeof computeCalibrationOffsetMs==="function"
    ? normalizePerformCalibrationNumber(computeCalibrationOffsetMs(), 0)
    : 0;
  var calibrationBeatIndex = typeof getCalibrationBeatIndex==="function"
    ? normalizePerformCalibrationNumber(getCalibrationBeatIndex(), 0)
    : 0;
  var h = '';
  h += '<div class="card mb16">';
  h += '<h2>Performance Calibration</h2>';
  h += '<p style="color:var(--text-muted);font-size:13px">Calibrate timing so hits feel fair. Strum or play on each metronome click.</p>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div class="card-section-heading mb12">Source</div>';
  h += '<div class="action-row"><button class="btn'+(source==="midi"?" btn-primary":"")+'" onclick="act(\'performCalibrateSource\',\'midi\')">MIDI</button>';
  h += '<button class="btn'+(source==="mic"?" btn-primary":"")+'" onclick="act(\'performCalibrateSource\',\'mic\')">Mic</button>';
  h += '</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div><span class="metric-label">Global Offset:</span> <span class="metric-value" style="font-size:13px">'+globalOffsetMs+' ms</span></div>';
  h += '<div><span class="metric-label">MIDI Offset:</span> <span class="metric-value" style="font-size:13px">'+midiOffsetMs+' ms</span></div>';
  h += '<div><span class="metric-label">Mic Offset:</span> <span class="metric-value" style="font-size:13px">'+micOffsetMs+' ms</span></div>';
  h += '</div>';

  h += '<div class="card mb16">';
  if(calibrationMode){
    h += '<div style="font-size:48px;text-align:center;margin:12px 0">'+calibrationBeatIndex+'</div>';
    h += '<div style="text-align:center;color:var(--text-muted);font-size:13px">Strum on each click</div>';
    h += '<button class="btn" onclick="act(\'performCalibrateTap\')" style="width:100%;padding:16px;margin:12px 0;background:var(--accent);color:#fff;font-size:18px;font-weight:700">TAP</button>';
    h += '<button class="btn" onclick="act(\'performCalibrationStop\')">Stop</button>';
  } else {
    h += '<div class="action-row"><button class="btn btn-primary" onclick="act(\'performCalibrationStart\')">Start Calibration</button>';
    h += '<button class="btn" onclick="act(\'performCalibrationApply\')">Apply Result</button>';
    h += '<button class="btn" onclick="act(\'performCalibrationReset\')">Reset</button>';
    h += '</div>';
  }
  h += '</div>';

  h += '<div class="card mb16">';
  h += '<div><span class="metric-label">Captured Hits:</span> <span class="metric-value">'+capturedHits.length+'</span></div>';
  h += '<div><span class="metric-label">Suggested Offset:</span> <span class="metric-value" style="font-size:13px">'+suggestedOffsetMs+' ms</span></div>';
  h += '</div>';

  h += '<button class="btn" onclick="act(\'performCalibrationBack\')">Back</button>';
  return h;
}

function getPerformanceCalibrationView(){
  var coreView = getPerformanceCalibrationCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  return {
    source: normalizePerformCalibrationSource(
      runtimeState && runtimeState.performanceCalibrationSource
        ? runtimeState.performanceCalibrationSource
        : S.performCalibrationSource
    ),
    mode: runtimeState && typeof runtimeState.performanceCalibrationMode === "boolean"
      ? runtimeState.performanceCalibrationMode
      : !!S.performCalibrationMode,
    globalOffsetMs: normalizePerformCalibrationNumber(
      runtimeState && typeof runtimeState.performanceTimingOffsetMs === "number"
        ? runtimeState.performanceTimingOffsetMs
        : S.performTimingOffsetMs,
      0
    ),
    midiOffsetMs: normalizePerformCalibrationNumber(
      runtimeState && typeof runtimeState.performanceMidiOffsetMs === "number"
        ? runtimeState.performanceMidiOffsetMs
        : S.performMidiOffsetMs,
      0
    ),
    micOffsetMs: normalizePerformCalibrationNumber(
      runtimeState && typeof runtimeState.performanceMicOffsetMs === "number"
        ? runtimeState.performanceMicOffsetMs
        : S.performMicOffsetMs,
      0
    )
  };
}
