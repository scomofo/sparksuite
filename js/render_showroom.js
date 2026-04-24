// js/render_showroom.js
// Showroom-specific routing extracted from the render shell so the shell gate
// can stay focused on launcher handling and chrome visibility.

function _renderShowroomOverride(){
  if (typeof S !== "undefined" && S._showroomOverride) {
    var showroomRoute = {
      "lesson":          typeof SparkLesson          !== "undefined" && SparkLesson.render,
      "path":            typeof SparkPath            !== "undefined" && SparkPath.render,
      "curriculum":      typeof SparkCurriculumDashboard !== "undefined" && SparkCurriculumDashboard.render,
      "syllabus":        typeof SparkCourseSyllabus  !== "undefined" && SparkCourseSyllabus.render,
      "profile":         typeof SparkProfileScreen   !== "undefined" && SparkProfileScreen.render,
      "leaderboard":     typeof SparkLeaderboard     !== "undefined" && SparkLeaderboard.render,
      "library":         typeof SparkSongLibrary     !== "undefined" && SparkSongLibrary.render,
      "tuner":           typeof SparkTuner           !== "undefined" && SparkTuner.render,
      "tools":           typeof SparkTuner           !== "undefined" && SparkTuner.render,
      "song-details":    typeof SparkSongDetails     !== "undefined" && SparkSongDetails.render,
      "practice-metro":  typeof SparkPracticeMetro   !== "undefined" && SparkPracticeMetro.render,
      "session-summary": typeof SparkSessionSummary  !== "undefined" && SparkSessionSummary.render
    };
    var overrideFn = showroomRoute[S._showroomOverride];
    if (typeof overrideFn === "function") {
      document.getElementById("header").style.display = "none";
      _writeAppHtml(overrideFn());
      return true;
    }
  }

  if (typeof S !== "undefined" && typeof SCR !== "undefined") {
    var legacyToShowroom = {};
    legacyToShowroom[SCR.COMPLETE] = typeof SparkSessionSummary !== "undefined" && SparkSessionSummary.render;
    var legacyFn = legacyToShowroom[S.screen];
    if (typeof legacyFn === "function") {
      document.getElementById("header").style.display = "none";
      _writeAppHtml(legacyFn());
      return true;
    }
  }

  return false;
}
