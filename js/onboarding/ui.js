function onboardingPage(){
  var step = getCurrentOnboardingStep();
  if(step === "welcome" && typeof SparkOnboardingWelcome !== "undefined" && SparkOnboardingWelcome && typeof SparkOnboardingWelcome.render === "function"){
    return SparkOnboardingWelcome.render({
      title: "SparkSuite",
      subtitle: "Let's tune the app to you",
      body: "This setup keeps the first lesson grounded in your instrument, goals, timing, and starter content.",
      ctaLabel: "Start setup",
      ctaAction: "act('onboardingNext')",
      signInLabel: "Already set up?",
      signInAction: "act('onboardingNext')"
    });
  }
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Setup</div>';
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
  h += '<div class="card-section-heading">Welcome to Spark</div>';
  h += '<div>We\'ll set up your instrument, goals, and first practice path.</div>';
  h += '</div>';
  return h;
}

function renderOnboardingInstrument(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Choose Your Instrument</div>';
  h += '<button onclick="act(\'onboardingSetInstrument\',\'guitar\')">Guitar</button> ';
  h += '<button onclick="act(\'onboardingSetInstrument\',\'piano\')">Piano</button> ';
  h += '<button onclick="act(\'onboardingSetInstrument\',\'ukulele\')">Ukulele</button>';
  h += '<div style="margin-top:8px">Selected: '+escHTML(S.onboarding.instrument || "none")+'</div>';
  h += '</div>';
  return h;
}

function renderOnboardingSkillLevel(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Choose Your Level</div>';
  h += '<button onclick="act(\'onboardingSetSkillLevel\',\'beginner\')">Beginner</button> ';
  h += '<button onclick="act(\'onboardingSetSkillLevel\',\'early_intermediate\')">Early Intermediate</button> ';
  h += '<button onclick="act(\'onboardingSetSkillLevel\',\'intermediate\')">Intermediate+</button>';
  h += '<div style="margin-top:8px">Selected: '+escHTML(S.onboarding.skillLevel || "none")+'</div>';
  h += '</div>';
  return h;
}

function renderOnboardingGoals(){
  var goals = S.onboarding.goals || [];
  var opts = ["chords","rhythm","lead","left_hand","melody","songs","technique"];
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">What do you want to focus on?</div>';
  for(var i=0;i<opts.length;i++){
    var selected = goals.indexOf(opts[i]) >= 0;
    h += '<button onclick="act(\'onboardingToggleGoal\',\''+opts[i]+'\')" style="margin:4px;opacity:'+(selected?1:0.6)+'">'+escHTML(opts[i])+'</button>';
  }
  h += '</div>';
  return h;
}

function renderOnboardingMidiSetup(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">MIDI Setup</div>';
  h += '<div>Connect your MIDI device and choose a profile.</div>';
  h += '<button onclick="act(\'openMidiSettings\')">Open MIDI Settings</button> ';
  h += '<button onclick="act(\'onboardingMidiSetupDone\')">Mark Done</button>';
  h += '</div>';
  return h;
}

function renderOnboardingCalibration(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Latency Calibration</div>';
  h += '<div>Calibrate your timing so scoring feels accurate.</div>';
  h += '<button onclick="act(\'openCalibration\')">Open Calibration</button> ';
  h += '<button onclick="act(\'onboardingCalibrationDone\')">Mark Done</button>';
  h += '</div>';
  return h;
}

function renderOnboardingStarterUnlocks(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Starter Content</div>';
  h += '<div>We\'ll unlock your starter lessons and packs now.</div>';
  h += '<button onclick="act(\'onboardingUnlockStarterContent\')">Unlock Starter Content</button>';
  h += '</div>';
  return h;
}

function renderOnboardingFirstPlan(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Your First Practice Plan</div>';
  h += '<button onclick="act(\'onboardingGeneratePlan\')">Generate Plan</button>';
  h += '</div>';
  return h;
}

function renderOnboardingFirstRecommendations(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">Your First Recommendations</div>';
  h += '<button onclick="act(\'onboardingGenerateRecommendations\')">Generate Recommendations</button>';
  h += '</div>';
  return h;
}

function renderOnboardingFinish(){
  var h = '<div class="card mb16">';
  h += '<div class="card-section-heading">You\'re Ready</div>';
  h += '<div>Your setup is complete. Let\'s head to your dashboard.</div>';
  h += '<button onclick="act(\'onboardingFinish\')">Go to Home</button>';
  h += '</div>';
  return h;
}

function renderOnboardingNav(){
  var h = '<div class="card">';
  h += '<button onclick="act(\'onboardingBack\')">Back</button> ';
  h += '<button onclick="act(\'onboardingNext\')">Next</button>';
  h += '</div>';
  return h;
}
