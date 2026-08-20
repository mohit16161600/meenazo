"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { NAV } from "../_lib/specs";
import { apiPost } from "../_lib/api";
import { Icon } from "./Icon";
import { GlobalSearch } from "./GlobalSearch";
import { PanelRoleProvider } from "../_lib/role-context";
import { canAccess } from "@/lib/panelRoles";

/** Panel resource key for a "/panel/<resource>/…" path. */
const resourceOf = (path: string | null | undefined) => path?.split("/")[2] ?? "dashboard";

export function PanelShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  /**
   * Desktop rail mode — the sidebar shrinks to icons so the content gets the
   * width back. Mobile is unaffected: there the sidebar is a drawer and `open`
   * already decides everything.
   *
   * Starts expanded and is corrected from localStorage after mount; reading
   * storage during render would make the server and client markup disagree.
   */
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem("meenazo.panel.sidebar") === "collapsed");
    } catch {
      /* private mode / storage disabled — stay expanded */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("meenazo.panel.sidebar", next ? "collapsed" : "expanded");
      } catch {
        /* not being able to remember it must not stop it working */
      }
      return next;
    });
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await apiPost("/auth/logout");
    } catch {
      /* ignore */
    }
    router.push("/panel/login");
    router.refresh();
  }

  const matches = (href: string) =>
    pathname === href || (href !== "/panel/dashboard" && pathname?.startsWith(href));

  // Only show sections this role may use; block direct-URL access to the rest.
  const visibleNav = NAV.filter((n) => canAccess(user.role, resourceOf(n.href)));
  // Longest match wins, so a nested entry (/panel/customers/otp) lights up on
  // its own instead of highlighting its parent (/panel/customers) as well.
  const active = visibleNav
    .filter((n) => matches(n.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const isActive = (href: string) => active?.href === href;
  const canViewCurrent = canAccess(user.role, resourceOf(pathname));

  return (
    <PanelRoleProvider role={user.role}>
    <div className="min-h-screen bg-soft lg:flex">
      {/* First focusable element on the page: lets a keyboard user jump the nav. */}
      <a
        href="#panel-main"
        className="sr-only left-4 top-4 z-[60] rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white focus:not-sr-only focus:absolute"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-[#18231d] text-white transition-[transform,width] duration-200 lg:static lg:translate-x-0",
          // Rail mode is desktop-only — on mobile this is a drawer, and a
          // 72px-wide drawer would be worse than no drawer.
          collapsed ? "lg:w-[72px]" : "lg:w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Link
          href="/panel/dashboard"
          title={collapsed ? "Meenazo admin panel" : undefined}
          className={clsx(
            "flex h-16 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-light",
            collapsed ? "px-5 lg:justify-center lg:px-0" : "px-5"
          )}
        >
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand font-black text-[#18231d]">
            M
          </div>
          <div className={clsx("leading-tight", collapsed && "lg:hidden")}>
            <div className="font-bold tracking-tight">Meenazo</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-light">
              Admin panel
            </div>
          </div>
        </Link>

        <div
          className={clsx(
            "px-5 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30",
            collapsed && "lg:hidden"
          )}
        >
          Menu
        </div>
        {/* Breathing room where the "Menu" label used to be, so the first icon
            doesn't sit flush against the logo in rail mode. */}
        {collapsed && <div className="hidden pt-4 lg:block" aria-hidden />}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {visibleNav.map((item) => {
            const act = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                // In rail mode the label is gone, so the native tooltip is the
                // only thing left that says what the icon does.
                title={collapsed ? item.label : undefined}
                // aria-current answers "where am I?" for a screen reader; the
                // colour change alone only serves sighted users.
                aria-current={act ? "page" : undefined}
                className={clsx(
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-light",
                  collapsed && "lg:justify-center lg:px-0",
                  act
                    ? "bg-brand text-white shadow-sm"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon name={item.icon} size={18} strokeWidth={act ? 2 : 1.7} />
                <span className={clsx("truncate", collapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "View live site" : undefined}
            className={clsx(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-light",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <Icon name="external" size={18} strokeWidth={1.7} />
            <span className={clsx(collapsed && "lg:hidden")}>View live site</span>
          </Link>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-ink hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <Icon name="menu" />
          </button>

          {/* Desktop rail toggle — gives the content back ~190px of width. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-11 w-11 flex-none items-center justify-center rounded-xl text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:flex"
          >
            <Icon name="menu" size={18} />
          </button>

          <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
            <span className="font-medium text-ink">{active?.label ?? "Panel"}</span>
          </div>

          <div className="min-w-0 flex-1 px-1 sm:px-3">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold text-ink">{user.name}</div>
              <div className="text-[11px] capitalize text-muted">{user.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              title="Log out"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
            >
              <Icon name="log-out" size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        {/* Wide cap, not 6xl: the data tables need the room, and capping at
            1152px left big empty margins WHILE the table scrolled sideways. */}
        <main id="panel-main" tabIndex={-1} className="w-full max-w-[1700px] flex-1 p-4 sm:p-6 lg:p-8">
          {canViewCurrent ? (
            children
          ) : (
            <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Icon name="lock" size={22} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-ink">No access</h2>
              <p className="mt-1.5 text-sm text-muted">
                Your role (<span className="font-semibold capitalize">{user.role}</span>) can&apos;t open this
                section. Contact an administrator if you need access.
              </p>
              <Link
                href="/panel/dashboard"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Icon name="grid" size={16} /> Back to dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
    </PanelRoleProvider>
  );
}
