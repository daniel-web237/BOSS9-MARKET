// ================= JAUGE DE FORCE DU MOT DE PASSE =================
const passwordInput = document.getElementById("password");
const bars = [
  document.getElementById("bar1"),
  document.getElementById("bar2"),
  document.getElementById("bar3"),
  document.getElementById("bar4")
];
const label = document.getElementById("strengthLabel");

function checkStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0 à 4
}

const levels = [
  { className: "weak", text: "Faible" },
  { className: "weak", text: "Faible" },
  { className: "fair", text: "Moyen" },
  { className: "good", text: "Bon" },
  { className: "strong", text: "Fort" }
];

passwordInput.addEventListener("input", () => {
  const pwd = passwordInput.value;
  const score = pwd.length === 0 ? 0 : checkStrength(pwd);
  const level = levels[score];

  bars.forEach((bar, i) => {
    bar.className = "bar";
    if (pwd.length > 0 && i < Math.max(score, 1)) {
      bar.classList.add(level.className);
    }
  });

  label.textContent = pwd.length === 0 ? "" : level.text;
  label.style.color = pwd.length === 0 ? "" :
    level.className === "weak" ? "#C0392B" :
    level.className === "fair" ? "#C99000" :
    level.className === "good" ? "#4C9F70" : "#0B1F3A";
});


// ================= CHAMPS BOUTIQUE (visibles si Fournisseur) =================
const shopFields = document.getElementById("shopFields");
const roleRadios = document.querySelectorAll('input[name="role"]');

function toggleShopFields() {
  const selected = document.querySelector('input[name="role"]:checked').value;
  shopFields.classList.toggle("show", selected === "fournisseur");
}

roleRadios.forEach(radio => radio.addEventListener("change", toggleShopFields));
toggleShopFields();
