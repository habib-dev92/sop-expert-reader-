"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { User, Lock, Eye, EyeOff, Save, Mail, Calendar, Shield } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getUserInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }
  return email[0].toUpperCase()
}

export default function ProfilePage() {
  const { user, token } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [savingName, setSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const handleSaveName = async () => {
    if (!name.trim() || name === user?.name) return
    setSavingName(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to update name" }))
        throw new Error(err.detail)
      }
      toast.success("Name updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name")
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to change password" }))
        throw new Error(err.detail)
      }
      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const hasNameChanged = name.trim() && name !== user?.name

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-up">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
          <User className="h-3 w-3" />
          Profile
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and password</p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10 shadow-lg">
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              {getUserInitials(user?.name || null, user?.email || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Verified Account</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Member Since</label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Profile Information
        </h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">Display Name</label>
          <div className="flex gap-2">
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Your display name"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName || !hasNameChanged}
              className="shiny-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-all"
            >
              <Save className="h-4 w-4" />
              {savingName ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              <EyeOff className="h-4 w-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <div>
            <label htmlFor="current-password" className="block text-sm font-medium mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="shiny-button w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-all"
          >
            {changingPassword ? "Changing password..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
