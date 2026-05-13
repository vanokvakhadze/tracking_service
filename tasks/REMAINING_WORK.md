# TrackPro — Remaining Work Checklist

> ბოლო განახლება: 2026-05-13
> ფაილის მიზანი: წერია ყველაფერი რაც გვაქვს გასაკეთებელი, რას ვინ აკეთებს, რა command-ი ან dashboard-ი საჭიროა.

---

## ✅ რა გვაქვს უკვე გაკეთებული (state of the union)

**Backend / database**
- Supabase Postgres schema-ის 14 migration (auth, RLS, locations, shifts, geofence_events, billing, super_admin, Phase 3-Lite tracking)
- Edge function `stripe-webhook` (preview)
- Edge function `geofence-event` (Phase 3-Lite background tracking)

**Web app (`/apps/web`)**
- Landing + pricing + privacy + terms (Georgian)
- Auth flow (signup, login, invitations, password reset)
- Admin dashboard, locations CRUD, users CRUD, reports, settings, billing (preview)
- Super admin platform (tenants, audit log, impersonate)
- UI polish: loading skeletons, empty states, error boundaries, a11y
- Sentry SDK wired (DSN-gated)

**Mobile app (`/apps/mobile`)**
- KAYA login + onboarding
- Employee home, map, history, profile
- Mobile admin: dashboard, team map, team list, alerts inbox, location create flow, work zone config, provisional approval
- Phase 3-Lite background tracking (geofencing + push)
- Brand icon + splash (generator script)
- EAS project initialized (`9606ab52-88c3-4365-9b7f-934748ba5a74`)
- Push notification deep linking (task.046)

**DevOps**
- Turborepo monorepo
- Biome lint/format
- Database types auto-generated from Supabase

---

## ⏳ რა გვაქვს გასაკეთებელი

გასაკეთებელი იყოფა 3 ბაკეტში:
- 🔴 **Blockers** — ვერ ვცდით ვერც პროდუქტს ვერც სტორებში
- 🟡 **Needed for launch** — Beta-მდე უნდა გავაკეთოთ
- 🟢 **Post-MVP / nice-to-have** — ცოცხალი ბიზნესის შემდეგ

---

## 🔴 Blockers — გადასაჭრელი ახლავე

### B1. Migration 15 + 16 deploy + types regen

Phase 3-Lite-ის server-side improvements (hysteresis + boundary zone + offline queue) მზადაა კოდში, მაგრამ Supabase-ში ჯერ არ გვაქვს გადატანილი.

**ვის ეკუთვნის:** გიო (5 წუთი)

**ნაბიჯები:**
1. Supabase Dashboard → SQL Editor → New query
2. ჩასვი ფაილის შინაარსი: `supabase/migrations/20260513000005_shift_exit_hysteresis.sql` → Run
3. ჩასვი ფაილის შინაარსი: `supabase/migrations/20260513000006_geofence_zone.sql` → Run
4. ლოკალურად:
```powershell
npx supabase functions deploy geofence-event
pnpm db:types
```
5. შემოწმე `packages/database/src/types.ts` — უნდა იყოს `finalize_pending_shifts` function-ის ტიპები + `shifts.pending_close_at` ველი + `geofence_events.zone` ველი
6. commit + push

---

### B2. Apple Developer team activation

Apple Developer Program-ის $99 გადახდის შემდეგ "team" ჯერ აქტიური არაა. ეს ბლოკავს:
- EAS device registration (`device:create`)
- EAS iOS build
- App Store Connect-ის ნებისმიერი ფლოუ

**ვის ეკუთვნის:** გიო + Apple ⏰ (24-48 საათი ჩვეულებრივ)

**ნაბიჯები:**
1. https://developer.apple.com/account → login იმავე Apple ID-ით
2. შემოწმე:
   - **"Pending Agreement" banner** → Review Agreement → I agree
   - **"Enroll Today"** → enrollment არ დასრულდა, გადახდა გადახედე
   - **Dashboard + Certificates menu** → team აქტიური ✅
3. თუ ჯერ ვერ ხედავ team-ს → დარჩი 24-48 საათი → ხელახლა შემოწმე
4. ალტერნატივა: **Mac-ზე setup** (იხ. B4) — personal Apple ID-ით 7-დღიანი dev certificate მუშაობს

---

### B3. iOS dev build (deferred)

ფიზიკურ iPhone-ზე Phase 3-Lite-ის ტესტირება.

**ვის ეკუთვნის:** გიო

**ვარიანტი A — EAS cloud build (Apple team აქტიური უნდა იყოს)**
```powershell
cd apps/mobile
npx eas-cli@latest device:create     # iPhone UDID register
npx eas-cli@latest credentials       # Apple-ის credentials setup
npx eas-cli@latest build --platform ios --profile development
# QR კოდი iPhone-ის Safari-ში → install
npx expo start --dev-client          # dev server
```

**ვარიანტი B — Mac-ზე ლოკალური build (personal Apple ID-ით)**
```bash
# Mac-ზე:
brew install node@22 watchman
npm install -g pnpm
git clone https://github.com/vanokvakhadze/tracking_service.git
cd tracking_service && git checkout develop && pnpm install
# .env.local + apps/mobile/.env Mac-ზე გადააკოპირე
cd apps/mobile
pnpm dlx expo run:ios --device       # iPhone USB-ით დაკავშირებული
```

---

## 🟡 Needed for Launch — Beta-მდე

### L1. Vercel deploy (web app + marketing) ✅ DEPLOYED

**ცოცხალია:** https://tracking-service-web.vercel.app

**დარჩა:** custom domain `trackpro.ge` (DNS) — გადადო post-Beta. იხ. L1.5.

---

### L1.5. Custom domain `trackpro.ge`

**ვის ეკუთვნის:** გიო (15 წუთი + ~24h propagation)

**ნაბიჯები:**
1. https://vercel.com → New Project → Import `vanokvakhadze/tracking_service`
2. **Root directory:** `apps/web`
3. **Framework:** Next.js (auto-detect)
4. **Build command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @trackpro/web build`
5. **Output directory:** `apps/web/.next`
6. **Install command:** `npm install -g pnpm@10`
7. Environment variables (Project Settings → Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL          https://lekogoghgbvmrlqcqmhv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     <publishable anon key>
SUPABASE_SERVICE_ROLE_KEY         <sb_secret_*>           ← server-only
NEXT_PUBLIC_MAPBOX_TOKEN          <pk.eyJ...>
NEXT_PUBLIC_APP_URL               https://trackpro.ge
NEXT_PUBLIC_SENTRY_DSN            <after L7>
SENTRY_DSN                        <same>
SENTRY_ORG                        sazeo
SENTRY_PROJECT                    trackpro-web
SENTRY_AUTH_TOKEN                 <sentry token>
STRIPE_SECRET_KEY                 <sk_live_*>             ← post task.045
STRIPE_WEBHOOK_SECRET             <whsec_*>               ← post task.045
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY <pk_live_*>            ← post task.045
```
8. Deploy
9. **Custom domain:** Settings → Domains → Add `trackpro.ge` + `www.trackpro.ge`
10. DNS provider-ში (rs.ge ან რომელიც გყავს):
    - A record `@` → 76.76.21.21 (Vercel-ის IP, შემოწმე ექსაქტი DNS instruction Vercel-ში)
    - CNAME `www` → `cname.vercel-dns.com`
11. ~15 წუთი SSL provisioning

**შემოწმება ბოლოს:**
- https://trackpro.ge → landing page
- https://trackpro.ge/privacy → privacy policy
- https://trackpro.ge/pricing → pricing
- https://trackpro.ge/login → login გვერდი

---

### L2. Codex tasks ✅ Done

- [task.046](codex/task.046.md) ✅ Push notification deep linking — commit `b3fd1f1`
- [task.047](codex/task.047.md) ✅ Live shifts realtime — commit `1dfd76e`
- [task.048](codex/task.048.md) ✅ CSV export — commit `889a331`

---

### L3. Stripe live activation (task.045)

**ვის ეკუთვნის:** გიო (Stripe ანგარიში)

**ნაბიჯები:**
1. https://stripe.com → Create account → Activate "real" payments
2. გადახდის მეთოდი + ბანკის ანგარიში (GE) + ვერიფიკაცია
3. **Products → Add product:**
   - "Basic" — 15 GEL/თვე per user (recurring)
   - "Pro" — 30 GEL/თვე per user (recurring)
   - "Enterprise" — custom (manual invoice)
4. დააკოპირე **Price IDs** → `apps/web/lib/stripe/server.ts:priceIdForPlan` → ჩასვი
5. **Developers → Webhooks → Add endpoint:**
   - URL: `https://lekogoghgbvmrlqcqmhv.supabase.co/functions/v1/stripe-webhook`
   - Events: `customer.subscription.created/updated/deleted`, `invoice.payment_*`
   - Copy signing secret → Vercel env `STRIPE_WEBHOOK_SECRET`
6. **Developers → API keys** → live secret key + publishable key → Vercel env
7. Vercel-ში redeploy → `/billing` გვერდი აქტიური ხდება
8. გადახედე [task.045](codex/task.045.md) მთლიანი checklist-ისთვის

---

### L4. App Store submission (7.6)

**ვის ეკუთვნის:** გიო (B2 + B3 + Mac საჭიროა)

**ნაბიჯები — [STORE_METADATA.md](STORE_METADATA.md)-ში დეტალურად:**
1. EAS production build:
```powershell
npx eas-cli@latest build --platform ios --profile production
```
2. App Store Connect:
   - Apps → + → New App
   - Name: TrackPro
   - Bundle ID: `ge.trackpro.app`
   - SKU: trackpro-v1
3. App information ფილდები — copy/paste [STORE_METADATA.md](STORE_METADATA.md)-დან
4. Screenshots (3+ size-ი) — `npx eas-cli build:list` build-ი iPhone-ზე → captures
5. App Privacy declarations — table [STORE_METADATA.md:114](STORE_METADATA.md#L114)-დან
6. Submit for review (~1-3 დღე)

---

### L5. Google Play submission (7.7)

**ვის ეკუთვნის:** გიო

**ნაბიჯები:**
1. EAS production AAB:
```powershell
npx eas-cli@latest build --platform android --profile production
```
2. Google Play Console → Create app → TrackPro
3. Store listing fields — copy/paste [STORE_METADATA.md](STORE_METADATA.md)
4. Service account:
   - https://console.cloud.google.com → IAM → Service Accounts → Create
   - Grant "Service Account User" + Play Developer API access
   - Create JSON key → save as `apps/mobile/play-service-account.json` (gitignore!)
5. Submit:
```powershell
npx eas-cli@latest submit --platform android --profile production
```
6. Play Console → review submission → submit for review (~1-3 დღე)

---

### L6. Lawyer review of privacy/terms

**ვის ეკუთვნის:** გიო + იურისტი

[/privacy](../apps/web/app/(marketing)/privacy/page.tsx) და [/terms](../apps/web/app/(marketing)/terms/page.tsx) Georgian template-ია — იურისტმა უნდა გადახედოს. ნაკლები რისკი — საქართველოს კანონების კონტექსტში rights-ის ფორმულირება.

---

### L7. Sentry production setup (7.12)

**ვის ეკუთვნის:** გიო (15 წუთი)

**ნაბიჯები:**
1. https://sentry.io → Free plan signup
2. New Project → Platform: Next.js → Name: `trackpro-web`
3. დააკოპირე DSN: `https://[project-key]@[org].ingest.sentry.io/[project-id]`
4. **Internal Integrations → Auth Tokens → Create** (org+project scope)
5. Vercel-ში env vars (L1 list-დან):
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_DSN` (same value)
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`
6. Vercel redeploy
7. Test: `/` გვერდი + JS console-ში `throw new Error('test')` → Sentry dashboard-ში უნდა გამოჩნდეს

---

### L8. Reviewer demo account ✅ script ready

**ვის ეკუთვნის:** გიო (2 წუთი — script-ი ერთ ბრძანებაში)

Apple + Google reviewer-ები ცდიან app-ის login-ს. წინასწარ შექმენი idempotent seeder script-ით:

```powershell
$env:SUPABASE_URL = "https://lekogoghgbvmrlqcqmhv.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."   # Supabase Dashboard → Settings → API
$env:DEMO_PASSWORD = "ReviewMe2026!"               # ან ცადო შენი
pnpm seed:demo
```

რას ქმნის:
- Tenant: "App Review Demo" (subdomain: `review.trackpro.ge`)
- Admin: `review@trackpro.ge` + chosen password
- 3 ლოკაცია (Tbilisi-ის რეალური მისამართები + ორ-რადიუსიანი setup)
- 2 თანამშრომელი (`giorgi.review@trackpro.ge`, `nini.review@trackpro.ge`)
- 1 pending provisional location (Vake supermarket)

Idempotent — ხელახლა გაშვების შემთხვევაში წინა demo data წაიშლება + ხელახლა შეიქმნება.

ეს credentials მერე ჩასვი App Store Connect-ში "Sign-In Required" + Play Console-ში "App access" → "All or some functionality is restricted".

---

### L9. Production Supabase env

**ვის ეკუთვნის:** გიო (5 წუთი)

Supabase Dashboard → Edge Functions → settings → Add secrets:
- (auto-set): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **dawamatebeli:** `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (for stripe-webhook function — საჭიროა task.045 activation-ის შემდეგ)

---

## 🟢 Post-MVP / Stretch

### S1. Demo video (7.9)

**ვის ეკუთვნის:** გიო

Loom ან Screen Studio-ით 90 წამიანი ვიდეო. Storyboard ფსიქე [tasks/08_PHASE_POLISH.md:486](08_PHASE_POLISH.md#L486)-ში.

### S2. Onboarding docs (7.10)

**ვის ეკუთვნის:** ჩემზე ან Codex (~3 საათი)

MDX-ით documentation site. 8+ doc — `/docs/getting-started`, `/docs/locations`, `/docs/team`, etc.

### S3. Beta customer outreach (7.11)

**ვის ეკუთვნის:** გიო (sales)

5 beta customer-ის ძიება + onboarding. Target verticals:
- Delivery companies (Glovo competitors)
- Construction firms
- Security services
- FMCG distribution

### S4. Phase 8 features (post-launch)

წინასწარ მინიშნებები, რომ მერე გავიხსენო:
- CSV export ✅ (task.048-ში მოდის)
- Polygon geofences (irregular shapes)
- Bulk user import (CSV upload)
- Custom shift schedules
- Time-off requests
- Slack/WhatsApp integration
- Public API for customers
- White-label option (Enterprise)

### S5. Paid SDK upgrade ($580)

Phase 3-Lite-ის reliability ვერ აკმაყოფილებს Beta-ში? Switch to transistorsoft `react-native-background-geolocation`. იხ. [00_HANDOFF.md](00_HANDOFF.md) — critical pitfalls + decision criteria.

### S6. iOS App Store + Google Play — first paying customer

L4 + L5 დასრულდა → ცოცხალი ბილინგი → 50 GEL/თვე × user × 5 customer = ~250 GEL/თვე MRR target.

---

## 📋 Suggested order of operations — pre-Beta sequence

ეს რიგი ლოგიკურია — თითო ნაბიჯი blocking-ი არ არის შემდეგისთვის.

**Week 1 — Infrastructure**
1. ✅ B1 — Migration 15+16 deploy + types regen
2. ✅ L1 — Vercel deploy + custom domain
3. ✅ L7 — Sentry production
4. ✅ L9 — Supabase Edge Function env vars

**Week 2 — Apple/Google + payments**
5. ✅ B2 — Apple Developer team activation (wait + verify)
6. ✅ L3 — Stripe live activation (task.045)
7. ✅ L6 — Lawyer review of privacy/terms

**Week 3 — Mobile builds + store submissions**
8. ✅ B3 — Mac setup + iOS dev build OR EAS cloud build
9. ✅ L4 — iOS App Store submission
10. ✅ L5 — Google Play submission
11. ✅ L8 — Reviewer demo account

**Week 4 — Beta launch**
12. ✅ S1 — Demo video
13. ✅ S2 — Onboarding docs
14. ✅ S3 — Beta customer outreach (5 customers)

**Apple/Google review**: 1-3 დღე per platform. პარალელურად შეიძლება დაიწყო S3.

---

## 🔗 დაკავშირებული ფაილები

- [STORE_METADATA.md](STORE_METADATA.md) — store-ის copy-paste ფილდები
- [00_HANDOFF.md](00_HANDOFF.md) — ახალი Claude/Codex chat-ისთვის startup guide
- [01_PHASE_SETUP.md](01_PHASE_SETUP.md) — Phase 0 details
- [04_PHASE_MOBILE_EMPLOYEE.md](04_PHASE_MOBILE_EMPLOYEE.md) — Phase 3 SDK plans
- [08_PHASE_POLISH.md](08_PHASE_POLISH.md) — Phase 7 details
- [reference/GEOFENCE_DESIGN_RULES.md](reference/GEOFENCE_DESIGN_RULES.md) — design + tracking rules
- [codex/task.045.md](codex/task.045.md) — Stripe activation playbook
- [codex/task.046.md](codex/task.046.md) — push deep links (✅ done)
- [codex/task.047.md](codex/task.047.md) — dashboard realtime
- [codex/task.048.md](codex/task.048.md) — CSV export

---

ფაილი დასრულდა. გადახედე, განაახლე როცა task-ი closed-ი ხდება (✅).
