(function(){

  function buildDefaultDailyChallenges(appType){
    appType = appType || inferChallengeAppType();
    return [
      makeChallenge({
        id: generateId("challenge"),
        title: "Practice 15 Minutes",
        description: "Accumulate 15 minutes of practice today.",
        category: "daily",
        type: "practice_minutes",
        target: 15,
        rewards: { xp: 40, skillPoints: 0, unlockIds: [] }
      }),
      makeChallenge({
        id: generateId("challenge"),
        title: "Complete 1 Song",
        description: "Finish one song performance.",
        category: "daily",
        type: "complete_song",
        target: 1,
        rewards: { xp: 60, skillPoints: 0, unlockIds: [] }
      }),
      makeChallenge({
        id: generateId("challenge"),
        title: appType === "piano" ? "Practice Left Hand" : "Fix a Weak Transition",
        description: appType === "piano" ? "Complete one LH-focused activity." : "Complete one weak-transition repair drill.",
        category: "daily",
        type: appType === "piano" ? "left_hand_focus" : "weak_transition_focus",
        target: 1,
        rewards: { xp: 50, skillPoints: 0, unlockIds: [] }
      })
    ];
  }

  function buildDefaultWeeklyChallenges(appType){
    return [
      makeChallenge({
        id: generateId("challenge"),
        title: "Practice 120 Minutes",
        description: "Accumulate two hours of practice this week.",
        category: "weekly",
        type: "practice_minutes",
        target: 120,
        rewards: { xp: 150, skillPoints: 1, unlockIds: [] }
      }),
      makeChallenge({
        id: generateId("challenge"),
        title: "Complete 2 Songs",
        description: "Finish two song performances this week.",
        category: "weekly",
        type: "complete_song",
        target: 2,
        rewards: { xp: 200, skillPoints: 1, unlockIds: [] }
      }),
      makeChallenge({
        id: generateId("challenge"),
        title: "Improve a Weak Spot",
        description: "Clear at least one recommended weak-spot item.",
        category: "weekly",
        type: "weak_spot_clear",
        target: 1,
        rewards: { xp: 120, skillPoints: 0, unlockIds: [] }
      })
    ];
  }

  function makeChallenge(def){
    return {
      id: def.id,
      title: def.title || "Challenge",
      description: def.description || "",
      category: def.category || "daily",
      type: def.type || "generic",
      target: def.target || 1,
      progress: 0,
      completed: false,
      claimed: false,
      expiresAt: def.expiresAt || null,
      rewards: def.rewards || { xp: 0, skillPoints: 0, unlockIds: [] },
      meta: def.meta || {}
    };
  }

  function inferChallengeAppType(){
    return /piano/i.test(typeof APP_NAME !== "undefined" ? APP_NAME : "") ? "piano" : "guitar";
  }

  window.buildDefaultDailyChallenges = buildDefaultDailyChallenges;
  window.buildDefaultWeeklyChallenges = buildDefaultWeeklyChallenges;
  window.makeChallenge = makeChallenge;

})();
