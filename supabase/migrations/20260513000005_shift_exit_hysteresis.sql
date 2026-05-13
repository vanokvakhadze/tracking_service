-- Migration: 60-second EXIT hysteresis on shifts.
--
-- The geofence Edge Function no longer closes a shift on the first EXIT
-- event from the OS. Instead it stamps `pending_close_at` 60s into the
-- future. A subsequent ENTER for the same user clears the timestamp
-- (re-entry cancels the close). When the timestamp passes without a
-- re-entry the next event arrival OR a periodic call to
-- public.finalize_pending_shifts() commits the close.
--
-- This prevents brief glitches (lunch trip, GPS jitter, walking past the
-- edge of the trigger zone) from prematurely ending the workday.

alter table public.shifts
  add column if not exists pending_close_at timestamptz;

create index if not exists shifts_pending_close_idx
  on public.shifts(pending_close_at)
  where pending_close_at is not null;

-- Drain any pending closes whose 60-second timer has elapsed. Idempotent
-- and cheap to call — the partial index above keeps the scan tight.
create or replace function public.finalize_pending_shifts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  with closed as (
    update public.shifts s
    set
      status = 'completed',
      ended_at = s.pending_close_at,
      pending_close_at = null,
      updated_at = now()
    where
      s.status = 'active'
      and s.pending_close_at is not null
      and s.pending_close_at <= now()
    returning s.id
  )
  select count(*) into v_count from closed;
  return v_count;
end;
$$;

revoke all on function public.finalize_pending_shifts() from public;
grant execute on function public.finalize_pending_shifts() to authenticated;
