const params = new URLSearchParams(window.location.search);

const nom = params.get("nom");
const prix = params.get("prix");

if (nom && prix) {
  document.getElementById("cName").textContent = nom;
  document.getElementById("cPrice").textContent = prix + " FCFA";
}

function goHome() {
  window.location.href = "index.html";
}
alert("Paiement réussi !");