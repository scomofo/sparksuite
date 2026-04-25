var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

global.window = global;
global.escHTML = function(value) { return String(value); };
global.S = {
  settings: {},
  rhythmHighwaySnapshot: {
    gameplay: {
      score: 1200,
      maxCombo: 8,
      accuracy: 0.85
    },
    songTimeSec: 0,
    notes: []
  },
  rhythmHighwayHeldMask: 1,
  rhythmHighwayFeedback: "",
  rhythmHighwayLoop: null,
  rhythmHighwayResult: null,
  _resultFixture: {
    gameplay: {
      score: 1200,
      maxCombo: 8,
      accuracy: 0.85
    },
    learning: {
      skills: [],
      weakAreas: []
    }
  },
  rhythmHighwayLaunchContext: {
    instrument: "guitar"
  }
};
global.sparkCore = {
  getAccessibilitySettings: function() {
    return {
      reducedMotion: true,
      laneLabels: false,
      colorblindSafeLanes: true,
      noteSize: "large"
    };
  }
};
global.SparkEnginePresetRegistry = {
  all: function() {
    return {
      spark_learning: {}
    };
  }
};

loadJS("js/sparksuite/settings/accessibility_settings.js");
loadJS("js/pages/rhythm_highway.js");

var activeHtml = rhythmHighwayPage();
assert.ok(activeHtml.indexOf(">1</button>") >= 0);
assert.ok(activeHtml.indexOf(">G</div>") === -1);
assert.ok(activeHtml.indexOf("#117733") >= 0);
S.rhythmHighwayResult = S._resultFixture;
assert.ok(rhythmHighwayPage().indexOf("animation:bn") === -1);

global.sparkCore.getAccessibilitySettings = function() {
  return {
    reducedMotion: false,
    laneLabels: true,
    colorblindSafeLanes: false,
    noteSize: "normal"
  };
};

S.rhythmHighwayResult = null;
activeHtml = rhythmHighwayPage();
assert.ok(activeHtml.indexOf(">G</div>") >= 0);
assert.ok(activeHtml.indexOf("#117733") === -1);

console.log("PASS: rhythm highway respects accessibility lane labels, palette, and reduced motion");
