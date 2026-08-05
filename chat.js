const chatBox = document.getElementById("chatBox");

function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value;

  if (message.trim() === "") return;

  // message client
  const msg = document.createElement("div");
  msg.classList.add("message", "client");
  msg.innerText = message;

  chatBox.appendChild(msg);

  input.value = "";

  // réponse fake vendeur (simulation)
  setTimeout(() => {
    const reply = document.createElement("div");
    reply.classList.add("message", "seller");
    reply.innerText = "Vendeur : Merci pour votre message 👍";

    chatBox.appendChild(reply);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1000);
}
const params = new URLSearchParams(window.location.search);
const produit = params.get("produit");

document.getElementById("productTitle").innerText = produit;
function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value;

  if (message.trim() === "") return;

  addMessage(message, "client");

  input.value = "";

  // sauvegarder
  saveMessage(message, "client");

  // réponse vendeur simulée
  setTimeout(() => {
    const replyText = "Vendeur : Merci pour votre message 👍";

    addMessage(replyText, "seller");
    saveMessage(replyText, "seller");

    showNotification("Nouveau message du vendeur 📩");
  }, 1000);
}
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add("message", type);
  msg.innerText = text;

  chatBox.appendChild(msg);

  // scroll auto
  chatBox.scrollTop = chatBox.scrollHeight;
}
window.onload = function () {
  const messages = JSON.parse(localStorage.getItem("chat")) || [];

  messages.forEach(msg => {
    addMessage(msg.text, msg.type);
  });
};
function clearChat() {
  localStorage.removeItem("chat");
  location.reload();
}