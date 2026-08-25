document.addEventListener("DOMContentLoaded", () => {
  // Onglets catégories
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Bouton flottant : apparaît quand on scrolle vers le haut, cache tout en haut de page
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  let lastScrollY = window.scrollY;

  const onScroll = () => {
    const currentScrollY = window.scrollY;
    const scrollingUp = currentScrollY < lastScrollY;
    const pastTop = currentScrollY > 120;

    scrollTopBtn.classList.toggle("visible", scrollingUp && pastTop);
    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
