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
    if(item.meta.recommendationFocus){
      parts.push("Focus: " + item.meta.recommendationFocus.replace(/_/g, " "));
    }
    var summary = item.meta.progressSummary;
    if(summary && summary.weakestMetric && typeof summary[summary.weakestMetric] === "number"){
      parts.push("Weakest: " + summary.weakestMetric.replace(/_/g, " ") + " " + Math.round(summary[summary.weakestMetric] * 100) + "%");
    }
    if(parts.length){
      return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(parts.join(" | ")) + '</div>';
    }
  }
  if(item.type === "performance_technique" && item.meta){
    var technique = item.meta.techniqueKey ? String(item.meta.techniqueKey).replace(/_/g, " ") : "technique";
    var accuracy = typeof item.meta.techniqueAccuracy === "number" ? item.meta.techniqueAccuracy + "%" : null;
    var bits = ["Technique: " + technique];
    if(accuracy) bits.push("Accuracy: " + accuracy);
    return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(bits.join(" | ")) + '</div>';
  }
  if((item.source === "play_along" || item.source === "play_along_bookmark") && item.meta){
    var playBits = [];
    if(item.meta.trackTitle) playBits.push("Song: " + item.meta.trackTitle);
    if(item.meta.sectionLabel) playBits.push("Section: " + item.meta.sectionLabel);
    if(item.meta.weakAreas && item.meta.weakAreas.length) playBits.push("Weak: " + item.meta.weakAreas.join(" | "));
    if(playBits.length){
      return '<div style="font-size:12px;color:#8fd5c4">' + escHTML(playBits.join(" | ")) + '</div>';
    }
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
  if(focused){
    h += '<div>Focus: '+escHTML(buildHomeFocusedTechniqueLabel(focused))+'</div>';
  }
  var ws = (data && data.weakestSkills) || [];
  if(ws.length){
    h += '<div>Weakest: '+escHTML(ws[0].bucket+': '+ws[0].id)+'</div>';
  }else if(!focused){
    h += '<div>Practice more to see insights.</div>';
  }
  h += '<button onclick="act(\'openInsights\')">View</button>';
  h += '</div>';
  return h;
}

function buildHomeFocusedTechniqueLabel(focused){
  if(!focused) return "";
  var songLabel = String(focused.songId || "song").replace(/_/g, " ");
  return focused.techniqueLabel + " " + focused.accuracy + "% in " + songLabel;
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
  if (data.transportMode) {
    h += '<div>Transport: '+escHTML(data.transportMode)+'</div>';
  }
  if (data.executionTrace) {
    h += '<div style="margin-top:8px;color:#8fd5c4">Trace: '+escHTML(data.executionTrace.source || data.executionTrace.status || "unknown")+'</div>';
    if (data.executionTrace.exerciseType) {
      h += '<div style="font-size:12px;color:var(--text-muted)">Exercise: '+escHTML(data.executionTrace.exerciseType)+'</div>';
    }
    if (data.executionTrace.flow) {
      h += '<div style="font-size:12px;color:var(--text-muted)">Flow: '+escHTML(data.executionTrace.flow)+'</div>';
    }
  }
  if (data.recentPlayAlong && data.recentPlayAlong.length) {
    h += '<div style="margin-top:8px"><b>Recent Play Along</b></div>';
    for (var i = 0; i < data.recentPlayAlong.length; i++) {
      var item = data.recentPlayAlong[i];
      h += '<div style="font-size:12px;color:var(--text-muted)">'+escHTML(item.title || item.trackId || "song")+'</div>';
    }
  }
  h += '</div>';
  return h;
}

function renderHomePlayAlongCard(data){
  data = data || {};
  var recent = Array.isArray(data.recent) ? data.recent : [];
  var bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  var latest = recent.length ? recent[0] : null;
  var outcome = data.outcome || null;
  var weakAreas = Array.isArray(data.weakAreas) ? data.weakAreas : [];
  var h = '<div class="card">';
  h += '<div><b>Play Along</b></div>';
  if(latest){
    h += '<div>Last song: '+escHTML(latest.title || latest.trackId || "Recent Song")+'</div>';
    if(latest.artist) h += '<div style="font-size:12px;color:var(--text-muted)">'+escHTML(latest.artist)+'</div>';
    if(data.transportMode || latest.transportMode){
      h += '<div style="font-size:12px;color:var(--text-muted)">Transport: '+escHTML(data.transportMode || latest.transportMode)+'</div>';
    }
    if(outcome && typeof outcome.accuracy === "number"){
      h += '<div style="font-size:12px;color:#8fd5c4">Last accuracy: '+Math.round((outcome.accuracy <= 1 ? outcome.accuracy * 100 : outcome.accuracy))+'%</div>';
    }
    if(weakAreas.length){
      h += '<div style="font-size:12px;color:var(--text-muted)">Weak spots: '+escHTML(weakAreas.join(" | "))+'</div>';
    }
    if(data.weakSection && data.weakSection.sectionLabel){
      h += '<div style="font-size:12px;color:var(--text-muted)">Weak section: '+escHTML(data.weakSection.sectionLabel)+'</div>';
    }
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">';
    h += '<button onclick="act(\'playAlongResumeRecent\',0)">Resume Song</button>';
    if(data.weakSection){
      h += '<button onclick="act(\'playAlongJumpToWeakSection\')">Jump To Weak Section</button>';
    }
    if(data.hasDrill){
      h += '<button onclick="act(\'playAlongStartDrill\',0)">Run Last Drill</button>';
    }
    h += '</div>';
    if(bookmarks.length){
      h += '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)"><b>Bookmarks</b></div>';
      for(var i=0;i<bookmarks.length;i++){
        h += '<div style="font-size:12px;color:var(--text-muted)">'+escHTML((bookmarks[i].sectionLabel || "Section") + " in " + (bookmarks[i].title || bookmarks[i].trackId || "song"))+'</div>';
      }
    }
  }else{
    h += '<div>No recent play-along songs yet.</div>';
    h += '<button onclick="act(\'openPlayAlongHome\')">Start Play Along</button>';
  }
  h += '</div>';
  return h;
}
