const demoCities = window.PAWTRIP_DEMO_CITIES || {};
const defaultCityId = window.PAWTRIP_DEFAULT_CITY_ID || "edmonton";
const unsupportedCityMessage = "We don't have demo data for this city yet. Try Edmonton, Vancouver, Calgary, or Cancun.";

const onboardingScreen = document.querySelector("#onboarding-screen");
const plannerApp = document.querySelector("#planner-app");
const onboardingForm = document.querySelector("#onboarding-form");
const destinationInput = document.querySelector("#destination");
const useLocationButton = document.querySelector("#use-location");
const featureChips = document.querySelector("#feature-chips");
const preferenceChips = document.querySelector("#preference-chips");
const selectedFilters = document.querySelector("#selected-filters");
const placeList = document.querySelector("#place-list");
const resultCount = document.querySelector("#result-count");
const resultsTitle = document.querySelector("#results-title");
const statusMessage = document.querySelector("#status-message");
const mockMap = document.querySelector("#mock-map");
const mapLocation = document.querySelector("#map-location");
const mapCenter = document.querySelector("#map-center");
const generatePlanButton = document.querySelector("#generate-plan");
const editPreferencesButton = document.querySelector("#edit-preferences");
const itineraryCard = document.querySelector("#itinerary-card");
const timeline = document.querySelector("#timeline");
const placePreview = document.querySelector("#place-preview");
const tripList = document.querySelector("#trip-list");
const tripCount = document.querySelector("#trip-count");

const selectedFeatureKeywords = new Set();
const selectedPreferenceKeywords = new Set();
let selectedCity = demoCities[defaultCityId] || Object.values(demoCities)[0] || null;
let requestedCityLabel = selectedCity?.name || "";
let visiblePlaces = [];
let focusedPlaceId = null;
let savedTripPlaceIds = [];

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function getCityDisplayName(city) {
  if (!city) {
    return requestedCityLabel ? requestedCityLabel : "Unsupported city";
  }

  return `${city.name}, ${city.province}`;
}

function initializeSelectedKeywords() {
  featureChips.querySelectorAll(".selection-chip.is-active").forEach((chip) => {
    selectedFeatureKeywords.add(chip.dataset.keyword);
  });
  preferenceChips.querySelectorAll(".selection-chip.is-active").forEach((chip) => {
    selectedPreferenceKeywords.add(chip.dataset.keyword);
  });
}

function getActiveChipLabels() {
  return Array.from(document.querySelectorAll(".selection-chip.is-active")).map((chip) => chip.textContent.trim());
}

function setupChipGroup(group, selectedSet) {
  group.addEventListener("click", (event) => {
    const chip = event.target.closest(".selection-chip");

    if (!chip) {
      return;
    }

    const keyword = chip.dataset.keyword;
    chip.classList.toggle("is-active");

    if (selectedSet.has(keyword)) {
      selectedSet.delete(keyword);
    } else {
      selectedSet.add(keyword);
    }

    itineraryCard.hidden = true;
    renderPlanner();
  });
}

function placeMatchesKeywords(place) {
  const aliases = {
    cafes: "cafe",
    cafe: "cafe",
    restaurants: "restaurant",
    parks: "park",
    hotels: "hotel",
    "pet-friendly": "dog-friendly",
    "scenic walks": "outdoor",
  };

  const searchableValues = [place.category, ...(place.tags || [])].map(normalizeKeyword);
  const featureValues = Array.from(selectedFeatureKeywords).map((keyword) => aliases[keyword] || keyword);
  const preferenceValues = Array.from(selectedPreferenceKeywords).map((keyword) => aliases[keyword] || keyword);
  const matchesFeatures = featureValues.length === 0 || featureValues.some((keyword) => searchableValues.includes(keyword));
  const matchesPreferences = preferenceValues.every((keyword) => searchableValues.includes(keyword));

  return matchesFeatures && matchesPreferences;
}

function getFilteredPlaces(city) {
  if (!city) {
    return [];
  }

  return city.places
    .filter(placeMatchesKeywords)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function getAllKnownPlaces() {
  return Object.values(demoCities).flatMap((city) => city.places);
}

function getPlaceById(placeId) {
  return getAllKnownPlaces().find((place) => place.id === placeId) || null;
}

function getMarkerPosition(city, placeOrLocation) {
  const { bounds } = city.map;
  const location = placeOrLocation.location || placeOrLocation;
  const x = ((location.lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - location.lat) / (bounds.north - bounds.south)) * 100;

  return {
    x: clamp(x, 7, 92),
    y: clamp(y, 8, 90),
  };
}

function selectCity(city, label, message) {
  selectedCity = city;
  requestedCityLabel = label || city?.name || "";
  focusedPlaceId = null;
  itineraryCard.hidden = true;
  statusMessage.textContent = message;
  renderPlanner();
}

function setCityFromInput() {
  const requestedCity = destinationInput.value.trim();

  if (!requestedCity) {
    selectCity(demoCities[defaultCityId], demoCities[defaultCityId]?.name, "Showing the default demo city.");
    return true;
  }

  const matchingCity = resolveCity(requestedCity);

  if (matchingCity) {
    selectCity(matchingCity, matchingCity.name, `Showing mock recommendations for ${matchingCity.name}.`);
    return true;
  }

  selectedCity = null;
  requestedCityLabel = requestedCity;
  focusedPlaceId = null;
  itineraryCard.hidden = true;
  renderPlanner();
  return false;
}

function showPlanner() {
  onboardingScreen.hidden = true;
  plannerApp.hidden = false;
  document.body.classList.add("is-planning");
  renderPlanner();
}

function showOnboarding() {
  plannerApp.hidden = true;
  onboardingScreen.hidden = false;
  document.body.classList.remove("is-planning");
  placePreview.hidden = true;
}

function renderPlanner() {
  renderSelectedFilters();
  renderPlaces();
  renderMap();
  renderTripList();
}

function renderSelectedFilters() {
  const labels = getActiveChipLabels();
  selectedFilters.innerHTML = labels.length
    ? labels.map((label) => `<span class="filter-pill">${escapeHtml(label)}</span>`).join("")
    : `<span class="filter-pill">No filters selected</span>`;
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
    mapCenter.textContent = "No map center available";
    statusMessage.textContent = unsupportedCityMessage;
    placeList.innerHTML = `<div class="empty-state">${unsupportedCityMessage}</div>`;
    placePreview.hidden = true;
    return;
  }

  resultCount.textContent = `${visiblePlaces.length} ${visiblePlaces.length === 1 ? "place" : "places"}`;
  resultsTitle.textContent = `Pet-friendly places near ${getCityDisplayName(selectedCity)}`;
  mapLocation.textContent = selectedCity.name;
  mapCenter.textContent = `${selectedCity.map.center.lat.toFixed(4)}, ${selectedCity.map.center.lng.toFixed(4)}`;
  statusMessage.textContent = `Planning around ${selectedCity.name} with ${
    selectedFeatureKeywords.size + selectedPreferenceKeywords.size
  } selected travel features.`;

  if (visiblePlaces.length === 0) {
    placeList.innerHTML = `
      <div class="empty-state">
        No mock places match those features yet. Try fewer must-have elements or choose another demo city.
      </div>
    `;
    placePreview.hidden = true;
    return;
  }

  visiblePlaces.forEach((place, index) => {
    const card = document.createElement("article");
    card.className = `place-card${place.id === focusedPlaceId ? " is-focused" : ""}`;
    card.dataset.placeId = place.id;
    card.innerHTML = `
      <div class="place-card-header">
        <h4 class="place-name">${escapeHtml(place.name)}</h4>
        <span class="rating">${place.rating.toFixed(1)} star</span>
      </div>
      <div class="place-meta">
        <span>${formatCategory(place.category)}</span>
        <span aria-hidden="true">-</span>
        <span>${place.distanceKm.toFixed(1)} km away</span>
      </div>
      <p class="place-meta">${escapeHtml(place.address)}</p>
      <p class="place-description">${escapeHtml(place.description)}</p>
      <div class="tag-list">
        ${(place.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="place-actions">
        <button type="button" class="mini-button" data-action="view" data-place-id="${place.id}">View on map</button>
        <button type="button" class="mini-button primary-mini" data-action="add" data-place-id="${place.id}">
          ${savedTripPlaceIds.includes(place.id) ? "Added" : "Add to trip"}
        </button>
      </div>
    `;
    card.style.setProperty("--card-index", index + 1);
    placeList.appendChild(card);
  });
}

function renderMap() {
  mockMap.innerHTML = `
    <div class="map-road one"></div>
    <div class="map-road two"></div>
    <div class="map-road three"></div>
  `;

  if (!selectedCity) {
    mockMap.classList.add("is-empty");
    mockMap.insertAdjacentHTML("beforeend", `<div class="map-empty">${unsupportedCityMessage}</div>`);
    return;
  }

  mockMap.classList.toggle("is-empty", visiblePlaces.length === 0);
  mockMap.classList.toggle("is-focused", Boolean(focusedPlaceId));
  mockMap.dataset.centerLat = selectedCity.map.center.lat;
  mockMap.dataset.centerLng = selectedCity.map.center.lng;

  const centerPosition = getMarkerPosition(selectedCity, selectedCity.map.center);
  const centerMarker = document.createElement("div");
  centerMarker.className = "city-center-marker";
  centerMarker.style.left = `${centerPosition.x}%`;
  centerMarker.style.top = `${centerPosition.y}%`;
  centerMarker.title = `${selectedCity.name} center`;
  centerMarker.textContent = "P";
  mockMap.appendChild(centerMarker);

  if (visiblePlaces.length === 0) {
    mockMap.insertAdjacentHTML(
      "beforeend",
      `<div class="map-empty">No markers match the selected features. Adjust your chips to see nearby places.</div>`,
    );
    return;
  }

  visiblePlaces.forEach((place, index) => {
    const position = getMarkerPosition(selectedCity, place);
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `map-pin${place.id === focusedPlaceId ? " is-focused" : ""}`;
    pin.style.left = `${position.x}%`;
    pin.style.top = `${position.y}%`;
    pin.dataset.placeId = place.id;
    pin.title = `${place.name} (${place.location.lat}, ${place.location.lng})`;
    pin.setAttribute("aria-label", `View ${place.name}`);
    pin.innerHTML = `<span>${index + 1}</span>`;
    mockMap.appendChild(pin);
  });

  const focusedPlace = focusedPlaceId ? visiblePlaces.find((place) => place.id === focusedPlaceId) : visiblePlaces[0];
  renderPlacePreview(focusedPlace);
}

function renderPlacePreview(place) {
  if (!place) {
    placePreview.hidden = true;
    return;
  }

  placePreview.hidden = false;
  placePreview.innerHTML = `
    <div class="preview-header">
      <div>
        <p class="eyebrow">${formatCategory(place.category)}</p>
        <h3>${escapeHtml(place.name)}</h3>
      </div>
      <button type="button" class="close-preview" id="close-preview" aria-label="Close place preview">x</button>
    </div>
    <div class="place-meta">
      <span>${place.rating.toFixed(1)} star</span>
      <span aria-hidden="true">-</span>
      <span>${place.distanceKm.toFixed(1)} km away</span>
    </div>
    <p class="place-description">${escapeHtml(place.description)}</p>
    <div class="tag-list">
      ${(place.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
    <div class="place-actions">
      <button type="button" class="mini-button primary-mini" data-action="add" data-place-id="${place.id}">
        ${savedTripPlaceIds.includes(place.id) ? "Added to trip" : "Add to trip"}
      </button>
    </div>
  `;
}

function focusPlace(placeId) {
  if (!visiblePlaces.some((place) => place.id === placeId)) {
    return;
  }

  focusedPlaceId = placeId;
  itineraryCard.hidden = true;
  renderPlanner();

  const focusedCard = placeList.querySelector(`[data-place-id="${placeId}"]`);
  focusedCard?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function addPlaceToTrip(placeId) {
  if (!getPlaceById(placeId) || savedTripPlaceIds.includes(placeId)) {
    return;
  }

  savedTripPlaceIds = [...savedTripPlaceIds, placeId];
  renderPlanner();
}

function removePlaceFromTrip(placeId) {
  savedTripPlaceIds = savedTripPlaceIds.filter((id) => id !== placeId);
  renderTripList();
  renderPlaces();
  renderPlacePreview(getPlaceById(focusedPlaceId));
}

function renderTripList() {
  const savedPlaces = savedTripPlaceIds.map(getPlaceById).filter(Boolean);
  tripCount.textContent = `${savedPlaces.length} ${savedPlaces.length === 1 ? "stop" : "stops"}`;

  if (!savedPlaces.length) {
    tripList.innerHTML = `<p class="empty-copy">Add places to build a simple pet-friendly route.</p>`;
    return;
  }

  tripList.innerHTML = savedPlaces
    .map(
      (place, index) => `
        <div class="trip-stop">
          <div>
            <strong>${index + 1}. ${escapeHtml(place.name)}</strong>
            <span>${formatCategory(place.category)} - ${place.distanceKm.toFixed(1)} km</span>
          </div>
          <button type="button" class="mini-button" data-action="remove" data-place-id="${place.id}">Remove</button>
        </div>
      `,
    )
    .join("");
}

function findPlaceByCategory(places, category) {
  return places.find((place) => normalizeKeyword(place.category) === category);
}

function findPlaceByTag(places, tag) {
  return places.find((place) => (place.tags || []).map(normalizeKeyword).includes(tag));
}

function renderItinerary() {
  if (!selectedCity) {
    itineraryCard.hidden = false;
    timeline.innerHTML = `<div class="empty-state">${unsupportedCityMessage}</div>`;
    return;
  }

  const savedPlaces = savedTripPlaceIds.map(getPlaceById).filter(Boolean);
  const planningPlaces = savedPlaces.length ? savedPlaces : visiblePlaces;

  if (!planningPlaces.length) {
    itineraryCard.hidden = false;
    timeline.innerHTML = `
      <div class="empty-state">
        Add at least one matching place before generating a trip plan for ${selectedCity.name}.
      </div>
    `;
    return;
  }

  const cafe = findPlaceByCategory(planningPlaces, "cafe") || findPlaceByTag(planningPlaces, "cafe") || planningPlaces[0];
  const park = findPlaceByCategory(planningPlaces, "park") || findPlaceByTag(planningPlaces, "park") || planningPlaces[1] || planningPlaces[0];
  const restaurant =
    findPlaceByCategory(planningPlaces, "restaurant") ||
    findPlaceByTag(planningPlaces, "restaurant") ||
    planningPlaces[2] ||
    planningPlaces[0];

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
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </div>
      `,
    )
    .join("");
}

onboardingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setCityFromInput();
  showPlanner();
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

editPreferencesButton.addEventListener("click", showOnboarding);
generatePlanButton.addEventListener("click", renderItinerary);
setupChipGroup(featureChips, selectedFeatureKeywords);
setupChipGroup(preferenceChips, selectedPreferenceKeywords);

placeList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  const card = event.target.closest(".place-card");

  if (actionButton) {
    const { action, placeId } = actionButton.dataset;

    if (action === "view") {
      focusPlace(placeId);
    } else if (action === "add") {
      addPlaceToTrip(placeId);
    }
    return;
  }

  if (card?.dataset.placeId) {
    focusPlace(card.dataset.placeId);
  }
});

mockMap.addEventListener("click", (event) => {
  const pin = event.target.closest(".map-pin");

  if (pin?.dataset.placeId) {
    focusPlace(pin.dataset.placeId);
  }
});

placePreview.addEventListener("click", (event) => {
  const closeButton = event.target.closest("#close-preview");
  const actionButton = event.target.closest("[data-action]");

  if (closeButton) {
    placePreview.hidden = true;
    return;
  }

  if (actionButton?.dataset.action === "add") {
    addPlaceToTrip(actionButton.dataset.placeId);
  }
});

tripList.addEventListener("click", (event) => {
  const removeButton = event.target.closest('[data-action="remove"]');

  if (removeButton?.dataset.placeId) {
    removePlaceFromTrip(removeButton.dataset.placeId);
  }
});

initializeSelectedKeywords();
renderPlanner();
