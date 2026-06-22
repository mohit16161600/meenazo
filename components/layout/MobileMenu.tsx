"use client";

import Link from "next/link";
import { useState } from "react";
import { navItems } from "@/data/navigation";
import { categories } from "@/data/categories";
import { useAuth } from "@/context/AuthContext";
import { SearchBar } from "./SearchBar";
import { Logo } from "./Logo";
import { IconClose, IconChevronDown, IconBag, IconLeaf } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/** Slide-in mobile navigation drawer. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [showCats, setShowCats] = useState(true);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-ink/50 z-[110] lg:hidden transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[86%] max-w-sm bg-white z-[120] lg:hidden shadow-brand-lg transition-transform duration-300 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-line">
          <Logo />
          <button onClick={onClose} aria-label="Close menu" className="w-9 h-9 rounded-full bg-soft flex items-center justify-center text-ink">
            <IconClose size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-line">
          <SearchBar />
        </div>

        <nav className="flex-1 overflow-auto p-4">
          <Link href="/shop" onClick={onClose} className="flex items-center gap-2.5 py-2.5 font-semibold">
            <IconBag size={20} className="text-brand" /> Shop All
          </Link>

          <button
            onClick={() => setShowCats((s) => !s)}
            className="w-full flex items-center justify-between py-2.5 font-semibold"
          >
            <span className="flex items-center gap-2.5">
              <IconLeaf size={20} className="text-brand" /> Categories
            </span>
            <IconChevronDown size={18} className={cn("transition-transform", showCats && "rotate-180")} />
          </button>
          {showCats && (
            <div className="pl-3 pb-2 space-y-0.5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2 py-2 text-sm text-muted hover:text-brand"
                >
                  <span>{c.emoji}</span> {c.name}
                </Link>
              ))}
            </div>
          )}

          {navItems
            .filter((n) => !n.megaMenu && !n.dropdown)
            .map((n) => (
              <Link key={n.href} href={n.href} onClick={onClose} className="block py-2.5 font-semibold">
                {n.label}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-line">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link href="/account" onClick={onClose} className="btn btn-block btn-sm">
                {user?.name?.split(" ")[0] ?? "My Account"}
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="btn btn-ghost btn-block btn-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={onClose} className="btn btn-sm">
                Login
              </Link>
              <Link href="/register" onClick={onClose} className="btn btn-ghost btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
