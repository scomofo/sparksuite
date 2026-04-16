function pianoPlanRead(path, fallback){
  if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
    return SparkState.read(path, fallback);
  }
  var root = typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"
    ? SparkState.getRoot()
    : null;
  if(!root && typeof globalThis !== "undefined"){
    root = globalThis.__sparkState || globalThis.S || null;
  }
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if(!cursor) return fallback;
  for(i=0;i<parts.length;i++){
    if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function pianoPlanPage(){
  var plan = typeof ensurePracticePlan === "function" ? ensurePracticePlan() : null;
  var planItems = plan && Array.isArray(plan.items) ? plan.items : [];
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Today\'s Practice Plan</h2>';
  h += '<div class="muted">'+escHTML(plan && plan.focus ? plan.focus : "No practice plan is available right now.")+'</div>';
  if(pianoPlanRead("practicePlanComplete", false)){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  for(var i=0;i<planItems.length;i++){
    var item = planItems[i];
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(item.type)+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px">'+escHTML(item.label)+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(item.type)+(item.durationSec ? ' \u2022 '+Math.round(item.durationSec/60)+'m' : '')+'</div>';
    h += '</div>';
    h += '<button class="btn btn-sm" onclick="act(\'startPracticeItem\',\'' + escHTML(item.id) + '\')" style="background:var(--accent);color:#fff">Go</button>';
    h += '</div>';
    h += '</div>';
  }

  if(!pianoPlanRead("practicePlanComplete", false)){
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
  if(type==="warmup" || type==="finger") return "var(--warning)";
  if(type==="transition") return "var(--chord-major)";
  if(type==="rhythm_highway") return "#ec4899";
  if(type==="performance_song" || type==="performance_phrase") return "var(--success)";
  if(type==="left_hand_pattern") return "var(--chord-min7)";
  return "var(--text-muted)";
}
