"use client";

/**
 * COD (Cash on Delivery) order submission to the Meenazo CRM via PHP.
 * Endpoint inserts one row per product into the CRM `enquiry` table.
 *
 * Configure the URL with NEXT_PUBLIC_COD_API. Default targets the PHP file
 * served by XAMPP/Apache at /meenazo-api/cod.php.
 */
export const COD_API_URL =
  process.env.NEXT_PUBLIC_COD_API ?? "http://localhost/meenazo-api/cod.php";

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

  if (!res.ok || !data) {
    throw new Error(data?.message ?? `COD request failed (${res.status})`);
  }
  return data;
}
