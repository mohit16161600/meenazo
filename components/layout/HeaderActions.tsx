"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useAuth } from "@/context/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { IconHeart, IconBag, IconUser } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

function CountBadge({ count }: { count: number }) {
  const hydrated = useHydrated();
  if (!hydrated || count <= 0) return null;
  return (
    <span className="absolute -top-2 -right-2.5 bg-brand text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function WishlistIcon() {
  const count = useWishlistStore((s) => s.ids.length);
  return (
    <Link href="/wishlist" className="relative p-1.5 text-ink hover:text-brand transition-colors" aria-label="Wishlist">
      <IconHeart size={22} />
      <CountBadge count={count} />
    </Link>
  );
}

export function CartIcon() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <Link href="/cart" className="relative p-1.5 text-ink hover:text-brand transition-colors" aria-label="Cart">
      <IconBag size={22} />
      <CountBadge count={count} />
    </Link>
  );
}

export function AccountMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const links = [
    { label: "My Account", href: "/account" },
    { label: "My Orders", href: "/account/orders" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Saved Addresses", href: "/account/addresses" },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="p-1.5 text-ink hover:text-brand transition-colors" aria-label="Account">
        <IconUser size={22} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-56 bg-white border border-line rounded-2xl shadow-brand-lg overflow-hidden z-50 animate-fadeIn">
          {isAuthenticated ? (
            <>
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <div className="py-1.5">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn("block px-4 py-2 text-sm hover:bg-soft transition-colors")}
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-soft border-t border-line mt-1"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <p className="text-sm text-muted mb-3">Welcome to Meenazo 🌿</p>
              <Link href="/login" onClick={() => setOpen(false)} className="btn btn-block btn-sm mb-2">
                Login
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn btn-ghost btn-block btn-sm">
                Create account
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
