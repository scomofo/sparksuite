(function() {

  function generateDailyPlan(skillGraph, songList) {
    var plan = [];

    // 1. Warmup: simple strum at low tempo
    plan.push({
      type: "warmup",
      mode: "practice",
      label: "Warmup: Easy Strums",
      tempo: 60,
      pattern: "D D D D",
      duration: 60
    });

    // 2. Weak skill drill (from lesson generator)
    var _lessonGen = (typeof SparkLessonGenerator !== "undefined") ? SparkLessonGenerator : (typeof window !== "undefined" && window.SparkLessonGenerator) ? window.SparkLessonGenerator : null;
    if (_lessonGen && skillGraph) {
      var lesson = _lessonGen.generate(skillGraph);
      if (lesson) {
        plan.push(lesson);
      }
    }

    // 3. Song (pick a level-appropriate song or first available)
    if (songList && songList.length > 0) {
      var songIdx = Math.min(Math.floor(Math.random() * songList.length), songList.length - 1);
      var song = songList[songIdx];
      plan.push({
        type: "song",
        mode: "performance",
        label: song.title || "Song Practice",
        song: song,
        duration: 120
      });
    }

    // 4. Challenge: slightly harder drill
    if (skillGraph) {
      var _skillTracker = (typeof SparkSkillTracker !== "undefined") ? SparkSkillTracker : (typeof window !== "undefined" && window.SparkSkillTracker) ? window.SparkSkillTracker : null;
      var weakest = _skillTracker ? _skillTracker.getWeakestSkill(skillGraph) : "timing";
      plan.push({
        type: "challenge",
        mode: "practice",
        label: "Challenge: " + (weakest === "timing" ? "Speed Up" : weakest === "rhythm" ? "Complex Rhythm" : "Chord Switches"),
        tempo: weakest === "timing" ? 90 : 80,
        pattern: weakest === "rhythm" ? "D U D U D U D U" : "D D U U D U",
        duration: 45
      });
    }

    return plan;
  }

  function estimatePlanDuration(plan) {
    var total = 0;
    for (var i = 0; i < plan.length; i++) {
      total += plan[i].duration || 60;
    }
    return total;
  }

  var SparkDailyPlanGenerator = {
    generate: generateDailyPlan,
    estimateDuration: estimatePlanDuration
  };

  if (typeof window !== "undefined") window.SparkDailyPlanGenerator = SparkDailyPlanGenerator;
  if (typeof module !== "undefined") module.exports = SparkDailyPlanGenerator;
})();
