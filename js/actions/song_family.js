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
      S.songsSubTab = v;
      applySongBrowserRequest("songs_subtab", { songsSubTab: S.songsSubTab });
      if (v === "community") fetchCommunity();
      render();
      return true;
    }

    if (a === "toggleSong") {
      var nextSongPlaying;
      var runtimeState;
      snd("click");
      nextSongPlaying = !S.songPlaying;
      runtimeState = getSongFamilyCoreRuntimeState();
      syncSongRuntimeRequest(nextSongPlaying ? "play" : "pause", {
        songData: S.selectedSong,
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
      if (S.songPlaying) {
        var ms = 60000 / S.selectedSong.bpm;
        var chordName = S.selectedSong.progression[0];
        strumChord(CHORD_NAME_MAP[chordName] || chordName);
        render();
        T.song = setInterval(function() {
          var nextChordName;
          S.songBeat = (S.songBeat + 1) % S.selectedSong.progression.length;
          syncSongRuntimeRequest("tick", { songBeat: S.songBeat });
          nextChordName = S.selectedSong.progression[S.songBeat];
          strumChord(CHORD_NAME_MAP[nextChordName] || nextChordName);
          render();
        }, ms);
      } else {
        render();
      }
      return true;
    }

    if (a === "completeSong") {
      var songActivityInstrument;
      var completionRuntimeState;
      applySongFamilyRuntimeUpdate({
        setFields: { songPlaying: false },
        clearIntervals: ["song"]
      }, function() {
        S.songPlaying = false;
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
      S.screen = SCR.SONG_DONE;
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
