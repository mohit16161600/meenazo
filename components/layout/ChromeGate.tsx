"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the storefront chrome (announcement bar, header, footer) on admin
 * panel routes so /panel can render its own full-screen layout. The storefront
 * markup is passed in as already-rendered server nodes, so nothing about the
 * public site changes.
 */
export function ChromeGate({
  top,
  bottom,
  children,
}: {
  top: React.ReactNode;
  bottom: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith("/panel");

  if (isPanel) return <>{children}</>;

  return (
    <>
      {top}
      <main className="min-h-[60vh]">{children}</main>
      {bottom}
    </>
  );
}
