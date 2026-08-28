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

  // Livraison : détection et mise à jour de l'emplacement
  const COUNTRIES = [
    { code: "CG", name: "Congo-Brazzaville", flag: "🇨🇬", capital: "Brazzaville", cities: ["Brazzaville", "Pointe-Noire", "Dolisie"], timezones: ["Africa/Brazzaville"] },
    { code: "CD", name: "RD Congo", flag: "🇨🇩", capital: "Kinshasa", cities: ["Kinshasa", "Lubumbashi", "Goma"], timezones: ["Africa/Kinshasa", "Africa/Lubumbashi"] },
    { code: "CM", name: "Cameroun", flag: "🇨🇲", capital: "Yaoundé", cities: ["Yaoundé", "Douala", "Garoua"], timezones: ["Africa/Douala"] },
    { code: "GA", name: "Gabon", flag: "🇬🇦", capital: "Libreville", cities: ["Libreville", "Port-Gentil"], timezones: ["Africa/Libreville"] },
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", capital: "Abidjan", cities: ["Abidjan", "Yamoussoukro", "Bouaké"], timezones: ["Africa/Abidjan"] },
    { code: "SN", name: "Sénégal", flag: "🇸🇳", capital: "Dakar", cities: ["Dakar", "Thiès", "Saint-Louis"], timezones: ["Africa/Dakar"] },
    { code: "BE", name: "Belgique", flag: "🇧🇪", capital: "Bruxelles", cities: ["Bruxelles", "Anvers", "Gand", "Liège"], timezones: ["Europe/Brussels"] },
    { code: "FR", name: "France", flag: "🇫🇷", capital: "Paris", cities: ["Paris", "Marseille", "Lyon", "Toulouse"], timezones: ["Europe/Paris"] },
    { code: "CH", name: "Suisse", flag: "🇨🇭", capital: "Berne", cities: ["Berne", "Genève", "Zurich"], timezones: ["Europe/Zurich"] },
    { code: "CA", name: "Canada", flag: "🇨🇦", capital: "Ottawa", cities: ["Ottawa", "Montréal", "Toronto"], timezones: ["America/Toronto", "America/Montreal"] },
    { code: "US", name: "États-Unis", flag: "🇺🇸", capital: "Washington", cities: ["Washington", "New York", "Los Angeles"], timezones: ["America/New_York", "America/Los_Angeles", "America/Chicago"] },
    { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", capital: "Londres", cities: ["Londres", "Manchester", "Birmingham"], timezones: ["Europe/London"] },
  ];
  const DEFAULT_COUNTRY_CODE = "CG";
  const STORAGE_KEY = "nt7east-delivery-location";

  const deliveryCityEl = document.getElementById("deliveryCity");
  const updateLocationLink = document.getElementById("updateLocationLink");
  const deliveryLocationRow = document.getElementById("deliveryLocationRow");
  const locationModalOverlay = document.getElementById("locationModalOverlay");
  const locationModalClose = document.getElementById("locationModalClose");
  const countrySelect = document.getElementById("countrySelect");
  const citySelect = document.getElementById("citySelect");
  const confirmLocationBtn = document.getElementById("confirmLocationBtn");

  const findCountry = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE);

  const detectCountryCode = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const match = COUNTRIES.find((c) => c.timezones.includes(timezone));
      if (match) return match.code;
    } catch (e) {
      // Détection indisponible : on garde le pays par défaut.
    }
    return DEFAULT_COUNTRY_CODE;
  };

  const populateCountrySelect = () => {
    countrySelect.innerHTML = COUNTRIES.map(
      (c) => `<option value="${c.code}">${c.flag} ${c.name}</option>`
    ).join("");
  };

  const populateCitySelect = (countryCode, selectedCity) => {
    const country = findCountry(countryCode);
    citySelect.innerHTML = country.cities
      .map((city) => `<option value="${city}">${city}</option>`)
      .join("");
    citySelect.value = selectedCity && country.cities.includes(selectedCity) ? selectedCity : country.capital;
  };

  const setDeliveryCity = (cityName) => {
    if (deliveryCityEl) deliveryCityEl.textContent = cityName;
  };

  const showUpdateLink = (visible) => {
    if (updateLocationLink) updateLocationLink.hidden = !visible;
  };

  const openLocationModal = () => {
    const saved = getSavedLocation();
    const countryCode = saved ? saved.countryCode : detectCountryCode();
    populateCountrySelect();
    countrySelect.value = countryCode;
    populateCitySelect(countryCode, saved ? saved.city : null);
    locationModalOverlay.hidden = false;
  };

  const closeLocationModal = () => {
    locationModalOverlay.hidden = true;
  };

  const getSavedLocation = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const saveLocation = (countryCode, city) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ countryCode, city }));
    } catch (e) {
      // Stockage indisponible : la sélection reste valable pour la session en cours.
    }
  };

  // Initialisation : emplacement enregistré, sinon détection automatique (capitale).
  const savedLocation = getSavedLocation();
  if (savedLocation) {
    setDeliveryCity(savedLocation.city);
    showUpdateLink(false);
  } else {
    const detectedCountry = findCountry(detectCountryCode());
    setDeliveryCity(detectedCountry.capital);
    showUpdateLink(true);
  }

  deliveryLocationRow?.addEventListener("click", (event) => {
    event.preventDefault();
    openLocationModal();
  });

  locationModalClose?.addEventListener("click", closeLocationModal);
  locationModalOverlay?.addEventListener("click", (event) => {
    if (event.target === locationModalOverlay) closeLocationModal();
  });

  countrySelect?.addEventListener("change", () => {
    populateCitySelect(countrySelect.value, null);
  });

  confirmLocationBtn?.addEventListener("click", () => {
    const countryCode = countrySelect.value;
    const city = citySelect.value;
    saveLocation(countryCode, city);
    setDeliveryCity(city);
    showUpdateLink(false);
    closeLocationModal();
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
