// ================= THEME.JS — mode sombre / clair =================
// Ce fichier a 2 usages, tous les deux nécessaires :
//
// 1. applyStoredTheme() doit tourner AVANT le rendu de la page, pour
//    éviter un flash blanc→sombre au chargement. Colle ce petit
//    extrait en tout premier dans le <head>, avant les <link> CSS :
//
//      <script>
//        (function () {
//          var t = localStorage.getItem("boss9_theme") ||
//                  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
//          document.documentElement.setAttribute("data-theme", t);
//        })();
//      </script>
//
// 2. Ce fichier theme.js (chargé normalement, en bas de page ou avec
//    defer) gère ensuite le bouton de bascule et la synchro entre
//    onglets/pages.

const THEME_KEY = "boss9_theme";

function getCurrentTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  updateToggleIcons(theme);
}

function toggleTheme() {
  setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
}

function updateToggleIcons(theme) {
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-label", theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
  });
}

function initThemeToggle() {
  updateToggleIcons(getCurrentTheme());

  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });
}

// si l'utilisateur change le thème dans un autre onglet, on suit
window.addEventListener("storage", (e) => {
  if (e.key === THEME_KEY && e.newValue) {
    document.documentElement.setAttribute("data-theme", e.newValue);
    updateToggleIcons(e.newValue);
  }
});

document.addEventListener("DOMContentLoaded", initThemeToggle);
