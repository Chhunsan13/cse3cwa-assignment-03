# AI Capsule

A private prompt library for CSE3CWA / CSE5006 Assignment 3. After GitHub OAuth, a user can create, read, update and delete their own prompt records. The React frontend and Express API are served from the same public URL.

## Deployed application

- Public URL: https://cse3cwa-assignment-03.onrender.com
- Cloud platform: Render (free web service)
- Health check: `GET /api/health` returns `{ "status": "ok" }`

## Install and run locally

Requires Node.js 18+ and a GitHub OAuth App. The same npm commands work on **Linux (Ubuntu)** and macOS. The deployed app already runs on Linux (Render).

### Ubuntu / Linux

Install Node and the compiler tools `better-sqlite3` needs:

```bash
sudo apt update
sudo apt install -y nodejs npm build-essential
node -v
```

`node -v` must be **v18 or newer**. If Ubuntu’s default Node is too old:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Run the app (Linux and macOS)

```bash
cp .env.example .env
npm install
npm --prefix client install
npm run dev
```

Fill in `.env` (GitHub OAuth values and `JWT_SECRET`). Do not commit that file.

- Frontend: http://localhost:5173
- API: http://localhost:3001

Vite proxies `/api` and `/auth` to Express.

Production-style local run (Express serves the React build):

```bash
npm run build
npm start
```

Then open http://localhost:3001. For that mode, set `BASE_URL=http://localhost:3001` and add that callback URL to the GitHub OAuth App. For day-to-day work, use `npm run dev` with `BASE_URL=http://localhost:5173`.

## Environment variables

Set these in `.env` locally and in the Render dashboard. Never commit secret values.

| Name | Purpose |
| --- | --- |
| `PORT` | Express port. Render sets this automatically. Do not force `3001` on Render. |
| `NODE_ENV` | `development` locally, `production` on Render |
| `BASE_URL` | Public origin used for the GitHub callback. Local: `http://localhost:5173`. Cloud: `https://cse3cwa-assignment-03.onrender.com` |
| `JWT_SECRET` | Secret used by Express to sign and verify the application JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client id |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `COOKIE_SECURE` | `false` on local HTTP. `true` on Render HTTPS |

## GitHub OAuth App

Create an OAuth App at https://github.com/settings/developers.

Authorization callback URLs:

- Local: `http://localhost:5173/auth/github/callback`
- Cloud: `https://cse3cwa-assignment-03.onrender.com/auth/github/callback`

## OAuth and JWT

1. `/login` starts GitHub OAuth by sending the browser to `/auth/github`.
2. GitHub redirects to `/auth/github/callback`.
3. Express exchanges the code, loads the GitHub user, and signs its **own** application JWT with `jsonwebtoken`. The payload includes `userId` (GitHub user id), `login` and `name`.
4. That JWT is stored in a **HttpOnly** cookie named `token` (`Secure` when `COOKIE_SECURE=true`). The frontend never reads the JWT and does not use `localStorage` or an `Authorization` Bearer header.
5. `requireAuth` in `server/middleware/requireAuth.js` verifies the cookie on protected routes. The owner id comes from the verified token, never from the request body.

Firebase Authentication is not used. There is no custom username/password register flow.

## How React talks to Express

The client uses `fetch` to same-origin paths such as `/api/capsules`, with `credentials: 'include'` so the `token` cookie is sent. In development, Vite proxies those paths to port 3001. In production, Express serves `client/dist` and the API from one URL.

## API routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Starts OAuth login |
| `/dashboard` | Protected (UI) | Authenticated CRUD |
| `GET /api/health` | Public | `{ "status": "ok" }` |
| `GET /api/capsules` | JWT | Read own records |
| `POST /api/capsules` | JWT | Create own record |
| `PUT /api/capsules/:id` | JWT | Update own record |
| `DELETE /api/capsules/:id` | JWT | Delete own record |
| `GET /auth/github` | Public | Begin GitHub OAuth |
| `GET /auth/github/callback` | Public | Issues the JWT cookie |
| `GET /auth/me` | JWT | Current user from the verified JWT |
| `POST /auth/logout` | Public | Clears the `token` cookie |

Missing or invalid JWTs return `401 Unauthorized` and do not return capsule data. Update and delete only succeed for rows whose `user_id` matches the JWT `userId`.

## Database

SQLite is created on first start at `data/capsules.db` using the assignment schema (`user_id`, project, title, version, prompt text, summary, category, usefulness, reviewed, improved, screenshot URL, notes, `created_at`).

On Render’s free web service the filesystem is ephemeral. SQLite works, but records can disappear after a restart or redeploy.

## Required cURL tests

```bash
curl -i https://cse3cwa-assignment-03.onrender.com/api/capsules
```

Result: `401 Unauthorized` (HTTP/2 401), body `{"error":"Unauthorized"}`.

```bash
curl -i -H "Cookie: token=fake-token-123" https://cse3cwa-assignment-03.onrender.com/api/capsules
```

Result: `401 Unauthorized` (HTTP/2 401), body `{"error":"Unauthorized"}`.

`GET /api/health` remains public and returns `{"status":"ok"}`.

## Honest limitation

SQLite on Render’s free disk is ephemeral, so saved capsules may be wiped when the service sleeps, restarts or is redeployed. The app still demonstrates cloud CRUD and JWT protection.

## AI-assisted development

- AI tools used: Cursor for project setup, React pages, Express routes, SQLite, OAuth/JWT wiring, CSS, Render troubleshooting and this README.
- Problem found and corrected: Render’s production `NODE_ENV` skipped the client `devDependencies`, so `vite` was missing and the build failed with `vite: not found`. The build script now uses `npm --prefix client install --include=dev`. A second UI crash was `useNavigate()` pasted outside the Dashboard component, which blanked every page until the hook was moved inside the component.
- OAuth / JWT / protected API: completed GitHub login on the deployed URL, then ran both required cURL tests against `/api/capsules` and confirmed `401`. Code inspection: every `/api/capsules` route uses `requireAuth`.
- CRUD and ownership: created, edited and deleted a record while signed in; `GET /api/capsules` only returns rows for the JWT `userId`.
- Independent decision: serve the Vite production build from the same Express process so frontend and API share one public origin. That keeps the HttpOnly cookie working without cross-site CORS setup.

Do not commit `.env`, `JWT_SECRET`, GitHub client secrets, or a real JWT.
