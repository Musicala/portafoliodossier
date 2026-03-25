/**
 * =========================================================
 * HERO
 * - Estado visual inicial del hero
 * - Video de hero seguro y silencioso
 * - Parallax suave y responsable
 * - Estado scrolled del header
 * =========================================================
 */

(function () {
  "use strict";

  let cleanupFns = [];
  let parallaxState = {
    enabled: false,
    ticking: false
  };

  function getElements() {
    return {
      heroSection: document.querySelector(".hero-section"),
      heroVideo: document.querySelector("[data-hero-video]"),
      siteHeader: document.querySelector(".site-header"),
      heroVisual: document.querySelector(".hero-visual"),
      heroContent: document.querySelector(".hero-content")
    };
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isDesktopParallaxAllowed() {
    return window.innerWidth > 820 && !prefersReducedMotion();
  }

  function addCleanup(fn) {
    if (typeof fn === "function") {
      cleanupFns.push(fn);
    }
  }

  function cleanupHero() {
    cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.warn("[Musicala] Error limpiando hero:", error);
      }
    });

    cleanupFns = [];
    parallaxState.enabled = false;
    parallaxState.ticking = false;
  }

  function initHero() {
    cleanupHero();

    const elements = getElements();
    const { heroSection } = elements;

    if (!heroSection) return;

    document.body.classList.add("page-enter");

    setupHeroVideo(elements);
    setupHeroParallax(elements);
    setupHeaderScrollState(elements);
    setupHeroVisibilityState(elements);
  }

  async function setupHeroVideo({ heroVideo }) {
    if (!heroVideo) return;

    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;
    heroVideo.loop = true;
    heroVideo.autoplay = true;
    heroVideo.setAttribute("muted", "");
    heroVideo.setAttribute("playsinline", "");
    heroVideo.setAttribute("autoplay", "");
    heroVideo.setAttribute("loop", "");

    const tryPlay = async () => {
      try {
        await heroVideo.play();
      } catch (error) {
        heroVideo.setAttribute("controls", "controls");
        console.warn("[Musicala] No se pudo reproducir automáticamente el video del hero.", error);
      }
    };

    if (heroVideo.readyState >= 2) {
      void tryPlay();
    } else {
      const onLoaded = () => {
        void tryPlay();
      };

      heroVideo.addEventListener("loadeddata", onLoaded, { once: true });
      addCleanup(() => {
        heroVideo.removeEventListener("loadeddata", onLoaded);
      });
    }
  }

  function setupHeroParallax({ heroSection, heroVisual, heroContent }) {
    if (!heroSection || (!heroVisual && !heroContent)) return;

    const resetTransforms = () => {
      if (heroVisual) heroVisual.style.transform = "";
      if (heroContent) heroContent.style.transform = "";
    };

    const updateParallax = () => {
      parallaxState.ticking = false;

      if (!isDesktopParallaxAllowed()) {
        parallaxState.enabled = false;
        resetTransforms();
        return;
      }

      const rect = heroSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;

      /**
       * progress:
       * - hero entrando por abajo = positivo
       * - hero saliendo por arriba = negativo
       */
      const progress = clamp(rect.top / viewportHeight, -1, 1);

      if (heroVisual) {
        heroVisual.style.transform = `translate3d(0, ${progress * -18}px, 0)`;
      }

      if (heroContent) {
        heroContent.style.transform = `translate3d(0, ${progress * -10}px, 0)`;
      }

      parallaxState.enabled = true;
    };

    const requestUpdate = () => {
      if (parallaxState.ticking) return;
      parallaxState.ticking = true;
      window.requestAnimationFrame(updateParallax);
    };

    const onScroll = () => {
      requestUpdate();
    };

    const onResize = () => {
      requestUpdate();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    addCleanup(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resetTransforms();
    });

    updateParallax();
  }

  function setupHeaderScrollState({ siteHeader }) {
    if (!siteHeader) return;

    const toggleHeaderState = () => {
      if (window.scrollY > 24) {
        siteHeader.classList.add("is-scrolled");
      } else {
        siteHeader.classList.remove("is-scrolled");
      }
    };

    window.addEventListener("scroll", toggleHeaderState, { passive: true });
    addCleanup(() => {
      window.removeEventListener("scroll", toggleHeaderState);
    });

    toggleHeaderState();
  }

  function setupHeroVisibilityState({ heroSection }) {
    if (!heroSection || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          heroSection.classList.add("is-in-view");
        } else {
          heroSection.classList.remove("is-in-view");
        }
      },
      {
        root: null,
        threshold: 0.15
      }
    );

    observer.observe(heroSection);

    addCleanup(() => {
      observer.disconnect();
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.initHero = initHero;
  window.destroyHero = cleanupHero;
})();