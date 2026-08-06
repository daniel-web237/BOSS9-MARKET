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

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});


// ================= CLOUDINARY =================
async function uploadImage(file) {
  const url = "https://api.cloudinary.com/v1_1/TON_CLOUD_NAME/image/upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset");

  const res = await fetch(url, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}


// ================= PREVIEW IMAGE =================
const fileInput = document.getElementById("imageFile");
const previewImg = document.getElementById("previewImg");

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      previewImg.src = URL.createObjectURL(file);
      previewImg.style.display = "block";
    }
  });
}


// ================= SÉCURITÉ =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Connecte-toi !");
    window.location.href = "login.html";
    return;
  }

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


// ================= COMMANDES =================
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
      box.innerHTML = `<p class="empty-state">Aucune commande reçue</p>`;
      return;
    }

    box.innerHTML = "";

    snap.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("fr-FR") : "";

      const myItems = o.items.filter(item => item.supplierId === uid);
      const total = myItems.reduce((sum, i) => sum + i.price * i.qty, 0);

      box.innerHTML += `
        <div class="order-received">
          <strong>${o.userEmail}</strong> — ${date}
          <div>${myItems.map(i => `${i.name} × ${i.qty}`).join("<br>")}</div>
          <div>${total} FCFA</div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
  }
}


// ================= PRODUITS TEMP =================
let tempProducts = [];


// ================= AJOUT PRODUIT =================
async function addToList() {
  const nameInput = document.getElementById("name");
  const priceInput = document.getElementById("price");
  const fileInput = document.getElementById("imageFile");

  const name = nameInput.value.trim();
  const price = priceInput.value.trim();
  const file = fileInput.files[0];

  if (!name || !price || !file) {
    alert("Remplis tous les champs + image");
    return;
  }

  const addBtn = document.getElementById("addBtn");
  addBtn.disabled = true;
  addBtn.textContent = "Upload image...";

  try {
    const imageUrl = await uploadImage(file);

    tempProducts.push({
      name,
      price: Number(price),
      image: imageUrl
    });

    nameInput.value = "";
    priceInput.value = "";
    fileInput.value = "";
    previewImg.style.display = "none";

    displayPreview();

  } catch (err) {
    alert("Erreur upload image");
  }

  addBtn.disabled = false;
  addBtn.textContent = "Ajouter ➕";
}


// ================= PREVIEW =================
function displayPreview() {
  const preview = document.getElementById("preview");

  if (tempProducts.length === 0) {
    preview.innerHTML = `<p>Aucun produit</p>`;
    return;
  }

  preview.innerHTML = "";

  tempProducts.forEach((p, index) => {
    preview.innerHTML += `
      <div class="preview-card">
        <button onclick="removeItem(${index})">✕</button>
        <img src="${p.image}">
        <p>${p.name}</p>
        <p>${p.price} FCFA</p>
      </div>
    `;
  });
}


// ================= REMOVE =================
window.removeItem = function (index) {
  tempProducts.splice(index, 1);
  displayPreview();
};


// ================= SAVE =================
async function saveAll() {
  const user = auth.currentUser;

  if (!user || tempProducts.length === 0) return;

  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.textContent = "Publication...";

  try {
    for (let p of tempProducts) {
      await addDoc(collection(db, "products"), {
        ...p,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date()
      });
    }

    alert("Produits publiés ✅");
    window.location.href = "index.html";

  } catch (e) {
    alert(e.message);
    btn.disabled = false;
    btn.textContent = "Confirmer et publier";
  }
}


// ================= MES PRODUITS =================
let myProductsCache = [];

async function loadMyProducts(uid) {
  const grid = document.getElementById("myProducts");
  if (!grid) return;

  const q = query(collection(db, "products"), where("userId", "==", uid));
  const snap = await getDocs(q);

  myProductsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderMyProducts();
}

function renderMyProducts() {
  const grid = document.getElementById("myProducts");
  grid.innerHTML = "";

  myProductsCache.forEach(p => {
    grid.innerHTML += `
      <div class="my-product-card" data-id="${p.id}">
        <img src="${p.image}">
        <h4>${p.name}</h4>
        <p>${p.price} FCFA</p>
        <button onclick="deleteProduct('${p.id}')">Supprimer</button>
      </div>
    `;
  });
}

async function deleteProduct(id) {
  if (!confirm("Supprimer ?")) return;

  await deleteDoc(doc(db, "products", id));
  myProductsCache = myProductsCache.filter(p => p.id !== id);
  renderMyProducts();
}


// ================= EVENTS =================
document.getElementById("addBtn").addEventListener("click", addToList);
document.getElementById("saveBtn").addEventListener("click", saveAll);
