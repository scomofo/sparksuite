function planPage(){
  var plan = ensurePracticePlan();
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Today\'s Practice Plan</h2>';
  h += '<div class="muted">'+escHTML(plan.focus)+'</div>';
  if(S.practicePlanComplete){
    h += '<div style="margin-top:8px;color:var(--success);font-weight:700">Plan completed!</div>';
  }
  h += '</div>';

  for(var i=0;i<plan.items.length;i++){
    var item = plan.items[i];
    h += '<div class="card mb16" style="border-left:4px solid '+planItemColor(item.type)+'">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div>';
    h += '<div style="font-weight:700;font-size:14px">'+escHTML(item.label)+'</div>';
    h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(item.type)+(item.durationSec ? ' \u2022 '+Math.round(item.durationSec/60)+'m' : '')+'</div>';
    h += '</div>';
    h += '<button class="btn btn-sm" onclick="launchPracticePlanItem(S.practicePlan.items['+i+'])" style="background:var(--accent);color:#fff">Go</button>';
    h += '</div>';
    h += '</div>';
  }

  if(!S.practicePlanComplete){
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
  if(type==="performance_song" || type==="performance_phrase") return "var(--success)";
  if(type==="left_hand_pattern") return "var(--chord-min7)";
  return "var(--text-muted)";
}
