function analyticsDashboardPage(){
  var report = generatePracticeReport();
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Analytics Dashboard</div>';
  h += '<div>Total Practice Minutes: '+report.totalPracticeMinutes+'</div>';
  h += '<div>Practice Sessions: '+report.sessions+'</div>';
  h += '<div>Average Accuracy: '+Math.round(report.avgAccuracy*100)+'%</div>';
  h += '<div>Current Streak: '+report.currentStreak+'</div>';
  h += '<div>Level: '+report.level+'</div>';
  h += '</div>';

  var analytics = S.analytics || {};
  h += '<div class="card">';
  h += '<div class="card-section-heading">Accuracy Trend</div>';
  h += renderLineChart(analytics.accuracyHistory || [], "accuracy", 300, 120);
  h += '</div>';

  h += '<div class="card">';
  h += '<div class="card-section-heading">Practice Minutes</div>';
  h += renderLineChart(analytics.practiceHistory || [], "minutes", 300, 120);
  h += '</div>';

  h += '<div class="card">';
  h += '<div class="card-section-heading">XP Progress</div>';
  h += renderLineChart(analytics.xpHistory || [], "xp", 300, 120);
  h += '</div>';

  return h;
}
