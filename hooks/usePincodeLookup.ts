"use client";

import { useEffect, useState } from "react";

export interface PincodeArea {
  name: string;
  district: string;
}

export type PincodeStatus = "idle" | "loading" | "success" | "empty" | "error";

export interface PincodeLookup {
  status: PincodeStatus;
  areas: PincodeArea[];
  states: string[];
}

const IDLE: PincodeLookup = { status: "idle", areas: [], states: [] };

/** Per-session memo so re-typing the same PIN resolves instantly. */
const cache = new Map<string, { areas: PincodeArea[]; states: string[] }>();

/**
 * Resolves the post-office areas + state(s) for a 6-digit Indian pincode via
 * the `/api/pincode` proxy. Debounced, abortable and memo-cached. Stays `idle`
 * until a full 6-digit PIN is entered, so callers can drive it straight from a
 * controlled pincode input.
 */
export function usePincodeLookup(pincode: string): PincodeLookup {
  const pin = (pincode || "").replace(/\D/g, "").slice(0, 6);
  const [state, setState] = useState<PincodeLookup>(IDLE);

  useEffect(() => {
    if (pin.length !== 6) {
      setState(IDLE);
      return;
    }

    const cached = cache.get(pin);
    if (cached) {
      setState({ status: cached.areas.length ? "success" : "empty", ...cached });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading", areas: [], states: [] });

    const timer = setTimeout(() => {
      fetch(`/api/pincode?pincode=${pin}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((json: { areas?: PincodeArea[]; states?: string[]; error?: string }) => {
          if (json.error) {
            setState({ status: "error", areas: [], states: [] });
            return;
          }
          const areas = Array.isArray(json.areas) ? json.areas : [];
          const states = Array.isArray(json.states) ? json.states : [];
          cache.set(pin, { areas, states });
          setState({ status: areas.length ? "success" : "empty", areas, states });
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setState({ status: "error", areas: [], states: [] });
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pin]);

  return state;
}
