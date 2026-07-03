export interface Document {
  id: string
  filename: string
  file_size: number
  file_type: string
  page_count: number | null
  status: string
  uploaded_at: string
  chunks_count: number | null
}

export interface UploadResponse {
  success: boolean
  message: string
  document: Document | null
}

export interface DeleteResponse {
  success: boolean
  message: string
}

export interface ListDocumentsResponse {
  documents: Document[]
  total: number
}

export interface ChatRequest {
  message: string
  conversation_id?: string
  model: string
}

export interface ChatResponse {
  answer: string
  references: Reference[]
  conversation_id: string
}

export interface Reference {
  file_name: string
  page_number: number | null
  section: string | null
  confidence_score: number
  text_snippet: string
}

export interface StreamToken {
  type: "token" | "done" | "answer" | "error"
  content: string
  references?: Reference[]
}

export interface SummarizeRequest {
  document_id: string
  model: string
}

export interface QuizRequest {
  document_id: string
  question_count: number
  model: string
}

export interface FlowchartRequest {
  document_id: string
  model: string
}

export interface SearchRequest {
  query: string
  document_id?: string
}

export interface SearchResult {
  content: string
  file_name: string
  page_number: number | null
  score: number
  document_id: string
  chunk_index: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  created_at: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  references?: Reference[]
  created_at: string
}

export interface FlowchartStep {
  step: number
  description: string
  decision: boolean
}
