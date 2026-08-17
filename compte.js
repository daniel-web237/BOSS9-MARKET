// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  initializeFirestore, doc, getDoc, setDoc, deleteDoc, addDoc,
  collection, query, where, orderBy, getDocs
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

let currentUser = null;
let currentBuyerName = "";


// ================= SÉCURITÉ + CHARGEMENT PROFIL =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showToast("Connecte-toi pour accéder à ton compte.", "warning", "Connexion requise");
    setTimeout(() => { window.location.href = "login.html"; }, 1400);
    return;
  }

  currentUser = user;

  document.getElementById("email").value = user.email;
  document.getElementById("profileEmail").textContent = user.email;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      const data = snap.data();

      document.getElementById("fullname").value = data.fullname || "";
      document.getElementById("phone").value = data.phone || "";

      currentBuyerName = data.fullname || user.email;

      document.getElementById("profileName").textContent = currentBuyerName;
      document.getElementById("avatarInitial").textContent = currentBuyerName.charAt(0).toUpperCase();

      const roleBadge = document.getElementById("profileRole");
      roleBadge.textContent = data.role === "fournisseur" ? "🏪 Fournisseur" : "🛍️ Acheteur";
    } else {
      // compte créé avant l'ajout du profil complet
      currentBuyerName = user.email;
      document.getElementById("profileName").textContent = user.email;
      document.getElementById("avatarInitial").textContent = user.email.charAt(0).toUpperCase();
      document.getElementById("profileRole").textContent = "🛍️ Acheteur";
    }

  } catch (err) {
    console.error(err);
  }

  loadReviewedOrders(user.uid).then(() => loadOrders(user.uid));
  loadFavorites(user.uid);
});


// ================= AVIS DÉJÀ POSTÉS (pour savoir quoi proposer) =================
let reviewedOrderIds = new Set();

async function loadReviewedOrders(uid) {
  try {
    const q = query(collection(db, "reviews"), where("buyerId", "==", uid));
    const snap = await getDocs(q);
    reviewedOrderIds = new Set(snap.docs.map(d => d.data().orderId));
  } catch (err) {
    console.error(err);
  }
}


// ================= MES COMMANDES (historique + suivi) =================
const ORDER_STAGES = ["en attente", "confirmée", "expédiée", "livrée"];

function renderStatusStepper(status) {
  const currentIndex = ORDER_STAGES.indexOf((status || "").toLowerCase());

  // statut personnalisé qu'on ne reconnaît pas : on affiche juste le texte
  if (currentIndex === -1) {
    return `<div class="order-status">${status || "en attente"}</div>`;
  }

  return `
    <div class="status-stepper">
      ${ORDER_STAGES.map((stage, i) => `
        <div class="stepper-step ${i <= currentIndex ? "done" : ""} ${i === currentIndex ? "current" : ""}">
          <span class="stepper-dot"></span>
          <span class="stepper-label">${stage}</span>
        </div>
      `).join(`<span class="stepper-line"></span>`)}
    </div>
  `;
}

async function loadOrders(uid) {
  const box = document.getElementById("ordersBox");

  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      box.innerHTML = `<div class="empty-box">Aucune commande pour le moment</div>`;
      return;
    }

    box.innerHTML = "";
    box.className = "orders-list";

    snap.forEach(docSnap => {
      const o = docSnap.data();
      const orderId = docSnap.id;
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("fr-FR") : "";
      const isDelivered = (o.status || "").toLowerCase() === "livrée";
      const alreadyReviewed = reviewedOrderIds.has(orderId);
      const primarySupplierId = (o.supplierIds && o.supplierIds[0]) || null;

      box.innerHTML += `
        <div class="order-card">
          <div class="order-card-top">
            <div>
              <strong>${o.items.length} article(s)</strong>
              <span class="order-date">${date}</span>
            </div>
            <div class="order-total">${o.total} FCFA</div>
          </div>

          ${renderStatusStepper(o.status)}

          <div class="order-items-list">
            ${o.items.map(item => `
              <div class="order-item-row">
                <img src="${item.image}" alt="${item.name}">
                <span class="order-item-name">${item.name} × ${item.qty}</span>
                <span class="order-item-price">${item.price * item.qty} FCFA</span>
              </div>
            `).join("")}
          </div>

          ${isDelivered
            ? (alreadyReviewed
                ? `<div class="review-done">✓ Avis envoyé, merci !</div>`
                : `<button class="btn-review" data-order-id="${orderId}" data-supplier-id="${primarySupplierId || ""}">⭐ Évaluer le vendeur</button>`)
            : ""
          }
        </div>
      `;
    });

    attachReviewButtons();

  } catch (err) {
    console.error(err);
    box.innerHTML = `<div class="empty-box">Impossible de charger tes commandes pour le moment</div>`;
  }
}


// ================= AVIS : ouverture / envoi du formulaire =================
let reviewTarget = { orderId: null, supplierId: null };
let selectedRating = 0;

function attachReviewButtons() {
  document.querySelectorAll(".btn-review").forEach(btn => {
    btn.addEventListener("click", () => {
      reviewTarget = {
        orderId: btn.dataset.orderId,
        supplierId: btn.dataset.supplierId || null
      };
      openReviewModal();
    });
  });
}

function openReviewModal() {
  selectedRating = 0;
  document.getElementById("reviewComment").value = "";
  updateStarDisplay();
  document.getElementById("reviewModalOverlay").classList.add("show");
}

function closeReviewModal() {
  document.getElementById("reviewModalOverlay").classList.remove("show");
}

function updateStarDisplay() {
  document.querySelectorAll("#starPicker .star").forEach(star => {
    const value = Number(star.dataset.value);
    star.classList.toggle("filled", value <= selectedRating);
  });
}

function initReviewModal() {
  const overlay = document.getElementById("reviewModalOverlay");
  if (!overlay) return;

  document.querySelectorAll("#starPicker .star").forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.value);
      updateStarDisplay();
    });
  });

  document.getElementById("reviewCancelBtn").addEventListener("click", closeReviewModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeReviewModal();
  });

  document.getElementById("reviewSubmitBtn").addEventListener("click", submitReview);
}

async function submitReview() {
  if (!currentUser) return;

  if (selectedRating < 1) {
    showToast("Choisis au moins une étoile avant d'envoyer.", "warning", "Note manquante");
    return;
  }

  const comment = document.getElementById("reviewComment").value.trim();
  const submitBtn = document.getElementById("reviewSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi...";

  try {
    await addDoc(collection(db, "reviews"), {
      orderId: reviewTarget.orderId,
      supplierId: reviewTarget.supplierId,
      buyerId: currentUser.uid,
      buyerName: currentBuyerName,
      rating: selectedRating,
      comment,
      createdAt: new Date()
    });

    reviewedOrderIds.add(reviewTarget.orderId);
    closeReviewModal();
    showToast("Merci pour ton avis !", "success", "Avis envoyé");
    loadOrders(currentUser.uid);

  } catch (err) {
    showToast(err.message, "error", "Échec de l'envoi de l'avis");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer l'avis";
  }
}


// ================= MES FAVORIS =================
async function loadFavorites(uid) {
  const box = document.getElementById("favoritesBox");
  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "users", uid, "favorites"));

    if (snap.empty) {
      box.innerHTML = `<div class="empty-box">Aucun favori pour le moment</div>`;
      return;
    }

    box.className = "favorites-grid";
    box.innerHTML = snap.docs.map(d => {
      const f = d.data();
      const formattedPrice = Number(f.price).toLocaleString("fr-FR");
      return `
        <div class="fav-card" data-id="${d.id}">
          <a href="produit.html?id=${d.id}">
            <img src="${f.image}" alt="${f.name}">
            <h4>${f.name}</h4>
            <p class="fav-price">${formattedPrice} FCFA</p>
          </a>
          <button class="btn-remove-fav" data-id="${d.id}">Retirer des favoris</button>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".btn-remove-fav").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await deleteDoc(doc(db, "users", uid, "favorites", btn.dataset.id));
          loadFavorites(uid);
        } catch (err) {
          showToast("Impossible de retirer ce favori pour le moment.", "error", "Erreur");
        }
      });
    });

  } catch (err) {
    console.error(err);
    box.innerHTML = `<div class="empty-box">Impossible de charger tes favoris pour le moment</div>`;
  }
}


// ================= SAUVEGARDE DU PROFIL =================
document.getElementById("saveBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const fullname = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!fullname || !phone) {
    showToast("Remplis ton nom et ton téléphone.", "warning", "Champs manquants");
    return;
  }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Enregistrement...";

  try {
    await setDoc(doc(db, "users", user.uid), {
      fullname,
      phone,
      email: user.email
    }, { merge: true });

    currentBuyerName = fullname;
    document.getElementById("profileName").textContent = fullname;
    document.getElementById("avatarInitial").textContent = fullname.charAt(0).toUpperCase();

    showToast("Tes informations ont bien été mises à jour.", "success", "Profil enregistré");

  } catch (err) {
    showToast(err.message, "error", "Échec de la mise à jour");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Enregistrer les modifications";
  }
});


// ================= DÉCONNEXION =================
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};


// ================= START =================
initReviewModal();
