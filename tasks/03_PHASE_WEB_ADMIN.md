# Phase 2 — Web Admin (Week 4-6)

> **Goal:** Full web admin functional — dashboard, users, locations, reports.
> **Effort:** ~100 hours
> **Prerequisites:** Phase 1 complete (auth working).

---

## 🎯 Overview

ამ ფაზის ბოლოს admin-ს შეუძლია:
- ✅ Dashboard-ის ნახვა (metrics + live map + active users)
- ✅ Users-ის მართვა (table, filter, invite, edit)
- ✅ Locations-ის შექმნა Map mode-ით + Address mode-ით
- ✅ Two-zone configuration (Trigger + Boundary)
- ✅ Reports-ის ნახვა (charts + tables)
- ✅ Settings-ი (company profile)

---

## 📋 Tasks

### Task 2.1 — App Shell (TopBar + Sidebar)

**Goal:** KAYA 5-zone layout for all authenticated pages.

**Files to create:**
- `apps/web/app/(app)/layout.tsx` — shell wrapper
- `apps/web/components/layout/TopBar.tsx`
- `apps/web/components/layout/Sidebar.tsx`
- `apps/web/components/layout/SubHeader.tsx`

**References:**
- Mockup: `reference/designs/11_dashboard.png`
- Design rules: `reference/DESIGN_RULES.md` § 5-Zone Layout

**Acceptance criteria:**
- [ ] TopBar 48px with workspace badge (left) + utils (right)
- [ ] Sidebar 220px with mode pill + sections + footer
- [ ] Active nav item: solid accent bg + white text
- [ ] Logout from user menu

**Commit:** `feat(web): add app shell layout (topbar + sidebar)`

---

### Task 2.2 — Dashboard Page

**Goal:** `/dashboard` with 4 metric cards + live map + active users list.

**Files to create:**
- `apps/web/app/(app)/dashboard/page.tsx`
- `apps/web/components/dashboard/MetricCard.tsx`
- `apps/web/components/dashboard/LiveMap.tsx`
- `apps/web/components/dashboard/ActiveUsersList.tsx`

**References:**
- Mockup: `reference/designs/11_dashboard.png`

**Acceptance criteria:**
- [ ] 4 metric cards (active shifts, distance, visits, alerts)
- [ ] Live map shows current user pins (Mapbox)
- [ ] Active users list with avatars + duration
- [ ] All data fetched server-side, then hydrated to client realtime

**Commit:** `feat(web): add dashboard with metrics and live map`

---

### Task 2.3 — Users Management Page

**Goal:** `/users` with table, filter, invite, edit, deactivate.

**Files to create:**
- `apps/web/app/(app)/users/page.tsx`
- `apps/web/components/users/UsersTable.tsx`
- `apps/web/components/users/InviteUserDialog.tsx`
- `apps/web/components/users/EditUserDialog.tsx`

**References:**
- Mockup: `reference/designs/13_users.png`

**Acceptance criteria:**
- [ ] Table with: avatar, name, group, role, status, last active
- [ ] Filter pills: All / Active / Suspended / Pending
- [ ] Search by name/email
- [ ] Invite dialog opens, sends invitation
- [ ] Edit dialog allows role/group change
- [ ] Deactivate user (soft delete)

**Commit:** `feat(web): add users management with table and filters`

---

### Task 2.4 — Locations List Page

**Goal:** `/locations` with table view + list-detail split.

**Files to create:**
- `apps/web/app/(app)/locations/page.tsx`
- `apps/web/components/locations/LocationsList.tsx`
- `apps/web/components/locations/LocationDetailPanel.tsx`

**References:**
- Mockup: `reference/designs/12_locations.png`

**Acceptance criteria:**
- [ ] Split view: list (left) + detail (right)
- [ ] List shows: name, category, radius, assigned groups, status
- [ ] Detail shows: map preview, trigger + boundary radii, edit/delete buttons
- [ ] Empty state for no locations
- [ ] "+ ახალი ლოკაცია" CTA

**Commit:** `feat(web): add locations list with detail panel`

---

### Task 2.5 — Create Location (Map Mode)

**Goal:** `/locations/new` with draggable pin on Mapbox.

**Files to create:**
- `apps/web/app/(app)/locations/new/page.tsx`
- `apps/web/components/locations/LocationCreateMap.tsx`
- `apps/web/components/locations/LocationCreateForm.tsx`
- `apps/web/app/(app)/locations/new/create-action.ts`

**References:**
- Mockup: `reference/designs/21_location_create.png`
- Design rules: `reference/GEOFENCE_DESIGN_RULES.md` § Two-Zone Architecture

**Implementation notes:**
- Use `mapbox-gl` for map (already installed Phase 0)
- Draggable marker → updates lat/lng in form
- Two radius sliders: Trigger (50-300m) + Boundary (100-1500m)
- Validate: Trigger ≤ Boundary (Zod refine)
- Show both circles on map with different colors (KAYA blue + amber)

**Acceptance criteria:**
- [ ] Mapbox renders Tbilisi centered
- [ ] Pin draggable → form lat/lng updates
- [ ] Both geofence circles visible
- [ ] Trigger ≤ Boundary enforced
- [ ] Save creates location with PostGIS geom
- [ ] Redirect to `/locations` on success

**Commit:** `feat(web): add location creation with mapbox draggable pin`

---

### Task 2.6 — Create Location (Address Mode)

**Goal:** Same form, but address search via Mapbox Geocoding API.

**Files to modify:**
- `apps/web/components/locations/LocationCreateForm.tsx` — add tab switcher

**Implementation:**
- Search input → Mapbox Geocoding API → dropdown of results
- Selecting result → moves pin on map + auto-fills address
- Tabs: "რუკაზე" / "მისამართით" — same form below

**Acceptance criteria:**
- [ ] Tab switcher works
- [ ] Address search returns Georgian results (set `language=ka` in API)
- [ ] Click result → pin moves
- [ ] Manual pin drag still works

**Commit:** `feat(web): add address search for location creation`

---

### Task 2.7 — Work Zone Configuration

**Goal:** Dedicated page for editing Trigger + Boundary zones.

**Files to create:**
- `apps/web/app/(app)/locations/[id]/work-zone/page.tsx`
- `apps/web/components/locations/WorkZoneConfig.tsx`

**References:**
- Mockup: `reference/designs/30_web_work_zone.png`

**Acceptance criteria:**
- [ ] Split: config form (left) + visual map (right)
- [ ] Both circles editable independently
- [ ] Toggles: ENTRY → SHIFT_START, EXIT → SHIFT_END
- [ ] Hysteresis values configurable (30s / 60s default)
- [ ] Save updates DB + reactivates geofences for assigned users

**Commit:** `feat(web): add work zone configuration page`

---

### Task 2.8 — Reports Page

**Goal:** `/reports` with charts and exportable tables.

**Files to create:**
- `apps/web/app/(app)/reports/page.tsx`
- `apps/web/components/reports/HoursChart.tsx`
- `apps/web/components/reports/LocationVisitsTable.tsx`

**References:**
- Mockup: `reference/designs/14_reports.png`

**Implementation:**
- Use `recharts` for bar chart (install: `pnpm add recharts`)
- Date range picker (default: last 30 days)
- 4 metric cards at top
- Bar chart: hours per user
- Top locations table

**Acceptance criteria:**
- [ ] Charts render correctly
- [ ] Date filter updates all data
- [ ] CSV export button (just stub for now)

**Commit:** `feat(web): add reports page with charts`

---

### Task 2.9 — Settings Page

**Goal:** `/settings` — company profile, notification preferences, billing link.

**Files to create:**
- `apps/web/app/(app)/settings/page.tsx`
- `apps/web/components/settings/CompanyProfileForm.tsx`
- `apps/web/components/settings/NotificationSettings.tsx`

**Acceptance criteria:**
- [ ] Edit company name, logo, address
- [ ] Toggle notification types (push, email)
- [ ] Link to billing (will work in Phase 5)
- [ ] Admin-only — employees see "no access"

**Commit:** `feat(web): add settings page`

---

### Task 2.10 — Provisional Locations Inbox

**Goal:** Admin reviews employee-submitted ad-hoc locations.

**Files to create:**
- `apps/web/app/(app)/locations/pending/page.tsx`
- `apps/web/components/locations/ProvisionalCard.tsx`

**References:**
- Mockup: `reference/designs/27_provisional_inbox.png`

**Acceptance criteria:**
- [ ] 3-column grid of pending submissions
- [ ] Each card: photo + employee + location name + map preview
- [ ] Approve button (creates permanent location)
- [ ] Reject button (with optional reason)
- [ ] Empty state when no pending

**Commit:** `feat(web): add provisional locations approval inbox`

---

## ✅ Phase 2 Complete Checklist

- [ ] Dashboard shows real data from DB
- [ ] Users CRUD works end-to-end
- [ ] Locations created with both Trigger + Boundary zones stored as PostGIS
- [ ] Work zone configuration page edits existing locations
- [ ] Reports show data from shifts table
- [ ] Settings update tenant
- [ ] All pages mobile-responsive (test on iPhone width)
- [ ] All forms use Zod validation
- [ ] Loading + Empty + Error states for all data fetches

**🎉 Move to Phase 3: `04_PHASE_MOBILE_EMPLOYEE.md`**
