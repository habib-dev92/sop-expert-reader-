"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import {
  FileText, Upload, MessageSquare, BrainCircuit,
  ArrowRight, BookOpen, Clock, Zap,
  Sparkles, Files, Globe, Plus,
} from "lucide-react"
import Link from "next/link"
import type { Document } from "@/types"

function AnimatedNumber({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || typeof value !== "number") return
    const duration = 800
    const start = performance.now()
    const from = 0
    const to = value
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, value])

  if (typeof value !== "number") {
    return <span ref={ref}>{value}{suffix}</span>
  }

  return <span ref={ref}>{display}{suffix}</span>
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load(); const interval = setInterval(load, 5000); return () => clearInterval(interval) }, [])

  async function load() {
    try {
      const res = await api.listDocuments()
      setDocuments(res.documents)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
        <div className="rounded-2xl border bg-card p-8 text-center max-w-md shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
            <Zap className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <p className="text-xs text-muted-foreground">Make sure the backend is running at http://localhost:8000</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>Retry Connection</Button>
        </div>
      </div>
    )
  }

  const totalChunks = documents.reduce((s, d) => s + (d.chunks_count || 0), 0)
  const totalPages = documents.reduce((s, d) => s + (d.page_count || 0), 0)

  const stats = [
    {
      title: "Documents", value: documents.length, icon: FileText,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-500/10", iconColor: "text-blue-500", desc: "Total uploaded SOPs",
    },
    {
      title: "Knowledge Chunks", value: totalChunks, icon: BrainCircuit,
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-500/10", iconColor: "text-purple-500", desc: "Indexed content pieces",
    },
    {
      title: "Total Pages", value: totalPages, icon: Files,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-500/10", iconColor: "text-amber-500", desc: "Processed pages",
    },
    {
      title: "Ready to Chat", value: documents.length > 0 ? "Yes" : "Upload first",
      icon: MessageSquare,
      gradient: documents.length > 0 ? "from-emerald-500 to-emerald-600" : "from-muted-foreground to-muted-foreground",
      bg: documents.length > 0 ? "bg-emerald-500/10" : "bg-muted",
      iconColor: documents.length > 0 ? "text-emerald-500" : "text-muted-foreground",
      desc: "AI assistant status",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            Welcome back
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length > 0
              ? `${documents.length} document${documents.length !== 1 ? "s" : ""} in your knowledge base`
              : "Your knowledge assistant is ready."}
          </p>
        </div>
        <Link href="/upload">
          <Button className="shadow-sm gap-2 group">
            <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
            Upload SOP
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <Card
              key={s.title}
              className="relative overflow-hidden card-hover animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${s.gradient}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold tracking-tight">
                      <AnimatedNumber value={s.value} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 animate-fade-up">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/upload">
              <Button className="w-full justify-start gap-3 h-11 shadow-sm group">
                <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
                Upload New SOP
                <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary" className="w-full justify-start gap-3 h-11 group">
                <MessageSquare className="h-4 w-4 transition-transform group-hover:scale-110" />
                Start Chatting
                <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            {documents.length > 0 && (
              <Link href={`/chat?doc=${documents[0].id}`}>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 group">
                  <BookOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Chat About &ldquo;{documents[0].filename}&rdquo;
                  <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
            <Link
              href="https://portfolio-website-nr8v.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-primary group">
                <Globe className="h-4 w-4 transition-transform group-hover:scale-110" />
                Built by Habib Ul Haq
                <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 animate-fade-up">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No documents uploaded yet</p>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">Upload your first SOP to get started.</p>
                <Link href="/upload">
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 5).map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between rounded-xl border bg-card/50 p-3.5 transition-all duration-200 hover:bg-card hover:shadow-sm hover:border-primary/20"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:scale-110 transition-transform duration-200">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.filename}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                          {doc.page_count ? <span className="flex items-center gap-1"><Files className="h-3 w-3" />{doc.page_count} pages</span> : null}
                          {doc.chunks_count ? <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" />{doc.chunks_count} chunks</span> : null}
                        </div>
                      </div>
                    </div>
                    <Link href={`/chat?doc=${doc.id}`} className="shrink-0">
                      <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 cursor-pointer">
                        Chat
                      </Badge>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
