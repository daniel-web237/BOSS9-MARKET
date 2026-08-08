// =====================================================
// BOSS9 MARKET — TOAST.JS (notifications professionnelles)
// Remplace window.alert() par des notifications élégantes.
// Usage : showToast("Texte du message", "success" | "error" | "warning" | "info", "Titre optionnel")
// =====================================================

const TOAST_ICONS = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i"
};

const TOAST_TITLES = {
  success: "Succès",
  error: "Erreur",
  warning: "Attention",
  info: "Info"
};

function getToastContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  return container;
}

window.showToast = function (message, type = "info", title = null, duration = 4000) {
  const container = getToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <div class="toast-body">
      <div class="toast-title">${title || TOAST_TITLES[type] || TOAST_TITLES.info}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Fermer">✕</button>
  `;

  function remove() {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 250);
  }

  toast.querySelector(".toast-close").addEventListener("click", remove);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(remove, duration);
  }
};
