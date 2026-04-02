/* ───────── PianoSpark – audio.js ───────── */
/* Enhanced: LH playback, split practice, reward sounds, watch demos, verbal */

var audioCtx = null;
var masterGain = null;
var reverbNode = null;   // ConvolverNode
var reverbGain = null;   // wet level
var dryGain = null;      // dry level

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Dry path
    dryGain = audioCtx.createGain();
    dryGain.gain.value = 1;
    dryGain.connect(audioCtx.destination);

    // Wet path — synthetic plate reverb impulse response
    reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = _buildImpulseResponse(audioCtx, 1.8, 3.0);
    reverbGain = audioCtx.createGain();
    reverbGain.gain.value = (S.reverbAmount !== undefined ? S.reverbAmount : 0.18) * 0.4;
    reverbNode.connect(reverbGain);
    reverbGain.connect(audioCtx.destination);

    // masterGain feeds both paths
    masterGain = audioCtx.createGain();
    masterGain.gain.value = S.volume;
    masterGain.connect(dryGain);
    masterGain.connect(reverbNode);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  tryPreload();
  return audioCtx;
}

// Build a synthetic exponential-decay impulse response (plate reverb approximation)
function _buildImpulseResponse(ctx, duration, decay) {
  var rate = ctx.sampleRate;
  var length = Math.floor(rate * duration);
  var impulse = ctx.createBuffer(2, length, rate);
  for (var ch = 0; ch < 2; ch++) {
    var data = impulse.getChannelData(ch);
    for (var i = 0; i < length; i++) {
      // Exponential decay with random noise
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function setReverb(amount) {
  S.reverbAmount = Math.max(0, Math.min(1, amount));
  if (reverbGain) reverbGain.gain.value = S.reverbAmount * 0.4; // 0.4 = max wet
  saveState();
}

function setVolume(v) {
  S.volume = v;
  if (masterGain) masterGain.gain.value = v;
}

// ── WAV sample cache & preloading ──
var wavBuffers = {};
var wavsAvailable = false;

function preloadWavs() {
  var ctx = ensureAudio();
  var chordNames = allChordKeys();
  var loaded = 0;
  var pending = chordNames.length;

  chordNames.forEach(function(name) {
    var url = "piano_chords/chord_" + name.replace('#', 'sharp') + ".wav";
    fetch(url).then(function(resp) {
      if (!resp.ok) throw new Error("not ok");
      return resp.arrayBuffer();
    }).then(function(buf) {
      return ctx.decodeAudioData(buf);
    }).then(function(decoded) {
      wavBuffers[name] = decoded;
      loaded++;
      pending--;
      if (pending <= 0) wavsAvailable = loaded > 0;
    }).catch(function() {
      pending--;
      if (pending <= 0) wavsAvailable = loaded > 0;
    });
  });
}

function playWavChord(chordShort) {
  if (!wavBuffers[chordShort]) return false;
  var ctx = ensureAudio();
  var src = ctx.createBufferSource();
  src.buffer = wavBuffers[chordShort];
  src.connect(masterGain);
  src.start();
  return true;
}

var preloadStarted = false;
function tryPreload() {
  if (preloadStarted) return;
  preloadStarted = true;
  preloadWavs();
}

// ── Piano tone parameters ──
var TONES = {
  grand:    { harmonics:[1, 0.5, 0.25, 0.12, 0.06], type:"triangle", attack:0.005, decay:0.3, sustain:0.3, release:1.5 },
  bright:   { harmonics:[1, 0.6, 0.35, 0.2, 0.1, 0.05], type:"sawtooth", attack:0.003, decay:0.2, sustain:0.2, release:1.0 },
  warm:     { harmonics:[1, 0.4, 0.15, 0.05], type:"sine", attack:0.008, decay:0.4, sustain:0.35, release:2.0 },
  electric: { harmonics:[1, 0.7, 0.5, 0.3, 0.2, 0.1], type:"square", attack:0.002, decay:0.15, sustain:0.25, release:0.8 },
};

// ── Play a single piano note ──
// velocity: 0–1 (default 0.8). MIDI note-on passes velocity/127; button taps use default.
function playNote(midi, duration, delay, velocity) {
  if (duration === undefined) duration = 1.5;
  if (delay === undefined) delay = 0;
  if (velocity === undefined) velocity = 0.8;
  velocity = Math.max(0.01, Math.min(1, velocity));
  var ctx = ensureAudio();
  var t = TONES[S.tone] || TONES.grand;
  var freq = midiToFreq(midi);
  var now = ctx.currentTime + delay;

  // Peak gain scales with velocity using a slight curve (louder notes are brighter)
  var peakGain = 0.15 + velocity * 0.35;

  var gainNode = ctx.createGain();
  gainNode.connect(masterGain);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(peakGain, now + t.attack);
  gainNode.gain.exponentialRampToValueAtTime(
    Math.max(peakGain * t.sustain, 0.001),
    now + t.attack + t.decay
  );
  gainNode.gain.setValueAtTime(peakGain * t.sustain, now + duration - t.release);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  var oscs = [];
  t.harmonics.forEach(function(amp, i) {
    var osc = ctx.createOscillator();
    var hGain = ctx.createGain();
    hGain.gain.value = amp * 0.3;
    osc.type = i === 0 ? t.type : "sine";
    osc.frequency.value = freq * (i + 1);
    if (i > 0) osc.detune.value = (Math.random() - 0.5) * 4;
    osc.connect(hGain);
    hGain.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration + 0.1);
    oscs.push(osc);
  });

  return { gainNode: gainNode, oscs: oscs, stopAt: now + duration };
}

// ── Play a full chord (RH) ──
function playChord(chordObj, style) {
  if (!chordObj) return;
  if (!style) style = "block";
  tryPreload();
  var midis = chordMidi(chordObj);

  if ((style === "block" || style === "all") && playWavChord(chordObj.short)) return;

  if (style === "block" || style === "all") {
    midis.forEach(function(m) { playNote(m, 2.0); });
  } else if (style === "arp_up") {
    midis.forEach(function(m, i) { playNote(m, 1.5, i * 0.12); });
  } else if (style === "arp_down") {
    var rev = midis.slice().reverse();
    rev.forEach(function(m, i) { playNote(m, 1.5, i * 0.12); });
  } else if (style === "alberti" && midis.length >= 3) {
    var pat = [0, 2, 1, 2, 0, 2, 1, 2];
    pat.forEach(function(ni, i) {
      if (ni < midis.length) playNote(midis[ni], 0.4, i * 0.15);
    });
  } else if (style === "waltz" && midis.length >= 2) {
    playNote(midis[0], 0.8, 0);
    playNote(midis[1], 0.5, 0.3);
    if (midis[2]) playNote(midis[2], 0.5, 0.3);
    playNote(midis[1], 0.5, 0.6);
    if (midis[2]) playNote(midis[2], 0.5, 0.6);
  } else if (style === "broken" && midis.length >= 3) {
    var bpat = [0, 1, 2, -1, 2, 1, 0, -1];
    bpat.forEach(function(ni, i) {
      if (ni === -1) midis.forEach(function(m) { playNote(m, 0.5, i * 0.15); });
      else if (ni < midis.length) playNote(midis[ni], 0.5, i * 0.15);
    });
  } else {
    midis.forEach(function(m) { playNote(m, 2.0); });
  }
}

// ── Play chord by short name ──
function playChordByName(short, style) {
  var c = findChord(short);
  if (c) playChord(c, style);
}

// ── Play bass note (LH) ──
function playBassNote(midi, duration) {
  if (!duration) duration = 2.0;
  playNote(midi, duration);
}

// ── Play LH pattern for a chord ──
var _lhLoopTimer = null;
function playLHPattern(patternId, chordShort, bpm) {
  stopLHPattern();
  var pattern = null;
  for (var i = 0; i < LH_PATTERNS.length; i++) {
    if (LH_PATTERNS[i].id === patternId) { pattern = LH_PATTERNS[i]; break; }
  }
  if (!pattern) return;

  var chord = findChord(chordShort);
  if (!chord) return;

  var bassMidi = chord.bassMidi;
  var fifthMidi = bassMidi + 7;
  var octaveMidi = bassMidi + 12;
  var thirdMidi = bassMidi + (chord.type === "minor" || chord.type === "min7" ? 3 : 4);
  var beatMs = 60000 / bpm;

  // Play one bar then loop
  function playBar() {
    pattern.pattern.forEach(function(p) {
      var midi;
      switch(p.note) {
        case "root": midi = bassMidi; break;
        case "fifth": midi = fifthMidi; break;
        case "octave": midi = octaveMidi; break;
        case "third": midi = thirdMidi; break;
        default: midi = bassMidi;
      }
      var delay = (p.beat - 1) * beatMs / 1000;
      var dur = p.hold * beatMs / 1000;
      playNote(midi, dur, delay);
    });
  }

  playBar();
  var barMs = 4 * beatMs;
  _lhLoopTimer = setInterval(playBar, barMs);
}

function stopLHPattern() {
  if (_lhLoopTimer) { clearInterval(_lhLoopTimer); _lhLoopTimer = null; }
}

// ── Split practice (RH only / LH only / together) ──
function playSplitPractice(mode, chordShort, patternId, bpm) {
  var chord = findChord(chordShort);
  if (!chord) return;

  if (mode === "rh") {
    playChord(chord, "block");
  } else if (mode === "lh") {
    playLHPattern(patternId, chordShort, bpm);
  } else { // "together"
    playChord(chord, "block");
    playLHPattern(patternId, chordShort, bpm);
  }
}

// ── Watch demo (automated chord demo for Watch phase - stickiness #3) ──
var _watchTimer = null;
function playWatchDemo(chordShort, onComplete) {
  stopWatchDemo();
  var chord = findChord(chordShort);
  if (!chord) return;

  var midis = chordMidi(chord);
  var step = 0;

  // 1. Play notes individually
  // 2. Play full chord
  // 3. Pause
  function demoStep() {
    if (step < midis.length) {
      playNote(midis[step], 1.0);
      step++;
      _watchTimer = setTimeout(demoStep, 800);
    } else if (step === midis.length) {
      // Play full chord
      playChord(chord, "block");
      step++;
      _watchTimer = setTimeout(demoStep, 2000);
    } else {
      stopWatchDemo();
      if (onComplete) onComplete();
    }
  }

  demoStep();
}

function stopWatchDemo() {
  if (_watchTimer) { clearTimeout(_watchTimer); _watchTimer = null; }
}

// ── Play chord with verbal (stickiness #7 - multimodal) ──
function playChordWithVerbal(chordShort) {
  var chord = findChord(chordShort);
  if (!chord) return;

  playChord(chord, "block");

  // Speak the chord name via SpeechSynthesis API
  if (window.speechSynthesis) {
    speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance(chord.name);
    utter.rate = 0.9;
    utter.volume = 0.7;
    speechSynthesis.speak(utter);
  }
}

// ── UI sounds (with variable reward sounds - stickiness #4) ──
function playSound(name) {
  var ctx = ensureAudio();
  var now = ctx.currentTime;

  // Handle cases that create their own nodes — must return before creating shared osc/g
  if (name === "complete") { _playCompletionVariant(ctx, now); return; }
  if (name === "jackpot")  { _playJackpotSound(ctx, now); return; }
  if (name === "reward")   { _playRewardVariant(ctx, now); return; }

  var g = ctx.createGain();
  g.connect(masterGain);
  var osc = ctx.createOscillator();
  osc.connect(g);

  switch (name) {
    case "start":
      osc.type = "sine"; osc.frequency.value = 523;
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case "complete": // handled above, unreachable
    case "tick":
      osc.type = "sine"; osc.frequency.value = 880;
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
      break;
    case "badge":
      osc.type = "triangle"; osc.frequency.value = 784;
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;
    case "levelup":
      osc.type = "triangle"; osc.frequency.value = 523;
      g.gain.setValueAtTime(0.3, now);
      osc.frequency.linearRampToValueAtTime(1047, now + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;
    case "wrong":
      osc.type = "sawtooth"; osc.frequency.value = 200;
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      break;
    case "jackpot": // handled above, unreachable
    case "reward":  // handled above, unreachable
    default:
      osc.type = "sine"; osc.frequency.value = 440;
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
  }
}

// Variable completion sounds (stickiness #4 - prediction error optimization)
function _playCompletionVariant(ctx, now) {
  var variant = Math.floor(Math.random() * 3);
  var freqs = [
    [659, 784],          // E5 -> G5
    [523, 659, 784],     // C5 -> E5 -> G5
    [784, 988]           // G5 -> B5
  ];
  var notes = freqs[variant];

  notes.forEach(function(freq, i) {
    var o = ctx.createOscillator();
    var gg = ctx.createGain();
    o.connect(gg); gg.connect(masterGain);
    o.type = "sine";
    o.frequency.value = freq;
    gg.gain.setValueAtTime(0.2, now + i * 0.15);
    gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
    o.start(now + i * 0.15);
    o.stop(now + i * 0.15 + 0.4);
  });
}

// Variable reward sounds
function _playRewardVariant(ctx, now) {
  var variant = Math.floor(Math.random() * 4);
  var configs = [
    { freq: 880, type: "sine", dur: 0.2 },
    { freq: 1047, type: "triangle", dur: 0.3 },
    { freq: 698, type: "sine", dur: 0.25 },
    { freq: 1175, type: "triangle", dur: 0.15 }
  ];
  var c = configs[variant];
  var o = ctx.createOscillator();
  var gg = ctx.createGain();
  o.connect(gg); gg.connect(masterGain);
  o.type = c.type;
  o.frequency.value = c.freq;
  gg.gain.setValueAtTime(0.2, now);
  gg.gain.exponentialRampToValueAtTime(0.001, now + c.dur);
  o.start(now); o.stop(now + c.dur);
}

// Jackpot sound (special)
function _playJackpotSound(ctx, now) {
  var notes = [523, 659, 784, 1047];
  notes.forEach(function(freq, i) {
    var o = ctx.createOscillator();
    var gg = ctx.createGain();
    o.connect(gg); gg.connect(masterGain);
    o.type = "triangle";
    o.frequency.value = freq;
    gg.gain.setValueAtTime(0.25, now + i * 0.1);
    gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
    o.start(now + i * 0.1);
    o.stop(now + i * 0.1 + 0.5);
  });
}

// ── Metronome ──
var metronomeInterval = null;
var metronomeBeat = 0;
// metronomeSound: "sine" (default) | "woodblock" | "clap" | "hihat"

function _metronomeClick(ctx, now, isAccent) {
  var sound = S.metronomeSound || "sine";
  var g = ctx.createGain();
  g.connect(masterGain);

  if (sound === "woodblock") {
    // Two detuned sine tones with very fast decay
    [800, 1200].forEach(function(freq) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = isAccent ? freq * 1.25 : freq;
      var og = ctx.createGain();
      og.gain.setValueAtTime(isAccent ? 0.3 : 0.18, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      o.connect(og); og.connect(masterGain);
      o.start(now); o.stop(now + 0.05);
    });
  } else if (sound === "clap") {
    // Filtered noise burst (clap simulation)
    var bufLen = Math.floor(ctx.sampleRate * 0.08);
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = isAccent ? 1800 : 1200;
    filter.Q.value = 0.8;
    var cg = ctx.createGain();
    cg.gain.setValueAtTime(isAccent ? 0.5 : 0.3, now);
    src.connect(filter); filter.connect(cg); cg.connect(masterGain);
    src.start(now);
  } else if (sound === "hihat") {
    // High-pass filtered noise (hi-hat simulation)
    var hBufLen = Math.floor(ctx.sampleRate * 0.06);
    var hBuf = ctx.createBuffer(1, hBufLen, ctx.sampleRate);
    var hData = hBuf.getChannelData(0);
    for (var j = 0; j < hBufLen; j++) {
      hData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / hBufLen, 8);
    }
    var hSrc = ctx.createBufferSource();
    hSrc.buffer = hBuf;
    var hFilter = ctx.createBiquadFilter();
    hFilter.type = "highpass";
    hFilter.frequency.value = isAccent ? 8000 : 6000;
    var hg = ctx.createGain();
    hg.gain.setValueAtTime(isAccent ? 0.4 : 0.25, now);
    hSrc.connect(hFilter); hFilter.connect(hg); hg.connect(masterGain);
    hSrc.start(now);
  } else {
    // Default sine click
    var o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = isAccent ? 1000 : 800;
    g.gain.setValueAtTime(isAccent ? 0.2 : 0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.connect(g);
    o.start(now); o.stop(now + 0.05);
  }
}

var _metroNextTime = 0;
var _metroLookahead = 0.1; // seconds to look ahead
var _metroBpm = 120;
function startMetronome(bpm) {
  stopMetronome();
  _metroBpm = bpm;
  metronomeBeat = 0;
  var ctx = ensureAudio();
  _metroNextTime = ctx.currentTime;
  _metroScheduleAhead();
}
function _metroScheduleAhead() {
  var ctx = ensureAudio();
  var secPerBeat = 60 / _metroBpm;
  while (_metroNextTime < ctx.currentTime + _metroLookahead) {
    _metronomeClick(ctx, _metroNextTime, metronomeBeat % 4 === 0);
    metronomeBeat++;
    _metroNextTime += secPerBeat;
  }
  metronomeInterval = setTimeout(_metroScheduleAhead, 25);
}

function stopMetronome() {
  if (metronomeInterval) { clearTimeout(metronomeInterval); metronomeInterval = null; }
  metronomeBeat = 0;
}

// ── Chord detection via microphone ──
var micStream = null;
var _micSourceNode = null;
var analyserNode = null;
var detectionAnimFrame = null;
var _lastYinRenderTime = 0;
var detectionHistory = [];
var _detectionFrameCount = 0;

// Per-session chord match score history for the confidence display
var detectionScoreHistory = [];  // last N getChordMatch scores
var DETECTION_SCORE_WINDOW = 30; // rolling window size

// Record a match score (called from app.js or session pages when comparing detected notes)
function recordDetectionScore(score) {
  detectionScoreHistory.push(score);
  if (detectionScoreHistory.length > DETECTION_SCORE_WINDOW) {
    detectionScoreHistory.shift();
  }
}

// Returns { avg, peak, samples } for the current session window
function getDetectionConfidence() {
  if (!detectionScoreHistory.length) return { avg: 0, peak: 0, samples: 0 };
  var sum = 0, peak = 0;
  for (var i = 0; i < detectionScoreHistory.length; i++) {
    sum += detectionScoreHistory[i];
    if (detectionScoreHistory[i] > peak) peak = detectionScoreHistory[i];
  }
  return {
    avg: Math.round(sum / detectionScoreHistory.length),
    peak: peak,
    samples: detectionScoreHistory.length
  };
}

function resetDetectionConfidence() {
  detectionScoreHistory = [];
}

function startDetection() {
  var ctx = ensureAudio();
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    micStream = stream;
    _micSourceNode = ctx.createMediaStreamSource(stream);
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 8192;
    analyserNode.smoothingTimeConstant = 0.4;
    _micSourceNode.connect(analyserNode);
    S.detecting = true;
    detectionHistory = [];
    _detectionFrameCount = 0;
    resetDetectionConfidence();
    detectLoop();
  }).catch(function(e) {
    console.error("Mic access denied:", e);
    S.detecting = false;
    showToast("Microphone access denied. Check browser permissions.");
    render();
  });
}

function stopDetection() {
  S.detecting = false;
  if (_micSourceNode) { _micSourceNode.disconnect(); _micSourceNode = null; }
  if (_yinNode) { _yinNode.disconnect(); _yinNode = null; }
  if (micStream) { micStream.getTracks().forEach(function(t) { t.stop(); }); micStream = null; }
  if (detectionAnimFrame) { cancelAnimationFrame(detectionAnimFrame); detectionAnimFrame = null; }
  analyserNode = null;
  S.detectedNotes = [];
}

function detectLoop() {
  if (!S.detecting || !analyserNode) return;
  _detectionFrameCount++;
  if (_detectionFrameCount % 4 !== 0) {
    detectionAnimFrame = requestAnimationFrame(detectLoop);
    return;
  }

  var bufLen = analyserNode.frequencyBinCount;
  var data = new Float32Array(bufLen);
  analyserNode.getFloatFrequencyData(data);

  var ctx = ensureAudio();
  var sampleRate = ctx.sampleRate;
  var binSize = sampleRate / analyserNode.fftSize;

  var maxAmp = -Infinity;
  for (var i = 0; i < bufLen; i++) {
    if (data[i] > maxAmp) maxAmp = data[i];
  }
  if (maxAmp < -60) {
    detectionAnimFrame = requestAnimationFrame(detectLoop);
    return;
  }

  // Tighter threshold: only accept peaks within 22dB of the loudest bin
  var threshold = Math.max(maxAmp - 22, -50);

  // Collect peaks as {freq, amp} so we can suppress harmonics
  var peaks = [];
  for (var j = 3; j < bufLen - 3; j++) {
    if (data[j] > threshold && data[j] > data[j-1] && data[j] > data[j+1] &&
        data[j] > data[j-2] && data[j] > data[j+2]) {
      var freq = j * binSize;
      if (freq < 60 || freq > 2000) continue;
      peaks.push({ freq: freq, amp: data[j] });
    }
  }

  // Sort strongest first, then suppress peaks that are harmonics of louder ones
  peaks.sort(function(a, b) { return b.amp - a.amp; });
  var accepted = [];
  peaks.forEach(function(p) {
    var isHarmonic = accepted.some(function(a) {
      for (var h = 2; h <= 6; h++) {
        if (Math.abs(p.freq - a.freq * h) / (a.freq * h) < 0.03) return true;
      }
      return false;
    });
    if (!isHarmonic) accepted.push(p);
  });

  // Convert accepted peaks to pitch-class note names, respecting A4 tuning
  var notes = [];
  var a4 = S.a4Tuning || 440;
  accepted.forEach(function(p) {
    var midi = Math.round(12 * Math.log2(p.freq / a4) + 69);
    var noteName = NOTE_NAMES[midi % 12];
    if (notes.indexOf(noteName) < 0) notes.push(noteName);
  });

  detectionHistory.push(notes);
  if (detectionHistory.length > 8) detectionHistory.shift();

  // Require note to appear in at least 5 of the last 8 frames (more stable)
  var stable = [];
  var allNotesSeen = {};
  detectionHistory.forEach(function(frame) {
    frame.forEach(function(n) { allNotesSeen[n] = true; });
  });
  for (var n in allNotesSeen) {
    var count = 0;
    detectionHistory.forEach(function(frame) {
      if (frame.indexOf(n) >= 0) count++;
    });
    if (count >= 5) stable.push(n);
  }

  S.detectedNotes = stable;

  // Auto-score against the active chord if one is in play
  var activeChordShort = S.chord ||
    (S.sessionPlan && S.sessionPlan.newMove && S.sessionPlan.newMove.chord) || null;
  if (activeChordShort && stable.length > 0) {
    var activeChordObj = findChord(activeChordShort);
    if (activeChordObj) recordDetectionScore(getChordMatch(activeChordObj));
  }

  detectionAnimFrame = requestAnimationFrame(detectLoop);
}

function getChordMatch(chordObj) {
  if (!chordObj || !S.detectedNotes.length) return 0;
  var target = CHORD_NOTES[chordObj.short] || [];
  if (!target.length) return 0;
  var matched = 0;
  for (var i = 0; i < target.length; i++) {
    var n = target[i];
    var sharpIdx = NOTE_NAMES.indexOf(n);
    var flatIdx = FLAT_NAMES.indexOf(n);
    var idx = sharpIdx >= 0 ? sharpIdx : flatIdx;
    if (idx < 0) continue;
    var found = S.detectedNotes.some(function(dn) {
      var dnSharp = NOTE_NAMES.indexOf(dn);
      var dnFlat = FLAT_NAMES.indexOf(dn);
      var dnIdx = dnSharp >= 0 ? dnSharp : dnFlat;
      return dnIdx === idx;
    });
    if (found) matched++;
  }
  // Recall: fraction of target notes detected
  var recall = matched / target.length;
  // Precision: fraction of detected notes that belong to the chord
  var precision = matched / S.detectedNotes.length;
  if (matched === 0) return 0;
  // Weighted score: prioritise recall (playing all notes) but penalise extra wrong notes
  var score = (3 * precision * recall) / (precision + 2 * recall);
  return Math.round(score * 100);
}

function getCoachFeedback(chordObj) {
  if (!chordObj) return "";
  var target = CHORD_NOTES[chordObj.short] || [];
  var missing = target.filter(function(n) {
    var sharpIdx = NOTE_NAMES.indexOf(n);
    var flatIdx = FLAT_NAMES.indexOf(n);
    var idx = sharpIdx >= 0 ? sharpIdx : flatIdx;
    if (idx < 0) return true;
    return !S.detectedNotes.some(function(dn) {
      var dnSharp = NOTE_NAMES.indexOf(dn);
      var dnFlat = FLAT_NAMES.indexOf(dn);
      return (dnSharp >= 0 ? dnSharp : dnFlat) === idx;
    });
  });
  if (missing.length === 0) return "\u2705 Perfect! All notes ringing clearly.";
  if (missing.length === target.length) return "Play the chord and make sure your mic is on.";
  return "Almost! Missing: " + missing.join(", ") + ". Check your finger placement.";
}

// ── YIN polyphonic pitch detection (AudioWorklet) ──
// Falls back to the existing FFT method if AudioWorklet is unavailable.
var _yinWorkletReady = false;
var _yinNode = null;
var _yinDetectedNotes = []; // updated by worklet messages

var _YIN_WORKLET_CODE = [
  'class YinProcessor extends AudioWorkletProcessor {',
  '  constructor() {',
  '    super();',
  '    this._buf = new Float32Array(2048);',
  '    this._pos = 0;',
  '    this._threshold = 0.15;',
  '  }',
  '  static get parameterDescriptors() { return []; }',
  '  process(inputs) {',
  '    var ch = inputs[0][0];',
  '    if (!ch) return true;',
  '    for (var i = 0; i < ch.length; i++) {',
  '      this._buf[this._pos++] = ch[i];',
  '      if (this._pos >= this._buf.length) {',
  '        this._pos = 0;',
  '        var freq = this._yin(this._buf);',
  '        if (freq > 0) this.port.postMessage({ freq: freq });',
  '      }',
  '    }',
  '    return true;',
  '  }',
  '  _yin(buf) {',
  '    var N = buf.length, half = N >> 1;',
  '    var diff = new Float32Array(half);',
  '    var cm = new Float32Array(half);',
  '    diff[0] = 0;',
  '    var runSum = 0;',
  '    for (var tau = 1; tau < half; tau++) {',
  '      var s = 0;',
  '      for (var j = 0; j < half; j++) {',
  '        var d = buf[j] - buf[j + tau];',
  '        s += d * d;',
  '      }',
  '      diff[tau] = s;',
  '      runSum += s;',
  '      cm[tau] = runSum === 0 ? 1 : diff[tau] / (runSum / tau);',
  '    }',
  '    var best = -1;',
  '    for (var t = 2; t < half; t++) {',
  '      if (cm[t] < this._threshold) {',
  '        while (t + 1 < half && cm[t + 1] < cm[t]) t++;',
  '        best = t; break;',
  '      }',
  '    }',
  '    if (best < 0) return -1;',
  '    // Parabolic interpolation',
  '    var s0 = cm[best - 1], s1 = cm[best], s2 = cm[best + 1];',
  '    var refined = best + (s2 - s0) / (2 * (2 * s1 - s0 - s2) + 1e-9);',
  '    return sampleRate / refined;',
  '  }',
  '}',
  'registerProcessor("yin-processor", YinProcessor);'
].join('\n');

function _ensureYinWorklet(ctx, callback) {
  if (_yinWorkletReady) { callback(); return; }
  if (!ctx.audioWorklet) { callback(new Error("no AudioWorklet")); return; }
  var blob = new Blob([_YIN_WORKLET_CODE], { type: "application/javascript" });
  var url = URL.createObjectURL(blob);
  ctx.audioWorklet.addModule(url).then(function() {
    URL.revokeObjectURL(url);
    _yinWorkletReady = true;
    callback();
  }).catch(callback);
}

function startYinDetection() {
  var ctx = ensureAudio();
  _ensureYinWorklet(ctx, function(err) {
    if (err) {
      // Silently fall back to FFT detection
      startDetection();
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
      micStream = stream;
      _micSourceNode = ctx.createMediaStreamSource(stream);
      _yinNode = new AudioWorkletNode(ctx, "yin-processor");
      _micSourceNode.connect(_yinNode);

      // Accumulate pitches over a short window and vote on pitch classes
      var recentFreqs = [];
      _yinNode.port.onmessage = function(e) {
        var freq = e.data.freq;
        if (freq < 60 || freq > 2000) return;
        recentFreqs.push(freq);
        if (recentFreqs.length > 12) recentFreqs.shift();

        // Convert to pitch classes with majority vote
        var pcCount = {};
        recentFreqs.forEach(function(f) {
          var a4 = S.a4Tuning || 440;
          var midi = Math.round(12 * Math.log2(f / a4) + 69);
          var pc = midiToNote(midi);
          if (pc) pcCount[pc] = (pcCount[pc] || 0) + 1;
        });
        var stable = Object.keys(pcCount).filter(function(pc) {
          return pcCount[pc] >= 6;
        });
        S.detectedNotes = stable;

        var activeChordShort = S.chord ||
          (S.sessionPlan && S.sessionPlan.newMove && S.sessionPlan.newMove.chord) || null;
        if (activeChordShort && stable.length > 0) {
          var co = findChord(activeChordShort);
          if (co) recordDetectionScore(getChordMatch(co));
        }
        var now = performance.now();
        if (now - _lastYinRenderTime > 50) {
          _lastYinRenderTime = now;
          render();
        }
      };

      S.detecting = true;
      resetDetectionConfidence();
      render();
    }).catch(function(e) {
      console.error("Mic access denied:", e);
      S.detecting = false;
      showToast("Microphone access denied. Check browser permissions.");
      render();
    });
  });
}

function stopYinDetection() {
  stopDetection(); // handles _yinNode cleanup, mic stream, and S.detecting
}

// ── Practice clip recording ──
var _recorder = null;
var _recordChunks = [];
var _recordingStartTime = 0;
var _recordDest = null;
var CLIP_MAX_MS = 30000; // 30 seconds max

function startRecording() {
  if (_recorder && _recorder.state === "recording") return;
  var ctx = ensureAudio();

  // Capture the master output via a MediaStreamDestinationNode
  if (_recordDest) { try { masterGain.disconnect(_recordDest); } catch(e) {} }
  _recordDest = ctx.createMediaStreamDestination();
  masterGain.connect(_recordDest);
  var dest = _recordDest;

  _recordChunks = [];
  _recordingStartTime = Date.now();

  try {
    _recorder = new MediaRecorder(dest.stream);
  } catch(e) {
    showToast("Recording not supported in this browser.");
    masterGain.disconnect(dest);
    return;
  }

  _recorder.ondataavailable = function(e) {
    if (e.data && e.data.size > 0) _recordChunks.push(e.data);
  };

  _recorder.onstop = function() {
    masterGain.disconnect(dest);
    if (!_recordChunks.length) return;
    var blob = new Blob(_recordChunks, { type: "audio/webm" });
    var url = URL.createObjectURL(blob);
    var duration = Math.round((Date.now() - _recordingStartTime) / 1000);
    if (!S.practiceClips) S.practiceClips = [];
    // Keep last 5 clips (object URLs persist for the session)
    if (S.practiceClips.length >= 5) {
      URL.revokeObjectURL(S.practiceClips[0].url);
      S.practiceClips.shift();
    }
    S.practiceClips.push({ url: url, duration: duration, ts: Date.now() });
    render();
  };

  _recorder.start(250); // collect chunks every 250ms

  // Auto-stop at max duration
  setTimeout(function() {
    if (_recorder && _recorder.state === "recording") stopRecording();
  }, CLIP_MAX_MS);

  render();
}

function stopRecording() {
  if (_recorder && _recorder.state === "recording") {
    _recorder.stop();
    _recorder = null;
  }
  render();
}

function isRecording() {
  return !!(_recorder && _recorder.state === "recording");
}

function playClip(url) {
  var audio = new Audio(url);
  audio.volume = S.volume;
  audio.play().catch(function() { showToast("Could not play clip."); });
}

function deleteClip(idx) {
  if (!S.practiceClips || !S.practiceClips[idx]) return;
  URL.revokeObjectURL(S.practiceClips[idx].url);
  S.practiceClips.splice(idx, 1);
  render();
}

// ── MIDI input ──
var midiAccess = null;
var midiNotesHeld = {};  // { midiNoteNumber: true }

function startMidi() {
  if (!navigator.requestMIDIAccess) {
    showToast("Web MIDI API not supported in this browser.");
    return;
  }
  navigator.requestMIDIAccess().then(function(access) {
    midiAccess = access;
    S.midiEnabled = true;
    // Stop mic detection — MIDI and mic use the same S.detectedNotes
    if (S.detecting) stopDetection();
    _attachMidiListeners();
    // Re-attach when devices connect/disconnect
    access.onstatechange = _attachMidiListeners;
    showToast("MIDI connected: " + access.inputs.size + " input(s)");
    render();
  }).catch(function() {
    showToast("MIDI access denied. Check browser permissions.");
    render();
  });
}

function stopMidi() {
  if (midiAccess) {
    midiAccess.inputs.forEach(function(input) { input.onmidimessage = null; });
    midiAccess.onstatechange = null;
  }
  midiAccess = null;
  midiNotesHeld = {};
  S.midiEnabled = false;
  S.detectedNotes = [];
  saveState();
  render();
}

function _attachMidiListeners() {
  if (!midiAccess) return;
  midiAccess.inputs.forEach(function(input) {
    input.onmidimessage = _handleMidiMessage;
  });
}

function _handleMidiMessage(event) {
  var data = event.data;
  var status = data[0] & 0xF0;
  var note   = data[1];
  var velocity = data[2];

  if (status === 0x90 && velocity > 0) {
    // Note On — play through Web Audio with MIDI velocity
    midiNotesHeld[note] = true;
    playNote(note, 1.5, 0, velocity / 127);
  } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
    // Note Off
    delete midiNotesHeld[note];
  } else if (status === 0xB0 && note === 64) {
    // Sustain pedal — keep all currently held notes sustained when pedal released
    // (no-op for chord detection purposes)
    return;
  } else {
    return; // ignore other MIDI messages
  }

  // Forward to performance input if in performance mode
  if(typeof PerformanceInput!=="undefined" && S.screen===SCR.PERFORM){
    try{ PerformanceInput.onMidiMessage(event); }catch(e){}
  }

  // Rebuild S.detectedNotes from held pitch classes
  var held = Object.keys(midiNotesHeld).map(Number);
  var noteNames = [];
  held.forEach(function(n) {
    var name = midiToNote(n);
    if (name && noteNames.indexOf(name) < 0) noteNames.push(name);
  });
  S.detectedNotes = noteNames;
  render();
}

function getMidiInputNames() {
  if (!midiAccess) return [];
  var names = [];
  midiAccess.inputs.forEach(function(input) { names.push(input.name); });
  return names;
}

// ===== STEM PLAYBACK =====
var _stemAudios = {};
var _stemTimeUpdater = null;
var STEM_NAMES = ["vocals","drums","bass","guitar","piano","other"];
var STEM_COLORS = {vocals:"#FF6B6B",drums:"#FFE66D",bass:"#4ECDC4",guitar:"#FF8A5C",piano:"#45B7D1",other:"#A78BFA"};
var STEM_ICONS = {vocals:"\u{1F3A4}",drums:"\u{1F941}",bass:"\u{1F3B8}",guitar:"\u{1F3BA}",piano:"\u{1F3B9}",other:"\u{1F3B6}"};

function loadStemUrls(urlMap) {
  cleanupStems();
  var keys = Object.keys(urlMap);
  for (var i = 0; i < keys.length; i++) {
    var name = keys[i];
    var audio = new Audio();
    audio.preload = "auto";
    audio.src = urlMap[name];
    audio.muted = !S.stemToggles[name];
    audio.volume = S.stemVolume;
    _stemAudios[name] = audio;
  }
  var first = _stemAudios[keys[0]];
  if (first) {
    first.addEventListener("loadedmetadata", function() {
      S.stemDuration = first.duration;
      render();
    });
  }
}

function _loadStemFileUrls(paths) {
  if (!window.electron || !paths) return;
  var names = Object.keys(paths);
  var urlMap = {};
  var loaded = 0;
  for (var i = 0; i < names.length; i++) {
    (function(name) {
      window.electron.stems.getFileUrl(paths[name]).then(function(url) {
        urlMap[name] = url;
        loaded++;
        if (loaded === names.length) {
          loadStemUrls(urlMap);
          S.stemStatus = "ready";
          for (var j = 0; j < STEM_NAMES.length; j++) {
            var sn = STEM_NAMES[j];
            if (urlMap[sn]) setStemMuted(sn, !S.stemToggles[sn]);
          }
          setStemVolume(S.stemVolume);
        }
      });
    })(names[i]);
  }
}

function playStems() {
  var keys = Object.keys(_stemAudios);
  if (keys.length === 0) return;
  for (var i = 0; i < keys.length; i++) {
    _stemAudios[keys[i]].play().catch(function(){});
  }
  S.stemPlaying = true;
  clearInterval(_stemTimeUpdater);
  _stemTimeUpdater = setInterval(function() {
    var first = _stemAudios[Object.keys(_stemAudios)[0]];
    if (first) {
      S.stemCurrentTime = first.currentTime;
      if (first.ended) { S.stemPlaying = false; clearInterval(_stemTimeUpdater); }
      render();
    }
  }, 250);
  render();
}

function pauseStems() {
  var keys = Object.keys(_stemAudios);
  for (var i = 0; i < keys.length; i++) _stemAudios[keys[i]].pause();
  S.stemPlaying = false;
  clearInterval(_stemTimeUpdater);
  render();
}

function seekStems(time) {
  var keys = Object.keys(_stemAudios);
  for (var i = 0; i < keys.length; i++) _stemAudios[keys[i]].currentTime = time;
  S.stemCurrentTime = time;
  render();
}

function setStemMuted(name, muted) {
  if (_stemAudios[name]) _stemAudios[name].muted = muted;
}

function setStemVolume(vol) {
  var keys = Object.keys(_stemAudios);
  for (var i = 0; i < keys.length; i++) _stemAudios[keys[i]].volume = vol;
}

function setStemPlaybackRate(rate) {
  var keys = Object.keys(_stemAudios);
  for (var i = 0; i < keys.length; i++) {
    _stemAudios[keys[i]].playbackRate = rate;
  }
}

function getFirstStemAudio() {
  var keys = Object.keys(_stemAudios);
  return keys.length ? _stemAudios[keys[0]] : null;
}

function cleanupStems() {
  var keys = Object.keys(_stemAudios);
  for (var i = 0; i < keys.length; i++) {
    try { _stemAudios[keys[i]].pause(); _stemAudios[keys[i]].src = ""; } catch(e) {}
  }
  _stemAudios = {};
  clearInterval(_stemTimeUpdater);
  S.stemPlaying = false;
  S.stemCurrentTime = 0;
  S.stemDuration = 0;
}
