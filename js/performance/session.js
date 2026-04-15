/* ===== ChordSpark Performance: Session Orchestrator ===== */

var _performRAF = null;
var _performStopping = false;

function performanceSessionRead(path, fallback) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
    return SparkState.read(path, fallback);
  }
  if (!cursor) return fallback;
  for (i = 0; i < parts.length; i++) {
    if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function performanceSessionWrite(path, value) {
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if (!root && typeof globalThis !== "undefined") {
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
    return SparkState.write(path, value);
  }
  if (!cursor || !parts.length) return value;
  for (i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  return value;
}

function performanceSessionPatch(patch) {
  var key;
  patch = patch || {};
  for (key in patch) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) performanceSessionWrite(key, patch[key]);
  }
}

function buildPerformanceLaneDebugSnapshot(chart, nowSec) {
  if (!chart || !Array.isArray(chart.events)) {
    return { events: [], collapsed: false, distinctKeys: 0, distinctLanes: 0 };
  }

  var snapshot = [];
  var keys = {};
  var lanes = {};
  var distinctKeys = 0;
  var distinctLanes = 0;

  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (!evt) continue;
    if (typeof evt.t === "number" && evt.t + 0.05 < nowSec) continue;

    var key = "";
    if (typeof evt.chord === "string" && evt.chord) key = evt.chord;
    else if (typeof evt.laneLabel === "string" && evt.laneLabel) key = evt.laneLabel;
    else if (typeof evt.note === "string" && evt.note) key = evt.note;
    else if (Array.isArray(evt.notes) && evt.notes.length) key = evt.notes.join("+");

    var lane = (typeof evt.lane === "number" && evt.lane >= 0)
      ? evt.lane
      : ((typeof evt.laneMask === "number" && evt.laneMask > 0 && typeof getPrimaryLaneIndex === "function")
        ? getPrimaryLaneIndex(evt.laneMask)
        : null);

    if (key && !Object.prototype.hasOwnProperty.call(keys, key)) {
      keys[key] = true;
      distinctKeys++;
    }
    if (lane != null && !Object.prototype.hasOwnProperty.call(lanes, lane)) {
      lanes[lane] = true;
      distinctLanes++;
    }

    snapshot.push({
      id: evt.id || ("evt_" + i),
      t: typeof evt.t === "number" ? evt.t : null,
      chord: evt.chord || "",
      laneLabel: evt.laneLabel || "",
      lane: lane,
      laneMask: typeof evt.laneMask === "number" ? evt.laneMask : null
    });

    if (snapshot.length >= 6) break;
  }

  return {
    events: snapshot,
    distinctKeys: distinctKeys,
    distinctLanes: distinctLanes,
    collapsed: distinctKeys > 1 && distinctLanes <= 1
  };
}

function startPerformanceCountIn(chart, speed, onDone) {
  var bpm = chart.bpm || 90;
  var beatSec = (60 / bpm) / (speed || 1);
  var beats = (typeof PERFORMANCE_CONFIG !== "undefined") ? PERFORMANCE_CONFIG.countInBeats : 4;
  performanceSessionPatch({
    performCountdownActive: true,
    performCountdownBeats: beats
  });
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
    if (ctx && performanceSessionRead("soundOn", true)) {
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

    if (remaining !== performanceSessionRead("performCountdownBeats", 0) && remaining >= 0) {
      performanceSessionWrite("performCountdownBeats", remaining);
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
      performanceSessionPatch({
        performCountdownActive: false,
        performCountdownBeats: 0
      });
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
    var performMode = opts.mode || performanceSessionRead("performMode", null);
    var performDifficulty = opts.difficulty || performanceSessionRead("performDifficulty", null);
    var performSpeed = opts.speed || performanceSessionRead("performSpeed", 1);
    var performPreset = opts.preset || performanceSessionRead("performPracticePreset", null);
    var performArrangementType = chart.arrangementType || performanceSessionRead("performArrangementType", null);
    var performCountIn = !!performanceSessionRead("performCountIn", false);
    var performTargetTechnique = Object.prototype.hasOwnProperty.call(opts, "targetTechnique")
      ? opts.targetTechnique
      : (performanceSessionRead("performTargetTechnique", null) || null);
    if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
      SparkPerformanceBridge.syncPerformanceRuntimeState("start", {
        chart: chart,
        chartId: typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated"),
        phraseStats: createEmptyPhraseStats(chart),
        mode: performMode,
        difficulty: performDifficulty,
        speed: performSpeed,
        preset: performPreset,
        screen: SCR.PERFORM
      });
    } else {
      performanceSessionPatch({
        performChart: chart,
        performChartId: typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated"),
        performPlaying: true,
        performPaused: false,
        performCurrentSec: 0,
        performStartSec: 0,
        performScore: 0,
        performCombo: 0,
        performMaxCombo: 0,
        performAccuracy: 0,
        performPhraseIdx: 0,
        performResults: null,
        performStarRating: 0,
        performLoop: null,
        performLastHitLabel: "",
        performLastHitTime: 0,
        performPhraseStats: createEmptyPhraseStats(chart),
        performLaneDebugSnapshot: buildPerformanceLaneDebugSnapshot(chart, 0),
        performInputSource: performMode
      });
      if (opts.mode) performanceSessionWrite("performMode", opts.mode);
      if (opts.difficulty) performanceSessionWrite("performDifficulty", opts.difficulty);
      if (opts.speed) performanceSessionWrite("performSpeed", opts.speed);
      if (opts.preset) performanceSessionWrite("performPracticePreset", opts.preset);
    }
    if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
      window.sparkCore.syncPerformanceRuntimeState("start", {
        chartId: typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated"),
        difficulty: performDifficulty,
        arrangementType: performArrangementType,
        speed: performSpeed,
        mode: performMode,
        preset: performPreset,
        countIn: performCountIn,
        targetTechnique: performTargetTechnique
      });
    }

    // Apply difficulty profile to state windows
    applyPerformanceDifficultyToState(performanceSessionRead("performDifficulty", performDifficulty));
    // Apply config-driven runtime values
    if (typeof PERFORMANCE_CONFIG !== "undefined") {
      performanceSessionPatch({
        performScrollSpeed: PERFORMANCE_CONFIG.highway.scrollSpeed,
        performHighwayLookaheadSec: PERFORMANCE_CONFIG.highway.lookaheadSec
      });
    }

    PerformanceInput.start(performanceSessionRead("performMode", performMode));
    applyPerformanceStemPreset(performanceSessionRead("performPracticePreset", performPreset));

    // Load stems if song has imported audio
    var performSongData = performanceSessionRead("performSongData", null);
    var songAudioData = performanceSessionRead("songAudioData", {});
    var songId = (performSongData && performSongData.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    var audioData = songAudioData ? songAudioData[songId] : null;
    var hasStemAudio = audioData && audioData.stemUrls && Object.keys(audioData.stemUrls).length > 0;

    if (hasStemAudio) {
      loadStemUrls(audioData.stemUrls);
      applyPerformanceStemPreset(performanceSessionRead("performPracticePreset", performPreset));
      if (audioData.detectedBpm && chart.bpm) {
        chart._effectiveBpm = audioData.detectedBpm;
      }
    }

    // Load MIDI backing track if chart specifies one
    var hasMidiBacking = chart.audio && chart.audio.type === "midi" && chart.audio.src;
    var midiReady = hasMidiBacking
      ? (typeof loadMidiBacking === "function" ? loadMidiBacking(chart.audio.src) : Promise.resolve())
      : Promise.resolve();
    midiReady.then(function(){
    if (performCountIn) {
      startPerformanceCountIn(chart, performanceSessionRead("performSpeed", performSpeed), function() {
        PerformanceTransport.start(0, performanceSessionRead("performSpeed", performSpeed));
        if (hasStemAudio) {
          playStems();
          var firstStem = typeof getFirstStemAudio === "function" ? getFirstStemAudio() : null;
          if (firstStem) PerformanceTransport.setAudioSource(firstStem);
        }
        if (hasMidiBacking && typeof playMidiBacking === "function") playMidiBacking(0, performanceSessionRead("performSpeed", performSpeed));
        render();
        _performRAF = requestAnimationFrame(updatePerformanceFrame);
      });
    } else {
      PerformanceTransport.start(0, performanceSessionRead("performSpeed", performSpeed));
      if (hasStemAudio) {
        playStems();
        var firstStem = typeof getFirstStemAudio === "function" ? getFirstStemAudio() : null;
        if (firstStem) PerformanceTransport.setAudioSource(firstStem);
      }
      if (hasMidiBacking && typeof playMidiBacking === "function") playMidiBacking(0, performanceSessionRead("performSpeed", performSpeed));
      render();
      _performRAF = requestAnimationFrame(updatePerformanceFrame);
    }
    }).catch(function(e){ console.warn("MIDI backing load failed:", e); });
  }).catch(function(err) {
    console.error("ChordSpark: Failed to start performance:", err);
    if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
      SparkPerformanceBridge.syncPerformanceRuntimeState("start_failed", {
        screen: SCR.HOME,
        tab: TAB.SONGS
      });
    } else {
      performanceSessionPatch({
        screen: SCR.HOME,
        tab: TAB.SONGS
      });
    }
    if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
      window.sparkCore.syncPerformanceRuntimeState("start_failed", {
        screen: "home"
      });
    }
    render();
  });
}

function stopPerformance() {
  destroySparkHighway();
  if (typeof cleanupStems === "function") cleanupStems();
  if (typeof stopMidiBacking === "function") stopMidiBacking();
  PerformanceTransport.stop();
  _performStopping = true;
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  try { PerformanceTransport.stop(); } catch(e) {}
  try { PerformanceInput.stop(); } catch(e) {}
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("stop");
  } else {
    performanceSessionPatch({
      performPlaying: false,
      performPaused: false
    });
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("stop", {
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
  if (typeof pauseMidiBacking === "function") pauseMidiBacking();
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("pause");
  } else {
    performanceSessionPatch({
      performPaused: true,
      performPlaying: false
    });
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("pause");
  }
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  render();
}

function resumePerformance() {
  PerformanceTransport.resume();
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("resume");
  } else {
    performanceSessionPatch({
      performPaused: false,
      performPlaying: true
    });
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("resume");
  }
  if (typeof playStems === "function") playStems();
  if (typeof playMidiBacking === "function" && performanceSessionRead("performChart", null) && performanceSessionRead(["performChart", "audio"], null) && performanceSessionRead(["performChart", "audio", "type"], null) === "midi") {
    playMidiBacking(performanceSessionRead("performCurrentSec", 0), performanceSessionRead("performSpeed", 1));
  }
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
  render();
}

function seekPerformance(sec) {
  PerformanceTransport.seek(sec);
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("seek", { sec: sec });
  } else {
    performanceSessionWrite("performCurrentSec", sec);
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("seek", { sec: sec });
  }
  if (typeof seekStems === "function") seekStems(sec);
  if (typeof seekMidiBacking === "function") seekMidiBacking(sec, performanceSessionRead("performSpeed", 1));
  render();
}

function setPerformanceLoop(loopObj) {
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("set_loop", { loop: loopObj });
  } else {
    performanceSessionWrite("performLoop", loopObj);
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("set_loop", { loop: loopObj });
  }
  render();
}

function clearPerformanceLoop() {
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("clear_loop");
  } else {
    performanceSessionWrite("performLoop", null);
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("clear_loop");
  }
  render();
}

function updatePerformanceFrame() {
  if (_performStopping || !performanceSessionRead("performPlaying", false) || performanceSessionRead("performPaused", false)) return;

  var nowSec = PerformanceTransport.now();
  performanceSessionWrite("performCurrentSec", nowSec);
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("tick", { sec: nowSec, status: "running" });
  }
  performanceSessionWrite("performPhraseIdx", getPerformancePhraseIndexForTime(performanceSessionRead("performChart", null), nowSec));

  maybeScorePendingEvents(nowSec);

  // Loop enforcement
  var performLoop = performanceSessionRead("performLoop", null);
  var performChart = performanceSessionRead("performChart", null);
  if (performLoop && nowSec >= performLoop.endSec) {
    PerformanceTransport.seek(performLoop.startSec);
    resetPerformanceEvents(performChart, performLoop.startSec, performLoop.endSec);
    _updatePerformDisplay();
    _performRAF = requestAnimationFrame(updatePerformanceFrame);
    return;
  }

  // Check if past end of chart
  if (!performChart || !performChart.phrases || !performChart.phrases.length) { finishPerformance(); return; }
  var lastPhrase = performChart.phrases[performChart.phrases.length - 1];
  if (lastPhrase && nowSec > lastPhrase.endSec + 1) {
    finishPerformance();
    return;
  }

  _updatePerformDisplay();
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
}

function _updatePerformDisplay() {
  var performChart = performanceSessionRead("performChart", null);
  var performCurrentSec = performanceSessionRead("performCurrentSec", 0) || 0;
  var performCombo = performanceSessionRead("performCombo", 0);
  performanceSessionWrite("performLaneDebugSnapshot", buildPerformanceLaneDebugSnapshot(performChart, performCurrentSec));

  // Initialize canvas highway on first frame
  var canvas = document.getElementById("spark-highway-canvas");
  if (canvas) ensureSparkHighway(canvas, performChart);
  if (canvas) {
    if (performChart) { feedChartToHighway(performChart); }
    feedChartToHighway(performChart);
    updateSparkHighway(performCurrentSec, performCombo);
  }

  // Update score strip (targeted, no full rebuild)
  var scoreEls = document.querySelectorAll(".perform-stat-val");
  if (scoreEls.length >= 3) {
    scoreEls[0].textContent = performanceSessionRead("performScore", 0);
    scoreEls[1].textContent = performanceSessionRead("performAccuracy", 0) + "%";
    scoreEls[2].textContent = performanceSessionRead("performCombo", 0) + "x";
  }

  // Update phrase name
  var phraseEl = document.querySelector(".perform-phrase-name");
  if (phraseEl) {
    var phrase = getPerformancePhraseForTime(performChart, performCurrentSec);
    phraseEl.textContent = phrase ? phrase.name : "";
  }

  var importedOverlayEl = document.getElementById("perform-imported-overlay");
  if (importedOverlayEl && typeof renderImportedTechniqueOverlay === "function") {
    importedOverlayEl.innerHTML = renderImportedTechniqueOverlay(performChart, performCurrentSec, 3);
  }

  var laneDebugEl = document.getElementById("perform-lane-debug");
  if (laneDebugEl && typeof renderPerformanceLaneDebug === "function") {
    laneDebugEl.innerHTML = renderPerformanceLaneDebug(performanceSessionRead("performLaneDebugSnapshot", null));
  }
}

function maybeScorePendingEvents(nowSec) {
  var chart = performanceSessionRead("performChart", null);
  if (!chart) return;
  var snapshot = PerformanceInput.getSnapshot(nowSec);
  var performMode = performanceSessionRead("performMode", "midi");
  var performDifficulty = performanceSessionRead("performDifficulty", "normal");
  var performWindowMissMs = performanceSessionRead("performWindowMissMs", 220);
  var phraseStats = performanceSessionRead("performPhraseStats", null);
  var performCombo = performanceSessionRead("performCombo", 0);
  var performMaxCombo = performanceSessionRead("performMaxCombo", 0);
  var performScore = performanceSessionRead("performScore", 0);
  var offsetMs = performMode === "midi"
    ? (performanceSessionRead("performMidiOffsetMs", 0) || 0)
    : (performanceSessionRead("performAudioOffsetMs", 0) || 0);
  var targetTechnique = performanceSessionRead("performTargetTechnique", null) || null;

  performanceSessionWrite("performInputSource", PerformanceInput.activeMode);
  performanceSessionWrite("performInputNotes", snapshot.pitchClasses.slice());

  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (evt._scored) continue;

    var deltaMs = (nowSec - evt.t) * 1000 - offsetMs;

    if (deltaMs < -performWindowMissMs) continue;

    // Past miss window — mark as miss
    if (deltaMs > performWindowMissMs && !evt._hit) {
      evt._scored = true;
      evt._miss = true;
      evt._result = { score: 0, grade: "miss", noteScore: 0, timingScore: 0 };
      evt._score = 0;
      updatePhraseStats(phraseStats, evt, evt._result);
      performCombo = 0;
      performanceSessionWrite("performCombo", performCombo);
      if (evt.sourceFlags && targetTechnique && evt.sourceFlags[targetTechnique] && typeof buildPerformanceFeedbackLabel === "function") {
        performanceSessionPatch({
          performLastHitLabel: buildPerformanceFeedbackLabel(evt, evt._result, targetTechnique),
          performLastHitTime: Date.now()
        });
      }
      _updatePerformanceAccuracy(chart);
      continue;
    }

    // In scoring window — check snapshot
    if (performanceSnapshotHasActivity(snapshot, evt, performMode)) {
      var result = scorePerformanceEvent(evt, snapshot, deltaMs, performDifficulty, performMode);

      if (result.grade !== "miss") {
        evt._scored = true;
        evt._hit = true;
        evt._result = result;
        evt._score = result.score;
        if (typeof notifyHighwayHit === "function") notifyHighwayHit(evt);
        updatePhraseStats(phraseStats, evt, result);

        performCombo++;
        if (performCombo > performMaxCombo) performMaxCombo = performCombo;

        var comboMult = Math.min(1 + performCombo * 0.1, 4);
        performScore += Math.round(100 * result.score * comboMult);

        performanceSessionPatch({
          performCombo: performCombo,
          performMaxCombo: performMaxCombo,
          performScore: performScore,
          performLastHitLabel: typeof buildPerformanceFeedbackLabel === "function"
            ? buildPerformanceFeedbackLabel(evt, result, targetTechnique)
            : (result.grade.toUpperCase() + "!"),
          performLastHitTime: Date.now()
        });

        _updatePerformanceAccuracy(chart);
      }
    }
  }
}

function _updatePerformanceAccuracy(chart) {
  var scored = 0, hits = 0;
  for (var i = 0; i < chart.events.length; i++) {
    if (chart.events[i]._scored) {
      scored++;
      if (chart.events[i]._hit) hits++;
    }
  }
  performanceSessionWrite("performAccuracy", scored > 0 ? Math.round((hits / scored) * 100) : 0);
}

function applyPerformanceStemPreset(preset) {
  performanceSessionWrite("performPracticePreset", preset);
  if (typeof setStemMuted !== "function") return;
  if (typeof setStemVolume === "function") setStemVolume(0.8);
  switch (preset) {
    case "full_mix":
      setStemMuted("guitar", false);
      setStemMuted("vocals", false);
      setStemMuted("drums", false);
      setStemMuted("bass", false);
      setStemMuted("piano", false);
      setStemMuted("other", false);
      break;
    case "no_guitar":
      setStemMuted("guitar", true);
      setStemMuted("vocals", false);
      setStemMuted("drums", false);
      setStemMuted("bass", false);
      setStemMuted("piano", false);
      setStemMuted("other", false);
      break;
    case "guitar_quiet":
      setStemMuted("guitar", false);
      setStemMuted("vocals", false);
      setStemMuted("drums", false);
      setStemMuted("bass", false);
      setStemMuted("piano", false);
      setStemMuted("other", false);
      if (typeof setStemVolume === "function") setStemVolume(0.3);
      break;
    case "guitar_solo":
      setStemMuted("guitar", false);
      setStemMuted("vocals", true);
      setStemMuted("drums", true);
      setStemMuted("bass", true);
      setStemMuted("piano", true);
      setStemMuted("other", true);
      break;
  }
}

function finishPerformance() {
  stopPerformance();
  var performChart = performanceSessionRead("performChart", null);
  var performPhraseStats = performanceSessionRead("performPhraseStats", null);
  var performTargetTechnique = performanceSessionRead("performTargetTechnique", null) || null;
  var performChartId = performanceSessionRead("performChartId", null);
  var performArrangementType = performanceSessionRead("performArrangementType", null);
  var performDifficulty = performanceSessionRead("performDifficulty", "normal");
  var performanceStats = performanceSessionRead("performanceStats", {});
  var performSongStats = performanceSessionRead("performSongStats", {});
  var results = finalizePerformanceResults(performChart, performPhraseStats, {
    focusedTechnique: performTargetTechnique
  });
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("finish", {
      results: results,
      screen: SCR.PERFORM_DONE
    });
  } else {
    performanceSessionPatch({
      performResults: results,
      performStarRating: results.stars
    });
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("finish", {
      screen: "perform_done"
    });
  }

  var xpAward = Math.max(5, Math.round(results.accuracy / 10));
  var corePerformanceResult = null;
  if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
    var completionRequest = typeof window.sparkCore.buildPerformanceCompletionRequest === "function"
      ? window.sparkCore.buildPerformanceCompletionRequest({
          performanceResults: results,
          xpAwarded: xpAward,
          chartId: performChartId || "unknown",
          arrangementType: (performChart && performChart.arrangementType) || performArrangementType,
          difficultyId: performDifficulty
        })
      : {
          flow: SparkSessionTypes.FLOW_PERFORMANCE_SONG,
          markPlanComplete: true,
          performanceResults: results,
          xpAwarded: xpAward
        };
    corePerformanceResult = window.sparkCore.completeSession(completionRequest);
    if (corePerformanceResult && typeof corePerformanceResult.xpAwarded === "number") {
      xpAward = corePerformanceResult.xpAwarded;
    }
  } else if (window.sparkCore && typeof window.sparkCore.applyLegacyReward === "function") {
    window.sparkCore.applyLegacyReward({ xpDelta: xpAward, toastAmount: xpAward });
  } else {
    performanceSessionWrite("xp", performanceSessionRead("xp", 0) + xpAward);
    performanceSessionWrite("xpToast", { amount: xpAward, time: Date.now() });
  }
  // Route through contract-based progress path (Phase 6 migration)
  if (typeof SparkProgressOrchestrator !== "undefined" && typeof SparkProgressOrchestrator.applySessionOutcome === "function" && typeof SparkContracts !== "undefined") {
    var perfSessionResult = SparkContracts.createSessionResult({
      mode: "song",
      instrumentId: typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive().id : null,
      instrumentType: typeof SparkInstruments !== "undefined" && SparkInstruments.getActive() ? SparkInstruments.getActive().instrument : null,
      accuracy: results ? results.accuracy / 100 : 0,
      duration: results ? (results.duration || 0) : 0,
      songId: performChartId || null,
      completed: true
    });
    var perfProgressOutcome = SparkProgressOrchestrator.applySessionOutcome(perfSessionResult);
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[Performance] ProgressOutcome:", perfProgressOutcome);
    }
  }
  logHistory("perform", results.title + " - " + results.accuracy + "% accuracy", xpAward);

  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.applyPerformanceRunOutcome === "function") {
    SparkPerformanceBridge.applyPerformanceRunOutcome({
      chartId: performChartId || "unknown",
      chart: performChart,
      results: results,
      difficulty: performDifficulty
    });
  }

  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.applyPerformanceRunFollowOns === "function") {
    SparkPerformanceBridge.applyPerformanceRunFollowOns({
      chartId: performChartId || "unknown",
      chart: performChart,
      results: results,
      difficulty: performDifficulty,
      progressionStats: performanceStats && performanceStats[(performChartId || "unknown") + "_" + ((performChart && performChart.arrangementType) || "chords") + "_" + (performDifficulty || "normal")] || null,
      songStats: performSongStats && performSongStats[performChartId || "unknown"] || null
    });
  }

  if (typeof PerfEvents !== "undefined") PerfEvents.emit("performance_completed", {
    chartId: performChartId, accuracy: results.accuracy, stars: results.stars, score: results.score
  });

  saveState();
  performanceSessionWrite("screen", SCR.PERFORM_DONE);
  render();
}
