# task.013 — Replace web `globals.css` with KAYA tokens

**Type:** 🤖 Codex
**Depends on:** task.011
**Commit:** `feat(web): add KAYA design tokens to globals.css`

---

## Read first
- `tasks/00_AI_AGENT_RULES.md`
- `tasks/reference/DESIGN_RULES.md` § "Design Tokens" (lines 38–99)

## Goal
Replace the scaffolded `apps/web/app/globals.css` with the KAYA token CSS so the rest of the app can use `var(--color-*)`.

## File to modify

### `apps/web/app/globals.css` (REPLACE entire content)

```css
@import "tailwindcss";

:root {
  /* Surfaces */
  --color-bg: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-surface-2: #F1F5F9;
  --color-border: #E2E8F0;
  --color-border-2: #EDF2F7;

  /* Text */
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94A3B8;

  /* Primary — KAYA blue (only accent) */
  --color-accent: #1565C0;
  --color-accent-hover: #0D47A1;
  --color-accent-soft: #1E88E5;
  --color-accent-tint: #E3F2FD;
  --color-accent-fg: #FFFFFF;

  /* Semantic — signal only, never UI accent */
  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-success-text: #15803D;
  --color-success-border: #BBF7D0;

  --color-warning: #CA8A04;
  --color-warning-bg: #FEFCE8;
  --color-warning-text: #A16207;
  --color-warning-border: #FEF08A;

  --color-error: #DC2626;
  --color-error-bg: #FEF2F2;
  --color-error-text: #B91C1C;
  --color-error-border: #FECACA;

  --color-info: #2563EB;
  --color-info-bg: #EFF6FF;
  --color-info-text: #1D4ED8;
  --color-info-border: #BFDBFE;

  /* Sizing */
  --radius: 6px;
  --radius-lg: 8px;
  --radius-full: 9999px;
  --app-bar-h: 48px;
  --sidebar-w-collapsed: 56px;
  --sidebar-w-expanded: 220px;

  /* Typography */
  --font-sans: "Noto Sans Georgian", "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;

  /* Motion */
  --motion-fast: 120ms;
  --motion-base: 150ms;
  --motion-modal: 200ms;
}

html, body {
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.45;
}

/* Tabular numerics for timers, prices, IDs, percentages */
.tnum { font-variant-numeric: tabular-nums; }
```

## Acceptance criteria
- [ ] `apps/web/app/globals.css` matches the content above exactly
- [ ] `pnpm --filter @trackpro/web dev` still starts without CSS errors
- [ ] The new `globals.css` itself does not introduce any `dark:*` classes

> Note: the scaffold's `apps/web/app/page.tsx` still contains `dark:*` classes from the Next.js template. That is expected at this point. **Do not touch `page.tsx` here** — task.015 replaces it entirely with the TrackPro placeholder, which removes those classes. The project becomes light-only after task.015.

## Commit
```powershell
git add apps/web/app/globals.css
git commit -m "feat(web): add KAYA design tokens to globals.css"
```

## DO NOT
- ❌ Add `@theme` block, custom Tailwind config, or font imports yet — keep minimal
- ❌ Touch `page.tsx` (task.015 replaces it)
- ❌ Touch `layout.tsx` (Phase 2 refines it)
