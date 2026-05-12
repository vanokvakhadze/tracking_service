# task.029 — Deploy `apps/web` to Vercel staging

**Type:** 👤 Manual (Vercel dashboard)
**Depends on:** task.007, task.027
**Commit:** N/A

---

## Goal
Connect the GitHub repo to Vercel, configure monorepo build, deploy `apps/web` to a staging URL.

---

## Steps

### 1. Create the Vercel project
1. https://vercel.com → "Add New" → "Project"
2. Import from Git → select `trackpro` repo
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** click "Edit" → select `apps/web`
5. **Build & Output Settings → Override:**
   - **Build Command:** `cd ../.. && pnpm build --filter=@trackpro/web`
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
   - **Output Directory:** `.next` (default; relative to `apps/web`)
6. **Environment Variables:** add (same values as `apps/web/.env.local` from task.014/task.008):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only; check "Sensitive")*
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
7. **Deploy**

### 2. Custom domain (optional for staging)
- Vercel → project Settings → Domains → "Add" → `staging.trackpro.ge`
- At your DNS registrar, add `CNAME staging → cname.vercel-dns.com`
- Wait for DNS + SSL (1–60 min)

### 3. Verify
- Open the deployment URL (e.g. `trackpro-xxx.vercel.app` or `staging.trackpro.ge`)
- Should see the TrackPro page with `plans: Basic · Enterprise · Pro` from task.027
- DevTools → Network → page is HTTPS, no 500s

## Acceptance criteria
- [ ] Deployment shows "Ready" in Vercel
- [ ] Public URL renders the TrackPro page
- [ ] Plans from Supabase are visible (proves env vars + Supabase wiring work in prod)
- [ ] Future pushes to `main` (or whichever production branch you set) auto-deploy

## DO NOT
- ❌ Paste env values into committed files
- ❌ Set the `SUPABASE_SERVICE_ROLE_KEY` to be exposed (it must not be `NEXT_PUBLIC_*`)
