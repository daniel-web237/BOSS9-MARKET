// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged, signOut
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
    const profile = snap.exists() ? snap.data() : null;

    if (!profile || profile.role !== "admin") {
      showToast("Cette page est réservée aux administrateurs.", "error", "Accès refusé");
      setTimeout(() => { window.location.href = "index.html"; }, 1400);
      return;
    }

    const name = profile.fullname || user.email;
    document.getElementById("topbarName").textContent = name;
    document.getElementById("topbarAvatar").textContent = name.charAt(0).toUpperCase();

    initNav();
    loadEverything();

  } catch (err) {
    console.error(err);
    showToast("Impossible de vérifier tes droits d'accès.", "error", "Erreur");
  }
});


// ================= NAVIGATION (sidebar) =================
function switchView(viewName) {
  document.querySelectorAll(".sidebar-link[data-view]").forEach(l => {
    l.classList.toggle("active", l.dataset.view === viewName);
  });
  document.querySelectorAll(".admin-view").forEach(v => v.classList.remove("active"));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add("active");
  document.getElementById("adminSidebar").classList.remove("open");
}

function initNav() {
  document.querySelectorAll(".sidebar-link[data-view]").forEach(link => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });

  document.querySelectorAll(".panel-link[data-view]").forEach(link => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });

  document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("adminSidebar").classList.toggle("open");
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
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
  renderDashboard();
}


// ================= DASHBOARD =================
function renderDashboard() {
  renderStatCards();
  renderLineChart();
  renderDonutChart();
  renderTopSuppliers();
  renderAlerts();
}

function renderStatCards() {
  const supplierCount = usersCache.filter(u => u.role === "fournisseur").length;
  const revenue = ordersCache.reduce((sum, o) => sum + (o.total || 0), 0);

  const cards = [
    { icon: "👥", cls: "blue", value: usersCache.length, label: "Utilisateurs totaux" },
    { icon: "🏪", cls: "green", value: supplierCount, label: "Fournisseurs" },
    { icon: "📦", cls: "gold", value: productsCache.length, label: "Produits en ligne" },
    { icon: "🛒", cls: "navy", value: ordersCache.length, label: "Commandes totales" },
    { icon: "💰", cls: "rose", value: `${revenue.toLocaleString("fr-FR")} FCFA`, label: "Chiffre d'affaires" }
  ];

  document.getElementById("statsGrid").innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-icon ${c.cls}">${c.icon}</div>
      <div class="stat-info">
        <div class="stat-value">${typeof c.value === "number" ? c.value.toLocaleString("fr-FR") : c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>
    </div>
  `).join("");
}

// graphique en ligne — chiffre d'affaires réel des 7 derniers jours
function renderLineChart() {
  const days = [];
  const totals = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
    totals.push(0);
  }

  ordersCache.forEach(o => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate() : null;
    if (!date) return;
    date.setHours(0, 0, 0, 0);

    days.forEach((d, i) => {
      if (d.getTime() === date.getTime()) {
        totals[i] += o.total || 0;
      }
    });
  });

  const max = Math.max(...totals, 1);
  const width = 600;
  const height = 160;
  const step = width / (totals.length - 1);

  const points = totals.map((t, i) => {
    const x = i * step;
    const y = height - (t / max) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  document.getElementById("lineChart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <polygon points="${areaPoints}" fill="rgba(242,183,5,0.15)"></polygon>
      <polyline points="${points}" fill="none" stroke="#C99000" stroke-width="2.5"></polyline>
      ${totals.map((t, i) => `<circle cx="${i * step}" cy="${height - (t / max) * (height - 20) - 10}" r="3.5" fill="#0B1F3A"></circle>`).join("")}
    </svg>
    <div class="line-chart-labels">
      ${days.map(d => `<span>${d.toLocaleDateString("fr-FR", { weekday: "short" })}</span>`).join("")}
    </div>
  `;
}

// donut — répartition réelle des commandes par statut
function renderDonutChart() {
  const statuses = ["en attente", "expédiée", "livrée", "annulée"];
  const colors = { "en attente": "#3E5FA8", "expédiée": "#C99000", "livrée": "#4C9F70", "annulée": "#C0392B" };

  const counts = statuses.map(s => ordersCache.filter(o => (o.status || "en attente") === s).length);
  const total = ordersCache.length || 1;

  let cumulative = 0;
  const segments = counts.map((count, i) => {
    const pct = (count / total) * 100;
    const seg = `${colors[statuses[i]]} ${cumulative}% ${cumulative + pct}%`;
    cumulative += pct;
    return seg;
  });

  const gradient = ordersCache.length
    ? `conic-gradient(${segments.join(", ")})`
    : "#E2DECF";

  document.getElementById("donutChart").innerHTML = `
    <div class="donut" style="background: ${gradient};">
      <div class="donut-hole">
        <div class="total-value">${ordersCache.length}</div>
        <div class="total-label">commandes</div>
      </div>
    </div>
    <div class="donut-legend">
      ${statuses.map((s, i) => `
        <div class="donut-legend-item">
          <span class="donut-dot" style="background:${colors[s]}"></span>
          <span style="text-transform:capitalize">${s}</span>
          <span class="count">${counts[i]}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// top fournisseurs — calculé à partir des vraies commandes/produits
function renderTopSuppliers() {
  const revenueBySupplier = {};

  ordersCache.forEach(o => {
    (o.items || []).forEach(item => {
      if (!item.supplierId) return;
      revenueBySupplier[item.supplierId] = (revenueBySupplier[item.supplierId] || 0) + (item.price * item.qty);
    });
  });

  const ranked = Object.entries(revenueBySupplier)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById("topSuppliers");

  if (ranked.length === 0) {
    container.innerHTML = `<p class="empty-state">Pas encore assez de commandes pour établir un classement</p>`;
    return;
  }

  container.innerHTML = ranked.map(([uid, revenue]) => {
    const shop = shopsCache.find(s => s.id === uid);
    const productCount = productsCache.filter(p => p.userId === uid).length;
    return `
      <div class="list-row">
        <div class="list-row-main">
          <div class="primary">${shop?.shopName || "Fournisseur"}</div>
          <div class="secondary">${productCount} produit(s)</div>
        </div>
        <div class="secondary">${revenue.toLocaleString("fr-FR")} FCFA</div>
      </div>
    `;
  }).join("");
}

// alertes — signaux réels utiles à un admin, rien d'inventé
function renderAlerts() {
  const container = document.getElementById("alertsList");
  const alerts = [];

  const pendingOrders = ordersCache.filter(o => (o.status || "en attente") === "en attente").length;
  if (pendingOrders > 0) {
    alerts.push({ icon: "⏳", primary: `${pendingOrders} commande(s) en attente`, secondary: "À traiter par les fournisseurs concernés" });
  }

  const noDescription = productsCache.filter(p => !p.description || !p.description.trim()).length;
  if (noDescription > 0) {
    alerts.push({ icon: "📝", primary: `${noDescription} produit(s) sans description`, secondary: "Qualité d'annonce à améliorer" });
  }

  const disabledUsers = usersCache.filter(u => u.disabled).length;
  if (disabledUsers > 0) {
    alerts.push({ icon: "🚫", primary: `${disabledUsers} compte(s) désactivé(s)`, secondary: "Comptes actuellement bloqués" });
  }

  if (alerts.length === 0) {
    container.innerHTML = `<p class="empty-state">Aucune alerte pour le moment</p>`;
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert-row">
      <span class="alert-icon">${a.icon}</span>
      <div>
        <div class="primary">${a.primary}</div>
        <div class="secondary">${a.secondary}</div>
      </div>
    </div>
  `).join("");
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
        <td><button class="btn-mini toggle-disabled">${u.disabled ? "Réactiver" : "Désactiver"}</button></td>
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
          loadProducts().then(renderDashboard);
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
      const status = o.status || "en attente";
      return `
        <tr data-id="${o.id}">
          <td>${o.userName || o.userEmail}</td>
          <td>${o.items?.length || 0} article(s)</td>
          <td>${o.total} FCFA</td>
          <td>
            <select class="status-select">
              <option value="en attente" ${status === "en attente" ? "selected" : ""}>En attente</option>
              <option value="expédiée" ${status === "expédiée" ? "selected" : ""}>Expédiée</option>
              <option value="livrée" ${status === "livrée" ? "selected" : ""}>Livrée</option>
              <option value="annulée" ${status === "annulée" ? "selected" : ""}>Annulée</option>
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
          loadOrders().then(renderDashboard);
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
