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
    var durationSec = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(durationSec) && durationSec > 0
      ? Math.round(durationSec / 60)
      : null;
  }
  function getPlanItemId(item){
    var id = item && typeof item.id === "string" ? item.id.trim() : (item ? item.id : null);
    return id || null;
  }
  function isRenderablePlanItem(item){
    var label = item && typeof item.label === "string" ? item.label.trim() : (item ? item.label : null);
    var type = item && typeof item.type === "string" ? item.type.trim() : (item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!value.trim();
      if (typeof value === "boolean") return false;
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
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
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
  h += '<div class="muted">'+escHTML(getPlanFocusLabel(plan))+'</div>';
  if(hasPlanItems && planCompleted){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  if(!hasPlanItems){
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
        ? '<button class="btn btn-sm" data-item-id="'+escHTML(itemId)+'" onclick="launchPracticePlanItem(this.getAttribute(\'data-item-id\'))" style="background:var(--accent);color:#fff">Go</button>'
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
  if(value == null) return "";
  if(typeof value === "boolean" || typeof value === "object" || typeof value === "function" || typeof value === "symbol") return "";
  return String(value || "").replace(/_/g, " ").trim();
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
  var label = item && typeof item.label === "string" ? item.label.trim() : (item ? item.label : null);
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
    var label = item && typeof item.label === "string" ? item.label.trim() : (item ? item.label : null);
    var type = item && typeof item.type === "string" ? item.type.trim() : (item ? item.type : null);
    var metaHasValue = !!(item && item.meta && typeof item.meta === "object" && !Array.isArray(item.meta) && Object.keys(item.meta).some(function(key) {
      var value = item.meta[key];
      if (value == null) return false;
      if (typeof value === "string") return !!value.trim();
      if (typeof value === "boolean") return false;
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
  var focus = typeof plan.focus === "string" ? plan.focus.trim() : null;
  return focus ? focus : "No practice focus yet.";
}

function launchPracticePlanItem(itemId){
  var plan = null;
  if(window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"){
    var view = window.sparkCore.getActiveSessionView();
    if(view && view.plan && view.plan.flow === "daily_practice" && window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"){
      plan = SparkPracticeBridge.toLegacyPlan(view.plan);
    }
  }
  if(!plan) plan = S.practicePlan;
  if(!plan || !Array.isArray(plan.items)) return;

  for(var i=0;i<plan.items.length;i++){
    var item = plan.items[i];
    var candidateId = item && typeof item.id === "string" ? item.id.trim() : (item ? item.id : null);
    if(item && candidateId === itemId){
      launchPracticeItem(item);
      return;
    }
  }
}
