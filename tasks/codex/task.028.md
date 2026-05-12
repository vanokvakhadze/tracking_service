# task.028 — Wire mobile Supabase service

**Type:** 🤖 Codex
**Depends on:** task.017, task.020
**Commit:** `feat(mobile): add supabase service`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Supabase Patterns"

## Goal
Create the mobile Supabase singleton at `apps/mobile/src/services/supabase.ts` using `expo-secure-store` for token storage (more secure than AsyncStorage).

## Files to create

### `apps/mobile/src/services/supabase.ts`
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

## Files to modify

### `apps/mobile/package.json` — add `@trackpro/database` workspace dep
Add to `dependencies`:
```json
"@trackpro/database": "workspace:*"
```

### `apps/mobile/tsconfig.json` — confirm path alias for `src/`
The default Expo `tsconfig.json` should already use the project root. If `@/services/*` style imports are not used, no change needed. Skip this if Expo's defaults work.

## Commands
```powershell
pnpm install
pnpm --filter @trackpro/mobile exec tsc --noEmit
```

## Acceptance criteria
- [ ] `apps/mobile/src/services/supabase.ts` exists
- [ ] `apps/mobile/package.json` lists `"@trackpro/database": "workspace:*"`
- [ ] `pnpm --filter @trackpro/mobile exec tsc --noEmit` passes (no TS errors)
- [ ] `import { supabase } from './src/services/supabase'` and try `supabase.from('plans')` — autocomplete should show column names

## Commit
```powershell
git add apps/mobile/src/services/supabase.ts apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): add supabase service"
```

## DO NOT
- ❌ Use the service in any screen yet — that comes with auth in Phase 1
- ❌ Use `SUPABASE_SERVICE_ROLE_KEY` — mobile bundle is shipped to devices
