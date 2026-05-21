# Email Infrastructure (Resend) — Playbook

> User-action checklist to wire real email alerts via Resend.
> ბოლო განახლება: 2026-05-21

რა არის ეს ფაილი: Resend.com-ის dashboard-ში გასაკეთებელი ნაბიჯები რომ AlertSettingsForm-ის "Email" toggle რეალურად მუშაოს. კოდის მხარე უკვე shipped-ია — Edge Function ცადო-ცადო `RESEND_API_KEY` env var-ი ცარა-ცარა automatically activate-ი ცარა.

ორი ფაზაა:

1. **Phase A — Sandbox sending** (~15 წუთი) — Resend account + API key + sandbox sender. ცადო-ცადო test emails-ი ცარა-ცარა მისდის შენი admin ემაილზე.
2. **Phase B — Custom domain** (~30 წუთი + ~24h DNS propagation) — `alerts@trackpro.ge`-ი ცარა-ცარა sender-ად, ცარა-ცარა customer-მ ნახოს professional brand.

---

## ⚙️ Phase A — Sandbox (now)

### A1. Resend account
- [ ] https://resend.com → **Sign up** ერთხელ, Sazeo LLC-ის ემაილით
- [ ] Free tier: 3,000 emails/month, 100/day — საკმარისია launch-ისთვის
- [ ] Verify your email (clicking the activation link Resend sends)

### A2. API key
- [ ] Dashboard → **API Keys** → **Create API Key**
- [ ] Name: `trackpro-production`
- [ ] Permission: **Full access** (write + read)
- [ ] **Reveal + copy** — ცარა-ცარა "re_xxxxx..." starts with `re_`
- [ ] ⚠️ chat-ში არ ჩასვა — მხოლოდ Supabase secret-ად

### A3. Supabase Edge Function secrets
- [ ] https://supabase.com/dashboard/project/lekogoghgbvmrlqcqmhv/functions
- [ ] Click **geofence-event** function
- [ ] **Secrets → Add new secret**:
  - Name: `RESEND_API_KEY`
  - Value: `re_xxx...` (from A2)
- [ ] Save

### A4. (Optional) APP_URL secret
ცადო-ცადო email-ი ცარა-ცარა link-ი `/alerts` + `/settings` ცარა-ცარა. Default-ი `https://tracking-service-web.vercel.app`-ია, ცადო-ცადო custom domain-ი ცარა-ცარა:
- [ ] **Secrets → Add new secret**:
  - Name: `APP_URL`
  - Value: `https://trackpro.ge` (post-DNS) ან ცადო-ცადო default-ი

### A5. Deploy Edge Function update
ცარა მე ცადო-ცადო email logic-ი update-ი, ცარა-ცარა shipped-ი — ცადო-ცადო local-ად deploy:
```powershell
pnpm dlx supabase functions deploy geofence-event --project-ref lekogoghgbvmrlqcqmhv
```
ცადო-ცადო login-ი ცარა-ცარა prompt → Supabase access token (Dashboard → Account → Access Tokens).

### A6. End-to-end test
1. Login at https://tracking-service-web.vercel.app as admin (`review@trackpro.ge`)
2. Navigate to `/settings → შეტყობინებები`
3. Toggle **Email** on for `mock_gps` (or any)
4. Add your real email in **Email მიმღებები** textarea (e.g. `g_merebashvili@yahoo.com`)
5. Save → "შენახულია ✓"
6. Trigger an alert:
   - Easiest: in mobile app submit a fake-GPS ping (set `is_mock=true` in geofence event POST)
   - Alternative: directly POST to the Edge Function with a test payload
7. Within ~30 seconds: email arrives at your inbox
8. Sender shows as `TrackPro <onboarding@resend.dev>` (sandbox default)

თუ email არ მოვიდა:
- Resend Dashboard → **Logs** → ნახე delivery status
- Supabase Dashboard → Functions → geofence-event → **Logs** → ნახე `[geofence-event] resend status=` lines

### A7. Verify deliverability
- [ ] **Inbox** (not Spam) → ცადო-ცადო Gmail/Yahoo ცარა-ცარა spam filter-ი ცარა-ცარა aggressive
- [ ] თუ Spam-ში → ჯერ-ჯერობით OK (sandbox sender = generic reputation); Phase B fixes this

---

## 🚀 Phase B — Custom domain `alerts@trackpro.ge`

⚠️ Phase A-ი ცადო-ცადო pass-ი იყოს. ცარა Phase B-ი domain ownership verification-ი ცარა.

### B1. Add domain in Resend
- [ ] Resend Dashboard → **Domains → Add Domain**
- [ ] Domain: `trackpro.ge`
- [ ] Region: closest to Georgia → **EU (Ireland)**
- [ ] Add

Resend ცადო-ცადო 4-5 DNS records-ი ცარა-ცარა გჩვენებთ:
- **MX** record (mail routing)
- **TXT** record for SPF (sender policy framework)
- **TXT** record for DKIM signature
- **TXT** record for DMARC policy (optional but recommended)

### B2. Add DNS records at your registrar
- [ ] სად რეგისტრირებული გაქვს `trackpro.ge`-ი? (rs.ge / namecheap / cloudflare / etc.)
- [ ] Login to that registrar's control panel → DNS management for `trackpro.ge`
- [ ] **Add each record** exactly as Resend shows:
  - Type, Host/Name, Value/Content, TTL (default OK, e.g. 3600)
- [ ] ⚠️ ცარა-ცარა MX record-ი ცადო-ცადო subdomain-ისთვის (`send.trackpro.ge` ცადო-ცადო rule-ი) — ცარა-ცარა web hosting-ი ცარა-ცარა conflict-ი

### B3. Verify in Resend
- [ ] Resend Dashboard → Domains → trackpro.ge
- [ ] Click **Verify DNS Records**
- [ ] ცადო-ცადო records-ი ცარა-ცარა green checkmarks → SPF + DKIM + (DMARC) verified
- [ ] DNS propagation ~5-60 minutes typically, up to 24h max

### B4. Update Supabase secret
- [ ] Supabase → Edge Functions → geofence-event → Secrets
- [ ] **Add secret**:
  - Name: `EMAIL_FROM`
  - Value: `TrackPro <alerts@trackpro.ge>`
- [ ] Save
- [ ] Re-deploy Edge Function (no code change, just trigger redeploy to pick up secret):
  ```powershell
  pnpm dlx supabase functions deploy geofence-event --project-ref lekogoghgbvmrlqcqmhv
  ```

### B5. Smoke test
- [ ] Trigger an alert (same as A6)
- [ ] Verify sender shows as `TrackPro <alerts@trackpro.ge>` (not `onboarding@resend.dev`)
- [ ] Verify Gmail/Yahoo → **Inbox** (not Spam)
- [ ] Send to multiple recipients to confirm fan-out works

---

## 📋 Operations FAQ

### Q: Free tier limits?
A: 100 emails/day, 3,000/month. ცადო-ცადო first 5 customers × 10 alerts/day = 50/day → comfortable. Upgrade to Pro ($20/month) when >50 active customers.

### Q: Bounce / complaint handling?
A: Resend automatically handles soft/hard bounces. Hard bounces (invalid email) get suppressed automatically. Check Dashboard → Suppressions list weekly.

### Q: Email template changes?
A: HTML template lives in `supabase/functions/geofence-event/index.ts` `buildHtml()` function. Edit + redeploy.

### Q: ცადო-ცადო recipient ცადო-ცადო unsubscribe?
A: For transactional alerts (this category), legally not required since recipient is the admin who configured it. For marketing emails (post-MVP), use Resend's built-in unsubscribe links.

### Q: Multiple email languages?
A: Currently Georgian only. Multi-lang would require:
1. `users.locale` column (already exists)
2. `buildHtml` accepts a locale arg
3. English/Russian translations

Not a launch blocker.

### Q: How to debug "email didn't send"?
A: Three places to check:
1. **Resend Dashboard → Logs** — did request arrive at Resend?
2. **Supabase Functions → Logs** — did Edge Function call Resend? `[geofence-event] resend status=` line
3. **Recipient inbox + Spam** — actually delivered?

---

## 🚨 Common errors + fixes

| Error | Fix |
|---|---|
| `RESEND_API_KEY not set` in logs | Secret not added to Edge Function — re-do A3 |
| 403 from Resend API | API key revoked / invalid — generate new in A2 |
| 422 "from address not verified" | Verify domain (Phase B) or use sandbox sender |
| Emails delivered but in Spam | Run Phase B (SPF/DKIM/DMARC) — sandbox sender has generic reputation |
| 429 rate limit | Free tier 100/day exceeded — upgrade Pro or wait 24h |
| Email arrived but body broken | HTML template syntax error — check buildHtml() output in logs |

---

## 📊 Monitoring

**Daily check (1 min):**
- [ ] **Resend → Logs** — any failed deliveries?

**Weekly check (5 min):**
- [ ] **Resend → Suppressions** — anyone bouncing?
- [ ] **Resend → Domain reputation** — score below 90? investigate
- [ ] **Supabase → Functions → Logs** — any errors?

---

## 🔗 დაკავშირებული რესურსები

- Resend Docs: https://resend.com/docs/send-with-supabase-edge-functions
- Resend Domains: https://resend.com/docs/dashboard/domains/introduction
- DNS verification: https://resend.com/docs/dashboard/domains/dns
- Email template designer (visual): https://resend.com/docs/dashboard/templates
- Edge Function code: `supabase/functions/geofence-event/index.ts` (`sendAlertEmail`, `buildHtml`)
- Settings UI: `apps/web/components/settings/AlertSettingsForm.tsx`
- Migration: `supabase/migrations/20260521000001_tenant_alert_settings.sql`

---

ფაილი დასრულდა. Update-ცა Phase A/B completion-ის შემდეგ.
