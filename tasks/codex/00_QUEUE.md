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

## Phase 1+ tasks

Phase 0-ის დასრულების შემდეგ ცალკე ბრიფი მოგამზადებ Phase 1 (Auth + Tenancy) task-ებისთვის (იხ. `tasks/02_PHASE_AUTH.md`).

---

## სტატუსის განახლება

ყოველი task-ის შემდეგ მონიშნე `☐ → ✅`. თუ რომელიმე გათიშავ — დაწერე `❌ skipped: reason`. Blocker-ის შემთხვევაში: `⏸ blocked: <why>`.
