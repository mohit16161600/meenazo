import { redirect } from "next/navigation";
import { getSession } from "@/lib/panelAuth";
import { PanelShell } from "../_components/PanelShell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/panel/login");

  return (
    <PanelShell
      user={{ name: session.name, email: session.email, role: session.role }}
    >
      {children}
    </PanelShell>
  );
}
