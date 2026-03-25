const modalTriggers = document.querySelectorAll("[data-modal-open]");

function initModals() {
  if (!modalTriggers.length) return;

  modalTriggers.forEach((trigger) => {
    const targetId = trigger.dataset.modalOpen;

    trigger.addEventListener("click", () => {
      openModal(targetId);
    });
  });
}

function openModal(id) {
  const modal = document.querySelector(`[data-modal="${id}"]`);
  if (!modal) return;

  closeAllModals();

  modal.classList.add("is-active");
  document.body.classList.add("modal-open");

  const focusable = modal.querySelector(
    "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
  );

  if (focusable) focusable.focus();

  bindModalEvents(modal);
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("is-active");
  document.body.classList.remove("modal-open");
}

function closeAllModals() {
  const modals = document.querySelectorAll("[data-modal]");
  modals.forEach((modal) => modal.classList.remove("is-active"));
  document.body.classList.remove("modal-open");
}

function bindModalEvents(modal) {
  const closeButtons = modal.querySelectorAll("[data-modal-close]");

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => closeModal(modal));
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });

  document.addEventListener("keydown", handleEscape);
}

function handleEscape(event) {
  if (event.key === "Escape") {
    closeAllModals();
  }
}

document.addEventListener("DOMContentLoaded", initModals);