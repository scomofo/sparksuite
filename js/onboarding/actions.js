(function(){
  function getOnboardingActionStateFacade(){
    return typeof SparkState !== "undefined" ? SparkState : null;
  }

  function getOnboardingActionStateRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function") return SparkState.getRoot();
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function readOnboardingActionState(path, fallback){
    var facade = getOnboardingActionStateFacade();
    var root = getOnboardingActionStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(facade && typeof facade.read === "function") return facade.read(path, fallback);
    if(!cursor) return fallback;
    for(i = 0; i < parts.length; i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function writeOnboardingActionState(path, value){
    var facade = getOnboardingActionStateFacade();
    var root = getOnboardingActionStateRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(facade && typeof facade.write === "function") return facade.write(path, value);
    if(!cursor || !parts.length) return value;
    for(i = 0; i < parts.length - 1; i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }

  function getOnboardingStateSnapshot(){
    var onboarding = readOnboardingActionState("onboarding", null);
    if(!onboarding || typeof onboarding !== "object" || Array.isArray(onboarding)){
      if(typeof resetOnboarding === "function") resetOnboarding();
      onboarding = readOnboardingActionState("onboarding", null);
    }
    if(!onboarding || typeof onboarding !== "object" || Array.isArray(onboarding)) onboarding = {};
    return onboarding;
  }

  function setOnboardingInstrument(value){
    getOnboardingStateSnapshot();
    writeOnboardingActionState(["onboarding", "instrument"], value);
    saveState();
  }

  function setOnboardingSkillLevel(value){
    getOnboardingStateSnapshot();
    writeOnboardingActionState(["onboarding", "skillLevel"], value);
    saveState();
  }

  function toggleOnboardingGoal(goal){
    var arr = readOnboardingActionState(["onboarding", "goals"], []);
    var idx = arr.indexOf(goal);
    if(idx >= 0){
      arr.splice(idx, 1);
    }else{
      arr.push(goal);
    }
    writeOnboardingActionState(["onboarding", "goals"], arr);
    saveState();
  }

  function markOnboardingMidiSetupDone(){
    getOnboardingStateSnapshot();
    writeOnboardingActionState(["onboarding", "midiSetupDone"], true);
    saveState();
  }

  function markOnboardingCalibrationDone(){
    getOnboardingStateSnapshot();
    writeOnboardingActionState(["onboarding", "calibrationDone"], true);
    saveState();
  }

  function markOnboardingStarterUnlocksDone(){
    getOnboardingStateSnapshot();
    writeOnboardingActionState(["onboarding", "starterContentUnlocked"], true);
    saveState();
  }

  function applyStarterUnlocksFromOnboarding(){
    var instrument = readOnboardingActionState(["onboarding", "instrument"], null);
    var level = readOnboardingActionState(["onboarding", "skillLevel"], null);
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
    if(instrument === "ukulele"){
      if(level === "beginner"){
        unlockStarterIds([
          "uke_01",
          "uke_02"
        ]);
      }else if(level === "early_intermediate"){
        unlockStarterIds([
          "uke_02",
          "uke_03",
          "uke_04"
        ]);
      }else{
        unlockStarterIds([
          "uke_03",
          "uke_04",
          "uke_05"
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
    if(readOnboardingActionState(["onboarding", "instrument"], null) === "piano") return generateRecommendations("piano");
    if(readOnboardingActionState(["onboarding", "instrument"], null) === "ukulele") return generateRecommendations("guitar");
    return generateRecommendations("guitar");
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
