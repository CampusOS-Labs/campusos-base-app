"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  Megaphone,
  ScrollText,
} from "lucide-react"

import { signOut, useSession } from "@/lib/auth-client"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  { title: "Home", url: "/home", icon: LayoutDashboard },
  { title: "Payments", url: "/payments", icon: Receipt },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  { title: "Logs", url: "/logs", icon: ScrollText },
]

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) {
    const prefix = email.split("@")[0] ?? ""
    const letters = prefix.replace(/[^a-zA-Z0-9]/g, "")
    return (letters.slice(0, 2) || prefix.slice(0, 2) || "?").toUpperCase()
  }
  return "?"
}

function getDisplayName(name?: string | null, email?: string | null): string {
  if (name?.trim()) return name.trim()
  if (email) return email.split("@")[0] ?? email
  return "User"
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const user = session?.user
  const [isSigningOut, setIsSigningOut] = useState(false)

  const navItems = navMain.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }))

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push("/login")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className={className}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/home" />}
              className="data-[slot=sidebar-menu-button]:p-1.5"
            >
              <span className="text-base font-semibold">CampusOS</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: getDisplayName(user?.name, user?.email),
            email: user?.email ?? "",
            avatar: "",
          }}
          onLogout={handleSignOut}
          isSigningOut={isSigningOut}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
