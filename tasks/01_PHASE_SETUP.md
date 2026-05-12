# Phase 0 — Setup (Week 1)

> **Goal:** Empty machine → working monorepo deployed to staging.
> **Effort:** ~40 hours
> **Output:** `https://staging.trackpro.ge` shows "Hello World", mobile app runs locally on simulator.

---

## 🎯 Overview

ამ ფაზის ბოლოს უნდა გქონდეს:
- ✅ Monorepo (Turborepo + pnpm) ლოკალურად + GitHub-ზე
- ✅ Next.js web app deploy-ი Vercel-ზე (staging URL)
- ✅ Expo mobile app runs ლოკალურად (iOS Simulator + Android Emulator)
- ✅ Supabase project created (staging) — schema migrated
- ✅ All environment variables wired up
- ✅ Sentry catching errors on both platforms

---

## 📋 Tasks

### Task 0.1 — Initialize Monorepo

**Goal:** შექმენი Turborepo + pnpm workspace structure.

**Files to create:**
- `package.json` (root)
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.gitignore`
- `.npmrc`
- `README.md`

**Implementation:**
```bash
mkdir trackpro && cd trackpro
git init
npm install -g pnpm@latest
pnpm init
```

`package.json` (root):
```json
{
  "name": "trackpro",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "@biomejs/biome": "^1.8.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.0.0"
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

`.gitignore`:
```
node_modules
.next
.turbo
dist
.env
.env.local
.env*.local
!.env.example
.DS_Store
*.log
.expo
ios/Pods
android/.gradle
```

**Acceptance criteria:**
- [ ] `pnpm install` runs without errors
- [ ] `git status` shows clean repo
- [ ] Folder structure matches `00_CONVENTIONS.md`

**Commit:** `chore: initialize monorepo with turborepo and pnpm`

---

### Task 0.2 — Create GitHub Repository

**Goal:** Push local repo to GitHub, configure branch protection.

**Implementation:**
1. Go to github.com → New repository → `trackpro` (private)
2. Don't initialize with README (already have one)
3. Local:
```bash
git branch -M main
git remote add origin git@github.com:<your-username>/trackpro.git
git add .
git commit -m "chore: initialize monorepo with turborepo and pnpm"
git push -u origin main
```
4. Create `develop` branch:
```bash
git checkout -b develop
git push -u origin develop
```
5. GitHub settings → Branches → Add rule for `main`:
   - Require pull request before merging
   - Require status checks (will add CI later)

**Acceptance criteria:**
- [ ] Repo visible on GitHub
- [ ] Both `main` and `develop` branches exist
- [ ] `main` is protected

**Commit:** N/A (GitHub operations)

---

### Task 0.3 — Create Supabase Project

**Goal:** Spin up Supabase project, run schema migration.

**Implementation:**
1. Go to supabase.com → New project
2. Name: `trackpro-staging`
3. Region: Choose closest (Frankfurt for Georgia)
4. Database password: generate strong, save to password manager
5. Wait for provisioning (~2 min)
6. Once ready:
   - Copy `Project URL` (e.g. `https://xyz.supabase.co`)
   - Copy `anon` key
   - Copy `service_role` key (NEVER commit)
7. Go to SQL Editor → New query
8. Paste contents of `reference/tracking_saas_schema.sql`
9. Run the query (should complete in ~10 seconds)
10. Verify tables exist: Database → Tables — should see `tenants`, `users`, `locations`, `shifts`, `geofence_events`, etc.
11. Verify RLS enabled: each table should show 🔒 icon

**Acceptance criteria:**
- [ ] Project created in Frankfurt region
- [ ] All tables from schema.sql visible
- [ ] RLS enabled on all tables
- [ ] Seed data inserted (plans table has Basic/Pro/Enterprise rows)

**Commit:** N/A (cloud operation)

---

### Task 0.4 — Initialize Next.js Web App

**Goal:** Create `apps/web` with Next.js 15 + TypeScript + Tailwind v4.

**Files to create:**
- `apps/web/` (entire app)

**Implementation:**
```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint --turbopack
cd web
```

Edit `apps/web/package.json` — set name:
```json
{
  "name": "@trackpro/web",
  "version": "0.0.1",
  "private": true,
  // ...
}
```

Install KAYA-aligned dependencies:
```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zustand @tanstack/react-query
pnpm add zod react-hook-form @hookform/resolvers
pnpm add mapbox-gl
pnpm add clsx tailwind-merge
pnpm add lucide-react
pnpm add next-intl
pnpm add -D @types/mapbox-gl @biomejs/biome
```

Replace `apps/web/app/globals.css` with KAYA tokens (from `reference/DESIGN_RULES.md` § Design Tokens). The full block goes here — copy verbatim.

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

Create `apps/web/.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

Replace `apps/web/app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center text-2xl font-bold">
          T
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          TrackPro
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          GPS-ის თანამშრომლების ტრექინგი
        </p>
      </div>
    </main>
  )
}
```

Test locally:
```bash
cd ../..  # back to root
pnpm --filter @trackpro/web dev
# Open http://localhost:3000
```

**Acceptance criteria:**
- [ ] Localhost shows "TrackPro" with KAYA blue T badge
- [ ] No console errors
- [ ] `pnpm --filter @trackpro/web typecheck` passes
- [ ] `.env.local` ignored by git

**Commit:** `feat(web): initialize next.js app with KAYA tokens`

---

### Task 0.5 — Initialize Expo Mobile App

**Goal:** Create `apps/mobile` with Expo + TypeScript.

**Files to create:**
- `apps/mobile/` (entire app)

**Implementation:**
```bash
cd apps
pnpm create expo-app mobile --template default
cd mobile
```

Edit `apps/mobile/package.json` — set name:
```json
{
  "name": "@trackpro/mobile",
  "version": "0.0.1",
  "private": true
}
```

Install dependencies:
```bash
pnpm add @supabase/supabase-js
pnpm add react-native-url-polyfill
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
pnpm add react-native-screens react-native-safe-area-context react-native-gesture-handler
pnpm add zustand @tanstack/react-query
pnpm add zod react-hook-form
pnpm add react-native-mmkv
pnpm add react-native-maps
pnpm add expo-camera expo-location expo-notifications expo-secure-store
pnpm add expo-localization i18n-js
```

⚠️ **Don't add `react-native-background-geolocation` yet** — that's Phase 3 (requires license + native build).

Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

Test on iOS Simulator:
```bash
pnpm --filter @trackpro/mobile start
# Press 'i' for iOS, 'a' for Android
```

**Acceptance criteria:**
- [ ] Default Expo screen renders on iOS Simulator
- [ ] Default Expo screen renders on Android Emulator
- [ ] No bundler errors

**Commit:** `feat(mobile): initialize expo app`

---

### Task 0.6 — Setup Shared Packages

**Goal:** Create `packages/database`, `packages/ui`, `packages/i18n`, `packages/tsconfig`.

**Files to create:**
- `packages/database/` — Supabase types
- `packages/ui/` — Shared KAYA components
- `packages/i18n/` — Translations (Georgian + English)
- `packages/tsconfig/` — Shared TS configs

**Implementation:**

**packages/tsconfig:**
```bash
mkdir -p packages/tsconfig
cd packages/tsconfig
```

Create `packages/tsconfig/package.json`:
```json
{
  "name": "@trackpro/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-native.json"]
}
```

Create `packages/tsconfig/base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022"]
  },
  "exclude": ["node_modules"]
}
```

**packages/database:**
```bash
mkdir -p packages/database/src
```

Create `packages/database/package.json`:
```json
{
  "name": "@trackpro/database",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "@trackpro/tsconfig": "workspace:*",
    "typescript": "^5.5.0"
  }
}
```

Create `packages/database/src/index.ts`:
```typescript
export type { Database } from './types'
```

Generate types:
```bash
npx supabase login
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > packages/database/src/types.ts
```

**packages/ui:**
```bash
mkdir -p packages/ui/src
```

Will scaffold KAYA components in Phase 2 — for now just create the package skeleton:

`packages/ui/package.json`:
```json
{
  "name": "@trackpro/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "devDependencies": {
    "@trackpro/tsconfig": "workspace:*",
    "react": "^18.3.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.5.0"
  }
}
```

`packages/ui/src/index.ts`:
```typescript
export {}  // placeholder, components added in Phase 2
```

**packages/i18n:**
```bash
mkdir -p packages/i18n/src/messages
```

`packages/i18n/src/messages/ka.json`:
```json
{
  "common": {
    "loading": "იტვირთება...",
    "error": "შეცდომა",
    "save": "შენახვა",
    "cancel": "გაუქმება",
    "delete": "წაშლა",
    "edit": "რედაქტირება"
  }
}
```

`packages/i18n/src/messages/en.json`:
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

**Acceptance criteria:**
- [ ] All 4 packages have `package.json` with `@trackpro/*` namespace
- [ ] `pnpm install` from root resolves workspace deps
- [ ] Supabase types generated and committed
- [ ] Georgian + English translations stubs exist

**Commit:** `feat: setup shared packages (tsconfig, database, ui, i18n)`

---

### Task 0.7 — Connect Supabase Clients

**Goal:** Wire up Supabase client in both web and mobile.

**Files to create:**
- `apps/web/lib/supabase/client.ts`
- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/supabase/middleware.ts`
- `apps/web/middleware.ts`
- `apps/mobile/src/services/supabase.ts`

**Implementation:**

`apps/web/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@trackpro/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

`apps/web/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@trackpro/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component — ignore
          }
        },
      },
    },
  )
}
```

`apps/web/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@trackpro/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  await supabase.auth.getUser()
  return supabaseResponse
}
```

`apps/web/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

`apps/mobile/src/services/supabase.ts`:
```typescript
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '@trackpro/database'

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)
```

Test in web — add to `apps/web/app/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('plans').select('*')

  return (
    <main className="...">
      {/* ... existing UI ... */}
      <pre className="mt-8 text-xs">{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
```

You should see the 3 plans (Basic/Pro/Enterprise) from seed data.

**Acceptance criteria:**
- [ ] Web home page shows plans from Supabase
- [ ] Mobile app imports supabase without error
- [ ] Type safety works (try accessing non-existent column → TS error)

**Commit:** `feat(supabase): wire up clients for web and mobile`

---

### Task 0.8 — Deploy to Vercel

**Goal:** Push to GitHub → auto-deploy to Vercel staging URL.

**Implementation:**
1. Go to vercel.com → New Project → Import from GitHub
2. Select `trackpro` repo
3. Configure:
   - Framework: Next.js
   - Root directory: `apps/web`
   - Build command: `cd ../.. && pnpm build --filter=@trackpro/web`
   - Output directory: `apps/web/.next`
   - Install command: `cd ../.. && pnpm install`
4. Add environment variables (same as `.env.local`)
5. Deploy
6. Once deployed, go to Settings → Domains → add `staging.trackpro.ge`
   - Configure DNS on your domain registrar (CNAME → `cname.vercel-dns.com`)
7. Test: visit `https://staging.trackpro.ge`

**Acceptance criteria:**
- [ ] Vercel deployment successful
- [ ] `staging.trackpro.ge` shows TrackPro homepage
- [ ] HTTPS works (Vercel auto-issues SSL)
- [ ] Future git pushes auto-deploy

**Commit:** `chore(deploy): connect vercel for staging`

---

### Task 0.9 — Setup Sentry

**Goal:** Error tracking on web + mobile.

**Implementation:**

**Web:**
```bash
cd apps/web
pnpm dlx @sentry/wizard@latest -i nextjs
```
Follow prompts — paste DSN when asked.

**Mobile:**
```bash
cd apps/mobile
pnpm add @sentry/react-native
npx @sentry/wizard@latest -s -i reactNative
```

Test error capture — add temporary button to web home:
```tsx
<button onClick={() => { throw new Error('Test Sentry') }}>
  Test error
</button>
```

Click it, check Sentry dashboard → issue should appear.

**Acceptance criteria:**
- [ ] Sentry projects created for web + mobile
- [ ] Test error visible in Sentry dashboard
- [ ] Source maps uploading on deploy
- [ ] Remove test button before commit

**Commit:** `chore(monitoring): integrate sentry for web and mobile`

---

### Task 0.10 — Setup GitHub Actions CI

**Goal:** Run lint + typecheck + build on every PR.

**Files to create:**
- `.github/workflows/ci.yml`

**Implementation:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_MAPBOX_TOKEN: ${{ secrets.NEXT_PUBLIC_MAPBOX_TOKEN }}
```

GitHub → Settings → Secrets → Add the 3 secrets (same values as `.env.local`).

**Acceptance criteria:**
- [ ] CI runs on every push
- [ ] CI badge added to README
- [ ] Failed CI blocks PR merge

**Commit:** `chore(ci): setup github actions for typecheck/lint/build`

---

## ✅ Phase 0 Complete Checklist

Before moving to Phase 1, verify:

- [ ] `pnpm install && pnpm build` works locally
- [ ] `pnpm dev --filter=@trackpro/web` runs web on `localhost:3000`
- [ ] `pnpm --filter=@trackpro/mobile start` runs mobile in Expo
- [ ] `staging.trackpro.ge` is live
- [ ] Supabase has schema migrated + RLS enabled
- [ ] All env vars set in 3 places: `.env.local`, Vercel, GitHub Secrets
- [ ] Sentry receiving events
- [ ] CI passes on `develop` branch
- [ ] Both `main` and `develop` branches protected

**🎉 If all checked → start Phase 1: `02_PHASE_AUTH.md`**
