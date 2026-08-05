// ================= FIREBASE INIT =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// AUTH
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// FIRESTORE
import {
  initializeFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBmHTwb3GO773ewseAEQ-BAk9peo18Fgaw",
  authDomain: "boss9-market.firebaseapp.com",
  projectId: "boss9-market",
  storageBucket: "boss9-market.firebasestorage.app",
  messagingSenderId: "1063808835819",
  appId: "1:1063808835819:web:b9d4a891347796d5279eae"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// experimentalForceLongPolling : force ce mode de connexion directement,
// sur certains réseaux qui filtrent le streaming (WebSocket/gRPC)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});


// ================= AUTH =================

// REGISTER
window.register = async function () {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Remplis tous les champs");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Compte créé !");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
};


// LOGIN
window.login = async function () {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Remplis tous les champs");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Connexion réussie !");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
};


// LOGOUT
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};


// ================= USER UI =================

onAuthStateChanged(auth, (user) => {
  const userBox = document.getElementById("userBox");

  if (!userBox) return;

  if (user) {
    userBox.innerHTML = `
      👤 ${user.email}
      <button onclick="logout()">Logout</button>
    `;
  } else {
    userBox.innerHTML = `
      <a href="login.html">Connexion</a>
    `;
  }
});


// ================= AJOUT PRODUIT =================

window.addProduct = async function () {
  const name = document.getElementById("name")?.value;
  const price = document.getElementById("price")?.value;
  const image = document.getElementById("image")?.value;

  if (!name || !price || !image) {
    alert("Remplis tous les champs");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name: name,
      price: Number(price),
      image: image,
      createdAt: new Date()
    });

    alert("Produit ajouté !");
  } catch (err) {
    alert("Erreur : " + err.message);
  }
};


// ================= AFFICHAGE PRODUITS =================

async function loadProducts() {
  const container = document.getElementById("productList");

  if (!container) return;

  container.innerHTML = "Chargement...";

  try {
    const querySnapshot = await getDocs(collection(db, "products"));

    container.innerHTML = "";

    querySnapshot.forEach(doc => {
      const p = doc.data();

      container.innerHTML += `
        <div class="product-card">
          <img src="${p.image}">
          <h4>${p.name}</h4>
          <p>${p.price} FCFA</p>
        </div>
      `;
    });

  } catch (err) {
    container.innerHTML = "Erreur de chargement";
    console.error(err);
  }
}

// lancer auto
loadProducts();