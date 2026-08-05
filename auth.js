// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc
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
// sans phase de détection (qui elle-même peut être bloquée par le réseau)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});


// ================= EMAILJS =================
const EMAILJS_PUBLIC_KEY = "ciFoF8v_-0DDYBU7c";
const EMAILJS_SERVICE_ID = "service_x2nfjnx";
const EMAILJS_TEMPLATE_WELCOME = "template_24nka54";

if (window.emailjs) {
  window.emailjs.init(EMAILJS_PUBLIC_KEY);
}

function sendWelcomeEmail(firstname, email, role) {
  if (!window.emailjs) return Promise.resolve();

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_WELCOME, {
    to_name: firstname,
    to_email: email,
    role: role === "fournisseur" ? "fournisseur" : "acheteur"
  }).catch(err => console.error("Erreur envoi email:", err));
}


// ================= INSCRIPTION =================
window.register = async function () {
  const firstname = document.getElementById("firstname")?.value.trim();
  const lastname = document.getElementById("lastname")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;
  const role = document.querySelector('input[name="role"]:checked')?.value;
  const termsAccepted = document.getElementById("terms")?.checked;

  if (!firstname || !lastname || !email || !phone || !password || !confirmPassword) {
    alert("Remplis tous les champs");
    return;
  }

  if (password !== confirmPassword) {
    alert("Les mots de passe ne correspondent pas");
    return;
  }

  if (!termsAccepted) {
    alert("Tu dois accepter les conditions d'utilisation");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // profil complet stocké dans Firestore, lié à l'uid de l'utilisateur
    await setDoc(doc(db, "users", cred.user.uid), {
      firstname,
      lastname,
      email,
      phone,
      role,
      createdAt: new Date()
    });

    // email de validation officiel Firebase (lien à cliquer pour activer le compte)
    await sendEmailVerification(cred.user);

    const emailSend = sendWelcomeEmail(firstname, email, role);
    const timeout = new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.race([emailSend, timeout]);

    await signOut(auth);

    alert("Compte créé ! Vérifie ta boîte mail et clique sur le lien reçu pour valider ton compte avant de te connecter.");

    window.location.href = "login.html";

  } catch (err) {
    alert(err.message);
  }
};


// ================= CONNEXION =================
window.login = async function () {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Remplis tous les champs");
    return;
  }

  const btn = document.querySelector(".auth-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Connexion en cours...";
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      await signOut(auth);
      alert("Ton email n'est pas encore validé. Vérifie ta boîte mail (et les spams) et clique sur le lien reçu avant de te connecter.");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Se connecter";
      }
      return;
    }

    // on essaie de lire le rôle, mais on ne bloque pas la redirection
    // dessus s'il traîne trop longtemps (réseau lent/instable)
    const roleLookup = getDoc(doc(db, "users", cred.user.uid))
      .then(snap => snap.exists() ? snap.data().role : null)
      .catch(() => null);

    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 4000));

    const role = await Promise.race([roleLookup, timeout]);

    window.location.href = (role === "fournisseur") ? "fournisseur.html" : "index.html";

  } catch (err) {
    alert(err.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Se connecter";
    }
  }
};


// ================= DÉCONNEXION =================
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};


// ================= UI UTILISATEUR (nav) =================
onAuthStateChanged(auth, (user) => {
  const userBox = document.getElementById("userBox");
  if (!userBox) return;

  if (user) {
    userBox.innerHTML = `
      👤 ${user.email}
      <button onclick="logout()">Logout</button>
    `;
  } else {
    userBox.innerHTML = `<a href="login.html">Connexion</a>`;
  }
});
