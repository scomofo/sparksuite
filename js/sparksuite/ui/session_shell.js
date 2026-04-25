(function(global){
  "use strict";

  function number(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function firstText() {
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  }

  function esc(value) {
    if (typeof global.escHTML === "function") return global.escHTML(value);
    return String(value);
  }

  function formatDurationLabel(ms, suffix) {
    var safeMs = Math.max(0, number(ms, 0));
    var minutes = Math.floor(safeMs / 60000);
    var seconds = Math.floor((safeMs % 60000) / 1000);
    return minutes + "m " + seconds + "s " + suffix;
  }

  function resolveSegmentLabel(segment, formatter, fallback) {
    if (typeof formatter === "function") {
      var formatted = formatter(segment);
      if (typeof formatted === "string" && formatted.trim()) return formatted.trim();
    }
    return firstText(
      segment && segment.label,
      segment && segment.title,
      segment && segment.type,
      fallback || "Practice block"
    );
  }

  function buildDailyShellSummary(coreView, options) {
    var opts = options || {};
    var plan = coreView && coreView.plan ? coreView.plan : null;
    var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
    var segments;
    var activeSegment;
    var activeSegmentId;
    var activeIndex = 0;
    var completedCount = 0;
    var totalDurationSec = 0;
    var i;
    var transport;
    var status;
    var segmentLabel;
    var durationMs;
    var positionMs;
    var progressPct;
    var remainingMs;
    var focusLabel;

    if (!plan || plan.flow !== "daily_practice") return null;
    segments = Array.isArray(plan.segments) ? plan.segments : [];
    if (!segments.length) return null;

    activeSegment = coreView && coreView.activeSegment ? coreView.activeSegment : null;
    activeSegmentId = runtimeState && runtimeState.activeSegmentId
      ? runtimeState.activeSegmentId
      : (activeSegment && activeSegment.id ? activeSegment.id : null);

    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].completed) completedCount++;
      totalDurationSec += Math.max(0, number(segments[i] && segments[i].durationSec, 0));
      if (!activeSegment && activeSegmentId && segments[i] && segments[i].id === activeSegmentId) {
        activeSegment = segments[i];
      }
    }

    if (!activeSegment) activeSegment = segments[0] || null;
    if (!activeSegment) return null;

    for (i = 0; i < segments.length; i++) {
      if (segments[i] === activeSegment || (segments[i] && activeSegment && segments[i].id === activeSegment.id)) {
        activeIndex = i;
        break;
      }
    }

    transport = runtimeState && runtimeState.transport ? runtimeState.transport : null;
    status = transport && transport.status ? transport.status : "ready";
    durationMs = Math.max(
      0,
      number(transport && transport.durationMs, number(activeSegment.durationSec, 0) * 1000)
    );
    positionMs = Math.max(0, number(transport && transport.positionMs, 0));
    if (durationMs > 0 && positionMs > durationMs) positionMs = durationMs;
    progressPct = durationMs > 0 ? Math.max(0, Math.min(100, Math.round((positionMs / durationMs) * 100))) : 0;
    remainingMs = durationMs > positionMs ? (durationMs - positionMs) : 0;
    segmentLabel = resolveSegmentLabel(activeSegment, opts.segmentFormatter, opts.fallbackSegmentLabel);
    focusLabel = typeof opts.focusFormatter === "function"
      ? opts.focusFormatter(plan)
      : firstText(plan.focus, plan.title, opts.fallbackTitle || "Practice Session");

    return {
      title: firstText(focusLabel, opts.fallbackTitle || "Practice Session"),
      segmentLabel: segmentLabel,
      blockCount: segments.length,
      activeIndex: activeIndex,
      completedCount: completedCount,
      status: status,
      statusLabel: status === "paused"
        ? ("Paused - " + segmentLabel)
        : status === "completed"
          ? ("Wrapped - " + segmentLabel)
          : status === "running"
            ? ("In progress - " + segmentLabel)
            : ("Ready - " + segmentLabel),
      targetDurationMin: totalDurationSec > 0 ? Math.max(1, Math.round(totalDurationSec / 60)) : 0,
      durationMin: totalDurationSec > 0 ? Math.max(1, Math.round(totalDurationSec / 60)) : 0,
      progressPct: progressPct,
      elapsedLabel: formatDurationLabel(positionMs, "in block"),
      remainingLabel: formatDurationLabel(remainingMs, "left"),
      primaryAction: status === "paused" ? "sessionResumeBlock" : "sessionPauseBlock",
      primaryLabel: status === "paused" ? "Resume Block" : "Pause Block",
      canSkip: activeIndex < segments.length - 1,
      activeSegment: activeSegment,
      segments: segments
    };
  }

  function renderCompactSummary(shell, options) {
    var opts = options || {};
    var label = opts.label || "Practice Session Live";
    var accent = opts.accent || "#45B7D1";
    var background = opts.background || "rgba(69,183,209,.12)";
    var metaLabel = opts.metaLabel || ("Block " + (shell.activeIndex + 1) + " of " + shell.blockCount + " • " + (shell.targetDurationMin || shell.durationMin || 10) + " min shell");
    var extraButtons = typeof opts.renderExtraButtons === "function" ? opts.renderExtraButtons(shell) : "";
    var h = "";
    h += '<div style="margin-top:' + esc(opts.marginTop || "0") + ';padding:10px 12px;border-radius:14px;background:' + background + ';color:var(--text-primary)">';
    h += '<div style="font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:' + accent + '">' + esc(label) + '</div>';
    h += '<div style="font-size:13px;font-weight:800;margin-top:4px">' + esc(shell.title) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">' + esc(shell.statusLabel) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-dim);margin-top:4px">' + esc(metaLabel) + '</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">';
    h += '<button class="btn btn-sm" onclick="act(\'' + shell.primaryAction + '\')" style="background:' + accent + ';color:#fff;font-size:11px;padding:4px 8px">' + esc(shell.primaryLabel) + '</button>';
    if (shell.canSkip) {
      h += '<button class="btn btn-sm" onclick="act(\'sessionSkipBlock\')" style="background:#FF8A5C;color:#fff;font-size:11px;padding:4px 8px">Skip Block</button>';
    }
    h += extraButtons;
    h += '</div></div>';
    return h;
  }

  function renderLiveCard(shell, options) {
    var opts = options || {};
    var label = opts.label || "Practice Session Live";
    var accent = opts.accent || "#4ECDC4";
    var fill = opts.fill || "linear-gradient(90deg,#4ECDC4,#45B7D1)";
    var secondaryButton = typeof opts.renderSecondaryButton === "function" ? opts.renderSecondaryButton(shell) : "";
    var h = '<div class="card mb16" style="text-align:left;background:linear-gradient(180deg,rgba(78,205,196,.12),rgba(69,183,209,.08));border:1px solid rgba(78,205,196,.35)">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px"><div style="font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:' + accent + '">' + esc(label) + '</div><div style="font-size:11px;color:var(--text-muted)">Block ' + esc(shell.activeIndex + 1) + ' of ' + esc(shell.blockCount) + '</div></div>';
    h += '<div style="font-size:18px;font-weight:900;color:var(--text-primary);margin-bottom:4px">' + esc(shell.title) + '</div>';
    h += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">' + esc(shell.statusLabel) + '</div>';
    h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">' + esc((shell.durationMin || shell.targetDurationMin || 10) + " min shell") + '</div>';
    h += '<div style="height:8px;border-radius:999px;background:rgba(255,255,255,.6);overflow:hidden;margin-bottom:8px"><div style="height:100%;width:' + esc(shell.progressPct) + '%;background:' + fill + '"></div></div>';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:var(--text-muted);margin-bottom:10px"><span>' + esc(shell.elapsedLabel) + '</span><span>' + esc(shell.remainingLabel) + '</span></div>';
    if (!opts.hideControls) {
      h += '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="act(\'' + shell.primaryAction + '\')" style="background:' + accent + ';color:#fff">' + esc(shell.primaryLabel) + '</button>';
      if (shell.canSkip) {
        h += '<button class="btn" onclick="act(\'sessionSkipBlock\')" style="background:var(--input-bg);color:var(--text-primary)">Skip Block</button>';
      }
      h += secondaryButton;
      h += '</div>';
    }
    return h + '</div>';
  }

  global.SparkSessionShellUI = {
    buildDailyShellSummary: buildDailyShellSummary,
    renderCompactSummary: renderCompactSummary,
    renderLiveCard: renderLiveCard
  };
})(typeof window !== "undefined" ? window : globalThis);
