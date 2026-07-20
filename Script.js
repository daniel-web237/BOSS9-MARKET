// SCROLL ANIMATION
window.addEventListener("scroll", function() {
  const reveals = document.querySelectorAll(".reveal");

  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;

    if (elementTop < windowHeight - 100) {
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