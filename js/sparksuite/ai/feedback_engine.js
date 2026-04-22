(function() {
  'use strict';

  class SparkFeedbackEngine {
    generate(performance) {
      var rules = window.SparkFeedbackRules || [];
      var messages = [];

      for (var i = 0; i < rules.length; i++) {
        try {
          if (rules[i].condition(performance)) {
            messages.push(rules[i].message);
          }
        } catch (e) {
          // skip rules that error
        }
      }

      return messages;
    }

    generatePrimary(performance) {
      var messages = this.generate(performance);
      return messages.length > 0 ? messages[0] : null;
    }
  }

  window.SparkFeedbackEngine = SparkFeedbackEngine;
})();
