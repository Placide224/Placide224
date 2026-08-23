document.addEventListener("DOMContentLoaded", () => {
  // Poignée principale, posée sur le bord bas de l'image : révèle tout le panneau.
  const accordion = document.querySelector(".accordion");
  const cadranToggle = document.querySelector(".cadran-toggle");

  cadranToggle.addEventListener("click", () => {
    const isOpen = accordion.getAttribute("data-open") === "true";
    accordion.setAttribute("data-open", String(!isOpen));
    cadranToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  const items = document.querySelectorAll(".acc-item");

  items.forEach((item) => {
    const header = item.querySelector(".acc-header");

    header.addEventListener("click", () => {
      const isOpen = item.getAttribute("data-open") === "true";

      // Chaque section s'ouvre / se referme indépendamment.
      // L'image produit n'est jamais touchée : seul .accordion grandit ou se réduit.
      item.setAttribute("data-open", String(!isOpen));
      header.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  // Vignettes : change simplement la vignette active, sans jamais déplacer l'image principale.
  const thumbs = document.querySelectorAll(".thumb:not(.thumb-video)");
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
});
