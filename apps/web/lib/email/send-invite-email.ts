interface SendInviteEmailParams {
  to: string
  inviteUrl: string
  companyName: string
  inviterName: string | null
  role: 'user' | 'manager' | 'tenant_admin'
  expiresAt: Date
}

const ROLE_LABEL: Record<SendInviteEmailParams['role'], string> = {
  user: 'თანამშრომელი',
  manager: 'მენეჯერი',
  tenant_admin: 'ადმინისტრატორი',
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildHtml(params: SendInviteEmailParams) {
  const company = escapeHtml(params.companyName)
  const inviter = params.inviterName ? escapeHtml(params.inviterName) : null
  const roleLabel = ROLE_LABEL[params.role]
  const expiresIso = params.expiresAt.toISOString().slice(0, 10)

  return `<!doctype html>
<html lang="ka"><body style="margin:0;padding:0;background:#f7f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1c1c;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:12px;border:1px solid #e6e6ec;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e6e6ec;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6b6b75;">TrackPro · მოწვევა</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#1c1c1c;">თქვენ მოწვეული ხართ ${company}-ის workspace-ში</h1>
      </div>
      <div style="padding:24px 28px;font-size:14px;line-height:1.55;color:#333;">
        ${
          inviter
            ? `<p style="margin:0 0 12px;">${inviter}-მა მოგიწვიათ TrackPro workspace-ში როგორც <strong>${roleLabel}</strong>.</p>`
            : `<p style="margin:0 0 12px;">თქვენ მოწვეული ხართ TrackPro workspace-ში როგორც <strong>${roleLabel}</strong>.</p>`
        }
        <p style="margin:0 0 20px;color:#6b6b75;font-size:13px;">TrackPro — GPS-ით თანამშრომელთა ცვლების ტრექინგ პროდუქტი. რეგისტრაცია ერთ ნაბიჯში.</p>
        <p style="margin:0 0 24px;">
          <a href="${escapeHtml(params.inviteUrl)}" style="display:inline-block;background:#2f63ff;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">მოწვევის მიღება</a>
        </p>
        <p style="margin:0 0 4px;font-size:12px;color:#6b6b75;">ან გადააკოპირე ეს ბმული:</p>
        <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#2f63ff;">${escapeHtml(params.inviteUrl)}</p>
        <p style="margin:0;font-size:12px;color:#6b6b75;">მოწვევის ვადა — ${expiresIso}. ვადის გასვლის შემდეგ ბმული აღარ იმუშავებს.</p>
      </div>
      <div style="padding:16px 28px;background:#f7f7fa;border-top:1px solid #e6e6ec;font-size:11px;color:#6b6b75;">
        TrackPro · Sazeo LLC · <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tracking-service-web.vercel.app')}" style="color:#6b6b75;text-decoration:underline;">tracking-service-web.vercel.app</a>
      </div>
    </div>
  </div>
</body></html>`
}

function buildText(params: SendInviteEmailParams) {
  const roleLabel = ROLE_LABEL[params.role]
  const inviterLine = params.inviterName
    ? `${params.inviterName}-მა მოგიწვიათ ${params.companyName}-ის workspace-ში როგორც ${roleLabel}.`
    : `თქვენ მოწვეული ხართ ${params.companyName}-ის workspace-ში როგორც ${roleLabel}.`
  return `${inviterLine}\n\nმოწვევის მიღება: ${params.inviteUrl}\n\nმოწვევის ვადა: ${params.expiresAt.toISOString().slice(0, 10)}.\n\n— TrackPro · Sazeo LLC`
}

export interface SendInviteEmailResult {
  sent: boolean
  reason?: string
}

export async function sendInviteEmail(
  params: SendInviteEmailParams,
): Promise<SendInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(
      `[invite-email] skipped (RESEND_API_KEY not set) to=${params.to} company=${params.companyName}`,
    )
    return { sent: false, reason: 'no_api_key' }
  }

  const from = process.env.EMAIL_FROM ?? 'TrackPro <onboarding@resend.dev>'
  const subject = `[TrackPro] თქვენ მოწვეული ხართ ${params.companyName}-ის workspace-ში`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject,
        html: buildHtml(params),
        text: buildText(params),
      }),
    })
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(
        `[invite-email] resend status=${response.status} body=${errorBody.slice(0, 200)}`,
      )
      return { sent: false, reason: `resend_${response.status}` }
    }
    return { sent: true }
  } catch (err) {
    console.error('[invite-email] send failed', err)
    return { sent: false, reason: 'network_error' }
  }
}
