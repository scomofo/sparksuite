(function() {
  var runtime = {
    engine: null,
    clock: null,
    raf: null,
    mode: null,
    playable: null,
    segmentId: null,
    sourcePayload: null,
    activePayload: null
  };

  var ASSIST_PRESETS = [
    { id: "spark_learning", label: "Guided", hint: "Wider timing and fret forgiveness" },
    { id: "spark_balanced", label: "Balanced", hint: "Closer to standard timing" },
    { id: "spark_challenge", label: "Challenge", hint: "Tighter timing and stricter fret checks" }
  ];

  function startRhythmHighwaySegment(segmentId, presetName, loopSpec) {
    if (!window.sparkCore || typeof window.sparkCore.getSegmentById !== "function") return false;
    var segment = window.sparkCore.getSegmentById(segmentId);
    if (!segment || !segment.meta || !segment.meta.gameplayPayload) return false;
    return startRhythmHighwayPayload(segment.meta.gameplayPayload, presetName, {
      segmentId: segmentId,
      loopSpec: loopSpec || null,
      source: "core_segment",
      label: segment.label || (segment.meta && segment.meta.skill) || null
    });
  }

  function startRhythmHighwayPayload(payload, presetName, launchContext) {
    if (!payload || !payload.songChart) return false;
    launchContext = launchContext || {};

    stopSparkRhythmHighway();

    var resolvedPresetName = resolveRhythmHighwayPresetName(presetName || S.rhythmHighwayPreset || payload.enginePreset);
    var resolvedLoopSpec = launchContext.loopSpec || S.rhythmHighwayLoop || null;
    var activePayload = resolvedLoopSpec ? buildRhythmHighwayLoopPayload(payload, resolvedLoopSpec) : payload;
    if (!activePayload || !activePayload.songChart) activePayload = payload;

    runtime.segmentId = launchContext.segmentId || null;
    runtime.sourcePayload = payload;
    runtime.activePayload = activePayload;
    runtime.mode = "engine";
    runtime.clock = new SparkTimingEngine(new SparkCalibrationEngine()).createClock(payload.adapterType || launchContext.instrument || "guitar");
    runtime.engine = new SparkPerformanceEngine({
      chart: activePayload.songChart,
      adapter: createRhythmHighwayAdapter(payload.adapterType || launchContext.instrument),
      preset: SparkEnginePresetRegistry.get(resolvedPresetName)
    });

    S.activeCoreSegmentId = launchContext.segmentId || null;
    S.rhythmHighwayPreset = resolvedPresetName;
    S.rhythmHighwayLoop = resolvedLoopSpec && activePayload !== payload ? resolvedLoopSpec : null;
    S.rhythmHighwayLaunchContext = {
      source: launchContext.source || "ad_hoc",
      label: launchContext.label || payload.chartId || (payload.songChart.song && payload.songChart.song.title) || null,
      instrument: launchContext.instrument || payload.adapterType || null,
      exerciseId: launchContext.exerciseId || null,
      exerciseFocus: launchContext.exerciseFocus || null
    };
    S.rhythmHighwayHeldMask = 0;
    S.rhythmHighwayLaneChart = getRhythmHighwayLaneChart(activePayload || payload);
    S.rhythmHighwaySnapshot = runtime.engine.getSnapshot(0);
    S.rhythmHighwayResult = null;
    S.rhythmHighwayFeedback = "";
    S.screen = SCR.RHYTHM_HIGHWAY;

    tickRhythmHighway();
    render();
    return true;
  }

  function startPlayableRhythmHighwayPayload(payload, launchContext) {
    if (!payload) return false;
    launchContext = launchContext || {};

    stopSparkRhythmHighway();

    runtime.mode = "playable";
    runtime.segmentId = launchContext.segmentId || null;
    runtime.sourcePayload = payload;
    runtime.activePayload = payload;
    S.rhythmHighwayLaneChart = getRhythmHighwayLaneChart(payload);
    var playableOptions = mergePlayableRuntimeOptions(
      payload && payload.chart && payload.chart.metadata ? payload.chart.metadata : null,
      launchContext.options || {}
    );
    runtime.playable = createPlayableRhythmRuntime(S.rhythmHighwayLaneChart, playableOptions);
    if (!runtime.playable) return false;

    S.activeCoreSegmentId = launchContext.segmentId || null;
    S.rhythmHighwayLaunchContext = {
      source: launchContext.source || "playable",
      label: launchContext.label || payload.chartId || null,
      instrument: launchContext.instrument || payload.adapterType || null,
      exerciseId: launchContext.exerciseId || null,
      exerciseFocus: launchContext.exerciseFocus || null,
      song: launchContext.song ? clonePlayableSong(launchContext.song) : null,
      playlist: Array.isArray(launchContext.playlist) ? launchContext.playlist.slice() : null
    };
    S.rhythmHighwayHeldMask = 0;
    S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
    S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
    S.rhythmHighwayResult = null;
    S.rhythmHighwayFeedback = "";
    S.screen = SCR.RHYTHM_HIGHWAY;

    tickPlayableRhythmHighway();
    render();
    return true;
  }

  function stopSparkRhythmHighway() {
    if (runtime.raf) cancelAnimationFrame(runtime.raf);
    runtime.raf = null;
    if (runtime.clock && typeof runtime.clock.close === "function") runtime.clock.close();
    runtime.clock = null;
    if (runtime.playable && typeof runtime.playable.stop === "function") runtime.playable.stop();
    runtime.engine = null;
    runtime.playable = null;
    runtime.mode = null;
  }

  function tickRhythmHighway() {
    if (!runtime.engine || !runtime.clock) return;
    var songTimeSec = runtime.clock.getSongTime();
    S.rhythmHighwaySnapshot = runtime.engine.update(songTimeSec);
    if (S.rhythmHighwaySnapshot.finished && !S.rhythmHighwayResult) {
      finalizeRhythmHighway();
      return;
    }
    render();
    runtime.raf = requestAnimationFrame(tickRhythmHighway);
  }

  function finalizeRhythmHighway() {
    if (!runtime.engine) return;
    var result = runtime.engine.finalize();
    S.rhythmHighwayResult = result;
    S.rhythmHighwayFeedback = buildFeedback(result);
    if (runtime.segmentId && window.sparkCore && typeof window.sparkCore.completeSession === "function") {
      window.sparkCore.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        itemId: runtime.segmentId,
        result: result,
        gameplayResult: result,
        gameplayContext: cloneRhythmHighwayLaunchContext()
      });
    }
    stopSparkRhythmHighway();
    render();
  }

  function tickPlayableRhythmHighway() {
    if (!runtime.playable) return;
    S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
    S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
    if (runtime.playable.isFinished() && !S.rhythmHighwayResult) {
      finalizePlayableRhythmHighway();
      return;
    }
    render();
    runtime.raf = requestAnimationFrame(tickPlayableRhythmHighway);
  }

  function finalizePlayableRhythmHighway() {
    if (!runtime.playable) return;
    var results = runtime.playable.getResults();
    var songFlowOutcome = null;
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.song) {
      songFlowOutcome = completePlayableSongFlow(
        S.rhythmHighwayLaunchContext.song,
        results,
        S.rhythmHighwayLaunchContext.playlist || null
      );
    }
    S.rhythmHighwayResult = {
      gameplay: {
        score: results.score,
        accuracy: results.accuracy,
        maxCombo: results.maxCombo,
        streak: results.streak,
        xpEarned: results.xpEarned
      },
      learning: {
        skills: [],
        weakAreas: results.accuracy >= 0.7 ? [] : ["timing"]
      },
      suggestedDifficulty: results.suggestedDifficulty,
      songProgress: songFlowOutcome ? songFlowOutcome.songStats : null,
      songFlowOutcome: songFlowOutcome,
      breakdown: results.breakdown,
      runtimeMode: "playable"
    };
    S.rhythmHighwayFeedback = results.accuracy >= 0.7 ? "Nice run." : "Timing needs a little more work.";
    if (runtime.segmentId && window.sparkCore && typeof window.sparkCore.completeSession === "function") {
      window.sparkCore.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        itemId: runtime.segmentId,
        result: S.rhythmHighwayResult,
        gameplayResult: S.rhythmHighwayResult,
        gameplayContext: cloneRhythmHighwayLaunchContext()
      });
    }
    stopSparkRhythmHighway();
    render();
  }

  function sparkRhythmHighwayStrum() {
    if (runtime.mode === "playable" && runtime.playable) {
      var lane = primaryLaneFromMask(S.rhythmHighwayHeldMask || 0);
      var result = runtime.playable.handleLaneInput(lane);
      S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
      S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
      if (result) S.rhythmHighwayFeedback = result;
      return;
    }
    if (!runtime.engine || !runtime.clock) return;
    var outcome = runtime.engine.handleInput({
      kind: "strum",
      laneMask: S.rhythmHighwayHeldMask || 0,
      atSec: runtime.clock.getSongTime()
    });
    if (outcome && outcome.resolution) {
      S.rhythmHighwayFeedback = feedbackForResolution(outcome.resolution);
    }
  }

  function practiceHighwayPage(snapshot) {
    var laneChart = getRhythmHighwayLaneChart(runtime.activePayload || runtime.sourcePayload || null);
    var lanes = laneChart && Array.isArray(laneChart.lanes) ? laneChart.lanes : buildFallbackLanes();
    var practiceLanes = lanes.length > 2 ? lanes.slice(0, 2) : lanes;
    var laneCount = practiceLanes.length;
    var ctx = S.rhythmHighwayLaunchContext || {};

    var h = '<div style="max-width:400px;margin:0 auto;padding:16px">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
    h += '<span style="font-size:18px;font-weight:900;color:var(--text-primary)">Practice</span>';
    if (ctx.label) {
      h += '<span style="padding:4px 12px;border-radius:999px;background:rgba(78,205,196,.15);color:#4ECDC4;font-size:11px;font-weight:800">' + escHTML(ctx.label) + '</span>';
    }
    h += '</div>';

    var feedbackText = "";
    var feedbackColor = "transparent";
    if (snapshot.feedback) {
      if (S.performLastHitDirection === "perfect") { feedbackText = "Perfect"; feedbackColor = "#4ECDC4"; }
      else if (S.performLastHitDirection === "early") { feedbackText = "Early"; feedbackColor = "#FFE66D"; }
      else if (S.performLastHitDirection === "late") { feedbackText = "Late"; feedbackColor = "#FF6B6B"; }
      else if (S.performLastHitDirection === "miss") { feedbackText = "Miss"; feedbackColor = "#FF6B6B"; }
    }
    h += '<div style="text-align:center;height:40px;margin-bottom:12px">';
    if (feedbackText) {
      h += '<div style="font-size:24px;font-weight:900;color:' + feedbackColor + ';text-shadow:0 0 20px ' + feedbackColor + '40">' + escHTML(feedbackText) + '</div>';
    }
    h += '</div>';

    h += '<div style="position:relative;width:max-content;max-width:100%;margin:0 auto 16px;padding:18px;border-radius:24px;background:radial-gradient(circle at top,rgba(255,255,255,.04),rgba(6,8,12,.96) 58%);border:1px solid rgba(255,255,255,.06)">';
    h += '<div style="display:grid;grid-template-columns:repeat(' + laneCount + ',72px);gap:12px;justify-content:center;align-items:end;height:360px;position:relative">';
    for (var lane = 0; lane < laneCount; lane++) {
      h += '<div style="position:relative;height:360px;border-radius:16px;background:linear-gradient(180deg,rgba(17,17,17,.95),rgba(9,9,11,.98));border:1px solid rgba(255,255,255,.1);overflow:hidden">';
      h += '<div style="position:absolute;left:6px;right:6px;bottom:72px;height:3px;background:#fff;border-radius:999px;box-shadow:0 0 24px rgba(255,255,255,.5)"></div>';
      for (var i = 0; i < snapshot.notes.length; i++) {
        var note = snapshot.notes[i];
        if (!noteHasLane(note, lane)) continue;
        var bottom = Math.max(86, Math.min(320, 86 + ((3 - (note.timeSec - snapshot.songTimeSec)) * 66)));
        h += '<div style="position:absolute;left:6px;right:6px;bottom:' + bottom + 'px;height:22px;border-radius:10px;background:' + noteVisualColor(note, snapshot.feedback) + ';opacity:' + (note.hit ? 0.3 : 0.95) + ';box-shadow:0 8px 18px rgba(0,0,0,.3)"></div>';
      }
      h += '<div style="position:absolute;left:0;right:0;bottom:12px;font-size:13px;font-weight:900;color:' + laneColor(lane) + '">' + practiceLanes[lane].label + '</div>';
      h += '</div>';
    }
    h += '</div>';
    h += '</div>';

    var currentTempo = (runtime.activePayload && runtime.activePayload.tempo) || 80;
    h += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">';
    h += '<button class="btn" onclick="act(\'practiceTempoDown\')" style="width:44px;height:44px;border-radius:12px;background:var(--input-bg);color:var(--text-secondary);font-size:18px;font-weight:900">&minus;</button>';
    h += '<div style="font-size:16px;font-weight:900;color:var(--text-primary);min-width:80px;text-align:center">' + currentTempo + ' BPM</div>';
    h += '<button class="btn" onclick="act(\'practiceTempoUp\')" style="width:44px;height:44px;border-radius:12px;background:var(--input-bg);color:var(--text-secondary);font-size:18px;font-weight:900">+</button>';
    h += '</div>';

    h += '<div style="display:flex;justify-content:center;gap:10px">';
    h += '<button class="btn" onclick="act(\'rhythmHighwayStrum\')" style="background:linear-gradient(135deg,#4ECDC4,#2BA8A0);color:#fff;font-size:16px;padding:14px 32px;border-radius:14px;font-weight:800">Strum</button>';
    h += '<button class="btn" onclick="act(\'back\')" style="background:var(--input-bg);color:var(--text-secondary);padding:14px 20px;border-radius:14px">Exit</button>';
    h += '</div>';

    h += '</div>';
    return h;
  }

  function rhythmHighwayPage() {
    if (S.rhythmHighwayResult) return rhythmHighwayResultsPage();
    var snapshot = S.rhythmHighwaySnapshot;
    if (!snapshot) return '<div class="text-center"><p>No rhythm session active.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

    var isPractice = (runtime.activePayload && runtime.activePayload.mode === "practice") ||
                     (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.source === "lesson_generator");
    if (isPractice) return practiceHighwayPage(snapshot);

    var laneChart = getRhythmHighwayLaneChart(runtime.activePayload || runtime.sourcePayload || null);
    var lanes = laneChart && Array.isArray(laneChart.lanes) ? laneChart.lanes : buildFallbackLanes();
    var laneCount = lanes.length;
    var activePreset = getCurrentAssistPreset();
    var h = '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Rhythm Highway</h2>';
    h += '<p style="color:var(--text-dim);font-size:13px;margin-bottom:8px">Hold frets 1-5 and strum on time. Audio clock drives the run; this page only renders snapshots.</p>';
    h += '<div style="margin-bottom:14px">';
    h += '<div style="font-size:11px;font-weight:800;color:var(--text-secondary);margin-bottom:6px">Assist Mode</div>';
    h += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">';
    for (var pi = 0; pi < ASSIST_PRESETS.length; pi++) {
      var preset = ASSIST_PRESETS[pi];
      var presetActive = activePreset && activePreset.id === preset.id;
      h += '<button class="btn" onclick="act(\'rhythmHighwayPreset\',\'' + preset.id + '\')" style="min-width:112px;background:' + (presetActive ? "#4ECDC4" : "var(--input-bg)") + ';color:' + (presetActive ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + preset.label + '</button>';
    }
    h += '</div>';
    h += '<div style="margin-top:6px;font-size:11px;color:var(--text-muted)">' + escHTML(activePreset ? activePreset.hint : "Switching assist mode restarts the run.") + '</div>';
    h += '</div>';
    h += '<div style="display:flex;justify-content:center;gap:18px;margin-bottom:12px">';
    h += '<div><div style="font-size:24px;font-weight:900;color:#FFE66D">' + snapshot.gameplay.score + '</div><div style="font-size:10px;color:var(--text-muted)">Score</div></div>';
    h += '<div><div style="font-size:24px;font-weight:900;color:#FF6B6B">' + (snapshot.gameplay.combo || 0) + 'x</div><div style="font-size:10px;color:var(--text-muted)">Combo</div></div>';
    h += '<div><div style="font-size:24px;font-weight:900;color:#FF8A5C">' + snapshot.gameplay.maxCombo + 'x</div><div style="font-size:10px;color:var(--text-muted)">Max Combo</div></div>';
    h += '<div><div style="font-size:24px;font-weight:900;color:#4ECDC4">' + Math.round((snapshot.gameplay.accuracy || 0) * 100) + '%</div><div style="font-size:10px;color:var(--text-muted)">Accuracy</div></div>';
    h += '</div>';
    h += '<div style="display:inline-flex;align-items:center;gap:8px;margin:0 auto 12px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:12px;font-weight:800;color:var(--text-primary)">';
    h += '<span>Combo Live</span><span style="color:#FF8A5C">' + (snapshot.gameplay.combo || 0) + 'x</span>';
    h += '</div>';
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.label) {
      h += '<div style="margin-bottom:12px;font-size:11px;color:var(--text-muted);font-weight:700">Focused Drill: ' + escHTML(S.rhythmHighwayLaunchContext.label) + '</div>';
    }
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.song) {
      h += '<div style="margin-bottom:12px;font-size:12px;color:var(--text-primary);font-weight:800">Now Playing: ' + escHTML(S.rhythmHighwayLaunchContext.song.title) + '</div>';
    }
    if (snapshot.feedback) {
      h += '<div style="display:inline-flex;align-items:center;gap:8px;margin:0 auto 12px;padding:8px 14px;border-radius:999px;background:' + feedbackColor(snapshot.feedback.type) + ';color:#fff;font-size:12px;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.18)">';
      h += '<span>' + escHTML(feedbackLabel(snapshot.feedback.type)) + '</span>';
      h += '<span style="opacity:.85">Lane ' + escHTML(String((snapshot.feedback.lane || 0) + 1)) + '</span>';
      h += '</div>';
    }

    h += '<div style="position:relative;width:max-content;max-width:100%;margin:0 auto 16px;padding:18px 18px 12px;border-radius:24px;background:radial-gradient(circle at top,rgba(255,255,255,.06),rgba(6,8,12,.94) 58%);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 60px rgba(0,0,0,.28)">';
    if (snapshot.feedback && snapshot.feedback.type === "miss") {
      h += '<div style="position:absolute;inset:0;border-radius:24px;background:rgba(255,68,68,.12);pointer-events:none"></div>';
    }
    h += '<div style="display:grid;grid-template-columns:repeat(' + laneCount + ',56px);gap:8px;justify-content:center;align-items:end;height:320px;position:relative">';
    for (var lane = 0; lane < laneCount; lane++) {
      h += '<div style="position:relative;height:320px;border-radius:14px;background:linear-gradient(180deg,rgba(17,17,17,.95),rgba(9,9,11,.98));border:1px solid rgba(255,255,255,.12);overflow:hidden">';
      if (maskHasLane(S.rhythmHighwayHeldMask, lane)) {
        h += '<div style="position:absolute;left:0;right:0;top:0;bottom:0;background:rgba(255,255,255,.08);box-shadow:inset 0 0 24px rgba(255,255,255,.1)"></div>';
      }
      h += '<div style="position:absolute;left:0;right:0;top:0;bottom:0;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,0) 20%,rgba(255,255,255,.03) 100%)"></div>';
      h += '<div style="position:absolute;left:4px;right:4px;bottom:72px;height:2px;background:#fff;border-radius:999px;box-shadow:0 0 18px rgba(255,255,255,.5)"></div>';
      if (snapshot.feedback && snapshot.feedback.lane === lane) {
        h += '<div style="position:absolute;left:8px;right:8px;bottom:66px;height:14px;border-radius:999px;background:' + feedbackColor(snapshot.feedback.type) + ';opacity:.9;box-shadow:0 0 18px ' + feedbackColor(snapshot.feedback.type) + '"></div>';
      }
      h += '<div style="position:absolute;left:0;right:0;bottom:12px;font-size:12px;font-weight:900;color:' + laneColor(lane) + '">' + lanes[lane].label + '</div>';
      for (var gi = 0; gi < (snapshot.ghostNotes || []).length; gi++) {
        var ghost = snapshot.ghostNotes[gi];
        if (!noteHasLane(ghost, lane)) continue;
        var ghostBottom = Math.max(96, Math.min(296, 86 + ((3 - (ghost.timeSec - snapshot.songTimeSec)) * 66)));
        h += '<div style="position:absolute;left:14px;right:14px;bottom:' + ghostBottom + 'px;height:12px;border-radius:8px;border:1px dashed ' + laneColor(lane) + ';opacity:.25"></div>';
      }
      for (var i = 0; i < snapshot.notes.length; i++) {
        var note = snapshot.notes[i];
        if (!noteHasLane(note, lane)) continue;
        var bottom = Math.max(86, Math.min(286, 86 + ((3 - (note.timeSec - snapshot.songTimeSec)) * 66)));
        h += '<div style="position:absolute;left:8px;right:8px;bottom:' + bottom + 'px;height:18px;border-radius:8px;background:' + noteVisualColor(note, snapshot.feedback) + ';opacity:' + (note.hit ? 0.35 : 0.95) + ';box-shadow:0 8px 18px rgba(0,0,0,.24)" title="' + escHTML(note.label || "") + '"></div>';
      }
      h += '</div>';
    }
    h += '</div>';
    h += '<div style="margin-top:10px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.5)">Hit line</div>';
    h += '</div>';

    h += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
    for (var fi = 0; fi < laneCount; fi++) {
      var active = maskHasLane(S.rhythmHighwayHeldMask, fi);
      h += '<button class="btn" onclick="act(\'rhythmHighwayLane\',' + fi + ')" style="min-width:54px;background:' + (active ? laneColor(fi) : "var(--input-bg)") + ';color:' + (active ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + lanes[fi].label + '</button>';
    }
    h += '</div>';
    h += '<div style="display:flex;justify-content:center;gap:10px">';
    h += '<button class="btn" onclick="act(\'rhythmHighwayStrum\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-size:18px;padding:14px 28px">Strum</button>';
    h += '<button class="btn" onclick="act(\'' + (S.rhythmHighwayLoop ? "rhythmHighwayClearLoop" : "rhythmHighwayLoopWindow") + '\')" style="background:' + (S.rhythmHighwayLoop ? "#4ECDC4" : "var(--input-bg)") + ';color:' + (S.rhythmHighwayLoop ? "#fff" : "var(--text-secondary)") + '">' + (S.rhythmHighwayLoop ? "Clear Loop" : "Loop Window") + '</button>';
    h += '<button class="btn" onclick="act(\'back\')" style="background:var(--input-bg);color:var(--text-secondary)">Exit</button>';
    h += '</div>';
    if (runtime.mode === "playable") {
      var assist = S.rhythmHighwayPracticeAssist || { slowMode: false, loop: null };
      h += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px">';
      h += '<button class="btn" onclick="act(\'rhythmHighwayToggleSlowMode\')" style="background:' + (assist.slowMode ? "#4ECDC4" : "var(--input-bg)") + ';color:' + (assist.slowMode ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + (assist.slowMode ? "Slow Mode On" : "Slow Mode Off") + '</button>';
      h += '<button class="btn" onclick="act(\'' + (assist.loop ? "rhythmHighwayClearPracticeLoop" : "rhythmHighwayPracticeLoopWindow") + '\')" style="background:' + (assist.loop ? "#FFE66D" : "var(--input-bg)") + ';color:' + (assist.loop ? "#1F2937" : "var(--text-secondary)") + ';font-weight:800">' + (assist.loop ? "Clear Practice Loop" : "Loop 2s Window") + '</button>';
      h += '</div>';
      if (assist.useAudioClock) {
        h += '<div class="card" style="margin:12px auto 0;max-width:360px;text-align:left;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)">';
        h += '<div style="font-size:12px;font-weight:900;color:var(--text-primary);margin-bottom:8px">Backing Track Sync</div>';
        h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Tune the feel. Prioritize sync over theory if the chart feels late or early.</div>';
        h += '<div style="display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap">';
        h += '<button class="btn" onclick="act(\'rhythmHighwayAudioOffsetDelta\',-10)" style="min-width:54px;background:var(--input-bg);color:var(--text-secondary);font-weight:800">-10</button>';
        h += '<button class="btn" onclick="act(\'rhythmHighwayAudioOffsetDelta\',-1)" style="min-width:54px;background:var(--input-bg);color:var(--text-secondary);font-weight:800">-1</button>';
        h += '<div style="min-width:96px;text-align:center;font-size:14px;font-weight:900;color:var(--text-primary)">' + escHTML(String(Math.round(assist.audioOffsetMs || 0))) + ' ms</div>';
        h += '<button class="btn" onclick="act(\'rhythmHighwayAudioOffsetDelta\',1)" style="min-width:54px;background:var(--input-bg);color:var(--text-secondary);font-weight:800">+1</button>';
        h += '<button class="btn" onclick="act(\'rhythmHighwayAudioOffsetDelta\',10)" style="min-width:54px;background:var(--input-bg);color:var(--text-secondary);font-weight:800">+10</button>';
        h += '</div>';
        h += '</div>';
      }
      if (assist.loop) {
        h += '<div style="margin-top:8px;font-size:11px;color:#FFE66D;font-weight:800">Practice loop: ' + escHTML((assist.loop.start / 1000).toFixed(2)) + 's to ' + escHTML((assist.loop.end / 1000).toFixed(2)) + 's</div>';
      }
    }
    if (S.rhythmHighwayLoop) {
      h += '<div style="margin-top:10px;font-size:11px;color:#4ECDC4;font-weight:800">Looping ' + escHTML(S.rhythmHighwayLoop.label || "current window") + '</div>';
    }
    if (S.rhythmHighwayFeedback) {
      h += '<div style="margin-top:12px;font-size:12px;color:var(--text-muted)">' + escHTML(S.rhythmHighwayFeedback) + '</div>';
    }
    h += '</div>';
    return h;
  }

  function rhythmHighwayResultsPage() {
    var result = S.rhythmHighwayResult;
    var gameplay = result.gameplay || {};
    var learning = result.learning || {};
    var activePreset = getCurrentAssistPreset();
    var moduleGuidance = getRhythmHighwayModuleGuidance(result);
    var coach = buildRhythmHighwayCoach(result);
    var song = S.rhythmHighwayLaunchContext ? S.rhythmHighwayLaunchContext.song : null;
    var playlist = S.rhythmHighwayLaunchContext ? S.rhythmHighwayLaunchContext.playlist : null;
    var progressionState = song ? getSongProgressionState() : null;
    var h = '<div class="text-center" style="padding-top:16px"><div style="font-size:56px;animation:bn .6s ease">&#127928;</div>';
    h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Rhythm Highway Complete</h2>';
    if (activePreset) {
      h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Assist Mode: <span style="color:var(--text-primary);font-weight:800">' + escHTML(activePreset.label) + "</span></div>";
    }
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.exerciseFocus) {
      h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Focus: ' + escHTML(String(S.rhythmHighwayLaunchContext.exerciseFocus).replace(/_/g, " ")) + '</div>';
    }
    h += renderResultsHeroCard(result, song, playlist);
    if (moduleGuidance) {
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(20,184,166,.12),rgba(20,184,166,.04));border:1px solid rgba(20,184,166,.28)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:6px">' + escHTML(moduleGuidance.title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">' + escHTML(moduleGuidance.summary) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">Next: ' + escHTML(moduleGuidance.nextStep) + '</div>';
      h += '</div>';
    }
    if (coach) {
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(99,102,241,.12),rgba(99,102,241,.04));border:1px solid rgba(99,102,241,.26)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:6px">Spark Coach</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">' + escHTML(coach.message) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">Focus: ' + escHTML(coach.focus) + ' · Suggestion: ' + escHTML(coach.suggestion) + '</div>';
      h += '</div>';
    }
    if (result.songFlowOutcome && result.songFlowOutcome.practiceRecommendation) {
      var recommendation = result.songFlowOutcome.practiceRecommendation;
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(0,255,136,.12),rgba(0,255,136,.04));border:1px solid rgba(0,255,136,.22)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:6px">' + escHTML(recommendation.title || "Next Practice") + '</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">' + escHTML(recommendation.summary || "") + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Drill: ' + escHTML(recommendation.drill || "") + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">Target: ' + escHTML(recommendation.target || "") + '</div>';
      h += '</div>';
    }
    if (song) {
      var songStats = getPlayableSongStats(song.id);
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(255,230,109,.1),rgba(255,138,92,.04));border:1px solid rgba(255,230,109,.24)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:6px">Song Progress</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">' + escHTML(song.title) + ' · Best ' + escHTML(String(songStats.bestAccuracy || 0)) + '% · Runs ' + escHTML(String(songStats.runs || 0)) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">Last played: ' + escHTML(songStats.lastPlayed || "Today") + '</div>';
      if (progressionState) {
        h += '<div style="margin-top:8px;font-size:11px;color:var(--text-muted)">Level ' + escHTML(String(progressionState.level)) + ' · XP ' + escHTML(String(progressionState.xp)) + '</div>';
      }
      h += '</div>';
      h += renderAdaptiveSongProgressionTree(playlist, progressionState);
    }
    h += '<div class="card mb16" style="text-align:left"><div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Learning</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">Skills:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(formatSkills(learning.skills || [])) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin:8px 0 6px">Weak Areas:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML((learning.weakAreas || []).join(", ") || "None") + '</div></div>';
    if (S.skillGraph && S.skillGraphSnapshot && typeof SparkSkillTracker !== "undefined") {
      var skillDelta = SparkSkillTracker.getSkillDelta(S.skillGraph, S.skillGraphSnapshot);
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(78,205,196,.1),rgba(78,205,196,.04));border:1px solid rgba(78,205,196,.22)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:8px">Skill Changes</div>';
      var skillNames = { timing: "Timing", rhythm: "Rhythm", chordAccuracy: "Chords" };
      for (var sk in skillDelta) {
        var pct = Math.round(skillDelta[sk] * 100);
        var arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "—";
        var color = pct > 0 ? "#4ECDC4" : pct < 0 ? "#FF6B6B" : "var(--text-muted)";
        h += '<div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0"><span style="color:var(--text-secondary)">' + escHTML(skillNames[sk] || sk) + '</span><span style="color:' + color + ';font-weight:800">' + arrow + ' ' + (pct > 0 ? "+" : "") + pct + '%</span></div>';
      }
      h += '</div>';
    }
    if (S.recommendedLesson) {
      var lesson = S.recommendedLesson;
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(255,138,92,.1),rgba(255,138,92,.04));border:1px solid rgba(255,138,92,.22)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:6px">Practice Recommended</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">' + escHTML(lesson.label) + ' · ' + lesson.tempo + ' BPM · ' + lesson.duration + 's</div>';
      h += '<button class="btn" onclick="act('launchRecommendedLesson')" style="background:linear-gradient(135deg,#FF8A5C,#FF6B6B);color:#fff;font-weight:800;width:100%">Start Drill</button>';
      h += '</div>';
    }
    h += '<div style="display:flex;gap:10px;justify-content:center">';
    if (S.rhythmHighwayLoop) {
      h += '<button class="btn" onclick="act(\'rhythmHighwayClearLoop\')" style="background:var(--input-bg);color:var(--text-secondary)">Play Full Run</button>';
    } else {
      h += '<button class="btn" onclick="act(\'rhythmHighwayLoopWindow\')" style="background:var(--input-bg);color:var(--text-secondary)">Loop Window</button>';
    }
    h += '<button class="btn" onclick="act(\'openPlan\')" style="background:#4ECDC4;color:#fff">Back To Plan</button>';
    h += '</div></div>';
    return h;
  }

  function buildFeedback(result) {
    var weakAreas = result && result.learning && result.learning.weakAreas ? result.learning.weakAreas : [];
    if (weakAreas.indexOf("late") >= 0) return "You were drifting late. Try strumming a hair earlier.";
    if (weakAreas.indexOf("wrong_fret") >= 0) return "Most misses came from fret mismatch. Lock the chord shape before you strum.";
    return "Nice run. Keep the same lane shape steady and aim for longer combos.";
  }

  function feedbackForResolution(resolution) {
    if (!resolution) return "";
    if (resolution.judgement === "perfect") return "Perfect";
    if (resolution.judgement === "good") return "Good";
    if (resolution.judgement === "ok") return "A little off, but it counted.";
    if (resolution.reason === "wrong_fret") return "Wrong fret shape.";
    if (resolution.reason === "early") return "Too early.";
    if (resolution.reason === "late") return "Too late.";
    return "Miss.";
  }

  function formatSkills(skills) {
    if (!skills.length) return "No skill deltas recorded yet.";
    var out = [];
    for (var i = 0; i < skills.length; i++) out.push(skills[i].id + " +" + skills[i].delta);
    return out.join(", ");
  }

  function maskHasLane(mask, laneIndex) {
    return (mask & (1 << laneIndex)) !== 0;
  }

  function createRhythmHighwayAdapter(adapterType) {
    if (adapterType === "ukulele" && typeof SparkUkuleleRhythmAdapter === "function") {
      return new SparkUkuleleRhythmAdapter();
    }
    if (adapterType === "bass" && typeof SparkBassRhythmAdapter === "function") {
      return new SparkBassRhythmAdapter();
    }
    if (adapterType === "piano" && typeof SparkPianoRhythmAdapter === "function") {
      return new SparkPianoRhythmAdapter();
    }
    return new SparkGuitarRhythmAdapter();
  }

  function getRhythmHighwayModuleGuidance(result) {
    var launchContext = S.rhythmHighwayLaunchContext || null;
    if (!launchContext || !launchContext.instrument || !launchContext.exerciseFocus) return null;
    var moduleMap = {
      bass: window.SparkBassModule,
      ukulele: window.SparkUkuleleModule,
      guitar: window.SparkGuitarModule,
      piano: window.SparkPianoModule
    };
    var instrumentModule = moduleMap[launchContext.instrument] || null;
    if (!instrumentModule || typeof instrumentModule.getRhythmGuidance !== "function") return null;
    return instrumentModule.getRhythmGuidance(launchContext.exerciseFocus, result || S.rhythmHighwayResult || null);
  }

  function cloneRhythmHighwayLaunchContext() {
    if (!S.rhythmHighwayLaunchContext) return null;
    return JSON.parse(JSON.stringify(S.rhythmHighwayLaunchContext));
  }

  function resolveRhythmHighwayPresetName(name) {
    var presets = window.SparkEnginePresetRegistry && typeof SparkEnginePresetRegistry.all === "function"
      ? SparkEnginePresetRegistry.all()
      : {};
    return presets[name] ? name : "spark_learning";
  }

  function getCurrentAssistPreset() {
    var presetName = resolveRhythmHighwayPresetName(S.rhythmHighwayPreset);
    for (var i = 0; i < ASSIST_PRESETS.length; i++) {
      if (ASSIST_PRESETS[i].id === presetName) return ASSIST_PRESETS[i];
    }
    return ASSIST_PRESETS[0];
  }

  function getRhythmHighwayLaneLabels() {
    var laneChart = getRhythmHighwayLaneChart(runtime.activePayload || runtime.sourcePayload || null);
    if (laneChart && Array.isArray(laneChart.lanes) && laneChart.lanes.length) {
      return laneChart.lanes.map(function(lane) { return lane.label; });
    }
    var payload = runtime.activePayload || runtime.sourcePayload || null;
    if (payload && Array.isArray(payload.laneLabels) && payload.laneLabels.length) {
      return payload.laneLabels.slice();
    }
    var laneCount = payload && payload.laneCount ? payload.laneCount : 5;
    if (laneCount === 4) return ["G", "C", "E", "A"];
    return ["G", "R", "Y", "B", "O"];
  }

  function buildRhythmHighwayLoopPayload(payload, loopSpec) {
    if (!payload || !payload.songChart || !loopSpec) return payload;
    var chart = payload.songChart;
    var track = getRhythmHighwayTrack(chart);
    if (!track || !track.notes || !track.notes.length) return payload;

    var startTick = Math.max(0, loopSpec.startTick || 0);
    var endTick = Math.max(startTick + 1, loopSpec.endTick || (startTick + chart.tempoMap.ppq));
    var filteredNotes = [];
    for (var i = 0; i < track.notes.length; i++) {
      var note = track.notes[i];
      if (note.tick < startTick || note.tick > endTick) continue;
      filteredNotes.push(new SparkNoteEvent({
        id: note.id,
        tick: note.tick - startTick,
        tickLength: note.tickLength || 0,
        laneMask: note.laneMask,
        flags: JSON.parse(JSON.stringify(note.flags || {})),
        difficulty: note.difficulty,
        instrument: note.instrument,
        label: note.label,
        skillId: note.skillId
      }));
    }
    if (!filteredNotes.length) return payload;

    var shiftedTempoMap = buildShiftedTempoMap(chart.tempoMap, startTick, endTick);
    var filteredPhrases = buildShiftedLoopPhrases(track.phrases || [], startTick, endTick);
    var metadata = JSON.parse(JSON.stringify(chart.metadata || {}));
    metadata.loopedFrom = {
      startTick: startTick,
      endTick: endTick,
      label: loopSpec.label || null
    };

    return {
      chartId: payload.chartId ? payload.chartId + "_loop" : "rhythm_loop",
      adapterType: payload.adapterType || "guitar",
      enginePreset: payload.enginePreset || "spark_learning",
      laneCount: payload.laneCount || 5,
      laneLabels: Array.isArray(payload.laneLabels) ? payload.laneLabels.slice() : null,
      songChart: new SparkSongChart({
        song: JSON.parse(JSON.stringify(chart.song || {})),
        tempoMap: shiftedTempoMap,
        metadata: metadata,
        tracks: buildTrackMap(payload.adapterType || (chart.metadata && chart.metadata.defaultTrackId) || "guitar", filteredNotes, filteredPhrases)
      })
    };
  }

  function createRhythmHighwayLoopSpec(payload, snapshot) {
    if (!payload || !payload.songChart || !snapshot) return null;
    var track = getRhythmHighwayTrack(payload.songChart);
    if (!track || !track.notes || !track.notes.length) return null;

    var songTimeSec = snapshot.songTimeSec || 0;
    var targetIndex = findLoopTargetIndex(payload.songChart, track.notes, songTimeSec);
    var startIndex = Math.max(0, targetIndex - 1);
    var endIndex = Math.min(track.notes.length - 1, targetIndex + 2);
    var startNote = track.notes[startIndex];
    var endNote = track.notes[endIndex];
    var trailingTicks = payload.songChart.tempoMap && payload.songChart.tempoMap.ppq ? payload.songChart.tempoMap.ppq : 480;

    return {
      startTick: startNote.tick,
      endTick: endNote.tick + (endNote.tickLength || 0) + trailingTicks,
      label: (startNote.label || "practice window") + " loop"
    };
  }

  function findLoopTargetIndex(chart, notes, songTimeSec) {
    var bestIndex = 0;
    var bestDistance = Infinity;
    var timingEngine = new SparkTimingEngine(new SparkCalibrationEngine());
    for (var i = 0; i < notes.length; i++) {
      var noteSec = timingEngine.tickToSeconds(chart.tempoMap, notes[i].tick);
      var distance = noteSec >= songTimeSec ? (noteSec - songTimeSec) : (songTimeSec - noteSec + 0.5);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function buildShiftedTempoMap(tempoMap, startTick, endTick) {
    var segments = tempoMap && Array.isArray(tempoMap.segments) ? tempoMap.segments : [];
    var shifted = [];
    var activeBpm = segments.length ? segments[0].bpm : 100;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].tick <= startTick) activeBpm = segments[i].bpm;
      if (segments[i].tick > startTick && segments[i].tick < endTick) {
        shifted.push({ tick: segments[i].tick - startTick, bpm: segments[i].bpm });
      }
    }
    shifted.unshift({ tick: 0, bpm: activeBpm });
    return new SparkTempoMap({
      ppq: tempoMap && tempoMap.ppq ? tempoMap.ppq : 480,
      segments: shifted
    });
  }

  function buildShiftedLoopPhrases(phrases, startTick, endTick) {
    var out = [];
    for (var i = 0; i < phrases.length; i++) {
      var phrase = phrases[i];
      if (phrase.endTick < startTick || phrase.startTick > endTick) continue;
      out.push(new SparkPhrase({
        id: phrase.id,
        name: phrase.name,
        startTick: Math.max(0, phrase.startTick - startTick),
        endTick: Math.max(0, Math.min(endTick, phrase.endTick) - startTick),
        flags: JSON.parse(JSON.stringify(phrase.flags || {}))
      }));
    }
    if (!out.length) {
      out.push(new SparkPhrase({
        id: 0,
        name: "Loop Window",
        startTick: 0,
        endTick: Math.max(1, endTick - startTick),
        flags: {}
      }));
    }
    return out;
  }

  function laneColor(index) {
    return ["#4ade80", "#ef4444", "#facc15", "#3b82f6", "#f97316"][index] || "#999";
  }

  function getRhythmHighwayLaneChart(payload) {
    if (payload && payload.chart) return payload.chart;
    if (payload && payload.songChart) return buildLaneChartFromSongChart(payload);
    return null;
  }

  function buildLaneChartFromSongChart(payload) {
    var labels = payload && Array.isArray(payload.laneLabels) && payload.laneLabels.length
      ? payload.laneLabels.slice()
      : buildDefaultLaneLabels(payload && payload.laneCount ? payload.laneCount : 5);
    var laneCount = payload && payload.laneCount ? payload.laneCount : labels.length;
    var track = payload && payload.songChart ? getRhythmHighwayTrack(payload.songChart) : null;
    var lanes = [];
    var notes = [];
    var i;
    for (i = 0; i < laneCount; i++) {
      lanes.push({
        lane: i,
        label: labels[i] || ("Lane " + (i + 1)),
        input: buildLaneKeyBinding(i)
      });
    }
    if (track && Array.isArray(track.notes)) {
      for (i = 0; i < track.notes.length; i++) {
        notes.push({
          id: track.notes[i].id,
          time: Math.round(payload.songChart.tempoMap.tickToSeconds(track.notes[i].tick) * 1000),
          lane: track.notes[i].lane != null ? track.notes[i].lane : primaryLaneFromMask(track.notes[i].laneMask),
          duration: Math.round(payload.songChart.tempoMap.tickToSeconds(track.notes[i].tick + (track.notes[i].tickLength || 0)) * 1000) - Math.round(payload.songChart.tempoMap.tickToSeconds(track.notes[i].tick) * 1000),
          velocity: 1
        });
      }
    }
    return {
      chartId: payload && payload.chartId ? payload.chartId : "chart",
      tempo: payload && payload.songChart && payload.songChart.tempoMap && payload.songChart.tempoMap.segments && payload.songChart.tempoMap.segments.length ? payload.songChart.tempoMap.segments[0].bpm : 100,
      lanes: lanes,
      notes: notes
    };
  }

  function buildFallbackLanes() {
    var labels = buildDefaultLaneLabels(5);
    var lanes = [];
    for (var i = 0; i < labels.length; i++) {
      lanes.push({ lane: i, label: labels[i], input: buildLaneKeyBinding(i) });
    }
    return lanes;
  }

  function buildDefaultLaneLabels(laneCount) {
    if (laneCount === 4) return ["G", "C", "E", "A"];
    if (laneCount === 5) return ["G", "R", "Y", "B", "O"];
    var labels = [];
    for (var i = 0; i < laneCount; i++) labels.push("Lane " + (i + 1));
    return labels;
  }

  function buildLaneKeyBinding(index) {
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return keys[index] || String(index + 1);
  }

  function mapKeyToLane(key) {
    var laneChart = getRhythmHighwayLaneChart(runtime.activePayload || runtime.sourcePayload || null);
    var lanes = laneChart && Array.isArray(laneChart.lanes) ? laneChart.lanes : buildFallbackLanes();
    var normalizedKey = String(key || "").toLowerCase();
    for (var i = 0; i < lanes.length; i++) {
      if (String(lanes[i].input || "").toLowerCase() === normalizedKey) return lanes[i].lane;
    }
    return -1;
  }

  function noteHasLane(note, lane) {
    if (note && note.lane != null) return note.lane === lane;
    return maskHasLane(note ? note.laneMask : 0, lane);
  }

  function primaryLaneFromMask(mask) {
    for (var i = 0; i < 32; i++) {
      if (mask & (1 << i)) return i;
    }
    return 0;
  }

  function getRhythmHighwayTrack(chart) {
    if (!chart || !chart.tracks) return null;
    var trackId = chart.metadata && chart.metadata.defaultTrackId ? chart.metadata.defaultTrackId : null;
    if (trackId && chart.tracks[trackId]) return chart.tracks[trackId];
    for (var key in chart.tracks) {
      if (chart.tracks[key]) return chart.tracks[key];
    }
    return null;
  }

  function buildTrackMap(trackId, notes, phrases) {
    var tracks = {};
    tracks[trackId] = {
      instrument: trackId,
      notes: notes,
      phrases: phrases
    };
    return tracks;
  }

  function createPlayableRhythmRuntime(chart, options) {
    if (!chart || !Array.isArray(chart.notes) || !Array.isArray(chart.lanes)) return null;
    options = options || {};
    var speed = typeof options.speed === "number" ? options.speed : 0.28;
    var hitLineY = typeof options.hitLineY === "number" ? options.hitLineY : 400;
    var height = typeof options.height === "number" ? options.height : 480;
    var windows = {
      perfect: typeof options.perfectWindowMs === "number" ? options.perfectWindowMs : 45,
      good: typeof options.goodWindowMs === "number" ? options.goodWindowMs : 90,
      hit: typeof options.hitWindowMs === "number" ? options.hitWindowMs : 140
    };
    var state = {
      chart: chart,
      startTime: performance.now(),
      songOffsetMs: 0,
      inputOffsetMs: typeof options.inputOffsetMs === "number" ? options.inputOffsetMs : -20,
      audioOffsetMs: typeof options.audioOffsetMs === "number" ? options.audioOffsetMs : 0,
      audioSource: options.audioSource || null,
      useAudioClock: !!options.audioSource,
      speedMultiplier: typeof options.speedMultiplier === "number" ? options.speedMultiplier : (options.slowMode ? 0.75 : 1),
      judgedNotes: {},
      score: [],
      combo: 0,
      maxCombo: 0,
      totalScore: 0,
      lastFeedback: null,
      feedbackDurationMs: typeof options.feedbackDurationMs === "number" ? options.feedbackDurationMs : 300,
      loop: normalizePlayableLoop(options.loop, chart.notes),
      loopCount: 0
    };
    if (state.loop) {
      state.songOffsetMs = state.loop.start;
    }
    if (state.useAudioClock) {
      seekPlayableAudio(state, state.songOffsetMs);
    }

    return {
      getSnapshot: function() {
        var now = getPlayableSongTime(state);
        settleExpiredNotes(state, windows.hit, now);
        var visibleNotes = [];
        var ghostNotes = [];
        var i;
        for (i = 0; i < chart.notes.length; i++) {
          if (!noteInPlayableWindow(chart.notes[i], state.loop)) continue;
          var y = hitLineY - getNoteY(chart.notes[i].time, now, speed);
          var noteState = {
            id: chart.notes[i].id,
            lane: chart.notes[i].lane,
            timeSec: chart.notes[i].time / 1000,
            y: y,
            label: chart.notes[i].label || "",
            hit: !!state.judgedNotes[chart.notes[i].id]
          };
          if (y >= -50 && y <= height + 50) visibleNotes.push(noteState);
          else if (chart.notes[i].time > now && chart.notes[i].time - now <= 2000) ghostNotes.push(noteState);
        }
        return {
          songTimeSec: now / 1000,
          notes: visibleNotes,
          ghostNotes: ghostNotes,
          feedback: getActivePlayableFeedback(state, now),
          gameplay: {
            score: state.totalScore,
            combo: state.combo,
            maxCombo: state.maxCombo,
            accuracy: getPlayableAccuracy(state)
          },
          finished: this.isFinished()
        };
      },
      handleLaneInput: function(lane) {
        var now = getPlayableSongTime(state);
        settleExpiredNotes(state, windows.hit, now);
        var note = findMatchingLaneNote(chart.notes, state.judgedNotes, lane, now, windows.hit);
        if (!note) {
          applyPlayableJudgement(state, "miss", lane, now);
          return "Miss.";
        }
        var delta = Math.abs(now - note.time);
        var result = "miss";
        if (delta < windows.perfect) result = "perfect";
        else if (delta < windows.good) result = "good";
        state.judgedNotes[note.id] = result;
        applyPlayableJudgement(state, result, lane, now);
        return feedbackLabel(result);
      },
      getResults: function() {
        var hits = getHitCount(state);
        return {
          accuracy: getPlayableAccuracy(state),
          hits: hits,
          total: getPlayableAttemptCount(state),
          score: state.totalScore,
          xpEarned: computePlayableXP(getPlayableAccuracy(state), state.maxCombo),
          streak: state.combo,
          combo: state.combo,
          maxCombo: state.maxCombo,
          suggestedDifficulty: getPlayableSuggestedDifficulty(getPlayableAccuracy(state)),
          breakdown: state.score.slice()
        };
      },
      getAssistState: function() {
        return {
          slowMode: state.speedMultiplier < 1,
          speedMultiplier: state.speedMultiplier,
          inputOffsetMs: state.inputOffsetMs,
          audioOffsetMs: state.audioOffsetMs,
          useAudioClock: state.useAudioClock,
          scrollSpeed: speed,
          windows: {
            perfect: windows.perfect,
            good: windows.good,
            hit: windows.hit
          },
          loop: state.loop ? { start: state.loop.start, end: state.loop.end } : null
        };
      },
      setSlowMode: function(enabled) {
        state.songOffsetMs = getPlayableSongTime(state);
        state.speedMultiplier = enabled ? 0.75 : 1;
        state.startTime = performance.now();
      },
      setAudioOffset: function(offsetMs) {
        state.songOffsetMs = getPlayableSongTime(state);
        state.audioOffsetMs = typeof offsetMs === "number" ? offsetMs : 0;
        state.startTime = performance.now();
      },
      setLoop: function(start, end) {
        state.loop = normalizePlayableLoop({ start: start, end: end }, chart.notes);
        state.loopCount = 0;
        state.judgedNotes = {};
        state.songOffsetMs = state.loop ? state.loop.start : 0;
        state.startTime = performance.now();
        seekPlayableAudio(state);
      },
      clearLoop: function() {
        state.loop = null;
        state.loopCount = 0;
        state.judgedNotes = {};
        state.songOffsetMs = 0;
        state.startTime = performance.now();
        seekPlayableAudio(state);
      },
      isFinished: function() {
        var now = getPlayableSongTime(state);
        if (state.loop) return false;
        settleExpiredNotes(state, windows.hit, now);
        return Object.keys(state.judgedNotes).length >= getPlayableActiveNoteCount(chart.notes, state.loop) || now > getLastNoteTime(chart.notes) + 1000;
      },
      stop: function() {
        stopPlayableAudio(state);
      }
    };
  }

  function getPlayableSongTime(state) {
    var raw = 0;
    if (state.useAudioClock && state.audioSource && !state.audioSource.paused && !state.audioSource.ended) {
      raw = (state.audioSource.currentTime * 1000) - state.audioOffsetMs + state.inputOffsetMs;
    } else {
      raw = state.songOffsetMs + ((performance.now() - state.startTime) * state.speedMultiplier) + state.inputOffsetMs;
    }
    if (!state.loop || state.loop.end <= state.loop.start) return raw;
    var loopLength = state.loop.end - state.loop.start;
    while (raw > state.loop.end) {
      raw -= loopLength;
      state.loopCount += 1;
      resetPlayableLoopJudgements(state);
      if (state.useAudioClock) seekPlayableAudio(state, raw);
    }
    state.songOffsetMs = raw;
    state.startTime = performance.now();
    return raw;
  }

  function mergePlayableRuntimeOptions(metadataOptions, launchOptions) {
    var out = {};
    var key;
    metadataOptions = metadataOptions || {};
    launchOptions = launchOptions || {};
    for (key in metadataOptions) {
      if (Object.prototype.hasOwnProperty.call(metadataOptions, key)) out[key] = metadataOptions[key];
    }
    for (key in launchOptions) {
      if (Object.prototype.hasOwnProperty.call(launchOptions, key)) out[key] = launchOptions[key];
    }
    return out;
  }

  function createPlayableBackingAudioSource(audioSpec) {
    if (!audioSpec || !audioSpec.uri) return null;
    if (typeof window !== "undefined" && typeof window.createPlayableBackingAudioSource === "function") {
      return window.createPlayableBackingAudioSource(audioSpec);
    }
    if (typeof Audio === "undefined") return null;
    var audio = new Audio(audioSpec.uri);
    audio.preload = "auto";
    return audio;
  }

  function resolvePlayableBackingAudioSpec(song, payload, options) {
    options = options || {};
    var chartMeta = payload && payload.chart && payload.chart.metadata ? payload.chart.metadata : {};
    var songAudio = song && song.audio ? song.audio : {};
    var uri = options.audioURI || options.audioFile || songAudio.uri || songAudio.audioFile || chartMeta.audioURI || chartMeta.audioFile || null;
    var offsetMs = firstNumeric(
      options.audioOffsetMs,
      songAudio.offsetMs,
      chartMeta.audioOffsetMs
    );
    if (!uri && typeof options.audioSource !== "object") return null;
    return {
      uri: uri,
      offsetMs: offsetMs || 0
    };
  }

  function firstNumeric() {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === "number" && !isNaN(arguments[i])) return arguments[i];
    }
    return null;
  }

  function seekPlayableAudio(state, songTimeMs) {
    if (!state || !state.audioSource) return;
    if (typeof songTimeMs !== "number") songTimeMs = state.songOffsetMs || 0;
    var targetMs = Math.max(0, songTimeMs + state.audioOffsetMs);
    if (typeof state.audioSource.currentTime === "number") {
      state.audioSource.currentTime = targetMs / 1000;
    }
    if (typeof state.audioSource.play === "function" && state.audioSource.paused) {
      try { state.audioSource.play(); } catch (e) {}
    }
  }

  function stopPlayableAudio(state) {
    if (!state || !state.audioSource) return;
    if (typeof state.audioSource.pause === "function") {
      try { state.audioSource.pause(); } catch (e) {}
    }
  }

  function normalizePlayableLoop(loop, notes) {
    if (!loop) return null;
    var start = typeof loop.start === "number" ? loop.start : 0;
    var end = typeof loop.end === "number" ? loop.end : Math.min(getLastNoteTime(notes), start + 2000);
    if (end <= start) return null;
    return { start: start, end: end };
  }

  function noteInPlayableWindow(note, loop) {
    if (!loop) return true;
    return note.time >= loop.start && note.time <= loop.end;
  }

  function resetPlayableLoopJudgements(state) {
    if (!state.loop) return;
    var next = {};
    var key;
    for (key in state.judgedNotes) {
      if (!Object.prototype.hasOwnProperty.call(state.judgedNotes, key)) continue;
      var note = getChartNoteById(state.chart.notes, key);
      if (!note || !noteInPlayableWindow(note, state.loop)) next[key] = state.judgedNotes[key];
    }
    state.judgedNotes = next;
  }

  function getChartNoteById(notes, id) {
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i].id === id) return notes[i];
    }
    return null;
  }

  function settleExpiredNotes(state, hitWindowMs, now) {
    var i;
    for (i = 0; i < state.chart.notes.length; i++) {
      var note = state.chart.notes[i];
      if (!noteInPlayableWindow(note, state.loop)) continue;
      if (state.judgedNotes[note.id]) continue;
      if (now - note.time > hitWindowMs) {
        state.judgedNotes[note.id] = "miss";
        applyPlayableJudgement(state, "miss", note.lane, note.time);
      }
    }
  }

  function applyPlayableJudgement(state, result, lane, atTime) {
    updatePlayableCombo(state, result);
    state.totalScore += scorePlayableResult(result);
    state.score.push(result);
    state.lastFeedback = {
      type: result,
      lane: typeof lane === "number" ? lane : 0,
      time: atTime
    };
  }

  function updatePlayableCombo(state, result) {
    if (result === "miss") {
      state.combo = 0;
      return;
    }
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
  }

  function scorePlayableResult(result) {
    if (result === "perfect") return 100;
    if (result === "good") return 70;
    return 0;
  }

  function getPlayableAccuracy(state) {
    var attempts = getPlayableAttemptCount(state);
    return attempts ? getHitCount(state) / attempts : 0;
  }

  function getPlayableAttemptCount(state) {
    return state.score.length;
  }

  function computePlayableXP(accuracy, combo) {
    return Math.max(0, Math.floor((accuracy || 0) * 50 + Math.max(0, combo || 0) * 2));
  }

  function getPlayableSuggestedDifficulty(accuracy) {
    if (accuracy > 0.9) return "hard";
    if (accuracy < 0.6) return "easy";
    return "normal";
  }

  function getPlayableActiveNoteCount(notes, loop) {
    var count = 0;
    var i;
    for (i = 0; i < notes.length; i++) {
      if (noteInPlayableWindow(notes[i], loop)) count++;
    }
    return count;
  }

  function getActivePlayableFeedback(state, now) {
    if (!state.lastFeedback) return null;
    if (now - state.lastFeedback.time > state.feedbackDurationMs) return null;
    return state.lastFeedback;
  }

  function feedbackColor(type) {
    if (type === "perfect") return "#22C55E";
    if (type === "good") return "#FACC15";
    return "#EF4444";
  }

  function noteVisualColor(note, feedback) {
    if (feedback && feedback.lane === note.lane) return feedbackColor(feedback.type);
    if (note.hit) return "rgba(148,163,184,.55)";
    return "#888";
  }

  function feedbackLabel(type) {
    if (type === "perfect") return "Perfect";
    if (type === "good") return "Good";
    return "Miss.";
  }

  function buildRhythmHighwayCoach(result) {
    if (!result) return null;
    var gameplay = result.gameplay || {};
    var learning = result.learning || {};
    var weakAreas = learning.weakAreas || [];
    var focus = "consistency";
    var message = "Great work";
    var suggestion = "Keep the same speed and push for a cleaner streak.";
    if ((gameplay.accuracy || 0) < 0.6) {
      message = "Focus on consistency before adding speed.";
      focus = "consistency";
      suggestion = "Turn on Slow Mode and repeat the same 2-second loop.";
    } else if (weakAreas.indexOf("late") >= 0 || weakAreas.indexOf("timing") >= 0) {
      message = "Your chord transitions are slightly late.";
      focus = "timing";
      suggestion = "Slow to 70% and repeat the hit window until the line feels early.";
    } else if (weakAreas.indexOf("wrong_fret") >= 0) {
      message = "Your lane targeting slipped on a few notes.";
      focus = "accuracy";
      suggestion = "Loop the phrase and watch the ghost notes before each hit.";
    } else if ((gameplay.maxCombo || 0) >= 12 && (gameplay.accuracy || 0) >= 0.85) {
      message = "Great work. Your timing and control are holding together.";
      focus = "progression";
      suggestion = "Try Challenge mode or import a denser chart next.";
    }
    return {
      message: message,
      focus: focus,
      suggestion: suggestion
    };
  }

  function buildPlayablePracticeRecommendation(result, song, outcome) {
    if (!result) return null;
    var coach = buildRhythmHighwayCoach(result);
    var gameplay = result.gameplay || {};
    var recommendation = {
      title: "Next Practice",
      mode: "steady_run",
      summary: coach ? coach.message : "Keep the next run clean and controlled.",
      drill: coach ? coach.suggestion : "Retry the same song and protect your combo through the first phrase.",
      target: "Land 75%+ accuracy with a cleaner opening phrase."
    };
    if ((gameplay.accuracy || 0) < 0.6) {
      recommendation.mode = "slow_mode";
      recommendation.summary = "Accuracy is still forming, so slow the pattern down.";
      recommendation.drill = "Run Slow Mode and loop the first 2 seconds until the hit line feels early.";
      recommendation.target = "Build one clean phrase before you chase score.";
    } else if ((gameplay.maxCombo || 0) < 8) {
      recommendation.mode = "combo_build";
      recommendation.summary = "You are landing notes, but the streak is breaking too early.";
      recommendation.drill = "Retry and aim only for a longer opening combo before pushing accuracy higher.";
      recommendation.target = "Beat your best combo by 3 notes.";
    } else if (coach && coach.focus === "progression") {
      recommendation.mode = "advance";
      recommendation.summary = "This run is stable enough to move forward.";
      recommendation.drill = outcome && outcome.nextSong ? ("Continue into " + outcome.nextSong.title + ".") : "Move to the next recommended song.";
      recommendation.target = "Carry the same timing into the next unlock.";
    }
    if (song && song.title) recommendation.songTitle = song.title;
    return recommendation;
  }

  function clonePlayableSong(song) {
    if (!song) return null;
    return {
      id: song.id,
      title: song.title,
      difficulty: song.difficulty || "easy",
      chartId: song.chartId || null,
      duration: song.duration || 60,
      unlockLevel: song.unlockLevel || 1,
      tier: song.tier || 1,
      xpReward: song.xpReward || 40,
      requirements: song.requirements ? {
        minAccuracy: typeof song.requirements.minAccuracy === "number" ? song.requirements.minAccuracy : 0,
        previous: Array.isArray(song.requirements.previous) ? song.requirements.previous.slice() : []
      } : {
        minAccuracy: 0,
        previous: []
      }
    };
  }

  function isPlayableSongUnlocked(song, user) {
    song = clonePlayableSong(song);
    user = normalizeSongProgressionUser(user);
    if (!song) return false;
    if (user.unlockedSongs.indexOf(song.id) >= 0) return true;
    if (song.requirements && song.requirements.previous && song.requirements.previous.length) {
      return canUnlockPlayableSong(song, user);
    }
    return user.level >= (song.unlockLevel || 1);
  }

  function getPlayableSongStats(songId) {
    if (typeof S === "undefined") return { bestAccuracy: 0, runs: 0, maxCombo: 0, lastPlayed: null };
    if (!S.performSongStats || typeof S.performSongStats !== "object") S.performSongStats = {};
    if (!S.performSongStats[songId]) {
      S.performSongStats[songId] = {
        bestScore: 0,
        bestAccuracy: 0,
        bestStars: 0,
        runs: 0,
        maxCombo: 0,
        lastPlayed: null,
        phrases: {}
      };
    }
    return S.performSongStats[songId];
  }

  function recordPlayableSongRun(song, results, playlist) {
    song = clonePlayableSong(song);
    if (!song || !results) return null;
    var stats = getPlayableSongStats(song.id);
    var accuracyPct = Math.round((results.accuracy || 0) * 100);
    stats.runs += 1;
    stats.bestScore = Math.max(stats.bestScore || 0, results.score || 0);
    stats.bestAccuracy = Math.max(stats.bestAccuracy || 0, accuracyPct);
    stats.maxCombo = Math.max(stats.maxCombo || 0, results.maxCombo || 0);
    stats.lastPlayed = new Date().toISOString().slice(0, 10);
    updatePlayableSongProgression(song, results, playlist);
    return stats;
  }

  function selectPlayableSongForFlow(playlist, user) {
    return selectNextSongFromProgression(playlist, user);
  }

  function completePlayableSongFlow(song, results, playlist) {
    song = clonePlayableSong(song);
    if (!song || !results) return null;
    updatePlayableRhythmHighwayRetention(results);
    var songStats = recordPlayableSongRun(song, results, playlist);
    var progression = getSongProgressionState();
    var completed = progression && progression.completedSongs ? progression.completedSongs[song.id] : null;
    var nextSong = Array.isArray(playlist) ? selectPlayableSongForFlow(playlist, progression) : null;
    var stats = getPlayableResultsStats({
      gameplay: {
        accuracy: results.accuracy,
        maxCombo: results.maxCombo
      },
      breakdown: results.breakdown || {}
    });
    var outcome = {
      song: song,
      nextSong: nextSong,
      progression: progression,
      songStats: songStats,
      resultsScreen: {
        label: getResultLabel(results.accuracy || 0),
        accuracyPct: Math.round((results.accuracy || 0) * 100),
        stars: completed ? (completed.stars || 0) : computePlayableSongStars(results.accuracy || 0),
        stats: stats,
        primaryAction: nextSong && nextSong.id !== song.id ? {
          action: "songFlowContinue",
          label: "Continue",
          songId: nextSong.id,
          songTitle: nextSong.title
        } : null,
        secondaryAction: {
          action: "restartRhythmHighway",
          label: "Retry"
        }
      }
    };
    outcome.practiceRecommendation = buildPlayablePracticeRecommendation({
      gameplay: {
        accuracy: results.accuracy,
        maxCombo: results.maxCombo
      },
      learning: {
        weakAreas: results.accuracy >= 0.7 ? [] : ["timing"]
      }
    }, song, outcome);
    if (typeof S !== "undefined") S.lastPracticeRecommendation = outcome.practiceRecommendation;
    if (typeof saveState === "function") saveState();
    return outcome;
  }

  function continuePlayableSongFlow() {
    var result = typeof S !== "undefined" ? S.rhythmHighwayResult : null;
    var outcome = result && result.songFlowOutcome ? result.songFlowOutcome : null;
    if (!outcome || !outcome.nextSong) return false;
    return openProgressionMapSong(outcome.nextSong.id);
  }

  function startRecommendedPlayableSongFlow(playlist, user, options) {
    options = options || {};
    var song = selectPlayableSongForFlow(playlist, user);
    if (!song) return false;
    var payload = resolvePlayableSongPayload(song, playlist);
    if (!payload) return false;
    return startPlayableSongSession(song, payload, {
      instrument: options.instrument || song.adapterType || (S && S.rhythmHighwayLaunchContext ? S.rhythmHighwayLaunchContext.instrument : "guitar"),
      playlist: Array.isArray(playlist) ? playlist.slice() : null,
      source: options.source || "recommended_launch",
      user: user
    });
  }

  function getNextPlayableSong(song, playlist) {
    if (!song || !Array.isArray(playlist) || !playlist.length) return null;
    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i].id !== song.id && isPlayableSongUnlocked(playlist[i])) return playlist[i];
    }
    return null;
  }

  function getSongProgressionState() {
    if (typeof S === "undefined") return { unlockedSongs: [], completedSongs: {}, level: 1, xp: 0 };
    if (!S.songProgression || typeof S.songProgression !== "object") {
      S.songProgression = {
        unlockedSongs: [],
        completedSongs: {},
        level: typeof S.level === "number" ? S.level : 1,
        xp: typeof S.xp === "number" ? S.xp : 0
      };
    }
    if (!Array.isArray(S.songProgression.unlockedSongs)) S.songProgression.unlockedSongs = [];
    if (!S.songProgression.completedSongs || typeof S.songProgression.completedSongs !== "object") S.songProgression.completedSongs = {};
    if (typeof S.songProgression.level !== "number") S.songProgression.level = typeof S.level === "number" ? S.level : 1;
    if (typeof S.songProgression.xp !== "number") S.songProgression.xp = typeof S.xp === "number" ? S.xp : 0;
    return S.songProgression;
  }

  function normalizeSongProgressionUser(user) {
    if (user && typeof user === "object") {
      return {
        unlockedSongs: Array.isArray(user.unlockedSongs) ? user.unlockedSongs.slice() : [],
        completedSongs: user.completedSongs && typeof user.completedSongs === "object" ? user.completedSongs : {},
        level: typeof user.level === "number" ? user.level : 1,
        xp: typeof user.xp === "number" ? user.xp : 0,
        _songTree: Array.isArray(user._songTree) ? user._songTree.slice() : null
      };
    }
    return getSongProgressionState();
  }

  function canUnlockPlayableSong(song, user) {
    song = clonePlayableSong(song);
    user = normalizeSongProgressionUser(user);
    if (!song) return false;
    if (song.requirements && Array.isArray(song.requirements.previous) && song.requirements.previous.length) {
      for (var i = 0; i < song.requirements.previous.length; i++) {
        if (!user.completedSongs[song.requirements.previous[i]]) return false;
      }
      var prev = song.requirements.previous[0];
      if (prev && user.completedSongs[prev]) {
        var acc = user.completedSongs[prev].bestAccuracy || 0;
        if (acc < (song.requirements.minAccuracy || 0)) return false;
      }
      return true;
    }
    return user.level >= (song.unlockLevel || 1);
  }

  function updatePlayableSongProgression(song, results, playlist) {
    song = clonePlayableSong(song);
    if (!song || !results) return null;
    var progression = getSongProgressionState();
    var existing = progression.completedSongs[song.id] || {};
    var xpEarned = typeof results.xpEarned === "number" ? results.xpEarned : computePlayableXP(results.accuracy, results.maxCombo);
    progression.completedSongs[song.id] = {
      bestAccuracy: Math.max(existing.bestAccuracy || 0, results.accuracy || 0),
      maxCombo: Math.max(existing.maxCombo || 0, results.maxCombo || 0),
      stars: computePlayableSongStars(results.accuracy || 0),
      lastPlayed: new Date().toISOString().slice(0, 10)
    };
    if (progression.unlockedSongs.indexOf(song.id) < 0) progression.unlockedSongs.push(song.id);
    progression.xp = Math.max(progression.xp || 0, (S && typeof S.xp === "number" ? S.xp : 0)) + xpEarned;
    progression.level = computePlayableSongLevel(progression.xp);
    if (typeof S !== "undefined") {
      S.xp = progression.xp;
      S.level = progression.level;
      S.xpToast = { amount: xpEarned, time: Date.now() };
    }
    var unlocked = unlockPlayableSongs(playlist, progression);
    return {
      progression: progression,
      unlockedSongs: unlocked
    };
  }

  function unlockPlayableSongs(playlist, progression) {
    var unlocked = [];
    if (!Array.isArray(playlist)) return unlocked;
    for (var i = 0; i < playlist.length; i++) {
      var song = clonePlayableSong(playlist[i]);
      if (!song) continue;
      if (progression.unlockedSongs.indexOf(song.id) >= 0) continue;
      if (canUnlockPlayableSong(song, progression)) {
        progression.unlockedSongs.push(song.id);
        unlocked.push(song.id);
      }
    }
    return unlocked;
  }

  function computePlayableSongLevel(xp) {
    return Math.max(1, Math.floor((xp || 0) / 100));
  }

  function computePlayableSongStars(accuracy) {
    if (accuracy >= 0.9) return 3;
    if (accuracy >= 0.75) return 2;
    if (accuracy >= 0.6) return 1;
    return 0;
  }

  function buildPlayableSongUiModel(song, progression) {
    song = clonePlayableSong(song);
    progression = normalizeSongProgressionUser(progression);
    var completed = progression.completedSongs[song.id] || null;
    var songTree = Array.isArray(progression._songTree)
      ? progression._songTree
      : (typeof S !== "undefined" && S.rhythmHighwayLaunchContext && Array.isArray(S.rhythmHighwayLaunchContext.playlist)
        ? S.rhythmHighwayLaunchContext.playlist
        : null);
    var recommendedSong = Array.isArray(songTree)
      ? selectNextSongFromProgression(songTree, progression)
      : null;
    return {
      songId: song.id,
      locked: !isPlayableSongUnlocked(song, progression),
      completed: !!completed,
      stars: completed ? (completed.stars || 0) : 0,
      recommended: !!(recommendedSong && recommendedSong.id === song.id)
    };
  }

  function selectNextSongFromProgression(playlist, progression) {
    progression = normalizeSongProgressionUser(progression);
    if (!Array.isArray(playlist) || !playlist.length) return null;
    progression._songTree = playlist.slice();
    for (var i = 0; i < playlist.length; i++) {
      var song = playlist[i];
      var isAccessible = progression.unlockedSongs.indexOf(song.id) >= 0 || canUnlockPlayableSong(song, progression);
      if (isAccessible && !progression.completedSongs[song.id]) {
        return clonePlayableSong(song);
      }
    }
    for (var j = 0; j < playlist.length; j++) {
      if (canUnlockPlayableSong(playlist[j], progression) && progression.unlockedSongs.indexOf(playlist[j].id) < 0) {
        return clonePlayableSong(playlist[j]);
      }
    }
    var weakest = null;
    var weakestStars = Infinity;
    for (var k = 0; k < playlist.length; k++) {
      var completed = progression.completedSongs[playlist[k].id];
      if (!completed) continue;
      if ((completed.stars || 0) < weakestStars) {
        weakestStars = completed.stars || 0;
        weakest = clonePlayableSong(playlist[k]);
      }
    }
    if (weakest) return weakest;
    return clonePlayableSong(playlist[0]);
  }

  function renderSongProgressionTree(playlist, progression) {
    if (!Array.isArray(playlist) || !playlist.length) return "";
    progression = normalizeSongProgressionUser(progression);
    var h = '<div class="card mb16" style="text-align:left"><div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:8px">Song Path</div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">';
    for (var i = 0; i < playlist.length; i++) {
      var ui = buildPlayableSongUiModel(playlist[i], progression);
      h += '<div style="padding:8px 12px;border-radius:12px;border:1px solid ' + (ui.locked ? "rgba(255,255,255,.1)" : "rgba(78,205,196,.28)") + ';background:' + (ui.locked ? "rgba(255,255,255,.03)" : "rgba(78,205,196,.08)") + ';font-size:11px;font-weight:800;color:' + (ui.locked ? "var(--text-muted)" : "var(--text-primary)") + '">';
      h += escHTML(playlist[i].title) + (ui.completed ? " ★".repeat(ui.stars || 1) : ui.locked ? " Locked" : " Ready");
      h += '</div>';
      if (i < playlist.length - 1) h += '<div style="font-size:14px;color:var(--text-muted)">→</div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderStarsText(stars) {
    if (stars >= 3) return "***";
    if (stars === 2) return "**.";
    if (stars === 1) return "*..";
    return "...";
  }

  function renderDisplayStarsHtml(stars) {
    var h = '<div style="display:flex;gap:2px;justify-content:center;align-items:center">';
    for (var i = 0; i < 3; i++) {
      h += '<span style="font-size:12px;line-height:1;color:' + (i < stars ? "#FFD60A" : "#3A3A3C") + '">&#9733;</span>';
    }
    h += '</div>';
    return h;
  }

  function getResultLabel(accuracy) {
    if (accuracy >= 0.9) return "Excellent";
    if (accuracy >= 0.75) return "Great";
    if (accuracy >= 0.6) return "Good";
    return "Keep Going";
  }

  function getPlayableResultsStats(result) {
    var gameplay = result && result.gameplay ? result.gameplay : {};
    var breakdown = result && result.breakdown ? result.breakdown : {};
    var hits = typeof breakdown.hits === "number" ? breakdown.hits : Math.round((gameplay.accuracy || 0) * ((breakdown.total || 0) || 100));
    var misses = typeof breakdown.misses === "number" ? breakdown.misses : Math.max(0, ((breakdown.total || 0) || 100) - hits);
    return {
      hits: hits,
      misses: misses,
      maxCombo: gameplay.maxCombo || 0
    };
  }

  function renderResultsHeroCard(result, song, playlist) {
    var gameplay = result && result.gameplay ? result.gameplay : {};
    var outcome = result && result.songFlowOutcome ? result.songFlowOutcome : null;
    var resultsScreen = outcome && outcome.resultsScreen ? outcome.resultsScreen : null;
    var accuracy = resultsScreen ? (resultsScreen.accuracyPct || 0) / 100 : (gameplay.accuracy || 0);
    var stars = resultsScreen ? (resultsScreen.stars || 0) : computePlayableSongStars(accuracy);
    var stats = resultsScreen ? (resultsScreen.stats || getPlayableResultsStats(result)) : getPlayableResultsStats(result);
    var primaryAction = resultsScreen ? resultsScreen.primaryAction : null;
    var secondaryAction = resultsScreen ? resultsScreen.secondaryAction : null;
    var h = '<div class="card mb16" style="text-align:center;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);padding:28px 20px;border-radius:28px">';
    h += '<div style="font-size:16px;font-weight:800;color:#8E8E93;letter-spacing:.04em;text-transform:uppercase">' + escHTML(resultsScreen ? resultsScreen.label : getResultLabel(accuracy)) + '</div>';
    h += '<div style="margin-top:10px;font-size:48px;line-height:1;font-weight:900;color:#FFFFFF">' + escHTML(String(resultsScreen ? resultsScreen.accuracyPct : Math.round(accuracy * 100))) + '%</div>';
    h += '<div style="margin-top:16px;display:flex;justify-content:center;gap:8px">';
    for (var i = 0; i < 3; i++) {
      var active = i < stars;
      h += '<span style="font-size:32px;line-height:1;color:' + (active ? "#FFD60A" : "#3A3A3C") + ';animation:' + (active ? ("bn .35s ease " + (i * 0.15).toFixed(2) + "s both") : "none") + '">&#9733;</span>';
    }
    h += '</div>';
    h += '<div style="display:flex;justify-content:center;gap:12px;margin-top:20px">';
    h += '<div class="card" style="min-width:92px;background:#111214;border:1px solid rgba(255,255,255,.05);padding:14px 12px;border-radius:18px"><div style="font-size:24px;font-weight:900;color:#FFFFFF">' + escHTML(String(stats.maxCombo)) + '</div><div style="font-size:11px;color:#8E8E93">Combo</div></div>';
    h += '<div class="card" style="min-width:92px;background:#111214;border:1px solid rgba(255,255,255,.05);padding:14px 12px;border-radius:18px"><div style="font-size:24px;font-weight:900;color:#FFFFFF">' + escHTML(String(stats.hits)) + '</div><div style="font-size:11px;color:#8E8E93">Hits</div></div>';
    h += '<div class="card" style="min-width:92px;background:#111214;border:1px solid rgba(255,255,255,.05);padding:14px 12px;border-radius:18px"><div style="font-size:24px;font-weight:900;color:#FFFFFF">' + escHTML(String(stats.misses)) + '</div><div style="font-size:11px;color:#8E8E93">Misses</div></div>';
    h += '</div>';
    h += '<div style="display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap">';
    if (primaryAction && primaryAction.action === "songFlowContinue") {
      h += '<button class="btn" onclick="act(\'songFlowContinue\')" style="min-width:220px;height:52px;border-radius:14px;border:none;background:#FFFFFF;color:#000000;font-weight:900">' + escHTML(primaryAction.label) + '</button>';
    }
    h += '<button class="btn" onclick="act(\'' + escapeActionArg((secondaryAction && secondaryAction.action) || "restartRhythmHighway") + '\')" style="min-width:160px;height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:#1C1C1E;color:#FFFFFF;font-weight:800">' + escHTML((secondaryAction && secondaryAction.label) || "Retry") + '</button>';
    h += '</div>';
    if (primaryAction && primaryAction.songTitle) {
      h += '<div style="margin-top:10px;font-size:12px;color:#8E8E93">Next: ' + escHTML(primaryAction.songTitle) + '</div>';
    }
    h += '</div>';
    return h;
  }

  function formatInstrumentPathLabel(instrument) {
    var text = String(instrument || "Song").replace(/_/g, " ");
    if (!text) return "Song Path";
    return text.charAt(0).toUpperCase() + text.slice(1) + " Path";
  }

  function getLevelProgressFraction(level, xp) {
    var currentLevel = Math.max(1, level || 1);
    var xpValue = Math.max(0, xp || 0);
    var start = (currentLevel - 1) * 100;
    var offset = Math.max(0, xpValue - start);
    return Math.max(0, Math.min(1, offset / 100));
  }

  function renderProgressBar(level, xp) {
    var fill = Math.round(getLevelProgressFraction(level, xp) * 100);
    return '<div style="margin-top:12px"><div style="height:6px;border-radius:999px;background:#2C2C2E;overflow:hidden"><div style="width:' + fill + '%;height:100%;border-radius:999px;background:#00FF88"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:#8E8E93"><span>Level ' + escHTML(String(level || 1)) + '</span><span>' + escHTML(String(xp || 0)) + ' XP</span></div></div>';
  }

  function escapeActionArg(value) {
    return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function getSongLibraryBrowserState() {
    if (typeof S === "undefined") return { query: "", filter: "all" };
    if (!S.songLibraryBrowser || typeof S.songLibraryBrowser !== "object") {
      S.songLibraryBrowser = { query: "", filter: "all" };
    }
    if (typeof S.songLibraryBrowser.query !== "string") S.songLibraryBrowser.query = "";
    if (typeof S.songLibraryBrowser.filter !== "string") S.songLibraryBrowser.filter = "all";
    return S.songLibraryBrowser;
  }

  function normalizeSongDifficulty(song) {
    var difficulty = String(song && song.difficulty ? song.difficulty : "").toLowerCase();
    if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") return difficulty;
    var tier = getPlayableSongTier(song, 0);
    if (tier <= 1) return "easy";
    if (tier === 2) return "medium";
    return "hard";
  }

  function getSongLibrarySubtitle(song) {
    if (song && song.skill) return String(song.skill).replace(/_/g, " ");
    if (song && song.pattern) return song.pattern;
    return normalizeSongDifficulty(song);
  }

  function buildSongLibraryItems(playlist, progression) {
    if (!Array.isArray(playlist)) return [];
    progression = normalizeSongProgressionUser(progression);
    progression._songTree = playlist.slice();
    var items = [];
    for (var i = 0; i < playlist.length; i++) {
      var song = clonePlayableSong(playlist[i]);
      var ui = buildPlayableSongUiModel(song, progression);
      items.push({
        id: song.id,
        title: song.title,
        difficulty: normalizeSongDifficulty(song),
        subtitle: getSongLibrarySubtitle(playlist[i]),
        stars: ui.stars,
        locked: ui.locked,
        completed: ui.completed,
        recommended: ui.recommended
      });
    }
    items.sort(function(a, b) {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      if (a.locked !== b.locked) return a.locked ? 1 : -1;
      return String(a.title).localeCompare(String(b.title));
    });
    return items;
  }

  function filterSongLibraryItems(items, browserState) {
    browserState = browserState || { query: "", filter: "all" };
    var query = String(browserState.query || "").toLowerCase();
    var filter = String(browserState.filter || "all").toLowerCase();
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (query && String(item.title || "").toLowerCase().indexOf(query) < 0) continue;
      if (filter === "easy" || filter === "medium" || filter === "hard") {
        if (item.difficulty !== filter) continue;
      }
      if (filter === "completed" && !item.completed) continue;
      if (filter === "incomplete" && item.completed) continue;
      out.push(item);
    }
    return out;
  }

  function renderSongLibraryFilterChip(id, label, active) {
    return '<button class="btn" onclick="act(\'songLibraryFilter\',\'' + escapeActionArg(id) + '\')" style="height:32px;padding:0 12px;border-radius:999px;border:1px solid ' + (active ? "rgba(0,255,136,.35)" : "rgba(255,255,255,.08)") + ';background:' + (active ? "rgba(0,255,136,.12)" : "rgba(255,255,255,.03)") + ';color:' + (active ? "#00FF88" : "#8E8E93") + ';font-size:11px;font-weight:800">' + escHTML(label) + '</button>';
  }

  function renderSongLibraryListItem(item) {
    var accent = item.recommended ? '<div style="width:4px;align-self:stretch;border-radius:999px;background:#00FF88"></div>' : '<div style="width:4px;align-self:stretch;border-radius:999px;background:transparent"></div>';
    var lock = item.locked ? '<div style="font-size:13px;color:#8E8E93;margin-left:8px">&#128274;</div>' : "";
    var buttonAttrs = item.locked ? "" : ' onclick="act(\'progressionMapSong\',\'' + escapeActionArg(item.id) + '\')"';
    return '<button class="btn"' + buttonAttrs + ' style="width:100%;min-height:80px;padding:0;border:none;background:#1C1C1E;border-radius:12px;display:flex;align-items:stretch;gap:12px;opacity:' + (item.locked ? ".45" : "1") + ';cursor:' + (item.locked ? "not-allowed" : "pointer") + '">' +
      accent +
      '<div style="flex:1;display:flex;align-items:center;justify-content:space-between;padding:16px 16px 16px 0;text-align:left">' +
      '<div><div style="font-size:16px;font-weight:600;color:#FFFFFF;line-height:1.2">' + escHTML(item.title) + '</div><div style="margin-top:4px;font-size:12px;color:#8E8E93">' + escHTML(item.subtitle) + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' + renderDisplayStarsHtml(item.stars) + (item.recommended ? '<div style="font-size:10px;font-weight:800;color:#00FF88">Recommended</div>' : "") + '</div>' +
      lock +
      '</div></div></button>';
  }

  function renderSongLibraryBrowser(playlist, progression) {
    if (!Array.isArray(playlist) || !playlist.length) return "";
    var browserState = getSongLibraryBrowserState();
    var items = buildSongLibraryItems(playlist, progression);
    var visible = filterSongLibraryItems(items, browserState);
    var chips = [
      { id: "all", label: "All" },
      { id: "easy", label: "Easy" },
      { id: "medium", label: "Medium" },
      { id: "hard", label: "Hard" },
      { id: "completed", label: "Completed" },
      { id: "incomplete", label: "Incomplete" }
    ];
    var h = '<div class="card mb16" style="text-align:left;background:#000000;border:1px solid rgba(255,255,255,.06);padding:20px;border-radius:24px">';
    h += '<div style="font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-.02em">Songs</div>';
    h += '<div style="margin-top:12px"><input type="text" value="' + escHTML(browserState.query) + '" placeholder="Search songs" oninput="act(\'songLibrarySearch\',this.value)" style="width:100%;height:44px;border:none;border-radius:14px;background:#1C1C1E;color:#FFFFFF;padding:0 14px;font-size:14px;outline:none"></div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">';
    for (var i = 0; i < chips.length; i++) h += renderSongLibraryFilterChip(chips[i].id, chips[i].label, browserState.filter === chips[i].id);
    h += '</div>';
    h += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">';
    if (!visible.length) {
      h += '<div style="padding:18px 16px;border-radius:12px;background:#1C1C1E;font-size:13px;color:#8E8E93">No songs match this filter.</div>';
    } else {
      for (var j = 0; j < visible.length; j++) h += renderSongLibraryListItem(visible[j]);
    }
    h += '</div></div>';
    return h;
  }

  function getPlayableSongTier(song, index) {
    if (song && typeof song.tier === "number" && song.tier > 0) return song.tier;
    if (song && typeof song.unlockLevel === "number" && song.unlockLevel > 0) return song.unlockLevel;
    return index + 1;
  }

  function buildProgressionMapLayout(playlist, progression) {
    if (!Array.isArray(playlist) || !playlist.length) return [];
    progression = normalizeSongProgressionUser(progression);
    progression._songTree = playlist.slice();
    var rows = [];
    var rowByTier = {};
    for (var i = 0; i < playlist.length; i++) {
      var song = playlist[i];
      var tier = getPlayableSongTier(song, i);
      if (!rowByTier[tier]) {
        rowByTier[tier] = [];
        rows.push({ tier: tier, nodes: rowByTier[tier] });
      }
      rowByTier[tier].push({
        id: song.id,
        title: song.title,
        tier: tier,
        state: buildPlayableSongUiModel(song, progression)
      });
    }
    rows.sort(function(a, b) { return a.tier - b.tier; });
    return rows;
  }

  function renderProgressionMapNode(node) {
    var locked = !!(node && node.state && node.state.locked);
    var recommended = !!(node && node.state && node.state.recommended);
    var stars = node && node.state ? (node.state.stars || 0) : 0;
    var fill = locked ? "rgba(28,28,30,.4)" : "#FFFFFF";
    var ring = recommended ? "#00FF88" : "transparent";
    var opacity = locked ? ".5" : "1";
    var cursor = locked ? "not-allowed" : "pointer";
    var onclick = locked ? "" : ' onclick="act(\'progressionMapSong\',\'' + escapeActionArg(node.id) + '\')"';
    return '<button class="btn"' + onclick + ' title="' + escHTML(node.title) + '" style="width:88px;min-height:104px;border-radius:20px;border:none;background:transparent;color:#FFFFFF;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;cursor:' + cursor + ';transition:transform 120ms ease,opacity 160ms ease,box-shadow 240ms ease;opacity:' + opacity + ';padding:0">' +
      '<div style="width:56px;height:56px;border-radius:999px;border:2px solid ' + ring + ';display:flex;align-items:center;justify-content:center;background:' + fill + ';box-shadow:' + (recommended ? "0 0 0 6px rgba(0,255,136,.12), 0 0 18px rgba(0,255,136,.18)" : stars ? "inset 0 -2px 6px rgba(0,0,0,.12)" : "none") + ';color:' + (locked ? "#8E8E93" : "#000000") + ';font-size:14px;font-weight:900">' + escHTML(String(node.tier)) + '</div>' +
      renderDisplayStarsHtml(stars) +
      '<div style="font-size:10px;font-weight:800;letter-spacing:.08em;color:' + (recommended ? "#00FF88" : locked ? "#8E8E93" : "transparent") + ';min-height:12px">' + (recommended ? "NEXT" : locked ? "LOCKED" : "&nbsp;") + '</div>' +
      '</button>';
  }

  function renderProgressionMap(playlist, progression) {
    var rows = buildProgressionMapLayout(playlist, progression);
    if (!rows.length) return "";
    var instrument = S && S.rhythmHighwayLaunchContext ? S.rhythmHighwayLaunchContext.instrument : null;
    var h = '<div class="card mb16" style="text-align:left;background:#000000;border:1px solid rgba(255,255,255,.06);padding:24px 20px;border-radius:24px">';
    h += '<div style="font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-.02em">Progress</div>';
    h += '<div style="font-size:14px;color:#8E8E93;margin-top:4px;margin-bottom:24px">' + escHTML(formatInstrumentPathLabel(instrument)) + '</div>';
    for (var i = 0; i < rows.length; i++) {
      h += '<div style="display:flex;justify-content:center;gap:24px 88px;flex-wrap:wrap;margin-bottom:' + (i < rows.length - 1 ? '72px' : '0') + '">';
      for (var j = 0; j < rows[i].nodes.length; j++) h += renderProgressionMapNode(rows[i].nodes[j]);
      h += '</div>';
      if (i < rows.length - 1) {
        h += '<div style="display:flex;justify-content:center;align-items:center;height:24px;color:#2C2C2E;font-size:12px;letter-spacing:.2em">|</div>';
      }
    }
    var recommended = selectNextSongFromProgression(playlist, progression);
    if (progression) h += renderProgressBar(progression.level, progression.xp);
    if (recommended) {
      h += '<button class="btn" onclick="act(\'progressionMapSong\',\'' + escapeActionArg(recommended.id) + '\')" style="width:100%;height:52px;border-radius:14px;border:none;background:#FFFFFF;color:#000000;margin-top:16px;font-weight:900;display:flex;align-items:center;justify-content:space-between;padding:0 18px;box-shadow:0 10px 24px rgba(255,255,255,.06)"><span>Continue</span><span style="font-size:12px;color:#3A3A3C">' + escHTML(recommended.title) + '</span></button>';
    }
    h += '</div>';
    return h;
  }

  function resolvePlayableSongPayload(song, playlist) {
    if (!song) return null;
    if (song.payload) return song.payload;
    if (song.gameplayPayload) return song.gameplayPayload;
    if (song.songChart || song.chart) {
      return {
        chartId: song.chartId || song.id,
        adapterType: song.adapterType || (S && S.rhythmHighwayLaunchContext ? S.rhythmHighwayLaunchContext.instrument : "guitar"),
        chart: song.chart || null,
        songChart: song.songChart || null
      };
    }
    if (Array.isArray(playlist)) {
      for (var i = 0; i < playlist.length; i++) {
        if (playlist[i] && playlist[i].id === song.id) {
          if (playlist[i].payload) return playlist[i].payload;
          if (playlist[i].gameplayPayload) return playlist[i].gameplayPayload;
          if (playlist[i].songChart || playlist[i].chart) {
            return {
              chartId: playlist[i].chartId || playlist[i].id,
              adapterType: playlist[i].adapterType || (S && S.rhythmHighwayLaunchContext ? S.rhythmHighwayLaunchContext.instrument : "guitar"),
              chart: playlist[i].chart || null,
              songChart: playlist[i].songChart || null
            };
          }
        }
      }
    }
    if (S && S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.song && S.rhythmHighwayLaunchContext.song.id === song.id) {
      return runtime.sourcePayload || runtime.activePayload || null;
    }
    return null;
  }

  function openProgressionMapSong(songId) {
    if (!songId || !S || !S.rhythmHighwayLaunchContext || !Array.isArray(S.rhythmHighwayLaunchContext.playlist)) return false;
    var playlist = S.rhythmHighwayLaunchContext.playlist.slice();
    var song = null;
    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i] && playlist[i].id === songId) {
        song = playlist[i];
        break;
      }
    }
    if (!song || !isPlayableSongUnlocked(song)) return false;
    var payload = resolvePlayableSongPayload(song, playlist);
    if (!payload) return false;
    return startPlayableSongSession(song, payload, {
      instrument: song.adapterType || S.rhythmHighwayLaunchContext.instrument || "guitar",
      playlist: playlist,
      source: "progression_map"
    });
  }

  function renderAdaptiveSongProgressionTree(playlist, progression) {
    return renderProgressionMap(playlist, progression) + renderSongLibraryBrowser(playlist, progression);
  }

  function startPlayableSongSession(song, payload, options) {
    song = clonePlayableSong(song);
    options = options || {};
    if (!song || !payload) return false;
    if (!isPlayableSongUnlocked(song, options.user)) return false;
    var runtimeOptions = mergePlayableRuntimeOptions({}, options.runtimeOptions || {});
    var audioSpec = resolvePlayableBackingAudioSpec(song, payload, runtimeOptions);
    if (audioSpec) {
      if (typeof runtimeOptions.audioOffsetMs !== "number") runtimeOptions.audioOffsetMs = audioSpec.offsetMs || 0;
      if (!runtimeOptions.audioSource) runtimeOptions.audioSource = createPlayableBackingAudioSource(audioSpec);
    }
    return startPlayableRhythmHighwayPayload(payload, {
      source: options.source || "song_system",
      instrument: options.instrument || payload.adapterType || "guitar",
      label: song.title,
      song: song,
      playlist: Array.isArray(options.playlist) ? options.playlist.slice() : null,
      options: runtimeOptions
    });
  }

  function getNoteY(noteTime, currentTime, speed) {
    return (noteTime - currentTime) * speed;
  }

  function getLaneX(lane) {
    var laneWidth = 80;
    return lane * laneWidth + 100;
  }

  function findMatchingLaneNote(notes, judgedNotes, lane, now, hitWindowMs) {
    var i;
    for (i = 0; i < notes.length; i++) {
      if (judgedNotes[notes[i].id]) continue;
      if (notes[i].lane !== lane) continue;
      if (Math.abs(notes[i].time - now) < hitWindowMs) return notes[i];
    }
    return null;
  }

  function getHitCount(state) {
    var hits = 0;
    var i;
    for (i = 0; i < state.score.length; i++) {
      if (state.score[i] !== "miss") hits++;
    }
    return hits;
  }

  function getLastNoteTime(notes) {
    var end = 0;
    var i;
    for (i = 0; i < notes.length; i++) {
      if (notes[i].time > end) end = notes[i].time;
    }
    return end;
  }

  function togglePlayableRhythmHighwaySlowMode() {
    if (runtime.mode !== "playable" || !runtime.playable) return false;
    var assist = runtime.playable.getAssistState();
    runtime.playable.setSlowMode(!assist.slowMode);
    S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
    S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
    render();
    return true;
  }

  function togglePlayableRhythmHighwayLoopWindow() {
    if (runtime.mode !== "playable" || !runtime.playable) return false;
    var snapshot = runtime.playable.getSnapshot();
    var start = Math.max(0, Math.round(snapshot.songTimeSec * 1000));
    var end = start + 2000;
    runtime.playable.setLoop(start, end);
    S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
    S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
    render();
    return true;
  }

  function clearPlayableRhythmHighwayLoop() {
    if (runtime.mode !== "playable" || !runtime.playable) return false;
    runtime.playable.clearLoop();
    S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
    S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
    render();
    return true;
  }

  function adjustPlayableRhythmHighwayAudioOffset(deltaMs) {
    if (runtime.mode !== "playable" || !runtime.playable) return false;
    var assist = runtime.playable.getAssistState();
    if (!assist.useAudioClock) return false;
    runtime.playable.setAudioOffset((assist.audioOffsetMs || 0) + (deltaMs || 0));
    S.rhythmHighwayPracticeAssist = runtime.playable.getAssistState();
    S.rhythmHighwaySnapshot = runtime.playable.getSnapshot();
    render();
    return true;
  }

  function updatePlayableRhythmHighwayRetention(results) {
    if (typeof S === "undefined") return null;
    var today = new Date().toISOString().slice(0, 10);
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (S.lastSessionDate === today) return { streak: S.streak || 0, lastSessionDate: S.lastSessionDate };
    if (S.lastSessionDate === yesterday) S.streak = (S.streak || 0) + 1;
    else S.streak = 1;
    S.lastSessionDate = today;
    if (!S.xpToast && results && results.xpEarned > 0) {
      S.xpToast = { amount: results.xpEarned, time: Date.now() };
    }
    return { streak: S.streak, lastSessionDate: S.lastSessionDate };
  }

  window.startRhythmHighwaySegment = startRhythmHighwaySegment;
  window.startRhythmHighwayPayload = startRhythmHighwayPayload;
  window.startPlayableRhythmHighwayPayload = startPlayableRhythmHighwayPayload;
  window.stopSparkRhythmHighway = stopSparkRhythmHighway;
  window._sparkRhythmHighwayStrum = sparkRhythmHighwayStrum;
  window._buildRhythmHighwayLoopPayload = buildRhythmHighwayLoopPayload;
  window._createRhythmHighwayLoopSpec = createRhythmHighwayLoopSpec;
  window._finalizeRhythmHighwayForTest = finalizeRhythmHighway;
  window._finalizePlayableRhythmHighwayForTest = finalizePlayableRhythmHighway;
  window._getRhythmHighwayLaneLabels = getRhythmHighwayLaneLabels;
  window._getRhythmHighwayLaneChart = getRhythmHighwayLaneChart;
  window._mapRhythmHighwayKeyToLane = mapKeyToLane;
  window._createPlayableRhythmRuntime = createPlayableRhythmRuntime;
  window._getPlayableNoteY = getNoteY;
  window._getPlayableLaneX = getLaneX;
  window._togglePlayableRhythmHighwaySlowMode = togglePlayableRhythmHighwaySlowMode;
  window._togglePlayableRhythmHighwayLoopWindow = togglePlayableRhythmHighwayLoopWindow;
  window._clearPlayableRhythmHighwayLoop = clearPlayableRhythmHighwayLoop;
  window._adjustPlayableRhythmHighwayAudioOffset = adjustPlayableRhythmHighwayAudioOffset;
  window._buildRhythmHighwayCoach = buildRhythmHighwayCoach;
  window._updatePlayableRhythmHighwayRetention = updatePlayableRhythmHighwayRetention;
  window._isPlayableSongUnlocked = isPlayableSongUnlocked;
  window._canUnlockPlayableSong = canUnlockPlayableSong;
  window._recordPlayableSongRun = recordPlayableSongRun;
  window._selectPlayableSongForFlow = selectPlayableSongForFlow;
  window._completePlayableSongFlow = completePlayableSongFlow;
  window._continuePlayableSongFlow = continuePlayableSongFlow;
  window._startRecommendedPlayableSongFlow = startRecommendedPlayableSongFlow;
  window._getPlayableSongStats = getPlayableSongStats;
  window._getSongProgressionState = getSongProgressionState;
  window._buildPlayableSongUiModel = buildPlayableSongUiModel;
  window._buildProgressionMapLayout = buildProgressionMapLayout;
  window._buildSongLibraryItems = buildSongLibraryItems;
  window._filterSongLibraryItems = filterSongLibraryItems;
  window._renderProgressionMap = renderProgressionMap;
  window._renderSongLibraryBrowser = renderSongLibraryBrowser;
  window._openProgressionMapSong = openProgressionMapSong;
  window._selectNextSongFromProgression = selectNextSongFromProgression;
  window.startPlayableSongSession = startPlayableSongSession;
  window.adjustPracticeTempo = function(delta) {
    if (runtime.activePayload) {
      runtime.activePayload.tempo = Math.max(40, Math.min(200, (runtime.activePayload.tempo || 80) + delta));
    }
  };
  window.rhythmHighwayPage = rhythmHighwayPage;
})();
