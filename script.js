/* =====================================================
   BOSS9 MARKET — STYLE.CSS
   Palette : navy + or (identité du logo)
===================================================== */

:root {
  --ink: #0B1F3A;
  --ink-light: #16345C;
  --paper: #F7F4EC;
  --gold: #F2B705;
  --gold-deep: #C99000;
  --text: #14213D;
  --muted: #5B5B5B;
  --border: #E7E1D2;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  background: var(--paper);
  color: var(--text);
}

h1, h2, h3 {
  font-family: 'Fraunces', serif;
  letter-spacing: 0.3px;
  margin: 0;
}

img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
}

/* ================= LOADER ================= */
#loader {
  position: fixed;
  inset: 0;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 5px solid #ccc;
  border-top: 5px solid var(--gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* ================= HEADER ================= */
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--ink);
  color: white;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 14px 30px;
}

.logo {
  flex-shrink: 0;
  text-decoration: none;
}

.logo-img {
  height: 56px;
  width: auto;
  object-fit: contain;
}

/* ---- BARRE DE RECHERCHE (style Alibaba / Amazon) ---- */
.search-box {
  flex: 1;
  display: flex;
  max-width: 700px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
}

.search-category {
  background: #EFEFEF;
  color: var(--text);
  border: none;
  padding: 0 10px;
  font-size: 13px;
  font-family: 'Poppins', sans-serif;
  border-right: 1px solid #d8d8d8;
  max-width: 150px;
}

.search-box input {
  flex: 1;
  border: none;
  padding: 0 14px;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  outline: none;
}

.search-box button {
  background: var(--gold);
  color: var(--ink);
  border: none;
  padding: 0 20px;
  font-size: 16px;
  cursor: pointer;
  transition: 0.2s;
}

.search-box button:hover {
  background: var(--gold-deep);
}

.actions {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
  font-size: 14px;
}

.actions a {
  text-decoration: none;
  color: #EAEAEA;
  white-space: nowrap;
}

.actions a:hover {
  color: var(--gold);
}

.cart-count {
  display: inline-block;
  background: var(--gold);
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

/* ================= NAVBAR ================= */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--ink-light);
  padding: 10px 30px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.menu-links {
  list-style: none;
  display: flex;
  gap: 25px;
  margin: 0;
  padding: 0;
}

.menu-links li {
  list-style: none;
}

.menu-links a {
  text-decoration: none;
  color: #EAEAEA;
  font-weight: 400;
  font-size: 14px;
  position: relative;
  transition: 0.3s;
}

.menu-links a::after {
  content: "";
  position: absolute;
  width: 0%;
  height: 2px;
  background: var(--gold);
  left: 0;
  bottom: -6px;
  transition: 0.3s;
}

.menu-links a:hover::after,
.menu-links a.active::after {
  width: 100%;
}

.menu-links a:hover,
.menu-links a.active {
  color: var(--gold);
}

/* ================= HERO ================= */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 420px;
}

.side {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 55px 60px;
  overflow: hidden;
}

.side.acheteur {
  background: var(--ink);
  color: white;
}

.side.fournisseur {
  background: var(--gold);
  color: var(--ink);
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 14px;
}

.side h1 {
  font-size: 32px;
  line-height: 1.2;
  margin-bottom: 14px;
}

.side p {
  font-size: 15px;
  line-height: 1.55;
  opacity: 0.88;
  margin-bottom: 26px;
  max-width: 400px;
}

.cta {
  display: inline-block;
  padding: 13px 26px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: 0.3s;
}

.side.acheteur .cta {
  background: var(--gold);
  color: var(--ink);
}

.side.fournisseur .cta {
  background: var(--ink);
  color: var(--gold);
}

.cta:hover {
  transform: scale(1.05);
}

.divider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(0,0,0,0.15);
}

/* ================= STATS ================= */
.stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  padding: 26px;
  background: var(--ink);
  color: white;
}

.stats div {
  text-align: center;
}

.stats strong {
  display: block;
  font-family: 'Fraunces', serif;
  font-size: 22px;
  color: var(--gold);
}

.stats span {
  font-size: 12px;
  opacity: 0.75;
}

/* ================= PRODUITS ================= */
section {
  margin-bottom: 0;
}

.products {
  padding: 60px 40px;
}

.products h2,
.seller h2 {
  text-align: center;
  font-size: 26px;
}

.sub {
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  margin: 8px 0 34px;
}

.product-list {
  display: flex;
  gap: 22px;
  justify-content: center;
  flex-wrap: wrap;
}

.product-card {
  background: white;
  border-radius: 12px;
  width: 210px;
  padding: 16px;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 22px rgba(0,0,0,0.1);
}

.product-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #EDE7D8;
}

.product-card h4 {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px;
}

.product-card p {
  margin: 0;
  color: var(--gold-deep);
  font-weight: 600;
  font-size: 14px;
}

/* ================= SELLER ================= */
.seller {
  background: var(--ink);
  color: white;
  padding: 60px 20px;
  text-align: center;
}

.seller p {
  margin: 10px 0 22px;
  opacity: 0.85;
}

.btn {
  display: inline-block;
  background: var(--gold);
  color: var(--ink);
  padding: 13px 26px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: 0.3s;
}

.btn:hover {
  transform: scale(1.05);
  background: var(--gold-deep);
}

/* ================= FOOTER ================= */
.footer {
  background: var(--ink);
  color: white;
  padding: 40px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 30px;
}

.footer h3, .footer h4 {
  margin-bottom: 10px;
  font-size: 16px;
}

.footer p {
  font-size: 13px;
  opacity: 0.8;
  margin: 4px 0;
}

.LR {
  display: flex;
  flex-direction: column;
}

.footer a {
  display: block;
  color: #ccc;
  text-decoration: none;
  font-size: 13px;
  margin: 5px 0;
}

.footer a:hover {
  color: var(--gold);
}

.copyright {
  text-align: center;
  margin-top: 25px;
  color: #aaa;
  font-size: 12px;
}

/* ================= SCROLL REVEAL ================= */
.reveal {
  opacity: 0;
  transform: translateY(60px);
  transition: all 0.8s ease;
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}

/* =====================================================
   RESPONSIVE — TABLETTE
===================================================== */
@media (max-width: 992px) {
  .header-top {
    flex-wrap: wrap;
    padding: 14px 20px;
  }

  .logo-img {
    height: 46px;
  }

  .search-box {
    order: 3;
    max-width: 100%;
    width: 100%;
  }

  .actions {
    margin-left: auto;
  }

  .navbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 20px;
  }

  .menu-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .divider {
    display: none;
  }

  .side h1 {
    font-size: 28px;
  }

  .stats {
    gap: 30px;
    flex-wrap: wrap;
  }
}

/* =====================================================
   RESPONSIVE — MOBILE (façon Alibaba : header compact + barre du bas)
===================================================== */
@media (max-width: 600px) {
  body {
    overflow-x: hidden;
    padding-bottom: 62px; /* laisse la place pour la barre du bas fixe */
  }

  /* HEADER — logo + recherche sur UNE seule ligne, compact */
  .header-top {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
  }

  .logo-img {
    height: 32px;
  }

  .search-box {
    flex: 1;
    height: 36px;
    max-width: none;
  }

  .search-category {
    display: none; /* trop de place sur mobile, la recherche reste globale */
  }

  .search-box input {
    font-size: 13px;
    padding: 0 10px;
  }

  .search-box button {
    padding: 0 14px;
  }

  /* les liens Favoris/Panier/Abonnements/Compte du header passent
     dans la barre du bas sur mobile — on les cache ici */
  .actions {
    display: none;
  }

  /* NAVBAR catégories — repliable, fermée par défaut */
  .navbar {
    flex-wrap: wrap;
    padding: 8px 12px;
  }

  .menu-left {
    width: 100%;
    justify-content: flex-start;
  }

  .menu-links {
    display: none;
    width: 100%;
    flex-direction: column;
    gap: 0;
    margin-top: 10px;
  }

  .menu-links.open {
    display: flex;
  }

  .menu-links li {
    width: 100%;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .menu-links a {
    display: block;
    padding: 12px 4px;
  }

  .menu-links a::after {
    display: none;
  }

  /* HERO */
  .side {
    padding: 40px 24px;
    text-align: center;
    align-items: center;
  }

  .side p {
    max-width: 100%;
  }

  .stats {
    gap: 20px;
    padding: 20px;
  }

  .products {
    padding: 30px 12px;
  }

  .product-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .product-card {
    width: 100%;
    padding: 10px;
  }

  .product-card img {
    height: 110px;
  }

  .product-card h4 {
    font-size: 12px;
  }

  .product-card p {
    font-size: 13px;
  }

  .btn-cart {
    font-size: 11px;
    padding: 6px;
  }

  .seller {
    padding: 40px 16px;
  }

  .footer {
    padding: 30px 20px;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .LR {
    align-items: center;
  }
}

/* ================= BARRE DE NAVIGATION MOBILE (bas d'écran) ================= */
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 600px) {
  .mobile-bottom-nav {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--ink);
    border-top: 1px solid rgba(255,255,255,0.1);
    padding: 6px 0 8px;
    z-index: 1000;
  }

  .mobile-bottom-nav a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #C9CEDA;
    text-decoration: none;
    font-size: 10px;
    position: relative;
    flex: 1;
  }

  .mobile-bottom-nav a span:first-child {
    font-size: 18px;
  }

  .mobile-bottom-nav a.active {
    color: var(--gold);
  }

  .cart-count-mobile {
    position: absolute;
    top: -4px;
    right: 24%;
    background: var(--gold);
    color: var(--ink);
    font-size: 9px;
    font-weight: 700;
    padding: 0 4px;
    border-radius: 10px;
    line-height: 1.4;
  }
}
