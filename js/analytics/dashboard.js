function analyticsDashboardPage(){
  var report = generatePracticeReport();
  var h = '<div class="card">';
  h += '<div><b>Analytics Dashboard</b></div>';
  h += '<div>Total Practice Minutes: '+report.totalPracticeMinutes+'</div>';
  h += '<div>Practice Sessions: '+report.sessions+'</div>';
  h += '<div>Average Accuracy: '+Math.round(report.avgAccuracy*100)+'%</div>';
  h += '<div>Current Streak: '+report.currentStreak+'</div>';
  h += '<div>Level: '+report.level+'</div>';
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Accuracy Trend</b></div>';
  h += renderLineChart(S.analytics.accuracyHistory, "accuracy", 300, 120);
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>Practice Minutes</b></div>';
  h += renderLineChart(S.analytics.practiceHistory, "minutes", 300, 120);
  h += '</div>';

  h += '<div class="card">';
  h += '<div><b>XP Progress</b></div>';
  h += renderLineChart(S.analytics.xpHistory, "xp", 300, 120);
  h += '</div>';

  return h;
}
