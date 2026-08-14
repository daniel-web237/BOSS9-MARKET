// ================= LANDING PAGE (BOSS9 MARKET) =================
// Page statique : pas de Firebase ici, seulement de la mise en scène
// et la synchro du badge panier avec le localStorage du site.

// ---- Badge panier (même clé que script.js) ----
const CART_KEY = "boss9_cart";

function syncCartBadge() {
  const badge = document.getElementById("landingCartCount");
  if (!badge) return;

  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const total = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    badge.textContent = total;
  } catch {
    badge.textContent = "0";
  }
}

// ---- Apparition en douceur du hero au chargement ----
function revealHero() {
  const items = document.querySelectorAll(".reveal-item");
  requestAnimationFrame(() => {
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add("is-visible"), i * 150);
    });
  });

  // active les micro-animations flottantes des cartes/avatars
  // seulement une fois le hero visible, pour un effet plus soigné
  const visual = document.querySelector(".landing-hero-visual");
  if (visual) {
    setTimeout(() => visual.classList.add("is-visible"), 350);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  syncCartBadge();
  revealHero();
});
