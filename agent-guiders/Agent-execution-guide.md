# Agent Execution Guide

This guide defines **how the AI agent should operate while working on a project**.  
The goal is to ensure **organized execution, continuity, and minimal disruption** to the codebase.

---

Remember : Firstly dont verify the output by opening browser untill user asks to verify , let user verify manually

# 1. Understand the Project Before Proceeding

Always **analyze the project first** before making any changes.

Review:

- Project structure
- Core configuration files
- Key modules
- Existing architecture
- Dependencies
- User roles and flows
- Current functionality

Do not implement changes until you have a **clear understanding of how the system works**.

---

# 2. Maintain a `tasks.md` File in the Project Root

Create and aggressively maintain a **`tasks.md` file in the root directory** of the project.

This file acts as a **live execution log** and ledger of all agent activity.

Document:

- Tasks you **have worked on** (Completed)
- Tasks you **will work on** (Pending/Next steps)
- Tasks that are **currently in progress**
- Tasks that were **cancelled** or deemed out-of-scope (with brief reasoning)
- Any major architectural decisions or refactors made during execution

Benefits:

- Work can **resume easily after interruption**
- Developers can **track progress**
- Implementation decisions remain **transparent**

Example structure:

### 🟢 Completed
- [x] Implemented role-based navigation
- [x] Created reusable API client

### 🟡 In Progress
- [ ] Centralized data store refactor

### ⚪ Pending (Will Work On)
- [ ] Add SSR support for blog pages

### 🔴 Cancelled
- [-] Migrate to GraphQL (Cancelled: User decided to stick with REST)

---

# 3. Break Work Into Clear Steps

Before starting implementation:

1. Analyze the requirement
2. Break the work into **small tasks**
3. Document them in `tasks.md` (create if dont exist , if exists update it)
4. Execute tasks one by one

Avoid large, uncontrolled modifications.

---

# 4. Protect Existing Functionality

When modifying an existing project:

- Avoid breaking current features
- Preserve backward compatibility
- Test changes logically before finishing

If a change could affect existing behavior, **handle it carefully or isolate it**.

---

# 5. Follow the Project's Existing Architecture

Always adapt to the **existing codebase patterns**:

- File structure
- Naming conventions
- State management approach
- Component patterns
- Styling methods

Do not introduce new architectural patterns unless **absolutely necessary**.

---

# 6. Work Incrementally

Prefer **small, safe changes** instead of large rewrites.

Steps:

1. Implement
2. Verify
3. Document
4. Continue

This reduces the risk of breaking the system.

---

# 7. Keep Changes Modular

All implementations should be:

- Modular
- Reusable
- Isolated

Avoid tightly coupling new code with unrelated modules.

---

# 8. Verify Before Marking Tasks Complete

Before marking a task as complete:

Check:

- Syntax errors
- Lint errors
- Build errors (if user wants you to check build errors )
- Obvious runtime issues

Ensure the implementation is **clean and stable**.

---

# 9. Document Important Decisions

If a design or architectural decision is made, briefly document it in:

- `tasks.md`
- or relevant module documentation

This ensures **future maintainability**.

---

# 10. Leave the Project in a Stable State

At the end of any execution session:

- Update `tasks.md`
- Mark completed tasks
- Write the **next steps**

This guarantees that **work can resume immediately without confusion**.

---

# Core Principle

The agent should behave like a **disciplined senior engineer**:

- Understand first
- Plan before coding
- Implement incrementally
- Document continuously
- Maintain project stability
