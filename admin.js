// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  initializeFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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


// ================= SÉCURITÉ — accès réservé au rôle "admin" =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showToast("Connecte-toi avec un compte administrateur.", "warning", "Accès refusé");
    setTimeout(() => { window.location.href = "login.html"; }, 1400);
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role !== "admin") {
      showToast("Cette page est réservée aux administrateurs.", "error", "Accès refusé");
      setTimeout(() => { window.location.href = "index.html"; }, 1400);
      return;
    }

    // accès validé, on charge tout
    initTabs();
    loadEverything();

  } catch (err) {
    console.error(err);
    showToast("Impossible de vérifier tes droits d'accès.", "error", "Erreur");
  }
});


// ================= ONGLETS =================
function initTabs() {
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    });
  });
}


// ================= CHARGEMENT GLOBAL =================
let usersCache = [];
let productsCache = [];
let ordersCache = [];
let shopsCache = [];

async function loadEverything() {
  await Promise.all([
    loadUsers(),
    loadProducts(),
    loadOrders(),
    loadShops()
  ]);
  renderOverview();
}

function renderOverview() {
  const supplierCount = usersCache.filter(u => u.role === "fournisseur").length;
  const revenue = ordersCache.reduce((sum, o) => sum + (o.total || 0), 0);

  const values = [usersCache.length, supplierCount, productsCache.length, ordersCache.length, revenue];
  document.querySelectorAll("#statsGrid .stat-value").forEach((el, i) => {
    el.textContent = values[i].toLocaleString("fr-FR");
  });
}


// ================= UTILISATEURS =================
async function loadUsers() {
  const body = document.getElementById("usersTableBody");

  try {
    const snap = await getDocs(collection(db, "users"));
    usersCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (usersCache.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="empty-state">Aucun utilisateur</td></tr>`;
      return;
    }

    body.innerHTML = usersCache.map(u => `
      <tr data-uid="${u.id}">
        <td>${u.fullname || "—"}</td>
        <td>${u.email || "—"}</td>
        <td>${u.phone || "—"}</td>
        <td>
          <select class="role-select">
            <option value="acheteur" ${u.role === "acheteur" ? "selected" : ""}>Acheteur</option>
            <option value="fournisseur" ${u.role === "fournisseur" ? "selected" : ""}>Fournisseur</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
          ${u.disabled ? '<span class="disabled-tag">Désactivé</span>' : ""}
        </td>
        <td>
          <button class="btn-mini toggle-disabled">${u.disabled ? "Réactiver" : "Désactiver"}</button>
        </td>
      </tr>
    `).join("");

    body.querySelectorAll("tr").forEach(row => {
      const uid = row.dataset.uid;

      row.querySelector(".role-select").addEventListener("change", async (e) => {
        try {
          await updateDoc(doc(db, "users", uid), { role: e.target.value });
          showToast("Le rôle a été mis à jour.", "success", "Utilisateur modifié");
        } catch (err) {
          showToast(err.message, "error", "Échec de la modification");
        }
      });

      row.querySelector(".toggle-disabled").addEventListener("click", async () => {
        const user = usersCache.find(u => u.id === uid);
        const newState = !user.disabled;
        try {
          await updateDoc(doc(db, "users", uid), { disabled: newState });
          user.disabled = newState;
          showToast(
            newState ? "Ce compte ne pourra plus se connecter." : "Ce compte peut de nouveau se connecter.",
            "success",
            newState ? "Compte désactivé" : "Compte réactivé"
          );
          loadUsers();
        } catch (err) {
          showToast(err.message, "error", "Échec de l'opération");
        }
      });
    });

  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="5" class="empty-state">Impossible de charger les utilisateurs</td></tr>`;
  }
}


// ================= PRODUITS =================
async function loadProducts() {
  const body = document.getElementById("productsTableBody");

  try {
    const snap = await getDocs(collection(db, "products"));
    productsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (productsCache.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="empty-state">Aucun produit</td></tr>`;
      return;
    }

    body.innerHTML = productsCache.map(p => {
      const supplier = usersCache.find(u => u.id === p.userId);
      const supplierName = supplier?.shopName || supplier?.fullname || "Inconnu";

      return `
        <tr data-id="${p.id}">
          <td><img class="table-thumb" src="${p.image}" alt=""></td>
          <td>${p.name}</td>
          <td>${p.price} FCFA</td>
          <td>${supplierName}</td>
          <td><button class="btn-mini danger delete-product">Supprimer</button></td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll(".delete-product").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        if (!confirm("Supprimer définitivement ce produit ?")) return;

        try {
          await deleteDoc(doc(db, "products", id));
          showToast("Le produit a été retiré de la boutique.", "success", "Produit supprimé");
          loadProducts();
        } catch (err) {
          showToast(err.message, "error", "Échec de la suppression");
        }
      });
    });

  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="5" class="empty-state">Impossible de charger les produits</td></tr>`;
  }
}


// ================= COMMANDES =================
async function loadOrders() {
  const body = document.getElementById("ordersTableBody");

  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    ordersCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (ordersCache.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="empty-state">Aucune commande</td></tr>`;
      return;
    }

    body.innerHTML = ordersCache.map(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("fr-FR") : "";
      return `
        <tr data-id="${o.id}">
          <td>${o.userName || o.userEmail}</td>
          <td>${o.items?.length || 0} article(s)</td>
          <td>${o.total} FCFA</td>
          <td>
            <select class="status-select">
              <option value="en attente" ${o.status === "en attente" ? "selected" : ""}>En attente</option>
              <option value="expédiée" ${o.status === "expédiée" ? "selected" : ""}>Expédiée</option>
              <option value="livrée" ${o.status === "livrée" ? "selected" : ""}>Livrée</option>
              <option value="annulée" ${o.status === "annulée" ? "selected" : ""}>Annulée</option>
            </select>
          </td>
          <td>${date}</td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        try {
          await updateDoc(doc(db, "orders", id), { status: e.target.value });
          showToast("Le statut de la commande a été mis à jour.", "success", "Commande modifiée");
        } catch (err) {
          showToast(err.message, "error", "Échec de la modification");
        }
      });
    });

  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="5" class="empty-state">Impossible de charger les commandes</td></tr>`;
  }
}


// ================= BOUTIQUES =================
async function loadShops() {
  const body = document.getElementById("shopsTableBody");

  try {
    const snap = await getDocs(collection(db, "shops"));
    shopsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (shopsCache.length === 0) {
      body.innerHTML = `<tr><td colspan="3" class="empty-state">Aucune boutique</td></tr>`;
      return;
    }

    body.innerHTML = shopsCache.map(s => `
      <tr data-id="${s.id}">
        <td>${s.shopName || "—"}</td>
        <td style="text-transform:capitalize">${s.category || "—"}</td>
        <td><button class="btn-mini danger delete-shop">Retirer de la liste</button></td>
      </tr>
    `).join("");

    body.querySelectorAll(".delete-shop").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        if (!confirm("Retirer cette boutique de l'annuaire public ? (le compte fournisseur reste actif)")) return;

        try {
          await deleteDoc(doc(db, "shops", id));
          showToast("La boutique n'apparaît plus dans l'annuaire.", "success", "Boutique retirée");
          loadShops();
        } catch (err) {
          showToast(err.message, "error", "Échec de l'opération");
        }
      });
    });

  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="3" class="empty-state">Impossible de charger les boutiques</td></tr>`;
  }
}
