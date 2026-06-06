"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

const AUTH_ROUTES = ["/login"];

export function AppShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (AUTH_ROUTES.includes(pathname)) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
