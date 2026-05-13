# Project Handoff — TrackPro

> **For a fresh Claude Code session.** Read this first to get up to speed in 5 minutes, then dig into details only as needed.

Date snapshot: **2026-05-13**. For real-time state, run `git log --oneline -20` and `git status`.

---

## 🎯 What this project is

**TrackPro** — B2B SaaS GPS employee-tracking, Georgian market. Monorepo with:
- `apps/web` — Next.js 15 admin (App Router)
- `apps/mobile` — Expo Router mobile app (employee + admin)
- `packages/*` — database types, UI, i18n, tsconfig
- Backend: Supabase (Postgres + PostGIS + Auth + Storage + Edge Functions)
- Maps: Mapbox GL JS (web) + react-native-maps (mobile, dev build only)
- Payments: Stripe (Phase 5, not yet started)

---

## 📊 Phase status

| Phase | Status | What's done |
|---|---|---|
| 0 Setup | ✅ done | Turborepo + apps + Supabase + CI |
| 1 Auth + Tenancy | ✅ done | Signup / login / invites / RLS |
| 2 Web Admin | ✅ done | App Shell · Users · Locations + Create (map+address) · Dashboard · Reports · Settings · Work Zone · Provisional Inbox |
| 3 Mobile Employee | ⏳ 5/13 | Onboarding · Home · Map · History · Profile · Mark Ad-Hoc — **all SDK-free tasks done** |
| 4 Mobile Admin | ❌ not started | — |
| 5 Billing | ❌ not started | — |
| 6 Super Admin | ❌ not started | — |
| 7 Polish + Launch | ❌ not started | — |

**Phase 3 blocker:** Tasks 3.2, 3.3, 3.4, 3.5, 3.9, 3.10, 3.12, 3.13 all need the **transistorsoft `react-native-background-geolocation` license ($290 × 2 platforms = $580)** + Expo bare workflow (`expo prebuild`). Wait for Gio's go-ahead before touching these.

---

## 🌳 Branch state

- `main` — protected; updated via PRs from `develop`
- `develop` — working branch, all pushes go here
- Local `main` is what we commit to, then push via `git push origin main:develop`
- When Gio merges a PR to main, local main may go "ahead/behind" — that's a cosmetic issue, leave it

**12+ commits on develop are usually waiting for PR merge to main.** Don't bypass branch protection — let Gio open + merge PRs on GitHub.

---

## 🤝 Workflow (mid-project shift, important)

**Initial plan** (Phase 0): Claude writes Codex briefs (`tasks/codex/task.NNN.md`) → Codex executes → Gio relays.

**Current mode** (Phase 1+): **Claude executes directly** via Read/Write/Edit/Bash. The codex/ briefs remain useful as documentation and for the long-tail SDK tasks that haven't been done yet.

Switch back to brief-writing only if Gio asks for it explicitly ("ეგ კოდექს გაუწერე დავალებად").

### Commits & pushes
- One task = one commit. Conventional commits: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`, `style:`, `refactor:`
- Always run `pnpm --filter @trackpro/web exec tsc --noEmit` + `pnpm --filter @trackpro/mobile exec tsc --noEmit` + `pnpm format:check` before commit
- Push: `git push origin main:develop` then `git branch -f develop main` to keep local develop synced

### Communication with Gio
- **Georgian** for chat (default)
- **English** for code, identifiers, commit messages
- Short and direct. No fluff. Show ✅/❌ visually.
- Confirm before destructive actions (force push, drop tables, etc.)

---

## ⚠️ Critical pitfalls (don't re-trip)

1. **Supabase auto-enables RLS** on every public-schema table. No policy → zero rows silently. Add explicit policies. Migrations 03, 04, 07, 08 are the auth-aware policy layer.

2. **RLS infinite recursion (42P17)** — never query the same table from inside its own USING/CHECK clause. Use the `public.is_tenant_admin(uuid)` SECURITY DEFINER helper instead (migration 06).

3. **`react-native-maps` does NOT work in Expo Go** — missing `RNMapsAirModule` TurboModule. We have a conditional `require()` split in `apps/mobile/app/(tabs)/map.tsx`:
   - `MapFallbackScreen` (list view) for Expo Go
   - `MapNativeScreen` (real map) for dev/standalone builds
   - Detection via `Constants.executionEnvironment === 'storeClient'`

4. **Secrets never go in chat.** Always `.env.local`, Vercel env, GitHub Secrets. Even publishable/anon keys — chat history is cached on disk. Service-role / `sb_secret_*` keys are especially dangerous (bypass RLS).

5. **Always check actual mockups** before building UI:
   - `tasks/reference/designs/*.png` — 31 mockups
   - `design_system/*v2.html` — v2 HTML mockups (authoritative when conflicting with `DESIGN_RULES.md`)
   - DESIGN_RULES.md says button radius 4px; v2 says 6px → v2 wins.

6. **PostGIS geography reads** — `locations.center` is `geography(POINT, 4326)`. Two generated columns `latitude` + `longitude` (migration 07) expose plain numbers for the JS client. For inserts, pass WKT string `SRID=4326;POINT(lng lat)` typed as `unknown as never` (PostgREST accepts it).

7. **Mobile React duplication** — `use-sync-external-store` used to pull its own React 19.2.4 alongside root 19.1.0 → "Invalid hook call" cascades. Fixed via `pnpm.overrides` pinning `react` + `react-dom` to 19.1.0. If it recurs, check `find . -path "*/use-sync-external-store/node_modules/react*"`.

8. **CLI install commands rot** — Supabase blocks `npm install -g supabase`. Use `npx supabase`. Mapbox blocked `npm install`. Verify any CLI command against current docs before putting in a brief.

---

## 🗂 Key files to know

### Web (Next.js 15)
- `apps/web/app/(auth)/` — login/signup/accept-invite (gated unauthenticated)
- `apps/web/app/(app)/` — dashboard/users/locations/etc. (gated authenticated via middleware + layout)
- `apps/web/lib/supabase/{client,server,middleware}.ts` — three flavors of supabase
- `apps/web/lib/auth/actions.ts` — `loginWithPassword`, `logout`, `getCurrentUser`
- `apps/web/components/layout/` — TopBar (48px) · Sidebar (220px) · SubHeader · UserMenu
- `apps/web/components/map/MapboxMap.tsx` + `radius-rings.ts` — markers, draggable pin, trigger+boundary rings

### Mobile (Expo Router)
- `apps/mobile/app/_layout.tsx` — Stack.Protected guards: 3 states (no auth / authed-not-onboarded / authed+onboarded)
- `apps/mobile/app/(tabs)/{index,map,history,profile}.tsx` — main tabs
- `apps/mobile/app/{login,welcome,permissions,mark,modal}.tsx` — top-level routes
- `apps/mobile/src/services/{supabase,auth,locations,shifts,shifts-history,provisional}.ts` — DB layer
- `apps/mobile/src/screens/employee/{HomeScreen,MapNativeScreen,MapFallbackScreen,MarkLocationScreen}.tsx`
- `apps/mobile/src/hooks/{use-auth,use-onboarding,use-current-shift}.ts`

### Database
- `tasks/reference/tracking_saas_schema.sql` — reference schema (NOT source of truth for staging)
- `supabase/migrations/` — applied to staging via SQL Editor manually:
  - 01 `create_tenant_with_admin` RPC
  - 02 invitation policies + `accept_invitation` RPC
  - 03 auth.uid() policies on users/memberships/tenants
  - 04 admin-can-see-tenant-members
  - 05 tenant admin update
  - 06 `is_tenant_admin` helper + recursion fix
  - 07 locations RLS + lat/lng generated columns + `create_location` RPC
  - 08 shifts/pings/dwell/events RLS
  - 09 two-zone radii (trigger + boundary) + new `create_location` signature
  - 10 provisional locations + storage bucket + `approve_location` / `reject_location` RPCs
- Always run `pnpm db:types` after applying migrations to regenerate `packages/database/src/types.ts`

### Tasks docs
- `tasks/00_INDEX.md` — master phase index
- `tasks/00_AI_AGENT_RULES.md` — agent rules (read at start of every session)
- `tasks/00_CONVENTIONS.md` — code conventions
- `tasks/01_PHASE_SETUP.md` → `tasks/08_PHASE_POLISH.md` — phase details (note: file `0N` = Phase N-1)
- `tasks/codex/00_QUEUE.md` + `task.001.md` → `task.035.md` — Codex briefs (some done, some pending)
- `tasks/reference/` — schema · DESIGN_RULES.md · GEOFENCE_DESIGN_RULES.md · designs/*.png

---

## ✅ Open items / what to do next

### Gio's manual queue (probably partial — verify status)
- Run migrations 08, 09, 10 in Supabase SQL Editor (08 was queued, 09+10 from Codex commits, may already be done)
- Vercel deploy `apps/web` to staging
- Sentry projects (`trackpro-web`, `trackpro-mobile`) + paste DSNs into env
- PR `develop → main` on GitHub when ready: https://github.com/vanokvakhadze/tracking_service/compare/main...develop

### Code-side next priorities (pick one with Gio)
1. **Phase 3 SDK tasks (3.2–3.5, 3.9, 3.10, 3.12, 3.13)** — needs $580 license + dev build
2. **Phase 4 Mobile Admin** — admin features on mobile (view shifts, approve provisional locations on the go)
3. **Phase 5 Billing** — Stripe + subscription plans
4. **Phase 7 Polish** — Vercel deploy + Sentry + CI required status check + general polish

### Loose ends (low priority)
- `LocationRow.name` typed `string` but can be null for pending rows post-migration 10 — filtered out by `.eq('status', 'active')` queries, but type is misleading
- Sidebar `/alerts` nav item has hardcoded badge `3` (placeholder for future alerts feature)
- `expo-notifications` Android push warning in Expo Go logs — non-blocking, goes away in dev build
- `feedback_codex_workflow.md` memory now describes the mid-project shift; keep it accurate if Gio shifts back

---

## 🧪 How to test what's built

### Web
```powershell
pnpm --filter @trackpro/web dev
```
→ http://localhost:3000 — login/signup/dashboard/locations/users/settings/reports/pending

### Mobile (Expo Go on real device)
```powershell
pnpm --filter @trackpro/mobile start --clear
```
Scan QR with Expo Go app. Map tab shows fallback list (not real map). Camera + GPS + upload via "ლოკაციის მონიშვნა" FAB works.

### Mobile (development build, for full features)
Not yet set up. Requires `npx expo prebuild` + EAS Build or local Android Studio / Xcode. Defer to Phase 3 SDK tasks.

---

## 🧠 Memory pointers (this Claude account)

If this is the same Claude account, check `~/.claude/projects/c--Users-Zaza-Desktop-trackingService/memory/MEMORY.md`. Otherwise these are the key learnings:

- **user_gio** — Georgian-speaking CTO of TrackPro
- **project_trackpro** — phase plan, tech stack
- **feedback_codex_workflow** — Claude executes directly (mid-project shift)
- **feedback_codex_task_size** — when writing briefs, max 2-3 files / one concern
- **feedback_no_secrets_in_chat** — refuse credentials, redirect to .env.local
- **feedback_verify_cli_commands** — don't trust template install commands; Supabase blocks `npm i -g`
- **feedback_check_mockups** — v2 HTML mockups + PNGs are authoritative over DESIGN_RULES.md
- **project_supabase_rls_default** — public-schema tables get RLS auto-enabled
- **project_supabase_rls_recursion** — use `is_tenant_admin()` helper, never inline EXISTS on same table
