# PawTrip Planner

A pet-friendly travel planner prototype that helps users discover nearby dog-friendly places and generate a simple itinerary based on a destination and selected keywords.

## Features

- Landing page with destination search and pet travel keywords
- Browser geolocation entry point for "Use my current location"
- Manual city search for mock destinations such as Edmonton, Vancouver, Calgary, and Cancun
- Input normalization for examples like `vancouver`, `Vancouver`, and `Vancouver, BC`
- Pet-friendly place cards with name, category, rating, address, distance, tags, short descriptions, and image URL placeholders
- One-click trip plan generator for morning, afternoon, and evening
- Two-column planner layout with recommendation cards, mock map center, and city-specific markers

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

This prototype intentionally uses API-ready mock place data and does not call an AI, Google Places, or maps API yet.

Supported demo cities:

- Edmonton, Alberta
- Calgary, Alberta
- Vancouver, British Columbia
- Cancun, Quintana Roo
