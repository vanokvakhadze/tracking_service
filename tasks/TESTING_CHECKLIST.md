# TrackPro — Testing Checklist (pre-Beta)

> URL: https://tracking-service-web.vercel.app
> Demo login: `review@trackpro.ge` / `ReviewMe2026!` (run `pnpm seed:demo` თუ ცარა seed)
> ბოლო განახლება: 2026-05-13

გადადი ცარა route-ში თანმიმდევრობით. თითო section-ი 2-5 წუთი. bugs-ი მონიშნე `❌` ცარა + note რა გადახდი.

---

## Section 1 — Marketing site (anonymous user)

ცადო **logout** ცარა ცადო (Browser → Incognito tab გადადი თუ ცარა logged in).

- [ ] `/` — Hero ცარა, 6 feature card, 3-step "How it works", CTA strip, footer
- [ ] `/pricing` — 3 plan card (Basic/Pro/Enterprise) + comparison table
- [ ] `/docs` — 6 doc card index
- [ ] `/docs/getting-started` — MDX renders cleanly (headings, lists, code blocks)
- [ ] `/docs/locations` — Two-zone explanation, hysteresis table
- [ ] `/docs/team` — roles section
- [ ] `/docs/mobile-app` — permissions guide
- [ ] `/docs/billing` — pricing details
- [ ] `/docs/faq` — troubleshooting
- [ ] `/privacy` — Georgian privacy policy
- [ ] `/terms` — Georgian terms of service
- [ ] Header: ლოგო → `/`, "ფასები" → `/pricing`, "დოკუმენტაცია" → `/docs`, "შესვლა" → `/login`, "დაიწყე უფასოდ" → `/signup`
- [ ] Footer: "კონფიდენციალურობა" → `/privacy`, "პირობები" → `/terms`, "დოკუმენტაცია" → `/docs`

**Mobile responsive:** გადახედე phone-ის width-ში (DevTools → toggle device). hero და features 1-column ცადო ცარა.

---

## Section 2 — Auth flows

- [ ] `/signup` → ცარა form: ემაილი + პაროლი + კომპანიის სახელი + subdomain. submit → email confirmation prompt
- [ ] Email-ში confirmation link → click → /dashboard-ში გადაყავხარ
- [ ] `/login` → existing user credentials → /dashboard
- [ ] `/login` → არასწორი password → "არასწორი ემაილი ან პაროლი" error
- [ ] Logged-in user → `/login` URL → auto-redirect to `/dashboard`
- [ ] Unauthenticated user → `/dashboard` URL → auto-redirect to `/login`
- [ ] Logout button (Top bar → user menu) → ხელახლა `/login`-ში

---

## Section 3 — Admin tour (login: `review@trackpro.ge`)

### Dashboard
- [ ] `/dashboard` → 4 metric cards (Active Shifts / Today's Distance / Locations / Alerts)
- [ ] **Live map** card — 3 locations Tbilisi-ში pin-ით
- [ ] **Active users** card — "ჯერ ცვლები არ არის" empty state (no live shifts yet without mobile app)
- [ ] Subheader-ში "ცოცხალია" badge

### Locations
- [ ] `/locations` → 3 location list (ცენტრალური ოფისი / საქარის ფილ. #2 / საწყობი — დიდუბე)
- [ ] თითო location-ის card → ჩამოწეროილი category, address, radius
- [ ] **+ ახალი ლოკაცია** ღილაკი → `/locations/new` → map mode + address mode toggle, draggable pin, two sliders
- [ ] Map mode-ში pin გადათრევით lat/lng update-ი
- [ ] Submit → /locations-ში გადახვალს, ცარა location list-ში გამოჩნდე

### Pending locations
- [ ] `/locations/pending` → 1 provisional location (სუპერმარკეტი — ვაკე) + employee photo placeholder + GPS pill
- [ ] **დაამტკიცე** ღილაკი → modal: name + category → submit → location → active-ი ცადო

### Users
- [ ] `/users` → 3 user list (admin + 2 employees)
- [ ] **+ თანამშრომელი** → invite form
- [ ] **+ Bulk invite (CSV)** ღილაკი (task.049!) → dialog → "Download template" → CSV download
- [ ] Template-ის ფორმატით ცარა small CSV upload (2 emails) → success report
- [ ] Role dropdown ცარა → user/tenant_admin switch
- [ ] Active toggle → deactivate → re-activate

### Reports
- [ ] `/reports` → 4 metric cards + **ShiftsTable** (task.050!) → 30 დღის ცვლები (initially empty)
- [ ] **ექსპორტი (CSV)** ღილაკი → CSV download
- [ ] CSV შემოწმე Excel-ში → 7 columns (shift_id, user_name, ..., notes)
- [ ] ცადო shift-ი manual creation → ცადო **✏ ანოტაცია** ღილაკი → save note → CSV-ში notes column populated

### Settings
- [ ] `/settings` → tenant info form (name, subdomain, timezone, language)
- [ ] Update → success message

### Billing
- [ ] `/billing` → preview mode (current plan card + portal card + trial banner)
- [ ] **"Stripe activation pending"** notice ცარა (post task.045)

---

## Section 4 — Super admin (cross-tenant)

> ცარა აქცესი: User-ის SQL row-ი → `update users set is_super_admin = true where email = 'review@trackpro.ge'`

- [ ] `/platform` → MRR + Tenants + Users + Trial→Paid metric cards
- [ ] **TenantsTable** → 1 row ("App Review Demo")
- [ ] Filter pills (all/pro/basic/trial)
- [ ] Click row → `/platform/tenants/[id]` → Account / Subscription / Stripe cards + Team table
- [ ] **Impersonate** button → confirm prompt → new tab → logged in as that user
- [ ] `/platform/audit` → impersonation event-ი ცარა ცადო ცარა ცადო
- [ ] Sidebar (amber accent — KAYA blue-ისგან განსხვავებული)

---

## Section 5 — Health + observability

- [ ] `https://tracking-service-web.vercel.app/api/health` → JSON response, status 200, `database: "ok"`
- [ ] DevTools → Console → `typeof window.__SENTRY__` → "object" (Sentry initialized)
- [ ] DevTools → Network → Filter "sentry" → reload → POST requests `ingest.de.sentry.io` → 200 OK
- [ ] Sentry dashboard → Issues → test error from console → appears within 30s

---

## Section 6 — Mobile (Expo Go — limited)

> Background tracking ცადო ცადო Expo Go-ში. UI ცარა Expo Go-ში მუშავდე.

- [ ] `npx expo start` → QR scan from Expo Go
- [ ] Welcome screen → Permissions screen → request location + notifications
- [ ] Login → demo employee credentials (`giorgi.review@trackpro.ge`)
- [ ] Home tab → "ცვლა მზადაა" empty state (no active shift)
- [ ] Map tab → 3 location pins
- [ ] History tab → empty
- [ ] Profile tab → user info + logout button

ცადო admin role-ით (`review@trackpro.ge`):
- [ ] Tab bar ცადო ცადო: დაშბორდი / რუკა / გუნდი / ალერტი
- [ ] "+ ლოკაცია" button on admin dashboard → opens modal

---

## შემოწმების შემდეგი ნაბიჯი

ცადო bugs-ი ცადო — ცარა file ცადო ცარა, ცადო issues-ი chat-ში მე ცადო. ცადო ცარა:

```
[BUG] /locations/new → Map mode → pin გადათრევით → ცადო coordinate-ი არ ცარა update / გვერდი crash-დება
[POLISH] /pricing → mobile width-ში pricing card-ი ცარა overflow-ი
[FEATURE] CSV export → date range filter ცადო wired (currently exports all)
```

ცარა bugs → fix-ი ცარა priority.

---

გადადი https://tracking-service-web.vercel.app + Section 1-ით დაიწყე. ცადო ცარა მე bugs-ი log-ი → ჩვენ ცარა triage.
