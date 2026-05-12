# task.014 — Create web env files

**Type:** 🤖 Codex (user fills in real values manually)
**Depends on:** task.011
**Commit:** `chore(web): add env templates`

---

## Read first
`tasks/00_AI_AGENT_RULES.md` § "Security" + `tasks/00_CONVENTIONS.md` § "Environment Variables"

## Goal
Create `.env.local` (gitignored) and `.env.example` (committed) for `apps/web`.

## Files to create

### `apps/web/.env.local` (gitignored — placeholder values, user replaces with real ones from task.008)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_MAPBOX_TOKEN
```

### `apps/web/.env.example` (committed — empty values)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## Acceptance criteria
- [ ] `apps/web/.env.local` exists (contains placeholders, will be filled in manually)
- [ ] `apps/web/.env.example` exists with empty values
- [ ] `git status` shows `apps/web/.env.example` as new, but **NOT** `.env.local` (root `.gitignore` should already ignore `.env*.local`)
- [ ] **Verify:** running `git check-ignore apps/web/.env.local` prints the path (proves it is ignored)

## Commit
```powershell
git add apps/web/.env.example
git commit -m "chore(web): add env templates"
```

## After commit — manual step for Gio
Open `apps/web/.env.local` and replace the placeholders with the real values you saved in task.008 (Supabase URL + anon key + service role) and your Mapbox public token from `https://account.mapbox.com/`.

## DO NOT
- ❌ Commit `.env.local`
- ❌ Put real keys in `.env.example`
