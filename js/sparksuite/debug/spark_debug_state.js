(function() {
  function createSparkDebugState(options) {
    options = options || {};

    function getSparkCore() {
      return options.sparkCore || (typeof window !== "undefined" ? window.sparkCore : null) || null;
    }

    function getGateway() {
      return options.gateway || (typeof window !== "undefined" ? window.SparkExecutionGateway : null) || null;
    }

    function getRuntime() {
      return options.runtime || (typeof window !== "undefined" ? window.SparkSessionRuntime : null) || null;
    }

    function getCurrentSessionView() {
      var sparkCore = getSparkCore();
      if (sparkCore && typeof sparkCore.getActiveSessionView === "function") {
        return sparkCore.getActiveSessionView() || null;
      }
      return null;
    }

    function getCurrentSession() {
      var view = getCurrentSessionView();
      if (view && view.plan) return view.plan;
      var sparkCore = getSparkCore();
      return sparkCore && sparkCore.currentSession ? sparkCore.currentSession : null;
    }

    function getCurrentSegment() {
      var runtime = getRuntime();
      if (runtime && typeof runtime.getActiveSegment === "function") {
        return runtime.getActiveSegment() || null;
      }
      var view = getCurrentSessionView();
      return view && view.segment ? view.segment : null;
    }

    function getCurrentExercise() {
      var runtime = getRuntime();
      if (runtime && typeof runtime.getActiveExercise === "function") {
        return runtime.getActiveExercise() || null;
      }
      var view = getCurrentSessionView();
      return view && view.exercise ? view.exercise : null;
    }

    function getSessionState() {
      var runtime = getRuntime();
      if (runtime && typeof runtime.getSessionState === "function") {
        return runtime.getSessionState();
      }
      if (runtime && typeof runtime.sessionState !== "undefined") {
        return runtime.sessionState;
      }
      var view = getCurrentSessionView();
      if (view && view.stateMachine) {
        return view.stateMachine;
      }
      return view && view.runtimeState ? (view.runtimeState.transport || null) : null;
    }

    function getLastAction() {
      var gateway = getGateway();
      if (gateway && typeof gateway.getLastAction === "function") {
        return gateway.getLastAction();
      }
      return gateway && gateway.lastAction ? gateway.lastAction : null;
    }

    function getLastResult() {
      var gateway = getGateway();
      if (gateway && typeof gateway.getLastResult === "function") {
        return gateway.getLastResult();
      }
      return gateway && gateway.lastResult ? gateway.lastResult : null;
    }

    function getMissingHandlers() {
      var gateway = getGateway();
      if (gateway && typeof gateway.getMissingHandlerReport === "function") {
        return gateway.getMissingHandlerReport();
      }
      return {};
    }

    function getTimingConfig() {
      var runtime = getRuntime();
      if (runtime && runtime.timingConfig) return runtime.timingConfig;
      var view = getCurrentSessionView();
      if (view && view.runtimeState && view.runtimeState.gameplayTimingConfig) {
        return view.runtimeState.gameplayTimingConfig;
      }
      if (view && view.runtimeState && view.runtimeState.transport && view.runtimeState.transport.timingConfig) {
        return view.runtimeState.transport.timingConfig;
      }
      if (typeof SparkGameplayTiming !== "undefined") return SparkGameplayTiming;
      if (typeof SparkDefaultGameplayTiming !== "undefined") return SparkDefaultGameplayTiming;
      return null;
    }

    function getAssistConfig() {
      var runtime = getRuntime();
      if (runtime && runtime.assistConfig) return runtime.assistConfig;
      var view = getCurrentSessionView();
      if (view && view.runtimeState && view.runtimeState.practiceAssistConfig) {
        return view.runtimeState.practiceAssistConfig;
      }
      if (typeof SparkDefaultPracticeAssist !== "undefined") return SparkDefaultPracticeAssist;
      return null;
    }

    function getScore() {
      var runtime = getRuntime();
      if (runtime && runtime.score) return runtime.score;
      var view = getCurrentSessionView();
      if (view && view.runtimeState && view.runtimeState.score) return view.runtimeState.score;
      return null;
    }

    return {
      getCurrentSession: getCurrentSession,
      getCurrentInstrument: function() {
        var session = getCurrentSession();
        return session ? (session.instrument || null) : null;
      },
      getCurrentLesson: function() {
        var session = getCurrentSession();
        return session ? (session.lessonId || null) : null;
      },
      getCurrentSegment: getCurrentSegment,
      getCurrentExercise: getCurrentExercise,
      getSessionState: getSessionState,
      getLastAction: getLastAction,
      getLastResult: getLastResult,
      getMissingHandlers: getMissingHandlers,
      getTimingConfig: getTimingConfig,
      getAssistConfig: getAssistConfig,
      getScore: getScore
    };
  }

  if (typeof window !== "undefined") {
    window.createSparkDebugState = createSparkDebugState;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      createSparkDebugState: createSparkDebugState
    };
  }
})();
