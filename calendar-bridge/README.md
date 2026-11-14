# Hiretivo Calendar authorization bridge

This optional service lets independent Hiretivo installations connect Google Calendar without creating their own Google OAuth client. Run one instance behind HTTPS with `BRIDGE_PUBLIC_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`; register `<BRIDGE_PUBLIC_URL>/google/callback` as the exact Google OAuth redirect URL. Set `HIRETIVO_CALENDAR_BRIDGE_URL` to that public URL on installations that offer this option.

Run `node calendar-bridge/server.mjs` with Node 24, or build `calendar-bridge/Dockerfile`. The service listens on `PORT` (8080 by default); terminate TLS at your reverse proxy. `/health` is its health endpoint. Keep the Google client secret in the bridge environment, never in the open source image or a self hosted installation.

The bridge has no database. Pending consent and one-use tickets live in memory for ten minutes, so run one replica; a restart only interrupts connections in progress. It exchanges and renews Calendar tokens but does not persist them. The installation stores the refresh token encrypted and calls Google Calendar directly. The bridge must be publicly reachable over HTTPS; a local Hiretivo install can still return through its loopback browser address.

Enable the Google Calendar API and configure the Calendar scopes in the OAuth consent screen. Complete Google's required verification before offering the shared client publicly. Gmail is outside this bridge.
