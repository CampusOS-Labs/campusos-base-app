"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

const AUTH_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/pay"];

export function AppShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (
    AUTH_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
