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


// ================= CLOUDINARY (hébergement des photos) =================
// 👉 Remplace ces 2 valeurs par les tiennes (Dashboard Cloudinary)
const CLOUDINARY_CLOUD_NAME = "scy7tjyj";
const CLOUDINARY_UPLOAD_PRESET = "boss9_products";

async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Échec de l'envoi de la photo");
  }

  const data = await response.json();
  return data.secure_url;
}


// ================= SÉCURITÉ =================
let currentShopName = "";
let currentCategory = "";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showToast("Connecte-toi pour accéder à ton dashboard fournisseur.", "warning", "Connexion requise");
    setTimeout(() => { window.location.href = "login.html"; }, 1400);
    return;
  }

  // un acheteur ne peut pas accéder au dashboard fournisseur —
  // un fournisseur, lui, peut aussi acheter, donc pas de restriction dans l'autre sens
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role !== "fournisseur") {
      showToast("Cette page est réservée aux comptes fournisseur.", "warning", "Accès refusé");
      setTimeout(() => { window.location.href = "index.html"; }, 1400);
      return;
    }

    if (snap.exists()) {
      currentShopName = snap.data().shopName || "";
      currentCategory = snap.data().category || "";
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
  const imageInput = document.getElementById("imageFile");
  const descriptionInput = document.getElementById("description");

  const name = nameInput.value.trim();
  // tolère "15 000", "15,000", "15.000" — on garde juste les chiffres
  const priceRaw = priceInput.value.replace(/[^0-9]/g, "");
  const price = priceRaw ? Number(priceRaw) : null;
  const imageFiles = Array.from(imageInput.files);
  const description = descriptionInput.value.trim();

  if (!name) {
    showToast("Le nom du produit est vide.", "warning", "Champ manquant");
    nameInput.focus();
    return;
  }

  if (!price) {
    showToast("Le prix est vide ou invalide — écris juste des chiffres, ex: 15000.", "warning", "Prix invalide");
    priceInput.focus();
    return;
  }

  if (imageFiles.length === 0) {
    showToast("Choisis au moins une photo pour ce produit.", "warning", "Photo manquante");
    imageInput.focus();
    return;
  }

  tempProducts.push({
    name,
    price,
    imageFiles,
    previewUrls: imageFiles.map(f => URL.createObjectURL(f)), // aperçu local, avant upload
    description
  });

  // vide le formulaire pour le prochain produit
  nameInput.value = "";
  priceInput.value = "";
  imageInput.value = "";
  descriptionInput.value = "";
  document.getElementById("imagePreviewList").innerHTML = "";
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
        <img src="${p.previewUrls[0]}" alt="${p.name}">
        ${p.previewUrls.length > 1 ? `<span class="photo-count">+${p.previewUrls.length - 1} photo(s)</span>` : ""}
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
    showToast("Connecte-toi pour publier tes produits.", "warning", "Connexion requise");
    return;
  }

  if (tempProducts.length === 0) {
    showToast("Ajoute au moins un produit à la liste avant de publier.", "warning", "Liste vide");
    return;
  }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;

  try {
    let done = 0;

    for (let p of tempProducts) {
      const imageUrls = [];

      for (let i = 0; i < p.imageFiles.length; i++) {
        done++;
        saveBtn.textContent = `Envoi photo ${i + 1}/${p.imageFiles.length} (produit ${tempProducts.indexOf(p) + 1}/${tempProducts.length})...`;
        const url = await uploadToCloudinary(p.imageFiles[i]);
        imageUrls.push(url);
      }

      await addDoc(collection(db, "products"), {
        name: p.name,
        price: p.price,
        description: p.description,
        image: imageUrls[0],   // photo de couverture (compatibilité avec le reste du site)
        images: imageUrls,     // toutes les photos, pour la galerie sur la fiche produit
        userId: user.uid,
        userEmail: user.email,
        shopName: currentShopName,
        category: currentCategory,
        createdAt: new Date()
      });
    }

    showToast("Tes produits sont publiés et déjà visibles sur la page d'accueil.", "success", "Publication réussie");

    tempProducts = [];
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1600);

  } catch (e) {
    showToast(e.message, "error", "Échec de la publication");
    saveBtn.disabled = false;
    saveBtn.textContent = "Confirmer et publier";
  }
}


// ================= EVENTS =================
document.getElementById("addBtn").addEventListener("click", addToList);
document.getElementById("saveBtn").addEventListener("click", saveAll);

document.getElementById("imageFile").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  const list = document.getElementById("imagePreviewList");

  list.innerHTML = files.map(f => `<img src="${URL.createObjectURL(f)}" alt="Aperçu">`).join("");
});


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
    <input class="edit-price" type="text" inputmode="numeric" value="${product.price}" placeholder="Prix">
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
  const priceRaw = card.querySelector(".edit-price").value.replace(/[^0-9]/g, "");
  const price = priceRaw ? Number(priceRaw) : null;
  const image = card.querySelector(".edit-image").value.trim();
  const description = card.querySelector(".edit-description").value.trim();

  if (!name || !price || !image) {
    showToast("Remplis tous les champs (le prix en chiffres uniquement).", "warning", "Champs manquants");
    return;
  }

  const saveBtn = card.querySelector(".btn-save-edit");
  saveBtn.disabled = true;
  saveBtn.textContent = "...";

  try {
    await updateDoc(doc(db, "products", id), {
      name,
      price,
      image,
      description
    });

    const index = myProductsCache.findIndex(p => p.id === id);
    if (index !== -1) {
      myProductsCache[index] = { ...myProductsCache[index], name, price, image, description };
    }

    renderMyProducts();
    showToast("Le produit a bien été mis à jour.", "success", "Modifications enregistrées");

  } catch (err) {
    showToast(err.message, "error", "Échec de la modification");
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
    showToast("Le produit a été supprimé de ta boutique.", "success", "Produit supprimé");
  } catch (err) {
    showToast(err.message, "error", "Échec de la suppression");
  }
}
