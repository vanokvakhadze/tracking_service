# Codex Task Queue

> **წესი:** ერთი task → ერთი session → ერთი commit. **არ ისკიპო თანმიმდევრობა.**
>
> **Codex-ში გამოყენება:** გახსენი `task.NNN.md`, ჩაუგდე Codex-ში, თქვი:
> > Read `tasks/00_AI_AGENT_RULES.md` and `tasks/00_CONVENTIONS.md` first. Then implement `tasks/codex/task.NNN.md` exactly — no extra changes.

---

## Phase 0 — Setup (33 tasks)

| # | Task | Type | Status | Depends on |
|---|------|------|--------|-----------|
| 001 | Cleanup empty `tracking_service/` folder | 🤖 | ☐ | — |
| 002 | Init pnpm workspace (root config) | 🤖 | ☐ | 001 |
| 003 | Add Turborepo (`turbo.json`) | 🤖 | ☐ | 002 |
| 004 | Add shared TS config (`tsconfig.base.json`) | 🤖 | ☐ | 002 |
| 005 | Add Biome config + format/lint scripts | 🤖 | ☐ | 002 |
| 006 | Update `README.md` + `.gitignore` polish | 🤖 | ☐ | 002 |
| 007 | GitHub repo + push + branch protection | 👤 | ☐ | 006 |
| 008 | Supabase project provisioning | 👤 | ☐ | — |
| 009 | Run schema migration in Supabase SQL editor | 👤 | ☐ | 008 |
| 010 | Install Supabase CLI + login | 👤 | ☐ | 008 |
| 011 | Scaffold `apps/web` with create-next-app | 🤖 | ☐ | 002 |
| 012 | Install web app dependencies | 🤖 | ☐ | 011 |
| 013 | Replace web `globals.css` with KAYA tokens | 🤖 | ☐ | 011 |
| 014 | Create web env files | 🤖 | ☐ | 011 |
| 015 | Replace web home page placeholder | 🤖 | ☐ | 013 |
| 016 | Scaffold `apps/mobile` with create-expo-app | 🤖 | ☐ | 002 |
| 017 | Install mobile app dependencies | 🤖 | ☐ | 016 |
| 018 | Create mobile env file | 🤖 | ☐ | 016 |
| 019 | Create `packages/tsconfig` | 🤖 | ☐ | 004 |
| 020 | Create `packages/database` skeleton | 🤖 | ☐ | 019 |
| 021 | Generate Supabase types → `packages/database` | 🤖 | ☐ | 010, 020 |
| 022 | Create `packages/ui` skeleton | 🤖 | ☐ | 019 |
| 023 | Create `packages/i18n` ka + en stubs | 🤖 | ☐ | 019 |
| 024 | Wire web Supabase browser client | 🤖 | ☐ | 012, 020 |
| 025 | Wire web Supabase server client | 🤖 | ☐ | 024 |
| 026 | Wire web Supabase auth middleware | 🤖 | ☐ | 025 |
| 027 | Web home fetches plans (sanity check) | 🤖 | ☐ | 025 |
| 028 | Wire mobile Supabase service | 🤖 | ☐ | 017, 020 |
| 029 | Deploy `apps/web` to Vercel staging | 👤 | ☐ | 007, 027 |
| 030 | Setup Sentry on web | 🤖+👤 | ☐ | 015 |
| 031 | Setup Sentry on mobile | 🤖+👤 | ☐ | 018 |
| 032 | GitHub Actions CI workflow | 🤖 | ☐ | 012, 017 |
| 033 | Add CI as required status check on `main` | 👤 | ☐ | 032 |

**Legend:** 🤖 = Codex executes · 👤 = User does manually (cloud console / UI) · 🤖+👤 = Codex writes code, user pastes secrets.

---

## Phase 2 deferred — Codex briefs (2 tasks)

> Phase 1 (Auth) was executed directly by Claude — no Codex briefs. Phase 2 was mostly executed directly; the two below were spec-heavy and Codex shipped them.

| # | Task | Type | Status | Depends on |
|---|------|------|--------|-----------|
| 034 | Work Zone two-zone radii (Phase 2 Task 2.7) | 🤖 | ✅ | migration 06 + locations RLS |
| 035 | Provisional locations approval inbox (Phase 2 Task 2.10) | 🤖 | ✅ | 034 |

---

## Phase 4 — Mobile Admin (9 tasks)

Phase 3 mobile (SDK-free) was executed by Claude (onboarding · home · map · history · profile · mark ad-hoc). Phase 4 brings admin parity to mobile. Tasks below are ready for Codex; each is small + atomic.

| # | Task | Type | Status | Depends on |
|---|------|------|--------|-----------|
| 036 | Role-based tab bar (admin vs employee) | 🤖 | ☐ | Phase 3 SDK-free in repo |
| 037 | Admin Dashboard screen | 🤖 | ☐ | 036, migration 08 |
| 038 | Live team map (mobile, with Expo Go fallback) | 🤖 | ☐ | 036 |
| 039 | Team list screen (sectioned by status) | 🤖 | ☐ | 036, 038 |
| 040 | Alerts inbox (new RPC + UI) | 🤖 | ☐ | 036, migration 08 |
| 041 | Admin location create — map step | 🤖 | ☐ | 036 |
| 042 | Admin location create — form step | 🤖 | ☐ | 041, migration 09 |
| 043 | Work zone configuration (mobile) | 🤖 | ☐ | 036, migration 09 |
| 044 | Approve provisional location (mobile) | 🤖 | ☐ | 036, migration 10 |

**Order matters here.** 036 must land first (it adds the admin tab files everyone else fills in). 037+ can run in any order after 036, except 042 after 041, and 044 after migration 10.

**Heads-up on Expo Go:** Tasks 038, 041, 042, 043 use `react-native-maps` which only works in a dev/standalone build. Follow the same lazy `require()` dispatcher pattern as `apps/mobile/app/(tabs)/map.tsx` (see `tasks/00_HANDOFF.md` § Critical pitfalls #3).

---

## Phase 5 — Billing (Stripe)

Code already in repo (commits 42b2930, 54f54ec, 33565dc, 41d8f40). UI ships in **preview-only** mode for v1 — `/billing` shows plan info but checkout buttons are disabled. Task below activates the live flow.

| # | Task | Type | Status | Depends on |
|---|------|------|--------|-----------|
| 045 | Activate Stripe billing (sidebar + live /billing + Stripe setup) | 🤖 + 👤 | ☐ | Stripe account |

---

## Phase 6+ tasks

Briefs not yet written. Phases:

- Phase 6 (Super Admin) — see `tasks/07_PHASE_SUPER_ADMIN.md`
- Phase 7 (Polish + Launch — Vercel deploy + Sentry + CI gates) — see `tasks/08_PHASE_POLISH.md`
- Phase 3 SDK-required (transistorsoft license, geofence Edge Function, push, navigation, mock GPS, offline) — see `tasks/04_PHASE_MOBILE_EMPLOYEE.md` tasks 3.2–3.5, 3.9, 3.10, 3.12, 3.13. **Blocked on $580 license.**

---

## სტატუსის განახლება

ყოველი task-ის შემდეგ მონიშნე `☐ → ✅`. თუ რომელიმე გათიშავ — დაწერე `❌ skipped: reason`. Blocker-ის შემთხვევაში: `⏸ blocked: <why>`.
