"use client";
import { useLayoutEffect } from "react";

export function HomeScrollReset() {
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let frame = 0;
    const reset = () => {
      // A deliberate deep link is navigation, not unwanted restoration.
      if (location.pathname !== "/" || location.hash) return;
      window.scrollTo({top:0,left:0,behavior:"instant"});
      frame = requestAnimationFrame(() => {
        if (!location.hash) window.scrollTo({top:0,left:0,behavior:"instant"});
      });
    };
    reset();
    window.addEventListener("pageshow",reset);
    return () => { cancelAnimationFrame(frame);window.removeEventListener("pageshow",reset);history.scrollRestoration=previous; };
  },[]);
  return null;
}
