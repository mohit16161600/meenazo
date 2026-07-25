"use client";

/** Thin client-side fetch helpers for the panel API. */

export interface ApiError {
  message: string;
  status: number;
}

async function handle(res: Response) {
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok || data.success === false) {
    const err: ApiError = {
      message: (data.message as string) || `Request failed (${res.status})`,
      status: res.status,
    };
    throw err;
  }
  return data;
}

const base = "/api/panel";

export async function apiGet<T = Record<string, unknown>>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { credentials: "same-origin", cache: "no-store" });
  return (await handle(res)) as T;
}

export async function apiSend<T = Record<string, unknown>>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await handle(res)) as T;
}

export const apiPost = <T = Record<string, unknown>>(p: string, b?: unknown) =>
  apiSend<T>(p, "POST", b);
export const apiPut = <T = Record<string, unknown>>(p: string, b?: unknown) =>
  apiSend<T>(p, "PUT", b);
export const apiDelete = <T = Record<string, unknown>>(p: string) =>
  apiSend<T>(p, "DELETE");
