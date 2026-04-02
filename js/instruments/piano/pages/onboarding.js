/* PianoSpark - Onboarding (5 screens) */

function onboardingPage() {
  var step = S.onboardingStep || 0;

  // Step dots
  var dots = '<div class="onboarding-dots">';
  for (var i = 0; i < 5; i++) {
    var cls = i === step ? "active" : (i < step ? "done" : "");
    dots += '<div class="onboarding-dot ' + cls + '"></div>';
  }
  dots += '</div>';

  var html = '<div class="onboarding">';

  switch (step) {
    case 0: // Welcome
      html += '<h1>Welcome to PianoSpark</h1>';
      html += '<p>Let\'s find where you are so we can skip what you already know.</p>';
      html += dots;
      html += '<button class="btn btn-lg btn-accent" onclick="act(\'onboard_never\')">I\'ve never played piano</button>';
      html += '<div style="margin:8px 0"><button class="btn btn-lg" onclick="act(\'onboard_placement\')">I know some chords</button></div>';
      break;

    case 1: // Keyboard size
      html += '<h2>Your Keyboard</h2>';
      html += '<p>What are you playing on?</p>';
      html += dots;
      html += '<div class="keyboard-sizes">';
      KEYBOARD_SIZES.forEach(function(ks) {
        var selected = S.keyboardSize === ks.keys ? " selected" : "";
        html += '<div class="keyboard-size-btn' + selected + '" onclick="act(\'set_keyboard\',' + ks.keys + ')">';
        html += '<strong>' + ks.label + '</strong>';
        if (!ks.lhAvailable) html += '<br><span class="text-muted">RH only \u2014 LH bass not available</span>';
        else if (ks.lhLimited) html += '<br><span class="text-muted">LH limited \u2014 some patterns adjusted</span>';
        html += '</div>';
      });
      html += '</div>';
      html += '<div style="margin-top:16px"><button class="btn btn-accent" onclick="act(\'onboard_next\')">Next</button></div>';
      break;

    case 2: // Style preferences
      html += '<h2>Your Vibe</h2>';
      html += '<p>Pick styles you want to play (select any):</p>';
      html += dots;
      html += '<div class="style-chips">';
      STYLE_PREFS.forEach(function(sp) {
        var selected = S.stylePrefs.indexOf(sp) >= 0 ? " selected" : "";
        html += '<div class="style-chip' + selected + '" onclick="act(\'toggle_style_pref\',\'' + sp + '\')">' + sp + '</div>';
      });
      html += '</div>';
      html += '<div style="margin-top:16px"><button class="btn btn-accent" onclick="act(\'onboard_next\')">Next</button></div>';
      break;

    case 3: // Implementation intention (stickiness #2)
      html += '<h2>Your Practice Trigger</h2>';
      html += '<p>Research shows that linking practice to a daily habit doubles follow-through.</p>';
      html += dots;
      html += '<div class="intention-template">Complete this sentence:</div>';
      html += '<div style="font-weight:700;margin:8px 0">"When I <span style="color:var(--accent)">[daily event]</span>, I will open PianoSpark."</div>';
      html += '<input class="intention-input" type="text" placeholder="e.g. finish dinner" value="' + escHTML(S.practiceIntention) + '" onchange="act(\'set_intention\',this.value)" />';
      html += '<div class="text-muted" style="margin-top:8px">Examples: finish dinner, morning coffee is ready, sit down after work</div>';
      html += '<div style="margin-top:16px"><button class="btn btn-accent" onclick="act(\'onboard_next\')">Next</button></div>';
      break;

    case 4: // Ready to play
      html += '<h1>\u{1F3B9}</h1>';
      html += '<h2>Ready to Play!</h2>';
      html += '<p>Session 1 awaits. You\'ll learn your first chord in under 2 minutes.</p>';
      html += dots;
      if (S.practiceIntention) {
        html += ifThenCard("When I " + S.practiceIntention + ", I will open PianoSpark.");
      }
      html += '<div style="margin-top:16px"><button class="btn btn-lg btn-accent" onclick="act(\'onboard_complete\')">Start Your First Session</button></div>';
      break;
  }

  // Back button (except step 0)
  if (step > 0) {
    html += '<div style="margin-top:12px"><button class="btn btn-sm btn-secondary" onclick="act(\'onboard_back\')">Back</button></div>';
  }

  html += '</div>';
  return html;
}

// Placement test screen
function placementTestPage() {
  var testIdx = S._placementIdx || 0;
  if (testIdx >= PLACEMENT_TESTS.length) testIdx = PLACEMENT_TESTS.length - 1;
  var test = PLACEMENT_TESTS[testIdx];

  var html = '<div class="onboarding">';
  html += '<h2>Placement Test</h2>';
  html += '<p>Let\'s see what you already know. No pressure!</p>';
  html += '<div class="placement-prompt">' + escHTML(test.prompt) + '</div>';
  html += '<div class="placement-btns">';
  html += '<button class="btn btn-accent" onclick="act(\'placement_pass\')">Yes, I can play that</button>';
  html += '<button class="btn btn-secondary" onclick="act(\'placement_fail\')">Not yet</button>';
  html += '</div>';
  html += '<div style="margin-top:16px"><button class="btn btn-sm btn-secondary" onclick="act(\'skip_placement\')">Skip test \u2192 Session 1</button></div>';
  html += '</div>';
  return html;
}
