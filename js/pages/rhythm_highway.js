(function() {
  var runtime = {
    engine: null,
    clock: null,
    raf: null,
    segmentId: null,
    sourcePayload: null,
    activePayload: null
  };

  var ASSIST_PRESETS = [
    { id: "spark_learning", label: "Guided", hint: "Wider timing and fret forgiveness" },
    { id: "spark_balanced", label: "Balanced", hint: "Closer to standard timing" },
    { id: "spark_challenge", label: "Challenge", hint: "Tighter timing and stricter fret checks" }
  ];

  function normalizeRhythmInstrumentType(instrument) {
    var candidate = instrument || null;
    if (!candidate && window.SparkInstruments && typeof SparkInstruments.getActive === "function") {
      var active = SparkInstruments.getActive();
      candidate = active ? (active.instrument || active.instrumentType || active.id || active.appId || null) : null;
    }
    if (!candidate) candidate = "guitar";
    if (!window.SparkInstruments || typeof SparkInstruments.getAll !== "function") return candidate;
    var instruments = SparkInstruments.getAll() || [];
    for (var i = 0; i < instruments.length; i++) {
      var entry = instruments[i] || {};
      if (entry.id === candidate || entry.appId === candidate) {
        return entry.instrument || entry.instrumentType || candidate;
      }
    }
    return candidate;
  }

  function normalizeRhythmHighwayTextToken(value) {
    var text;
    var lower;
    if (typeof value !== "string") return "";
    text = value.trim();
    if (!text) return "";
    lower = text.toLowerCase();
    if (lower === "undefined" || lower === "null" || lower === "nan") return "";
    return text;
  }

  function firstRhythmHighwayTextToken() {
    var i;
    var token;
    for (i = 0; i < arguments.length; i++) {
      token = normalizeRhythmHighwayTextToken(arguments[i]);
      if (token) return token;
    }
    return "";
  }

  function formatRhythmWeakAreas(weakAreas) {
    var out = [];
    var i;
    var token;
    weakAreas = Array.isArray(weakAreas) ? weakAreas : [];
    for (i = 0; i < weakAreas.length; i++) {
      token = firstRhythmHighwayTextToken(String(weakAreas[i] || "").replace(/_/g, " "));
      if (token) out.push(token);
    }
    return out.length ? out.join(", ") : "None";
  }

  function createRhythmHighwayAdapter(instrumentType) {
    var type = normalizeRhythmInstrumentType(instrumentType);
    var moduleMap = {
      bass: window.SparkBassModule,
      ukulele: window.SparkUkuleleModule,
      guitar: window.SparkGuitarModule,
      piano: window.SparkPianoModule
    };
    var instrumentModule = moduleMap[type] || null;
    if (instrumentModule && typeof instrumentModule.getRhythmAdapter === "function") {
      return instrumentModule.getRhythmAdapter();
    }
    if (type === "bass" && typeof SparkBassRhythmAdapter === "function") return new SparkBassRhythmAdapter();
    if (type === "ukulele" && typeof SparkUkuleleRhythmAdapter === "function") return new SparkUkuleleRhythmAdapter();
    if (typeof SparkGuitarRhythmAdapter === "function") return new SparkGuitarRhythmAdapter();
    return {
      getLaneCount: function() { return type === "bass" || type === "ukulele" ? 4 : 5; }
    };
  }

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
    var instrumentType = normalizeRhythmInstrumentType(
      launchContext.instrument || activePayload.adapterType || payload.adapterType || null
    );
    runtime.clock = new SparkTimingEngine(new SparkCalibrationEngine()).createClock(instrumentType);
    runtime.engine = new SparkRhythmGameplayEngine({
      chart: activePayload.songChart,
      adapter: createRhythmHighwayAdapter(instrumentType),
      preset: SparkEnginePresetRegistry.get(resolvedPresetName)
    });

    S.activeCoreSegmentId = launchContext.segmentId || null;
    S.rhythmHighwayPreset = resolvedPresetName;
    S.rhythmHighwayLoop = resolvedLoopSpec && activePayload !== payload ? resolvedLoopSpec : null;
    S.rhythmHighwayLaunchContext = {
      source: launchContext.source || "ad_hoc",
      label: firstRhythmHighwayTextToken(launchContext.label, payload.chartId, payload.songChart.song && payload.songChart.song.title) || null,
      instrument: instrumentType,
      exerciseId: launchContext.exerciseId || null,
      exerciseFocus: launchContext.exerciseFocus || null
    };
    S.rhythmHighwayHeldMask = 0;
    S.rhythmHighwaySnapshot = runtime.engine.getSnapshot(0);
    S.rhythmHighwayResult = null;
    S.rhythmHighwayFeedback = "";
    S.screen = SCR.RHYTHM_HIGHWAY;

    tickRhythmHighway();
    render();
    return true;
  }

  function stopSparkRhythmHighway() {
    if (runtime.raf) cancelAnimationFrame(runtime.raf);
    runtime.raf = null;
    if (runtime.clock && typeof runtime.clock.close === "function") runtime.clock.close();
    runtime.clock = null;
    runtime.engine = null;
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

  function sparkRhythmHighwayStrum() {
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

  function rhythmHighwayPage() {
    if (S.rhythmHighwayResult) return rhythmHighwayResultsPage();
    var snapshot = S.rhythmHighwaySnapshot;
    if (!snapshot) return '<div class="text-center"><p>No rhythm session active.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

    var labels = getRhythmHighwayLaneLabels();
    var laneCount = labels.length;
    var activePreset = getCurrentAssistPreset();
    var gameplay = snapshot.gameplay || {};
    var accuracy = Math.round((gameplay.accuracy || 0) * 100);
    var energy = Math.round(gameplay.energy || 0);
    var combo = gameplay.combo || 0;
    var multiplier = gameplay.multiplier || 1;
    var score = String(gameplay.score || 0).padStart(6, "0");
    // Clamp progress to [0, 100] — songTimeSec can go negative during the
    // calibration lead-in (click track before bar 1) and can exceed
    // durationSec during the song tail, either of which would over- or
    // under-fill the progress bar if fed directly to CSS width.
    var progress = snapshot.durationSec > 0
      ? Math.min(100, Math.max(0, (snapshot.songTimeSec / snapshot.durationSec) * 100))
      : 0;

    var h = '<div class="rhythm-highway-v3">';

    // Header
    h += '<header class="v3-header">';
    h += '<div class="v3-score-container">';
    h += '<span class="v3-score-value">' + score + '</span>';
    h += '</div>';
    h += '<div style="display:flex;align-items:center;gap:12px">';
    if (combo > 0) h += '<div class="v3-streak-badge">STREAK ' + combo + '</div>';
    h += '<div class="v3-multiplier">' + multiplier + 'x</div>';
    h += '</div>';
    h += '</header>';

    // Feedback
    if (S.rhythmHighwayFeedback) {
      var isPerfect = S.rhythmHighwayFeedback.toUpperCase() === "PERFECT";
      h += '<div class="v3-feedback-container">';
      h += '<h2 class="feedback-perfect" style="color:' + (isPerfect ? "var(--perform-yellow)" : "var(--perform-cyan)") + '">' + escHTML(S.rhythmHighwayFeedback.toUpperCase()) + '</h2>';
      if (isPerfect && combo > 10) h += '<p class="feedback-combo-breaker">COMBO KEEPER</p>';
      h += '</div>';
    }

    // 3D Highway
    h += '<main class="highway-perspective">';
    h += '<div class="grid-bg"></div>';
    h += '<div class="scanline"></div>';

    h += '<div class="highway-lane-container">';
    // Dividers
    for (var d = 1; d < laneCount; d++) {
      h += '<div class="highway-lane-divider" style="left:' + (d * (100/laneCount)) + '%"></div>';
    }

    // Notes
    for (var i = 0; i < snapshot.notes.length; i++) {
      var note = snapshot.notes[i];
      if (note.hit) continue;
      // Projection: 0-100% of the lane height based on time remaining (up to 2 seconds ahead)
      var timeUntil = note.timeSec - snapshot.songTimeSec;
      if (timeUntil < -0.2 || timeUntil > 2.0) continue;

      // Notes move from horizon (0%) to receptors (100%)
      var topPercent = (1.0 - (timeUntil / 2.0)) * 100;
      var laneWidth = 100 / laneCount;

      for (var l = 0; l < laneCount; l++) {
        if (maskHasLane(note.laneMask, l)) {
          h += '<div style="position:absolute;top:' + topPercent + '%;left:' + (l * laneWidth) + '%;width:' + laneWidth + '%">';
          h += '<div class="gem-3d ' + gemClass(l) + '"></div>';
          h += '</div>';
        }
      }
    }

    // Receptors
    h += '<div class="v3-receptors">';
    for (var r = 0; r < laneCount; r++) {
      var isHeld = maskHasLane(S.rhythmHighwayHeldMask, r);
      h += '<div class="receptor ' + (isHeld ? activeReceptorClass(r) : "") + '">';
      h += '<div class="receptor-inner"></div>';
      h += '</div>';
    }
    h += '</div>';

    // Hit Bar
    h += '<div class="hit-glow-bar"></div>';
    h += '</div>'; // end lane container
    h += '</main>';

    // Energy & Rank (Floating)
    h += '<div class="v3-energy-panel">';
    h += '<span class="material-symbols-outlined" style="color:var(--perform-coral);font-variation-settings:\'FILL\' 1">electric_bolt</span>';
    h += '<div class="energy-bar-bg"><div class="energy-bar-fill" style="width:' + energy + '%"></div></div>';
    h += '</div>';

    h += '<div class="v3-rank-panel">';
    h += '<span class="rank-label">RANK</span>';
    h += '<span class="rank-value">' + calculateRank(accuracy) + '</span>';
    h += '</div>';

    // Footer
    h += '<footer class="v3-footer">';
    h += '<div class="v3-progress-container"><div class="v3-progress-fill" style="width:' + progress + '%"></div></div>';

    var drillLabel = firstRhythmHighwayTextToken(S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.label, "current drill");
    h += '<span class="song-title">Focused Drill: ' + escHTML(drillLabel) + '</span>';

    if (S.rhythmHighwayLoop) {
      h += '<div style="font-size:11px;color:var(--perform-cyan);font-weight:800">Looping ' + escHTML(firstRhythmHighwayTextToken(S.rhythmHighwayLoop.label, "current window")) + '</div>';
    }

    h += '<div class="difficulty-tag">';
    h += '<span class="status-dot"></span>';
    h += '<span class="difficulty-label">' + escHTML(activePreset.label) + ' Mode</span>';
    h += '</div>';
    h += '</footer>';

    // Interaction Overlays (Hidden but functional)
    h += '<div style="position:fixed;inset:0;z-index:40;pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;padding:24px">';
    h += '<div style="display:grid;grid-template-columns:repeat(' + laneCount + ',1fr);gap:12px;pointer-events:auto">';
    for (var bi = 0; bi < laneCount; bi++) {
      h += '<button onclick="act(\'rhythmHighwayLane\',' + bi + ')" style="height:64px;border:2px solid rgba(255,255,255,0.1);border-radius:16px;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.4);font-weight:900">' + escHTML(labels[bi]) + '</button>';
    }
    h += '</div>';
    h += '<div style="display:flex;gap:12px;margin-top:12px;pointer-events:auto">';
    h += '<button class="btn" onclick="act(\'rhythmHighwayStrum\')" style="flex:2;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-weight:900;height:56px">STRUM</button>';
    h += '<button class="btn" onclick="act(\'back\')" style="flex:1;background:rgba(255,255,255,0.1);color:#fff;font-weight:700">EXIT</button>';
    h += '</div>';
    h += '</div>';

    h += '</div>'; // end v3 container
    return h;
  }

  function gemClass(lane) {
    var classes = ["gem-cyan", "gem-yellow", "gem-peach", "gem-cyan", "gem-yellow"];
    return classes[lane % 5];
  }

  function activeReceptorClass(lane) {
    var classes = ["active-cyan", "active-yellow", "active-peach", "active-cyan", "active-yellow"];
    return classes[lane % 5];
  }

  function calculateRank(acc) {
    if (acc >= 98) return "S+";
    if (acc >= 95) return "S";
    if (acc >= 90) return "A";
    if (acc >= 80) return "B";
    if (acc >= 70) return "C";
    return "D";
  }

  function rhythmHighwayResultsPage() {
    var result = S.rhythmHighwayResult;
    var gameplay = result.gameplay || {};
    var learning = result.learning || {};
    var activePreset = getCurrentAssistPreset();
    var moduleGuidance = getRhythmHighwayModuleGuidance(result);
    var h = '<div class="text-center" style="padding-top:16px"><div style="font-size:56px;animation:bn .6s ease">&#127928;</div>';
    h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Rhythm Highway Complete</h2>';
    if (activePreset) {
      h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Assist Mode: <span style="color:var(--text-primary);font-weight:800">' + escHTML(activePreset.label) + "</span></div>";
    }
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.exerciseFocus) {
      h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Focus: ' + escHTML(firstRhythmHighwayTextToken(String(S.rhythmHighwayLaunchContext.exerciseFocus || "").replace(/_/g, " "), "rhythm")) + '</div>';
    }
    if (moduleGuidance) {
      h += '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(20,184,166,.12),rgba(20,184,166,.04));border:1px solid rgba(20,184,166,.28)">';
      h += '<div style="font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:6px">' + escHTML(moduleGuidance.title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">' + escHTML(moduleGuidance.summary) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">Next: ' + escHTML(moduleGuidance.nextStep) + '</div>';
      h += '</div>';
    }
    h += '<div class="card mb16"><div style="display:flex;justify-content:space-around;text-align:center">';
    h += '<div><div style="font-size:28px;font-weight:900;color:#FFE66D">' + gameplay.score + '</div><div style="font-size:11px;color:var(--text-muted)">Score</div></div>';
    h += '<div><div style="font-size:28px;font-weight:900;color:#4ECDC4">' + Math.round((gameplay.accuracy || 0) * 100) + '%</div><div style="font-size:11px;color:var(--text-muted)">Accuracy</div></div>';
    h += '<div><div style="font-size:28px;font-weight:900;color:#FF6B6B">' + (gameplay.maxCombo || 0) + 'x</div><div style="font-size:11px;color:var(--text-muted)">Max Combo</div></div>';
    h += '</div></div>';
    h += '<div class="card mb16" style="text-align:left"><div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Learning</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">Skills:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(formatSkills(learning.skills || [])) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin:8px 0 6px">Weak Areas:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(formatRhythmWeakAreas(learning.weakAreas || [])) + '</div></div>';
    h += '<div style="display:flex;gap:10px;justify-content:center">';
    h += '<button class="btn" onclick="act(\'restartRhythmHighway\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Play Again</button>';
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
    for (var i = 0; i < skills.length; i++) {
      var skill = skills[i] || {};
      var skillId = firstRhythmHighwayTextToken(String(skill.id || "").replace(/_/g, " "));
      if (!skillId) continue;
      out.push(skillId + " +" + skill.delta);
    }
    return out.length ? out.join(", ") : "No skill deltas recorded yet.";
  }

  function maskHasLane(mask, laneIndex) {
    return (mask & (1 << laneIndex)) !== 0;
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
    var payload = runtime.activePayload || runtime.sourcePayload || null;
    if (payload && Array.isArray(payload.laneLabels) && payload.laneLabels.length) {
      return payload.laneLabels.slice();
    }
    var laneCount = payload && payload.laneCount ? payload.laneCount : 5;
    var instrumentType = normalizeRhythmInstrumentType(
      (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.instrument) || (payload && payload.adapterType) || null
    );
    if (laneCount === 4 && instrumentType === "bass") return ["E", "A", "D", "G"];
    if (laneCount === 4) return ["G", "C", "E", "A"];
    return ["G", "R", "Y", "B", "O"];
  }

  function buildRhythmHighwayLoopPayload(payload, loopSpec) {
    if (!payload || !payload.songChart || !loopSpec) return payload;
    var chart = payload.songChart;
    var track = chart.tracks && chart.tracks.guitar ? chart.tracks.guitar : null;
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
      adapterType: normalizeRhythmInstrumentType(payload.adapterType),
      enginePreset: payload.enginePreset || "spark_learning",
      laneCount: payload.laneCount || 5,
      laneLabels: Array.isArray(payload.laneLabels) ? payload.laneLabels.slice() : null,
      songChart: new SparkSongChart({
        song: JSON.parse(JSON.stringify(chart.song || {})),
        tempoMap: shiftedTempoMap,
        metadata: metadata,
        tracks: {
          guitar: {
            notes: filteredNotes,
            phrases: filteredPhrases
          }
        }
      })
    };
  }

  function createRhythmHighwayLoopSpec(payload, snapshot) {
    if (!payload || !payload.songChart || !snapshot) return null;
    var track = payload.songChart.tracks && payload.songChart.tracks.guitar ? payload.songChart.tracks.guitar : null;
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
      label: firstRhythmHighwayTextToken(startNote.label, "practice window") + " loop"
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
    return ["#4ECDC4", "#FFE66D", "#FF8A5C", "#4ECDC4", "#FFE66D"][index] || "#999";
  }

  window.startRhythmHighwaySegment = startRhythmHighwaySegment;
  window.startRhythmHighwayPayload = startRhythmHighwayPayload;
  window.stopSparkRhythmHighway = stopSparkRhythmHighway;
  window._sparkRhythmHighwayStrum = sparkRhythmHighwayStrum;
  window._buildRhythmHighwayLoopPayload = buildRhythmHighwayLoopPayload;
  window._createRhythmHighwayLoopSpec = createRhythmHighwayLoopSpec;
  window._getRhythmHighwayLaneLabels = getRhythmHighwayLaneLabels;
  window.rhythmHighwayPage = rhythmHighwayPage;
})();
