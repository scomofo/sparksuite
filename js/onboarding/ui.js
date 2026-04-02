function onboardingPage(){
  var step = getCurrentOnboardingStep();
  var h = '<div class="card mb16">';
  h += '<div><b>Setup</b></div>';
  h += '<div class="muted">Let\'s get Spark ready for you.</div>';
  h += '</div>';
  if(step === "welcome") h += renderOnboardingWelcome();
  if(step === "instrument") h += renderOnboardingInstrument();
  if(step === "skill_level") h += renderOnboardingSkillLevel();
  if(step === "goals") h += renderOnboardingGoals();
  if(step === "midi_setup") h += renderOnboardingMidiSetup();
  if(step === "calibration") h += renderOnboardingCalibration();
  if(step === "starter_unlocks") h += renderOnboardingStarterUnlocks();
  if(step === "first_plan") h += renderOnboardingFirstPlan();
  if(step === "first_recommendations") h += renderOnboardingFirstRecommendations();
  if(step === "finish") h += renderOnboardingFinish();
  h += renderOnboardingNav();
  return h;
}

function renderOnboardingWelcome(){
  var h = '<div class="card mb16">';
  h += '<div><b>Welcome to Spark</b></div>';
  h += '<div>We\'ll set up your instrument, goals, and first practice path.</div>';
  h += '</div>';
  return h;
}

function renderOnboardingInstrument(){
  var h = '<div class="card mb16">';
  h += '<div><b>Choose Your Instrument</b></div>';
  h += '<button onclick="setOnboardingInstrument(\'guitar\')">Guitar</button> ';
  h += '<button onclick="setOnboardingInstrument(\'piano\')">Piano</button>';
  h += '<div style="margin-top:8px">Selected: '+escHTML(S.onboarding.instrument || "none")+'</div>';
  h += '</div>';
  return h;
}

function renderOnboardingSkillLevel(){
  var h = '<div class="card mb16">';
  h += '<div><b>Choose Your Level</b></div>';
  h += '<button onclick="setOnboardingSkillLevel(\'beginner\')">Beginner</button> ';
  h += '<button onclick="setOnboardingSkillLevel(\'early_intermediate\')">Early Intermediate</button> ';
  h += '<button onclick="setOnboardingSkillLevel(\'intermediate\')">Intermediate+</button>';
  h += '<div style="margin-top:8px">Selected: '+escHTML(S.onboarding.skillLevel || "none")+'</div>';
  h += '</div>';
  return h;
}

function renderOnboardingGoals(){
  var goals = S.onboarding.goals || [];
  var opts = ["chords","rhythm","lead","left_hand","melody","songs","technique"];
  var h = '<div class="card mb16">';
  h += '<div><b>What do you want to focus on?</b></div>';
  for(var i=0;i<opts.length;i++){
    var selected = goals.indexOf(opts[i]) >= 0;
    h += '<button onclick="toggleOnboardingGoal(\''+opts[i]+'\')" style="margin:4px;opacity:'+(selected?1:0.6)+'">'+escHTML(opts[i])+'</button>';
  }
  h += '</div>';
  return h;
}

function renderOnboardingMidiSetup(){
  var h = '<div class="card mb16">';
  h += '<div><b>MIDI Setup</b></div>';
  h += '<div>Connect your MIDI device and choose a profile.</div>';
  h += '<button onclick="act(\'openMidiSettings\')">Open MIDI Settings</button> ';
  h += '<button onclick="markOnboardingMidiSetupDone()">Mark Done</button>';
  h += '</div>';
  return h;
}

function renderOnboardingCalibration(){
  var h = '<div class="card mb16">';
  h += '<div><b>Latency Calibration</b></div>';
  h += '<div>Calibrate your timing so scoring feels accurate.</div>';
  h += '<button onclick="act(\'openCalibration\')">Open Calibration</button> ';
  h += '<button onclick="markOnboardingCalibrationDone()">Mark Done</button>';
  h += '</div>';
  return h;
}

function renderOnboardingStarterUnlocks(){
  var h = '<div class="card mb16">';
  h += '<div><b>Starter Content</b></div>';
  h += '<div>We\'ll unlock your starter lessons and packs now.</div>';
  h += '<button onclick="applyStarterUnlocksFromOnboarding()">Unlock Starter Content</button>';
  h += '</div>';
  return h;
}

function renderOnboardingFirstPlan(){
  var h = '<div class="card mb16">';
  h += '<div><b>Your First Practice Plan</b></div>';
  h += '<button onclick="generateInitialPracticePlanFromOnboarding()">Generate Plan</button>';
  h += '</div>';
  return h;
}

function renderOnboardingFirstRecommendations(){
  var h = '<div class="card mb16">';
  h += '<div><b>Your First Recommendations</b></div>';
  h += '<button onclick="generateInitialRecommendationsFromOnboarding()">Generate Recommendations</button>';
  h += '</div>';
  return h;
}

function renderOnboardingFinish(){
  var h = '<div class="card mb16">';
  h += '<div><b>You\'re Ready</b></div>';
  h += '<div>Your setup is complete. Let\'s head to your dashboard.</div>';
  h += '<button onclick="finishOnboardingFlow()">Go to Home</button>';
  h += '</div>';
  return h;
}

function renderOnboardingNav(){
  var h = '<div class="card">';
  h += '<button onclick="goToPreviousOnboardingStep()">Back</button> ';
  h += '<button onclick="goToNextOnboardingStep()">Next</button>';
  h += '</div>';
  return h;
}
