(function(){

  function getWeakTransitions() {
    var weak = [];
    if (!S.transitionStats) return weak;
    for (var key in S.transitionStats) {
      var st = S.transitionStats[key];
      if (typeof st === "object" && st.attempts > 0 && st.success / st.attempts < 0.7) {
        var parts = key.split("→");
        if (parts.length === 2) weak.push({ from: parts[0].trim(), to: parts[1].trim(), rate: st.success / st.attempts });
      }
    }
    weak.sort(function(a, b) { return a.rate - b.rate; });
    return weak.slice(0, 3);
  }

  function getWeakChords() {
    var weak = [];
    for (var chord in (S.chordProgress || {})) {
      var pct = S.chordProgress[chord] || 0;
      if (pct < 70) weak.push({ chord: chord, mastery: pct });
    }
    weak.sort(function(a, b) { return a.mastery - b.mastery; });
    return weak.slice(0, 3);
  }

  function getWeakPerformanceSongs() {
    var weak = [];
    for (var key in (S.performanceStats || {})) {
      var st = S.performanceStats[key];
      if (st && st.runs > 0 && st.bestAccuracy < 80) {
        weak.push({ key: key, songId: st.songId, accuracy: st.bestAccuracy, arrangement: st.arrangement, difficulty: st.difficulty });
      }
    }
    weak.sort(function(a, b) { return a.accuracy - b.accuracy; });
    return weak.slice(0, 3);
  }

  function generatePracticePlan() {
    var today = new Date().toISOString().split("T")[0];
    if (S.practicePlanDate === today && S.practicePlan) return S.practicePlan;

    var items = [];
    var itemId = 1;

    // 1. Warmup - finger exercise
    items.push({
      id: "warmup_" + itemId++,
      type: "warmup",
      label: "Spider Exercise",
      desc: "2 minutes of finger warm-up",
      durationSec: 120,
      completed: false
    });

    // 2. Weak chord transitions
    var weakTrans = getWeakTransitions();
    for (var t = 0; t < weakTrans.length; t++) {
      items.push({
        id: "transition_" + itemId++,
        type: "transition",
        label: weakTrans[t].from + " → " + weakTrans[t].to,
        desc: "Practice this transition (" + Math.round(weakTrans[t].rate * 100) + "% success)",
        from: weakTrans[t].from,
        to: weakTrans[t].to,
        durationSec: 180,
        completed: false
      });
    }

    // 3. Weak chords
    var weakChords = getWeakChords();
    for (var c = 0; c < weakChords.length; c++) {
      items.push({
        id: "chord_" + itemId++,
        type: "chord_practice",
        label: "Practice " + weakChords[c].chord,
        desc: weakChords[c].mastery + "% mastery — needs work",
        chord: weakChords[c].chord,
        durationSec: 120,
        completed: false
      });
    }

    // 4. Performance song practice
    var weakSongs = getWeakPerformanceSongs();
    for (var s = 0; s < Math.min(2, weakSongs.length); s++) {
      items.push({
        id: "song_" + itemId++,
        type: "performance_song",
        label: "Perform: " + weakSongs[s].songId,
        desc: weakSongs[s].accuracy + "% accuracy — aim for 80%+",
        songId: weakSongs[s].songId,
        arrangementType: weakSongs[s].arrangement || "chords",
        difficultyId: weakSongs[s].difficulty || "normal",
        completed: false
      });
    }

    // 5. If no weak items, suggest exploration
    if (items.length <= 1) {
      items.push({
        id: "explore_" + itemId++,
        type: "explore",
        label: "Try a new song in Performance Mode",
        desc: "Expand your repertoire",
        completed: false
      });
    }

    // Determine focus
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

    S.practicePlan = plan;
    S.practicePlanDate = today;
    S.practicePlanComplete = false;
    return plan;
  }

  function markPracticePlanItem(itemId) {
    if (!S.practicePlan || !S.practicePlan.items) return;
    for (var i = 0; i < S.practicePlan.items.length; i++) {
      if (S.practicePlan.items[i].id === itemId) {
        S.practicePlan.items[i].completed = true;
        break;
      }
    }
    // Count completed
    var done = 0;
    for (var j = 0; j < S.practicePlan.items.length; j++) {
      if (S.practicePlan.items[j].completed) done++;
    }
    S.practicePlan.completedItems = done;
    if (done >= S.practicePlan.totalItems) {
      S.practicePlanComplete = true;
      if (!Array.isArray(S.practicePlanHistory)) S.practicePlanHistory = [];
      S.practicePlanHistory.push({ date: S.practicePlanDate, focus: S.practicePlan.focus, items: S.practicePlan.totalItems });
      S.xp += 20;
      S.xpToast = { amount: 20, time: Date.now() };
    }
    saveState();
  }

  window.generatePracticePlan = generatePracticePlan;
  window.markPracticePlanItem = markPracticePlanItem;
  window.getWeakTransitions = getWeakTransitions;
  window.getWeakChords = getWeakChords;
  window.getWeakPerformanceSongs = getWeakPerformanceSongs;

})();
