function initScrollEffects() {
  const revealElements = document.querySelectorAll(
    ".reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale"
  );

  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observerInstance.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });

  setupParallaxElements();
}

function setupParallaxElements() {
  const parallaxItems = document.querySelectorAll("[data-parallax]");

  if (!parallaxItems.length || window.innerWidth <= 820) return;

  let ticking = false;

  const updateParallax = () => {
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0.12);
      const rect = item.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = (rect.top - viewportHeight / 2) / viewportHeight;

      item.style.transform = `translate3d(0, ${progress * speed * -100}px, 0)`;
    });

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateParallax);
  updateParallax();
}