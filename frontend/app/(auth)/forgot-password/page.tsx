"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Mail, ArrowLeft, Copy, Check, AlertCircle, CheckCircle, Inbox } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetUrl, setResetUrl] = useState("")
  const [message, setMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResetUrl("")
    setMessage("")
    setEmailSent(false)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }))
        throw new Error(err.detail)
      }
      const data = await res.json()
      setMessage(data.message)
      if (data.reset_url) {
        setResetUrl(data.reset_url)
      } else {
        setEmailSent(true)
        toast.success("Reset link sent!")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl)
      setCopied(true)
      toast.success("Reset link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  if (emailSent) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        <div className="absolute inset-0 gradient-hero-light dark:gradient-hero-dark opacity-50" />
        <div className="w-full max-w-sm text-center space-y-6 animate-fade-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-8 ring-emerald-500/5">
            <Inbox className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Check Your Email</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We&apos;ve sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              Please check your inbox (and spam folder).
            </p>
          </div>
          <Link
            href="/login"
            className="shiny-button inline-flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 gradient-hero-light dark:gradient-hero-dark opacity-50" />
      <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl animate-float" style={{ animationDelay: "-2.5s" }} />

      <div className="relative w-full max-w-sm animate-fade-up">
        <Link href="/" className="flex items-center justify-center gap-2.5 font-semibold text-lg mb-8 hover:opacity-80 transition-opacity">
          <Logo />
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            SOP Expert AI
          </span>
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Forgot Password</h1>
          <p className="text-muted-foreground mt-1">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-lg space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {message && !resetUrl && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg p-3">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}

          {message && resetUrl && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="shiny-button w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {resetUrl && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Email delivery unavailable. Use this link directly:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetUrl}
                  readOnly
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="shiny-button rounded-xl px-3 py-2 text-sm flex items-center gap-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <Link
                href={resetUrl}
                className="block text-center text-sm text-primary hover:underline font-medium"
              >
                Click here to reset your password &rarr;
              </Link>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
