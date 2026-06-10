(function() {
  function applyUtilityFamilyRuntimeUpdate(update, fallback) {
    if (window.SparkProgressBridge && typeof SparkProgressBridge.applyLegacyActivityRuntime === "function") {
      SparkProgressBridge.applyLegacyActivityRuntime(update || {});
      return true;
    }
    if (typeof fallback === "function") fallback();
    return false;
  }

  function applyUtilityFamilySongNavigation(target, options) {
    if (typeof applySongNavigationRequest === "function") {
      applySongNavigationRequest(target, options || {});
      return true;
    }
    return false;
  }

  function handleUtilityAction(a, v) {
    if (a === "appReload") {
      if (typeof location !== "undefined" && location && typeof location.reload === "function") location.reload();
      return true;
    }

    if (a === "setMidiDevice") {
      applyUtilityFamilyRuntimeUpdate({ setFields: { activeMidiDeviceId: v } }, function() {
        S.activeMidiDeviceId = v;
      });
      syncMidiSettingsStateRequest();
      saveState();
      render();
      return true;
    }

    if (a === "setMidiProfile") {
      if (typeof setActiveMidiProfile === "function") setActiveMidiProfile(v);
      syncMidiSettingsStateRequest();
      render();
      return true;
    }

    if (a === "createDefaultPianoProfile") {
      if (typeof createDefaultPianoProfile === "function") createDefaultPianoProfile();
      syncMidiSettingsStateRequest();
      render();
      return true;
    }

    if (a === "createDefaultGuitarProfile") {
      if (typeof createDefaultGuitarProfile === "function") createDefaultGuitarProfile();
      syncMidiSettingsStateRequest();
      render();
      return true;
    }

    if (a === "openMidiSettings") {
      openUtilityScreenRequest("midi_settings");
      syncMidiSettingsStateRequest();
      applyUtilityFamilyRuntimeUpdate({ setFields: { screen: SCR.MIDI_SETTINGS } }, function() {
        S.screen = SCR.MIDI_SETTINGS;
      });
      render();
      return true;
    }

    if (a === "openMidiImport") {
      openUtilityScreenRequest("midi_import");
      syncMidiImportStateRequest();
      applyUtilityFamilyRuntimeUpdate({ setFields: { screen: SCR.MIDI_IMPORT } }, function() {
        S.screen = SCR.MIDI_IMPORT;
      });
      render();
      return true;
    }

    if (a === "refreshMidiDevices") {
      if (typeof refreshMidiDevices === "function") refreshMidiDevices();
      return true;
    }

    if (a === "importMidiDesktop") {
      if (typeof importMidiDesktopAware === "function") importMidiDesktopAware();
      return true;
    }

    if (a === "spotifyPlaylistConnect") {
      if (typeof sparkSpotifyPlaylistConnect === "function") sparkSpotifyPlaylistConnect();
      return true;
    }

    if (a === "spotifyPlaylistCreate") {
      if (typeof sparkSpotifyPlaylistCreate === "function") sparkSpotifyPlaylistCreate();
      return true;
    }

    if (a === "spotifyPlaylistSync") {
      if (typeof sparkSpotifyPlaylistSync === "function") sparkSpotifyPlaylistSync();
      return true;
    }

    if (a === "importMidiFile") {
      if (typeof handleMidiImport === "function") handleMidiImport(v);
      return true;
    }

    if (a === "assignMidiTrack") {
      var parts = String(v).split("|");
      if (typeof setMidiTrackAssignment === "function") setMidiTrackAssignment(parts[0], parts[1]);
      syncMidiImportStateRequest();
      render();
      return true;
    }

    if (a === "buildMidiSeedChart") {
      if (typeof buildSeedChartFromImportedMidi === "function") {
        var chart = buildSeedChartFromImportedMidi(S.importedMidi, S.importedMidiAssignments, v);
        applyUtilityFamilyRuntimeUpdate({ setFields: { importedMidiSeedPreview: chart } }, function() {
          S.importedMidiSeedPreview = chart;
        });
        syncMidiImportStateRequest({ seedMode: v, seedChart: chart });
        if (chart && typeof openEditor === "function") openEditor("chart", chart);
        else render();
      }
      return true;
    }

    if (a === "cloudSync") {
      applyCloudWorkflowRequest("sync_start", { lastSyncStatus: "syncing" });
      if (typeof syncSparkNow === "function") syncSparkNow();
      return true;
    }

    if (a === "cloudPull") {
      applyCloudWorkflowRequest("pull_start", { lastSyncStatus: "syncing" });
      if (typeof pullSparkCloud === "function") pullSparkCloud();
      return true;
    }

    if (a === "cloudResolveConflict") {
      if (typeof resolveCloudConflict === "function") resolveCloudConflict(v);
      return true;
    }

    if (a === "cloudLogout") {
      if (typeof logoutSpark === "function") logoutSpark();
      applyCloudWorkflowRequest("logout");
      render();
      return true;
    }

    if (a === "cloudLoginPrompt") {
      var email = prompt("Email:");
      var password = prompt("Password:");
      if (email && password && typeof loginSpark === "function") {
        loginSpark(email, password).then(function() {
          applyCloudWorkflowRequest("login");
          render();
        });
      }
      return true;
    }

    if (a === "openCloudSettings") {
      openUtilityScreenRequest("cloud_settings");
      applyCloudWorkflowRequest("open");
      applyUtilityFamilyRuntimeUpdate({ setFields: { screen: SCR.CLOUD_SETTINGS } }, function() {
        S.screen = SCR.CLOUD_SETTINGS;
      });
      render();
      return true;
    }

    if (a === "checkUpdates") {
      if (typeof checkForDesktopUpdates === "function") checkForDesktopUpdates();
      return true;
    }

    if (a === "exportBackup") {
      if (typeof exportFullBackupDesktopAware === "function") exportFullBackupDesktopAware();
      return true;
    }

    if (a === "exportFeedback") {
      if (typeof exportFeedbackDesktopAware === "function") exportFeedbackDesktopAware();
      return true;
    }

    if (a === "feedbackDraftText") {
      applyUtilityFamilyRuntimeUpdate({
        setFields: { feedbackDraft: Object.assign({}, (S.feedbackDraft && typeof S.feedbackDraft === "object") ? S.feedbackDraft : {}, { text: v }) }
      }, function() {
        if (!S.feedbackDraft || typeof S.feedbackDraft !== "object") S.feedbackDraft = {};
        S.feedbackDraft.text = v;
      });
      return true;
    }

    if (a === "openCurriculum") {
      openUtilityScreenRequest("curriculum");
      syncCurriculumStateRequest();
      applyUtilityFamilyRuntimeUpdate({ setFields: { screen: SCR.CURRICULUM } }, function() {
        S.screen = SCR.CURRICULUM;
      });
      render();
      return true;
    }

    if (a === "back") {
      var dashboardBack = S.screen === SCR.RECOMMENDATIONS || S.screen === SCR.INSIGHTS || S.screen === SCR.CHALLENGES || S.screen === SCR.CAREER || S.screen === SCR.HOME_DASH;
      var utilityBack = S.screen === SCR.SETTINGS || S.screen === SCR.CLOUD_SETTINGS || S.screen === SCR.CURRICULUM || S.screen === SCR.MIDI_SETTINGS || S.screen === SCR.MIDI_IMPORT;
      var dailyBack = S.screen === SCR.DAILY;
      if (S.screen === SCR.SONG || S.screen === SCR.SONG_DONE) {
        applyUtilityFamilySongNavigation("songs_home");
      }
      if (dailyBack) {
        returnFromLegacyDailyChallengeRequest({ activeTab: "daily" });
      }
      if (utilityBack) {
        returnFromUtilityFamilyRequest({
          currentScreen: S.screen === SCR.SETTINGS ? "settings"
            : S.screen === SCR.CLOUD_SETTINGS ? "cloud_settings"
            : S.screen === SCR.CURRICULUM ? "curriculum"
            : S.screen === SCR.MIDI_SETTINGS ? "midi_settings"
            : "midi_import"
        });
      } else if (!dailyBack) {
        returnFromHomeFamilyRequest({ currentScreen: dashboardBack ? "home_dash" : "home" });
      }
      stopAllTimers();
      applyUtilityFamilyRuntimeUpdate({ setFields: { selectedVoicing: 0, screen: dashboardBack ? SCR.HOME_DASH : SCR.HOME, tab: dailyBack ? TAB.DAILY : S.tab } }, function() {
        S.selectedVoicing = 0;
        S.screen = dashboardBack ? SCR.HOME_DASH : SCR.HOME;
        if (dailyBack) S.tab = TAB.DAILY;
      });
      render();
      return true;
    }

    return false;
  }

  window.registerSparkActionFamily("utilities", handleUtilityAction);
})();
