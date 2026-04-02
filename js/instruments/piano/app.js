/* ───────── PianoSpark – app.js ───────── */
/* Major refactor: guided sessions, reward engine, adaptive difficulty */

// ── Utility ──
function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ── Timer ticks ──
function tickSession() {
  if (S.paused || !S.active) return;
  S.timer--;
  addPracticeSecond();
  if (S.timer % 30 === 0 && S.timer > 0) addXP(5);
  var elapsed = S.practiceLen - S.timer;
  var msg = fireMicro(elapsed, S.practiceLen);
  if (msg) showToast(msg);
  if (S.timer <= 0) { completeLegacySession(); return; }
  render();
}

function completeLegacySession() {
  if (T.session) { clearInterval(T.session); T.session = null; }
  S.active = false;
  S.sessions++;
  addXP(20);
  var prog = (S.chordProg[S.chord] || 0) + 15;
  S.chordProg[S.chord] = Math.min(100, prog);
  addHistory("session", { chord: S.chord, dur: S.practiceLen });
  checkPracticeDate();
  checkLevelUp();
  checkReward("session_complete");
  var badges = checkBadges();
  if (badges.length) showToast("Badge earned! " + badges.map(function(b) { return BADGES.find(function(x) { return x.id === b; }).icon; }).join(" "));
  else playSound("complete");
  if (S.detecting) stopDetection();
  saveState();
  render();
}

function tickDrill() {
  if (!S.drillActive) return;
  S.drillTimer--;
  addPracticeSecond();
  if (S.drillTimer <= 0) { completeDrill(); return; }
  render();
}

function completeDrill() {
  if (T.drill) { clearInterval(T.drill); T.drill = null; }
  S.drillActive = false;
  S.drillsDone++;
  addXP(30);
  addHistory("drill", { chords: S.drillChords.join(",") });
  checkPracticeDate();
  checkReward("drill_complete");
  checkBadges();
  playSound("complete");
  saveState();
  render();
}

function tickDaily() {
  if (!S.dailyActive) return;
  S.dailyTimer--;
  addPracticeSecond();
  if (S.dailyTimer <= 0) { completeDaily(); return; }
  render();
}

function completeDaily() {
  if (T.daily) { clearInterval(T.daily); T.daily = null; }
  S.dailyActive = false;
  S.dailiesDone++;
  addXP(40);
  addHistory("daily", { score: S.dailyScore });
  checkPracticeDate();
  checkReward("daily_complete");
  checkBadges();
  playSound("complete");
  saveState();
  render();
}

// ── Guided session step timer ──
function tickSessionStep() {
  if (S.paused) return;
  S.sessionTimer--;
  addPracticeSecond();
  if (S.sessionTimer <= 0) {
    advanceSessionStep();
    return;
  }
  render();
}

// ── Level up check (8 levels) ──
function checkLevelUp() {
  if (S.level >= 8) return;
  // Level up when all sessions for current level are completed
  var curr = CURRICULUM[S.level - 1];
  if (!curr) return;
  var parts = curr.sessions.split("-");
  var lastSession = parseInt(parts.length > 1 ? parts[1] : parts[0]);
  if (S.currentSession > lastSession) {
    S.level = Math.min(8, S.level + 1);
    playSound("levelup");
    showToast("Level Up! You're now Level " + S.level + ": " + LN[S.level] + "!");
    showConfetti();
    checkBadges();
    saveState();
  }
}

// ── Reward engine (stickiness #1 + #4) ──
function checkReward(actionType) {
  S.totalActions++;
  S.actionsSinceReward++;

  var phase = getRewardPhase(S.currentSession);
  if (!phase) return;

  var shouldReward = false;
  var isJackpot = false;
  var xpAmount = 25;

  if (phase.schedule === "continuous") {
    shouldReward = true;
    xpAmount = phase.xpPerAction || 25;
  } else if (phase.schedule === "VR-2-3") {
    if (S.actionsSinceReward >= S.nextRewardAt) {
      shouldReward = true;
      S.nextRewardAt = 2 + Math.floor(Math.random() * 2); // 2-3
    }
  } else if (phase.schedule === "VR-5-8") {
    if (S.actionsSinceReward >= S.nextRewardAt) {
      shouldReward = true;
      S.nextRewardAt = 5 + Math.floor(Math.random() * 4); // 5-8
      if (Math.random() < (phase.jackpotChance || 0)) {
        isJackpot = true;
        xpAmount = 25 * (phase.jackpotMultiplier || 10);
      }
    }
  } else if (phase.schedule === "intrinsic") {
    // Rare surprise rewards
    if (Math.random() < 0.08) {
      shouldReward = true;
      if (Math.random() < (phase.jackpotChance || 0)) {
        isJackpot = true;
        xpAmount = 25 * (phase.jackpotMultiplier || 15);
      }
    }
  }

  if (shouldReward) {
    S.actionsSinceReward = 0;
    addXP(xpAmount);
    if (isJackpot) {
      S.jackpotsHit++;
      playSound("jackpot");
      showToast("JACKPOT! +" + xpAmount + " XP!");
    } else {
      playSound("reward");
    }
  }
}

// ── Adaptive difficulty (stickiness #6) ──
function adaptBpm(wasClean) {
  if (wasClean) {
    S._cleanStreak = (S._cleanStreak || 0) + 1;
    S._missStreak = 0;
    if (S._cleanStreak >= 3) {
      S.adaptiveBpm = Math.min(200, S.adaptiveBpm + 3);
      S._cleanStreak = 0;
      if (S.adaptiveBpm > S.personalBests.bpm) {
        S.personalBests.bpm = S.adaptiveBpm;
        if (S.earned.indexOf("speed_demon") < 0) {
          S.earned.push("speed_demon");
          showToast("New personal best BPM!");
        }
      }
    }
  } else {
    S._missStreak = (S._missStreak || 0) + 1;
    S._cleanStreak = 0;
    if (S._missStreak >= 2) {
      S.adaptiveBpm = Math.max(40, S.adaptiveBpm - 5);
      S._missStreak = 0;
    }
  }
  saveState();
}

// ── Interleaving (stickiness #8) ──
function pickReviewChords() {
  // Select chords from 3-5 sessions ago, not yesterday
  var targetSession = Math.max(1, S.currentSession - Math.floor(Math.random() * 3 + 3));
  var plan = SESSION_PLANS[targetSession - 1];
  if (!plan) return ["C"];

  var chords = [];
  if (plan.newMove && plan.newMove.chord) chords.push(plan.newMove.chord);
  if (plan.review && plan.review.chords) {
    plan.review.chords.forEach(function(ch) {
      if (chords.indexOf(ch) < 0) chords.push(ch);
    });
  }

  // Ensure at least 2 chords — use shuffle-slice to avoid infinite loop
  if (chords.length < 2) {
    var available = chordsUpToLevel(S.level).map(function(c) { return c.short; })
      .filter(function(c) { return chords.indexOf(c) < 0; });
    shuffleArray(available);
    while (chords.length < 2 && available.length > 0) chords.push(available.shift());
  }

  // Don't repeat what was just reviewed
  return chords.filter(function(ch) { return S.lastReviewChords.indexOf(ch) < 0; }).slice(0, 3);
}

// ── Quiz generation ──
function genQuiz() {
  var pool = chordsUpToLevel(Math.min(S.level + 1, 8));
  if (pool.length < 4) pool = chordsUpToLevel(3);
  var answer = pool[Math.floor(Math.random() * pool.length)].short;
  // Shuffle pool then pick up to 3 distractors — avoids infinite loop if pool is small
  var shuffled = shuffleArray(pool.slice());
  var options = [answer];
  for (var i = 0; i < shuffled.length && options.length < 4; i++) {
    if (shuffled[i].short !== answer) options.push(shuffled[i].short);
  }
  shuffleArray(options);
  return { answer: answer, options: options };
}

// ── Runner game ──
function spawnRunnerTarget() {
  var pool = chordsUpToLevel(S.level).map(function(c) { return c.short; });
  S.runnerTarget = pool[Math.floor(Math.random() * pool.length)];
}

// ── Rhythm game ──
function rhythmTick() {
  if (!S.rhythmActive) return;
  S.rhythmBeat++;
  playSound("tick");
  render();
}

// ── Song playback ──
function songTick() {
  if (!S.songPlaying || S.songIdx === null) return;
  var song = SONGS[S.songIdx];
  if (!song) return;
  S.songChordIdx++;
  if (S.songChordIdx >= song.progression.length) {
    S.songChordIdx = 0;
    if (!S.songsDone) S.songsDone = [];
    if (S.songsDone.indexOf(song.title) < 0) {
      S.songsDone.push(song.title);
      addXP(15);
      checkBadges();
    }
  }
  var chord = song.progression[S.songChordIdx];
  playChordByName(chord, song.style || "block");
  render();
}

// ── Build playback ──
var buildIdx = 0;
function buildTick() {
  if (!S.buildPlaying || !S.buildChords.length) return;
  if (buildIdx >= S.buildChords.length) buildIdx = 0;
  playChordByName(S.buildChords[buildIdx], "block");
  buildIdx++;
  render();
}

// ── Guided session flow ──
function startGuidedSession() {
  var plan = getCurrentSessionPlan();
  if (!plan) { showToast("No more sessions!"); render(); return; }

  S.sessionPlan = plan;
  S.screen = SCR.SESSION;
  S.sessionStep = "spark";
  S.newMovePhase = null;
  S.feedbackMessage = "";
  S.adaptiveBpm = plan.bpm;
  S.paused = false;
  S.fingerWarmUpDone = false;

  checkPracticeDate();
  playSound("start");
  saveState();
  render();
}

function advanceSessionStep() {
  if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
  stopMetronome();
  stopLHPattern();
  stopWatchDemo();

  var steps = ["spark","review","newMove","songSlice","victoryLap"];
  var idx = steps.indexOf(S.sessionStep);

  // Record what was reviewed so we don't repeat it and can show transition tips
  if (S.sessionStep === "review" && S.sessionPlan && S.sessionPlan.review) {
    S.lastReviewChords = S.sessionPlan.review.chords || [];
  }

  if (idx < steps.length - 1) {
    S.sessionStep = steps[idx + 1];
    S.sessionTimer = 0;

    // Set up phase for New Move
    if (S.sessionStep === "newMove") {
      S.newMovePhase = "watch";
    }
  }
  render();
}

function advanceNewMovePhase() {
  var phases = ["watch","shadow","try","refine"];
  var idx = phases.indexOf(S.newMovePhase);
  if (idx < phases.length - 1) {
    S.newMovePhase = phases[idx + 1];
    S.feedbackMessage = "";
    if (S.detecting) stopDetection();
  } else {
    // Done with New Move, advance to next session step
    advanceSessionStep();
    return;
  }
  render();
}

function completeGuidedSession() {
  if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
  stopMetronome();
  stopLHPattern();
  if (S.detecting) stopDetection();

  var plan = S.sessionPlan;
  if (plan) {
    // Mark session complete
    if (S.completedSessions.indexOf(plan.num) < 0) {
      S.completedSessions.push(plan.num);
    }
    S.sessions++;
    S.currentSession = Math.min(50, plan.num + 1);

    // Progress chord
    if (plan.newMove && plan.newMove.chord) {
      var prog = (S.chordProg[plan.newMove.chord] || 0) + 15;
      S.chordProg[plan.newMove.chord] = Math.min(100, prog);
    }

    addXP(50);
    addHistory("guided_session", { session: plan.num, chord: plan.newMove ? plan.newMove.chord : null });

    // Update LH level
    var newLvl = CURRICULUM[Math.min(S.level, 8) - 1];
    if (newLvl && newLvl.lhPattern) {
      var patIdx = LH_PATTERNS.findIndex(function(p) { return p.id === newLvl.lhPattern; });
      if (patIdx >= 0 && patIdx + 1 > S.lhLevel) S.lhLevel = patIdx + 1;
    }
  }

  checkPracticeDate();
  checkLevelUp();
  checkReward("session_complete");
  var badges = checkBadges();

  showConfetti();
  if (badges.length) {
    showToast("Session complete! Badge earned! " + badges.map(function(b) {
      var badge = BADGES.find(function(x) { return x.id === b; });
      return badge ? badge.icon : "";
    }).join(" "));
  } else {
    showToast("Session " + (plan ? plan.num : "") + " complete!");
    playSound("complete");
  }

  S.screen = SCR.HOME;
  S.sessionStep = null;
  S.sessionPlan = null;
  S.newMovePhase = null;
  saveState();
  render();
}

// ── Finger exercise helpers ──
function completeFingerExercise(exerciseId) {
  if (!S.fingerStats[exerciseId]) {
    S.fingerStats[exerciseId] = { completions: 0, lastDone: null, bestTrillSpeed: 0 };
  }
  var stats = S.fingerStats[exerciseId];
  stats.completions++;
  var today = new Date().toDateString();
  var wasNewDay = !stats.lastDone || new Date(stats.lastDone).toDateString() !== today;
  stats.lastDone = Date.now();
  S.fingerExercisesDone++;

  // Track days — skip exerciseId since its lastDone was just updated
  if (wasNewDay) {
    var anyDoneToday = false;
    for (var id in S.fingerStats) {
      if (id.charAt(0) === '_') continue;
      if (id === exerciseId) continue;
      if (S.fingerStats[id].lastDone && new Date(S.fingerStats[id].lastDone).toDateString() === today) {
        anyDoneToday = true; break;
      }
    }
    if (!anyDoneToday) S.fingerDaysLogged++;
  }

  addXP(10);
  checkReward("finger_exercise");
  checkFingerBadges();
  saveState();
}

function tickChordChange() {
  if (!S.chordChangeActive) return;
  S.chordChangeTimer--;
  if (S.chordChangeTimer <= 0) {
    finishChordChange();
    return;
  }
  render();
}

function finishChordChange() {
  if (T.chordChange) { clearInterval(T.chordChange); T.chordChange = null; }
  S.chordChangeActive = false;

  // Record result
  if (!S.fingerStats._chordChangeBest) S.fingerStats._chordChangeBest = 0;
  if (S.chordChangeCount > S.fingerStats._chordChangeBest) {
    S.fingerStats._chordChangeBest = S.chordChangeCount;
    showToast("New personal best: " + S.chordChangeCount + " changes!");
  }

  // Record pair-specific best
  if (S.chordChangePair.length === 2) {
    var pairKey = "_cc_" + S.chordChangePair[0] + "_" + S.chordChangePair[1];
    if (!S.fingerStats[pairKey]) S.fingerStats[pairKey] = { best: 0 };
    if (S.chordChangeCount > S.fingerStats[pairKey].best) {
      S.fingerStats[pairKey].best = S.chordChangeCount;
    }
  }

  addXP(Math.floor(S.chordChangeCount / 2));
  addHistory("chord_change", { score: S.chordChangeCount, chords: S.chordChangePair.join(",") });
  checkFingerBadges();
  checkReward("chord_change");
  playSound("complete");
  saveState();
  render();
}

function checkFingerBadges() {
  var newBadges = [];
  function check(id, cond) {
    if (cond && S.fingerBadges.indexOf(id) < 0) {
      S.fingerBadges.push(id);
      newBadges.push(id);
    }
  }

  // Table Tapper: 7 days of off-instrument exercises
  check("table_tapper", S.fingerDaysLogged >= 7);

  // Spider Fingers: all Tier 2 exercises completed at least once
  var tier2 = getExercisesByTier(2);
  var allTier2Done = tier2.length > 0 && tier2.every(function(ex) {
    return S.fingerStats[ex.id] && S.fingerStats[ex.id].completions > 0;
  });
  check("spider_fingers", allTier2Done);

  // 30 Club / 60 Club
  var best = S.fingerStats._chordChangeBest || 0;
  check("thirty_club", best >= 30);
  check("sixty_club", best >= 60);

  // Pinky Power: trill exercise done 5+ times
  var trillStats = S.fingerStats["P-ADV-3"];
  check("pinky_power", trillStats && trillStats.completions >= 5);

  // Cortot Master: Independence Gauntlet done 3+ times
  var gauntletStats = S.fingerStats["P-ADV-4"];
  check("cortot_master", gauntletStats && gauntletStats.completions >= 3);

  // Thumb Ninja: thumb under exercise done 5+ times
  var thumbStats = S.fingerStats["P-ADV-2"];
  check("thumb_ninja", thumbStats && thumbStats.completions >= 5);

  if (newBadges.length) {
    playSound("badge");
    var names = newBadges.map(function(id) {
      var b = FINGER_BADGES.find(function(fb) { return fb.id === id; });
      return b ? b.icon : "";
    }).join(" ");
    showToast("Finger badge earned! " + names);
    saveState();
  }
}

// ── Action dispatcher ──
function act(action, param) {
  switch (action) {
    case "tab":
      var t = parseInt(param);
      if (t >= TAB.PRACTICE && t <= TAB.TOOLS) {
        S.tab = t;
        if (S.songPlaying) {
          S.songPlaying = false;
          if (T.song) { clearInterval(T.song); T.song = null; }
        }
        if (S.buildPlaying) {
          S.buildPlaying = false;
          if (T.build) { clearInterval(T.build); T.build = null; }
          buildIdx = 0;
        }
      }
      break;

    case "toggle_dark":
      S.darkMode = !S.darkMode;
      document.body.classList.toggle("dark", S.darkMode);
      saveState();
      break;

    case "toggle_focus":
      S.focusMode = !S.focusMode;
      document.body.classList.toggle("focus-mode", S.focusMode);
      saveState();
      break;

    case "view_level":
      S._viewLevel = parseInt(param);
      break;

    // ── Onboarding ──
    case "onboard_never":
      S.currentSession = 1;
      S.onboardingStep = 1;
      break;

    case "onboard_placement":
      S._placementIdx = 0;
      S._inPlacement = true;
      break;

    case "placement_pass":
      S._placementIdx = (S._placementIdx || 0) + 1;
      if (S._placementIdx >= PLACEMENT_TESTS.length) {
        // Passed all - start at session 21+
        S.currentSession = PLACEMENT_TESTS[PLACEMENT_TESTS.length - 1].passesTo || 21;
        S.level = levelForSession(S.currentSession);
        S._inPlacement = false;
        S.onboardingStep = 1;
      }
      break;

    case "placement_fail": {
      var test = PLACEMENT_TESTS[S._placementIdx || 0];
      S.currentSession = test ? test.failsTo : 1;
      S.level = levelForSession(S.currentSession);
      S._inPlacement = false;
      S.onboardingStep = 1;
      break;
    }

    case "skip_placement":
      S.currentSession = 1;
      S.level = 1;
      S._inPlacement = false;
      S.onboardingStep = 1;
      break;

    case "onboard_next":
      S.onboardingStep = (S.onboardingStep || 0) + 1;
      if (S.onboardingStep > 4) S.onboardingStep = 4;
      break;

    case "onboard_back":
      S.onboardingStep = Math.max(0, (S.onboardingStep || 0) - 1);
      break;

    case "set_keyboard":
      S.keyboardSize = parseInt(param);
      break;

    case "toggle_style_pref": {
      var idx = S.stylePrefs.indexOf(param);
      if (idx >= 0) S.stylePrefs.splice(idx, 1);
      else S.stylePrefs.push(param);
      break;
    }

    case "set_intention":
      S.practiceIntention = param || "";
      saveState();
      break;

    case "onboard_complete":
      S.onboardingComplete = true;
      // Mark completed sessions up to current
      for (var cs = 1; cs < S.currentSession; cs++) {
        if (S.completedSessions.indexOf(cs) < 0) S.completedSessions.push(cs);
      }
      S.level = levelForSession(S.currentSession);
      saveState();
      startGuidedSession();
      return; // startGuidedSession calls render

    // ── Guided sessions ──
    case "start_guided_session":
      startGuidedSession();
      return;

    case "next_step":
      advanceSessionStep();
      return;

    case "advance_phase":
      advanceNewMovePhase();
      return;

    case "play_watch_demo":
      playWatchDemo(param);
      break;

    case "complete_victory_lap":
      completeGuidedSession();
      return;

    case "go_home":
      S.screen = SCR.HOME;
      S.sessionStep = null;
      S.sessionPlan = null;
      break;
    case "openCalibration":
      S.screen = SCR.CALIBRATION;
      break;

    // ── Legacy practice ──
    case "start_session":
      S.chord = param;
      S.timer = S.practiceLen;
      S.active = true;
      S.paused = false;
      checkPracticeDate();
      playSound("start");
      if (T.session) clearInterval(T.session);
      T.session = setInterval(tickSession, 1000);
      break;

    case "stop_session":
      if (S.screen === SCR.SESSION) {
        // Stop guided session
        if (T.sessionStep) { clearInterval(T.sessionStep); T.sessionStep = null; }
        stopMetronome(); stopLHPattern(); stopWatchDemo();
        if (S.detecting) stopDetection();
        S.screen = SCR.HOME;
        S.sessionStep = null;
        S.sessionPlan = null;
      } else {
        if (T.session) { clearInterval(T.session); T.session = null; }
        S.active = false;
        if (S.detecting) stopDetection();
        stopMetronome();
      }
      break;

    case "pause":
      S.paused = !S.paused;
      break;

    case "play_chord": {
      var chordToPlay = param ? findChord(param) : (S.chord ? findChord(S.chord) : null);
      if (chordToPlay) playChord(chordToPlay);
      checkReward("play_chord");
      break;
    }

    case "toggle_detect":
      if (S.detecting) {
        if (S.pitchDetectionMode === "yin") stopYinDetection();
        else stopDetection();
      } else {
        if (S.midiEnabled) stopMidi(); // mic and MIDI share S.detectedNotes
        if (S.pitchDetectionMode === "yin") startYinDetection();
        else startDetection();
      }
      break;

    case "set_pitch_detection":
      S.pitchDetectionMode = param; // "fft" | "yin"
      saveState();
      break;

    case "toggle_midi":
      if (S.midiEnabled) stopMidi();
      else startMidi();
      break;

    case "toggle_record":
      if (isRecording()) stopRecording();
      else startRecording();
      break;

    case "play_clip":
      playClip(param);
      break;

    case "delete_clip":
      deleteClip(parseInt(param));
      break;

    case "set_practice_len":
      S.practiceLen = parseInt(param);
      saveState();
      break;

    // ── Drill ──
    case "start_drill": {
      var chords = [];
      if (param === "level") {
        chords = chordsForLevel(S.level).map(function(c) { return c.short; });
        if (chords.length < 2) chords = chordsUpToLevel(S.level).map(function(c) { return c.short; });
      } else if (param === "all") {
        chords = chordsUpToLevel(S.level).filter(function(c) { return (S.chordProg[c.short] || 0) > 0; }).map(function(c) { return c.short; });
        if (chords.length < 3) chords = chordsUpToLevel(S.level).slice(0, 6).map(function(c) { return c.short; });
      } else if (param === "random") {
        var all = chordsUpToLevel(S.level).map(function(c) { return c.short; });
        for (var ri = all.length - 1; ri > 0; ri--) {
          var rj = Math.floor(Math.random() * (ri + 1));
          var rt = all[ri]; all[ri] = all[rj]; all[rj] = rt;
        }
        chords = all.slice(0, 6);
      }
      for (var di = chords.length - 1; di > 0; di--) {
        var dj = Math.floor(Math.random() * (di + 1));
        var dtmp = chords[di]; chords[di] = chords[dj]; chords[dj] = dtmp;
      }
      S.drillChords = chords;
      S.drillIdx = 0;
      S.drillTimer = 30;
      S.drillActive = true;
      playSound("start");
      if (T.drill) clearInterval(T.drill);
      T.drill = setInterval(tickDrill, 1000);
      break;
    }

    case "drill_custom": {
      var set = S.customSets[parseInt(param)];
      if (set) {
        S.drillChords = set.chords.slice();
        S.drillIdx = 0;
        S.drillTimer = 30;
        S.drillActive = true;
        playSound("start");
        if (T.drill) clearInterval(T.drill);
        T.drill = setInterval(tickDrill, 1000);
      }
      break;
    }

    case "drill_next":
      S.drillIdx++;
      if (S.drillIdx >= S.drillChords.length) S.drillIdx = 0;
      playChordByName(S.drillChords[S.drillIdx]);
      checkReward("drill_chord");
      break;

    case "stop_drill":
      if (T.drill) { clearInterval(T.drill); T.drill = null; }
      S.drillActive = false;
      break;

    // ── Daily ──
    case "start_daily": {
      var dt = DAILY_TYPES.find(function(d) { return d.id === param; });
      if (!dt) break;
      S.dailyType = param;
      S.dailyTimer = dt.dur;
      S.dailyActive = true;
      S.dailyScore = 0;
      var dPool = chordsUpToLevel(S.level).map(function(c) { return c.short; });
      S.chord = dPool[Math.floor(Math.random() * dPool.length)];
      playSound("start");
      if (T.daily) clearInterval(T.daily);
      T.daily = setInterval(tickDaily, 1000);
      break;
    }

    case "daily_action": {
      S.dailyScore++;
      var daPool = chordsUpToLevel(S.level).map(function(c) { return c.short; });
      S.chord = daPool[Math.floor(Math.random() * daPool.length)];
      playSound("tick");
      checkReward("daily_action");
      break;
    }

    case "stop_daily":
      if (T.daily) { clearInterval(T.daily); T.daily = null; }
      S.dailyActive = false;
      break;

    // ── Quiz ──
    case "start_quiz":
      S.quizQ = genQuiz();
      S.quizAns = null;
      break;

    case "quiz_answer":
      if (S.quizAns) break;
      S.quizAns = param;
      S.quizTotal = (S.quizTotal || 0) + 1;
      if (param === S.quizQ.answer) {
        S.quizCorrect++;
        addXP(10);
        playSound("complete");
        checkReward("quiz_correct");
      } else {
        playSound("wrong");
      }
      checkBadges();
      saveState();
      break;

    case "next_quiz":
      S.quizQ = genQuiz();
      S.quizAns = null;
      break;

    // ── Ear training ──
    case "start_ear": {
      var ePool = chordsUpToLevel(Math.min(S.level + 1, 8));
      var ec = ePool[Math.floor(Math.random() * ePool.length)];
      S.earChord = ec.short;
      S.earRevealed = false;
      playChord(ec);
      break;
    }

    case "ear_play":
      if (S.earChord) playChordByName(S.earChord);
      break;

    case "ear_guess":
      S.earRevealed = true;
      if (param === S.earChord) {
        addXP(10);
        playSound("complete");
        checkReward("ear_correct");
      } else {
        playSound("wrong");
      }
      break;

    case "next_ear": {
      var nePool = chordsUpToLevel(Math.min(S.level + 1, 8));
      var nec = nePool[Math.floor(Math.random() * nePool.length)];
      S.earChord = nec.short;
      S.earRevealed = false;
      playChord(nec);
      break;
    }

    // ── Styles ──
    case "select_style":
      S.styleIdx = parseInt(param);
      break;

    case "play_style": {
      var ps = PLAY_STYLES[S.styleIdx];
      if (!ps) break;
      var demoChord = findChord("C");
      if (demoChord) playChord(demoChord, ps.id);
      break;
    }

    case "start_metronome":
      startMetronome(S.adaptiveBpm || S.bpm);
      break;

    case "stop_metronome":
      stopMetronome();
      break;

    // ── Songs ──
    case "song_sort":
      if (S.songSort === param) { S.songSortAsc = !S.songSortAsc; }
      else { S.songSort = param; S.songSortAsc = true; }
      break;
    case "song_filter":
      S.songFilter = param || "";
      break;
    case "select_song":
      S.songIdx = parseInt(param);
      S.songChordIdx = 0;
      S.songPlaying = false;
      S.bpm = SONGS[parseInt(param)].bpm;
      break;

    case "play_song":
      if (S.songPlaying) {
        S.songPlaying = false;
        if (T.song) { clearInterval(T.song); T.song = null; }
        stopMetronome();
      } else {
        S.songPlaying = true;
        var song = SONGS[S.songIdx];
        if (song) {
          var interval = (60000 / S.bpm) * 2;
          playChordByName(song.progression[0], song.style || "block");
          T.song = setInterval(songTick, interval);
          startMetronome(S.bpm);
        }
      }
      break;

    case "song_back":
      S.songIdx = null;
      S.songPlaying = false;
      if (T.song) { clearInterval(T.song); T.song = null; }
      stopMetronome();
      break;

    // ── Stems ──
    case "stemOpenFile":
      if (!window.electron) break;
      S.stemError = null; render();
      window.electron.stems.openFile().then(function(result) {
        if (!result) return;
        S.stemFile = result; S.stemStatus = "idle"; render();
        window.electron.stems.checkCache(result.filePath).then(function(cached) {
          if (cached) {
            S.stemPaths = cached;
            _loadStemFileUrls(cached);
          } else {
            act("stemSeparate");
          }
        });
      });
      break;
    case "stemSeparate":
      if (!window.electron || !S.stemFile) break;
      S.stemStatus = "separating"; S.stemProgress = 0; S.stemError = null; render();
      var removeProgress = window.electron.stems.onProgress(function(data) {
        var match = data.line.match(/(\d+)%/);
        if (match) { S.stemProgress = parseInt(match[1]); render(); }
      });
      window.electron.stems.separate(S.stemFile.filePath).then(function(result) {
        removeProgress();
        S.stemPaths = result.stemPaths;
        _loadStemFileUrls(result.stemPaths);
        render();
      }).catch(function(err) {
        removeProgress();
        S.stemStatus = "error"; S.stemError = err.message; render();
      });
      break;
    case "stemCancel":
      if (window.electron) window.electron.stems.cancel();
      S.stemStatus = "idle"; S.stemProgress = 0; render();
      break;
    case "stemOpen":
      S.screen = SCR.STEM_PLAYER; render(); break;
    case "stemBack":
      cleanupStems(); S.screen = SCR.HOME; S.tab = TAB.SONGS; S._songTab = "stems"; render();
      break;
    case "stemToggle":
      S.stemToggles[param] = !S.stemToggles[param];
      setStemMuted(param, !S.stemToggles[param]);
      break;
    case "stemSolo":
      for (var sk in S.stemToggles) S.stemToggles[sk] = (sk === param);
      for (var sk in S.stemToggles) setStemMuted(sk, !S.stemToggles[sk]);
      break;
    case "stemAll":
      for (var sk in S.stemToggles) { S.stemToggles[sk] = true; setStemMuted(sk, false); }
      break;
    case "stemPlay":
      if (S.stemPlaying) pauseStems(); else playStems();
      break;
    case "stemSeek":
      seekStems(parseFloat(param)); break;
    case "stemVolume":
      S.stemVolume = parseFloat(param); setStemVolume(S.stemVolume); break;

    // ── Practice Plan ──
    case "openPlan":
      S.screen = SCR.PLAN; break;
    case "completePlan":
      completePracticePlan(); break;
    case "regeneratePlan":
      buildPracticePlan(); break;

    // ── Performance Mode ──
    case "open_perform_song": {
      var idx = parseInt(param);
      var song = SONGS[idx];
      if(song){
        S.performSongData = song;
        S.performSongId = normalizeSongId(song);
        S.performArrangementType = "block_chords";
        S.screen = SCR.PERFORM_SONG;
      }
      break;
    }
    case "performDifficulty":
      applyPerformanceDifficultyToState(param || "normal");
      saveState();
      break;
    case "performArrangement":
      S.performArrangementType = param || "block_chords";
      saveState();
      break;
    case "importSongAudio":
      if(!window.electron||!window.electron.stems){alert("Requires desktop app.");break;}
      var importSongId=param;
      window.electron.stems.openFile().then(function(result){
        if(!result)return;
        S.songAudioImporting=true;
        S.songAudioProgress=0;
        render();

        var unsubProgress=window.electron.stems.onProgress(function(data){
          if(data&&data.progress!=null){S.songAudioProgress=Math.round(data.progress);render();}
        });

        window.electron.stems.checkCache(result.filePath).then(function(cached){
          if(cached) return cached;
          return window.electron.stems.separate(result.filePath);
        }).then(function(stemPaths){
          unsubProgress();
          if(!stemPaths){S.songAudioImporting=false;render();return;}
          var stemNames=Object.keys(stemPaths);
          var urlMap={};
          function loadNext(idx){
            if(idx>=stemNames.length){
              S.songAudioData[importSongId]={
                mp3Path:result.filePath,
                detectedBpm:null,
                stemPaths:stemPaths,
                stemUrls:urlMap,
                importedAt:new Date().toISOString()
              };
              S.songAudioImporting=false;
              saveState();render();
              return;
            }
            window.electron.stems.getFileUrl(stemPaths[stemNames[idx]]).then(function(url){
              urlMap[stemNames[idx]]=url;
              loadNext(idx+1);
            });
          }
          loadNext(0);
        }).catch(function(err){
          unsubProgress();
          S.songAudioImporting=false;
          alert("Stem separation failed: "+(err.message||err));
          render();
        });
      });
      break;
    case "removeSongAudio":
      delete S.songAudioData[param];
      saveState();render();
      break;
    case "performStart": {
      var chart = buildPerformanceChartFromSong(S.performSongData, S.performArrangementType);
      startPerformance(chart, {
        difficulty:S.performDifficulty,
        speed:S.performSpeed || 1
      });
      return;
    }
    case "pausePerform":
      pausePerformance();
      return;
    case "resumePerform":
      resumePerformance();
      return;
    case "performRetry":
      if(S.performSongData){
        var chart = buildPerformanceChartFromSong(S.performSongData, S.performArrangementType);
        startPerformance(chart, {
          difficulty:S.performDifficulty,
          speed:S.performSpeed || 1
        });
      }
      return;
    case "stopPerform":
      stopPerformance();
      S.screen = SCR.HOME;
      S.tab = TAB.SONGS;
      render();
      return;

    // ── Rhythm ──
    case "start_rhythm":
      S.rhythmActive = true;
      S.rhythmScore = 0;
      S.rhythmCombo = 0;
      S.rhythmBeat = 0;
      S._rhythmStart = performance.now();
      S._rhythmInterval = 60000 / S.bpm;
      if (T.rhythm) clearInterval(T.rhythm);
      T.rhythm = setInterval(rhythmTick, S._rhythmInterval);
      startMetronome(S.bpm);
      break;

    case "rhythm_hit": {
      var elapsed = performance.now() - S._rhythmStart;
      var beatInterval = S._rhythmInterval;
      var beatPhase = (elapsed % beatInterval) / beatInterval;
      var accuracy = Math.min(beatPhase, 1 - beatPhase);
      if (accuracy < 0.15) {
        S.rhythmScore += 10 * (S.rhythmCombo + 1);
        S.rhythmCombo++;
        playSound("tick");
      } else if (accuracy < 0.3) {
        S.rhythmScore += 5;
        S.rhythmCombo = 0;
      } else {
        S.rhythmCombo = 0;
        playSound("wrong");
      }
      break;
    }

    case "stop_rhythm":
      S.rhythmActive = false;
      if (T.rhythm) { clearInterval(T.rhythm); T.rhythm = null; }
      stopMetronome();
      addXP(Math.floor(S.rhythmScore / 10));
      addHistory("rhythm", { score: S.rhythmScore });
      break;

    // ── Runner ──
    case "start_runner":
      S.runnerActive = true;
      S.runnerScore = 0;
      spawnRunnerTarget();
      if (T.runner) clearInterval(T.runner);
      T.runner = setInterval(function() {
        S.runnerScore = Math.max(0, S.runnerScore - 1);
        spawnRunnerTarget();
        render();
      }, 4000);
      break;

    case "runner_pick":
      if (param === S.runnerTarget) {
        S.runnerScore += 10;
        playSound("tick");
        addXP(2);
        checkReward("runner_correct");
      } else {
        S.runnerScore = Math.max(0, S.runnerScore - 5);
        playSound("wrong");
      }
      spawnRunnerTarget();
      break;

    case "stop_runner":
      S.runnerActive = false;
      if (T.runner) { clearInterval(T.runner); T.runner = null; }
      addHistory("runner", { score: S.runnerScore });
      break;

    // ── Build ──
    case "build_add":
      S.buildChords.push(param);
      break;

    case "build_remove":
      S.buildChords.splice(parseInt(param), 1);
      break;

    case "build_clear":
      S.buildChords = [];
      S.buildPlaying = false;
      if (T.build) { clearInterval(T.build); T.build = null; }
      break;

    case "build_play":
      if (S.buildPlaying) {
        S.buildPlaying = false;
        if (T.build) { clearInterval(T.build); T.build = null; }
        buildIdx = 0;
      } else {
        S.buildPlaying = true;
        buildIdx = 0;
        buildTick();
        T.build = setInterval(buildTick, (60000 / S.bpm) * 2);
      }
      break;

    // ── Custom sets ──
    case "new_custom": {
      var name = prompt("Set name:");
      if (!name || !name.trim()) break;
      var chordStr = prompt("Chords (comma-separated, e.g. C,Am,F,G):");
      if (!chordStr) break;
      var parsed = chordStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      var valid = parsed.filter(function(c) { return findChord(c); });
      var invalid = parsed.filter(function(c) { return !findChord(c); });
      if (valid.length < 2) {
        showToast("Need at least 2 valid chords." + (invalid.length ? " Unknown: " + invalid.join(", ") : ""));
        break;
      }
      if (invalid.length) showToast("Skipped unknown: " + invalid.join(", "));
      S.customSets.push({ name: name.trim(), chords: valid });
      saveState();
      break;
    }

    case "del_custom":
      S.customSets.splice(parseInt(param), 1);
      saveState();
      break;

    // ── Settings ──
    case "set_bpm":
      S.bpm = parseInt(param);
      break;

    case "set_volume":
      setVolume(parseInt(param) / 100);
      saveState();
      break;

    case "set_reverb":
      setReverb(parseInt(param) / 100);
      break;

    case "set_tone":
      S.tone = param;
      saveState();
      break;

    case "set_metronome_sound":
      S.metronomeSound = param; // "sine" | "woodblock" | "clap" | "hihat"
      saveState();
      break;

    case "set_a4_tuning":
      S.a4Tuning = Math.max(432, Math.min(446, parseInt(param)));
      saveState();
      break;

    case "set_goal":
      S.dailyGoal = parseInt(param);
      saveState();
      break;

    case "reset":
      resetProgress();
      break;

    case "undo_reset":
      undoReset();
      break;

    // ── Finger exercises ──
    case "complete_warmup":
      S.fingerWarmUpDone = true;
      completeFingerExercise(param || "P-OFF-1");
      break;

    case "skip_warmup":
      S.fingerWarmUpDone = true;
      break;

    case "complete_finger_exercise":
      completeFingerExercise(param);
      break;

    case "start_chord_change": {
      var parts = param.split(",");
      if (parts.length !== 2) break;
      S.chordChangePair = parts;
      S.chordChangeCount = 0;
      S.chordChangeTimer = 60;
      S.chordChangeActive = true;
      playSound("start");
      if (T.chordChange) clearInterval(T.chordChange);
      T.chordChange = setInterval(tickChordChange, 1000);
      break;
    }

    case "chord_change_tap":
      if (!S.chordChangeActive) break;
      S.chordChangeCount++;
      playSound("tick");
      break;

    case "stop_chord_change":
      finishChordChange();
      break;

    // ── MIDI Device/Profile actions ──
    case "setMidiDevice":
      S.activeMidiDeviceId = param;
      saveState();
      break;

    case "setMidiProfile":
      if(typeof setActiveMidiProfile === "function") setActiveMidiProfile(param);
      break;

    case "createDefaultPianoProfile":
      if(typeof createDefaultPianoProfile === "function") createDefaultPianoProfile();
      break;

    case "createDefaultGuitarProfile":
      if(typeof createDefaultGuitarProfile === "function") createDefaultGuitarProfile();
      break;

    case "openMidiSettings":
      S.screen = SCR.MIDI_SETTINGS;
      break;

    case "openMidiImport":
      S.screen = SCR.MIDI_IMPORT;
      break;

    // ── MIDI Import actions ──
    case "importMidiFile":
      if(typeof handleMidiImport === "function") handleMidiImport(param);
      return;

    case "assignMidiTrack": {
      var atParts = String(param).split("|");
      if(typeof setMidiTrackAssignment === "function") setMidiTrackAssignment(atParts[0], atParts[1]);
      break;
    }

    case "buildMidiSeedChart": {
      var seedChart = typeof buildSeedChartFromImportedMidi === "function"
        ? buildSeedChartFromImportedMidi(S.importedMidi, S.importedMidiAssignments, param)
        : null;
      S.importedMidiSeedPreview = seedChart;
      if(seedChart && typeof openEditor === "function"){
        openEditor("chart", seedChart);
      }
      break;
    }

    // ── Cloud Sync actions ──
    case "cloudSync":
      if(typeof syncSparkNow === "function") syncSparkNow();
      return;

    case "cloudPull":
      if(typeof pullSparkCloud === "function") pullSparkCloud();
      return;

    case "cloudLogout":
      if(typeof logoutSpark === "function") logoutSpark();
      break;

    case "cloudLoginPrompt": {
      var clEmail = prompt("Email:");
      var clPassword = prompt("Password:");
      if(clEmail && clPassword && typeof loginSpark === "function"){
        loginSpark(clEmail, clPassword).then(function(){ render(); });
      }
      return;
    }

    case "openCloudSettings":
      S.screen = SCR.CLOUD_SETTINGS;
      break;

    case "openCurriculum":
      S.screen = SCR.CURRICULUM;
      break;

    // ── Desktop / Release actions ──
    case "checkUpdates":
      if(typeof checkForDesktopUpdates === "function") checkForDesktopUpdates();
      return;

    case "exportBackup":
      if(typeof exportFullBackupDesktopAware === "function") exportFullBackupDesktopAware();
      return;

    case "exportFeedback":
      if(typeof exportFeedbackDesktopAware === "function") exportFeedbackDesktopAware();
      return;

    // ── Recommendation engine ──
    case "openRecommendations":
      S.screen = SCR.RECOMMENDATIONS;
      break;
    case "launchRecommendation":
      if(typeof launchRecommendationById === "function") launchRecommendationById(param);
      return;

    // ── Career mode ──
    case "openCareer":
      S.screen = SCR.CAREER;
      break;
    case "openCareerSong":
      if(typeof getCareerItem === "function"){
        var cSong = getCareerItem("songs", param);
        if(cSong) S.performSongId = param;
      }
      S.screen = SCR.PERFORM_SONG;
      break;

    // ── Insights ──
    case "openInsights":
      S.screen = SCR.INSIGHTS;
      break;

    // ── Challenge hub ──
    case "openChallengeHub":
      S.screen = SCR.CHALLENGES;
      break;
    case "claimChallengeReward":
      if(typeof claimChallengeReward === "function") claimChallengeReward(param);
      break;
    case "initChallenges":
      if(typeof initializeChallengesForCurrentCycle === "function") initializeChallengesForCurrentCycle();
      break;

    // ── Home dashboard ──
    case "openHome":
    case "openHomeDash":
      S.screen = SCR.HOME_DASH;
      break;
    case "refreshHome":
      if(typeof generateRecommendations === "function") generateRecommendations();
      if(typeof generatePersonalInsights === "function") generatePersonalInsights();
      break;

    // ── Practice plan ──
    case "openPracticePlan":
      S.screen = SCR.PLAN;
      break;

    // ── Onboarding flow ──
    case "openOnboarding":
      if(typeof startOnboarding === "function") startOnboarding();
      return;
    case "resumeOnboarding":
      if(typeof continueOnboarding === "function") continueOnboarding();
      return;

    // ── Settings ──
    case "openSettings":
      S.screen = SCR.SETTINGS;
      break;
  }

  render();
}

// ── Render ──
function render() {
  var root = document.getElementById("app");
  if (!root) return;

  // Onboarding check
  if (!S.onboardingComplete) {
    if (S._inPlacement) {
      root.innerHTML = placementTestPage();
    } else {
      root.innerHTML = onboardingPage();
    }
    return;
  }

  // Session screen
  if (S.screen === SCR.SESSION && S.sessionPlan) {
    root.innerHTML = headerHTML() + sessionPage();
    return;
  }

  // Stem player screen
  if (S.screen === SCR.STEM_PLAYER) {
    root.innerHTML = headerHTML() + stemsPlayerPage();
    return;
  }

  // Practice plan screen
  if (S.screen === SCR.PLAN) {
    root.innerHTML = headerHTML() + planPage();
    return;
  }

  // MIDI settings screen
  if (S.screen === SCR.MIDI_SETTINGS && typeof midiSettingsPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + midiSettingsPage();
    return;
  }

  // MIDI import screen
  if (S.screen === SCR.MIDI_IMPORT && typeof midiImportPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + midiImportPage();
    return;
  }

  // Cloud settings screen
  if (S.screen === SCR.CLOUD_SETTINGS && typeof cloudSettingsPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + cloudSettingsPage();
    return;
  }

  // Curriculum screen
  if (S.screen === SCR.CURRICULUM && typeof curriculumPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + curriculumPage();
    return;
  }

  // Performance mode screens
  if (S.screen === SCR.PERFORM_SONG) {
    root.innerHTML = headerHTML() + performSongPage();
    return;
  }
  if (S.screen === SCR.PERFORM) {
    root.innerHTML = headerHTML() + performPage();
    return;
  }
  if (S.screen === SCR.PERFORM_DONE) {
    root.innerHTML = headerHTML() + performDonePage();
    return;
  }

  // Calibration screen
  if (S.screen === SCR.CALIBRATION && typeof calibrationPage === "function") {
    root.innerHTML = headerHTML() + '<div style="padding:8px"><button class="btn" onclick="act(\'go_home\')">Back</button></div>' + calibrationPage();
    return;
  }

  // Onboarding flow screen (new)
  if (S.screen === SCR.ONBOARDING_FLOW && typeof onboardingFlowPage === "function") {
    root.innerHTML = onboardingFlowPage();
    return;
  }

  // Home dashboard screen
  if (S.screen === SCR.HOME_DASH && typeof homeDashboardPage === "function") {
    root.innerHTML = headerHTML() + homeDashboardPage();
    return;
  }

  // Recommendations screen
  if (S.screen === SCR.RECOMMENDATIONS && typeof recommendationsPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + recommendationsPage();
    return;
  }

  // Career mode screen
  if (S.screen === SCR.CAREER && typeof careerPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + careerPage();
    return;
  }

  // Insights dashboard screen
  if (S.screen === SCR.INSIGHTS && typeof insightsDashboardPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + insightsDashboardPage();
    return;
  }

  // Challenge hub screen
  if (S.screen === SCR.CHALLENGES && typeof challengeHubPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + challengeHubPage();
    return;
  }

  // Settings screen
  if (S.screen === SCR.SETTINGS && typeof settingsPage === "function") {
    root.innerHTML = headerHTML() + '<button onclick="act(\'go_home\')" style="margin:8px">Back</button>' + settingsPage();
    return;
  }

  // Legacy active session
  if (S.active && S.chord) {
    root.innerHTML = headerHTML() + tabNavHTML() + legacySessionHTML();
    return;
  }

  // Home screen with tabs
  var html = headerHTML() + tabNavHTML();
  html += '<main class="tab-content">';
  switch (S.tab) {
    case TAB.PRACTICE: html += practiceTab(); break;
    case TAB.GAMES:    html += gamesTab(); break;
    case TAB.SONGS:    html += songsTab(); break;
    case TAB.TOOLS:    html += toolsTab(); break;
  }
  html += '</main>';
  root.innerHTML = html;
}

// ── Keyboard shortcuts ──
document.addEventListener("keydown", function(e) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      // In perform mode: spacebar = simulate note hit for testing
      if (S.screen === SCR.PERFORM && S.performPlaying && S.performChart && !S.performPaused) {
        var nowSec = PerformanceTransport.now();
        var chart = S.performChart;
        for (var si = 0; si < chart.events.length; si++) {
          var evt = chart.events[si];
          if (evt._scored) continue;
          var delta = Math.abs(nowSec - evt.t) * 1000;
          if (delta < (S.performWindowMissMs || 220)) {
            // Inject the exact target data the scorer expects
            if (evt.target && Array.isArray(evt.target.midi) && evt.target.midi.length) {
              // Block chord: scorer checks heldMidiNotes
              PerformanceInput.heldMidiNotes = {};
              for (var mi = 0; mi < evt.target.midi.length; mi++) {
                PerformanceInput.heldMidiNotes[evt.target.midi[mi]] = true;
              }
              PerformanceInput.recentMidiNoteOns.push({note: evt.target.midi[0], tSec: nowSec});
            } else if (evt.target && typeof evt.target.midi === "number") {
              // LH note: scorer checks single MIDI note
              PerformanceInput.heldMidiNotes = {};
              PerformanceInput.heldMidiNotes[evt.target.midi] = true;
              PerformanceInput.recentMidiNoteOns.push({note: evt.target.midi, tSec: nowSec});
            }
            // Also set pitch classes as fallback
            var pc = evt.target && evt.target.notes ? evt.target.notes : ["C"];
            PerformanceInput.latestPitchClasses = Array.isArray(pc) ? pc.slice() : [pc];
            PerformanceInput._updatePitchClasses && PerformanceInput._updatePitchClasses();
            break;
          }
        }
        break;
      }
      if (S.active || S.screen === SCR.SESSION) act("pause");
      break;
    case "ArrowLeft":
      S.bpm = Math.max(40, S.bpm - 5);
      S.adaptiveBpm = Math.max(40, S.adaptiveBpm - 5);
      render();
      break;
    case "ArrowRight":
      S.bpm = Math.min(200, S.bpm + 5);
      S.adaptiveBpm = Math.min(200, S.adaptiveBpm + 5);
      render();
      break;
    case "m": case "M":
      if (metronomeInterval) stopMetronome();
      else startMetronome(S.adaptiveBpm || S.bpm);
      break;
    case "d": case "D":
      act("toggle_dark");
      break;
    case "?":
      showToast("Space:Pause | \u2190\u2192:BPM | M:Metro | D:Dark | 1-4:Tabs");
      break;
    case "1": act("tab", TAB.PRACTICE); break;
    case "2": act("tab", TAB.GAMES); break;
    case "3": act("tab", TAB.SONGS); break;
    case "4": act("tab", TAB.TOOLS); break;
  }
});

// ── Init ──
window.addEventListener("DOMContentLoaded", function() {
  loadState();
  recoverFromCrash();
  if (S.darkMode) document.body.classList.add("dark");
  if (S.focusMode) document.body.classList.add("focus-mode");
  render();
});
