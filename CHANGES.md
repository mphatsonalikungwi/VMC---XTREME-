# VMC Xtreme — Change Log

Audited and patched by Claude, working from the public `vmcxtreme.github.io` repo and the `VMC-Dashboard-Renewal-Fix` server.js. Every item below was verified against the actual source, not assumed.

## Security

- **Removed a dormant XSS-risk script.** A leftover script block at the end of `index.html` fired an unauthenticated request to `/api/owner/dashboard/stats` on every page load for every visitor, and — unlike the real dashboard code, which escapes all user data through an `esc()` helper — inserted customer names into the page via `innerHTML` without escaping. It targeted DOM elements that no longer exist on the current page, so it was not actively exploitable today, but it was a live liability sitting in the code. Deleted entirely.
- **Closed an account-enumeration gap.** `PATCH /api/owner/accounts/:id/status` and `DELETE /api/owner/accounts/:id` used to reveal *"The primary Super Owner cannot be [deleted/deactivated]"* to any authenticated Super Owner who probed an account ID — including a non-primary Super Owner (e.g. the business owner) guessing at the developer/primary account's ID. Both endpoints now return a generic `404 Owner account not found` to anyone who isn't the primary account, so the developer account's existence can't be confirmed by ID-guessing.
- **Confirmed (not changed):** the existing `is_primary` vs `role` separation already does what you need — a non-primary Super Owner (Vitumbiko) cannot see, edit, deactivate, or delete the primary/developer account through `GET /api/owner/accounts` (it's filtered out of the list entirely for non-primary viewers), and cannot create another Super Owner account. This was already correctly built; I only closed the ID-probing side-channel around it.
- **Registration is now config-gated, not code-gated.** `POST /api/auth/register` previously had a hard-coded `return` placed before the `PUBLIC_REGISTRATION_ENABLED` check, so the flag was dead code. Removed the hard block — registration now turns on purely by setting `PUBLIC_REGISTRATION_ENABLED=true` on Render, no redeploy required. **It is still OFF by default right now.** See "Before you re-open registration" below.
- No secrets were found committed to git history (checked all commits). `.env` was never committed — only a placeholder `.env.example`. No Supabase keys are exposed client-side; the frontend never talks to Supabase directly, only to your own Render API, which is the correct pattern.

## Performance / "looks hand-built, not AI-generated"

- **Cut total page weight by ~70%, HTML file size by ~96%.** Your logo and 4 gallery photos were base64-encoded directly inside `index.html`, making it a 1.9MB single file. Extracted all 5 images into a real `/assets` folder, resized them to their actual display dimensions, and compressed them. `index.html` is now ~77KB; total page weight (HTML + images) is ~575KB, down from ~1.95MB. This also means images now load in parallel and get cached by the browser across visits, instead of being re-downloaded every time any text on the page changes.
- Added `width`/`height` and `loading="lazy"` to all images — prevents layout shift on load and defers off-screen gallery images.
- Added a real favicon, apple-touch-icon, and Open Graph/Twitter card meta tags (using your actual logo) — sharing the link on WhatsApp or Facebook now shows a proper preview card instead of nothing.
- Added `robots.txt` and `sitemap.xml` — standard on any real deployed site, costs nothing, and helps Google index you properly.

## Duplicate content removed

- Registration "coming soon" alert had a sentence repeated twice back-to-back — fixed.
- The member-portal section's intro paragraph repeated "Manage your membership with confidence" twice — fixed.
- FAQ answers previously described "the site" in the third person ("The current site states that...", "The current listed price is...") instead of just answering the question — rewritten in your own voice.
- The exact same "VMC Xtreme Fitness Gym is a welcoming training facility..." paragraph was copy-pasted verbatim in both the hero section and the footer — footer copy rewritten to be distinct.
- Removed the "100% Goal Focused" stat rather than leave a number that isn't measuring anything real. If you have an actual figure (years running, member count, trainers on staff), tell me and I'll add it back as a real stat.

## Before you re-open customer registration

Since customers haven't been added yet, there's no data-loss risk in testing this. Before setting `PUBLIC_REGISTRATION_ENABLED=true` on Render, confirm:
1. `DATABASE_URL` on Render points at your new Supabase Postgres connection string (the pooled/transaction-mode URI Supabase gives you, not the direct one, for Render's connection limits).
2. `JWT_SECRET` on Render is a long random value — **not** the placeholder `CHANGE_THIS_TO_A_LONG_RANDOM_SECRET`.
3. Run `schema.sql` then `seed.sql` against the Supabase database once (or let `initializeDatabase()` do it automatically on server start — it already runs both on boot).
4. Do one full test registration yourself end-to-end before announcing it publicly.

The frontend's "Join Now" / "Choose Plan" buttons still show a coming-soon message regardless of this flag — wiring them to the real (already-built, currently hidden) registration form is a separate small task whenever you're ready to go live with it.

## Still open / needs your input

- Full visual/brand redesign pass — I want your input on direction rather than redesigning it unilaterally (see next message).
- Wiring the public registration buttons to the real form once you confirm Supabase is ready.
- Whether to add real numbers to replace the removed "100% Goal Focused" stat.
