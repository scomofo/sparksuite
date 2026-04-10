// ===== SparkSuite: Play Along Pages =====
(function() {

  window.playAlongPage = function() {
    var h = "";
    var spotifyConnected = window.sparkCore && window.sparkCore.runtimeState && window.sparkCore.runtimeState.spotifyConnected;
    var diff = S.spotifyDifficulty || "easy";

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

    // Recent tracks
    h += "<div id='play-along-recent'></div>";

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
    var trackTitle = chart && chart.title ? chart.title : "Unknown Track";
    var bpm = chart && chart.bpm ? chart.bpm : "--";
    var accuracy = perf && typeof perf.accuracy === "number" ? Math.round(perf.accuracy) : 0;

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
    h += "<button class='btn btn-sm' onclick='sparkPlayAlongTogglePause()'>Pause/Play</button>";
    h += "<span style='font-size:12px;color:var(--text-dim)'>Speed: " + (S.playAlongSpeed || "1.0") + "x</span>";
    h += "<button class='btn btn-sm' onclick='sparkPlayAlongToggleLoop()'>Loop: " + (S.playAlongLoop ? "ON" : "OFF") + "</button>";
    h += "</div>";

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
    var acc = outcome && typeof outcome.accuracy === "number" ? Math.round(outcome.accuracy) : 0;
    var timing = outcome && typeof outcome.timing === "number" ? Math.round(outcome.timing) : 0;
    var consistency = outcome && typeof outcome.consistency === "number" ? Math.round(outcome.consistency) : 0;
    var feedback = outcome && Array.isArray(outcome.feedback) ? outcome.feedback : [];
    var drills = outcome && Array.isArray(outcome.drills) ? outcome.drills : [];
    var suggestedDiff = outcome && outcome.suggestedDifficulty ? outcome.suggestedDifficulty : "";
    var suggestedMode = outcome && outcome.suggestedMode ? outcome.suggestedMode : "";

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

})();
