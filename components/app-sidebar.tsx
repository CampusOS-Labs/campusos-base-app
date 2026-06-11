"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, ChevronDown, CreditCard, History, House, LogOutIcon, Megaphone, ScrollText, Send, Settings, Users } from "lucide-react";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const nav = [
  { title: "Home", href: "/home", icon: <House className="size-4" /> },
  { title: "Attendance", href: "/attendance", icon: <CalendarCheck className="size-4" /> },
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
  const [announcementsOpen, setAnnouncementsOpen] = useState(true);

  useEffect(() => {
    if (
      pathname === "/announcements" ||
      pathname.startsWith("/announcements/") ||
      pathname === "/groups"
    ) {
      setAnnouncementsOpen(true);
    }
  }, [pathname]);

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
      collapsible="icon"
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
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                render={<Link href={item.href} />}
                className={cn(
                  "pl-4 relative hover:bg-zinc-200",
                  pathname === item.href && [
                    "data-active:!bg-transparent data-active:!text-foreground data-active:font-semibold data-active:hover:!bg-transparent",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-foreground before:rounded-full",
                  ],
                )}
              >
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu>
          <Collapsible
            open={announcementsOpen}
            onOpenChange={setAnnouncementsOpen}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    isActive={
                      pathname === "/announcements" ||
                      pathname.startsWith("/announcements/") ||
                      pathname === "/groups"
                    }
                    className={cn(
                      "pl-4 relative hover:bg-zinc-200",
                      (pathname === "/announcements" ||
                        pathname.startsWith("/announcements/") ||
                        pathname === "/groups") && [
                        "data-active:!bg-transparent data-active:!text-foreground data-active:font-semibold data-active:hover:!bg-transparent",
                        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-foreground before:rounded-full",
                      ],
                    )}
                  />
                }
              >
                <span className="mr-1.5"><Megaphone className="size-4" /></span>
                <span>Announcements</span>
                <ChevronDown className="ml-auto size-4 transition-transform data-[open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      render={<Link href="/announcements" />}
                      isActive={pathname === "/announcements"}
                    >
                      <Send className="size-4" />
                      Compose
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      render={<Link href="/groups" />}
                      isActive={pathname === "/groups"}
                    >
                      <Users className="size-4" />
                      Groups
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      render={<Link href="/announcements/history" />}
                      isActive={pathname === "/announcements/history"}
                    >
                      <History className="size-4" />
                      History
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/payments"}
              render={<Link href="/payments" />}
              className={cn(
                "pl-4 relative hover:bg-zinc-200",
                pathname === "/payments" && [
                  "data-active:!bg-transparent data-active:!text-foreground data-active:font-semibold data-active:hover:!bg-transparent",
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-foreground before:rounded-full",
                ],
              )}
            >
              <span className="mr-1.5"><CreditCard className="size-4" /></span>
              Payments
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/logs"}
              render={<Link href="/logs" />}
              className={cn(
                "pl-4 relative hover:bg-zinc-200",
                pathname === "/logs" && [
                  "data-active:!bg-transparent data-active:!text-foreground data-active:font-semibold data-active:hover:!bg-transparent",
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-foreground before:rounded-full",
                ],
              )}
            >
              <span className="mr-1.5"><ScrollText className="size-4" /></span>
              Logs
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings"}
              render={<Link href="/settings" />}
              className={cn(
                "pl-4 relative hover:bg-zinc-200",
                pathname === "/settings" && [
                  "data-active:!bg-transparent data-active:!text-foreground data-active:font-semibold data-active:hover:!bg-transparent",
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-foreground before:rounded-full",
                ],
              )}
            >
              <span className="mr-1.5"><Settings className="size-4" /></span>
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
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
      <SidebarRail />
    </Sidebar>
  );
}
