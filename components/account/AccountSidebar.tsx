"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

interface NavLink {
  label: string;
  href: string;
  icon: string;
  /** When true, an exact pathname match is required to be "active". */
  exact?: boolean;
}

const links: NavLink[] = [
  { label: "Overview", href: "/account", icon: "home", exact: true },
  { label: "My Orders", href: "/account/orders", icon: "package" },
  { label: "Wishlist", href: "/wishlist", icon: "heart" },
  { label: "Saved Addresses", href: "/account/addresses", icon: "map-pin" },
  { label: "Profile", href: "/account/profile", icon: "user" },
  { label: "Change Password", href: "/account/change-password", icon: "lock" },
];

function isActive(pathname: string, link: NavLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(link.href + "/");
}

export function AccountSidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { logout } = useAuth();
  const { success } = useToast();

  const handleLogout = () => {
    logout();
    success("Signed out", "You have been logged out of your account.");
    router.push("/");
  };

  return (
    <nav aria-label="Account navigation" className="lg:sticky lg:top-24">
      {/* Mobile: horizontal scroll row of pills */}
      <div className="lg:hidden -mx-4 px-4">
        <ul className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {links.map((link) => {
            const active = isActive(pathname, link);
            return (
              <li key={link.href} className="shrink-0">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors border",
                    active
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-ink border-line hover:border-brand-light"
                  )}
                >
                  <Icon name={link.icon} size={18} />
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap border border-line bg-white text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <Icon name="logout" size={18} />
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Desktop: vertical nav card */}
      <div className="hidden lg:block card-surface p-3">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            const active = isActive(pathname, link);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-mint text-brand-dark"
                      : "text-ink hover:bg-soft"
                  )}
                >
                  <Icon name={link.icon} size={18} />
                  <span>{link.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="my-2 border-t border-line" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <Icon name="logout" size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
}
