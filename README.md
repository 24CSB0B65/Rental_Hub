# RentalHub

A full-stack rental marketplace and property management platform, built from the project brief in *RentalHub — Overall Project Overview*. One platform covers the journey from property discovery to ongoing management: **Discover → Rent → Manage**.

## Tech stack

- **Frontend:** React (Vite), React Router, Axios, Leaflet / React-Leaflet for maps
- **Backend:** Node.js, Express, REST API
- **Database:** SQLite via Node's built-in `node:sqlite` module — zero setup, file-based, **no native compilation required** (this avoids the Python/build-tools headaches that packages like `better-sqlite3` need on Windows). Swap for PostgreSQL/MySQL later without changing the API shape.
- **Auth:** JWT, bcrypt password hashing, role-based access control (`renter` / `owner`)

## Modules implemented

| Module | Description |
|---|---|
| Authentication | Registration, login, role-based access (Renter / Owner) |
| Property Listings | Owners create, edit, unlist and delete listings |
| Search & Discovery | Renters filter by city, price, bedrooms, type, keyword |
| Map-Based Location | Owners pick a location on a map when listing; renters see it on the property page |
| Applications & Lease | Renters apply (with a contact phone); owners approve/reject; approval auto-creates a lease and rejects other pending applicants |
| Contact exchange | Owners see the applicant's name, email and phone on each application; once approved, both sides see each other's full contact card (name, email, phone with mailto/tel links) on the application and lease |
| Property Management | Rent-due tracking, marking rent paid, tenant/lease view for owners |
| Ending a lease | Either party can end an active lease (e.g. tenant moving out) — it's marked ended, the property is relisted as available, and the other party is notified |
| Maintenance Requests | Renters report issues on their leased property; owners triage through open → in progress → resolved |
| Notifications | In-app notifications for applications, approvals, rent payments, lease endings and maintenance updates |
| Status filtering | Listings, applications, leases and maintenance requests can each be filtered by status (e.g. available/rented/unlisted, pending/approved/rejected, active/ended, open/in progress/resolved) |

Admin (verification, moderation, reports) is called out in the brief as a **future addition** and is not built here, matching the brief's scope.

## Project structure

```
rentalhub/
├── server/                 # Express API
│   ├── db.js                # SQLite schema + connection
│   ├── seed.js               # Demo accounts + sample properties
│   ├── server.js              # App entry point
│   ├── middleware/auth.js       # JWT auth + role guard
│   ├── routes/                # auth, properties, applications, leases, maintenance, notifications
│   └── utils/notify.js
└── client/                 # React app
    └── src/
        ├── api/client.js         # Axios instance with auth header
        ├── context/AuthContext.jsx
        ├── components/            # Navbar, MapView, LocationPicker, PropertyCard, PrivateRoute
        └── pages/                 # Home, Login, Register, Browse, PropertyDetails,
                                    # OwnerProperties, PropertyForm, MyApplications,
                                    # OwnerApplications, Leases, MyMaintenance,
                                    # OwnerMaintenance, Notifications
```

## Getting started

Requires **Node.js 22.5+** (for the built-in `node:sqlite` module — check with `node -v`; if you're below this, install the current LTS from nodejs.org).

> **Windows PowerShell users:** run each command on its own line (PowerShell doesn't support chaining with `&&` the way bash does). If you hit leftover errors from a previous failed install, delete `node_modules` and `package-lock.json` in that folder first, then `npm install` again.

### 1. Backend

```bash
cd server
npm install
npm run seed     # creates the DB and demo data (safe to re-run)
npm start        # runs on http://localhost:4000
```

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev       # runs on http://localhost:5173
```

The client reads the API URL from `client/.env` (`VITE_API_URL`, defaults to `http://localhost:4000/api`).

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Owner | owner@demo.com | password123 |
| Owner | owner2@demo.com | password123 |
| Renter | renter@demo.com | password123 |

Or register a new account from the app and pick either role.

## Typical walkthrough

1. Log in as `renter@demo.com`, browse listings, filter by city/price, open a property and view its map location.
2. Apply to a property with an optional message.
3. Log in as `owner@demo.com`, open **Applications**, approve the renter's application — this creates a lease and marks the property rented.
4. Under **Leases**, add a rent-due entry for a date; the renter can mark it paid from their own **My Rentals** view.
5. As the renter, submit a **Maintenance** request against the active lease; as the owner, move it from open → in progress → resolved.
6. Check **Notifications** on either account to see the activity trail.

## API overview

All endpoints are under `/api`. Protected routes require `Authorization: Bearer <token>`.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /properties` (filters: `city`, `minPrice`, `maxPrice`, `bedrooms`, `propertyType`, `q`), `GET /properties/:id`, `GET /properties/owner/mine`, `POST /properties`, `PUT /properties/:id`, `DELETE /properties/:id`
- `POST /applications`, `GET /applications/mine`, `GET /applications/owner`, `PUT /applications/:id`
- `GET /leases/mine`, `GET /leases/:id`, `PUT /leases/:id/end`, `POST /leases/:id/rent`, `PUT /leases/rent/:paymentId/pay`
- `POST /maintenance`, `GET /maintenance/mine`, `PUT /maintenance/:id`
- `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`

## Notes & next steps

- Map tiles are served from the public OpenStreetMap tile servers at runtime (no API key needed).
- Images are referenced by URL (no file upload pipeline) — add `multer` + object storage to support direct uploads.
- SQLite is used for zero-setup local development; the query layer is plain SQL so migrating to PostgreSQL/MySQL mainly means swapping the `db.js` driver.
- Payment gateway integration, smart recommendations and an Admin module are noted in the brief as optional/future scope and are left as extension points.
