# AI TripCraft – Smart AI Travel Itinerary Planner

AI TripCraft is a premium, SaaS-style full-stack travel planner built on the **MEAN Stack** (MongoDB, Express, Angular, Node.js) with Google Gemini AI integration. Users can configure trip parameters (destination, budget, preferences, dates) to generate structured day-by-day itineraries, track travel budgets, explore cities, check forecasts, and export itineraries to PDF.

---

## Technical Features

### Backend (`/backend`)
- **MVC Architecture**: Models, views/controllers separation.
- **AI Integration**: Calls Google Gemini API using structured response schemas.
- **REST APIs**: Full CRUD operations for trips, reviews, destinations, and user sessions.
- **Authentication**: JWT token-based auth with silent token refreshes and password resets.
- **Security**: Hardened HTTP headers (`helmet`), CORS configuration, and IP rate limits.
- **API Documentation**: Embedded Swagger UI.

### Frontend (`/frontend`)
- **Modern Angular**: Standalone components, Reactive Signals, and functional interceptors.
- **Premium Glassmorphism Design**: High-fidelity charts (Chart.js), responsive panels, custom transitions.
- **Budget Calculator**: Dynamically breaks down accommodations, meals, transport, and sightseeing budgets.
- **Mock Map Widget**: Interactive geolocations dashboard filtering airports, hotels, and attractions.
- **Weather widgets**: Open-Meteo current conditions and 5-day weather forecasts.
- **PDF Exporter**: Downloads high-fidelity PDFs via `jsPDF` and `jspdf-autotable`.

---

## Prerequisites
- **Node.js**: `v18.x` or above (Diagnostics verified `v24.18` is installed).
- **MongoDB**: Local MongoDB instance (default port `27017`) or Atlas connection string.
- **Google Gemini API Key**: Obtain a key from Google AI Studio.

---

## Getting Started Locally

### 1. Configure Environment Variables
Inside `/backend`, a `.env` template is pre-created:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/aitripcraft
JWT_SECRET=supersecretjwtkeyforaitripcraft
REFRESH_SECRET=supersecretrefreshkeyforaitripcraft
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
*Note: If `GEMINI_API_KEY` is omitted or left as placeholder, the backend falls back to a high-fidelity Mock Itinerary generator, allowing keyless testing.*

### 2. Install and Seed Database
Run the following commands in separate terminals:

**Backend Setup:**
```bash
cd backend
npm install
npm run seed  # Pre-populates default admin, users, and destinations
npm run dev   # Boots hot-reloader on http://localhost:5000
```
- **Seeded Accounts**:
  - **Admin**: `admin@aitripcraft.com` / `adminpassword123`
  - **User**: `john@gmail.com` / `userpassword123`
  - **User**: `jane@gmail.com` / `userpassword123`
- **Swagger Documentation**: Accessible at [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

**Frontend Setup:**
```bash
cd frontend
npm install
npm start     # Starts local server on http://localhost:4200
```

---

## Running with Docker Compose
To build and run all elements (Mongo, API, Client) in containerized environments:
```bash
docker-compose up --build
```
- **Frontend Client**: [http://localhost](http://localhost) (mapped on port 80)
- **API Server**: [http://localhost:5000](http://localhost:5000)
- **Database**: Port `27017`
