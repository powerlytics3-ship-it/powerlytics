# Powerlytic v2 — Setup Guide

## Prerequisites
- Node.js >= 20
- pnpm >= 9 (`npm i -g pnpm`)
- Git

---

## Step 1: Install Dependencies

```bash
cd powerlytic-v2
pnpm install
```

---

## Step 2: Set Up External Services

You need accounts at each of these. Open each link, sign up (free tiers work for dev), and collect the tokens.

### 2a. Neon (PostgreSQL Database)
1. Go to https://neon.tech and sign up
2. Create a new project → give it a name (e.g. "powerlytic")
3. From the **Connection Details** panel, copy:
   - **Connection string (pooled)** → this is your `DATABASE_URL`
   - **Connection string (direct)** → this is your `DIRECT_DATABASE_URL`

### 2b. Upstash (Redis — for queues and caching)
1. Go to https://upstash.com and sign up
2. Create a new Redis database → any region, **REST** API type
3. From the database details page, copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

### 2c. Resend (Transactional Email)
1. Go to https://resend.com and sign up
2. Go to **API Keys** → **Create API Key** → copy the key
3. Go to **Domains** → add and verify your sending domain
   - For local dev you can use the default `onboarding@resend.dev` sender
4. Your `RESEND_API_KEY` is the key you copied
5. Set `RESEND_FROM_EMAIL` to `noreply@yourdomain.com` (or `onboarding@resend.dev` for dev)

### 2d. Google OAuth (Sign in with Google)
1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   - `http://localhost:4000/api/auth/callback/google` (local)
   - `https://api.yourdomain.com/api/auth/callback/google` (production)
6. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 2e. Bridge Service (Device Communication)
The bridge is an external MQTT↔HTTPS gateway that connects physical devices.
- Get `BRIDGE_BASE_URL`, `BRIDGE_API_TOKEN`, and `BRIDGE_HMAC_SECRET` from your bridge service operator.
- **Without these, the API will start but config deployment/actuation will fail.**
- For development/testing, you can set dummy values and those features will error gracefully.

```bash
BRIDGE_BASE_URL=http://localhost:9000   # dummy for local dev
BRIDGE_API_TOKEN=dev-token
BRIDGE_HMAC_SECRET=dev-hmac-secret
```

### 2f. Sentry (Optional — Error Tracking)
1. Go to https://sentry.io → New Project → Node.js + Next.js
2. Copy the DSN from the setup page

---

## Step 3: Configure Environment Files

```bash
# Copy the example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Now fill in the values you collected in Step 2:

**`apps/api/.env`** — fill in ALL values from Step 2a–2e
**`apps/web/.env.local`** — only needs:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:4000
```
**`apps/admin/.env.local`** — same as web:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:4000
```

---

## Step 4: Set Up the Database

```bash
# Generate the Prisma client
pnpm db:generate

# Push the schema to Neon (creates all tables)
pnpm db:push

# Optional: open the visual database browser
pnpm db:studio
```

---

## Step 5: Start the Development Servers

```bash
# Start everything (API + web + admin) in parallel
pnpm dev
```

This starts:
- **API** at http://localhost:4000
- **Web app** at http://localhost:3000
- **Admin console** at http://localhost:3001
- **Swagger docs** at http://localhost:4000/v1/docs

---

## Step 6: Seed Initial Data (Manual)

After starting, you need to create some base data via the **Admin Console** (http://localhost:3001).

> **Important:** There are two separate frontend apps. You **cannot** sign up directly on the Admin Console — it has no sign-up form. You must create your account on the web app first, then elevate it in the database.
>
> | App | URL | Purpose |
> |-----|-----|---------|
> | Web App | http://localhost:3000 | Customer-facing — sign up here |
> | Admin Console | http://localhost:3001 | Internal admin — requires `platformRole` in DB |

### 6a. Create your first super admin user

**Step 1 — Sign up on the web app:**

Go to **http://localhost:3000/sign-up** and register with your email and password. This creates a `user` row in the database and auto-creates a personal workspace for you.

**Step 2 — Elevate your account to SUPER_ADMIN:**

Run Prisma Studio to edit the user row visually:
```bash
pnpm db:studio
```
Open the URL it prints → click the `user` table → find your row → set `platformRole` to `SUPER_ADMIN` → save.

Or do it via SQL:
```sql
UPDATE "user" SET "platformRole" = 'SUPER_ADMIN' WHERE email = 'your@email.com';
```

**Step 3 — Sign in to the Admin Console:**

Go to **http://localhost:3001/sign-in** and use the **same email and password** from Step 1. The Admin Console checks for a non-null `platformRole` — if it's not set, the page silently redirects back to sign-in without showing an error.

### 6b. Create Port Types (required before creating device models)
1. Sign in to the Admin Console at **http://localhost:3001/sign-in**
2. Go to **Port Types** → create these standard types (the Device Models page will be empty without these):

| Code | Name | Category | Format |
|------|------|----------|--------|
| AI | Analog Input | INPUT | ANALOG |
| DI | Digital Input | INPUT | DIGITAL |
| MI | Modbus Input | INPUT | MODBUS |
| DO | Digital Output | OUTPUT | DIGITAL |
| AC | AC Input | INPUT | AC_INPUT |

### 6c. Create a Device Model
1. Go to **Device Models** → **+ New Model**
2. Add ports (e.g. AI_1, DI_1, MI_1, DO_1)
3. **Publish** the model

### 6d. Manufacture a Device
1. Go to **Inventory** → **+ Manufacture Device**
2. Enter IMEI (15 digits), serial number, and select the model
3. The device will appear as unclaimed

### 6e. Claim the Device (Customer side)
Devices need a claim code to be claimed by a customer workspace.

You'll need three IDs from the database (get them via `pnpm db:studio` or SQL):
- `YOUR_DEVICE_ID` — from the `device` table (the device you manufactured in 6d)
- `YOUR_WORKSPACE_ID` — from the `workspace` table (your personal workspace created at sign-up)
- `YOUR_USER_ID` — from the `user` table (your own user ID)

Insert a claim record directly:
```sql
INSERT INTO "device_claim" (id, "deviceId", "workspaceId", "claimCode", "claimedById")
VALUES (gen_random_uuid(), 'YOUR_DEVICE_ID', 'YOUR_WORKSPACE_ID', 'TESTCODE1', 'YOUR_USER_ID');
```
Then go to **http://localhost:3000** → Devices → Claim Device → enter `TESTCODE1`.

---

## Step 7: Send Test Telemetry

Once a device is claimed and has an API key generated (Devices → Configure → Generate API Key):

```bash
curl -X POST http://localhost:4000/v1/device/telemetry \
  -H "Content-Type: application/json" \
  -H "X-Device-Key: YOUR_DEVICE_API_KEY" \
  -d '{
    "ts": "2024-01-01T00:00:00Z",
    "values": {
      "AI_1": 23.5,
      "DI_1": 1
    }
  }'
```

You should see the readings appear on the **Telemetry** page in the web app.

---

## Project Structure

```
powerlytic-v2/
├── apps/
│   ├── api/                    ← NestJS backend (port 4000)
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── auth/           ← Better Auth + guards
│   │       ├── workspaces/     ← Workspace CRUD
│   │       ├── members/        ← Member management
│   │       ├── port-types/     ← Global port taxonomy
│   │       ├── device-models/  ← Hardware templates
│   │       ├── devices/        ← Devices + credentials + claims
│   │       ├── config-deployment/ ← Bridge integration
│   │       ├── telemetry/      ← Ingestion + queries + Modbus
│   │       ├── actuation/      ← Commands + bridge
│   │       ├── alerts/         ← Rules + events + notifications
│   │       ├── audit/          ← Append-only audit log
│   │       ├── admin/          ← SuperAdmin endpoints
│   │       └── jobs/           ← BullMQ processors
│   │
│   ├── web/                    ← Next.js customer dashboard (port 3000)
│   │   └── app/
│   │       ├── (auth)/         ← sign-in, sign-up, accept-invitation
│   │       └── (dashboard)/    ← devices, telemetry, alerts, members, etc.
│   │
│   └── admin/                  ← Next.js internal console (port 3001)
│       └── app/
│           ├── (auth)/         ← admin sign-in
│           └── (console)/      ← workspaces, device-models, inventory, users
│
└── packages/
    ├── permissions/            ← RBAC matrix (single source of truth)
    ├── ui/                     ← shadcn/ui components
    └── config/                 ← shared tsconfig
```

---

## Where to Put Your Tokens — Quick Reference

| Token / URL | File | Where to Get It |
|-------------|------|-----------------|
| `DATABASE_URL` | `apps/api/.env` | neon.tech → project → connection string (pooled) |
| `DIRECT_DATABASE_URL` | `apps/api/.env` | neon.tech → project → connection string (direct) |
| `BETTER_AUTH_SECRET` | `apps/api/.env` | Run: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `apps/api/.env` | Your API URL (`http://localhost:4000`) |
| `GOOGLE_CLIENT_ID` | `apps/api/.env` | console.cloud.google.com → Credentials |
| `GOOGLE_CLIENT_SECRET` | `apps/api/.env` | console.cloud.google.com → Credentials |
| `UPSTASH_REDIS_REST_URL` | `apps/api/.env` | upstash.com → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | `apps/api/.env` | upstash.com → Redis → REST API |
| `RESEND_API_KEY` | `apps/api/.env` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | `apps/api/.env` | your verified domain on resend.com |
| `BRIDGE_BASE_URL` | `apps/api/.env` | Your bridge service operator |
| `BRIDGE_API_TOKEN` | `apps/api/.env` | Your bridge service operator |
| `BRIDGE_HMAC_SECRET` | `apps/api/.env` | Your bridge service operator (or `openssl rand -hex 32`) |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | `http://localhost:4000` (dev) |
| `NEXT_PUBLIC_API_URL` | `apps/admin/.env.local` | `http://localhost:4000` (dev) |

---

## Production Deployment

### Backend (Google Cloud Run or Render)
1. Build: `pnpm --filter api build`
2. Dockerfile not required for Render (uses buildpack)
3. Set all `apps/api/.env` values as environment variables on the platform
4. Update `BETTER_AUTH_URL` to your production API URL
5. Update `ALLOWED_ORIGINS` to your production frontend URLs

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Create **two separate Vercel projects**:
   - Root directory: `apps/web` → domain: `app.yourdomain.com`
   - Root directory: `apps/admin` → domain: `admin.yourdomain.com`
3. Set `NEXT_PUBLIC_API_URL` to your production API URL in each project

### Database Migrations (Production)
```bash
# Run against production (uses DIRECT_DATABASE_URL)
pnpm --filter api prisma migrate deploy
```

---

## Common Issues

**"Missing environment variable BRIDGE_BASE_URL"** — Add it to `apps/api/.env`. Set a dummy value for local dev if you don't have a real bridge yet.

**"Prisma Client not generated"** — Run `pnpm db:generate` first.

**Emails not sending** — Verify your domain on resend.com or use `onboarding@resend.dev` as the from address during development.

**Google OAuth redirect mismatch** — Make sure `http://localhost:4000/api/auth/callback/google` is in your Google Cloud Console authorized redirect URIs.

**Port Types page empty** — You need to seed port types manually via the Admin Console before you can create device models.
