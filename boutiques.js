// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  initializeFirestore, collection, getDocs
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

let allShops = [];


// ================= CHARGEMENT DES BOUTIQUES =================
async function loadShops() {
  const grid = document.getElementById("shopsGrid");

  try {
    const snap = await getDocs(collection(db, "shops"));

    if (snap.empty) {
      grid.innerHTML = `<p class="empty-state">Aucune boutique disponible pour le moment</p>`;
      return;
    }

    allShops = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // on compte les produits de chaque boutique en une seule requête
    const productsSnap = await getDocs(collection(db, "products"));
    const counts = {};
    productsSnap.forEach(doc => {
      const uid = doc.data().userId;
      counts[uid] = (counts[uid] || 0) + 1;
    });

    allShops.forEach(shop => { shop.productCount = counts[shop.id] || 0; });

    renderShops(allShops);

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Impossible de charger les boutiques pour le moment</p>`;
  }
}


// ================= AFFICHAGE =================
function renderShops(shops) {
  const grid = document.getElementById("shopsGrid");

  if (shops.length === 0) {
    grid.innerHTML = `<p class="empty-state">Aucune boutique dans cette catégorie</p>`;
    return;
  }

  grid.innerHTML = shops.map(shop => {
    const name = shop.shopName || "Boutique";
    const initial = name.charAt(0).toUpperCase();
    const category = shop.category || "autre";

    return `
      <a href="boutique.html?id=${shop.id}" class="shop-card">
        <div class="shop-avatar">${initial}</div>
        <div class="shop-name">${name}</div>
        <span class="shop-category">${category}</span>
        <span class="shop-count">${shop.productCount} produit${shop.productCount !== 1 ? "s" : ""}</span>
      </a>
    `;
  }).join("");
}


// ================= FILTRE PAR CATÉGORIE =================
function initCategoryFilters() {
  const buttons = document.querySelectorAll("#categoryFilters button");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.dataset.category;
      const filtered = category === "all"
        ? allShops
        : allShops.filter(s => s.category === category);

      renderShops(filtered);
    });
  });
}


// ================= START =================
loadShops();
initCategoryFilters();
