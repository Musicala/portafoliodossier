/**
 * =========================================================
 * MAIN
 * Orquestador principal del sitio
 * - Inicializa módulos globales de forma segura
 * - Evita romper toda la app si un módulo falla
 * - Deja trazabilidad simple para mantenimiento
 * =========================================================
 */

(function () {
  "use strict";

  const APP = {
    isReady: false,
    modules: [
      { name: "navigation", fnName: "initNavigation", required: false },
      { name: "hero", fnName: "initHero", required: false },
      { name: "timeline", fnName: "initTimeline", required: false },
      { name: "counters", fnName: "initCounters", required: false },
      { name: "gallery", fnName: "initGallery", required: false },
      { name: "filters", fnName: "initFilters", required: false },
      { name: "carousels", fnName: "initCarousels", required: false },
      { name: "scroll-effects", fnName: "initScrollEffects", required: false }
    ]
  };

  /**
   * Activa logs solo si quieren debug.
   * Pueden prenderlo con:
   * window.__MUSICALA_DEBUG__ = true;
   */
  function isDebugEnabled() {
    return Boolean(window.__MUSICALA_DEBUG__);
  }

  function logInfo(message, data) {
    if (!isDebugEnabled()) return;
    if (typeof data !== "undefined") {
      console.info(`[Musicala] ${message}`, data);
      return;
    }
    console.info(`[Musicala] ${message}`);
  }

  function logWarn(message, data) {
    if (typeof data !== "undefined") {
      console.warn(`[Musicala] ${message}`, data);
      return;
    }
    console.warn(`[Musicala] ${message}`);
  }

  function logError(message, error) {
    console.error(`[Musicala] ${message}`, error);
  }

  function addReadyClasses() {
    document.body.classList.add("is-ready");
    document.documentElement.classList.add("js-ready");

    // Si usan animación de entrada inicial:
    document.body.classList.add("page-enter");

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.body.classList.add("is-loaded");
      }, 60);
    });
  }

  function resolveFunction(fnName) {
    const candidate = window[fnName];
    return typeof candidate === "function" ? candidate : null;
  }

  function runModule(moduleConfig) {
    const { name, fnName, required } = moduleConfig;
    const moduleFn = resolveFunction(fnName);

    if (!moduleFn) {
      const message = `Módulo "${name}" no disponible (${fnName}).`;
      if (required) {
        logWarn(`${message} Es requerido.`);
      } else {
        logInfo(message);
      }
      return {
        name,
        status: "missing"
      };
    }

    try {
      moduleFn();
      logInfo(`Módulo "${name}" inicializado.`);
      return {
        name,
        status: "ok"
      };
    } catch (error) {
      logError(`Error al inicializar el módulo "${name}".`, error);
      return {
        name,
        status: "error",
        error
      };
    }
  }

  function initModules() {
    return APP.modules.map(runModule);
  }

  function emitAppReady(results) {
    const event = new CustomEvent("musicala:app-ready", {
      detail: {
        results,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(event);
    window.dispatchEvent(event);
  }

  function initApp() {
    if (APP.isReady) {
      logInfo("La app ya fue inicializada. Se omite reinicio.");
      return;
    }

    APP.isReady = true;

    addReadyClasses();

    const results = initModules();
    const failedModules = results.filter((item) => item.status === "error");
    const missingModules = results.filter((item) => item.status === "missing");

    if (failedModules.length > 0) {
      logWarn("Algunos módulos fallaron al iniciar.", failedModules);
    }

    if (missingModules.length > 0) {
      logInfo("Algunos módulos no estaban disponibles.", missingModules);
    }

    emitAppReady(results);
    logInfo("Aplicación inicializada.");
  }

  function onDomReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  onDomReady(initApp);
})();