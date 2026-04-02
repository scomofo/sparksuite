(function(){

  function setOnboardingInstrument(value){
    S.onboarding.instrument = value;
    saveState();
  }

  function setOnboardingSkillLevel(value){
    S.onboarding.skillLevel = value;
    saveState();
  }

  function toggleOnboardingGoal(goal){
    var arr = S.onboarding.goals || [];
    var idx = arr.indexOf(goal);
    if(idx >= 0){
      arr.splice(idx, 1);
    }else{
      arr.push(goal);
    }
    S.onboarding.goals = arr;
    saveState();
  }

  function markOnboardingMidiSetupDone(){
    S.onboarding.midiSetupDone = true;
    saveState();
  }

  function markOnboardingCalibrationDone(){
    S.onboarding.calibrationDone = true;
    saveState();
  }

  function markOnboardingStarterUnlocksDone(){
    S.onboarding.starterContentUnlocked = true;
    saveState();
  }

  function applyStarterUnlocksFromOnboarding(){
    var instrument = S.onboarding.instrument;
    var level = S.onboarding.skillLevel;
    if(instrument === "guitar"){
      if(level === "beginner"){
        unlockStarterIds([
          "lesson_open_chords_01",
          "pack_beginner_open_chords_01",
          "pack_beginner_songs_01"
        ]);
      }else if(level === "early_intermediate"){
        unlockStarterIds([
          "pack_strumming_01",
          "pack_beginner_songs_01",
          "lesson_rhythm_intro_01"
        ]);
      }else{
        unlockStarterIds([
          "pack_barre_intro_01",
          "pack_rhythm_guitar_01"
        ]);
      }
    }
    if(instrument === "piano"){
      if(level === "beginner"){
        unlockStarterIds([
          "lesson_piano_intro_01",
          "pack_beginner_piano_01",
          "pack_block_chords_01"
        ]);
      }else if(level === "early_intermediate"){
        unlockStarterIds([
          "pack_left_hand_01",
          "pack_melody_basics_01"
        ]);
      }else{
        unlockStarterIds([
          "pack_progressions_01",
          "pack_accompaniment_01"
        ]);
      }
    }
    markOnboardingStarterUnlocksDone();
  }

  function unlockStarterIds(ids){
    for(var i=0;i<ids.length;i++){
      if(typeof unlockContent === "function"){
        unlockContent("lessons", ids[i]);
        unlockContent("songs", ids[i]);
        unlockContent("exercises", ids[i]);
      }
    }
  }

  function generateInitialPracticePlanFromOnboarding(){
    if(typeof generateDailyPracticePlan !== "function") return null;
    return generateDailyPracticePlan();
  }

  function generateInitialRecommendationsFromOnboarding(){
    if(typeof generateRecommendations !== "function") return [];
    return generateRecommendations(S.onboarding.instrument === "piano" ? "piano" : "guitar");
  }

  window.setOnboardingInstrument = setOnboardingInstrument;
  window.setOnboardingSkillLevel = setOnboardingSkillLevel;
  window.toggleOnboardingGoal = toggleOnboardingGoal;
  window.markOnboardingMidiSetupDone = markOnboardingMidiSetupDone;
  window.markOnboardingCalibrationDone = markOnboardingCalibrationDone;
  window.markOnboardingStarterUnlocksDone = markOnboardingStarterUnlocksDone;
  window.applyStarterUnlocksFromOnboarding = applyStarterUnlocksFromOnboarding;
  window.generateInitialPracticePlanFromOnboarding = generateInitialPracticePlanFromOnboarding;
  window.generateInitialRecommendationsFromOnboarding = generateInitialRecommendationsFromOnboarding;

})();
