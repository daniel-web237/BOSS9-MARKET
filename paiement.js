// RÉCUPÉRATION PARAMS URL
const params = new URLSearchParams(window.location.search);

const nom = params.get("nom");
const prix = params.get("prix");
const image = params.get("image");

// VARIABLES
let prixUnitaire = 0;
let stock = 5;

// AU CHARGEMENT
window.onload = function () {

  // reset form
  document.querySelector("form").reset();

  if (nom && prix && image) {
    prixUnitaire = parseInt(prix);

    document.getElementById("payName").textContent = nom;
    document.getElementById("payPrice").textContent = prix + " FCFA";
    document.getElementById("totalPrice").textContent = prix + " FCFA";
    document.getElementById("payImage").src = image;
    document.getElementById("stock").textContent = stock;
  } else {
    // image par défaut si bug
    document.getElementById("payImage").src = "yaris.png";
  }

  // EVENT QUANTITÉ
  document.getElementById("quantity").addEventListener("input", updateTotal);
};

// BOUTONS + / -
function changeQty(value) {
  let qtyInput = document.getElementById("quantity");

  let qty = parseInt(qtyInput.value) || 1;

  qty += value;

  if (qty < 1) qty = 1;
  if (qty > stock) qty = stock;

  qtyInput.value = qty;

  updateTotal();
}

// CALCUL TOTAL
function updateTotal() {
  let qty = parseInt(document.getElementById("quantity").value) || 1;
  let total = qty * prixUnitaire;

  document.getElementById("totalPrice").textContent = total + " FCFA";
}
function confirmPayment() {
  const nom = document.getElementById("payName").textContent;
  const total = document.getElementById("totalPrice").textContent.replace(" FCFA", "");

  window.location.href = `confirmation.html?nom=${nom}&prix=${total}`;
}
function validateAndPay() {

  const inputs = document.querySelectorAll(".delivery-box input");
  let valid = true;

  inputs.forEach(input => {
    if (input.value.trim() === "") {
      valid = false;
      input.style.border = "2px solid red";
    } else {
      input.style.border = "1px solid #ccc";
    }
  });

  if (!valid) {
    document.getElementById("errorMsg").style.display = "block";
    return;
  } else {
    document.getElementById("errorMsg").style.display = "none";
  }

  confirmPayment();
}