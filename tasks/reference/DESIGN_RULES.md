# DESIGN_RULES.md

> **წესების ფაილი Claude-ისთვის.** დააკოპირე ეს ფაილი მთლიანად, შემდეგ მოითხოვე UI მუშაობა. ეს არის **single source of truth** — ყოველი UI ცვლილება ემორჩილება ამ წესებს.
>
> სტატუსი: v1.0 · Standard: KAYA Design System · Scope: ყველა Sazeo ციფრული პროდუქტი

---

## 🚫 აკრძალულია (PR rejected if violated)

1. **არ გამოიყენო hardcoded hex colors** UI კოდში. ყოველთვის `var(--color-*)`. გამონაკლისი მხოლოდ decorative SVG-ის შიგნით.
2. **არ გამოიყენო `dark:*` Tailwind utility classes**. სისტემა **light only**.
3. **არ გამოიყენო status colors როგორც UI accent**. Success / warning / danger / info მხოლოდ **signal-ად** badge-ში ან icon-ში. პრიმარი CTA — მხოლოდ KAYA blue.
4. **არ გადააფასო ფერი თვითნებურად**. „უფრო კარგად გამოიყურება ცისფერი" — არ არის მიზეზი.
5. **არ გადააფასო border radius**. 4 (button), 6 (default), 8 (large), full (pill). სხვა მნიშვნელობა — არ.
6. **არ შექმნა ცალკე `AppShell` / `KayaShell` კომპონენტი**. გამოიყენე საერთო `<Sidebar>`.
7. **არ გადაარქვა workspace branding-ის position-ი**. ის ყოველთვის TopBar-ის მარცხენა მხარეს, არასდროს ცენტრში.
8. **არ გამოიყენო shadow-ი hero card-ისთვის**. KAYA = thin borders, არა drop shadow.

---

## ✅ სავალდებულო

1. **KAYA blue `#1565C0`** — ერთადერთი primary accent
2. **5-zone layout** ყველა authenticated app გვერდზე
3. **base font 13px**, scale strict: 20/16/14/12/11
4. **Button heights**: 28/32/36px (sm/md/lg) — არასდროს უფრო დიდი
5. **App bar 48px** (NOT 64px)
6. **Sidebar 220px expanded** / 56px collapsed
7. **Status pills**: bg-{tone}-50 + text-{tone}-700 + border-{tone}-200
8. **Tabular-nums** ციფრებზე (ტაიმერი, ID, ფასი)
9. **Focus-visible**: 2px solid `var(--color-accent)` ring + 2px offset
10. **Noto Sans Georgian** + Inter fallback
11. **Accessibility**: real semantic HTML, keyboard navigation, ARIA, WCAG AA contrast (4.5:1 text)

---

## 🎨 Design Tokens (exact values — დააკოპირე CSS-ში)

```css
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

  /* Primary — KAYA blue (ერთადერთი accent) */
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
```

---

## 📐 Typography Scale (strict)

```css
font-family: "Noto Sans Georgian", "Inter", sans-serif;
font-size: 13px;     /* base */
line-height: 1.45;

.h-xl    { font-size: 20px; font-weight: 600; line-height: 1.3; }                            /* page title */
.h-lg    { font-size: 16px; font-weight: 600; line-height: 1.35; }                           /* card title */
.h-md    { font-size: 14px; font-weight: 600; line-height: 1.4; }
.h-sm    { font-size: 12px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; }  /* section labels */
.t-label { font-size: 12px; font-weight: 500; }                                              /* form labels */
.t-help  { font-size: 11px; font-weight: 400; color: var(--color-text-secondary); }          /* helper text */
.t-tiny  { font-size: 10.5px; font-weight: 600; }
```

**წესი:** ციფრებზე — `font-variant-numeric: tabular-nums`. ეს ეხება ტაიმერებს, ფასებს, ID-ებს, percentages.

---

## 📏 Spacing — 4px grid

| ელემენტი | Padding | Height |
|---------|---------|--------|
| Panel | 18px / 22px | — |
| Button compact (sm) | 6px / 12px | 28px |
| Button default (md) | 8px / 14px | 32px |
| Button large (lg) | 8px / 16px | 36px |
| Input compact | 7px / 10px | 28px |
| Input default | 9px / 12px | 32px |
| Card content | 18px / 22px | — |
| Card header | 12px / 22px | — |
| Card footer | 10px / 22px | — |
| Gap between sections | 16-24px | — |
| Nav item | 6px / 10px | — |

---

## 🖼 5-Zone Layout (ყველა app გვერდი)

```
┌───────────────────────────────────────────────────────┐
│ Zone 0 — TopBar (48px, fixed, full width)             │
│ [T] Workspace · · · · · · ·  [+] [🔍] [🔔] [user ▾]   │
├──────────┬────────────────────────────────────────────┤
│ Zone 1   │ Zone 3 — Sub-header (56px)                 │
│ Sidebar  │ [Page Title] [Actions →]                   │
│ (220px)  ├────────────────────────────────────────────┤
│          │                                            │
│ Mode ▾   │ Zone 4 — Main panel (scrollable)           │
│          │   ↑ Tables, charts, forms here             │
│ Section  │                                            │
│  • item  │                                            │
│  • item  │                                            │
└──────────┴────────────────────────────────────────────┘
```

გრიდი:
```css
.app {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 48px 1fr;
  height: 100vh;
}
.topbar { grid-column: 1 / -1; }  /* full width */
```

**გამონაკლისი:** Marketing / landing / signup გვერდები გათავისუფლებულია 5-zone-ისგან. შეუძლიათ split layout, hero sections, etc.

---

## 🔧 Components (strict spec)

### 1. TopBar (Zone 0 — 48px)
- Full width, fixed top, `var(--color-bg)` background, border-bottom `var(--color-border)`
- **მარცხნივ** (220px slot): workspace badge **28×28** (square, `var(--color-accent)` bg, white initial letter) + workspace name (12px/600) + subdomain (10px/tertiary)
- **მარჯვნივ**: util buttons (Plus / Search / Bell with red dot — 32×32 each, radius 6px, hover surface-2) + divider (1×20px) + user pill (24×24 avatar + 12px name)
- **არ შეიცავს** page title

### 2. Sidebar (Zone 1 — 220px expanded / 56px collapsed)
- Background `var(--color-bg)`, border-right `var(--color-border)`, padding 12px 8px
- **Mode pill** ზემოთ: clickable dropdown, 7/10px padding, 6px radius, border, accent-tint icon box + label (13px/600) + chevron-down
- Section label: `.h-sm` style (12px uppercase tracking, padding 10px 10px 4px), `text-tertiary`
- Nav item: 6/10px padding, 6px radius, 13px font, 16×16 icon
- **Active item**: `var(--color-accent)` solid background + white text + white icon
- **Hover**: `var(--color-surface-2)`
- Badge (counts): red bg, white text, 10px font, pill style
- Footer: 32×32 avatar + name (12px/500) + role (10px/tertiary), border-top

### 3. Sub-header (Zone 3 — 56px)
- Border-bottom `var(--color-border)`, `var(--color-bg)` background, padding 0 22px
- Title: `.h-xl` (20px/600/-0.005em)
- Subtitle: 12px tertiary
- Right side: action buttons (max 3-4)

### 4. Button
- **Border radius `4px`** (NOT 6 or 8!)
- Heights: `sm=28px`, `md=32px`, `lg=36px`, `icon=32×32`
- Icon size: 14px (sm), 16px (md/lg)
- Variants:
  - `primary`: `bg-accent text-white hover:bg-accent-hover`
  - `secondary`: `border bg-bg text-primary hover:bg-surface`
  - `ghost`: `bg-transparent text-primary hover:bg-surface`
  - `outline`: `border bg-transparent text-secondary hover:bg-surface`
  - `destructive`: `bg-transparent text-error hover:bg-red-50`
- Focus: 2px ring `var(--color-accent)` + 1px offset

### 5. Badge / Pill
- Border radius `full` (pill style)
- Padding `2px 8px`
- Font 11px, weight 500
- Border `1px solid` (matching tone)
- **მხოლოდ light variants:**
  - `success`: bg-green-50 / text-green-700 / border-green-200
  - `error`: bg-red-50 / text-red-700 / border-red-200
  - `warning`: bg-amber-50 / text-amber-700 / border-amber-200
  - `info`: bg-blue-50 / text-blue-700 / border-blue-200
  - `accent`: bg-accent-tint / text-accent / border-accent-tint
  - `neutral`: bg-surface-2 / text-secondary / border-border
- Dot (optional): 6×6 round, matching color, leading

### 6. Card
- Border radius `var(--radius-lg)` = **8px**
- Border `1px solid var(--color-border)`
- Background `var(--color-bg)`
- **Card header**: padding `12px 22px`, `var(--color-surface)` background, border-bottom
- **Card content**: padding `18px 22px`
- **Card footer**: padding `10px 22px`, `var(--color-surface)` background, border-top
- **არ გამოიყენო shadow** (KAYA = borders, not shadows)

### 7. Input
- Height 32px (default) / 28px (compact)
- Padding `0 12px`
- Border `1px solid var(--color-border)`, radius **6px**
- Background `var(--color-bg)`, font 13px
- **Focused**: border `var(--color-accent)` + 2px ring with 10% opacity
- Label above (`.h-sm` style — 12px uppercase tracking)
- Helper text below: `.t-help` (11px tertiary)

### 8. Avatar
- 32×32 default, 24×24 in user pill, 36×36 in profile cards
- Border radius `full`
- Tone variants (background tinted):
  - `info`: accent-tint bg, accent text
  - `success`: success-bg, success-text
  - `warning`: warning-bg, warning-text
  - `danger`: error-bg, error-text
- Font 12px weight 600
- ქართული ინიციალები: გბ, ნკ, და, ლს, აქ, თმ, გშ, რი

### 9. Table
- Row height ~40px (default density)
- Header: 11px uppercase tracking 0.04em, weight 600, `text-secondary`, bg `var(--color-surface)`, padding 9px 14px
- Cell: 13px primary, padding 11px 14px
- Border-bottom on rows `var(--color-border)`
- **Hover row**: `var(--color-surface)` background
- Last row: no border
- Tabular-nums on numeric columns

### 10. Metric Card
- Standard card (8px radius, border, bg)
- Padding `14px 16px`
- Label: 11px uppercase tracking 0.04em, `text-tertiary`, weight 600
- Value: 24px, weight 600, letter-spacing -0.015em, `text-primary`, tabular-nums
- Delta below: 11px, success green or danger red, with trend icon (↑/↓)

### 11. Modal / Dialog
- Border radius 8px
- Background `var(--color-bg)`
- Backdrop: rgba(15, 23, 42, 0.5)
- Header: 16/22px padding, border-bottom, h-lg title
- Body: 18/22px padding
- Footer: 12/22px padding, border-top, right-aligned actions
- Animation: fade + scale 0.96→1, 200ms ease-out

### 12. Toast / Notification
- Border radius 6px
- Border 1px (matching tone)
- Padding 12/16px
- Icon left (16×16), title (13px/600), body (12px/400 secondary)
- Auto-dismiss 5s (success/info) / sticky (error)
- Position: top-right, 16px margin
- Animation: slide-in-right 150ms

---

## 🎯 Motion & Interaction

- Default transition: **150ms ease-out**
- Sidebar expand/collapse: **150ms cubic-bezier(0.2, 0, 0, 1)**
- Modal: **200ms ease-out** (fade + scale)
- Loading skeletons: gentle pulse, **1.2s ease-in-out infinite**
- ❌ არასდროს 400ms+ UI feedback ანიმაცია
- Hover states: instant (no delay), 120ms transition

---

## ♿ Accessibility (non-negotiable)

- Real semantic HTML: `<table>`, `<button>`, `<nav>`, `<dialog>`
- Keyboard navigation: Tab/Shift-Tab, Enter/Space, Esc, Arrow keys
- ARIA: `aria-sort`, `aria-label`, `role="toolbar"`, `aria-expanded`, `aria-current="page"`
- Focus-visible: 2px solid `var(--color-accent)` ring, 2px offset, 6px radius
- Color contrast: WCAG AA min (4.5:1 text, 3:1 UI elements)
- All interactive elements ≥ 24×24 hit target (32×32 preferred)

---

## 🌐 i18n & Formatting

- ენა: ქართული (default), English fallback
- კოდში — string keys, NOT inline strings
- Numbers: `Intl.NumberFormat('ka-GE')` — `1 234,56` (space thousands, comma decimal)
- Currency: `Intl.NumberFormat('ka-GE', { style: 'currency', currency: 'GEL' })` — `1 234,56 ₾`
- Dates: `Intl.DateTimeFormat('ka-GE')` — `11.05.2026` or `11 მაისი 2026`
- IDs/codes: monospace font, NOT localized

---

## ✅ Pre-flight Checklist (ყოველი UI ცვლილების წინ)

- [ ] არ გამოვიყენე hardcoded hex (გარდა decorative SVG-ისა)
- [ ] არ გამოვიყენე `dark:*` Tailwind class
- [ ] KAYA blue `#1565C0` ერთადერთი primary
- [ ] Status colors მხოლოდ light variants (bg-50, text-700, border-200)
- [ ] 5-zone layout შენარჩუნებულია (app pages)
- [ ] Button radius **4px**, card radius **8px**
- [ ] Button heights 28/32/36
- [ ] Base font 13px, scale 20/16/14/12/11
- [ ] Tabular-nums ციფრებზე
- [ ] Focus-visible 2px ring
- [ ] Semantic HTML
- [ ] Keyboard navigation მუშაობს
- [ ] Loading / empty / error states აღწერილია
- [ ] WCAG AA contrast (4.5:1 text)

---

## 🚨 Conflict Resolution

თუ კონფლიქტი:
- Tailwind utility ↔ design token → **token wins**
- ძველი კოდი ↔ ეს წესები → **წესები wins**, ძველი rewrite-ი ცალკე PR-ად
- მომხმარებლის preference ↔ KAYA → **KAYA wins** (preference შეიძლება იყოს `Density: compact/comfortable/spacious` setting, მაგრამ ფერი/typography არ).

---

წესების ფაილი დასრულდა. ❌ არ შეცვალო ეს ფაილი UI ცვლილების კონტექსტში — ცვლილების მოთხოვნა ცალკე უნდა შემოვიდეს.
