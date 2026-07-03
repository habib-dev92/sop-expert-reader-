from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    file_type: str
    page_count: Optional[int] = None
    status: str
    uploaded_at: str
    chunks_count: Optional[int] = None


class UploadResponse(BaseModel):
    success: bool
    message: str
    document: Optional[DocumentResponse] = None


class DeleteRequest(BaseModel):
    document_id: str


class DeleteResponse(BaseModel):
    success: bool
    message: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    model: str = "llama3.2"


class ChatResponse(BaseModel):
    answer: str
    references: List[dict] = []
    conversation_id: str


class Reference(BaseModel):
    file_name: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    confidence_score: float
    text_snippet: str


class SummarizeRequest(BaseModel):
    document_id: str
    model: str = "llama3.2"


class QuizRequest(BaseModel):
    document_id: str
    question_count: int = 5
    model: str = "llama3.2"


class FlowchartRequest(BaseModel):
    document_id: str
    model: str = "llama3.2"


class SearchRequest(BaseModel):
    query: str
    document_id: Optional[str] = None


class SearchResponse(BaseModel):
    results: List[dict]
    total: int


class ProcessingStatus(BaseModel):
    document_id: str
    status: str
    progress: float
    message: str


class ListDocumentsResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 400


# ─── Auth Schemas ───────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    is_admin: bool = False
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: str
    reset_url: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None


# ─── Admin Schemas ──────────────────────────────────────

class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    is_admin: bool = False
    created_at: str
    documents_count: int = 0
    conversations_count: int = 0

class AdminStatsResponse(BaseModel):
    total_users: int
    total_documents: int
    total_conversations: int
    total_messages: int
    total_storage_bytes: int
    documents_processing: int
    documents_ready: int
    users_with_documents: int
    recent_users: List[AdminUserResponse] = []
    recent_documents: List[dict] = []
