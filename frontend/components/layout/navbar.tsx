"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sun, Moon, Monitor, ChevronDown, Sparkles, User, Settings, LogOut } from "lucide-react"
import { useState, useEffect } from "react"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/documents": "Documents",
  "/upload": "Upload Document",
  "/chat": "Chat with SOP",
  "/profile": "Profile",
}

const pageDescriptions: Record<string, string> = {
  "/dashboard": "Overview of your knowledge base",
  "/documents": "Manage your uploaded SOPs",
  "/upload": "Add new documents to your knowledge base",
  "/chat": "Ask questions about your uploaded documents",
  "/profile": "Manage your account settings",
}

function getUserInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const title = pageTitles[pathname] || "SOP Expert AI"
  const description = pageDescriptions[pathname] || ""
  const displayTheme = mounted ? theme : "system"
  const displayResolved = mounted ? resolvedTheme : "light"

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold truncate">{title}</h1>
          {title === "Dashboard" && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-2.5 w-2.5" />
              Live
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-9 rounded-lg px-2.5 py-1.5 text-sm hover:bg-muted transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring border border-transparent hover:border-border active:scale-95">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                  {getUserInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-medium truncate max-w-[120px]">{user.name || user.email}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</p>
              </div>
              <ChevronDown className="hidden sm:block h-3 w-3 text-muted-foreground/50 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")} className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring border border-transparent hover:border-border active:scale-95">
            {displayResolved === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            <span className="capitalize hidden sm:inline">{displayTheme}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
