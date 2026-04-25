function getPlanPageCoreView(){
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function getPlanPageActiveGuidedSummary(){
  var coreView = getPlanPageCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var guidedContext = coreView && coreView.plan && coreView.plan.context ? coreView.plan.context : null;
  var guidedPlan = coreView
    && coreView.plan
    && coreView.plan.flow === "guided_session"
    && guidedContext
    ? guidedContext.guidedPlan || null
    : null;
  if(!guidedPlan || !runtimeState || runtimeState.activeScreen !== "guided_session") return null;
  return {
    title: guidedPlan.title || guidedPlan.id || "Guided Session",
    blockCount: Array.isArray(guidedPlan.blocks) ? guidedPlan.blocks.length : 0,
    targetDurationMin: guidedPlan.target_duration_min || 0,
    statusLabel: runtimeState.guidedStep === "victoryLap"
      ? "In progress - Cooldown block"
      : runtimeState.guidedStep === "songSlice"
        ? "In progress - Song block"
        : runtimeState.guidedStep === "review"
          ? "In progress - Review pass"
          : runtimeState.guidedStep === "newMove"
            ? ("In progress - " + (runtimeState.guidedNewMovePhase || "Drill block"))
            : "In progress - Warm engine"
  };
}

function getPlanPageActiveShellSummary() {
  var coreView = getPlanPageCoreView();
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var plan = coreView && coreView.plan ? coreView.plan : null;
  var segments;
  var activeSegment;
  var activeIndex = -1;
  var totalDurationSec = 0;
  var i;
  var status;
  var segmentLabel;
  if (!plan || plan.flow !== "daily_practice" || !runtimeState || !runtimeState.activeSegmentId) return null;
  segments = Array.isArray(plan.segments) ? plan.segments : [];
  if (!segments.length) return null;
  activeSegment = coreView.activeSegment || null;
  for (i = 0; i < segments.length; i++) {
    totalDurationSec += Number(segments[i] && segments[i].durationSec) || 0;
    if (!activeSegment && segments[i] && segments[i].id === runtimeState.activeSegmentId) {
      activeSegment = segments[i];
      activeIndex = i;
    } else if (activeSegment && segments[i] && activeSegment.id === segments[i].id) {
      activeIndex = i;
    }
  }
  if (!activeSegment) return null;
  status = runtimeState.transport && runtimeState.transport.status ? runtimeState.transport.status : "ready";
  segmentLabel = prettyPlanToken(activeSegment.label) || firstPrettyPlanToken(activeSegment.type, "practice block");
  return {
    title: prettyPlanToken(plan.focus) || "Practice Session",
    segmentLabel: segmentLabel,
    activeIndex: activeIndex >= 0 ? activeIndex : 0,
    blockCount: segments.length,
    targetDurationMin: totalDurationSec > 0 ? Math.max(1, Math.round(totalDurationSec / 60)) : 0,
    statusLabel: status === "paused"
      ? ("Paused - " + segmentLabel)
      : status === "completed"
        ? ("Wrapped - " + segmentLabel)
        : status === "running"
          ? ("In progress - " + segmentLabel)
          : ("Ready - " + segmentLabel),
    primaryAction: status === "paused" ? "sessionResumeBlock" : "sessionPauseBlock",
    primaryLabel: status === "paused" ? "Resume Block" : "Pause Block",
    canSkip: activeIndex >= 0 && activeIndex < segments.length - 1
  };
}

function planPage(){
  function isCompletedPlanItem(item){
    var value = item ? item.completed : null;
    return value === true ||
      value === 1 ||
      value === "1" ||
      (typeof value === "string" && value.trim().toLowerCase() === "true");
  }
  function isPlanCompleteFlag(value){
    return value === true ||
      value === 1 ||
      value === "1" ||
      (typeof value === "string" && value.trim().toLowerCase() === "true");
  }
  function getPlanItemDurationMinutes(item){
    var raw = item ? item.durationSec : null;
    if (typeof raw === "boolean" || typeof raw === "object" || typeof raw === "function" || typeof raw === "symbol") {
      return null;
    }
    if (typeof raw === "string" && !/^\s*\d+\s*$/.test(raw)) {
      return null;
    }
    var durationSec = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(durationSec) && Number.isInteger(durationSec) && durationSec > 0
      ? Math.round(durationSec / 60)
      : null;
  }
  function getPlanItemId(item){
    var id = item && typeof item.id === "string" ? item.id.trim() : null;
    var lower = id ? id.toLowerCase() : "";
    if(!id || lower === "undefined" || lower === "null" || lower === "nan") return null;
    return id;
  }
  function isRenderablePlanItem(item){
    var label = item && typeof item.label === "string" ? item.label.trim() : (item ? item.label : null);
    var type = item && typeof item.type === "string" ? item.type.trim() : (item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!value.trim();
      if (typeof value === "number" || typeof value === "boolean") return false;
      if (typeof value === "object" || typeof value === "function" || typeof value === "symbol") return false;
      return true;
    }));
    return !!(
      item &&
      (getPlanItemId(item) ||
       label ||
       type ||
       metaHasValue)
    );
  }
  function hasRenderablePlanItems(plan){
    return !!(plan && Array.isArray(plan.items) && plan.items.some(isRenderablePlanItem));
  }
  function getRenderablePlanItems(plan){
    return plan && Array.isArray(plan.items)
      ? plan.items.filter(isRenderablePlanItem)
      : [];
  }
  var coreView = getPlanPageCoreView();
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
  if(!plan) plan = S.practicePlan;
  var activeGuided = getPlanPageActiveGuidedSummary();
  var activeShell = activeGuided ? null : getPlanPageActiveShellSummary();
  var renderableItems = getRenderablePlanItems(plan);
  var hasPlanItems = hasRenderablePlanItems(plan);
  var planCompleted = isPlanCompleteFlag(coreView && coreView.lastSessionOutcome && coreView.lastSessionOutcome.planCompleted)
    ? true
    : isPlanCompleteFlag(S.practicePlanComplete);
  var headerFocusLabel = activeGuided && !hasPlanItems
    ? "Resume the live guided shell."
    : getPlanFocusLabel(plan);
  if(!planCompleted && hasPlanItems){
    planCompleted = renderableItems.every(isCompletedPlanItem);
  }
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>' + escHTML(activeGuided && !hasPlanItems ? 'Guided Session Flow' : 'Today\'s Practice Plan') + '</h2>';
  h += '<div class="muted">'+escHTML(headerFocusLabel)+'</div>';
  if(activeGuided){
    h += '<div style="margin-top:8px;padding:10px 12px;border-radius:14px;background:rgba(78,205,196,.12);color:var(--text-primary)">';
    h += '<div style="font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#2f8f89">Guided Session Live</div>';
    h += '<div style="font-size:13px;font-weight:800;margin-top:4px">' + escHTML(activeGuided.title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-muted);margin-top:3px">' + escHTML(activeGuided.statusLabel) + '</div>';
      h += '</div>';
  } else if(activeShell){
    h += '<div style="margin-top:8px;padding:10px 12px;border-radius:14px;background:rgba(69,183,209,.12);color:var(--text-primary)">';
    h += '<div style="font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#2a7f93">Practice Session Live</div>';
    h += '<div style="font-size:13px;font-weight:800;margin-top:4px">' + escHTML(activeShell.title) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-top:3px">' + escHTML(activeShell.statusLabel) + '</div>';
    h += '<div style="font-size:12px;color:var(--text-dim);margin-top:4px">' + escHTML("Block " + (activeShell.activeIndex + 1) + " of " + activeShell.blockCount + " • " + (activeShell.targetDurationMin || 10) + " min shell") + '</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">';
    h += '<button class="btn btn-sm" onclick="act(\'' + activeShell.primaryAction + '\')" style="background:var(--accent);color:#fff">' + escHTML(activeShell.primaryLabel) + '</button>';
    if(activeShell.canSkip){
      h += '<button class="btn btn-sm" onclick="act(\'sessionSkipBlock\')" style="background:#FF8A5C;color:#fff">Skip Block</button>';
    }
    h += '</div>';
    h += '</div>';
  }
  if(hasPlanItems && planCompleted){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  if(!hasPlanItems){
    if(activeGuided){
      h += '<div class="card mb16"><div class="muted">Your live guided shell is the plan right now.</div><div style="margin-top:8px;font-size:12px;color:var(--text-muted)">' + escHTML((activeGuided.targetDurationMin || 10) + ' min shell - ' + (activeGuided.blockCount || 4) + ' blocks') + '</div></div>';
    } else if(activeShell){
      h += '<div class="card mb16"><div class="muted">The shared session shell is already in motion.</div><div style="margin-top:8px;font-size:12px;color:var(--text-muted)">' + escHTML((activeShell.targetDurationMin || 10) + ' min shell - ' + activeShell.blockCount + ' blocks') + '</div></div>';
    } else {
      h += '<div class="card mb16"><div class="muted">No practice plan yet.</div></div>';
    }
    h += '<div class="card mb16" style="text-align:center">';
    h += activeGuided
      ? '<button class="btn" onclick="act(\'resume_guided_session\')">Resume Guided Session</button> '
      : activeShell
        ? '<button class="btn" onclick="act(\'' + activeShell.primaryAction + '\')">' + escHTML(activeShell.primaryLabel) + '</button> '
      : '<button class="btn" onclick="act(\'regeneratePlan\')">Regenerate Plan</button> ';
    h += '<button class="btn" onclick="act(\'back\')">Back</button>';
    h += '</div>';
    return h;
  }

  for(var i=0;i<plan.items.length;i++){
    var item = plan.items[i];
    if(!isRenderablePlanItem(item)) continue;
    var itemId = getPlanItemId(item);
    var canLaunch = !!itemId;
    var durationMinutes = getPlanItemDurationMinutes(item);
    var isCompleted = isCompletedPlanItem(item);
    var done = isCompleted ? ' style="opacity:0.5;text-decoration:line-through"' : '';
    var actionHtml = isCompleted
      ? '<span class="text-muted">Done</span>'
      : (canLaunch
        ? '<button class="btn btn-sm" data-item-id="'+escHTML(itemId)+'" onclick="act(\'practiceStartItem\', this.getAttribute(\'data-item-id\'))" style="background:var(--accent);color:#fff">Go</button>'
        : '<span class="text-muted">Unavailable</span>');
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(getPlanDisplayType(item))+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px"'+done+'>'+escHTML(getPlanItemLabel(item))+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(formatPlanItemSubtitle(item))+(durationMinutes != null ? ' \u2022 '+durationMinutes+'m' : '')+'</div>';
    h += '</div>';
    h += actionHtml;
    h += '</div>';
    h += '</div>';
  }

  if(!planCompleted){
    h += '<div class="card mb16" style="text-align:center">';
    h += '<button class="btn btn-primary" onclick="act(\'completePlan\')">Mark Plan Complete</button>';
    h += '</div>';
  }

  h += '<div class="card mb16" style="text-align:center">';
  h += '<button class="btn" onclick="act(\'regeneratePlan\')">Regenerate Plan</button> ';
  h += '<button class="btn" onclick="act(\'back\')">Back</button>';
  h += '</div>';

  return h;
}

function planItemColor(type){
  if(type==="warmup" || type==="finger") return "#f59e0b";
  if(type==="transition") return "#3b82f6";
  if(type==="rhythm_highway") return "#ec4899";
  if(type==="performance_song" || type==="performance_phrase" || type==="performance_technique") return "#22c55e";
  if(type==="rhythm") return "#ec4899";
  if(type==="bassline" || type==="groove" || type==="arpeggio" || type==="improv" || type==="melody" || type==="strum_pattern") return "#14b8a6";
  if(type==="technique") return "#f97316";
  if(type==="lead") return "#8b5cf6";
  return "#6b7280";
}

function getPlanDisplayType(item){
  item = item || {};
  var meta = item.meta || {};
  var exerciseType = typeof meta.exerciseType === "string" ? meta.exerciseType.trim() : meta.exerciseType;
  if(item.type === "song" && meta.songId) return "performance_song";
  if(item.type === "practice"){
    if(meta.guidedSession != null) return "guided_session";
    if(meta.from || meta.to || meta.key) return "transition";
    if(meta.bpm != null) return "rhythm";
    if(exerciseType) return exerciseType;
    if(meta.exerciseId) return "finger";
  }
  return item.type;
}

function formatPlanItemSubtitle(item){
  item = item || {};
  var meta = item.meta || {};
  var parts = [];
  var instrument = prettyPlanToken(meta.instrument);
  var exerciseFocus = prettyPlanToken(meta.exerciseFocus);
  var skill = prettyPlanToken(meta.skill);
  var displayType = prettyPlanToken(getPlanDisplayType(item));
  if(instrument) parts.push(instrument);
  if(exerciseFocus) parts.push(exerciseFocus);
  else if(skill) parts.push(skill);
  if(displayType) parts.push(displayType);
  return parts.join(" - ") || firstPrettyPlanToken(getPlanDisplayType(item), item.type, "practice");
}

function prettyPlanToken(value){
  var text;
  var lower;
  if(value == null) return "";
  if(typeof value !== "string" && typeof value !== "number") return "";
  text = String(value || "").replace(/_/g, " ").trim();
  if(!text) return "";
  lower = text.toLowerCase();
  if(lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function firstPrettyPlanToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = prettyPlanToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function getPlanItemLabel(item){
  var meta = item && item.meta ? item.meta : {};
  var label = prettyPlanToken(item ? item.label : null);
  return label
    ? label
    : firstPrettyPlanToken(
        meta.exerciseName,
        meta.songTitle,
        meta.songId,
        meta.exerciseFocus,
        meta.skill,
        meta.exerciseId,
        getPlanDisplayType(item),
        item && item.type,
        "practice"
      );
}

function getPlanFocusLabel(plan){
  if(!plan || !Array.isArray(plan.items) || !plan.items.some(function(item){
    var id = item && typeof item.id === "string" ? item.id.trim() : (item ? item.id : null);
    var label = prettyPlanToken(item ? item.label : null);
    var type = prettyPlanToken(item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!prettyPlanToken(value);
      if (typeof value === "number" || typeof value === "boolean") return false;
      if (typeof value === "object" || typeof value === "function" || typeof value === "symbol") return false;
      return true;
    }));
    return !!(
      item &&
      (id ||
       label ||
       type ||
       metaHasValue)
    );
  })) return "No practice plan yet.";
  var focus = prettyPlanToken(plan ? plan.focus : null);
  return focus ? focus : "No practice focus yet.";
}

function launchPracticePlanItem(itemId){
  var plan = null;
  var view = getPlanPageCoreView();
  if(view && view.plan && view.plan.flow === "daily_practice" && window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"){
    plan = SparkPracticeBridge.toLegacyPlan(view.plan);
  }
  if(!plan) plan = S.practicePlan;
  if(!plan || !Array.isArray(plan.items)) return;

  for(var i=0;i<plan.items.length;i++){
    var item = plan.items[i];
    var candidateId = item && typeof item.id === "string" ? item.id.trim() : null;
    if(item && candidateId === itemId){
      launchPracticeItem(item);
      return;
    }
  }
}
