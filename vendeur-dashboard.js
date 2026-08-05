// ===============================
// INITIALISATION
// ===============================
let products = JSON.parse(localStorage.getItem("products")) || [];

// ===============================
// AJOUT PRODUIT
// ===============================
function addProduct() {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const image = document.getElementById("image").value;

  if (!name || !price || !image) {
    alert("Remplis tous les champs");
    return;
  }

  const product = { name, price, image };

  products.push(product);

  localStorage.setItem("products", JSON.stringify(products));

  displayProducts();

  // reset champs
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("image").value = "";
}

// ===============================
// AFFICHAGE DASHBOARD
// ===============================
function displayProducts() {
  const container = document.getElementById("productContainer");

  if (!container) return;

  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>Aucun produit ajouté</p>";
    return;
  }

  products.forEach((p, index) => {
    container.innerHTML += `
      <div class="product-item">
        <img src="${p.image}" width="60">
        <span>${p.name} - ${p.price} FCFA</span>
        <button onclick="deleteProduct(${index})">Supprimer</button>
      </div>
    `;
  });
}

// ===============================
// SUPPRIMER
// ===============================
function deleteProduct(index) {
  products.splice(index, 1);
  localStorage.setItem("products", JSON.stringify(products));
  displayProducts();
}

// ===============================
// LOAD
// ===============================
window.onload = function () {
  displayProducts();
};
