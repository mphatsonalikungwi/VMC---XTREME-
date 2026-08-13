# VMC Xtreme — V5 API-Connected Platform

V5 connects the VMC Xtreme website to the V4 backend.

## Connected workflows
- Customer registration -> database
- Customer login/logout -> secure backend session
- Customer membership dashboard -> live database
- Membership plans -> backend
- Owner authentication -> protected dashboard
- Owner member search/list -> database
- Payment verification -> membership activation
- Renewal creation -> database

Attendance remains intentionally deferred.

## Run
Requires Node.js 20+.

    npm install
    copy .env.example .env
    # configure .env
    npm start

Then open `http://localhost:3000`.

Do not expose the system publicly until HTTPS, strong secrets, backups, notification providers, privacy/retention procedures and security testing are completed.
