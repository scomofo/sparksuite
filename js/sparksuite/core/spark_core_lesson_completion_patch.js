(function() {
  function getActiveCore() {
    return window.sparkCore || window.SparkCoreInstance || window.sparkSuiteCore || null;
  }

  function activeLessonId(core) {
    if (core && core.currentPlan && core.currentPlan.lesson && core.currentPlan.lesson.id) return core.currentPlan.lesson.id;
    if (typeof S !== "undefined" && S && S.__activeLessonId) return S.__activeLessonId;
    return null;
  }

  function activeInstrument(core) {
    if (core && core.currentPlan && core.currentPlan.instrumentType) return core.currentPlan.instrumentType;
    if (typeof S !== "undefined" && S && S.activeInstrument) return S.activeInstrument;
    return "unknown";
  }

  function markComplete(core, reason) {
    var lessonId = activeLessonId(core);
    var instrument = activeInstrument(core);
    if (!lessonId || !window.SparkLessonProgressService) return false;
    SparkLessonProgressService.markComplete(instrument, lessonId, {
      reason: reason || "session_complete",
      flow: core && core.currentPlan ? core.currentPlan.flow : null,
      completedSessionId: core && core.runtimeState ? core.runtimeState.lastCompletedSessionId : null,
      outcome: core ? (core.lastSessionOutcome || (core.runtimeState && core.runtimeState.lastOutcomeSummary) || null) : null
    });
    if (typeof S !== "undefined" && S) delete S.__activeLessonId;
    if (typeof render === "function") {
      try { render(); } catch (e) {}
    }
    return true;
  }

  function patchCore(core) {
    if (!core || core.__lessonCompletionPatched) return false;
    if (typeof core.updateRuntimeState !== "function") return false;
    core.__lessonCompletionPatched = true;
    core.__lastObservedCompletedSessionId = core.runtimeState && core.runtimeState.lastCompletedSessionId || null;

    var originalUpdateRuntimeState = core.updateRuntimeState;
    core.updateRuntimeState = function(patch) {
      var result = originalUpdateRuntimeState.call(core, patch);
      try {
        var completedId = result && result.lastCompletedSessionId;
        var completedChanged = completedId && completedId !== core.__lastObservedCompletedSessionId;
        var completedByPatch = patch && (patch.lastCompletedSessionId || patch.lastCompletedFlow || patch.lastOutcomeSummary);
        if (completedChanged || completedByPatch) {
          core.__lastObservedCompletedSessionId = completedId || core.__lastObservedCompletedSessionId;
          markComplete(core, "runtime_state_completion");
        }
      } catch (e) {
        console.warn("SparkCore lesson completion patch failed", e);
      }
      return result;
    };
    return true;
  }

  function install() {
    var core = getActiveCore();
    if (patchCore(core)) return true;
    return false;
  }

  var tries = 0;
  var timer = setInterval(function() {
    tries++;
    if (install() || tries > 60) clearInterval(timer);
  }, 500);

  window.SparkCoreLessonCompletionPatch = {
    install: install,
    markComplete: function() { return markComplete(getActiveCore(), "manual"); }
  };
})();
