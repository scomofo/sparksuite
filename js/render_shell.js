// js/render_shell.js
// Render shell helpers extracted from js/render.js. Owns launcher/showroom
// overrides and header chrome, while page routing lives in render_registry.js.

function _renderLauncherOrShowroomOverride(){
  if (!S.activeInstrument) {
    document.getElementById("header").style.display = "none";
    var onboarding = _renderOnboardingOverlay();
    if (onboarding) {
      _writeAppHtml(onboarding);
      return true;
    }
    _writeAppHtml(SparkInstruments.renderLauncher());
    return true;
  }

  return _renderShowroomOverride();
}

function _syncHeaderChrome(){
  document.getElementById("header").style.display = "";
  var backBtn = document.getElementById("launcher-back");
  if (backBtn) backBtn.style.display = "";

  var logoText = document.querySelector(".logo-text");
  var activeInstrument = SparkInstruments.getActive();
  if (logoText) {
    logoText.textContent = activeInstrument ? activeInstrument.name + "Spark" : "SparkSuite";
  }
  if (typeof SparkTheme !== "undefined" && activeInstrument) {
    SparkTheme.apply(activeInstrument.instrument || "guitar");
  }

  document.getElementById("hdr-xp").textContent = S.xp;
  document.getElementById("hdr-str").textContent = S.streak;
  document.getElementById("snd-btn").textContent = S.soundOn ? "\uD83D\uDD0A" : "\uD83D\uDD07";
  document.getElementById("snd-btn").style.opacity = S.soundOn ? 1 : 0.4;
  document.getElementById("dark-btn").textContent = S.darkMode ? "\uD83C\uDF19" : "\u2600\uFE0F";
}
