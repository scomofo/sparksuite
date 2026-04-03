/* ===== ChordSpark Performance: Session Orchestrator ===== */

var _performRAF = null;
var _performStopping = false;

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
    if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
      SparkPerformanceBridge.syncPerformanceRuntimeState("start", {
        chart: chart,
        chartId: typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated"),
        phraseStats: createEmptyPhraseStats(chart),
        mode: opts.mode || S.performMode,
        difficulty: opts.difficulty || S.performDifficulty,
        speed: opts.speed || S.performSpeed,
        preset: opts.preset || S.performPracticePreset,
        screen: SCR.PERFORM
      });
    } else {
      S.performChart = chart;
      S.performChartId = typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated");
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
    if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
      window.sparkCore.syncPerformanceRuntimeState("start", {
        chartId: typeof chartIdOrChart === "string" ? chartIdOrChart : (chart.id || "generated"),
        difficulty: opts.difficulty || S.performDifficulty,
        arrangementType: chart.arrangementType || S.performArrangementType,
        speed: opts.speed || S.performSpeed,
        mode: opts.mode || S.performMode,
        preset: opts.preset || S.performPracticePreset,
        countIn: !!S.performCountIn
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
    var songId = (S.performSongData && S.performSongData.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    var audioData = S.songAudioData[songId];
    var hasStemAudio = audioData && audioData.stemUrls && Object.keys(audioData.stemUrls).length > 0;

    if (hasStemAudio) {
      loadStemUrls(audioData.stemUrls);
      applyPerformanceStemPreset(S.performPracticePreset);
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
    if (S.performCountIn) {
      startPerformanceCountIn(chart, S.performSpeed, function() {
        PerformanceTransport.start(0, S.performSpeed);
        if (hasStemAudio) {
          playStems();
          var firstStem = typeof getFirstStemAudio === "function" ? getFirstStemAudio() : null;
          if (firstStem) PerformanceTransport.setAudioSource(firstStem);
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
      if (hasMidiBacking && typeof playMidiBacking === "function") playMidiBacking(0, S.performSpeed);
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
      S.screen = SCR.HOME;
      S.tab = TAB.SONGS;
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
    S.performPlaying = false;
    S.performPaused = false;
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
    S.performPaused = true;
    S.performPlaying = false;
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
    S.performPaused = false;
    S.performPlaying = true;
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("resume");
  }
  if (typeof playStems === "function") playStems();
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
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("seek", { sec: sec });
  }
  if (typeof seekStems === "function") seekStems(sec);
  if (typeof seekMidiBacking === "function") seekMidiBacking(sec, S.performSpeed);
  render();
}

function setPerformanceLoop(loopObj) {
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("set_loop", { loop: loopObj });
  } else {
    S.performLoop = loopObj;
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
    S.performLoop = null;
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("clear_loop");
  }
  render();
}

function updatePerformanceFrame() {
  if (_performStopping || !S.performPlaying || S.performPaused) return;

  var nowSec = PerformanceTransport.now();
  S.performCurrentSec = nowSec;
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("tick", { sec: nowSec, status: "running" });
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
    ensureSparkHighway(canvas);
    feedChartToHighway(S.performChart);
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

function maybeScorePendingEvents(nowSec) {
  var chart = S.performChart;
  if (!chart) return;
  var snapshot = PerformanceInput.getSnapshot(nowSec);
  S.performInputSource = PerformanceInput.activeMode;
  S.performInputNotes = snapshot.pitchClasses.slice();
  var offsetMs = S.performMode === "midi" ? (S.performMidiOffsetMs || 0) : (S.performAudioOffsetMs || 0);

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
      _updatePerformanceAccuracy(chart);
      continue;
    }

    // In scoring window — check snapshot
    if (performanceSnapshotHasActivity(snapshot, evt, S.performMode)) {
      var result = scorePerformanceEvent(evt, snapshot, deltaMs, S.performDifficulty, S.performMode);

      if (result.grade !== "miss") {
        evt._scored = true;
        evt._hit = true;
        evt._result = result;
        evt._score = result.score;
        if (typeof notifyHighwayHit === "function") notifyHighwayHit(evt);
        updatePhraseStats(S.performPhraseStats, evt, result);

        S.performCombo++;
        if (S.performCombo > S.performMaxCombo) S.performMaxCombo = S.performCombo;

        var comboMult = Math.min(1 + S.performCombo * 0.1, 4);
        S.performScore += Math.round(100 * result.score * comboMult);

        S.performLastHitLabel = result.grade.toUpperCase() + "!";
        S.performLastHitTime = Date.now();

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
  S.performAccuracy = scored > 0 ? Math.round((hits / scored) * 100) : 0;
}

function applyPerformanceStemPreset(preset) {
  S.performPracticePreset = preset;
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
  var results = finalizePerformanceResults(S.performChart, S.performPhraseStats);
  if (window.SparkPerformanceBridge && typeof SparkPerformanceBridge.syncPerformanceRuntimeState === "function") {
    SparkPerformanceBridge.syncPerformanceRuntimeState("finish", {
      results: results,
      screen: SCR.PERFORM_DONE
    });
  } else {
    S.performResults = results;
    S.performStarRating = results.stars;
  }
  if (window.sparkCore && typeof window.sparkCore.syncPerformanceRuntimeState === "function") {
    window.sparkCore.syncPerformanceRuntimeState("finish", {
      screen: "perform_done"
    });
  }

  var xpAward = Math.max(5, Math.round(S.performResults.accuracy / 10));
  var corePerformanceResult = null;
  if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
    var completionRequest = typeof window.sparkCore.buildPerformanceCompletionRequest === "function"
      ? window.sparkCore.buildPerformanceCompletionRequest({
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
    corePerformanceResult = window.sparkCore.completeSession(completionRequest);
    if (corePerformanceResult && typeof corePerformanceResult.xpAwarded === "number") {
      xpAward = corePerformanceResult.xpAwarded;
    }
  } else if (window.SparkProgressBridge) {
    SparkProgressBridge.applyLegacyReward({ xpDelta: xpAward, toastAmount: xpAward });
  } else {
    S.xp += xpAward; S.xpToast = { amount: xpAward, time: Date.now() };
  }
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
