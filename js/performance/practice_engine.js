(function(){

  function practiceEngineRoot() {
    if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") {
      var sparkRoot = SparkState.getRoot();
      if (sparkRoot) return sparkRoot;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function practiceEngineRead(path, fallback) {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(path, fallback);
    }
    var root = practiceEngineRoot();
    if (!root) return fallback;
    return Object.prototype.hasOwnProperty.call(root, path) ? root[path] : fallback;
  }

  function practiceEngineWrite(path, value) {
    if (typeof SparkState !== "undefined" && typeof SparkState.write === "function") {
      return SparkState.write(path, value);
    }
    var root = practiceEngineRoot();
    if (root) root[path] = value;
    return value;
  }

  function getPracticePlanState() {
    return {
      practicePlan: practiceEngineRead("practicePlan", null),
      practicePlanDate: practiceEngineRead("practicePlanDate", null),
      practicePlanComplete: !!practiceEngineRead("practicePlanComplete", false),
      practicePlanHistory: Array.isArray(practiceEngineRead("practicePlanHistory", [])) ? practiceEngineRead("practicePlanHistory", []) : [],
      xp: practiceEngineRead("xp", 0)
    };
  }

  function getPracticeAnalyticsSnapshot() {
    if (window.sparkCore && typeof window.sparkCore.getLegacyPracticeAnalyticsSnapshot === "function") {
      return window.sparkCore.getLegacyPracticeAnalyticsSnapshot() || {};
    }
    return {
      transitionStats: practiceEngineRead("transitionStats", {}) || {},
      chordProgress: practiceEngineRead("chordProgress", {}) || {},
      performanceStats: practiceEngineRead("performanceStats", {}) || {}
    };
  }

  function getWeakTransitions() {
    var weak = [];
    var analytics = getPracticeAnalyticsSnapshot();
    var transitionStats = analytics.transitionStats || {};
    for (var key in transitionStats) {
      var st = transitionStats[key];
      if (typeof st === "object" && st.attempts > 0 && st.success / st.attempts < 0.7) {
        var parts = key.split("->");
        if (parts.length !== 2) parts = key.split("→");
        if (parts.length === 2) weak.push({ from: parts[0].trim(), to: parts[1].trim(), rate: st.success / st.attempts });
      }
    }
    weak.sort(function(a, b) { return a.rate - b.rate; });
    return weak.slice(0, 3);
  }

  function getWeakChords() {
    var weak = [];
    var analytics = getPracticeAnalyticsSnapshot();
    var chordProgress = analytics.chordProgress || {};
    for (var chord in chordProgress) {
      var pct = chordProgress[chord] || 0;
      if (pct < 70) weak.push({ chord: chord, mastery: pct });
    }
    weak.sort(function(a, b) { return a.mastery - b.mastery; });
    return weak.slice(0, 3);
  }

  function getWeakPerformanceSongs() {
    var weak = [];
    var analytics = getPracticeAnalyticsSnapshot();
    var performanceStats = analytics.performanceStats || {};
    for (var key in performanceStats) {
      var st = performanceStats[key];
      if (st && st.runs > 0 && st.bestAccuracy < 80) {
        weak.push({ key: key, songId: st.songId, accuracy: st.bestAccuracy, arrangement: st.arrangement, difficulty: st.difficulty });
      }
    }
    weak.sort(function(a, b) { return a.accuracy - b.accuracy; });
    return weak.slice(0, 3);
  }

  function generatePracticePlan() {
    if (typeof ensurePracticePlan === "function") {
      return ensurePracticePlan();
    }
    if (window.sparkCore && typeof window.sparkCore.startSession === "function") {
      var corePlan = window.sparkCore.startSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE
      });
      return corePlan ? corePlan.toLegacyPracticePlan() : null;
    }

    var today = new Date().toISOString().split("T")[0];
    var practiceState = getPracticePlanState();
    if (practiceState.practicePlanDate === today && practiceState.practicePlan) return practiceState.practicePlan;

    var items = [];
    var itemId = 1;

    items.push({
      id: "warmup_" + itemId++,
      type: "warmup",
      label: "Spider Exercise",
      desc: "2 minutes of finger warm-up",
      durationSec: 120,
      completed: false
    });

    var weakTrans = getWeakTransitions();
    for (var t = 0; t < weakTrans.length; t++) {
      items.push({
        id: "transition_" + itemId++,
        type: "transition",
        label: weakTrans[t].from + " -> " + weakTrans[t].to,
        desc: "Practice this transition (" + Math.round(weakTrans[t].rate * 100) + "% success)",
        from: weakTrans[t].from,
        to: weakTrans[t].to,
        durationSec: 180,
        completed: false
      });
    }

    var weakChords = getWeakChords();
    for (var c = 0; c < weakChords.length; c++) {
      items.push({
        id: "chord_" + itemId++,
        type: "chord_practice",
        label: "Practice " + weakChords[c].chord,
        desc: weakChords[c].mastery + "% mastery - needs work",
        chord: weakChords[c].chord,
        durationSec: 120,
        completed: false
      });
    }

    var weakSongs = getWeakPerformanceSongs();
    for (var s = 0; s < Math.min(2, weakSongs.length); s++) {
      items.push({
        id: "song_" + itemId++,
        type: "performance_song",
        label: "Perform: " + weakSongs[s].songId,
        desc: weakSongs[s].accuracy + "% accuracy - aim for 80%+",
        songId: weakSongs[s].songId,
        arrangementType: weakSongs[s].arrangement || "chords",
        difficultyId: weakSongs[s].difficulty || "normal",
        completed: false
      });
    }

    if (items.length <= 1) {
      items.push({
        id: "explore_" + itemId++,
        type: "explore",
        label: "Try a new song in Performance Mode",
        desc: "Expand your repertoire",
        completed: false
      });
    }

    var focus = "General Practice";
    if (weakTrans.length > 0) focus = "Smooth Chord Transitions";
    else if (weakChords.length > 0) focus = "Chord Mastery";
    else if (weakSongs.length > 0) focus = "Song Accuracy";

    var plan = {
      generatedDate: today,
      focus: focus,
      items: items,
      totalItems: items.length,
      completedItems: 0
    };

    practiceEngineWrite("practicePlan", plan);
    practiceEngineWrite("practicePlanDate", today);
    practiceEngineWrite("practicePlanComplete", false);
    return plan;
  }

  function markPracticePlanItem(itemId) {
    if (window.sparkCore && typeof window.sparkCore.completeSession === "function") {
      return window.sparkCore.completeSession({
        flow: SparkSessionTypes.FLOW_DAILY_PRACTICE,
        itemId: itemId
      });
    }

    var practiceState = getPracticePlanState();
    var practicePlan = practiceState.practicePlan;
    var practicePlanHistory = practiceState.practicePlanHistory;
    if (!practicePlan || !practicePlan.items) return;
    for (var i = 0; i < practicePlan.items.length; i++) {
      if (practicePlan.items[i].id === itemId) {
        practicePlan.items[i].completed = true;
        break;
      }
    }
    var done = 0;
    for (var j = 0; j < practicePlan.items.length; j++) {
      if (practicePlan.items[j].completed) done++;
    }
    practicePlan.completedItems = done;
    practiceEngineWrite("practicePlan", practicePlan);
    if (done >= practicePlan.totalItems) {
      practiceEngineWrite("practicePlanComplete", true);
      practicePlanHistory.push({ date: practiceState.practicePlanDate, focus: practicePlan.focus, items: practicePlan.totalItems });
      practiceEngineWrite("practicePlanHistory", practicePlanHistory);
      practiceEngineWrite("xp", practiceState.xp + 20);
      practiceEngineWrite("xpToast", { amount: 20, time: Date.now() });
    }
    saveState();
  }

  window.generatePracticePlan = generatePracticePlan;
  window.markPracticePlanItem = markPracticePlanItem;
  window.getWeakTransitions = getWeakTransitions;
  window.getWeakChords = getWeakChords;
  window.getWeakPerformanceSongs = getWeakPerformanceSongs;

})();
