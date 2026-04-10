(function() {
  var _root = (typeof window !== "undefined") ? window : (typeof global !== "undefined" ? global : {});

  function analyzeUser(skillGraph, flowState, weakSpots) {
    if (!skillGraph) return { focusSkill: null, confidence: 0, recommendation: "none" };

    var tracker = _root.SparkSkillTracker;
    var weakest = tracker && typeof tracker.getWeakestSkill === "function"
      ? tracker.getWeakestSkill(skillGraph)
      : "timing";
    var weakestValue = weakest ? (skillGraph[weakest] || 0.5) : 0.5;
    var strongest = tracker && typeof tracker.getStrongestSkill === "function"
      ? tracker.getStrongestSkill(skillGraph)
      : null;
    var strongestValue = strongest ? (skillGraph[strongest] || 0) : 0;
    var weakLane = tracker && typeof tracker.getWeakestLane === "function"
      ? tracker.getWeakestLane(skillGraph)
      : null;
    var weakLaneValue = weakLane != null && skillGraph.laneAccuracy
      ? skillGraph.laneAccuracy[weakLane]
      : null;

    var emotion = "engaged";
    if (flowState && _root.SparkFlowEngine && typeof _root.SparkFlowEngine.detectEmotion === "function") {
      emotion = _root.SparkFlowEngine.detectEmotion(flowState);
    }

    var weakAreas = collectWeakAreas(weakSpots);
    var primaryWeakArea = weakAreas.length ? weakAreas[0] : null;
    var drillType = primaryWeakArea === "wrong_fret" || weakLaneValue != null && weakLaneValue < 0.45
      ? "lane_drill"
      : weakest === "timing"
        ? "timing_drill"
        : weakest === "chordAccuracy"
          ? "chord_drill"
          : "rhythm_drill";

    var recommendation = "continue";
    if (emotion === "frustrated") recommendation = "easy_practice";
    else if (emotion === "bored") recommendation = "challenge";
    else if (weakestValue < 0.5 || primaryWeakArea) recommendation = "targeted_practice";
    else if (weakestValue < 0.7) recommendation = "practice";

    var recommendedDifficultyId = weakestValue < 0.45 || emotion === "frustrated"
      ? "easy"
      : weakestValue > 0.8 && emotion !== "struggling"
        ? "hard"
        : "normal";
    var tempoMultiplier = recommendedDifficultyId === "easy" ? 0.9 : (recommendedDifficultyId === "hard" ? 1.05 : 1.0);
    var suggestedTempo = Math.round(80 * tempoMultiplier);

    return {
      focusSkill: weakest,
      focusValue: Math.round(weakestValue * 100),
      confidence: Math.round(weakestValue * 100) / 100,
      emotion: emotion,
      recommendation: recommendation,
      weakLane: weakLane,
      weakLaneValue: weakLaneValue,
      weakAreas: weakAreas,
      primaryWeakArea: primaryWeakArea,
      drillType: drillType,
      recommendedDifficultyId: recommendedDifficultyId,
      tempoMultiplier: tempoMultiplier,
      suggestedTempo: suggestedTempo,
      strongestSkill: strongest,
      strongestValue: strongestValue,
      coachMessage: getInsightText({
        focusSkill: weakest,
        recommendation: recommendation,
        drillType: drillType,
        weakLane: weakLane,
        primaryWeakArea: primaryWeakArea
      })
    };
  }

  function collectWeakAreas(weakSpots) {
    var out = [];
    if (!weakSpots || typeof weakSpots !== "object") return out;
    for (var key in weakSpots) {
      var value = weakSpots[key];
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          if (out.indexOf(value[i]) < 0) out.push(value[i]);
        }
      } else if (typeof value === "string" && out.indexOf(value) < 0) {
        out.push(value);
      }
    }
    return out;
  }

  function generatePracticeFromWeakness(focusOrAnalysis, skillGraph) {
    var analysis = focusOrAnalysis && typeof focusOrAnalysis === "object" && focusOrAnalysis.focusSkill
      ? focusOrAnalysis
      : {
          focusSkill: focusOrAnalysis,
          weakLane: null,
          drillType: null,
          suggestedTempo: null
        };

    var generator = _root.SparkLessonGenerator;
    if (generator && skillGraph && typeof generator.generate === "function") {
      var lesson = generator.generate(skillGraph);
      if (lesson) return lesson;
    }

    var tempo = analysis.suggestedTempo || 70;
    if (analysis.drillType === "lane_drill" && analysis.weakLane != null) {
      return { type: "lane_drill", mode: "practice", tempo: tempo, pattern: "D D D D", lane: analysis.weakLane, duration: 30 };
    }
    if (analysis.focusSkill === "timing") {
      return { type: "timing_drill", mode: "practice", tempo: tempo, pattern: "D D D D", lane: null, duration: 30 };
    }
    if (analysis.focusSkill === "chordAccuracy") {
      return { type: "chord_drill", mode: "practice", tempo: tempo, pattern: "D D U U D U", lane: null, duration: 30 };
    }
    return { type: "rhythm_drill", mode: "practice", tempo: tempo, pattern: "D U D U", lane: null, duration: 30 };
  }

  function buildAdaptiveSession(skillGraph, flowState, songList, weakSpots) {
    var analysis = analyzeUser(skillGraph, flowState, weakSpots);
    var segments = [];
    var practice = generatePracticeFromWeakness(analysis, skillGraph);
    if (practice) segments.push(practice);
    if (analysis.emotion !== "frustrated" && songList && songList.length > 0) {
      segments.push({ type: "song", mode: "performance", song: songList[0], duration: 120 });
    }
    if (analysis.recommendation === "challenge" || analysis.recommendation === "continue") {
      segments.push({ type: "challenge", mode: "practice", tempo: 100, pattern: "D U D U D U D U", lane: null, duration: 30 });
    }
    return { analysis: analysis, segments: segments };
  }

  function getInsightText(analysis) {
    if (!analysis) return "";
    if (analysis.drillType === "lane_drill" && analysis.weakLane != null) return "Let's tighten lane " + (analysis.weakLane + 1) + " with slower, cleaner reps.";
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
