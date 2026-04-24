function pianoGetPlanCoreView() {
  var core = window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
  return core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
}

function pianoGetActiveGuidedPlanSummary() {
  var coreView = pianoGetPlanCoreView();
  var context = coreView && coreView.plan && coreView.plan.context ? coreView.plan.context : null;
  var guidedPlan = context && context.guidedPlan ? context.guidedPlan : null;
  var runtimeState = coreView && coreView.runtimeState ? coreView.runtimeState : null;
  var blocks = guidedPlan && Array.isArray(guidedPlan.blocks) ? guidedPlan.blocks : [];
  var totalSec = 0;
  var i;
  if (!coreView || !guidedPlan || !runtimeState || runtimeState.activeScreen !== "guided_session" || coreView.plan.flow !== "guided_session") {
    return null;
  }
  if (guidedPlan.target_duration_min) {
    totalSec = Number(guidedPlan.target_duration_min) * 60;
  } else {
    for (i = 0; i < blocks.length; i++) {
      totalSec += Number(blocks[i] && blocks[i].duration_sec) || 0;
    }
    if (!totalSec) totalSec = Number(context.guidedShellDurationSec) || 0;
  }
  return {
    title: prettyPianoPlanToken(guidedPlan.title) || prettyPianoPlanToken(guidedPlan.id) || "Guided Session",
    blockCount: blocks.length,
    targetDurationMin: totalSec > 0 ? Math.max(1, Math.round(totalSec / 60)) : 0,
    statusLabel: typeof pianoSessionStepRuntimeLabel === "function"
      ? pianoSessionStepRuntimeLabel(runtimeState.guidedStep || "spark", runtimeState.guidedNewMovePhase || null)
      : "Guided session live",
    focusSong: prettyPianoPlanToken(guidedPlan.focus_song),
    newElement: typeof pianoGetGuidedPrimaryNewElement === "function"
      ? pianoGetGuidedPrimaryNewElement(guidedPlan)
      : (Array.isArray(guidedPlan.new_elements) ? prettyPianoPlanToken(guidedPlan.new_elements[0]) : "")
  };
}

function pianoPlanPage(){
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
    var label = prettyPianoPlanToken(item ? item.label : null);
    var type = prettyPianoPlanToken(item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!prettyPianoPlanToken(value);
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
  var coreView = pianoGetPlanCoreView();
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
  var activeGuided = pianoGetActiveGuidedPlanSummary();
  if(!plan) plan = S.practicePlan;
  var renderableItems = getRenderablePlanItems(plan);
  var hasPlanItems = hasRenderablePlanItems(plan);
  var planCompleted = isPlanCompleteFlag(coreView && coreView.lastSessionOutcome && coreView.lastSessionOutcome.planCompleted)
    ? true
    : isPlanCompleteFlag(S.practicePlanComplete);
  if(!planCompleted && hasPlanItems){
    planCompleted = renderableItems.every(isCompletedPlanItem);
  }
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Today\'s Practice Plan</h2>';
  h += '<div class="muted">'+escHTML(activeGuided ? "Guided Session Live" : getPianoPlanFocusLabel(plan))+'</div>';
  if(hasPlanItems && planCompleted){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  if(!hasPlanItems){
    if (activeGuided) {
      h += '<div class="card mb16" style="border:2px solid var(--accent)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px">';
      h += '<div style="font-size:15px;font-weight:800">Guided Session Flow</div>';
      h += '<div class="muted">' + escHTML((activeGuided.blockCount || 4) + ' blocks') + '</div>';
      h += '</div>';
      h += '<div class="muted" style="margin-bottom:10px">Your live guided shell is the plan right now.</div>';
      h += '<div style="padding:10px 12px;border-radius:14px;background:rgba(78,205,196,.12);margin-bottom:10px">';
      h += '<div style="font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)">Guided Session Live</div>';
      h += '<div style="font-size:14px;font-weight:800;margin-top:4px">' + escHTML(activeGuided.title) + '</div>';
      h += '<div class="muted" style="margin-top:4px">' + escHTML(activeGuided.statusLabel) + '</div>';
      if (activeGuided.targetDurationMin > 0) {
        h += '<div class="muted" style="margin-top:4px">' + escHTML(activeGuided.targetDurationMin + " min shell") + '</div>';
      }
      if (activeGuided.focusSong) {
        h += '<div class="muted" style="margin-top:4px">Song hook: ' + escHTML(activeGuided.focusSong) + '</div>';
      }
      if (activeGuided.newElement) {
        h += '<div class="muted" style="margin-top:4px">New move: ' + escHTML(activeGuided.newElement) + '</div>';
      }
      h += '</div>';
      h += '<button class="btn" onclick="act(\'resume_guided_session\')" style="background:var(--accent);color:#fff;font-weight:700">Resume Guided Session</button>';
      h += '</div>';
      h += '<div class="card mb16" style="text-align:center">';
      h += '<button class="btn" onclick="act(\'back\')">Back</button>';
      h += '</div>';
      return h;
    }
    h += '<div class="card mb16"><div class="muted">No practice plan yet.</div></div>';
    h += '<div class="card mb16" style="text-align:center">';
    h += '<button class="btn" onclick="act(\'regeneratePlan\')">Regenerate Plan</button> ';
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
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(getPianoPlanDisplayType(item))+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px"'+done+'>'+escHTML(getPianoPlanItemLabel(item))+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(formatPianoPlanItemSubtitle(item))+(durationMinutes != null ? ' \u2022 '+durationMinutes+'m' : '')+'</div>';
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

function getPianoPlanDisplayType(item){
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

function formatPianoPlanItemSubtitle(item){
  item = item || {};
  var meta = item.meta || {};
  var parts = [];
  var instrument = prettyPianoPlanToken(meta.instrument);
  var exerciseFocus = prettyPianoPlanToken(meta.exerciseFocus);
  var skill = prettyPianoPlanToken(meta.skill);
  var displayType = prettyPianoPlanToken(getPianoPlanDisplayType(item));
  if(instrument) parts.push(instrument);
  if(exerciseFocus) parts.push(exerciseFocus);
  else if(skill) parts.push(skill);
  if(displayType) parts.push(displayType);
  return parts.join(" - ") || firstPrettyPianoPlanToken(getPianoPlanDisplayType(item), item.type, "practice");
}

function prettyPianoPlanToken(value){
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

function firstPrettyPianoPlanToken() {
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = prettyPianoPlanToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function getPianoPlanItemLabel(item){
  var meta = item && item.meta ? item.meta : {};
  var label = prettyPianoPlanToken(item ? item.label : null);
  return label
    ? label
    : firstPrettyPianoPlanToken(
        meta.exerciseName,
        meta.songTitle,
        meta.songId,
        meta.exerciseFocus,
        meta.skill,
        meta.exerciseId,
        getPianoPlanDisplayType(item),
        item && item.type,
        "practice"
      );
}

function getPianoPlanFocusLabel(plan){
  if(!plan || !Array.isArray(plan.items) || !plan.items.some(function(item){
    var id = item && typeof item.id === "string" ? item.id.trim() : (item ? item.id : null);
    var label = prettyPianoPlanToken(item ? item.label : null);
    var type = prettyPianoPlanToken(item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!prettyPianoPlanToken(value);
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
  var focus = prettyPianoPlanToken(plan ? plan.focus : null);
  return focus ? focus : "No practice focus yet.";
}

function planItemColor(type){
  if(type==="warmup" || type==="finger") return "var(--warning)";
  if(type==="transition") return "var(--chord-major)";
  if(type==="rhythm_highway") return "#ec4899";
  if(type==="performance_song" || type==="performance_phrase") return "var(--success)";
  if(type==="left_hand_pattern") return "var(--chord-min7)";
  return "var(--text-muted)";
}
