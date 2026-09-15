"use client";

import { useEffect, useRef } from "react";

export function EnhancedCursor() {
  const position = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (!fine.matches) return;
      const root = document.createElement("div");
      root.className = "enhanced-cursor";
      root.setAttribute("aria-hidden", "true");
      const dot = document.createElement("span"), ring = document.createElement("span");
      dot.className = "cursor-dot";
      ring.className = "cursor-ring";
      root.append(dot, ring);
      document.body.append(root);
      let raf = 0, last = 0, visible = false;
      const p = position.current;
      const render = (time: number) => {
        const damping = reduced.matches ? 1 : 1 - Math.pow(.85, Math.min(last ? (time-last)/16.667 : 1, 3));
        last = time;
        p.currentX += (p.targetX-p.currentX)*damping;
        p.currentY += (p.targetY-p.currentY)*damping;
        dot.style.transform = `translate3d(${p.targetX}px,${p.targetY}px,0)`;
        ring.style.transform = `translate3d(${p.currentX}px,${p.currentY}px,0)`;
        raf = requestAnimationFrame(render);
      };
      const hide = () => {
        visible = false; root.dataset.dragging="false";
        root.style.opacity = "0";
        document.documentElement.classList.remove("cursor-enabled");
        cancelAnimationFrame(raf); raf = 0; last = 0;
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") { hide(); return; }
        p.targetX = event.clientX; p.targetY = event.clientY;
        if (!visible) {
          p.currentX = p.targetX; p.currentY = p.targetY;
          visible = true; root.style.opacity = "1";
          document.documentElement.classList.add("cursor-enabled");
          raf = requestAnimationFrame(render);
        }
        const target = event.target instanceof Element ? event.target : null;
        // A modal dialog is in the browser's top layer, above any z-index.
        const host = target?.closest("dialog[open]") ?? document.body;
        if (root.parentElement !== host) host.append(root);
        const labeled = target?.closest<HTMLElement>("[data-cursor]");
        const interactive = target?.closest("a,button,[role=button],summary,input,textarea,select");
        const label = labeled?.dataset.cursor ?? (interactive ? "view" : "");
        root.dataset.active = String(!!label);

      };
      const down = (event: PointerEvent) => {
        const target=event.target instanceof Element?event.target:null;
        root.dataset.dragging=String(event.pointerType==='mouse'&&!!target?.closest('[data-cursor="drag"]'));
      };
      const up = () => { root.dataset.dragging="false"; };
      document.addEventListener("pointerdown",down);
      document.addEventListener("pointerup",up);
      document.addEventListener("pointercancel",up);
      const visibility = () => { if (document.hidden) hide(); };
      document.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
      document.addEventListener("visibilitychange", visibility);
      cleanup = () => {
        hide(); root.remove();
        document.removeEventListener("pointerdown",down);
        document.removeEventListener("pointerup",up);
        document.removeEventListener("pointercancel",up);
        document.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", hide);
        window.removeEventListener("blur", hide);
        document.removeEventListener("visibilitychange", visibility);
      };
    };
    setup(); fine.addEventListener("change", setup);
    return () => { cleanup(); fine.removeEventListener("change", setup); };
  }, []);
  return null;
}
