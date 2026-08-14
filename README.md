# VMC Dashboard + Renewal Fix

This patch is based on the PostgreSQL backend with the previously verified cross-site
session-cookie (Partitioned) fix.

Changes:
- Fixes dashboard light/white sections so text remains readable.
- Makes member detail/view content visibly readable.
- Renewal now records a real pending payment with the selected payment method/reference.
- Owner can then use the existing "Verify payment" action to approve it and activate the renewal.
- No schema changes are required.
- No environment-variable changes are required.

Replace the root server.js and index.html in the GitHub repository. Do not change
DATABASE_URL, JWT_SECRET, COOKIE_SECURE, or Supabase settings.
