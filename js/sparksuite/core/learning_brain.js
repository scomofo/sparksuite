(function() {
  var _root = (typeof window !== "undefined") ? window : (typeof global !== "undefined") ? global : {};

  // Analyze user and produce a recommendation
  function analyzeUser(skillGraph, flowState) {
    if (!skillGraph) return { focusSkill: null, confidence: 0, recommendation: "none" };

    var tracker = _root.SparkSkillTracker;
    var weakest = tracker
      ? tracker.getWeakestSkill(skillGraph)
      : "timing";
    var weakestValue = skillGraph[weakest] || 0.5;

    // Check flow state for emotion-driven overrides
    var emotion = "engaged";
    var flowEngine = _root.SparkFlowEngine;
    if (flowState && flowEngine) {
      emotion = flowEngine.detectEmotion(flowState);
    }

    var recommendation = "continue";
    if (emotion === "frustrated") recommendation = "easy_practice";
    else if (emotion === "bored") recommendation = "challenge";
    else if (weakestValue < 0.5) recommendation = "targeted_practice";
    else if (weakestValue < 0.7) recommendation = "practice";

    return {
      focusSkill: weakest,
      focusValue: Math.round(weakestValue * 100),
      confidence: Math.round(weakestValue * 100) / 100,
      emotion: emotion,
      recommendation: recommendation
    };
  }

  // Generate a practice segment from weakness analysis
  function generatePracticeFromWeakness(focusSkill, skillGraph) {
    // Delegate to lesson generator if available
    var generator = _root.SparkLessonGenerator;
    if (generator && skillGraph) {
      var lesson = generator.generate(skillGraph);
      if (lesson) return lesson;
    }

    // Fallback: manual generation
    if (focusSkill === "timing") {
      return { type: "timing_drill", mode: "practice", tempo: 60, pattern: "D D D D", lane: null, duration: 30, label: "Timing: Steady Beat" };
    }
    if (focusSkill === "chordAccuracy") {
      return { type: "chord_drill", mode: "practice", tempo: 70, pattern: "D D U U D U", lane: null, duration: 30, label: "Chord Transitions" };
    }
    return { type: "rhythm_drill", mode: "practice", tempo: 70, pattern: "D U D U", lane: null, duration: 30, label: "Rhythm Practice" };
  }

  // Build a complete adaptive session
  function buildAdaptiveSession(skillGraph, flowState, songList) {
    var analysis = analyzeUser(skillGraph, flowState);
    var segments = [];

    // 1. Always start with practice on weakest skill
    var practice = generatePracticeFromWeakness(analysis.focusSkill, skillGraph);
    if (practice) segments.push(practice);

    // 2. Add a song if available and user isn't frustrated
    if (analysis.emotion !== "frustrated" && songList && songList.length > 0) {
      var songIdx = Math.floor(Math.random() * songList.length);
      segments.push({
        type: "song",
        mode: "performance",
        label: songList[songIdx].title || "Song",
        song: songList[songIdx],
        duration: 120
      });
    }

    // 3. Add challenge if bored or strong
    if (analysis.recommendation === "challenge" || analysis.recommendation === "continue") {
      segments.push({
        type: "challenge",
        mode: "practice",
        tempo: 100,
        pattern: "D U D U D U D U",
        lane: null,
        duration: 30,
        label: "Challenge: Fast Strums"
      });
    }

    return {
      analysis: analysis,
      segments: segments
    };
  }

  // Generate flow-aware encouragement text
  function getInsightText(analysis) {
    if (!analysis) return "";
    var skill = analysis.focusSkill || "timing";
    var skillLabel = skill === "chordAccuracy" ? "Chords" : skill.charAt(0).toUpperCase() + skill.slice(1);

    if (analysis.recommendation === "easy_practice") return "Let's slow down and focus on " + skillLabel + ".";
    if (analysis.recommendation === "targeted_practice") return skillLabel + " needs work. Let's drill it.";
    if (analysis.recommendation === "practice") return skillLabel + " is improving. Keep practicing.";
    if (analysis.recommendation === "challenge") return "You're strong! Time to push harder.";
    return "Looking good. Keep going.";
  }

  var SparkLearningBrain = {
    analyzeUser: analyzeUser,
    generatePracticeFromWeakness: generatePracticeFromWeakness,
    buildAdaptiveSession: buildAdaptiveSession,
    getInsightText: getInsightText
  };

  if (typeof window !== "undefined") window.SparkLearningBrain = SparkLearningBrain;
  if (typeof module !== "undefined") module.exports = SparkLearningBrain;
})();
