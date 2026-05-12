# TrackPro Geofence & Design Rules — v2.0

> **Claude-ისთვის prompt**: ეს ფაილი არის **სრული წესების სია** TrackPro-ის გეოღობეების სისტემისთვის. დააკოპირე მთლიანად, შემდეგ მოითხოვე "ააწყე [feature]".
>
> ფაილი ეფუძნება: **KAYA Design System** (visual) + **ინდუსტრიის ბესთ პრექტისები** (geofencing logic) — Hubstaff, Timeero, Buddy Punch, TrackTik, Factorial, react-native-background-geolocation (transistorsoft).

---

## 📖 პროდუქტის Flow (3 დონის hierarchy)

```
SUPER ADMIN (Sazeo platform)
   ↓ creates tenants (companies)
   
COMPANY ADMIN (per-tenant admin)
   ↓ creates locations (with geofences)
   ↓ assigns users to locations
   
EMPLOYEE (mobile user)
   ↓ moves toward location
   ↓ enters geofence → SHIFT AUTO-STARTS
   ↓ dwell timer accumulates
   ↓ exits geofence → SHIFT AUTO-ENDS
   ↓ moves to next location → loop
```

### კრიტიკული წესი — Auto Start/End
- **ცვლა იწყება** მაშინ, როცა employee შედის ლოკაციის გეოღობეში (ENTRY event + verification)
- **ცვლა მთავრდება** მაშინ, როცა გადადის სხვა ლოკაციაში, ან გადის ცვლის გრაფიკიდან, ან ხელით ამთავრებს
- **არ უნდა**: მანუალური "Start" tap-ი ნორმალურ flow-ში. Manual start მხოლოდ override / unauthorized location-ისთვის

---

## 🛰 GEOFENCE RULES (industry best practices)

### წესი 1: რადიუსი + Zone Architecture (Two-Zone Pattern)

**კრიტიკული:** ერთი ლოკაცია = **ორი ცალკე ზონა** (nested concentric circles)

| ზონა | რა აკეთებს | რადიუსი | ფერი UI-ში |
|------|----------|--------|-----------|
| **Trigger Zone (ცვლის ცენტრი)** | აქ შემოსვლა → SHIFT_START · გასვლა → SHIFT_END | მცირე (50-300მ) | KAYA blue `#1565C0` dashed |
| **Boundary Zone (სამუშაო ზონა)** | აქ შემოსვლა/გასვლა → მხოლოდ alert ადმინს, ცვლა გრძელდება | დიდი (100-1500მ) | Amber `#CA8A04` dashed |

**მუშაობის ლოგიკა:**

```
Outside everything
    ↓ (employee approaching)
ENTERS Boundary Zone (200მ)
    → Push notification "ახლოს ხართ"
    → მაგრამ ცვლა ჯერ არ იწყება
    ↓
ENTERS Trigger Zone (100მ)
    → SHIFT_START (after 30s hysteresis)
    → ცვლა იწერება
    ↓
EXITS Trigger Zone (but still inside Boundary)
    → SHIFT_END (after 60s hysteresis)
    → ცვლა მთავრდება
    ↓
EXITS Boundary Zone entirely
    → Alert to admin "გავიდა სამუშაო ზონიდან"
```

**წესი:** Trigger Zone ≤ Boundary Zone რადიუსით. UI უნდა მოახდინოს force-validation: თუ admin ცდილობს trigger > boundary, error toast.

#### კატეგორიის მიხედვით default-ები (ორივე ზონის):

| ლოკაციის ტიპი | Trigger რადიუსი | Boundary რადიუსი |
|--------------|----------------|----------------|
| Office / ფილიალი | 100 მ | 200 მ |
| საწყობი | 150 მ | 300 მ |
| სამშენებლო მოედანი | 250 მ | 500 მ |
| დიდი კომპლექსი | 300 მ | 600 მ |
| Default | 100 მ | 200 მ |

**Backend წესი:** მინიმუმი 200მ Apple native iOS API-სთვის — applied to **larger of the two** (Boundary). Trigger zone გათანასწორდება client-side hit-testing-ით.

#### Optional simplification

თუ admin არ ცვალოს default-ი, UI-ში შესაძლოა იყოს "Simple mode" toggle:
- **Simple mode** = მხოლოდ Boundary Zone (ერთი წრე, entry/exit triggers ცვლას) — backwards compatible
- **Advanced mode** = ორი ცალკე ზონა (default for new locations)

### წესი 2: Accuracy buffering — ფსევდო-რადიუსი

GPS-ის accuracy არაა მუდმივი. WorkforceHub-ის წესი:
- თუ GPS accuracy = 15მ, employee 10მ გარეთ → **considered INSIDE** (within accuracy margin)
- თუ GPS accuracy = 15მ, employee 10მ შიგნით → **considered INSIDE**

**ფორმულა:**
```
distanceToCenter = haversine(userLat, userLng, fenceLat, fenceLng)
effectiveRadius = fence.radius + (gps.accuracy * 0.5)
isInside = distanceToCenter <= effectiveRadius
```

UI-ში ეს buffer-ი მომხმარებელს არ უნდა ვაჩვენოთ — backend logic.

### წესი 3: Hysteresis (debouncing) — false trigger-ების თავიდან აცილება

GPS drift იწვევს "flickering" — entry / exit / entry / exit რამდენიმე წამში. ბესთ პრექტისი:

**Entry confirmation:**
- ENTRY event ფიქსირდება მაშინ, როცა user **განგრძობდა** გეოღობეში ყოფნას **15-30 წამი**
- ან **2-3 თანმიმდევრული GPS ping** გეოღობეშია
- "Dwell" event-ი (transistorsoft, native Android) კარგი fit-ია — `loiteringDelay: 30000` ms

**Exit confirmation:**
- EXIT event-ი ფიქსირდება მაშინ, როცა user **გავიდა** გეოღობიდან + დარჩა გარეთ **60-90 წამი**
- ან გადაიადგილა **მინიმუმ 1.5x radius-ი** გარეთ
- Quick "blip" outside (5 წამში დაბრუნდა) — ignore

**Implementation:**
```typescript
type GeofenceState = "outside" | "entering" | "inside" | "exiting";

const HYSTERESIS = {
  entryDwellMs: 30_000,     // 30 sec inside before ENTRY confirmed
  exitDwellMs: 60_000,      // 60 sec outside before EXIT confirmed
  minExitDistance: 1.5,      // multiplier on radius
};
```

### წესი 4: Photo Verification — როდის სავალდებულო

ფოტო verification ეშლევება buddy punching-ს და ანონიმურ check-in-ს. ბესთ პრექტისი:

| სცენარი | Photo სავალდებულო? |
|---------|-------------------|
| Normal entry (employee shifts daily at this location) | **არ არის** — geofence + GPS sufficient |
| First-time visit ახალ ლოკაციაზე | **სავალდებულო** |
| **Outside geofence** (employee შორს, ცდილობს check-in) | **სავალდებულო** (selfie + photo of place) |
| **GPS accuracy poor** (>50მ) | **სავალდებულო** |
| **Mock GPS detected** | **block + manual review** |
| Compliance / payroll audit job sites | **სავალდებულო** (selfie + timestamp overlay) |

ფოტო metadata უნდა შეიცავდეს:
- GPS coordinates @ photo capture moment
- Timestamp (server-time, არა client)
- Image hash (tamper detection)
- Device ID

### წესი 5: Manual Location Marking — ვის რა უფლება აქვს

**ფუნდამენტური განსხვავება:**

| როლი | რას ნიშნავს | სტატუსი | ცვლა იწერება? |
|------|-----------|---------|--------------|
| **ადმინი** (web ან mobile) | **სამუშაო ლოკაცია** — სად უნდა იყოს employee | `active` (პირდაპირ shipped) | კი, normal flow |
| **Employee** (mobile only) | **ad-hoc ვიზიტი** — სად ფაქტობრივად წავიდა | `pending_approval` | კი, მაგრამ ad-hoc tag-ით |

#### Admin flow (full authority)
**Use case:** ადმინი ქმნის official location-ს ნებისმიერი მოწყობილობიდან — web-ი ან ტელეფონი.

1. ადმინი ხსნის app-ს → Mode: Operations → Locations → +
2. **ორი მეთოდი ერთნაირად ხელმისაწვდომი:**
   - **რუკაზე (Map mode)**: drag pin, current GPS auto-populated, radius slider
   - **მისამართით (Address mode)**: search bar → Google Places → verify on map
3. ფორმა: სახელი / კატეგორია / რადიუსი / სამიზნე დრო / ჯგუფი / notification settings
4. Save → **immediately active**, employee-ებს pushed-ი ეგზავნებათ "ახალი ლოკაცია მიენიჭე"

**კრიტიკული:** Admin-ის ლოკაცია **არ საჭიროებს მე-ორი ადმინის approval-ს**. ის არის authority.

**Mobile admin = Web admin parity** — ერთი და იგივე feature, ერთი და იგივე უფლება. ეს არ არის "limited mobile version".

#### Employee flow (provisional submission)
**Use case:** employee სხვაგან წავიდა, რომელიც official ლოკაცია არ არის (მაგ. ახალი customer ვიზიტი). მას უნდა შეეძლოს ეს ადგილი მონიშნოს.

1. Employee იღებს ფოტოს → ფოტოს EXIF/metadata-დან გამოიყვანე GPS coordinates
2. Backend ქმნის **provisional location** (status: `pending_approval`)
3. Admin-ს ეგზავნება notification: "გიორგი ბერიძემ მონიშნა ახალი ლოკაცია — დაამტკიცე?"
4. Admin შეიძლება:
   - **დაამტკიცოს** → იქცევა real location-ად, ღია ყველა employee-სთვის ვისაც ჯგუფი მიენიჭება
   - **დაუშვი ერთჯერადად** (ad-hoc visit, არ ხდება საერთო) — employee-ის ცვლა ჩაიწერა მაგრამ location stays private
   - **უარყოს** → ცვლა flagged for manual review
5. Employee-ის shift იწერება ამ provisional location-ით

**კრიტიკული:** employee-მა **არ უნდა შექმნას** ღია permanent location პირდაპირ — ეს admin-ის ექსკლუზიური ფუნქციაა. Employee შემოაქვს "candidate", admin რეცენზიას აკეთებს.

#### UI-ის სხვაობა (ერთნაირი feature, სხვადასხვა treatment)

| ელემენტი | Admin-ის UI | Employee-ის UI |
|---------|-----------|---------------|
| Entry point | "+ ახალი ლოკაცია" CTA prominent (header button) | მცირე "მონიშნე ლოკაცია" prompt როცა outside any fence |
| Pin ფერი map-ზე | KAYA blue solid (#1565C0) | Amber dashed circle, "?" icon |
| Photo სავალდებულო? | არა (admin verified იდენტობით) | **კი** — selfie ან building photo |
| Save button label | "შენახვა" / "+ ლოკაცია" | "გადააგზავნე დასამტკიცებლად" |
| After save | Immediately active, push to assigned users | "მოლოდინში" status, push to admin |
| Approval inbox | — | აქვს დედიქეიტური inbox |

### წესი 6: Mock GPS Detection

**წყაროები:**
- iOS: `CLLocation.isFromMockProvider` (limited, iOS 15+)
- Android: `Location.isFromMockProvider()` + `Location.isMock()` (API 31+)
- Cross-platform: speed/altitude anomalies (teleport detection — distance/time ratio > realistic)

**Action მიხედვით:**
- Mock detected → **block check-in** + alert admin (red banner in mobile + push to admin)
- Recurring pattern (>2 incidents per week) → automatic suspension flag

### წესი 7: Battery & Permissions

**Battery წესები** (transistorsoft best practices):
- **Motion-based state machine**: stationary state — GPS off; moving state — GPS on. **70% battery savings**
- Location ping interval: 30 sec moving / heartbeat 60 sec stationary
- **არ გავაკეთოთ** continuous tracking off-shift hours-ში

**Permissions ფლოუ:**
1. Onboarding-ზე: "Background Location" — **Always** permission (iOS)
2. Android: Foreground Service notification საჭიროა (API 26+)
3. Battery optimization exclusion — guide user-ს app-დან
4. Permission denied → app **functional but degraded** (manual check-in only)

### წესი 8: Offline Mode

GPS pings უნდა შევინახოთ ლოკალურად (SQLite) + sync-ი ხდება როცა network-ი დაბრუნდება. ცვლის entry/exit event-ი fire-ის ხდება ლოკალურად + queued for upload.

---

## 🎨 DESIGN RULES (KAYA-compliant)

[ფერები, typography, components — ცალკე ფაილში: `DESIGN_RULES.md`]

დასახსოვრებელი (geofence-ის კონტექსტიდან):
- **KAYA blue `#1565C0`** — primary, route lines, geofence circles outline
- **Green `#16A34A`** — success state, "inside geofence", confirmed dwell
- **Amber `#CA8A04`** — warning, low GPS accuracy, approaching boundary
- **Red `#DC2626`** — Mock GPS, exit alerts, unauthorized location

### Map visual conventions

| ელემენტი | სტილი |
|---------|------|
| Geofence circle (active) | KAYA blue stroke `#1565C0`, dashed `8 5`, fill 10% opacity |
| Geofence circle (entered/dwelling) | Green stroke `#16A34A`, fill 15% opacity, pulse animation |
| Geofence (approaching, <200m) | Green concentric pulse rings (3 layers, animated) |
| User location pin | KAYA blue fill `#1565C0`, 3.5px white stroke, direction arrow |
| User location halo | KAYA blue 25% opacity, 20px radius |
| Mock GPS alert pin | Red fill `#DC2626`, red halo |
| Provisional location (pending admin) | Amber stroke `#CA8A04`, dashed `4 4`, "?" icon |
| Route line (current path) | KAYA blue solid 4.5px |
| Route line (planned/upcoming) | Gray dashed `6 4` |
| Distance label | White bg, KAYA blue border + text, 11px font, pill style |

### Empty / Loading / Error states

**Empty:** "გეოღობეები არ მოგინიშნავთ. დაამატე პირველი ლოკაცია" + CTA "+ ლოკაცია"

**Loading:** skeleton card, 1.2s pulse, KAYA-style

**Error:** red banner + retry button + support link

---

## 🖼 ეკრანების სია (გეოღობეების კონტექსტში)

### Admin web — Locations management
1. **Locations list** — table view (name, address, radius, category, status)
2. **Location create — Map mode** — drag pin + auto-coordinates + radius slider
3. **Location create — Address mode** — search bar + Google Places suggest + verify on map
4. **Location detail / edit** — full settings + assigned groups + activity log
5. **Provisional location approval** — admin reviews employee-submitted location

### Mobile employee
1. **Locations near me** — list + map view, my assigned locations
2. **Navigating to location** — live GPS, route, ETA (already designed in 17_navigation)
3. **Approaching geofence** — pulse rings (already designed in 18_approaching)
4. **Inside geofence — shift active** — dwell timer (already designed in 19_arrived)
5. **Mark new location** — camera + EXIF + describe → submit for admin approval
6. **Unauthorized location warning** — "შენ შენი ლოკაციის გარეთ ხარ. გრძელდება ცვლის გარეთ"

### Mobile admin
1. **Location grid** — quick view of all locations + live count of who's inside
2. **Provisional approvals** — pending location requests inbox

---

## 🧪 ტექნიკური Mock — დიზაინი ფლოუ end-to-end

ვაჩვენებ თუ როგორ მუშაობს რეალურად:

### Sequence #1: Normal Daily Shift
```
06:00 — Employee wakes up. App: stationary state. GPS off. Battery healthy.
08:45 — Employee starts car/walking toward office.
        App: motion detected → location tracking ON.
08:52 — Employee within 500m of geofence.
        Push: "ახლოს ხართ — საქარის ფილ. #2 · 200 მ"
        UI: approaching screen with pulse rings.
08:54 — Employee enters 100m geofence.
        State: "entering" (not yet confirmed).
        Hysteresis timer starts: 30 sec required.
08:54:30 — Still inside → ENTRY confirmed.
        Push: "მისულხართ — ცვლა დაიწყო 08:54"
        Backend: shift_started_at = 08:54:00
        UI: arrived screen, dwell timer running 00:00:30 → 00:00:31 → ...
13:15 — Employee leaves geofence (walks to lunch outside).
        State: "exiting" (not yet confirmed).
        Hysteresis: 60 sec required.
13:16:00 — Employee returns to geofence (false alarm).
        State resets: "inside". Exit timer cancelled.
        UI: dwell timer continues uninterrupted.
17:30 — Employee leaves geofence (end of day).
        State: "exiting".
17:31:00 — Still outside, distance > 150m (1.5x radius).
        EXIT confirmed.
        Push: "ცვლა დასრულდა — 8ს 37წ"
        UI: shift summary card + next-location suggestion.
```

### Sequence #2: Unauthorized Visit (employee at customer site)
```
14:00 — Employee leaves official location.
        App: motion detected, tracking continues.
14:15 — Employee arrives at unknown coordinates.
        No matching geofence.
        Push (subtle, not alarming): "თქვენი ლოკაცია არ არის რეგისტრირებული"
        UI: small notice card on home screen — "თუ აქ მუშაობ, მონიშნე ეს ლოკაცია"
14:16 — Employee taps "მონიშნე ლოკაცია" → camera opens.
        Takes photo of building.
        UI: form auto-filled — current GPS coords, current time, asks "სახელი?" + "მოკლე აღწერა"
        Submit → status "მოლოდინში — ადმინი დაამტკიცებს"
14:20 — Admin receives push notification.
        UI (mobile admin): provisional location card with photo + map preview + APPROVE/REJECT buttons.
14:22 — Admin approves.
        Backend: creates location + assigns to employee + shift_started_at = 14:15 (retroactive)
        Push to employee: "ლოკაცია დამტკიცდა — ცვლა იწერება"
```

### Sequence #3: Mock GPS Attempt
```
09:00 — Employee opens app from home (50km away from office).
        App: Mock GPS detected (CLLocation.isFromMockProvider = true).
        UI: red banner "Mock GPS აღმოჩენილია — ცვლა ვერ დაიწყება"
        Push to admin: "ALERT: დათო ალადაშვილი — Mock GPS attempt"
        Backend: log incident, increment counter.
        Action: block shift_start, require physical verification or admin override.
```

---

## ✅ Pre-flight Checklist (Claude-მ ეს უნდა გადაამოწმოს ნებისმიერი UI ცვლილების წინ)

### Visual (KAYA)
- [ ] KAYA blue `#1565C0` ერთადერთი primary accent
- [ ] არ არის hardcoded hex (გარდა decorative SVG-ის შიგნით)
- [ ] არ არის `dark:*` Tailwind utility
- [ ] Status colors მხოლოდ light variants (bg-50, text-700, border-200)
- [ ] 5-zone layout (web app pages)
- [ ] Border radius: 4px (buttons), 6/8px (inputs/cards), full (pills)
- [ ] Base font 13px, scale 20/16/14/12/11
- [ ] Tabular-nums ციფრებზე

### Geofence logic
- [ ] რადიუსი მაინც 200მ ფაქტობრივად (UI ჩვენებს რასაც user აყენებს, backend uses max(requested, 200))
- [ ] Hysteresis: 30s entry / 60s exit
- [ ] Accuracy buffer (radius + accuracy/2 effective check)
- [ ] Photo verification trigger თუ outside geofence OR poor accuracy OR first-time
- [ ] Mock GPS detection + automatic admin alert
- [ ] Manual location flow: employee submits provisional → admin approves

### Mobile UX
- [ ] Push notification triggers: approaching (200m), entering, dwell confirmed, exiting, mock detected
- [ ] Offline mode: pings cached, sync on reconnect
- [ ] Battery: motion-based tracking on/off
- [ ] Permissions onboarding: Always-on location explained clearly
- [ ] Foreground Service notification (Android API 26+)

---

## 🚨 აკრძალულია (PR rejected)

1. **არ გამოიყენო რადიუსი < 50მ** UI-ში — false trigger გარანტირებული
2. **არ გააკეთო** "Start Shift" manual button-ი როგორც primary flow — geofence ENTRY = automatic
3. **არ ანიჭო employee-ს** ნებართვა შექმნას/ჩამოაგდოს location პირდაპირ — admin approval სავალდებულო
4. **არ აჩვენო** Mock GPS warning ისე, რომ legitimate user-ი იფიქროს, რომ ბრალდებულია — banner უნდა იყოს ნეიტრალური ("ვერ ვამოწმებთ თქვენს ლოკაციას, სცადეთ თავიდან")
5. **არ მოვითხოვო ფოტო** ყოველდღიური check-in-ისთვის — მხოლოდ exception case
6. **არ წავშალოთ** პოლიგონური (polygon) გეოღობეების support-ი — შენობების კომპლექსებისთვის სავალდებულოა
7. **არ გადახედო** Apple-ის 200მ მინიმუმს iOS native API-სთვის — workaround უნდა იყოს client-side hit-testing

---

ფაილი დასრულდა. v2.0 · 2026-05-11.
