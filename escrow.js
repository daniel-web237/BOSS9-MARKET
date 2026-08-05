let etat = "attente"; // état initial

function payer() {
  if (etat !== "attente") return;

  document.getElementById("status").innerText = "Paiement effectué 💳 (argent bloqué)";
  etat = "paye";
}

function livrer() {
  if (etat !== "paye") return;

  document.getElementById("status").innerText = "Commande livrée 🚚";
  etat = "livre";
}

function confirmer() {
  if (etat !== "livre") return;

  const prix = 750000;
  const commission = prix * 0.05;
  const vendeur = prix - commission;

  document.getElementById("status").innerText =
    "Transaction terminée ✅ Vendeur payé : " + vendeur + " FCFA";

  console.log("Commission plateforme :", commission);
  console.log("Montant vendeur :", vendeur);

  etat = "termine";
}
const params = new URLSearchParams(window.location.search);
const produit = params.get("produit");
const prix = params.get("prix");

if (produit && prix) {
  document.querySelector(".escrow-container").innerHTML += `
    <p><strong>${produit}</strong></p>
    <p>${prix} FCFA</p>
  `;
}