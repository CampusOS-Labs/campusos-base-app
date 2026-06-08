"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Home", href: "/home" },
  { title: "Payments", href: "/payments" },
  { title: "Announcements", href: "/announcements" },
  { title: "Logs", href: "/logs" },
] as const;

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email) {
    const prefix = email.split("@")[0] ?? "";
    const letters = prefix.replace(/[^a-zA-Z0-9]/g, "");
    return (letters.slice(0, 2) || prefix.slice(0, 2) || "?").toUpperCase();
  }

  return "?";
}

function getDisplayName(name?: string | null, email?: string | null): string {
  if (name?.trim()) return name.trim();
  if (email) return email.split("@")[0] ?? email;
  return "User";
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "sticky top-0 flex h-svh shrink-0 flex-col self-start overflow-hidden border-r border-sidebar-border",
        className,
      )}
      {...props}
    >
      <SidebarHeader className="shrink-0 px-5 py-3">
        <div className="flex items-center gap-2">
          {isPending ? (
            <>
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </>
          ) : (
            <>
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user?.name, user?.email)}</AvatarFallback>
                <AvatarBadge className="ring-sidebar" />
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium leading-tight">
                  {getDisplayName(user?.name, user?.email)}
                </span>
                <span className="text-xs text-muted-foreground">{user?.email ?? "—"}</span>
              </div>
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="min-h-0 flex-1 overflow-hidden px-3 pt-4">
        <SidebarMenu>
          {nav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                render={<Link href={item.href} />}
                className={cn(
                  "pl-4 relative hover:bg-zinc-200",
                  pathname === item.href && [
                    "data-active:!bg-transparent data-active:!text-foreground data-active:font-semibold data-active:hover:!bg-transparent",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-foreground before:rounded-full",
                  ],
                )}
              >
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="shrink-0 px-3 pt-2 pb-4">
        <Button
          variant="outline"
          className="w-full"
          disabled={isSigningOut}
          onClick={handleSignOut}
        >
          {isSigningOut ? <Spinner /> : <LogOutIcon data-icon="inline-start" />}
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
