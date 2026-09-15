"use client";

import { useSyncExternalStore } from "react";

const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const getVisibility = () => document.visibilityState === "visible";
const serverVisible = () => true;
export const usePageVisible = () => useSyncExternalStore(subscribeVisibility, getVisibility, serverVisible);

const subscribeMobile = (notify: () => void) => {
  const query = matchMedia("(max-width: 767px)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const getMobile = () => matchMedia("(max-width: 767px)").matches;
const serverMobile = () => false;
export const useMobileDevice = () => useSyncExternalStore(subscribeMobile, getMobile, serverMobile);
