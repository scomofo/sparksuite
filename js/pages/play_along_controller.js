// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {

  var LANE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFE66D", "#96CEB4"];
  var HIT_LINE_X = 100;
  var PX_PER_MS = 0.3;
  var NOTE_WIDTH = 30;
  var NOTE_HEIGHT = 50;
  var LANE_HEIGHT = 60;
  var LANE_OFFSET_Y = 10;

  // ---- Search ----

  window.sparkPlayAlongSearch = function(query) {
    var resultsEl = document.getElementById("play-along-results");
    if (!query || query.length < 2) {
      if (resultsEl) resultsEl.innerHTML = "";
      window._playAlongResults = [];
      return;
    }
    if (!window.sparkCore || !window.sparkCore.spotifySearch) return;

    window.sparkCore.spotifySearch.searchDebounced(query, function(tracks) {
      window._playAlongResults = tracks || [];
      var html = "";
      for (var i = 0; i < window._playAlongResults.length; i++) {
        var t = window._playAlongResults[i];
        var name = escapeForAttr(t.name || "");
        var artist = escapeForAttr(t.artist || "");
        var imgTag = t.image
          ? "<img src=\"" + escapeForAttr(t.image) + "\" width=\"40\" height=\"40\" class=\"song-item-art\"/>"
          : "";
        html += "<div class=\"song-item\" onclick=\"sparkPlayAlongSelect(" + i + ")\">"
          + imgTag
          + "<div class=\"song-item-info\">"
          + "<strong class=\"song-item-name\">" + name + "</strong>"
          + "<span class=\"song-item-artist\">" + artist + "</span>"
          + "</div></div>";
      }
      if (resultsEl) resultsEl.innerHTML = html;
    });
  };

  // ---- Select Track ----

  window.sparkPlayAlongSelect = function(index) {
    var track = window._playAlongResults && window._playAlongResults[index];
    if (!track) return;
    var difficulty = S.spotifyDifficulty || "easy";
    if (!window.sparkCore) return;

    window.sparkCore.startPlayAlongSession({
      trackId: track.id,
      difficulty: difficulty,
      instrument: "guitar"
    }).then(function() {
      S.screen = SCR.PLAY_ALONG_SESSION;
      render();
      sparkPlayAlongStartLoop();
    });
  };

  // ---- Set Difficulty ----

  window.sparkPlayAlongSetDifficulty = function(level) {
    S.spotifyDifficulty = level;
    if (window.sparkCore) {
      window.sparkCore.updateRuntimeState({ spotifyDifficulty: level });
    }
    render();
  };

  // ---- Load Local File ----

  window.sparkPlayAlongLoadFile = function(file) {
    if (!file) return;
    if (!window.sparkCore) return;

    window.sparkCore.startPlayAlongSession({
      audioFile: file,
      difficulty: S.spotifyDifficulty || "easy",
      instrument: "guitar"
    }).then(function() {
      S.screen = SCR.PLAY_ALONG_SESSION;
      render();
      sparkPlayAlongStartLoop();
    });
  };

  // ---- Game Loop ----

  window.sparkPlayAlongStartLoop = function() {
    if (window._playAlongAnimFrame) {
      cancelAnimationFrame(window._playAlongAnimFrame);
    }

    function loop() {
      if (!window.sparkCore) return;

      var result = window.sparkCore.processPlayAlongFrame();

      if (result) {
        renderHighway(result);
        renderFretboard(result);
        updateDebugState(result);
      }

      window._playAlongAnimFrame = requestAnimationFrame(loop);
    }

    window._playAlongAnimFrame = requestAnimationFrame(loop);
  };

  // ---- Highway Renderer ----

  function renderHighway(result) {
    var canvas = document.getElementById("play-along-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = canvas.width;
    var h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Hit line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HIT_LINE_X, 0);
    ctx.lineTo(HIT_LINE_X, h);
    ctx.stroke();

    // Draw visible notes
    var notes = result.visibleNotes || result.notes || [];
    var currentTimeMs = result.currentTimeMs || result.time || 0;

    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      var x = HIT_LINE_X + (note.time - currentTimeMs) * PX_PER_MS;
      var lane = note.lane || 0;
      var y = lane * LANE_HEIGHT + LANE_OFFSET_Y;
      var color = LANE_COLORS[lane] || LANE_COLORS[0];

      ctx.fillStyle = color;
      ctx.fillRect(x, y, NOTE_WIDTH, NOTE_HEIGHT);
    }
  }

  // ---- Fretboard Renderer ----

  function renderFretboard(result) {
    var canvas = document.getElementById("play-along-fretboard");
    if (!canvas) return;
    if (window.sparkFretboardRenderer && typeof window.sparkFretboardRenderer.draw === "function") {
      window.sparkFretboardRenderer.draw(canvas, result);
    }
  }

  // ---- Debug State ----

  function updateDebugState(result) {
    if (typeof SparkDebugState !== "undefined" && SparkDebugState.update) {
      SparkDebugState.update(result);
    }
  }

  // ---- Stop ----

  window.sparkPlayAlongStop = function() {
    if (window._playAlongAnimFrame) {
      cancelAnimationFrame(window._playAlongAnimFrame);
      window._playAlongAnimFrame = null;
    }
    if (window.sparkCore) {
      window.sparkCore.completePlayAlongSession();
    }
    S.screen = SCR.PLAY_ALONG_RESULTS;
    render();

    // Draw heatmap after render
    setTimeout(function() {
      var heatmapCanvas = document.getElementById("play-along-heatmap");
      if (heatmapCanvas && window.sparkCore && window.sparkCore.drawHeatmap) {
        window.sparkCore.drawHeatmap(heatmapCanvas);
      }
    }, 0);
  };

  // ---- Toggle Debug ----

  window.sparkPlayAlongToggleDebug = function() {
    window._playAlongDebug = !window._playAlongDebug;

    if (window._playAlongDebug && typeof SparkDebugDashboard !== "undefined") {
      window._playAlongDashboard = new SparkDebugDashboard(document.body);
      window._playAlongDashboard.show();
    } else if (!window._playAlongDebug && window._playAlongDashboard) {
      window._playAlongDashboard.hide();
    }
  };

  // ---- Play Again ----

  window.sparkPlayAlongAgain = function() {
    if (window.sparkCore && window.sparkCore._activeParams) {
      window.sparkCore.startPlayAlongSession(window.sparkCore._activeParams).then(function() {
        S.screen = SCR.PLAY_ALONG_SESSION;
        render();
        sparkPlayAlongStartLoop();
      });
    } else {
      S.screen = SCR.PLAY_ALONG;
      render();
    }
  };

  // ---- Navigation Helper ----

  window.openPlayAlong = function() {
    S.screen = SCR.PLAY_ALONG;
    render();
  };

  // ---- Utility ----

  function escapeForAttr(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

})();
