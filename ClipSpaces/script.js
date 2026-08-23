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
});
