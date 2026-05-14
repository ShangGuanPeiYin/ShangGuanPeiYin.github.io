(function () {
  function initRainScene(root) {
    const canvas = root.querySelector("[data-rain-canvas]");
    const background = root.querySelector("[data-rain-bg]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 768px)");

    let drops = [];
    let foregroundDrops = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let paused = false;
    let parallaxX = 0;
    let parallaxY = 0;

    function getConfig() {
      if (mobile.matches) {
        return {
          count: 70,
          foregroundCount: 16,
          speedMin: 8,
          speedMax: 15,
          lengthMin: 18,
          lengthMax: 40,
          parallaxRange: 4
        };
      }

      return {
        count: 150,
        foregroundCount: 28,
        speedMin: 10,
        speedMax: 22,
        lengthMin: 22,
        lengthMax: 60,
        parallaxRange: 8
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

    function createForegroundDrop(initial) {
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -80 - Math.random() * height * 0.35,
        length: 60 + Math.random() * 70,
        speed: 18 + Math.random() * 16,
        drift: 10 + Math.random() * 10,
        opacity: 0.09 + Math.random() * 0.13,
        thickness: 1.8 + Math.random() * 1.7
      };
    }

    function resize() {
      const config = getConfig();
      width = Math.max(1, Math.floor(root.clientWidth));
      height = Math.max(1, Math.floor(root.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = Array.from({ length: config.count }, function () {
        return createDrop(true);
      });
      foregroundDrops = Array.from({ length: config.foregroundCount }, function () {
        return createForegroundDrop(true);
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

      ctx.save();
      ctx.filter = "blur(1.6px)";
      for (const drop of foregroundDrops) {
        ctx.beginPath();
        ctx.lineWidth = drop.thickness;
        ctx.strokeStyle = "rgba(240, 247, 255," + drop.opacity.toFixed(3) + ")";
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.drift, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= drop.drift * 0.12;

        if (drop.y > height + drop.length || drop.x < -48) {
          Object.assign(drop, createForegroundDrop(false));
        }
      }
      ctx.restore();
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

    function handlePointerMove(event) {
      if (!background || mobile.matches || reduceMotion.matches) return;
      const rect = root.getBoundingClientRect();
      const ratioX = (event.clientX - rect.left) / rect.width - 0.5;
      const ratioY = (event.clientY - rect.top) / rect.height - 0.5;
      const range = getConfig().parallaxRange;
      parallaxX = ratioX * range * -1;
      parallaxY = ratioY * range * -1;
      background.style.transform = "translate3d(" + parallaxX.toFixed(2) + "px," + parallaxY.toFixed(2) + "px,0) scale(1.04)";
    }

    function resetParallax() {
      if (!background) return;
      parallaxX = 0;
      parallaxY = 0;
      background.style.transform = "translate3d(0,0,0) scale(1.04)";
    }

    resize();
    handleVisibility();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("orientationchange", resize);
    root.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("pointerleave", resetParallax);
    frameId = window.requestAnimationFrame(tick);

    return function cleanup() {
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("orientationchange", resize);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", resetParallax);
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
