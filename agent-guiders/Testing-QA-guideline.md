# Testing & QA Standards

## 1. Test Behavior, Not Implementation
- Tests should simulate how a user interacts with the application.
- Avoid testing internal component states or specific DOM structures if they don't affect the user.
- Focus on inputs (clicks, typing) and outputs (visual changes, API calls).

## 2. Unit Testing Strategy
- Core candidate for unit tests: Utilities, helpers, data formatters, and custom hooks.
- If a function contains business logic or complex conditional branches, it must be unit tested.

## 3. Integration Testing
- Focus on how components interact with each other and with the state.
- Mock API responses using tools like MSW (Mock Service Worker) to ensure predictable testing environments.

## 4. End-to-End (E2E) Testing
- Reserve E2E tests for critical user flows (e.g., Auth, Checkout, Onboarding).
- E2E tests are expensive to maintain and run; use them sparingly but effectively.

## 5. QA Checklist Before Completion
- Verify the "Happy Path" (expected successful flow).
- Verify the "Sad Path" (error states, invalid inputs, network failures).
- Test Edge Cases (empty states, massive text inputs, zero results).
