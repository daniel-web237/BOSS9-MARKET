// ================= PARAMÈTRES PRODUIT =================
const params = new URLSearchParams(window.location.search);

const nom = params.get("nom");
const prix = params.get("prix");
const image = params.get("image");

// Injection dans la page
if (nom && prix && image) {
  document.getElementById("productName").textContent = nom;
  document.getElementById("productPrice").textContent = prix + " FCFA";
  document.getElementById("mainImage").src = image;
}

// ================= REDIRECTION PAIEMENT =================
function goToPayment() {
  const nom = document.getElementById("productName").textContent;
  const prix = document.getElementById("productPrice").textContent.replace(" FCFA", "");
  const image = document.getElementById("mainImage").src.split("/").pop();

  window.location.href = `paiement.html?nom=${nom}&prix=${prix}&image=${image}`;
}

// ================= CHAT =================

// OUVRIR CHAT
function openChat() {
  document.getElementById("chatPopup").style.display = "flex";
}

// FERMER CHAT
function closeChat() {
  document.getElementById("chatPopup").style.display = "none";
}

// ENVOYER MESSAGE
function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();

  if (msg === "") return;

  const chat = document.getElementById("chatMessages");

  // message utilisateur
  chat.innerHTML += `<div class="msg-user">${msg}</div>`;

  input.value = "";

  // réponse automatique vendeur
  setTimeout(() => {
    chat.innerHTML += `<div class="msg-bot">Bonjour 👋 je suis le vendeur, comment puis-je vous aider ?</div>`;
    chat.scrollTop = chat.scrollHeight;
  }, 1000);
}
