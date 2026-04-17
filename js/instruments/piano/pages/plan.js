function pianoPlanPage(){
  var coreView = window.sparkCore && typeof window.sparkCore.getActiveSessionView === "function"
    ? window.sparkCore.getActiveSessionView()
    : null;
  var plan = coreView && coreView.plan && coreView.plan.flow === "daily_practice"
    ? SparkPracticeBridge.toLegacyPlan(coreView.plan)
    : ensurePracticePlan();
  var planCompleted = coreView && coreView.lastSessionOutcome && coreView.lastSessionOutcome.planCompleted
    ? true
    : !!S.practicePlanComplete;
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Today\'s Practice Plan</h2>';
  h += '<div class="muted">'+escHTML(plan.focus)+'</div>';
  if(planCompleted){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  for(var i=0;i<plan.items.length;i++){
    var item = plan.items[i];
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(getPianoPlanDisplayType(item))+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px">'+escHTML(item.label)+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(String(getPianoPlanDisplayType(item) || item.type || "practice").replace(/_/g," "))+(item.durationSec ? ' \u2022 '+Math.round(item.durationSec/60)+'m' : '')+'</div>';
    h += '</div>';
    h += '<button class="btn btn-sm" onclick="launchPracticePlanItem(\''+escHTML(item.id)+'\')" style="background:var(--accent);color:#fff">Go</button>';
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

function planItemColor(type){
  if(type==="warmup" || type==="finger") return "var(--warning)";
  if(type==="transition") return "var(--chord-major)";
  if(type==="rhythm_highway") return "#ec4899";
  if(type==="performance_song" || type==="performance_phrase") return "var(--success)";
  if(type==="left_hand_pattern") return "var(--chord-min7)";
  return "var(--text-muted)";
}
