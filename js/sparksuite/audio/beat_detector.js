(function() {
  var FFT_SIZE = 2048;
  var HOP_SIZE = 512;
  var ONSET_THRESHOLD_MULTIPLIER = 1.5;
  var ONSET_MEDIAN_WINDOW = 8;

  function BeatDetector() {}

  BeatDetector.prototype.detect = function(audioBuffer) {
    var channelData = audioBuffer.getChannelData(0);
    var sampleRate = audioBuffer.sampleRate;
    var flux = this._spectralFlux(channelData, sampleRate);
    var onsets = this._pickOnsets(flux, sampleRate);
    var bpmResult = this._estimateBpm(onsets);
    var beats = this._quantizeBeats(onsets, bpmResult.bpm, audioBuffer.duration);
    return {
      bpm: bpmResult.bpm, confidence: bpmResult.confidence,
      beats: beats, onsets: onsets,
      sampleRate: sampleRate, durationSec: audioBuffer.duration
    };
  };

  BeatDetector.prototype._spectralFlux = function(samples, sampleRate) {
    var numFrames = Math.floor((samples.length - FFT_SIZE) / HOP_SIZE);
    var flux = new Float32Array(numFrames);
    var prevMag = new Float32Array(FFT_SIZE / 2);
    var curMag = new Float32Array(FFT_SIZE / 2);
    var windowFunc = this._hannWindow(FFT_SIZE);
    for (var frame = 0; frame < numFrames; frame++) {
      var offset = frame * HOP_SIZE;
      var real = new Float32Array(FFT_SIZE);
      var imag = new Float32Array(FFT_SIZE);
      for (var i = 0; i < FFT_SIZE; i++) {
        real[i] = (samples[offset + i] || 0) * windowFunc[i];
      }
      this._fft(real, imag);
      for (var bin = 0; bin < FFT_SIZE / 2; bin++) {
        curMag[bin] = Math.sqrt(real[bin] * real[bin] + imag[bin] * imag[bin]);
      }
      var sum = 0;
      for (var b = 0; b < FFT_SIZE / 2; b++) {
        var diff = curMag[b] - prevMag[b];
        if (diff > 0) sum += diff;
      }
      flux[frame] = sum;
      var tmp = prevMag; prevMag = curMag; curMag = tmp;
    }
    return flux;
  };

  BeatDetector.prototype._pickOnsets = function(flux, sampleRate) {
    var onsets = [];
    var secPerFrame = HOP_SIZE / sampleRate;
    for (var i = ONSET_MEDIAN_WINDOW; i < flux.length - 1; i++) {
      var w = [];
      for (var j = i - ONSET_MEDIAN_WINDOW; j < i + ONSET_MEDIAN_WINDOW && j < flux.length; j++) w.push(flux[j]);
      w.sort(function(a, b) { return a - b; });
      var median = w[Math.floor(w.length / 2)];
      var threshold = median * ONSET_THRESHOLD_MULTIPLIER;
      if (flux[i] > threshold && flux[i] > flux[i - 1] && flux[i] >= flux[i + 1]) {
        onsets.push({ timeSec: i * secPerFrame, strength: flux[i] });
      }
    }
    return onsets;
  };

  BeatDetector.prototype._estimateBpm = function(onsets) {
    if (onsets.length < 4) return { bpm: 120, confidence: 0 };
    var intervals = [];
    for (var i = 1; i < onsets.length; i++) {
      var dt = onsets[i].timeSec - onsets[i - 1].timeSec;
      if (dt > 0.2 && dt < 2.0) intervals.push(dt);
    }
    if (!intervals.length) return { bpm: 120, confidence: 0 };
    var bins = {};
    for (var k = 0; k < intervals.length; k++) {
      var binKey = Math.round(intervals[k] * 100);
      bins[binKey] = (bins[binKey] || 0) + 1;
    }
    var peakBin = 0, peakCount = 0;
    for (var b in bins) { if (bins[b] > peakCount) { peakCount = bins[b]; peakBin = parseInt(b, 10); } }
    var beatInterval = peakBin / 100;
    var bpm = Math.round(60 / beatInterval);
    var confidence = peakCount / intervals.length;
    while (bpm > 200) bpm /= 2;
    while (bpm < 60) bpm *= 2;
    return { bpm: bpm, confidence: confidence };
  };

  BeatDetector.prototype._quantizeBeats = function(onsets, bpm, durationSec) {
    var beatInterval = 60 / bpm;
    var bestPhase = 0, bestScore = 0;
    for (var p = 0; p < 16; p++) {
      var phase = (p / 16) * beatInterval;
      var score = 0;
      for (var oi = 0; oi < onsets.length; oi++) {
        var nb = Math.round((onsets[oi].timeSec - phase) / beatInterval) * beatInterval + phase;
        if (Math.abs(onsets[oi].timeSec - nb) < 0.05) score += onsets[oi].strength;
      }
      if (score > bestScore) { bestScore = score; bestPhase = phase; }
    }
    var beats = [], time = bestPhase;
    while (time < durationSec) {
      var str = 0.5;
      for (var j = 0; j < onsets.length; j++) {
        if (Math.abs(onsets[j].timeSec - time) < 0.05) { str = Math.min(1, onsets[j].strength / 10); break; }
      }
      beats.push({ timeSec: time, strength: str });
      time += beatInterval;
    }
    return beats;
  };

  BeatDetector.prototype._hannWindow = function(size) {
    var w = new Float32Array(size);
    for (var i = 0; i < size; i++) w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    return w;
  };

  BeatDetector.prototype._fft = function(real, imag) {
    var n = real.length;
    if (n <= 1) return;
    var halfN = n / 2, j = 0;
    for (var i = 0; i < n - 1; i++) {
      if (i < j) { var tr = real[i]; real[i] = real[j]; real[j] = tr; var ti = imag[i]; imag[i] = imag[j]; imag[j] = ti; }
      var k = halfN;
      while (k <= j) { j -= k; k /= 2; }
      j += k;
    }
    for (var len = 2; len <= n; len *= 2) {
      var halfLen = len / 2, angle = -2 * Math.PI / len;
      var wR = Math.cos(angle), wI = Math.sin(angle);
      for (var start = 0; start < n; start += len) {
        var curR = 1, curI = 0;
        for (var m = 0; m < halfLen; m++) {
          var a = start + m, b = start + m + halfLen;
          var tR = curR * real[b] - curI * imag[b];
          var tI = curR * imag[b] + curI * real[b];
          real[b] = real[a] - tR; imag[b] = imag[a] - tI;
          real[a] = real[a] + tR; imag[a] = imag[a] + tI;
          var newR = curR * wR - curI * wI;
          curI = curR * wI + curI * wR;
          curR = newR;
        }
      }
    }
  };

  window.SparkBeatDetector = BeatDetector;
})();
