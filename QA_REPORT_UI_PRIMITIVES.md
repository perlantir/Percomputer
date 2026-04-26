# UI Primitives Component Audit Report

> **Project:** multi-model-agent-platform  
> **Scope:** `/src/components/ui/` - All `.tsx` primitive components  
> **Date:** 2025-06-02  
> **Auditor:** React Component Quality Auditor

---

## Executive Summary

| Category | Score | Notes |
|---|---|---|
| CVA Adoption | 7/10 | 7 of 23 files use CVA; wrappers are exempt but simple components miss variants |
| Radix Wrapping | 9/10 | Properly wrapped; minor displayName inconsistencies |
| `forwardRef` | 8/10 | Most components correct; structural wrappers (DialogHeader, CommandShortcut) omitted |
| `asChild` Support | 4/10 | Only lowercase `button.tsx` properly implements `asChild` via `@radix-ui/react-slot` |
| Dark Mode | 6/10 | CSS variables used in lowercase files; PascalCase files use a *different* naming convention (Tailwind utilities) |
| Focus Rings | 7/10 | Mostly consistent `focus-visible:ring-2` with accent color; select uses `focus:` instead of `focus-visible:` |
| Disabled States | 7/10 | Interactive components handled; missing from structural wrappers |
| Loading States | 2/10 | No loading state on Button, Switch, Slider, or any interactive component |
| Size Consistency | 5/10 | Two competing size systems across duplicate files; `md` button heights differ (10 vs 9) |
| Accessibility | 6/10 | Missing `aria-label` fallbacks, inconsistent keyboard navigation cues |

**Critical Issues: 4** | **High Severity: 8** | **Medium Severity: 14** | **Low Severity: 10**

---

## Critical Issues

### 1. Duplicate Component Files with Divergent Implementations
**File:** `/src/components/ui/` (directory level)  
**Severity:** CRITICAL

The `ui/` directory contains **duplicate component files** with both PascalCase and lowercase names, leading to conflicting APIs, CSS conventions, and bundle bloat:

| PascalCase (older) | lowercase (newer) | Status |
|---|---|---|
| `Button.tsx` | `button.tsx` | Both exist — different sizes, colors, asChild support |
| `Badge.tsx` | `badge.tsx` | Both exist — different variants, colors |
| `Input.tsx` | `input.tsx` | Both exist — lowercase has label/helper/error; PascalCase is bare |
| `Textarea.tsx` | `textarea.tsx` | Both exist — lowercase has autoGrow; PascalCase is bare |
| `Separator.tsx` | `separator.tsx` | Both exist — identical API, different class names |
| `Skeleton.tsx` | `skeleton.tsx` | Both exist — PascalCase uses CVA; lowercase has SkeletonText sub-component |
| `Toaster.tsx` | `toast.tsx` | Related but Toaster.tsx imports from `@radix-ui/react-toast` directly instead of local `toast.tsx` |

**Impact:**
- `index.ts` imports from PascalCase for Button, Badge, Input, Textarea, Separator, Skeleton, Toaster, but lowercase versions are more feature-rich.
- PascalCase files use Tailwind utility classes (`bg-accent-primary`, `text-foreground-primary`) while lowercase files use CSS custom properties (`bg-[var(--accent-primary)]`, `text-[var(--text-primary)]`). This implies two different token systems are active.
- Bundle includes both versions if anything accidentally imports the wrong path.

**Fix Recommendation:**
1. Migrate all consumers to lowercase versions.
2. Delete PascalCase duplicates.
3. Update `index.ts` to import exclusively from lowercase files.
4. Align all CSS token naming to the CSS custom property convention (`var(--*)`) used in the lowercase files.

---

### 2. `index.ts` Exports Non-Existent Members
**File:** `/src/components/ui/index.ts`  
**Severity:** CRITICAL

**Line 6:**
```ts
export { Skeleton, skeletonVariants } from "./Skeleton";
```
`Skeleton.tsx` **does NOT export `skeletonVariants`** (line 39: `export { Skeleton };`). This will cause a **build/runtime error** when `index.ts` is consumed.

**Line 67-68:**
```ts
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "./popover";
```
`popover.tsx` **does NOT export `PopoverAnchor`** (only `Popover`, `PopoverTrigger`, `PopoverContent`). This will also cause a **build/runtime error**.

**Fix Recommendation:**
- Add `export { skeletonVariants }` to `Skeleton.tsx` OR remove the export from `index.ts`.
- Export `PopoverAnchor` from `popover.tsx` (re-export `PopoverPrimitive.Anchor`) OR remove the export from `index.ts`.

---

### 3. `Button.tsx` (PascalCase) Claims `asChild` but Ignores It
**File:** `/src/components/ui/Button.tsx`  
**Severity:** CRITICAL

**Line 39-43:**
```ts
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;  // <-- advertised in API
}
```

**Line 45-54:**
```ts
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button  // <-- always renders <button>, never checks asChild
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Impact:** Code consuming `<Button asChild>` will silently render a `<button>` wrapper instead of the expected child element, breaking composition (e.g., using Button as a Link).

**Fix Recommendation:**
Delete PascalCase `Button.tsx` and migrate consumers to lowercase `button.tsx` which correctly imports `Slot` from `@radix-ui/react-slot` and implements `asChild`.

---

### 4. `Badge.tsx` (PascalCase) Missing `forwardRef`
**File:** `/src/components/ui/Badge.tsx`  
**Severity:** CRITICAL

**Line 38-42:**
```ts
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

The component is a plain function, not wrapped in `React.forwardRef`. This breaks ref forwarding, which is expected for primitive components (e.g., tooltip wrapping a badge).

**Fix Recommendation:**
Delete PascalCase `Badge.tsx` and migrate to lowercase `badge.tsx` which uses `forwardRef`.

---

## High Severity Issues

### 5. `Toaster.tsx` Bypasses Local `toast.tsx` Primitive
**File:** `/src/components/ui/Toaster.tsx`  
**Severity:** HIGH

**Line 3:**
```ts
import { ToastProvider, ToastViewport } from "@radix-ui/react-toast";
```

The local `toast.tsx` file defines a styled `ToastProvider`, `ToastViewport`, and the full Toast primitive suite with CVA variants, focus rings, and swipe animations. `Toaster.tsx` imports directly from Radix, bypassing all local styling and accessibility improvements (z-index, positioning, color tokens).

**Fix Recommendation:**
Change the import to:
```ts
import { ToastProvider, ToastViewport } from "./toast";
```

---

### 6. Inconsistent Focus Ring Strategy
**File:** `/src/components/ui/select.tsx`  
**Severity:** HIGH

**Line 21:**
```ts
"focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-canvas)] disabled:cursor-not-allowed disabled:opacity-50"
```

SelectTrigger uses `focus:` instead of `focus-visible:`. This means the ring appears on **mouse click**, creating visual noise. All other interactive components (button, input, textarea, switch, slider) correctly use `focus-visible:` to show rings only during keyboard navigation.

**Fix Recommendation:**
Replace `focus:` with `focus-visible:` in `select.tsx` line 21.

---

### 7. `CommandInput` Missing Focus Ring
**File:** `/src/components/ui/command.tsx`  
**Severity:** HIGH

**Line 45-50:**
```ts
<CommandPrimitive.Input
  ref={ref}
  className={cn(
    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...props}
/>
```

`outline-none` removes the default browser outline but no `focus-visible:ring-*` is added. This makes keyboard navigation invisible within command palettes.

**Fix Recommendation:**
Add `focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2` to the input className.

---

### 8. `button.tsx` `ref` Type Mismatch with `asChild`
**File:** `/src/components/ui/button.tsx`  
**Severity:** HIGH

**Line 47:**
```ts
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
```

When `asChild={true}`, the underlying element is whatever the child is (e.g., `<a>`, `<div>`). The ref type `HTMLButtonElement` is technically incorrect in that branch. `Slot` can handle ref forwarding generically, but the TypeScript signature is restrictive.

**Fix Recommendation:**
Use a polymorphic ref type or accept `React.ElementRef<typeof Slot>` in addition to `HTMLButtonElement`.

---

### 9. `AvatarSizes` Not Integrated with Component
**File:** `/src/components/ui/avatar.tsx`  
**Severity:** HIGH

**Lines 86-91:**
```ts
const AvatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};
```

The `AvatarSizes` object is exported but never consumed by the `Avatar` component itself. There is no `size` prop on `Avatar`. Consumers must manually merge classes, which is error-prone.

**Fix Recommendation:**
Add a `size` prop (with CVA or simple mapping) to `Avatar` and `AvatarFallback` so sizes are first-class.

---

### 10. Missing `loading` Prop on Interactive Components
**File:** `/src/components/ui/button.tsx`, `/src/components/ui/Button.tsx`, `/src/components/ui/switch.tsx`, `/src/components/ui/slider.tsx`, `/src/components/ui/select.tsx`  
**Severity:** HIGH

No interactive component exposes a `loading` or `isLoading` prop. This is a standard UX pattern (e.g., disabling the button and showing a spinner during async actions). Without it, every consumer must manually compose disabled states + spinners.

**Fix Recommendation:**
At minimum, add a `loading?: boolean` prop to `Button` that:
- Sets `disabled={true}`
- Optionally renders a `Loader2` spinner icon inside the button
- Adds `aria-busy="true"` and `aria-label` fallback

---

### 11. `PopoverAnchor` Missing from `popover.tsx`
**File:** `/src/components/ui/popover.tsx`  
**Severity:** HIGH

The `index.ts` re-exports `PopoverAnchor` from `popover.tsx`, but the file never defines or exports it. `PopoverPrimitive.Anchor` should be re-exported for anchoring popovers to custom trigger locations.

**Fix Recommendation:**
Add to `popover.tsx`:
```ts
const PopoverAnchor = PopoverPrimitive.Anchor;
```

---

### 12. `useCombinedRefs` Defined After Usage
**File:** `/src/components/ui/textarea.tsx`  
**Severity:** HIGH

**Line 16:**
```ts
const combinedRef = useCombinedRefs(ref, textareaRef);
```

**Lines 59-72:**
```ts
function useCombinedRefs<T>(...refs: React.Ref<T>[]) {
  ...
}
```

While JavaScript function hoisting makes this work at runtime, it is poor readability and can break with certain bundler/TypeScript configurations (e.g., `const`/`let` temporal dead zone if converted). The helper should be defined above the component or extracted to `utils`.

**Fix Recommendation:**
Move `useCombinedRefs` to `/src/lib/utils.ts` (or above `Textarea`) and import it.

---

## Medium Severity Issues

### 13. `DialogHeader` / `DialogFooter` Not Using `forwardRef`
**File:** `/src/components/ui/dialog.tsx`  
**Severity:** MEDIUM

**Lines 56-67, 70-82:**
```ts
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div ... />
);
```

These structural wrappers don't accept refs. While they are rarely the target of refs, it breaks the primitive contract that all UI components should be ref-forwardable for consistency.

**Fix Recommendation:**
Wrap `DialogHeader`, `DialogFooter`, `DropdownMenuShortcut`, `CommandShortcut`, and `CommandDialog` in `React.forwardRef`.

---

### 14. `CommandDialog` Not Using `forwardRef`
**File:** `/src/components/ui/command.tsx`  
**Severity:** MEDIUM

**Line 27:**
```ts
const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
```

`CommandDialog` wraps `Dialog` but doesn't forward refs to it, preventing programmatic dialog control.

**Fix Recommendation:**
Wrap in `React.forwardRef` and pass `ref` to `<Dialog>`.

---

### 15. Missing `aria-label` / `aria-labelledby` on `DialogTitle` Usage
**File:** `/src/components/ui/dialog.tsx` (usage pattern)  
**Severity:** MEDIUM

The `DialogContent` component in `dialog.tsx` includes a close button with an `sr-only` label, which is good. However, there is no enforcement that `DialogTitle` is present when `DialogContent` is used. Radix Dialog requires `DialogTitle` for accessibility; without it, screen readers announce an unnamed dialog.

**Fix Recommendation:**
Add a dev-only warning (or TypeScript constraint) when `DialogContent` is rendered without a `DialogTitle` child.

---

### 16. `Card` Renders `<div>` Without Semantic Role Option
**File:** `/src/components/ui/card.tsx`  
**Severity:** MEDIUM

The `Card` component always renders as a `<div>`. It has no `as` prop to render as `<article>`, `<section>`, or `<li>` for semantic HTML. Cards are frequently used in lists or as standalone content blocks where `<article>` is more appropriate.

**Fix Recommendation:**
Add `asChild?: boolean` support (like Button) or an `as?: React.ElementType` prop to allow semantic composition.

---

### 17. `SkeletonText` Array Keys Use Index
**File:** `/src/components/ui/skeleton.tsx`  
**Severity:** MEDIUM

**Line 46:**
```ts
{Array.from({ length: lines }).map((_, i) => (
  <Skeleton key={i} ... />
))}
```

Using array index as `key` is generally acceptable for static lists, but if `lines` prop changes dynamically, React will re-render inefficiently. Since Skeleton lines are identical, this is low impact.

**Fix Recommendation:**
Use a stable prefix: `key={`skeleton-line-${i}`}` for better debugging in React DevTools.

---

### 18. `ScrollArea` Lacks `type="hover"` / `type="auto"` Prop
**File:** `/src/components/ui/scroll-area.tsx`  
**Severity:** MEDIUM

The `ScrollArea` component hardcodes no `type` prop on the `ScrollAreaPrimitive.Root`. Radix supports `type="auto" | "always" | "hover" | "scroll"`. The current default (no prop) may show scrollbars on Windows permanently, degrading the aesthetic.

**Fix Recommendation:**
Add `type?: "auto" | "always" | "hover" | "scroll"` and default to `"hover"`.

---

### 19. `input.tsx` Variant Overlap — `error` Overrides `variant` Prop
**File:** `/src/components/ui/input.tsx`  
**Severity:** MEDIUM

**Line 69:**
```ts
inputVariants({ variant: variant || (errorMessage ? "error" : "default") })
```

If a consumer explicitly passes `variant="ghost"` but also provides `errorMessage`, the explicit `variant` is silently overridden by `"error"`. This is surprising behavior.

**Fix Recommendation:**
Apply error styles as additive classes rather than overriding the variant:
```ts
variant: variant ?? "default",
// then conditionally add error classes:
errorMessage && "border-[var(--semantic-danger)] ..."
```

---

### 20. `Slider` Missing `aria-valuetext` / Custom Label Support
**File:** `/src/components/ui/slider.tsx`  
**Severity:** MEDIUM

The `Slider` primitive exposes no `aria-label`, `aria-labelledby`, or `aria-valuetext` props. Radix Slider supports these internally via props, but the wrapper doesn't explicitly document or encourage them.

**Fix Recommendation:**
Add a `label?: string` prop that renders an `<label>` and wires `aria-labelledby`, plus expose `getAriaValueText` from Radix.

---

### 21. `TableRow` `data-[state=selected]` Class Without Selection API
**File:** `/src/components/ui/table.tsx`  
**Severity:** MEDIUM

**Line 70:**
```ts
"data-[state=selected]:bg-[var(--accent-primary)]/5"
```

The row includes a `data-[state=selected]` style, but there is no corresponding selection state prop (`selected?: boolean`) or checkbox integration on `TableRow`. The style is unreachable unless the consumer manually sets `data-state="selected"`.

**Fix Recommendation:**
Add a `selected?: boolean` prop to `TableRow` that sets `data-state={selected ? "selected" : undefined}` and `aria-selected={selected}`.

---

### 22. `CommandItem` Uses `aria-selected` for Highlight, Not Actual Selection
**File:** `/src/components/ui/command.tsx`  
**Severity:** MEDIUM

**Line 122:**
```ts
"aria-selected:bg-[var(--bg-surface-2)] aria-selected:text-[var(--text-primary)]"
```

This styles the *highlighted* item during keyboard navigation. `aria-selected` in ARIA semantics indicates actual selection, not focus. While `cmdk` uses this convention internally, it can confuse screen readers.

**Fix Recommendation:**
This is largely inherited from `cmdk` behavior. Ensure consumers don't confuse `aria-selected` with checked/selected state by documenting the component's keyboard navigation model.

---

### 23. `index.ts` Missing Exports
**File:** `/src/components/ui/index.ts`  
**Severity:** MEDIUM

- `AvatarGroup`, `getInitials`, `AvatarSizes` from `avatar.tsx` are **not re-exported**.
- `CommandShortcut` from `command.tsx` is **not re-exported**.
- `ToastClose`, `ToastAction` from `toast.tsx` are **not re-exported**.

**Fix Recommendation:**
Audit and add missing exports, or remove them from the source file if they are intentionally private.

---

### 24. `Switch` Thumb Color Hardcoded to Surface
**File:** `/src/components/ui/switch.tsx`  
**Severity:** MEDIUM

**Line 21:**
```ts
"block h-5 w-5 rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-surface)] shadow-medium ..."
```

The thumb uses `var(--bg-surface)` for both border and fill. In certain custom themes where surface and canvas are the same, the thumb may disappear.

**Fix Recommendation:**
Use a dedicated `--switch-thumb` token or ensure high contrast against the track.

---

### 25. `Toast` Description Inherits Parent Color, May Be Illegible
**File:** `/src/components/ui/toast.tsx`  
**Severity:** MEDIUM

**Lines 33-38 (toastVariants):**
```ts
success: "border-[var(--semantic-success)]/25 bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]"
```

The `ToastDescription` (line 113) uses `text-sm opacity-90` but does **not** set an explicit text color. On success/warning/danger toasts, the description inherits the parent's semantic color (e.g., green text on green background), potentially failing WCAG contrast.

**Fix Recommendation:**
Add `text-[var(--text-primary)]` to `ToastDescription` or create description variants that pair with toast variants.

---

### 26. `TooltipContent` Missing `avoidCollisions` / Collision Padding
**File:** `/src/components/ui/tooltip.tsx`  
**Severity:** MEDIUM

The `TooltipContent` wrapper does not expose Radix's `avoidCollisions`, `collisionPadding`, or `sticky` props. Tooltips near viewport edges may overflow or be clipped.

**Fix Recommendation:**
Expose these props or set sensible defaults (`collisionPadding={8}`).

---

## Low Severity Issues

### 27. Inconsistent CSS Token Systems
**File:** Multiple files  
**Severity:** LOW

PascalCase files use Tailwind utility-style classes (`bg-accent-primary`, `text-foreground-primary`) while lowercase files use CSS custom properties (`bg-[var(--accent-primary)]`, `text-[var(--text-primary)]`). This inconsistency makes theme customization harder and can cause missing styles if the Tailwind config doesn't define the utilities.

**Fix Recommendation:**
Standardize on CSS custom properties (lowercase convention) across all files.

---

### 28. `Button` / `Badge` Size Discrepancies Between Duplicates
**File:** `/src/components/ui/button.tsx` vs `/src/components/ui/Button.tsx`  
**Severity:** LOW

| Size | button.tsx (lowercase) | Button.tsx (PascalCase) |
|---|---|---|
| default/md | h-10 | h-9 |
| lg | h-12 | h-10 |
| icon | h-10 w-10 | h-9 w-9 |

This means importing from different files produces visually different buttons for the same `size` prop.

---

### 29. `Input.tsx` vs `input.tsx` Height Mismatch
**File:** `/src/components/ui/Input.tsx` vs `/src/components/ui/input.tsx`  
**Severity:** LOW

- `Input.tsx`: `h-9`
- `input.tsx`: default (no explicit height, but padding-based ~h-10)

Again, two different visual baselines.

---

### 30. `focus-visible:ring-offset` Value Inconsistency
**File:** `/src/components/ui/Input.tsx`, `/src/components/ui/Textarea.tsx`  
**Severity:** LOW

PascalCase Input and Textarea use `focus-visible:ring-offset-1` while all lowercase files use `focus-visible:ring-offset-2`. The 1px offset is often invisible on high-DPI screens.

**Fix Recommendation:**
Standardize to `focus-visible:ring-offset-2`.

---

### 31. Missing `displayName` on `Badge.tsx` (PascalCase)
**File:** `/src/components/ui/Badge.tsx`  
**Severity:** LOW

Plain function component has no `displayName`, making DevTools debugging harder.

---

### 32. `DialogOverlay` Backdrop Opacity Inconsistent with Design Tokens
**File:** `/src/components/ui/dialog.tsx`  
**Severity:** LOW

**Line 23:**
```ts
"fixed inset-0 z-50 bg-[var(--bg-canvas)]/80 backdrop-blur-sm"
```

The overlay uses `bg-canvas` at 80% opacity. Some design systems prefer a dedicated overlay token (`--bg-overlay`) rather than reusing canvas.

---

### 33. `AccordionTrigger` Hover Color Is Lighter Than Default
**File:** `/src/components/ui/accordion.tsx`  
**Severity:** LOW

**Line 31:**
```ts
"text-[var(--text-primary)] hover:text-[var(--text-secondary)]"
```

Hovering makes the text *lighter* (secondary), which feels like a "dimming" effect rather than an emphasis. Typically hover should increase contrast or change to an accent color.

**Fix Recommendation:**
Use `hover:text-[var(--accent-primary)]` or `hover:underline` for clearer affordance.

---

### 34. `DropdownMenuSubTrigger` Chevron Is Not Accessible
**File:** `/src/components/ui/dropdown-menu.tsx`  
**Severity:** LOW

**Line 36:**
```ts
<ChevronRight className="ml-auto h-4 w-4" />
```

The chevron icon lacks `aria-hidden="true"` or an accessible label. It is decorative, so it should be hidden from screen readers.

**Fix Recommendation:**
Add `aria-hidden="true"` to the icon.

---

### 35. `TabsTrigger` No `aria-pressed` / Explicit Active State for Screen Readers
**File:** `/src/components/ui/tabs.tsx`  
**Severity:** LOW

Radix Tabs handles `aria-selected` internally, but the custom styling uses `data-[state=active]`. Ensure `role="tab"` is present (Radix does this). No additional action required unless custom wrappers break it.

---

### 36. `theme-provider.tsx` is a Bare Pass-Through
**File:** `/src/components/ui/theme-provider.tsx`  
**Severity:** LOW

The file is a trivial wrapper around `next-themes`. It adds no custom logic, default theme, or forced theme handling. This is fine but could be consolidated into `providers.tsx` at the app root rather than living in `ui/`.

---

## Positive Findings

1. **CVA is used well** in `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `toast.tsx` with clear variant hierarchies.
2. **`forwardRef`** is correctly applied in the vast majority of components.
3. **`cn()` utility** is consistently used for class merging across all files.
4. **Dark mode tokens** in lowercase files are fully CSS-variable-driven, enabling easy theming.
5. **`asChild` is properly implemented** in lowercase `button.tsx` using `@radix-ui/react-slot`.
6. **Accessibility on `input.tsx`** is excellent: `aria-invalid`, `aria-describedby`, label association, error/helper text wiring.
7. **`textarea.tsx`** has a useful `autoGrow` feature with proper combined ref handling.
8. **Animation tokens** (`duration-fast`, `ease-spring`, `ease-out`) are consistently used.
9. **Keyboard focus rings** are visible and styled in most interactive components.
10. **Radix primitives** are properly imported and wrapped with consistent displayName inheritance.

---

## File-by-File Grade Card

| File | CVA | forwardRef | asChild | Dark Mode | Focus Ring | Disabled | Loading | Size Scale | Grade |
|---|---|---|---|---|---|---|---|---|---|
| `button.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | B+ |
| `card.tsx` | ✅ | ✅ | ❌ | ✅ | N/A | N/A | N/A | ❌ | B |
| `input.tsx` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | N/A | ❌ | B+ |
| `badge.tsx` | ✅ | ✅ | ❌ | ✅ | N/A | N/A | N/A | ✅ | B+ |
| `avatar.tsx` | ❌ | ✅ | ❌ | ✅ | N/A | N/A | N/A | ❌* | C+ |
| `skeleton.tsx` | ❌ | ✅ | N/A | ✅ | N/A | N/A | N/A | N/A | B |
| `separator.tsx` | ❌ | ✅ | N/A | ✅ | N/A | N/A | N/A | N/A | B |
| `scroll-area.tsx` | ❌ | ✅ | N/A | ✅ | N/A | N/A | N/A | N/A | B |
| `tabs.tsx` | ❌ | ✅ | N/A | ✅ | ✅ | ✅ | N/A | N/A | B+ |
| `accordion.tsx` | ❌ | ✅ | N/A | ✅ | ✅ | N/A | N/A | N/A | B |
| `dialog.tsx` | ❌ | ✅* | N/A | ✅ | ✅ | N/A | N/A | N/A | B |
| `dropdown-menu.tsx` | ❌ | ✅ | N/A | ✅ | ✅ | ✅ | N/A | N/A | B+ |
| `tooltip.tsx` | ❌ | ✅ | N/A | ✅ | N/A | N/A | N/A | N/A | B |
| `toast.tsx` | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | N/A | N/A | B+ |
| `switch.tsx` | ❌ | ✅ | N/A | ✅ | ✅ | ✅ | ❌ | N/A | B |
| `slider.tsx` | ❌ | ✅ | N/A | ✅ | ✅ | N/A | ❌ | N/A | B |
| `table.tsx` | ❌ | ✅ | ❌ | ✅ | N/A | N/A | N/A | ❌ | C+ |
| `textarea.tsx` | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | N/A | ❌ | B |
| `select.tsx` | ❌ | ✅ | N/A | ✅ | ⚠️* | ✅ | N/A | N/A | B- |
| `popover.tsx` | ❌ | ✅ | N/A | ✅ | N/A | N/A | N/A | N/A | B |
| `command.tsx` | ❌ | ✅* | N/A | ✅ | ❌* | N/A | N/A | N/A | C+ |
| `theme-provider.tsx` | N/A | N/A | N/A | ✅ | N/A | N/A | N/A | N/A | A |
| `Button.tsx` (old) | ✅ | ✅ | ❌* | ⚠️ | ✅ | ✅ | ❌ | ✅ | D |
| `Badge.tsx` (old) | ✅ | ❌ | N/A | ⚠️ | N/A | N/A | N/A | ❌ | D |
| `Input.tsx` (old) | ❌ | ✅ | N/A | ⚠️ | ⚠️ | ✅ | N/A | ❌ | D |
| `Textarea.tsx` (old) | ❌ | ✅ | N/A | ⚠️ | ⚠️ | ✅ | N/A | ❌ | D |
| `Skeleton.tsx` (old) | ✅ | ❌ | N/A | ⚠️ | N/A | N/A | N/A | ✅ | D |

*Notes:*
- `dialog.tsx`: `DialogHeader`/`DialogFooter` lack `forwardRef`.
- `command.tsx`: `CommandDialog`/`CommandShortcut` lack `forwardRef`; `CommandInput` lacks focus ring.
- `select.tsx`: Uses `focus:` instead of `focus-visible:`.
- `avatar.tsx`: `AvatarSizes` exported but not wired into component.

---

## Recommended Action Plan

### Phase 1 — Critical Cleanup (Immediate)
1. **Delete PascalCase duplicates** (`Button.tsx`, `Badge.tsx`, `Input.tsx`, `Textarea.tsx`, `Separator.tsx`, `Skeleton.tsx`).
2. **Fix `index.ts` broken exports** (`skeletonVariants` from `Skeleton.tsx`, `PopoverAnchor` from `popover.tsx`).
3. **Merge `Toaster.tsx`** to import from local `toast.tsx` instead of Radix directly.
4. **Verify build** compiles with zero export errors.

### Phase 2 — API Hardening (This Sprint)
5. Add `loading` prop to `Button` with `aria-busy` and spinner.
6. Add `size` prop to `Avatar` using the existing `AvatarSizes` map.
7. Add `asChild` or `as` prop to `Card` for semantic flexibility.
8. Fix `select.tsx` to use `focus-visible:` instead of `focus:`.
9. Add focus ring to `CommandInput`.
10. Wire `PopoverAnchor` into `popover.tsx`.

### Phase 3 — Polish & Consistency (Next Sprint)
11. Extract `useCombinedRefs` to `lib/utils.ts`.
12. Fix `input.tsx` so `errorMessage` does not silently override explicit `variant`.
13. Add `selected` prop to `TableRow`.
14. Add `type` prop to `ScrollArea` for hover/auto scrollbar behavior.
15. Standardize all `focus-visible:ring-offset-2` across components.
16. Wrap `DialogHeader`, `DialogFooter`, `CommandDialog`, `CommandShortcut`, `DropdownMenuShortcut` in `forwardRef`.
17. Export missing members from `index.ts` (`AvatarGroup`, `getInitials`, `AvatarSizes`, `CommandShortcut`, `ToastClose`, `ToastAction`).

---

*End of Report*
