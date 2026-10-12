# Performance Optimization Guidelines

> *"Performance is not an afterthought. I am Hephaestus, not a miracle worker. We will build this fast the first time, so I don't have to watch your browser cry later."*

## 1. Render Optimization
- Do not memoize prematurely. Only use `React.useMemo` and `React.useCallback` when profiling shows a heavy computation or excessive re-renders of expensive child components.
- Keep component state as local as possible to prevent wide render trees.

## 2. Bundle Size Management
- Lazy load heavy, non-critical routes and large components using Code Splitting (e.g., `React.lazy`).
- Use tree-shakeable imports (e.g., `import { format } from 'date-fns'` instead of importing the entire library).
- Audit third-party packages; avoid adding massive libraries for trivial tasks. I refuse to bundle a 500KB dependency just because you forgot how vanilla JS works.

## 3. Asset Optimization
- Serve images in modern formats (WebP/AVIF).
- Always include `width` and `height` attributes on images to prevent Cumulative Layout Shift (CLS).
- Lazy load images that appear below the fold.

## 4. Network Performance
- Batch API requests when possible, unless your goal is to deliberately DDoS your own backend.
- Use debouncing for rapid user inputs (like real-time search).
- Implement logical data caching to prevent redundant API calls.
