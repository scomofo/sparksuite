(function() {

  function progressDashboardRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      return SparkState.getRoot();
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
  }

  function progressDashboardRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = progressDashboardRoot();
    if (!root) return fallback;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function progressDashboardWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = progressDashboardRoot();
    if (!root) return value;
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    if (parts.length) cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return "never";
    var now = Date.now();
    var diff = now - timestamp;
    var days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 14) return days + " days ago";
    var weeks = Math.floor(days / 7);
    return weeks + " weeks ago";
  }

  function capitalizeSkill(skillId) {
    if (!skillId) return "";
    var parts = skillId.split("_");
    for (var i = 0; i < parts.length; i++) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }
    return parts.join(" ");
  }

  function getLevelColor(level) {
    if (level === "MASTERED") return "#FFE66D";
    if (level === "SOLID") return "#96CEB4";
    if (level === "COMFORTABLE") return "#4ECDC4";
    if (level === "LEARNING") return "#45B7D1";
    return "#666";
  }

  window.progressDashboardPage = function() {
    var pe = window.sparkCore && window.sparkCore.progressEngine;
    if (!pe) {
      return "<div class=\"text-center\"><p>Progress engine not available.</p>" +
        "<button class=\"btn\" onclick=\"act('goHome')\">Back</button></div>";
    }

    var skillGraph = pe.getSkillGraph();
    var decayed = pe.getDecayedSkills(0.03);

    var h = "";
    h += "<div style=\"max-width:480px;margin:0 auto;padding:16px\">";

    // Header
    h += "<div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:16px\">";
    h += "<button class=\"btn\" onclick=\"act('goHome')\" style=\"background:var(--card-bg);color:var(--text-dim)\">&larr; Back</button>";
    h += "<h2 style=\"font-size:22px;font-weight:900;color:var(--text-primary);margin:0\">Your Progress</h2>";
    h += "<div style=\"width:60px\"></div>";
    h += "</div>";

    // Stats Overview Card
    h += "<div class=\"card mb16\">";
    h += "<div style=\"display:flex;justify-content:space-around;text-align:center\">";

    var stats = [
      { icon: "&#9733;", value: progressDashboardRead("xp", 0) || 0, label: "XP" },
      { icon: "&#9650;", value: progressDashboardRead("level", 1) || 1, label: "Level" },
      { icon: "&#128293;", value: (progressDashboardRead("streak", 0) || 0) + " days", label: "Streak" },
      { icon: "&#9654;", value: progressDashboardRead("sessions", 0) || 0, label: "Sessions" }
    ];
    for (var si = 0; si < stats.length; si++) {
      var st = stats[si];
      h += "<div style=\"flex:1;padding:8px 4px\">";
      h += "<div style=\"font-size:20px;margin-bottom:4px\">" + st.icon + "</div>";
      h += "<div style=\"font-size:18px;font-weight:900;color:var(--text-primary)\">" + st.value + "</div>";
      h += "<div style=\"font-size:11px;color:var(--text-muted);font-weight:700\">" + st.label + "</div>";
      h += "</div>";
    }

    h += "</div>";
    h += "</div>";

    // Daily Goal Card
    var todaySec = progressDashboardRead("todayPracticeSeconds", 0) || 0;
    var goalMin = progressDashboardRead("dailyGoalMinutes", 15) || 15;
    var goalSec = goalMin * 60;
    var pct = Math.min(100, Math.round((todaySec / goalSec) * 100));
    var todayMin = Math.floor(todaySec / 60);
    var goalReached = todaySec >= goalSec;
    var barColor = goalReached ? "#4ECDC4" : "var(--accent)";

    h += "<div class=\"card mb16\">";
    h += "<div style=\"font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:8px\">Daily Goal</div>";
    h += "<div style=\"height:10px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:8px\">";
    h += "<div style=\"height:100%;width:" + pct + "%;border-radius:5px;background:" + barColor + ";transition:width .3s\"></div>";
    h += "</div>";
    h += "<div style=\"font-size:12px;color:" + (goalReached ? "#4ECDC4" : "var(--text-dim)") + ";font-weight:700\">";
    h += todayMin + " / " + goalMin + " min today";
    if (goalReached) {
      h += " &#10003; Goal reached!";
    }
    h += "</div>";
    h += "</div>";

    // Skills Mastery Section
    h += "<div class=\"card mb16\">";
    h += "<div style=\"font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:12px\">Skills Mastery</div>";

    var skillKeys = skillGraph ? Object.keys(skillGraph) : [];
    if (skillKeys.length === 0) {
      h += "<div style=\"font-size:12px;color:var(--text-muted);text-align:center;padding:16px 0\">";
      h += "Complete some sessions to start tracking skills";
      h += "</div>";
    } else {
      for (var ki = 0; ki < skillKeys.length; ki++) {
        var sid = skillKeys[ki];
        var sk = skillGraph[sid];
        var mastery = sk.mastery || 0;
        var level = pe.getMasteryLevel(mastery);
        var levelCol = getLevelColor(level);
        var barW = Math.round(mastery * 100);
        var conf = sk.confidence || 0;
        var attempts = sk.attempts || 0;

        h += "<div style=\"margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.06)\">";

        // Skill name + level badge
        h += "<div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:6px\">";
        h += "<span style=\"font-size:13px;font-weight:800;color:var(--text-primary)\">" + capitalizeSkill(sid) + "</span>";
        h += "<span style=\"font-size:10px;font-weight:700;color:" + levelCol + ";background:rgba(255,255,255,.06);padding:2px 8px;border-radius:10px\">" + level + "</span>";
        h += "</div>";

        // Mastery bar
        h += "<div style=\"height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:6px\">";
        h += "<div style=\"height:100%;width:" + barW + "%;border-radius:4px;background:" + levelCol + ";transition:width .3s\"></div>";
        h += "</div>";

        // Details row
        h += "<div style=\"display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--text-muted)\">";
        h += "<span>" + attempts + " sessions</span>";

        // Confidence warning
        if (conf < 0.5) {
          h += "<span style=\"color:#FF8A5C\" title=\"Low confidence\">&#9888; Low confidence</span>";
        }

        h += "<span>" + formatRelativeTime(sk.lastPracticed) + "</span>";
        h += "</div>";

        h += "</div>";
      }
    }
    h += "</div>";

    // Skills Needing Review Section
    if (decayed && decayed.length > 0) {
      h += "<div class=\"card mb16\" style=\"border:1px solid rgba(255,138,92,.22)\">";
      h += "<div style=\"font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:10px\">Needs Review</div>";

      for (var di = 0; di < decayed.length; di++) {
        var ds = decayed[di];
        var decayPct = Math.round((ds.decay || 0) * 100);
        h += "<div style=\"display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)\">";
        h += "<div>";
        h += "<div style=\"font-size:12px;font-weight:700;color:var(--text-primary)\">" + capitalizeSkill(ds.skillId) + "</div>";
        h += "<div style=\"font-size:10px;color:#FF8A5C\">Decayed " + decayPct + "%</div>";
        h += "</div>";
        h += "<button class=\"btn\" style=\"font-size:11px;padding:4px 12px\" onclick=\"act('practiceSkillNow',&quot;" + ds.skillId + "&quot;)\">Practice Now</button>";
        h += "</div>";
      }

      h += "</div>";
    }

    // Weak Areas Card
    var weakSkills = [];
    for (var wi = 0; wi < skillKeys.length; wi++) {
      var wid = skillKeys[wi];
      var wsk = skillGraph[wid];
      if ((wsk.mastery || 0) < 0.5) {
        weakSkills.push(wid);
      }
    }

    if (weakSkills.length > 0) {
      h += "<div class=\"card mb12\" style=\"background:linear-gradient(180deg,rgba(255,138,92,.1),rgba(255,138,92,.04));border:1px solid rgba(255,138,92,.22)\">";
      h += "<div style=\"font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:8px\">Focus Areas</div>";

      for (var fi = 0; fi < weakSkills.length; fi++) {
        var fid = weakSkills[fi];
        var fsk = skillGraph[fid];
        var fPct = Math.round((fsk.mastery || 0) * 100);
        h += "<div style=\"display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px\">";
        h += "<span style=\"color:#FF8A5C\">&#9679;</span>";
        h += "<span style=\"color:var(--text-dim);font-weight:700\">" + capitalizeSkill(fid) + "</span>";
        h += "<span style=\"color:var(--text-muted);margin-left:auto\">" + fPct + "%</span>";
        h += "</div>";
      }

      h += "</div>";
    }

    h += "</div>";
    return h;
  };
})();
