# @sealife/web

A small React + Vite frontend for the Sealife API. It's here so the API can be clicked through, not as
something to learn from. Every endpoint has a button.

```sh
npm run start:api   # Nest on :3000 (needs Postgres + Redis: docker compose up -d)
npm run start:web   # Vite on http://localhost:5173
```

- **No CORS needed.** The browser only talks to Vite, which proxies `/api` to Nest
  (`vite.config.ts`). Point it elsewhere with `API_URL=http://localhost:3001 npm run start:web`.
- **Request log.** The right-hand panel lists every request with its status and timing. Reload the page
  to see `401 → POST /auth/refresh → retry`.
- **Tokens.** The access token is kept in memory and the refresh token in `localStorage`. On a 401 the
  client refreshes once and retries. Refreshes are serialised, within a tab and across tabs, because
  sending the same refresh token twice trips the API's reuse detection and logs you out everywhere
  (`src/api.ts`).
- **Admin tab.** Only shown to admins. Promote yourself with `npm run make-admin -- you@example.com`
  in `apps/api`, then reload the page. The reload refreshes the token, and the new one carries the
  role from the database.
