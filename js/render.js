/* SparkSuite merge guard: _renderLauncherOrShowroomOverride
 * During the convergence/converged-clean merge, render.js may load before
 * render_showroom.js. Keep boot from crashing; the correct implementation is
 * still preferred when window._renderLauncherOrShowroomOverride is present.
 */
var _renderLauncherOrShowroomOverride =
  (typeof window !== "undefined" && typeof window._renderLauncherOrShowroomOverride === "function")
    ? window._renderLauncherOrShowroomOverride.bind(window)
    : function _renderLauncherOrShowroomOverrideFallback() {
        return false;
      };
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
// trailing whitespace is preserved during active typing â€” re-renders fire
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
  if (el) {
    el.innerHTML = html;
    hydrateLocalMaterialIcons(el);
  }
}

function hydrateLocalMaterialIcons(root){
  if (!root) return;
  var icons = {
    add: '<path d="M12 5v14M5 12h14"/>',
    ads_click: '<path d="M4 4l8 17 2-7 7-2L4 4z"/><path d="M14 14l5 5"/>',
    album: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/>',
    arrow_back: '<path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>',
    arrow_forward: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    auto_awesome: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 10-13h-7l1-7z"/>',
    check_circle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/>',
    chevron_right: '<path d="M9 5l7 7-7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    electric_bolt: '<path d="M13 2L4 14h7l-1 8 10-13h-7l1-7z"/>',
    graphic_eq: '<path d="M5 18V9M12 18V5M19 18v-7"/>',
    library_music: '<path d="M7 4h12v12"/><path d="M7 8h8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z"/>',
    local_fire_department: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 .2 2-.5 3.4-1.8 4.4C13 9 11 6 8 4c.5 3-3 5-3 10 0 4 3 8 7 8z"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    lock_open: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4M8 22h8"/>',
    music_note: '<path d="M16 4v11"/><path d="M16 4l4 1v3l-4-1"/><circle cx="10" cy="17" r="3"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    pause_circle: '<circle cx="12" cy="12" r="9"/><path d="M10 8v8M14 8v8"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    piano: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 7v10M13 7v10M18 7v10"/><path d="M6 7v6M11 7v6M16 7v6"/>',
    play_arrow: '<path d="M8 5v14l11-7-11-7z"/>',
    play_circle: '<circle cx="12" cy="12" r="9"/><path d="M10 8v8l6-4-6-4z"/>',
    remove: '<path d="M5 12h14"/>',
    schedule: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    school: '<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.8-1L14.5 3h-5l-.4 3a7 7 0 0 0-1.8 1L5 6 3 9.5 5 11a7 7 0 0 0 0 2l-2 1.5L5 18l2.3-1a7 7 0 0 0 1.8 1l.4 3h5l.4-3a7 7 0 0 0 1.8-1l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1z"/>',
    speed: '<path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14l4-5"/><path d="M7 14h10"/>',
    star: '<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"/>',
    thumb_up: '<path d="M7 22H4V10h3v12z"/><path d="M7 11l5-8 2 1-1 6h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7V11z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 13V8M16 5l2-2"/>',
    touch_app: '<path d="M8 11V5a2 2 0 0 1 4 0v8"/><path d="M12 10l2-1a2 2 0 0 1 3 2v1l1-1a2 2 0 0 1 3 2v2c0 4-3 7-7 7h-1c-3 0-5-2-6-5l-2-5a2 2 0 0 1 3-2z"/>',
    track_changes: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    trending_down: '<path d="M3 7l6 6 4-4 8 8"/><path d="M21 11v6h-6"/>',
    trending_up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    tune: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    workspace_premium: '<circle cx="12" cy="8" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'
  };
  var nodes = root.querySelectorAll(".material-symbols-outlined");
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.getAttribute("data-local-icon") === "1") continue;
    var name = (node.textContent || "").trim();
    var path = icons[name];
    if (!path) continue;
    node.setAttribute("data-local-icon", "1");
    node.setAttribute("data-icon-name", name);
    node.innerHTML = '<svg class="spark-local-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + path + '</svg>';
  }
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
    intentionCard += '<section class="showroom-onboarding-intention-card" aria-label="Practice trigger setup">';
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
  // path â€” see _renderOnboardingOverlay(), now invoked from the launcher gate.)

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


