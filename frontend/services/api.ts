/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("auth_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("auth_token")
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `API Error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  health: () => fetchAPI<{ status: string }>("/api/health"),

  upload: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const url = `${API_BASE_URL}/api/upload`
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    })
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("auth_token")
        if (typeof window !== "undefined") window.location.href = "/login"
      }
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail || "Upload failed")
    }
    return res.json()
  },

  deleteDoc: (document_id: string) =>
    fetchAPI<{ success: boolean; message: string }>("/api/delete", {
      method: "DELETE",
      body: JSON.stringify({ document_id }),
    }),

  listDocuments: () =>
    fetchAPI<{ documents: any[]; total: number }>("/api/list"),

  uploadStatus: (document_id: string) =>
    fetchAPI<{ document_id: string; status: string }>(`/api/upload-status/${document_id}`),

  chat: (message: string, model: string = "gpt-4o-mini", conversation_id?: string) =>
    fetchAPI<{ answer: string; references: any[]; conversation_id: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, model, conversation_id }),
    }),

  chatStream: async (
    message: string,
    model: string = "gpt-4o-mini",
    conversation_id?: string,
    onToken?: (token: string) => void,
    onDone?: (content: string, references: any[]) => void,
    onError?: (error: string) => void,
    onStatus?: (status: string) => void,
  ) => {
    const url = `${API_BASE_URL}/api/chat/stream`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ message, model, conversation_id }),
    })

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("auth_token")
        if (typeof window !== "undefined") window.location.href = "/login"
      }
      const error = await res.json().catch(() => ({ detail: "Stream error" }))
      onError?.(error.detail || "Stream error")
      return
    }

    const reader = res.body?.getReader()
    if (!reader) {
      onError?.("No response body")
      return
    }

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let depth = 0
      let start = -1
      for (let i = 0; i < buffer.length; i++) {
        const ch = buffer[i]
        if (ch === "{") {
          if (depth === 0) start = i
          depth++
        } else if (ch === "}") {
          depth--
          if (depth === 0 && start !== -1) {
            const jsonStr = buffer.slice(start, i + 1)
            start = -1
            try {
              const data = JSON.parse(jsonStr)
              if (data.type === "token") {
                onToken?.(data.content)
              } else if (data.type === "done") {
                onDone?.(data.content, data.references || [])
              } else if (data.type === "answer") {
                onDone?.(data.content, [])
              } else if (data.type === "error") {
                onError?.(data.content)
              } else if (data.type === "status") {
                onStatus?.(data.content)
              }
            } catch {
              // invalid JSON, skip
            }
          }
        }
      }
      if (start !== -1) {
        buffer = buffer.slice(start)
      } else {
        buffer = ""
      }
    }
  },

  summarize: (document_id: string, model: string = "gpt-4o-mini") =>
    fetchAPI<{ summary: string }>("/api/summarize", {
      method: "POST",
      body: JSON.stringify({ document_id, model }),
    }),

  quiz: (document_id: string, question_count: number = 5, model: string = "gpt-4o-mini") =>
    fetchAPI<{ quiz: string }>("/api/quiz", {
      method: "POST",
      body: JSON.stringify({ document_id, question_count, model }),
    }),

  flowchart: (document_id: string, model: string = "gpt-4o-mini") =>
    fetchAPI<{ flowchart: any[] }>("/api/flowchart", {
      method: "POST",
      body: JSON.stringify({ document_id, model }),
    }),

  search: (query: string, document_id?: string) =>
    fetchAPI<{ results: any[]; total: number }>("/api/search", {
      method: "POST",
      body: JSON.stringify({ query, document_id }),
    }),
}
