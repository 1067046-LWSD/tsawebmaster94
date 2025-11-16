Community Connect
Overview
Community Connect is a fully functional static web application built for the TSA Webmaster Competition. It serves as a centralized platform for discovering local community resources and services. The application helps residents find essential support services including food assistance, healthcare, education, employment programs, housing support, and legal aid.

Current Status: ✅ Complete and fully functional

Homepage with hero section, search functionality, and featured resources
Resource directory with live search and category filtering (8 sample resources)
Interactive map with Leaflet.js markers for all resources
Submit form with validation and localStorage persistence
Comprehensive about page with project documentation
The application is built as a client-side only solution with no backend server, storing resource data in a static JSON file and utilizing vanilla JavaScript for all interactive functionality.

User Preferences
Preferred communication style: Simple, everyday language.

System Architecture
Frontend Architecture
Static Multi-Page Application (MPA)

The application uses traditional HTML pages (index.html, directory.html, map.html, submit.html, about.html) rather than a single-page application framework
Navigation is handled through standard anchor links between pages
Each page loads its own HTML content and shares common CSS/JS assets
Rationale: Simplicity, no build process required, excellent SEO, and fast initial page loads
Trade-off: Some code duplication across pages, page reloads on navigation
Vanilla JavaScript

No frontend framework (React, Vue, Angular) is used
DOM manipulation and event handling done with native browser APIs
Rationale: Reduces complexity, eliminates build steps, smaller bundle size, faster load times
Trade-off: More verbose code, manual state management, no component reusability
CSS Custom Properties (CSS Variables)

Design system implemented using CSS variables for colors, spacing, and transitions
Centralized theming in :root selector
Rationale: Easy theme maintenance, consistent design, no preprocessor needed
Pros: Simple to update colors globally, better than hardcoded values
Cons: Limited compared to full CSS preprocessors like SASS
Responsive Design

Mobile-first approach with fluid layouts
Mobile menu toggle functionality for navigation
Rationale: Ensures usability across all device sizes
Data Storage
Static JSON File

Resource data stored in assets/data/resources.json
Client-side fetch API used to load data
No database or backend API
Rationale: Appropriate for read-heavy, low-update-frequency data; simplifies deployment
Limitations: No real-time updates, no user authentication, form submissions cannot be persisted without external service
Alternative Considered: Backend with database would enable dynamic updates but adds complexity and hosting requirements
Resource Data Structure

Each resource contains: id, name, category, description, address, website, phone, coordinates (lat/lng), featured flag, and image URL
Categories include: Food Assistance, Healthcare, Education, Employment, Housing, Legal Aid
Interactive Features
Search and Filter System

Client-side search across resource names, categories, and descriptions
Category-based filtering system
Filter state managed in JavaScript (currentFilter global variable)
Rationale: Fast, no server required, works offline once loaded
Form Handling

Resource submission form with client-side validation
Submissions saved to localStorage for persistence across sessions
Success message displayed on submission with form reset
Current Implementation: Submissions stored in browser localStorage under 'resourceSubmissions' key
Future Enhancement: Backend API would enable submissions to be reviewed and added to main resource database
External Dependencies
Mapping Service
Leaflet.js (v1.9.4)

Open-source JavaScript library for interactive maps
Loaded from CDN: https://unpkg.com/leaflet@1.9.4/
Used on map.html to display resource locations with markers
Rationale: Lightweight, open-source alternative to Google Maps, no API key required
Integration: Resources with lat/lng coordinates are plotted as markers with popup information
Map Tile Provider

Uses OpenStreetMap tiles (assumption based on Leaflet usage)
Free, no API key required
Alternative: Could use Mapbox, Google Maps, or other providers with API keys
Image Hosting
Unsplash

Resource images pulled from Unsplash via direct URLs
Format: https://images.unsplash.com/photo-{id}?w=800&h=600&fit=crop
Rationale: Free, high-quality stock photos for placeholder content
Limitation: External dependency, images may change or become unavailable
Production Consideration: Should use local image hosting or CDN for reliability
Content Delivery
CDN for External Libraries

Leaflet CSS and JS loaded from unpkg.com CDN
Rationale: Faster delivery, browser caching, reduces hosting bandwidth
Risk: External dependency could fail; consider local fallback
Missing Backend Services
The application currently has no backend integration but would benefit from:

Database Service - To persist resources and form submissions (could add PostgreSQL via Drizzle ORM)
Form Processing Service - To handle resource submissions (options: custom API, Formspree, Netlify Forms)
Authentication Service - Not currently implemented; would be needed for admin features
Geocoding API - To convert addresses to coordinates for new submissions (options: OpenStreetMap Nominatim, Google Geocoding API)