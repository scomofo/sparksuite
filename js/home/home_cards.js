function prettyHomeCardToken(value){
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

function buildHomeCardEntryLabel(primary, fallback) {
  return prettyHomeCardToken(primary) || prettyHomeCardToken(fallback);
}

function buildHomeWeakSkillLabel(entry) {
  var bucket = prettyHomeCardToken(entry && entry.bucket);
  var id = prettyHomeCardToken(entry && entry.id);
  if (bucket && id) return bucket + ": " + id;
  return bucket || id || "";
}

function renderHomeProfileCard(data){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Profile</div>';
  h += '<div>Level: '+data.level+'</div>';
  h += '<div>XP: '+data.xp+'</div>';
  h += '<div>Streak: '+data.streak+' days</div>';
  h += '</div>';
  return h;
}

function renderHomePracticeCard(data){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Today\'s Practice</div>';
  var plan = data.todayPlan || [];
  if(!plan.length){
    h += '<div>No plan yet.</div>';
  }
  for(var i=0;i<plan.length;i++){
    var itemLabel = buildHomeCardEntryLabel(plan[i] && plan[i].title, plan[i] && plan[i].id);
    if(!itemLabel) continue;
    h += '<div>'+escHTML(itemLabel)+'</div>';
  }
  h += '<button onclick="act(\'openPracticePlan\')">Open Plan</button>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">';
  h += '<button onclick="act(\'openPracticeTemplate\',\'quick_win\')">Quick Win 10</button>';
  h += '<button onclick="act(\'openPracticeTemplate\',\'low_energy\')">Low Energy 10</button>';
  h += '<button onclick="act(\'openPracticeTemplate\',\'reset_focus\')">Reset Focus 10</button>';
  h += '</div>';
  if(String(data.activeInstrumentType || "").toLowerCase() === "ukulele" || String(data.activeInstrumentType || "").toLowerCase() === "ukespark"){
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">';
    h += '<button onclick="act(\'openUkuleleMiniSession\',\'uke_favorites_set_a\')">Uke Set A</button>';
    h += '<button onclick="act(\'openUkuleleMiniSession\',\'uke_favorites_set_b\')">Uke Set B</button>';
    h += '<button onclick="act(\'openUkuleleMiniSession\',\'uke_favorites_set_c\')">Uke Set C</button>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function renderHomeRecommendationCard(arr){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Recommended Next</div>';
  for(var i=0;i<arr.length;i++){
    if(!arr[i]) continue;
    var title = buildHomeCardEntryLabel(arr[i].title, arr[i].id);
    if(title){
      h += '<div>'+escHTML(title)+'</div>';
    }
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
  h += '<div class="card-section-heading">Challenges</div>';
  for(var i=0;i<arr.length;i++){
    h += '<div>'+escHTML(arr[i].title)+' '+(arr[i].progress||0)+'/'+(arr[i].target||0)+'</div>';
  }
  h += '<button onclick="act(\'openChallengeHub\')">Open</button>';
  h += '</div>';
  return h;
}

function renderHomeCareerCard(data){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Career</div>';
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
  h += '<div class="card-section-heading">Packs</div>';
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
  h += '<div class="card-section-heading">Insights</div>';
  var focused = data && data.recommendationQuality ? data.recommendationQuality.focusedTechnique : null;
  var focusedLabel = buildHomeFocusedTechniqueLabel(focused);
  if(focusedLabel){
    h += '<div>Focus: '+escHTML(focusedLabel)+'</div>';
  }
  var ws = (data && data.weakestSkills) || [];
  var weakestLabel = ws.length ? buildHomeWeakSkillLabel(ws[0]) : "";
  if(weakestLabel){
    h += '<div>Weakest: '+escHTML(weakestLabel)+'</div>';
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
  h += '<div class="card-section-heading">Event</div>';
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
  h += '<div class="card-section-heading">System</div>';
  h += '<div>Version: '+escHTML(data.version)+'</div>';
  h += '<div>Cloud: '+escHTML(data.cloudStatus)+'</div>';
  h += '</div>';
  return h;
}
