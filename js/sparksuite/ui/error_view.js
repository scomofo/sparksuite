(function() {
  function esc(value) {
    if (value == null) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeActions(actions) {
    if (!Array.isArray(actions) || !actions.length) {
      return [
        { id: "retry_current_action", label: "Retry current action" },
        { id: "return_to_lesson_select", label: "Return to lesson select" },
        { id: "return_to_instrument_select", label: "Return to instrument select" },
        { id: "restart_session", label: "Restart session" },
        { id: "export_debug_bundle", label: "Export debug bundle" }
      ];
    }
    return actions;
  }

  function renderSparkErrorView(errorState) {
    var error = errorState && errorState.error ? errorState.error : errorState;
    var actions = normalizeActions(errorState && errorState.actions);
    var context = error && error.context ? error.context : {};
    var h = '<section class="card" data-spark-error-view="true" style="max-width:720px;margin:24px auto;padding:20px;text-align:left">';
    h += '<div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#FF6B6B;margin-bottom:8px">RECOVERY MODE</div>';
    h += '<h2 style="margin:0 0 8px;color:var(--text-primary)">Something went wrong</h2>';
    h += '<p style="margin:0 0 12px;color:var(--text-label)">SparkSuite caught a structured runtime error and kept the app recoverable.</p>';
    h += '<div style="background:var(--input-bg);border-radius:12px;padding:12px;margin-bottom:12px">';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Code</div>';
    h += '<div style="font-weight:800;color:var(--text-primary)">' + esc(error && error.code ? error.code : "UNEXPECTED_ERROR") + '</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin:10px 0 4px">Message</div>';
    h += '<div style="color:var(--text-secondary)">' + esc(error && error.message ? error.message : "Unknown SparkSuite error") + '</div>';
    h += '</div>';
    if (context && Object.keys(context).length) {
      h += '<div style="margin-bottom:12px">';
      h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">Context</div>';
      h += '<pre style="margin:0;padding:12px;background:#111827;color:#D1FAE5;border-radius:12px;overflow:auto;font-size:12px;line-height:1.5">' + esc(JSON.stringify(context, null, 2)) + '</pre>';
      h += '</div>';
    }
    h += '<div style="display:flex;flex-wrap:wrap;gap:10px">';
    for (var i = 0; i < actions.length; i++) {
      h += '<button class="btn" onclick="act(\'sparkRecovery\',\'' + esc(actions[i].id) + '\')" style="background:' + (i === 0 ? "linear-gradient(135deg,#FF6B6B,#FF8A5C)" : "var(--input-bg)") + ';color:' + (i === 0 ? "#fff" : "var(--text-primary)") + '">' + esc(actions[i].label) + '</button>';
    }
    h += '</div>';
    h += '</section>';
    return h;
  }

  if (typeof window !== "undefined") {
    window.renderSparkErrorView = renderSparkErrorView;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      renderSparkErrorView: renderSparkErrorView
    };
  }
})();
