(function() {
  function getUkuleleLevelColors() {
    return {
      1: "#22c55e",
      2: "#3b82f6",
      3: "#f97316",
      4: "#8b5cf6"
    };
  }

  function getUkuleleLevelNames() {
    return {
      1: "First Strum",
      2: "Starter Chords",
      3: "Smooth Changes",
      4: "Pattern Flow"
    };
  }

  function getUkuleleLessonSkill(lessonId) {
    var lessons = window.SparkUkuleleLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) return lessons[i].skill;
    }
    return lessons.length ? lessons[0].skill : "down_strum";
  }

  function getUkuleleNextLesson() {
    var lessons = window.SparkUkuleleLessons || [];
    if (!lessons.length) return null;
    var completed = Array.isArray(S.completedLessons) ? S.completedLessons.slice() : [];
    if (S.mastery && S.mastery.lessons) {
      for (var lessonId in S.mastery.lessons) {
        if (S.mastery.lessons[lessonId]) completed.push(lessonId);
      }
    }
    if (typeof getNextLessonFromCurriculum === "function") {
      var nextLessonId = getNextLessonFromCurriculum(lessons[0].id, completed);
      if (nextLessonId) return nextLessonId;
    }
    for (var i = 0; i < lessons.length; i++) {
      if (completed.indexOf(lessons[i].id) === -1) return lessons[i].id;
    }
    return lessons[lessons.length - 1].id;
  }

  function getLessonById(lessonId) {
    var lessons = window.SparkUkuleleLessons || [];
    for (var i = 0; i < lessons.length; i++) {
      if (lessons[i].id === lessonId) return lessons[i];
    }
    return lessons[0] || null;
  }

  function buildUkuleleFingerDots(shape) {
    var colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFE66D"];
    var dots = [];
    var fingerNum = 1;
    for (var i = 0; i < shape.length; i++) {
      if (shape[i] <= 0) continue;
      dots.push([i, shape[i], fingerNum, colors[(fingerNum - 1) % colors.length]]);
      fingerNum++;
    }
    return dots;
  }

  function renderUkuleleChordSVG(chordObj, size, label) {
    var chord = chordObj || {};
    var shape = chord.frets || [0, 0, 0, 0];
    var stringNames = chord.stringNames || ["G", "C", "E", "A"];
    var dots = chord.fingers || buildUkuleleFingerDots(shape);
    var sz = size || 170;
    var w = sz;
    var h = Math.round(sz * 1.2);
    var padL = 28;
    var padR = 18;
    var padT = 24;
    var padB = 18;
    var fretCount = 4;
    var stringCount = 4;
    var fretH = (h - padT - padB) / fretCount;
    var stringW = (w - padL - padR) / (stringCount - 1);
    var title = label || chord.name || "Ukulele chord";
    var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escHTML(title) + '">';
    svg += '<rect x="' + padL + '" y="' + padT + '" width="' + (w - padL - padR) + '" height="4" rx="2" fill="var(--svg-nut)"/>';
    for (var f = 1; f <= fretCount; f++) {
      svg += '<line x1="' + padL + '" y1="' + (padT + fretH * f) + '" x2="' + (w - padR) + '" y2="' + (padT + fretH * f) + '" stroke="var(--svg-fret)" stroke-width="1.5"/>';
    }
    for (var s = 0; s < stringCount; s++) {
      svg += '<line x1="' + (padL + stringW * s) + '" y1="' + padT + '" x2="' + (padL + stringW * s) + '" y2="' + (h - padB) + '" stroke="var(--svg-string)" stroke-width="1.6"/>';
      svg += '<text x="' + (padL + stringW * s) + '" y="' + (h - 4) + '" text-anchor="middle" font-size="10" fill="var(--text-muted)">' + escHTML(stringNames[s]) + '</text>';
      if (shape[s] === 0) {
        svg += '<circle cx="' + (padL + stringW * s) + '" cy="' + (padT - 10) + '" r="5" fill="none" stroke="#4ECDC4" stroke-width="2"/>';
      }
    }
    for (var i = 0; i < dots.length; i++) {
      var dot = dots[i];
      var cx = padL + stringW * dot[0];
      var cy = padT + fretH * (dot[1] - 0.5);
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="' + dot[3] + '" stroke="#fff" stroke-width="2"/>';
      svg += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">' + dot[2] + '</text>';
    }
    return svg + '</svg>';
  }

  function renderUkulelePracticeTab() {
    var lessonId = getUkuleleNextLesson();
    var lesson = getLessonById(lessonId);
    var skill = getUkuleleLessonSkill(lessonId);
    var exercises = (window.SparkUkuleleModule && window.SparkUkuleleModule.getExercises(skill)) || [];
    var levelChords = window.SparkUkuleleLevelChords || {};
    var h = '<div class="card mb12">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">';
    h += '<div><div style="font-size:18px;font-weight:900;color:var(--text-primary)">Ukulele Practice</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">Island strums, clean chord changes, and 4-string rhythm flow.</div></div>';
    h += '<button class="btn" onclick="act(\'openPlan\')" style="background:var(--accent);color:#fff">Open Plan</button></div></div>';

    if (lesson) {
      h += '<div class="card mb12">';
      h += '<div style="font-size:13px;font-weight:800;color:var(--text-muted)">Next Lesson</div>';
      h += '<div style="font-size:18px;font-weight:900;color:var(--text-primary)">' + escHTML(lesson.title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-dim);margin-top:4px">' + escHTML(lesson.desc || "") + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px">Target mastery: ' + Math.round((lesson.masteryRequired || 0) * 100) + '%</div>';
      h += '</div>';
    }

    if (exercises.length) {
      h += '<div class="card mb12"><div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Exercise Focus</div>';
      for (var i = 0; i < exercises.length; i++) {
        h += '<div style="padding:6px 0;border-top:' + (i ? '1px solid var(--border)' : '0') + '">';
        h += '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">' + escHTML(exercises[i].id || exercises[i].type || "exercise") + '</div>';
        h += '<div style="font-size:11px;color:var(--text-muted)">' + escHTML(exercises[i].pattern || exercises[i].chord || ((exercises[i].from || "") + " -> " + (exercises[i].to || ""))) + '</div>';
        h += '</div>';
      }
      h += '</div>';
    }

    h += '<div class="card mb12"><div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Starter Chords</div>';
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
    for (var level in levelChords) {
      if (!Object.prototype.hasOwnProperty.call(levelChords, level)) continue;
      for (var j = 0; j < levelChords[level].length; j++) {
        h += '<div style="padding:8px;border:1px solid var(--border);border-radius:14px;background:var(--card-bg);min-width:130px;text-align:center">';
        h += '<div style="font-size:12px;font-weight:800;color:' + getUkuleleLevelColors()[level] + ';margin-bottom:4px">Level ' + level + '</div>';
        h += renderUkuleleChordSVG(levelChords[level][j], 120, levelChords[level][j].name);
        h += '<div style="font-size:13px;font-weight:800;color:var(--text-primary)">' + escHTML(levelChords[level][j].name) + '</div>';
        h += '</div>';
      }
    }
    h += '</div></div>';
    return h;
  }

  function renderUkuleleSongsTab() {
    var songs = (window.SparkUkuleleModule && window.SparkUkuleleModule.getSongs()) || [];
    var charts = typeof getPerformanceChartLibrary === "function"
      ? getPerformanceChartLibrary({ instrument: "ukulele" })
      : [];
    var h = '<div class="card mb12"><div style="font-size:18px;font-weight:900;color:var(--text-primary)">Songs & Performance</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Play chord-driven ukulele charts with a 4-string lane layout tuned for groove and switching.</div></div>';
    if (charts.length) {
      h += '<div class="card mb12"><div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Performance Charts</div>';
      for (var c = 0; c < charts.length; c++) {
        h += '<div style="padding:8px 0;border-top:' + (c ? '1px solid var(--border)' : '0') + ';display:flex;justify-content:space-between;align-items:center;gap:10px">';
        h += '<div><div style="font-size:13px;font-weight:800;color:var(--text-primary)">' + escHTML(charts[c].title) + '</div>';
        h += '<div style="font-size:11px;color:var(--text-muted)">' + escHTML(charts[c].artist || "") + ' | ' + escHTML(String(charts[c].bpm || "--")) + ' BPM</div></div>';
        h += '<button class="btn btn-sm" onclick="act(\'openPerform\',\'' + charts[c].id + '\')" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff">Perform</button>';
        h += '</div>';
      }
      h += '</div>';
    }
    for (var i = 0; i < songs.length; i++) {
      h += '<div class="card mb12"><div style="font-size:15px;font-weight:800;color:var(--text-primary)">' + escHTML(songs[i].title) + '</div>';
      h += '<div style="font-size:12px;color:var(--text-muted)">' + escHTML(songs[i].artist || "") + ' | ' + escHTML((songs[i].progression || []).join(" - ")) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-dim);margin-top:4px">' + escHTML(String(songs[i].bpm || "--")) + ' BPM | ' + escHTML((songs[i].focus || "song flow")) + '</div></div>';
    }
    return h;
  }

  function renderUkuleleStatsTab() {
    var lessonCount = Array.isArray(S.completedLessons) ? S.completedLessons.filter(function(id) {
      return String(id || "").indexOf("uke_") === 0;
    }).length : 0;
    var h = '<div class="card mb12"><div style="font-size:18px;font-weight:900;color:var(--text-primary)">Ukulele Progress</div>';
    h += '<div style="font-size:13px;color:var(--text-muted);margin-top:8px">Lessons completed: ' + lessonCount + '</div>';
    h += '<div style="font-size:13px;color:var(--text-muted)">Rhythm skills tracked: ' + Object.keys((S.mastery && S.mastery.rhythm) || {}).length + '</div>';
    h += '</div>';
    return h;
  }

  function renderUkuleleGuideTab() {
    var tuning = window.SparkUkuleleTuning || { labels: ["G", "C", "E", "A"], type: "reentrant" };
    var skills = window.SparkUkuleleSkillTree || [];
    var h = '<div class="card mb12"><div style="font-size:18px;font-weight:900;color:var(--text-primary)">Ukulele Guide</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Tuning: ' + escHTML(tuning.labels.join(" - ")) + ' | ' + escHTML(tuning.type) + '</div></div>';
    h += '<div class="card mb12"><div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px">Skill Tree</div>';
    for (var i = 0; i < skills.length; i++) {
      h += '<div style="padding:6px 0;border-top:' + (i ? '1px solid var(--border)' : '0') + '">';
      h += '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">' + escHTML(skills[i].label || skills[i].id) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">' + escHTML(skills[i].category) + '</div>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  SparkInstruments.register({
    id: "ukespark",
    instrument: "ukulele",
    name: "Ukulele",
    icon: "&#127926;",
    iconImage: "resources/ukulele.png",
    tagline: "Island strums and 4-string flow",
    skin: { laneCount: 4, labels: ["G", "C", "E", "A"] },
    available: true,

    getData: function() {
      return {
        CHORDS: window.SparkUkuleleLevelChords || {},
        ALL_CHORDS: window.SparkUkuleleAllChords || [],
        SESSIONS: window.SparkUkuleleLessons || [],
        SONGS: window.SparkUkuleleModule ? window.SparkUkuleleModule.getSongs() : [],
        LC: getUkuleleLevelColors(),
        LN: getUkuleleLevelNames(),
        CHORD_NOTES: window.SparkUkuleleChordNotes || {},
        STRINGS: window.SparkUkuleleTuning ? window.SparkUkuleleTuning.strings : [],
        STRUM_PATTERNS: [{ name: "Island Groove", level: 1, bpm: 76, pattern: ["D", "D", "U", "U", "D", "U"] }],
        FINGER_EXERCISES: window.SparkUkuleleExercises ? window.SparkUkuleleExercises.fingerpicking || [] : [],
        CURRICULUM: window.SparkUkuleleLessons || [],
        SKILL_TREE: window.SparkUkuleleSkillTree || []
      };
    },

    ui: {
      chord: function(chordObj, size, label) {
        return renderUkuleleChordSVG(chordObj, size, label);
      },
      header: function() {
        return typeof headerHTML === "function" ? headerHTML() : "";
      },
      tabNav: function() {
        return typeof tabNavHTML === "function" ? tabNavHTML() : "";
      },
      ring: function(pct, size, color) {
        return typeof ringHTML === "function" ? ringHTML(pct, size, 5, color) : "";
      }
    },

    tabRenderers: {
      practice: renderUkulelePracticeTab,
      songs: renderUkuleleSongsTab,
      stats: renderUkuleleStatsTab,
      guide: renderUkuleleGuideTab
    },

    pages: {},

    tabs: [
      { id: "practice", label: "Practice", icon: "&#127925;" },
      { id: "songs", label: "Songs", icon: "&#127926;" },
      { id: "stats", label: "Stats", icon: "&#128202;" },
      { id: "guide", label: "Guide", icon: "&#128214;" }
    ],

    stemMutePreset: {
      guitar: true, vocals: true, drums: true,
      bass: true, piano: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "ukespark", "ukulele");
        SparkStorage.save(profile);
      }
    },

    getSkillTree: function() {
      var skills = window.SparkUkuleleSkillTree || [];
      var grouped = {};
      for (var i = 0; i < skills.length; i++) {
        if (!grouped[skills[i].category]) grouped[skills[i].category] = [];
        grouped[skills[i].category].push({
          id: skills[i].id,
          label: skills[i].label,
          status: "available",
          progress: 0,
          meta: { category: skills[i].category }
        });
      }
      var branches = [];
      for (var category in grouped) {
        if (!Object.prototype.hasOwnProperty.call(grouped, category)) continue;
        branches.push({
          id: category,
          label: category.charAt(0).toUpperCase() + category.slice(1),
          nodes: grouped[category]
        });
      }
      return { branches: branches };
    },

    getCurriculumMap: function() {
      return window.SparkUkuleleLessons || [];
    },

    getExercises: function() {
      var lessons = window.SparkUkuleleLessons || [];
      if (!lessons.length) return [];
      var lessonId = getUkuleleNextLesson();
      return window.SparkUkuleleModule ? window.SparkUkuleleModule.getExercises(getUkuleleLessonSkill(lessonId)) : [];
    },

    getSongs: function() {
      return window.SparkUkuleleModule ? window.SparkUkuleleModule.getSongs() : [];
    },

    getDifficultyRules: function() {
      return {
        targetType: "skill",
        difficultyAction: "keep",
        currentValue: 1,
        nextValue: 1,
        reason: "Ukulele module uses lesson mastery thresholds."
      };
    },

    analyzePerformance: function(sessionData) {
      if (typeof finalizePerformanceResults === "function" && sessionData.chart && sessionData.phraseStats) {
        return finalizePerformanceResults(sessionData.chart, sessionData.phraseStats);
      }
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill) {
      return window.SparkUkuleleModule ? window.SparkUkuleleModule.getExercises(skill) : [];
    }
  });
})();

