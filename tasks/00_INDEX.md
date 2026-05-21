# TrackPro — Tasks Index

> **ეს არის master index AI agents-ისთვის (Claude Code, Codex).** ყოველი task ცალკე ფაილში — გაუხსენი, წაიკითხე, შეასრულე.
>
> **წესი:** **ერთი task-ი ერთ session-ში.** არ იღო parallel-ი multiple files. Sequential = stable.

---

## 📂 ფაილის სტრუქტურა

```
tasks/
├── 00_INDEX.md                  ← ეს ფაილი
├── 00_AI_AGENT_RULES.md         ← Claude Code / Codex-ის წესები (read first)
├── 00_CONVENTIONS.md            ← Code conventions (naming, structure)
├── 01_PHASE_SETUP.md            ← Phase 0: Repo + Supabase + Vercel
├── 02_PHASE_AUTH.md             ← Phase 1: Auth + Tenancy
├── 03_PHASE_WEB_ADMIN.md        ← Phase 2: Web Admin UI
├── 04_PHASE_MOBILE_EMPLOYEE.md  ← Phase 3: Mobile Employee App
├── 05_PHASE_MOBILE_ADMIN.md     ← Phase 4: Mobile Admin App
├── 06_PHASE_BILLING.md          ← Phase 5: Stripe + Billing
├── 07_PHASE_SUPER_ADMIN.md      ← Phase 6: Super Admin
├── 08_PHASE_POLISH.md           ← Phase 7: Polish + Launch
├── codex/                       ← Codex briefs — atomic tasks `.001–.061+`
│   ├── 00_QUEUE.md              ← per-phase task queue
│   └── task.NNN.md              ← one brief per task
└── reference/
    ├── DESIGN_RULES.md          ← KAYA visual system
    ├── GEOFENCE_DESIGN_RULES.md ← Geofence logic
    ├── tracking_saas_schema.sql ← Database schema
    └── designs/                  ← 31 PNG mockups
```

---

## 🚦 თანმიმდევრობის წესი

**არ ისკარდე ფაზებიდან.** ყოველი Phase-ი დაასრულე ბოლომდე, შემდეგ შემდეგი.

| ფაზა | სტატუსი | შენიშვნა |
|------|--------|----------|
| 0. Setup | ✅ done | Turborepo + Supabase + Vercel + Sentry wired |
| 1. Auth + Tenancy | ✅ done | signup / login / invitations / RLS |
| 2. Web Admin | ✅ done | dashboard / locations / users / reports / settings |
| 3. Mobile Employee | ✅ Phase 3-Lite | SDK-free shipped; transistorsoft ($580) deferred — see `04_PHASE_MOBILE_EMPLOYEE.md` |
| 4. Mobile Admin | ✅ done | tabs / dashboard / team map / alerts / location flow |
| 5. Billing | ✅ code · ⏳ Stripe activation | code ready; live Stripe pending user action (`STRIPE_ACTIVATION.md`) |
| 6. Super Admin | ✅ done | tenants / audit / impersonate |
| 7. Polish + Launch | 🔄 in progress | Vercel + Sentry done; App Store / Play / DNS pending |
| 8. Post-MVP polish | 🔄 in progress | v2 redesigns + hygiene tasks `.049–.061` — see `codex/00_QUEUE.md` |

---

## 🤖 როგორ გამოვიყენო AI Agents-ი

### Claude Code-ში
```bash
# Open the relevant phase file
claude-code

# Then say:
> წაიკითხე tasks/00_AI_AGENT_RULES.md და tasks/01_PHASE_SETUP.md.
> შემდეგ შეასრულე Task 1.1.
```

### Codex-ში (VS Code extension)
```
# In editor with phase file open:
> Implement Task 1.1 from the current file.
> Follow conventions in 00_CONVENTIONS.md.
```

### Key Workflow
1. **Open one Phase file** in the AI agent
2. **Reference rules + conventions** at start of session
3. **Execute one Task at a time** — don't batch
4. **Verify acceptance criteria** before moving to next task
5. **Commit after each task** with descriptive message

---

## 📋 Task Format

ყოველი task ფაილში ასე გამოიყურება:

```
### Task X.Y — [Task name]

**Goal:** ერთი წინადადება რა უნდა გაკეთდეს

**Files to create/modify:**
- `apps/web/app/page.tsx` — create
- `packages/ui/src/Button.tsx` — modify

**Dependencies:**
- Task X.Y-1 must be complete
- npm packages: `package-name@version`

**Implementation:**
1. ნაბიჯი 1...
2. ნაბიჯი 2...

**Acceptance criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**References:**
- See DESIGN_RULES.md § Component
- Mockup: `designs/03_home_active.png`

**Commit message:** `feat(scope): description`
```

---

## ⚠️ კრიტიკული წესები (AI Agents-მა ეს უნდა იცოდეს)

1. **ერთი task = ერთი commit** — small, atomic commits
2. **არასოდეს skip-ი acceptance criteria-ის გადამოწმების** გარეშე
3. **Always reference DESIGN_RULES.md** UI ცვლილების წინ
4. **Always reference GEOFENCE_DESIGN_RULES.md** geofence logic-ის წინ
5. **Never store secrets in code** — use environment variables
6. **Always write types** — no `any`, no implicit any
7. **Test locally before commit** — `pnpm build && pnpm test`

---

## 🆘 თუ AI Agent-ი დაიბნა

თუ რომელიმე task-ი არ მოვა — ეს ნიშნავს რომ:
- ან რომელიმე ფაილი dependency-ში არ არის ჩაშენებული (გადახედე previous tasks)
- ან conventions-ი ვერ ცნო (გადახედე `00_CONVENTIONS.md`)
- ან design rule-ი ვერ იპოვა (გადახედე `reference/DESIGN_RULES.md`)

**ნუ ექსპერიმენტი — დაუბრუნდი context files-ს.**

---

დოკუმენტი დასრულდა. წადი `00_AI_AGENT_RULES.md`-ში.
