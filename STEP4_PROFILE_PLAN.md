# Step 4 — My Profile

## Scope
Upgrade the existing member profile area without replacing the dashboard layout, membership logic, payment logic, authentication, or database schema.

## Member-facing experience
The existing profile card becomes the member identity area and adds:
- My Profile identity label and concise explanation.
- VMC Username.
- Full Name.
- Phone Number.
- Registered Email from the authenticated Supabase user.
- Membership plan.
- Session type.
- Member-since date.
- Existing profile picture upload remains intact.

## Safety
- Read-only profile presentation; no profile writes are introduced.
- Uses the authenticated user's own `profiles` row.
- Uses the existing Supabase client and parameterized `.eq('id', user.id)` query.
- No schema changes.
- No existing dashboard sections are removed, renamed, reordered, or replaced.
- Account & Security and Change Password remain reserved for Step 5.
