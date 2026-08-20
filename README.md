# VMC Xtreme — Project 1

A lightweight public website plus a PostgreSQL-backed membership platform for VMC Xtreme Fitness Gym.

## Project boundary

This repository is **Project 1 only**. It has no relationship to the separate Health Centre project.

## Current state

- Public website is static and suitable for GitHub Pages.
- Membership registration and customer login are implemented in the backend, but public registration remains **OFF by default**.
- Customer registrations create a pending membership and pending payment; only an authorized Super Owner can verify payment and activate the membership.
- Owner/manager/staff authentication uses bcrypt password hashes and HTTP-only session cookies.
- The API uses PostgreSQL, Helmet, CORS, rate limiting, server-side authorization checks, CSRF-origin checks for browser state changes, and audit logging.
- No production secrets belong in this repository.

## Local frontend preview

The public site can be previewed without the backend:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Backend requirements

- Node.js 20+
- PostgreSQL
- A strong `JWT_SECRET` (32+ random characters; production should use a substantially longer random value)
- `DATABASE_URL`
- `FRONTEND_ORIGIN=https://vmc-xtreme-api.onrender.com`
- `COOKIE_SECURE=true` in production
- `COOKIE_SAMESITE=none` for the GitHub Pages → Render cross-site session flow
- `PUBLIC_REGISTRATION_ENABLED=false` until the complete flow has been tested

Copy `.env.example` to `.env` for local configuration and replace every placeholder.

## Database

On startup the backend applies `schema.sql` and `seed.sql`. Existing PostgreSQL data is preserved by the `CREATE TABLE IF NOT EXISTS` statements and additive password-reset columns.

## Production registration checklist

Do not enable public registration until all of these are true:

1. Render has the correct PostgreSQL `DATABASE_URL`.
2. `JWT_SECRET` is a strong random production secret.
3. `FRONTEND_ORIGIN` exactly matches the published site origin.
4. `DATABASE_URL` points to the Project 1 Supabase PostgreSQL database and is stored only in the API host's private environment variables.
5. `COOKIE_SECURE=true` is set.
6. The database schema and membership plans are present.
7. Owner credentials are configured securely.
8. A real test registration has been completed.
9. The test payment has been added/verified by the intended owner role.
10. Customer login and logout have been tested.
11. Owner deactivation and permission boundaries have been tested.

Only after that should `PUBLIC_REGISTRATION_ENABLED=true` be set.

## Deployment model

- Frontend: GitHub Pages
- API: Render (or another Node-compatible host)
- Database: Supabase PostgreSQL (Project 1 already has an active Supabase database)

The browser talks to the API only. Database credentials and privileged operations never belong in the frontend.

## Supabase

See `SUPABASE.md` for the database/storage architecture and the security hardening decision.

## Security note

This project handles personal customer information and membership/payment records. Treat production deployment as a security-sensitive system: use HTTPS, strong secrets, least-privilege owner accounts, backups, and regular dependency/security reviews.
