# Landing Page Animation & Layout Design

## Purpose
Enhance the current EduFordge landing page by adding immersive, bold animations and smooth scrolling to create a premium, eye-catching experience without altering the core color palette.

## Technical Stack
- **Framer Motion**: For scroll-triggered animations, stagger effects, and parallax.
- **Lenis**: For momentum-based smooth scrolling across the entire page.

## Proposed Changes

### 1. Scroll Architecture
- Wrap the main application or landing page layout in a `ReactLenis` context.
- Ensure the smooth scroll plays nicely with Next.js navigation and the initial splash screen by pausing the scroll instance while the splash is active.

### 2. Section Details & Layout Changes
- **Splash Screen**: Enhance the loading bar and logo with fluid Framer Motion enter/exit transitions.
- **Hero Section**: 
  - Animate the H1 headline to reveal word-by-word.
  - Apply a scroll-based parallax effect to the right-side "Before/After" graphic so it shifts vertically at a different rate than the main text.
- **Stats Strip**: Use a count-up animation for the numbers when they enter the viewport.
- **Features & Modules Grids**: 
  - Add `whileInView` staggered fade-up animations. When the grid comes into view, cards will pop up sequentially.
- **Dashboard Mockup ("See it in action")**: 
  - Add a slight 3D rotate and scale reveal when scrolling into view.
- **School Life Image Grid**: 
  - Update the layout slightly to allow for slight overlapping to feel more dynamic.
  - Images will start at 120% scale and scale down to 100% (zoom-out reveal) as they enter the viewport.

## Constraints & Rules
- Do NOT change the existing color palette (orange, white, stone).
- Extract animations into reusable wrapper components (e.g., `<FadeUp>`, `<StaggerReveal>`) to keep `page.jsx` clean.
