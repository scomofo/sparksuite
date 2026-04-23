// js/render.js
// Suite render orchestration extracted from js/app.js.
// Owns: theme application, the top-level render() entry point, the
// _renderInner dispatcher (launcher gate + Showroom dispatch + legacy
// page registry), the suite-wide overlay HTML helper, and the first-launch
// onboarding overlay.
//
// Pre-conditions: this file must load AFTER all page-render modules
// (js/pages/*.js, js/showroom/spark-showroom.js, js/launcher.js) and before
// js/app.js's initial render() call. See <script> ordering in index.html.

// Used as the controlled-input value for the onboarding overlay's text field.
// IMPORTANT: returns the original `value` (not the trimmed one) so that
// trailing whitespace is preserved during active typing — re-renders fire
// on every keystroke via `oninput` and the trimmed form would strip
// user-typed spaces. The trimmed form is used only to detect meaningless
// values (empty / "undefined" / "null" / "nan").
function normalizeAppTextInputValue(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return value;
}

// ===== RENDER =====
function applyTheme(){
  // Dark is default; light mode is the override
  if(S.darkMode){document.body.classList.remove("light");}
  else{document.body.classList.add("light");}
}

// Single sink for writing HTML into the app root. All renderers go through
// this so we have one place to swap in a sanitizer or a different mount.
function _writeAppHtml(html){
  var el = document.getElementById("app");
  if (el) el.innerHTML = html;
}

var _lastScreen="";
function render(){
  try{_renderInner();}catch(e){
    console.error("Render error:",e);
    _writeAppHtml('<div class="card" style="margin:20px;text-align:center"><h2>Something went wrong</h2><p style="color:var(--text-muted);margin:8px 0">'+escHTML(String(e.message||e))+'</p><button class="btn" onclick="location.reload()" style="background:#FF6B6B;color:#fff;margin-top:12px">Reload</button></div>');
  }
}

// Build the suite-wide overlay HTML (confetti, XP/badge/break/undo toasts,
// shortcut overlay). Returns a string and fires the SparkConfetti side
// effect when applicable. Used by both the legacy in-instrument renderer
// and the Showroom dispatch so overlays appear on every page.
function _renderOverlays(){
  var h = "";
  // Cache `now` once so the four duration checks below stay consistent and
  // we avoid four repeated Date.now() calls per render tick.
  var now = Date.now();
  if (S.showConfetti) {
    // Generate the burst exactly once per S.showConfetti cycle. The inline
    // fallback HTML must persist across re-renders for the duration of the
    // animation (timer ticks fire render() every second), so we cache it on
    // S._confettiHtml and re-append it on every render until the timeout
    // clears both flags. SparkConfetti.burst() injects its own DOM, so its
    // cached html is "" — only the guard is needed.
    if (!S._confettiFired) {
      S._confettiFired = true;
      if (typeof SparkConfetti !== "undefined") {
        SparkConfetti.burst();
        S._confettiHtml = "";
      } else {
        var cols = ["#FF6B6B","#4ECDC4","#45B7D1","#FFE66D","#96CEB4","#FF8A5C"];
        var ch = '<div style="position:fixed;inset:0;pointer-events:none;z-index:999">';
        for (var i = 0; i < 40; i++)
          ch += '<div style="position:absolute;left:'+Math.random()*100+'%;top:-20px;width:10px;height:10px;border-radius:'+(Math.random()>0.5?"50%":"2px")+';background:'+cols[i%6]+';animation:cF '+(1.5+Math.random())+'s ease-in forwards;animation-delay:'+Math.random()*0.5+'s"></div>';
        ch += '</div>';
        S._confettiHtml = ch;
      }
      setTimeout(function() { S._confettiFired = false; S._confettiHtml = ""; }, 2600);
    }
    if (S._confettiHtml) h += S._confettiHtml;
  }
  if (S.newBadge)
    h += '<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:16px 32px;box-shadow:0 8px 30px rgba(255,138,92,.4);animation:sD .5s ease;text-align:center"><div style="font-size:32px">'+S.newBadge.icon+'</div><div style="font-weight:800;font-size:16px;color:#333">'+S.newBadge.label+'</div><div style="font-size:12px;color:#555">'+S.newBadge.desc+'</div></div>';
  if (S.showUndoToast)
    h += '<div class="undo-toast"><span>Progress reset.</span><button onclick="act(\'undoReset\')">Undo</button><span class="countdown">'+S.undoTimer+'</span></div>';
  if (S.xpToast && now - S.xpToast.time < 1500) {
    if (S.xpToast.jackpot)
      h += '<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:12px 28px;box-shadow:0 6px 24px rgba(255,138,92,.6);animation:sD .3s ease;font-weight:900;color:#fff;font-size:20px;text-align:center">&#127873; JACKPOT! +'+S.xpToast.amount+' XP!</div>';
    else
      h += '<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#4ECDC4,#45B7D1);border-radius:16px;padding:8px 20px;box-shadow:0 4px 15px rgba(78,205,196,.4);animation:sD .3s ease;font-weight:800;color:#fff;font-size:16px">+'+S.xpToast.amount+' XP!</div>';
  }
  if (S.microToast && now - S.microToast.time < 2000)
    h += '<div style="position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:16px;padding:10px 24px;box-shadow:0 4px 15px rgba(255,138,92,.4);animation:sD .3s ease;text-align:center"><span style="font-size:20px;margin-right:6px">'+S.microToast.icon+'</span><span style="font-weight:800;color:#333;font-size:15px">'+S.microToast.msg+'</span></div>';
  var _contMin = (now - S.sessionStartTime) / 60000;
  if (S.sessionStartTime > 0 && _contMin >= 20 && !S.breakDismissed)
    h += '<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#45B7D1,#4ECDC4);border-radius:16px;padding:12px 24px;box-shadow:0 4px 20px rgba(69,183,209,.4);animation:sD .5s ease;text-align:center;max-width:320px"><div style="font-size:20px;margin-bottom:4px">&#9749;</div><div style="font-weight:800;color:#fff;font-size:14px">Nice focus! Take a quick break?</div><div style="font-size:11px;color:rgba(255,255,255,.8);margin:4px 0">You\'ve been practicing for '+Math.floor(_contMin)+' min straight</div><button onclick="act(\'dismissBreak\')" style="margin-top:6px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:10px;padding:6px 16px;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Got it!</button></div>';
  if (S.showShortcuts) h += shortcutOverlay();
  return h;
}

// First-launch onboarding overlay. Returns a string (empty when not needed).
// Rendered on top of the launcher; previously this lived inside _renderInner
// after the launcher gate, which made it unreachable (the gate returned
// early on `!S.activeInstrument`, the same condition this needs).
function _renderOnboardingOverlay(){
  if (S.onboardingDone || S.activeInstrument) return "";
  var onboardingPracticeIntention = normalizeAppTextInputValue(S.practiceIntention);
  var h = "";
  h += '<div style="position:fixed;inset:0;z-index:2000;background:var(--body-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;overflow:auto">';
  h += '<div style="font-size:56px;margin-bottom:12px">&#127930;</div>';
  h += '<h1 style="font-size:24px;font-weight:900;color:var(--text-primary);margin:0 0 8px">Welcome to SparkSuite!</h1>';
  h += '<p style="color:var(--text-dim);font-size:14px;margin:0 0 24px;max-width:300px">People who set a specific practice trigger are 2-3x more likely to follow through. Set yours now.</p>';
  h += '<div class="card" style="width:100%;max-width:340px;text-align:left;margin-bottom:20px">';
  h += '<p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0 0 8px">Complete this sentence:</p>';
  h += '<p style="font-size:14px;color:var(--text-muted);margin:0 0 8px">&#8220;Every day, when I&nbsp;&hellip;</p>';
  h += '<input type="text" id="intention-input" class="set-input" placeholder="finish dinner, make coffee..." value="'+escHTML(onboardingPracticeIntention)+'" oninput="act(\'setIntention\',this.value)" style="margin-bottom:8px" aria-label="Practice trigger"/>';
  h += '<p style="font-size:14px;color:var(--text-muted);margin:0">&#8230;&nbsp;I will open SparkSuite.&#8221;</p>';
  h += '</div>';
  h += '<button class="btn" onclick="act(\'completeOnboarding\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:14px 40px;font-size:17px;font-weight:800">Let\'s Go!</button>';
  h += '<button onclick="act(\'completeOnboarding\')" style="margin-top:14px;background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer">Skip for now</button>';
  h += '</div>';
  return h;
}

function _renderInner(){
  // Launcher gate — if no instrument active, show clean launcher.
  // Onboarding overlay rides on top so first-launch users see it.
  if (!S.activeInstrument) {
    document.getElementById("header").style.display = "none";
    _writeAppHtml(_renderOnboardingOverlay() + SparkInstruments.renderLauncher());
    return;
  }

  // Showroom override — render a Warm Ember screen when its corresponding
  // nav("<view>") route set S._showroomOverride. The allow-list below only
  // covers renderers that have been wired to real instrument / profile /
  // storage data; the remaining Showroom modules (SparkSongDetails,
  // SparkSongLibrary, SparkSessionSummary, SparkPerformance,
  // SparkCourseSyllabus, SparkCurriculumDashboard, SparkOnboardingWelcome,
  // SparkPracticeMetro, SparkSettings, SparkTuner) are still hardcoded
  // design-reference mocks — they stay out of this map until ported.
  //
  // The Warm Ember screens are full-viewport surfaces that carry their own
  // header/bottom-nav, so the legacy top header must be hidden while an
  // override is active (same treatment as the launcher gate above).
  if (typeof S !== "undefined" && S._showroomOverride) {
    var _showroomRoute = {
      "lesson":  typeof SparkLesson          !== "undefined" && SparkLesson.render,
      "path":    typeof SparkPath            !== "undefined" && SparkPath.render,
      "profile": typeof SparkProfileScreen   !== "undefined" && SparkProfileScreen.render
    };
    var _overrideFn = _showroomRoute[S._showroomOverride];
    if (typeof _overrideFn === "function") {
      document.getElementById("header").style.display = "none";
      _writeAppHtml(_overrideFn());
      return;
    }
  }

  // Legacy-screen → Warm Ember upgrade. When the engine drives the user to
  // one of these screens (post-session complete, etc.) and the Showroom
  // renderer has been made data-aware, render the Warm Ember version
  // instead of the bare legacy page. When the Showroom module isn't
  // loaded the code falls through to the legacy pipeline below.
  if (typeof S !== "undefined" && typeof SCR !== "undefined") {
    var _legacyToShowroom = {};
    _legacyToShowroom[SCR.COMPLETE] = typeof SparkSessionSummary !== "undefined" && SparkSessionSummary.render;
    var _legacyFn = _legacyToShowroom[S.screen];
    if (typeof _legacyFn === "function") {
      document.getElementById("header").style.display = "none";
      _writeAppHtml(_legacyFn());
      return;
    }
  }

  document.getElementById("header").style.display = "";
  var backBtn = document.getElementById("launcher-back");
  if (backBtn) backBtn.style.display = "";
  var logoText = document.querySelector(".logo-text");
  if (logoText) {
    var _inst = SparkInstruments.getActive();
    logoText.textContent = _inst ? _inst.name + "Spark" : "SparkSuite";
  }
  // Apply instrument theme (v2 neon system)
  if (typeof SparkTheme !== "undefined" && _inst) {
    SparkTheme.apply(_inst.instrument || "guitar");
  }

  document.getElementById("hdr-xp").textContent=S.xp;
  document.getElementById("hdr-str").textContent=S.streak;
  document.getElementById("snd-btn").textContent=S.soundOn?"\uD83D\uDD0A":"\uD83D\uDD07";
  document.getElementById("snd-btn").style.opacity=S.soundOn?1:0.4;
  document.getElementById("dark-btn").textContent=S.darkMode?"\uD83C\uDF19":"\u2600\uFE0F";
  var h = _renderOverlays();

  // (Onboarding overlay was previously here but is unreachable from this
  // path — see _renderOnboardingOverlay(), now invoked from the launcher gate.)

  var screenKey=S.screen+S.tab;
  var content="";

  // Shared page registry — instrument pages can override any of these
  var _sharedPages = {};
  _sharedPages[SCR.HOME] = typeof homePage === "function" ? homePage : null;
  _sharedPages[SCR.SESSION] = typeof sessionPage === "function" ? sessionPage : null;
  _sharedPages[SCR.COMPLETE] = typeof completePage === "function" ? completePage : null;
  _sharedPages[SCR.DRILL] = typeof drillPage === "function" ? drillPage : null;
  _sharedPages[SCR.DRILL_DONE] = typeof drillDonePage === "function" ? drillDonePage : null;
  _sharedPages[SCR.DAILY] = typeof dailyPage === "function" ? dailyPage : null;
  _sharedPages[SCR.QUIZ] = typeof quizPage === "function" ? quizPage : null;
  _sharedPages[SCR.STRUM] = typeof strumDetailPage === "function" ? strumDetailPage : null;
  _sharedPages[SCR.SONG] = typeof songDetailPage === "function" ? songDetailPage : null;
  _sharedPages[SCR.SONG_DONE] = typeof songDonePage === "function" ? songDonePage : null;
  _sharedPages[SCR.STEMS] = typeof stemsPage === "function" ? stemsPage : null;
  _sharedPages[SCR.GUIDED] = typeof guidedSessionPage === "function" ? guidedSessionPage : null;
  _sharedPages[SCR.GUIDED_DONE] = typeof guidedDonePage === "function" ? guidedDonePage : null;
  _sharedPages[SCR.PERFORM] = typeof performPage === "function" ? performPage : null;
  _sharedPages[SCR.PERFORM_DONE] = typeof performDonePage === "function" ? performDonePage : null;
  _sharedPages[SCR.RHYTHM_HIGHWAY] = typeof rhythmHighwayPage === "function" ? rhythmHighwayPage : null;
  _sharedPages[SCR.PERFORM_SONG] = typeof performSongPage === "function" ? performSongPage : null;
  _sharedPages[SCR.PERF_STATS] = typeof performanceStatsPage === "function" ? performanceStatsPage : null;
  _sharedPages[SCR.PERF_EDITOR] = typeof performanceEditorPage === "function" ? performanceEditorPage : null;
  _sharedPages[SCR.SKILL_TREE] = typeof skillTreePage === "function" ? skillTreePage : null;
  _sharedPages[SCR.PERFORM_CALIBRATE] = typeof performCalibrationPage === "function" ? performCalibrationPage : null;
  _sharedPages[SCR.PLAN] = typeof planPage === "function" ? planPage : null;
  _sharedPages[SCR.RECOMMENDATIONS] = typeof recommendationsPage === "function" ? recommendationsPage : null;
  _sharedPages[SCR.CAREER] = typeof careerPage === "function" ? careerPage : null;
  _sharedPages[SCR.INSIGHTS] = typeof insightsDashboardPage === "function" ? insightsDashboardPage : null;
  _sharedPages[SCR.CHALLENGES] = typeof challengeHubPage === "function" ? challengeHubPage : null;
  _sharedPages[SCR.HOME_DASH] = typeof homeDashboardPage === "function" ? homeDashboardPage : null;
  _sharedPages[SCR.SETTINGS] = typeof settingsPage === "function" ? settingsPage : null;
  _sharedPages[SCR.ONBOARDING] = typeof onboardingPage === "function" ? onboardingPage : null;
  _sharedPages[SCR.MIDI_SETTINGS] = typeof midiSettingsPage === "function" ? midiSettingsPage : null;
  _sharedPages[SCR.MIDI_IMPORT] = typeof midiImportPage === "function" ? midiImportPage : null;
  _sharedPages[SCR.CLOUD_SETTINGS] = typeof cloudSettingsPage === "function" ? cloudSettingsPage : null;
  _sharedPages[SCR.CURRICULUM] = typeof curriculumPage === "function" ? curriculumPage : null;

  // Instrument override: if active instrument provides a page for this screen, use it
  var _instrumentPage = SparkInstruments.getPage(S.screen);
  var _renderer = _instrumentPage || _sharedPages[S.screen] || null;
  if (_renderer) {
    content = _renderer();
  }

  if(screenKey!==_lastScreen){
    h+='<div class="page-transition">'+content+'</div>';
    _lastScreen=screenKey;
  }else{
    h+=content;
  }
  _writeAppHtml(h);
  // Focus management for modal overlays
  if(S.showShortcuts){var cb=document.getElementById("shortcut-close-btn");if(cb)cb.focus();}
}
