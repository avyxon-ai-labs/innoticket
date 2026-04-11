# SYSTEM BLUEPRINT

---

## 1. STACK
- React 19 + TypeScript + Vite
- Zustand → UI + navigation + module state
- TanStack Query → server state (cache, refetch, loading)
- Axios via `src/lib/api.ts` ONLY
- Tailwind + CSS tokens (`index.css`)
- Lucide React

---

## 2. CORE RULES
- Modular architecture only (no single-file apps)
- Extract reusable components early
- Avoid duplication
- Follow design system strictly
- Maintain state persistence
- Do NOT break navigation model
- Optimize for mobile + desktop

---

## 3. FOLDER STRUCTURE (ABBREVIATED)

src/
- components/ui → reusable DS components (Button, Table, Modal…)
- components/layout → Header, Sidebar, Drawer
- modules/<feature>/ → components, hooks, store, types
- pages → thin route wrappers
- router → route config
- store → uiStore, navigationStore
- services → API layer (auth, tickets…)
- lib/api.ts → axios + interceptors
- styles/tokens.css → reference
- index.css → actual tokens

---

## 4. NAVIGATION MODEL

### A. Route-level
- React Router → top-level navigation

### B. In-page (CRITICAL)
- Uses `navigationStore` (stack-based)
- NO route changes for subviews

APIs:
- pushView()
- popView()
- updateCurrent()

ViewState:
{
  module,
  subView,
  selectedId?,
  filters?,
  pagination?,
  activeTab?,
  scrollY?
}

RULE:
- Back restores FULL state (filters, pagination, tab, scroll)

---

## 5. STATE MANAGEMENT (SINGLE SOURCE)

| Type | Location |
|------|---------|
| UI chrome | uiStore |
| Navigation | navigationStore |
| Module state | modules/<name>/store |
| Auth | authStore |
| Server data | TanStack Query |

### RULES
- Every state has a home
- Never mix responsibilities
- Never store server data in Zustand

---

## 6. STORES

### uiStore (persisted)
- sidebarCollapsed
- expandedGroups
- sidebarOpen (mobile)

---

### navigationStore (NOT persisted)
- stack-based view system
- enables back navigation without routing

---

### Module Store Pattern (persisted)

Each module owns:
- filters
- pagination
- activeTab
- sorting

RULES:
- Persist filters, tabs, pagination
- Reset page on filter change
- Back restores full state

---

## 7. API LAYER (STRICT)

ALL calls → `src/lib/api.ts`

Features:
- Inject Authorization header
- Handle 401 → clear auth + redirect `/login`

RULES:
- NEVER use axios in components
- ALWAYS use services layer

---

## 8. DESIGN SYSTEM

### Tokens
- Source: `index.css`
- JS mirror: `theme.ts`

### UI Rules
- No inline styles
- Use tokens only

### Style Guidelines
- Radius: xl / 2xl
- Shadows: soft
- Spacing: 4–16 scale
- Buttons: primary / secondary / danger
- Tables: consistent
- Animations: 150–250ms

RULE:
- Theme centralized in `theme.ts`

---

## 9. NAVIGATION STORE USAGE

pushView:
- create new state entry

popView:
- restore previous state

updateCurrent:
- mutate without adding history

RULE:
- Subviews NEVER change route

---

## 10. CRITICAL GUARANTEES

- Back button restores:
  - filters
  - pagination
  - activeTab
  - scroll
- No unnecessary refetch (TanStack Query)
- No duplication across modules