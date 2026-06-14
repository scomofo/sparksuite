// ===== ChordSpark: Guided Session Pages =====
// Mirrors PianoSpark's 5-phase session flow: Spark → Review → NewMove → SongSlice → VictoryLap
// NewMove uses Watch→Shadow→Try→Refine (stickiness technique #3)
function getGuidedPageInstrument() {
  var inst;
  var candidate;
  var all;
  var i;
  var entry;
  if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
    return null;
  }
  inst = SparkInstruments.getActive();
  if (!inst) return null;
  if (typeof inst.getData === "function" || inst.ui) return inst;
  candidate = inst.id || inst.appId || inst.instrumentId || null;
  if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
  all = SparkInstruments.getAll() || [];
  for (i = 0; i < all.length; i++) {
    entry = all[i] || {};
    if (entry.id === candidate || entry.appId === candidate) return entry;
  }
  return inst;
}

// Wrapper — see js/utils/normalize.js for the canonical implementation.
function normalizeGuidedTextToken(value) { return SparkNormalize.textToken(value); }

function firstGuidedTextToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = normalizeGuidedTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

// Wrappers — see js/utils/normalize.js for canonical implementations.
function normalizeGuidedBpm(value, fallback) { return SparkNormalize.positiveInt(value, fallback); }
function normalizeGuidedCount(value, fallback) { return SparkNormalize.integer(value, fallback); }

function formatGuidedDurationLabel(totalSec) {
  var seconds = Math.max(0, normalizeGuidedCount(totalSec, 0));
  var minutes = Math.floor(seconds / 60);
  var remainder = seconds % 60;
  if (minutes > 0) {
    if (remainder > 0) return minutes + "m " + remainder + "s";
    return minutes + "m";
  }
  return remainder + "s";
}

function humanizeGuidedLabel(value) {
  var token = firstGuidedTextToken(value);
  if (!token) return "";
  return token.replace(/[-_]+/g, " ");
}

function getGuidedBlockTheme(blockType) {
  if (blockType === "warm_engine") {
    return {
      label: "Warm Engine Live",
      color: "#FFE66D",
      background: "#FFE66D22",
      textColor: "#8A6A00"
    };
  }
  if (blockType === "drill") {
    return {
      label: "Drill In Progress",
      color: "#FF8A5C",
      background: "#FF8A5C22",
      textColor: "#B6491E"
    };
  }
  if (blockType === "song") {
    return {
      label: "Song Block Live",
      color: "#45B7D1",
      background: "#45B7D122",
      textColor: "#1D7387"
    };
  }
  if (blockType === "cooldown") {
    return {
      label: "Cooldown Block",
      color: "#A78BFA",
      background: "#A78BFA22",
      textColor: "#6E56B3"
    };
  }
  return {
    label: "Guided Session",
    color: "var(--text-muted)",
    background: "var(--input-bg)",
    textColor: "var(--text-muted)"
  };
}

function getGuidedExtensionLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "";
  if (count === 1) return "Extra Focus Time";
  return "Extended Focus x" + count;
}

function getGuidedFocusStretchLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "";
  return "Focus Stretch x" + count;
}

function getGuidedExtendedModeLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "";
  return count > 1 ? "Extended session mode x" + count : "Extended session mode";
}

function getGuidedVictoryLapCopy(extensionCount, baseText) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  var fallback = firstGuidedTextToken(baseText, "Give it one confident final pass.");
  if (count <= 0) return fallback;
  if (count === 1) return "You're in extra focus time. Keep the groove easy and stay with what feels good.";
  if (count === 2) return "This is a real focus stretch now. Loop the part that still feels rewarding and let it breathe.";
  return "Deep focus stretch. Stay with the part that still gives you momentum and end whenever it feels complete.";
}

function getGuidedExtendCtaLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "Keep Going +5 min";
  if (count === 1) return "Keep Going +5 more min";
  return "Stretch Another +5 min";
}

function getGuidedExtendStatusLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "";
  if (count === 1) return "You're in extra focus time. Stay here as long as it feels useful.";
  if (count === 2) return "You're in a real focus stretch now. Keep looping the part that still feels alive.";
  return "Deep focus stretch is active. Stay with the useful part and wrap whenever you feel complete.";
}

function getGuidedCompleteCtaLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "Finish Session";
  if (count === 2) return "Wrap Up When Ready";
  return "Wrap Up Gently";
}

function getGuidedVictoryLapTitle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "Victory Lap!";
  if (count === 1) return "Extended Victory Lap!";
  if (count === 2) return "Focus Stretch Landing";
  return "Soft Landing";
}

function getGuidedVictoryLapSupportLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "";
  if (count === 2) return "Open landing. End on your terms.";
  return "Gentle landing. You can end whenever it feels complete.";
}

function getGuidedDoneTitle(extensionCount, sessionNum) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  var num = normalizeGuidedCount(sessionNum, 0);
  if (count < 2) return "Session " + num + " Complete!";
  if (count === 2) return "Session " + num + " Landed Smoothly";
  return "Session " + num + " Wrapped Gently";
}

function getGuidedDoneSupportLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 1) return "Nice work. Momentum counts.";
  if (count < 2) return "";
  if (count === 2) return "You ended from deep focus time. Nice work stopping on your terms.";
  return "You wrapped from a deep focus stretch. Nice work ending where it felt right.";
}

function getGuidedDoneTrackCompleteLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "Phase 1 Track Complete";
  if (count === 2) return "Track Complete, Smooth Landing";
  return "Track Complete, Soft Landing";
}

function getGuidedDoneTrackCompleteCopy(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "You finished every session in this track. Replay a favorite, switch instruments, or leave this one proudly in the bank.";
  if (count === 2) return "You finished the whole track and landed gently out of focus time. Replay this session if it feels good, or leave the full track banked for now.";
  return "You finished the whole track and brought it to a soft close. Let it rest here, or revisit a favorite session whenever it feels inviting.";
}

function getGuidedDoneSummaryLine(extensionCount, title) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  var safeTitle = firstGuidedTextToken(title, "Guided session");
  if (count < 2) return safeTitle;
  if (count === 2) return safeTitle + " · You can step away now or ease into whatever comes next.";
  return safeTitle + " · Leave a little space before the next thing if that feels good.";
}

function getGuidedDoneRecoveryTitle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "";
  if (count === 2) return "Good landing";
  return "Soft reset";
}

function getGuidedDoneRecoveryCopy(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "";
  if (count === 2) return "Take a breath, a sip of water, or a minute away from the instrument before you jump into the next thing.";
  return "A small pause now can help the next session feel clean and inviting whenever you come back.";
}

function getGuidedDoneCelebrationIcon(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "&#127881;";
  if (count === 2) return "&#127807;";
  return "&#127752;";
}

function getGuidedDoneCelebrationStyle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) {
    return "font-size:56px;animation:bn .6s ease;color:inherit";
  }
  if (count === 2) {
    return "font-size:52px;animation:bn .45s ease;color:#6E56B3;filter:saturate(.85)";
  }
  return "font-size:50px;animation:bn .35s ease;color:#7C8C6A;filter:saturate(.7)";
}

function getGuidedDoneStatLabels(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) {
    return {
      xp: "XP",
      streak: "Streak",
      sessions: "Sessions"
    };
  }
  if (count === 2) {
    return {
      xp: "Earned",
      streak: "Rhythm",
      sessions: "In Bank"
    };
  }
  return {
    xp: "Banked",
    streak: "Steady",
    sessions: "Session Bank"
  };
}

function getGuidedDoneStatsCardStyle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 1) return "border:1px solid #FFD78A;background:linear-gradient(135deg,#FFF7D6,#FFF0E7)";
  if (count === 2) return "border:1px solid #6E56B322;background:linear-gradient(135deg,#6E56B308,#F6F3FF)";
  return "border:1px solid #7C8C6A22;background:linear-gradient(135deg,#F4F7EF,#FFF8F1)";
}

function getGuidedDoneNextActionLabel(extensionCount, hasNextSession) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (hasNextSession === false) {
    if (count < 2) return "Play This One Again";
    if (count === 2) return "Revisit This Session Gently";
    return "Return Softly to This Session";
  }
  if (count < 2) return "Next Session";
  if (count === 2) return "Start Next Session Gently";
  return "Begin Another Softly";
}

function getGuidedDoneHomeLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "Home";
  if (count === 2) return "Land at Home";
  return "Ease Back Home";
}

function getGuidedDoneActionHint(extensionCount, hasNextSession) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (hasNextSession === false) {
    if (count < 2) return "You've reached the end of this track. Replay this one or head home whenever you like.";
    if (count === 2) return "You've reached the end of this track. Replay this session gently, or leave it here for now.";
    return "Track complete. You can revisit this session softly, or let it rest until the next spark.";
  }
  if (count < 2) return "";
  if (count === 2) return "Ready now is great. Later is great too.";
  return "You can leave this here and come back when the next spark shows up.";
}

function getGuidedDonePauseTitle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "";
  if (count === 2) return "Pause First";
  return "Take A Beat";
}

function getGuidedDonePauseCopy(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "";
  if (count === 2) return "Set the instrument down, roll your shoulders, and let the session settle for a moment.";
  return "Give yourself one quiet beat before choosing what comes next. The momentum will still be here.";
}

function getGuidedDoneNextActionStyle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff";
  if (count === 2) return "background:linear-gradient(135deg,#A78BFA,#FFB86B);color:#2F2347";
  return "background:linear-gradient(135deg,#C9D7B8,#F4C98B);color:#32402A";
}

function getGuidedDoneHomeStyle(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "background:#4ECDC4;color:#fff;margin-top:8px";
  if (count === 2) return "background:#E9E0FF;color:#6E56B3;margin-top:8px;border:1px solid #C8B5FF";
  return "background:#EEF4E4;color:#5F7351;margin-top:8px;border:1px solid #C9D7B8";
}

function getGuidedCooldownDetailLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count <= 0) return "Victory Lap";
  if (count === 1) return "Extra Focus";
  if (count === 2) return "Deep Focus Live";
  return "Deep Focus x" + count;
}

function getGuidedDeepFocusLabel(extensionCount) {
  var count = Math.max(0, normalizeGuidedCount(extensionCount, 0));
  if (count < 2) return "";
  if (count === 2) return "Deep Focus Stretch Active";
  return "Deep Focus Stretch x" + count;
}

function getGuidedShellElapsedLabel(shellSummary, elapsedMinutes, shellMinutes) {
  var extensionCount = normalizeGuidedCount(shellSummary && shellSummary.extensionCount, 0);
  if (extensionCount >= 2) {
    return (elapsedMinutes || 0) + "/" + (shellMinutes || 0) + " min in focus stretch";
  }
  return (elapsedMinutes || 0) + "/" + (shellMinutes || 0) + " min through session";
}

function getGuidedShellRemainingLabel(shellSummary) {
  var extensionCount = normalizeGuidedCount(shellSummary && shellSummary.extensionCount, 0);
  var remainingSec = normalizeGuidedCount(shellSummary && shellSummary.remainingSec, 0);
  if (extensionCount >= 2) {
    if (remainingSec > 0) return "Focus stretch is open. About " + formatGuidedDurationLabel(remainingSec) + " available if you want it.";
    return "Focus stretch is open. Wrap whenever it feels complete.";
  }
  if (remainingSec > 0) return formatGuidedDurationLabel(remainingSec) + " left";
  return "Done";
}

function renderGuidedActiveBlockBadge(blockType, shellSummary) {
  var theme = getGuidedBlockTheme(blockType);
  var extensionCount = shellSummary ? normalizeGuidedCount(shellSummary.extensionCount, 0) : 0;
  var focusStretchLabel = blockType === "cooldown" ? getGuidedFocusStretchLabel(extensionCount) : "";
  var badgeLabel = focusStretchLabel || (theme && theme.label ? theme.label : "");
  if (!theme || !theme.label) return "";
  return '<div style="display:flex;justify-content:center;margin:0 0 12px">' +
    '<span class="guided-pill" style="background:' + theme.background + ';color:' + theme.textColor + '">' +
      escHTML(badgeLabel) +
    '</span>' +
    '</div>';
}

function renderGuidedStopConfirmation() {
  return '<div class="card" style="border:2px solid #FF6B6B33;background:#FF6B6B12;text-align:left;margin:8px 0 14px">' +
    '<div class="guided-card-heading" style="color:var(--text-primary);margin-bottom:6px">End this session?</div>' +
    '<p style="font-size:13px;color:var(--text-secondary);margin:0 0 12px">You can stop now and return to practice, or keep this guided session open.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn" onclick="act(\'guidedCancelStop\')" style="background:var(--input-bg);color:var(--text-primary);font-weight:800">Keep Playing</button>' +
      '<button class="btn" onclick="act(\'guidedStop\')" style="background:#FF6B6B;color:#fff;font-weight:800">End Session</button>' +
    '</div>' +
    '</div>';
}

function getGuidedInstrumentType() {
  var inst = getGuidedPageInstrument();
  return firstGuidedTextToken(
    inst && inst.instrumentType,
    inst && inst.type,
    inst && inst.id,
    inst && inst.appId,
    S && S.instrument,
    S && S.activeInstrument
  );
}

function getGuidedSessionTotalCount() {
  var inst = getGuidedPageInstrument();
  var D = inst && typeof inst.getData === "function" ? inst.getData() : null;
  var coreView = getGuidedPageCoreView();
  var context = coreView && coreView.plan && coreView.plan.context ? coreView.plan.context : null;
  var summary;
  var instrumentType;
  if (normalizeGuidedCount(context && context.totalGuidedSessions, 0) > 0) {
    return normalizeGuidedCount(context.totalGuidedSessions, 0);
  }
  if (D && Array.isArray(D.SESSIONS) && D.SESSIONS.length) {
    return D.SESSIONS.length;
  }
  instrumentType = getGuidedInstrumentType();
  if (instrumentType && typeof SparkCurriculumV2 !== "undefined" && SparkCurriculumV2 && typeof SparkCurriculumV2.getTrackSummary === "function") {
    summary = SparkCurriculumV2.getTrackSummary(instrumentType);
    if (summary) return normalizeGuidedCount(summary.sessionCount, 0);
  }
  return 22;
}

function guidedStepIndicator(step) {
  var steps = [
    {id:"spark",label:"Spark",icon:"&#10024;"},
    {id:"review",label:"Review",icon:"&#128260;"},
    {id:"newMove",label:"New Move",icon:"&#127919;"},
    {id:"songSlice",label:"Song",icon:"&#127925;"},
    {id:"victoryLap",label:"Victory",icon:"&#127942;"}
  ];
  var h = '<div style="display:flex;gap:4px;justify-content:center;margin-bottom:16px">';
  var reached = false;
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i], active = step === s.id;
    if (active) reached = true;
    var done = !reached && !active;
    h += '<div style="flex:1;text-align:center;padding:6px 2px;border-radius:10px;font-size:11px;font-weight:700;background:' +
      (active ? 'linear-gradient(135deg,#FF6B6B,#FF8A5C)' : done ? '#4ECDC422' : 'var(--input-bg)') +
      ';color:' + (active ? '#fff' : done ? '#4ECDC4' : 'var(--text-muted)') + '">' +
      (done ? '&#9989; ' : '') + s.icon + '<br>' + s.label + '</div>';
  }
  h += '</div>';
  return h;
}

function getGuidedBlockProgress(plan, corePlan, runtimeState) {
  var blockOrder = ["warm_engine", "drill", "song", "cooldown"];
  var segments = corePlan && Array.isArray(corePlan.segments) ? corePlan.segments : [];
  var activeSegmentId = runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null;
  var guidedStep = runtimeState && runtimeState.guidedStep
    ? runtimeState.guidedStep
    : (typeof S !== "undefined" && S.guidedStep ? S.guidedStep : null);
  var guidedNewMovePhase = runtimeState && runtimeState.guidedNewMovePhase ? runtimeState.guidedNewMovePhase : null;
  var stepBlockTypeMap = {
    spark: "warm_engine",
    review: "drill",
    newMove: "drill",
    songSlice: "song",
    victoryLap: "cooldown"
  };
  var activeBlockType = runtimeState && runtimeState.guidedBlockType
    ? runtimeState.guidedBlockType
    : (guidedStep && stepBlockTypeMap[guidedStep] ? stepBlockTypeMap[guidedStep] : null);
  var activeBlockIndex = activeBlockType ? blockOrder.indexOf(activeBlockType) : -1;
  var progress = [];
  var nextPendingAssigned = false;
  var i;
  var blockType;
  var segment;
  var label;
  var state;

  for (i = 0; i < blockOrder.length; i++) {
    blockType = blockOrder[i];
    segment = null;
    for (var j = 0; j < segments.length; j++) {
      if (segments[j] && segments[j].meta && segments[j].meta.guidedBlockType === blockType) {
        segment = segments[j];
        break;
      }
    }
    label = firstGuidedTextToken(
      segment && segment.label,
      segment && segment.title,
      segment && segment.name,
      humanizeGuidedLabel(blockType)
    );
    state = "";
    if (activeBlockIndex >= 0 && i < activeBlockIndex) {
      state = "done";
    } else if (activeBlockIndex >= 0 && i === activeBlockIndex) {
      state = "now";
    } else if (segment && segment.completed) {
      state = "done";
    } else if (segment && activeSegmentId && segment.id === activeSegmentId) {
      state = "now";
    } else if (segment && !nextPendingAssigned) {
      state = "up next";
      nextPendingAssigned = true;
    }
    progress.push({
      id: segment && segment.id ? segment.id : blockType,
      label: label,
      durationSec: normalizeGuidedCount(segment && segment.durationSec, 0),
      extensionSec: normalizeGuidedCount(segment && segment.meta && segment.meta.guidedExtensionSec, 0),
      extensionCount: normalizeGuidedCount(segment && segment.meta && segment.meta.guidedExtensionCount, 0),
      state: state,
      detail: state === "now"
        ? (blockType === "cooldown"
          ? getGuidedCooldownDetailLabel(normalizeGuidedCount(segment && segment.meta && segment.meta.guidedExtensionCount, 0))
          : getGuidedBlockProgressDetail(blockType, guidedStep, guidedNewMovePhase))
        : "",
      progressRatio: state === "done"
        ? 1
        : (state === "now"
          ? getGuidedBlockProgressRatio(blockType, guidedStep, guidedNewMovePhase, runtimeState, segment)
          : 0),
      remainingSec: state === "done"
        ? 0
        : Math.max(0, normalizeGuidedCount(segment && segment.durationSec, 0) - Math.round(normalizeGuidedCount(segment && segment.durationSec, 0) * (
          state === "now"
            ? getGuidedBlockProgressRatio(blockType, guidedStep, guidedNewMovePhase, runtimeState, segment)
            : 0
        )))
    });
  }

  return progress;
}

function getGuidedBlockProgressRatio(blockType, guidedStep, guidedNewMovePhase, runtimeState, segment) {
  var durationMs = normalizeGuidedCount(segment && segment.durationSec, 0) * 1000;
  var transportPositionMs = runtimeState && runtimeState.transport
    ? normalizeGuidedCount(runtimeState.transport.positionMs, 0)
    : 0;
  var phaseOrder = ["watch", "shadow", "try", "refine"];
  var phaseIndex;
  if (durationMs > 0 && transportPositionMs > 0) {
    return Math.max(0, Math.min(1, transportPositionMs / durationMs));
  }
  if (blockType === "warm_engine") return guidedStep === "spark" ? 0.5 : 0;
  if (blockType === "song") return guidedStep === "songSlice" ? 0.5 : 0;
  if (blockType === "cooldown") return guidedStep === "victoryLap" ? 0.5 : 0;
  if (blockType !== "drill") return 0;
  if (guidedStep === "review") return 0.2;
  if (guidedStep !== "newMove") return 0;
  phaseIndex = phaseOrder.indexOf(guidedNewMovePhase);
  if (phaseIndex === -1) return 0.35;
  return Math.max(0, Math.min(1, (phaseIndex + 1) / phaseOrder.length));
}

function getGuidedBlockProgressDetail(blockType, guidedStep, guidedNewMovePhase) {
  var phaseLabels = {
    watch: "Watch",
    shadow: "Shadow",
    try: "Try",
    refine: "Refine"
  };
  var phaseOrder = ["watch", "shadow", "try", "refine"];
  var phaseIndex;
  if (blockType === "warm_engine") return "Spark";
  if (blockType === "song") return "Song Slice";
  if (blockType === "cooldown") return "Victory Lap";
  if (blockType !== "drill") return "";
  if (guidedStep === "review") return "Review Pass";
  if (guidedStep !== "newMove") return "";
  phaseIndex = phaseOrder.indexOf(guidedNewMovePhase);
  if (phaseIndex === -1) return "New Move";
  return phaseLabels[guidedNewMovePhase] + " " + (phaseIndex + 1) + "/" + phaseOrder.length;
}

function getGuidedQuickAction(guidedView) {
  var step = guidedView && guidedView.guidedStep ? guidedView.guidedStep : null;
  var phase = guidedView && guidedView.newMovePhase ? guidedView.newMovePhase : null;
  var extensionCount = guidedView && guidedView.shellSummary
    ? normalizeGuidedCount(guidedView.shellSummary.extensionCount, 0)
    : 0;
  if (step === "victoryLap") {
    return { action: "guidedComplete", label: getGuidedCompleteCtaLabel(extensionCount) };
  }
  if (step === "newMove" && phase && phase !== "refine") {
    return { action: "guidedAdvancePhase", label: "Continue" };
  }
  if (step === "newMove" && phase === "refine") {
    return { action: "guidedNext", label: "Continue" };
  }
  if (step === "spark" || step === "review" || step === "songSlice") {
    return { action: "guidedNext", label: "Continue" };
  }
  return null;
}

function getGuidedExtendAction(guidedView) {
  var step = guidedView && guidedView.guidedStep ? guidedView.guidedStep : null;
  var extensionCount = guidedView && guidedView.shellSummary
    ? normalizeGuidedCount(guidedView.shellSummary.extensionCount, 0)
    : 0;
  if (step === "victoryLap") {
    return {
      action: "guidedExtendBlock",
      label: getGuidedExtendCtaLabel(extensionCount)
    };
  }
  return null;
}

function getGuidedSkipAction(guidedView) {
  var step = guidedView && guidedView.guidedStep ? guidedView.guidedStep : null;
  if (step === "spark") {
    return { action: "guidedSkipBlock", label: "Skip Warm-Up" };
  }
  if (step === "review" || step === "newMove") {
    return { action: "guidedSkipBlock", label: "Skip Drill" };
  }
  if (step === "songSlice") {
    return { action: "guidedSkipBlock", label: "Skip Song" };
  }
  return null;
}

function getGuidedTransportAction(guidedView) {
  var runtimeState = guidedView && guidedView.runtimeState ? guidedView.runtimeState : null;
  var step = guidedView && guidedView.guidedStep ? guidedView.guidedStep : null;
  var status = runtimeState && runtimeState.transport ? runtimeState.transport.status : "";
  if (step === "victoryLap" && status === "completed") return null;
  if (status === "paused") return { action: "guidedResumeBlock", label: "Resume Block" };
  if (status === "running") return { action: "guidedPauseBlock", label: "Pause Block" };
  return null;
}

function renderGuidedBlockProgress(blockProgress, guidedView) {
  if (!blockProgress || !blockProgress.length) return "";
  return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 16px">' +
    blockProgress.map(function(block) {
      var quickAction = block.state === "now" ? getGuidedQuickAction(guidedView) : null;
      var extendAction = block.state === "now" ? getGuidedExtendAction(guidedView) : null;
      var skipAction = block.state === "now" ? getGuidedSkipAction(guidedView) : null;
      var transportAction = block.state === "now" ? getGuidedTransportAction(guidedView) : null;
      var durationLabel = block.durationSec > 0
        ? Math.max(1, Math.round(block.durationSec / 60)) + " min"
        : "";
      var extensionLabel = block.extensionSec > 0
        ? "+" + Math.max(1, Math.round(block.extensionSec / 60)) + " min extra"
        : "";
      var extensionThemeLabel = getGuidedExtensionLabel(block.extensionCount);
      var focusStretchLabel = getGuidedFocusStretchLabel(block.extensionCount);
      var deepFocusLabel = getGuidedDeepFocusLabel(block.extensionCount);
      var remainingLabel = block.state === "now" && block.remainingSec > 0
        ? formatGuidedDurationLabel(block.remainingSec) + " left"
        : "";
      var progressPercent = Math.max(0, Math.min(100, Math.round((block.progressRatio || 0) * 100)));
      var stateColor = block.state === "done"
        ? "#4ECDC4"
        : block.state === "now"
          ? "#FF8A5C"
          : "var(--text-muted)";
      var cardBackground = block.extensionCount > 0
        ? (block.extensionCount >= 2
          ? "linear-gradient(135deg,#6E56B322,#A78BFA1C,#FFFFFFCC)"
          : "linear-gradient(135deg,#A78BFA18,#FFFFFFCC)")
        : "var(--input-bg)";
      var cardBorder = block.extensionCount > 0
        ? (block.extensionCount >= 2 ? "1px solid #6E56B366" : "1px solid #A78BFA44")
        : "1px solid transparent";
      var progressBarFill = block.extensionCount >= 2
        ? "linear-gradient(135deg,#6E56B3,#FF8A5C)"
        : stateColor;
      // Inactive blocks show no status badge. (A literal "&nbsp;" here was
      // HTML-escaped to "&amp;nbsp;" and then uppercased by the pill's
      // text-transform, rendering as the visible text "&NBSP;".)
      var stateText = block.state ? block.state : "";
      return '<div style="padding:10px 12px;border-radius:12px;background:' + cardBackground + ';border:' + cardBorder + ';text-align:left">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">' +
          '<span class="guided-block-title">' + escHTML(block.label) + '</span>' +
          '<span class="guided-pill" style="color:' + stateColor + ';text-transform:uppercase;padding:0;background:transparent">' + escHTML(stateText) + '</span>' +
        '</div>' +
        '<div style="font-size:11px;font-weight:700;color:' + (block.state === "now" ? "#FF8A5C" : "var(--text-muted)") + ';min-height:14px;margin-bottom:2px">' +
          escHTML(block.detail || " ") +
        '</div>' +
        '<div style="height:6px;border-radius:999px;background:#FFFFFF88;overflow:hidden;margin-bottom:6px">' +
          '<div style="height:100%;width:' + progressPercent + '%;background:' + progressBarFill + ';border-radius:999px"></div>' +
        '</div>' +
        '<div style="font-size:11px;color:' + (block.state === "now" ? "#FF8A5C" : "var(--text-muted)") + ';min-height:14px;margin-bottom:2px">' +
          escHTML(remainingLabel || " ") +
        '</div>' +
        '<div style="font-size:11px;color:' + (extensionLabel ? stateColor : "var(--text-muted)") + ';min-height:14px;margin-bottom:2px">' +
          escHTML(extensionLabel || " ") +
        '</div>' +
        '<div class="guided-status-line" style="font-size:11px;color:' + (extensionThemeLabel ? "#A78BFA" : "var(--text-muted)") + ';min-height:14px;margin-bottom:2px">' +
          escHTML(extensionThemeLabel || " ") +
        '</div>' +
        '<div class="guided-status-line" style="font-size:11px;color:' + (focusStretchLabel ? "#6E56B3" : "var(--text-muted)") + ';min-height:14px;margin-bottom:2px">' +
          escHTML(focusStretchLabel || " ") +
        '</div>' +
        '<div class="guided-status-line" style="font-size:11px;color:' + (deepFocusLabel ? "#5B46A3" : "var(--text-muted)") + ';min-height:14px;margin-bottom:2px">' +
          escHTML(deepFocusLabel || " ") +
        '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">' + escHTML(durationLabel || " ") + '</div>' +
        (quickAction || transportAction || extendAction || skipAction
          ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
              (quickAction
                ? '<button class="btn" onclick="act(\'' + quickAction.action + '\')" style="padding:8px 12px;font-size:12px;font-weight:800;background:' + stateColor + ';color:' + (block.state === "done" ? "#0F3D38" : "#fff") + '">' + escHTML(quickAction.label) + '</button>'
                : '') +
              (transportAction
                ? '<button class="btn" onclick="act(\'' + transportAction.action + '\')" style="padding:8px 12px;font-size:12px;font-weight:800;background:#fff;color:' + stateColor + ';border:1px solid ' + stateColor + '">' + escHTML(transportAction.label) + '</button>'
                : '') +
              (extendAction
                ? '<button class="btn" onclick="act(\'' + extendAction.action + '\')" style="padding:8px 12px;font-size:12px;font-weight:800;background:transparent;color:' + stateColor + ';border:1px solid ' + stateColor + '">' + escHTML(extendAction.label) + '</button>'
                : '') +
              (skipAction
                ? '<button class="btn" onclick="act(\'' + skipAction.action + '\')" style="padding:8px 12px;font-size:12px;font-weight:800;background:transparent;color:' + stateColor + ';border:1px solid ' + stateColor + '">' + escHTML(skipAction.label) + '</button>'
                : '') +
            '</div>'
          : "") +
      '</div>';
    }).join("") +
    '</div>';
}

function getGuidedShellSummary(corePlan, blockProgress, runtimeState) {
  var summary = {
    activeBlockIndex: 0,
    totalBlocks: blockProgress ? blockProgress.length : 0,
    totalDurationSec: 0,
    extensionSec: 0,
    extensionCount: 0,
    activeBlockLabel: "",
    activeBlockDurationSec: 0,
    elapsedSec: 0,
    completionRatio: 0,
    remainingSec: 0
  };
  var activeSegmentId = runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null;
  var i;
  var activeBlock = null;
  if (corePlan && corePlan.context) {
    summary.totalDurationSec = normalizeGuidedCount(corePlan.context.guidedShellDurationSec, 0);
    summary.extensionSec = normalizeGuidedCount(corePlan.context.guidedShellExtensionSec, 0);
    summary.extensionCount = normalizeGuidedCount(corePlan.context.guidedShellExtensionCount, 0);
  }
  if (!summary.totalDurationSec && blockProgress && blockProgress.length) {
    for (i = 0; i < blockProgress.length; i++) {
      summary.totalDurationSec += normalizeGuidedCount(blockProgress[i] && blockProgress[i].durationSec, 0);
    }
  }
  if (blockProgress && blockProgress.length) {
    for (i = 0; i < blockProgress.length; i++) {
      if (blockProgress[i] && blockProgress[i].state === "now") {
        activeBlock = blockProgress[i];
        summary.activeBlockIndex = i + 1;
        break;
      }
    }
    if (!activeBlock && activeSegmentId) {
      for (i = 0; i < blockProgress.length; i++) {
        if (blockProgress[i] && blockProgress[i].id === activeSegmentId) {
          activeBlock = blockProgress[i];
          summary.activeBlockIndex = i + 1;
          break;
        }
      }
    }
    if (!activeBlock) {
      for (i = 0; i < blockProgress.length; i++) {
        if (blockProgress[i] && blockProgress[i].state !== "done") {
          activeBlock = blockProgress[i];
          summary.activeBlockIndex = i + 1;
          break;
        }
      }
    }
    if (!activeBlock && blockProgress[blockProgress.length - 1]) {
      activeBlock = blockProgress[blockProgress.length - 1];
      summary.activeBlockIndex = blockProgress.length;
    }
    for (i = 0; i < blockProgress.length; i++) {
      if (!blockProgress[i]) continue;
      if (blockProgress[i].state === "done") {
        summary.elapsedSec += normalizeGuidedCount(blockProgress[i].durationSec, 0);
      } else if (activeBlock && blockProgress[i].id === activeBlock.id) {
        summary.elapsedSec += Math.round(normalizeGuidedCount(blockProgress[i].durationSec, 0) * (blockProgress[i].progressRatio || 0));
      }
    }
  }
  summary.activeBlockLabel = firstGuidedTextToken(activeBlock && activeBlock.label);
  summary.activeBlockDurationSec = normalizeGuidedCount(activeBlock && activeBlock.durationSec, 0);
  summary.completionRatio = summary.totalDurationSec > 0
    ? Math.max(0, Math.min(1, summary.elapsedSec / summary.totalDurationSec))
    : 0;
  summary.remainingSec = Math.max(0, summary.totalDurationSec - summary.elapsedSec);
  return summary;
}

function renderGuidedShellSummary(shellSummary) {
  var shellMinutes;
  var blockMinutes;
  var elapsedMinutes;
  var remainingLabel;
  var extensionLabel;
  var extensionThemeLabel;
  var focusStretchLabel;
  var deepFocusLabel;
  var extendedModeLabel;
  var summaryBackground;
  var summaryBorder;
  var progressFill;
  var detail = [];
  var progressPercent;
  if (!shellSummary || !shellSummary.totalBlocks) return "";
  shellMinutes = shellSummary.totalDurationSec > 0
    ? Math.max(1, Math.round(shellSummary.totalDurationSec / 60))
    : 0;
  blockMinutes = shellSummary.activeBlockDurationSec > 0
    ? Math.max(1, Math.round(shellSummary.activeBlockDurationSec / 60))
    : 0;
  elapsedMinutes = shellSummary.elapsedSec > 0
    ? Math.max(1, Math.round(shellSummary.elapsedSec / 60))
    : 0;
  progressPercent = Math.max(0, Math.min(100, Math.round((shellSummary.completionRatio || 0) * 100)));
  remainingLabel = getGuidedShellRemainingLabel(shellSummary);
  extensionLabel = shellSummary.extensionSec > 0
    ? "+" + Math.max(1, Math.round(shellSummary.extensionSec / 60)) + " min extra focus time"
    : "";
  extensionThemeLabel = getGuidedExtensionLabel(shellSummary.extensionCount);
  focusStretchLabel = getGuidedFocusStretchLabel(shellSummary.extensionCount);
  deepFocusLabel = getGuidedDeepFocusLabel(shellSummary.extensionCount);
  extendedModeLabel = getGuidedExtendedModeLabel(shellSummary.extensionCount);
  summaryBackground = shellSummary.extensionCount > 0
    ? (shellSummary.extensionCount >= 2
      ? "linear-gradient(135deg,#6E56B328,#A78BFA22,#FF8A5C18)"
      : "linear-gradient(135deg,#A78BFA22,#FF8A5C16)")
    : "linear-gradient(135deg,#FF8A5C11,#4ECDC411)";
  summaryBorder = shellSummary.extensionCount > 0
    ? (shellSummary.extensionCount >= 2 ? "1px solid #6E56B366" : "1px solid #A78BFA44")
    : "1px solid transparent";
  progressFill = shellSummary.extensionCount >= 2
    ? "linear-gradient(135deg,#6E56B3,#FF8A5C)"
    : "linear-gradient(135deg,#FF8A5C,#4ECDC4)";
  if (shellSummary.activeBlockLabel) detail.push(shellSummary.activeBlockLabel);
  if (blockMinutes > 0) detail.push(blockMinutes + " min block");
  if (shellMinutes > 0) detail.push(shellMinutes + " min shell");
  return '<div style="margin:0 0 14px;padding:12px 14px;border-radius:14px;background:' + summaryBackground + ';border:' + summaryBorder + ';text-align:left">' +
    '<div class="guided-status-line" style="color:var(--text-primary);text-transform:uppercase">Block ' +
      shellSummary.activeBlockIndex + ' of ' + shellSummary.totalBlocks + '</div>' +
    '<div style="height:8px;border-radius:999px;background:#FFFFFF88;overflow:hidden;margin-top:8px">' +
      '<div style="height:100%;width:' + progressPercent + '%;background:' + progressFill + ';border-radius:999px"></div>' +
    '</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + escHTML(detail.join(" • ")) + '</div>' +
    '<div style="font-size:11px;color:var(--text-muted);margin-top:3px">' + escHTML(getGuidedShellElapsedLabel(shellSummary, elapsedMinutes, shellMinutes)) + '</div>' +
    '<div style="font-size:11px;color:#A78BFA;margin-top:2px;min-height:14px">' + escHTML(extensionLabel || " ") + '</div>' +
    '<div class="guided-status-line" style="font-size:11px;color:#A78BFA;margin-top:2px;min-height:14px">' + escHTML(extensionThemeLabel || " ") + '</div>' +
    '<div class="guided-status-line" style="font-size:11px;color:#6E56B3;margin-top:2px;min-height:14px">' + escHTML(focusStretchLabel || " ") + '</div>' +
    '<div class="guided-status-line" style="font-size:11px;color:#5B46A3;margin-top:2px;min-height:14px">' + escHTML(deepFocusLabel || " ") + '</div>' +
    '<div class="guided-status-line" style="font-size:11px;color:#8B5CF6;margin-top:2px;min-height:14px">' + escHTML(extendedModeLabel || " ") + '</div>' +
    '<div style="font-size:11px;color:#FF8A5C;margin-top:2px">' + escHTML(remainingLabel) + '</div>' +
    '</div>';
}

function newMovePhaseIndicator(phase) {
  var phases = [
    {id:"watch",label:"Watch",icon:"&#128064;"},
    {id:"shadow",label:"Shadow",icon:"&#129306;"},
    {id:"try",label:"Try",icon:"&#127919;"},
    {id:"refine",label:"Refine",icon:"&#128161;"}
  ];
  var h = '<div style="display:flex;gap:6px;justify-content:center;margin:10px 0">';
  var reached = false;
  for (var i = 0; i < phases.length; i++) {
    var p = phases[i], active = phase === p.id;
    if (active) reached = true;
    var done = !reached && !active;
    h += '<span style="padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;background:' +
      (active ? '#4ECDC4' : done ? '#4ECDC422' : 'var(--input-bg)') +
      ';color:' + (active ? '#fff' : done ? '#4ECDC4' : 'var(--text-muted)') + '">' +
      p.icon + ' ' + p.label + '</span>';
  }
  h += '</div>';
  return h;
}

function guidedSessionPage() {
  var guidedView = getGuidedSessionView();
  var plan = guidedView.plan;
  var guidedStep = guidedView.guidedStep;
  var guidedBpm;
  if (plan && !plan.spark) {
    plan = {
      id: plan.id || null,
      num: plan.num || 1,
      title: plan.title || "Session",
      level: plan.level || 1,
      bpm: plan.bpm || 80,
      focus_song: plan.focus_song || null,
      blockActivities: plan.blockActivities || null,
      spark: plan.spark || { text: plan.desc || "Practice this skill!" },
      review: plan.review || null,
      newMove: plan.newMove || (plan.skill ? { text: "Focus on: " + plan.skill, chord: null } : null),
      songSlice: plan.songSlice || null,
      victoryLap: plan.victoryLap || { text: "Great work on " + (plan.title || "this session") + "!" }
    };
  }
  if (!plan) return '<div class="card text-center"><p>No session loaded.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';
  var guidedTitle = firstGuidedTextToken(plan.title, plan.id, "Guided session");
  guidedBpm = normalizeGuidedBpm(plan.bpm, 80);

  var h = '<div class="text-center">';
  h += '<button class="back-btn" onclick="act(\'guidedConfirmStop\')">&#8592; Exit</button>';
  h += '<h2 class="guided-session-title">Session ' + plan.num + ': ' + escHTML(guidedTitle) + '</h2>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Level ' + plan.level + ' &bull; ' + guidedBpm + ' BPM</div>';
  if (guidedView.shellSummary && guidedView.shellSummary.extensionCount > 0) {
    h += '<div style="display:flex;justify-content:center;margin:-4px 0 12px">' +
      '<span class="guided-pill" style="background:#A78BFA22;border:1px solid #A78BFA44;color:#6E56B3">' +
        escHTML(getGuidedExtendedModeLabel(guidedView.shellSummary.extensionCount)) +
      '</span>' +
      '</div>';
  }
  if (S.guidedStopConfirm) {
    h += renderGuidedStopConfirmation();
  }
  h += renderGuidedActiveBlockBadge(guidedView.activeBlockType, guidedView.shellSummary);

  h += renderGuidedShellSummary(guidedView.shellSummary);
  h += guidedStepIndicator(guidedStep);
  h += renderGuidedBlockProgress(guidedView.blockProgress, guidedView);

  // Render current step
  switch (guidedStep) {
    case "spark": h += _guidedSpark(plan); break;
    case "review": h += _guidedReview(plan); break;
    case "newMove": h += _guidedNewMove(plan); break;
    case "songSlice": h += _guidedSongSlice(plan); break;
    case "victoryLap": h += _guidedVictoryLap(plan); break;
    default: h += '<div class="card"><p>Session complete!</p></div>';
  }

  h += '</div>';
  return h;
}

function getGuidedStepActivity(plan, step) {
  var blockActivities = plan && plan.blockActivities ? plan.blockActivities : null;
  if (!blockActivities) return null;
  if (step === "spark") return blockActivities.warm_engine || null;
  if (step === "review" || step === "newMove") return blockActivities.drill || null;
  if (step === "songSlice") return blockActivities.song || null;
  if (step === "victoryLap") return blockActivities.cooldown || null;
  return null;
}

function resolveGuidedViewActivity(plan, step, runtimeState) {
  var activity = null;
  var blockActivities = plan && plan.blockActivities ? plan.blockActivities : null;
  if (!blockActivities) return null;
  if (runtimeState && runtimeState.guidedActivityId) {
    for (var blockType in blockActivities) {
      if (!Object.prototype.hasOwnProperty.call(blockActivities, blockType)) continue;
      activity = blockActivities[blockType];
      if (activity && activity.id === runtimeState.guidedActivityId) return activity;
    }
  }
  activity = getGuidedStepActivity(plan, step);
  if (!activity) return null;
  if (
    runtimeState
    && (runtimeState.guidedActivityId || runtimeState.guidedActivityKind || runtimeState.guidedBlockType)
    && (!activity.id || !activity.kind || !activity.block_type)
  ) {
    return Object.assign({}, activity, {
      id: activity.id || runtimeState.guidedActivityId || null,
      kind: activity.kind || runtimeState.guidedActivityKind || null,
      block_type: activity.block_type || runtimeState.guidedBlockType || null
    });
  }
  return activity;
}

function resolveGuidedActiveBlockType(plan, step, runtimeState, corePlan, activeActivity) {
  var segments;
  var activeSegmentId;
  var i;
  if (runtimeState && runtimeState.guidedBlockType) return runtimeState.guidedBlockType;
  if (activeActivity && activeActivity.block_type) return activeActivity.block_type;
  activeSegmentId = runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null;
  segments = corePlan && Array.isArray(corePlan.segments) ? corePlan.segments : [];
  if (activeSegmentId) {
    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === activeSegmentId && segments[i].meta && segments[i].meta.guidedBlockType) {
        return segments[i].meta.guidedBlockType;
      }
    }
  }
  activeActivity = getGuidedStepActivity(plan, step);
  return activeActivity && activeActivity.block_type ? activeActivity.block_type : null;
}

function getGuidedPageCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function renderGuidedActivityMeta(activity, fallbackFocusSong) {
  var chips = [];
  var durationSec;
  var minutes;
  var focusSong;
  var kindLabel;
  if (!activity) return "";
  durationSec = normalizeGuidedCount(activity.duration_sec, 0);
  if (durationSec > 0) {
    minutes = Math.max(1, Math.round(durationSec / 60));
    chips.push(minutes + " min");
  }
  kindLabel = humanizeGuidedLabel(activity.block_type || activity.kind);
  if (kindLabel) chips.push(kindLabel);
  focusSong = firstGuidedTextToken(activity.focus_song, fallbackFocusSong);
  if (focusSong) chips.push(focusSong);
  if (!chips.length) return "";
  return '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 12px">' +
    chips.map(function(chip) {
      return '<span style="padding:6px 10px;border-radius:999px;background:var(--input-bg);font-size:12px;font-weight:700;color:var(--text-muted)">' +
        escHTML(chip) + '</span>';
    }).join("") +
    '</div>';
}

function getGuidedActivityCopy(activity, key) {
  if (!activity || !activity.copy) return "";
  return firstGuidedTextToken(activity.copy[key]);
}

function buildGuidedPhasePrompt(activity, phase) {
  var kind = firstGuidedTextToken(activity && activity.kind);
  if (phase === "watch") {
    return firstGuidedTextToken(
      getGuidedActivityCopy(activity, "setup"),
      kind === "tuning" ? "Watch the target pitch move before you play along." : "",
      "Observe the chord shape and finger placement. Don't play yet."
    );
  }
  if (phase === "shadow") {
    return firstGuidedTextToken(
      getGuidedActivityCopy(activity, "retry"),
      kind === "tuning" ? "Shadow the tuning move first, then make the sound." : "",
      "Tap where each finger goes on the diagram below."
    );
  }
  if (phase === "try") {
    return firstGuidedTextToken(
      getGuidedActivityCopy(activity, "setup"),
      "Practice the new move slowly and cleanly."
    );
  }
  if (phase === "refine") {
    return firstGuidedTextToken(
      getGuidedActivityCopy(activity, "success"),
      "Focus on clean transitions and consistent finger placement."
    );
  }
  return "";
}

function getGuidedCardTheme(blockType) {
  var theme = getGuidedBlockTheme(blockType);
  return {
    badge: theme && theme.label ? theme.label : "Guided Session",
    borderColor: theme && theme.color ? theme.color : "var(--text-muted)",
    titleColor: theme && theme.textColor ? theme.textColor : "var(--text-primary)",
    badgeBackground: theme && theme.background ? theme.background : "var(--input-bg)",
    badgeTextColor: theme && theme.textColor ? theme.textColor : "var(--text-muted)"
  };
}

function renderGuidedCardHeader(title, icon, theme) {
  var resolvedTheme = theme || getGuidedCardTheme(null);
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin:0 0 8px">' +
    '<h3 class="guided-card-heading" style="color:' + resolvedTheme.titleColor + '">' + icon + " " + escHTML(title) + '</h3>' +
    '<span class="guided-pill" style="background:' + resolvedTheme.badgeBackground + ';color:' + resolvedTheme.badgeTextColor + '">' +
      escHTML(resolvedTheme.badge) +
    '</span>' +
    '</div>';
}

function getGuidedAdvanceLabel(step, newMovePhase) {
  if (step === "spark") return "Into Review " + String.fromCharCode(8594);
  if (step === "review") return "Into New Move " + String.fromCharCode(8594);
  if (step === "newMove") {
    if (newMovePhase === "watch") return "Start Shadow " + String.fromCharCode(8594);
    if (newMovePhase === "shadow") return "Start Try " + String.fromCharCode(8594);
    if (newMovePhase === "try") return "Into Refine " + String.fromCharCode(8594);
    if (newMovePhase === "refine") return "Into Song " + String.fromCharCode(8594);
    return "Keep Going " + String.fromCharCode(8594);
  }
  if (step === "songSlice") return "Into Cooldown " + String.fromCharCode(8594);
  if (step === "victoryLap") return String.fromCharCode(127881) + " Complete Session!";
  return "Next " + String.fromCharCode(8594);
}

function getGuidedActiveBlockSnapshot(blockProgress) {
  var i;
  if (!blockProgress || !blockProgress.length) return null;
  for (i = 0; i < blockProgress.length; i++) {
    if (blockProgress[i] && blockProgress[i].state === "now") return blockProgress[i];
  }
  for (i = 0; i < blockProgress.length; i++) {
    if (blockProgress[i] && blockProgress[i].state !== "done") return blockProgress[i];
  }
  return blockProgress[blockProgress.length - 1] || null;
}

function renderGuidedActionStatus(guidedView, accentColor) {
  var activeBlock = getGuidedActiveBlockSnapshot(guidedView && guidedView.blockProgress);
  var statusText = "";
  var statusColor = accentColor || "#FF8A5C";
  var transportStatus = guidedView && guidedView.runtimeState && guidedView.runtimeState.transport
    ? guidedView.runtimeState.transport.status
    : "";
  var extensionCount;
  if (!activeBlock) return "";
  extensionCount = normalizeGuidedCount(activeBlock.extensionCount, 0);
  if (transportStatus === "paused") {
    statusText = normalizeGuidedCount(activeBlock.remainingSec, 0) > 0
      ? "Paused with " + formatGuidedDurationLabel(activeBlock.remainingSec) + " left in this block."
      : "Paused.";
    statusColor = "#6E56B3";
  } else if (extensionCount > 0) {
    statusText = getGuidedExtendStatusLabel(extensionCount);
    statusColor = "#A78BFA";
  } else if ((activeBlock.progressRatio || 0) >= 0.85 || normalizeGuidedCount(activeBlock.remainingSec, 0) <= 20) {
    statusText = "Ready to move on when you are.";
  } else if (normalizeGuidedCount(activeBlock.remainingSec, 0) > 0) {
    statusText = "About " + formatGuidedDurationLabel(activeBlock.remainingSec) + " left in this block.";
  } else if (activeBlock.detail) {
    statusText = activeBlock.detail + " is live now.";
  }
  if (!statusText) return "";
  return '<div class="guided-status-line" style="margin:0 0 12px;color:' + statusColor + '">' +
    escHTML(statusText) +
    '</div>';
}

function _guidedSpark(plan) {
  var sparkText = firstGuidedTextToken(plan.spark && plan.spark.text, "Let's get started.");
  var guidedView = getGuidedSessionView();
  var sparkActivity = guidedView.activeActivity;
  var cardTheme = getGuidedCardTheme(guidedView.activeBlockType || "warm_engine");
  var h = '<div class="card mb16" style="border-left:4px solid ' + cardTheme.borderColor + '">';
  h += renderGuidedCardHeader("Spark", "&#10024;", cardTheme);
  h += renderGuidedActivityMeta(sparkActivity, plan.focus_song);
  h += '<p style="margin:0 0 16px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(sparkText) + '</p>';
  if (plan.ifThen) {
    h += '<div style="background:var(--input-bg);border-radius:12px;padding:10px;margin-bottom:12px;font-size:12px;color:var(--text-muted);font-style:italic">&#8220;' + escHTML(plan.ifThen) + '&#8221;</div>';
  }
  h += renderGuidedActionStatus(guidedView, cardTheme.titleColor);
  h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("spark")) + '</button>';
  h += '</div>';
  return h;
}

function _guidedReview(plan) {
  var inst = getGuidedPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var reviewText = firstGuidedTextToken(plan.review && plan.review.text, "Take a quick review pass.");
  var guidedView = getGuidedSessionView();
  var reviewActivity = guidedView.activeActivity;
  var cardTheme = getGuidedCardTheme(guidedView.activeBlockType || "drill");
  if (!plan.review) {
    return '<div class="card mb16" style="border-left:4px solid ' + cardTheme.borderColor + '">' +
      renderGuidedCardHeader("Review", "&#128260;", cardTheme) +
      '<p style="color:var(--text-muted)">No review for this session \u2014 it\'s your first!</p>' +
      '<button class="btn" onclick="act(\'guidedNext\')" style="background:#4ECDC4;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("review")) + '</button></div>';
  }
  var h = '<div class="card mb16" style="border-left:4px solid ' + cardTheme.borderColor + '">';
  h += renderGuidedCardHeader("Review", "&#128260;", cardTheme);
  h += renderGuidedActivityMeta(reviewActivity, plan.focus_song);
  h += '<p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(reviewText) + '</p>';
  // Show review chord diagrams
  if (plan.review.chords) {
    h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px">';
    for (var i = 0; i < plan.review.chords.length; i++) {
      var ch = null;
      for (var j = 0; j < D.ALL_CHORDS.length; j++) if (D.ALL_CHORDS[j].name === plan.review.chords[i] || D.ALL_CHORDS[j].short === plan.review.chords[i]) { ch = D.ALL_CHORDS[j]; break; }
      if (ch) {
        h += '<div style="text-align:center"><div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:4px">' + ch.short + '</div>';
        h += UI.chord(ch, 100) + '</div>';
      }
  }
  h += '</div>';
  }
  h += renderGuidedActionStatus(guidedView, cardTheme.titleColor);
  h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:#4ECDC4;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("review")) + '</button>';
  h += '</div>';
  return h;
}

function _guidedNewMove(plan) {
  var inst = getGuidedPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var guidedView = getGuidedSessionView();
  var newMoveText = firstGuidedTextToken(plan.newMove && plan.newMove.text, "Practice the new move slowly and cleanly.");
  var guidedBpm = normalizeGuidedBpm(plan && plan.bpm, 80);
  var newMoveActivity = guidedView.activeActivity;
  var cardTheme = getGuidedCardTheme(guidedView.activeBlockType || "drill");
  if (!plan.newMove) return '';
  if (window._watchCleanup && window._watchCleanup.cleanup) { window._watchCleanup.cleanup(); window._watchCleanup = null; }
  if (window._shadowCleanup && window._shadowCleanup.cleanup) { window._shadowCleanup.cleanup(); window._shadowCleanup = null; }
  var h = '<div class="card mb16" style="border-left:4px solid ' + cardTheme.borderColor + '">';
  h += renderGuidedCardHeader("New Move", "&#127919;", cardTheme);
  h += newMovePhaseIndicator(guidedView.newMovePhase);
  h += renderGuidedActivityMeta(newMoveActivity, plan.focus_song);

  // Find chord
  var ch = null;
  if (D.ALL_CHORDS && D.ALL_CHORDS.length) {
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === plan.newMove.chord || D.ALL_CHORDS[i].short === plan.newMove.chord) { ch = D.ALL_CHORDS[i]; break; }
  }
  if (!ch && D.CHORDS) {
    ch = D.CHORDS[plan.newMove.chord] || null;
    if (!ch) { for (var k in D.CHORDS) { if (D.CHORDS[k] && D.CHORDS[k].name === plan.newMove.chord) { ch = D.CHORDS[k]; break; } } }
  }

  switch (guidedView.newMovePhase) {
    case "watch":
      h += '<div style="background:#FF6B6B11;border-radius:12px;padding:12px;margin-bottom:12px">';
      h += '<div class="guided-phase-title" style="color:#FF6B6B">&#128064; Watch \u2014 Hands Off!</div>';
      h += '<p style="margin:0;font-size:13px;color:var(--text-secondary)">' + escHTML(buildGuidedPhasePrompt(newMoveActivity, "watch")) + '</p>';
      h += '</div>';
      if (ch && UI.watchAnimation) {
        h += '<div id="watch-phase-container"></div>';
        setTimeout(function() {
          var el = document.getElementById('watch-phase-container');
          if (el) window._watchCleanup = UI.watchAnimation(el, ch, {onComplete: function(){act('guidedAdvancePhase')}});
        }, 0);
      } else {
        if (ch) {
          h += '<div class="flex-center" style="margin-bottom:12px">' + UI.chord(ch, 200, ch.name, true) + '</div>';
          h += '<button onclick="act(\'previewChord\',\'' + ch.name + '\')" style="background:none;font-size:14px;color:var(--text-muted);margin-bottom:12px">&#128264; Listen</button><br>';
        }
        h += renderGuidedActionStatus(guidedView, "#FF6B6B");
        h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#FF6B6B;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("newMove", "watch")) + '</button>';
      }
      break;

    case "shadow":
      h += '<div style="background:#45B7D111;border-radius:12px;padding:12px;margin-bottom:12px">';
      h += '<div class="guided-phase-title" style="color:#45B7D1">&#129306; Shadow \u2014 Place the Fingers</div>';
      h += '<p style="margin:0;font-size:13px;color:var(--text-secondary)">' + escHTML(buildGuidedPhasePrompt(newMoveActivity, "shadow")) + '</p>';
      h += '</div>';
      if (ch && UI.shadowQuiz) {
        h += '<div id="shadow-phase-container"></div>';
        h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#45B7D1;color:#fff;padding:10px 24px;font-weight:700;margin-top:12px">' + escHTML(getGuidedAdvanceLabel("newMove", "shadow")) + '</button>';
        setTimeout(function() {
          var el = document.getElementById('shadow-phase-container');
          if (el) window._shadowCleanup = UI.shadowQuiz(el, ch, {onComplete: function(){act('guidedAdvancePhase')}});
        }, 0);
      } else {
        if (ch) {
          h += '<div class="flex-center" style="margin-bottom:12px">' + UI.chord(ch, 200) + '</div>';
        }
        h += renderGuidedActionStatus(guidedView, "#45B7D1");
        h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#45B7D1;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("newMove", "shadow")) + '</button>';
      }
      break;

    case "try":
      h += '<p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(firstGuidedTextToken(buildGuidedPhasePrompt(newMoveActivity, "try"), newMoveText)) + '</p>';
      if (ch) {
        h += '<div class="flex-center" style="margin-bottom:12px">' + UI.chord(ch, 180) + '</div>';
        h += '<button onclick="act(\'previewChord\',\'' + ch.name + '\')" style="background:none;font-size:13px;color:var(--text-muted);margin-bottom:8px">&#128264; Listen</button><br>';
        h += renderGuidedTryVerifyCard(ch);
      }
      if (plan.newMove.strum) {
        h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Strum: <strong>' + escHTML(plan.newMove.strum) + '</strong> at ' + guidedBpm + ' BPM</div>';
      }
      h += renderGuidedActionStatus(guidedView, "#4ECDC4");
      h += '<button class="btn" onclick="act(\'guidedAdvancePhase\')" style="background:#4ECDC4;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("newMove", "try")) + '</button>';
      break;

    case "refine":
      h += '<div style="background:#A78BFA11;border-radius:12px;padding:12px;margin-bottom:12px">';
      h += '<div class="guided-phase-title" style="color:#A78BFA">&#128161; Refine</div>';
      h += '<p style="margin:0;font-size:13px;color:var(--text-secondary)">' + escHTML(buildGuidedPhasePrompt(newMoveActivity, "refine")) + '</p>';
      h += '</div>';
      if (ch) h += '<div class="flex-center" style="margin-bottom:12px">' + UI.chord(ch, 160) + '</div>';
      // Transition tip
      var tipKey = plan.review && plan.review.chords ? plan.review.chords[0] + "->" + plan.newMove.chord : null;
      var tip = tipKey ? TRANSITION_TIPS[tipKey] : null;
      if (tip) {
        h += '<div style="background:var(--input-bg);border-radius:12px;padding:10px;margin-bottom:12px;font-size:12px">';
        h += '<span style="color:#4ECDC4;font-weight:700">&#128161; Tip:</span> <span style="color:var(--text-secondary)">' + escHTML(tip) + '</span></div>';
      }
      h += renderGuidedActionStatus(guidedView, "#A78BFA");
      h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:#A78BFA;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("newMove", "refine")) + '</button>';
      break;
  }
  h += '</div>';
  return h;
}

function _guidedSongSlice(plan) {
  var songSliceText = firstGuidedTextToken(plan.songSlice && plan.songSlice.text, "Play this short song slice with steady timing.");
  var songSliceTitle = firstGuidedTextToken(plan.songSlice && plan.songSlice.song);
  var guidedView = getGuidedSessionView();
  var songActivity = guidedView.activeActivity;
  var cardTheme = getGuidedCardTheme(guidedView.activeBlockType || "song");
  if (!plan.songSlice) return '';
  var h = '<div class="card mb16" style="border-left:4px solid ' + cardTheme.borderColor + '">';
  h += renderGuidedCardHeader("Song Slice", "&#127925;", cardTheme);
  h += renderGuidedActivityMeta(songActivity, songSliceTitle || plan.focus_song);
  h += '<p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(songSliceText) + '</p>';
  if (songSliceTitle) {
    h += '<div class="guided-phase-title" style="color:var(--text-primary);margin-bottom:12px">&#127926; ' + escHTML(songSliceTitle) + '</div>';
  }
  h += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">';
  h += '<button class="btn" onclick="act(\'toggleMetro\')" style="padding:8px 16px;font-size:13px;background:' + (S.metronomeOn ? '#FFE66D' : '#4ECDC4') + ';color:' + (S.metronomeOn ? '#333' : '#fff') + '">' + (S.metronomeOn ? '&#9632; Metro' : '&#9654; Metro') + '</button>';
  h += '</div>';
  h += renderGuidedActionStatus(guidedView, cardTheme.titleColor);
  h += '<button class="btn" onclick="act(\'guidedNext\')" style="background:#45B7D1;color:#fff;padding:12px 28px;font-weight:800">' + escHTML(getGuidedAdvanceLabel("songSlice")) + '</button>';
  h += '</div>';
  return h;
}

function _guidedVictoryLap(plan) {
  var inst = getGuidedPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var UI = inst && inst.ui ? inst.ui : {};
  var victoryText = firstGuidedTextToken(plan.victoryLap && plan.victoryLap.text, "Give it one confident final pass.");
  var guidedView = getGuidedSessionView();
  var victoryActivity = guidedView.activeActivity;
  var cardTheme = getGuidedCardTheme(guidedView.activeBlockType || "cooldown");
  var extensionCount = guidedView && guidedView.shellSummary
    ? normalizeGuidedCount(guidedView.shellSummary.extensionCount, 0)
    : 0;
  var extensionThemeLabel = getGuidedExtensionLabel(extensionCount);
  var focusStretchLabel = getGuidedFocusStretchLabel(extensionCount);
  var victoryTitle = getGuidedVictoryLapTitle(extensionCount);
  var victorySupportLabel = getGuidedVictoryLapSupportLabel(extensionCount);
  var victoryCopy = getGuidedVictoryLapCopy(extensionCount, victoryText);
  if (!plan.victoryLap) return '';
  var h = '<div class="card mb16" style="border-left:4px solid ' + cardTheme.borderColor + ';background:linear-gradient(135deg,#FFE66D11,#FF8A5C11)">';
  h += renderGuidedCardHeader(victoryTitle, "&#127942;", cardTheme);
  h += renderGuidedActivityMeta(victoryActivity, plan.focus_song);
  if (extensionThemeLabel) {
    h += '<div style="display:flex;justify-content:center;margin:0 0 12px"><span class="guided-pill" style="background:#A78BFA22;color:#6E56B3">' + escHTML(extensionThemeLabel) + '</span></div>';
  }
  if (focusStretchLabel) {
    h += '<div style="display:flex;justify-content:center;margin:0 0 12px"><span class="guided-pill" style="background:#6E56B311;color:#6E56B3">' + escHTML(focusStretchLabel) + '</span></div>';
  }
  if (victorySupportLabel) {
    h += '<div style="display:flex;justify-content:center;margin:-4px 0 12px"><span class="guided-pill" style="background:#FFFFFFAA;color:#6E56B3">' + escHTML(victorySupportLabel) + '</span></div>';
  }
  h += '<p style="margin:0 0 16px;font-size:14px;color:var(--text-secondary);line-height:1.6">' + escHTML(victoryCopy) + '</p>';
  // Show the session's main chord
  var ch = null;
  if (plan.newMove) {
    for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === plan.newMove.chord || D.ALL_CHORDS[i].short === plan.newMove.chord) { ch = D.ALL_CHORDS[i]; break; }
  }
  if (ch) {
    h += '<div class="flex-center" style="margin-bottom:12px">' + UI.chord(ch, 160) + '</div>';
    h += '<button onclick="act(\'previewChord\',\'' + ch.name + '\')" style="background:none;font-size:13px;color:var(--text-muted);margin-bottom:12px">&#128264; Listen</button><br>';
  }
  h += renderGuidedActionStatus(guidedView, cardTheme.titleColor);
  h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  h += '<button class="btn" onclick="act(\'guidedComplete\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333;padding:14px 32px;font-size:16px;font-weight:900">' + escHTML(getGuidedCompleteCtaLabel(extensionCount)) + '</button>';
  h += '<button class="btn" onclick="act(\'guidedExtendBlock\')" style="background:transparent;color:' + cardTheme.titleColor + ';padding:14px 24px;font-size:14px;font-weight:900;border:1px solid ' + cardTheme.titleColor + '">' + escHTML(getGuidedExtendCtaLabel(extensionCount)) + '</button>';
  h += '</div>';
  h += '</div>';
  return h;
}

function guidedDonePage() {
  var guidedView = getGuidedSessionView();
  var plan = guidedView.plan;
  var coreView = getGuidedPageCoreView();
  var lastOutcome = coreView && coreView.lastSessionOutcome ? coreView.lastSessionOutcome : null;
  var title = plan ? firstGuidedTextToken(plan.title, plan.id, "Guided session") : "";
  var num = plan ? plan.num : 0;
  var extensionCount = guidedView && guidedView.shellSummary
    ? normalizeGuidedCount(guidedView.shellSummary.extensionCount, 0)
    : 0;
  var doneSupportLabel = getGuidedDoneSupportLabel(extensionCount);
  var xpAwarded = normalizeGuidedCount(lastOutcome && lastOutcome.xpAwarded, 30);
  var streak = normalizeGuidedCount(S.streak, 0);
  var completedSessions = Array.isArray(S.completedGuidedSessions) ? S.completedGuidedSessions.length : 0;
  var totalSessions = getGuidedSessionTotalCount();
  var nextSessionNum = getGuidedDoneNextSessionNum(num, totalSessions);
  var hasNextSession = nextSessionNum > normalizeGuidedCount(num, 0);
  var statLabels = getGuidedDoneStatLabels(extensionCount);
  var h = '<div class="text-center" style="padding-top:30px">';
  h += '<div style="' + getGuidedDoneCelebrationStyle(extensionCount) + '">' + getGuidedDoneCelebrationIcon(extensionCount) + '</div>';
  h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">' + escHTML(getGuidedDoneTitle(extensionCount, num)) + '</h2>';
  h += '<p style="color:var(--text-dim);font-size:15px;margin-bottom:20px">' + escHTML(getGuidedDoneSummaryLine(extensionCount, title)) + '</p>';
  if (doneSupportLabel) {
    h += '<div style="display:flex;justify-content:center;margin:-8px 0 18px"><span class="guided-pill" style="background:#6E56B311;color:#6E56B3">' + escHTML(doneSupportLabel) + '</span></div>';
  }
  if (!hasNextSession) {
    h += '<div class="card mb16" style="max-width:560px;margin:0 auto 16px;border:1px solid #45B7D122;background:linear-gradient(135deg,#45B7D10A,#4ECDC40F);text-align:left">';
    h += '<div class="guided-status-line" style="text-transform:uppercase;color:#2F8F89;margin-bottom:8px">' + escHTML(getGuidedDoneTrackCompleteLabel(extensionCount)) + '</div>';
    h += '<div style="font-size:14px;line-height:1.6;color:var(--text-secondary)">' + escHTML(getGuidedDoneTrackCompleteCopy(extensionCount)) + '</div>';
    h += '</div>';
  }
  if (extensionCount >= 2) {
    h += '<div class="card mb16" style="max-width:520px;margin:0 auto 16px;border:1px solid #6E56B322;background:linear-gradient(135deg,#6E56B30D,#FF8A5C12);text-align:left">';
    h += '<div class="guided-status-line" style="text-transform:uppercase;color:#6E56B3;margin-bottom:8px">' + escHTML(getGuidedDoneRecoveryTitle(extensionCount)) + '</div>';
    h += '<div style="font-size:14px;line-height:1.6;color:var(--text-secondary)">' + escHTML(getGuidedDoneRecoveryCopy(extensionCount)) + '</div>';
    h += '</div>';
  }
  h += '<div class="card mb20"' + (getGuidedDoneStatsCardStyle(extensionCount) ? ' style="' + getGuidedDoneStatsCardStyle(extensionCount) + '"' : '') + '><div style="display:flex;justify-content:space-around;text-align:center">';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FFE66D">+' + xpAwarded + '</div><div style="font-size:11px;color:var(--text-muted)">' + escHTML(statLabels.xp) + '</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FF6B6B">&#128293;' + streak + '</div><div style="font-size:11px;color:var(--text-muted)">' + escHTML(statLabels.streak) + '</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#4ECDC4">' + completedSessions + '/' + totalSessions + '</div><div style="font-size:11px;color:var(--text-muted)">' + escHTML(statLabels.sessions) + '</div></div>';
  h += '</div></div>';
  // Daily-goal cross-link: the most effective moment to ask for a few more
  // minutes is right after a win. Only shows when the ring is still open.
  h += renderGuidedDoneGoalNudge();
  if (extensionCount >= 2) {
    h += '<div class="card mb16" style="max-width:520px;margin:0 auto 16px;border:1px solid #D8D2EA;background:#FAF7FF;text-align:left">';
    h += '<div class="guided-status-line" style="text-transform:uppercase;color:#6E56B3;margin-bottom:8px">' + escHTML(getGuidedDonePauseTitle(extensionCount)) + '</div>';
    h += '<div style="font-size:14px;line-height:1.6;color:var(--text-secondary)">' + escHTML(getGuidedDonePauseCopy(extensionCount)) + '</div>';
    h += '</div>';
  }
  h += '<div class="flex-col"><button class="btn" onclick="act(\'start_guided_session\',' + escHTML(String(nextSessionNum)) + ')" style="' + getGuidedDoneNextActionStyle(extensionCount) + '">&#9654; ' + escHTML(getGuidedDoneNextActionLabel(extensionCount, hasNextSession)) + '</button>';
  h += '<button class="btn" onclick="act(\'guidedDoneHome\')" style="' + getGuidedDoneHomeStyle(extensionCount) + '">&#127968; ' + escHTML(getGuidedDoneHomeLabel(extensionCount)) + '</button></div>';
  if (extensionCount >= 2 || !hasNextSession) {
    h += '<div style="margin-top:10px;font-size:12px;color:var(--text-muted)">' + escHTML(getGuidedDoneActionHint(extensionCount, hasNextSession)) + '</div>';
  }
  h += '</div>';
  return h;
}

function getGuidedDoneNextSessionNum(currentSessionNum, totalSessions) {
  var current = normalizeGuidedCount(currentSessionNum, 0);
  var total = normalizeGuidedCount(totalSessions, 0);
  if (current <= 0) return 1;
  if (total > 0 && current < total) return current + 1;
  return current;
}

function getGuidedSessionView() {
  var coreView = getGuidedPageCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var currentPlan = coreView && coreView.plan ? coreView.plan : null;
  var resolvedPlan;
  var blockProgress;
  var activeActivity;
  var activeBlockType;
  var plan = coreView
    && coreView.plan
    && coreView.plan.flow === "guided_session"
    && coreView.plan.context
    ? coreView.plan.context.guidedPlan || null
    : null;
  var guidedStep = runtimeState && runtimeState.guidedStep
    ? runtimeState.guidedStep
    : (S.guidedStep || "spark");
  resolvedPlan = plan || S.guidedPlan || null;
  blockProgress = getGuidedBlockProgress(resolvedPlan, currentPlan, runtimeState);
  activeActivity = coreView && coreView.activeActivity
    ? coreView.activeActivity
    : resolveGuidedViewActivity(resolvedPlan, guidedStep, runtimeState);
  activeBlockType = coreView && coreView.activeBlockType
    ? coreView.activeBlockType
    : resolveGuidedActiveBlockType(resolvedPlan, guidedStep, runtimeState, currentPlan, activeActivity);

  return {
    plan: resolvedPlan,
    corePlan: currentPlan,
    runtimeState: runtimeState,
    guidedStep: guidedStep,
    newMovePhase: runtimeState && runtimeState.guidedNewMovePhase
      ? runtimeState.guidedNewMovePhase
      : (S.newMovePhase || null)
    ,
    activeActivity: activeActivity,
    activeActivityId: runtimeState && runtimeState.guidedActivityId ? runtimeState.guidedActivityId : (S.guidedActivityId || null),
    activeActivityKind: runtimeState && runtimeState.guidedActivityKind ? runtimeState.guidedActivityKind : (S.guidedActivityKind || null),
    activeBlockType: activeBlockType || (S.guidedBlockType || null),
    activeSegmentId: runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null,
    blockProgress: blockProgress,
    shellSummary: getGuidedShellSummary(currentPlan, blockProgress, runtimeState)
  };
}

// ===== MIC-VERIFIED TRY (guided New Move) =====
// The Try phase was pure self-report even though mic chord detection
// exists (audio.js startChordDetect scores S.detectedNotes against
// S.currentChord). This wires them together: hold a clean target chord
// for ~1.2s and the step verifies itself, with a small XP bonus.
// Optional everywhere — no mic, no support, or a denial all degrade back
// to the self-report button.

var _guidedTryVerify = { timer: null, tracker: null, chord: null, verifiedKey: null };

function guidedTryVerifySupported() {
  if (typeof S !== "undefined" && S.midiEnabled) return true;
  return typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// MIDI keyboards feed S.detectedNotes directly (piano's _handleMidiMessage)
// but S.chordMatch is only computed inside the mic FFT loop — score the
// held notes against the target ourselves, same hits-minus-penalty formula
// as audio.js.
// Both sides normalize to pitch classes (0-11) before comparing: chord maps
// can carry flats (Bb) while MIDI detection emits sharps (A#), and a plain
// string compare fails every enharmonic pair.
var GUIDED_PC_SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var GUIDED_PC_FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function guidedNotePitchClasses(notes) {
  if (!Array.isArray(notes)) return [];
  var pcs = [];
  for (var i = 0; i < notes.length; i++) {
    var pc = GUIDED_PC_SHARPS.indexOf(notes[i]);
    if (pc === -1) pc = GUIDED_PC_FLATS.indexOf(notes[i]);
    if (pc !== -1 && pcs.indexOf(pc) === -1) pcs.push(pc);
  }
  return pcs;
}

function guidedMidiChordMatch(ch) {
  if (typeof getExpectedNotes !== "function") return -1;
  var expected = guidedNotePitchClasses(getExpectedNotes(ch && ch.name ? ch.name : ""));
  var found = guidedNotePitchClasses(typeof S !== "undefined" && Array.isArray(S.detectedNotes) ? S.detectedNotes : []);
  if (!expected.length || !found.length) return -1;
  var hits = 0;
  for (var i = 0; i < expected.length; i++) if (found.indexOf(expected[i]) !== -1) hits++;
  var wrong = 0;
  for (var j = 0; j < found.length; j++) if (expected.indexOf(found[j]) === -1) wrong++;
  var accuracy = hits / expected.length;
  var penalty = wrong > 0 ? wrong / (found.length + expected.length) : 0;
  return Math.max(0, Math.round((accuracy - penalty) * 100));
}

function guidedTryVerifyCurrentMatch() {
  if (typeof S === "undefined") return -1;
  if (S.chordDetectOn) return typeof S.chordMatch === "number" ? S.chordMatch : -1;
  if (S.midiEnabled) return guidedMidiChordMatch(_guidedTryVerify.chord);
  return -1;
}

// Verification is keyed to its full context — session number, activity, and
// chord — not a bare "verified" flag. A new session that happens to open
// with the same chord gets a different key, so nothing is pre-verified, and
// render never has to reset state to keep things honest.
function guidedTryVerifyContextKey(ch) {
  return [
    typeof S !== "undefined" ? S.guidedSession : "",
    typeof S !== "undefined" ? (S.guidedActivityId || S.guidedStep || "") : "",
    ch && ch.name ? ch.name : ""
  ].join("|");
}

function guidedTryVerifyStart() {
  // The chord object is stashed by renderGuidedTryVerifyCard — chord shapes
  // live in instrument data (D.ALL_CHORDS/D.CHORDS), not a global lookup.
  var ch = _guidedTryVerify.chord;
  if (!ch || !guidedTryVerifySupported()) return;
  guidedTryVerifyStop();
  S.currentChord = ch;
  S.chordDetectErr = null;
  _guidedTryVerify.verifiedKey = null;
  _guidedTryVerify.tracker = typeof createVerificationTracker === "function"
    ? createVerificationTracker({ threshold: 75, holdMs: 1200 })
    : null;
  // A connected MIDI keyboard already feeds S.detectedNotes — no mic needed.
  if (!S.midiEnabled && typeof startChordDetect === "function") startChordDetect();
  _guidedTryVerify.timer = setInterval(function() {
    // Self-disarm if the user left the Try phase with the mic running.
    if (S.newMovePhase !== "try" || S.screen !== SCR.GUIDED) {
      guidedTryVerifyStop();
      return;
    }
    // Mic denied or failed after start — disarm instead of idling forever;
    // the card re-renders with the error and the self-report fallback.
    if (!S.midiEnabled && S.chordDetectErr) {
      guidedTryVerifyStop();
      if (typeof render === "function") render();
      return;
    }
    if ((!S.chordDetectOn && !S.midiEnabled) || !_guidedTryVerify.tracker) return;
    var done = _guidedTryVerify.tracker.update(guidedTryVerifyCurrentMatch());
    var el = document.getElementById("guided-verify-status");
    if (el && !done) el.innerHTML = guidedTryVerifyStatusInner();
    if (done) {
      _guidedTryVerify.verifiedKey = guidedTryVerifyContextKey(ch);
      guidedTryVerifyStop();
      if (typeof awardXP === "function") awardXP(5, "mic_verified_try");
      S.microToast = { msg: "Verified — clean " + (ch.name || "chord") + "! +5 XP", icon: "🎤", time: Date.now() };
      if (typeof render === "function") render();
    }
  }, 200);
  if (typeof render === "function") render();
}

function guidedTryVerifyStop() {
  if (_guidedTryVerify.timer) {
    clearInterval(_guidedTryVerify.timer);
    _guidedTryVerify.timer = null;
  }
  _guidedTryVerify.tracker = null;
  if (S.chordDetectOn && typeof stopChordDetect === "function") stopChordDetect();
}

function guidedTryVerifyStatusInner() {
  var match = guidedTryVerifyCurrentMatch();
  var progress = _guidedTryVerify.tracker ? _guidedTryVerify.tracker.progress() : 0;
  var h = "";
  if (match < 0) {
    h += '<div style="color:var(--text-muted);font-size:13px">' + (S.midiEnabled ? 'Listening&hellip; play the chord and hold it.' : 'Listening&hellip; strum the chord and let it ring.') + '</div>';
  } else {
    h += '<div style="font-size:13px;color:var(--text-secondary)">Match: <strong>' + match + '%</strong>' + (match >= 75 ? ' — hold it!' : '') + '</div>';
  }
  h += '<div style="background:var(--input-bg);border-radius:6px;height:6px;margin-top:6px;overflow:hidden">'
     + '<div style="background:#4ECDC4;height:100%;width:' + Math.round(progress * 100) + '%;transition:width .2s"></div>'
     + '</div>';
  return h;
}

function renderGuidedTryVerifyCard(ch) {
  if (!ch || !guidedTryVerifySupported()) return "";
  // Stash the chord object for the inline onclick (an event-argument cache,
  // not UI state). All verification state lives behind the context key —
  // render only reads it.
  _guidedTryVerify.chord = ch;
  var verified = _guidedTryVerify.verifiedKey !== null
    && _guidedTryVerify.verifiedKey === guidedTryVerifyContextKey(ch);
  var h = '<div class="card" style="margin:0 0 12px;padding:12px;text-align:left">';
  var inputLabel = S.midiEnabled ? "MIDI" : "mic";
  var inputIcon = S.midiEnabled ? "&#127929;" : "&#127908;";
  if (verified) {
    h += '<div style="color:#6bcb77;font-weight:800;font-size:14px">&#10003; Verified &mdash; clean ' + escHTML(ch.name) + '!</div>';
  } else if (S.chordDetectOn || (S.midiEnabled && _guidedTryVerify.timer)) {
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px">'
       + '<span style="font-weight:700;font-size:13px">' + inputIcon + ' Listening on ' + inputLabel + ' for ' + escHTML(ch.name) + '</span>'
       + '<button class="btn btn-sm" onclick="guidedTryVerifyStop();render()" style="background:var(--input-bg);color:var(--text-secondary)">Stop</button>'
       + '</div>'
       + '<div id="guided-verify-status">' + guidedTryVerifyStatusInner() + '</div>';
  } else {
    h += '<button class="btn btn-sm" onclick="guidedTryVerifyStart()" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">' + inputIcon + ' Verify with ' + inputLabel + ' (+5 XP)</button>';
    if (S.chordDetectErr && !S.midiEnabled) {
      h += '<div style="color:var(--text-muted);font-size:12px;margin-top:6px">' + escHTML(S.chordDetectErr) + ' &mdash; no problem, self-report still works.</div>';
    }
  }
  h += '</div>';
  return h;
}

// Daily-goal cross-link rendered on the session-complete screen: when the
// daily ring is still open, say exactly how close it is. The "Next Session"
// button directly below is the action — this line gives it a reason.
function renderGuidedDoneGoalNudge() {
  if (typeof S === "undefined") return "";
  var goalMinutes = typeof S.dailyGoalMinutes === "number" && S.dailyGoalMinutes > 0 ? S.dailyGoalMinutes : 0;
  if (!goalMinutes) return "";
  var doneSeconds = typeof S.todayPracticeSeconds === "number" && S.todayPracticeSeconds > 0 ? S.todayPracticeSeconds : 0;
  var remainingSeconds = goalMinutes * 60 - doneSeconds;
  if (remainingSeconds <= 0) {
    return '<div class="card mb16" style="max-width:520px;margin:0 auto 16px;border:1px solid #4ECDC433;background:#4ECDC411">'
      + '<div style="font-size:14px;font-weight:700;color:#4ECDC4">&#127919; Daily goal complete &mdash; the ring is closed!</div>'
      + '</div>';
  }
  var remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));
  return '<div class="card mb16" style="max-width:520px;margin:0 auto 16px;border:1px solid #FFE66D33;background:#FFE66D0D">'
    + '<div style="font-size:14px;line-height:1.6;color:var(--text-secondary)">&#127919; <strong style="color:#FFE66D">' + remainingMinutes + ' more minute' + (remainingMinutes === 1 ? '' : 's') + '</strong> closes today\'s ring &mdash; the next session does it.</div>'
    + '</div>';
}
