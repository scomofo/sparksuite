// js/dev/dev_overlay.js
// Lightweight dev overlay for instrument debugging.
// Activated by: ?dev=1 query param OR localStorage spark_dev_overlay=true
(function() {
  function devOverlayRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function devOverlayRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = devOverlayRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  var enabled = false;
  if (typeof window !== "undefined") {
    if (window.location && window.location.search.indexOf("dev=1") >= 0) enabled = true;
    if (typeof localStorage !== "undefined" && localStorage.getItem("spark_dev_overlay") === "true") enabled = true;
  }
  if (!enabled) return;

  var panel = document.createElement("div");
  panel.id = "spark-dev-overlay";
  panel.style.cssText = "position:fixed;bottom:0;right:0;z-index:99999;background:rgba(0,0,0,0.85);color:#0f0;font:11px/1.4 monospace;padding:8px 12px;border-top-left-radius:8px;max-width:340px;pointer-events:none;opacity:0.9;";
  document.body.appendChild(panel);

  function update() {
    var lines = [];
    lines.push("⚙ SPARK DEV");

    // Active instrument
    var inst = devOverlayRead("activeInstrument", null);
    if (inst) {
      lines.push("Instrument: " + (inst.name || inst.id || "?"));
      lines.push("ID: " + (inst.id || "?"));
    } else {
      lines.push("Instrument: (none)");
    }

    // Screen and tab
    lines.push("Screen: " + (devOverlayRead("screen", "?") || "?"));
    lines.push("Tab: " + (devOverlayRead("tab", "?") || "?"));

    // Manifest status
    var manifest = window.SPARK_INSTRUMENT_MANIFEST || [];
    lines.push("Manifest: " + manifest.length + " instruments");

    // Loaded scripts count
    var allScripts = document.querySelectorAll("script[src]");
    var instScripts = 0;
    for (var i = 0; i < allScripts.length; i++) {
      if (allScripts[i].src.indexOf("instruments/") >= 0 || allScripts[i].src.indexOf("sparksuite/") >= 0) instScripts++;
    }
    lines.push("Inst scripts: " + instScripts);

    // Registered instruments
    if (typeof SparkInstruments !== "undefined") {
      var all = SparkInstruments.getAll();
      lines.push("Registered: " + all.length + " (" + all.map(function(a){return a.id}).join(", ") + ")");
    }

    // Reload marker
    var marker = localStorage.getItem("spark_dev_reload_ts");
    if (marker) lines.push("Last reload: " + new Date(parseInt(marker)).toLocaleTimeString());

    panel.innerHTML = lines.join("<br>");
  }

  // Update every 2 seconds
  setInterval(update, 2000);
  setTimeout(update, 500);
})();
