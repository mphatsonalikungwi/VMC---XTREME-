# VMC live SQLite export — temporary patch

Replace the currently deployed SQLite backend's `server.js` with this file and deploy it.

This adds one endpoint:

`GET /api/owner/migration/export`

Requirements:
- Existing Super Owner login is required.
- The endpoint is read-only with respect to VMC business data.
- It creates one audit-log entry recording the export counts.
- It downloads `vmc-sqlite-export.json` containing the eight migration tables.

After the export is downloaded and verified, remove this endpoint before switching production to PostgreSQL.
