(function(root) {
  "use strict";

  function clearShowroomRoutingState(state) {
    // Showroom routing fields are UI-only hints used by the launcher/showroom
    // surfaces; session and lesson progression remain owned by SparkCore.
    if (!state) return false;
    state._showroomOverride = null;
    state._showroomLessonId = null;
    state.showroomReturnView = null;
    state.showroomLessonId = null;
    state.launcherView = null;
    return true;
  }

  root.SparkShowroomRoutingState = {
    clear: clearShowroomRoutingState
  };
})(typeof window !== "undefined" ? window : globalThis);
