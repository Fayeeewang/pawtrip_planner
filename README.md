# PawTrip Planner

A pet-friendly travel planner prototype that helps users discover nearby dog-friendly places and generate a simple itinerary based on a destination and selected keywords.

## Features

- Full-screen onboarding page with Samoyed travel inspired branding
- Travel feature and must-have preference chips before entering the planner
- Browser geolocation entry point for "Use my current location"
- Manual city search for mock destinations such as Edmonton, Vancouver, Calgary, and Cancun
- Input normalization for examples like `vancouver`, `Vancouver`, and `Vancouver, BC`
- Pet-friendly place cards with name, category, rating, address, distance, tags, short descriptions, and image URL placeholders
- Map-first planner with a large mock map, city center marker, and nearby place markers
- Clickable markers and place cards that show a place preview
- Independent scrollable places drawer with "View on map" and "Add to trip" actions
- Saved stops panel and one-click trip plan generator for morning, afternoon, and evening

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

This prototype intentionally uses API-ready mock place data and does not call an AI, Google Places, or maps API yet.

## UI structure

- `onboarding-screen`: welcome page, Samoyed travel visual, feature chips, preference chips, destination input, location button, and start action
- `planner-app`: map-first workspace with top bar, places drawer, large mock map, marker preview, saved trip panel, and itinerary overlay

## Reusable UI pieces

- Selection chips for features and must-have preferences
- Places drawer cards with shared map and trip actions
- Map marker renderer based on API-ready `location.lat/lng`
- Place preview overlay
- Saved trip stop rows
- Timeline itinerary items

Supported demo cities:

- Edmonton, Alberta
- Calgary, Alberta
- Vancouver, British Columbia
- Cancun, Quintana Roo
