"use client";

/**
 * COD (Cash on Delivery) order submission to the Meenazo CRM.
 * Posts to the same-origin Next.js API route /api/cod, which inserts one row
 * per product into the CRM `enquiry` MySQL table. Same origin → no CORS, no
 * loopback, no PHP. Override with NEXT_PUBLIC_COD_API only if you must.
 */
export const COD_API_URL =
  process.env.NEXT_PUBLIC_COD_API ?? "/api/cod";

export interface CodOrderItem {
  product: string; // product slug: slimpax | diasuddhi | joshveda
  quantity: number;
}

export interface CodOrderPayload {
  name: string;
  mobile: string;
  address: string;
  state: string;
  items: CodOrderItem[];
}

export interface CodOrderResult {
  success: boolean;
  message: string;
  inserted?: number;
  ip?: string;
}

/** POST a COD order to the CRM. Throws on network/HTTP failure. */
export async function submitCodOrder(payload: CodOrderPayload): Promise<CodOrderResult> {
  const res = await fetch(COD_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: CodOrderResult | null = null;
  try {
    data = (await res.json()) as CodOrderResult;
  } catch {
    /* non-JSON response */
  }

  // The API returns a JSON { success, message } body even for business-rule
  // failures (422 validation, "no valid products", DB error). Surface those to
  // the UI via codRes.message instead of throwing — only throw when there is no
  // usable JSON body (a true network/transport error or a bodyless response).
  if (data && typeof data.success === "boolean") {
    return data;
  }
  throw new Error(data?.message ?? `COD request failed (${res.status})`);
}
