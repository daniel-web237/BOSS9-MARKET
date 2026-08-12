// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  initializeFirestore, doc, getDoc, collection, query, where, getDocs, limit
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


// ================= PANIER (même localStorage que panier.js) =================
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

function addToCart(product, qty) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      supplierId: product.userId || null,
      qty: qty
    });
  }

  saveCart(cart);
}


// ================= FAVORIS (localStorage, léger — juste sur cette page pour l'instant) =================
const FAVORITES_KEY = "boss9_favorites";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function toggleFavorite(productId) {
  const favs = getFavorites();
  const index = favs.indexOf(productId);

  if (index === -1) {
    favs.push(productId);
  } else {
    favs.splice(index, 1);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(productId);
}


// ================= RÉCUPÉRER L'ID DANS L'URL =================
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const page = document.getElementById("productPage");


// ================= AFFICHAGE =================
function renderProduct(product) {
  const description = (product.description || "").trim();

  // toutes les photos du produit — repli sur la photo unique pour les
  // produits publiés avant l'ajout de la galerie multi-photos
  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  const isFav = getFavorites().includes(product.id);

  page.innerHTML = `
    <div class="product-layout">
      <div class="gallery-col">
        <div class="gallery-main">
          <img src="${images[0]}" alt="${product.name}" id="mainImage">
          <button class="fav-btn ${isFav ? "active" : ""}" id="favBtn" aria-label="Ajouter aux favoris">
            ${isFav ? "♥" : "♡"}
          </button>
        </div>

        ${images.length > 1 ? `
          <div class="gallery-thumbs" id="galleryThumbs">
            ${images.map((img, i) => `
              <img src="${img}" alt="Photo ${i + 1}" class="thumb ${i === 0 ? "active" : ""}" data-src="${img}">
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div class="product-info">
        <h1>${product.name}</h1>
        <div class="product-price">${product.price} FCFA</div>

        <div class="product-meta">
          <span class="meta-badge">Fournisseur vérifié</span>
          ${product.category ? `<span class="meta-badge category">${product.category}</span>` : ""}
        </div>

        <div class="product-description">
          <h3>Description</h3>
          ${
            description
              ? `<p>${description}</p>`
              : `<p class="no-description">Le fournisseur n'a pas encore ajouté de description pour ce produit.</p>`
          }
        </div>

        <div class="buy-box">
          <div class="qty-row">
            <label>Quantité</label>
            <div class="qty-control">
              <button id="qtyMinus">−</button>
              <span id="qtyValue">1</span>
              <button id="qtyPlus">+</button>
            </div>
          </div>

          <button class="btn-add-cart" id="addCartBtn">Ajouter au panier 🛒</button>
          <p class="added-confirm" id="addedConfirm">Ajouté au panier ✓</p>
        </div>
      </div>
    </div>

    <section class="similar-section" id="similarSection"></section>
  `;

  // ---- galerie : clic sur une miniature change la photo principale ----
  const mainImage = document.getElementById("mainImage");
  document.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      mainImage.src = thumb.dataset.src;
      document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  // ---- favoris ----
  document.getElementById("favBtn").addEventListener("click", (e) => {
    const nowFav = toggleFavorite(product.id);
    e.target.textContent = nowFav ? "♥" : "♡";
    e.target.classList.toggle("active", nowFav);
  });

  // ---- quantité + panier ----
  let qty = 1;
  const qtyValue = document.getElementById("qtyValue");

  document.getElementById("qtyMinus").addEventListener("click", () => {
    if (qty > 1) qty--;
    qtyValue.textContent = qty;
  });

  document.getElementById("qtyPlus").addEventListener("click", () => {
    qty++;
    qtyValue.textContent = qty;
  });

  document.getElementById("addCartBtn").addEventListener("click", () => {
    addToCart(product, qty);
    const confirm = document.getElementById("addedConfirm");
    confirm.classList.add("show");
    setTimeout(() => confirm.classList.remove("show"), 2000);
  });

  loadSimilarProducts(product);
}


// ================= PRODUITS SIMILAIRES (même catégorie) =================
async function loadSimilarProducts(product) {
  const section = document.getElementById("similarSection");
  if (!product.category) return; // pas de catégorie, pas de comparaison fiable possible

  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", product.category),
      limit(9)
    );
    const snap = await getDocs(q);

    const similar = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.id !== product.id)
      .slice(0, 6);

    if (similar.length === 0) return; // rien à montrer, on n'affiche pas de section vide

    section.innerHTML = `
      <h3>Produits similaires</h3>
      <div class="similar-grid">
        ${similar.map(p => `
          <div class="similar-card" data-id="${p.id}">
            <img src="${p.image}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p>${p.price} FCFA</p>
          </div>
        `).join("")}
      </div>
    `;

    section.querySelectorAll(".similar-card").forEach(card => {
      card.addEventListener("click", () => {
        window.location.href = `produit.html?id=${card.dataset.id}`;
      });
    });

  } catch (err) {
    console.error(err);
    // silencieux — les produits similaires sont un bonus, pas un élément critique
  }
}


// ================= CHARGEMENT =================
async function loadProduct() {
  if (!productId) {
    page.innerHTML = `<p class="state-message">Produit introuvable — vérifie le lien.</p>`;
    return;
  }

  try {
    const snap = await getDoc(doc(db, "products", productId));

    if (!snap.exists()) {
      page.innerHTML = `<p class="state-message">Ce produit n'existe plus ou a été retiré de la boutique.</p>`;
      return;
    }

    renderProduct({ id: snap.id, ...snap.data() });

  } catch (err) {
    console.error(err);
    page.innerHTML = `<p class="state-message">Impossible de charger ce produit pour le moment.</p>`;
  }
}

loadProduct();
