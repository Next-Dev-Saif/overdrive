# UI/UX Design Guidelines - Master Reference

## Centralized Design Rules for Professional, Intentional Interfaces

**Mission**: Every interface must look like it was designed by a senior product designer with 10+ years of craft. Not assembled. Not generated. Designed.

---

## PART 1 — CORE PRINCIPLES & MINDSET

### 1.1 Design With Intent, Not Instinct

Every decision — padding, color, font weight, border radius — must have a reason:

- What is the user trying to do on this screen?
- What is the single most important action?
- What information is secondary and should recede?
- If you can't answer why an element exists, remove it.

### 1.2 Design for the User's Mental Model

Real users don't read interfaces — they scan them. Eye-tracking studies confirm F-pattern or Z-pattern scan across most layouts:

- Place critical content top-left
- Primary CTAs at natural resting points
- Never bury key actions

### 1.3 Treat AI Defaults as Starting Points

AI-generated UI has identifiable "tells." Override every default that makes the design look assembled rather than intentional.

### 1.4 One Thing Per Screen

One focal point per screen is the hero. Everything else serves it.

---

## PART 2 — ACCESSIBILITY (CRITICAL PRIORITY)

### 2.1 Color Contrast

- **Body text on background**: 4.5:1 minimum (WCAG AA)
- **Large text / UI components**: 3:1 minimum
- **Never guess** — use contrast checking tools
- **Dark mode**: Maintain same contrast ratios independently

### 2.2 Focus States

- Visible focus rings on all interactive elements (2–4px)
- Tab order must match visual order
- Full keyboard support required
- Never remove focus rings

### 2.3 Screen Reader Support

- Descriptive alt text for meaningful images
- `aria-label` for icon-only buttons
- Sequential heading hierarchy (h1→h6, no level skip)
- Logical reading order for VoiceOver/screen readers
- Skip links to main content for keyboard users

### 2.4 Color Not as Only Indicator

- Never convey information by color alone
- Add icons or text to reinforce meaning
- Functional colors (error red, success green) must include icon/text

### 2.5 Dynamic Type & Text Scaling

- Support system text scaling
- Avoid truncation as text grows
- Test at largest Dynamic Type size
- Minimum 16px body text on mobile (prevents iOS auto-zoom)

### 2.6 Reduced Motion

- Always implement `@media (prefers-reduced-motion: reduce)`
- Disable or minimize transitions for users who need it
- Chart animations must respect reduced motion preferences

---

## PART 3 — TOUCH & INTERACTION (CRITICAL PRIORITY)

### 3.1 Touch Target Sizes

- **Minimum**: 44×44pt (iOS) / 48×48dp (Android)
- Use `hitSlop` or extended hit areas for smaller icons
- Minimum 8px/8dp gap between touch targets

### 3.2 Interaction Feedback

- **Tap feedback**: Clear pressed state (ripple/opacity/elevation) within 80-150ms
- **Hover states**: 150ms ease
- **Focus transitions**: 100ms ease
- **Loading buttons**: Disable during async operations, show spinner/progress
- **Cursor pointer**: Add to all clickable elements (web)

### 3.3 Gesture Handling

- Use platform standard gestures consistently (don't redefine swipe-back, pinch-zoom)
- Don't block system gestures (Control Center, back swipe)
- Avoid horizontal swipe on main content; prefer vertical scroll
- Provide visible controls for critical actions (don't rely on gesture-only)
- Use movement threshold before starting drag to avoid accidental drags

### 3.4 Safe Areas

- Keep primary touch targets away from notch, Dynamic Island, gesture bar
- Respect top/bottom safe areas for all fixed headers, tab bars, CTA bars
- Add spacing for status/navigation bars and gesture home indicator

### 3.5 Disabled States

- Use reduced opacity (0.38–0.5) + cursor change + semantic attribute
- Disabled elements must be visually clear and non-interactive
- Use proper `disabled` props for semantics

---

## PART 4 — VISUAL HIERARCHY

### 4.1 Three-Tier Hierarchy Rule

Every screen must have exactly three tiers of visual weight:

| Tier      | Role                            | Example Treatment                       |
| --------- | ------------------------------- | --------------------------------------- |
| Primary   | The one thing that matters most | Large, high contrast, full color        |
| Secondary | Supporting context              | Medium size, muted tone, regular weight |
| Tertiary  | Background data or meta info    | Small, low contrast, light weight       |

**Never promote more than 1–2 elements to Primary on a single screen.**

### 4.2 Scale as Hierarchy Tool

Use logarithmic scale for typography and element sizing:

- **H1 / Hero**: 48–72px
- **H2 / Section**: 28–36px
- **H3 / Card title**: 20–24px
- **Body**: 15–17px
- **Caption / Meta**: 12–13px

**Never use more than 4 distinct sizes on a screen.**

### 4.3 Weight Over Size

When space is tight, increase font weight instead of size:

- A `700` heading at 18px beats a `400` heading at 22px for attention

### 4.4 Contrast as Hierarchy Signal

- **Primary text**: 90–95% opacity or solid `#111` / `#1a1a1a`
- **Secondary text**: 60–70% opacity
- **Tertiary / placeholder**: 35–45% opacity

### 4.5 Visual Hierarchy Strips

When grouping related information, separate action groups with visual space before touching other styling. Think in blocks of meaning first, then style them.

---

## PART 5 — TYPOGRAPHY

### 5.1 Font Choice

- Default to **Inter, Geist, or Poppins** for modern product UI
- Use custom/display typeface only for hero/brand moments — never body text
- Stick to 1 typeface with multiple weights, or 2 typefaces max
- Avoid system defaults (Arial, Times New Roman) unless context demands

### 5.2 Weight Contrast

Use the full range of weights:

- `300` — delicate labels, captions
- `400` — body copy
- `500` — emphasized body, nav items
- `600` — subheadings, card titles
- `700–800` — major headings
- `900` — hero statements only

### 5.3 Line Height & Letter Spacing

| Context               | Line Height | Letter Spacing               |
| --------------------- | ----------- | ---------------------------- |
| Large display (48px+) | 1.0–1.15    | -0.02em to -0.04em (tighter) |
| Headings (24–40px)    | 1.2–1.3     | -0.01em to 0                 |
| Body text (15–17px)   | 1.5–1.65    | 0 to +0.01em                 |
| Captions / labels     | 1.4–1.5     | +0.02em to +0.08em           |

**Large headings must be tightened. Body text must breathe.**

### 5.4 Text Measure

- **Mobile**: 35–60 characters per line
- **Desktop**: 60–75 characters per line
- Avoid edge-to-edge paragraphs on tablets

### 5.5 Number Formatting

- Use tabular/monospaced figures for data columns, prices, timers
- Prevents layout shift when numbers change
- Locale-aware formatting for numbers, dates, currencies

---

## PART 6 — COLOR SYSTEM

### 6.1 Restrained Palette

| Role     | Count                      | Usage                                         |
| -------- | -------------------------- | --------------------------------------------- |
| Primary  | 1 color + 2–3 tints/shades | CTAs, active states, brand moments            |
| Neutral  | 6–8 grayscale steps        | Backgrounds, text, dividers, surfaces         |
| Semantic | 3 colors                   | Success (green), Warning (amber), Error (red) |
| Accent   | 0–1 color                  | Highlights only — use sparingly               |

**Never use more than 2 non-neutral colors at full saturation on a single screen.**

### 6.2 Pure Black/White Rule

- **Never use pure `#000000` on pure `#FFFFFF`** — it's harsh
- Use near-blacks: `#111827`, `#1a1a1a`
- Use off-whites: `#FAFAFA`, `#F9FAFB`
- Dark mode: Use dark shade tinted with primary color (e.g., `#0d0f14` for blue-accent app)

### 6.3 Semantic Color Discipline

- Never repurpose semantic colors for decoration
- Red = errors only
- Green = success only
- Using green as accent on non-success element trains users to misread interface

### 6.4 Gradients

- Keep hue shift narrow (e.g., blue-500 to blue-700, not blue to purple)
- Use for backgrounds, cards, hero sections — not text unless deliberate brand moment
- **Avoid saturated neon gradients** (cyan → magenta → orange) — #1 AI design tell

### 6.5 Color Tokens

- Define semantic color tokens (primary, secondary, error, surface, on-surface)
- Don't use raw hex values in components
- Map tokens per theme for light/dark mode

---

## PART 7 — SPACING & LAYOUT SYSTEM

### 7.1 The 8px Grid — Non-Negotiable

All spacing, padding, margins, and sizes must be multiples of 8 (or 4 for fine-tuning): 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128

Random values like `13px`, `22px`, `37px` are immediately visible as AI artifacts.

### 7.2 Spacing Communicates Relationships (Proximity Law)

- **Elements that belong together** → tight spacing (8–12px)
- **Elements in same group** → medium spacing (16–24px)
- **Separate sections/groups** → generous spacing (40–64px)
- Use space as divider before reaching for lines or borders

### 7.3 Breathing Room

- Crowded layouts signal low confidence
- Whitespace reduces cognitive load, guides focus, elevates perceived quality
- When in doubt, add 16px more padding

### 7.4 Max-Width & Container Awareness

- Check parent container's max-width before adding new one
- If parent constrains width (e.g., `max-width: 1200px`), use `width: 100%`
- Global layout max-widths: `640px` (narrow), `768px` (content), `1024px` (wide), `1280px` (full desktop)

### 7.5 Fill Empty Space Intelligently

Before shipping, scan for large empty areas. Ask: "What logically belongs here?"

- A stat, metric, or supporting callout?
- A secondary action or contextual link?
- A visual accent (icon, illustration placeholder, subtle pattern)?
- **Never fill space with decoration** — fill with relevant content

### 7.6 Section Spacing Hierarchy

Define clear vertical rhythm tiers:

- Component level: 8–16px
- Section level: 24–32px
- Page level: 48–64px

---

## PART 8 — COMPONENTS

### 8.1 Buttons

**Styles:**

- **Primary**: Solid background, high contrast text, `border-radius: 6–10px`
- **Secondary**: Outlined or ghost, same radius as primary
- **Destructive**: Only use red when action is irreversible

**Sizing:**

- Minimum height: 44px (mobile/touch), 40px (desktop)
- Never use more than 2 button styles in same view

**Labels:**

- Verb + noun or verb only: "Save", "Delete Account", "Export CSV"
- Never: "Click Here" or "Submit"

### 8.2 Forms

**Labels:**

- Label above input, always (not placeholder-only)
- Mark required fields with asterisk

**Inputs:**

- Height: 40–44px with 12–16px horizontal padding
- Group related fields visually (proximity, shared background)
- Use semantic input types (email, tel, number) for correct mobile keyboard

**Validation:**

- Inline validation — show errors at field level, not only at submit
- Validate on blur (not keystroke)
- Show error below related field
- Error messages must state cause + how to fix
- Auto-focus first invalid field after submit error

**Progress:**

- Progress indicators for multi-step forms
- Allow back navigation in multi-step flows
- Long forms should auto-save drafts

**Helper Text:**

- Provide persistent helper text below complex inputs
- Not just placeholder

### 8.3 Cards

- Consistent internal padding: 16–24px
- One primary action per card (if interactive)
- Subtle shadow: `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`
- Don't overload — if needs more than 4–5 elements, reconsider data model

### 8.4 Tables & Data

- Zebra striping or row hover — pick one, not both
- Align numbers right, text left
- Column headers: uppercase, `font-size: 11–12px`, `letter-spacing: 0.06em`
- Provide empty states with message AND primary action
- Support sorting with `aria-sort` indicating current sort state

### 8.5 Icons & Visual Elements

**Icon Standards:**

- Use vector-based icons (Lucide, Phosphor, Heroicons) — never emojis
- SVG or platform vector icons that scale cleanly
- Consistent icon sizing as design tokens (icon-sm: 16px, icon-md: 20px, icon-lg: 24px)
- Consistent stroke width within same visual layer (1.5px or 2px)
- Use one icon style per hierarchy level (filled or outline, not mixed)

**Icon Alignment:**

- Align to text baseline
- Maintain consistent padding
- Minimum 44×44pt interactive area (use hitSlop if icon smaller)

**Icon Contrast:**

- 4.5:1 for small elements
- 3:1 minimum for larger UI glyphs

### 8.6 UI/UX Engineering Rules for Modals & Overlays

Always adhere to the following best practices when creating modals, popups, or overlays in any web project:

## 1. Scrollable Modal Containers

Never use fixed centering on the modal element itself if the content might exceed the viewport height (e.g., on mobile devices). This causes the top and bottom content to clip irreversibly.
Instead, apply `overflow-y-auto` to the outermost backdrop layer and use a flex wrapper with `min-h-full`:

```jsx
{
  /* Outermost wrapper handles scrolling */
}
<div className="fixed inset-0 z-50 overflow-y-auto">
  {/* Backdrop is fixed independently so it doesn't scroll with content */}
  <div
    className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
    onClick={closeModal}
  />

  {/* Flex container ensures vertical centering when small, but expands with padding when tall */}
  <div className="flex min-h-full items-center justify-center p-4 py-16 md:p-8">
    {/* Actual Modal Box */}
    <div className="relative w-full max-w-lg bg-white rounded-3xl p-8">
      {/* Modal Content Here */}
    </div>
  </div>
</div>;
```

## 2. Responsive Split Layouts (Desktop Left/Right)

For content-heavy modals (e.g., CTA modals showcasing an app download alongside a screenshot):

- **Mobile**: Stack elements vertically (`flex flex-col`).
- **Desktop**: Expand the modal width (e.g., `max-w-4xl`) and split the content into two side-by-side columns (`md:flex-row`). Place text and actionable buttons on the left, and visual context (like mockups) on the right.

## 3. Top-Right Close Actions

Always use a clean, icon-based (SVG) close button (`X`) absolutely positioned at the top right of the modal container instead of rendering a text-based "Cancel" button at the bottom of the flow. Provide it with generous padding and a subtle hover effect (e.g., `hover:bg-gray-100 rounded-full`).

---

## PART 9 — DEPTH & LAYERING

### 9.1 Z-Axis Story

Every UI has layers. Communicate them consistently:

| Layer        | Element             | Treatment                         |
| ------------ | ------------------- | --------------------------------- |
| 0 — Ground   | Page background     | Base color, no shadow             |
| 1 — Surface  | Cards, panels       | Subtle shadow or slight tint      |
| 2 — Raised   | Dropdowns, tooltips | Medium shadow                     |
| 3 — Floating | Modals, drawers     | Strong shadow + backdrop blur     |
| 4 — Overlay  | Toast/alerts        | Highest z-index, strongest shadow |

### 9.2 Shadows as Elevation

Use `box-shadow` to establish depth, not decoration.

**Shadow Recipes:**

- **Level 1**: `0 1px 2px rgba(0,0,0,0.05)`
- **Level 2**: `0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)`
- **Level 3**: `0 12px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`
- **Level 4**: `0 24px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)`

### 9.3 Elevation Consistency

- Use consistent elevation/shadow scale across product
- Avoid random shadow values
- Button shouldn't have shadow just because it looks cool — only if visually elevated

---

## PART 10 — ANIMATION & MOTION

### 10.1 Motion Purpose

Every animation must answer: "Did my action work?"

**Timing:**

- **Hover states**: 150ms ease
- **Focus transitions**: 100ms ease
- **Entering elements** (modal, drawer): 200–280ms ease-out
- **Exiting elements**: 150–200ms ease-in (exits faster than entrances)
- **Page/route transitions**: 200–300ms
- **Complex transitions**: ≤400ms
- **Never >500ms**

### 10.2 What NOT to Animate

- Don't animate layout shifts (causes cognitive disruption)
- Don't loop animations in idle state (distracting)
- Don't use bouncy/spring animations in B2B/enterprise contexts
- Don't animate text (almost always illegible mid-animation)
- Don't animate width/height/top/left — use transform/opacity only

### 10.3 Motion Principles

- **Easing**: ease-out for entering, ease-in for exiting
- **Spring physics**: Prefer spring/physics-based curves for natural feel
- **Interruptible**: Animations must be interruptible by user action
- **No blocking**: Never block user input during animation
- **Spatial continuity**: Page transitions maintain spatial context
- **Stagger sequence**: Stagger list/grid entrance by 30–50ms per item

### 10.4 Interaction Feedback

- Subtle scale (0.95–1.05) on press for tappable elements
- Restore on release
- Drag, swipe, pinch must provide real-time visual response
- Forward navigation animates left/up; backward animates right/down

---

## PART 11 — RESPONSIVE DESIGN

### 11.1 Desktop vs Mobile

**Desktop:**

- Higher information density
- Multi-column layouts expected
- Hover states available for secondary actions
- Persistent navigation (sidebar)

**Mobile:**

- Touch targets minimum 44×44px
- One primary action per screen
- Bottom navigation preferred over top (thumb zone)
- Never put critical interactions at very top of long screens

### 11.2 Breakpoints

| Name    | Width       | Layout                                |
| ------- | ----------- | ------------------------------------- |
| Mobile  | < 640px     | 1 column, stacked                     |
| Tablet  | 640–1024px  | 2 columns, adaptive                   |
| Desktop | 1024–1280px | 3–4 columns, full nav                 |
| Wide    | > 1280px    | Max-width container, extra whitespace |

### 11.3 Mobile-First Approach

- Design mobile-first, then scale up
- Responsive means rethinking, not shrinking
- On mobile:
  - Tables become stacked cards or horizontal-scroll
  - Multi-column forms become single-column
  - Sidebar nav becomes bottom bar or hamburger
  - Data-dense dashboards simplify to priority metrics

### 11.4 Viewport & Layout

- `width=device-width initial-scale=1` (never disable zoom)
- No horizontal scroll on mobile
- Use `min-h-dvh` over `100vh` on mobile
- Keep layout readable in landscape mode
- Increase horizontal insets on larger widths

---

## PART 12 — NAVIGATION PATTERNS

### 12.1 Navigation Types

- **Top nav**: Broad products (content sites, marketing)
- **Sidebar nav**: Dense tools (dashboards, admin panels, apps)
- **Bottom nav**: Mobile top-level navigation (max 5 items)
- **Drawer**: Secondary navigation, not primary actions

### 12.2 Navigation Rules

- Active state must be unmistakable (color + weight change, not just underline)
- Limit top-level nav items to 5–7 maximum
- Navigation items must have both icon and text label
- Current location must be visually highlighted
- Primary nav vs secondary nav must be clearly separated

### 12.3 Navigation Behavior

- Back navigation must be predictable and consistent
- Preserve scroll/state when navigating back
- All key screens reachable via deep link / URL
- Modals must offer clear close/dismiss affordance
- Support system gesture navigation without conflict
- Never silently reset navigation stack

### 12.4 Navigation Don'ts

- Don't mix Tab + Sidebar + Bottom Nav at same hierarchy level
- Don't use modals for primary navigation flows
- Don't hide core navigation entirely in sub-flows
- Don't nest sub-navigation inside bottom nav

---

## PART 13 — FORMS & FEEDBACK

### 13.1 Form Structure

- Visible label per input (not placeholder-only)
- Group related fields logically (fieldset/legend or visual grouping)
- Read-only state visually different from disabled
- Provide persistent helper text below complex inputs

### 13.2 Validation & Errors

- Inline validation on blur (not keystroke)
- Show error below related field
- Error messages must state cause + how to fix
- Auto-focus first invalid field after submit error
- For multiple errors, show summary at top with anchor links
- Error and success colors must meet 4.5:1 contrast

### 13.3 Feedback States

- **Loading**: Disable button, show spinner/progress
- **Success**: Confirm with brief visual feedback (checkmark, toast, color flash)
- **Error**: Clear message near problem with recovery path
- **Timeout**: Show clear feedback with retry option

### 13.4 Toasts & Notifications

- Auto-dismiss toasts in 3-5s
- Toasts must not steal focus
- Use `aria-live="polite"` for screen reader announcement
- Confirm before destructive actions

### 13.5 Progressive Disclosure

- Reveal complex options progressively
- Don't overwhelm users upfront
- Show core content first on mobile

---

## PART 14 — CHARTS & DATA VISUALIZATION

### 14.1 Chart Selection

- **Trend** → line chart
- **Comparison** → bar chart
- **Proportion** → pie/donut (max 5 categories)
- Match chart type to data type

### 14.2 Chart Accessibility

- Provide table alternative for accessibility
- Use accessible color palettes (avoid red/green only for colorblind)
- Supplement color with patterns/textures/shapes
- Always show legend near chart
- Provide tooltips on hover (web) or tap (mobile)

### 14.3 Chart Design

- Label axes with units and readable scale
- Avoid truncated or rotated labels on mobile
- Charts must reflow or simplify on small screens
- Grid lines low-contrast (gray-200) so they don't compete with data
- For small datasets, label values directly on chart

### 14.4 Chart States

- **Empty**: Show meaningful empty state ("No data yet" + guidance)
- **Loading**: Use skeleton/shimmer placeholder
- **Error**: Show error message with retry action

### 14.5 Chart Interaction

- Interactive elements must have ≥44pt tap area
- Legends should be clickable to toggle series visibility
- For 1000+ data points, aggregate or sample
- Offer CSV/image export for data-heavy products

---

## PART 15 — PERFORMANCE

### 15.1 Images & Assets

- Use WebP/AVIF formats
- Responsive images with `srcset`/`sizes`
- Lazy load non-critical assets
- Declare width/height or use aspect-ratio to prevent layout shift
- Use `loading="lazy"` for below-the-fold images

### 15.2 Fonts

- Use `font-display: swap/optional` to avoid invisible text
- Preload only critical fonts
- Reserve space to reduce layout shift

### 15.3 Code Splitting

- Split code by route/feature
- Use dynamic import / route-level splitting
- Lazy load non-hero components
- Prioritize above-the-fold CSS

### 15.4 Rendering Performance

- Keep per-frame work under ~16ms for 60fps
- Move heavy tasks off main thread
- Avoid frequent layout reads/writes
- Batch DOM reads then writes
- Virtualize lists with 50+ items

### 15.5 Loading States

- Use skeleton screens / shimmer instead of long blocking spinners
- Show skeleton when loading exceeds 300ms
- Provide offline state messaging and basic fallback
- Offer degraded modes for slow networks

### 15.6 Input Latency

- Keep input latency under ~100ms for taps/scrolls
- Provide visual feedback within 100ms of tap
- Use debounce/throttle for high-frequency events

---

## PART 16 — COPY & CONTENT DESIGN

### 16.1 Every Word Is a Design Decision

- **Clarity over cleverness** — users must understand in under 2 seconds
- **Verb-first CTAs**: "Download Report", "Start Free Trial", "Connect Account"
- **No corporate filler**: Delete "Leverage", "Synergy", "Seamless", "Empower"
- **Consistent terminology**: If called "Project" in nav, call it "Project" everywhere

### 16.2 Empty States

Never show blank screen. Every empty state needs:

- Clear explanation of why it's empty
- Illustration or icon (simple, not cartoonish)
- Primary CTA that resolves the emptiness

### 16.3 Error Messages

- Say what happened: "We couldn't save your changes"
- Say why (if useful): "Your session has expired"
- Say what to do: "Sign in again to continue"
- Never say: "Error 403" or "Something went wrong" alone

---

## PART 17 — DARK MODE

### 17.1 Dark Mode Color Logic

Think of phone held at 45° angle with light source above:

- Elements closer to user appear slightly lighter
- Elevated cards → slightly lighter surface than background
- Background → darkest value

### 17.2 Dark Mode Colors

- Avoid pure `#000000` — use dark shade tinted with primary color
- Avoid pure `#FFFFFF` — use slightly warm or tinted near-white
- Use desaturated / lighter tonal variants, not inverted colors
- Test contrast separately for dark mode

### 17.3 Dark Mode Contrast

- Primary text: ≥4.5:1 on dark surfaces
- Secondary text: ≥3:1 on dark surfaces
- Ensure dividers/borders visible in both themes
- Keep pressed/focused/disabled states equally distinguishable

### 17.4 Dark Mode Implementation

- Design light/dark variants together
- Use semantic color tokens mapped per theme
- Modal scrim strong enough to isolate foreground (40-60% black)
- Test both themes before delivery

---

## PART 18 — AI DESIGN ANTI-PATTERNS

**Eliminate all of these:**

| Anti-Pattern                     | Why It's Bad                          | What to Do Instead                                                     |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Excessive pill-shaped everything | Homogenizes elements, loses hierarchy | Use `border-radius: 8–12px` for cards/inputs, full pills for tags only |
| Neon/oversaturated gradients     | Screams template, no brand identity   | Use narrow-hue, subtle gradients or flat color                         |
| Heavy glow effects               | Decorative, no functional purpose     | Use shadow for elevation only                                          |
| Blinking / looping animations    | Distracts, accessibility issues       | Use transitions only on interaction                                    |
| Random floating shapes/blobs     | No hierarchy, no meaning              | Use background shapes only if they reinforce structure                 |
| Pure `#000` on `#FFF`            | Harsh, unrefined                      | Use `#111827` on `#FAFAFA`                                             |
| Every element same border-radius | Flat, monotonous                      | Vary radius by component purpose                                       |
| Vague marketing copy             | Users can't act on it                 | Use clear, task-oriented language                                      |
| Phantom borders everywhere       | Visual noise, weak hierarchy          | Use spacing and background contrast as dividers                        |
| Emojis as UI elements            | Looks unfinished, unprofessional      | Use icons from consistent icon set                                     |
| Centered everything              | Breaks F/Z scan patterns              | Left-align most content; center only for empty states, hero            |
| Card borders instead of shadows  | Flat, low depth                       | Use `box-shadow` with low opacity for elevation                        |
| Inconsistent icon sizes          | Chaotic, unpolished                   | Pick single icon size per context                                      |

---

## PART 19 — REDESIGN RULES

When redesigning existing page, section, or component:

- Never change text/copy unless explicitly asked — only layout and visual treatment
- Preserve existing color palette — enhance it, don't replace it
- Understand container structure before touching code — read closing tags and parent context
- Check result visually before committing — does it fit within parent layout?
- Improve density and hierarchy, not just decoration
- One design system — if project uses component library or specific spacing values, match them exactly

---

## PART 20 — PRE-DELIVERY CHECKLIST

### Visual Quality

- [ ] Clear primary focal point on every screen
- [ ] Type hierarchy has at least 3 distinct levels
- [ ] All spacings multiples of 4 or 8
- [ ] Color contrast passes 4.5:1 for body text
- [ ] Shadows used for elevation, not decoration
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon family and style
- [ ] Pressed-state visuals don't shift layout bounds

### Content Quality

- [ ] All copy functional (not vague or filler)
- [ ] Empty states handled
- [ ] Error/success states designed
- [ ] Form fields have labels, hints, clear error messages

### Interaction

- [ ] All tappable elements provide clear pressed feedback
- [ ] Touch targets meet minimum size (≥44×44pt)
- [ ] Micro-interaction timing 150-300ms with native-feeling easing
- [ ] Disabled states visually clear and non-interactive
- [ ] Screen reader focus order matches visual order
- [ ] Gesture regions avoid nested/conflicting interactions

### Accessibility

- [ ] All meaningful images/icons have accessibility labels
- [ ] Color not the only indicator
- [ ] Reduced motion and dynamic text size supported
- [ ] Accessibility traits/roles/states announced correctly

### Light/Dark Mode

- [ ] Primary text contrast ≥4.5:1 in both modes
- [ ] Secondary text contrast ≥3:1 in both modes
- [ ] Dividers/borders and interaction states distinguishable in both modes
- [ ] Modal/drawer scrim opacity strong enough
- [ ] Both themes tested before delivery

### Layout

- [ ] Safe areas respected for headers, tab bars, bottom CTA bars
- [ ] Scroll content not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, tablet (portrait + landscape)
- [ ] Horizontal insets adapt by device size and orientation
- [ ] 4/8dp spacing rhythm maintained
- [ ] Long-form text measure readable on larger devices

### Responsive

- [ ] Works on mobile (< 640px)
- [ ] Touch targets at least 44px
- [ ] Layout reflows logically, not just shrinks
- [ ] No horizontal scroll on mobile

### Anti-AI Check

- [ ] No neon or oversaturated gradients
- [ ] Nothing glowing without reason
- [ ] Border-radius consistent and intentional
- [ ] No pure black/white being used
- [ ] No elements look like they came from UI kit without modification

### Global Consistency

- [ ] Component using global max-width system
- [ ] Fonts, colors, icons consistent with rest of project
- [ ] New components match existing design language

---

## PART 21 — ADVANCED COGNITIVE & EMOTIONAL DESIGN

### 21.1 The Aesthetic-Usability Effect
- Users perceive attractive interfaces as more usable. High-quality visuals build immediate trust and lower perceived friction.
- **Hephaestus Warning**: Do not use "pretty" to mask broken functionality. Aesthetics buffer minor friction, they do not fix broken workflows. Form follows function.

### 21.2 Managing Cognitive Load
- **Intrinsic Load**: The natural complexity of the task. Keep it manageable.
- **Extraneous Load**: Bad design (clutter, poor contrast, inconsistent nav). **Eliminate this entirely.**
- **Germane Load**: Good friction (learning a powerful new tool). Use tooltips, chunking, and contextual onboarding.

### 21.3 Hick’s Law (Decision Fatigue)
- The time it takes to make a decision increases with the number of options.
- Limit primary choices to 1-3 per screen.
- Use progressive disclosure for advanced settings. Hide complexity until the user explicitly asks for it.

### 21.4 The Von Restorff Effect (Isolation Effect)
- Items that stand out are remembered and acted upon.
- Only one element per view should use your brand's highest-contrast "Accent" or "Primary" color. If everything pops, nothing pops.

### 21.5 Gestalt Principles in UI
- **Proximity**: Elements close together are perceived as related. Use spacing (the 8px grid) instead of phantom borders to group items.
- **Similarity**: Elements sharing color/shape are perceived as having the same function. Never make a non-clickable decorative element look exactly like your primary CTA.

### 21.6 Emotional Design & Microinteractions
- Go beyond functional to emotional. Meaningful microinteractions (like a subtle bounce on success, or a satisfying fill animation on a progress bar) make the system feel alive and human.
- Every microinteraction must communicate: guiding the user, signaling a state change, or confirming a process. Never animate just because you can.

---

## QUICK REFERENCE — GOLDEN RULES

1. **One thing per screen is the hero.** Everything else serves it.
2. **Space is a design element.** Use it with intent.
3. **If it doesn't have a job, remove it.**
4. **Near-black on off-white. Always.** Never pure contrast.
5. **Animate interactions, not decorations.**
6. **Redesign means restructure** — not redecorate.
7. **If it looks AI-generated, simplify until it doesn't.**
8. **Typography is 60% of the UI.** Treat it accordingly.
9. **Color is the last tool, not the first.**
10. **Test it at 375px.** If it breaks, it wasn't designed — it was assembled.

---

## DESIGN VOCABULARY

| Term             | Meaning                                                         |
| ---------------- | --------------------------------------------------------------- |
| Visual hierarchy | The order in which the eye perceives elements                   |
| Affordance       | Visual cues that signal how an element is used                  |
| Cognitive load   | Mental effort required to process information                   |
| Proximity        | Grouping related elements closer together                       |
| Gestalt          | Visual principles that explain perception                       |
| Contrast ratio   | Numerical measure of readability between text and background    |
| Design token     | Named variable for a design value used system-wide              |
| Elevation        | The perceived z-height of a UI element, communicated via shadow |
| Breakpoint       | Screen width at which layout changes                            |
| Microinteraction | A small, purposeful animation triggered by user action          |

---

_Compiled from principles by Michal Malewicz, Ran Segall (Flux Academy), Mizko, DesignCourse, and cross-referenced against WCAG 2.2, Material Design 3, and Apple HIG. Updated 2025–2026._
