"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import {
  Users, FileText, MessageSquare, HardDrive,
  Shield, AlertTriangle, Clock, Activity,
  Zap, Globe, Mail, Calendar,
  Sparkles, BrainCircuit, ChevronRight,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface AdminStats {
  total_users: number
  total_documents: number
  total_conversations: number
  total_messages: number
  total_storage_bytes: number
  documents_processing: number
  documents_ready: number
  users_with_documents: number
  recent_users: Array<{
    id: string
    email: string
    name: string | null
    is_admin: boolean
    created_at: string
    documents_count: number
    conversations_count: number
  }>
  recent_documents: Array<{
    id: string
    filename: string
    file_size: number
    status: string
    uploaded_at: string
    user_email: string
  }>
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function AdminPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
      return
    }
    if (!loading && user && !user.is_admin) {
      router.replace("/dashboard")
      return
    }
    if (!loading && user?.is_admin) {
      fetchStats()
    }
  }, [user, loading])

  async function fetchStats() {
    setStatsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 403) {
          router.replace("/dashboard")
          return
        }
        throw new Error("Failed to load stats")
      }
      const data = await res.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStatsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user?.is_admin) return null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
        <div className="rounded-2xl border bg-card p-8 text-center max-w-md shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Users", value: stats?.total_users ?? 0, icon: Users,
      gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", iconColor: "text-blue-500",
      desc: `${stats?.users_with_documents ?? 0} have documents`,
    },
    {
      title: "Documents", value: stats?.total_documents ?? 0, icon: FileText,
      gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500/10", iconColor: "text-purple-500",
      desc: `${stats?.documents_ready ?? 0} ready, ${stats?.documents_processing ?? 0} processing`,
    },
    {
      title: "Conversations", value: stats?.total_conversations ?? 0, icon: MessageSquare,
      gradient: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", iconColor: "text-amber-500",
      desc: `${stats?.total_messages ?? 0} total messages`,
    },
    {
      title: "Storage Used", value: formatBytes(stats?.total_storage_bytes ?? 0), icon: HardDrive,
      gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", iconColor: "text-emerald-500",
      desc: "Total file storage",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Shield className="h-3 w-3" />
            Admin
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your application</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
          <Activity className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => {
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
                {statsLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold tracking-tight">{s.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Recent Users
            </CardTitle>
            <CardDescription className="text-xs">Newest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recent_users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No users yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.recent_users.map((u, idx) => (
                  <div
                    key={u.id}
                    className="group flex items-center justify-between rounded-xl border bg-card/50 p-3.5 transition-all duration-200 hover:bg-card hover:shadow-sm hover:border-primary/20"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        u.is_admin ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                      }`}>
                        {(u.name || u.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{u.name || "Unnamed"}</p>
                          {u.is_admin && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{u.documents_count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Recent Documents
            </CardTitle>
            <CardDescription className="text-xs">Latest uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
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
            ) : stats?.recent_documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.recent_documents.map((d, idx) => (
                  <div
                    key={d.id}
                    className="group flex items-center justify-between rounded-xl border bg-card/50 p-3.5 transition-all duration-200 hover:bg-card hover:shadow-sm hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.filename}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{d.user_email}</span>
                          <span>{formatBytes(d.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={d.status === "processed" || d.status === "ready" ? "default" : "secondary"}
                      className={
                        d.status === "processed" || d.status === "ready"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : d.status?.startsWith("error")
                          ? "bg-destructive/10 text-destructive"
                          : ""
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            SOP Expert AI v1.0.0
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-primary" />
            Built by Habib Ul Haq
          </span>
        </div>
      </div>
    </div>
  )
}
