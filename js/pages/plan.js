function planStateRead(path, fallback){
  if(typeof SparkState!=="undefined"&&typeof SparkState.read==="function"){
    return SparkState.read(path, fallback);
  }
  return fallback;
}

function planPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var corePlanActive = !!(coreView && coreView.plan && coreView.plan.flow === "daily_practice");
  var plan = corePlanActive
    && typeof SparkPracticeBridge !== "undefined" && SparkPracticeBridge && typeof SparkPracticeBridge.toLegacyPlan === "function"
    ? SparkPracticeBridge.toLegacyPlan(coreView.plan)
    : (corePlanActive ? null : planStateRead(["practicePlan"], null));
  var planItems = plan && Array.isArray(plan.items) ? plan.items : [];
  var planCompleted = coreView && coreView.lastSessionOutcome && coreView.lastSessionOutcome.planCompleted
    ? true
    : !!planStateRead(["practicePlanComplete"], false);
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Today\'s Practice Plan</h2>';
  h += '<div class="muted">'+escHTML(plan && plan.focus ? plan.focus : "No practice plan is available right now.")+'</div>';
  if(planCompleted){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  for(var i=0;i<planItems.length;i++){
    var item = planItems[i];
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(item.type)+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px">'+escHTML(item.label)+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(formatPlanItemSubtitle(item))+(item.durationSec ? ' \u2022 '+Math.round(item.durationSec/60)+'m' : '')+'</div>';
    h += '</div>';
    h += '<button class="btn btn-sm" onclick="act(\'startPracticeItem\',\''+escHTML(item.id)+'\')" style="background:var(--accent);color:#fff">Go</button>';
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

function formatPlanItemSubtitle(item){
  item = item || {};
  var meta = item.meta || {};
  var parts = [];
  if(meta.instrument) parts.push(prettyPlanToken(meta.instrument));
  if(meta.exerciseFocus) parts.push(prettyPlanToken(meta.exerciseFocus));
  else if(meta.skill) parts.push(prettyPlanToken(meta.skill));
  if(item.type) parts.push(prettyPlanToken(item.type));
  return parts.join(" | ") || String(item.type || "practice");
}

function prettyPlanToken(value){
  return String(value || "").replace(/_/g, " ");
}

