"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("token") || ""

  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl)
  }, [tokenFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Reset token is missing")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Reset failed" }))
        throw new Error(err.detail)
      }
      setSuccess(true)
      toast.success("Password reset successful")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        <div className="absolute inset-0 gradient-hero-light dark:gradient-hero-dark opacity-50" />
        <div className="w-full max-w-sm text-center space-y-6 animate-fade-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-8 ring-emerald-500/5">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Password Reset!</h1>
            <p className="text-muted-foreground">Your password has been reset successfully.</p>
          </div>
          <Link
            href="/login"
            className="shiny-button inline-flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium"
          >
            Sign in with new password
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 gradient-hero-light dark:gradient-hero-dark opacity-50" />
      <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      <div className="relative w-full max-w-sm animate-fade-up">
        <Link href="/" className="flex items-center justify-center gap-2.5 font-semibold text-lg mb-8 hover:opacity-80 transition-opacity">
          <Logo />
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            SOP Expert AI
          </span>
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="text-muted-foreground mt-1">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-lg space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-1.5">
              Reset Token
            </label>
            <input
              id="token"
              type="text"
              required
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
              placeholder="Paste your reset token"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

          <button
            type="submit"
            disabled={loading}
            className="shiny-button w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
