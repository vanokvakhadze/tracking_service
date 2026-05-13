# App Store + Play Store metadata — copy/paste ready

Use this file when filing the app on App Store Connect (iOS) and Play Console
(Android). All copy is Georgian-first with English fallback for international
visibility.

---

## App identity

| Field | Value |
|---|---|
| App name (display) | **TrackPro** |
| Bundle ID (iOS) | `ge.trackpro.app` |
| Package (Android) | `ge.trackpro.app` |
| Category (primary) | Business |
| Category (secondary) | Productivity |
| Pricing | Free (subscription via Stripe inside the app — declare as IAP-equivalent if Apple flags) |
| Age rating | 4+ / Everyone |

---

## Subtitle (30 char limit on iOS)

```
GPS ცვლის ავტო-ტრექინგი
```

English fallback:
```
GPS shift auto-tracking
```

---

## Short description (Google Play, 80 char limit)

```
თანამშრომელთა GPS ცვლის ავტომატური აღრიცხვა გეოფენსით. KAYA-ფერი UX. ქართულად.
```

English fallback:
```
Auto-track employee shifts with GPS geofencing. KAYA-style UX. Georgian first.
```

---

## Full description (App Store + Google Play, ~4000 chars)

```
TrackPro აქცევს თანამშრომელთა ცვლის ჩაწერას ავტომატად.

გეოფენსი იპოვის, რომ თანამშრომელი სამუშაოზე მისულია — ცვლა იწყება. გავიდა — ცვლა მთავრდება. არც manual punch-clock, არც mock GPS attempt, არც დაუდევრობით მიწერილი საათები.

რაც აპლიკაცია აკეთებს:

• გეოფენსი + hysteresis — თითო ლოკაციას ორი ზონა: Trigger (ცვლის ცენტრი) და Boundary (alert ფარგლები). 30 წამიანი hysteresis-ი თავიდან აიცილებს false trigger-ებს.

• ცოცხალი რუკა მენეჯერისთვის — სად მიდიან თანამშრომლები, რომელ ლოკაციაზე, რამდენი დრო. რეალურ დროში.

• ცვლის ავტომატური აღრიცხვა — push notification "ცვლა დაიწყო" როცა გეოფენსში ხარ, "ცვლა დასრულდა" როცა გადახვედი.

• Mock GPS დაცვა — iOS isFromMockProvider + Android isMock დეტექციით. Mock attempt → ცვლა იბლოკება + admin-ს მიდის ალერტი.

• ფოტო verification — თანამშრომელი მიდის ახალ ადგილზე? იღებს ფოტოს, admin ამოწმებს და approve-ს უკეთებს.

• რეპორტები ფინანსისთვის — სრული საათები, ლოკაციები, შრომის რეგიონი. CSV ექსპორტი.

• ბატარეის ეკონომია — motion-based state machine, 70% ბატარიის გადარჩენა.

• კონფიდენციალურობა — GPS ტრექინგი მხოლოდ ცვლის საათებში, არასდროს გარეთ. EU რეგიონში (Frankfurt) Supabase-ით ხდება მონაცემების შენახვა.

ვისთვის გვაქვს:
• Delivery & logistics
• Construction sites
• Security guards
• FMCG sales reps
• Cleaning services
• ნებისმიერი ბიზნესი, რომელსაც აქვს field employees

ფასი — თვეში, თითო აქტიური თანამშრომელი. 14 დღიანი უფასო ცდა. ბარათი არ მოითხოვება.

TrackPro = Sazeo პროდუქტი. დაყენდი — trackpro.ge-ზე.
```

English fallback:

```
TrackPro turns employee shift tracking into something that happens automatically.

GPS geofencing knows when your team arrives at the worksite — the shift starts. When they leave — the shift ends. No manual punch-clock, no mock GPS attempts, no missed hours.

What it does:

• Two-zone geofencing with hysteresis — every location has a Trigger ring (shift center) and a Boundary ring (alert perimeter). 30s entry / 60s exit hysteresis prevents false triggers from GPS drift.

• Live team map for managers — see where employees are, which location, how long. Real-time.

• Auto shift tracking — push notification "shift started" when you enter the geofence, "shift ended" when you leave.

• Mock GPS guard — iOS isFromMockProvider + Android isMock detection. Mock attempts block the shift and alert admins.

• Photo verification — employee at a new site? Take a photo, admin approves with one tap.

• Reports for finance — total hours, locations, work region. CSV export.

• Battery-efficient — motion-based state machine saves ~70% battery vs continuous tracking.

• Privacy-first — GPS tracking only during work shifts, never outside. Data stored in EU region (Frankfurt) on Supabase infrastructure.

Built for:
• Delivery and logistics
• Construction sites
• Security guards
• FMCG sales reps
• Cleaning services
• Any business with field employees

Pricing: per active employee, per month. 14-day free trial. No card required.

TrackPro is a Sazeo product. Sign up at trackpro.ge.
```

---

## Keywords (App Store, 100 chars total, comma-separated)

```
gps,tracking,timesheet,geofence,employees,attendance,shift,georgia,trackpro,sazeo,construction
```

---

## Privacy practice declarations (App Store Connect → App Privacy)

| Data type | Collected | Linked to user | Tracking | Purpose |
|---|---|---|---|---|
| Precise Location | Yes | Yes | No | App Functionality |
| Coarse Location | Yes | Yes | No | App Functionality |
| Photos | Yes (optional) | Yes | No | App Functionality |
| Email Address | Yes | Yes | No | Account |
| Name | Yes | Yes | No | Account |
| Phone Number | Optional | Yes | No | Account |
| Device ID | Yes | Yes | No | Analytics |
| Crash Data | Yes | No | No | Diagnostics |

**Tracking declaration:** No — TrackPro does not track users across other apps or websites.

---

## Background-location justification (Google Play Console)

When Play Console asks "Why does your app need background location?", paste:

```
TrackPro is a workforce time-tracking app. Background location is used exclusively to detect when an employee enters or leaves their assigned worksite (a geofence registered by their employer). This auto-starts and auto-ends their work shift so they don't have to remember to punch in/out manually.

We do NOT collect location outside of registered work zones, and tracking stops when the user signs out. Users are clearly informed during onboarding and can revoke at any time via system settings — the app continues to work in degraded mode (manual check-in).
```

---

## Required URLs

| URL | Status | Where to fill |
|---|---|---|
| App Store Connect: Marketing URL | Optional | trackpro.ge |
| App Store Connect: Support URL | **Required** | trackpro.ge/support (TODO) |
| App Store Connect: Privacy Policy URL | **Required** | trackpro.ge/privacy ✅ |
| Play Console: Privacy Policy URL | **Required** | trackpro.ge/privacy ✅ |
| Play Console: Website | Optional | trackpro.ge |

---

## Screenshots checklist (capture from real device — iPhone 6.7" + Pixel 7)

Minimum 3 per device class. Suggested order:

1. **Live map** — admin view, multiple active employees as KAYA dots
2. **Auto shift** — employee home screen with "ცვლა მიდის" + active dwell timer
3. **Location create** — drag-pin map with two-radius circles visible
4. **Live team map (mobile admin)** — Pixel/iPhone view of team positions
5. **Approve provisional** — photo of work site + GPS pill + approve button
6. **Reports / dashboard** — KPI cards + chart

**Required device sizes:**

iOS:
- 6.9" (iPhone 16 Pro Max) — 1290×2796
- 6.7" (iPhone 14 Plus / 15 Pro Max) — 1290×2796 or 1284×2778
- 6.5" (legacy fallback) — 1242×2688

Android:
- Phone — 1080×1920 minimum, max 7680×7680
- Feature graphic — 1024×500 (required for store listing)

---

## Demo account credentials (App Review will ask)

Create a dedicated review account before submission:

```
Email:    review@trackpro.ge
Password: <strong-password>
Tenant:   "App Review Demo"
Role:     tenant_admin
Pre-seeded with:
- 3 locations (Tbilisi office, Vake warehouse, Saburtalo construction)
- 2 employees (one with active shift)
- 1 pending location for approval flow
- 1 audit log entry
```

This account must persist between releases — Apple/Google reviewers expect to log in repeatedly.

---

## Submission checklist (run before "Submit for review")

- [ ] Real PNG icons generated (run `pnpm --filter @trackpro/mobile icons:generate`)
- [ ] Bundle ID + package name set in `app.json`: `ge.trackpro.app`
- [ ] Privacy URL live: `https://trackpro.ge/privacy`
- [ ] Terms URL live: `https://trackpro.ge/terms`
- [ ] Marketing site live: `https://trackpro.ge`
- [ ] EAS Build production binary uploaded
- [ ] Screenshots captured (3+ per device class)
- [ ] Review account seeded with demo data
- [ ] App Privacy declarations filled (see table above)
- [ ] Background-location justification pasted (Google only)
- [ ] Stripe Live keys set in production (or remove pricing/billing references for v1)
- [ ] Sentry DSN set (NEXT_PUBLIC_SENTRY_DSN) so production errors get captured

---

## Status as of {{today}}

✅ Bundle IDs configured  
✅ Privacy page live (/privacy)  
✅ Terms page live (/terms)  
✅ Marketing landing live (/)  
✅ Icon assets generated  
✅ EAS Build profiles configured (eas.json)  
✅ Sentry web SDK wired (DSN-gated)  
⏳ EAS project ID — needs `npx eas-cli init` to populate `extra.eas.projectId`  
⏳ Apple/Google reviewer demo account — seed when you have the real tenant data  
⏳ Screenshots — capture from running production build  
⏳ Sentry DSN — sign up + paste into Vercel env  
⏳ Demo video — Loom recording (3.7.9)
