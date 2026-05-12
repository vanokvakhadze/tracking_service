# Phase 1 — Auth + Multi-tenancy (Week 2-3)

> **Goal:** Companies sign up, admins invite employees, users log in (web + mobile).
> **Effort:** ~60 hours
> **Prerequisites:** Phase 0 complete

---

## 🎯 Overview

ამ ფაზის ბოლოს:
- ✅ კომპანიამ შეიძლება signup → შექმენი workspace
- ✅ Admin-მა მოიწვიოს users email-ით (magic link)
- ✅ User-მა შემოვიდეს როგორც web-ში ისე mobile-ში
- ✅ RLS-ი ხდის tenant isolation-ს
- ✅ 3 role-ი მუშაობს: Super Admin / Company Admin / Employee

---

## 📋 Tasks

### Task 1.1 — Auth Helper Functions

**Goal:** Wrap Supabase auth in helper functions.

**Files to create:**
- `apps/web/lib/auth/actions.ts` (server actions)
- `apps/web/lib/auth/hooks.ts` (client hooks)
- `apps/mobile/src/services/auth.ts`

**Implementation:**

`apps/web/lib/auth/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function loginWithPassword(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'არასწორი ფორმატი' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'არასწორი ემაილი ან პაროლი' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function sendMagicLink(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  return profile
}
```

`apps/mobile/src/services/auth.ts`:
```typescript
import { supabase } from './supabase'

export async function loginWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
```

**Acceptance criteria:**
- [ ] All functions type-safe
- [ ] Zod validates inputs
- [ ] Error messages in Georgian
- [ ] No `any` types

**Commit:** `feat(auth): add auth helper functions for web and mobile`

---

### Task 1.2 — Login Page (Web)

**Goal:** Working login page at `/login`.

**Files to create:**
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/layout.tsx`
- `apps/web/components/ui/Input.tsx`
- `apps/web/components/ui/Button.tsx`

**References:**
- Mockup: `reference/designs/01_login.png`
- Design rules: `reference/DESIGN_RULES.md` § Input, § Button

**Implementation:**

`apps/web/components/ui/Button.tsx`:
```tsx
import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
  secondary: 'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
  ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-8 px-3 text-[13px]',
  lg: 'h-9 px-4 text-[13px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-[4px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
```

`apps/web/components/ui/Input.tsx`:
```tsx
import { clsx } from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={clsx(
            'h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px]',
            'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10',
            error && 'border-[var(--color-error)]',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
```

`apps/web/app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
```

`apps/web/app/(auth)/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginWithPassword } from '@/lib/auth/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await loginWithPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-accent)] text-xl font-bold text-white">
          T
        </div>
        <h1 className="text-xl font-semibold">TrackPro-ში შესვლა</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          მართე შენი გუნდი ერთი ადგილიდან
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="ემაილი"
          placeholder="you@company.ge"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="პაროლი"
          required
          minLength={8}
        />

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          შესვლა
        </Button>

        <div className="text-center text-[13px] text-[var(--color-text-secondary)]">
          არ გაქვს ანგარიში?{' '}
          <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
            დაარეგისტრირე კომპანია
          </Link>
        </div>
      </form>
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] `/login` renders KAYA-styled form
- [ ] Form validation works (empty/invalid email)
- [ ] Wrong credentials show error in Georgian
- [ ] Success redirects to `/dashboard` (will 404 until next task — that's OK)
- [ ] Mobile-responsive

**Commit:** `feat(web): add login page with email/password auth`

---

### Task 1.3 — Signup Flow (Web)

**Goal:** New company creates workspace + first admin user.

**Files to create:**
- `apps/web/app/(auth)/signup/page.tsx`
- `apps/web/lib/auth/signup-action.ts`
- Supabase migration: `supabase/migrations/<timestamp>_add_signup_function.sql`

**Implementation:**

Create SQL function in Supabase SQL Editor:
```sql
-- Function: create_tenant_with_admin
-- Creates tenant + admin user in single transaction
create or replace function public.create_tenant_with_admin(
  p_user_id uuid,
  p_company_name text,
  p_subdomain text,
  p_full_name text
)
returns uuid as $$
declare
  v_tenant_id uuid;
begin
  -- Validate subdomain (lowercase, alphanumeric)
  if p_subdomain !~ '^[a-z0-9-]{3,30}$' then
    raise exception 'Invalid subdomain format';
  end if;

  -- Create tenant
  insert into public.tenants (name, subdomain, plan_id, trial_ends_at)
  values (
    p_company_name,
    p_subdomain,
    (select id from public.plans where slug = 'basic' limit 1),
    now() + interval '14 days'
  )
  returning id into v_tenant_id;

  -- Create user profile
  insert into public.users (id, tenant_id, full_name, role)
  values (p_user_id, v_tenant_id, p_full_name, 'admin');

  return v_tenant_id;
end;
$$ language plpgsql security definer;
```

`apps/web/lib/auth/signup-action.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const SignupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  subdomain: z.string().regex(/^[a-z0-9-]{3,30}$/),
})

export async function signupCompany(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    companyName: formData.get('companyName'),
    subdomain: formData.get('subdomain'),
  })

  if (!parsed.success) {
    return { error: 'შეავსე ყველა ველი სწორად' }
  }

  const supabase = await createClient()

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'რეგისტრაცია ვერ მოხერხდა' }
  }

  // 2. Create tenant + user profile
  const { error: rpcError } = await supabase.rpc('create_tenant_with_admin', {
    p_user_id: authData.user.id,
    p_company_name: parsed.data.companyName,
    p_subdomain: parsed.data.subdomain,
    p_full_name: parsed.data.fullName,
  })

  if (rpcError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { error: 'subdomain უკვე გამოყენებულია' }
  }

  redirect('/dashboard')
}
```

`apps/web/app/(auth)/signup/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signupCompany } from '@/lib/auth/signup-action'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signupCompany(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold">დაიწყე უფასოდ</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          14 დღიანი trial · არ მოითხოვება ბარათი
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input id="fullName" name="fullName" label="თქვენი სახელი" required />
        <Input id="email" name="email" type="email" label="ემაილი" required />
        <Input id="password" name="password" type="password" label="პაროლი" required minLength={8} />
        <Input id="companyName" name="companyName" label="კომპანიის სახელი" required />
        <Input
          id="subdomain"
          name="subdomain"
          label="Subdomain"
          placeholder="საქარი"
          pattern="^[a-z0-9-]{3,30}$"
          required
        />
        <p className="-mt-2 text-[11px] text-[var(--color-text-tertiary)]">
          მაგ: <strong>saqari</strong>.trackpro.ge
        </p>

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          რეგისტრაცია
        </Button>

        <div className="text-center text-[13px] text-[var(--color-text-secondary)]">
          უკვე გაქვს ანგარიში?{' '}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            შესვლა
          </Link>
        </div>
      </form>
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] `/signup` renders form
- [ ] Subdomain validation works (a-z, 0-9, dash, 3-30 chars)
- [ ] Successful signup creates tenant + user in DB
- [ ] Duplicate subdomain returns error
- [ ] Auth user rolled back if tenant creation fails

**Commit:** `feat(auth): add company signup flow with tenant creation`

---

### Task 1.4 — Protected Routes Middleware

**Goal:** `/dashboard` and other `(app)/*` routes require auth.

**Files to modify:**
- `apps/web/lib/supabase/middleware.ts`

**Implementation:**

Update middleware to redirect unauthenticated users:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@trackpro/database'

const PROTECTED_PATHS = ['/dashboard', '/locations', '/users', '/reports', '/settings']
const AUTH_PATHS = ['/login', '/signup']

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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users to login
  if (!user && PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
```

Create placeholder `/dashboard`:
```tsx
// apps/web/app/(app)/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth/actions'
import { logout } from '@/lib/auth/actions'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">დაშბორდი</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        გამარჯობა, {user?.full_name} ({user?.tenants?.name})
      </p>
      <form action={logout} className="mt-4">
        <Button type="submit" variant="secondary">გასვლა</Button>
      </form>
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] `/dashboard` redirects to `/login` if not authenticated
- [ ] `/login` redirects to `/dashboard` if authenticated
- [ ] Authenticated dashboard shows user name + company
- [ ] Logout button works → returns to login

**Commit:** `feat(auth): add protected route middleware`

---

### Task 1.5 — User Invitation System

**Goal:** Admin invites employees via email magic link.

**Files to create:**
- Supabase migration: invitation function + table
- `apps/web/app/(app)/users/page.tsx`
- `apps/web/app/(app)/users/invite-action.ts`
- `apps/web/app/auth/accept-invite/[token]/page.tsx`

**Implementation:**

SQL migration:
```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'employee')),
  invited_by uuid not null references public.users(id),
  token text unique not null default encode(gen_random_bytes(24), 'base64url'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_invitations_token on public.invitations(token);
create index idx_invitations_tenant on public.invitations(tenant_id);

alter table public.invitations enable row level security;

-- Only admins can see invitations for their tenant
create policy "invitations_admin_select" on public.invitations
  for select using (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) = 'admin'
  );

create policy "invitations_admin_insert" on public.invitations
  for insert with check (
    tenant_id = (select tenant_id from public.users where id = auth.uid())
    and (select role from public.users where id = auth.uid()) = 'admin'
  );

-- Function: accept invitation
create or replace function public.accept_invitation(
  p_token text,
  p_user_id uuid
)
returns void as $$
declare
  v_invitation record;
begin
  -- Find valid invitation
  select * into v_invitation
  from public.invitations
  where token = p_token
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Create user profile
  insert into public.users (id, tenant_id, full_name, role)
  values (p_user_id, v_invitation.tenant_id, v_invitation.full_name, v_invitation.role);

  -- Mark invitation as accepted
  update public.invitations
  set accepted_at = now()
  where id = v_invitation.id;
end;
$$ language plpgsql security definer;
```

`apps/web/app/(app)/users/invite-action.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const InviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'employee']),
})

export async function inviteUser(formData: FormData) {
  const parsed = InviteSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  })

  if (!parsed.success) return { error: 'არასწორი მონაცემები' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, tenants(name)')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'User not found' }

  // Create invitation
  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      tenant_id: profile.tenant_id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select('token')
    .single()

  if (insertError || !invitation) {
    return { error: 'მოწვევა ვერ შეიქმნა' }
  }

  // Send email via Resend
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite/${invitation.token}`

  await resend.emails.send({
    from: 'TrackPro <noreply@trackpro.ge>',
    to: parsed.data.email,
    subject: `${profile.tenants?.name}-ში მოგიწვიეთ`,
    html: `
      <h2>გამარჯობა, ${parsed.data.fullName}!</h2>
      <p>თქვენ მოგიწვიეთ <strong>${profile.tenants?.name}</strong>-ში TrackPro-ში.</p>
      <p><a href="${inviteUrl}" style="background:#1565C0;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">მოწვევის მიღება</a></p>
      <p style="color:#666;font-size:12px;">ლინკი მუშაობს 7 დღე.</p>
    `,
  })

  return { success: true }
}
```

`apps/web/app/auth/accept-invite/[token]/page.tsx`:
```tsx
// Server component — reads token, shows form to set password, accepts invitation
import { createClient } from '@/lib/supabase/server'
import { AcceptInviteForm } from './AcceptInviteForm'
import { notFound } from 'next/navigation'

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select('email, full_name, tenant:tenants(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) notFound()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-white p-8">
        <h1 className="text-xl font-semibold">
          {invitation.tenant?.name}-ში მოგიწვიეთ
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          დააყენე პაროლი, რომ შემოხვიდე
        </p>
        <AcceptInviteForm token={token} email={invitation.email} />
      </div>
    </div>
  )
}
```

Create `AcceptInviteForm.tsx` (client component with form to set password and call `accept_invitation` RPC).

**Acceptance criteria:**
- [ ] Admin sees `/users` page with invite form
- [ ] Email sent via Resend
- [ ] Invite link works
- [ ] User can set password and join
- [ ] Expired/used invitations show 404
- [ ] Non-admin users can't access `/users`

**Commit:** `feat(auth): add user invitation system with email magic link`

---

### Task 1.6 — Mobile Login Screen

**Goal:** Mobile app login + auto-login on next launch.

**Files to create:**
- `apps/mobile/src/screens/auth/LoginScreen.tsx`
- `apps/mobile/src/navigation/AuthNavigator.tsx`
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/hooks/use-auth.ts`

**References:**
- Mockup: `reference/designs/01_login.png`

**Implementation:**

`apps/mobile/src/hooks/use-auth.ts`:
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return { session, loading }
}
```

`apps/mobile/src/screens/auth/LoginScreen.tsx`:
```tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { loginWithPassword } from '../../services/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    try {
      await loginWithPassword(email, password)
      // Navigation handled by auth state change in RootNavigator
    } catch (err: any) {
      Alert.alert('შეცდომა', err.message || 'შესვლა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>T</Text>
      </View>
      <Text style={styles.title}>TrackPro</Text>
      <Text style={styles.subtitle}>GPS-ის თანამშრომლების ტრექინგი</Text>

      <View style={styles.form}>
        <Text style={styles.label}>ემაილი</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@company.ge"
        />

        <Text style={styles.label}>პაროლი</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'იტვირთება...' : 'შესვლა'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  logo: {
    width: 64, height: 64, borderRadius: 14, backgroundColor: '#1565C0',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  logoText: { color: 'white', fontSize: 28, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginTop: 16, color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 4 },
  form: { marginTop: 32 },
  label: { fontSize: 11, fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, fontSize: 14 },
  button: { backgroundColor: '#1565C0', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '600' },
})
```

`apps/mobile/src/navigation/RootNavigator.tsx`:
```tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../hooks/use-auth'
import LoginScreen from '../screens/auth/LoginScreen'
import HomeScreen from '../screens/employee/HomeScreen' // placeholder

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

Create `HomeScreen.tsx` as placeholder showing "გამარჯობა" + logout button.

Update `apps/mobile/App.tsx`:
```tsx
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return <RootNavigator />
}
```

**Acceptance criteria:**
- [ ] Login screen renders on iOS + Android
- [ ] Successful login → Home screen
- [ ] Wrong credentials → Alert
- [ ] App remembers session on next launch (no re-login)
- [ ] Logout returns to login

**Commit:** `feat(mobile): add login screen and auth navigation`

---

## ✅ Phase 1 Complete Checklist

- [ ] Company signup creates tenant + admin user
- [ ] Login works on web + mobile
- [ ] Invitations sent via Resend, accepted via magic link
- [ ] RLS isolates tenants (test with 2 accounts)
- [ ] Logout works on both platforms
- [ ] Session persists across page reloads / app restarts
- [ ] All forms in Georgian
- [ ] All API errors handled gracefully

**🎉 Move to Phase 2: `03_PHASE_WEB_ADMIN.md`**
