(function() {
  var runtime = {
    engine: null,
    clock: null,
    raf: null,
    segmentId: null
  };

  function startRhythmHighwaySegment(segmentId) {
    if (!window.sparkCore || typeof window.sparkCore.getSegmentById !== "function") return false;
    var segment = window.sparkCore.getSegmentById(segmentId);
    if (!segment || !segment.meta || !segment.meta.gameplayPayload) return false;

    stopSparkRhythmHighway();

    var payload = segment.meta.gameplayPayload;
    runtime.segmentId = segmentId;
    runtime.clock = new SparkTimingEngine(new SparkCalibrationEngine()).createClock("guitar");
    runtime.engine = new SparkRhythmGameplayEngine({
      chart: payload.songChart,
      adapter: new SparkGuitarRhythmAdapter(),
      preset: SparkEnginePresetRegistry.get(payload.enginePreset)
    });

    S.activeCoreSegmentId = segmentId;
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
    if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
      window.sparkCore.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        itemId: runtime.segmentId,
        result: result,
        gameplayResult: result
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

    var labels = ["G", "R", "Y", "B", "O"];
    var h = '<div class="text-center"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Rhythm Highway</h2>';
    h += '<p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">Hold frets 1-5 and strum on time. Audio clock drives the run; this page only renders snapshots.</p>';
    h += '<div style="display:flex;justify-content:center;gap:18px;margin-bottom:12px">';
    h += '<div><div style="font-size:24px;font-weight:900;color:#FFE66D">' + snapshot.gameplay.score + '</div><div style="font-size:10px;color:var(--text-muted)">Score</div></div>';
    h += '<div><div style="font-size:24px;font-weight:900;color:#FF6B6B">' + snapshot.gameplay.maxCombo + 'x</div><div style="font-size:10px;color:var(--text-muted)">Max Combo</div></div>';
    h += '<div><div style="font-size:24px;font-weight:900;color:#4ECDC4">' + Math.round((snapshot.gameplay.accuracy || 0) * 100) + '%</div><div style="font-size:10px;color:var(--text-muted)">Accuracy</div></div>';
    h += '</div>';

    h += '<div style="display:grid;grid-template-columns:repeat(5,56px);gap:8px;justify-content:center;align-items:end;height:320px;margin:0 auto 16px;position:relative">';
    for (var lane = 0; lane < 5; lane++) {
      h += '<div style="position:relative;height:320px;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid var(--border)">';
      h += '<div style="position:absolute;left:6px;right:6px;bottom:72px;height:4px;background:#FFE66D;border-radius:999px"></div>';
      h += '<div style="position:absolute;left:0;right:0;bottom:12px;font-size:12px;font-weight:900;color:' + laneColor(lane) + '">' + labels[lane] + '</div>';
      for (var i = 0; i < snapshot.notes.length; i++) {
        var note = snapshot.notes[i];
        if (!maskHasLane(note.laneMask, lane)) continue;
        var bottom = Math.max(86, Math.min(286, 86 + ((3 - (note.timeSec - snapshot.songTimeSec)) * 66)));
        h += '<div style="position:absolute;left:8px;right:8px;bottom:' + bottom + 'px;height:18px;border-radius:8px;background:' + laneColor(lane) + ';opacity:' + (note.hit ? 0.35 : 0.95) + ';box-shadow:0 8px 18px rgba(0,0,0,.24)" title="' + escHTML(note.label || "") + '"></div>';
      }
      h += '</div>';
    }
    h += '</div>';

    h += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
    for (var fi = 0; fi < 5; fi++) {
      var active = maskHasLane(S.rhythmHighwayHeldMask, fi);
      h += '<button class="btn" onclick="act(\'rhythmHighwayLane\',' + fi + ')" style="min-width:54px;background:' + (active ? laneColor(fi) : "var(--input-bg)") + ';color:' + (active ? "#fff" : "var(--text-secondary)") + ';font-weight:800">' + labels[fi] + '</button>';
    }
    h += '</div>';
    h += '<div style="display:flex;justify-content:center;gap:10px">';
    h += '<button class="btn" onclick="act(\'rhythmHighwayStrum\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-size:18px;padding:14px 28px">Strum</button>';
    h += '<button class="btn" onclick="act(\'back\')" style="background:var(--input-bg);color:var(--text-secondary)">Exit</button>';
    h += '</div>';
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
    var h = '<div class="text-center" style="padding-top:16px"><div style="font-size:56px;animation:bn .6s ease">&#127928;</div>';
    h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Rhythm Highway Complete</h2>';
    h += '<div class="card mb16"><div style="display:flex;justify-content:space-around;text-align:center">';
    h += '<div><div style="font-size:28px;font-weight:900;color:#FFE66D">' + gameplay.score + '</div><div style="font-size:11px;color:var(--text-muted)">Score</div></div>';
    h += '<div><div style="font-size:28px;font-weight:900;color:#4ECDC4">' + Math.round((gameplay.accuracy || 0) * 100) + '%</div><div style="font-size:11px;color:var(--text-muted)">Accuracy</div></div>';
    h += '<div><div style="font-size:28px;font-weight:900;color:#FF6B6B">' + (gameplay.maxCombo || 0) + 'x</div><div style="font-size:11px;color:var(--text-muted)">Max Combo</div></div>';
    h += '</div></div>';
    h += '<div class="card mb16" style="text-align:left"><div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Learning</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">Skills:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(formatSkills(learning.skills || [])) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin:8px 0 6px">Weak Areas:</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML((learning.weakAreas || []).join(", ") || "None") + '</div></div>';
    h += '<div style="display:flex;gap:10px;justify-content:center">';
    h += '<button class="btn" onclick="act(\'restartRhythmHighway\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">Play Again</button>';
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

  function laneColor(index) {
    return ["#4ade80", "#ef4444", "#facc15", "#3b82f6", "#f97316"][index] || "#999";
  }

  window.startRhythmHighwaySegment = startRhythmHighwaySegment;
  window.stopSparkRhythmHighway = stopSparkRhythmHighway;
  window._sparkRhythmHighwayStrum = sparkRhythmHighwayStrum;
  window.rhythmHighwayPage = rhythmHighwayPage;
})();
