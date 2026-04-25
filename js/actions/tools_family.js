(function() {
  function applyToolsFamilyRuntimeUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function setLegacyFields(setFields, clearIntervals, save) {
    applyToolsFamilyRuntimeUpdate({
      setFields: setFields,
      clearIntervals: clearIntervals || [],
      save: save
    }, function() {
      var key;
      for (key in setFields) {
        if (Object.prototype.hasOwnProperty.call(setFields, key)) S[key] = setFields[key];
      }
      if (Array.isArray(clearIntervals)) {
        clearIntervals.forEach(function(name) {
          if (T && T[name]) clearInterval(T[name]);
        });
      }
    });
  }

  function openLegacySongSelection(songData, source) {
    openSongSessionRequest({ songData: songData, source: source });
    setLegacyFields(
      { selectedSong: songData, songPlaying: false, songBeat: 0, screen: SCR.SONG },
      ["song"]
    );
    render();
  }

  function handleToolsAction(a, v) {
    if (a === "dualChord") {
      S.dualChord = v;
      render();
      return true;
    }

    if (a === "toggleAnchor") {
      S.dualAnchorOn = !S.dualAnchorOn;
      render();
      return true;
    }

    if (a === "dualPreview") {
      strumChord(v);
      render();
      return true;
    }

    if (a === "setGoal") {
      var goal = parseInt(v, 10);
      if (goal >= 1 && goal <= 60) {
        S.dailyGoalMinutes = goal;
        saveState();
        render();
      }
      return true;
    }

    if (a === "newSet") {
      S.editingSet = true;
      S.editingSetIdx = -1;
      S.customSetName = "";
      S.customSetChords = [];
      render();
      return true;
    }

    if (a === "setName") {
      S.customSetName = v;
      return true;
    }

    if (a === "toggleSetChord") {
      var setIdx = S.customSetChords.indexOf(v);
      if (setIdx === -1) S.customSetChords.push(v);
      else S.customSetChords.splice(setIdx, 1);
      render();
      return true;
    }

    if (a === "saveSet") {
      if (S.customSetChords.length < 2 || !S.customSetName.trim()) return true;
      var setObj = { name: S.customSetName.trim(), chords: S.customSetChords.slice() };
      if (S.editingSetIdx >= 0 && S.editingSetIdx < S.customSets.length) {
        S.customSets[S.editingSetIdx] = setObj;
      } else {
        S.customSets.push(setObj);
      }
      S.editingSet = false;
      S.editingSetIdx = -1;
      S.customSetName = "";
      S.customSetChords = [];
      saveState();
      render();
      return true;
    }

    if (a === "cancelSet") {
      S.editingSet = false;
      S.editingSetIdx = -1;
      S.customSetName = "";
      S.customSetChords = [];
      render();
      return true;
    }

    if (a === "editSet") {
      var editIdx = parseInt(v, 10);
      if (editIdx >= 0 && editIdx < S.customSets.length) {
        var customSet = S.customSets[editIdx];
        S.editingSet = true;
        S.editingSetIdx = editIdx;
        S.customSetName = customSet.name;
        S.customSetChords = customSet.chords.slice();
        render();
      }
      return true;
    }

    if (a === "deleteSet") {
      var deleteIdx = parseInt(v, 10);
      if (deleteIdx >= 0 && deleteIdx < S.customSets.length) {
        S.customSets.splice(deleteIdx, 1);
        saveState();
        render();
      }
      return true;
    }

    if (a === "rhythmBpm") {
      var rhythmBpm = parseInt(v, 10);
      if (rhythmBpm >= 60 && rhythmBpm <= 200) {
        S.rhythmBpm = rhythmBpm;
        render();
      }
      return true;
    }

    if (a === "startRhythm") {
      var ms = 60000 / S.rhythmBpm;
      var beats = [];
      var patterns = [["D", "U", "D", "U"], ["D", "D", "U", "D"], ["D", "U", "D", "U", "D", "U", "D", "U"]];
      var pat = patterns[Math.floor(Math.random() * patterns.length)];
      var r;
      var i;
      for (r = 0; r < 4; r++) {
        for (i = 0; i < pat.length; i++) {
          beats.push({ time: (r * pat.length + i) * ms / 2, type: pat[i], hit: false, result: null });
        }
      }
      setLegacyFields({
        rhythmBeats: beats,
        rhythmScore: 0,
        rhythmCombo: 0,
        rhythmMaxCombo: 0,
        rhythmActive: true,
        rhythmResults: null,
        rhythmStartTime: performance.now()
      });
      openLegacyRhythmGameRequest({
        beats: beats,
        score: 0,
        combo: 0,
        maxCombo: 0,
        startTimeMs: S.rhythmStartTime
      });
      render();
      _rhythmAnim = requestAnimationFrame(rhythmTick);
      return true;
    }

    if (a === "rhythmResultsReplay") {
      S.rhythmResults = null;
      return handleToolsAction("startRhythm");
    }

    if (a === "rhythmResultsBack") {
      S.rhythmResults = null;
      render();
      return true;
    }

    if (a === "rhythmTap" && S.rhythmActive) {
      var now = performance.now() - S.rhythmStartTime;
      var closest = null;
      var closestDiff = 999999;
      for (var rhythmIdx = 0; rhythmIdx < S.rhythmBeats.length; rhythmIdx++) {
        var rhythmBeat = S.rhythmBeats[rhythmIdx];
        if (rhythmBeat.hit) continue;
        var diff = Math.abs(now - rhythmBeat.time);
        if (diff < closestDiff) {
          closestDiff = diff;
          closest = rhythmIdx;
        }
      }
      if (closest !== null && closestDiff < 300) {
        var beat = S.rhythmBeats[closest];
        beat.hit = true;
        if (closestDiff < 50) {
          beat.result = "perfect";
          S.rhythmScore += 100 * (1 + Math.floor(S.rhythmCombo / 5));
          S.rhythmCombo++;
          snd("correct");
        } else if (closestDiff < 100) {
          beat.result = "good";
          S.rhythmScore += 50 * (1 + Math.floor(S.rhythmCombo / 5));
          S.rhythmCombo++;
          snd("click");
        } else {
          beat.result = "ok";
          S.rhythmScore += 25;
          S.rhythmCombo = 0;
        }
        if (S.rhythmCombo > S.rhythmMaxCombo) S.rhythmMaxCombo = S.rhythmCombo;
      } else {
        S.rhythmCombo = 0;
        snd("wrong");
      }
      syncLegacyRhythmRuntimeRequest({
        active: S.rhythmActive,
        beats: S.rhythmBeats,
        score: S.rhythmScore,
        combo: S.rhythmCombo,
        maxCombo: S.rhythmMaxCombo,
        startTimeMs: S.rhythmStartTime
      });
      render();
      return true;
    }

    if (a === "progPickerToggle") {
      S.progPickerOpen = !S.progPickerOpen;
      render();
      return true;
    }

    if (a === "progAdd") {
      S.progChords.push(v);
      S.progPickerOpen = false;
      render();
      return true;
    }

    if (a === "progRemove") {
      var progRemoveIdx = parseInt(v, 10);
      if (progRemoveIdx >= 0 && progRemoveIdx < S.progChords.length) {
        S.progChords.splice(progRemoveIdx, 1);
        render();
      }
      return true;
    }

    if (a === "progMove") {
      var parts = v.split(":");
      var progIdx = parseInt(parts[0], 10);
      var dir = parts[1];
      if (dir === "left" && progIdx > 0) {
        var left = S.progChords[progIdx];
        S.progChords[progIdx] = S.progChords[progIdx - 1];
        S.progChords[progIdx - 1] = left;
      } else if (dir === "right" && progIdx < S.progChords.length - 1) {
        var right = S.progChords[progIdx];
        S.progChords[progIdx] = S.progChords[progIdx + 1];
        S.progChords[progIdx + 1] = right;
      }
      render();
      return true;
    }

    if (a === "progTemplate") {
      var templateIdx = parseInt(v, 10);
      if (templateIdx >= 0 && templateIdx < COMMON_PROGRESSIONS.length) {
        S.progChords = COMMON_PROGRESSIONS[templateIdx].chords.slice();
        render();
      }
      return true;
    }

    if (a === "progBpm") {
      var progressionBpm = parseInt(v, 10);
      if (progressionBpm >= 40 && progressionBpm <= 200) {
        S.progBpm = progressionBpm;
        if (S.progPlaying) {
          clearInterval(T.prog);
          var progMs = 60000 / progressionBpm;
          T.prog = setInterval(function() {
            S.progBeat = (S.progBeat + 1) % S.progChords.length;
            strumChord(S.progChords[S.progBeat]);
            render();
          }, progMs);
        }
        render();
      }
      return true;
    }

    if (a === "progPlay") {
      if (S.progChords.length < 2) return true;
      if (S.progPlaying) {
        S.progPlaying = false;
        clearInterval(T.prog);
        render();
      } else {
        S.progPlaying = true;
        S.progBeat = 0;
        strumChord(S.progChords[0]);
        var playMs = 60000 / S.progBpm;
        T.prog = setInterval(function() {
          S.progBeat = (S.progBeat + 1) % S.progChords.length;
          strumChord(S.progChords[S.progBeat]);
          render();
        }, playMs);
        render();
      }
      return true;
    }

    if (a === "progClear") {
      if (S.progPlaying) {
        S.progPlaying = false;
        clearInterval(T.prog);
      }
      S.progChords = [];
      render();
      return true;
    }

    if (a === "exportProgress") {
      var data = { version: "3.1", exportDate: new Date().toISOString(), data: {} };
      for (var exportIdx = 0; exportIdx < PERSIST_FIELDS.length; exportIdx++) {
        data.data[PERSIST_FIELDS[exportIdx]] = S[PERSIST_FIELDS[exportIdx]];
      }
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "chordspark-backup.json";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      S.importMsg = { ok: true, text: "Progress exported!" };
      render();
      setTimeout(function() {
        S.importMsg = null;
        render();
      }, 3000);
      return true;
    }

    if (a === "importProgress") {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          try {
            var imported = JSON.parse(ev.target.result);
            if (!imported.data || typeof imported.data !== "object") throw new Error("Invalid format");
            var typeChecks = {
              xp: "number", streak: "number", sessions: "number", drillCount: "number",
              dailyDone: "number", quizCorrect: "number", songsPlayed: "number",
              level: "number", soundOn: "boolean", darkMode: "boolean",
              selectedLevel: "number", earTrainScore: "number",
              dailyGoalMinutes: "number", todayPracticeSeconds: "number",
              goalReachedToday: "boolean", goalStreak: "number", focusMode: "boolean",
              runnerHighScore: "number"
            };
            var arrayFields = ["history", "customSets", "earnedBadges", "importedSongs"];
            var objectFields = ["chordProgress", "transitionStats"];
            for (var key in imported.data) {
              if (PERSIST_FIELDS.indexOf(key) === -1) continue;
              var val = imported.data[key];
              if (typeChecks[key] && typeof val !== typeChecks[key]) continue;
              if (arrayFields.indexOf(key) !== -1 && !Array.isArray(val)) continue;
              if (objectFields.indexOf(key) !== -1 && (typeof val !== "object" || val === null || Array.isArray(val))) continue;
              S[key] = val;
            }
            if (!Array.isArray(S.history)) S.history = [];
            if (!Array.isArray(S.customSets)) S.customSets = [];
            if (!Array.isArray(S.importedSongs)) S.importedSongs = [];
            if (typeof SparkTransitionStats !== "undefined") SparkTransitionStats.ensureShape();
            else if (typeof S.transitionStats !== "object" || S.transitionStats === null) S.transitionStats = {};
            saveState();
            S.importMsg = { ok: true, text: "Progress imported successfully!" };
          } catch (err) {
            S.importMsg = { ok: false, text: "Invalid backup file: " + (err.message || "unknown error") };
          }
          render();
          setTimeout(function() {
            S.importMsg = null;
            render();
          }, 3000);
        };
        reader.readAsText(file);
      };
      input.click();
      return true;
    }

    if (a === "importText") {
      S.importText = v;
      return true;
    }

    if (a === "parseImport") {
      var result = parseChordSheet(S.importText);
      if (result.error) {
        S.importedSong = null;
        S.importError = result.error;
      } else {
        S.importedSong = {
          title: "Imported Song",
          artist: "Unknown",
          chords: result.chords,
          progression: result.progression,
          bpm: 100,
          level: 1,
          pattern: ["D", "D", "U", "U", "D", "U"]
        };
        S.importError = null;
      }
      render();
      return true;
    }

    if (a === "importTitle") {
      if (S.importedSong) S.importedSong.title = v;
      return true;
    }

    if (a === "importArtist") {
      if (S.importedSong) S.importedSong.artist = v;
      return true;
    }

    if (a === "importBpm") {
      if (S.importedSong) S.importedSong.bpm = parseInt(v, 10) || 100;
      return true;
    }

    if (a === "saveImport") {
      if (!S.importedSong) return true;
      S.importedSongs.push(JSON.parse(JSON.stringify(S.importedSong)));
      S.importedSong = null;
      S.importText = "";
      S.importError = null;
      saveState();
      render();
      return true;
    }

    if (a === "deleteImport") {
      var importedIdx = parseInt(v, 10);
      if (importedIdx >= 0 && importedIdx < S.importedSongs.length) {
        S.importedSongs.splice(importedIdx, 1);
        saveState();
        render();
      }
      return true;
    }

    if (a === "playImport") {
      var playImportIdx = parseInt(v, 10);
      if (playImportIdx >= 0 && playImportIdx < S.importedSongs.length) {
        openLegacySongSelection(S.importedSongs[playImportIdx], "imported");
      }
      return true;
    }

    if (a === "communityTab") {
      S.communityTab = v;
      applySongBrowserRequest("community_tab", { communityTab: S.communityTab });
      render();
      return true;
    }

    if (a === "communitySearch") {
      S.communitySearch = v;
      applySongBrowserRequest("community_search", { communitySearch: S.communitySearch });
      fetchCommunity();
      render();
      return true;
    }

    if (a === "communitySort") {
      S.communitySort = v;
      applySongBrowserRequest("community_sort", { communitySort: S.communitySort });
      fetchCommunity();
      return true;
    }

    if (a === "voteSong") {
      fetch(COMMUNITY_URL + "/api/songs/" + v + "/vote", { method: "POST" }).then(function() {
        fetchCommunity();
      }).catch(function() {});
      return true;
    }

    if (a === "playCommunity") {
      var song = null;
      for (var communityIdx = 0; communityIdx < S.communitySongs.length; communityIdx++) {
        if (S.communitySongs[communityIdx].id == v) song = S.communitySongs[communityIdx];
      }
      if (!song) return true;
      try {
        var parsed = {
          title: song.title,
          artist: song.artist,
          bpm: song.bpm || 100,
          level: 1,
          chords: JSON.parse(song.chords),
          progression: JSON.parse(song.progression),
          pattern: JSON.parse(song.pattern || "[\"D\",\"D\",\"U\",\"U\",\"D\",\"U\"]")
        };
        if (!Array.isArray(parsed.chords) || !Array.isArray(parsed.progression)) throw new Error("Invalid song data");
        openLegacySongSelection(parsed, "community");
      } catch (e) {
        console.warn("ChordSpark: Failed to parse community song:", e.message);
        S.communityError = "Could not load song: invalid data";
        render();
      }
      return true;
    }

    if (a === "submitField") {
      var sep = v.indexOf(":");
      var field = v.substring(0, sep);
      var val = v.substring(sep + 1);
      if (field === "bpm") S.submitSong.bpm = parseInt(val, 10) || 100;
      else S.submitSong[field] = val;
      return true;
    }

    if (a === "submitToggleChord") {
      var submitIdx = S.submitSong.chords.indexOf(v);
      if (submitIdx === -1) {
        S.submitSong.chords.push(v);
        S.submitSong.progression.push(v);
      } else {
        S.submitSong.chords.splice(submitIdx, 1);
      }
      render();
      return true;
    }

    if (a === "submitClearProg") {
      S.submitSong.progression = [];
      render();
      return true;
    }

    if (a === "submitSong") {
      var ss = S.submitSong;
      if (!ss.title.trim() || !ss.artist.trim() || ss.chords.length < 2 || ss.progression.length < 2) return true;
      var _title = ss.title.trim().slice(0, 100);
      var _artist = ss.artist.trim().slice(0, 100);
      var _submittedBy = (ss.submittedBy.trim() || "Anonymous").slice(0, 50);
      var _bpm = Math.max(40, Math.min(200, Number(ss.bpm) || 100));
      var body = {
        title: escHTML(_title),
        artist: escHTML(_artist),
        chords: JSON.stringify(ss.chords),
        progression: JSON.stringify(ss.progression),
        pattern: JSON.stringify(["D", "D", "U", "U", "D", "U"]),
        bpm: _bpm,
        level: 1,
        submitted_by: _submittedBy
      };
      fetch(COMMUNITY_URL + "/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function(r) {
        return r.json();
      }).then(function() {
        S.submitSong = { title: "", artist: "", chords: [], progression: [], bpm: 100, pattern: [], submittedBy: "" };
        S.communityTab = "browse";
        fetchCommunity();
      }).catch(function() {
        S.communityError = "Failed to submit song";
        render();
      });
      return true;
    }

    if (a === "startRunner") {
      var av = CHORDS[S.level] || CHORDS[1];
      var runnerTarget = av[Math.floor(Math.random() * av.length)];
      setLegacyFields({
        runnerTarget: runnerTarget,
        runnerActive: true,
        runnerScore: 0,
        runnerCombo: 0,
        runnerMaxCombo: 0,
        runnerLives: 3,
        runnerObstacles: [],
        runnerSpeed: 2,
        runnerDistance: 0,
        runnerResults: null,
        runnerStartTime: Date.now(),
        runnerLastSpawn: 0
      });
      openLegacyRunnerGameRequest({
        targetName: runnerTarget ? runnerTarget.name : null,
        score: 0,
        combo: 0,
        maxCombo: 0,
        lives: 3,
        distance: 0,
        obstacles: []
      });
      _runnerObstId = 0;
      snd("start");
      render();
      _runnerAnim = requestAnimationFrame(runnerTick);
      return true;
    }

    if (a === "runnerResultsReplay") {
      S.runnerResults = null;
      return handleToolsAction("startRunner");
    }

    if (a === "runnerResultsBack") {
      S.runnerResults = null;
      render();
      return true;
    }

    if (a === "runnerStrum" && S.runnerActive) {
      var closestObstacle = null;
      var closestDist = 999;
      for (var obstacleIdx = 0; obstacleIdx < S.runnerObstacles.length; obstacleIdx++) {
        var obstacle = S.runnerObstacles[obstacleIdx];
        if (obstacle.hit) continue;
        var obstacleDist = Math.abs(obstacle.x - 60);
        if (obstacleDist < closestDist && obstacle.x > 0 && obstacle.x < 140) {
          closestDist = obstacleDist;
          closestObstacle = obstacleIdx;
        }
      }
      if (closestObstacle !== null) {
        var targetObstacle = S.runnerObstacles[closestObstacle];
        targetObstacle.hit = true;
        if (targetObstacle.isTarget) {
          S.runnerCombo++;
          if (S.runnerCombo > S.runnerMaxCombo) S.runnerMaxCombo = S.runnerCombo;
          var pts = 100 * (1 + Math.floor(S.runnerCombo / 5));
          S.runnerScore += pts;
          targetObstacle.result = "correct";
          snd("correct");
          if (S.runnerCombo % 5 === 0 && S.runnerCombo > 0) changeRunnerTarget();
        } else {
          S.runnerLives--;
          S.runnerCombo = 0;
          targetObstacle.result = "wrong";
          snd("wrong");
          if (S.runnerLives <= 0) {
            finishRunner();
            return true;
          }
        }
      } else {
        S.runnerCombo = 0;
      }
      syncLegacyRunnerRuntimeRequest({
        active: S.runnerActive,
        targetName: S.runnerTarget ? S.runnerTarget.name : null,
        score: S.runnerScore,
        combo: S.runnerCombo,
        maxCombo: S.runnerMaxCombo,
        lives: S.runnerLives,
        distance: Math.floor(S.runnerDistance / 100),
        obstacles: S.runnerObstacles
      });
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("tools", handleToolsAction);
})();
