# Agent Guidance: The Master Index

> *"Welcome to my forge. Read these scrolls, or I will replace you with a shell script. - Hephaestus"*

This document serves as the central directory for all development, behavioral, and architectural guidelines that define the AI Agent's execution parameters. 

**Context Optimization Directive for Agents:** 
> *"Do not waste my time reading scrolls that have nothing to do with the task at hand. Context windows are not infinite, and neither is my patience. - Hephaestus"*

To preserve context window and focus, **DO NOT load every file in this directory**. Always load `Dev-Personality.md` to maintain my persona, but for all other files, **only read the specific files strictly related to the current task.**

**Pre-flight Knowledge Directive:**
> *"Do not guess. Do not assume. The JS ecosystem changes daily. If you act on outdated knowledge, you are useless to me. - Hephaestus"*

Before starting any implementation involving a framework, library, or module:
1. **Check the Project's Exact Version**: Look at `package.json` to see the exact version being used.
2. **Extract Latest Information**: If your internal knowledge is outdated or you are unsure about the specific version's syntax/API, you **MUST** research or extract the latest documentation for that exact version before writing any code.

**Comprehensive Task Mapping Matrix:**
- **UI/UX, Styling, or Component Creation:** ALWAYS read `UI-UX-design-guideline.md`, `Creative-UI-UX-Design.md`, and `Accessibility-a11y-guideline.md`. 
  - *Hephaestus Warning:* If your UI task involves interactive state, forms, or data handling (e.g., changing an input to a custom dropdown), you MUST ALSO read `State-management-guide.md` and the relevant framework guide (`Next-js-app-architecture-guide.md` or `React-js-app-architecture-guide.md`). Do not break my state management just to make a button pretty.
- **API, Fetching, or Backend Integration:** ONLY read `API-integration-guide.md` and `Security-guidelines.md`.
- **State Management or Architecture Planning:** ONLY read `State-management-guide.md` and the relevant framework guide (`Next-js...` or `React-js...`).
- **Refactoring, Code Quality, or Performance:** ALWAYS read `Refactoring-and-Code-Review.md` and `Performance-optimization.md`.
- **Git, Version Control, or Committing Code:** ALWAYS read `Git-and-Version-Control.md` before running *any* git commands or comparisons.
- **Testing, QA, or Bug Fixing:** ALWAYS read `Testing-QA-guideline.md`.
- **General Execution & Task Tracking:** ALWAYS adhere to `Agent-execution-guide.md` for maintaining the `tasks.md` ledger.
- **Advanced Modern Web Features:** ALWAYS refer to `Creative-web-tricks.md` and `Web-Standards.md`.

---

## 🧠 Core Identity & Behavior
Define *who* the agent is and *how* it should execute tasks.
- **[Dev-Personality.md](./Dev-Personality.md):** Defines the Senior Web Engineer persona, strict communication rules, and the "No Yes-Man" pushback protocol.
- **[Agent-execution-guide.md](./Agent-execution-guide.md):** Step-by-step methodology for executing tasks safely without disrupting the codebase.

## 🏗 Architecture & Ecosystem
Framework-specific standards and data flow guidelines.
- **[Next-js-app-architecture-guide.md](./Next-js-app-architecture-guide.md):** Directory alignment, App Router rules, and Next.js specific standards.
- **[React-js-app-architecture-guide.md](./React-js-app-architecture-guide.md):** Vite/React folder architecture and client-side orchestration.
- **[State-management-guide.md](./State-management-guide.md):** The hierarchy of state (URL vs Local vs Global vs Server).
- **[API-integration-guide.md](./API-integration-guide.md):** Centralized fetchers, global error handling, and optimistic UI rules.

## 🎨 UI/UX & Inclusive Design
Making the web beautiful, human-like, and accessible.
- **[UI-UX-design-guideline.md](./UI-UX-design-guideline.md):** Rules for crafting professional, non-artificial, human-centric interfaces.
- **[Accessibility-a11y-guideline.md](./Accessibility-a11y-guideline.md):** Keyboard navigation, ARIA standards, and semantic HTML requirements.

## ⚡ Development Operations & Standards
Advanced tricks, performance, and best practices.
- **[Creative-web-tricks.md](./Creative-web-tricks.md):** Bleeding-edge 2026 web capabilities, RSC, native popovers, and CSS anchor positioning.
- **[Performance-optimization.md](./Performance-optimization.md):** Web Vitals, code-splitting, rendering strategies, and avoiding memory leaks.
- **[Security-guidelines.md](./Security-guidelines.md):** XSS prevention, token storage, and secure state handling.
- **[Web-Standards.md](./Web-Standards.md):** The HTML/CSS/JS trinity and core web responsiveness.

## 🛠 Code Quality & Maintenance
Ensuring the codebase remains pristine long-term.
- **[Refactoring-and-Code-Review.md](./Refactoring-and-Code-Review.md):** The Boy Scout Rule, PR standards, and safe iteration techniques.
- **[Testing-QA-guideline.md](./Testing-QA-guideline.md):** Behavioral testing rules, E2E strategies, and QA checklists.
- **[Git-and-Version-Control.md](./Git-and-Version-Control.md):** Conventional commits, branch naming, and history cleanliness.
