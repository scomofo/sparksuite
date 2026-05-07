// js/render_registry.js
// Page registry helpers extracted from the render shell so screen routing
// can stay separate from launcher/showroom chrome concerns.

function _buildSharedPageRegistry(){
  var pages = {};
  pages[SCR.HOME] = typeof homePage === "function" ? homePage : null;
  pages[SCR.SESSION] = typeof sessionPage === "function" ? sessionPage : null;
  pages[SCR.COMPLETE] = typeof completePage === "function" ? completePage : null;
  pages[SCR.DRILL] = typeof drillPage === "function" ? drillPage : null;
  pages[SCR.DRILL_DONE] = typeof drillDonePage === "function" ? drillDonePage : null;
  pages[SCR.DAILY] = typeof dailyPage === "function" ? dailyPage : null;
  pages[SCR.QUIZ] = typeof quizPage === "function" ? quizPage : null;
  pages[SCR.STRUM] = typeof strumDetailPage === "function" ? strumDetailPage : null;
  pages[SCR.SONG] = typeof songDetailPage === "function" ? songDetailPage : null;
  pages[SCR.SONG_DONE] = typeof songDonePage === "function" ? songDonePage : null;
  pages[SCR.STEMS] = typeof stemsPage === "function" ? stemsPage : null;
  pages[SCR.GUIDED] = typeof guidedSessionPage === "function" ? guidedSessionPage : null;
  pages[SCR.GUIDED_DONE] = typeof guidedDonePage === "function" ? guidedDonePage : null;
  pages[SCR.PERFORM] = typeof performPage === "function" ? performPage : null;
  pages[SCR.PERFORM_DONE] = typeof performDonePage === "function" ? performDonePage : null;
  pages[SCR.RHYTHM_HIGHWAY] = typeof rhythmHighwayPage === "function" ? rhythmHighwayPage : null;
  pages[SCR.PERFORM_SONG] = typeof performSongPage === "function" ? performSongPage : null;
  pages[SCR.PERF_STATS] = typeof performanceStatsPage === "function" ? performanceStatsPage : null;
  pages[SCR.PERF_EDITOR] = typeof performanceEditorPage === "function" ? performanceEditorPage : null;
  pages[SCR.SKILL_TREE] = typeof skillTreePage === "function" ? skillTreePage : null;
  pages[SCR.PERFORM_CALIBRATE] = typeof performCalibrationPage === "function" ? performCalibrationPage : null;
  pages[SCR.PLAN] = typeof planPage === "function" ? planPage : null;
  pages[SCR.RECOMMENDATIONS] = typeof recommendationsPage === "function" ? recommendationsPage : null;
  pages[SCR.CAREER] = typeof careerPage === "function" ? careerPage : null;
  pages[SCR.INSIGHTS] = typeof insightsDashboardPage === "function" ? insightsDashboardPage : null;
  pages[SCR.CHALLENGES] = typeof challengeHubPage === "function" ? challengeHubPage : null;
  pages[SCR.HOME_DASH] = typeof homeDashboardPage === "function" ? homeDashboardPage : null;
  pages[SCR.SETTINGS] = typeof settingsPage === "function" ? settingsPage : null;
  pages[SCR.ONBOARDING] = typeof onboardingPage === "function" ? onboardingPage : null;
  pages[SCR.MIDI_SETTINGS] = typeof midiSettingsPage === "function" ? midiSettingsPage : null;
  pages[SCR.MIDI_IMPORT] = typeof midiImportPage === "function" ? midiImportPage : null;
  pages[SCR.CLOUD_SETTINGS] = typeof cloudSettingsPage === "function" ? cloudSettingsPage : null;
  pages[SCR.CURRICULUM] = typeof curriculumPage === "function" ? curriculumPage : null;
  return pages;
}

function _renderActiveScreenContent(){
  var sharedPages = _buildSharedPageRegistry();
  var instrumentPage = SparkInstruments.getPage(S.screen);
  if (S.screen === SCR.SESSION && sharedPages[S.screen]) {
    if (instrumentPage && S.sessionPlan && S.sessionStep) return instrumentPage();
    return sharedPages[S.screen]();
  }
  var renderer = instrumentPage || sharedPages[S.screen] || null;
  if (renderer) return renderer();
  return "";
}
