# VMC Xtreme — Pending Payment Repair

This patch is based on the uploaded VMC-Dashboard-Renewal-Fix.zip.

## Purpose
Repairs an existing membership whose status is `pending_payment` but which has no payment row.

## New flow
Owner -> affected customer -> Add payment -> choose actual payment method -> optional reference -> Add payment -> Verify payment -> membership becomes Active.

Allowed methods:
- Airtel Money
- TNM Mpamba
- National Bank
- Cash

## Changes
- Added Owner-only `POST /api/owner/memberships/:membershipId/payment`.
- Added `Add payment` button when a pending membership has no payment.
- The endpoint creates a pending payment without changing existing payments or the database schema.
- Existing Verify payment endpoint then verifies the payment and activates the membership.
- Existing PostgreSQL renewal flow is preserved.
- No environment-variable or Supabase schema changes are required.

## Deployment
Replace the root `server.js` and `index.html` in GitHub, commit to `main`, and allow Render to deploy.

Then test the existing affected pending renewal. Do not create a second renewal for this test.

If Render deployment fails, inspect Render logs before making additional changes.
