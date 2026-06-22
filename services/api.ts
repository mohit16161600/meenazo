/**
 * Mock API client.
 * ---------------------------------------------------------------------------
 * Today every service resolves from local dummy data. To switch to a real
 * Laravel backend later, replace the body of `apiGet`/`apiPost` with `fetch`
 * calls to `API_BASE_URL` — the service function signatures stay identical.
 * ---------------------------------------------------------------------------
 */
import { MOCK_LATENCY } from "@/utils/constants";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.meenazo.com/api";

/** Simulate network latency so loading states are exercised. */
export function delay<T>(value: T, ms: number = MOCK_LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Placeholder GET — swap for fetch(`${API_BASE_URL}${path}`) later. */
export async function apiGet<T>(_path: string, fallback: T): Promise<T> {
  return delay(fallback);
}

/** Placeholder POST — swap for fetch with method POST later. */
export async function apiPost<T>(_path: string, _body: unknown, result: T): Promise<T> {
  return delay(result);
}
