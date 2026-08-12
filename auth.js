// ================= FIREBASE =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
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

function sendWelcomeEmail(fullname, email, role) {
  if (!window.emailjs) return Promise.resolve();

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_WELCOME, {
    to_name: fullname,
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
  const shopName = document.getElementById("shopName")?.value.trim();
  const category = document.getElementById("category")?.value;

  if (!firstname || !lastname || !email || !phone || !password || !confirmPassword) {
    showToast("Merci de remplir tous les champs du formulaire.", "warning", "Champs manquants");
    return;
  }

  if (role === "fournisseur" && (!shopName || !category)) {
    showToast("Indique le nom de ta boutique et sa catégorie pour continuer.", "warning", "Informations boutique");
    return;
  }

  const fullname = `${firstname} ${lastname}`;

  if (password !== confirmPassword) {
    showToast("Les deux mots de passe ne correspondent pas.", "error", "Mot de passe");
    return;
  }

  if (!termsAccepted) {
    showToast("Tu dois accepter les conditions d'utilisation pour créer un compte.", "warning", "Conditions d'utilisation");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // profil complet stocké dans Firestore, lié à l'uid de l'utilisateur
    await setDoc(doc(db, "users", cred.user.uid), {
      firstname,
      lastname,
      fullname,
      email,
      phone,
      role,
      shopName: role === "fournisseur" ? shopName : null,
      category: role === "fournisseur" ? category : null,
      createdAt: new Date()
    });

    // profil PUBLIC de la boutique (aucune donnée privée dedans) —
    // c'est cette collection que boutiques.js peut lire librement
    if (role === "fournisseur") {
      await setDoc(doc(db, "shops", cred.user.uid), {
        shopName,
        category,
        createdAt: new Date()
      });
    }

    // email de validation officiel Firebase (lien à cliquer pour activer le compte)
    await sendEmailVerification(cred.user);

    const emailSend = sendWelcomeEmail(fullname, email, role);
    const timeout = new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.race([emailSend, timeout]);

    await signOut(auth);

    showToast(
      "Vérifie ta boîte mail (et les spams) et clique sur le lien reçu pour valider ton compte avant de te connecter.",
      "success",
      "Compte créé"
    );

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2200);

  } catch (err) {
    showToast(err.message, "error", "Inscription impossible");
  }
};


// ================= CONNEXION =================
window.login = async function () {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    showToast("Merci de remplir ton email et ton mot de passe.", "warning", "Champs manquants");
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
      showToast(
        "Vérifie ta boîte mail (et les spams) et clique sur le lien reçu avant de te connecter.",
        "warning",
        "Email non validé"
      );
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Se connecter";
      }
      return;
    }

    // on essaie de lire le profil, mais on ne bloque pas la redirection
    // dessus s'il traîne trop longtemps (réseau lent/instable)
    const profileLookup = getDoc(doc(db, "users", cred.user.uid))
      .then(snap => snap.exists() ? snap.data() : null)
      .catch(() => null);

    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 4000));

    const profile = await Promise.race([profileLookup, timeout]);

    if (profile?.disabled) {
      await signOut(auth);
      showToast(
        "Ce compte a été désactivé. Contacte le support si tu penses que c'est une erreur.",
        "error",
        "Compte désactivé"
      );
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Se connecter";
      }
      return;
    }

    const role = profile?.role;

    let destination = "index.html";
    if (role === "fournisseur") destination = "fournisseur.html";
    if (role === "admin") destination = "admin.html";

    window.location.href = destination;

  } catch (err) {
    showToast(err.message, "error", "Connexion impossible");
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


// ================= MOT DE PASSE OUBLIÉ =================
window.sendResetLink = async function () {
  const emailInput = document.getElementById("resetEmail");
  const email = emailInput?.value.trim();

  if (!email) {
    showToast("Indique ton adresse email.", "warning", "Champ manquant");
    return;
  }

  const btn = document.querySelector(".auth-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Envoi en cours...";
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    // on ignore volontairement "utilisateur introuvable" — voir note ci-dessous
    if (err.code !== "auth/user-not-found") {
      showToast(err.message, "error", "Échec de l'envoi");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Envoyer le lien";
      }
      return;
    }
  }

  // Message volontairement identique, que l'email existe ou non chez nous —
  // ça évite de révéler à quelqu'un de malveillant quelles adresses ont
  // un compte BOSS9 Market. Si l'email existe vraiment, le lien arrive ;
  // sinon, rien ne se passe silencieusement, sans donner d'indice.
  showToast(
    "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.",
    "success",
    "Vérifie ta boîte mail"
  );

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Envoyer le lien";
  }
};
