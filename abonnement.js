// ================= TOGGLE MENSUEL / ANNUEL =================
const btnMonthly = document.getElementById("btnMonthly");
const btnYearly = document.getElementById("btnYearly");
const priceEls = document.querySelectorAll(".price-value");

function setBilling(mode) {
  btnMonthly.classList.toggle("active", mode === "monthly");
  btnYearly.classList.toggle("active", mode === "yearly");

  priceEls.forEach(el => {
    const value = mode === "yearly" ? el.dataset.yearly : el.dataset.monthly;
    const suffix = mode === "yearly" ? "/mois, facturé annuellement" : "/mois";
    el.innerHTML = `${value} FCFA<span>${suffix}</span>`;
  });
}

btnMonthly.addEventListener("click", () => setBilling("monthly"));
btnYearly.addEventListener("click", () => setBilling("yearly"));