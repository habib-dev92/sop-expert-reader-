"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import {
  MessageSquare, ArrowRight, Sparkles,
  Shield, FileText, Bot, Zap, CheckCircle, Menu, X,
  BrainCircuit, Globe, Heart, ChevronDown,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

function LandingContent() {
  const { resolvedTheme, setTheme } = useTheme()
  const { user, logout, loading } = useAuth()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const el = featuresRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"))
            setVisibleFeatures((prev) => new Set(prev).add(idx))
          }
        })
      },
      { threshold: 0.2 }
    )
    const cards = el.querySelectorAll("[data-index]")
    cards.forEach((c) => observer.observe(c))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* ──────────── NAV ──────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "glass border-b shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg">
            <Logo />
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              SOP Expert AI
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground"
              >
                {resolvedTheme === "dark" ? "Light" : "Dark"}
              </Button>
            )}
            {!loading && !user ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="shadow-sm">
                    Get Started
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            ) : !loading ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="shadow-sm">
                    Dashboard
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { logout(); toast.success("Logged out successfully") }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Logout
                </Button>
              </>
            ) : null}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenu ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t bg-background/95 backdrop-blur-md px-4 py-4 md:hidden shadow-lg">
            <nav className="flex flex-col gap-3">
              <Link
                href="#features"
                className="text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenu(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenu(false)}
              >
                How It Works
              </Link>
              {mounted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setMobileMenu(false) }}
                  className="justify-start"
                >
                  {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
              )}
              {!loading && !user ? (
                <>
                  <Link href="/login" onClick={() => setMobileMenu(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenu(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              ) : !loading ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenu(false)}>
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { logout(); toast.success("Logged out successfully"); setMobileMenu(false) }}
                  >
                    Logout
                  </Button>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      {/* ──────────── HERO ──────────── */}
      <section className="relative mt-16 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 gradient-hero-light dark:gradient-hero-dark opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary)/0.08_0%,transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/3 right-1/3 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl animate-float" style={{ animationDelay: "-1.5s" }} />

        <div className="relative mx-auto max-w-4xl space-y-8 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 shadow-sm backdrop-blur-sm hover:bg-emerald-500/10 transition-colors">
            <Heart className="h-3.5 w-3.5" />
            <span>Free to Use &mdash; No Hidden Costs</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance leading-[1.1]">
            Your SOP Knowledge
            <span className="block mt-2 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Expert Assistant
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Upload any Standard Operating Procedure and chat with an AI expert that answers
            <span className="font-semibold text-foreground"> only from your documents</span>.
            Zero hallucination. Zero outside knowledge. Just your SOPs.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/upload">
              <Button size="lg" className="w-full sm:w-auto shadow-md shadow-primary/25 text-base h-11 px-8 group relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                Upload Your First SOP
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-11 px-8 group">
                Try the Chat
                <MessageSquare className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> AI-Powered</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> 100% Private</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> No Hallucination</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Free Forever</span>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section id="features" className="relative border-t bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary)/0.03_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Why SOP Expert AI?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Built for professionals who need accurate, document-grounded answers — instantly.
            </p>
          </div>

          <div
            ref={featuresRef}
            className="mt-16 grid gap-6 md:grid-cols-3"
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                data-index={i}
                className={`group relative rounded-2xl border bg-card p-8 card-hover transition-all duration-700 ${
                  visibleFeatures.has(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section id="how-it-works" className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <BrainCircuit className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">Three Simple Steps</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Turn your SOPs into an interactive knowledge base in minutes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center group">
                {i < steps.length - 1 && (
                  <div className="absolute left-[60%] top-12 hidden h-px w-[80%] border-t border-dashed border-border/50 md:block" />
                )}
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20 group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-105">
                  <span className="text-2xl font-bold bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent">{i + 1}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
                  <div className="flex justify-center gap-1 pt-2">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                          dot === i ? "bg-primary w-4" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── CTA ──────────── */}
      <section className="relative border-t px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 gradient-hero-light dark:gradient-hero-dark opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse-soft" />
        <div className="relative mx-auto max-w-2xl text-center animate-fade-up">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 group-hover:scale-110 transition-transform">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Transform Your SOPs?
          </h2>
          <p className="mt-4 mb-10 text-muted-foreground text-lg">
            Sign up free today. No credit card needed.
            Just upload your SOPs and start asking.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/upload">
              <Button size="lg" className="shadow-lg shadow-primary/25 text-base h-11 px-8 group relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-base h-11 px-8 group">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────── PRIVACY / TRUST ──────────── */}
      <section className="border-t bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-3 text-center md:text-left">
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-sm font-semibold">100% Private</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your documents stay yours. Nothing is shared with third parties.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Globe className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-sm font-semibold">Free for Everyone</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No hidden costs, no premium tiers. Every feature is available to every user.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-sm font-semibold">Powered by AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Uses OpenRouter &amp; advanced LLMs. Your queries are processed securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5 font-medium text-foreground">
            <Logo className="h-6 w-6" />
            <span>SOP Expert AI</span>
          </div>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Built by{" "}
            <Link
              href="https://portfolio-website-nr8v.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors"
            >
              Habib Ul Haq
            </Link>
            <span className="hidden sm:inline"> &mdash; Next.js, FastAPI, LangChain &amp; ChromaDB</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: "No Hallucination",
    description: "Answers are strictly grounded in your uploaded documents. The AI never uses outside knowledge or training data.",
    icon: <Shield className="h-5 w-5 text-primary" />,
    iconBg: "bg-primary/10",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    title: "Completely Free",
    description: "No hidden fees or paid tiers. Every feature is available to all users, always free to use.",
    icon: <Heart className="h-5 w-5 text-rose-500" />,
    iconBg: "bg-rose-500/10",
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  {
    title: "Multi-Format Support",
    description: "Upload PDF, DOCX, TXT, or Markdown files. The system reads, chunks, and indexes them automatically in seconds.",
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    iconBg: "bg-blue-500/10",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    title: "Smart Formatting",
    description: "AI automatically chooses the best response format — steps for processes, tables for comparisons, paragraphs for explanations.",
    icon: <Zap className="h-5 w-5 text-purple-500" />,
    iconBg: "bg-purple-500/10",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    title: "Cited References",
    description: "Every answer includes file name and confidence score so you can verify the source instantly.",
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    iconBg: "bg-emerald-500/10",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    title: "Multi-Model Support",
    description: "Choose from GPT-4o Mini, GPT-4o, GPT-4 Turbo, and more. Switch models anytime from the chat interface.",
    icon: <Bot className="h-5 w-5 text-amber-500" />,
    iconBg: "bg-amber-500/10",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
]

const steps = [
  {
    title: "Upload Your SOP",
    desc: "Drag & drop your SOP files. We support PDF, DOCX, TXT, and Markdown formats with automatic text extraction.",
  },
  {
    title: "AI Reads & Indexes",
    desc: "The system extracts text, creates vector embeddings, and stores them in a ChromaDB database for instant retrieval.",
  },
  {
    title: "Chat with Knowledge",
    desc: "Ask questions and get expert answers with references to the exact source pages. Grounded only in your documents.",
  },
]

export default function LandingPage() {
  return <LandingContent />
}
