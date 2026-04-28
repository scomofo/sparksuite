(function() {
  var inst = SparkInstruments.getAll();
  var piano = null;
  for (var i = 0; i < inst.length; i++) {
    if (inst[i].id === "pianospark") { piano = inst[i]; break; }
  }
  if (!piano) return;

  var pages = piano.pages || {};
  if (typeof pianoSessionPage === "function") pages[SCR.SESSION] = pianoSessionPage;
  if (typeof pianoPerformPage === "function") pages[SCR.PERFORM] = pianoPerformPage;
  if (typeof pianoPerformDonePage === "function") pages[SCR.PERFORM_DONE] = pianoPerformDonePage;
  if (typeof pianoPerformSongPage === "function") pages[SCR.PERFORM_SONG] = pianoPerformSongPage;
  if (typeof pianoPlanPage === "function") pages[SCR.PLAN] = pianoPlanPage;
  if (typeof pianoAnalyticsPage === "function") pages[SCR.INSIGHTS] = pianoAnalyticsPage;
  if (typeof pianoEditorPage === "function") pages[SCR.PERF_EDITOR] = pianoEditorPage;
  if (typeof pianoOnboardingPage === "function") pages[SCR.ONBOARDING] = pianoOnboardingPage;
  if (typeof pianoStemsPlayerPage === "function") pages[SCR.STEMS] = pianoStemsPlayerPage;
  piano.pages = pages;
})();
