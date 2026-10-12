# Next.js App Architecture & Folder Standards

This guide defines the standardized folder structure and architectural patterns for a modern Next.js application. It ensures a scalable, maintainable, and consistent codebase across different features and modules.

---

## 🏗 Core Application Structure

### `app/` (Routing & Layouts)
Uses the **Next.js App Router** convention for file-based routing.
- `layout.js`: The root wrapper for the application. Handles global providers, SEO metadata, and persistent UI elements.
- `page.js`: The entry point for a specific route.
- `globals.css`: Global styles, design tokens (CSS variables), and shared animations.
- `(route-groups)/`: Folders that define URL segments. Each feature should have its own directory containing its specific `page.js`.

### `rootLevelOps.js` (Client-Side Orchestrator)
A specialized root-level component used to bootstrap client-side logic.
- **Hydration**: Loads persistent state (from `localStorage` or APIs) into the global state manager (e.g., Redux).
- **Global Context**: Initializes shared contexts that provide pre-fetched data to the rest of the application.
- **Provider Setup**: Wraps the application in global providers (Auth, Theme, State, etc.).

### `config.js` (Global Constants)
A centralized file for application-wide configuration.
- **Environment Management**: Defines base URLs for development, staging, and production.
- **API Registry**: A mapped object of all backend endpoints to avoid hardcoded strings within components.
- **Static Content**: Centralized mapping for repetitive UI content, labels, or feature flags.

---

## 🧱 Component Architecture (`components/`)

Components are organized by their role in the **Atomic Design** philosophy or by their specific functional scope.

- `core-components/`: Foundational, highly reusable "Atoms" (Buttons, Modals, Loaders, Tooltips). These should be generic and independent of business logic.
- `cards/`: Standardized item previews used in lists or grids. They typically accept a data object as a prop.
- `globals/`: Persistent UI elements that appear across multiple pages (Navigation bars, Footers, Global Modals).
- `inputs/`: Reusable form elements and input controllers.
- `page-sections/`: **Feature-Specific Layouts**. Organized by the page or feature they belong to (e.g., `/components/page-sections/[feature-name]/`). This keeps the component library clean and prevents naming collisions.
- `navigators/`: Complex navigation structures (Sidebars, Multi-level menus, Tab systems).
- `specials/`: Unique, high-complexity components involving specialized animations, third-party library integrations, or one-off interactive experiences.

---

## 🧠 State & Business Logic

### `redux/` (Global State Management)
- `store.js`: The central state configuration.
- `action/` & `reducer/`: Standard Redux (or Redux Toolkit) slices for managing complex global state.
- `persistence.js`: Logic for synchronizing specific state slices with `localStorage` or `sessionStorage`.

### `context/` (Scoped State)
- Used for mid-level state sharing (e.g., Auth state, Form state, or Initial Data Hydration) where a full Redux setup is unnecessary.

### `hooks/` (Custom Logic)
- **Shared Logic**: Encapsulates reusable stateful logic (e.g., `useAuth`, `useForm`, `usePagination`).
- **Feature Logic**: Specific hooks for complex business rules (e.g., `useShoppingFlow`, `useUserOnboarding`).

---

## 🛠 Utilities & Data Layer

### `fetchers/` (API Integration)
Stateless functions responsible for asynchronous data communication.
- **Standards**: Functions should follow a consistent signature (e.g., using `onData` and `onError` callbacks or returning standardized Promises).
- **Organization**: Grouped by domain entity (e.g., `UserFetchers.js`, `ProductFetchers.js`).

### `utils/` (Helper Functions)
- `GlobalEvent.js`: A custom event registry for decoupled communication between deeply nested components.
- `Responsive.js`: Utilities for handling viewport-aware logic in JavaScript.
- `Formatting.js`: Helpers for dates, currency, and string manipulation.

---

## 🔍 SEO & Metadata
- **Global**: Managed in the root `app/layout.js` using the Metadata API.
- **Route-Specific**: Each `page.js` can export a `metadata` object or a `generateMetadata` function to customize SEO for that specific view.

---

## 📂 Static Assets (`public/`)
- Contains all non-code assets such as images, icons, fonts, and robots.txt.
- **Structure**: Group assets into subfolders like `/images/`, `/icons/`, etc., for better organization.

---

> [!IMPORTANT]
> **Architecture Standard**: When contributing to the codebase, always categorize your files according to this structure. Page-specific components **must** be placed within `components/page-sections/[page-name]` to maintain modularity.
