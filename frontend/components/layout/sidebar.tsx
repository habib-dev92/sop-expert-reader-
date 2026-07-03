"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Upload, MessageSquare, Files,
  Menu, X, ChevronRight, Bot, Heart, Globe, LogOut, User, Settings, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

function getUserInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/documents", label: "Documents", icon: Files },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: Settings },
    ...(user?.is_admin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  useEffect(() => { setMounted(true) }, [])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    router.push("/login")
  }

  if (!mounted) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <Link
          href="/"
          className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5 hover:bg-sidebar-accent/50 transition-colors"
        >
          <Logo />
          <span className="font-semibold text-sm bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/70 bg-clip-text text-transparent">
            SOP Expert AI
          </span>
        </Link>

        {user && (
          <div className="border-b border-sidebar-border px-4 py-3">
            <Link href="/profile" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-all duration-200 group">
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20 group-hover:ring-sidebar-primary/40 transition-all">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {getUserInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{user.name || "User"}</p>
                <p className="text-[11px] text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-all" />
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-3">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0 transition-all duration-200",
                  isActive ? "text-sidebar-primary-foreground" : "",
                  !isActive && "group-hover:scale-110",
                )} />
                <span>{link.label}</span>
                {isActive && (
                  <div className="ml-auto flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/60 animate-pulse-soft" />
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-3">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-sidebar-accent/50 to-sidebar-accent/30 p-3 group">
            <Bot className="absolute -right-2 -top-2 h-12 w-12 text-sidebar-primary/10 opacity-50" />
            <p className="text-xs font-medium text-sidebar-foreground/80">Need help?</p>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">Upload SOPs and start chatting.</p>
          </div>
          <div className="flex items-center gap-1.5 px-1">
            <Heart className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="text-[10px] text-sidebar-foreground/50">Built by Habib Ul Haq</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
