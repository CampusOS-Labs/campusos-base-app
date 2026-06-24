"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArticleIcon,
  CalendarCheckIcon,
  CaretUpIcon,
  ClockCounterClockwiseIcon,
  CreditCardIcon,
  GearIcon,
  HouseIcon,
  PaperPlaneTiltIcon,
  SignOutIcon,
  UsersIcon,
} from "@phosphor-icons/react";

import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { OrgBrand } from "@/components/org-brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { FEATURE_UNDER_DEVELOPMENT_MESSAGE } from "@/components/under-development-hint";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItemClassName = cn(
  "relative pl-4 transition-transform duration-150 ease-out active:scale-[0.98]",
  "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
  "data-active:!bg-transparent data-active:!font-medium data-active:!text-foreground data-active:hover:!bg-transparent",
  "data-active:before:absolute data-active:before:top-1/2 data-active:before:left-0 data-active:before:h-5 data-active:before:w-0.5 data-active:before:-translate-y-1/2 data-active:before:rounded-full data-active:before:bg-sidebar-primary",
);

function isPathActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

type NavItemProps = {
  href: string;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
};

function NavItem({ href, title, icon, isActive }: NavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={title}
        render={<Link href={href} />}
        className={navItemClassName}
      >
        {icon}
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DisabledNavItem({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger render={<span className="flex w-full cursor-not-allowed" />}>
          <SidebarMenuButton
            disabled
            className={cn(
              navItemClassName,
              "text-muted-foreground hover:bg-transparent hover:text-muted-foreground active:scale-100",
            )}
          >
            {icon}
            <span>{title}</span>
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right">{FEATURE_UNDER_DEVELOPMENT_MESSAGE}</TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Suspense
      fallback={
        <Sidebar collapsible="icon" className={cn(className)} {...props}>
          <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
            <Skeleton className="h-8 w-32" />
          </SidebarHeader>
          <SidebarContent>
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </SidebarContent>
        </Sidebar>
      }
    >
      <AppSidebarInner className={className} {...props} />
    </Suspense>
  );
}

function AppSidebarInner({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
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
      collapsible="icon"
      className={cn(className)}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <OrgBrand variant="sidebar" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Today</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                href="/home"
                title="Home"
                icon={<HouseIcon />}
                isActive={isPathActive(pathname, "/home")}
              />
              <NavItem
                href="/payments"
                title="Payments"
                icon={<CreditCardIcon />}
                isActive={isPathActive(pathname, "/payments")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Announcements</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                href="/announcements"
                title="Compose"
                icon={<PaperPlaneTiltIcon />}
                isActive={pathname === "/announcements"}
              />
              <NavItem
                href="/groups"
                title="Groups"
                icon={<UsersIcon />}
                isActive={isPathActive(pathname, "/groups")}
              />
              <NavItem
                href="/announcements/history"
                title="History"
                icon={<ClockCounterClockwiseIcon />}
                isActive={isPathActive(pathname, "/announcements/history")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <DisabledNavItem title="Logs" icon={<ArticleIcon />} />
              <NavItem
                href="/settings"
                title="Settings"
                icon={<GearIcon />}
                isActive={isPathActive(pathname, "/settings")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {isPending ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                />
              }
            >
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">
                  {getDisplayName(user?.name, user?.email)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email ?? "—"}
                </span>
              </div>
              <CaretUpIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{getDisplayName(user?.name, user?.email)}</span>
                    <span className="text-xs text-muted-foreground">{user?.email ?? "—"}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isSigningOut}
                onClick={() => void handleSignOut()}
              >
                {isSigningOut ? <Spinner /> : <SignOutIcon />}
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
