# Code Conventions

> **Single source of truth code style, file structure, naming.** AI agents read this once per session.

---

## 📁 File & Folder Naming

### Web (Next.js)
```
apps/web/
├── app/                          # App Router
│   ├── (marketing)/              # Route group: public pages
│   │   ├── page.tsx              # /
│   │   └── pricing/page.tsx      # /pricing
│   ├── (auth)/
│   │   ├── login/page.tsx        # /login
│   │   └── signup/page.tsx       # /signup
│   ├── (app)/                    # Route group: authenticated
│   │   ├── layout.tsx            # App shell (TopBar + Sidebar)
│   │   ├── dashboard/page.tsx
│   │   ├── locations/
│   │   │   ├── page.tsx          # /locations
│   │   │   ├── new/page.tsx      # /locations/new
│   │   │   └── [id]/page.tsx     # /locations/abc
│   │   └── users/page.tsx
│   ├── (super-admin)/
│   │   └── platform/page.tsx
│   ├── api/                      # Route handlers
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   └── globals.css
├── components/
│   ├── ui/                       # KAYA primitive components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── layout/
│   │   ├── TopBar.tsx
│   │   └── Sidebar.tsx
│   └── locations/                # Feature-specific
│       ├── LocationMap.tsx
│       └── LocationForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   └── use-realtime-shifts.ts
└── types/
    └── database.ts                # Supabase generated types
```

### Mobile (Expo)
```
apps/mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── employee/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── MapScreen.tsx
│   │   │   └── HistoryScreen.tsx
│   │   └── admin/
│   │       └── DashboardScreen.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── feature/
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── location.ts            # Background location wrapper
│   │   ├── notifications.ts
│   │   └── storage.ts             # MMKV cache
│   ├── hooks/
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   └── i18n/
│       ├── ka.json
│       └── en.json
├── assets/
└── app.config.ts
```

### Naming Rules

| Type | Convention | Example |
|------|-----------|---------|
| **React components** | PascalCase | `LocationMap.tsx` |
| **Hooks** | camelCase, `use-` prefix | `use-realtime-shifts.ts` |
| **Utilities** | kebab-case | `format-distance.ts` |
| **Types/interfaces** | PascalCase | `type Location`, `interface User` |
| **Functions** | camelCase | `calculateDistance()` |
| **Constants** | SCREAMING_SNAKE | `MAX_RADIUS_METERS` |
| **Environment vars** | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |
| **CSS classes** | kebab-case (Tailwind native) | — |
| **Database tables** | snake_case, plural | `users`, `shifts`, `geofence_events` |
| **Database columns** | snake_case | `created_at`, `tenant_id` |

---

## 🎨 React/Component Patterns

### Component Structure
```tsx
// 1. Imports (grouped, sorted)
import { useEffect, useState } from 'react'         // React
import { useRouter } from 'next/navigation'         // Framework
import { Map } from '@/components/ui/Map'           // Internal
import { calculateDistance } from '@/lib/geo'       // Utils
import type { Location } from '@/types/database'    // Types

// 2. Props interface
interface LocationCardProps {
  location: Location
  onEdit: (id: string) => void
}

// 3. Component (default export)
export default function LocationCard({ location, onEdit }: LocationCardProps) {
  // 3a. Hooks first
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // 3b. Derived state
  const distance = calculateDistance(location.lat, location.lng)

  // 3c. Effects
  useEffect(() => {
    // ...
  }, [])

  // 3d. Handlers
  const handleClick = () => {
    onEdit(location.id)
  }

  // 3e. Render
  return (
    <div className="rounded-lg border border-[var(--color-border)]">
      {/* ... */}
    </div>
  )
}
```

### Component Rules
- **Default export** for components, **named exports** for utilities/hooks
- **Props interface always** named `<ComponentName>Props`
- **One component per file** (sub-components only if used in same file)
- **No inline styles** unless dynamic — use Tailwind / CSS variables
- **No fragments at root** if returning single element — return element directly

---

## 🔧 TypeScript Patterns

### Types vs Interfaces
```typescript
// Use `type` for unions, primitives, mapped types
type Status = 'active' | 'inactive' | 'pending'
type LocationWithDistance = Location & { distance: number }

// Use `interface` for object shapes that may be extended
interface User {
  id: string
  email: string
  tenant_id: string
}
```

### Zod Validation
```typescript
// ALWAYS define Zod schema for API boundaries
import { z } from 'zod'

export const CreateLocationSchema = z.object({
  name: z.string().min(2).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  trigger_radius: z.number().min(50).max(3000),
  boundary_radius: z.number().min(100).max(5000),
}).refine(
  (data) => data.trigger_radius <= data.boundary_radius,
  { message: 'Trigger radius must be ≤ boundary radius' }
)

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>
```

### Database Types
```typescript
// Auto-generated from Supabase — never edit manually
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']
type LocationUpdate = Database['public']['Tables']['locations']['Update']
```

---

## 🗄️ Supabase Patterns

### Client vs Server
```typescript
// Server Components / Route Handlers (apps/web/app)
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase.from('locations').select()

// Client Components (with 'use client')
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()  // singleton
```

### Query Patterns
```typescript
// ✅ Good — type-safe, error-handled
const { data: locations, error } = await supabase
  .from('locations')
  .select('id, name, trigger_radius, boundary_radius')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Failed to fetch locations:', error)
  return { error: 'Could not load locations' }
}

// ❌ Bad — select all, no error handling
const { data } = await supabase.from('locations').select('*')
```

### RLS-aware Mutations
```typescript
// RLS automatically enforces tenant_id, but include it explicitly for clarity
const { error } = await supabase
  .from('locations')
  .insert({
    tenant_id: user.tenant_id,  // RLS will verify this matches user's tenant
    name: input.name,
    trigger_radius: input.trigger_radius,
    boundary_radius: input.boundary_radius,
    // ... PostGIS geom auto-computed via trigger
  })
```

---

## 🎨 Styling Patterns (Tailwind v4)

### Use CSS Variables (KAYA tokens)
```tsx
// ✅ Good
<button className="bg-[var(--color-accent)] text-white">
  Save
</button>

// ❌ Bad — hardcoded hex
<button style={{ background: '#1565C0' }}>Save</button>

// ❌ Bad — Tailwind color (won't theme correctly)
<button className="bg-blue-700">Save</button>
```

### Component Variants (using `clsx` or `cn`)
```typescript
import { clsx } from 'clsx'

const buttonVariants = {
  primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
  secondary: 'border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)]',
  ghost: 'bg-transparent hover:bg-[var(--color-surface)]',
}

export function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center px-3 h-8 rounded-[4px] text-sm font-medium',
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  )
}
```

---

## 📦 State Management

### Zustand for client state
```typescript
// lib/stores/use-locations-store.ts
import { create } from 'zustand'

interface LocationsStore {
  selectedLocationId: string | null
  setSelectedLocationId: (id: string | null) => void
}

export const useLocationsStore = create<LocationsStore>((set) => ({
  selectedLocationId: null,
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
}))
```

### TanStack Query for server state
```typescript
// hooks/use-locations.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useLocations() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}
```

---

## 🌐 i18n Pattern

```typescript
// Centralized in packages/i18n/
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('Home')

  return <h1>{t('greeting', { name: user.name })}</h1>
}
```

```json
// packages/i18n/messages/ka.json
{
  "Home": {
    "greeting": "გამარჯობა, {name}!",
    "activeShift": "აქტიური ცვლა"
  }
}
```

**წესი:** არასოდეს ჩაუგდე inline strings UI-ში. ყოველი user-facing text-ი — translation key.

---

## 🧪 Testing Conventions

```typescript
// Vitest for unit tests
import { describe, it, expect } from 'vitest'
import { calculateDistance } from './geo'

describe('calculateDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(calculateDistance(41.7, 44.7, 41.7, 44.7)).toBe(0)
  })

  it('returns ~111km for 1 degree latitude difference', () => {
    const distance = calculateDistance(41.0, 44.7, 42.0, 44.7)
    expect(distance).toBeCloseTo(111000, -3) // ±1km tolerance
  })
})
```

**წესი:** Test geofence logic, distance calculations, validation schemas. Don't test trivial UI.

---

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance (deps, configs)
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code restructure, no behavior change
- `test` — adding tests
- `perf` — performance improvement

**Scopes:**
- `web`, `mobile`, `db`, `auth`, `ui`, `geofence`, `billing`, `super-admin`, `i18n`

**Examples:**
```
feat(geofence): add hysteresis state machine
fix(mobile): correct GPS accuracy buffer calculation
chore(db): add index on shifts.user_id
docs(readme): update setup instructions
refactor(ui): extract Button variants to shared package
```

---

## 🔐 Environment Variables

| Variable | Where | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | `eyJhbGc...` (NEVER expose) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Web + Mobile | `pk.xxx` |
| `STRIPE_SECRET_KEY` | Server only | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Server only | `whsec_xxx` |
| `RESEND_API_KEY` | Server only | `re_xxx` |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | same as web |

**წესი:**
- `NEXT_PUBLIC_*` — safe for browser
- `EXPO_PUBLIC_*` — safe for mobile bundle
- Everything else — server-only
- `.env.local` — gitignored (never commit)
- `.env.example` — committed (template with placeholder values)

---

## 📊 Performance Checklist

ნებისმიერი feature-ის წინ:

- [ ] Database queries indexed (check `tracking_saas_schema.sql`)
- [ ] No N+1 queries (use `select` joins)
- [ ] Images optimized (`<Image>` from `next/image`)
- [ ] Routes lazy-loaded (Next.js does this by default)
- [ ] Realtime subscriptions cleaned up on unmount
- [ ] Mobile: background tasks battery-tested

---

დოკუმენტი დასრულდა. წადი Phase file-ში.
