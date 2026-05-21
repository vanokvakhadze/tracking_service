# TrackPro Demo Video Script — 90s

> Production script for the S1 demo video. Loom or Screen Studio.
> ბოლო განახლება: 2026-05-21

რა არის ეს ფაილი: scene-by-scene storyboard + voiceover script + B-roll instructions + 4 vertical variations. ღია ფაილი → ჩაირთე ეკრანი → ჩაწერე.

---

## 🎬 Master script (vertical-agnostic, 90s)

**Aspect ratio:** 16:9 (1920×1080)
**Voiceover lang:** Georgian
**Subtitles:** Georgian (burned in, since LinkedIn/Twitter auto-play muted)
**Music:** Epidemic Sound — "Boardroom" tempo ~110bpm (calm, professional, no vocals)
**Pacing:** ~150 words/min for Georgian VO → ~225 words total

### Scene 1 — Hook (0:00–0:10) · 10 sec

**Visual:**
- Open with 1-second black-screen + brand logo fade-in
- Cut to: Real photo or stock B-roll of a manager looking at empty desk / phone showing "Where is my team?" text
- Lower-third caption: "ცარა მენეჯერი — დილის 9 საათი"

**Voiceover:**
> "დილის 9 საათია. შენი 12 თანამშრომელი სად არის?
> Excel-ში დროის ცხრილი ვერ გეუბნება — როცა გადახდის თარიღი მოვა, კონფლიქტი წარმოიქმნება."

**B-roll alternatives:**
- Empty office desk + ringing phone
- Stock footage of confused manager
- Animated "?" pulsing over generic office

---

### Scene 2 — Solution intro (0:10–0:25) · 15 sec

**Visual:**
- Cut to: TrackPro logo animation (1s)
- Then: /dashboard live → show 4 metric cards + live map with active employee dots pulsing
- Hover over an employee dot → mini-popup with name + location appears

**Voiceover:**
> "TrackPro-ი GPS-ით თვალს ადევნებს გუნდს — რეალურ დროში.
> ლოკაცია, საათები, მანძილი — ერთ ეკრანზე."

**Screen instruction:**
- Recording: login as `review@trackpro.ge` first → land on /dashboard
- Make sure Mapbox token is set so map renders
- Wait 2s on the dashboard view → smooth zoom into map → 1 employee dot

---

### Scene 3 — Live map walkthrough (0:25–0:40) · 15 sec

**Visual:**
- Navigate to `/live-map` (post task.052 redesign)
- Show left panel (tracker list) → middle (map with 3 location pins + 2-3 active employees) → right panel (selected employee details)
- Click a tracker in the list → map centers + right panel populates with name, dwell time, battery, timeline

**Voiceover:**
> "თითო თანამშრომელი ცოცხალი რუკაზე ჩანს. ცვლის დაწყებიდან დასრულებამდე ყველა მოძრაობა — ავტომატური."

**Screen instruction:**
- Pre-stage: seed demo with 2 active shifts using mobile (Expo Go) so live data renders
- Alternative: pre-record a screencast separately and cut in

---

### Scene 4 — Reports + alerts (0:40–0:60) · 20 sec

**Visual:**
- Cut to `/reports` (post task.055 redesign)
- Show: 4 metric cards with sparklines → hero chart → bottom: ShiftsTable with 30-day rows
- Click "ექსპორტი (CSV)" → file downloads animation
- Quick cut to `/alerts` (post task.053): show 2-3 alert cards (Mock GPS critical, low battery warning)

**Voiceover:**
> "ცვლების სრული რეპორტი ნებისმიერ დროს. CSV-ით ბუღალტერიასაც გადააწოდე.
> ცრუ GPS-ი, დაბალი ბატარეა, სამუშაო ზონის გარეთ — ცარა-ცარა გაფრთხილება მიდის თქვენთან."

**Screen instruction:**
- Highlight the "ექსპორტი" button with mouse-circle effect (Loom feature)
- Quick zoom on a critical alert card

---

### Scene 5 — Mobile app teaser (0:60–0:75) · 15 sec

**Visual:**
- Side-by-side: iPhone + Android frames
- Show: employee login screen → home screen with "ცვლა მზადაა" → map tab with 3 location pins
- Then: simulate entering a zone (animated dot moves to pin) → "ცვლა დაიწყო" notification

**Voiceover:**
> "თანამშრომელი არაფერს აკეთებს. ლოკაციაში შესვლა — ცვლა იწყება. გასვლა — ცვლა მთავრდება. ფონური ტრექინგი ბატარეას იშურებს."

**Screen instruction:**
- Use Expo Go recording or iOS Simulator + Android Emulator
- If physical devices: prop both side-by-side on a desk
- Add caption text: "iOS + Android — ერთი workflow"

---

### Scene 6 — CTA (0:75–0:90) · 15 sec

**Visual:**
- Cut back to landing page hero (https://tracking-service-web.vercel.app)
- Zoom out → URL bar visible
- Final card overlay:
  - **2 თვე უფასოდ — Beta program**
  - **trackpro.ge / signup**
  - Phone number + email (Sazeo contact)

**Voiceover:**
> "TrackPro — ქართული ბიზნესისთვის, ქართულ ენაზე. პირველი 5 ფირმისთვის — 2 თვე უფასოდ.
> დარეგისტრირდი ახლავე — trackpro.ge"

**Screen instruction:**
- End card stays for 3s minimum (post-VO) for viewer to read CTA
- Brand logo + URL clearly visible
- Optionally add QR code linking to /signup for mobile viewers

---

## 📝 Voiceover script — recording sheet

ბრძანო ცხელი ხმის ჩასაწერი ფაილი (read into Loom mic ან external):

```
[Scene 1 — 10s]
დილის 9 საათია. შენი 12 თანამშრომელი სად არის?
Excel-ში დროის ცხრილი ვერ გეუბნება — როცა გადახდის თარიღი მოვა, კონფლიქტი წარმოიქმნება.

[Scene 2 — 15s]
TrackPro-ი GPS-ით თვალს ადევნებს გუნდს — რეალურ დროში.
ლოკაცია, საათები, მანძილი — ერთ ეკრანზე.

[Scene 3 — 15s]
თითო თანამშრომელი ცოცხალი რუკაზე ჩანს. ცვლის დაწყებიდან დასრულებამდე ყველა მოძრაობა — ავტომატური.

[Scene 4 — 20s]
ცვლების სრული რეპორტი ნებისმიერ დროს. CSV-ით ბუღალტერიასაც გადააწოდე.
ცრუ GPS-ი, დაბალი ბატარეა, სამუშაო ზონის გარეთ — ცარა-ცარა გაფრთხილება მიდის თქვენთან.

[Scene 5 — 15s]
თანამშრომელი არაფერს აკეთებს. ლოკაციაში შესვლა — ცვლა იწყება. გასვლა — ცვლა მთავრდება. ფონური ტრექინგი ბატარეას იშურებს.

[Scene 6 — 15s]
TrackPro — ქართული ბიზნესისთვის, ქართულ ენაზე. პირველი 5 ფირმისთვის — 2 თვე უფასოდ.
დარეგისტრირდი ახლავე — trackpro.ge
```

⚠️ Word count: ~165 Georgian words ≈ 90 sec @ 110 wpm (calm cadence). ცადო-ცადო recording-ი ცარა fast.

---

## 🎯 Vertical-specific variations

ერთხელ ცარა master 90s. ცარა-ცარა 4 versions (10-15 sec each) replace Scene 1 hook + Scene 4 alerts + Scene 6 CTA with vertical-specific copy. Total: 4 alt openings + 4 alt CTAs.

### Variation A — Delivery / Logistics

**Scene 1 hook (10s):**
> "Courier-ი 8 საათი დღეზე ცარა — რეალურად 4 საათი იყო ცოცხალი. ცარა გადახდის თვალს — ცარა."

**Scene 4 alerts emphasis (20s):**
> "ცარა client visit ცარა-ცარა miss? Two-zone geofencing-ი — pickup + dropoff. ცრუ GPS detection-ი — fake routes-ი ცარა-ცარა მუშავდე."

**Scene 6 CTA (15s):**
> "Glovo + Wolt + ცარა courier startup-ი ცარა-ცარა TrackPro-ი. 2 თვე უფასოდ — trackpro.ge"

### Variation B — Construction

**Scene 1 hook:**
> "30 თანამშრომელი 5 site-ზე. ცარა ცარა attendance fraud-ი? ცარა-ცარა Excel-ი."

**Scene 4 emphasis:**
> "თანამშრომელი ცარა-ცარა ცარა site-ი დაცემო — provisional location-ი ცარა-ცარა admin approval-ისთვის. ფიქტიური საათები ცარა-ცარა."

**Scene 6 CTA:**
> "Construction firms-ი — site-ი ცარა, საათები ცარა, regulatory compliance-ი ცარა. trackpro.ge"

### Variation C — Security Services

**Scene 1 hook:**
> "Guard-ი night shift-ში დაიკარგა. ცარა-ცარა ცარა, ცარა-ცარა event-ი მოხდა — ცარა იყო?"

**Scene 4 emphasis:**
> "Patrol verification-ი — guard-ი ცარა zone-ი ცარა-ცარა exit-ი, immediate alert-ი admin-ისთვის. Low battery + offline detection-ი — security gap-ი ცარა-ცარა."

**Scene 6 CTA:**
> "Securpol + ProSec + ცარა security firm-ი ცარა-ცარა TrackPro-ი. trackpro.ge"

### Variation D — FMCG Distribution

**Scene 1 hook:**
> "Sales rep-ი 12 store-ი ცარა ვიზიტი, რეალურად 4-ში იყო. Territory coverage-ი ცარა-ცარა."

**Scene 4 emphasis:**
> "Visit count per location, dwell time per client. Territory optimization-ი ცარა-ცარა CSV export-ით."

**Scene 6 CTA:**
> "ცარა distributor-ი — PepsiCo, Mondelez, local territory-ი — TrackPro-ი ცარა-ცარა. trackpro.ge"

---

## 🛠 Pre-recording checklist

ცარა Loom ჩართვის წინ:

### Environment
- [ ] Browser zoom 100% (Cmd/Ctrl+0)
- [ ] Close all tabs except: dashboard, live-map, reports, alerts, mobile demo
- [ ] Hide bookmarks bar
- [ ] Use Incognito window (clean state)
- [ ] Login: `review@trackpro.ge` / `ReviewMe2026!`
- [ ] Pre-stage seeded data via `pnpm seed:demo`
- [ ] Start 2 active shifts via mobile (Expo Go) so live map has dots
- [ ] Confirm Mapbox token works (map renders, not gray)

### Hardware
- [ ] External mic if available (built-in laptop mic is OK for 90s)
- [ ] Quiet room
- [ ] Stable internet (avoid lag on /live-map realtime)

### Loom settings
- [ ] **Camera off** (screen only for v1; founder face video can come later)
- [ ] **Mic on** — test 5s recording first to check audio level
- [ ] **Cursor highlights** ON (visible click ripples)
- [ ] **Resolution** 1080p
- [ ] **Frame rate** 30fps minimum

### Post-recording
- [ ] Trim dead air at start/end
- [ ] Add Georgian subtitles (Loom has auto-caption — review for accuracy)
- [ ] Add CTA card overlay in last 5s (Loom feature ან external editor)
- [ ] Export 1080p mp4
- [ ] Upload to YouTube (unlisted at first)
- [ ] Embed on `/` landing page hero (1-line change in marketing page)
- [ ] Share URL in outreach templates ([BETA_OUTREACH.md](BETA_OUTREACH.md))

---

## 🎬 Production timeline

| Week | Task |
|---|---|
| W1 day 1 | Read this script, gather assets (logo, music license) |
| W1 day 2 | Pre-stage demo data + mobile shifts |
| W1 day 3 | Record master 90s VO — 3-5 takes |
| W1 day 4 | Record screen B-roll for all 6 scenes |
| W1 day 5 | Edit: assemble VO + B-roll + music + subtitles in Loom/CapCut |
| W1 day 6 | 4 vertical variations (record only alt hooks + CTAs, paste into base) |
| W1 day 7 | Upload to YouTube, embed on `/`, distribute via outreach |

Total time investment: ~6-8 hours founder time across 1 week.

---

## 📊 Distribution + metrics

### Where to post
- YouTube (primary) — searchable, embeddable, long-form Stripe Customer Portal-ში
- LinkedIn — post + 1-week boost (50 GEL budget) targeting decision-makers (HR/Ops Manager + Founder)
- Email signature (founder email)
- Embed on `/` landing hero
- WhatsApp Business profile / Telegram

### Metrics to track
- View count + retention curve (where do they drop off?)
- CTA click-through to `/signup`
- Demo-call book rate (Calendly link in description)

---

## 🔗 დაკავშირებული რესურსები

- [BETA_OUTREACH.md](BETA_OUTREACH.md) — sales playbook (where this video is distributed)
- [STORE_METADATA.md](STORE_METADATA.md) — App Store / Play Console — also reusable description copy
- [tasks/reference/designs/](reference/designs/) — visual reference for B-roll
- [tasks/reference/DESIGN_RULES.md](reference/DESIGN_RULES.md) — KAYA brand colors for end card overlay
- Live demo credentials: `review@trackpro.ge` / `ReviewMe2026!`
- Loom: https://loom.com (free tier: 5min videos, 25 videos/lifetime — enough)
- Music license: Epidemic Sound (Loom integration), or YouTube Audio Library (free)

---

ფაილი დასრულდა. ცადო post-recording, update-ცა actual YouTube URL ცარა.
