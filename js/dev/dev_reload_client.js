// js/dev/dev_reload_client.js
// Polls for reload signal and refreshes browser when detected.
// Activated by: ?dev=1 query param OR localStorage spark_dev_overlay=true
(function() {
  var enabled = false;
  if (typeof window !== "undefined") {
    if (window.location && window.location.search.indexOf("dev=1") >= 0) enabled = true;
    if (typeof localStorage !== "undefined" && localStorage.getItem("spark_dev_overlay") === "true") enabled = true;
  }
  if (!enabled) return;

  var POLL_INTERVAL = 1500;
  var SIGNAL_FILE = "_dev_reload_signal.txt";
  var lastTs = localStorage.getItem("spark_dev_reload_ts") || "0";

  function poll() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", SIGNAL_FILE + "?_=" + Date.now(), true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var ts = xhr.responseText.trim();
        if (ts && ts !== lastTs) {
          lastTs = ts;
          localStorage.setItem("spark_dev_reload_ts", ts);
          console.log("[dev] Reload signal detected, refreshing...");
          window.location.reload();
        }
      }
    };
    xhr.onerror = function() {}; // signal file may not exist
    xhr.send();
  }

  setInterval(poll, POLL_INTERVAL);
  console.log("[dev] Reload client active (polling every " + POLL_INTERVAL + "ms)");
})();
