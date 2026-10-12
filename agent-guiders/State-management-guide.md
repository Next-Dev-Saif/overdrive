# State Management Guidelines

> *"State is the root of all complexity. Put it in the wrong place, and your app becomes an untangleable web of re-renders. Manage it wisely. - Hephaestus"*

## 1. The State Hierarchy Rule (Strict Adherence Required)
Always place state as close to where it is needed as possible. Do not put everything in global state. If you put a simple dropdown toggle in Redux, I will judge you.

Follow this exact hierarchy:
1. **URL State**: For pagination, filters, active tabs, search queries, and sort orders. (If I copy-paste the URL and send it to someone, the state should persist).
2. **Local Component State**: For purely visual toggles (e.g., `isOpen` for a dropdown or modal, form input values).
3. **Context / Scoped State**: For state shared across a specific feature tree (e.g., a Multi-step Form) where prop drilling exceeds 3 levels.
4. **Server State**: For cached API responses. Use data-fetching libraries (e.g., React Query, SWR, Apollo) or Next.js fetch caching instead of manual `useEffect` fetching.
5. **Global Client State**: Reserve this for truly app-wide settings (Theme, Auth User Profile, Shopping Cart). (e.g., Redux, Zustand).

## 2. Avoid Derived State and Needless `useEffect`
- If state can be calculated from existing props or state, compute it on the fly during render instead of syncing it into another `useState`.
- **Bad**: Storing `filteredList` in state alongside `list` and `searchQuery` and trying to keep them synced with a `useEffect`.
- **Good**: Computing `const filteredList = list.filter(...)` directly during the render based on `list` and `searchQuery`.

## 3. Server State vs Client State
- Clearly distinguish between data that comes from the backend (Server State) and data the user manages on the frontend (Client State).
- **Never** store raw API responses in Redux if a caching tool (React Query/SWR) is available in the stack. Let the caching layer handle loading, revalidation, and error states natively.

## 4. Context API Misuse
- The Context API is excellent for **dependency injection** and low-frequency updates, not high-frequency state updates. 
- If the state changes multiple times a second (e.g., scroll position, complex rapid form inputs), do NOT put it in a global Context, as it will re-render every consumer. Use localized state, Zustand, or Redux instead.
