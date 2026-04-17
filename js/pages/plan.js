function planPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var hasPracticeBridge = window.SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function";
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? (hasPracticeBridge ? SparkPracticeBridge.toLegacyPlan(coreView.plan) : null)
    : S.practicePlan;
  if(!plan) plan = S.practicePlan;
  var planCompleted = coreView && coreView.lastSessionOutcome && coreView.lastSessionOutcome.planCompleted
    ? true
    : !!S.practicePlanComplete;
  var hasPlanItems = !!(plan && Array.isArray(plan.items) && plan.items.length);
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
    var canLaunch = !!(item && item.id);
    var done = item.completed ? ' style="opacity:0.5;text-decoration:line-through"' : '';
    var actionHtml = item.completed
      ? '<span class="text-muted">Done</span>'
      : (canLaunch
        ? '<button class="btn btn-sm" onclick="launchPracticePlanItem(\''+escHTML(item.id)+'\')" style="background:var(--accent);color:#fff">Go</button>'
        : '<span class="text-muted">Unavailable</span>');
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(getPlanDisplayType(item))+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px"'+done+'>'+escHTML(getPlanItemLabel(item))+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(formatPlanItemSubtitle(item))+(item.durationSec ? ' \u2022 '+Math.round(item.durationSec/60)+'m' : '')+'</div>';
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

function formatPlanItemSubtitle(item){
  item = item || {};
  var meta = item.meta || {};
  var parts = [];
  if(meta.instrument) parts.push(prettyPlanToken(meta.instrument));
  if(meta.exerciseFocus) parts.push(prettyPlanToken(meta.exerciseFocus));
  else if(meta.skill) parts.push(prettyPlanToken(meta.skill));
  if(getPlanDisplayType(item)) parts.push(prettyPlanToken(getPlanDisplayType(item)));
  return parts.join(" - ") || String(getPlanDisplayType(item) || item.type || "practice");
}

function prettyPlanToken(value){
  return String(value || "").replace(/_/g, " ");
}

function getPlanItemLabel(item){
  var meta = item && item.meta ? item.meta : {};
  return item && item.label
    ? item.label
    : prettyPlanToken(
        meta.exerciseName ||
        meta.songTitle ||
        meta.songId ||
        meta.exerciseFocus ||
        meta.skill ||
        meta.exerciseId ||
        getPlanDisplayType(item) ||
        (item && item.type) ||
        "practice"
      );
}

function getPlanFocusLabel(plan){
  if(!plan) return "No practice plan yet.";
  return plan.focus ? plan.focus : "No practice focus yet.";
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
    if(plan.items[i].id === itemId){
      launchPracticeItem(plan.items[i]);
      return;
    }
  }
}
