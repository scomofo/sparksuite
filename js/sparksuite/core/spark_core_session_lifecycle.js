/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Session lifecycle: start, complete, and plan queries
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  var _internal = SparkCore._internal;
  var _normalizeSegType = _internal._normalizeSegType;

  SparkCore.prototype.startSession = function(input) {
    input = input || {};
    if (!input.flow && input.mode) return this.startLegacyPracticeSession(input);
    var flow = input.flow || this.aiEngine.suggestNextFlow();
    var today = SparkDay.today();
    // The cached plan is also keyed by the active instrument — switching
    // instruments invalidates yesterday's cache even on the same day, so a
    // bass user doesn't see ukulele segments. When currentInstrumentType is
    // null (e.g. tests without an InstrumentManager) the check is a no-op.
    var currentInstrumentType = this.instrumentManager && typeof this.instrumentManager.getActiveContext === "function"
      ? (this.instrumentManager.getActiveContext() || {}).instrumentType || null
      : null;
    var cacheInstrumentMatches = !currentInstrumentType
      || !this.currentPlan
      || !this.currentPlan.instrumentType
      || this.currentPlan.instrumentType === currentInstrumentType;
    if (!input.forceRebuild && flow === SparkSessionTypes.FLOW_DAILY_PRACTICE && this.currentPlan && this.currentPlan.generatedDate === today && cacheInstrumentMatches) {
      if (!this.currentStateMachine || this.currentStateMachine.sessionId !== this.currentPlan.id) {
        this.createSessionStateMachine(this.currentPlan);
      }
      this.updateRuntimeState({
        activeFlow: this.currentPlan.flow,
        activeInstrumentId: this.currentPlan.instrumentId || this.currentPlan.instrumentType || null,
        activeInstrumentType: this.runtimeState.activeInstrumentType,
        activePlanId: this.currentPlan.id,
        activeSegmentId: this.currentPlan.segments && this.currentPlan.segments.length ? this.currentPlan.segments[0].id : null,
        activeScreen: this.deriveRuntimeScreen(this.currentPlan.flow),
        activeTab: this.runtimeState.activeTab,
        guidedStep: this.currentPlan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION ? "spark" : null,
      guidedNewMovePhase: null,
      performanceChartId: this.runtimeState.performanceChartId,
      performanceSongData: this.runtimeState.performanceSongData,
      performanceSongIndex: this.runtimeState.performanceSongIndex,
      performanceSongTitle: this.runtimeState.performanceSongTitle,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceTargetTechnique: this.runtimeState.performanceTargetTechnique,
      performanceLoop: this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
      performanceResults: this.runtimeState.performanceResults,
      transport: { status: "ready", positionMs: 0 }
    });
      SparkProgressBridge.syncPlanToState(this.currentPlan);
      this.syncSessionRuntime({
        autoAdvance: this.currentPlan.flow !== SparkSessionTypes.FLOW_GUIDED_SESSION,
        scheduleTick: false,
        syncState: false
      });
      return this.currentPlan;
    }

    var instrumentContext = this.instrumentManager.getActiveContext();
    var plan = this.sessionEngine.buildSession(flow, {
      instrumentContext: instrumentContext,
      userProfile: input.userProfile || null,
      sessionNum: input.sessionNum,
      songIndex: input.songIndex,
      songId: input.songId,
      arrangementType: input.arrangementType,
      difficultyId: input.difficultyId,
      lessonId: input.lessonId || null,
      practiceTemplateId: input.practiceTemplateId || null,
      ukuleleMiniSessionId: input.ukuleleMiniSessionId || null,
      favoriteSongs: input.favoriteSongs || []
    });
    // Validate session plan contract
    if (plan && !plan.exercises) {
      // Legacy V1 plan — normalize it
      plan.exercises = (plan.segments || []).map(function(seg, i) {
        var exerciseId = seg.id || ("ex_" + i);
        return {
          id: exerciseId,
          type: _normalizeSegType(seg.type),
          difficulty: seg.difficulty || "normal",
          data: {
            core: {
              skill: (seg.meta && seg.meta.skill) || null,
              chords: (seg.meta && seg.meta.chords) || null,
              pattern: (seg.meta && seg.meta.pattern) || null,
              instrument: (seg.meta && seg.meta.instrument) || null,
              durationSec: seg.durationSec || 60
            },
            gameplay: {
              payload: (seg.meta && seg.meta.gameplayPayload) || null,
              preset: (seg.meta && seg.meta.enginePreset) || null,
              chartId: (seg.meta && seg.meta.chartId) || null
            }
          }
        };
      });
      plan.segments = (plan.segments || []).map(function(seg, i) {
        var exerciseId = seg.id || ("ex_" + i);
        return {
          id: seg.id || ("seg_" + i),
          type: _normalizeSegType(seg.type),
          label: seg.label || seg.type || "practice",
          desc: seg.desc || seg.description || "",
          durationSec: seg.durationSec || 60,
          completed: !!seg.completed,
          meta: seg.meta || {},
          exerciseIds: [exerciseId]
        };
      });
    }
    this.currentPlan = plan;
    this.createSessionStateMachine(plan);
    this.storage.setCurrentPlanId(plan.id);
    var guidedRuntimeActivity = plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION
      ? this.resolveGuidedRuntimeActivity("spark", plan)
      : { guidedActivityId: null, guidedActivityKind: null, guidedBlockType: null };
    this.updateRuntimeState({
      activeFlow: plan.flow,
      activeInstrumentId: plan.instrumentId || plan.instrumentType || null,
      activeInstrumentType: instrumentContext.instrumentType || null,
      activePlanId: plan.id,
      activeSegmentId: plan.segments && plan.segments.length ? plan.segments[0].id : null,
      activeScreen: this.deriveRuntimeScreen(plan.flow),
      activeTab: this.runtimeState.activeTab,
      guidedStep: plan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION ? "spark" : null,
      guidedNewMovePhase: null,
      guidedActivityId: guidedRuntimeActivity.guidedActivityId,
      guidedActivityKind: guidedRuntimeActivity.guidedActivityKind,
      guidedBlockType: guidedRuntimeActivity.guidedBlockType,
      performanceChartId: null,
      performanceSongData: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.songData || null) : null,
      performanceSongIndex: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.songIndex != null ? plan.context.performanceSong.songIndex : null) : null,
      performanceSongTitle: plan.context && plan.context.performanceSong && plan.context.performanceSong.songData
        ? (plan.context.performanceSong.songData.title || null)
        : null,
      performanceDifficultyId: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.difficultyId || null) : null,
      performanceArrangementType: plan.context && plan.context.performanceSong ? (plan.context.performanceSong.arrangementType || null) : null,
      performanceSpeed: null,
      performancePracticePreset: null,
      performanceLoop: null,
      performanceInputMode: null,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
      performanceResults: null,
      transport: { status: "ready", positionMs: 0 }
    });
    SparkProgressBridge.syncPlanToState(plan);
    this.syncSessionRuntime({
      autoAdvance: plan.flow !== SparkSessionTypes.FLOW_GUIDED_SESSION,
      scheduleTick: false,
      syncState: false
    });
    return plan;
  };

  SparkCore.prototype._unsafeStartSession = SparkCore.prototype.startSession;

  SparkCore.prototype.startSession = function(input) {
    var self = this;
    input = input || {};
    this.emitEvent("session.start.requested", {
      flow: input.flow || null,
      sessionNum: input.sessionNum || null,
      songId: input.songId || null,
      forceRebuild: !!input.forceRebuild
    });
    return this.runWithErrorRecovery("startSession", {
      input: this.cloneValue(input)
    }, function() {
      var plan = self._unsafeStartSession(input);
      self.emitEvent("session.start.completed", {
        sessionId: plan && plan.id ? plan.id : null,
        flow: plan && plan.flow ? plan.flow : null,
        instrumentType: plan && plan.instrumentType ? plan.instrumentType : null,
        segmentCount: plan && Array.isArray(plan.segments) ? plan.segments.length : 0
      });
      return plan;
    });
  };

  SparkCore.prototype.completeSession = function(payload) {
    var sessionStates = this.getSessionStates();
    payload = payload || {};
    if (!this.currentPlan || (payload.sessionId && this.currentPlan.id !== payload.sessionId)) {
      this.startSession({ flow: payload.flow || SparkSessionTypes.FLOW_DAILY_PRACTICE });
    }

    this.assertCanCompleteSession();
    this.ensureCompletionFlowState({
      itemId: payload.itemId || null,
      flow: payload.flow || (this.currentPlan ? this.currentPlan.flow : null)
    });

    var result = this.progressEngine.completeSession(this.currentPlan, payload);
    var performance = payload.gameplayResult || payload.result || null;
    var nextRecommendedSkill = this.curriculumEngine && typeof this.curriculumEngine.peekNextSkill === "function"
      ? this.curriculumEngine.peekNextSkill({
          session: this.currentPlan,
          instrumentType: this.currentPlan ? this.currentPlan.instrumentType : null
        })
      : null;
    if (this.aiEngine && typeof this.aiEngine.generateCoachingNote === "function") {
      result.coaching = this.aiEngine.generateCoachingNote({
        session: this.currentPlan,
        performance: performance,
        mastery: result.mastery || null,
        nextRecommendedSkill: nextRecommendedSkill
      });
    }
    this.lastSessionOutcome = result;
    this.transitionSessionState(result.planCompleted ? sessionStates.COMPLETED : sessionStates.SEGMENT_COMPLETE, {
      reason: result.planCompleted ? "session_completed" : "segment_completed",
      itemId: payload.itemId || null
    });
    this.updateRuntimeState({
      activeFlow: this.currentPlan ? this.currentPlan.flow : (payload.flow || null),
      activeInstrumentId: this.currentPlan && (this.currentPlan.instrumentId || this.currentPlan.instrumentType)
        ? (this.currentPlan.instrumentId || this.currentPlan.instrumentType)
        : this.runtimeState.activeInstrumentId,
      activeInstrumentType: this.runtimeState.activeInstrumentType,
      activePlanId: this.currentPlan ? this.currentPlan.id : this.runtimeState.activePlanId,
      activeSegmentId: payload.itemId || this.runtimeState.activeSegmentId,
      activeScreen: this.currentPlan ? this.deriveRuntimeScreen(this.currentPlan.flow) : this.runtimeState.activeScreen,
      activeTab: this.runtimeState.activeTab,
      guidedStep: result.planCompleted ? null : this.runtimeState.guidedStep,
      guidedNewMovePhase: result.planCompleted ? null : this.runtimeState.guidedNewMovePhase,
      guidedActivityId: result.planCompleted ? null : this.runtimeState.guidedActivityId,
      guidedActivityKind: result.planCompleted ? null : this.runtimeState.guidedActivityKind,
      guidedBlockType: result.planCompleted ? null : this.runtimeState.guidedBlockType,
      performanceChartId: result.planCompleted ? this.runtimeState.performanceChartId : this.runtimeState.performanceChartId,
      performanceSongData: this.runtimeState.performanceSongData,
      performanceSongIndex: this.runtimeState.performanceSongIndex,
      performanceSongTitle: this.runtimeState.performanceSongTitle,
      performanceDifficultyId: this.runtimeState.performanceDifficultyId,
      performanceArrangementType: this.runtimeState.performanceArrangementType,
      performanceSpeed: this.runtimeState.performanceSpeed,
      performancePracticePreset: this.runtimeState.performancePracticePreset,
      performanceLoop: result.planCompleted ? null : this.runtimeState.performanceLoop,
      performanceInputMode: this.runtimeState.performanceInputMode,
      performanceEditorMode: this.runtimeState.performanceEditorMode,
      performanceEditorSnap: this.runtimeState.performanceEditorSnap,
      performanceEditorChartId: this.runtimeState.performanceEditorChartId,
      performanceEditorChartTitle: this.runtimeState.performanceEditorChartTitle,
      performanceEditorSource: this.runtimeState.performanceEditorSource,
      performanceEditorDirty: this.runtimeState.performanceEditorDirty,
      performanceEditorSelectedEventId: this.runtimeState.performanceEditorSelectedEventId,
      performanceEditorSelectedEventLabel: this.runtimeState.performanceEditorSelectedEventLabel,
      performanceEditorSelectedEventTime: this.runtimeState.performanceEditorSelectedEventTime,
      performanceEditorSelectedEventDuration: this.runtimeState.performanceEditorSelectedEventDuration,
      performanceEditorSelectedPhraseId: this.runtimeState.performanceEditorSelectedPhraseId,
      performanceEditorSelectedPhraseName: this.runtimeState.performanceEditorSelectedPhraseName,
      performanceEditorSelectedPhraseStart: this.runtimeState.performanceEditorSelectedPhraseStart,
      performanceEditorSelectedPhraseEnd: this.runtimeState.performanceEditorSelectedPhraseEnd,
      performanceEditorBpm: this.runtimeState.performanceEditorBpm,
      performanceEditorEventCount: this.runtimeState.performanceEditorEventCount,
      performanceEditorPhraseCount: this.runtimeState.performanceEditorPhraseCount,
      performanceStatsFocus: this.runtimeState.performanceStatsFocus,
      performanceCalibrationSource: this.runtimeState.performanceCalibrationSource,
      performanceCalibrationMode: false,
      performanceTimingOffsetMs: this.runtimeState.performanceTimingOffsetMs,
      performanceMidiOffsetMs: this.runtimeState.performanceMidiOffsetMs,
      performanceMicOffsetMs: this.runtimeState.performanceMicOffsetMs,
      performanceResults: result.performanceSummary || this.runtimeState.performanceResults,
      transport: { status: result.planCompleted ? "completed" : "ready" },
      lastCompletedSessionId: result.planCompleted && this.currentPlan ? this.currentPlan.id : this.runtimeState.lastCompletedSessionId,
      lastCompletedFlow: result.planCompleted && this.currentPlan ? this.currentPlan.flow : this.runtimeState.lastCompletedFlow,
      lastOutcomeSummary: result.completionSummary || result.performanceSummary || result.itemResultSummary || null
    });
    if (result.planCompleted) this.storage.setCurrentPlanId(this.currentPlan.id);
    return result;
  };

  SparkCore.prototype._unsafeCompleteSession = SparkCore.prototype.completeSession;

  SparkCore.prototype.completeSession = function(payload) {
    var self = this;
    payload = payload || {};
    this.emitEvent("session.complete.requested", {
      sessionId: payload.sessionId || (this.currentPlan && this.currentPlan.id) || null,
      itemId: payload.itemId || null
    });
    return this.runWithErrorRecovery("completeSession", {
      payload: this.cloneValue(payload),
      sessionId: payload.sessionId || (this.currentPlan && this.currentPlan.id) || null
    }, function() {
      var result = self._unsafeCompleteSession(payload);
      self.emitEvent("session.complete.completed", {
        sessionId: self.currentPlan && self.currentPlan.id ? self.currentPlan.id : null,
        completedItems: result && typeof result.completedItems === "number" ? result.completedItems : null,
        planCompleted: !!(result && result.planCompleted),
        xpAwarded: result && typeof result.xpAwarded === "number" ? result.xpAwarded : 0
      });
      return result;
    });
  };

  SparkCore.prototype.getCurrentPlan = function() {
    return this.currentPlan;
  };

  SparkCore.prototype.getSegmentById = function(segmentId) {
    if (!this.currentPlan || !Array.isArray(this.currentPlan.segments)) return null;
    for (var i = 0; i < this.currentPlan.segments.length; i++) {
      if (this.currentPlan.segments[i].id === segmentId) return this.currentPlan.segments[i];
    }
    return null;
  };

  SparkCore.prototype.getLastSessionOutcome = function() {
    return this.lastSessionOutcome;
  };

  SparkCore.prototype.getActiveSessionView = function() {
    var segment = null;
    var exercise = null;
    var runtime = this.getSessionRuntimeHandle();
    var runtimeState = this.getRuntimeState();
    var guidedViewState = null;
    var shellPrimaryAction = "sessionPauseBlock";
    var performSongState = null;
    var performanceDoneState = null;
    var segments;
    var i;
    if (this.currentPlan && this.currentPlan.flow === SparkSessionTypes.FLOW_GUIDED_SESSION) {
      guidedViewState = this.resolveGuidedSessionViewState(this.currentPlan, runtimeState);
      if (guidedViewState.activeSegment) segment = guidedViewState.activeSegment;
      runtimeState = Object.assign({}, runtimeState, {
        guidedStep: guidedViewState.guidedStep,
        guidedActivityId: guidedViewState.guidedActivityId,
        guidedActivityKind: guidedViewState.guidedActivityKind,
        guidedBlockType: guidedViewState.guidedBlockType,
        activeSegmentId: guidedViewState.activeSegmentId
      });
    }
    if (runtime && typeof runtime.getActiveSession === "function" && runtime.getActiveSession() === this.currentPlan) {
      if (typeof runtime.getActiveSegment === "function") segment = runtime.getActiveSegment();
      if (typeof runtime.getActiveExercise === "function") exercise = runtime.getActiveExercise();
    }
    if (!segment && this.currentPlan && Array.isArray(this.currentPlan.segments)) {
      segments = this.currentPlan.segments;
      for (i = 0; i < segments.length; i++) {
        if (segments[i] && segments[i].id === this.runtimeState.activeSegmentId) {
          segment = segments[i];
          break;
        }
      }
    }
    if (!exercise && segment && Array.isArray(segment.exerciseIds) && Array.isArray(this.currentPlan && this.currentPlan.exercises)) {
      for (i = 0; i < this.currentPlan.exercises.length; i++) {
        if (this.currentPlan.exercises[i] && this.currentPlan.exercises[i].id === segment.exerciseIds[0]) {
          exercise = this.currentPlan.exercises[i];
          break;
        }
      }
    }
    if (runtimeState && runtimeState.transport && runtimeState.transport.status === "paused") {
      shellPrimaryAction = "sessionResumeBlock";
    }
    if (this.practiceEngine && typeof this.practiceEngine.getValidatedShellAction === "function") {
      shellPrimaryAction = this.practiceEngine.getValidatedShellAction(shellPrimaryAction);
    }
    if (this.progressEngine && typeof this.progressEngine.buildPerformSongState === "function") {
      performSongState = this.progressEngine.buildPerformSongState(runtimeState.performanceResults, runtimeState.performanceChart);
    }
    if (this.progressEngine && typeof this.progressEngine.buildPerformanceDoneState === "function") {
      performanceDoneState = this.progressEngine.buildPerformanceDoneState(
        runtimeState.performanceResults,
        runtimeState.performanceChart,
        runtimeState
      );
    }
    return {
      plan: this.currentPlan,
      activeSegment: segment,
      activeExercise: exercise,
      activeBlockType: guidedViewState ? guidedViewState.guidedBlockType : null,
      shellPrimaryAction: shellPrimaryAction,
      showWeakestPhraseAction: !!(performSongState && performSongState.showWeakestPhraseAction),
      performanceDoneState: performanceDoneState,
      stateMachine: this.getSessionStateMachineSnapshot(),
      runtimeState: runtimeState,
      lastSessionOutcome: this.getLastSessionOutcome(),
      recovery: this.getRecoveryState()
    };
  };

  SparkCore.prototype.syncSessionRuntime = function(options) {
    var runtime = this.getSessionRuntimeHandle();
    var view;
    var runtimeState;
    options = options || {};
    if (!runtime || typeof runtime.attachSession !== "function" || !this.currentPlan) return false;
    view = this.getActiveSessionView();
    runtimeState = view && view.runtimeState ? view.runtimeState : this.runtimeState;
    runtime.attachSession(this.currentPlan, {
      segmentId: Object.prototype.hasOwnProperty.call(options, "segmentId")
        ? options.segmentId
        : (runtimeState && runtimeState.activeSegmentId ? runtimeState.activeSegmentId : null),
      status: Object.prototype.hasOwnProperty.call(options, "status")
        ? options.status
        : ((runtimeState && runtimeState.transport && runtimeState.transport.status) || "ready"),
      positionMs: Object.prototype.hasOwnProperty.call(options, "positionMs")
        ? options.positionMs
        : ((runtimeState && runtimeState.transport && runtimeState.transport.positionMs) || 0),
      autoAdvance: !!options.autoAdvance,
      scheduleTick: options.scheduleTick !== false,
      syncState: options.syncState === true
    });
    return true;
  };
})();
