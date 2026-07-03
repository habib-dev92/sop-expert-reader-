"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { api } from "@/services/api"
import {
  Send, Bot, User, Trash2, Loader2, FileText,
  Lightbulb, StopCircle, AlertCircle, WifiOff,
  Sparkles, BookOpen, ChevronDown,
} from "lucide-react"
import type { Message, Reference } from "@/types"

const SUGGESTED_QUESTIONS = [
  "Summarize the key procedures from this SOP",
  "What are the main steps in this process?",
  "What safety precautions are mentioned?",
  "List the responsibilities of each role",
]

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Fast & affordable" },
  { value: "gpt-4o", label: "GPT-4o", desc: "Most capable" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", desc: "Strong reasoning" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", desc: "Legacy fast" },
]

function TypingDots() {
  return (
    <span className="inline-flex gap-1 ml-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "200ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "400ms" }} />
    </span>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [model, setModel] = useState("gpt-4o-mini")
  const [streamingContent, setStreamingContent] = useState("")
  const [streamingRefs, setStreamingRefs] = useState<Reference[]>([])
  const [statusMessage, setStatusMessage] = useState("")
  const [hasDocs, setHasDocs] = useState<boolean | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  useEffect(() => {
    checkBackend()
  }, [])

  async function checkBackend() {
    try {
      await api.health()
      setBackendOnline(true)
      const res = await api.listDocuments()
      setHasDocs(res.total > 0)
    } catch {
      setBackendOnline(false)
      setHasDocs(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function sendMessage(question?: string) {
    const text = question || input
    if (!text.trim() || isStreaming) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsStreaming(true)
    setStreamingContent("")
    setStreamingRefs([])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let fullContent = ""

      setStatusMessage("Searching your documents...")

      await api.chatStream(
        text, model, undefined,
        (token) => {
          setStatusMessage("")
          fullContent += token
          setStreamingContent(fullContent)
        },
        (content, references) => {
          setStatusMessage("")
          setStreamingContent(content)
          setStreamingRefs(references || [])
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content,
            references: references || [],
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMsg])
          setStreamingContent("")
          setStreamingRefs([])
          setIsStreaming(false)
        },
        async (error: any) => {
          setIsStreaming(false)
          console.warn("Streaming failed, fallback to non-streaming:", error)
          try {
            setStatusMessage("Processing your question...")
            const fallbackRes = await api.chat(text, model)
            setStatusMessage("")
            const assistantMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: fallbackRes.answer,
              references: fallbackRes.references || [],
              created_at: new Date().toISOString(),
            }
            setMessages(prev => [...prev, assistantMsg])
          } catch (fallbackErr: any) {
            setStatusMessage(`Backend error: ${fallbackErr.message}`)
          }
        },
        (status: string) => {
          if (status === "searching") setStatusMessage("Searching your documents...")
          else if (status === "thinking") setStatusMessage("Generating answer...")
        },
      )
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setStatusMessage(`Backend error: ${err.message}`)
        console.error("Chat error:", err)
      }
      setIsStreaming(false)
    }
  }

  function stopStreaming() {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStatusMessage("")
    if (streamingContent) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: streamingContent,
        references: streamingRefs,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    }
    setStreamingContent("")
    setStreamingRefs([])
  }

  function clearChat() {
    setMessages([])
    setStreamingContent("")
    setStreamingRefs([])
    setStatusMessage("")
  }

  if (backendOnline === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-24 animate-fade-up">
        <div className="mx-auto max-w-md text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Backend Not Reachable</h2>
          <p className="text-sm text-muted-foreground">
            The FastAPI backend is not running. Start it with:
          </p>
          <div className="rounded-xl bg-muted p-4 text-left text-sm font-mono border shadow-sm">
            <span className="text-primary">cd backend</span><br />
            <span className="text-primary">uvicorn app.main:app --reload --port 8000</span>
          </div>
          <Button variant="outline" size="sm" onClick={checkBackend} className="mt-2">Retry Connection</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col animate-fade-up">
      <div className="flex items-start justify-between pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            AI Chat
          </div>
          <h1 className="text-xl font-bold tracking-tight">Chat with SOP</h1>
          <p className="text-sm text-muted-foreground">Ask questions about your uploaded documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={(v) => v && setModel(v)}>
            <SelectTrigger className="w-44 h-9 text-sm shadow-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex flex-col">
                    <span>{m.label}</span>
                    <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            title="Clear chat"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 rounded-2xl border bg-card scrollbar-thin shadow-xs">
        <div className="space-y-5 p-5">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Ask anything about your SOPs</h2>
              <p className="mt-2 mb-8 text-sm text-muted-foreground max-w-md text-center leading-relaxed">
                {hasDocs === false
                  ? "No documents found. Upload an SOP first to start asking questions."
                  : "The AI answers only from your uploaded documents. Zero hallucination."
                }
              </p>
              {hasDocs !== false && (
                <div className="grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <Button
                      key={q}
                      variant="outline"
                      className="justify-start text-left text-sm h-auto py-3 px-3.5 hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-[0.98]"
                      onClick={() => sendMessage(q)}
                    >
                      <Lightbulb className="mr-2 h-4 w-4 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                      <span className="line-clamp-2">{q}</span>
                    </Button>
                  ))}
                </div>
              )}
              {hasDocs !== false && (
                <p className="mt-8 text-xs text-muted-foreground/50">
                  Free to use. Built by{' '}
                  <Link
                    href="https://portfolio-website-nr8v.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/60 hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Habib Ul Haq
                  </Link>
                </p>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: "0ms" }}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-sm">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[82%] space-y-3 px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-md shadow-primary/20"
                  : "bg-muted/80 rounded-2xl rounded-tl-sm border border-border/50 shadow-sm"
              }`}>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-a:text-primary prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:shadow-xs prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-strong:text-foreground prose-li:marker:text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.references && msg.references.length > 0 && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3" />
                      References
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.references.map((ref, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-lg bg-background/80 px-2.5 py-1.5 text-xs border shadow-xs hover:bg-background hover:shadow-sm hover:border-primary/20 transition-all"
                        >
                          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate max-w-[120px]">{ref.file_name}</span>
                          {ref.page_number && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none">p.{ref.page_number}</Badge>
                          )}
                          {ref.confidence_score > 0 && (
                            <span className="text-muted-foreground">{Math.round(ref.confidence_score * 100)}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3 animate-fade-up">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-sm">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[82%] space-y-3 rounded-2xl rounded-tl-sm bg-muted/80 border border-border/50 px-4 py-3 shadow-sm">
                {streamingContent ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                ) : statusMessage.startsWith("Backend error") ? (
                  <div className="flex items-center gap-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {statusMessage}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    {statusMessage || "Thinking"}
                    <TypingDots />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex items-end gap-2 pt-4">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 132)}px`
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={isStreaming ? "Waiting for response..." : "Ask a question about your SOP..."}
            className={`min-h-[52px] max-h-32 resize-none pr-12 rounded-xl bg-card border-border/60 focus-visible:ring-primary/30 text-sm transition-all duration-200 ${
              inputFocused ? "border-primary/40 shadow-md shadow-primary/5" : "shadow-xs"
            }`}
            rows={1}
            disabled={isStreaming}
          />
        </div>
        {isStreaming ? (
          <Button
            variant="outline"
            size="icon"
            onClick={stopStreaming}
            className="h-[52px] w-[52px] shrink-0 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all active:scale-95"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="h-[52px] w-[52px] shrink-0 rounded-xl shadow-sm transition-all hover:shadow-md hover:shadow-primary/20 disabled:opacity-50 active:scale-95"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
