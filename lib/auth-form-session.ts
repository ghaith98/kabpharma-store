"use client";

import {useEffect, useRef, useSyncExternalStore} from "react";

const KEY = "kab_auth_form_generation";
const EVENT = "kabAuthFormReset";
let memoryGeneration = "0";
let memoryOnly = false;
let sequence = 0;

function snapshot() {
  if (memoryOnly) return memoryGeneration;
  try { return window.localStorage.getItem(KEY) || memoryGeneration; }
  catch { return memoryGeneration; }
}

/** Invalidate cached sign-in/sign-up forms after an account transition. */
export function resetAuthForms() {
  memoryGeneration = `${Date.now()}-${++sequence}`;
  try { window.localStorage.setItem(KEY,memoryGeneration); memoryOnly=false; } catch { memoryOnly=true; }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      if (memoryOnly && event.newValue) memoryGeneration=event.newValue;
      notify();
    }
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) resetAuthForms();
  };
  window.addEventListener(EVENT,notify);
  window.addEventListener("storage",onStorage);
  window.addEventListener("pageshow",onPageShow);
  return () => {window.removeEventListener(EVENT,notify);window.removeEventListener("storage",onStorage);window.removeEventListener("pageshow",onPageShow);};
}

export function useAuthFormGeneration() {
  return useSyncExternalStore(subscribe,snapshot,()=>"0");
}

/** Abandon requests from a form that has been replaced or left. */
export function useAuthFetch() {
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => {controller.current?.abort();controller.current=null;},[]);
  return (input: RequestInfo | URL, init?: RequestInit) => {
    controller.current ??= new AbortController();
    return fetch(input,{...init,signal:controller.current.signal});
  };
}
