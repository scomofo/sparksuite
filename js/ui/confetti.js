(function() {
  'use strict';

  function burst(options) {
    options = options || {};
    var count = options.count || 40;
    var origin = options.origin || { x: 50, y: 40 };
    var instRgb = getComputedStyle(document.documentElement).getPropertyValue("--inst-primary-rgb").trim() || "255,45,85";
    var colors = options.colors || [
      "rgba(" + instRgb + ",1)",
      "rgba(" + instRgb + ",0.7)",
      "#ffd93d",
      "#6bcb77",
      "#fff"
    ];

    var container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(container);

    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      var size = 6 + Math.random() * 8;
      var angle = Math.random() * Math.PI * 2;
      var velocity = 200 + Math.random() * 400;
      // dy includes a +400px downward gravity bias so pieces arc and fall
      var dx = Math.cos(angle) * velocity;
      var dy = Math.sin(angle) * velocity + 400;
      var rotation = Math.random() * 720 - 360;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var isRound = Math.random() > 0.5;

      p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;" +
        "left:" + origin.x + "%;top:" + origin.y + "%;" +
        "background:" + color + ";" +
        "border-radius:" + (isRound ? "50%" : "2px") + ";" +
        "opacity:1;" +
        "transform:translate(0,0) rotate(0deg);" +
        "transition:none;";

      container.appendChild(p);

      (function(el, finalX, finalY, rot, delay) {
        setTimeout(function() {
          el.style.transition = "all 1.5s cubic-bezier(0.25,0.46,0.45,0.94)";
          el.style.transform = "translate(" + finalX + "px," + finalY + "px) rotate(" + rot + "deg)";
          el.style.opacity = "0";
        }, delay);
      })(p, dx, dy, rotation, Math.random() * 200);
    }

    setTimeout(function() {
      container.remove();
    }, 2500);
  }

  window.SparkConfetti = { burst: burst };
})();
