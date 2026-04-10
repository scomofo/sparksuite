(function() {
  var REQUIRED = [
    "applyCloudWorkflowRequest",
    "applyDashboardChallengeReward",
    "applyDashboardNavigationRequest",
    "applyDashboardRequest",
    "applyGuidedNavigationRequest",
    "applyPerformanceCalibrationRequest",
    "applyPerformanceEditorMutation",
    "applyPerformanceNavigationRequest",
    "applySongBrowserRequest",
    "applySongNavigationRequest",
    "closeStemPlayer",
    "completeDailyPracticePlan",
    "completeGuidedSession",
    "completeLegacyDailyChallenge",
    "completeLegacyPracticeDrill",
    "completeLegacyPracticeSession",
    "completeLegacyRhythmGame",
    "completeLegacyRunnerGame",
    "completeSession",
    "completeSongSession",
    "getActiveSessionView",
    "getPerformanceEditorExportData",
    "getPerformanceEditorPreviewChart",
    "getRuntimeState",
    "initializeDashboardChallenges",
    "openCareerSongSelection",
    "openDailyPracticePlan",
    "openDashboardPracticePlan",
    "openDashboardSection",
    "openGuidedSession",
    "openLegacyDailyChallenge",
    "openLegacyPracticeDrill",
    "openLegacyPracticeSession",
    "openLegacyRhythmGame",
    "openLegacyRunnerGame",
    "openLegacyStrumPattern",
    "openPerformanceCalibration",
    "openPerformanceDailyChallenge",
    "openPerformanceEditor",
    "openPerformanceSongSelection",
    "openPerformanceStats",
    "openPracticePlanScreen",
    "openSkillTree",
    "openSongSession",
    "openStemPlayer",
    "openUtilityScreen",
    "refreshDashboardSnapshot",
    "repeatLegacyPracticeDrill",
    "repeatLegacyPracticeSession",
    "returnFromHomeFamily",
    "returnFromLegacyDailyChallenge",
    "returnFromLegacyPracticeFamily",
    "returnFromUtilityFamily",
    "setSkillTreeFocus",
    "startPerformanceEditorPreview",
    "startPerformanceRetrySession",
    "startSelectedPerformanceSong",
    "startSession",
    "syncAudioInputRuntimeState",
    "syncCloudSettingsState",
    "syncCurriculumState",
    "syncGuidedRuntimeState",
    "syncLegacyDailyRuntimeState",
    "syncLegacyEarTrainingRuntimeState",
    "syncLegacyPracticeRuntimeState",
    "syncLegacyQuizRuntimeState",
    "syncLegacyRhythmRuntimeState",
    "syncLegacyRunnerRuntimeState",
    "syncLegacyStrumRuntimeState",
    "syncMetronomeRuntimeState",
    "syncMidiImportState",
    "syncMidiSettingsState",
    "syncPerformanceEditorDocument",
    "syncPerformanceRuntimeState",
    "syncSettingsState",
    "syncSongRuntimeState",
    "syncTunerRuntimeState",
    "updateRuntimeState",
    "window.sparkCore ",
    "window.sparkCore&",
    "window.sparkCore)",
  ];

  function validateSparkCoreContract() {
    if (!window.sparkCore) { console.error("[CONTRACT] sparkCore not initialized"); return; }
    var missing = [];
    for (var i = 0; i < REQUIRED.length; i++) {
      if (typeof window.sparkCore[REQUIRED[i]] !== "function") missing.push(REQUIRED[i]);
    }
    if (missing.length) {
      console.warn("[CONTRACT] sparkCore missing " + missing.length + " methods:", missing);
    } else {
      console.log("[CONTRACT] sparkCore: all " + REQUIRED.length + " methods present");
    }
    return missing;
  }

  // Run on load (after sparkCore is created)
  if (typeof window !== "undefined") {
    setTimeout(validateSparkCoreContract, 100);
  }

  window.validateSparkCoreContract = validateSparkCoreContract;
})();
