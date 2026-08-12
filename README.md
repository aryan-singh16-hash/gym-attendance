# Gym Attendance Tracker

Single-gym attendance system: members check in via a public link (no login), owner
gets an email + live dashboard update on every check-in, and can filter, search,
and export attendance as CSV/XLSX.

## Stack
- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Email:** Resend
- **Realtime:** WebSocket (dashboard auto-refreshes on new check-ins; falls back to the Refresh button if the socket can't connect)

## Project layout
```
gym-attendance/
  backend/     FastAPI app, MongoDB models, auth, email, export
  frontend/    React app: public check-in page + admin dashboard
```

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
- `MONGODB_URI` — your MongoDB connection string (local `mongodb://localhost:27017`, or an Atlas URI)
- `JWT_SECRET` — replace with a long random string (e.g. `openssl rand -hex 32`)
- `OWNER_EMAIL` / `OWNER_PASSWORD` — the login you'll use to sign in to the admin dashboard (used once, by the seed script below)
- `OWNER_NOTIFY_EMAIL` — where check-in notification emails should be sent (can be the same as `OWNER_EMAIL`)
- `RESEND_API_KEY` — from https://resend.com (free tier is enough to start)
- `RESEND_FROM_EMAIL` — must be a verified sender/domain in your Resend account

Create the owner login (run once):
```bash
python seed_owner.py
```

Start the API:
```bash
uvicorn main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Health check: `GET /api/health`.

## 2. Frontend setup

```bash
cd frontend
npm install
```

Optionally create `frontend/.env` to point at a non-default API URL:
```
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

The app is now at `http://localhost:5173`:
- `/` — public attendance check-in page (this is the link you share with members)
- `/admin/login` — owner login
- `/admin/dashboard` — attendance dashboard (requires login)

## 3. Sharing the attendance link with members

Once deployed, share the root URL (`/`) via WhatsApp, a notice board QR code, etc.
No login or registration is needed on that page — a member fills the form and taps
**Mark Attendance**.

## 4. Deploying

- **Frontend:** any static host (Vercel, Netlify, Cloudflare Pages) — run `npm run build`, deploy the `dist/` folder.
- **Backend:** any Python host that supports long-lived processes and WebSockets (Render, Railway, Fly.io, a VPS). Avoid pure serverless functions for the backend since the dashboard's live-update socket needs a persistent connection.
- **MongoDB:** MongoDB Atlas free tier works well for a single gym's data volume.
- Update `FRONTEND_URL` in the backend `.env` and `VITE_API_URL` in the frontend to point at your deployed URLs once live.

## Notes on what's included vs. deferred

Built now: public check-in form, session/time/date auto-fill (editable), owner
login, today's dashboard split by session, date filter, name/roll search, totals,
CSV/XLSX export by date range, email notification per check-in, live dashboard
updates.

Deferred (per the brief's "future improvements"): WhatsApp notifications, QR-code
auto-generation, member registration/roll-number lookup, monthly auto-emailed
reports, multi-gym support. The code is structured so these can be added without
a rewrite — e.g. a WhatsApp sender would slot in next to `email_service.py`.
