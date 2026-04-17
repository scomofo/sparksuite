function prettyHomeCardToken(value){
  var text;
  var lower;
  if(value == null) return "";
  if(typeof value === "number" || typeof value === "boolean" || typeof value === "object" || typeof value === "function" || typeof value === "symbol") return "";
  text = String(value || "").replace(/_/g, " ").trim();
  if(!text) return "";
  lower = text.toLowerCase();
  if(lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function renderHomeProfileCard(data){
  var h = '<div class="card">';
  h += '<div><b>Profile</b></div>';
  h += '<div>Level: '+data.level+'</div>';
  h += '<div>XP: '+data.xp+'</div>';
  h += '<div>Streak: '+data.streak+' days</div>';
  h += '</div>';
  return h;
}

function renderHomePracticeCard(data){
  var h = '<div class="card">';
  h += '<div><b>Today\'s Practice</b></div>';
  var plan = data.todayPlan || [];
  if(!plan.length){
    h += '<div>No plan yet.</div>';
  }
  for(var i=0;i<plan.length;i++){
    h += '<div>'+escHTML(plan[i].title || plan[i].id)+'</div>';
  }
  h += '<button onclick="act(\'openPracticePlan\')">Open Plan</button>';
  h += '</div>';
  return h;
}

function renderHomeRecommendationCard(arr){
  var h = '<div class="card">';
  h += '<div><b>Recommended Next</b></div>';
  for(var i=0;i<arr.length;i++){
    if(!arr[i]) continue;
    h += '<div>'+escHTML(arr[i].title || '')+'</div>';
    h += renderHomeRecommendationDetail(arr[i]);
  }
  h += '<button onclick="act(\'openRecommendations\')">View</button>';
  h += '</div>';
  return h;
}

function renderHomeRecommendationDetail(item){
  if(!item) return "";
  if(item.source === "module_progress" && item.meta){
    var parts = [];
    var focus = prettyHomeCardToken(item.meta.recommendationFocus);
    if(focus){
      parts.push("Focus: " + focus);
    }
    var summary = item.meta.progressSummary;
    var weakestMetric = prettyHomeCardToken(summary && summary.weakestMetric);
    if(summary && weakestMetric && typeof summary[summary.weakestMetric] === "number"){
      parts.push("Weakest: " + weakestMetric + " " + Math.round(summary[summary.weakestMetric] * 100) + "%");
    }
    if(parts.length){
      return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(parts.join(" | ")) + '</div>';
    }
  }
  if(item.type === "performance_technique" && item.meta){
    var technique = prettyHomeCardToken(item.meta.techniqueKey) || "technique";
    var accuracy = typeof item.meta.techniqueAccuracy === "number" ? item.meta.techniqueAccuracy + "%" : null;
    var bits = ["Technique: " + technique];
    if(accuracy) bits.push("Accuracy: " + accuracy);
    return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(bits.join(" | ")) + '</div>';
  }
  return "";
}

function renderHomeChallengeCard(arr){
  var h = '<div class="card">';
  h += '<div><b>Challenges</b></div>';
  for(var i=0;i<arr.length;i++){
    h += '<div>'+escHTML(arr[i].title)+' '+(arr[i].progress||0)+'/'+(arr[i].target||0)+'</div>';
  }
  h += '<button onclick="act(\'openChallengeHub\')">Open</button>';
  h += '</div>';
  return h;
}

function renderHomeCareerCard(data){
  var h = '<div class="card">';
  h += '<div><b>Career</b></div>';
  if(data.nextSong){
    h += '<div>Next: '+escHTML(data.nextSong)+'</div>';
    h += '<button onclick="act(\'openCareer\')">Open Career</button>';
  }else{
    h += '<div>No career songs available.</div>';
  }
  h += '</div>';
  return h;
}

function renderHomePackCard(data){
  var h = '<div class="card">';
  h += '<div><b>Packs</b></div>';
  var packs = (data && data.packs) || {};
  var any = false;
  for(var id in packs){
    any = true;
    h += '<div>'+escHTML(id)+' — '+Math.round((packs[id].progress||0)*100)+'%</div>';
  }
  if(!any) h += '<div>No pack progress.</div>';
  h += '</div>';
  return h;
}

function renderHomeInsightCard(data){
  var h = '<div class="card">';
  h += '<div><b>Insights</b></div>';
  var focused = data && data.recommendationQuality ? data.recommendationQuality.focusedTechnique : null;
  var focusedLabel = buildHomeFocusedTechniqueLabel(focused);
  if(focusedLabel){
    h += '<div>Focus: '+escHTML(focusedLabel)+'</div>';
  }
  var ws = (data && data.weakestSkills) || [];
  if(ws.length){
    h += '<div>Weakest: '+escHTML(ws[0].bucket+': '+ws[0].id)+'</div>';
  }else if(!focusedLabel){
    h += '<div>Practice more to see insights.</div>';
  }
  h += '<button onclick="act(\'openInsights\')">View</button>';
  h += '</div>';
  return h;
}

function buildHomeFocusedTechniqueLabel(focused){
  if(!focused) return "";
  var songLabel = prettyHomeCardToken(focused.songId) || "song";
  var techniqueLabel = prettyHomeCardToken(focused.techniqueLabel) || "skill";
  var accuracy = typeof focused.accuracy === "number" && isFinite(focused.accuracy) ? focused.accuracy : 0;
  return techniqueLabel + " " + accuracy + "% in " + songLabel;
}

function renderHomeEventCard(data){
  var h = '<div class="card">';
  h += '<div><b>Event</b></div>';
  if(data && data.title){
    h += '<div>'+escHTML(data.title)+'</div>';
  }else{
    h += '<div>No active event.</div>';
  }
  h += '</div>';
  return h;
}

function renderHomeSystemCard(data){
  var h = '<div class="card">';
  h += '<div><b>System</b></div>';
  h += '<div>Version: '+escHTML(data.version)+'</div>';
  h += '<div>Cloud: '+escHTML(data.cloudStatus)+'</div>';
  h += '</div>';
  return h;
}
