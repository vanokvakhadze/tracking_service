# TrackPro — ტექნიკური დავალება (TZ)

> **მიზანი:** GPS-ის თანამშრომლების ტრექინგი — B2B SaaS ქართული ბაზრისთვის
> **მდგომარეობა:** Zero (არც ბექი, არც ფრონტი, არც აპლიკაცია)
> **სამიზნე:** MVP 14 კვირაში · Beta 18 კვირაში · Production 24 კვირაში
> **დეველოპერი:** Solo (გიორგი)
> **დოკუმენტი:** v1.0 · 2026-05-11

---

## 📋 დოკუმენტის სტრუქტურა

1. [არსებული Asset-ები](#assets)
2. [Tech Stack — Final Selection](#stack)
3. [Architecture & Data Flow](#architecture)
4. [Repository Structure](#repos)
5. [Required Accounts & Services](#accounts)
6. [Phase-by-Phase Roadmap](#phases)
7. [Per-Phase Deliverables](#deliverables)
8. [DevOps & Environments](#devops)
9. [Cost Estimation](#costs)
10. [Risk Areas](#risks)
11. [Pointer Files](#pointers)

---

<a name="assets"></a>
## 1. არსებული Asset-ები (გამოყენებადი)

| ფაილი | რა არის | სად გამოვიყენო |
|------|---------|---------------|
| `tracking_saas_schema.sql` | სრული PostgreSQL+PostGIS schema RLS-ით | Supabase initial migration |
| `tracking_saas_tasks.md` | 60+ task 8 phase-ში | Project board (Linear / GitHub Projects) |
| `DESIGN_RULES.md` | KAYA visual design system | Frontend implementation guide |
| `GEOFENCE_DESIGN_RULES.md` | Geofence logic + UI rules | Mobile app + backend reference |
| `trackpro_designs.zip` | 31 PNG mockup | UI implementation reference |
| `trackpro_design_brief.md` | Design brief Claude-ისთვის | Re-generation if needed |

**კრიტიკული:** ეს Asset-ები არსებითად შეცვლის development speed-ს. **არ დაიწყო coding** ამ ფაილების review-ის გარეშე.

---

<a name="stack"></a>
## 2. Tech Stack — Final Selection

### Frontend (Web Admin + Marketing)
| ფენა | არჩევანი | რატომ |
|------|---------|------|
| **Framework** | Next.js 15 (App Router) | #1 React framework, SSR, perfect for SaaS |
| **Language** | TypeScript | Type safety + AI-friendly |
| **Styling** | Tailwind CSS v4 | KAYA-compatible, fast iteration |
| **UI Components** | shadcn/ui + custom KAYA | Copy-paste, no lock-in |
| **State** | Zustand + TanStack Query | Lightweight, server-state friendly |
| **Maps** | Mapbox GL JS | Better than Google Maps for custom geofence styling |
| **Forms** | React Hook Form + Zod | Type-safe validation |

### Backend (BaaS-First)
| ფენა | არჩევანი | რატომ |
|------|---------|------|
| **Database** | PostgreSQL + PostGIS | Geospatial queries native |
| **Hosting** | **Supabase** | Postgres + Auth + Storage + Realtime + RLS in one |
| **Auth** | Supabase Auth | Magic link, OAuth, MFA — bundled |
| **Multi-tenancy** | Postgres RLS policies | DB-level security, no app-level bugs |
| **File Storage** | Supabase Storage | S3-compatible, integrated auth |
| **Edge Functions** | Supabase Edge Functions (Deno) | Cron jobs, webhooks |
| **Realtime** | Supabase Realtime (WebSocket) | Live map updates |

**ალტერნატივები რომ უარყავი:**
- ❌ Firebase — NoSQL hurts relational data
- ❌ AWS Cognito + RDS — too much DevOps for solo dev
- ❌ Custom Node.js + Postgres — slower to ship
- ❌ Clerk — გრძელვადიან expensive ($25/MAU above free tier)

### Mobile (Employee + Mobile Admin)
| ფენა | არჩევანი | რატომ |
|------|---------|------|
| **Framework** | React Native + Expo (managed → bare when needed) | Cross-platform, OTA updates |
| **Language** | TypeScript | Same codebase patterns as web |
| **Location** | `react-native-background-geolocation` (transistorsoft) | Industry standard, $290 license per platform — worth it |
| **Maps** | `react-native-maps` (Google Maps) | Native rendering, geofence overlays |
| **State** | Zustand + React Query | Same as web — consistency |
| **Storage** | MMKV + WatermelonDB | Fast local cache + offline sync |
| **Push** | Expo Push Notifications | Cross-platform abstraction |
| **Camera** | `expo-camera` + EXIF library | Photo verification with GPS metadata |

### Payments
- **Stripe** — Subscription billing, Apple Pay/Google Pay support, GE accept
- **Currency:** GEL (Georgian Lari) — Stripe supports
- **VAT/TAX:** Stripe Tax (auto-calculation)

### Email/Communication
- **Resend** — Transactional emails, React Email templates
- **Twilio / Vonage** — SMS for password reset (optional later)

### Monitoring & Analytics
- **Sentry** — Error tracking (web + mobile)
- **PostHog** — Product analytics (self-hostable, free tier generous)
- **Vercel Analytics** — Web vitals
- **Supabase Logs** — Database query logs

### Deployment
- **Vercel** — Next.js hosting (zero-config, edge functions)
- **Supabase Cloud** — Database + Auth + Storage
- **Apple App Store** — iOS distribution ($99/year)
- **Google Play Store** — Android distribution ($25 one-time)

---

<a name="architecture"></a>
## 3. Architecture & Data Flow

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENTS                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Web Admin     │  │  Mobile        │  │  Mobile        │  │
│  │  (Next.js)     │  │  Employee      │  │  Admin         │  │
│  │  on Vercel     │  │  (React Native)│  │  (React Native)│  │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘  │
└───────────┼───────────────────┼───────────────────┼──────────┘
            │                   │                   │
            │  HTTPS/WSS        │  HTTPS/WSS        │  HTTPS/WSS
            ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Auth (JWT)                                          │    │
│  │  - Magic link, OAuth, MFA                            │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  PostgreSQL + PostGIS                                │    │
│  │  - tenants, users, locations, shifts, geofences      │    │
│  │  - Row-Level Security (multi-tenant isolation)       │    │
│  │  - Geospatial queries (ST_DWithin, ST_Distance)      │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Storage                                             │    │
│  │  - Photos, profile pics, exports                     │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Realtime (WebSocket)                                │    │
│  │  - Live map updates, shift status, alerts            │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Edge Functions (Deno)                               │    │
│  │  - Geofence event handler (hysteresis, mock GPS)     │    │
│  │  - Stripe webhooks                                   │    │
│  │  - Daily reports cron                                │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
            │                       │                   │
            ▼                       ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Stripe         │  │  Resend         │  │  Mapbox         │
│  (Payments)     │  │  (Emails)       │  │  (Maps API)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Data Flow Examples

**Employee enters geofence:**
```
1. Mobile: react-native-background-geolocation detects ENTRY
2. Mobile: Save event to local SQLite (offline-first)
3. Mobile: POST /api/geofence-events to Supabase Edge Function
4. Edge Function: Apply hysteresis (30s wait), check Mock GPS, write to shifts table
5. Postgres: Trigger fires → Realtime broadcast on tenant_xxx channel
6. Web Admin: Live map updates user's pin color
7. Resend: If first shift of day, send manager email
```

**Admin creates location (web):**
```
1. Web: Form submit with lat/lng/radius
2. Next.js API route → Supabase client (with user JWT)
3. RLS policy validates: user.tenant_id matches location.tenant_id
4. INSERT into locations + geofences tables (PostGIS geometry)
5. Realtime broadcast → all online employees' apps refresh assigned locations
6. Mobile: Background geolocation SDK re-registers active geofences
```

---

<a name="repos"></a>
## 4. Repository Structure

### Monorepo (Recommended: Turborepo)

```
trackpro/
├── apps/
│   ├── web/                    # Next.js (admin + super admin + marketing)
│   │   ├── app/
│   │   │   ├── (marketing)/    # Public landing pages
│   │   │   ├── (auth)/         # Login, signup, password reset
│   │   │   ├── (app)/          # Authenticated admin pages
│   │   │   └── (super-admin)/  # Platform admin
│   │   ├── components/
│   │   └── lib/
│   │
│   └── mobile/                 # React Native (employee + mobile admin)
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   └── services/
│       └── app.config.ts
│
├── packages/
│   ├── ui/                     # Shared KAYA UI components
│   ├── database/               # Supabase types (auto-generated)
│   ├── geofence/               # Shared geofence logic (state machine)
│   ├── i18n/                   # Georgian + English translations
│   └── tsconfig/               # Shared TS configs
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge Functions
│   └── seed.sql
│
├── turbo.json
├── package.json (workspace root)
└── pnpm-workspace.yaml
```

**რატომ monorepo:**
- Shared types between web + mobile
- Same geofence logic on both platforms
- One CI/CD pipeline
- Easier refactoring

**Tool: pnpm + Turborepo** — fastest, best DX.

---

<a name="accounts"></a>
## 5. Required Accounts & Services

შექმენი ეს accounts **დღეს** — registration time-ი არ უნდა block-მა გააკეთოს development:

| Service | URL | რა-სთვის | ფასი |
|---------|-----|---------|------|
| **GitHub** | github.com | Code hosting + CI | Free |
| **Vercel** | vercel.com | Web hosting | Free → $20/mo |
| **Supabase** | supabase.com | Backend (DB + Auth + Storage) | Free → $25/mo |
| **Stripe** | stripe.com | Payments | 2.9% + $0.30 |
| **Resend** | resend.com | Transactional email | Free (3K/mo) |
| **Sentry** | sentry.io | Error tracking | Free (5K events/mo) |
| **PostHog** | posthog.com | Product analytics | Free (1M events/mo) |
| **Mapbox** | mapbox.com | Maps + Geocoding | Free (50K loads/mo) |
| **Expo** | expo.dev | Mobile build & OTA | Free → $99/mo (EAS) |
| **Apple Developer** | developer.apple.com | iOS App Store | $99/year |
| **Google Play Console** | play.google.com/console | Android Play Store | $25 one-time |
| **transistorsoft** | shop.transistorsoft.com | Background Geolocation SDK | $290 per platform |
| **Domain** | namecheap.com / cloudflare | trackpro.ge | ~$10/year |

**Total upfront cost:** ~$700 (license + dev accounts), then $0-50/month until 100+ customers.

---

<a name="phases"></a>
## 6. Phase-by-Phase Roadmap

### Phase 0 — Setup (Week 1)
**Goal:** Empty repos to "Hello World" on staging

- [ ] შექმენი GitHub repo `trackpro` (monorepo)
- [ ] Setup Turborepo + pnpm workspace
- [ ] Initialize `apps/web` with `create-next-app` (TypeScript + Tailwind)
- [ ] Initialize `apps/mobile` with `create-expo-app` (TypeScript)
- [ ] Setup `packages/ui`, `packages/database`, `packages/i18n`
- [ ] Create Supabase project (staging + production)
- [ ] Run `tracking_saas_schema.sql` migration on Supabase
- [ ] Connect Vercel → GitHub → auto-deploy from `main`
- [ ] Setup environment variables (`.env.local`, Vercel env, Expo env)
- [ ] Setup Sentry on both web + mobile

**Deliverable:** Web landing page on `staging.trackpro.ge`. Mobile app builds locally.

---

### Phase 1 — Auth + Tenancy (Week 2-3)
**Goal:** Users can sign up, create company, invite team

- [ ] Implement Supabase Auth (web + mobile)
  - [ ] Email + magic link
  - [ ] OAuth (Google for B2B)
  - [ ] Password reset flow
- [ ] Company signup flow (web)
  - [ ] Form: company name, subdomain (e.g. `saqari.trackpro.ge`)
  - [ ] Trial period (14 days, no card)
- [ ] User invitation system
  - [ ] Generate invite tokens
  - [ ] Email with magic link via Resend
  - [ ] Accept invite → join tenant
- [ ] Role-based access (Super Admin / Company Admin / Employee)
- [ ] RLS policies tested for all tables

**Deliverable:** ადმინს შეუძლია სრულად signup, შექმნას კომპანია, მოიწვიოს თანამშრომელი.

---

### Phase 2 — Web Admin Core (Week 4-6)
**Goal:** Admin sees dashboard, manages users + locations

- [ ] App shell (TopBar 48px + Sidebar 220px) — per `DESIGN_RULES.md`
- [ ] Dashboard page (4 metric cards + live map + active users)
- [ ] Users page (table with filter, status pills, invite/edit)
- [ ] Locations page
  - [ ] List view (table)
  - [ ] Create location — Map mode (Mapbox + draggable pin + radius slider)
  - [ ] Create location — Address mode (geocoding via Mapbox)
  - [ ] Work zone config (Trigger zone + Boundary zone)
- [ ] Settings page (company profile, notification preferences)
- [ ] Georgian i18n + Inter/Noto Sans Georgian fonts

**Deliverable:** Web admin სრულად ფუნქციური — ადმინს შეუძლია ლოკაცია მონიშნოს რუკაზე, თანამშრომელი მიანიჭოს.

---

### Phase 3 — Mobile Employee App (Week 7-10)
**Goal:** Employee installs, logs in, GPS tracks shifts automatically

- [ ] Onboarding flow (location permission "Always", battery whitelist)
- [ ] Login screen
- [ ] Home screen (active/inactive shift state)
- [ ] Background location integration (transistorsoft SDK)
  - [ ] Geofence registration from server
  - [ ] Entry/exit events → Edge Function
  - [ ] Hysteresis applied server-side
- [ ] Map screen (assigned locations, current GPS)
- [ ] History screen (shift list)
- [ ] Live navigation to next location
- [ ] Push notifications (approaching, arrived, shift end)
- [ ] Mock GPS detection + block UI
- [ ] Offline mode (queue events, sync on reconnect)
- [ ] Photo verification flow (when outside fence)
- [ ] Mark ad-hoc location flow (provisional submission)

**Deliverable:** Employee install + use — ცვლა ავტომატურად იწერება.

---

### Phase 4 — Mobile Admin (Week 11)
**Goal:** Admin can manage from phone (parity with web)

- [ ] Admin dashboard (mobile-adapted)
- [ ] Team live map view
- [ ] Alerts inbox
- [ ] Create location from phone (map + form, same as web)
- [ ] Provisional location approval flow

**Deliverable:** Admin-ს არ სჭირდება laptop ხშირი მოქმედებებისთვის.

---

### Phase 5 — Payments + Billing (Week 12)
**Goal:** Companies pay subscriptions

- [ ] Stripe integration
  - [ ] Subscription products (Basic/Pro/Enterprise — 5/12/25₾)
  - [ ] Per-seat pricing
  - [ ] Checkout flow
- [ ] Stripe webhooks (Edge Function)
  - [ ] `customer.subscription.updated`
  - [ ] `invoice.payment_failed`
- [ ] Billing page (current plan, invoices, payment method)
- [ ] Trial-to-paid conversion flow
- [ ] Email notifications (Resend) — payment failed, trial ending

**Deliverable:** კომპანიამ შეუძლია გადახდა, შეცვალოს გეგმა, ჩამოწეროს ინვოისები.

---

### Phase 6 — Super Admin (Week 13)
**Goal:** Sazeo team can manage all tenants

- [ ] Super admin dashboard (MRR, active companies, churn)
- [ ] Tenants list + detail page
- [ ] Audit log viewer
- [ ] Platform settings (plans, features flags)
- [ ] Impersonate user (for support)

**Deliverable:** მე (Sazeo founder) ვხედავ ყველა tenant-ს.

---

### Phase 7 — Polish + Beta Launch (Week 14)
**Goal:** Ready for first paying customer

- [ ] Loading states / empty states / error states (all screens)
- [ ] Accessibility audit (WCAG AA)
- [ ] Mobile app store submissions (iOS + Android)
- [ ] Marketing site + pricing page
- [ ] Demo video (for sales)
- [ ] Onboarding docs (English + Georgian)
- [ ] First 5 beta customers (free trial)

**Deliverable:** Live product, 1+ paying customer or 5+ committed trials.

---

### Phase 8+ (Post-MVP)
- Advanced reports & exports (PDF, CSV)
- Polygon geofences (not just circles)
- Team scheduling
- Mobile Time-off requests
- Slack / WhatsApp integrations
- API for customers (read-only initially)
- White-label option (Enterprise tier)

---

<a name="deliverables"></a>
## 7. Per-Phase Deliverables Table

| Phase | Week | Effort (solo) | Deliverable |
|-------|------|---------------|-------------|
| 0 | 1 | 40h | Repos + Supabase + Vercel CI |
| 1 | 2-3 | 60h | Auth + Tenancy + Invitations |
| 2 | 4-6 | 100h | Web Admin (dashboard, users, locations) |
| 3 | 7-10 | 140h | Mobile Employee (full geofence flow) |
| 4 | 11 | 30h | Mobile Admin |
| 5 | 12 | 35h | Stripe + Billing |
| 6 | 13 | 25h | Super Admin |
| 7 | 14 | 50h | Polish + Beta Launch |
| **Total** | **14 weeks** | **~480h** | **MVP shipped** |

**Solo dev assumption:** 35h/week = 3.5-month full-time, or 6 months at 20h/week.

---

<a name="devops"></a>
## 8. DevOps & Environments

### Environments
- **`development`** — local (your laptop)
- **`staging`** — `staging.trackpro.ge` + staging Supabase project
- **`production`** — `app.trackpro.ge` + production Supabase project

### Branch Strategy (simple, solo-friendly)
```
main         → auto-deploy to production
develop      → auto-deploy to staging
feature/xxx  → preview deployment on Vercel
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/ci.yml
- Lint (eslint + biome)
- Type check (tsc --noEmit)
- Unit tests (vitest)
- Build check (turbo build)
- Auto-deploy via Vercel/Supabase CLI
```

### Monitoring Alerts
- Sentry → Slack/email on error spike
- Supabase logs → daily digest
- Vercel uptime → SMS on downtime
- Stripe → webhook failures → admin email

### Backups
- Supabase: daily automated (Pro tier)
- Code: GitHub (already redundant)
- Photos/files: Supabase Storage replicated

---

<a name="costs"></a>
## 9. Cost Estimation

### MVP (months 1-3, no customers)
- Supabase Free
- Vercel Free
- Resend Free
- Sentry Free
- PostHog Free
- Apple Dev: $99/yr ÷ 12 = $8.25/mo
- Google Play: $25 one-time
- Domain: $10/yr
- **Total: ~$10-15/month**

### At 5 customers (~50 users, $500 MRR)
- Supabase Pro: $25
- Vercel Pro: $20
- Resend: still free
- Mapbox: still free (~5K loads)
- **Total: ~$50-60/month** (12% of MRR — healthy)

### At 30 customers (~300 users, $3K MRR)
- Supabase Pro: $25 + add-ons
- Vercel Pro: $20
- Resend: $20
- Mapbox: $50
- Sentry: $26 (Team plan)
- Expo EAS: $99 (build infrastructure)
- **Total: ~$240/month** (8% of MRR — excellent)

### Break-even point
- Solo dev costs not counted (founder time)
- Stripe fee 2.9% + $0.30 per transaction
- Net margin at $3K MRR: ~85% (very high for SaaS)

---

<a name="risks"></a>
## 10. Risk Areas (Solo Dev)

### 🔴 High Risk
1. **Background location reliability**
   - iOS gives no guarantee even with Always permission
   - Android OEM battery optimizers kill apps
   - Mitigation: transistorsoft SDK + onboarding battery whitelist guide
   - Test on real devices: iPhone, Samsung, Xiaomi (worst OEM)

2. **App Store review rejection (iOS)**
   - Background location requires explicit justification
   - Privacy policy must be detailed
   - Mitigation: study Apple guidelines + look at Hubstaff/Timeero approved apps

3. **Mock GPS arms race**
   - Sophisticated users bypass detection
   - Mitigation: layered detection (OS API + speed anomaly + photo verification fallback)

### 🟡 Medium Risk
4. **PostGIS query performance at scale**
   - ST_DWithin slow without proper indexes
   - Mitigation: GIST indexes from day one, query planner monitoring

5. **Realtime WebSocket disconnections**
   - Mobile networks unstable
   - Mitigation: auto-reconnect logic, graceful degradation

6. **Multi-tenant RLS bugs**
   - Single mistake = data leak between tenants
   - Mitigation: integration tests with multiple tenant users

### 🟢 Lower Risk (but address)
7. **GDPR / data privacy** — Georgia LPDP law similar
   - Privacy policy, DPA template, data deletion flow
   
8. **Internationalization edge cases**
   - Georgian Unicode + RTL fallback (not needed but plan ahead)

9. **Stripe disputes / chargebacks**
   - Subscription handling (proration, refunds)
   - Mitigation: use Stripe's built-in subscription primitives

---

<a name="pointers"></a>
## 11. Pointer Files (Reference Daily)

ეს ფაილები **მუდამ ხელთ უნდა გქონდეს** ნებისმიერი feature-ის implementation-ის წინ:

| Reference | რა-სთვის |
|-----------|---------|
| `tracking_saas_schema.sql` | Database structure — RLS policies, indexes |
| `DESIGN_RULES.md` | Web admin UI — KAYA tokens, components |
| `GEOFENCE_DESIGN_RULES.md` | Geofence logic — radius, hysteresis, photo flow |
| `trackpro_designs.zip` | Visual reference — 31 screen mockups |
| `tracking_saas_tasks.md` | Detailed task breakdown — for Linear/GitHub Projects |

---

## 🚀 Day 1 Action Items

ეს არის რა უნდა გააკეთო **ხვალ დილით**:

1. ☐ შექმენი GitHub account (თუ არ გაქვს) → repo `trackpro`
2. ☐ შექმენი Supabase account → ახალი project `trackpro-staging`
3. ☐ შექმენი Vercel account → connect to GitHub
4. ☐ ააძრე SQL Editor-ში `tracking_saas_schema.sql`
5. ☐ Apple Developer enrollment + Google Play Console setup (review-ი 1-2 დღე იღებს)
6. ☐ შექმენი GitHub Project / Linear workspace → import-ი `tracking_saas_tasks.md`
7. ☐ Block 4 hours: install pnpm, init monorepo with Turborepo
8. ☐ ✅ End of day: `git push` first commit to `main`, see Vercel deploy

---

## 💡 Solo Dev Survival Tips

1. **არ ააშენო ყველაფერი — გამოიყენე boilerplate-ი თუ ვერ მოიქცევი:**
   - **MakerKit** ($299) — Next.js + Supabase + Stripe + multi-tenancy ჯერადად ჩაშენებული
   - **Supastarter** ($229) — Similar value
   - **Vercel B2B Multi-Tenant Template** (FREE) — გადასწავლა base structure
   - დანახარჯი ⊆ წარმოდგენილია — boilerplate ერთი კვირის სამუშაოს გადარჩენს

2. **AI Pair Programming გამოიყენე ცინიკურად:**
   - Claude Code / Cursor — boilerplate generation, refactoring
   - **მაგრამ:** არ ენდო AI-ს geofence logic-ისთვის — წერე ხელით, ტესტი ხელით
   - Code review-ი ცალკე — AI ვერ პოულობს subtle bugs

3. **Ship-ი early, რეფაქტორი მოგვიანებით:**
   - MVP-ი არ უნდა იყოს perfect
   - First customer ცვლის priorities
   - Premature optimization = wasted time

4. **Test on real devices იქამდე, სანამ შენი მეგობრები ცდიან:**
   - Browser DevTools simulator ≠ real iPhone
   - Background location ≠ foreground location

5. **Solo founder communities:**
   - IndieHackers
   - r/SaaS (Reddit)
   - Twitter/X "build in public"

---

## 📞 Support & Escalation

თუ რამეზე გაკლე:
1. ჯერ — Claude / Cursor / ChatGPT (specific question)
2. შემდეგ — Supabase Discord, Vercel Discord, Expo Discord
3. ბოლოს — Stack Overflow / GitHub Issues

**ფიქრების ერთი წესი:** დახმარების მოთხოვნამდე გადახედე გადახედე ცარიელი 30 წუთი — ხშირად პრობლემა typo-ა.

---

დოკუმენტი დასრულდა.

**ვერსიის ისტორია:**
- v1.0 (2026-05-11) — Initial spec

**შემდეგი მოქმედება:** დაიწყე Phase 0 ხვალ.
