// ===== SparkSuite: Play Along Pages =====
(function() {

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

  window.playAlongPage = function() {
    var h = "";
    var spotifyConnected = window.sparkCore && window.sparkCore.runtimeState && window.sparkCore.runtimeState.spotifyConnected;
    var diff = S.spotifyDifficulty || "easy";
    var demos = typeof window.getSparkPlayAlongDemos === "function" ? window.getSparkPlayAlongDemos() : [];
    var recent = getPlayAlongRecentEntries();
    var bookmarks = getPlayAlongBookmarks();
    var savedTracks = getPlayAlongSavedTracks();

    h += "<div>";
    h += "<button class='btn' onclick=\"S.screen='home';S.tab='practice';render()\">&#8592; Back</button>";
    h += "<h2 style='font-size:22px;font-weight:900;color:var(--text-primary);margin:12px 0'>Play Along</h2>";

    // Spotify connection
    h += "<div class='card' style='margin-bottom:12px'>";
    h += "<div style='display:flex;align-items:center;justify-content:space-between'>";
    h += "<span style='font-size:14px;font-weight:700;color:var(--text-primary)'>Spotify</span>";
    if (spotifyConnected) {
      h += "<span style='background:#22c55e;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700'>Connected</span>";
    } else {
      h += "<button class='btn btn-sm' onclick=\"act('spotifyConnect')\" style='font-size:12px'>Connect</button>";
    }
    h += "</div></div>";

    // Search
    h += "<input id='play-along-search' type='text' placeholder='Search any song...' class='input' oninput='sparkPlayAlongSearch(this.value)' style='width:100%;margin-bottom:8px'>";
    h += "<div id='play-along-results'></div>";

    if (savedTracks.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Saved Spotify Songs</div>";
      for (var si = 0; si < savedTracks.length; si++) {
        var saved = savedTracks[si];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (si === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(saved.title || saved.trackId || "Saved Track") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong((saved.artist || "Unknown Artist") + (saved.bpm ? " | " + saved.bpm + " BPM" : "")) + "</div>";
        h += "</div>";
        h += "<div style='display:flex;gap:6px'>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongLaunchSaved(" + si + ")'>Play</button>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongRemoveSaved(" + si + ")'>Remove</button>";
        h += "</div>";
        h += "</div>";
      }
      h += "<div style='text-align:right;margin-top:8px'><button class='btn btn-sm' onclick='sparkPlayAlongClearSaved()'>Clear Saved</button></div>";
      h += "</div>";
    }

    // Recent tracks
    if (recent.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Recent Songs</div>";
      for (var ri = 0; ri < recent.length; ri++) {
        var item = recent[ri];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (ri === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(item.title || item.trackId || "Recent Song") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong(buildPlayAlongRecentMeta(item)) + "</div>";
        h += "</div>";
        h += "<div style='display:flex;gap:6px'>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongLaunchRecent(" + ri + ")'>Replay</button>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongRemoveRecent(" + ri + ")'>Remove</button>";
        h += "</div>";
        h += "</div>";
      }
      h += "<div style='text-align:right;margin-top:8px'><button class='btn btn-sm' onclick='sparkPlayAlongClearRecent()'>Clear History</button></div>";
      h += "</div>";
    }

    if (bookmarks.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Saved Sections</div>";
      for (var bi = 0; bi < bookmarks.length; bi++) {
        var mark = bookmarks[bi];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (bi === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(mark.title || mark.trackId || "Saved Section") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong((mark.sectionLabel || "Section") + " | " + formatPlayAlongMs(mark.startMs || 0)) + "</div>";
        h += "</div>";
        h += "<div style='display:flex;gap:6px'>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongLaunchBookmark(" + bi + ")'>Jump In</button>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongRemoveBookmark(" + bi + ")'>Remove</button>";
        h += "</div>";
        h += "</div>";
      }
      h += "<div style='text-align:right;margin-top:8px'><button class='btn btn-sm' onclick='sparkPlayAlongClearBookmarks()'>Clear Bookmarks</button></div>";
      h += "</div>";
    }

    if (demos.length > 0) {
      h += "<div class='card' style='margin:12px 0'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Featured Songs</div>";
      for (var di = 0; di < demos.length; di++) {
        var demo = demos[di];
        h += "<div style='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:" + (di === 0 ? "none" : "1px solid var(--border)") + "'>";
        h += "<div>";
        h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary)'>" + escPlayAlong(demo.title || demo.trackId || "Demo Song") + "</div>";
        h += "<div style='font-size:11px;color:var(--text-muted)'>" + escPlayAlong((demo.artist || "Unknown Artist") + " | offset " + (demo.audioOffsetMs || 0) + "ms") + "</div>";
        h += "</div>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongLaunchDemo(" + di + ")'>Play</button>";
        h += "</div>";
      }
      h += "</div>";
    }

    // Difficulty selector
    h += "<div class='card' style='margin:12px 0'>";
    h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Difficulty</div>";
    h += "<div style='display:flex;gap:8px'>";
    h += "<button class='btn btn-sm" + (diff === "easy" ? "' style='background:var(--accent);color:#fff'" : "'") + " onclick=\"sparkPlayAlongSetDifficulty('easy')\">Easy</button>";
    h += "<button class='btn btn-sm" + (diff === "normal" ? "' style='background:var(--accent);color:#fff'" : "'") + " onclick=\"sparkPlayAlongSetDifficulty('normal')\">Normal</button>";
    h += "<button class='btn btn-sm" + (diff === "hard" ? "' style='background:var(--accent);color:#fff'" : "'") + " onclick=\"sparkPlayAlongSetDifficulty('hard')\">Hard</button>";
    h += "</div></div>";

    // Local file upload
    h += "<div class='card'>";
    h += "<input type='file' id='play-along-file' accept='audio/*' onchange='sparkPlayAlongLoadFile(this.files[0])'>";
    h += "<div style='color:var(--text-dim);font-size:12px;margin-top:4px'>Or drop an audio file for beat-detected charts</div>";
    h += "</div>";

    h += "</div>";
    return h;
  };

  window.playAlongSessionPage = function() {
    var h = "";
    var chart = window.sparkCore && window.sparkCore._activeChart;
    var perf = window.sparkCore && window.sparkCore.performanceTracker;
    var trackTitle = getPlayAlongTrackTitle(chart);
    var bpm = getPlayAlongBpm(chart);
    var accuracy = perf && typeof perf.getAccuracy === "function" ? Math.round(perf.getAccuracy() * 100) : 0;
    var paused = !!S.playAlongPaused;
    var drill = S.playAlongSelectedDrill || null;
    var loopRange = S.playAlongLoopRange || null;
    var loopTarget = S.playAlongLoopTarget || (drill ? "drill" : "section");
    var coachHint = S.playAlongCoachHint || "";
    var transportMode = getPlayAlongTransportMode();
    var currentSection = S.playAlongCurrentSection || "Section: Intro";
    var currentTime = formatPlayAlongMs(S.playAlongNowMs || 0);
    var sectionNav = getPlayAlongSectionNavigation(chart);

    h += "<div>";
    h += "<button class='btn' onclick='sparkPlayAlongStop()'>&#9632; Stop</button>";

    // Song info
    h += "<div style='text-align:center;margin:8px 0'>";
    h += "<div style='font-size:18px;font-weight:900;color:var(--text-primary)'>" + trackTitle + "</div>";
    h += "<div style='font-size:12px;color:var(--text-dim)'>" + bpm + " BPM</div>";
    h += "</div>";

    // Gameplay canvas
    h += "<canvas id='play-along-canvas' width='800' height='300' style='width:100%;border-radius:12px;background:#111'></canvas>";

    // Fretboard canvas
    h += "<canvas id='play-along-fretboard' width='800' height='140' style='width:100%;border-radius:8px;background:#1a1a1a;margin-top:8px'></canvas>";

    // Controls row
    h += "<div style='display:flex;align-items:center;justify-content:space-between;margin-top:8px'>";
    h += "<button class='btn btn-sm' onclick='sparkPlayAlongTogglePause()'>" + (paused ? "Resume" : "Pause") + "</button>";
    h += "<span style='font-size:12px;color:var(--text-dim)'>Speed: " + (S.playAlongSpeed || "1.0") + "x</span>";
    h += "<button class='btn btn-sm' onclick='sparkPlayAlongToggleLoop()'>Loop: " + (S.playAlongLoop ? "ON" : "OFF") + "</button>";
    h += "</div>";
    h += "<div style='display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px'>";
    h += "<span style='font-size:11px;color:var(--text-muted);background:var(--chip-bg);padding:4px 10px;border-radius:999px'>Transport: " + escPlayAlong(transportMode) + "</span>";
    h += "<span style='font-size:11px;color:var(--text-muted);background:var(--chip-bg);padding:4px 10px;border-radius:999px'>Loop Target: " + escPlayAlong(loopTarget) + "</span>";
    h += "</div>";
    h += "<div class='card' style='margin-top:10px;padding:10px 12px;text-align:left'>";
    h += "<div id='play-along-session-section' style='font-size:12px;font-weight:800;color:var(--text-primary)'>" + escPlayAlong(currentSection) + "</div>";
    h += "<div style='font-size:11px;color:var(--text-muted);margin-top:4px'>Position: <span id='play-along-session-time'>" + escPlayAlong(currentTime) + "</span></div>";
    h += "<div style='margin-top:8px'><button class='btn btn-sm' onclick='sparkPlayAlongBookmarkCurrentSection()'>Save This Section</button></div>";
    if (sectionNav.total > 1) {
      h += "<div style='display:flex;gap:8px;justify-content:space-between;margin-top:8px'>";
      h += "<button class='btn btn-sm' onclick='sparkPlayAlongPrevSection()'" + (sectionNav.hasPrev ? "" : " style='opacity:0.5'") + ">Prev Section</button>";
      h += "<span style='font-size:11px;color:var(--text-muted);align-self:center'>" + escPlayAlong(sectionNav.label) + "</span>";
      h += "<button class='btn btn-sm' onclick='sparkPlayAlongNextSection()'" + (sectionNav.hasNext ? "" : " style='opacity:0.5'") + ">Next Section</button>";
      h += "</div>";
    }
    h += "</div>";

    if (drill || chartHasPlayableSections(chart)) {
      h += "<div style='display:flex;gap:8px;justify-content:center;margin-top:8px'>";
      if (drill) {
        h += "<button class='btn btn-sm' onclick=\"sparkPlayAlongSetLoopTarget('drill')\" style='background:" + (loopTarget === "drill" ? "var(--accent)" : "var(--input-bg)") + ";color:" + (loopTarget === "drill" ? "#fff" : "var(--text-secondary)") + "'>Target: Drill</button>";
      }
      if (chartHasPlayableSections(chart)) {
        h += "<button class='btn btn-sm' onclick=\"sparkPlayAlongSetLoopTarget('section')\" style='background:" + (loopTarget === "section" ? "var(--accent)" : "var(--input-bg)") + ";color:" + (loopTarget === "section" ? "#fff" : "var(--text-secondary)") + "'>Target: Section</button>";
      }
    h += "</div>";
    }

    if (drill || loopRange) {
      h += "<div class='card' style='margin-top:10px;padding:10px 12px;text-align:left'>";
      if (drill) {
        h += "<div style='font-size:12px;font-weight:800;color:var(--text-primary);margin-bottom:4px'>Active Drill: " + escPlayAlong(drill.label || drill.focus || drill.type || "Focused Practice") + "</div>";
      }
      if (loopRange && loopRange.startMs != null && loopRange.endMs != null) {
        h += "<div style='font-size:12px;color:var(--text-dim)'>Loop Window: " + formatPlayAlongMs(loopRange.startMs) + " - " + formatPlayAlongMs(loopRange.endMs) + "</div>";
      }
      if (drill && drill.repetitions != null) {
        h += "<div id='play-along-loop-reps' style='font-size:11px;color:var(--text-muted);margin-top:4px'>" + getPlayAlongRepStatus(drill) + "</div>";
      } else if (drill || loopRange) {
        h += "<div id='play-along-loop-reps' style='font-size:11px;color:var(--text-muted);margin-top:4px'>" + getPlayAlongRepStatus(drill) + "</div>";
      }
      if (loopRange && loopRange.startMs != null && loopRange.endMs != null) {
        h += "<div id='play-along-loop-progress' style='font-size:11px;color:var(--text-muted);margin-top:4px'>Loop Progress: " + getPlayAlongLoopProgress() + "%</div>";
      }
      if (coachHint) {
        h += "<div id='play-along-coach-hint' style='font-size:11px;color:var(--accent);margin-top:6px'>" + escPlayAlong(coachHint) + "</div>";
      }
      h += "</div>";
    }

    // Score
    h += "<div style='text-align:center;margin-top:12px'>";
    h += "<div style='font-size:32px;font-weight:900;color:var(--accent)'>" + accuracy + "%</div>";
    h += "<div style='font-size:11px;color:var(--text-muted)'>Accuracy</div>";
    h += "</div>";

    // Debug toggle
    h += "<div style='text-align:right;margin-top:8px'>";
    h += "<button class='btn btn-sm' onclick='sparkPlayAlongToggleDebug()' style='opacity:0.5;font-size:11px'>Debug</button>";
    h += "</div>";

    h += "</div>";
    return h;
  };

  window.playAlongResultsPage = function() {
    var h = "";
    var outcome = window.sparkCore && window.sparkCore.lastSessionOutcome;
    var acc = asPercent(outcome && outcome.accuracy);
    var timing = asPercent(outcome && outcome.timing);
    var consistency = asPercent(outcome && outcome.consistency);
    var feedback = outcome && Array.isArray(outcome.feedback) ? outcome.feedback : [];
    var drills = outcome && Array.isArray(outcome.drills) ? outcome.drills : (outcome && outcome.drills ? [outcome.drills] : []);
    var suggestedDiff = outcome && outcome.suggestedDifficulty ? outcome.suggestedDifficulty : "";
    var suggestedMode = outcome && outcome.suggestedMode ? outcome.suggestedMode : "";
    var drillSummary = outcome && outcome.drillSummary ? outcome.drillSummary : null;
    var nextAction = getPlayAlongNextAction(outcome);
    var weakAreas = getPlayAlongWeakAreas(outcome);
    var sectionSummary = outcome && outcome.sectionSummary ? outcome.sectionSummary : null;

    h += "<div class='text-center'>";
    h += "<h2 style='font-size:22px;font-weight:900;color:var(--text-primary);margin-bottom:12px'>Session Complete</h2>";

    // Stats card
    h += "<div class='card' style='margin-bottom:12px'>";
    h += "<div style='display:flex;justify-content:center;gap:24px'>";
    h += "<div><div style='font-size:28px;font-weight:900;color:var(--accent)'>" + acc + "%</div><div style='font-size:11px;color:var(--text-muted)'>Accuracy</div></div>";
    h += "<div><div style='font-size:28px;font-weight:900;color:var(--text-primary)'>" + timing + "%</div><div style='font-size:11px;color:var(--text-muted)'>Timing</div></div>";
    h += "<div><div style='font-size:28px;font-weight:900;color:var(--text-primary)'>" + consistency + "%</div><div style='font-size:11px;color:var(--text-muted)'>Consistency</div></div>";
    h += "</div></div>";

    // Feedback messages
    if (feedback.length > 0) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left'>";
      for (var i = 0; i < feedback.length; i++) {
        h += "<div style='font-size:13px;color:var(--text-dim);padding:4px 0'>" + feedback[i] + "</div>";
      }
      h += "</div>";
    }

    if (drillSummary) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>Drill Summary</div>";
      if (drillSummary.label) {
        h += "<div style='font-size:12px;color:var(--text-dim)'>" + escPlayAlong(drillSummary.label) + "</div>";
      }
      h += "<div style='font-size:12px;color:var(--text-dim)'>Completed " + escPlayAlong(String(drillSummary.completedReps || 0)) + " of " + escPlayAlong(String(drillSummary.targetReps || 0)) + " reps</div>";
      if (drillSummary.loopWindowLabel) {
        h += "<div style='font-size:12px;color:var(--text-dim)'>Loop Window: " + escPlayAlong(drillSummary.loopWindowLabel) + "</div>";
      }
      h += "<div style='font-size:12px;color:" + (drillSummary.metTarget ? "var(--accent)" : "var(--text-muted)") + ";margin-top:4px'>" + escPlayAlong(drillSummary.metTarget ? "Target reached" : "Stopped before target") + "</div>";
      h += "</div>";
    }

    if (nextAction) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left;border:1px solid var(--accent)'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>Next Best Move</div>";
      h += "<div style='font-size:12px;color:var(--text-dim);margin-bottom:8px'>" + escPlayAlong(nextAction.message) + "</div>";
      h += "<div style='display:flex;gap:8px;flex-wrap:wrap'>";
      if (nextAction.primaryAction === "drill") {
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongReplayDrill()' style='background:var(--accent);color:#fff'>Run Drill Again</button>";
      } else if (nextAction.primaryAction === "full_song") {
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongReplayFullSong()' style='background:var(--accent);color:#fff'>Back to Full Song</button>";
      }
      h += "<button class='btn btn-sm' onclick='sparkPlayAlongReplay()'>Replay Session</button>";
      h += "</div>";
      h += "</div>";
    }

    if (weakAreas.length > 0) {
      h += "<div class='card' style='margin-bottom:12px;text-align:left'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:6px'>Where It Broke Down</div>";
      h += "<div style='font-size:12px;color:var(--text-dim)'>" + escPlayAlong(weakAreas.join(" | ")) + "</div>";
      if (sectionSummary && sectionSummary.sectionLabel) {
        h += "<div style='font-size:12px;color:var(--text-dim);margin-top:6px'>Weak section: " + escPlayAlong(sectionSummary.sectionLabel) + "</div>";
      }
      h += "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:8px'>";
      if (sectionSummary) {
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongJumpToWeakSection()'>Jump To Weak Section</button>";
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongBookmarkCurrentSection()'>Save Weak Section</button>";
      }
      h += "</div>";
      h += "</div>";
    }

    // Heatmap canvas
    h += "<canvas id='play-along-heatmap' width='800' height='60' style='width:100%;border-radius:8px;background:#111'></canvas>";

    // Drills section
    if (drills.length > 0) {
      h += "<div class='card' style='margin:12px 0;text-align:left'>";
      h += "<div style='font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px'>Suggested Drills</div>";
      for (var j = 0; j < drills.length; j++) {
        h += "<button class='btn btn-sm' onclick='sparkPlayAlongStartDrill(" + j + ")' style='margin:2px 4px 2px 0'>Fix This: " + (drills[j].label || drills[j]) + "</button>";
      }
      h += "</div>";
    }

    // RL suggestion
    if (suggestedDiff || suggestedMode) {
      h += "<div style='font-size:12px;color:var(--text-dim);margin:8px 0'>";
      if (suggestedDiff) {
        h += "Suggested difficulty: <strong style='color:var(--text-primary)'>" + suggestedDiff + "</strong> ";
      }
      if (suggestedMode) {
        h += "Mode: <strong style='color:var(--text-primary)'>" + suggestedMode + "</strong>";
      }
      h += "</div>";
    }

    // Action buttons
    h += "<div style='display:flex;gap:8px;justify-content:center;margin-top:16px'>";
    h += "<button class='btn' onclick='sparkPlayAlongReplay()' style='background:var(--accent);color:#fff'>Play Again</button>";
    h += "<button class='btn' onclick='sparkPlayAlongPickNew()'>Pick New Song</button>";
    h += "</div>";

    h += "</div>";
    return h;
  };

  function asPercent(value) {
    if (typeof value !== "number") return 0;
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }

  function getPlayAlongTrackTitle(chart) {
    if (!chart) return "Unknown Track";
    if (chart.songChart && chart.songChart.song && chart.songChart.song.title) return chart.songChart.song.title;
    if (chart.title) return chart.title;
    if (chart.trackId) return chart.trackId;
    return "Unknown Track";
  }

  function getPlayAlongBpm(chart) {
    if (!chart) return "--";
    if (typeof chart.getBpm === "function") return Math.round(chart.getBpm());
    if (chart.bpm) return chart.bpm;
    return "--";
  }

  function chartHasPlayableSections(chart) {
    return !!(chart && Array.isArray(chart.sections) && chart.sections.length);
  }

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

  function getPlayAlongRepStatus(drill) {
    var current = Math.max(1, Number(S.playAlongLoopIteration || (drill ? 1 : 0) || 1));
    var target = drill && drill.repetitions != null ? drill.repetitions : null;
    return target != null ? ("Rep " + current + " / " + target) : ("Rep " + current);
  }

  function getPlayAlongLoopProgress() {
    return Math.max(0, Math.min(100, Number(S.playAlongLoopProgress || 0)));
  }

  function getPlayAlongRecentEntries() {
    return Array.isArray(S.playAlongRecent) ? S.playAlongRecent : [];
  }

  function getPlayAlongBookmarks() {
    return Array.isArray(S.playAlongBookmarks) ? S.playAlongBookmarks : [];
  }

  function getPlayAlongSavedTracks() {
    return Array.isArray(S.spotifySavedTracks) ? S.spotifySavedTracks : [];
  }

  function buildPlayAlongRecentMeta(item) {
    var bits = [];
    if (item.artist) bits.push(item.artist);
    if (item.transportMode) bits.push(item.transportMode);
    if (item.difficulty) bits.push(item.difficulty);
    return bits.join(" | ");
  }

  function getPlayAlongTransportMode() {
    var runtimeState = window.sparkCore && window.sparkCore.runtimeState ? window.sparkCore.runtimeState : null;
    return runtimeState && runtimeState.playAlongTransportMode ? runtimeState.playAlongTransportMode : "generated";
  }

  function getPlayAlongNextAction(outcome) {
    if (!outcome) return null;
    var drillSummary = outcome.drillSummary || null;
    if (drillSummary) {
      if (drillSummary.metTarget) {
        return {
          primaryAction: "full_song",
          message: "The drill target is complete. Take the same section back into the full-song run while the timing is fresh."
        };
      }
      return {
        primaryAction: "drill",
        message: "Stay on the focused loop until the target reps are clean and consistent."
      };
    }
    if (typeof outcome.accuracy === "number" && outcome.accuracy < 0.75) {
      return {
        primaryAction: "drill",
        message: "Accuracy is still a bit low. Use a focused drill next instead of another full-song attempt."
      };
    }
    return {
      primaryAction: "full_song",
      message: "You are in a good spot to run the song again at full length."
    };
  }

  function getPlayAlongWeakAreas(outcome) {
    var performance = outcome && outcome.performance ? outcome.performance : null;
    var weakAreas = performance && Array.isArray(performance.weakAreas) ? performance.weakAreas : [];
    var labels = [];
    for (var i = 0; i < weakAreas.length; i++) {
      var value = weakAreas[i];
      if (!value) continue;
      if (String(value).indexOf("lane_") === 0) {
        labels.push("Lane " + (Number(String(value).split("_")[1]) + 1));
      } else {
        labels.push(String(value).replace(/_/g, " "));
      }
    }
    return labels;
  }

  function getPlayAlongSectionNavigation(chart) {
    var sections = chart && Array.isArray(chart.sections) ? chart.sections : [];
    var index = Number(S.playAlongSectionIndex || 0);
    if (!sections.length) {
      return { total: 0, label: "", hasPrev: false, hasNext: false };
    }
    if (!isFinite(index) || index < 0) index = 0;
    if (index >= sections.length) index = sections.length - 1;
    var current = sections[index] || {};
    return {
      total: sections.length,
      label: "Section " + (index + 1) + " of " + sections.length + ": " + (current.name || ("Part " + (index + 1))),
      hasPrev: index > 0,
      hasNext: index < sections.length - 1
    };
  }

})();
