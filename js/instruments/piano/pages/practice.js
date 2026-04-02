/* PianoSpark - Practice tab (home page) */

function practiceTab() {
  var html = '';

  // If-then intention reminder (stickiness #2)
  if (S.practiceIntention && !S.focusMode) {
    html += ifThenCard("When I " + S.practiceIntention + ", I will open PianoSpark.");
  }

  // Daily goal progress
  var goalMin = S.dailyGoal;
  var pracMin = Math.floor(S.dailyPracticed / 60);
  var goalPct = Math.min(100, (pracMin / goalMin) * 100);
  html += '<div class="card"><div class="daily-goal">';
  html += '<div class="goal-header"><span>Daily Goal: ' + pracMin + '/' + goalMin + ' min</span>';
  html += (goalPct >= 100 ? '<span class="goal-done">\u2705 Done!</span>' : '') + '</div>';
  html += '<div class="progress-bar"><div class="progress-fill" style="width:' + goalPct + '%"></div></div>';
  html += '</div>';

  // Practice Plan CTA
  html += '<div style="text-align:center;margin:8px 0">';
  html += '<button class="btn" onclick="act(\'openPlan\')" style="background:var(--accent);color:#fff;font-weight:700">Today\'s Practice Plan</button>';
  html += '</div></div>';

  // Quick start / Resume session card
  var plan = getCurrentSessionPlan();
  if (plan) {
    html += clickableDiv(
      "act('start_guided_session')",
      '<h3>Session ' + plan.num + ': ' + escHTML(plan.title) + '</h3>' +
      '<p>Level ' + plan.level + ' \u2022 ' + escHTML(CURRICULUM[plan.level - 1].title) + '</p>',
      "quick-start"
    );
  }

  html += '</div>'; // close card

  // 8 level tabs
  var viewLvlNum = S._viewLevel || S.level;
  html += '<div class="level-tabs">';
  for (var i = 0; i < CURRICULUM.length; i++) {
    var lvl = CURRICULUM[i];
    var isActive = viewLvlNum === lvl.num;
    var isLocked = lvl.num > S.level + 1; // can see current + next
    var color = levelColor(lvl.num);
    var cls = "level-tab" + (isActive ? " active" : "") + (isLocked ? " locked" : "");
    html += '<div class="' + cls + '" style="color:' + color + ';background:' + color + '15" onclick="' + (isLocked ? '' : "act('view_level'," + lvl.num + ")") + '">';
    html += lvl.icon + ' ' + lvl.num;
    html += '</div>';
  }
  html += '</div>';

  // Viewed level chords
  var viewedLvl = null;
  for (var j = 0; j < CURRICULUM.length; j++) {
    if (CURRICULUM[j].num === viewLvlNum) { viewedLvl = CURRICULUM[j]; break; }
  }
  if (!viewedLvl) viewedLvl = getCurrentLevel();
  html += '<div class="card">';
  html += '<h3 style="color:' + levelColor(viewedLvl.num) + '">' + viewedLvl.icon + ' Level ' + viewedLvl.num + ': ' + escHTML(viewedLvl.title) + '</h3>';
  html += '<p>' + escHTML(viewedLvl.desc) + '</p>';
  if (viewedLvl.tip) {
    html += '<div class="text-muted" style="margin-bottom:12px">\u{1F4A1} ' + escHTML(viewedLvl.tip) + '</div>';
  }

  // Chord cards for the viewed level (or all unlocked when viewing current level)
  var unlocked = (viewLvlNum === S.level) ? chordsUpToLevel(S.level) : chordsForLevel(viewLvlNum);
  html += '<div class="chord-grid">';
  unlocked.forEach(function(c) {
    var prog = S.chordProg[c.short] || 0;
    var tier = tierBadgeHTML(prog);
    var color = c.color || "#888";
    html += clickableDiv(
      "act('start_session','" + c.short + "')",
      '<div class="chord-card-inner">' +
        '<span class="chord-name" style="color:' + color + '">' + escHTML(c.short) + '</span>' +
        tier +
        '<div class="mini-progress"><div class="mini-fill" style="width:' + prog + '%;background:' + color + '"></div></div>' +
        '<span class="chord-pct">' + prog + '%</span>' +
      '</div>',
      "chord-card"
    );
  });
  html += '</div>';

  // Custom sets
  html += '<div class="custom-sets"><h4>Custom Practice Sets</h4>';
  if (S.customSets.length) {
    S.customSets.forEach(function(set, i) {
      html += '<div class="custom-set-row">';
      html += '<button class="btn btn-sm" onclick="act(\'drill_custom\',' + i + ')">' + escHTML(set.name) + ' (' + set.chords.length + ')</button>';
      html += '<button class="btn btn-sm btn-danger" onclick="act(\'del_custom\',' + i + ')">\u2715</button>';
      html += '</div>';
    });
  }
  html += '<button class="btn btn-sm" onclick="act(\'new_custom\')">+ New Set</button></div>';

  // Focus mode toggle
  html += '<div class="setting-row" style="margin-top:12px">';
  html += '<label>Focus Mode:</label>';
  html += '<button class="btn btn-sm ' + (S.focusMode ? 'btn-accent' : 'btn-secondary') + '" onclick="act(\'toggle_focus\')">' + (S.focusMode ? 'ON' : 'OFF') + '</button>';
  html += '</div>';

  // Badges
  if (!S.focusMode) {
    html += '<div class="badges-row">';
    BADGES.forEach(function(b) {
      var earned = S.earned.indexOf(b.id) >= 0;
      html += '<span class="badge ' + (earned ? 'earned' : 'locked') + '" title="' + escHTML(b.desc) + '">' + b.icon + '</span>';
    });
    html += '</div>';
  }

  html += '</div>'; // close card

  // Practice Plan + Stats section (brain systems)
  html += practicePlanSection();

  return html;
}

/* Practice Plan section – shows stats, today's plan, and progression overview */
function practicePlanSection(){
  var h = '';

  // Practice stats card
  if(typeof getPracticeStats === "function"){
    var stats = getPracticeStats();
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Practice Stats</b></div>';
    h += '<div>Streak: '+stats.streak+' days</div>';
    h += '<div>Today: '+stats.todayMinutes+' min</div>';
    h += '<div>Total: '+stats.totalMinutes+' min</div>';
    h += '<div>Sessions: '+stats.sessions+'</div>';
    h += '</div>';
  }

  // Today's brain-generated practice plan
  if(typeof generateDailyPracticePlan === "function"){
    if(!S.practicePlan) generateDailyPracticePlan();
    var plan = S.practicePlan;
    if(plan && plan.items && plan.items.length){
      h += '<div class="card" style="margin-top:12px">';
      h += '<div><b>Today\'s Practice Plan</b></div>';
      for(var i=0;i<plan.items.length;i++){
        var item = plan.items[i];
        var done = item.completed ? ' style="opacity:0.5;text-decoration:line-through"' : '';
        h += '<div class="row"' + done + '>';
        h += '<span>' + escHTML(item.type) + (item.target ? ' (' + escHTML(item.target) + ')' : '') + '</span>';
        if(!item.completed){
          h += '<button class="btn btn-sm" onclick="act(\'practiceStartItem\', \''+item.id+'\')">Start</button>';
        }else{
          h += '<span class="text-muted">Done</span>';
        }
        h += '</div>';
      }
      h += '</div>';
    }
  }

  // Progression mastery summary
  if(typeof getAverageMastery === "function"){
    h += '<div class="card" style="margin-top:12px">';
    h += '<div><b>Mastery</b></div>';
    h += '<div>Chords: '+Math.round(getAverageMastery("chords")*100)+'%</div>';
    h += '<div>Rhythm: '+Math.round(getAverageMastery("rhythm")*100)+'%</div>';
    h += '<div>Transitions: '+Math.round(getAverageMastery("transitions")*100)+'%</div>';
    h += '<div>Scales: '+Math.round(getAverageMastery("scales")*100)+'%</div>';
    h += '</div>';
  }

  return h;
}
