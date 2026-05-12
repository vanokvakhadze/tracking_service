# task.008 — Supabase project provisioning

**Type:** 👤 Manual (Supabase web console)
**Depends on:** none
**Commit:** N/A

---

## Goal
Create the staging Supabase project. Capture credentials. Do NOT run the schema yet — that is task.009.

---

## Steps

1. https://supabase.com → "New project"
2. Name: `trackpro-staging`
3. Region: **Frankfurt (eu-central-1)** — closest to Georgia
4. Database password: generate strong, save to password manager
5. Plan: Free
6. Click "Create" → wait ~2 min

### Capture credentials

Go to **Project Settings → API** and save to your password manager:

| Variable | Where | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | e.g. `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API keys → `anon public` | safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | API keys → `service_role` | **NEVER commit, NEVER expose to client** |
| `SUPABASE_PROJECT_ID` | the subdomain `abcdefgh` from the URL | needed for type generation |

## Acceptance criteria
- [ ] Project `trackpro-staging` is provisioned in Frankfurt
- [ ] You have the 4 values above saved somewhere safe

## DO NOT
- ❌ Commit any of these values
- ❌ Run the schema yet — that is task.009
