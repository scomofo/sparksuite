(function() {
  'use strict';

  function show(amount, anchorEl) {
    if (!amount) return;
    var rect = anchorEl ? anchorEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    var el = document.createElement("div");
    el.textContent = "+" + amount + " XP";
    el.style.cssText =
      "position:fixed;z-index:9999;pointer-events:none;" +
      "left:" + rect.left + "px;top:" + rect.top + "px;" +
      "font-family:var(--font-mono-v2,monospace);font-size:16px;font-weight:700;" +
      "color:var(--inst-primary,#ffd93d);" +
      "text-shadow:0 0 12px var(--inst-glow,rgba(255,215,61,0.5));" +
      "opacity:1;transform:translateY(0);" +
      "transition:all 1s ease-out;";
    document.body.appendChild(el);

    // Double rAF ensures the browser has painted the initial state before the
    // transition begins, preventing the animation from being skipped.
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.style.transform = "translateY(-40px)";
        el.style.opacity = "0";
      });
    });

    setTimeout(function() {
      el.remove();
    }, 1200);
  }

  window.SparkXPFloat = { show: show };
})();
