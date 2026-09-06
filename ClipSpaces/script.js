document.addEventListener("DOMContentLoaded", () => {
  // Galerie : sélection des vignettes
  const thumbs = document.querySelectorAll(".thumb");
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  // Galerie : flèches précédent / suivant
  const prevBtn = document.querySelector(".nav-arrow.prev");
  const nextBtn = document.querySelector(".nav-arrow.next");

  const stepGallery = (direction) => {
    const active = document.querySelector(".thumb.active");
    const list = Array.from(thumbs);
    const currentIndex = list.indexOf(active);
    const nextIndex = (currentIndex + direction + list.length) % list.length;
    list[nextIndex].click();
  };

  prevBtn?.addEventListener("click", () => stepGallery(-1));
  nextBtn?.addEventListener("click", () => stepGallery(1));

  // Sélection de couleur
  const swatches = document.querySelectorAll(".swatch");
  const selectedColorLabel = document.getElementById("selectedColorName");

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      swatches.forEach((s) => s.classList.remove("selected"));
      swatch.classList.add("selected");
      if (selectedColorLabel) {
        selectedColorLabel.textContent = swatch.dataset.color;
      }
    });
  });

  // Favoris
  const wishlistBtn = document.getElementById("wishlistBtn");
  wishlistBtn?.addEventListener("click", () => {
    wishlistBtn.classList.toggle("active");
    wishlistBtn.innerHTML = wishlistBtn.classList.contains("active") ? "&#9829;" : "&#9825;";
  });

  // Accordéon
  const triggers = document.querySelectorAll(".accordion-trigger");
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = trigger.nextElementSibling;
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      trigger.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? null : `${panel.scrollHeight}px`;
    });
  });

  // --- Bouton panier flottant — thème PLAN DE TRAVAIL NT7East ---
  const cartFab = document.getElementById("floatingCartBtn");
  const cartFabBadge = document.getElementById("cartFabBadge");

  // Point d'entrée unique pour ajouter un article au panier,
  // utilisé aussi bien par le bouton flottant que par le CTA "Ajouter au panier".
  window.addToCart = function addToCart(quantity = 1) {
    window.cartCount = (window.cartCount || 0) + quantity;

    if (cartFabBadge) {
      cartFabBadge.textContent = window.cartCount;
      cartFabBadge.hidden = window.cartCount === 0;
    }

    if (cartFab) {
      cartFab.classList.remove("cart-fab--pulse");
      void cartFab.offsetWidth; // force le redémarrage de l'animation
      cartFab.classList.add("cart-fab--pulse");
    }

    return window.cartCount;
  };

  // Change la couleur du bouton (ex. setCartButtonColor("#9333ea")).
  window.setCartButtonColor = function setCartButtonColor(color) {
    cartFab?.style.setProperty("--cart-fab-color", color);
  };

  // Affiche ou masque le bouton (ex. setCartButtonVisible(false)).
  window.setCartButtonVisible = function setCartButtonVisible(visible) {
    if (cartFab) cartFab.hidden = !visible;
  };

  cartFab?.addEventListener("click", () => addToCart());
  document.querySelector(".btn-primary")?.addEventListener("click", () => addToCart());
});
