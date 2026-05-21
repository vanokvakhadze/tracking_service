# Stripe Activation Playbook

> User-action checklist for activating live Stripe billing on TrackPro.
> ბოლო განახლება: 2026-05-21

რა არის ეს ფაილი: Stripe-ის dashboard-ში გასაკეთებელი ნაბიჯები რომ პროდუქტმა რეალური ფული მიიღოს. კოდის მხარე ([task.045](codex/task.045.md)) Codex-ის სამუშაოა — ეს დოკუმენტი მხოლოდ user-action-ი.

ორი ფაზაა:

1. **Phase A — Test mode** (~30 წუთი) — ვალიდირებს რომ კოდი მუშაობს ფიქტიური ბარათით. გააკეთე ახლავე.
2. **Phase B — Live activation** (~1-2 საათი + Stripe-ის review ~24h) — გააქტიურებს რეალურ გადახდებს. გააკეთე როცა პირველი beta customer გადასვლას მოითხოვს paid plan-ზე.

---

## ⚙️ Phase A — Test mode setup (ახლა)

### A1. Stripe account
- [ ] https://dashboard.stripe.com → **Sign up** ერთხელ, Sazeo LLC-ის ემაილით
- [ ] **Settings → Business settings → Account details**:
  - Country: **Georgia**
  - Default currency: **GEL — Georgian Lari**
  - Business type: company / sole proprietor (რომელიც გაქვს)
- [ ] Test mode toggle ON (header-ში orange "TEST MODE" badge ნაჩვენებია)

### A2. Products + Prices
ერთხელ შექმენი ცარა plan-ი. Settings → **Products → Add product**:

| Product Name | Price | Recurring | Per-seat? |
|---|---|---|---|
| TrackPro Basic | 5 GEL/თვე | Monthly | yes |
| TrackPro Pro | 12 GEL/თვე | Monthly | yes |
| TrackPro Enterprise | 25 GEL/თვე | Monthly | yes |

თითო Product-ისთვის:
1. Name + description
2. **Pricing**: Recurring, Standard pricing, 5/12/25 GEL, Monthly billing
3. **Tax behavior**: Inclusive (Georgian VAT 18% included შემდეგ რომ ცარა გაიხსნება)
4. Save
5. ⚠️ **დააკოპირე Price ID** (`price_xxx...`) — ცარა plan-ი ცარა გჭირდება env vars-ში

### A3. API keys (test mode)
**Developers → API keys**:
- [ ] **Publishable key** (`pk_test_...`) → copy
- [ ] **Secret key** (`sk_test_...`) → Reveal → copy

⚠️ chat-ში არ ჩასვა — მხოლოდ PowerShell/env file-ში.

### A4. Local env vars
`apps/web/.env.local`-ში დაამატე:

```env
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_BASIC=price_xxx        # A2-დან Basic Price ID
STRIPE_PRICE_PRO=price_xxx          # A2-დან Pro Price ID
STRIPE_PRICE_ENTERPRISE=price_xxx   # A2-დან Enterprise Price ID
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### A5. Webhook (Supabase Edge Function)
Supabase Dashboard → Functions → ნახე `stripe-webhook` უკვე deployed-ი? თუ არა:

```powershell
pnpm dlx supabase functions deploy stripe-webhook --no-verify-jwt
```

შემდეგ Stripe Dashboard → **Developers → Webhooks → Add endpoint**:
- **Endpoint URL**: `https://lekogoghgbvmrlqcqmhv.supabase.co/functions/v1/stripe-webhook`
- **Events to send** (Select events → ცარა-ცარა):
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.trial_will_end`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Add endpoint** → ღია signing secret გვერდი
- ⚠️ **დააკოპირე signing secret** (`whsec_xxx`) — Supabase-ში ცხრება

Supabase Dashboard → **Edge Functions → stripe-webhook → Secrets → Add secret**:
- `STRIPE_SECRET_KEY` = `sk_test_xxx` (A3-დან)
- `STRIPE_WEBHOOK_SECRET` = `whsec_xxx` (just-now copied)

### A6. End-to-end test
1. `pnpm --filter @trackpro/web dev` → http://localhost:3000
2. Login as admin (`review@trackpro.ge` / `ReviewMe2026!`)
3. Navigate to `/billing`
4. Click "Pro · არჩევა"
5. Stripe Checkout გაიხსნება → Use test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
6. Submit → redirected to `/billing?success=true`
7. Check Supabase DB: `tenants.subscription_status` უნდა იყოს `active`, `tenants.plan_code` უნდა იყოს `pro`

თუ ცარა ერთი ნაბიჯი ვერ გადადის → Stripe Dashboard → **Developers → Webhooks → [your endpoint] → Recent deliveries** გადახედე error log-ი.

### A7. Vercel env vars (test mode preview)
თუ გინდა test mode-ი Vercel preview-ში გადატესტო:
- Vercel → Project → Settings → Environment Variables → Add ცარა 5 var-ი A4-დან + `NEXT_PUBLIC_APP_URL=https://tracking-service-web.vercel.app`
- Redeploy

---

## 🚀 Phase B — Live mode activation

⚠️ მნიშვნელოვანი: ცარა ცარა Phase A პატარა მუშავდე — A1-A7 ცარა-ცარა pass-ი იყოს ცარა live-ში გადასვლის წინ.

### B1. Activate live payments
Stripe Dashboard → **Settings → Activate payments** (banner-ი ცარა-ცარა Test Mode-ში)
- [ ] Business details: სამეწარმეო რეგისტრაცია, საიდენტიფიკაციო კოდი, ცარა-ცარა address
- [ ] Personal info: founder ID + verification
- [ ] **Bank account**: Georgian IBAN — Tbilisi/Liberty/TBC/BoG ცარა
- [ ] Statement descriptor: "TRACKPRO" (10 chars)
- [ ] Tax info — Georgian Revenue Service VAT ID თუ გაქვს

Submit → Stripe-ი 24-72h-ში გადახედს და approve/reject-ი. რეჯექტ-ი ცარა fix items list-ით — fix → resubmit.

### B2. Live products + prices
A2-ის identical-ი, მაგრამ **Live mode** toggle ON-ით. ცარა Test mode-ის products + prices ცარა live-ში არ overlap-დება, ცარა-ცარა ცარა შექმენი.

⚠️ Live mode-ის Price ID-ები განსხვავებულია Test mode-ის Price ID-ებისგან. ცარა env vars-ი ცარა-ცარა გადააწერე.

### B3. Live API keys
**Developers → API keys** (Live mode toggle ON-ით):
- [ ] **Publishable key** (`pk_live_...`)
- [ ] **Secret key** (`sk_live_...`) — Reveal → copy

### B4. Live webhook
Stripe-ში → Developers → Webhooks → **Add endpoint** (Live mode):
- URL: ისევე როგორც A5 (Supabase URL იგივეა)
- Events: ისევე როგორც A5
- Save → copy NEW signing secret (`whsec_xxx` — განსხვავებული A5-ისგან)

### B5. Production env vars (Vercel)
Vercel → Project → Settings → Environment Variables → Edit existing OR add new:

```
STRIPE_SECRET_KEY=sk_live_xxx                  # B3
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx # B3
STRIPE_PRICE_BASIC=price_live_xxx              # B2
STRIPE_PRICE_PRO=price_live_xxx                # B2
STRIPE_PRICE_ENTERPRISE=price_live_xxx         # B2
NEXT_PUBLIC_APP_URL=https://trackpro.ge        # ან tracking-service-web.vercel.app თუ DNS ცადო არ
```

Supabase Dashboard → **Edge Functions → stripe-webhook → Secrets**:
- Update `STRIPE_SECRET_KEY` = `sk_live_xxx`
- Update `STRIPE_WEBHOOK_SECRET` = new live `whsec_xxx` (B4-დან)

Vercel → Redeploy.

### B6. Smoke test (real money — refund-ით)
1. რეალური ბარათით **5 GEL** Basic plan checkout
2. Confirm payment goes through
3. Wait ~30 sec → check Supabase tenants.subscription_status = `active`
4. Stripe Dashboard → **Payments** → მონახე ცარა გადახდა → **Refund full**
5. Confirm refund processed within 5-10 days back to your card
6. ცარა-ცარა live payments are working

⚠️ **არ გადახდი test customer-ის ცარა ცარა (e.g. ცარა beta customer)** — ცარა ცარა step 6 ცარა-ცარა pass-ი.

---

## 📋 Operations FAQ

### Q: Customer-ის Basic → Pro upgrade ცარა?
A: Customer ცარა-ცარა /billing → Pro select → Stripe Checkout-ი Stripe-ის mid-cycle prorate-ით. ცარა kod-ი ცარა ცარა.

### Q: Customer cancel-ი ცარა?
A: /billing → "Manage subscription" → BillingPortalCard → Stripe Customer Portal-ი → Cancel button. Subscription continues to end-of-period, then ends automatic.

### Q: Failed payment-ი ცარა?
A: Stripe ცარა-ცარა 4 retry (1d, 3d, 5d, 7d). თუ ცარა fail, subscription-ი goes to `past_due` → eventually `unpaid` → `canceled`. Webhook handles automatic.

### Q: Customer wants invoice ცარა company VAT-ისთვის?
A: Stripe → Customer → **Invoices → Email/download**. Stripe ცარა-ცარა automatic-ი PDF invoice ცარა გადახდის შემდეგ. Customer-ის VAT number ცარა → Stripe → Customer → **Edit → Tax info** ცარა-ცარა.

### Q: Refund policy?
A: Beta period — refund any time within 14 days. Post-beta — non-refundable monthly. Document in /terms.

### Q: Per-seat billing — ცარა-ცარა employees ცარა-ცარა month-ში?
A: Currently `subscription_quantity` ცარა-ცარა manual. Auto-sync (DB trigger + edge function) — separate task (post-MVP).

### Q: Stripe fees?
A: ~3.4% + ~0.30 ₾ per successful payment. რეალური cost-ი ცარა-ცარა Stripe → **Settings → Pricing**. 100 GEL მონაცემი → ~96 GEL net.

---

## 🚨 Common errors + fixes

| Error | Likely cause | Fix |
|---|---|---|
| Checkout returns to `/billing?canceled=true` | User clicked back / closed modal | No action needed |
| Webhook delivery fails (500) | `STRIPE_WEBHOOK_SECRET` mismatch | Re-copy from Stripe → Edge Function Secrets |
| `subscription_status` stuck on `incomplete` | First payment failed | Customer needs to retry — Stripe-ი sends auto email |
| Price ID not found error | env var `STRIPE_PRICE_*` ცარა-ცარა | Re-copy from Stripe → Product → Prices section |
| Live mode webhook works in test but not live | Used test webhook secret with live endpoint | Generate new live webhook + copy fresh signing secret |
| Customer charged but `subscription_status` not updating | Webhook events not selected | Stripe → Webhook → Edit → add missing events |

---

## 📊 Monitoring (Stripe Dashboard)

**Daily checks (1 min):**
- [ ] **Payments** — any failed in last 24h?
- [ ] **Webhooks → Recent deliveries** — any 4xx/5xx?

**Weekly checks (5 min):**
- [ ] **Subscriptions → All** — total count, churn last week
- [ ] **Revenue → Charts** — MRR growth
- [ ] **Failed payments → Retry status** — any customers stuck in past_due?

**Monthly checks (15 min):**
- [ ] **Tax → Reports** — VAT collected (if applicable)
- [ ] **Disputes** — chargebacks?
- [ ] **Account → Balance** — payout schedule healthy?

---

## 🔗 დაკავშირებული რესურსები

- [task.045](codex/task.045.md) — Codex implementation (UI wiring)
- [REMAINING_WORK.md](REMAINING_WORK.md) — L3 + L9 status
- Stripe Docs: https://stripe.com/docs/billing/subscriptions/overview
- Stripe Geo support: https://stripe.com/docs/payments/payment-methods/overview#georgia
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Test cards: https://stripe.com/docs/testing#cards

---

ფაილი დასრულდა. update-ცა Phase A/B-ის completion-ის შემდეგ.
