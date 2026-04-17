function pianoPlanPage(){
  function hasRenderablePlanItems(plan){
    return !!(plan && Array.isArray(plan.items) && plan.items.some(function(item){ return !!item; }));
  }
  function getRenderablePlanItems(plan){
    return plan && Array.isArray(plan.items)
      ? plan.items.filter(function(item){ return !!item; })
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
  var planCompleted = (coreView && coreView.lastSessionOutcome && coreView.lastSessionOutcome.planCompleted)
    ? true
    : !!S.practicePlanComplete;
  if(!planCompleted && hasPlanItems){
    planCompleted = renderableItems.every(function(item){ return !!item.completed; });
  }
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Today\'s Practice Plan</h2>';
  h += '<div class="muted">'+escHTML(getPianoPlanFocusLabel(plan))+'</div>';
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
    var item = plan.items[i] || {};
    var canLaunch = !!item.id;
    var done = item.completed ? ' style="opacity:0.5;text-decoration:line-through"' : '';
    var actionHtml = item.completed
      ? '<span class="text-muted">Done</span>'
      : (canLaunch
        ? '<button class="btn btn-sm" onclick="launchPracticePlanItem(\''+escHTML(item.id)+'\')" style="background:var(--accent);color:#fff">Go</button>'
        : '<span class="text-muted">Unavailable</span>');
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(getPianoPlanDisplayType(item))+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px"'+done+'>'+escHTML(getPianoPlanItemLabel(item))+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(formatPianoPlanItemSubtitle(item))+(item.durationSec ? ' \u2022 '+Math.round(item.durationSec/60)+'m' : '')+'</div>';
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
  if(item.type === "song" && meta.songId) return "performance_song";
  if(item.type === "practice"){
    if(meta.guidedSession != null) return "guided_session";
    if(meta.from || meta.to || meta.key) return "transition";
    if(meta.bpm != null) return "rhythm";
    if(meta.exerciseType) return meta.exerciseType;
    if(meta.exerciseId) return "finger";
  }
  return item.type;
}

function formatPianoPlanItemSubtitle(item){
  item = item || {};
  var meta = item.meta || {};
  var parts = [];
  if(meta.instrument) parts.push(prettyPianoPlanToken(meta.instrument));
  if(meta.exerciseFocus) parts.push(prettyPianoPlanToken(meta.exerciseFocus));
  else if(meta.skill) parts.push(prettyPianoPlanToken(meta.skill));
  if(getPianoPlanDisplayType(item)) parts.push(prettyPianoPlanToken(getPianoPlanDisplayType(item)));
  return parts.join(" - ") || String(getPianoPlanDisplayType(item) || item.type || "practice");
}

function prettyPianoPlanToken(value){
  return String(value || "").replace(/_/g, " ");
}

function getPianoPlanItemLabel(item){
  var meta = item && item.meta ? item.meta : {};
  return item && item.label
    ? item.label
    : prettyPianoPlanToken(
        meta.exerciseName ||
        meta.songTitle ||
        meta.songId ||
        meta.exerciseFocus ||
        meta.skill ||
        meta.exerciseId ||
        getPianoPlanDisplayType(item) ||
        (item && item.type) ||
        "practice"
      );
}

function getPianoPlanFocusLabel(plan){
  if(!plan || !Array.isArray(plan.items) || !plan.items.some(function(item){ return !!item; })) return "No practice plan yet.";
  return plan.focus ? plan.focus : "No practice focus yet.";
}

function planItemColor(type){
  if(type==="warmup" || type==="finger") return "var(--warning)";
  if(type==="transition") return "var(--chord-major)";
  if(type==="rhythm_highway") return "#ec4899";
  if(type==="performance_song" || type==="performance_phrase") return "var(--success)";
  if(type==="left_hand_pattern") return "var(--chord-min7)";
  return "var(--text-muted)";
}
