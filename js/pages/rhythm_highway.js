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
      drums: window.SparkDrumsModule,
      ukulele: window.SparkUkuleleModule,
      guitar: window.SparkGuitarModule,
      piano: window.SparkPianoModule
    };
    var instrumentModule = moduleMap[type] || null;
    if (instrumentModule && typeof instrumentModule.getRhythmAdapter === "function") {
      return instrumentModule.getRhythmAdapter();
    }
    if (type === "bass" && typeof SparkBassRhythmAdapter === "function") return new SparkBassRhythmAdapter();
    if (type === "drums" && typeof SparkDrumsRhythmAdapter === "function") return new SparkDrumsRhythmAdapter();
    if (type === "ukulele" && typeof SparkUkuleleRhythmAdapter === "function") return new SparkUkuleleRhythmAdapter();
    if (typeof SparkGuitarRhythmAdapter === "function") return new SparkGuitarRhythmAdapter();
    return {
      getLaneCount: function() { return type === "bass" || type === "ukulele" ? 4 : 5; }
    };
  }

  function getRhythmHighwayCore() {
    return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  function getRhythmHighwayAccessibilitySettings() {
    var core = getRhythmHighwayCore();
    var settings = core && typeof core.getAccessibilitySettings === "function"
      ? core.getAccessibilitySettings()
      : (S.settings && S.settings.accessibility ? S.settings.accessibility : null);
    if (typeof SparkNormalizeAccessibilitySettings === "function") {
      return SparkNormalizeAccessibilitySettings(settings || {});
    }
    settings = settings && typeof settings === "object" ? settings : {};
    return {
      reducedMotion: !!settings.reducedMotion,
      highContrast: !!settings.highContrast,
      noteSize: settings.noteSize || "normal",
      laneLabels: settings.laneLabels !== false,
      colorblindSafeLanes: !!settings.colorblindSafeLanes,
      metronomeVisualOnly: !!settings.metronomeVisualOnly,
      disableFailureAnimations: !!settings.disableFailureAnimations,
      keyboardRemapping: settings.keyboardRemapping || {},
      leftHandedLayout: !!settings.leftHandedLayout,
      slowerDefaultSpeed: !!settings.slowerDefaultSpeed,
      audioCueVolume: typeof settings.audioCueVolume === "number" ? settings.audioCueVolume : 0.8,
      metronomeVolume: typeof settings.metronomeVolume === "number" ? settings.metronomeVolume : 0.6
    };
  }

  function startRhythmHighwaySegment(segmentId, presetName, loopSpec) {
    var core = getRhythmHighwayCore();
    if (!core || typeof core.getSegmentById !== "function") return false;
    var segment = core.getSegmentById(segmentId);
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
    var core = getRhythmHighwayCore();
    S.rhythmHighwayResult = result;
    S.rhythmHighwayFeedback = buildFeedback(result);
    if (runtime.segmentId && core && typeof core.completeSession === "function") {
      core.completeSession({
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

    var accessibility = getRhythmHighwayAccessibilitySettings();
    var labels = getRhythmHighwayLaneLabels(accessibility);
    var laneCount = labels.length;
    var activePreset = getCurrentAssistPreset();
    var noteHeight = accessibility.noteSize === "large" ? 24 : (accessibility.noteSize === "compact" ? 14 : 18);
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
    h += '<div><div style="font-size:24px;font-weight:900;color:#FF6B6B">' + snapshot.gameplay.maxCombo + 'x</div><div style="font-size:10px;color:var(--text-muted)">Max Combo</div></div>';
    h += '<div><div style="font-size:24px;font-weight:900;color:#4ECDC4">' + Math.round((snapshot.gameplay.accuracy || 0) * 100) + '%</div><div style="font-size:10px;color:var(--text-muted)">Accuracy</div></div>';
    h += '</div>';
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.label) {
      h += '<div style="margin-bottom:12px;font-size:11px;color:var(--text-muted);font-weight:700">Focused Drill: ' + escHTML(firstRhythmHighwayTextToken(S.rhythmHighwayLaunchContext.label, "current drill")) + '</div>';
    }

    h += '<div style="display:grid;grid-template-columns:repeat(' + laneCount + ',56px);gap:8px;justify-content:center;align-items:end;height:320px;margin:0 auto 16px;position:relative">';
    for (var lane = 0; lane < laneCount; lane++) {
      h += '<div style="position:relative;height:320px;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border)">';
      h += '<div style="position:absolute;left:6px;right:6px;bottom:72px;height:4px;background:#FFE66D;border-radius:999px"></div>';
      if (accessibility.laneLabels) {
        h += '<div style="position:absolute;left:0;right:0;bottom:12px;font-size:12px;font-weight:900;color:' + laneColor(lane, accessibility) + '">' + labels[lane] + '</div>';
      }
      for (var i = 0; i < snapshot.notes.length; i++) {
        var note = snapshot.notes[i];
        if (!maskHasLane(note.laneMask, lane)) continue;
        var bottom = Math.max(86, Math.min(286, 86 + ((3 - (note.timeSec - snapshot.songTimeSec)) * 66)));
        h += '<div style="position:absolute;left:8px;right:8px;bottom:' + bottom + 'px;height:' + noteHeight + 'px;border-radius:8px;background:' + laneColor(lane, accessibility) + ';opacity:' + (note.hit ? 0.35 : 0.95) + ';box-shadow:' + (accessibility.reducedMotion ? "none" : "0 8px 18px rgba(0,0,0,.24)") + '" title="' + escHTML(firstRhythmHighwayTextToken(note.label)) + '"></div>';
      }
      h += '</div>';
    }
    h += '</div>';

    h += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
    for (var fi = 0; fi < laneCount; fi++) {
      var active = maskHasLane(S.rhythmHighwayHeldMask, fi);
      h += '<button class="btn" onclick="act(\'rhythmHighwayLane\',' + fi + ')" style="min-width:54px;background:' + (active ? laneColor(fi, accessibility) : "var(--input-bg)") + ';color:' + (active ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + (accessibility.laneLabels ? labels[fi] : (fi + 1)) + '</button>';
    }
    h += '</div>';
    h += '<div style="display:flex;justify-content:center;gap:10px">';
    h += '<button class="btn" onclick="act(\'rhythmHighwayStrum\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-size:18px;padding:14px 28px">Strum</button>';
    h += '<button class="btn" onclick="act(\'' + (S.rhythmHighwayLoop ? "rhythmHighwayClearLoop" : "rhythmHighwayLoopWindow") + '\')" style="background:' + (S.rhythmHighwayLoop ? "#4ECDC4" : "var(--input-bg)") + ';color:' + (S.rhythmHighwayLoop ? "#fff" : "var(--text-secondary)") + '">' + (S.rhythmHighwayLoop ? "Clear Loop" : "Loop Window") + '</button>';
    h += '<button class="btn" onclick="act(\'back\')" style="background:var(--input-bg);color:var(--text-secondary)">Exit</button>';
    h += '</div>';
    if (S.rhythmHighwayLoop) {
      h += '<div style="margin-top:10px;font-size:11px;color:#4ECDC4;font-weight:800">Looping ' + escHTML(firstRhythmHighwayTextToken(S.rhythmHighwayLoop.label, "current window")) + '</div>';
    }
    if (S.rhythmHighwayFeedback) {
      h += '<div style="margin-top:12px;font-size:12px;color:var(--text-muted)">' + escHTML(S.rhythmHighwayFeedback) + '</div>';
    }
    h += '</div>';
    return h;
  }

  function rhythmHighwayResultsPage() {
    var result = S.rhythmHighwayResult;
    var accessibility = getRhythmHighwayAccessibilitySettings();
    var gameplay = result.gameplay || {};
    var learning = result.learning || {};
    var activePreset = getCurrentAssistPreset();
    var moduleGuidance = getRhythmHighwayModuleGuidance(result);
    var h = '<div class="text-center" style="padding-top:16px"><div style="font-size:56px;' + (accessibility.reducedMotion ? "" : "animation:bn .6s ease") + '">&#127928;</div>';
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

  function getRhythmHighwayLaneLabels(accessibility) {
    accessibility = accessibility || getRhythmHighwayAccessibilitySettings();
    var payload = runtime.activePayload || runtime.sourcePayload || null;
    var labels;
    if (payload && Array.isArray(payload.laneLabels) && payload.laneLabels.length) {
      labels = payload.laneLabels.slice();
      return accessibility.leftHandedLayout ? labels.reverse() : labels;
    }
    var laneCount = payload && payload.laneCount ? payload.laneCount : 5;
    var instrumentType = normalizeRhythmInstrumentType(
      (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.instrument) || (payload && payload.adapterType) || null
    );
    if (laneCount === 4 && instrumentType === "bass") labels = ["E", "A", "D", "G"];
    else if (laneCount === 4) labels = ["G", "C", "E", "A"];
    else labels = ["G", "R", "Y", "B", "O"];
    return accessibility.leftHandedLayout ? labels.reverse() : labels;
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

  function laneColor(index, accessibility) {
    accessibility = accessibility || getRhythmHighwayAccessibilitySettings();
    var palette = accessibility.colorblindSafeLanes
      ? ["#117733", "#882255", "#DDCC77", "#332288", "#CC6677"]
      : ["#4ade80", "#ef4444", "#facc15", "#3b82f6", "#f97316"];
    return palette[index] || "#999";
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
