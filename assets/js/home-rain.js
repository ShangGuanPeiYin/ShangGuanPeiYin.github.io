(function () {
  function initRainScene(root) {
    const canvas = root.querySelector("[data-rain-canvas]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 768px)");

    let drops = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let paused = false;

    function getConfig() {
      if (mobile.matches) {
        return {
          count: 70,
          speedMin: 8,
          speedMax: 15,
          lengthMin: 18,
          lengthMax: 40
        };
      }

      return {
        count: 150,
        speedMin: 10,
        speedMax: 22,
        lengthMin: 22,
        lengthMax: 60
      };
    }

    function createDrop(initial) {
      const config = getConfig();
      const depth = Math.random();
      const speed = config.speedMin + (config.speedMax - config.speedMin) * depth;
      const length = config.lengthMin + (config.lengthMax - config.lengthMin) * depth;

      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -length - Math.random() * height * 0.2,
        length,
        speed,
        drift: 6 + depth * 8,
        opacity: 0.18 + depth * 0.55,
        thickness: 0.7 + depth * 0.9
      };
    }

    function resize() {
      width = Math.max(1, Math.floor(root.clientWidth));
      height = Math.max(1, Math.floor(root.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = Array.from({ length: getConfig().count }, function () {
        return createDrop(true);
      });
    }

    function drawRain() {
      ctx.clearRect(0, 0, width, height);

      for (const drop of drops) {
        ctx.beginPath();
        ctx.lineWidth = drop.thickness;
        ctx.strokeStyle = "rgba(232, 242, 255," + drop.opacity.toFixed(3) + ")";
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.drift, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= drop.drift * 0.08;

        if (drop.y > height + drop.length || drop.x < -24) {
          Object.assign(drop, createDrop(false));
        }
      }
    }

    function tick() {
      if (!paused && !reduceMotion.matches) {
        drawRain();
      }
      frameId = window.requestAnimationFrame(tick);
    }

    function handleVisibility() {
      paused = document.hidden;
    }

    resize();
    handleVisibility();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("orientationchange", resize);
    frameId = window.requestAnimationFrame(tick);

    return function cleanup() {
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("orientationchange", resize);
      window.cancelAnimationFrame(frameId);
    };
  }

  function boot() {
    document.querySelectorAll("[data-rain-home]").forEach(function (root) {
      initRainScene(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
