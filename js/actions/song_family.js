(function() {
  function getSongFamilyCoreRuntimeState() {
    var core = (typeof window !== "undefined" && window.sparkCore)
      || (typeof sparkCore !== "undefined" ? sparkCore : null);
    return core && typeof core.getRuntimeState === "function" ? core.getRuntimeState() : null;
  }

  function applySongFamilyRuntimeUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function applySongFamilyCompletionUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityCompletion === "function") {
      SparkProgressBridge.applyLegacyActivityCompletion(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function applySongFamilyNavigation(target, options) {
    if (typeof applySongNavigationRequest === "function") {
      applySongNavigationRequest(target, options || {});
      return true;
    }
    return false;
  }

  function handleSongAction(a, v) {
    if (a === "songsSubTab") {
      applySongFamilyRuntimeUpdate({ setFields: { songsSubTab: v } }, function() {
        S.songsSubTab = v;
      });
      applySongBrowserRequest("songs_subtab", { songsSubTab: v });

      render();
      return true;
    }

    if (a === "toggleSong") {
      var nextSongPlaying;
      var selectedSong;
      var runtimeState;
      snd("click");
      nextSongPlaying = !S.songPlaying;
      selectedSong = S.selectedSong;
      runtimeState = getSongFamilyCoreRuntimeState();
      syncSongRuntimeRequest(nextSongPlaying ? "play" : "pause", {
        songData: selectedSong,
        source: runtimeState ? runtimeState.songSessionSource : "builtin",
        songBeat: nextSongPlaying ? 0 : S.songBeat
      });
      applySongFamilyRuntimeUpdate({
        setFields: nextSongPlaying ? { songPlaying: true, songBeat: 0 } : { songPlaying: false },
        clearIntervals: nextSongPlaying ? [] : ["song"]
      }, function() {
        S.songPlaying = nextSongPlaying;
        if (S.songPlaying) S.songBeat = 0;
        else clearInterval(T.song);
      });
      if (nextSongPlaying && selectedSong && Array.isArray(selectedSong.progression) && selectedSong.progression.length) {
        var currentBeat = 0;
        var ms = 60000 / selectedSong.bpm;
        var chordName = selectedSong.progression[0];
        strumChord(CHORD_NAME_MAP[chordName] || chordName);
        render();
        T.song = setInterval(function() {
          var nextChordName;
          currentBeat = (currentBeat + 1) % selectedSong.progression.length;
          applySongFamilyRuntimeUpdate({
            setFields: { songBeat: currentBeat },
            save: false
          }, function() {
            S.songBeat = currentBeat;
          });
          syncSongRuntimeRequest("tick", { songBeat: currentBeat });
          nextChordName = selectedSong.progression[currentBeat];
          strumChord(CHORD_NAME_MAP[nextChordName] || nextChordName);
          render();
        }, ms);
      } else {
        render();
      }
      return true;
    }

    if (a === "setCapoMode") {
      var capoFret = typeof SparkCapoMode !== "undefined" && SparkCapoMode && typeof SparkCapoMode.normalizeCapoFret === "function"
        ? SparkCapoMode.normalizeCapoFret(v)
        : Math.max(0, Math.min(12, Math.round(Number(v) || 0)));
      applySongFamilyRuntimeUpdate({ setFields: { capoModeFret: capoFret } }, function() {
        S.capoModeFret = capoFret;
      });
      render();
      return true;
    }

    if (a === "completeSong") {
      var songActivityInstrument;
      var completionRuntimeState;
      applySongFamilyRuntimeUpdate({
        setFields: { songPlaying: false, screen: SCR.SONG_DONE },
        clearIntervals: ["song"]
      }, function() {
        S.songPlaying = false;
        S.screen = SCR.SONG_DONE;
        clearInterval(T.song);
      });
      snd("complete");
      songActivityInstrument = getActiveInstrumentIdentityForActivity();
      applySongFamilyCompletionUpdate({
        xpDelta: 40,
        incrementFields: { songsPlayed: 1 },
        history: { type: "song", detail: S.selectedSong ? S.selectedSong.title : "Song", xp: 40 },
        emit: { type: "lesson_completed", payload: { appId: songActivityInstrument.appId, lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 } },
        checkBadges: true
      }, function() {
        S.songsPlayed++;
        if (window.SparkProgressBridge) SparkProgressBridge.applyLegacyReward({ xpDelta: 40 });
        else S.xp += 40;
        logHistory("song", S.selectedSong ? S.selectedSong.title : "Song", 40);
        _sparkEmit("lesson_completed", { appId: songActivityInstrument.appId, lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 });
        checkBadges();
        saveState();
      });
      completionRuntimeState = getSongFamilyCoreRuntimeState();
      completeSongSessionRequest({
        songData: S.selectedSong,
        source: completionRuntimeState ? completionRuntimeState.songSessionSource : "builtin",
        songBeat: S.songBeat
      });
      fireMicro("full_song", "Rockstar!", "&#127908;");
      trigC();
      render();
      return true;
    }

    if (a === "songBack") {
      applySongFamilyNavigation("songs_home");
      applySongFamilyRuntimeUpdate({ setFields: { screen: SCR.HOME, tab: TAB.SONGS } }, function() {
        S.screen = SCR.HOME;
        S.tab = TAB.SONGS;
      });
      render();
      return true;
    }

    if (a === "songDoneHome") {
      applySongFamilyNavigation("songs_home");
      applySongFamilyRuntimeUpdate({ setFields: { screen: SCR.HOME, tab: TAB.SONGS } }, function() {
        S.screen = SCR.HOME;
        S.tab = TAB.SONGS;
      });
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("songs", handleSongAction);
})();
