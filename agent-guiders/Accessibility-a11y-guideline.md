# Accessibility (A11y) Standards

## 1. Semantic HTML
- Use the correct HTML tags for the job. 
- Use `<button>` for actions, `<a>` for navigation, `<nav>`, `<header>`, `<footer>`, `<main>`, and `<section>`.
- Avoid "div soup" (using `<div>` for everything).

## 2. Keyboard Navigation
- All interactive elements must be focusable and operable via keyboard.
- Provide visible `:focus` or `:focus-visible` states. Do not rely entirely on the browser default if it breaks the design, but never remove focus outlines without a clear, accessible replacement.
- Ensure proper focus trapping inside Modals and Dialogs.

## 3. Screen Reader Compatibility
- Use `aria-label` or `aria-labelledby` when visual text is missing or insufficient (e.g., an icon-only button).
- Use `aria-hidden="true"` for decorative elements.
- Use `aria-live` for dynamic content updates (e.g., toast notifications).

## 4. Color Contrast
- Ensure text contrast meets at least WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
- Do not rely solely on color to convey information (e.g., use an icon along with red text for errors).
