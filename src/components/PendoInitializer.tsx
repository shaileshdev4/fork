"use client";

import { useEffect, useRef } from "react";

const ANON_VISITOR_KEY = "fork-pendo-visitor";

function visitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_VISITOR_KEY, id);
  }
  return id;
}

export function PendoInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || typeof pendo === "undefined") return;
    const id = visitorId();
    if (!id) return;
    initialized.current = true;
    pendo.initialize({ visitor: { id } });
  }, []);

  return null;
}
