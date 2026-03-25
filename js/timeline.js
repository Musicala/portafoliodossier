function initTimeline() {
  const timeline = document.querySelector(".timeline-list");
  const items = timeline ? Array.from(timeline.querySelectorAll(".timeline-item")) : [];
  const navButtons = document.querySelectorAll("[data-timeline-target]");

  if (!timeline || !items.length) return;

  setupTimelineObserver(items);
  setupTimelineNavigation(items, navButtons);
}

function setupTimelineObserver(items) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = entry.target;

        if (entry.isIntersecting) {
          item.classList.add("is-current");
        } else {
          item.classList.remove("is-current");
        }
      });
    },
    {
      threshold: 0.45,
      rootMargin: "0px 0px -18% 0px"
    }
  );

  items.forEach((item) => observer.observe(item));
}

function setupTimelineNavigation(items, navButtons) {
  if (!navButtons.length) return;

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetYear = button.dataset.timelineTarget;
      if (!targetYear) return;

      const targetItem = items.find((item) => {
        const yearEl = item.querySelector(".timeline-year");
        return yearEl && yearEl.textContent.trim() === targetYear.trim();
      });

      if (!targetItem) return;

      const header = document.querySelector(".site-header");
      const headerHeight = header ? header.offsetHeight : 0;
      const offset = 18;

      const top =
        window.scrollY +
        targetItem.getBoundingClientRect().top -
        headerHeight -
        offset;

      window.scrollTo({
        top,
        behavior: "smooth"
      });
    });
  });
}