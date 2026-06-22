"use client";

import Link from "next/link";
import { useState } from "react";
import { navItems } from "@/data/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { CartIcon, WishlistIcon, AccountMenu } from "./HeaderActions";
import { MobileMenu } from "./MobileMenu";
import { IconMenu, IconChevronDown } from "@/components/ui/Icon";
import type { NavItem } from "@/types";

/** Sticky, blurred site header with mega menu + search + account/cart/wishlist. */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-line">
      <Container className="flex items-center gap-6 h-[74px]">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden -ml-1 p-1 text-ink hover:text-brand transition-colors"
          aria-label="Open menu"
        >
          <IconMenu size={26} />
        </button>

        <Logo />

        <nav className="hidden lg:flex items-center gap-7 ml-2 font-medium text-[15px]">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <div className="hidden md:block w-[230px]">
            <SearchBar />
          </div>
          <div className="hidden sm:block">
            <WishlistIcon />
          </div>
          <AccountMenu />
          <CartIcon />
        </div>
      </Container>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const hasPanel = !!item.megaMenu || !!item.dropdown;
  return (
    <div className="group relative">
      <Link href={item.href} className="flex items-center gap-1 py-6 hover:text-brand transition-colors">
        {item.label}
        {hasPanel && (
          <IconChevronDown size={14} className="opacity-60 transition-transform group-hover:rotate-180" />
        )}
      </Link>

      {item.megaMenu && (
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute left-0 top-full w-[720px] max-w-[92vw] bg-white border border-line rounded-2xl shadow-brand-lg p-6 z-50">
          <div className="grid grid-cols-4 gap-6">
            {item.megaMenu.columns.map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-ink hover:text-brand transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {item.megaMenu.featured && (
              <div className="bg-mint rounded-xl p-4 flex flex-col">
                <div className="text-4xl mb-2">{item.megaMenu.featured.emoji}</div>
                <p className="font-bold text-sm">{item.megaMenu.featured.title}</p>
                <p className="text-xs text-muted mt-1 mb-3">{item.megaMenu.featured.description}</p>
                <Link href={item.megaMenu.featured.href} className="btn btn-sm mt-auto">
                  {item.megaMenu.featured.buttonText}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {item.dropdown && (
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute left-0 top-full w-60 bg-white border border-line rounded-2xl shadow-brand-lg p-2 z-50 max-h-[70vh] overflow-auto">
          {item.dropdown.map((l) => (
            <Link key={l.href} href={l.href} className="block px-3 py-2 text-sm rounded-lg hover:bg-soft transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
