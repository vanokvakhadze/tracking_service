import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AcceptInviteForm } from './AcceptInviteForm'

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Read invitation via a SECURITY DEFINER lookup. The invitations table RLS
  // would otherwise hide rows from the anon caller; this lookup intentionally
  // exposes only the minimal fields needed to render the form.
  const { data: invitation } = await supabase
    .from('invitations')
    .select('email, role, tenant:tenants(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) notFound()

  const tenantName = Array.isArray(invitation.tenant)
    ? invitation.tenant[0]?.name
    : invitation.tenant?.name

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-8">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
        {tenantName ?? 'TrackPro'}-ში მოგიწვიეთ
      </h1>
      <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
        დააყენე პაროლი, რომ შემოხვიდე
      </p>
      <AcceptInviteForm token={token} email={invitation.email} />
    </div>
  )
}
