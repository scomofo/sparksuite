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
  h += '</div>';
  return h;
}

function renderHomeDailyPlanCard() {
  if (typeof SparkDailyPlanGenerator === "undefined" || !S.skillGraph) return "";
  var plan = SparkDailyPlanGenerator.generate(S.skillGraph, typeof SONGS !== "undefined" ? SONGS : []);
  if (!plan || !plan.length) return "";
  var totalMin = Math.ceil(SparkDailyPlanGenerator.estimateDuration(plan) / 60);

  // Track which step is current (first incomplete)
  var currentStep = 0;
  if (S.dailyPlanProgress && Array.isArray(S.dailyPlanProgress)) {
    currentStep = Math.min(S.dailyPlanProgress.length, plan.length);
  }

  var h = '<div style="border-radius:20px;padding:20px;background:#1C1C1E;border:1px solid rgba(255,255,255,.06);margin-bottom:16px">';

  // Header
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
  h += '<div><div style="font-size:16px;font-weight:700;color:#FFFFFF">Today\'s Plan</div>';
  h += '<div style="font-size:12px;color:#8E8E93;margin-top:2px">Stay consistent</div></div>';
  h += '<span style="padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.06);font-size:11px;font-weight:700;color:#8E8E93">~' + totalMin + ' min</span>';
  h += '</div>';

  // Steps
  for (var i = 0; i < plan.length; i++) {
    var item = plan[i];
    var isComplete = i < currentStep;
    var isCurrent = i === currentStep;
    var isUpcoming = i > currentStep;

    var dotColor = isComplete ? "#00FF88" : isCurrent ? "#00FF88" : "rgba(255,255,255,.2)";
    var dotStyle = isComplete
      ? "width:8px;height:8px;border-radius:50%;background:" + dotColor
      : isCurrent
        ? "width:8px;height:8px;border-radius:50%;background:" + dotColor + ";box-shadow:0 0 8px " + dotColor
        : "width:8px;height:8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.2);box-sizing:border-box";
    var textColor = isUpcoming ? "#8E8E93" : "#FFFFFF";
    var durationSec = item.duration || 60;
    var durationLabel = durationSec >= 60 ? Math.round(durationSec / 60) + "m" : durationSec + "s";

    h += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;' + (i < plan.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,.04)' : '') + '">';
    h += '<div style="' + dotStyle + '"></div>';
    h += '<div style="flex:1;font-size:14px;color:' + textColor + ';font-weight:' + (isCurrent ? '700' : '400') + '">' + escHTML(item.label) + '</div>';
    h += '<div style="font-size:12px;color:#8E8E93">' + durationLabel + '</div>';
    h += '</div>';
  }

  // Primary CTA
  var allDone = currentStep >= plan.length;
  if (allDone) {
    h += '<div style="margin-top:16px;padding:14px;border-radius:14px;background:rgba(0,255,136,.1);text-align:center;font-size:14px;font-weight:700;color:#00FF88">Plan Complete</div>';
  } else {
    h += '<button class="btn" onclick="act(\'openDailyPlan\')" style="margin-top:16px;width:100%;height:52px;border-radius:14px;background:#FFFFFF;color:#000000;font-size:16px;font-weight:700;border:none;cursor:pointer">Start</button>';
  }

  h += '</div>';
  return h;
}
