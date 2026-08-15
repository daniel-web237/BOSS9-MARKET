// ================= IMPORT FIREBASE =================
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  initializeFirestore, collection, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBmHTwb3GO773ewseAEQ-BAk9peo18Fgaw",
  authDomain: "boss9-market.firebaseapp.com",
  projectId: "boss9-market"
};


// ================= INIT =================
const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
const auth = getAuth(app);


// ================= CACHER LE LOADER =================
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});


// ================= STOCKAGE PRODUITS (pour la recherche) =================
let allProducts = [];


// ================= AFFICHER UNE LISTE DE PRODUITS =================
function renderProducts(products) {
  const container = document.getElementById("productList");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = "Aucun produit trouvé";
    return;
  }

  container.innerHTML = "";

  products.forEach(p => {
    const formattedPrice = Number(p.price).toLocaleString("fr-FR");

    container.innerHTML += `
      <div class="product-card" data-open-id="${p.id}">
        <div class="product-img-wrap">
          ${p.category ? `<span class="product-badge">${p.category}</span>` : ""}
          <img src="${p.image}" alt="${p.name}">
        </div>
        <h4>${p.name}</h4>
        <p class="product-price"><span class="price-value">${formattedPrice}</span><span class="price-currency">FCFA</span></p>
        <button class="btn-cart" data-id="${p.id}"><span class="cart-icon">🛒</span>Ajouter au panier</button>
      </div>
    `;
  });
}


// ================= MEGA-MENU : catégories en vedette avec vraies photos =================
const MEGA_CATEGORIES = [
  { key: "mode", label: "Mode", icon: "👗" },
  { key: "electronique", label: "Électronique", icon: "💻" },
  { key: "maison", label: "Maison", icon: "🏠" },
  { key: "beaute", label: "Beauté", icon: "💄" },
  { key: "alimentation", label: "Alimentation", icon: "🍎" },
  { key: "autre", label: "Autre", icon: "➕" }
];

function populateMegaMenu() {
  const grid = document.getElementById("megaMenuGrid");
  if (!grid) return;

  grid.innerHTML = MEGA_CATEGORIES.map(cat => {
    const sample = allProducts.find(p => p.category === cat.key && p.image);
    const visual = sample
      ? `<img src="${sample.image}" alt="${cat.label}">`
      : `<span class="mega-tile-emoji">${cat.icon}</span>`;

    return `
      <a href="produits.html?category=${cat.key}" class="mega-tile">
        <span class="mega-tile-visual">${visual}</span>
        <span class="mega-tile-label">${cat.label}</span>
      </a>
    `;
  }).join("");
}


// ================= CHARGER PRODUITS DEPUIS FIRESTORE =================
async function loadProducts() {
  const container = document.getElementById("productList");
  if (!container) return;

  container.innerHTML = "Chargement...";

  try {
    const snapshot = await getDocs(collection(db, "products"));

    if (snapshot.empty) {
      container.innerHTML = "Aucun produit disponible";
      return;
    }

    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    populateMegaMenu();
    applyInitialFilterFromURL();

  } catch (err) {
    console.error(err);
    container.innerHTML = "Erreur chargement";
  }
}


// ================= FILTRE INITIAL DEPUIS L'URL (?category=... ou ?supplier=...) =================
function applyInitialFilterFromURL() {
  const params = new URLSearchParams(window.location.search);
  const supplierId = params.get("supplier");
  const category = params.get("category");

  if (supplierId) {
    const filtered = allProducts.filter(p => p.userId === supplierId);
    renderProducts(filtered);
    showFilterBanner(
      filtered.length > 0 ? `Boutique : ${filtered[0].shopName || "Fournisseur"}` : "Cette boutique n'a pas encore de produits"
    );
    return;
  }

  if (category) {
    const categorySelect = document.getElementById("categoryFilter");
    if (categorySelect) categorySelect.value = category;
    const filtered = allProducts.filter(p => p.category === category);
    renderProducts(filtered);
    return;
  }

  renderProducts(allProducts);
}

function showFilterBanner(text) {
  const section = document.querySelector(".products");
  if (!section || document.getElementById("filterBanner")) return;

  const banner = document.createElement("div");
  banner.id = "filterBanner";
  banner.className = "filter-banner";
  banner.innerHTML = `<span>${text}</span> <a href="produits.html">Voir tous les produits ✕</a>`;
  section.insertBefore(banner, section.querySelector(".product-list"));
}


// ================= PANIER (localStorage) =================
const CART_KEY = "boss9_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const badge = document.getElementById("cartCount");
  const badgeMobile = document.getElementById("cartCountMobile");
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) badge.textContent = total;
  if (badgeMobile) badgeMobile.textContent = total;
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      supplierId: product.userId || null,
      qty: 1
    });
  }

  saveCart(cart);
}

function initCartButtons() {
  const container = document.getElementById("productList");
  if (!container) return;

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-cart")) {
      addToCart(e.target.dataset.id);
      e.target.textContent = "Ajouté ✓";
      setTimeout(() => { e.target.textContent = "Ajouter au panier 🛒"; }, 1200);
      return;
    }

    const card = e.target.closest("[data-open-id]");
    if (card) {
      window.location.href = `produit.html?id=${card.dataset.openId}`;
    }
  });
}


// ================= RECHERCHE (style Alibaba / Amazon) =================
function getFilteredProducts() {
  const input = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categoryFilter");

  const term = input ? input.value.trim().toLowerCase() : "";
  const category = categorySelect ? categorySelect.value : "all";

  return allProducts.filter(p => {
    const matchesTerm = !term || (p.name && p.name.toLowerCase().includes(term));
    const matchesCategory = category === "all" || p.category === category;
    return matchesTerm && matchesCategory;
  });
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  const categorySelect = document.getElementById("categoryFilter");
  const suggestionsBox = document.getElementById("searchSuggestions");
  if (!input || !btn) return;

  function runSearch() {
    hideSuggestions();
    renderProducts(getFilteredProducts());
  }

  function hideSuggestions() {
    if (suggestionsBox) suggestionsBox.classList.remove("show");
  }

  function showSuggestions() {
    if (!suggestionsBox) return;

    const term = input.value.trim().toLowerCase();

    if (!term) {
      hideSuggestions();
      return;
    }

    const matches = allProducts
      .filter(p => p.name && p.name.toLowerCase().includes(term))
      .slice(0, 6);

    if (matches.length === 0) {
      suggestionsBox.innerHTML = `<div class="sugg-empty">Aucun produit trouvé pour "${input.value.trim()}"</div>`;
    } else {
      suggestionsBox.innerHTML = matches.map(p => `
        <div class="sugg-item" data-id="${p.id}">
          <img src="${p.image}" alt="">
          <span class="sugg-name">${p.name}</span>
          <span class="sugg-price">${p.price} FCFA</span>
        </div>
      `).join("");
    }

    suggestionsBox.classList.add("show");
  }

  btn.addEventListener("click", runSearch);

  input.addEventListener("input", showSuggestions);
  input.addEventListener("focus", showSuggestions);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
    if (e.key === "Escape") hideSuggestions();
  });

  if (suggestionsBox) {
    suggestionsBox.addEventListener("click", (e) => {
      const item = e.target.closest(".sugg-item");
      if (item && item.dataset.id) {
        window.location.href = `produit.html?id=${item.dataset.id}`;
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-input-wrap")) {
      hideSuggestions();
    }
  });

  if (categorySelect) {
    categorySelect.addEventListener("change", runSearch);
  }
}


// ================= ANIMATION AU SCROLL (.reveal) =================
function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}


// ================= USER (AUTH) =================
onAuthStateChanged(auth, async (user) => {
  const box = document.getElementById("userBox");
  const mobileAccountLink = document.getElementById("mobileAccountLink");

  if (user) {
    if (mobileAccountLink) mobileAccountLink.href = "compte.html";

    // nom affiché : celui du profil Firestore (fullname), sinon le
    // pseudo Firebase Auth (displayName), sinon la partie avant le "@"
    // de l'email — jamais l'adresse email complète.
    let displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Mon compte");
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().fullname) {
        displayName = snap.data().fullname;
      }
    } catch (e) {
      console.error(e);
    }

    const initial = displayName.charAt(0).toUpperCase();

    if (box) {
      box.innerHTML = `
        <div class="account-widget" id="accountWidget">
          <button class="account-trigger" id="accountTrigger">
            <span class="account-avatar">${initial}</span>
            <span class="account-name">${displayName}</span>
          </button>
          <div class="account-dropdown" id="accountDropdown">
            <a href="compte.html">Mon compte</a>
            <button onclick="logout()">Déconnexion</button>
          </div>
        </div>
      `;

      const trigger = document.getElementById("accountTrigger");
      const dropdown = document.getElementById("accountDropdown");

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("show");
      });
    }

  } else {
    if (box) box.innerHTML = `<a href="login.html" class="connexion-btn">👤 Connexion</a>`;
    if (mobileAccountLink) mobileAccountLink.href = "login.html";
  }
});


// ================= MEGA-MENU CATÉGORIES (survol) =================
function initMegaMenu() {
  const links = document.querySelectorAll(".mega-cat, .mega-grid-item");
  const categorySelect = document.getElementById("categoryFilter");
  const productsSection = document.getElementById("produits");
  if (!links.length) return;

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = link.dataset.category;

      if (categorySelect) {
        categorySelect.value = category;
        categorySelect.dispatchEvent(new Event("change"));
      }

      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}


// ================= MENU CATÉGORIES MOBILE (repliable) =================
function initMobileMenu() {
  const toggles = document.querySelectorAll(".menu-toggle-btn");
  const links = document.getElementById("menuLinks");
  if (!toggles.length || !links) return;

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
  });
}


// ================= LOGOUT =================
window.logout = function () {
  signOut(auth).then(() => location.reload());
};



// ================= START =================
loadProducts();
initSearch();
initReveal();
initCartButtons();
updateCartCount();
initMobileMenu();
