// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  initializeFirestore, collection, addDoc,
  query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBmHTwb3GO773ewseAEQ-BAk9peo18Fgaw",
  authDomain: "boss9-market.firebaseapp.com",
  projectId: "boss9-market"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// experimentalForceLongPolling : force ce mode de connexion directement,
// sur certains réseaux qui filtrent le streaming (WebSocket/gRPC)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});


// ================= SÉCURITÉ =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Connecte-toi !");
    window.location.href = "login.html";
    return;
  }

  // un acheteur ne peut pas accéder au dashboard fournisseur —
  // un fournisseur, lui, peut aussi acheter, donc pas de restriction dans l'autre sens
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role !== "fournisseur") {
      alert("Cette page est réservée aux fournisseurs.");
      window.location.href = "index.html";
      return;
    }
  } catch (err) {
    console.error(err);
  }

  loadReceivedOrders(user.uid);
  loadMyProducts(user.uid);
});


// ================= COMMANDES REÇUES =================
async function loadReceivedOrders(uid) {
  const box = document.getElementById("ordersReceived");
  if (!box) return;

  try {
    const q = query(
      collection(db, "orders"),
      where("supplierIds", "array-contains", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      box.innerHTML = `<p class="empty-state">Aucune commande reçue pour le moment</p>`;
      return;
    }

    box.innerHTML = "";

    snap.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("fr-FR") : "";

      // ne garder que les articles de CE fournisseur dans la commande
      const myItems = o.items.filter(item => item.supplierId === uid);
      const mySubtotal = myItems.reduce((sum, item) => sum + item.price * item.qty, 0);

      box.innerHTML += `
        <div class="order-received">
          <div class="order-received-top">
            <span class="buyer">${o.userName || o.userEmail} — ${date}</span>
            <span class="status">${o.status || "en attente"}</span>
          </div>
          <div class="order-received-items">
            ${myItems.map(item => `
              <div><span>${item.name} × ${item.qty}</span><span>${item.price * item.qty} FCFA</span></div>
            `).join("")}
          </div>
          <div class="order-received-total">Sous-total : ${mySubtotal} FCFA</div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    box.innerHTML = `<p class="empty-state">Impossible de charger les commandes pour le moment</p>`;
  }
}


// ================= LISTE TEMPORAIRE =================
let tempProducts = [];


// ================= AJOUT PRODUIT (À LA LISTE LOCALE) =================
function addToList() {
  const nameInput = document.getElementById("name");
  const priceInput = document.getElementById("price");
  const imageInput = document.getElementById("image");
  const descriptionInput = document.getElementById("description");

  const name = nameInput.value.trim();
  const price = priceInput.value.trim();
  const image = imageInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!name || !price || !image) {
    alert("Remplis tous les champs");
    return;
  }

  tempProducts.push({
    name,
    price: Number(price),
    image,
    description
  });

  // vide le formulaire pour le prochain produit
  nameInput.value = "";
  priceInput.value = "";
  imageInput.value = "";
  descriptionInput.value = "";
  nameInput.focus();

  displayPreview();
}


// ================= AFFICHAGE DE LA LISTE LOCALE =================
function displayPreview() {
  const preview = document.getElementById("preview");

  if (tempProducts.length === 0) {
    preview.innerHTML = `<p class="empty-state">Aucun produit ajouté pour le moment</p>`;
    return;
  }

  preview.innerHTML = "";

  tempProducts.forEach((p, index) => {
    preview.innerHTML += `
      <div class="preview-card">
        <button class="remove" onclick="removeItem(${index})">✕</button>
        <img src="${p.image}" alt="${p.name}">
        <p>${p.name}</p>
        <p class="price">${p.price} FCFA</p>
      </div>
    `;
  });
}


// ================= SUPPRESSION D'UN ÉLÉMENT =================
window.removeItem = function (index) {
  tempProducts.splice(index, 1);
  displayPreview();
};


// ================= ENVOI VERS FIRESTORE =================
async function saveAll() {
  const user = auth.currentUser;

  if (!user) {
    alert("Connecte-toi");
    return;
  }

  if (tempProducts.length === 0) {
    alert("Aucun produit ajouté");
    return;
  }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Publication en cours...";

  try {
    for (let p of tempProducts) {
      await addDoc(collection(db, "products"), {
        ...p,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date()
      });
    }

    alert("Produits enregistrés ✅ — ils sont maintenant visibles sur la page d'accueil");

    tempProducts = [];
    window.location.href = "index.html";

  } catch (e) {
    alert("Erreur : " + e.message);
    saveBtn.disabled = false;
    saveBtn.textContent = "Confirmer et publier";
  }
}


// ================= EVENTS =================
document.getElementById("addBtn").addEventListener("click", addToList);
document.getElementById("saveBtn").addEventListener("click", saveAll);


// ================= MES PRODUITS PUBLIÉS =================
let myProductsCache = [];

async function loadMyProducts(uid) {
  const grid = document.getElementById("myProducts");
  if (!grid) return;

  try {
    const q = query(collection(db, "products"), where("userId", "==", uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = `<p class="empty-state">Aucun produit publié pour le moment</p>`;
      myProductsCache = [];
      return;
    }

    myProductsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMyProducts();

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Impossible de charger tes produits pour le moment</p>`;
  }
}

function renderMyProducts() {
  const grid = document.getElementById("myProducts");
  if (!grid) return;

  grid.innerHTML = "";

  myProductsCache.forEach(p => {
    grid.innerHTML += `
      <div class="my-product-card" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}">
        <h4>${p.name}</h4>
        <div class="price">${p.price} FCFA</div>
        <div class="my-product-actions">
          <button class="btn-edit-product">✏️ Modifier</button>
          <button class="btn-delete-product">🗑 Supprimer</button>
        </div>
      </div>
    `;
  });

  attachProductEvents();
}

function attachProductEvents() {
  document.querySelectorAll(".my-product-card").forEach(card => {
    const id = card.dataset.id;

    card.querySelector(".btn-edit-product").addEventListener("click", () => {
      enterEditMode(card, id);
    });

    card.querySelector(".btn-delete-product").addEventListener("click", () => {
      deleteProduct(id);
    });
  });
}

function enterEditMode(card, id) {
  const product = myProductsCache.find(p => p.id === id);
  if (!product) return;

  card.classList.add("editing");
  card.innerHTML = `
    <input class="edit-name" value="${product.name}" placeholder="Nom du produit">
    <input class="edit-price" type="number" value="${product.price}" placeholder="Prix">
    <input class="edit-image" value="${product.image}" placeholder="URL de l'image">
    <textarea class="edit-description" placeholder="Description du produit">${product.description || ""}</textarea>
    <div class="edit-save-cancel">
      <button class="btn-save-edit">Enregistrer</button>
      <button class="btn-cancel-edit">Annuler</button>
    </div>
  `;

  card.querySelector(".btn-save-edit").addEventListener("click", () => {
    saveProductEdit(id, card);
  });

  card.querySelector(".btn-cancel-edit").addEventListener("click", () => {
    renderMyProducts();
  });
}

async function saveProductEdit(id, card) {
  const name = card.querySelector(".edit-name").value.trim();
  const price = card.querySelector(".edit-price").value.trim();
  const image = card.querySelector(".edit-image").value.trim();
  const description = card.querySelector(".edit-description").value.trim();

  if (!name || !price || !image) {
    alert("Remplis tous les champs");
    return;
  }

  const saveBtn = card.querySelector(".btn-save-edit");
  saveBtn.disabled = true;
  saveBtn.textContent = "...";

  try {
    await updateDoc(doc(db, "products", id), {
      name,
      price: Number(price),
      image,
      description
    });

    const index = myProductsCache.findIndex(p => p.id === id);
    if (index !== -1) {
      myProductsCache[index] = { ...myProductsCache[index], name, price: Number(price), image, description };
    }

    renderMyProducts();

  } catch (err) {
    alert("Erreur : " + err.message);
    saveBtn.disabled = false;
    saveBtn.textContent = "Enregistrer";
  }
}

async function deleteProduct(id) {
  const confirmed = confirm("Supprimer ce produit définitivement ?");
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "products", id));
    myProductsCache = myProductsCache.filter(p => p.id !== id);
    renderMyProducts();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
}
