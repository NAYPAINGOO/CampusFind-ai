# CampusFind AI

A professional university lost-and-found platform built with Next.js, TypeScript, Tailwind CSS, Supabase and a FastAPI matching service.

## What is included

- Responsive public landing, real database-backed search, item detail, authentication and support pages.
- User dashboard, guided lost/found form, Telegram-post importer, automatic draft recovery, image previews and real user-uploaded cover images, saved search alerts, real notifications, explainable matches, claims, profile and settings.
- Security and administrator dashboards with operational tables, analytics and matching configuration.
- Supabase PostgreSQL schema, indexes, constraints, Row-Level Security, private Storage policies and realistic seed generation.
- Weighted matching in TypeScript and Python.
- FastAPI endpoints with a rule-based fallback plus optional Sentence Transformer and CLIP models.
- Signed, expiring QR credential generation and verification endpoints with privileged demo routes disabled by default.
- CSV export, email/in-app notification service, rate-limit example, tests and Mermaid diagrams.

## Current framework baseline

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase SSR package
- FastAPI with Python 3.13

## 1. Install the web application

**PowerShell (Windows):**

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

**macOS/Linux:**

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Supabase variables, the interface and selected APIs run in demonstration mode. Authentication and persistence require a configured Supabase project.

## 2. Configure Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and add the project URL, publishable key and server-only secret key.
3. Run all SQL files from `001` through `005` in numeric order through the Supabase SQL editor or CLI. Migration `005_public_report_images.sql` enables consent-based public cover images while keeping the Storage bucket private:

```bash
supabase db push
```

4. In Authentication settings, enable email confirmation and add:

```text
http://localhost:3000/auth/callback
```

5. Change `example.edu` in the environment and seed data to the university’s approved email domain.
6. Do not expose `SUPABASE_SECRET_KEY` to client code.

The seed migration creates 20 demo users, 6 security profiles, 2 administrators, 80 item reports, 30 matches, 15 claims, 10 handovers and 30 notifications. These profiles are analytics/demo records, not login identities. Real login profiles are created by the `auth.users` trigger.

## 3. Start the AI service

### Lightweight fallback mode

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements-lite.txt
cp .env.example .env
fastapi dev app/main.py
```

### Full semantic and image models

```bash
pip install -r requirements.txt
```

Then set:

```env
ENABLE_ML_MODELS=true
```

The first full-model startup downloads model weights and requires substantially more memory than fallback mode. Keep fallback mode enabled as an operational safety path.

## 4. Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Python tests:

```bash
cd ai-service
pip install pytest
pytest
```

## 5. Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client/server | Canonical web URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Client/server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client/server | Public application key |
| `SUPABASE_SECRET_KEY` | Server only | Trusted administration operations |
| `AI_SERVICE_URL` | Server only | FastAPI base URL |
| `AI_SERVICE_API_KEY` | Server only | Matching-service authentication |
| `RESEND_API_KEY` | Server only | Optional email delivery |
| `EMAIL_FROM` | Server only | Verified email sender |
| `NEXT_PUBLIC_UNIVERSITY_EMAIL_DOMAIN` | Client/server | Allowed university domain |
| `QR_SIGNING_SECRET` | Server only | Credential signature key |
| `VERIFICATION_HASH_SECRET` | Server only | Keyed hashing for verification answers and one-time secrets |
| `ENABLE_DEMO_PRIVILEGED_ROUTES` | Server only | Keep `false`; permits admin/security API demos only when intentionally enabled |

## 6. Deployment

### Vercel

- Import the repository.
- Add the web environment variables.
- Deploy the root Next.js application.
- Confirm the auth callback URL uses the deployed domain.

### Supabase

- Apply migrations `001` through `005` in numeric order.
- Keep the report image bucket private.
- Review every RLS policy with test accounts for user, security and admin roles.
- Configure database backups and retention.

### Render or Railway

- Deploy `ai-service/` with its Dockerfile.
- Set `AI_SERVICE_API_KEY` and model settings.
- Use a memory-appropriate plan before enabling CLIP and Sentence Transformer models.
- Restrict inbound access where the platform allows it.

### Resend

- Verify the university sending domain.
- Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel.


## Public report images

- Users see real thumbnail previews before submitting.
- The first uploaded image is used as the public cover image when the user leaves public-image consent enabled.
- The Storage bucket remains private; images are served only through `/api/reports/[id]/image` after the report is confirmed public and eligible.
- Reports marked as sensitive never expose an image publicly.
- Reports without an uploaded image continue to use a category icon.

After upgrading an existing Supabase project, run `supabase/migrations/005_public_report_images.sql` before starting the updated web application.

## Telegram replacement features

The corrected build addresses the main weaknesses of a Telegram lost-and-found group:

- Structured, filterable reports do not disappear in chat history.
- Users can paste an old English or Malay Telegram post and automatically extract common fields.
- Saved alerts monitor keywords, item type, category and campus location.
- New matching reports create in-app notifications automatically.
- Duplicate active reports from the same user are blocked.
- Contact details and ownership-only evidence are separated from public summaries.
- Claims and item handovers remain role-controlled and auditable.

## 7. Production hardening checklist

- Add platform-backed distributed rate limiting rather than the included single-process example.
- Add malware scanning, image re-encoding and quarantine before staff access.
- Enforce staff/admin roles in every sensitive route handler, not only in UI navigation.
- Store collection credentials only as hashes and make them single-use through a database transaction.
- Add audit triggers for privileged mutations.
- Add consent versioning, retention jobs and deletion workflows.
- Add real background jobs for embeddings, retries and outbound email delivery. In-app saved-search notifications are already created by a database trigger.
- Complete RLS integration tests against a local Supabase instance.
- Conduct accessibility, threat-model, privacy and penetration testing before campus rollout.

See [`docs/architecture.md`](docs/architecture.md) for the system overview, architecture, full folder structure, relationship summary, API list, phased plan and Mermaid diagrams.


## Windows installation troubleshooting

Use Node.js 20.9 or newer. Node.js 22 LTS is recommended. Check the installed versions:

```powershell
node -v
npm -v
```

If `npm install` stops before completion, remove the incomplete installation and rebuild the dependency lock locally:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm config set registry https://registry.npmjs.org/
npm install
npm run dev
```

The message about PSReadLine being disabled is only a PowerShell accessibility notice and does not prevent the application from running.
