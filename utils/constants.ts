/** App-wide constant keys & values. Centralised so a future API swap is trivial. */

export const STORAGE_KEYS = {
  cart: "meenazo_cart",
  wishlist: "meenazo_wishlist",
  recentlyViewed: "meenazo_recently_viewed",
  auth: "meenazo_auth",
  authToken: "meenazo_token",
  users: "meenazo_users",
  orders: "meenazo_orders",
  addresses: "meenazo_addresses",
  otp: "meenazo_otp",
} as const;

export const PRODUCTS_PER_PAGE = 9;
export const RECENTLY_VIEWED_LIMIT = 8;

export const SORT_LABELS: Record<string, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top Rated",
  newest: "Newest First",
  "name-asc": "Name: A to Z",
};

/** Simulated network latency for the mock service layer (ms). */
export const MOCK_LATENCY = 250;
