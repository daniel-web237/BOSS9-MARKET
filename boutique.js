// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  initializeFirestore, doc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmHTwb3GO773ewseAEQ-BAk9peo18Fgaw",
  authDomain: "boss9-market.firebaseapp.com",
  projectId: "boss9-market"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});


// ================= PANIER (même localStorage que le reste du site) =================
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
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

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


// ================= RÉCUPÉRER L'ID DANS L'URL =================
const params = new URLSearchParams(window.location.search);
const shopId = params.get("id");


// ================= CHARGEMENT DU PROFIL BOUTIQUE =================
async function loadShop() {
  if (!shopId) {
    document.getElementById("shopName").textContent = "Boutique introuvable";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "shops", shopId));

    if (!snap.exists()) {
      document.getElementById("shopName").textContent = "Cette boutique n'existe plus";
      return;
    }

    const shop = snap.data();
    const name = shop.shopName || "Boutique";

    document.getElementById("shopName").textContent = name;
    document.getElementById("shopAvatar").textContent = name.charAt(0).toUpperCase();
    document.getElementById("shopCategory").textContent = shop.category || "autre";
    document.title = `${name} — BOSS9 Market`;

  } catch (err) {
    console.error(err);
    document.getElementById("shopName").textContent = "Erreur de chargement";
  }
}


// ================= CHARGEMENT DES PRODUITS DE LA BOUTIQUE =================
async function loadShopProducts() {
  const grid = document.getElementById("shopProducts");
  const countEl = document.getElementById("shopCount");
  if (!shopId) return;

  try {
    const q = query(collection(db, "products"), where("userId", "==", shopId));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = `<p class="empty-state">Cette boutique n'a pas encore publié de produit</p>`;
      if (countEl) countEl.textContent = "0 produit";
      return;
    }

    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (countEl) countEl.textContent = `${products.length} produit${products.length !== 1 ? "s" : ""}`;

    grid.innerHTML = products.map(p => `
      <div class="shop-product-card" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}">
        <h4>${p.name}</h4>
        <div class="price">${p.price} FCFA</div>
      </div>
    `).join("");

    grid.querySelectorAll(".shop-product-card").forEach(card => {
      card.addEventListener("click", () => {
        window.location.href = `produit.html?id=${card.dataset.id}`;
      });
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Impossible de charger les produits pour le moment</p>`;
  }
}


// ================= START =================
loadShop();
loadShopProducts();
