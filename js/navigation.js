function initNavigation() {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".primary-nav");
  const toggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelectorAll(".primary-nav a[href^='#']");
  const sections = document.querySelectorAll("main section[id]");

  if (!header) return;

  setupStickyHeader(header);
  setupMobileMenu(toggle, nav, navLinks);
  setupSmoothScroll(navLinks, header, nav, toggle);
  setupActiveSection(navLinks, sections, header);
}

function setupStickyHeader(header) {
  const onScroll = () => {
    if (window.scrollY > 24) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupMobileMenu(toggle, nav, navLinks) {
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.toggle("is-active");
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu(toggle, nav);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMobileMenu(toggle, nav);
    }
  });
}

function closeMobileMenu(toggle, nav) {
  if (!toggle || !nav) return;

  toggle.classList.remove("is-active");
  nav.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function setupSmoothScroll(navLinks, header, nav, toggle) {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const headerHeight = header ? header.offsetHeight : 0;
      const extraOffset = 12;
      const targetTop =
        window.scrollY +
        target.getBoundingClientRect().top -
        headerHeight -
        extraOffset;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });

      if (window.innerWidth <= 820) {
        closeMobileMenu(toggle, nav);
      }
    });
  });
}

function setupActiveSection(navLinks, sections, header) {
  if (!navLinks.length || !sections.length) return;

  const linkMap = new Map();

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      linkMap.set(href.slice(1), link);
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("id");
        const link = linkMap.get(id);

        if (!link) return;

        if (entry.isIntersecting) {
          navLinks.forEach((navLink) => navLink.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    {
      rootMargin: `-${header ? header.offsetHeight + 20 : 90}px 0px -55% 0px`,
      threshold: 0.15
    }
  );

  sections.forEach((section) => observer.observe(section));
}