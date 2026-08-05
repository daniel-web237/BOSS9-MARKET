// ================= IMPORT FIREBASE =================
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  initializeFirestore, collection, getDocs
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

// experimentalForceLongPolling : force ce mode de connexion directement,
// sur certains réseaux qui filtrent le streaming (WebSocket/gRPC)
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
    container.innerHTML += `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p>${p.price} FCFA</p>
        <button class="btn-cart" data-id="${p.id}">Ajouter au panier 🛒</button>
      </div>
    `;
  });
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
    renderProducts(allProducts);

  } catch (err) {
    console.error(err);
    container.innerHTML = "Erreur chargement";
  }
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
    }
  });
}


// ================= RECHERCHE (style Alibaba / Amazon) =================
function initSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  if (!input || !btn) return;

  function runSearch() {
    const term = input.value.trim().toLowerCase();

    if (!term) {
      renderProducts(allProducts);
      return;
    }

    const filtered = allProducts.filter(p =>
      p.name && p.name.toLowerCase().includes(term)
    );

    renderProducts(filtered);
  }

  btn.addEventListener("click", runSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
  });
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
onAuthStateChanged(auth, (user) => {
  const box = document.getElementById("userBox");
  const mobileAccountLink = document.getElementById("mobileAccountLink");

  if (user) {
    if (box) box.innerHTML = `
      <a href="compte.html">👤 ${user.email}</a>
      <button onclick="logout()">Logout</button>
    `;
    if (mobileAccountLink) mobileAccountLink.href = "compte.html";
  } else {
    if (box) box.innerHTML = `<a href="login.html">Connexion</a>`;
    if (mobileAccountLink) mobileAccountLink.href = "login.html";
  }
});


// ================= MENU CATÉGORIES MOBILE (repliable) =================
function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const links = document.getElementById("menuLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
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
