const demoCities = window.PAWTRIP_DEMO_CITIES || {};
const defaultCityId = window.PAWTRIP_DEFAULT_CITY_ID || "edmonton";
const unsupportedCityMessage =
  "We don&rsquo;t have demo data for this city yet. Try Edmonton, Vancouver, Calgary, or Cancun.";
const activeKeywords = new Set(["cafe", "restaurant", "park", "outdoor"]);

const searchForm = document.querySelector("#search-form");
const destinationInput = document.querySelector("#destination");
const useLocationButton = document.querySelector("#use-location");
const keywordList = document.querySelector("#keyword-list");
const placeList = document.querySelector("#place-list");
const resultCount = document.querySelector("#result-count");
const resultsTitle = document.querySelector("#results-title");
const statusMessage = document.querySelector("#status-message");
const mockMap = document.querySelector("#mock-map");
const mapLocation = document.querySelector("#map-location");
const generatePlanButton = document.querySelector("#generate-plan");
const itineraryCard = document.querySelector("#itinerary-card");
const timeline = document.querySelector("#timeline");

let selectedCity = demoCities[defaultCityId] || Object.values(demoCities)[0] || null;
let requestedCityLabel = selectedCity?.name || "";
let visiblePlaces = [];

function normalizeCityInput(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\b(british columbia|quintana roo|alberta|canada|mexico)\b/g, " ")
    .replace(/\b(bc|b c|ab|alta|qroo|qr|ca|mx)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeyword(value) {
  return value.trim().toLowerCase();
}

function getCityAliases(city) {
  return [city.id, city.name, city.province, city.country, ...(city.aliases || [])]
    .filter(Boolean)
    .map(normalizeCityInput)
    .filter(Boolean);
}

function resolveCity(input) {
  const normalizedInput = normalizeCityInput(input);

  if (!normalizedInput) {
    return selectedCity;
  }

  return (
    Object.values(demoCities).find((city) => getCityAliases(city).includes(normalizedInput)) ||
    Object.values(demoCities).find((city) => normalizeCityInput(city.name) === normalizedInput) ||
    null
  );
}

function placeMatchesKeywords(place) {
  if (activeKeywords.size === 0) {
    return true;
  }

  const searchableValues = [place.category, ...(place.tags || [])].map(normalizeKeyword);
  return searchableValues.some((value) => activeKeywords.has(value));
}

function getFilteredPlaces(city) {
  if (!city) {
    return [];
  }

  return city.places
    .filter(placeMatchesKeywords)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function getCityDisplayName(city) {
  if (!city) {
    return requestedCityLabel ? requestedCityLabel : "Unsupported city";
  }

  return `${city.name}, ${city.province}`;
}

function renderPlaces() {
  visiblePlaces = getFilteredPlaces(selectedCity);
  placeList.innerHTML = "";

  if (!selectedCity) {
    resultCount.textContent = "0 places";
    resultsTitle.textContent = requestedCityLabel
      ? `No demo data for ${requestedCityLabel}`
      : "No supported city selected";
    mapLocation.textContent = "No city selected";
    statusMessage.innerHTML = unsupportedCityMessage;
    placeList.innerHTML = `<div class="empty-state">${unsupportedCityMessage}</div>`;
    renderMap(null, []);
    return;
  }

  resultCount.textContent = `${visiblePlaces.length} ${visiblePlaces.length === 1 ? "place" : "places"}`;
  resultsTitle.textContent = `Pet-friendly places near ${getCityDisplayName(selectedCity)}`;
  mapLocation.textContent = `${selectedCity.name} center: ${selectedCity.map.center.lat.toFixed(4)}, ${selectedCity.map.center.lng.toFixed(4)}`;

  if (visiblePlaces.length === 0) {
    statusMessage.textContent = `No ${selectedCity.name} places match the selected keywords yet.`;
    placeList.innerHTML = `
      <div class="empty-state">
        No mock places match those keywords yet. Try selecting cafe, park, restaurant, hotel, indoor, or outdoor.
      </div>
    `;
    renderMap(selectedCity, []);
    return;
  }

  statusMessage.textContent = `Showing ${visiblePlaces.length} mock recommendations for ${selectedCity.name}.`;

  visiblePlaces.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.innerHTML = `
      <div class="place-image" style="background-image: url('${place.imageUrl}')"></div>
      <div class="place-card-header">
        <h4 class="place-name">${place.name}</h4>
        <span class="rating">${place.rating.toFixed(1)} star</span>
      </div>
      <div class="place-meta">
        <span>${formatCategory(place.category)}</span>
        <span aria-hidden="true">-</span>
        <span>${place.distanceKm.toFixed(1)} km away</span>
      </div>
      <p class="place-meta">${place.address}</p>
      <p class="place-description">${place.description}</p>
      <div class="tag-list">
        ${(place.tags || []).slice(0, 5).map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    `;
    placeList.appendChild(card);
  });

  renderMap(selectedCity, visiblePlaces);
}

function formatCategory(category) {
  return category
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getMarkerPosition(city, place) {
  const { bounds } = city.map;
  const x = ((place.location.lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - place.location.lat) / (bounds.north - bounds.south)) * 100;

  return {
    x: clamp(x, 7, 90),
    y: clamp(y, 7, 90),
  };
}

function renderMap(city, mapPlaces) {
  mockMap.innerHTML = `
    <div class="map-road one"></div>
    <div class="map-road two"></div>
  `;

  if (!city) {
    mockMap.classList.add("is-empty");
    mockMap.insertAdjacentHTML("beforeend", `<div class="map-empty">${unsupportedCityMessage}</div>`);
    return;
  }

  mockMap.classList.toggle("is-empty", mapPlaces.length === 0);
  mockMap.dataset.centerLat = city.map.center.lat;
  mockMap.dataset.centerLng = city.map.center.lng;
  mockMap.insertAdjacentHTML(
    "beforeend",
    `<div class="map-center-label">${city.name} map center ${city.map.center.lat.toFixed(4)}, ${city.map.center.lng.toFixed(4)}</div>`,
  );

  mapPlaces.forEach((place, index) => {
    const position = getMarkerPosition(city, place);
    const pin = document.createElement("div");
    pin.className = "map-pin";
    pin.style.left = `${position.x}%`;
    pin.style.top = `${position.y}%`;
    pin.title = `${place.name} (${place.location.lat}, ${place.location.lng})`;
    pin.innerHTML = `<span>${index + 1}</span>`;
    mockMap.appendChild(pin);
  });
}

function findPlaceByCategory(category) {
  return visiblePlaces.find((place) => normalizeKeyword(place.category) === category);
}

function findPlaceByTag(tag) {
  return visiblePlaces.find((place) => (place.tags || []).map(normalizeKeyword).includes(tag));
}

function renderItinerary() {
  if (!selectedCity) {
    itineraryCard.hidden = false;
    timeline.innerHTML = `<div class="empty-state">${unsupportedCityMessage}</div>`;
    return;
  }

  if (!visiblePlaces.length) {
    itineraryCard.hidden = false;
    timeline.innerHTML = `
      <div class="empty-state">
        Add at least one matching place before generating a trip plan for ${selectedCity.name}.
      </div>
    `;
    return;
  }

  const cafe = findPlaceByCategory("cafe") || findPlaceByTag("cafe") || visiblePlaces[0];
  const park = findPlaceByCategory("park") || findPlaceByTag("park") || visiblePlaces[1] || visiblePlaces[0];
  const restaurant =
    findPlaceByCategory("restaurant") || findPlaceByTag("restaurant") || visiblePlaces[2] || visiblePlaces[0];

  const itinerary = [
    {
      time: "Morning",
      title: cafe ? `Visit ${cafe.name}` : `Visit a dog-friendly cafe in ${selectedCity.name}`,
      detail: cafe
        ? `${formatCategory(cafe.category)} stop ${cafe.distanceKm.toFixed(1)} km from the ${selectedCity.name} demo center. ${cafe.description}`
        : "Start with a dog-friendly cafe that has outdoor seating.",
    },
    {
      time: "Afternoon",
      title: park ? `Walk at ${park.name}` : `Walk at a nearby ${selectedCity.name} park`,
      detail: park
        ? `Give your pet time to explore near ${park.address}. ${park.description}`
        : "Choose a nearby park or outdoor photo spot for exercise.",
    },
    {
      time: "Evening",
      title: restaurant ? `Dinner at ${restaurant.name}` : `Try a pet-friendly ${selectedCity.name} restaurant`,
      detail: restaurant
        ? `End with a relaxed meal. ${restaurant.description}`
        : "Look for a pet-friendly restaurant with outdoor seating.",
    },
  ];

  itineraryCard.hidden = false;
  timeline.innerHTML = itinerary
    .map(
      (item) => `
        <div class="timeline-item">
          <div class="timeline-time">${item.time}</div>
          <div>
            <strong>${item.title}</strong>
            <p>${item.detail}</p>
          </div>
        </div>
      `,
    )
    .join("");
}

function selectCity(city, label, message) {
  selectedCity = city;
  requestedCityLabel = label || city?.name || "";
  itineraryCard.hidden = true;
  statusMessage.textContent = message;
  renderPlaces();
}

function setCityFromInput() {
  const requestedCity = destinationInput.value.trim();

  if (!requestedCity) {
    selectCity(demoCities[defaultCityId], demoCities[defaultCityId]?.name, "Showing the default demo city.");
    return;
  }

  const matchingCity = resolveCity(requestedCity);

  if (matchingCity) {
    selectCity(matchingCity, matchingCity.name, `Showing mock recommendations for ${matchingCity.name}.`);
  } else {
    selectedCity = null;
    requestedCityLabel = requestedCity;
    itineraryCard.hidden = true;
    renderPlaces();
  }
}

keywordList.addEventListener("click", (event) => {
  const chip = event.target.closest(".keyword-chip");

  if (!chip) {
    return;
  }

  const keyword = chip.dataset.keyword;
  chip.classList.toggle("is-active");

  if (activeKeywords.has(keyword)) {
    activeKeywords.delete(keyword);
  } else {
    activeKeywords.add(keyword);
  }

  itineraryCard.hidden = true;
  renderPlaces();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setCityFromInput();
});

useLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    statusMessage.textContent = "Geolocation is not available in this browser. Enter a supported demo city instead.";
    return;
  }

  statusMessage.textContent = "Requesting your current location...";

  navigator.geolocation.getCurrentPosition(
    () => {
      destinationInput.value = "Current location";
      selectCity(
        demoCities[defaultCityId],
        "Current location",
        "Location detected. Showing the default demo city until reverse geocoding is added.",
      );
    },
    () => {
      statusMessage.textContent = "Could not access location. You can still enter Edmonton, Vancouver, Calgary, or Cancun.";
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
  );
});

generatePlanButton.addEventListener("click", renderItinerary);

if (selectedCity) {
  renderPlaces();
} else {
  selectedCity = null;
  requestedCityLabel = "";
  renderPlaces();
}
