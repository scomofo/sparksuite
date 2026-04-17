function audioCalibrationRoot(){
  if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
    var sparkRoot = SparkState.getRoot();
    if(sparkRoot) return sparkRoot;
  }
  return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
}

function audioCalibrationRead(path, fallback){
  if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
    return SparkState.read(path, fallback);
  }
  var root = audioCalibrationRoot();
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if(!cursor) return fallback;
  for(i=0;i<parts.length;i++){
    if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function audioCalibrationWrite(path, value){
  if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
    return SparkState.write(path, value);
  }
  var root = audioCalibrationRoot();
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if(!cursor || !parts.length) return value;
  for(i=0;i<parts.length-1;i++){
    if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length-1]] = value;
  return value;
}

function calibrationPage(){
  var h = '<div class="card">';
  h += '<div><b>Latency Calibration</b></div>';
  h += '<div>Play a key exactly on each click.</div>';
  h += '<button onclick="act(\'startAudioCalibration\')">Start Calibration</button>';
  h += ' <button onclick="act(\'stopAudioCalibration\')">Stop</button>';
  h += '<div style="margin-top:8px">Detected Latency: '+Math.round(audioCalibrationRead("inputLatencyMs", 0))+' ms</div>';
  h += '<div>Samples: '+((audioCalibrationRead("calibrationOffsets", [])||[]).length)+'</div>';
  h += '</div>';
  return h;
}

function startAudioCalibration(){
  audioCalibrationWrite("calibrationOffsets", []);
  startCalibrationMetronome(80);
}

function stopAudioCalibration(){
  stopCalibrationMetronome();
}
