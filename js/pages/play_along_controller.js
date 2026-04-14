// ===== SparkSuite: Play Along Controller =====
// Glue layer connecting play-along page UI to SparkCore play-along pipeline.
(function() {
  var playAlongState = new SparkPlayAlongStateService();
  var playAlongActions = new SparkPlayAlongActionService(playAlongState);
  var playAlongRenderer = new SparkPlayAlongRenderer(playAlongState);

  function requestRender() {
    if (typeof render === "function") render();
  }

  var rendererBindings = playAlongRenderer.createControllerBindings(requestRender);
  var controllerBindings = playAlongActions.createControllerBindings(requestRender, rendererBindings.startLoop);
  Object.assign(window, playAlongActions.createGlobalBindings(controllerBindings, rendererBindings));

})();
