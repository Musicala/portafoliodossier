/**
 * =========================================================
 * GALLERY
 * - Inicializa galerías declarativas con [data-gallery]
 * - Abre modal accesible para imagen o video
 * - Maneja foco, teclado, navegación y limpieza
 * =========================================================
 */

(function () {
  "use strict";

  let activeModal = null;
  let previousActiveElement = null;
  let removeGlobalKeydown = null;

  function getGalleryContainers() {
    return Array.from(document.querySelectorAll("[data-gallery]"));
  }

  function initGallery() {
    destroyGallery();

    const galleries = getGalleryContainers();
    if (!galleries.length) return;

    galleries.forEach((gallery) => {
      const items = getGalleryItems(gallery);
      if (!items.length) return;

      items.forEach((item, index) => {
        prepareGalleryItem(item);

        const handleClick = (event) => {
          event.preventDefault();
          openGalleryModal(items, index);
        };

        item.addEventListener("click", handleClick);

        item.__galleryClickHandler = handleClick;
      });
    });
  }

  function destroyGallery() {
    const galleries = getGalleryContainers();

    galleries.forEach((gallery) => {
      const items = getGalleryItems(gallery);

      items.forEach((item) => {
        if (item.__galleryClickHandler) {
          item.removeEventListener("click", item.__galleryClickHandler);
          delete item.__galleryClickHandler;
        }
      });
    });

    closeGalleryModal({ restoreFocus: false });
  }

  function getGalleryItems(gallery) {
    return Array.from(gallery.querySelectorAll("[data-gallery-item]"));
  }

  function prepareGalleryItem(item) {
    const tagName = item.tagName.toLowerCase();
    const isNaturallyInteractive =
      tagName === "button" ||
      tagName === "a" ||
      item.hasAttribute("tabindex");

    if (!isNaturallyInteractive) {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
    }

    if (!item.getAttribute("aria-label")) {
      const caption = item.dataset.caption || "Abrir elemento de galería";
      item.setAttribute("aria-label", caption);
    }

    if (!item.__galleryKeyboardHandler) {
      const handleKeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.click();
        }
      };

      item.addEventListener("keydown", handleKeydown);
      item.__galleryKeyboardHandler = handleKeydown;
    }
  }

  function cleanupPreparedItems() {
    const galleries = getGalleryContainers();

    galleries.forEach((gallery) => {
      const items = getGalleryItems(gallery);

      items.forEach((item) => {
        if (item.__galleryKeyboardHandler) {
          item.removeEventListener("keydown", item.__galleryKeyboardHandler);
          delete item.__galleryKeyboardHandler;
        }
      });
    });
  }

  function openGalleryModal(items, startIndex) {
    closeGalleryModal({ restoreFocus: false });

    const safeStartIndex = clamp(startIndex, 0, items.length - 1);
    let currentIndex = safeStartIndex;

    previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const modal = buildModal();
    activeModal = modal;

    document.body.appendChild(modal.root);
    document.body.classList.add("gallery-open");
    document.body.style.overflow = "hidden";

    const render = (index) => {
      const item = items[index];
      if (!item) return;

      renderGalleryItem(item, modal);
      updateNavState(index, items.length, modal);

      modal.dialog.setAttribute(
        "aria-label",
        item.dataset.caption || `Galería visual ${index + 1} de ${items.length}`
      );
    };

    const goPrev = () => {
      if (currentIndex <= 0) return;
      currentIndex -= 1;
      render(currentIndex);
    };

    const goNext = () => {
      if (currentIndex >= items.length - 1) return;
      currentIndex += 1;
      render(currentIndex);
    };

    const close = () => {
      closeGalleryModal({ restoreFocus: true });
    };

    const onKeydown = (event) => {
      if (!activeModal) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          close();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          event.preventDefault();
          goNext();
          break;
        case "Tab":
          trapFocus(event, modal.dialog);
          break;
        default:
          break;
      }
    };

    modal.prevBtn.addEventListener("click", goPrev);
    modal.nextBtn.addEventListener("click", goNext);

    modal.closeButtons.forEach((button) => {
      button.addEventListener("click", close);
    });

    modal.dialog.addEventListener("click", (event) => {
      const clickedBackdrop = event.target === modal.dialog;
      if (clickedBackdrop) close();
    });

    document.addEventListener("keydown", onKeydown);
    removeGlobalKeydown = () => {
      document.removeEventListener("keydown", onKeydown);
      removeGlobalKeydown = null;
    };

    render(currentIndex);

    window.requestAnimationFrame(() => {
      modal.closeBtn.focus();
    });
  }

  function closeGalleryModal({ restoreFocus = true } = {}) {
    if (!activeModal) return;

    if (removeGlobalKeydown) {
      removeGlobalKeydown();
    }

    const { root } = activeModal;

    document.body.classList.remove("gallery-open");
    document.body.style.overflow = "";

    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }

    activeModal = null;

    if (restoreFocus && previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }

    previousActiveElement = null;
  }

  function buildModal() {
    const root = document.createElement("div");
    root.className = "gallery-modal";
    root.setAttribute("data-gallery-modal", "");

    root.innerHTML = `
      <div class="gallery-modal__backdrop" data-gallery-close></div>

      <div
        class="gallery-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Galería visual"
      >
        <button
          class="gallery-modal__close"
          type="button"
          aria-label="Cerrar galería"
          data-gallery-close
        >
          ×
        </button>

        <button
          class="gallery-modal__nav gallery-modal__nav--prev"
          type="button"
          aria-label="Elemento anterior"
        >
          ‹
        </button>

        <div class="gallery-modal__content"></div>

        <button
          class="gallery-modal__nav gallery-modal__nav--next"
          type="button"
          aria-label="Siguiente elemento"
        >
          ›
        </button>

        <div class="gallery-modal__caption" aria-live="polite"></div>
      </div>
    `;

    const dialog = root.querySelector(".gallery-modal__dialog");
    const content = root.querySelector(".gallery-modal__content");
    const caption = root.querySelector(".gallery-modal__caption");
    const prevBtn = root.querySelector(".gallery-modal__nav--prev");
    const nextBtn = root.querySelector(".gallery-modal__nav--next");
    const closeBtn = root.querySelector(".gallery-modal__close");
    const closeButtons = root.querySelectorAll("[data-gallery-close]");

    return {
      root,
      dialog,
      content,
      caption,
      prevBtn,
      nextBtn,
      closeBtn,
      closeButtons
    };
  }

  function renderGalleryItem(item, modal) {
    const type = item.dataset.type || "image";
    const src = item.dataset.src || "";
    const caption = item.dataset.caption || "";
    const thumb = item.querySelector("img");
    const fallbackSrc = thumb ? thumb.getAttribute("src") || "" : "";
    const fallbackAlt = thumb ? thumb.getAttribute("alt") || "" : "";

    modal.content.innerHTML = "";
    modal.caption.textContent = caption;

    if (type === "video") {
      const video = document.createElement("video");
      video.className = "gallery-modal__media";
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      modal.content.appendChild(video);
      return;
    }

    const image = document.createElement("img");
    image.className = "gallery-modal__media";
    image.src = src || fallbackSrc;
    image.alt = caption || fallbackAlt || "Imagen de galería";
    image.loading = "eager";
    image.decoding = "async";

    modal.content.appendChild(image);
  }

  function updateNavState(index, total, modal) {
    const isFirst = index <= 0;
    const isLast = index >= total - 1;

    modal.prevBtn.disabled = isFirst;
    modal.nextBtn.disabled = isLast;

    modal.prevBtn.classList.toggle("is-disabled", isFirst);
    modal.nextBtn.classList.toggle("is-disabled", isLast);
  }

  function trapFocus(event, container) {
    const focusableElements = getFocusableElements(container);
    if (!focusableElements.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        [
          'a[href]',
          'button:not([disabled])',
          'textarea:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          '[tabindex]:not([tabindex="-1"])'
        ].join(",")
      )
    ).filter((element) => !element.hasAttribute("hidden"));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.initGallery = initGallery;
  window.destroyGallery = () => {
    cleanupPreparedItems();
    destroyGallery();
  };
  window.openGalleryModal = openGalleryModal;
  window.closeGalleryModal = closeGalleryModal;
})();