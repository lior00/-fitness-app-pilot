import type { ReactNode } from "react";

import { Sidebar } from "@/components/shell/sidebar";

export function AppShell({
  signOutAction,
  children,
}: {
  signOutAction: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar signOutAction={signOutAction} />
      <main className="flex-1 space-y-6 p-6 sm:p-8">{children}</main>
    </div>
  );
}
