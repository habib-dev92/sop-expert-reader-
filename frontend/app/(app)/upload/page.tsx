"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { api } from "@/services/api"
import {
  Upload, FileText, X, CheckCircle2, AlertCircle,
  Loader2, Trash2, MessageSquare, ArrowRight, Shield,
  Sparkles, FileType, BookOpen, BrainCircuit, FileUp, Clock,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import type { Document } from "@/types"

const MAX_SIZE = 50 * 1024 * 1024

interface UploadingFile {
  name: string
  size: number
  progress: number
  status: "uploading" | "processing" | "done" | "error"
  error?: string
  stage?: string
  documentId?: string
}

const STAGE_LABELS: Record<string, string> = {
  queued: "Waiting in queue...",
  extracting: "Extracting text from document...",
  chunking: "Chunking and embedding content...",
  ready: "Completed!",
  processed: "Completed!",
}

const STAGE_PROGRESS: Record<string, number> = {
  queued: 10,
  extracting: 40,
  chunking: 75,
  ready: 100,
  processed: 100,
}

const fileTypeIcons: Record<string, string> = {
  pdf: "bg-red-500/10 text-red-500",
  docx: "bg-blue-500/10 text-blue-500",
  txt: "bg-gray-500/10 text-gray-500",
  md: "bg-amber-500/10 text-amber-500",
}

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() || ""
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState<Record<string, UploadingFile>>({})
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null)
  const pollingRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  useEffect(() => { loadDocuments(); return () => stopAllPolling() }, [])

  function stopPolling(key: string) {
    if (pollingRef.current[key]) {
      clearInterval(pollingRef.current[key])
      delete pollingRef.current[key]
    }
  }

  function stopAllPolling() {
    Object.values(pollingRef.current).forEach(clearInterval)
    pollingRef.current = {}
  }

  async function pollUploadStatus(key: string, documentId: string) {
    stopPolling(key)
    pollingRef.current[key] = setInterval(async () => {
      try {
        const result = await api.uploadStatus(documentId)
        const stage = result.status
        const progress = STAGE_PROGRESS[stage] || 10
        setUploading(prev => ({
          ...prev,
          [key]: { ...prev[key], progress, stage, status: stage === "ready" || stage === "processed" ? "done" : "processing" },
        }))
        if (stage === "ready" || stage === "processed" || stage.startsWith("error")) {
          stopPolling(key)
          if (stage === "ready" || stage === "processed") {
            await loadDocuments()
          }
        }
      } catch {
        stopPolling(key)
      }
    }, 1200)
  }

  async function loadDocuments() {
    try {
      const res = await api.listDocuments()
      setDocuments(res.documents)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      alert(rejected[0]?.errors?.[0]?.message || "Invalid file")
      return
    }
    setFiles(prev => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt", ".md"],
    },
    maxSize: MAX_SIZE,
    maxFiles: 10,
  })

  async function uploadFiles() {
    let lastId: string | null = null
    for (const file of files) {
      const key = `${file.name}-${file.size}`
      setUploading(prev => ({
        ...prev,
        [key]: { name: file.name, size: file.size, progress: 0, status: "uploading", stage: "uploading" },
      }))
      try {
        setUploading(prev => ({
          ...prev,
          [key]: { ...prev[key], progress: 5, status: "uploading", stage: "uploading" },
        }))
        const res = await api.upload(file)
        const docId = res.document?.id
        if (docId) {
          lastId = docId
          setUploading(prev => ({
            ...prev,
            [key]: { ...prev[key], progress: 10, status: "processing", stage: "queued", documentId: docId },
          }))
          pollUploadStatus(key, docId)
        } else {
          setUploading(prev => ({ ...prev, [key]: { ...prev[key], progress: 100, status: "done" } }))
        }
      } catch (err: any) {
        setUploading(prev => ({ ...prev, [key]: { ...prev[key], status: "error", error: err.message } }))
      }
    }
    setFiles([])
    setLastUploadedId(lastId)
  }

  async function deleteDocument(id: string) {
    try {
      await api.deleteDoc(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  function removeFile(file: File) {
    setFiles(prev => prev.filter(f => f !== file))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="animate-fade-up">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
          <Sparkles className="h-3 w-3" />
          Knowledge Base
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Upload SOP</h1>
        <p className="text-muted-foreground mt-1">Upload PDF, DOCX, TXT, or Markdown files to build your knowledge base.</p>
      </div>

      <div
        {...getRootProps()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all duration-300 animate-fade-up ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/20"
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 hover:shadow-md"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
          isDragActive
            ? "bg-primary text-white scale-110 shadow-lg shadow-primary/25"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105"
        }`}>
          <FileUp className={`h-7 w-7 ${isDragActive ? "animate-bounce" : ""}`} />
        </div>
        {isDragActive ? (
          <p className="text-lg font-semibold text-primary animate-pulse-soft">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium">
              Drag & drop files here, or <span className="text-primary font-semibold">browse</span>
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Supports PDF, DOCX, TXT, MD (Max 50MB per file)</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <Card className="border-primary/20 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Selected Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file) => {
              const ext = getFileExt(file.name)
              const extColor = fileTypeIcons[ext] || "bg-primary/10 text-primary"
              return (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl border bg-card/50 p-3.5 transition-all hover:bg-card hover:shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${extColor}`}>
                      <FileType className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            <Button
              onClick={uploadFiles}
              className="w-full h-11 shadow-sm gap-2 group"
            >
              <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
              Upload {files.length} File{files.length > 1 ? "s" : ""}
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.keys(uploading).length > 0 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {Object.values(uploading).some(u => u.status === "processing")
                ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              }
              Upload Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(uploading).map(([key, file]) => {
              const stageLabel = file.stage ? (STAGE_LABELS[file.stage] || file.stage) : ""
              return (
                <div key={key} className="rounded-xl border bg-card/50 p-4 transition-all">
                  <div className="flex items-center gap-3 min-w-0 mb-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      file.status === "done" ? "bg-emerald-500/10" :
                      file.status === "error" ? "bg-destructive/10" :
                      "bg-muted"
                    }`}>
                      {file.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : file.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      {stageLabel && file.status !== "done" && (
                        <p className="text-xs text-muted-foreground mt-0.5">{stageLabel}</p>
                      )}
                      {file.status === "done" && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Completed successfully</p>
                      )}
                      {file.status === "error" && (
                        <p className="text-xs text-destructive mt-0.5">Failed: {file.error}</p>
                      )}
                    </div>
                    {file.status === "processing" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="h-3 w-3 text-muted-foreground animate-pulse-soft" />
                        <span className="text-xs text-muted-foreground">{file.progress}%</span>
                      </div>
                    )}
                    {file.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    {file.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                  </div>
                  <Progress
                    value={file.progress}
                    className={`h-2 transition-all duration-700 ${
                      file.status === "done" ? "bg-emerald-500/20 [&>div]:bg-emerald-500" :
                      file.status === "error" ? "bg-destructive/20 [&>div]:bg-destructive" :
                      "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-purple-500"
                    }`}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-emerald-500/[0.02] px-5 py-3 animate-fade-up">
        <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">          100% Free &amp; Private.</span>{' '}
          No hidden costs. All features available to everyone. Built by{' '}
          <Link
            href="https://portfolio-website-nr8v.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-2 font-medium"
          >
            Habib Ul Haq
          </Link>.
        </p>
      </div>

      {lastUploadedId && !Object.values(uploading).some(u => u.status === "processing" || u.status === "uploading") && (
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent animate-scale-in">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">Document uploaded successfully!</p>
                <p className="text-sm text-muted-foreground">Your SOP is now indexed and ready for questions.</p>
              </div>
            </div>
            <Link href={`/chat?doc=${lastUploadedId}`} className="shrink-0">
              <Button className="shadow-sm gap-2 group">
                <MessageSquare className="h-4 w-4" />
                Start Chatting
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Your Documents ({documents.length})
          </CardTitle>
          {documents.length > 0 && (
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs hover:bg-primary/10">
                Chat with all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
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
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No documents uploaded yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Drop files above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between rounded-xl border bg-card/50 p-4 transition-all duration-200 hover:bg-card hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:scale-110 transition-transform duration-200">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.filename}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><FileType className="h-3 w-3" />{formatSize(doc.file_size)}</span>
                        {doc.page_count && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{doc.page_count} pages</span>}
                        {doc.chunks_count && <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3" />{doc.chunks_count} chunks</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.status === "processing" || doc.status === "queued" || doc.status === "extracting" || doc.status === "chunking" ? (
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
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDocument(doc.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
