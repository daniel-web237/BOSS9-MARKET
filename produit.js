// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  initializeFirestore, doc, getDoc
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


// ================= RÉCUPÉRER L'ID DANS L'URL =================
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const page = document.getElementById("productPage");


// ================= AFFICHAGE =================
function renderProduct(product) {
  const description = (product.description || "").trim();

  page.innerHTML = `
    <div class="product-layout">
      <div class="gallery-main">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="product-info">
        <h1>${product.name}</h1>
        <div class="product-price">${product.price} FCFA</div>

        <div class="product-meta">
          <span class="meta-badge">Fournisseur vérifié</span>
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
  `;

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
