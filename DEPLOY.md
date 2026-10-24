# Deploying Sai City Builders to Vercel

Total time: ~10 minutes. No code changes needed — everything is already
Vercel-ready (DB images, uploads, cookies, build scripts).

---

## 1. Free cloud database (Turso) — 3 minutes

The site uses SQLite locally, but Vercel's serverless filesystem is read-only,
so production needs the SQLite-compatible cloud: **Turso** (free tier, no
credit card).

```bash
# install the CLI (or sign up at https://turso.tech)
curl -sSLf https://get.tur.so/install.sh | bash

turso auth signup
turso db create sai-city-builders

# grab the URL and a token
turso db show sai-city-builders --url
turso db tokens create sai-city-builders
```

Combine them into one URL:

```
libsql://sai-city-builders-<your-user>.turso.io?authToken=<your-token>
```

## 2. Create the schema + seed the data (2 minutes)

From this project folder, run with YOUR url:

```bash
DATABASE_URL="libsql://…?authToken=…" bun run db:remote:push
DATABASE_URL="libsql://…?authToken=…" bun run db:remote:seed
```

`push` creates all 13 tables; `seed` loads both projects (Sai Green Woods +
Sai Towers) with their real photos, 88 bookable units, reviews, albums and
the gallery. Settings (advance ₹500, admin credentials) apply automatically
on first boot — no seeding needed. Re-running is safe (it skips if already
seeded).

## 3. Push to GitHub

```bash
git init && git add -A && git commit -m "Sai City Builders"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 4. Import to Vercel — 2 minutes

1. https://vercel.com/new → import your repo (framework auto-detects Next.js)
2. **Environment Variables** (Production + Preview):

| Name | Value |
|---|---|
| `DATABASE_URL` | `libsql://…?authToken=…` (from step 1) |
| `ADMIN_SESSION_SECRET` | any long random string |

3. Deploy 🚀 — build is plain `next build`, `postinstall` runs `prisma generate`
   automatically.

## 5. First launch checklist

- `https://<your-domain>` — home page renders (Sai Green Woods + Sai Towers),
  booking works (advance payment runs in demo mode until you add Razorpay
  keys in the admin console)
- `https://<your-domain>/#/admin` — log in with the default credentials
  (`admin@saicitybuilders.in` / `sai-admin`), then **Settings**:
  - change the admin login email + password (do this first)
  - set your Razorpay Key ID + Secret (real payments go live instantly)

## How serverless deployment is handled

| Concern | Solution |
|---|---|
| SQLite can't live on Vercel | Dual-mode `src/lib/db.ts` — `libsql://` URLs go through the Prisma Turso adapter, local `file:` stays plain SQLite |
| Uploads (visitor photos, gallery) can't write to disk | `/api/upload` compresses with sharp and stores images **in the database**; served via `/api/uploads/<id>` with immutable caching |
| Admin cookies in embedded iframes | HTTPS automatically switches cookies to `SameSite=None; Secure; Partitioned` |
| Build output | `output: standalone` is skipped on Vercel (`VERCEL` env is auto-set); `bun run start` still works locally |

## Local development (unchanged)

```bash
bun run dev          # http://localhost:3000 (SQLite in db/custom.db)
bun run lint         # code quality
```
