(function() {

  function normalizeSkillDashboardTextToken(value) {
    var text;
    var lower;
    if (typeof value !== "string") return "";
    text = value.trim();
    if (!text) return "";
    lower = text.toLowerCase();
    if (lower === "undefined" || lower === "null" || lower === "nan") return "";
    return text;
  }

  function firstSkillDashboardTextToken() {
    var i;
    var token;
    for (i = 0; i < arguments.length; i++) {
      token = normalizeSkillDashboardTextToken(arguments[i]);
      if (token) return token;
    }
    return "";
  }

  function getSkillDashboardInstrument() {
    var inst;
    var candidate;
    var all;
    var i;
    var entry;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return null;
    }
    inst = SparkInstruments.getActive();
    if (!inst) return null;
    if (typeof inst.getRhythmAdapter === "function" || typeof inst.getCapabilities === "function" || typeof inst.getData === "function") {
      return inst;
    }
    candidate = inst.id || inst.appId || inst.instrumentId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate || entry.instrumentId === candidate) return entry;
    }
    return inst;
  }

  function getSkillDashboardLaneLabels(inst) {
    var adapter;
    var capabilities;
    var tuning;
    var labels;
    var count;
    var i;
    if (inst && typeof inst.getRhythmAdapter === "function") {
      adapter = inst.getRhythmAdapter();
      if (adapter && typeof adapter.getLaneLabels === "function") {
        labels = adapter.getLaneLabels();
        if (Array.isArray(labels) && labels.length) return labels.slice();
      }
    }
    if (inst && typeof inst.getCapabilities === "function") {
      capabilities = inst.getCapabilities() || {};
      if (Array.isArray(capabilities.laneLabels) && capabilities.laneLabels.length) return capabilities.laneLabels.slice();
      if (typeof capabilities.laneCount === "number" && capabilities.laneCount > 0) count = Math.floor(capabilities.laneCount);
      if (!count && typeof capabilities.stringCount === "number" && capabilities.stringCount > 0) count = Math.floor(capabilities.stringCount);
      if (!count && typeof capabilities.keyCount === "number" && capabilities.keyCount > 0) count = Math.min(12, Math.floor(capabilities.keyCount));
    }
    if (inst && typeof inst.getTuning === "function") {
      tuning = inst.getTuning();
      if (Array.isArray(tuning) && tuning.length) {
        labels = [];
        for (i = 0; i < tuning.length; i++) {
          labels.push(firstSkillDashboardTextToken(tuning[i] && tuning[i].note, tuning[i], "Lane " + (i + 1)));
        }
        return labels;
      }
      if (tuning && Array.isArray(tuning.strings) && tuning.strings.length) {
        return tuning.strings.map(function(note) { return firstSkillDashboardTextToken(note, "Lane"); });
      }
    }
    labels = ["G", "R", "Y", "B", "O"];
    if (count && count !== labels.length) {
      labels = [];
      for (i = 0; i < count; i++) labels.push("Lane " + (i + 1));
    }
    return labels;
  }

  function getSkillDashboardLaneColor(index) {
    var laneColors = ["#4ade80", "#ef4444", "#facc15", "#3b82f6", "#f97316", "#a855f7", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#06b6d4"];
    return laneColors[index % laneColors.length];
  }

  function skillDashboardPage() {
    var sg = S.skillGraph;
    if (!sg) return '<div class="text-center"><p>No skill data yet. Play some sessions first!</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

    var h = '<div style="max-width:480px;margin:0 auto;padding:16px">';
    h += '<div class="split-row" style="margin-bottom:16px">';
    h += '<button class="btn" onclick="act(\'back\')" style="background:var(--input-bg);color:var(--text-secondary)">&larr; Back</button>';
    h += '<h2 style="font-size:22px;font-weight:900;color:var(--text-primary);margin:0">Skill Dashboard</h2>';
    h += '<div style="width:60px"></div>';
    h += '</div>';

    var skills = [
      { key: "timing", label: "Timing", color: "#4ECDC4" },
      { key: "rhythm", label: "Rhythm", color: "#FFE66D" },
      { key: "chordAccuracy", label: "Chords", color: "#FF8A5C" }
    ];

    h += '<div class="card mb16">';
    h += '<div class="card-section-heading" style="margin-bottom:12px">Current Levels</div>';
    for (var i = 0; i < skills.length; i++) {
      var sk = skills[i];
      var val = Math.round((sg[sk.key] || 0) * 100);
      var mastery = val >= 80 ? "Gold" : val >= 60 ? "Silver" : val >= 40 ? "Bronze" : "\u2014";
      var masteryColor = val >= 80 ? "#FFE66D" : val >= 60 ? "#C0C0C0" : val >= 40 ? "#CD7F32" : "var(--text-muted)";
      h += '<div style="margin-bottom:10px">';
      h += '<div class="split-row" style="margin-bottom:4px"><span class="metric-label">' + escHTML(sk.label) + '</span><span class="metric-value" style="color:' + masteryColor + '">' + mastery + ' \u00b7 ' + val + '%</span></div>';
      h += '<div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><div style="height:100%;width:' + val + '%;border-radius:4px;background:' + sk.color + ';transition:width .3s"></div></div>';
      h += '</div>';
    }
    h += '</div>';

    var laneLabels = getSkillDashboardLaneLabels(getSkillDashboardInstrument());
    var laneAccuracy = Array.isArray(sg.laneAccuracy) ? sg.laneAccuracy : [];

    h += '<div class="card mb16">';
    h += '<div class="card-section-heading" style="margin-bottom:12px">Lane Accuracy</div>';
    h += '<div style="display:flex;gap:8px;justify-content:center">';
    for (var li = 0; li < laneLabels.length; li++) {
      var lv = Math.round((laneAccuracy[li] || 0) * 100);
      var laneColor = getSkillDashboardLaneColor(li);
      h += '<div style="text-align:center;flex:1"><div style="height:60px;display:flex;align-items:end;justify-content:center"><div style="width:100%;border-radius:4px 4px 0 0;background:' + laneColor + ';height:' + Math.max(4, lv * 0.6) + 'px;opacity:.85"></div></div>';
      h += '<div class="metric-label" style="color:' + laneColor + ';margin-top:4px">' + escHTML(laneLabels[li]) + '</div>';
      h += '<div class="metric-value" style="font-size:10px;color:var(--text-muted)">' + lv + '%</div></div>';
    }
    h += '</div></div>';

    if (sg.history && sg.history.length >= 2) {
      h += '<div class="card mb16">';
      h += '<div class="card-section-heading" style="margin-bottom:12px">Trends (Last ' + sg.history.length + ' Sessions)</div>';
      for (var si = 0; si < skills.length; si++) {
        var sk2 = skills[si];
        h += '<div style="margin-bottom:12px"><div class="card-micro-heading" style="color:var(--text-secondary);margin-bottom:4px">' + escHTML(sk2.label) + '</div>';
        h += '<canvas id="skill-chart-' + sk2.key + '" width="400" height="80" style="width:100%;height:80px;border-radius:8px;background:rgba(255,255,255,.03)"></canvas></div>';
      }
      h += '</div>';
    }

    if (typeof SparkSkillTracker !== "undefined") {
      var weakest = SparkSkillTracker.getWeakestSkill(sg);
      var weakLane = SparkSkillTracker.getWeakestLane(sg);
      var weakLaneIndex = typeof weakLane === "number" && isFinite(weakLane) && weakLane >= 0 && weakLane < laneLabels.length ? Math.floor(weakLane) : 0;
      h += '<div class="card mb16" style="background:linear-gradient(180deg,rgba(255,138,92,.1),rgba(255,138,92,.04));border:1px solid rgba(255,138,92,.22)">';
      h += '<div class="card-section-heading" style="margin-bottom:6px">Focus Area</div>';
      var focusLabel = weakest === "timing" ? "Timing" : weakest === "rhythm" ? "Rhythm" : "Chord Accuracy";
      h += '<div class="card-micro-heading" style="color:var(--text-secondary)">Weakest skill: <strong style="color:var(--text-primary)">' + escHTML(focusLabel) + '</strong> (' + Math.round((sg[weakest] || 0) * 100) + '%)</div>';
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Weakest lane: <strong style="color:var(--text-primary)">' + escHTML(laneLabels[weakLaneIndex] || ("Lane " + (weakLaneIndex + 1))) + '</strong> (' + Math.round((laneAccuracy[weakLaneIndex] || 0) * 100) + '%)</div>';
      h += '</div>';
    }

    if (typeof SparkMasteryEngine !== "undefined" && sg) {
      var unlocks = SparkMasteryEngine.getUnlocks(sg);
      if (unlocks.length > 0) {
        h += '<div class="card mb16">';
        h += '<div class="card-section-heading" style="margin-bottom:8px">Unlocked</div>';
        for (var ui = 0; ui < unlocks.length; ui++) {
          var unlockLabel = firstSkillDashboardTextToken(unlocks[ui].label, unlocks[ui].id, "Unlock");
          h += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px"><span style="color:#4ECDC4">&#10003;</span><span style="color:var(--text-secondary)">' + escHTML(unlockLabel) + '</span></div>';
        }
        h += '</div>';
      }
    }

    h += '</div>';
    return h;
  }

  function drawSkillCharts() {
    var sg = S.skillGraph;
    if (!sg || !sg.history || sg.history.length < 2) return;

    var skills = [
      { key: "timing", color: "#4ECDC4" },
      { key: "rhythm", color: "#FFE66D" },
      { key: "chordAccuracy", color: "#FF8A5C" }
    ];

    for (var i = 0; i < skills.length; i++) {
      var canvas = document.getElementById("skill-chart-" + skills[i].key);
      if (!canvas) continue;
      var ctx = canvas.getContext("2d");
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      var data = [];
      for (var j = 0; j < sg.history.length; j++) {
        data.push(sg.history[j].skills[skills[i].key] || 0);
      }

      ctx.strokeStyle = skills[i].color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (var k = 0; k < data.length; k++) {
        var x = (k / (data.length - 1)) * (w - 20) + 10;
        var y = h - 10 - (data[k] * (h - 20));
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = skills[i].color;
      for (var d = 0; d < data.length; d++) {
        var dx = (d / (data.length - 1)) * (w - 20) + 10;
        var dy = h - 10 - (data[d] * (h - 20));
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  window.skillDashboardPage = skillDashboardPage;
  window.drawSkillCharts = drawSkillCharts;
})();
