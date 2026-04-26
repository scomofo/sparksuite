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
var _renderQueued = false;

function _renderNow(){
  try{_renderInner();}catch(e){
    console.error("Render error:",e);
    _writeAppHtml('<div class="card" style="margin:20px;text-align:center"><h2>Something went wrong</h2><p style="color:var(--text-muted);margin:8px 0">'+escHTML(String(e.message||e))+'</p><button class="btn" onclick="act(\'appReload\')" style="background:#FF6B6B;color:#fff;margin-top:12px">Reload</button></div>');
  }
}

function render(options){
  if(options===true || (options && options.sync)){
    _renderQueued = false;
    _renderNow();
    return;
  }
  if(_renderQueued) return;
  _renderQueued = true;
  var flush = function(){
    _renderQueued = false;
    _renderNow();
  };
  if(typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"){
    window.requestAnimationFrame(flush);
    return;
  }
  setTimeout(flush,0);
}
// First-launch onboarding overlay. This stays in render.js because tests
// assert against the exact normalized-input markup contract here.
function _renderOnboardingOverlay(){
  if (S.onboardingDone || S.activeInstrument) return "";
  var onboardingPracticeIntention = normalizeAppTextInputValue(S.practiceIntention);
  if (typeof SparkOnboardingWelcome !== "undefined" && SparkOnboardingWelcome && typeof SparkOnboardingWelcome.render === "function") {
    var intentionCard = "";
    intentionCard += '<section class="showroom-onboarding-intention-card" aria-label="Practice trigger">';
    intentionCard += '<p class="showroom-onboarding-intention-kicker">Complete this sentence</p>';
    intentionCard += '<p class="showroom-onboarding-intention-copy">&#8220;Every day, when I&nbsp;&hellip;</p>';
    intentionCard += '<input type="text" id="intention-input" class="set-input showroom-onboarding-intention-input" placeholder="finish dinner, make coffee..." value="'+escHTML(onboardingPracticeIntention)+'" oninput="act(\'setIntention\',this.value)" aria-label="Practice trigger"/>';
    intentionCard += '<p class="showroom-onboarding-intention-copy">&#8230;&nbsp;I will open SparkSuite.&#8221;</p>';
    intentionCard += '</section>';
    return SparkOnboardingWelcome.render({
      title: "SparkSuite",
      subtitle: "Welcome to your practice cockpit",
      body: "Pick your instrument, set a tiny practice trigger, and we will keep the first run honest instead of pretending your profile already exists.",
      ctaLabel: "Let's Go!",
      ctaAction: "act('completeOnboarding')",
      signInLabel: "Need a minute?",
      signInAction: "act('completeOnboarding')",
      afterBodyHtml: intentionCard
    });
  }
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
  if (_renderLauncherOrShowroomOverride()) return;

  _syncHeaderChrome();
  var h = _renderOverlays();

  // (Onboarding overlay was previously here but is unreachable from this
  // path — see _renderOnboardingOverlay(), now invoked from the launcher gate.)

  var screenKey=S.screen+S.tab;
  var content=_renderActiveScreenContent();

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

