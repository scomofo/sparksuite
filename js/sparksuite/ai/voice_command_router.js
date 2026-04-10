(function() {
  /**
   * SparkVoiceCommandRouter -- maps spoken text to playback/practice actions.
   */
  var COMMANDS = [
    { patterns: ["slow", "slower", "slow down", "slow this down"], action: "slow" },
    { patterns: ["fast", "faster", "speed up"],                    action: "fast" },
    { patterns: ["loop", "repeat", "loop this", "loop this part"], action: "loop" },
    { patterns: ["easier", "make it easier", "simplify"],          action: "simplify" },
    { patterns: ["harder", "make it harder", "challenge"],         action: "challenge" },
    { patterns: ["stop", "pause", "hold"],                         action: "pause" },
    { patterns: ["play", "go", "start", "resume", "continue"],    action: "play" },
    { patterns: ["restart", "again", "from the top"],              action: "restart" },
    { patterns: ["skip", "next"],                                  action: "skip" }
  ];

  function VoiceCommandRouter() {}

  /**
   * Route spoken text to an action.
   * @param {string} text
   * @returns {Object} { action, raw }
   */
  VoiceCommandRouter.prototype.route = function(text) {
    if (!text) return { action: "none", raw: text };
    var lower = text.toLowerCase().trim();

    for (var i = 0; i < COMMANDS.length; i++) {
      var cmd = COMMANDS[i];
      for (var j = 0; j < cmd.patterns.length; j++) {
        if (lower.indexOf(cmd.patterns[j]) >= 0) {
          return { action: cmd.action, raw: text };
        }
      }
    }

    return { action: "none", raw: text };
  };

  window.SparkVoiceCommandRouter = VoiceCommandRouter;
})();
