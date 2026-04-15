// ===== SparkSuite: Play Along Pages =====
(function() {
  var playAlongState = new SparkPlayAlongStateService();

  var PLAY_ALONG_DEMOS = [
    {
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      artist: "SparkSuite Demo",
      difficulty: "easy",
      instrument: "guitar",
      audioOffsetMs: 24
    },
    {
      trackId: "demo_song_2",
      title: "Midnight Echo",
      artist: "SparkSuite Demo",
      difficulty: "normal",
      instrument: "guitar",
      audioOffsetMs: 36
    }
  ];

  window.getSparkPlayAlongDemos = function() {
    return PLAY_ALONG_DEMOS.slice();
  };

  function sparkPlayAlongBackToHome() {
    playAlongState.writeValue(["screen"], "home");
    playAlongState.writeValue(["tab"], "practice");
    if (typeof render === "function") render();
  }

  function buildPlayAlongHomeViewModel() {
    var errorState = playAlongState.getError();
    return {
      spotifyConnected: playAlongState.isSpotifyConnected(),
      difficulty: playAlongState.getDifficulty(),
      error: errorState,
      demos: typeof window.getSparkPlayAlongDemos === "function" ? window.getSparkPlayAlongDemos() : [],
      recent: playAlongState.getRecent(),
      bookmarks: playAlongState.getBookmarks(),
      savedTracks: playAlongState.getSavedTracks()
    };
  }

  function buildPlayAlongSessionViewModel() {
    var chart = playAlongState.getActiveChart();
    var drill = playAlongState.getSelectedDrill();
    var errorState = playAlongState.getError();
    return {
      chart: chart,
      error: errorState,
      trackTitle: playAlongState.getTrackTitle(chart),
      bpm: playAlongState.getBpm(chart),
      accuracy: Math.round((playAlongState.getAccuracy() || 0) * 100),
      paused: playAlongState.isPaused(),
      drill: drill,
      loopRange: playAlongState.getLoopRange(),
      loopTarget: playAlongState.getLoopTarget(),
      coachHint: playAlongState.getCoachHint(),
      transportMode: playAlongState.getTransportMode(),
      currentSection: playAlongState.getCurrentSectionLabel(),
      currentTime: playAlongState.getCurrentTimeLabel(),
      aiFeedback: playAlongState.getRealtimeAIFeedback(),
      speedLabel: playAlongState.getSpeedLabel(),
      loopEnabled: playAlongState.isLoopEnabled(),
      sectionNav: playAlongState.getSectionNavigation(chart),
      hasPlayableSections: playAlongState.hasPlayableSections(chart)
    };
  }

  function buildPlayAlongResultsViewModel() {
    var outcome = playAlongState.getLastOutcome();
    var aiInsights = playAlongState.getOutcomeAIInsights();
    return {
      outcome: outcome,
      accuracy: playAlongState.getOutcomePercent("accuracy"),
      timing: playAlongState.getOutcomePercent("timing"),
      consistency: playAlongState.getOutcomePercent("consistency"),
      feedback: playAlongState.getOutcomeFeedback(),
      drills: playAlongState.getOutcomeDrills(),
      suggestedDifficulty: playAlongState.getSuggestedDifficulty(),
      suggestedMode: playAlongState.getSuggestedMode(),
      drillSummary: outcome && outcome.drillSummary ? outcome.drillSummary : null,
      aiInsights: aiInsights,
      nextAction: playAlongState.getNextAction(),
      weakAreas: playAlongState.getWeakAreas(),
      sectionSummary: playAlongState.getSectionSummary()
    };
  }

  window.playAlongPage = function() {
    var h = "";
    var viewModel = buildPlayAlongHomeViewModel();

    h += "<div>";
    h += "<button class='btn' onclick=\"act('playAlongBackHome')\">&#8592; Back</button>";
    h += "<h2 style='font-size:22px;font-weight:900;color:var(--text-primary);margin:12px 0'>Play Along</h2>";
    if (viewModel.error && viewModel.error.message) {
      h += "<div class='card' style='margin-bottom:12px;border-color:#ef4444;background:rgba(239,68,68,0.08)'>";
      h += "<div style='font-size:12px;color:#ef4444;font-weight:700'>" + escPlayAlong(viewModel.error.message) + "</div>";
      h += "</div>";
    }

    // Spotify connection
    h += "<div class='card' style='margin-bottom:12px'>";
    h += "<div style='display:flex;align-items:center;justify-content:space-between'>";
    h += "<span style='font-size:14px;font-weight:700;color:var(--text-primary)'>Spotify</span>";
    if (viewModel.spotifyConnected) {
      h += "<span style='background:#22c55e;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700'>Connected</span>";
    } else {
      h += "<button class='btn btn-sm' onclick=\"act('spotifyConnect')\" style='font-size:12px'>Connect</button>";
    }
    h += "</div></div>";

    // Search
    h += "<input id='play-along-search' type='text' placeholder='Search any song...' class='input' oninput=\"act('playAlongSearch',this.value)\" style='width:100%;margin-bottom:8px'>";
    h += "<div id='play-along-results'></div>";

    if (viewModel.savedTracks.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Saved Spotify Songs</div>";
      for (var si = 0; si < viewModel.savedTracks.length; si++) {
        var saved = viewModel.savedTracks[si];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (si === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(saved.title || saved.trackId || "Saved Track") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong((saved.artist || "Unknown Artist") + (saved.bpm ? " | " + saved.bpm + " BPM" : "")) + "</div>";
        h += "</div>";
        h += "<div style='display:flex;gap:6px'>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongLaunchSaved'," + si + ")\">Play</button>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongRemoveSaved'," + si + ")\">Remove</button>";
        h += "</div>";
        h += "</div>";
      }
      h += "<div style='text-align:right;margin-top:8px'><button class='btn btn-sm' onclick=\"act('playAlongClearSaved')\">Clear Saved</button></div>";
      h += "</div>";
    }

    // Recent tracks
    if (viewModel.recent.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Recent Songs</div>";
      for (var ri = 0; ri < viewModel.recent.length; ri++) {
        var item = viewModel.recent[ri];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (ri === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(item.title || item.trackId || "Recent Song") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong(playAlongState.getRecentMeta(item)) + "</div>";
        h += "</div>";
        h += "<div style='display:flex;gap:6px'>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongResumeRecent'," + ri + ")\">Replay</button>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongRemoveRecent'," + ri + ")\">Remove</button>";
        h += "</div>";
        h += "</div>";
      }
      h += "<div style='text-align:right;margin-top:8px'><button class='btn btn-sm' onclick=\"act('playAlongClearRecent')\">Clear History</button></div>";
      h += "</div>";
    }

    if (viewModel.bookmarks.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Saved Sections</div>";
      for (var bi = 0; bi < viewModel.bookmarks.length; bi++) {
        var mark = viewModel.bookmarks[bi];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (bi === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(mark.title || mark.trackId || "Saved Section") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong((mark.sectionLabel || "Section") + " | " + formatPlayAlongMs(mark.startMs || 0)) + "</div>";
        h += "</div>";
        h += "<div style='display:flex;gap:6px'>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongLaunchBookmark'," + bi + ")\">Jump In</button>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongRemoveBookmark'," + bi + ")\">Remove</button>";
        h += "</div>";
        h += "</div>";
      }
      h += "<div style='text-align:right;margin-top:8px'><button class='btn btn-sm' onclick=\"act('playAlongClearBookmarks')\">Clear Bookmarks</button></div>";
      h += "</div>";
    }

    if (viewModel.demos.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Featured Songs</div>";
      for (var di = 0; di < viewModel.demos.length; di++) {
        var demo = viewModel.demos[di];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (di === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(demo.title || demo.trackId || "Demo Song") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong((demo.artist || "Unknown Artist") + " | offset " + (demo.audioOffsetMs || 0) + "ms") + "</div>";
        h += "</div>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongLaunchDemo'," + di + ")\">Play</button>";
        h += "</div>";
      }
      h += "</div>";
    }

    // Difficulty selector
    h += "<div class='card' style='margin:12px 0'>";
    h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Difficulty</div>";
    h += "<div style='display:flex;gap:8px'>";
    h += "<button class='btn btn-sm" + (viewModel.difficulty === "easy" ? "' style='background:var(--accent);color:#fff'" : "'") + " onclick=\"act('playAlongSetDifficulty','easy')\">Easy</button>";
    h += "<button class='btn btn-sm" + (viewModel.difficulty === "normal" ? "' style='background:var(--accent);color:#fff'" : "'") + " onclick=\"act('playAlongSetDifficulty','normal')\">Normal</button>";
    h += "<button class='btn btn-sm" + (viewModel.difficulty === "hard" ? "' style='background:var(--accent);color:#fff'" : "'") + " onclick=\"act('playAlongSetDifficulty','hard')\">Hard</button>";
    h += "</div></div>";

    // Local file upload
    h += "<div class='card'>";
    h += "<input type='file' id='play-along-file' accept='audio/*' onchange=\"act('playAlongLoadFile',this.files[0])\">";
    h += "<div style='color:var(--text-dim);font-size:12px;margin-top:4px'>Or drop an audio file for beat-detected charts</div>";
    h += "</div>";

    h += "</div>";
    return h;
  };

  window.playAlongSessionPage = function() {
    var h = "";
    var viewModel = buildPlayAlongSessionViewModel();

    h += "<div>";
    h += "<button class='btn' onclick=\"act('playAlongStop')\">&#9632; Stop</button>";
    if (viewModel.error && viewModel.error.message) {
      h += "<div class='card' style='margin-top:10px;border-color:#ef4444;background:rgba(239,68,68,0.08)'>";
      h += "<div style='font-size:12px;color:#ef4444;font-weight:700'>" + escPlayAlong(viewModel.error.message) + "</div>";
      h += "</div>";
    }

    // Song info
    h += "<div style='text-align:center;margin:8px 0'>";
    h += "<div style='font-size:18px;font-weight:900;color:var(--text-primary)'>" + viewModel.trackTitle + "</div>";
    h += "<div style='font-size:12px;color:var(--text-dim)'>" + viewModel.bpm + " BPM</div>";
    h += "</div>";

    // Gameplay canvas
    h += "<canvas id='play-along-canvas' width='800' height='300' style='width:100%;border-radius:12px;background:#111'></canvas>";

    // Fretboard canvas
    h += "<canvas id='play-along-fretboard' width='800' height='140' style='width:100%;border-radius:8px;background:#1a1a1a;margin-top:8px'></canvas>";

    // Controls row
    h += "<div style='display:flex;align-items:center;justify-content:space-between;margin-top:8px'>";
    h += "<button class='btn btn-sm' onclick=\"act('playAlongTogglePause')\">" + (viewModel.paused ? "Resume" : "Pause") + "</button>";
    h += "<span style='font-size:12px;color:var(--text-dim)'>Speed: " + viewModel.speedLabel + "x</span>";
    h += "<button class='btn btn-sm' onclick=\"act('playAlongToggleLoop')\">Loop: " + (viewModel.loopEnabled ? "ON" : "OFF") + "</button>";
    h += "</div>";
    h += "<div style='display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px'>";
    h += "<span style='font-size:11px;color:var(--text-muted);background:var(--chip-bg);padding:4px 10px;border-radius:999px'>Transport: " + escPlayAlong(viewModel.transportMode) + "</span>";
    h += "<span style='font-size:11px;color:var(--text-muted);background:var(--chip-bg);padding:4px 10px;border-radius:999px'>Loop Target: " + escPlayAlong(viewModel.loopTarget) + "</span>";
    h += "</div>";
    h += "<div class='card' style='margin-top:10px;padding:10px 12px;text-align:left'>";
    h += "<div id='play-along-session-section' style='font-size:12px;font-weight:800;color:var(--text-primary)'>" + escPlayAlong(viewModel.currentSection) + "</div>";
    h += "<div style='font-size:11px;color:var(--text-muted);margin-top:4px'>Position: <span id='play-along-session-time'>" + escPlayAlong(viewModel.currentTime) + "</span></div>";
    h += "<div style='margin-top:8px'><button class='btn btn-sm' onclick=\"act('playAlongBookmarkCurrentSection')\">Save This Section</button></div>";
    if (viewModel.sectionNav.total > 1) {
      h += "<div style='display:flex;gap:8px;justify-content:space-between;margin-top:8px'>";
      h += "<button class='btn btn-sm' onclick=\"act('playAlongPrevSection')\"" + (viewModel.sectionNav.hasPrev ? "" : " style='opacity:0.5'") + ">Prev Section</button>";
      h += "<span style='font-size:11px;color:var(--text-muted);align-self:center'>" + escPlayAlong(viewModel.sectionNav.label) + "</span>";
      h += "<button class='btn btn-sm' onclick=\"act('playAlongNextSection')\"" + (viewModel.sectionNav.hasNext ? "" : " style='opacity:0.5'") + ">Next Section</button>";
      h += "</div>";
    }
    h += "</div>";

    if (viewModel.drill || viewModel.hasPlayableSections) {
      h += "<div style='display:flex;gap:8px;justify-content:center;margin-top:8px'>";
      if (viewModel.drill) {
        h += "<button class='btn btn-sm' onclick=\"act('playAlongSetLoopTarget','drill')\" style='background:" + (viewModel.loopTarget === "drill" ? "var(--accent)" : "var(--input-bg)") + ";color:" + (viewModel.loopTarget === "drill" ? "#fff" : "var(--text-secondary)") + "'>Target: Drill</button>";
      }
      if (viewModel.hasPlayableSections) {
        h += "<button class='btn btn-sm' onclick=\"act('playAlongSetLoopTarget','section')\" style='background:" + (viewModel.loopTarget === "section" ? "var(--accent)" : "var(--input-bg)") + ";color:" + (viewModel.loopTarget === "section" ? "#fff" : "var(--text-secondary)") + "'>Target: Section</button>";
      }
    h += "</div>";
    }

    if (viewModel.drill || viewModel.loopRange) {
      h += "<div class='card' style='margin-top:10px;padding:10px 12px;text-align:left'>";
      if (viewModel.drill) {
        h += "<div style='font-size:12px;font-weight:800;color:var(--text-primary);margin-bottom:4px'>Active Drill: " + escPlayAlong(viewModel.drill.label || viewModel.drill.focus || viewModel.drill.type || "Focused Practice") + "</div>";
      }
      if (viewModel.loopRange && viewModel.loopRange.startMs != null && viewModel.loopRange.endMs != null) {
        h += "<div style='font-size:12px;color:var(--text-dim)'>Loop Window: " + formatPlayAlongMs(viewModel.loopRange.startMs) + " - " + formatPlayAlongMs(viewModel.loopRange.endMs) + "</div>";
      }
      if (viewModel.drill && viewModel.drill.repetitions != null) {
        h += "<div id='play-along-loop-reps' style='font-size:11px;color:var(--text-muted);margin-top:4px'>" + playAlongState.getRepStatus(viewModel.drill) + "</div>";
      } else if (viewModel.drill || viewModel.loopRange) {
        h += "<div id='play-along-loop-reps' style='font-size:11px;color:var(--text-muted);margin-top:4px'>" + playAlongState.getRepStatus(viewModel.drill) + "</div>";
      }
      if (viewModel.loopRange && viewModel.loopRange.startMs != null && viewModel.loopRange.endMs != null) {
        h += "<div id='play-along-loop-progress' style='font-size:11px;color:var(--text-muted);margin-top:4px'>Loop Progress: " + playAlongState.getLoopProgress() + "%</div>";
      }
      if (viewModel.coachHint) {
        h += "<div id='play-along-coach-hint' style='font-size:11px;color:var(--accent);margin-top:6px'>" + escPlayAlong(viewModel.coachHint) + "</div>";
      }
      if (viewModel.aiFeedback) {
        h += "<div id='play-along-ai-feedback' style='font-size:12px;color:#66ccff;font-weight:700;margin-top:6px'>" + escPlayAlong(viewModel.aiFeedback) + "</div>";
      }
      h += "</div>";
    }

    // Score
    h += "<div style='text-align:center;margin-top:12px'>";
    h += "<div style='font-size:32px;font-weight:900;color:var(--accent)'>" + viewModel.accuracy + "%</div>";
    h += "<div style='font-size:11px;color:var(--text-muted)'>Accuracy</div>";
    h += "</div>";

    // Debug toggle
    h += "<div style='text-align:right;margin-top:8px'>";
    h += "<button class='btn btn-sm' onclick=\"act('playAlongToggleDebug')\" style='opacity:0.5;font-size:11px'>Debug</button>";
    h += "</div>";

    h += "</div>";
    return h;
  };

  window.playAlongResultsPage = function() {
    var h = "";
    var viewModel = buildPlayAlongResultsViewModel();

    h += "<div class='text-center'>";
    h += "<h2 style='font-size:22px;font-weight:900;color:var(--text-primary);margin-bottom:12px'>Session Complete</h2>";

    // Stats card
    h += "<div class='card' style='margin-bottom:12px'>";
    h += "<div style='display:flex;justify-content:center;gap:24px'>";
    h += "<div><div style='font-size:28px;font-weight:900;color:var(--accent)'>" + viewModel.accuracy + "%</div><div style='font-size:11px;color:var(--text-muted)'>Accuracy</div></div>";
    h += "<div><div style='font-size:28px;font-weight:900;color:var(--text-primary)'>" + viewModel.timing + "%</div><div style='font-size:11px;color:var(--text-muted)'>Timing</div></div>";
    h += "<div><div style='font-size:28px;font-weight:900;color:var(--text-primary)'>" + viewModel.consistency + "%</div><div style='font-size:11px;color:var(--text-muted)'>Consistency</div></div>";
    h += "</div></div>";

    // Feedback messages
    if (viewModel.feedback.length > 0) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left'>";
      for (var i = 0; i < viewModel.feedback.length; i++) {
        h += "<div style='font-size:13px;color:var(--text-dim);padding:4px 0'>" + viewModel.feedback[i] + "</div>";
      }
      h += "</div>";
    }

    if (viewModel.drillSummary) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>Drill Summary</div>";
      if (viewModel.drillSummary.label) {
        h += "<div style='font-size:12px;color:var(--text-dim)'>" + escPlayAlong(viewModel.drillSummary.label) + "</div>";
      }
      h += "<div style='font-size:12px;color:var(--text-dim)'>Completed " + escPlayAlong(String(viewModel.drillSummary.completedReps || 0)) + " of " + escPlayAlong(String(viewModel.drillSummary.targetReps || 0)) + " reps</div>";
      if (viewModel.drillSummary.loopWindowLabel) {
        h += "<div style='font-size:12px;color:var(--text-dim)'>Loop Window: " + escPlayAlong(viewModel.drillSummary.loopWindowLabel) + "</div>";
      }
      h += "<div style='font-size:12px;color:" + (viewModel.drillSummary.metTarget ? "var(--accent)" : "var(--text-muted)") + ";margin-top:4px'>" + escPlayAlong(viewModel.drillSummary.metTarget ? "Target reached" : "Stopped before target") + "</div>";
      h += "</div>";
    }

    if (viewModel.nextAction) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left;border:1px solid var(--accent)'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>Next Best Move</div>";
      h += "<div style='font-size:12px;color:var(--text-dim);margin-bottom:8px'>" + escPlayAlong(viewModel.nextAction.message) + "</div>";
      h += "<div style='display:flex;gap:8px;flex-wrap:wrap'>";
      if (viewModel.nextAction.primaryAction === "drill") {
        h += "<button class='btn btn-sm' onclick=\"act('playAlongReplayDrill')\" style='background:var(--accent);color:#fff'>Run Drill Again</button>";
      } else if (viewModel.nextAction.primaryAction === "full_song") {
        h += "<button class='btn btn-sm' onclick=\"act('playAlongReplayFullSong')\" style='background:var(--accent);color:#fff'>Back to Full Song</button>";
      }
      h += "<button class='btn btn-sm' onclick=\"act('playAlongReplay')\">Replay Session</button>";
      h += "</div>";
      h += "</div>";
    }

    if (viewModel.weakAreas.length > 0) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>Where It Broke Down</div>";
      h += "<div style='font-size:12px;color:var(--text-dim)'>" + escPlayAlong(viewModel.weakAreas.join(" | ")) + "</div>";
      if (viewModel.sectionSummary && viewModel.sectionSummary.sectionLabel) {
        h += "<div style='font-size:12px;color:var(--text-dim);margin-top:6px'>Weak section: " + escPlayAlong(viewModel.sectionSummary.sectionLabel) + "</div>";
      }
      h += "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:8px'>";
      if (viewModel.sectionSummary) {
        h += "<button class='btn btn-sm' onclick=\"act('playAlongJumpToWeakSection')\">Jump To Weak Section</button>";
        h += "<button class='btn btn-sm' onclick=\"act('playAlongBookmarkCurrentSection')\">Save Weak Section</button>";
      }
      h += "</div>";
      h += "</div>";
    }

    if (viewModel.aiInsights) {
      var aiChordKeys = Object.keys(viewModel.aiInsights.chordErrors || {});
      h += "<div class='card' style='margin-bottom:12px;text-align:left;border:1px solid rgba(102,204,255,.26)'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>AI Coach Summary</div>";
      h += "<div style='font-size:12px;color:var(--text-dim)'>Most missed chord: " + escPlayAlong(aiChordKeys.length ? aiChordKeys[0] : "None") + "</div>";
      h += "<div style='font-size:12px;color:var(--text-dim)'>Late hits: " + escPlayAlong(String(viewModel.aiInsights.lateHits || 0)) + "</div>";
      h += "<div style='font-size:12px;color:var(--text-dim)'>Early hits: " + escPlayAlong(String(viewModel.aiInsights.earlyHits || 0)) + "</div>";
      h += "</div>";
    }

    // Heatmap canvas
    h += "<canvas id='play-along-heatmap' width='800' height='60' style='width:100%;border-radius:8px;background:#111'></canvas>";

    // Drills section
    if (viewModel.drills.length > 0) {
      h += "<div class='card' style='margin:12px 0;text-align:left'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Suggested Drills</div>";
      for (var j = 0; j < viewModel.drills.length; j++) {
        h += "<button class='btn btn-sm' onclick=\"act('playAlongStartDrill'," + j + ")\" style='margin:2px 4px 2px 0'>Fix This: " + (viewModel.drills[j].label || viewModel.drills[j]) + "</button>";
      }
      h += "</div>";
    }

    // RL suggestion
    if (viewModel.suggestedDifficulty || viewModel.suggestedMode) {
      h += "<div style='font-size:12px;color:var(--text-dim);margin:8px 0'>";
      if (viewModel.suggestedDifficulty) {
        h += "Suggested difficulty: <strong style='color:var(--text-primary)'>" + viewModel.suggestedDifficulty + "</strong> ";
      }
      if (viewModel.suggestedMode) {
        h += "Mode: <strong style='color:var(--text-primary)'>" + viewModel.suggestedMode + "</strong>";
      }
      h += "</div>";
    }

    // Action buttons
    h += "<div style='display:flex;gap:8px;justify-content:center;margin-top:16px'>";
    h += "<button class='btn' onclick=\"act('playAlongReplay')\" style='background:var(--accent);color:#fff'>Play Again</button>";
    h += "<button class='btn' onclick=\"act('playAlongPickNew')\">Pick New Song</button>";
    h += "</div>";

    h += "</div>";
    return h;
  };

  function formatPlayAlongMs(ms) {
    ms = Math.max(0, Math.round(ms || 0));
    var totalSec = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSec / 60);
    var seconds = totalSec % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function escPlayAlong(value) {
    if (value == null) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.sparkPlayAlongBackToHome = sparkPlayAlongBackToHome;

})();
