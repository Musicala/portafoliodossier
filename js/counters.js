/**
 * =========================================================
 * COUNTERS
 * - Animación numérica progresiva
 * - Observer seguro
 * - Soporte para prefijos, sufijos y decimales
 * - Evita doble inicialización
 * =========================================================
 */

(function () {
  "use strict";

  let counterObserver = null;
  let activeAnimations = new WeakMap();

  function getCounterElements() {
    return Array.from(document.querySelectorAll(".counter"));
  }

  function formatNumber(value, options = {}) {
    const {
      locale = "es-CO",
      decimals = 0
    } = options;

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  function parseCounterConfig(element) {
    const target = Number(element.dataset.target || 0);
    const duration = clamp(Number(element.dataset.duration || 1800), 300, 12000);
    const decimals = clamp(Number(element.dataset.decimals || 0), 0, 4);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const locale = element.dataset.locale || "es-CO";
    const start = Number(element.dataset.start || 0);

    return {
      target,
      duration,
      decimals,
      prefix,
      suffix,
      locale,
      start
    };
  }

  function setCounterText(element, value, config) {
    const formatted = formatNumber(value, {
      locale: config.locale,
      decimals: config.decimals
    });

    element.textContent = `${config.prefix}${formatted}${config.suffix}`;
  }

  function cancelAnimation(element) {
    const frameId = activeAnimations.get(element);
    if (frameId) {
      cancelAnimationFrame(frameId);
      activeAnimations.delete(element);
    }
  }

  function animateCounter(element) {
    if (!element) return;

    cancelAnimation(element);

    const config = parseCounterConfig(element);
    const {
      start,
      target,
      duration,
      decimals
    } = config;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      element.classList.add("is-animated");
      setCounterText(element, roundValue(target, decimals), config);
      element.dataset.counted = "true";
      return;
    }

    const startTime = performance.now();
    element.classList.add("is-animated");

    const tick = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (target - start) * easedProgress;
      const roundedValue = roundValue(currentValue, decimals);

      setCounterText(element, roundedValue, config);

      if (progress < 1) {
        const nextFrame = requestAnimationFrame(tick);
        activeAnimations.set(element, nextFrame);
        return;
      }

      setCounterText(element, roundValue(target, decimals), config);
      element.dataset.counted = "true";
      activeAnimations.delete(element);
    };

    const firstFrame = requestAnimationFrame(tick);
    activeAnimations.set(element, firstFrame);
  }

  function observeCounters(elements) {
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        if (element.dataset.counted === "true") return;
        animateCounter(element);
      });
      return;
    }

    counterObserver = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target;
          if (element.dataset.counted === "true") {
            observerInstance.unobserve(element);
            return;
          }

          animateCounter(element);
          observerInstance.unobserve(element);
        });
      },
      {
        threshold: 0.45,
        rootMargin: "0px 0px -5% 0px"
      }
    );

    elements.forEach((element) => {
      if (element.dataset.counted === "true") return;
      counterObserver.observe(element);
    });
  }

  function initCounters() {
    destroyCounters();

    const counterElements = getCounterElements();
    if (!counterElements.length) return;

    counterElements.forEach((element) => {
      const config = parseCounterConfig(element);

      if (element.dataset.counted !== "true") {
        setCounterText(element, roundValue(config.start, config.decimals), config);
      }
    });

    observeCounters(counterElements);
  }

  function destroyCounters() {
    if (counterObserver) {
      counterObserver.disconnect();
      counterObserver = null;
    }

    const counterElements = getCounterElements();
    counterElements.forEach(cancelAnimation);
  }

  function resetCounters() {
    const counterElements = getCounterElements();

    counterElements.forEach((element) => {
      cancelAnimation(element);
      element.dataset.counted = "false";
      element.classList.remove("is-animated");

      const config = parseCounterConfig(element);
      setCounterText(element, roundValue(config.start, config.decimals), config);
    });

    initCounters();
  }

  function roundValue(value, decimals) {
    if (decimals <= 0) {
      return Math.floor(value);
    }

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.initCounters = initCounters;
  window.destroyCounters = destroyCounters;
  window.resetCounters = resetCounters;
})();