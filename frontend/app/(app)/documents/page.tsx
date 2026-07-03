"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/services/api"
import {
  FileText, Trash2, MessageSquare, AlertCircle, Upload,
  Sparkles, BookOpen, BrainCircuit, Files, Loader2, CheckCircle2,
  Search, ArrowUpDown,
} from "lucide-react"
import Link from "next/link"
import type { Document } from "@/types"

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() || ""
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"filename" | "uploaded_at" | "file_size">("uploaded_at")
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    try {
      const res = await api.listDocuments()
      setDocuments(res.documents)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.deleteDoc(deleteId)
      setDocuments(prev => prev.filter(d => d.id !== deleteId))
    } catch (err: any) {
      alert(err.message)
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const filtered = documents
    .filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0
      if (sortField === "filename") cmp = a.filename.localeCompare(b.filename)
      else if (sortField === "file_size") cmp = a.file_size - b.file_size
      else cmp = a.uploaded_at.localeCompare(b.uploaded_at)
      return sortAsc ? cmp : -cmp
    })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            Knowledge Base
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""} in your knowledge base
          </p>
        </div>
        <Link href="/upload">
          <Button className="shadow-sm gap-2 group">
            <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
            Upload New
          </Button>
        </Link>
      </div>

      {documents.length > 0 && (
        <div className="flex items-center gap-3 animate-fade-up">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSortField("uploaded_at"); setSortAsc(!sortAsc) }}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            Date
            <ArrowUpDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSortField("filename"); setSortAsc(!sortAsc) }}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            Name
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            All Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
                {searchQuery ? <Search className="h-6 w-6 text-muted-foreground" /> : <FileText className="h-6 w-6 text-muted-foreground" />}
              </div>
              <p className="font-medium">{searchQuery ? "No documents match your search" : "No documents uploaded yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term." : "Upload your first SOP to get started."}
              </p>
              {!searchQuery && (
                <Link href="/upload" className="mt-6">
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Now
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((doc) => {
                const ext = getFileExt(doc.filename)
                const isProcessing = doc.status === "processing" || doc.status === "queued" || doc.status === "extracting" || doc.status === "chunking"
                return (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between rounded-xl border bg-card/50 p-4 transition-all duration-200 hover:bg-card hover:shadow-md hover:border-primary/20"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ${
                        ext === "pdf" ? "bg-red-500/10" :
                        ext === "docx" ? "bg-blue-500/10" :
                        ext === "txt" ? "bg-gray-500/10" :
                        ext === "md" ? "bg-amber-500/10" :
                        "bg-primary/10"
                      }`}>
                        <FileText className={`h-5 w-5 ${
                          ext === "pdf" ? "text-red-500" :
                          ext === "docx" ? "text-blue-500" :
                          ext === "txt" ? "text-gray-500" :
                          ext === "md" ? "text-amber-500" :
                          "text-primary"
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{doc.filename}</p>
                          {ext && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none uppercase shrink-0">
                              {ext}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Files className="h-3 w-3" />{formatSize(doc.file_size)}</span>
                          {doc.page_count && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{doc.page_count} pages</span>}
                          {doc.chunks_count && <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" />{doc.chunks_count} chunks</span>}
                          <span className="text-muted-foreground/50">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isProcessing ? (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Processing
                        </Badge>
                      ) : doc.status === "processed" || doc.status === "ready" ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      ) : doc.status?.startsWith("error") ? (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{doc.status}</Badge>
                      )}

                      <Link href={`/chat?doc=${doc.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Chat about this document"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Dialog open={deleteId === doc.id} onOpenChange={(open) => { setDeleteId(open ? doc.id : null) }}>
                        <DialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            />
                          }
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Document</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete <span className="font-medium text-foreground">{doc.filename}</span>?
                              This will permanently remove the document and all its indexed chunks.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setDeleteId(null)}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={confirmDelete}
                              disabled={deleting}
                              className="gap-2"
                            >
                              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              {deleting ? "Deleting..." : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
