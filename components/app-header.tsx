"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex items-center gap-2 px-4 py-2 md:hidden">
      <SidebarTrigger />
    </header>
  );
}
