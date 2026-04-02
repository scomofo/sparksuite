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

    S.screen = SCR.PERFORM;

    if (S.performCountIn) {
      startPerformanceCountIn(chart, S.performSpeed, function() {
        PerformanceTransport.start(0, S.performSpeed);
        if (hasStemAudio) {
          playStems();
          var firstStem = typeof getFirstStemAudio === "function" ? getFirstStemAudio() : null;
          if (firstStem) PerformanceTransport.setAudioSource(firstStem);
        }
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
      render();
      _performRAF = requestAnimationFrame(updatePerformanceFrame);
    }
  }).catch(function(err) {
    console.error("ChordSpark: Failed to start performance:", err);
    S.screen = SCR.HOME;
    S.tab = TAB.SONGS;
    render();
  });
}

function stopPerformance() {
  destroySparkHighway();
  if (typeof cleanupStems === "function") cleanupStems();
  PerformanceTransport.stop();
  _performStopping = true;
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  try { PerformanceTransport.stop(); } catch(e) {}
  try { PerformanceInput.stop(); } catch(e) {}
  S.performPlaying = false;
  S.performPaused = false;
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
  S.performPaused = true;
  S.performPlaying = false;
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  render();
}

function resumePerformance() {
  PerformanceTransport.resume();
  S.performPaused = false;
  S.performPlaying = true;
  if (typeof playStems === "function") playStems();
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
  render();
}

function seekPerformance(sec) {
  PerformanceTransport.seek(sec);
  S.performCurrentSec = sec;
  if (typeof seekStems === "function") seekStems(sec);
  render();
}

function setPerformanceLoop(loopObj) {
  S.performLoop = loopObj;
  render();
}

function clearPerformanceLoop() {
  S.performLoop = null;
  render();
}

function updatePerformanceFrame() {
  if (_performStopping || !S.performPlaying || S.performPaused) return;

  var nowSec = PerformanceTransport.now();
  S.performCurrentSec = nowSec;
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
    if (snapshot.pitchClasses.length > 0) {
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
  S.performResults = finalizePerformanceResults(S.performChart, S.performPhraseStats);
  S.performStarRating = S.performResults.stars;

  var xpAward = Math.max(5, Math.round(S.performResults.accuracy / 10));
  S.xp += xpAward;
  S.xpToast = { amount: xpAward, time: Date.now() };
  logHistory("perform", S.performResults.title + " - " + S.performResults.accuracy + "% accuracy", xpAward);

  // Persist song stats
  var songKey = S.performChartId || "unknown";
  if (!S.performSongStats[songKey]) {
    S.performSongStats[songKey] = { bestScore: 0, bestAccuracy: 0, bestStars: 0, runs: 0, phrases: {} };
  }
  var ss = S.performSongStats[songKey];
  ss.runs++;
  if (S.performResults.score > ss.bestScore) ss.bestScore = S.performResults.score;
  if (S.performResults.accuracy > ss.bestAccuracy) ss.bestAccuracy = S.performResults.accuracy;
  if (S.performResults.stars > ss.bestStars) ss.bestStars = S.performResults.stars;

  // Per-phrase bests
  if (S.performResults.phraseStats) {
    for (var pi = 0; pi < S.performResults.phraseStats.length; pi++) {
      var ps = S.performResults.phraseStats[pi];
      var pk = String(ps.phraseId);
      if (!ss.phrases[pk]) ss.phrases[pk] = { bestScore: 0, attempts: 0 };
      ss.phrases[pk].attempts++;
      var avg = ps.total > 0 ? ps.scoreSum / ps.total : 0;
      if (avg > ss.phrases[pk].bestScore) ss.phrases[pk].bestScore = avg;
    }
  }

  // Update progression stats
  if (typeof updatePerformanceStats === "function") {
    var arrType = (S.performChart && S.performChart.arrangementType) || "chords";
    var progStats = updatePerformanceStats(
      S.performChartId || "unknown",
      arrType,
      S.performDifficulty,
      S.performResults
    );
    // Check for unlocks
    var unlocks = checkPerformanceUnlocks(
      S.performChartId || "unknown",
      arrType,
      S.performDifficulty,
      progStats
    );
    if (unlocks.length > 0) {
      S.performResults.unlocks = unlocks;
    }
  }

  // Check daily challenge completion
  if(S.performanceDailyChallenge&&!S.performanceDailyComplete){
    var dc=S.performanceDailyChallenge,dr=S.performResults;
    var matchSong=!dc.songId||dc.songId===(S.performChartId||"").split("_")[0];
    var completed=false;
    if(dc.type==="full_run"&&dr.totalEvents>0)completed=true;
    if(dc.type==="retry_run"&&dr.accuracy>=70)completed=true;
    if(dc.type==="weakest_phrase"&&dr.accuracy>=(dc.target&&dc.target.accuracy||85))completed=true;
    if(dc.type==="promote_difficulty"&&dr.stars>=(dc.target&&dc.target.stars||3))completed=true;
    if(dc.type==="try_rhythm"&&(S.performChart&&S.performChart.arrangementType==="rhythm_chords"))completed=true;
    if(completed){
      var bonusXp=markPerformanceDailyComplete();
      if(bonusXp>0){S.xp+=bonusXp;S.xpToast={amount:bonusXp,time:Date.now()};}
    }
  }

  // Performance badges
  (function(){
    var r=S.performResults;if(!r)return;
    var b=S.earnedBadges;if(!Array.isArray(b))return;
    function award(id){if(b.indexOf(id)<0){b.push(id);S.newBadge=null;for(var bi=0;bi<BADGES.length;bi++){if(BADGES[bi].id===id){S.newBadge=BADGES[bi];break;}}}}

    // First performance
    award("perf_first");

    // Star badges
    if(r.stars>=3)award("perf_3star");
    if(r.stars>=5)award("perf_5star");

    // Run count
    var totalRuns=0;
    for(var k in S.performanceStats){if(S.performanceStats[k]&&S.performanceStats[k].runs)totalRuns+=S.performanceStats[k].runs;}
    if(totalRuns>=10)award("perf_10runs");

    // Mastery
    for(var mk in S.performanceStats){if(S.performanceStats[mk]&&S.performanceStats[mk].mastery==="mastered"){award("perf_mastered");break;}}

    // Rhythm
    if(S.performChart&&S.performChart.arrangementType==="rhythm_chords")award("perf_rhythm");

    // Pro
    if(S.performDifficulty==="pro"&&r.stars>=3)award("perf_pro");

    // Daily
    if(S.performanceDailyComplete)award("perf_daily");

    // Daily streak
    if(Array.isArray(S.performanceDailyHistory)&&S.performanceDailyHistory.length>=3)award("perf_streak3");

    // All songs played
    if(typeof SONGS!=="undefined"&&Array.isArray(SONGS)){
      var playedSongs=0,totalSongs=0;
      for(var si=0;si<SONGS.length;si++){
        if(!SONGS[si].progression||!SONGS[si].progression.length)continue;
        totalSongs++;
        var sid=(SONGS[si].title||"").toLowerCase().replace(/[^a-z0-9]+/g,"_");
        for(var pk in S.performanceStats){if(pk.indexOf(sid)===0&&S.performanceStats[pk].runs>0){playedSongs++;break;}}
      }
      if(totalSongs>0&&playedSongs>=totalSongs)award("perf_allsongs");
    }
  })();

  // Standalone badge + unlock module evaluation
  if(typeof evaluatePerformanceBadges==="function"){
    var progKey = S.performChartId || "unknown";
    var arrType2 = (S.performChart && S.performChart.arrangementType) || "chords";
    var bucket = S.performanceStats && S.performanceStats[progKey] && S.performanceStats[progKey][arrType2] && S.performanceStats[progKey][arrType2][S.performDifficulty] || null;
    var newBadges = evaluatePerformanceBadges(S.performResults, bucket);
    if(newBadges && newBadges.length){
      S.xp += newBadges.length * 10;
    }
  }
  if(typeof applyPerformanceUnlocks==="function"){
    var progKey3 = S.performChartId || "unknown";
    var arrType3 = (S.performChart && S.performChart.arrangementType) || "chords";
    var bucket3 = S.performanceStats && S.performanceStats[progKey3] && S.performanceStats[progKey3][arrType3] && S.performanceStats[progKey3][arrType3][S.performDifficulty] || null;
    var unlockResult = applyPerformanceUnlocks(S.performResults, bucket3);
    if(unlockResult && unlockResult.xp > 0){
      S.xp += unlockResult.xp;
    }
  }

  if (typeof PerfEvents !== "undefined") PerfEvents.emit("performance_completed", {
    chartId: S.performChartId, accuracy: S.performResults.accuracy, stars: S.performResults.stars, score: S.performResults.score
  });

  saveState();
  S.screen = SCR.PERFORM_DONE;
  render();
}
