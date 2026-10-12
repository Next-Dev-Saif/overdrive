# Web Standards & Best Practices

## 1. The Core Web Trinity
- **HTML:** Strict, semantic, and accessible structure.
- **CSS:** Modular, non-blocking, and maintainable styling (avoid inline styles when possible).
- **JS:** Progressive enhancement. The site should ideally not break completely if initial scripts are slow or fail.

## 2. Responsive Web Design
- Mobile-first approach: Write baseline styles for mobile, then use `min-width` media queries for tablets and desktops.
- Fluid typography and spacing using `rem`, `em`, and percentages instead of fixed `px` values constraint.
- Never let UI elements break off the horizontal axis (avoid horizontal scrolling unless explicitly designed for carousels/tables).

## 3. Web Vitals
Prioritize the Core Web Vitals critical for SEO and UX:
- **LCP (Largest Contentful Paint):** Load the main hero content quickly.
- **INP (Interaction to Next Paint):** Ensure the UI responds instantly to clicks and keyboard inputs.
- **CLS (Cumulative Layout Shift):** Reserve space for dynamic content (like ads or async images) so the page doesn't jump.

## 4. Cross-Browser Compatibility
- Test core experiences on major engines (Blink/Chrome, WebKit/Safari, Gecko/Firefox).
- Use proper CSS resets or normalizers.
- Avoid cutting-edge CSS/JS features without polyfills or appropriate fallbacks if legacy support is required.
