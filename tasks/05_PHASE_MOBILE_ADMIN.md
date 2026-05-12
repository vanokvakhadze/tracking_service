# Phase 4 — Mobile Admin (Week 11)

> **Goal:** Admin gets parity with web on phone — dashboard, team, alerts, location creation.
> **Effort:** ~30 hours
> **Prerequisites:** Phase 2 (web admin) + Phase 3 (mobile foundation) complete.

---

## 🎯 Overview

ადმინს ხშირად სჭირდება ფილდში მუშაობა — ეს ფაზა აძლევს full mobile parity.

ბოლოს:
- ✅ Admin dashboard ფაბისთვის
- ✅ Live team map mobile-ში
- ✅ Alerts inbox
- ✅ Create location from phone (Map + Form, identical to web)
- ✅ Approve provisional locations

---

## 📋 Tasks

### Task 4.1 — Role-Based Navigation

**Goal:** Different tab bar for admin vs employee.

**Files to modify:**
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/navigation/AdminTabs.tsx` (new)
- `apps/mobile/src/navigation/EmployeeTabs.tsx` (new)

**Implementation:**
```typescript
// After login, check user.role
if (user.role === 'admin') {
  return <AdminTabs />
} else {
  return <EmployeeTabs />
}
```

Admin tabs: Dashboard / Map / Team / Alerts
Employee tabs: Home / Map / History / Profile

**Acceptance criteria:**
- [ ] Role detected from user profile
- [ ] Different tab bars render
- [ ] Switching role re-renders correctly

**Commit:** `feat(mobile): add role-based navigation`

---

### Task 4.2 — Admin Dashboard

**Goal:** Mobile-adapted dashboard.

**Files to create:**
- `apps/mobile/src/screens/admin/DashboardScreen.tsx`

**References:**
- Mockup: `reference/designs/06_admin_dashboard.png`

**Acceptance criteria:**
- [ ] KAYA blue hero card: "X/Y active"
- [ ] Live shift list (scrollable)
- [ ] Pull-to-refresh
- [ ] Realtime updates

**Commit:** `feat(mobile): add admin dashboard`

---

### Task 4.3 — Live Team Map

**Goal:** All team members on one map (admin view).

**Files to create:**
- `apps/mobile/src/screens/admin/TeamMapScreen.tsx`

**References:**
- Mockup: `reference/designs/07_admin_map.png`

**Acceptance criteria:**
- [ ] All assigned users' current locations shown
- [ ] Color-coded pins (active = blue, alert = red, warning = amber)
- [ ] Tap pin → bottom sheet with user details + quick actions
- [ ] Realtime updates via Supabase subscription

**Commit:** `feat(mobile): add live team map for admin`

---

### Task 4.4 — Team List Screen

**Goal:** Employee list with status filters.

**Files to create:**
- `apps/mobile/src/screens/admin/TeamListScreen.tsx`

**References:**
- Mockup: `reference/designs/08_admin_team.png`

**Acceptance criteria:**
- [ ] Sectioned list (Active / Alert / Warning / Offline)
- [ ] Each row: avatar, name, current location, duration, status badge
- [ ] Tap row → user detail screen
- [ ] Search bar

**Commit:** `feat(mobile): add team list screen`

---

### Task 4.5 — Alerts Inbox

**Goal:** All admin alerts (Mock GPS, battery low, out of zone, etc.)

**Files to create:**
- `apps/mobile/src/screens/admin/AlertsScreen.tsx`

**References:**
- Mockup: `reference/designs/09_admin_alerts.png`

**Acceptance criteria:**
- [ ] Critical alerts at top (Mock GPS, etc.) — red bg
- [ ] Warnings below — amber bg
- [ ] Each alert: type, user, time, quick action
- [ ] Swipe to dismiss
- [ ] Badge count in tab bar

**Commit:** `feat(mobile): add alerts inbox`

---

### Task 4.6 — Create Location from Mobile

**Goal:** Full location creation flow on phone.

**Files to create:**
- `apps/mobile/src/screens/admin/CreateLocationMapScreen.tsx`
- `apps/mobile/src/screens/admin/CreateLocationFormScreen.tsx`

**References:**
- Mockups: `28_admin_create_map.png`, `29_admin_create_form.png`

**Implementation:**
- Same logic as web (Task 2.5) but phone-sized
- Map with draggable pin (react-native-maps)
- Two tabs: "რუკაზე" / "მისამართით"
- Radius slider for trigger zone
- After save: navigate to form screen
- Form: name, address, category, target time, groups, notifications

**Acceptance criteria:**
- [ ] Map mode: draggable pin updates form lat/lng
- [ ] Address mode: search → result → pin moves
- [ ] Two-step flow (map → form)
- [ ] Save creates location identical to web
- [ ] Mobile admin status: `active` (NOT pending — admin authority)

**Commit:** `feat(mobile): add admin location creation flow`

---

### Task 4.7 — Work Zone Config Mobile

**Goal:** Edit Trigger + Boundary zones from phone.

**Files to create:**
- `apps/mobile/src/screens/admin/WorkZoneScreen.tsx`

**References:**
- Mockup: `reference/designs/31_mobile_work_zone.png`

**Acceptance criteria:**
- [ ] Compact map preview at top with nested circles
- [ ] Two cards (blue Trigger + amber Boundary) with sliders
- [ ] Info note about Trigger ≤ Boundary
- [ ] Save updates DB + reactivates geofences

**Commit:** `feat(mobile): add work zone configuration`

---

### Task 4.8 — Approve Provisional Locations

**Goal:** Admin approves/rejects employee-submitted locations.

**Files to create:**
- `apps/mobile/src/screens/admin/ApproveLocationScreen.tsx`

**References:**
- Mockup: `reference/designs/24_admin_approve.png`

**Acceptance criteria:**
- [ ] Photo preview at top
- [ ] Employee info card
- [ ] Submitted details
- [ ] Map preview with pending marker
- [ ] 3 buttons: Approve (green) / Allow once (gray) / Reject (red)
- [ ] After action → returns to inbox

**Commit:** `feat(mobile): add provisional location approval flow`

---

## ✅ Phase 4 Complete Checklist

- [ ] Admin can do everything from phone that web does
- [ ] Live team map updates in realtime
- [ ] Location creation works (map + form)
- [ ] Provisional approvals route to admin notifications
- [ ] All admin screens responsive on small phones (iPhone SE)
- [ ] Quick actions work (call employee, message)

**🎉 Move to Phase 5: `06_PHASE_BILLING.md`**
