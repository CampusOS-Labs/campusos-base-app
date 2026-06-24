# CampusOS Design System

Visual language for the CampusOS app, aligned with the [new-campusos-landing](https://github.com/campusos/new-campusos-landing) marketing site. The landing establishes the brand; the app inherits its structure, tokens, and corner philosophy.

---

## Design philosophy

**Editorial infrastructure** — not a generic SaaS template.

1. **Sharp, grid-driven layout** — hairline borders and rectangular panels instead of floating rounded cards. Feels like a technical dossier, not a consumer app.
2. **Restrained monochrome palette** — white/warm field, zinc OKLCH tokens, minimal color. Status and brand accents used sparingly.
3. **Serif headlines + sans body** — authority in headings; Inter for UI legibility. (Landing uses Crimson Text; app currently uses Inter for both until heading font is ported.)
4. **One tactile accent** — the landing neumorphic CTA keeps metallic depth but uses box corners like everything else. In the app, `rounded-full` is reserved for avatars, spinners, and status dots only.
5. **Production language** — confident, minimal copy. One job per sentence.

Reference: [Human Delta](https://www.humandelta.ai/) — category framing, verb-led sections, restrained tone. See `new-campusos-landing/LANDING_COPY.md` for voice rules.

---

## Corner radius (box corners)

The landing sets `--radius: 0`. All shadcn/Tailwind radius tokens derive from this single variable:

| Token | Definition | At `--radius: 0` |
|-------|------------|------------------|
| `--radius-sm` | `calc(var(--radius) * 0.6)` | 0 |
| `--radius-md` | `calc(var(--radius) * 0.8)` | 0 |
| `--radius-lg` | `var(--radius)` | 0 |
| `--radius-xl` | `calc(var(--radius) * 1.4)` | 0 |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` | 0 |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` | 0 |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` | 0 |

### What renders sharp (box corners)

With `--radius: 0`, these classes resolve to **0px** even though the class names say `rounded-*`:

- Cards and panels: `rounded-xl` on home cards, `MetricStrip`, `StatusBanner`, shadcn `Card`, `Dialog`
- Form controls: `rounded-md` on `Button`, `Input`, `Select`, `Textarea`
- Navigation: sidebar items, dropdown menus, popovers
- Badges: `rounded-4xl` → sharp rectangles

shadcn components can keep their `rounded-*` class names; the token override handles rendering.

### Exceptions (intentionally rounded)

| Element | Class / value | Reason |
|---------|---------------|--------|
| Avatars | `rounded-full` | Circular profile images |
| Spinners / step dots | `rounded-full` | Loading and progress indicators |
| Tooltip arrow | `rounded-[2px]` | Decorative micro-element |
| Chart swatches | `rounded-[2px]` | Legend color chips |

Do **not** add `rounded-lg` or `rounded-xl` to new surfaces unless `--radius` is intentionally raised.

---

## Surface card pattern

Home and list views use a shared card shell. Borders and rings provide structure; corners stay sharp.

```tsx
className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs ring-1 ring-foreground/[0.04]"
```

Used in:

- `app/(protected)/home/home-support-contact.tsx` — WhatsApp support card
- `app/(protected)/home/home-quick-actions.tsx` — quick action tiles
- `components/page-layout.tsx` — `MetricStrip` metrics
- `components/status-banner.tsx` — inline status alerts

Icon containers inside cards use `rounded-lg` (also 0px with `--radius: 0`):

```tsx
className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 ..."
```

### Home support contact

The support card is a single bordered panel with:

- Primary row: WhatsApp group link with icon, title, subtitle
- Footer row: direct phone numbers separated by middots
- Hover: `hover:bg-muted/30` on the link row; `ui-press` for tactile feedback

No nested rounded cards. Structure comes from `border-t` on the footer row.

---

## Color tokens

OKLCH zinc palette in `app/globals.css`. App-specific extensions:

| Token | Role |
|-------|------|
| `--primary` | Brand purple (app); landing uses near-black |
| `--success` / `--warning` | Status semantics |
| `--status-connected` / `--status-pending` | WhatsApp / integration states |
| `--sidebar-primary` | Sidebar accent (warm yellow-green) |
| `--background` | Slightly warm white `oklch(0.995 0.004 95)` |

Landing uses monochrome `--primary: oklch(0.21 …)` (dark gray). App retains purple primary for product identity; corner and layout language match landing.

---

## Typography

| Role | Font | Token |
|------|------|-------|
| Headings | Inter (→ Crimson Text when ported) | `font-heading` |
| Body / UI | Inter | `font-sans` |

Patterns:

- Page title: `text-3xl font-semibold tracking-tight font-heading`
- Section title: `text-lg font-medium tracking-tight`
- Card label: `text-sm font-medium leading-snug`
- Muted helper: `text-xs text-muted-foreground` or `text-sm text-muted-foreground`

---

## Spacing and layout

| Pattern | Value |
|---------|-------|
| Page max width | `max-w-4xl` (`PageShell`) |
| Section spacing | `space-y-10` between major blocks |
| Card padding | `px-4 py-3.5` (interactive rows), `px-4 py-4` (metrics) |
| Quick actions grid | `grid-cols-2 gap-3` |
| Focus ring | `focus-visible:ring-3 focus-visible:ring-ring/50` |

Landing uses a 4-column editorial grid with `gap-0` and 1px borders. App pages use simpler stacked sections; adopt the grid pattern for future marketing-style in-app pages.

---

## Motion

Defined in `app/globals.css`:

- `--ease-out`: `cubic-bezier(0.23, 1, 0.32, 1)`
- `--ease-in-out`: `cubic-bezier(0.77, 0, 0.175, 1)`
- `ui-enter` — fade/slide entrance for banners and panels
- `ui-press` — scale-down on active for links and buttons

Duration: `duration-150` for hover and press states.

---

## shadcn configuration

| Setting | Landing | App |
|---------|---------|-----|
| Style | `base-rhea` | `base-vega` |
| Base color | zinc | zinc |
| Icons | Phosphor | Phosphor |
| CSS entry | `app/globals.css` | `app/globals.css` |

Both use Tailwind v4 with tokens in CSS, not `tailwind.config.js`.

---

## Migration checklist

When adding or updating UI:

- [ ] Set `--radius: 0` in `:root` (already done)
- [ ] Use the surface card pattern for bordered panels
- [ ] Avoid hardcoded `rounded-[Npx]` except tooltip/chart micro-elements
- [ ] Keep `rounded-full` only for circles (avatars, dots, spinners)
- [ ] Prefer borders + rings over shadow-heavy floating cards
- [ ] Match sibling components (e.g. `HomeSupportContact` ↔ `HomeQuickActions`)

To re-enable rounded shadcn components later, change `--radius` to e.g. `0.625rem` — all `rounded-*` utilities rescale automatically.

---

## Source files

| File | Purpose |
|------|---------|
| `app/globals.css` | Color tokens, `--radius`, motion utilities |
| `components/page-layout.tsx` | Page shell, sections, metric cards |
| `app/(protected)/home/home-support-contact.tsx` | Support contact card |
| `app/(protected)/home/home-quick-actions.tsx` | Home action tiles |
| `components/status-banner.tsx` | Status alerts |
| `components/ui/card.tsx` | shadcn Card primitive |
| `new-campusos-landing/app/globals.css` | Landing token reference |
