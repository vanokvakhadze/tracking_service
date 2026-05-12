# task.009 — Run schema migration in Supabase

**Type:** 👤 Manual (Supabase SQL editor)
**Depends on:** task.008
**Commit:** N/A

---

## Goal
Apply `tasks/reference/tracking_saas_schema.sql` to the Supabase staging project. Verify RLS + seed data.

---

## Steps

1. Open `tasks/reference/tracking_saas_schema.sql` in your editor, copy the **entire** contents.
2. Supabase dashboard → **SQL Editor** → "New query".
3. Paste, click "Run" (or Ctrl+Enter). Should complete in ~10 seconds.
4. If any error: stop, copy the full error message, send it to Claude before proceeding.

## Verify

- **Database → Tables**: should see `tenants`, `users`, `locations`, `shifts`, `geofence_events`, `plans` (exact list per the schema file).
- Each table should show a 🔒 icon → **RLS is enabled**.
- **Authentication → Policies**: every table has at least one policy.
- **Table editor → `plans`**: should contain 3 seed rows (Basic / Pro / Enterprise). If not, the SQL file might not include seed — flag to Claude.

## Acceptance criteria
- [ ] All tables from the schema file exist
- [ ] RLS is enabled on every table (🔒)
- [ ] `plans` table has 3 seed rows
- [ ] No errors in SQL editor
