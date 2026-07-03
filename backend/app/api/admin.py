import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.domain import User, Document, Conversation, Message
from app.models.schemas import AdminStatsResponse, AdminUserResponse
from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    total_messages = db.query(func.count(Message.id)).scalar() or 0
    total_storage = db.query(func.coalesce(func.sum(Document.file_size), 0)).scalar() or 0

    documents_processing = db.query(func.count(Document.id)).filter(
        Document.status.in_(["processing", "queued", "extracting", "chunking"])
    ).scalar() or 0
    documents_ready = db.query(func.count(Document.id)).filter(
        Document.status.in_(["processed", "ready"])
    ).scalar() or 0
    users_with_docs = db.query(func.count(func.distinct(Document.user_id))).scalar() or 0

    recent_users_raw = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    recent_users = []
    for u in recent_users_raw:
        doc_count = db.query(func.count(Document.id)).filter(Document.user_id == u.id).scalar() or 0
        conv_count = db.query(func.count(Conversation.id)).filter(Conversation.user_id == u.id).scalar() or 0
        recent_users.append(AdminUserResponse(
            id=u.id,
            email=u.email,
            name=u.name,
            is_admin=bool(u.is_admin),
            created_at=u.created_at.isoformat() if u.created_at else "",
            documents_count=doc_count,
            conversations_count=conv_count,
        ))

    recent_docs_raw = db.query(Document).order_by(Document.uploaded_at.desc()).limit(5).all()
    recent_documents = []
    for d in recent_docs_raw:
        user_email = db.query(User.email).filter(User.id == d.user_id).scalar() or "Unknown"
        recent_documents.append({
            "id": d.id,
            "filename": d.filename,
            "file_size": d.file_size,
            "status": d.status,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else "",
            "user_email": user_email,
        })

    return AdminStatsResponse(
        total_users=total_users,
        total_documents=total_documents,
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_storage_bytes=total_storage,
        documents_processing=documents_processing,
        documents_ready=documents_ready,
        users_with_documents=users_with_docs,
        recent_users=recent_users,
        recent_documents=recent_documents,
    )


@router.get("/users")
def list_users(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        doc_count = db.query(func.count(Document.id)).filter(Document.user_id == u.id).scalar() or 0
        conv_count = db.query(func.count(Conversation.id)).filter(Conversation.user_id == u.id).scalar() or 0
        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "is_admin": bool(u.is_admin),
            "created_at": u.created_at.isoformat() if u.created_at else "",
            "documents_count": doc_count,
            "conversations_count": conv_count,
        })
    return {"users": result, "total": len(result)}


@router.get("/documents")
def list_all_documents(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    result = []
    for d in docs:
        user_email = db.query(User.email).filter(User.id == d.user_id).scalar() or "Unknown"
        result.append({
            "id": d.id,
            "filename": d.filename,
            "file_size": d.file_size,
            "file_type": d.file_type,
            "page_count": d.page_count,
            "status": d.status,
            "chunks_count": d.chunks_count,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else "",
            "user_email": user_email,
        })
    return {"documents": result, "total": len(result)}
