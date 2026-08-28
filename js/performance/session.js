/* ===== ChordSpark Performance: Session Orchestrator ===== */

var _performRAF = null;
var _performStopping = false;
var _performDirectAudio = null;

function getPerformanceSessionCore() {
  if (typeof window !== "undefined" && window.sparkCore) return window.sparkCore;
  if (typeof sparkCore !== "undefined") return sparkCore;
  return null;
}

function cleanupPerformanceDirectAudio() {
  if (!_performDirectAudio) return;
  try { _performDirectAudio.pause(); } catch (e) {}
  try { _performDirectAudio.currentTime = 0; } catch (e2) {}
  _performDirectAudio = null;
}

function loadPerformanceDirectAudio(src) {
  return new Promise(function(resolve, reject) {
    var audio;
    var onReady;
    var onError;
    if (!src) {
      resolve(null);
      return;
    }
    cleanupPerformanceDirectAudio();
    audio = new Audio(src);
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    onReady = function() {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
      _performDirectAudio = audio;
      resolve(audio);
    };
    onError = function() {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
      reject(new Error("Audio backing load failed"));
    };
    audio.addEventListener("canplaythrough", onReady);
    audio.addEventListener("error", onError);
    audio.load();
  });
}

function playPerformanceDirectAudio(fromSec, speed) {
  if (!_performDirectAudio) return;
  try {
    _performDirectAudio.playbackRate = speed || 1;
    _performDirectAudio.currentTime = Math.max(0, fromSec || 0);
  } catch (e) {}
  _performDirectAudio.play().catch(function(){});
}

function pausePerformanceDirectAudio() {
  if (!_performDirectAudio) return;
  try { _performDirectAudio.pause(); } catch (e) {}
}

function seekPerformanceDirectAudio(sec, speed) {
  if (!_performDirectAudio) return;
  try {
    _performDirectAudio.playbackRate = speed || 1;
    _performDirectAudio.currentTime = Math.max(0, sec || 0);
  } catch (e) {}
}

function resolvePerformanceSessionInstrumentCandidate(candidate) {
  var active;
  var all;
  var i;
  var entry;
  if (!candidate && typeof SparkInstruments !== "undefined" && SparkInstruments && typeof SparkInstruments.getActive === "function") {
    active = SparkInstruments.getActive();
    candidate = active ? (active.instrument || active.instrumentType || active.id || active.appId || null) : null;
  }
  if (!candidate) return null;
  if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getAll !== "function") {
    return candidate;
  }
  all = SparkInstruments.getAll() || [];
  for (i = 0; i < all.length; i++) {
    entry = all[i] || {};
    if (entry.id === candidate || entry.appId === candidate || entry.instrument === candidate) {
      return entry.instrument || entry.instrumentType || candidate;
    }
  }
  return candidate;
}

function resolvePerformanceChartSupportedInstruments(chart, chartId) {
  var meta = typeof getPerformanceChartMeta === "function" ? getPerformanceChartMeta(chartId) : null;
  var supported = chart && Array.isArray(chart.supportedInstruments) ? chart.supportedInstruments.slice() : null;
  if (!supported && meta && Array.isArray(meta.supportedInstruments)) supported = meta.supportedInstruments.slice();
  if (!supported || !supported.length) return [];
  return supported.map(function(instrument) {
    return resolvePerformanceSessionInstrumentCandidate(instrument);
  }).filter(function(instrument, index, list) {
    return !!instrument && list.indexOf(instrument) === index;
  });
}

function resolvePerformanceStartInstrument(chart, chartId, opts) {
  opts = opts || {};
  var requested = resolvePerformanceSessionInstrumentCandidate(opts.instrument || null);
  var active = resolvePerformanceSessionInstrumentCandidate(null);
  var meta = typeof getPerformanceChartMeta === "function" ? getPerformanceChartMeta(chartId) : null;
  var explicit = resolvePerformanceSessionInstrumentCandidate(
    (chart && (chart.instrument || chart.instrumentType || chart.adapterType)) ||
    (meta && (meta.instrument || meta.instrumentType || meta.adapterType)) ||
    null
  );
  var supported = resolvePerformanceChartSupportedInstruments(chart, chartId);
  if (requested && supported.length && supported.indexOf(requested) >= 0) return requested;
  if (active && supported.length && supported.indexOf(active) >= 0) return active;
  if (requested && !explicit) return requested;
  if (active && !explicit) return active;
  return explicit || requested || active || "guitar";
}

function applyPerformanceChartInstrumentContext(chart, chartId, opts) {
  var resolvedInstrument;
  var supported;
  var explicitInstrument;
  if (!chart) return chart;
  resolvedInstrument = resolvePerformanceStartInstrument(chart, chartId, opts);
  supported = resolvePerformanceChartSupportedInstruments(chart, chartId);
  explicitInstrument = chart.instrument || chart.instrumentType || chart.adapterType || null;
  chart.supportedInstruments = supported.length ? supported.slice() : (Array.isArray(chart.supportedInstruments) ? chart.supportedInstruments.slice() : []);
  if (!explicitInstrument || (supported.length && supported.indexOf(resolvedInstrument) >= 0)) {
    chart.instrument = resolvedInstrument;
    chart.instrumentType = resolvedInstrument;
    chart.adapterType = resolvedInstrument;
  }
  return chart;
}

function startPerformanceCountIn(chart, speed, onDone) {
  var bpm = chart.bpm || 90;
  var beatSec = (60 / bpm) / (speed || 1);
  var beats = (typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.countInBeats : 4;
  S.performCountdownActive = true;
  S.performCountdownBeats = beats;
  render();

  // Use Web Audio API scheduler for sample-accurate beat timing
  var ctx = null;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}

  function scheduleClick(time, accent) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accent ? 1200 : 800;
    osc.type = "square";
    gain.gain.setValueAtTime(accent ? 0.3 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  // Schedule all beats upfront for perfect timing
  var startAudioTime = ctx ? ctx.currentTime + 0.05 : 0;
  var startWallTime = performance.now() + 50;

  for (var i = 0; i < beats; i++) {
    if (ctx && S.soundOn) {
      scheduleClick(startAudioTime + i * beatSec, i === 0);
    }
  }

  // Visual updates via requestAnimationFrame polling (non-blocking)
  var countInActive = true;
  function updateCountInVisual() {
    if (!countInActive) return;
    var elapsed = (performance.now() - startWallTime) / 1000;
    var currentBeat = Math.floor(elapsed / beatSec);
    var remaining = beats - currentBeat;

    if (remaining !== S.performCountdownBeats && remaining >= 0) {
      S.performCountdownBeats = remaining;
      var countEl = document.querySelector("[data-count-in]");
      if (countEl) {
        if (remaining > 0) {
          countEl.textContent = remaining;
          countEl.style.transform = "scale(1.2)";
          setTimeout(function() { if (countEl) countEl.style.transform = "scale(1)"; }, 100);
        } else {
          countEl.parentElement.style.display = "none";
        }
      }
    }

    if (elapsed >= beats * beatSec) {
      countInActive = false;
      S.performCountdownActive = false;
      S.performCountdownBeats = 0;
      if (ctx) { try { ctx.close(); } catch(e) {} }
      onDone();
      return;
    }
    requestAnimationFrame(updateCountInVisual);
  }
  requestAnimationFrame(updateCountInVisual);
}

function startPerformance(chartIdOrChart, opts) {
  opts = opts || {};
  _performStopping = false;
  stopAllTimers();

  var chartPromise;
  if (typeof chartIdOrChart === "string") {
    chartPromise = loadPerformanceChart(chartIdOrChart);
  } else if (chartIdOrChart && chartIdOrChart.events) {
    chartPromise = Promise.resolve(normalizePerformanceChart(chartIdOrChart));
  } else {
    console.error("ChordSpark: invalid chart argument");
    return;
  }

  chartPromise.then(function(chart) {
    var chartId = typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated");
    chart = applyPerformanceChartInstrumentContext(chart, chartId, opts);
    if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
      SparkPerformanceBridge.syncPerformanceRuntimeState("start", {
        chart: chart,
        chartId: chartId,
        phraseStats: createEmptyPhraseStats(chart),
        mode: opts.mode || S.performMode,
        difficulty: opts.difficulty || S.performDifficulty,
        speed: opts.speed || S.performSpeed,
        preset: opts.preset || S.performPracticePreset,
        screen: SCR.PERFORM
      });
    } else {
      S.performChart = chart;
      S.performChartId = chartId;
      S.performPlaying = true;
      S.performPaused = false;
      S.performCurrentSec = 0;
      S.performStartSec = 0;
      S.performScore = 0;
      S.performCombo = 0;
      S.performMaxCombo = 0;
      S.performAccuracy = 0;
      S.performPhraseIdx = 0;
      S.performResults = null;
      S.performStarRating = 0;
      S.performLoop = null;
      S.performLastHitLabel = "";
      S.performLastHitTime = 0;
      S.performPhraseStats = createEmptyPhraseStats(chart);
      if (opts.mode) S.performMode = opts.mode;
      if (opts.difficulty) S.performDifficulty = opts.difficulty;
      if (opts.speed) S.performSpeed = opts.speed;
      if (opts.preset) S.performPracticePreset = opts.preset;
      S.performInputSource = S.performMode;
    }
    var core = getPerformanceSessionCore();
    if (core && typeof core.syncPerformanceRuntimeState === "function") {
      core.syncPerformanceRuntimeState("start", {
        chartId: chartId,
        difficulty: opts.difficulty || S.performDifficulty,
        arrangementType: chart.arrangementType || S.performArrangementType,
        speed: opts.speed || S.performSpeed,
        mode: opts.mode || S.performMode,
        preset: opts.preset || S.performPracticePreset,
        countIn: !!S.performCountIn,
        targetTechnique: Object.prototype.hasOwnProperty.call(opts, "targetTechnique")
          ? opts.targetTechnique
          : (S.performTargetTechnique || null)
      });
    }

    // Apply difficulty profile to state windows
    applyPerformanceDifficultyToState(S.performDifficulty);
    // Apply config-driven runtime values
    if (typeof PERFORMANCE_CONFIG !== "undefined") {
      S.performScrollSpeed = PERFORMANCE_CONFIG.highway.scrollSpeed;
      S.performHighwayLookaheadSec = PERFORMANCE_CONFIG.highway.lookaheadSec;
    }

    PerformanceInput.start(S.performMode);
    applyPerformanceStemPreset(S.performPracticePreset);

    // Load stems if song has imported audio
    var songId = typeof resolvePerformanceSongId === "function"
      ? resolvePerformanceSongId(S.performSongData, S.performSongData && S.performSongData.title)
      : (S.performSongData && S.performSongData.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    var audioData = S.songAudioData[songId];
    var hasStemAudio = audioData && audioData.stemUrls && Object.keys(audioData.stemUrls).length > 0;

    if (hasStemAudio) {
      loadStemUrls(audioData.stemUrls);
      applyPerformanceStemPreset(S.performPracticePreset);
      if (audioData.detectedBpm && chart.bpm) {
        chart._effectiveBpm = audioData.detectedBpm;
      }
    }

    var chartSongAudio = chart.songId && typeof resolvePerformanceSongAudioAsset === "function"
      ? resolvePerformanceSongAudioAsset(chart.songId)
      : Promise.resolve(null);
    // Load MIDI backing track if chart specifies one
    Promise.all([chartSongAudio]).then(function(results){
    var resolvedSongAudio = results && results[0] ? results[0] : null;
    var backingAudio = resolvedSongAudio || chart.audio || { type: "silent" };
    var hasDirectAudio = !hasStemAudio && backingAudio && backingAudio.type === "audio" && backingAudio.src;
    var hasMidiBacking = !hasStemAudio && !hasDirectAudio && backingAudio && backingAudio.type === "midi" && backingAudio.src;
    var audioReady = hasDirectAudio
      ? (typeof loadPerformanceDirectAudio === "function" ? loadPerformanceDirectAudio(backingAudio.src) : Promise.resolve())
      : Promise.resolve();
    var midiReady = hasMidiBacking
      ? (typeof loadMidiBacking === "function" ? loadMidiBacking(backingAudio.src) : Promise.resolve())
      : Promise.resolve();
    Promise.all([audioReady, midiReady]).then(function(readyResults){
    var directAudio = readyResults && readyResults[0] ? readyResults[0] : _performDirectAudio;
    if (S.performCountIn) {
      startPerformanceCountIn(chart, S.performSpeed, function() {
        PerformanceTransport.start(0, S.performSpeed);
        if (hasStemAudio) {
          playStems();
          var firstStem = typeof getFirstStemAudio === "function" ? getFirstStemAudio() : null;
          if (firstStem) PerformanceTransport.setAudioSource(firstStem);
        }
        if (hasDirectAudio && directAudio) {
          playPerformanceDirectAudio(0, S.performSpeed);
          PerformanceTransport.setAudioSource(directAudio);
        }
        if (hasMidiBacking && typeof playMidiBacking === "function") playMidiBacking(0, S.performSpeed);
        render();
        _performRAF = requestAnimationFrame(updatePerformanceFrame);
      });
    } else {
      PerformanceTransport.start(0, S.performSpeed);
      if (hasStemAudio) {
        playStems();
        var firstStem = typeof getFirstStemAudio === "function" ? getFirstStemAudio() : null;
        if (firstStem) PerformanceTransport.setAudioSource(firstStem);
      }
      if (hasDirectAudio && directAudio) {
        playPerformanceDirectAudio(0, S.performSpeed);
        PerformanceTransport.setAudioSource(directAudio);
      }
      if (hasMidiBacking && typeof playMidiBacking === "function") playMidiBacking(0, S.performSpeed);
      render();
      _performRAF = requestAnimationFrame(updatePerformanceFrame);
    }
    }).catch(function(e){ console.warn("Performance backing load failed:", e); });
    }).catch(function(e){ console.warn("Song audio resolve failed:", e); });
  }).catch(function(err) {
    console.error("ChordSpark: Failed to start performance:", err);
    if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
      SparkPerformanceBridge.syncPerformanceRuntimeState("start_failed", {
        screen: SCR.HOME,
        tab: TAB.SONGS
      });
    } else {
      S.screen = SCR.HOME;
      S.tab = TAB.SONGS;
    }
    var startFailedCore = getPerformanceSessionCore();
    if (startFailedCore && typeof startFailedCore.syncPerformanceRuntimeState === "function") {
      startFailedCore.syncPerformanceRuntimeState("start_failed", {
        screen: "home"
      });
    }
    render();
  });
}

window.resolvePerformanceStartInstrument = resolvePerformanceStartInstrument;
window.applyPerformanceChartInstrumentContext = applyPerformanceChartInstrumentContext;

function stopPerformance() {
  destroySparkHighway();
  if (typeof cleanupStems === "function") cleanupStems();
  cleanupPerformanceDirectAudio();
  if (typeof stopMidiBacking === "function") stopMidiBacking();
  PerformanceTransport.stop();
  _performStopping = true;
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  try { PerformanceTransport.stop(); } catch(e) {}
  try { PerformanceInput.stop(); } catch(e) {}
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("stop");
  } else {
    S.performPlaying = false;
    S.performPaused = false;
  }
  var stopCore = getPerformanceSessionCore();
  if (stopCore && typeof stopCore.syncPerformanceRuntimeState === "function") {
    stopCore.syncPerformanceRuntimeState("stop", {
      screen: "performance_song"
    });
  }
}

function resetPerformanceEvents(chart, rangeStartSec, rangeEndSec) {
  if (!chart || !Array.isArray(chart.events)) return;
  var useRange = typeof rangeStartSec === "number" && typeof rangeEndSec === "number";
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (useRange && (evt.t < rangeStartSec || evt.t >= rangeEndSec)) continue;
    evt._hit = false;
    evt._miss = false;
    evt._scored = false;
    evt._result = null;
    evt._score = 0;
  }
}

function pausePerformance() {
  PerformanceTransport.pause();
  if (typeof pauseStems === "function") pauseStems();
  pausePerformanceDirectAudio();
  if (typeof pauseMidiBacking === "function") pauseMidiBacking();
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("pause");
  } else {
    S.performPaused = true;
    S.performPlaying = false;
  }
  var pauseCore = getPerformanceSessionCore();
  if (pauseCore && typeof pauseCore.syncPerformanceRuntimeState === "function") {
    pauseCore.syncPerformanceRuntimeState("pause");
  }
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  render();
}

function resumePerformance() {
  PerformanceTransport.resume();
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("resume");
  } else {
    S.performPaused = false;
    S.performPlaying = true;
  }
  var resumeCore = getPerformanceSessionCore();
  if (resumeCore && typeof resumeCore.syncPerformanceRuntimeState === "function") {
    resumeCore.syncPerformanceRuntimeState("resume");
  }
  if (typeof playStems === "function") playStems();
  if (_performDirectAudio) playPerformanceDirectAudio(S.performCurrentSec, S.performSpeed);
  if (typeof playMidiBacking === "function" && S.performChart && S.performChart.audio && S.performChart.audio.type === "midi") {
    playMidiBacking(S.performCurrentSec, S.performSpeed);
  }
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
  render();
}

function seekPerformance(sec) {
  PerformanceTransport.seek(sec);
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("seek", { sec: sec });
  } else {
    S.performCurrentSec = sec;
  }
  var seekCore = getPerformanceSessionCore();
  if (seekCore && typeof seekCore.syncPerformanceRuntimeState === "function") {
    seekCore.syncPerformanceRuntimeState("seek", { sec: sec });
  }
  if (typeof seekStems === "function") seekStems(sec);
  seekPerformanceDirectAudio(sec, S.performSpeed);
  if (typeof seekMidiBacking === "function") seekMidiBacking(sec, S.performSpeed);
  render();
}

function setPerformanceLoop(loopObj) {
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("set_loop", { loop: loopObj });
  } else {
    S.performLoop = loopObj;
  }
  var loopCore = getPerformanceSessionCore();
  if (loopCore && typeof loopCore.syncPerformanceRuntimeState === "function") {
    loopCore.syncPerformanceRuntimeState("set_loop", { loop: loopObj });
  }
  render();
}

function clearPerformanceLoop() {
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("clear_loop");
  } else {
    S.performLoop = null;
  }
  var clearLoopCore = getPerformanceSessionCore();
  if (clearLoopCore && typeof clearLoopCore.syncPerformanceRuntimeState === "function") {
    clearLoopCore.syncPerformanceRuntimeState("clear_loop");
  }
  render();
}

function updatePerformanceFrame() {
  if (_performStopping || !S.performPlaying || S.performPaused) return;

  var nowSec = PerformanceTransport.now();
  S.performCurrentSec = nowSec;
  var tickCore = getPerformanceSessionCore();
  if (tickCore && typeof tickCore.syncPerformanceRuntimeState === "function") {
    tickCore.syncPerformanceRuntimeState("tick", { sec: nowSec, status: "running" });
  }
  S.performPhraseIdx = getPerformancePhraseIndexForTime(S.performChart, nowSec);

  maybeScorePendingEvents(nowSec);

  // Loop enforcement
  if (S.performLoop && nowSec >= S.performLoop.endSec) {
    PerformanceTransport.seek(S.performLoop.startSec);
    resetPerformanceEvents(S.performChart, S.performLoop.startSec, S.performLoop.endSec);
    _updatePerformDisplay();
    _performRAF = requestAnimationFrame(updatePerformanceFrame);
    return;
  }

  // Check if past end of chart
  if (!S.performChart || !S.performChart.phrases || !S.performChart.phrases.length) { finishPerformance(); return; }
  var lastPhrase = S.performChart.phrases[S.performChart.phrases.length - 1];
  if (lastPhrase && nowSec > lastPhrase.endSec + 1) {
    finishPerformance();
    return;
  }

  _updatePerformDisplay();
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
}

function _updatePerformDisplay() {
  // Initialize canvas highway on first frame
  var canvas = document.getElementById("spark-highway-canvas");
  if (canvas) {
    if (typeof ensureSparkHighway === "function") ensureSparkHighway(canvas, S.performChart);
    if (S.performChart) feedChartToHighway(S.performChart);
    updateSparkHighway(S.performCurrentSec, S.performCombo);
  }

  // Update score strip (targeted, no full rebuild)
  var scoreEls = document.querySelectorAll(".perform-stat-val");
  if (scoreEls.length >= 3) {
    scoreEls[0].textContent = S.performScore;
    scoreEls[1].textContent = S.performAccuracy + "%";
    scoreEls[2].textContent = S.performCombo + "x";
  }

  // Update phrase name
  var phraseEl = document.querySelector(".perform-phrase-name");
  if (phraseEl) {
    var phrase = getPerformancePhraseForTime(S.performChart, S.performCurrentSec);
    phraseEl.textContent = phrase ? phrase.name : "";
  }

  var importedOverlayEl = document.getElementById("perform-imported-overlay");
  if (importedOverlayEl && typeof renderImportedTechniqueOverlay === "function") {
    importedOverlayEl.innerHTML = renderImportedTechniqueOverlay(S.performChart, S.performCurrentSec, 3);
  }
}

var _performanceInputJudge = null;
function getPerformanceInputJudge() {
  if (!_performanceInputJudge && typeof SparkInputJudge === "function") {
    _performanceInputJudge = new SparkInputJudge();
  }
  return _performanceInputJudge;
}

function maybeScorePendingEvents(nowSec) {
  var chart = S.performChart;
  if (!chart) return;
  var snapshot = PerformanceInput.getSnapshot(nowSec);
  S.performInputSource = PerformanceInput.activeMode;
  S.performInputNotes = snapshot.pitchClasses.slice();
  // Single latency model: resolve the active input offset (global +
  // per-mode) through the shared helper so live scoring honors the global
  // calibration offset too — the old inline read used only the mode-specific
  // field. Inline math kept as a no-helper fallback.
  var offsetMs = typeof getActivePerformanceOffsetMs === "function"
    ? getActivePerformanceOffsetMs(S.performMode)
    : (S.performMode === "midi"
      ? (S.performMidiOffsetMs || 0)
      : (typeof getStoredPerformanceMicOffsetMs === "function" ? getStoredPerformanceMicOffsetMs() : (S.performMicOffsetMs || 0)));
  var targetTechnique = S.performTargetTechnique || null;

  // Pass 1: expire events whose window has closed, and collect the events
  // still in-window whose current snapshot shows *some* activity — these are
  // the candidates competing for this frame's input.
  var candidates = [];
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (evt._scored) continue;

    var deltaMs = (nowSec - evt.t) * 1000 - offsetMs;

    if (deltaMs < -S.performWindowMissMs) continue;

    // Past miss window — mark as miss
    if (deltaMs > S.performWindowMissMs && !evt._hit) {
      evt._scored = true;
      evt._miss = true;
      evt._result = { score: 0, grade: "miss", noteScore: 0, timingScore: 0 };
      evt._score = 0;
      updatePhraseStats(S.performPhraseStats, evt, evt._result);
      S.performCombo = 0;
      if (evt.sourceFlags && targetTechnique && evt.sourceFlags[targetTechnique] && typeof buildPerformanceFeedbackLabel === "function") {
        S.performLastHitLabel = buildPerformanceFeedbackLabel(evt, evt._result, targetTechnique);
        S.performLastHitTime = Date.now();
      }
      _updatePerformanceAccuracy(chart);
      continue;
    }

    // In scoring window — a candidate if the current input snapshot shows activity
    if (performanceSnapshotHasActivity(snapshot, evt, S.performMode)) {
      candidates.push({ evt: evt, timeSec: evt.t, hit: false, missed: false });
    }
  }

  if (!candidates.length) return;

  // Pass 2: pick the single closest genuinely-matching candidate for this
  // frame's input through the same shared judge rhythm mode uses, instead of
  // independently scoring every in-window event off the same input activity
  // (which let a farther, worse-matching event steal or double-claim credit
  // that belonged to the closest match).
  var inputJudge = getPerformanceInputJudge();
  var winnerCandidate = null;
  var winnerResult = null;

  if (inputJudge) {
    var offsetNowSec = nowSec - offsetMs / 1000;
    var resolution = inputJudge.resolve(
      candidates,
      { atSec: offsetNowSec },
      { hitWindowMs: { miss: S.performWindowMissMs } },
      function(note) {
        var candidateDeltaMs = (nowSec - note.evt.t) * 1000 - offsetMs;
        var candidateResult = scorePerformanceEvent(note.evt, snapshot, candidateDeltaMs, S.performDifficulty, S.performMode);
        note._candidateResult = candidateResult;
        return candidateResult.grade !== "miss";
      }
    );
    if (resolution.matched && resolution.reason !== "wrong_fret" && resolution.note) {
      winnerCandidate = resolution.note;
      winnerResult = winnerCandidate._candidateResult;
    }
  } else {
    // No shared judge available (older build/test harness) — fall back to
    // scoring the closest candidate directly rather than skipping the frame.
    winnerCandidate = candidates[0];
    var fallbackDeltaMs = (nowSec - winnerCandidate.evt.t) * 1000 - offsetMs;
    var fallbackResult = scorePerformanceEvent(winnerCandidate.evt, snapshot, fallbackDeltaMs, S.performDifficulty, S.performMode);
    if (fallbackResult.grade !== "miss") winnerResult = fallbackResult;
  }

  if (!winnerCandidate || !winnerResult) return;

  var winnerEvt = winnerCandidate.evt;
  winnerEvt._scored = true;
  winnerEvt._hit = true;
  winnerEvt._result = winnerResult;
  winnerEvt._score = winnerResult.score;
  if (typeof notifyHighwayHit === "function") notifyHighwayHit(winnerEvt);
  updatePhraseStats(S.performPhraseStats, winnerEvt, winnerResult);

  S.performCombo++;
  if (S.performCombo > S.performMaxCombo) S.performMaxCombo = S.performCombo;

  var comboMult = Math.min(1 + S.performCombo * 0.1, 4);
  S.performScore += Math.round(100 * winnerResult.score * comboMult);

  S.performLastHitLabel = typeof buildPerformanceFeedbackLabel === "function"
    ? buildPerformanceFeedbackLabel(winnerEvt, winnerResult, targetTechnique)
    : (winnerResult.grade.toUpperCase() + "!");
  S.performLastHitTime = Date.now();

  _updatePerformanceAccuracy(chart);
}

function _updatePerformanceAccuracy(chart) {
  var scored = 0, hits = 0;
  for (var i = 0; i < chart.events.length; i++) {
    if (chart.events[i]._scored) {
      scored++;
      if (chart.events[i]._hit) hits++;
    }
  }
  S.performAccuracy = scored > 0 ? Math.round((hits / scored) * 100) : 0;
}

function resolvePerformanceInstrumentEntry(candidate) {
  if (!candidate) return null;
  var key = null;
  if (typeof candidate === "string") {
    key = candidate;
    candidate = { id: key, appId: key, instrument: key };
  } else {
    key = candidate.id || candidate.appId || candidate.instrumentId || candidate.instrument || null;
  }
  if (typeof SparkInstruments === "undefined" || typeof SparkInstruments.getAll !== "function" || !key) {
    return candidate;
  }
  var entries = SparkInstruments.getAll() || [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i] || {};
    if (entry.id === key || entry.appId === key || entry.instrument === key) return entry;
  }
  return candidate;
}

function resolvePerformanceStemTarget() {
  var activeInstrument = typeof SparkInstruments !== "undefined" && typeof SparkInstruments.getActive === "function"
    ? resolvePerformanceInstrumentEntry(SparkInstruments.getActive())
    : null;
  var chartInstrument = S.performChart
    ? resolvePerformanceInstrumentEntry(S.performChart.instrument || S.performChart.instrumentType || S.performChart.adapterType || null)
    : null;
  var instrumentType = activeInstrument && activeInstrument.instrument
    ? activeInstrument.instrument
    : (chartInstrument && chartInstrument.instrument ? chartInstrument.instrument : null);
  var stemPreset = activeInstrument && activeInstrument.stemMutePreset
    ? activeInstrument.stemMutePreset
    : (chartInstrument && chartInstrument.stemMutePreset ? chartInstrument.stemMutePreset : null);
  var defaultStemByInstrument = {
    guitar: "guitar",
    ukulele: "guitar",
    bass: "bass",
    piano: "piano",
    drums: "drums"
  };
  var preferredStem = defaultStemByInstrument[instrumentType] || "guitar";
  if (stemPreset && Object.prototype.hasOwnProperty.call(stemPreset, preferredStem)) return preferredStem;
  if (stemPreset) {
    for (var stemName in stemPreset) {
      if (Object.prototype.hasOwnProperty.call(stemPreset, stemName) && stemPreset[stemName] === false) {
        return stemName;
      }
    }
  }
  return preferredStem;
}

function getPerformancePracticePresetStemLabel() {
  var stem = resolvePerformanceStemTarget();
  var labels = {
    guitar: "Guitar",
    bass: "Bass",
    piano: "Piano",
    drums: "Drums",
    vocals: "Vocals",
    other: "Other"
  };
  return labels[stem] || "Instrument";
}

function applyPerformanceStemPreset(preset) {
  S.performPracticePreset = preset;
  if (typeof setStemMuted !== "function") return;
  var targetStem = resolvePerformanceStemTarget();
  var stems = ["guitar", "vocals", "drums", "bass", "piano", "other"];
  if (stems.indexOf(targetStem) === -1) stems.push(targetStem);
  if (typeof setStemVolume === "function") setStemVolume(0.8);
  switch (preset) {
    case "full_mix":
      for (var i = 0; i < stems.length; i++) setStemMuted(stems[i], false);
      break;
    case "no_guitar":
      for (var j = 0; j < stems.length; j++) setStemMuted(stems[j], stems[j] === targetStem);
      break;
    case "guitar_quiet":
      for (var k = 0; k < stems.length; k++) setStemMuted(stems[k], false);
      if (typeof setStemVolume === "function") setStemVolume(0.3);
      break;
    case "guitar_solo":
      for (var m = 0; m < stems.length; m++) setStemMuted(stems[m], stems[m] !== targetStem);
      break;
  }
}

function finishPerformance() {
  stopPerformance();
  var results = finalizePerformanceResults(S.performChart, S.performPhraseStats, {
    focusedTechnique: S.performTargetTechnique || null,
    // The live HUD score is combo-multiplied; report the same value on the
    // results screen so the two "Score" displays agree.
    liveScore: S.performScore
  });
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("finish", {
      results: results,
      screen: SCR.PERFORM_DONE
    });
  } else {
    S.performResults = results;
    S.performStarRating = results.stars;
  }
  var finishCore = getPerformanceSessionCore();
  if (finishCore && typeof finishCore.syncPerformanceRuntimeState === "function") {
    finishCore.syncPerformanceRuntimeState("finish", {
      screen: "perform_done"
    });
  }

  var xpAward = Math.max(5, Math.round(S.performResults.accuracy / 10));
  var corePerformanceResult = null;
  if (finishCore && typeof finishCore.completeSession === "function") {
    var completionRequest = typeof finishCore.buildPerformanceCompletionRequest === "function"
      ? finishCore.buildPerformanceCompletionRequest({
          performanceResults: S.performResults,
          xpAwarded: xpAward,
          chartId: S.performChartId || "unknown",
          arrangementType: (S.performChart && S.performChart.arrangementType) || S.performArrangementType,
          difficultyId: S.performDifficulty
        })
      : {
          flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
          markPlanComplete: true,
          performanceResults: S.performResults,
          xpAwarded: xpAward
        };
    corePerformanceResult = finishCore.completeSession(completionRequest);
    if (corePerformanceResult && typeof corePerformanceResult.xpAwarded === "number") {
      xpAward = corePerformanceResult.xpAwarded;
    }
  } else if (window.SparkProgressBridge) {
    SparkProgressBridge.applyLegacyReward({ xpDelta: xpAward, toastAmount: xpAward });
  } else {
    S.xp += xpAward; S.xpToast = { amount: xpAward, time: Date.now() };
  }
  // Phase 7: the core's completeSession above is the single progression
  // driver for performance finishes — the dual-path shadow observer that
  // used to run here is retired.
  logHistory("perform", S.performResults.title + " - " + S.performResults.accuracy + "% accuracy", xpAward);

  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.applyPerformanceRunOutcome === "function") {
    SparkPerformanceBridge.applyPerformanceRunOutcome({
      chartId: S.performChartId || "unknown",
      chart: S.performChart,
      results: S.performResults,
      difficulty: S.performDifficulty
    });
  }

  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.applyPerformanceRunFollowOns === "function") {
    SparkPerformanceBridge.applyPerformanceRunFollowOns({
      chartId: S.performChartId || "unknown",
      chart: S.performChart,
      results: S.performResults,
      difficulty: S.performDifficulty,
      progressionStats: S.performanceStats && S.performanceStats[(S.performChartId || "unknown") + "_" + ((S.performChart && S.performChart.arrangementType) || "chords") + "_" + (S.performDifficulty || "normal")] || null,
      songStats: S.performSongStats && S.performSongStats[S.performChartId || "unknown"] || null
    });
  }

  if (typeof PerfEvents !== "undefined") PerfEvents.emit("performance_completed", {
    chartId: S.performChartId, accuracy: S.performResults.accuracy, stars: S.performResults.stars, score: S.performResults.score
  });

  saveState();
  S.screen = SCR.PERFORM_DONE;
  render();
}
