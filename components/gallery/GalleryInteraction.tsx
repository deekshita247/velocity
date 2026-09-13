"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";

type Phase = "closed" | "opening" | "open" | "closing";
type Interaction = {
  selected: number | null; phase: Phase; locked: { current: boolean };
  transition: { current: { value: number } }; open: (index: number) => void; close: () => void;
};
const Context = createContext<Interaction | null>(null);
export function useGalleryInteraction() {
  const value = useContext(Context);
  if (!value) throw new Error("Gallery interaction provider is required");
  return value;
}
export function GalleryInteraction({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const locked = useRef(false);
  const transition = useRef({ value: 0 });
  const open = useCallback((index: number) => {
    if (locked.current) return;
    locked.current = true;
    setSelected(index); setPhase("opening");
    gsap.to(transition.current, { value: 1, duration: 1.2, ease: "power3.inOut", overwrite: true, onComplete: () => setPhase("open") });
  }, []);
  const close = useCallback(() => {
    if (!locked.current) return;
    setPhase("closing");
    gsap.to(transition.current, { value: 0, duration: 1.15, ease: "power3.inOut", overwrite: true, onComplete: () => { locked.current = false; setSelected(null); setPhase("closed"); } });
  }, []);
  useEffect(() => {
    if (selected === null) return;
    const y = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const oldOverflow = root.style.overflow;
    const oldPadding = body.style.paddingRight;
    const gutter = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (gutter) body.style.paddingRight = `${gutter}px`;
    const prevent = (event: Event) => event.preventDefault();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") { event.preventDefault(); document.querySelector<HTMLButtonElement>(".velocity-detail-close")?.focus(); }
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key) || (event.key === " " && !(event.target instanceof HTMLButtonElement))) event.preventDefault();
    };
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      root.style.overflow = oldOverflow; body.style.paddingRight = oldPadding;
      window.removeEventListener("wheel", prevent); window.removeEventListener("touchmove", prevent); window.removeEventListener("keydown", key);
      window.scrollTo(0, y);
    };
  }, [selected, close]);
  useEffect(() => { const value = transition.current; return () => { gsap.killTweensOf(value); }; }, []);
  return <Context.Provider value={{ selected, phase, locked, transition, open, close }}>{children}</Context.Provider>;
}
