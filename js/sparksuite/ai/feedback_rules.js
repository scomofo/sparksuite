(function() {
  'use strict';

  window.SparkFeedbackRules = [
    {
      id: 'late_timing',
      condition: function(data) { return data.timingError > 100; },
      message: 'Your timing is a bit late. Try to anticipate the beat slightly earlier.'
    },
    {
      id: 'early_timing',
      condition: function(data) { return data.timingError < -100; },
      message: 'You are hitting notes too early. Relax and wait for the beat.'
    },
    {
      id: 'low_accuracy',
      condition: function(data) { return data.accuracy < 0.7; },
      message: 'Note accuracy is low. Focus on hitting the correct frets before speeding up.'
    },
    {
      id: 'inconsistent',
      condition: function(data) { return data.consistency < 0.6; },
      message: 'Your playing is inconsistent. Try practicing this section at a slower tempo.'
    },
    {
      id: 'weak_lanes',
      condition: function(data) { return data.weakLanes && data.weakLanes.length > 0; },
      message: 'Some strings need extra practice. Focus on your weaker lanes individually.'
    },
    {
      id: 'good_accuracy',
      condition: function(data) { return data.accuracy > 0.9; },
      message: 'Great accuracy! You are hitting most notes correctly.'
    },
    {
      id: 'perfect_run',
      condition: function(data) {
        return data.accuracy >= 0.95 && Math.abs(data.averageTiming) < 40;
      },
      message: 'Perfect run! Outstanding accuracy and timing.'
    }
  ];
})();
