class Carousel {
  constructor(root) {
    this.root = root;
    this.track = root.querySelector("[data-carousel-track]");
    this.slides = Array.from(root.querySelectorAll("[data-carousel-slide]"));
    this.prevBtn = root.querySelector("[data-carousel-prev]");
    this.nextBtn = root.querySelector("[data-carousel-next]");
    this.pagination = root.querySelector("[data-carousel-pagination]");
    this.autoPlay = root.dataset.autoplay === "true";
    this.interval = Number(root.dataset.interval || 5000);
    this.timer = null;
    this.current = 0;
    this.slidesToShow = 1;
    this.totalPages = 1;
    this.isDragging = false;
    this.startX = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;

    if (!this.track || this.slides.length === 0) return;

    this.init();
  }

  init() {
    this.updateConfig();
    this.buildPagination();
    this.update();
    this.bindEvents();

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  updateConfig() {
    const width = window.innerWidth;

    if (width >= 1100) {
      this.slidesToShow = Number(this.root.dataset.desktop || 3);
    } else if (width >= 700) {
      this.slidesToShow = Number(this.root.dataset.tablet || 2);
    } else {
      this.slidesToShow = Number(this.root.dataset.mobile || 1);
    }

    this.totalPages = Math.max(
      1,
      Math.ceil(this.slides.length / this.slidesToShow)
    );

    if (this.current >= this.totalPages) {
      this.current = this.totalPages - 1;
    }
  }

  buildPagination() {
    if (!this.pagination) return;

    this.pagination.innerHTML = "";

    for (let i = 0; i < this.totalPages; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Ir al grupo ${i + 1}`);
      dot.dataset.index = i;

      if (i === this.current) {
        dot.classList.add("is-active");
      }

      dot.addEventListener("click", () => {
        this.goTo(i);
      });

      this.pagination.appendChild(dot);
    }
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => this.prev());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.next());
    }

    window.addEventListener("resize", () => {
      this.updateConfig();
      this.buildPagination();
      this.update();
    });

    this.root.addEventListener("mouseenter", () => this.stopAutoPlay());
    this.root.addEventListener("mouseleave", () => this.startAutoPlay());

    this.track.addEventListener("touchstart", this.touchStart.bind(this), { passive: true });
    this.track.addEventListener("touchmove", this.touchMove.bind(this), { passive: true });
    this.track.addEventListener("touchend", this.touchEnd.bind(this));

    this.track.addEventListener("mousedown", this.touchStart.bind(this));
    this.track.addEventListener("mousemove", this.touchMove.bind(this));
    this.track.addEventListener("mouseup", this.touchEnd.bind(this));
    this.track.addEventListener("mouseleave", this.touchEnd.bind(this));

    document.addEventListener("keydown", (event) => {
      const isInside = this.root.contains(document.activeElement);
      if (!isInside) return;

      if (event.key === "ArrowLeft") {
        this.prev();
      }

      if (event.key === "ArrowRight") {
        this.next();
      }
    });
  }

  update() {
    const offset = (100 / this.slidesToShow) * this.current * this.slidesToShow;
    this.track.style.transform = `translate3d(-${offset}%, 0, 0)`;

    this.slides.forEach((slide) => {
      slide.style.flex = `0 0 ${100 / this.slidesToShow}%`;
      slide.style.maxWidth = `${100 / this.slidesToShow}%`;
    });

    if (this.prevBtn) {
      this.prevBtn.disabled = this.current === 0;
      this.prevBtn.classList.toggle("is-disabled", this.current === 0);
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = this.current >= this.totalPages - 1;
      this.nextBtn.classList.toggle("is-disabled", this.current >= this.totalPages - 1);
    }

    if (this.pagination) {
      const dots = Array.from(this.pagination.children);
      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === this.current);
      });
    }
  }

  goTo(index) {
    this.current = Math.max(0, Math.min(index, this.totalPages - 1));
    this.update();
    this.restartAutoPlay();
  }

  next() {
    if (this.current < this.totalPages - 1) {
      this.current += 1;
    } else {
      this.current = 0;
    }

    this.update();
    this.restartAutoPlay();
  }

  prev() {
    if (this.current > 0) {
      this.current -= 1;
    } else {
      this.current = this.totalPages - 1;
    }

    this.update();
    this.restartAutoPlay();
  }

  startAutoPlay() {
    if (!this.autoPlay || this.totalPages <= 1) return;
    this.stopAutoPlay();

    this.timer = setInterval(() => {
      this.next();
    }, this.interval);
  }

  stopAutoPlay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  restartAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  touchStart(event) {
    this.isDragging = true;
    this.startX = this.getPositionX(event);
    this.prevTranslate = this.currentTranslate;
    this.track.classList.add("is-dragging");
    this.stopAutoPlay();
  }

  touchMove(event) {
    if (!this.isDragging) return;

    const currentPosition = this.getPositionX(event);
    const diff = currentPosition - this.startX;

    this.currentTranslate = this.prevTranslate + diff;
  }

  touchEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.track.classList.remove("is-dragging");

    const movedBy = this.currentTranslate - this.prevTranslate;

    if (movedBy < -60) {
      this.next();
    } else if (movedBy > 60) {
      this.prev();
    } else {
      this.update();
      this.startAutoPlay();
    }

    this.currentTranslate = 0;
    this.prevTranslate = 0;
  }

  getPositionX(event) {
    return event.type.includes("mouse") ? event.pageX : event.touches[0].clientX;
  }
}

function initCarousels() {
  const carousels = document.querySelectorAll("[data-carousel]");

  if (!carousels.length) return;

  carousels.forEach((carouselElement) => {
    new Carousel(carouselElement);
  });
}

document.addEventListener("DOMContentLoaded", initCarousels);