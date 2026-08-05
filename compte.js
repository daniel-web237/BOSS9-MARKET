// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  initializeFirestore, doc, getDoc, setDoc,
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


// ================= SÉCURITÉ + CHARGEMENT PROFIL =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Connecte-toi !");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("email").value = user.email;
  document.getElementById("profileEmail").textContent = user.email;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      const data = snap.data();

      document.getElementById("fullname").value = data.fullname || "";
      document.getElementById("phone").value = data.phone || "";

      document.getElementById("profileName").textContent = data.fullname || user.email;
      document.getElementById("avatarInitial").textContent =
        (data.fullname || user.email).charAt(0).toUpperCase();

      const roleBadge = document.getElementById("profileRole");
      roleBadge.textContent = data.role === "fournisseur" ? "🏪 Fournisseur" : "🛍️ Acheteur";
    } else {
      // compte créé avant l'ajout du profil complet
      document.getElementById("profileName").textContent = user.email;
      document.getElementById("avatarInitial").textContent = user.email.charAt(0).toUpperCase();
      document.getElementById("profileRole").textContent = "🛍️ Acheteur";
    }

  } catch (err) {
    console.error(err);
  }

  loadOrders(user.uid);
});


// ================= MES COMMANDES =================
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
    box.className = "";

    snap.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("fr-FR") : "";

      box.innerHTML += `
        <div class="order-row">
          <div>
            <strong>${o.items.length} article(s)</strong>
            <span class="order-date">${date}</span>
          </div>
          <div class="order-status">${o.status || "en attente"}</div>
          <div class="order-total">${o.total} FCFA</div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    box.innerHTML = `<div class="empty-box">Impossible de charger tes commandes pour le moment</div>`;
  }
}


// ================= SAUVEGARDE DU PROFIL =================
document.getElementById("saveBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const fullname = document.getElementById("fullname").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!fullname || !phone) {
    alert("Remplis tous les champs");
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

    document.getElementById("profileName").textContent = fullname;
    document.getElementById("avatarInitial").textContent = fullname.charAt(0).toUpperCase();

    alert("Profil mis à jour ✅");

  } catch (err) {
    alert("Erreur : " + err.message);
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