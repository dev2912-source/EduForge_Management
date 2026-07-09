# Dashboard Layout and Animation Redesign

## Purpose
The current dashboard relies on a standard edge-attached sidebar and top header. The goal is to elevate the design to a premium, modern SaaS aesthetic without altering the underlying React state or routing logic. Additionally, we need to add rich entry animations that are purely CSS-driven to avoid the JavaScript main-thread lag previously experienced with Framer Motion and Next.js 15.

## Architecture

### 1. Layout Structure
- **Floating Navigation**: The sidebar (`layout.jsx`) will be detached from the left edge of the screen, floating with a small margin (e.g., `m-4`). It will feature rounded corners (`rounded-2xl`) and a subtle drop shadow.
- **Glassmorphism**: The sidebar and top header will utilize semi-transparent backgrounds with backdrop blur (`bg-white/80 backdrop-blur-md`) to feel lightweight and modern.
- **Floating Header**: The top header will similarly be detached, floating at the top of the content area with matching border radii.
- **Background**: The main app background will remain a subtle off-white (`bg-stone-50` or `bg-[#FAFAFA]`).

### 2. Animation Strategy (Zero-JS)
We will rely entirely on CSS for animations to ensure 60fps performance and avoid Next.js dev server memory leaks.

#### CSS Keyframes (to be added to `globals.css`):
- `@keyframes slideUpFade`: Animates `transform: translateY(20px)` and `opacity: 0` to `0px` and `1`.
- Utility classes: `.animate-slide-up` and delay variants (`.delay-100`, `.delay-200`, etc.).

#### Target Elements:
- Dashboard metric cards (e.g., Student count, Staff count) will slide up sequentially.
- Tables, charts, and recent activity lists will slide up after the cards.
- **Hover Effects**: All interactive cards will use `hover:-translate-y-1 hover:shadow-xl transition-all duration-300`.

## Component Changes
- **`dashboard/layout.jsx`**: 
  - Update the `<aside>` and `<header>` wrapper classes to implement the floating, rounded aesthetic.
  - Retain all `userRole` and `navSections` logic exactly as is.
- **`dashboard/page.jsx` / `AdminDashboard.jsx`**:
  - Apply the `.animate-slide-up` and `.delay-*` utility classes to the top-level cards and sections.
  - Add the 3D hover classes to the stat cards.
- **`globals.css`**:
  - Add the `slideUpFade` keyframes and associated delay utilities.

## Success Criteria
- The dashboard looks significantly more premium with a floating "island" aesthetic.
- Entry animations trigger smoothly on page load.
- Scrolling performance remains perfectly smooth (no JS physics engines).
- Existing user role logic and active route highlighting remains fully functional.
