// SCROLL ANIMATION
window.addEventListener("scroll", function () {
  const elements = document.querySelectorAll(".reveal");

  elements.forEach((el) => {
    const position = el.getBoundingClientRect().top;
    const screenHeight = window.innerHeight;

    if (position < screenHeight - 100) {
      el.classList.add("active");
    }
  });
});
// LOADER
window.addEventListener("load", function() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
});

// PAIEMENT
function payer() {
  const confirmation = confirm("Confirmer le paiement de 1000 FCFA ?");

  if (confirmation) {
    document.getElementById("successMessage").style.display = "block";
  }
}
function goToProduct(nom, prix) {
  window.location.href = `produit.html?nom=${encodeURIComponent(nom)}&prix=${prix}`;
}
