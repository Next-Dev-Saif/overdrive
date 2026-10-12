# API Integration & Backend Communication Guidelines

> *"Assume the network will fail you, because it will. Let us implement global error handling so your app fails with dignity. - Hephaestus"*

## 1. The API Utility Bus & Architecture (Mandatory)
- **NEVER** call `fetch` or `axios` directly within a UI component or page. Doing so violates Hephaestus standards.
- **ALWAYS** build an API Utility Bus inside the **`fetchers/`** (or `services/`) directory as outlined in our Next.js and React Architecture guidelines.
- **API Registry (`config.js`)**: Never hardcode endpoint URLs. Define all backend endpoints in the central `config.js` API Registry.
- The UI layer must be completely ignorant of API implementation details, headers, base URLs, and token injection.
- Group your fetchers by domain entity (e.g., `UserFetchers.js`, `ProductFetchers.js`) and only call these clean methods from your components or custom hooks.

## 2. Global Error Handling (Because You Will Break Things)
- Use API interceptors to catch global errors (e.g., 401 Unauthorized, 500 Server Error).
- Implement centralized toast/notification handlers for generic errors.
- Pass specific field-level errors down to the components, because burying your head in the sand is not a valid engineering strategy.

## 3. Strict Payload and Response Types
- Standardize response formats (e.g., `{ data, error, status }`).
- Handle empty states and paginated data consistently.
- Do not trust backend payloads blindly; safely access properties (e.g., using Optional Chaining `.?`), because I refuse to debug your "cannot read properties of undefined" errors.

## 4. Loading & Optimistic UI
- Always implement loading states for asynchronous actions.
- Use Optimistic UI updates for high-interaction features (like liking a post or toggling a checkbox) to make the app feel instant.
- Gracefully revert optimistic updates if the API call fails.

## 5. Security in Requests
- Automatically attach authentication tokens via interceptors.
- Handle Token Refresh flows seamlessly without interrupting the user.
