/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Guided sessions: open, advance, skip, extend and navigation
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.openGuidedSession = function(options) {
    options = options || {};
    return this.startSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      sessionNum: Object.prototype.hasOwnProperty.call(options, "sessionNum") ? options.sessionNum : undefined
    });
  };

  SparkCore.prototype.completeGuidedSession = function(options) {
    options = options || {};
    var activeSegmentId = Object.prototype.hasOwnProperty.call(options, "itemId")
      ? options.itemId
      : (this.runtimeState.activeSegmentId || this.resolveGuidedRuntimeSegmentId(this.runtimeState.guidedStep, this.currentPlan));
    var result = this.completeSession({
      flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
      itemId: activeSegmentId || undefined,
      markPlanComplete: true
    });
    this.applyGuidedNavigationRequest("guided_done");
    return result;
  };

  SparkCore.prototype.advanceGuidedSession = function(options) {
    options = options || {};
    var currentStep = options.currentStep || this.runtimeState.guidedStep || "spark";
    var nextStep = Object.prototype.hasOwnProperty.call(options, "nextStep")
      ? options.nextStep
      : this.getNextGuidedStep(currentStep);
    var nextPhase = Object.prototype.hasOwnProperty.call(options, "guidedNewMovePhase")
      ? options.guidedNewMovePhase
      : this.runtimeState.guidedNewMovePhase;
    var currentActivity = this.resolveGuidedRuntimeActivity(currentStep, this.currentPlan);
    var nextActivity = this.resolveGuidedRuntimeActivity(nextStep, this.currentPlan);
    var currentSegmentId = this.resolveGuidedRuntimeSegmentId(currentStep, this.currentPlan) || this.runtimeState.activeSegmentId;
    var shouldCompleteCurrentBlock = !!(
      this.currentPlan
      && this.currentPlan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION
      && currentSegmentId
      && currentActivity.guidedBlockType
      && nextActivity.guidedBlockType
      && currentActivity.guidedBlockType !== nextActivity.guidedBlockType
    );
    var completion = null;
    var runtimeState;

    if (!nextStep) {
      completion = this.completeGuidedSession();
      return {
        runtimeState: this.getRuntimeState(),
        completion: completion
      };
    }

    if (shouldCompleteCurrentBlock) {
      completion = this.completeSession({
        flow: SparkSessionTypes.FLOW_GUIDED_SESSION,
        itemId: currentSegmentId
      });
      if (completion && completion.planCompleted) {
        this.applyGuidedNavigationRequest("guided_done");
        return {
          runtimeState: this.getRuntimeState(),
          completion: completion
        };
      }
    }

    runtimeState = this.syncGuidedRuntimeState({
      guidedStep: nextStep,
      guidedNewMovePhase: nextPhase,
      transport: shouldCompleteCurrentBlock
        ? { status: "running", positionMs: 0 }
        : this.runtimeState.transport
    });
    this.syncSessionRuntime({
      autoAdvance: false,
      scheduleTick: nextStep !== currentStep,
      syncState: false
    });

    return {
      runtimeState: runtimeState,
      completion: completion
    };
  };

  SparkCore.prototype.skipGuidedBlock = function(options) {
    options = options || {};
    var currentStep = options.currentStep || this.runtimeState.guidedStep || "spark";
    var targetStep = null;
    if (currentStep === "spark") targetStep = "review";
    else if (currentStep === "review" || currentStep === "newMove") targetStep = "songSlice";
    else if (currentStep === "songSlice") targetStep = "victoryLap";
    else if (currentStep === "victoryLap") {
      return {
        runtimeState: this.completeGuidedSession(options)
      };
    }
    if (!targetStep) {
      return {
        runtimeState: this.getRuntimeState(),
        completion: null
      };
    }
    return this.advanceGuidedSession({
      currentStep: currentStep,
      nextStep: targetStep,
      guidedNewMovePhase: null
    });
  };

  SparkCore.prototype.extendGuidedBlock = function(options) {
    options = options || {};
    var extensionSec = Math.max(60, Math.round(options.extensionSec || 300));
    var currentStep = options.currentStep || this.runtimeState.guidedStep || "spark";
    var segmentId = options.itemId
      || this.runtimeState.activeSegmentId
      || this.resolveGuidedRuntimeSegmentId(currentStep, this.currentPlan);
    var segments;
    var context;
    var guidedPlan;
    var blockActivities;
    var activity;
    var runtimeState;
    var i;

    if (!this.currentPlan || this.currentPlan.flow !== SparkSessionTypes.FLOW_GUIDED_SESSION || currentStep !== "victoryLap" || !segmentId) {
      return {
        runtimeState: this.getRuntimeState(),
        extended: false
      };
    }

    segments = Array.isArray(this.currentPlan.segments) ? this.currentPlan.segments : [];
    for (i = 0; i < segments.length; i++) {
      if (segments[i] && segments[i].id === segmentId) {
        if (!segments[i].meta || typeof segments[i].meta !== "object") segments[i].meta = {};
        segments[i].meta.guidedExtensionSec = Math.max(0, Math.round(segments[i].meta.guidedExtensionSec || 0)) + extensionSec;
        segments[i].meta.guidedExtensionCount = Math.max(0, Math.round(segments[i].meta.guidedExtensionCount || 0)) + 1;
        segments[i].durationSec = Math.max(0, Math.round(segments[i].durationSec || 0)) + extensionSec;
        break;
      }
    }

    context = this.currentPlan.context || {};
    context.guidedShellExtensionSec = Math.max(0, Math.round(context.guidedShellExtensionSec || 0)) + extensionSec;
    context.guidedShellExtensionCount = Math.max(0, Math.round(context.guidedShellExtensionCount || 0)) + 1;
    context.guidedShellDurationSec = Math.max(0, Math.round(context.guidedShellDurationSec || 0)) + extensionSec;
    guidedPlan = context.guidedPlan || null;
    blockActivities = guidedPlan && guidedPlan.blockActivities ? guidedPlan.blockActivities : null;
    activity = blockActivities && blockActivities.cooldown ? blockActivities.cooldown : null;
    if (activity) {
      activity.duration_sec = Math.max(0, Math.round(activity.duration_sec || 0)) + extensionSec;
    }

    runtimeState = this.syncGuidedRuntimeState({
      guidedStep: "victoryLap",
      guidedNewMovePhase: null,
      transport: {
        status: "running",
        positionMs: 0
      }
    });
    this.syncSessionRuntime({
      autoAdvance: false,
      scheduleTick: true,
      syncState: false
    });

    return {
      runtimeState: runtimeState,
      extended: true,
      extensionSec: extensionSec
    };
  };

  SparkCore.prototype.syncGuidedRuntimeState = function(patch) {
    patch = patch || {};
    var nextGuidedStep = Object.prototype.hasOwnProperty.call(patch, "guidedStep")
      ? patch.guidedStep
      : this.runtimeState.guidedStep;
    var guidedActivity = this.resolveGuidedRuntimeActivity(nextGuidedStep, this.currentPlan);
    var guidedSegmentId = this.resolveGuidedRuntimeSegmentId(nextGuidedStep, this.currentPlan);
    return this.updateRuntimeState({
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_GUIDED_SESSION,
      activeScreen: patch.activeScreen || this.runtimeState.activeScreen || "guided_session",
      activeSegmentId: Object.prototype.hasOwnProperty.call(patch, "activeSegmentId")
        ? patch.activeSegmentId
        : (guidedSegmentId || this.runtimeState.activeSegmentId),
      guidedStep: nextGuidedStep,
      guidedNewMovePhase: Object.prototype.hasOwnProperty.call(patch, "guidedNewMovePhase")
        ? patch.guidedNewMovePhase
        : this.runtimeState.guidedNewMovePhase,
      guidedActivityId: Object.prototype.hasOwnProperty.call(patch, "guidedActivityId")
        ? patch.guidedActivityId
        : guidedActivity.guidedActivityId,
      guidedActivityKind: Object.prototype.hasOwnProperty.call(patch, "guidedActivityKind")
        ? patch.guidedActivityKind
        : guidedActivity.guidedActivityKind,
      guidedBlockType: Object.prototype.hasOwnProperty.call(patch, "guidedBlockType")
        ? patch.guidedBlockType
        : guidedActivity.guidedBlockType,
      transport: patch.transport || this.runtimeState.transport
    });
  };

  SparkCore.prototype.buildGuidedNavigationRequest = function(target, options) {
    options = options || {};
    var request = {
      target: target || "guided_home",
      activeFlow: this.runtimeState.activeFlow || SparkSessionTypes.FLOW_GUIDED_SESSION,
      activeScreen: this.runtimeState.activeScreen || "guided_session",
      activeTab: this.runtimeState.activeTab || "practice",
      activeSegmentId: this.runtimeState.activeSegmentId,
      guidedStep: this.runtimeState.guidedStep,
      guidedNewMovePhase: this.runtimeState.guidedNewMovePhase,
      guidedActivityId: this.runtimeState.guidedActivityId,
      guidedActivityKind: this.runtimeState.guidedActivityKind,
      guidedBlockType: this.runtimeState.guidedBlockType,
      transport: { status: "idle", positionMs: 0 }
    };

    if (request.target === "guided_home") {
      request.activeScreen = "home";
      request.activeTab = "practice";
      request.activeSegmentId = null;
      request.guidedStep = null;
      request.guidedNewMovePhase = null;
      request.guidedActivityId = null;
      request.guidedActivityKind = null;
      request.guidedBlockType = null;
    } else if (request.target === "guided_done") {
      request.activeScreen = "guided_done";
      request.activeSegmentId = null;
      request.guidedStep = null;
      request.guidedNewMovePhase = null;
      request.guidedActivityId = null;
      request.guidedActivityKind = null;
      request.guidedBlockType = null;
      request.transport.status = "completed";
    }

    if (Object.prototype.hasOwnProperty.call(options, "positionMs")) {
      request.transport.positionMs = Math.max(0, Math.round(options.positionMs || 0));
    }
    if (Object.prototype.hasOwnProperty.call(options, "status")) {
      request.transport.status = options.status || request.transport.status;
    }
    return request;
  };

  SparkCore.prototype.applyGuidedNavigationRequest = function(target, options) {
    var request = this.buildGuidedNavigationRequest(target, options);
    return this.updateRuntimeState({
      activeFlow: request.activeFlow,
      activeScreen: request.activeScreen,
      activeTab: request.activeTab,
      activeSegmentId: request.activeSegmentId,
      guidedStep: request.guidedStep,
      guidedNewMovePhase: request.guidedNewMovePhase,
      guidedActivityId: request.guidedActivityId,
      guidedActivityKind: request.guidedActivityKind,
      guidedBlockType: request.guidedBlockType,
      transport: request.transport
    });
  };
})();
