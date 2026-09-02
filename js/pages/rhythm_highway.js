(function() {
  var runtime = {
    engine: null,
    segmentId: null,
    sourcePayload: null,
    activePayload: null
  };

  var pageAdapter = typeof SparkRhythmHighwayPageAdapter !== "undefined"
    ? new SparkRhythmHighwayPageAdapter()
    : null;

  var currentSongTimeSec = 0;

  // ===== Shared PixiJS renderer (highway convergence, phase C) =====
  // The rhythm highway renders through the same SparkHighway renderer as
  // performance mode. The DOM-div renderer below stays as the classic
  // fallback, used when: the renderer bundle is unavailable, the learner has
  // reduced motion enabled, or S.rhythmHighwayClassicRenderer is set (the
  // in-page "Classic view" toggle).
  var _canvasHighway = null;
  var _canvasEvents = null;
  var _canvasEventsByNoteId = null;

  function rhythmHighwayUsesCanvas(accessibility) {
    if (typeof SparkHighway === "undefined") return false;
    if (S.rhythmHighwayClassicRenderer) return false;
    accessibility = accessibility || getRhythmHighwayAccessibilitySettings();
    if (accessibility && accessibility.reducedMotion) return false;
    return true;
  }

  function laneColorToRgb(hex) {
    var match = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!match) return [255, 255, 255];
    var n = parseInt(match[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function buildRhythmHighwaySkin(laneCount) {
    var base = SparkHighway.GUITAR_SKIN || {};
    // Gems use the same lane palette as the buttons and labels — including
    // the colorblind-safe palette when that accessibility setting is on.
    var accessibility = getRhythmHighwayAccessibilitySettings();
    var colors = [];
    for (var i = 0; i < laneCount; i++) colors.push(laneColorToRgb(laneColor(i, accessibility)));
    return Object.assign({}, base, { laneCount: laneCount, laneColors: colors });
  }

  function primaryLaneIndex(laneMask) {
    var mask = laneMask || 0;
    for (var lane = 0; lane < 32; lane++) {
      if (mask & (1 << lane)) return lane;
    }
    return 0;
  }

  function canvasNoteDurSec(note) {
    var engine = runtime.engine;
    if (engine && engine.timingEngine && engine.chart && note.tickLength &&
        typeof engine.timingEngine.tickToSeconds === "function") {
      var endSec = engine.timingEngine.tickToSeconds(engine.chart.tempoMap, note.tick + note.tickLength);
      if (isFinite(endSec) && endSec > note.timeSec) return endSec - note.timeSec;
    }
    return 0.22;
  }

  function buildCanvasEvents() {
    var states = runtime.engine && runtime.engine.noteStates ? runtime.engine.noteStates : [];
    var events = [];
    var byId = {};
    for (var i = 0; i < states.length; i++) {
      var n = states[i];
      var dur = canvasNoteDurSec(n);
      // One renderer event per required lane: the renderer positions gems from
      // evt.lane alone, while the input judge requires the COMPLETE laneMask —
      // a chord must show a gem on every lane it demands or players get
      // wrong_fret misses on lanes they cannot see.
      var laneEvents = [];
      for (var lane = 0; lane < 32; lane++) {
        if (!(n.laneMask & (1 << lane))) continue;
        var evt = {
          t: n.timeSec,
          dur: dur,
          type: "tap",
          lane: lane,
          laneMask: n.laneMask,
          laneLabel: n.label || ""
        };
        events.push(evt);
        laneEvents.push(evt);
      }
      if (!laneEvents.length) {
        var fallbackEvt = { t: n.timeSec, dur: dur, type: "tap", lane: 0, laneMask: n.laneMask, laneLabel: n.label || "" };
        events.push(fallbackEvt);
        laneEvents.push(fallbackEvt);
      }
      byId[n.id] = laneEvents;
    }
    _canvasEvents = events;
    _canvasEventsByNoteId = byId;
    return events;
  }

  function ensureRhythmCanvasHighway(laneCount) {
    var canvas = document.getElementById("rhythm-highway-canvas");
    if (!canvas) return null;
    if (_canvasHighway && _canvasHighway.canvas === canvas) return _canvasHighway;
    if (_canvasHighway) _canvasHighway.destroy();
    _canvasHighway = new SparkHighway(canvas, buildRhythmHighwaySkin(laneCount));
    _canvasHighway._initPromise = _canvasHighway.init();
    if (_canvasEvents) _canvasHighway.setChart(_canvasEvents, []);
    return _canvasHighway;
  }

  function destroyRhythmCanvasHighway() {
    if (_canvasHighway) { _canvasHighway.destroy(); _canvasHighway = null; }
    _canvasEvents = null;
    _canvasEventsByNoteId = null;
  }

  // Mirror engine note outcomes onto the renderer's event flags (the bundle
  // reads _hit/_miss/_scored to restyle gems and stamps _screenX for hits).
  function syncCanvasEventStates() {
    if (!_canvasEventsByNoteId || !runtime.engine || !runtime.engine.noteStates) return;
    var states = runtime.engine.noteStates;
    for (var i = 0; i < states.length; i++) {
      var laneEvents = _canvasEventsByNoteId[states[i].id];
      if (!laneEvents) continue;
      for (var j = 0; j < laneEvents.length; j++) {
        laneEvents[j]._hit = !!states[i].hit;
        laneEvents[j]._miss = !!states[i].missed;
        laneEvents[j]._scored = !!(states[i].hit || states[i].missed);
      }
    }
  }

  function notifyCanvasHit(noteId) {
    if (!_canvasHighway || !_canvasEventsByNoteId || typeof _canvasHighway.notifyHit !== "function") return;
    var laneEvents = _canvasEventsByNoteId[noteId] || [];
    for (var i = 0; i < laneEvents.length; i++) {
      if (laneEvents[i]._screenX) {
        _canvasHighway.notifyHit(laneEvents[i]._screenX, laneEvents[i]._screenY, 0x4ecdc4);
      }
    }
  }

  function syncRhythmLaneButtons() {
    var accessibility = getRhythmHighwayAccessibilitySettings();
    var buttons = document.querySelectorAll(".rhythm-lane-btn");
    for (var i = 0; i < buttons.length; i++) {
      var active = maskHasLane(S.rhythmHighwayHeldMask, i);
      buttons[i].style.background = active ? laneColor(i, accessibility) : "var(--input-bg)";
      buttons[i].style.color = active ? "#fff" : "var(--text-secondary)";
    }
  }

  // True while the canvas renderer is live on screen — per-frame updates and
  // strum/lane feedback are handled with targeted DOM writes, so the action
  // layer must NOT full-render (a rebuild would replace the canvas element
  // and force a renderer re-init).
  function rhythmHighwayHandlesFrameRender() {
    return !!(rhythmHighwayUsesCanvas(null) && runtime.engine && document.getElementById("rhythm-highway-canvas"));
  }

  function updateCanvasFrame(positionSec, snapshot) {
    if (!rhythmHighwayUsesCanvas(null)) return false;
    var labels = getRhythmHighwayLaneLabels();
    var highway = ensureRhythmCanvasHighway(labels.length);
    if (!highway) return false;
    if (!_canvasEvents) {
      buildCanvasEvents();
      highway.setChart(_canvasEvents, []);
    }
    syncCanvasEventStates();
    if (highway._ready) {
      highway.update(positionSec, snapshot && snapshot.gameplay ? (snapshot.gameplay.combo || 0) : 0);
    }
    var statEls = document.querySelectorAll(".rhythm-stat-val");
    if (statEls.length >= 3 && snapshot && snapshot.gameplay) {
      statEls[0].textContent = snapshot.gameplay.score;
      statEls[1].textContent = snapshot.gameplay.maxCombo + "x";
      statEls[2].textContent = Math.round((snapshot.gameplay.accuracy || 0) * 100) + "%";
    }
    var feedbackEl = document.getElementById("rhythm-highway-feedback");
    if (feedbackEl) feedbackEl.textContent = S.rhythmHighwayFeedback || "";
    return true;
  }

  var ASSIST_PRESETS = [
    { id: "spark_learning", label: "Guided", hint: "Wider timing windows and extra forgiveness" },
    { id: "spark_balanced", label: "Balanced", hint: "Closer to standard timing" },
    { id: "spark_challenge", label: "Challenge", hint: "Tighter timing and stricter accuracy checks" }
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
    destroyRhythmCanvasHighway();
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

    if (pageAdapter) {
      pageAdapter.createController({
        onRender: function(state) {
          if (!runtime.engine) return;
          var positionSec = state && state.transport ? (state.transport.positionSec || 0) : 0;
          currentSongTimeSec = positionSec;
          S.rhythmHighwaySnapshot = runtime.engine.update(positionSec);
          if (S.rhythmHighwaySnapshot.finished && !S.rhythmHighwayResult) {
            finalizeRhythmHighway();
            return;
          }
          // Canvas mode: targeted per-frame updates keep the PixiJS canvas
          // alive; the classic DOM renderer rebuilds the page per frame.
          if (!updateCanvasFrame(positionSec, S.rhythmHighwaySnapshot)) render();
        },
        onFinalize: function() {
          if (runtime.engine && !S.rhythmHighwayResult) {
            finalizeRhythmHighway();
          }
        }
      });
      var chart = activePayload.songChart;
      pageAdapter.start({ songChart: chart, chartId: activePayload.chartId || null }, { autoPlay: true });
    } else {
      tickRhythmHighway();
    }

    render();
    return true;
  }

  function stopSparkRhythmHighway() {
    if (pageAdapter) pageAdapter.destroy();
    destroyRhythmCanvasHighway();
    runtime.engine = null;
    currentSongTimeSec = 0;
  }

  function tickRhythmHighway() {
    // Legacy fallback path when SparkRhythmHighwayPageAdapter is unavailable.
    // In normal operation the adapter's onRender callback drives the loop.
    if (!runtime.engine) return;
    S.rhythmHighwaySnapshot = runtime.engine.update(currentSongTimeSec);
    if (S.rhythmHighwaySnapshot.finished && !S.rhythmHighwayResult) {
      finalizeRhythmHighway();
      return;
    }
    render();
  }

  function finalizeRhythmHighway() {
    if (!runtime.engine) return;
    // Release the PixiJS renderer before the results page replaces the
    // canvas — finalize is the normal completion path and must not leak the
    // WebGL resources that stop/exit cleanup releases.
    destroyRhythmCanvasHighway();
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
    if (pageAdapter) {
      pageAdapter.stop();
    }
    runtime.engine = null;
    render();
  }

  // Rhythm strums come from keyboard/buttons, so the relevant latency is the
  // learner's measured GLOBAL calibration offset ("audio" mode in the shared
  // model) — not the mic offset, which applies to mic-detected input paths.
  // Applied at input-judgment time only; the display clock stays raw.
  function getRhythmInputOffsetSec() {
    if (typeof SparkTimingCore === "undefined" || typeof SparkTimingCore.fromPerformanceState !== "function" || typeof S === "undefined") return 0;
    return SparkTimingCore.fromPerformanceState(S).getInputOffsetMs("audio") / 1000;
  }

  function sparkRhythmHighwayStrum() {
    if (!runtime.engine) return;
    var outcome = runtime.engine.handleInput({
      kind: "strum",
      laneMask: S.rhythmHighwayHeldMask || 0,
      atSec: Math.max(0, currentSongTimeSec - getRhythmInputOffsetSec())
    });
    if (outcome && outcome.resolution) {
      S.rhythmHighwayFeedback = feedbackForResolution(outcome.resolution);
      if (outcome.resolution.note && outcome.resolution.judgement !== "miss") {
        notifyCanvasHit(outcome.resolution.note.id);
      }
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
    h += '<p style="color:var(--text-dim);font-size:13px;margin-bottom:8px">' + escHTML(getRhythmHighwayInstructions(snapshot)) + '</p>';
    h += '<div style="margin-bottom:14px">';
    h += '<div class="metric-label" style="margin-bottom:6px">Assist Mode</div>';
    h += '<div class="action-row" style="justify-content:center">';
    for (var pi = 0; pi < ASSIST_PRESETS.length; pi++) {
      var preset = ASSIST_PRESETS[pi];
      var presetActive = activePreset && activePreset.id === preset.id;
      h += '<button class="btn" onclick="act(\'rhythmHighwayPreset\',\'' + preset.id + '\')" style="min-width:112px;background:' + (presetActive ? "#4ECDC4" : "var(--input-bg)") + ';color:' + (presetActive ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + preset.label + '</button>';
    }
    h += '</div>';
    h += '<div style="margin-top:6px;font-size:11px;color:var(--text-muted)">' + escHTML(activePreset ? activePreset.hint : "Switching assist mode restarts the run.") + '</div>';
    h += '</div>';
    h += '<div style="display:flex;justify-content:center;gap:18px;margin-bottom:12px">';
    h += '<div><div class="metric-value rhythm-stat-val" style="font-size:24px;color:#FFE66D">' + snapshot.gameplay.score + '</div><div class="metric-label">Score</div></div>';
    h += '<div><div class="metric-value rhythm-stat-val" style="font-size:24px;color:#FF6B6B">' + snapshot.gameplay.maxCombo + 'x</div><div class="metric-label">Max Combo</div></div>';
    h += '<div><div class="metric-value rhythm-stat-val" style="font-size:24px;color:#4ECDC4">' + Math.round((snapshot.gameplay.accuracy || 0) * 100) + '%</div><div class="metric-label">Accuracy</div></div>';
    h += '</div>';
    if (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.label) {
      h += '<div style="margin-bottom:12px;font-size:11px;color:var(--text-muted);font-weight:700">Focused Drill: ' + escHTML(firstRhythmHighwayTextToken(S.rhythmHighwayLaunchContext.label, "current drill")) + '</div>';
    }

    if (rhythmHighwayUsesCanvas(accessibility)) {
      // Shared PixiJS renderer (same as performance mode). The canvas is
      // updated per frame by updateCanvasFrame; a full page render replaces
      // the element and forces a renderer re-init, so frame-path actions do
      // targeted DOM writes instead.
      h += '<div style="height:320px;margin:0 auto 8px;position:relative;overflow:hidden;border-radius:14px">';
      h += '<canvas id="rhythm-highway-canvas" style="width:100%;height:100%;display:block"></canvas>';
      h += '</div>';
      if (accessibility.laneLabels) {
        h += '<div style="display:flex;justify-content:center;gap:26px;margin-bottom:12px">';
        for (var cl = 0; cl < laneCount; cl++) {
          h += '<span style="font-size:12px;font-weight:900;color:' + laneColor(cl, accessibility) + '">' + labels[cl] + '</span>';
        }
        h += '</div>';
      }
    } else {
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
    }

    h += '<div class="action-row" style="justify-content:center;margin-bottom:12px">';
    for (var fi = 0; fi < laneCount; fi++) {
      var active = maskHasLane(S.rhythmHighwayHeldMask, fi);
      h += '<button class="btn rhythm-lane-btn" onclick="act(\'rhythmHighwayLane\',' + fi + ')" style="min-width:54px;background:' + (active ? laneColor(fi, accessibility) : "var(--input-bg)") + ';color:' + (active ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + (accessibility.laneLabels ? labels[fi] : (fi + 1)) + '</button>';
    }
    h += '</div>';
    h += '<div class="action-row" style="justify-content:center">';
    h += '<button class="btn" onclick="act(\'rhythmHighwayStrum\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-size:18px;padding:14px 28px">Strum</button>';
    h += '<button class="btn" onclick="act(\'' + (S.rhythmHighwayLoop ? "rhythmHighwayClearLoop" : "rhythmHighwayLoopWindow") + '\')" style="background:' + (S.rhythmHighwayLoop ? "#4ECDC4" : "var(--input-bg)") + ';color:' + (S.rhythmHighwayLoop ? "#fff" : "var(--text-secondary)") + '">' + (S.rhythmHighwayLoop ? "Clear Loop" : "Loop Window") + '</button>';
    if (typeof SparkHighway !== "undefined" && !(accessibility && accessibility.reducedMotion)) {
      h += '<button class="btn" onclick="act(\'rhythmHighwayToggleRenderer\')" style="background:var(--input-bg);color:var(--text-secondary)">' + (S.rhythmHighwayClassicRenderer ? "Highway View" : "Classic View") + '</button>';
    }
    h += '<button class="btn" onclick="act(\'back\')" style="background:var(--input-bg);color:var(--text-secondary)">Exit</button>';
    h += '</div>';
    if (S.rhythmHighwayLoop) {
      h += '<div style="margin-top:10px;font-size:11px;color:#4ECDC4;font-weight:800">Looping ' + escHTML(firstRhythmHighwayTextToken(S.rhythmHighwayLoop.label, "current window")) + '</div>';
    }
    h += '<div id="rhythm-highway-feedback" style="margin-top:12px;font-size:12px;color:var(--text-muted);min-height:16px">' + escHTML(S.rhythmHighwayFeedback || "") + '</div>';
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
      h += '<div class="card-section-heading" style="margin-bottom:6px">' + escHTML(moduleGuidance.title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">' + escHTML(moduleGuidance.summary) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">Next: ' + escHTML(moduleGuidance.nextStep) + '</div>';
      h += '</div>';
    }
    h += '<div class="card mb16"><div style="display:flex;justify-content:space-around;text-align:center;gap:12px">';
    h += '<div><div class="metric-value" style="font-size:28px;color:#FFE66D">' + gameplay.score + '</div><div class="metric-label">Score</div></div>';
    h += '<div><div class="metric-value" style="font-size:28px;color:#4ECDC4">' + Math.round((gameplay.accuracy || 0) * 100) + '%</div><div class="metric-label">Accuracy</div></div>';
    h += '<div><div class="metric-value" style="font-size:28px;color:#FF6B6B">' + (gameplay.maxCombo || 0) + 'x</div><div class="metric-label">Max Combo</div></div>';
    h += '</div></div>';
    h += '<div class="card mb16" style="text-align:left"><div class="card-section-heading" style="margin-bottom:8px">Learning</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">Skills:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(formatSkills(learning.skills || [])) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin:8px 0 6px">Weak Areas:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(formatRhythmWeakAreas(learning.weakAreas || [])) + '</div></div>';
    h += '<div class="action-row" style="justify-content:center">';
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
    if (weakAreas.indexOf("late") >= 0) return "You were drifting late. Try coming in a hair earlier.";
    if (weakAreas.indexOf("wrong_fret") >= 0) return "Most misses came from the wrong position. Lock in the shape before the beat.";
    return "Nice run. Keep the same lane shape steady and aim for longer combos.";
  }

  function feedbackForResolution(resolution) {
    if (!resolution) return "";
    if (resolution.judgement === "perfect") return "Perfect";
    if (resolution.judgement === "good") return "Good";
    if (resolution.judgement === "ok") return "A little off, but it counted.";
    if (resolution.reason === "wrong_fret") return "Wrong position.";
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

  function getRhythmHighwayInstructions(snapshot) {
    // Check both payloads: buildRhythmHighwayLoopPayload builds the loop's
    // active payload without copying instructions, but the adapter-supplied
    // copy still lives on the source payload.
    var active = runtime.activePayload || null;
    var source = runtime.sourcePayload || null;
    var override = (active && typeof active.instructions === "string" && active.instructions)
      || (source && typeof source.instructions === "string" && source.instructions)
      || "";
    if (override) return override;
    var payload = active || source;
    var instrumentType = normalizeRhythmInstrumentType(
      (S.rhythmHighwayLaunchContext && S.rhythmHighwayLaunchContext.instrument) || (payload && payload.adapterType) || null
    );
    var copy = {
      guitar: "Hold frets 1-5 and strum on time.",
      bass: "Hold the frets and pluck on time.",
      ukulele: "Hold the chord shapes and strum on time.",
      piano: "Play the highlighted keys on time.",
      drums: "Hit each pad on time.",
      vocals: "Sing each syllable as it crosses the line."
    };
    // normalizeRhythmInstrumentType passes module names through as-is, which
    // may be capitalized ("Guitar") — the table keys are lowercase.
    var key = typeof instrumentType === "string" ? instrumentType.toLowerCase() : "";
    return copy[key] || "Hit each lane on time.";
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

  // Five engine-tier call sites guard on startPlayableRhythmHighwayPayload and
  // fall through when it is absent — which it always was, so the ExecutionGateway's
  // practice route, Spotify play-along and SessionRuntime's drill launch all
  // silently did nothing. They pass (payload, launchContext); startRhythmHighwayPayload
  // takes the preset as its middle argument, so the adapter is the whole fix.
  // Passing null for the preset lets it resolve from S.rhythmHighwayPreset or
  // payload.enginePreset, which is what those callers set.
  function startPlayableRhythmHighwayPayload(payload, launchContext) {
    return startRhythmHighwayPayload(payload, null, launchContext || {});
  }

  window.startRhythmHighwaySegment = startRhythmHighwaySegment;
  window.startRhythmHighwayPayload = startRhythmHighwayPayload;
  window.startPlayableRhythmHighwayPayload = startPlayableRhythmHighwayPayload;
  window.stopSparkRhythmHighway = stopSparkRhythmHighway;
  window._sparkRhythmHighwayStrum = sparkRhythmHighwayStrum;
  window._sparkRhythmHighwayHandlesFrameRender = rhythmHighwayHandlesFrameRender;
  window._sparkRhythmHighwaySyncLaneButtons = syncRhythmLaneButtons;
  window._sparkRhythmHighwayDestroyCanvas = destroyRhythmCanvasHighway;
  window._buildRhythmHighwayLoopPayload = buildRhythmHighwayLoopPayload;
  window._createRhythmHighwayLoopSpec = createRhythmHighwayLoopSpec;
  window._getRhythmHighwayLaneLabels = getRhythmHighwayLaneLabels;
  window.rhythmHighwayPage = rhythmHighwayPage;
})();
