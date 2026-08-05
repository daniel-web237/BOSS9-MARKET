// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  initializeFirestore, collection, addDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBmHTwb3GO773ewseAEQ-BAk9peo18Fgaw",
  authDomain: "boss9-market.firebaseapp.com",
  projectId: "boss9-market"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});


// ================= EMAILJS =================
const EMAILJS_PUBLIC_KEY = "ciFoF8v_-0DDYBU7c";
const EMAILJS_SERVICE_ID = "service_x2nfjnx";
const EMAILJS_TEMPLATE_ORDER = "template_y1azja9";

if (window.emailjs) {
  window.emailjs.init(EMAILJS_PUBLIC_KEY);
}

function sendOrderEmail(toName, toEmail, cart, total) {
  if (!window.emailjs) return Promise.resolve();

  const itemsList = cart.map(i => `${i.name} × ${i.qty} — ${i.price * i.qty} FCFA`).join("\n");

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ORDER, {
    to_name: toName,
    to_email: toEmail,
    items_list: itemsList,
    total: total
  }).catch(err => console.error("Erreur envoi email:", err));
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
}


// ================= AFFICHAGE =================
function render() {
  const cart = getCart();
  const content = document.getElementById("cartContent");

  if (cart.length === 0) {
    content.innerHTML = `
      <div class="empty-cart">
        <p>Ton panier est vide pour le moment.</p>
        <a href="index.html">Voir les produits</a>
      </div>
    `;
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  content.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${cart.map(item => `
          <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <div class="unit-price">${item.price} FCFA / unité</div>
            </div>
            <div class="qty-control">
              <button class="qty-minus">−</button>
              <span>${item.qty}</span>
              <button class="qty-plus">+</button>
            </div>
            <div class="line-total">${item.price * item.qty} FCFA</div>
            <button class="remove-item">🗑</button>
          </div>
        `).join("")}
      </div>

      <div class="summary-card">
        <h3>Résumé de la commande</h3>
        <div class="summary-row">
          <span>Articles</span>
          <span>${cart.reduce((n, i) => n + i.qty, 0)}</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span>${total} FCFA</span>
        </div>
        <button class="btn-checkout" id="checkoutBtn">Passer la commande</button>
      </div>
    </div>
  `;

  attachEvents();
}


// ================= EVENTS SUR LES LIGNES =================
function attachEvents() {
  document.querySelectorAll(".cart-item").forEach(row => {
    const id = row.dataset.id;

    row.querySelector(".qty-plus").addEventListener("click", () => {
      changeQty(id, 1);
    });

    row.querySelector(".qty-minus").addEventListener("click", () => {
      changeQty(id, -1);
    });

    row.querySelector(".remove-item").addEventListener("click", () => {
      const cart = getCart().filter(item => item.id !== id);
      saveCart(cart);
      render();
    });
  });

  document.getElementById("checkoutBtn").addEventListener("click", checkout);
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    saveCart(cart.filter(i => i.id !== id));
  } else {
    saveCart(cart);
  }

  render();
}


// ================= COMMANDE =================
async function checkout() {
  if (!currentUser) {
    alert("Connecte-toi pour passer ta commande");
    window.location.href = "login.html";
    return;
  }

  const cart = getCart();
  if (cart.length === 0) return;

  const btn = document.getElementById("checkoutBtn");
  btn.disabled = true;
  btn.textContent = "Envoi de la commande...";

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const supplierIds = [...new Set(cart.map(item => item.supplierId).filter(Boolean))];

  // on va chercher le vrai nom de l'acheteur, pour l'email ET pour
  // qu'il s'affiche proprement côté fournisseur (au lieu de l'email brut)
  let buyerName = currentUser.email;
  try {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (userSnap.exists() && userSnap.data().fullname) {
      buyerName = userSnap.data().fullname;
    }
  } catch (e) {
    console.error("Impossible de récupérer le nom:", e);
  }

  try {
    await addDoc(collection(db, "orders"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: buyerName,
      items: cart,
      supplierIds,
      total,
      status: "en attente",
      createdAt: new Date()
    });

    localStorage.removeItem(CART_KEY);

    // on attend l'envoi de l'email, mais pas plus de 5s, pour ne pas
    // bloquer la redirection si EmailJS est lent ou indisponible
    const emailSend = sendOrderEmail(buyerName, currentUser.email, cart, total);
    const timeout = new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.race([emailSend, timeout]);

    alert("Commande envoyée ✅ — retrouve son statut dans \"Mon compte\"");
    window.location.href = "compte.html";

  } catch (err) {
    alert("Erreur : " + err.message);
    btn.disabled = false;
    btn.textContent = "Passer la commande";
  }
}


// ================= START =================
render();