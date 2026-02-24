# AXION — Style Guide & UI/UX Standards

> Every contributor must follow this guide. No exceptions. This ensures visual consistency, maintainability, and a cohesive product experience across the entire Axion codebase.

---

## 1. Tooling Rules (Non-Negotiable)

### Package Manager
- **Always use `bun`**. Never `npm`, `yarn`, or `pnpm`.
- Install dependencies: `bun add <package>`
- Install dev dependencies: `bun add -D <package>`
- Run scripts: `bun run <script>` or `bun <script>`
- Workspace-scoped: `bun add --filter web <package>`

### Component Library
- **Always use the `shadcn/ui` CLI** to add components. Never copy-paste from the website or install `@shadcn/ui` as a package.

```bash
# Correct — use the CLI
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add dialog

# Wrong — never do this
bun add @shadcn/ui
# Wrong — never manually copy component files from the shadcn website
```

- Run the CLI from the `apps/web` directory (or configure the `components.json` path).
- After adding a component, you may customize it. Customizations are expected and encouraged — shadcn components are meant to be owned by you.
- Never modify the base shadcn primitives in ways that break their API. Extend them by wrapping.

### Build & Dev
- Frontend dev: `bun run --filter web dev`
- Frontend build: `bun run --filter web build`
- Never use `npx`, `yarn dlx`, or `pnpm dlx` for frontend tooling. Use `bunx` when needed.

---

## 2. Color System

### Golden Rule: Never Hardcode Colors

```tsx
// WRONG — hardcoded hex/rgb/hsl values
<div className="bg-[#1a1a2e] text-[#e0e0e0]" />
<div style={{ backgroundColor: '#1a1a2e' }} />
<span className="text-[rgb(255,100,100)]">Error</span>

// CORRECT — use CSS variables via Tailwind's semantic tokens
<div className="bg-background text-foreground" />
<span className="text-destructive">Error</span>
<div className="bg-card text-card-foreground" />
```

All colors are defined as **CSS custom properties (variables)** in the global CSS file and consumed through Tailwind's theme configuration. This enables theming (dark/light mode) with zero component changes.

### 2.1 CSS Variable Definitions

Colors are defined in HSL format without the `hsl()` wrapper (Tailwind convention):

```css
/* apps/web/src/styles/globals.css */

@layer base {
  :root {
    /* ── Core Surfaces ── */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;

    /* ── Card / Elevated surfaces ── */
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;

    /* ── Popover / Dropdown ── */
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;

    /* ── Primary action (buttons, links, active states) ── */
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;

    /* ── Secondary action (less prominent buttons) ── */
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;

    /* ── Muted backgrounds (disabled, subtle) ── */
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;

    /* ── Accent (hover states, highlights) ── */
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;

    /* ── Destructive (errors, danger actions) ── */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    /* ── Borders & Inputs ── */
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;

    /* ── Chart colors (attendance trends, marks graphs) ── */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;

    /* ── Axion-specific semantic tokens ── */
    --attendance-safe: 142 76% 36%;        /* green — above threshold */
    --attendance-warning: 38 92% 50%;      /* amber — near threshold */
    --attendance-danger: 0 84% 60%;        /* red — below threshold */
    --attendance-safe-foreground: 0 0% 98%;
    --attendance-warning-foreground: 0 0% 9%;
    --attendance-danger-foreground: 0 0% 98%;

    --sync-success: 142 76% 36%;
    --sync-pending: 38 92% 50%;
    --sync-failed: 0 84% 60%;

    /* ── Radius ── */
    --radius: 0.625rem;

    /* ── Sidebar (if used) ── */
    --sidebar: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    /* ── Core Surfaces ── */
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;

    /* ── Card / Elevated surfaces ── */
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;

    /* ── Popover / Dropdown ── */
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;

    /* ── Primary ── */
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;

    /* ── Secondary ── */
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;

    /* ── Muted ── */
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;

    /* ── Accent ── */
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;

    /* ── Destructive ── */
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    /* ── Borders & Inputs ── */
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;

    /* ── Chart colors (adjusted for dark) ── */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;

    /* ── Axion-specific semantic tokens (dark) ── */
    --attendance-safe: 142 71% 45%;
    --attendance-warning: 38 92% 50%;
    --attendance-danger: 0 84% 60%;
    --attendance-safe-foreground: 0 0% 9%;
    --attendance-warning-foreground: 0 0% 9%;
    --attendance-danger-foreground: 0 0% 98%;

    --sync-success: 142 71% 45%;
    --sync-pending: 38 92% 50%;
    --sync-failed: 0 84% 60%;

    /* ── Radius (same) ── */
    --radius: 0.625rem;

    /* ── Sidebar (dark) ── */
    --sidebar: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 0 0% 98%;
    --sidebar-primary-foreground: 240 5.9% 10%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}
```

### 2.2 Using Colors in Tailwind Classes

Always use the semantic token names, never raw color values:

| Purpose | Tailwind Class | CSS Variable |
|---------|---------------|-------------|
| Page background | `bg-background` | `--background` |
| Body text | `text-foreground` | `--foreground` |
| Card surface | `bg-card` | `--card` |
| Card text | `text-card-foreground` | `--card-foreground` |
| Primary button | `bg-primary text-primary-foreground` | `--primary` |
| Secondary button | `bg-secondary text-secondary-foreground` | `--secondary` |
| Muted/subtle text | `text-muted-foreground` | `--muted-foreground` |
| Error/danger | `text-destructive` | `--destructive` |
| Borders | `border-border` | `--border` |
| Input borders | `border-input` | `--input` |
| Focus ring | `ring-ring` | `--ring` |

### 2.3 Axion Semantic Tokens (Custom)

For Axion-specific use cases, use the custom tokens:

```tsx
// Attendance percentage badges
<Badge className="bg-[hsl(var(--attendance-safe))] text-[hsl(var(--attendance-safe-foreground))]">
  92%
</Badge>
<Badge className="bg-[hsl(var(--attendance-warning))] text-[hsl(var(--attendance-warning-foreground))]">
  77%
</Badge>
<Badge className="bg-[hsl(var(--attendance-danger))] text-[hsl(var(--attendance-danger-foreground))]">
  68%
</Badge>
```

If a custom semantic token is used more than 3 times, extract it as a Tailwind utility in `globals.css`:

```css
@layer utilities {
  .badge-attendance-safe {
    background-color: hsl(var(--attendance-safe));
    color: hsl(var(--attendance-safe-foreground));
  }
  .badge-attendance-warning {
    background-color: hsl(var(--attendance-warning));
    color: hsl(var(--attendance-warning-foreground));
  }
  .badge-attendance-danger {
    background-color: hsl(var(--attendance-danger));
    color: hsl(var(--attendance-danger-foreground));
  }
}
```

### 2.4 Adding New Colors

When you need a new color:

1. **Never add a hex/rgb value inline.** Always add a CSS variable first.
2. Add the variable to both `:root` (light) and `.dark` (dark) in `globals.css`.
3. Name it semantically (what it means, not what it looks like): `--attendance-safe` not `--green-500`.
4. If it maps to a Tailwind utility, extend the Tailwind config.

---

## 3. Typography

### 3.1 Font Stack

```css
/* globals.css */
:root {
  --font-sans: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code',
    ui-monospace, SFMono-Regular, Consolas, monospace;
}
```

- **Primary font**: Geist Sans (fallback to Inter, then system fonts)
- **Monospace**: Geist Mono (for course codes, stats, data)
- Load fonts via `next/font` equivalent for Vite, or self-host from `public/fonts/`

### 3.2 Type Scale

Use Tailwind's default type scale. Do not define custom font sizes unless absolutely necessary.

| Use Case | Class | Size |
|----------|-------|------|
| Page title | `text-3xl font-bold tracking-tight` | 30px |
| Section heading | `text-2xl font-semibold tracking-tight` | 24px |
| Card title | `text-lg font-semibold` | 18px |
| Body text | `text-sm` | 14px |
| Small/caption | `text-xs text-muted-foreground` | 12px |
| Large stat number | `text-4xl font-bold tabular-nums` | 36px |
| Course code | `text-sm font-mono` | 14px |

### 3.3 Rules

- **Never use `px` for font sizes in CSS.** Always use Tailwind classes.
- **Use `tracking-tight`** on headings (h1-h3).
- **Use `tabular-nums`** on all numerical data (attendance %, marks, CGPA) so digits align.
- **Use `font-mono`** for course codes, student IDs, and technical identifiers.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Use Tailwind's spacing scale exclusively. Never use arbitrary pixel values for spacing.

```tsx
// WRONG
<div className="p-[13px] mt-[7px]" />
<div style={{ padding: '13px' }} />

// CORRECT
<div className="p-3 mt-2" />   /* p-3 = 12px, mt-2 = 8px */
```

### 4.2 Page Layout

```tsx
// Standard page layout wrapper
<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
  {/* page content */}
</div>
```

- Max content width: `max-w-6xl` (72rem / 1152px)
- Horizontal padding: `px-4` (mobile) → `sm:px-6` → `lg:px-8`
- Vertical padding between sections: `space-y-6` or `gap-6`
- Card internal padding: `p-4` (mobile) → `sm:p-6`

### 4.3 Grid System

Use CSS Grid via Tailwind for dashboard layouts:

```tsx
// Dashboard card grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Two-column layout
<div className="grid gap-6 lg:grid-cols-[1fr_300px]">
  <main>...</main>
  <aside>...</aside>
</div>
```

### 4.4 Consistent Gaps

| Context | Gap | Class |
|---------|-----|-------|
| Between page sections | 24px | `space-y-6` or `gap-6` |
| Between cards in a grid | 16px | `gap-4` |
| Between items in a card | 12px | `space-y-3` |
| Between form fields | 16px | `space-y-4` |
| Between inline elements | 8px | `gap-2` |
| Between icon and label | 8px | `gap-2` |

---

## 5. Component Patterns

### 5.1 Always Use shadcn/ui Components

For any standard UI pattern, use the shadcn component. Do not build from scratch.

| Pattern | shadcn Component |
|---------|-----------------|
| Buttons | `Button` |
| Cards | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| Tables | `Table`, `TableHeader`, `TableRow`, `TableCell` |
| Forms | `Input`, `Label`, `Select`, `Checkbox` |
| Modals | `Dialog` |
| Tooltips | `Tooltip` |
| Toasts | `Sonner` (via `sonner` package, shadcn integrates it) |
| Dropdowns | `DropdownMenu` |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| Badges | `Badge` |
| Skeletons | `Skeleton` |
| Sheets (mobile drawer) | `Sheet` |
| Alerts | `Alert` |
| Progress | `Progress` |
| Avatar | `Avatar` |
| Separator | `Separator` |

### 5.2 Button Hierarchy

Every screen should have a clear button hierarchy:

```tsx
// Primary action — one per visible area
<Button>Link College Account</Button>

// Secondary action
<Button variant="secondary">Refresh Data</Button>

// Subtle/ghost action
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>

// Destructive action
<Button variant="destructive">Unlink College</Button>

// Outline (used in toolbars, filters)
<Button variant="outline" size="sm">This Week</Button>
```

### 5.3 Card Pattern

All data modules use cards as the primary container:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg">Attendance Summary</CardTitle>
      <Badge variant="outline" className="text-xs">
        Synced 2h ago
      </Badge>
    </div>
    <CardDescription>
      Your attendance across all subjects this semester
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* data table, chart, or list */}
  </CardContent>
</Card>
```

### 5.4 Loading States

Every data-dependent view must show a loading skeleton:

```tsx
// Use Skeleton from shadcn
function AttendanceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}
```

- **Never show a blank screen while loading.** Always show skeletons.
- **Never use spinners as the only loading indicator.** Skeletons provide better perceived performance.
- Spinners are acceptable inline (e.g., inside a button during form submission).

### 5.5 Empty States

When data is not yet available (no college linked, no attendance data):

```tsx
<Card>
  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
    <GraduationCap className="h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-semibold">No college linked</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Link your college account to view your attendance
    </p>
    <Button className="mt-4">Link College</Button>
  </CardContent>
</Card>
```

Every feature must have a designed empty state. No blank areas.

### 5.6 Error States

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Sync Failed</AlertTitle>
  <AlertDescription>
    Could not reach your college portal. We'll retry automatically.
    <Button variant="outline" size="sm" className="mt-2">
      Retry Now
    </Button>
  </AlertDescription>
</Alert>
```

---

## 6. Icons

### 6.1 Icon Library

Use **Lucide React** exclusively. It is the icon library that ships with shadcn/ui.

```bash
bun add --filter web lucide-react
```

```tsx
import { GraduationCap, Calendar, BarChart3, BookOpen } from 'lucide-react';
```

### 6.2 Icon Sizing

| Context | Size | Class |
|---------|------|-------|
| Inline with text | 16px | `h-4 w-4` |
| Button icon | 16px | `h-4 w-4` |
| Card header icon | 20px | `h-5 w-5` |
| Empty state illustration | 48px | `h-12 w-12` |
| Navigation tab icon | 20px | `h-5 w-5` |

### 6.3 Rules

- **Never use multiple icon libraries.** Lucide only.
- **Never use inline SVGs.** Always import from `lucide-react`.
- **Always pair icons with text labels** in navigation. Icon-only buttons need `aria-label` and a `Tooltip`.
- Icon color follows its parent text color. Do not set icon colors explicitly unless using a semantic token (e.g., `text-destructive`).

---

## 7. Responsive Design

### 7.1 Mobile-First

All styles are written mobile-first. Use Tailwind's responsive prefixes to add desktop styles:

```tsx
// Mobile-first: single column, then 2 columns on sm, 4 on lg
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

### 7.2 Breakpoints

Use Tailwind's default breakpoints. Do not add custom breakpoints.

| Breakpoint | Width | Target |
|------------|-------|--------|
| (default) | 0px+ | Mobile phones |
| `sm:` | 640px+ | Large phones / small tablets |
| `md:` | 768px+ | Tablets |
| `lg:` | 1024px+ | Laptops / desktops |
| `xl:` | 1280px+ | Large desktops |

### 7.3 Mobile-Specific Patterns

- **Bottom navigation** on mobile (5 tabs: Home, Attendance, Schedule, Marks, More)
- **Sheet** (slide-up drawer) instead of Dialog on mobile for contextual actions
- **Swipeable tabs** for day-of-week in timetable view
- Hide sidebar navigation on mobile; use bottom nav instead
- Touch targets: minimum `h-10 w-10` (40px) for all interactive elements

### 7.4 PWA Viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Use `safe-area-inset-*` padding for notched devices:

```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 8. Dark Mode

### 8.1 Implementation

Dark mode is controlled by a `dark` class on the `<html>` element:

```tsx
// Theme toggle — use next-themes or a custom hook
<html className="dark">
```

Use a theme provider (e.g., custom Zustand store or a lightweight lib) that:
- Reads system preference on first load (`prefers-color-scheme`)
- Stores user preference in `localStorage`
- Applies the `dark` class to `<html>`

### 8.2 Rules

- **Dark mode is the default theme** (most students use phones at night).
- **Every component must look correct in both themes.** Test both.
- **Never use `bg-white` or `bg-black` directly.** Use `bg-background` and `text-foreground`.
- **Never use Tailwind's color palette directly** (e.g., `bg-gray-900`, `text-blue-500`). Always use semantic tokens.
- Shadows: use `shadow-sm` / `shadow-md` which adapt automatically. For custom shadows, define them as CSS variables.

```tsx
// WRONG — breaks in dark mode
<div className="bg-white text-black border-gray-200" />
<div className="bg-gray-900 text-gray-100" />

// CORRECT — adapts to theme automatically
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />
```

---

## 9. Animations & Transitions

### 9.1 Defaults

All interactive elements should have subtle transitions:

```tsx
// Buttons, cards, interactive elements
<div className="transition-colors duration-200" />

// Expanding/collapsing
<div className="transition-all duration-300 ease-in-out" />
```

### 9.2 Rules

- **Duration**: 150-300ms for micro-interactions. Never exceed 500ms.
- **Easing**: `ease-in-out` for enter/exit. `ease-out` for enter-only.
- **No layout shift animations** — never animate `width`, `height`, or `margin` of content that causes reflow. Use `transform` and `opacity` instead.
- **Respect `prefers-reduced-motion`**:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 9.3 Page Transitions

Use Tanstack Router's built-in transition support. Fade in new pages with:

```tsx
// Route wrapper
<div className="animate-in fade-in-0 duration-200">
  {children}
</div>
```

`animate-in` / `fade-in-0` are from `tailwindcss-animate` (installed with shadcn/ui).

---

## 10. Data Display Conventions

### 10.1 Attendance Percentage

Always display with one decimal place and color-coded by threshold:

```tsx
function AttendancePercentage({
  value,
  threshold,
}: {
  value: number;
  threshold: number;
}) {
  const color =
    value >= threshold
      ? 'badge-attendance-safe'
      : value >= threshold - 5
        ? 'badge-attendance-warning'
        : 'badge-attendance-danger';

  return (
    <span className={cn('rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums', color)}>
      {value.toFixed(1)}%
    </span>
  );
}
```

### 10.2 Timestamps & Dates

- Use relative time for recent events: "2h ago", "Yesterday"
- Use absolute date for historical data: "15 Jan 2026"
- Always show "Last synced: X" on data cards
- Use `date-fns` for formatting. Never `moment.js`.

### 10.3 Numbers

- Always use `tabular-nums` class on numerical data
- Attendance: `92.5%` (one decimal)
- Marks: `45/50` (no decimals)
- CGPA: `8.75` (two decimals)
- Credits: `4.0` (one decimal)

### 10.4 Tables

Use the shadcn `Table` component. For mobile, tables with more than 3 columns should either:
- Switch to a card-based layout
- Use horizontal scroll with `overflow-x-auto`

```tsx
<div className="overflow-x-auto rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Course</TableHead>
        <TableHead className="text-right tabular-nums">Present</TableHead>
        <TableHead className="text-right tabular-nums">Total</TableHead>
        <TableHead className="text-right tabular-nums">%</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* rows */}
    </TableBody>
  </Table>
</div>
```

Right-align all numeric columns with `text-right`.

---

## 11. Form Patterns

### 11.1 Form Layout

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="username">College Username</Label>
    <Input id="username" placeholder="e.g., 23CSU337" />
    <p className="text-xs text-muted-foreground">
      Your college portal login ID
    </p>
  </div>

  <div className="space-y-2">
    <Label htmlFor="password">College Password</Label>
    <Input id="password" type="password" />
  </div>

  <Button type="submit" className="w-full">
    Link Account
  </Button>
</form>
```

### 11.2 Rules

- Every input must have a `<Label>`.
- Use `space-y-2` between label and input. Use `space-y-4` between fields.
- Error messages below the input in `text-destructive text-xs`.
- Helper text below the input in `text-muted-foreground text-xs`.
- Submit buttons are full-width on mobile, auto-width on desktop.
- Use `disabled` state on the button during submission. Show a spinner inside the button.

### 11.3 Validation Feedback

```tsx
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input
    id="username"
    aria-invalid={!!error}
    className={cn(error && 'border-destructive focus-visible:ring-destructive')}
  />
  {error && (
    <p className="text-xs text-destructive">{error.message}</p>
  )}
</div>
```

---

## 12. Accessibility

### 12.1 Minimum Requirements

- All interactive elements are keyboard-navigable
- Focus states are visible (`ring-ring` via shadcn defaults)
- All images have `alt` text
- All icon-only buttons have `aria-label`
- Color is never the only indicator of state (always pair with text or icons)
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text

### 12.2 Focus Management

shadcn/ui components handle focus management out of the box. Do not override:
- Dialog traps focus
- Dropdown menus handle arrow key navigation
- Tab components handle tab key switching

### 12.3 Screen Reader Support

```tsx
// Announce live updates (e.g., sync status changes)
<div role="status" aria-live="polite" className="sr-only">
  Attendance data synced successfully
</div>

// Skip navigation link
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4">
  Skip to content
</a>
```

---

## 13. File & Component Naming Conventions

### 13.1 Files

| Type | Convention | Example |
|------|-----------|---------|
| React component | `kebab-case.tsx` | `attendance-card.tsx` |
| Utility function | `kebab-case.ts` | `format-percentage.ts` |
| Type definition | `kebab-case.ts` | `attendance.types.ts` |
| Hook | `use-kebab-case.ts` | `use-attendance.ts` |
| Constant | `kebab-case.ts` | `query-keys.ts` |
| Test | `*.test.ts` or `*.test.tsx` | `attendance-card.test.tsx` |
| Zustand store | `use-kebab-case.ts` | `use-theme-store.ts` |
| Route file | `kebab-case.tsx` | `attendance.tsx` |

### 13.2 Components

```tsx
// Component naming — PascalCase, exported as named export
export function AttendanceCard({ data }: AttendanceCardProps) { ... }

// Props — always define an interface, suffix with Props
interface AttendanceCardProps {
  data: AttendanceRecord[];
  isLoading?: boolean;
}

// Never use default exports for components.
// Exception: route files if required by Tanstack Router.
```

### 13.3 Directory Structure per Feature

```
features/attendance/
├── components/
│   ├── attendance-card.tsx
│   ├── attendance-table.tsx
│   ├── attendance-chart.tsx
│   ├── attendance-skeleton.tsx
│   └── classes-needed-calculator.tsx
├── hooks/
│   └── use-attendance.ts         # Tanstack Query hooks
├── lib/
│   └── attendance-utils.ts       # Projection calculation, etc.
└── index.ts                      # Public barrel export
```

---

## 14. CSS & Styling Rules

### 14.1 Priority Order

1. **Tailwind utility classes** — for 95% of styling
2. **CSS variables** — for theming and dynamic values
3. **`@layer utilities`** — for reusable utility classes (used 3+ times)
4. **`@layer components`** — for complex component styles that can't be expressed as utilities
5. **Inline styles** — absolute last resort, only for truly dynamic values (e.g., chart dimensions)

### 14.2 Forbidden

- **No CSS modules.** Use Tailwind classes.
- **No styled-components or emotion.** Use Tailwind classes.
- **No `!important`.** If you need to override, use more specific selectors or restructure.
- **No global element selectors** beyond base resets in `@layer base`.
- **No hardcoded colors** anywhere. Ever. (See Section 2.)
- **No hardcoded font sizes** in CSS. Use Tailwind classes.
- **No hardcoded spacing** in CSS. Use Tailwind classes.
- **No `z-index` wars.** Use a defined z-index scale:

```css
:root {
  --z-dropdown: 50;
  --z-sticky: 40;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 50;
  --z-toast: 100;
}
```

### 14.3 Class Name Ordering

Use the following order for Tailwind classes (enforced by `prettier-plugin-tailwindcss`):

1. Layout (`flex`, `grid`, `block`, `hidden`)
2. Position (`relative`, `absolute`, `fixed`)
3. Sizing (`h-`, `w-`, `max-w-`)
4. Spacing (`p-`, `m-`, `gap-`)
5. Typography (`text-`, `font-`, `tracking-`)
6. Visual (`bg-`, `border-`, `shadow-`, `rounded-`)
7. Interactive (`hover:`, `focus:`, `active:`)
8. Responsive (`sm:`, `md:`, `lg:`)
9. Animation (`transition-`, `animate-`)

Install and configure:

```bash
bun add --filter web -D prettier-plugin-tailwindcss
```

### 14.4 `cn()` Utility

Use the `cn()` utility (from shadcn setup) for conditional classes:

```tsx
import { cn } from '@/lib/utils';

<div
  className={cn(
    'rounded-lg border p-4',
    isActive && 'border-primary bg-primary/5',
    isError && 'border-destructive bg-destructive/5'
  )}
/>
```

Never use template literals for conditional classes:

```tsx
// WRONG
<div className={`p-4 ${isActive ? 'bg-primary' : 'bg-secondary'}`} />

// CORRECT
<div className={cn('p-4', isActive ? 'bg-primary' : 'bg-secondary')} />
```

---

## 15. Chart & Data Visualization

### 15.1 Library

Use **Recharts** for all charts. It integrates well with React and is the library supported by shadcn/ui's chart components.

```bash
bun add --filter web recharts
```

### 15.2 Chart Colors

Always use the CSS variable chart tokens:

```tsx
const chartConfig = {
  present: { color: 'hsl(var(--chart-1))' },
  absent: { color: 'hsl(var(--chart-2))' },
  loa: { color: 'hsl(var(--chart-3))' },
};
```

Never hardcode colors in chart configurations.

### 15.3 Chart Guidelines

- Always include a legend
- Use tooltips on hover for exact values
- Use `tabular-nums` in tooltip number displays
- Charts must have a minimum height of 200px on mobile, 300px on desktop
- Line charts for trends (attendance over time)
- Bar charts for comparisons (subject-wise attendance)
- Use `ResponsiveContainer` wrapper for all charts

---

## 16. Performance Rules

### 16.1 Images

- Use `loading="lazy"` on all images below the fold
- Use WebP format with PNG fallback
- Define explicit `width` and `height` to prevent layout shift

### 16.2 Bundle Size

- Lazy-load route components: Tanstack Router supports route-level code splitting
- Never import the entire Lucide library. Import individual icons.
- Tree-shake unused shadcn components — only add what you use via CLI
- Monitor bundle size in CI (use `vite-plugin-bundle-analyzer` periodically)

### 16.3 Rendering

- Use `React.memo()` only when profiling shows a performance issue. Do not premature-optimize.
- Use `useMemo` / `useCallback` only for expensive calculations or stable callback references needed by child components.
- Prefer Tanstack Query's caching over local state for server data.

---

## 17. Checklist Before Shipping a Component

- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Has loading skeleton
- [ ] Has empty state
- [ ] Has error state
- [ ] Responsive on mobile (test at 375px width)
- [ ] Keyboard navigable
- [ ] No hardcoded colors
- [ ] Uses semantic tokens
- [ ] Uses shadcn components where applicable
- [ ] All text is legible (contrast check)
- [ ] Numeric data uses `tabular-nums`
- [ ] Conditional classes use `cn()`, not template literals
