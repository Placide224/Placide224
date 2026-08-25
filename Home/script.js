document.addEventListener("DOMContentLoaded", () => {
  // Onglets catégories
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Bouton flottant : apparaît quand on scrolle vers le bas, caché en haut de page
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  let lastScrollY = window.scrollY;

  const onScroll = () => {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;
    const pastTop = currentScrollY > 120;

    scrollTopBtn.classList.toggle("visible", scrollingDown && pastTop);
    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
