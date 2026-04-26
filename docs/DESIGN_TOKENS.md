# Design Tokens Reference

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Shadows](#shadows)
5. [Radii](#radii)
6. [Animations](#animations)
7. [Breakpoints](#breakpoints)

---

## Colors

All colors are defined as HSL values in CSS custom properties for maximum flexibility and dynamic theming support.

### Semantic Colors

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--background` | `0 0% 100%` | `240 10% 3.9%` | Page background |
| `--foreground` | `240 10% 3.9%` | `0 0% 98%` | Primary text |
| `--card` | `0 0% 100%` | `240 10% 3.9%` | Card backgrounds |
| `--card-foreground` | `240 10% 3.9%` | `0 0% 98%` | Card text |
| `--popover` | `0 0% 100%` | `240 10% 3.9%` | Popover backgrounds |
| `--popover-foreground` | `240 10% 3.9%` | `0 0% 98%` | Popover text |
| `--primary` | `240 5.9% 10%` | `0 0% 98%` | Primary buttons, links |
| `--primary-foreground` | `0 0% 98%` | `240 5.9% 10%` | Text on primary |
| `--secondary` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Secondary buttons |
| `--secondary-foreground` | `240 5.9% 10%` | `0 0% 98%` | Text on secondary |
| `--muted` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Muted backgrounds |
| `--muted-foreground` | `240 3.8% 46.1%` | `240 5% 64.9%` | Secondary text |
| `--accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Accent elements |
| `--accent-foreground` | `240 5.9% 10%` | `0 0% 98%` | Text on accent |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Error states |
| `--destructive-foreground` | `0 0% 98%` | `0 0% 98%` | Text on destructive |
| `--border` | `240 5.9% 90%` | `240 3.7% 15.9%` | Borders, dividers |
| `--input` | `240 5.9% 90%` | `240 3.7% 15.9%` | Input borders |
| `--ring` | `240 5.9% 10%` | `240 4.9% 83.9%` | Focus rings |

### AI Provider Brand Colors

| Token | HSL Value | Hex Value | Provider |
|-------|-----------|-----------|----------|
| `--ai-openai` | `154 100% 35%` | `#00B386` | OpenAI (GPT) |
| `--ai-anthropic` | `20 100% 55%` | `#FF6B35` | Anthropic (Claude) |
| `--ai-google` | `217 89% 52%` | `#1A73E8` | Google (Gemini) |
| `--ai-ollama` | `280 60% 45%` | `#9B4DCA` | Ollama (Local) |

### Semantic Status Colors

| Token | HSL Value | Hex Value | Usage |
|-------|-----------|-----------|-------|
| `--success` | `142 71% 45%` | `#22C55E` | Success states |
| `--warning` | `38 92% 50%` | `#F59E0B` | Warning states |
| `--info` | `217 91% 60%` | `#3B82F6` | Info states |
| `--error` | `0 84% 60%` | `#EF4444` | Error states |

### Sidebar Colors

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--sidebar-background` | `0 0% 98%` | `240 5.9% 10%` | Sidebar background |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` | Sidebar text |
| `--sidebar-primary` | `240 5.9% 10%` | `224.3 76.3% 48%` | Active item |
| `--sidebar-primary-foreground` | `0 0% 98%` | `0 0% 100%` | Active item text |
| `--sidebar-accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Hover state |
| `--sidebar-accent-foreground` | `240 5.9% 10%` | `240 4.8% 95.9%` | Hover text |
| `--sidebar-border` | `220 13% 91%` | `240 3.7% 15.9%` | Sidebar borders |
| `--sidebar-ring` | `217 91% 60%` | `217 91% 60%` | Focus ring |

### Color Usage Examples

```tsx
// Using CSS variables directly
<div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
  Primary Button
</div>

// Using Tailwind utility classes (recommended)
<div className="bg-primary text-primary-foreground">
  Primary Button
</div>

// AI provider badge
<Badge className="bg-ai-openai text-white">GPT-4</Badge>

// Status indicator
<div className="bg-success text-white">Active</div>
<div className="bg-warning text-white">Pending</div>
<div className="bg-error text-white">Failed</div>
```

### CSS Variable Definitions

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;

    /* AI Brands */
    --ai-openai: 154 100% 35%;
    --ai-anthropic: 20 100% 55%;
    --ai-google: 217 89% 52%;
    --ai-ollama: 280 60% 45%;

    /* Semantic */
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --info: 217 91% 60%;
    --error: 0 84% 60%;

    /* Sidebar */
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217 91% 60%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217 91% 60%;
  }
}
```

---

## Typography

### Font Family

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `var(--font-geist-sans), system-ui, sans-serif` | Body text, UI |
| `--font-mono` | `var(--font-geist-mono), monospace` | Code, logs |

### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| `text-xs` | 0.75rem (12px) | 1rem | 0.05em | 400 | Captions, timestamps |
| `text-sm` | 0.875rem (14px) | 1.25rem | 0 | 400 | Secondary text, labels |
| `text-base` | 1rem (16px) | 1.5rem | 0 | 400 | Body text |
| `text-lg` | 1.125rem (18px) | 1.75rem | -0.01em | 400 | Lead paragraphs |
| `text-xl` | 1.25rem (20px) | 1.75rem | -0.02em | 600 | Section titles |
| `text-2xl` | 1.5rem (24px) | 2rem | -0.02em | 600 | Page titles |
| `text-3xl` | 1.875rem (30px) | 2.25rem | -0.03em | 700 | Large headings |
| `text-4xl` | 2.25rem (36px) | 2.5rem | -0.03em | 700 | Hero titles |
| `text-5xl` | 3rem (48px) | 1.15 | -0.04em | 800 | Display text |

### Tailwind Typography Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
};
```

### Usage Examples

```tsx
// Heading hierarchy
<h1 className="text-4xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-2xl font-semibold tracking-tight">Section Title</h2>
<h3 className="text-xl font-semibold">Subsection</h3>

// Body text
<p className="text-base leading-relaxed">Body paragraph text...</p>
<p className="text-sm text-muted-foreground">Secondary description</p>

// Code / Monospace
<code className="font-mono text-sm">const x = 1;</code>
<pre className="font-mono text-sm">Code block content</pre>

// Special text
<span className="text-xs uppercase tracking-wider text-muted-foreground">
  Label
</span>
```

---

## Spacing

### Tailwind Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | None |
| `space-px` | 1px | Hairline borders |
| `space-0.5` | 0.125rem (2px) | Micro gaps |
| `space-1` | 0.25rem (4px) | Tight gaps |
| `space-2` | 0.5rem (8px) | Default small gap |
| `space-3` | 0.75rem (12px) | Medium-small gap |
| `space-4` | 1rem (16px) | Default gap |
| `space-5` | 1.25rem (20px) | Medium gap |
| `space-6` | 1.5rem (24px) | Large gap |
| `space-8` | 2rem (32px) | Section padding |
| `space-10` | 2.5rem (40px) | Large section padding |
| `space-12` | 3rem (48px) | Extra large padding |
| `space-16` | 4rem (64px) | Major section spacing |
| `space-20` | 5rem (80px) | Hero spacing |
| `space-24` | 6rem (96px) | Page-level spacing |

### Layout Spacing Patterns

```tsx
// Card padding
<Card className="p-4">...</Card>      // Standard card
<Card className="p-6">...</Card>      // Spacious card

// Section spacing
<section className="py-8">...</section>   // Standard section
<section className="py-12">...</section>  // Major section
<section className="py-16">...</section>  // Page section

// Grid gaps
<div className="grid gap-4">...</div>     // Standard grid
<div className="grid gap-6">...</div>     // Relaxed grid

// Stack spacing
<div className="flex flex-col gap-2">...</div>  // Tight stack
<div className="flex flex-col gap-4">...</div>  // Standard stack

// Page padding
<main className="px-4 py-6">...</main>       // Mobile
<main className="px-6 py-8">...</main>       // Tablet
<main className="px-8 py-12">...</main>      // Desktop
```

---

## Shadows

### Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-none` | `none` | No shadow |
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Default elevation |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Card hover |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Modals, dialogs |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Popovers, dropdowns |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Toasts, notifications |
| `shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Inset shadow |

### Shadow Usage Examples

```tsx
// Cards
<Card className="shadow-sm hover:shadow-md transition-shadow">
  Card content
</Card>

// Modals / Dialogs
<DialogContent className="shadow-xl">
  Modal content
</DialogContent>

// Floating elements
<div className="shadow-lg">
  Floating panel
</div>

// Toasts
<Toast className="shadow-2xl">
  Notification
</Toast>
```

---

## Radii

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0px | Sharp corners |
| `rounded-sm` | 0.125rem (2px) | Subtle rounding |
| `rounded` | 0.25rem (4px) | Default rounding |
| `rounded-md` | calc(var(--radius) - 2px) | Standard components |
| `rounded-lg` | var(--radius) | Cards, panels |
| `rounded-xl` | 0.75rem (12px) | Large cards |
| `rounded-2xl` | 1rem (16px) | Feature cards |
| `rounded-3xl` | 1.5rem (24px) | Hero elements |
| `rounded-full` | 9999px | Avatars, pills |

### CSS Variable

```css
:root {
  --radius: 0.5rem;  /* 8px default radius */
}
```

### Usage Examples

```tsx
// Buttons
<Button className="rounded-md">Standard</Button>
<Button className="rounded-full">Pill</Button>

// Cards
<Card className="rounded-lg">Standard card</Card>
<Card className="rounded-xl">Large card</Card>

// Inputs
<Input className="rounded-md">...</Input>

// Avatars
<Avatar className="rounded-full">...</Avatar>

// Badges
<Badge className="rounded-full">...</Badge>
```

---

## Animations

### Tailwind Animation Classes

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `animate-in` | 150ms | ease-out | Fade in |
| `animate-out` | 100ms | ease-in | Fade out |
| `fade-in` | 200ms | ease-out | Opacity transition |
| `fade-out` | 150ms | ease-in | Opacity exit |
| `slide-in` | 300ms | ease-out | Slide up |
| `slide-out` | 200ms | ease-in | Slide down |
| `accordion-down` | 200ms | ease-out | Expand content |
| `accordion-up` | 200ms | ease-out | Collapse content |
| `pulse` | 2s | cubic-bezier(0.4, 0, 0.6, 1) | Loading indicator |

### Custom Keyframes

```css
/* tailwind.config.ts */
@keyframes {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  "slide-in": {
    from: { transform: "translateY(10px)", opacity: "0" },
    to: { transform: "translateY(0)", opacity: "1" },
  },
  "pulse": {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0.5" },
  },
}
```

### Framer Motion Patterns

```tsx
// Page transitions
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Content
</motion.div>

// Staggered list
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>

// Layout animations (auto-animate height/width)
<motion.div layout transition={{ type: "spring", bounce: 0.2 }}>
  Content that changes size
</motion.div>
```

### Transition Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `transition-all` | `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` | All properties |
| `transition-colors` | `colors 150ms cubic-bezier(0.4, 0, 0.2, 1)` | Color changes |
| `transition-opacity` | `opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)` | Fade effects |
| `transition-shadow` | `shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)` | Elevation changes |
| `transition-transform` | `transform 150ms cubic-bezier(0.4, 0, 0.2, 1)` | Scale/translate |
| `duration-150` | 150ms | Fast transitions |
| `duration-200` | 200ms | Default transitions |
| `duration-300` | 300ms | Standard animations |
| `duration-500` | 500ms | Slow animations |
| `duration-700` | 700ms | Emphasis animations |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing |
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | Enter animations |
| `ease-in` | cubic-bezier(0.4, 0, 1, 1) | Exit animations |

---

## Breakpoints

### Tailwind Breakpoints

| Token | Width | Usage |
|-------|-------|-------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
};
```

### Responsive Patterns

```tsx
// Mobile-first responsive layout
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>

// Responsive padding
<main className="px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-12">
  Content
</main>

// Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h1>

// Responsive sidebar
<aside className="hidden lg:block w-64">Sidebar</aside>
<main className="flex-1 lg:ml-0">Main Content</main>

// Responsive flex direction
<div className="flex flex-col md:flex-row">
  <div className="md:w-1/3">Left</div>
  <div className="md:w-2/3">Right</div>
</div>

// Responsive visibility
<div className="md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>
```

### Container Queries (Optional)

```css
/* For component-level responsiveness */
@container (min-width: 400px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

```tsx
// Container query usage
<div className="@container">
  <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3">
    {items.map((item) => (
      <Card key={item.id}>{item.content}</Card>
    ))}
  </div>
</div>
```

---

## Token Reference Summary

### Quick Access Table

| Category | Count | File |
|----------|-------|------|
| Colors | 30+ tokens | `app/globals.css` |
| Typography | 9 sizes | `tailwind.config.ts` |
| Spacing | 20+ tokens | `tailwind.config.ts` (default) |
| Shadows | 8 levels | `tailwind.config.ts` (default) |
| Radii | 10 levels | `tailwind.config.ts` (default) |
| Animations | 5 custom | `tailwind.config.ts` |
| Breakpoints | 5 sizes | `tailwind.config.ts` |

### Token Naming Convention

All design tokens follow consistent naming:

- **Semantic**: `--background`, `--foreground`, `--primary`
- **Component-specific**: `--sidebar-background`, `--sidebar-foreground`
- **Brand**: `--ai-openai`, `--ai-anthropic`
- **Status**: `--success`, `--warning`, `--error`, `--info`

### Adding New Tokens

1. Define in `app/globals.css` as CSS custom properties
2. Add to `tailwind.config.ts` under `theme.extend`
3. Document in this file
4. Use in components via Tailwind utility classes
