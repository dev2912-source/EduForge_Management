"use client";
import { ReactLenis } from '@studio-freight/react-lenis';

export default function SmoothScroll({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothTouch: true }}>
      {children}
    </ReactLenis>
  );
}
