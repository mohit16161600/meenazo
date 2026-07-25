import type { Metadata } from "next";
import { ToastProvider } from "./_components/toast";

export const metadata: Metadata = {
  title: "Meenazo Admin",
  robots: { index: false, follow: false },
};

export default function PanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-soft text-ink antialiased">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
