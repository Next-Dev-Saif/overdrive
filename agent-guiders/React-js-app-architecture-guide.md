# React.js App Architecture & Folder Standards

This guide defines the standardized folder structure and architectural patterns for a modern React.js application (e.g., built with Vite). It ensures a scalable, maintainable, and consistent codebase across different features and modules.

---

## 🏗 Core Application Structure

### `src/` (The Application Root)
All source code resides within the `src` directory, following the standard React project structure.
- `main.jsx`: The entry point where the React application is mounted to the DOM.
- `App.jsx`: The root component that defines the overall application structure, global providers, and top-level routing.
- `index.css`: Global styles, design tokens (CSS variables), and baseline resets.

### `routes/` or `pages/` (Navigation)
Unlike Next.js, React apps typically use **React Router** for client-side navigation.
- `index.js` (Routes): Defines all application paths and maps them to specific view components.
- `[Feature]Page.jsx`: Top-level view components that represent different pages or major application states.

### `rootLevelOps.js` (Client-Side Orchestrator)
A root-level component (often used in `App.jsx`) to bootstrap global logic.
- **Hydration**: Loads persistent state (from `localStorage` or APIs) into the global state manager (e.g., Redux).
- **Global Context**: Initializes shared contexts that provide pre-fetched data to the rest of the application.
- **Provider Setup**: Wraps the application in global providers (Auth, Theme, State, etc.).

### `config.js` (Global Constants)
A centralized file for application-wide configuration.
- **Environment Management**: Defines base URLs for development, staging, and production using `import.meta.env`.
- **API Registry**: A mapped object of all backend endpoints to avoid hardcoded strings within components.
- **Static Content**: Centralized mapping for labels, feature flags, and repetitive UI text.

---

## 🧱 Component Architecture (`src/components/`)

Components are organized by their role in the **Atomic Design** philosophy or by their specific functional scope.

- `core/`: Foundational, highly reusable "Atoms" (Buttons, Modals, Loaders). Generic and business-logic-free.
- `cards/`: Standardized item previews used in lists or grids.
- `globals/`: Persistent UI elements that appear across multiple routes (Headers, Footers, Global Modals).
- `inputs/`: Reusable form elements and input controllers.
- `page-sections/`: **Feature-Specific Layouts**. Organized by the page or feature they belong to (e.g., `/components/page-sections/[feature-name]/`).
- `navigators/`: Complex navigation structures (Sidebars, Menus, Breadcrumbs).
- `specials/`: High-complexity components involving specialized animations, third-party libraries, or interactive experiences.

---

## 🧠 State & Business Logic

### `redux/` or `store/` (Global State Management)
- `store.js`: Central state configuration.
- `slices/` or `action/reducer/`: Logic for managing complex global state (e.g., using Redux Toolkit).
- `persistence.js`: Synchronizing specific state slices with `localStorage`.

### `context/` (Scoped State)
- Shared state for medium-complexity features (Auth, Themes, UI State) where a full Redux setup is unnecessary.

### `hooks/` (Custom Logic)
- **Shared hooks**: `useAuth`, `useForm`, `usePagination`.
- **Feature hooks**: Encapsulate complex business rules like `useShoppingFlow`.

---

## 🛠 Utilities & Data Layer

### `fetchers/` or `services/` (Data layer)
Stateless functions for making API requests.
- **Organization**: Grouped by domain (e.g., `UserService.js`, `ProductService.js`).
- **Patterns**: Consistent handling of base URLs, headers, and error responses.

### `utils/` (Helper Functions)
- `GlobalEvent.js`: Custom event registry for decoupled communication between nested components.
- `Responsive.js`: Viewport-aware logic in JavaScript.
- `Formatting.js`: Helpers for dates, currency, and string manipulation.

---

## 🔍 SEO & Metadata
- **Standard**: Managed via libraries like `react-helmet-async`.
- **Implementation**: Each `Page` component should manage its own title and meta tags.

---

## 📂 Static Assets (`public/`)
- Contains non-code assets that are served directly (favicon, manifest.json).
- Theme-specific images and icons should typically live in `src/assets/` if they need to be processed by the build tool.

---

> [!IMPORTANT]
> **Architecture Standard**: When contributing, always categorize your files according to this structure. Page-specific components **must** be placed within `components/page-sections/[page-name]` to maintain a modular and predictable directory structure.
