const places = [
  {
    name: "Little Brick Cafe",
    category: "Cafe",
    rating: 4.7,
    address: "10004 90 St NW, Edmonton",
    city: "Edmonton",
    distanceKm: 1.2,
    tags: ["dog-friendly", "outdoor seating", "cafe", "brunch", "budget-friendly", "outdoor"],
    description: "Dog-friendly patio, cozy atmosphere, and a relaxed brunch stop before a river valley walk.",
    coordinates: { x: 28, y: 36 },
  },
  {
    name: "Terwillegar Dog Park",
    category: "Park",
    rating: 4.8,
    address: "10 Rabbit Hill Rd NW, Edmonton",
    city: "Edmonton",
    distanceKm: 4.6,
    tags: ["dog-friendly", "park", "off-leash", "outdoor", "photo spots"],
    description: "Large off-leash trails with river views, open fields, and plenty of space for energetic dogs.",
    coordinates: { x: 62, y: 58 },
  },
  {
    name: "Campio Brewing Co.",
    category: "Restaurant",
    rating: 4.5,
    address: "10257 105 St NW, Edmonton",
    city: "Edmonton",
    distanceKm: 2.1,
    tags: ["dog-friendly", "restaurant", "outdoor seating", "budget-friendly", "outdoor"],
    description: "Casual pet-friendly patio with shareable plates and a central downtown location.",
    coordinates: { x: 47, y: 30 },
  },
  {
    name: "Matrix Hotel",
    category: "Hotel",
    rating: 4.4,
    address: "10640 100 Ave NW, Edmonton",
    city: "Edmonton",
    distanceKm: 2.7,
    tags: ["dog-friendly", "hotel", "indoor", "downtown"],
    description: "Pet-friendly rooms near downtown parks, good for travelers who want a walkable base.",
    coordinates: { x: 54, y: 42 },
  },
  {
    name: "Stanley Park Seawall",
    category: "Park",
    rating: 4.9,
    address: "Stanley Park Dr, Vancouver",
    city: "Vancouver",
    distanceKm: 1.8,
    tags: ["dog-friendly", "park", "photo spots", "outdoor"],
    description: "Scenic waterfront route with mountain views and easy stops for photos with your pup.",
    coordinates: { x: 32, y: 48 },
  },
  {
    name: "Nelson the Seagull",
    category: "Cafe",
    rating: 4.6,
    address: "315 Carrall St, Vancouver",
    city: "Vancouver",
    distanceKm: 2.3,
    tags: ["dog-friendly", "cafe", "outdoor seating", "budget-friendly", "outdoor"],
    description: "Neighborhood cafe with outdoor tables and a simple breakfast menu before exploring Gastown.",
    coordinates: { x: 58, y: 34 },
  },
  {
    name: "The Wicklow Pub",
    category: "Restaurant",
    rating: 4.4,
    address: "610 Stamps Landing, Vancouver",
    city: "Vancouver",
    distanceKm: 3.0,
    tags: ["dog-friendly", "restaurant", "outdoor seating", "photo spots", "outdoor"],
    description: "Waterfront patio with dog-friendly seating and False Creek views for a relaxed evening meal.",
    coordinates: { x: 67, y: 61 },
  },
  {
    name: "The Burrard",
    category: "Hotel",
    rating: 4.3,
    address: "1100 Burrard St, Vancouver",
    city: "Vancouver",
    distanceKm: 1.1,
    tags: ["dog-friendly", "hotel", "indoor", "budget-friendly"],
    description: "Retro pet-friendly hotel with a central location and quick access to downtown walks.",
    coordinates: { x: 46, y: 50 },
  },
  {
    name: "Parque de las Palapas",
    category: "Park",
    rating: 4.5,
    address: "Centro, Cancun",
    city: "Cancun",
    distanceKm: 1.5,
    tags: ["dog-friendly", "park", "outdoor", "budget-friendly"],
    description: "Open-air local square for an easy evening stroll and casual snacks with your dog.",
    coordinates: { x: 38, y: 56 },
  },
  {
    name: "Cafe con Gracia",
    category: "Cafe",
    rating: 4.7,
    address: "Av Carlos Nader, Cancun",
    city: "Cancun",
    distanceKm: 2.0,
    tags: ["dog-friendly", "cafe", "outdoor seating", "photo spots", "outdoor"],
    description: "Friendly cafe with shaded outdoor seating and colorful corners for vacation photos.",
    coordinates: { x: 56, y: 38 },
  },
  {
    name: "Nomads Hotel Cancun",
    category: "Hotel",
    rating: 4.2,
    address: "Av Carlos Nader 2A, Cancun",
    city: "Cancun",
    distanceKm: 2.8,
    tags: ["dog-friendly", "hotel", "budget-friendly", "indoor"],
    description: "Budget-conscious stay with pet-friendly options close to downtown restaurants.",
    coordinates: { x: 70, y: 48 },
  },
  {
    name: "Marakame Cafe",
    category: "Restaurant",
    rating: 4.6,
    address: "Av Xpujil Sur, Cancun",
    city: "Cancun",
    distanceKm: 3.4,
    tags: ["dog-friendly", "restaurant", "outdoor seating", "outdoor"],
    description: "Garden-style restaurant with outdoor seating that works well for a calm dinner stop.",
    coordinates: { x: 45, y: 72 },
  },
];

const defaultCity = "Edmonton";
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

let selectedCity = defaultCity;
let visiblePlaces = [];

function normalize(value) {
  return value.trim().toLowerCase();
}

function getPlacesForCity(city) {
  const normalizedCity = normalize(city);
  const cityMatches = places.filter((place) => normalize(place.city) === normalizedCity);
  return cityMatches.length > 0 ? cityMatches : places.filter((place) => place.city === defaultCity);
}

function placeMatchesKeywords(place) {
  if (activeKeywords.size === 0) {
    return true;
  }

  return place.tags.some((tag) => activeKeywords.has(tag)) || activeKeywords.has(normalize(place.category));
}

function renderPlaces() {
  const cityPlaces = getPlacesForCity(selectedCity);
  visiblePlaces = cityPlaces
    .filter(placeMatchesKeywords)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  placeList.innerHTML = "";
  resultCount.textContent = `${visiblePlaces.length} ${visiblePlaces.length === 1 ? "place" : "places"}`;
  resultsTitle.textContent = `Pet-friendly places near ${selectedCity}`;
  mapLocation.textContent = selectedCity;

  if (visiblePlaces.length === 0) {
    placeList.innerHTML = `
      <div class="empty-state">
        No mock places match those keywords yet. Try selecting cafe, park, restaurant, hotel, indoor, or outdoor.
      </div>
    `;
    renderMap([]);
    return;
  }

  visiblePlaces.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.innerHTML = `
      <div class="place-card-header">
        <h4 class="place-name">${place.name}</h4>
        <span class="rating">${place.rating.toFixed(1)} star</span>
      </div>
      <div class="place-meta">
        <span>${place.category}</span>
        <span aria-hidden="true">-</span>
        <span>${place.distanceKm.toFixed(1)} km away</span>
      </div>
      <p class="place-meta">${place.address}</p>
      <p class="place-description">${place.description}</p>
      <div class="tag-list">
        ${place.tags.slice(0, 5).map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    `;
    placeList.appendChild(card);
  });

  renderMap(visiblePlaces);
}

function renderMap(mapPlaces) {
  mockMap.innerHTML = `
    <div class="map-road one"></div>
    <div class="map-road two"></div>
  `;

  mapPlaces.forEach((place, index) => {
    const pin = document.createElement("div");
    pin.className = "map-pin";
    pin.style.left = `${place.coordinates.x}%`;
    pin.style.top = `${place.coordinates.y}%`;
    pin.title = place.name;
    pin.innerHTML = `<span>${index + 1}</span>`;
    mockMap.appendChild(pin);
  });
}

function renderItinerary() {
  const cafe = visiblePlaces.find((place) => place.tags.includes("cafe")) || visiblePlaces[0];
  const park = visiblePlaces.find((place) => place.tags.includes("park")) || visiblePlaces[1] || visiblePlaces[0];
  const restaurant = visiblePlaces.find((place) => place.tags.includes("restaurant")) || visiblePlaces[2] || visiblePlaces[0];

  if (!visiblePlaces.length) {
    itineraryCard.hidden = false;
    timeline.innerHTML = `
      <div class="empty-state">
        Add at least one matching place before generating a trip plan.
      </div>
    `;
    return;
  }

  const itinerary = [
    {
      time: "Morning",
      title: cafe ? `Visit ${cafe.name}` : "Visit a dog-friendly cafe",
      detail: cafe
        ? `${cafe.category} stop ${cafe.distanceKm.toFixed(1)} km away. ${cafe.description}`
        : "Start with a dog-friendly cafe that has outdoor seating.",
    },
    {
      time: "Afternoon",
      title: park ? `Walk at ${park.name}` : "Walk at a nearby park",
      detail: park
        ? `Give your pet time to explore. ${park.description}`
        : "Choose a nearby park or outdoor photo spot for exercise.",
    },
    {
      time: "Evening",
      title: restaurant ? `Dinner at ${restaurant.name}` : "Try a pet-friendly restaurant",
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

function setCityFromInput() {
  const requestedCity = destinationInput.value.trim();
  const matchingCity = places.find((place) => normalize(place.city) === normalize(requestedCity))?.city;

  if (!requestedCity) {
    selectedCity = defaultCity;
    statusMessage.textContent = "Showing mock recommendations for a dog-friendly day out.";
  } else if (matchingCity) {
    selectedCity = matchingCity;
    statusMessage.textContent = `Showing mock recommendations for ${matchingCity}.`;
  } else {
    selectedCity = defaultCity;
    statusMessage.textContent = `No mock data for "${requestedCity}" yet, so showing Edmonton recommendations.`;
  }

  itineraryCard.hidden = true;
  renderPlaces();
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
    statusMessage.textContent = "Geolocation is not available in this browser. Showing Edmonton mock data.";
    selectedCity = defaultCity;
    renderPlaces();
    return;
  }

  statusMessage.textContent = "Requesting your current location...";

  navigator.geolocation.getCurrentPosition(
    () => {
      destinationInput.value = "Current location";
      selectedCity = defaultCity;
      statusMessage.textContent = "Location detected. Showing nearby mock recommendations for this 1.0 demo.";
      itineraryCard.hidden = true;
      renderPlaces();
    },
    () => {
      statusMessage.textContent = "Could not access location. You can still enter a destination city.";
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
  );
});

generatePlanButton.addEventListener("click", renderItinerary);

renderPlaces();
