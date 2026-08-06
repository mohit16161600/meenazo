import { notFound } from "next/navigation";
import { getSession } from "@/lib/panelAuth";
import { SetupClient } from "./SetupClient";

export const dynamic = "force-dynamic";

/**
 * Installer page — administrators only.
 *
 * Not "signed in", not "manager": the installer can create tables, reseed
 * content and mint an admin account, so Store Manager, Content Editor and
 * SEO / Content are all refused here even though they can sign into the panel.
 *
 * Anyone else gets a 404 rather than a redirect or an "access denied" — a
 * stranger poking at /panel/setup should not learn the page exists. The API
 * behind it re-checks the same rule; this gate is the first of two.
 */
export default async function SetupPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") notFound();

  return <SetupClient />;
}
