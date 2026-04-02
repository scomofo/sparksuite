function challengeHubPage(){
  var h = '<div class="card mb16">';
  h += '<div><b>Challenge Hub</b></div>';
  h += '<div class="muted">Daily, weekly, seasonal, and pack progress.</div>';
  h += '</div>';
  h += renderActiveChallengesCard();
  h += renderSeasonalEventCard();
  h += renderPackProgressCard();
  return h;
}

function renderActiveChallengesCard(){
  var h = '<div class="card mb16">';
  h += '<div><b>Active Challenges</b></div>';
  var arr = S.activeChallenges || [];
  if(!arr.length){
    h += '<div>No active challenges.</div>';
  }
  for(var i=0;i<arr.length;i++){
    h += '<div style="margin-top:10px;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:8px">';
    h += '<div><b>'+escHTML(arr[i].title)+'</b></div>';
    h += '<div>'+escHTML(arr[i].description || "")+'</div>';
    h += '<div>'+arr[i].progress+' / '+arr[i].target+'</div>';
    if(arr[i].completed && !arr[i].claimed){
      h += '<button onclick="act(\'claimChallengeReward\', \''+arr[i].id+'\')">Claim Reward</button>';
    }else if(arr[i].claimed){
      h += '<div>Claimed</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function renderSeasonalEventCard(){
  var ev = typeof getActiveSeasonalEvent === "function" ? getActiveSeasonalEvent() : null;
  var h = '<div class="card mb16">';
  h += '<div><b>Seasonal Event</b></div>';
  if(!ev){
    h += '<div>No active event.</div>';
    h += '</div>';
    return h;
  }
  h += '<div><b>'+escHTML(ev.title)+'</b></div>';
  var arr = ev.challenges || [];
  for(var i=0;i<arr.length;i++){
    h += '<div>'+escHTML(arr[i].title)+' — '+arr[i].progress+'/'+arr[i].target+'</div>';
  }
  h += '</div>';
  return h;
}

function renderPackProgressCard(){
  var packs = (S.packCompletion && S.packCompletion.packs) || {};
  var h = '<div class="card mb16">';
  h += '<div><b>Pack Progress</b></div>';
  var any = false;
  for(var id in packs){
    any = true;
    h += '<div>'+escHTML(id)+' — '+Math.round((packs[id].progress || 0) * 100)+'%</div>';
  }
  if(!any){
    h += '<div>No pack progress yet.</div>';
  }
  h += '</div>';
  return h;
}
