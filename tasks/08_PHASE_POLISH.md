# Phase 7 — Polish + Beta Launch (Week 14)

> **Goal:** Production-ready, app stores submitted, first 5 beta customers.
> **Effort:** ~50 hours
> **Prerequisites:** Phases 0-6 complete.

---

## 🎯 Overview

ეს არის ფინალური sprint-ი. **არ skip-ი polish-ი** — first impression-ი წყვეტს trial→paid conversion-ს.

ბოლოს:
- ✅ Loading / Empty / Error states ყველა screen-ისთვის
- ✅ Accessibility audit (WCAG AA)
- ✅ iOS App Store submitted
- ✅ Google Play Store submitted
- ✅ Marketing site live (`trackpro.ge`)
- ✅ Pricing page polished
- ✅ Demo video recorded
- ✅ Onboarding docs (KA + EN)
- ✅ 5 beta customers onboarded

---

## 📋 Tasks

### Task 7.1 — Loading States Audit

**Goal:** Every data fetch has loading skeleton, not blank screen.

**Files to modify:**
- All `apps/web/app/(app)/**/page.tsx`
- All `apps/mobile/src/screens/**/*.tsx`

**Implementation:**

Create skeleton components:
```tsx
// apps/web/components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-[var(--color-surface-2)]',
        className,
      )}
    />
  )
}
```

Use in pages:
```tsx
// Example: app/(app)/locations/page.tsx
import { Suspense } from 'react'

export default function LocationsPage() {
  return (
    <div>
      <Suspense fallback={<LocationsListSkeleton />}>
        <LocationsList />
      </Suspense>
    </div>
  )
}

function LocationsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] Every page with data fetch has skeleton
- [ ] Mobile: Native `ActivityIndicator` or skeleton
- [ ] Skeleton matches actual layout (no layout shift)
- [ ] Animation is gentle pulse (1.2s)

**Commit:** `feat(ui): add loading skeletons across all pages`

---

### Task 7.2 — Empty States Audit

**Goal:** Every list has empty state with CTA.

**Implementation:**

Create reusable component:
```tsx
// apps/web/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

Use in every list:
```tsx
{locations.length === 0 ? (
  <EmptyState
    icon={<MapPin />}
    title="ჯერ არ შექმენი ლოკაცია"
    description="დაამატე პირველი სამუშაო ლოკაცია, რომ employees-ის ცვლა ავტომატურად იწერებოდეს"
    action={{ label: '+ ახალი ლოკაცია', href: '/locations/new' }}
  />
) : (
  <LocationsList items={locations} />
)}
```

**Empty states checklist:**
- [ ] Locations (no locations created)
- [ ] Users (no users invited)
- [ ] Reports (no data yet)
- [ ] History (no shifts yet)
- [ ] Alerts (no alerts)
- [ ] Provisional (no pending approvals)
- [ ] Audit log (no events)

**Commit:** `feat(ui): add empty states across all lists`

---

### Task 7.3 — Error States Audit

**Goal:** Every async operation has error handling + retry.

**Implementation:**

Global error boundary:
```tsx
// apps/web/app/error.tsx
'use client'

import { Button } from '@/components/ui/Button'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">რაღაც დაარღვია</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          ჩავწერეთ შეცდომა. სცადე თავიდან.
        </p>
        <Button onClick={reset} className="mt-4">სცადე თავიდან</Button>
      </div>
    </div>
  )
}
```

Mobile error boundary:
```tsx
// apps/mobile/src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Sentry from '@sentry/react-native'

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>რაღაც დაარღვია</Text>
          <Text style={styles.subtitle}>აპლიკაცია გადატვირთეთ</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.button}>სცადე თავიდან</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 4 },
  button: { color: '#1565C0', fontSize: 14, fontWeight: '600', marginTop: 16 },
})
```

**Acceptance criteria:**
- [ ] Global error boundary catches uncaught errors
- [ ] All `fetch`/`supabase` calls have try/catch
- [ ] Network errors show retry button
- [ ] Errors logged to Sentry with context
- [ ] Toast/banner for non-fatal errors

**Commit:** `feat(ui): add error boundaries and retry logic`

---

### Task 7.4 — Accessibility Audit

**Goal:** WCAG AA compliance.

**Tools:**
- axe DevTools (Chrome extension)
- React Native Accessibility Inspector

**Checklist:**
- [ ] All interactive elements keyboard-accessible (Tab/Enter)
- [ ] Focus visible on all elements (2px ring)
- [ ] All buttons have `aria-label` or text
- [ ] Form inputs have `<label>`
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Icons decorative → `aria-hidden`
- [ ] Icons informative → `aria-label`
- [ ] Modal dialogs trap focus
- [ ] Skip-to-content link
- [ ] Lang attribute set: `<html lang="ka">`

**Implementation:**
- Run axe DevTools on every authenticated page
- Fix violations one by one
- Test with keyboard only (no mouse)
- Test with VoiceOver (Mac) / TalkBack (Android)

**Commit:** `fix(a11y): wcag aa compliance fixes`

---

### Task 7.5 — Mobile App Icons & Splash

**Goal:** Branded launch experience.

**Files to create:**
- `apps/mobile/assets/icon.png` (1024x1024)
- `apps/mobile/assets/adaptive-icon.png` (Android)
- `apps/mobile/assets/splash.png`
- Configured in `app.json`

**Implementation:**

Create icons using Figma or any design tool:
- App icon: KAYA blue background + white "T"
- Splash: White background + centered logo
- Notification icon: White silhouette

Update `app.json`:
```json
{
  "expo": {
    "name": "TrackPro",
    "slug": "trackpro",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1565C0"
    },
    "ios": {
      "bundleIdentifier": "io.sazeo.trackpro",
      "buildNumber": "1"
    },
    "android": {
      "package": "io.sazeo.trackpro",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1565C0"
      }
    }
  }
}
```

**Acceptance criteria:**
- [ ] Icon visible on iOS home screen
- [ ] Icon visible on Android launcher
- [ ] Splash shows for 1-2 seconds
- [ ] Adaptive icon rounded correctly

**Commit:** `chore(mobile): add app icons and splash screen`

---

### Task 7.6 — iOS App Store Submission

**Goal:** App available on App Store.

**Prerequisites:**
- Apple Developer enrollment ($99/year)
- App Store Connect access

**Implementation:**

1. **Build production:**
```bash
cd apps/mobile
eas build --platform ios --profile production
```

2. **App Store Connect setup:**
   - Apps → + → New App
   - Name: TrackPro
   - Bundle ID: io.sazeo.trackpro
   - SKU: trackpro-v1

3. **App information:**
   - Description (Georgian + English)
   - Keywords: GPS, time tracking, employee, geofence, საქართველო
   - Support URL: https://trackpro.ge/support
   - Privacy policy URL: https://trackpro.ge/privacy

4. **Screenshots:**
   - iPhone 6.7" (3 screenshots minimum)
   - iPhone 5.5" (3 screenshots minimum)
   - Take from real device or simulator

5. **App Privacy:**
   - Location: "Used to track work hours" — required
   - Photos: "Optional location verification"

6. **Build upload via EAS**

7. **Submit for review**

**⚠️ Common rejection reasons:**
- Missing privacy policy
- Background location not justified well
- Crash on launch (test thoroughly)
- Demo account required → provide test credentials

**Acceptance criteria:**
- [ ] App icon shown in App Store Connect
- [ ] Screenshots uploaded
- [ ] Submitted for review
- [ ] Review status: "Waiting for Review"

**Commit:** N/A (cloud operations)

---

### Task 7.7 — Google Play Submission

**Goal:** App available on Google Play.

**Prerequisites:**
- Google Play Console ($25 one-time)

**Implementation:**

1. **Build production:**
```bash
eas build --platform android --profile production
```

2. **Play Console:**
   - All apps → Create app
   - App name: TrackPro
   - Default language: ka-GE

3. **Store listing:**
   - Short description: "GPS-ის თანამშრომლების ტრექინგი"
   - Full description (Georgian + English)
   - Graphics: hi-res icon (512x512), feature graphic (1024x500)
   - Screenshots: 4 minimum

4. **Content rating:**
   - Fill questionnaire
   - Should be: Everyone

5. **Privacy policy URL**

6. **Background location justification:**
   - Required for foreground service
   - Explain "Track work shifts while on duty"

7. **Upload AAB via EAS**

8. **Submit for review** (usually 1-3 days)

**Acceptance criteria:**
- [ ] All listing fields filled
- [ ] AAB uploaded
- [ ] Background location permission explained
- [ ] Submitted for review

**Commit:** N/A (cloud operations)

---

### Task 7.8 — Marketing Site

**Goal:** Public `trackpro.ge` landing page.

**Files to create:**
- `apps/web/app/(marketing)/page.tsx` — landing
- `apps/web/app/(marketing)/features/page.tsx`
- `apps/web/app/(marketing)/pricing/page.tsx` (already done in Phase 5)
- `apps/web/app/(marketing)/about/page.tsx`
- `apps/web/app/(marketing)/privacy/page.tsx`
- `apps/web/app/(marketing)/terms/page.tsx`

**Landing page sections:**
1. Hero: KAYA blue gradient, headline, CTA, app screenshot
2. Features (4-6 cards): Auto-tracking, Geofencing, Route planning, Reports
3. How it works (3 steps): Install → Track → Report
4. Pricing preview
5. Testimonials (after first customers)
6. Footer: Links, contact, social

**Acceptance criteria:**
- [ ] Landing page loads in <2s
- [ ] Mobile-responsive
- [ ] Georgian-first, English fallback
- [ ] SEO meta tags + OG image
- [ ] Working contact form
- [ ] Privacy + Terms pages legally sound

**Commit:** `feat(marketing): add public landing pages`

---

### Task 7.9 — Demo Video

**Goal:** 90-second product video for sales.

**Tools:**
- Loom (free) or ScreenStudio
- Real iPhone + Android device
- iOS Simulator + Android Emulator (record screen)

**Storyboard:**
1. (0-10s) Problem: "თანამშრომლები — სად არიან?"
2. (10-30s) Solution: Show admin creating location, employees auto-tracking
3. (30-60s) Features showcase: dashboard, alerts, reports
4. (60-80s) Pricing teaser
5. (80-90s) CTA: "დაარეგისტრირე უფასოდ — trackpro.ge"

**Implementation:**
- Use designs as reference for screen flow
- Add Georgian voiceover or text subtitles
- Background music (Epidemic Sound — free with Loom)
- Export 1080p mp4

**Acceptance criteria:**
- [ ] Video <90s
- [ ] Shows real product (no mockups)
- [ ] Uploaded to YouTube + embedded on landing
- [ ] Subtitles in Georgian

**Commit:** `chore(marketing): add demo video`

---

### Task 7.10 — Onboarding Documentation

**Goal:** Self-service docs for new customers.

**Files to create:**
- `apps/web/app/(marketing)/docs/page.tsx` — index
- `apps/web/app/(marketing)/docs/[slug]/page.tsx` — content
- `content/docs/getting-started.mdx`
- `content/docs/locations.mdx`
- `content/docs/team-management.mdx`
- `content/docs/troubleshooting.mdx`

**Topics (Georgian + English):**
1. **დაიწყე** — register, invite first user, create first location
2. **ლოკაცია** — what is geofence, two-zone explained, radius best practices
3. **გუნდი** — invite, roles, deactivate
4. **მობილური** — permissions, battery whitelist, troubleshooting
5. **ბილინგი** — plans, upgrade, cancel
6. **FAQ**

Use `next-mdx-remote` for rendering.

**Acceptance criteria:**
- [ ] At least 8 docs published
- [ ] Search functional
- [ ] Both languages
- [ ] Screenshots inline
- [ ] Linked from app help menu

**Commit:** `feat(docs): add onboarding documentation`

---

### Task 7.11 — Beta Customer Onboarding

**Goal:** First 5 customers onboarded with white-glove support.

**Process:**
1. **Identify candidates** — Georgian businesses with field employees:
   - Delivery services (Glovo competitors, local food delivery)
   - Construction companies
   - Security firms
   - Sales teams (FMCG distribution)

2. **Outreach** (Direct sales for first customers):
   - Cold email / LinkedIn
   - Offer: 3 months free in exchange for testimonial + feedback

3. **Demo call (30 min):**
   - Show video
   - Live demo with their data
   - Answer questions
   - Setup their tenant manually if needed

4. **Onboarding:**
   - Help create first 3-5 locations
   - Invite their team
   - Walk through admin features
   - Setup notification preferences

5. **Weekly check-ins** for 4 weeks:
   - Friday calls: "what worked, what didn't"
   - Quick fixes within 48h
   - Feature requests → roadmap

**Acceptance criteria:**
- [ ] 5 beta customers signed
- [ ] All actively using daily
- [ ] First testimonial collected
- [ ] Bug list compiled
- [ ] At least 1 paying customer at end of beta

**Commit:** N/A (business operation)

---

### Task 7.12 — Monitoring & Alerts Setup

**Goal:** Know when production breaks before customers tell you.

**Implementation:**

**Sentry alerts:**
- New issue → Slack/email
- Error rate spike (>50/hour) → SMS

**Vercel monitoring:**
- Uptime → SMS on downtime
- Deploy failures → email

**Supabase alerts:**
- Database CPU >80% → email
- Connection pool exhausted → SMS

**Custom dashboard:**
- PostHog: DAU, signups, conversions
- Daily email summary

**Acceptance criteria:**
- [ ] At least 3 alert channels configured
- [ ] Test alerts received
- [ ] Daily summary email working
- [ ] Status page (optional): status.trackpro.ge

**Commit:** `chore(monitoring): setup production alerts`

---

## ✅ Phase 7 Complete Checklist

**Product:**
- [ ] Every screen has loading + empty + error states
- [ ] WCAG AA compliance verified
- [ ] No console errors in production build

**Distribution:**
- [ ] iOS app submitted to App Store
- [ ] Android app submitted to Play Store
- [ ] Apps approved (waits ~1 week)

**Marketing:**
- [ ] `trackpro.ge` live with landing
- [ ] Pricing page live
- [ ] Privacy + Terms published
- [ ] Demo video on YouTube

**Customer:**
- [ ] 5 beta customers actively using
- [ ] First testimonial collected
- [ ] First paying customer

**Operations:**
- [ ] Sentry catching errors
- [ ] Uptime monitoring active
- [ ] Daily metrics email

---

# 🎉 MVP SHIPPED

## What's Next (Post-MVP)

After 14-week MVP, prioritize based on customer feedback:

**Quick wins (1-2 weeks each):**
- CSV export of reports
- Polygon geofences (irregular shapes)
- Bulk user import (CSV upload)
- Custom shift schedules

**Medium (1 month each):**
- Time-off requests
- Team scheduling
- Slack / WhatsApp integration
- Mobile offline-first improvements

**Large (2-3 months each):**
- Public API for customers
- White-label option (Enterprise)
- AI-powered insights (anomaly detection)
- Multi-region expansion

---

## 📊 Success Metrics

**Month 1 (post-launch):**
- 10 trial signups
- 3 paying customers
- $50 MRR
- 0 critical bugs

**Month 3:**
- 30 trial signups
- 10 paying customers
- $500 MRR
- NPS >40

**Month 6:**
- 100 trial signups
- 30 paying customers
- $3,000 MRR
- NPS >50

**Year 1:**
- 100+ paying customers
- $15,000+ MRR
- Hire first employee (developer or sales)

---

**წარმატებები, გიორგი! 🚀**

ეს არის end of the task breakdown. ნებისმიერი task-ის შესახებ კითხვა — open Phase file, look at Task X.Y, follow workflow in `00_AI_AGENT_RULES.md`.
