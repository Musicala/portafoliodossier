/**
 * =========================================================
 * FILTERS
 * - Inicializa grupos de filtros declarativos con [data-filters]
 * - Filtra items por categorías en [data-category]
 * - Maneja estado activo, accesibilidad y limpieza
 * - Evita doble inicialización
 * =========================================================
 */

(function () {
  "use strict";

  const FILTER_HIDDEN_CLASS = "is-hidden";
  const FILTER_ACTIVE_CLASS = "is-active";

  function getFilterContainers() {
    return Array.from(document.querySelectorAll("[data-filters]"));
  }

  function initFilters() {
    destroyFilters();

    const containers = getFilterContainers();
    if (!containers.length) return;

    containers.forEach((container) => {
      const buttons = getFilterButtons(container);
      const items = getFilterItems(container);

      if (!buttons.length || !items.length) return;

      prepareFilterButtons(buttons);

      buttons.forEach((button) => {
        const handleClick = () => {
          const filterValue = normalizeFilterValue(button.dataset.filter || "all");
          setActiveButton(buttons, button);
          applyFilter(items, filterValue);
          updateContainerState(container, filterValue, items);
        };

        button.addEventListener("click", handleClick);
        button.__filtersClickHandler = handleClick;
      });

      const defaultButton =
        buttons.find((button) => button.classList.contains(FILTER_ACTIVE_CLASS)) ||
        buttons.find((button) => normalizeFilterValue(button.dataset.filter || "") === "all") ||
        buttons[0];

      if (defaultButton) {
        const initialFilter = normalizeFilterValue(defaultButton.dataset.filter || "all");
        setActiveButton(buttons, defaultButton);
        applyFilter(items, initialFilter, { immediate: true });
        updateContainerState(container, initialFilter, items);
      }
    });
  }

  function destroyFilters() {
    const containers = getFilterContainers();

    containers.forEach((container) => {
      const buttons = getFilterButtons(container);
      const items = getFilterItems(container);

      buttons.forEach((button) => {
        if (button.__filtersClickHandler) {
          button.removeEventListener("click", button.__filtersClickHandler);
          delete button.__filtersClickHandler;
        }

        if (button.__filtersKeyHandler) {
          button.removeEventListener("keydown", button.__filtersKeyHandler);
          delete button.__filtersKeyHandler;
        }
      });

      items.forEach((item) => {
        resetItemState(item);
      });
    });
  }

  function getFilterButtons(container) {
    return Array.from(container.querySelectorAll("[data-filter]"));
  }

  function getFilterItems(container) {
    return Array.from(container.querySelectorAll("[data-filter-item]"));
  }

  function prepareFilterButtons(buttons) {
    buttons.forEach((button, index) => {
      if (!button.hasAttribute("type") && button.tagName.toLowerCase() === "button") {
        button.setAttribute("type", "button");
      }

      button.setAttribute("role", "tab");
      button.setAttribute("tabindex", index === 0 ? "0" : "-1");
      button.setAttribute("aria-selected", button.classList.contains(FILTER_ACTIVE_CLASS) ? "true" : "false");

      const handleKeydown = (event) => {
        handleFilterKeyboardNavigation(event, buttons, button);
      };

      button.addEventListener("keydown", handleKeydown);
      button.__filtersKeyHandler = handleKeydown;
    });
  }

  function handleFilterKeyboardNavigation(event, buttons, currentButton) {
    const currentIndex = buttons.indexOf(currentButton);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        nextIndex = (currentIndex + 1) % buttons.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = buttons.length - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        currentButton.click();
        return;
      default:
        return;
    }

    buttons.forEach((button) => button.setAttribute("tabindex", "-1"));
    buttons[nextIndex].setAttribute("tabindex", "0");
    buttons[nextIndex].focus();
  }

  function setActiveButton(buttons, activeButton) {
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle(FILTER_ACTIVE_CLASS, isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  }

  function applyFilter(items, filterValue, options = {}) {
    const { immediate = false } = options;

    items.forEach((item) => {
      const itemCategories = getItemCategories(item);
      const shouldShow = filterValue === "all" || itemCategories.includes(filterValue);

      if (shouldShow) {
        showItem(item, { immediate });
      } else {
        hideItem(item, { immediate });
      }
    });
  }

  function getItemCategories(item) {
    const rawValue = item.dataset.category || "";

    return rawValue
      .split(",")
      .map((value) => normalizeFilterValue(value))
      .filter(Boolean);
  }

  function normalizeFilterValue(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function showItem(item, options = {}) {
    const { immediate = false } = options;

    item.hidden = false;
    item.style.display = "";
    item.classList.remove(FILTER_HIDDEN_CLASS);
    item.setAttribute("aria-hidden", "false");

    if (immediate || prefersReducedMotion()) {
      item.style.opacity = "";
      item.style.transform = "";
      item.style.pointerEvents = "";
      return;
    }

    item.style.pointerEvents = "";
    item.style.willChange = "opacity, transform";
    item.style.opacity = "0";
    item.style.transform = "translate3d(0, 10px, 0)";

    requestAnimationFrame(() => {
      item.style.opacity = "1";
      item.style.transform = "translate3d(0, 0, 0)";
    });

    window.setTimeout(() => {
      item.style.willChange = "";
    }, 260);
  }

  function hideItem(item, options = {}) {
    const { immediate = false } = options;

    item.setAttribute("aria-hidden", "true");
    item.style.pointerEvents = "none";

    if (immediate || prefersReducedMotion()) {
      item.hidden = true;
      item.style.display = "none";
      item.classList.add(FILTER_HIDDEN_CLASS);
      item.style.opacity = "";
      item.style.transform = "";
      item.style.pointerEvents = "";
      return;
    }

    item.style.willChange = "opacity, transform";
    item.style.opacity = "0";
    item.style.transform = "translate3d(0, 10px, 0)";

    window.setTimeout(() => {
      item.hidden = true;
      item.style.display = "none";
      item.classList.add(FILTER_HIDDEN_CLASS);
      item.style.willChange = "";
      item.style.pointerEvents = "";
    }, 220);
  }

  function resetItemState(item) {
    item.hidden = false;
    item.style.display = "";
    item.style.opacity = "";
    item.style.transform = "";
    item.style.pointerEvents = "";
    item.style.willChange = "";
    item.classList.remove(FILTER_HIDDEN_CLASS);
    item.setAttribute("aria-hidden", "false");
  }

  function updateContainerState(container, filterValue, items) {
    const visibleCount = items.filter((item) => !item.hidden).length;
    container.dataset.activeFilter = filterValue;
    container.dataset.visibleCount = String(visibleCount);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  window.initFilters = initFilters;
  window.destroyFilters = destroyFilters;
})();