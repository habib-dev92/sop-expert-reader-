import json
import logging
import threading
import os
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import (
    UploadResponse, DocumentResponse, DeleteRequest, DeleteResponse,
    ChatRequest, ChatResponse, ListDocumentsResponse, SearchRequest,
    SearchResponse, SummarizeRequest, QuizRequest, FlowchartRequest,
    ErrorResponse,
)
from app.models.domain import Document as DocumentModel
from app.services.document_processor import extract_text, validate_file_extension
from app.services.vector_store import vector_store_service
from app.services.chat_service import chat_service
from app.config import settings
from app.api.auth import get_current_user
from app.models.domain import User

logger = logging.getLogger(__name__)

router = APIRouter()

processing_status: Dict[str, str] = {}


def process_document_background(
    file_id: str,
    file_path: str,
    filename: str,
    file_ext: str,
    user_id: str,
) -> None:
    db = next(get_db())
    try:
        processing_status[file_id] = "extracting"
        text, page_count = extract_text(file_path, file_ext)

        processing_status[file_id] = "chunking"
        chunks_count = vector_store_service.index_document(
            document_id=file_id,
            text=text,
            filename=filename,
            page_count=page_count,
            user_id=user_id,
        )

        processing_status[file_id] = "ready"
        doc = db.query(DocumentModel).filter(DocumentModel.id == file_id).first()
        if doc:
            doc.status = "processed"
            doc.chunks_count = chunks_count
            doc.page_count = page_count
            doc.processed_at = datetime.utcnow()
            db.commit()

        logger.info(f"Background processing complete for {filename} ({chunks_count} chunks)")
    except Exception as e:
        processing_status[file_id] = f"error: {str(e)}"
        doc = db.query(DocumentModel).filter(DocumentModel.id == file_id).first()
        if doc:
            doc.status = f"error: {str(e)}"
            db.commit()
        logger.error(f"Background processing failed for {filename}: {e}")
    finally:
        db.close()


def _find_file_by_id(doc_id: str) -> Optional[str]:
    upload_dir = settings.UPLOAD_DIR
    if not os.path.exists(upload_dir):
        return None
    for fname in os.listdir(upload_dir):
        stem = os.path.splitext(fname)[0]
        if stem == doc_id or fname.startswith(doc_id + "_") or fname.startswith(doc_id + "."):
            fpath = os.path.join(upload_dir, fname)
            if os.path.isfile(fpath):
                return fpath
    return None


@router.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if not validate_file_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported: {', '.join(settings.SUPPORTED_EXTENSIONS)}",
            )

        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB",
            )

        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1].lower()
        original_stem = os.path.splitext(file.filename)[0]
        safe_stem = "".join(c for c in original_stem if c.isalnum() or c in " _.-").strip() or "untitled"
        safe_filename = f"{file_id}_{safe_stem}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)

        doc = DocumentModel(
            id=file_id,
            user_id=current_user.id,
            filename=file.filename,
            file_path=safe_filename,
            file_size=file_size,
            file_type=file_ext,
            status="processing",
        )
        db.add(doc)
        db.commit()

        processing_status[file_id] = "queued"

        thread = threading.Thread(
            target=process_document_background,
            args=(file_id, file_path, file.filename, file_ext, current_user.id),
            daemon=True,
        )
        thread.start()

        return UploadResponse(
            success=True,
            message="Document upload started. Processing in background.",
            document=DocumentResponse(
                id=file_id,
                filename=file.filename,
                file_size=file_size,
                file_type=file_ext,
                status="processing",
                uploaded_at=datetime.utcnow().isoformat(),
                chunks_count=0,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/upload-status/{document_id}")
async def get_upload_status(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    status_val = processing_status.get(document_id, "unknown")
    return {"document_id": document_id, "status": status_val}


@router.delete("/delete", response_model=DeleteResponse)
async def delete_document(
    request: DeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        doc = db.query(DocumentModel).filter(
            DocumentModel.id == request.document_id,
            DocumentModel.user_id == current_user.id,
        ).first()

        if not doc:
            return DeleteResponse(success=False, message="Document not found")

        vector_store_service.delete_document(request.document_id, current_user.id)

        file_path = _find_file_by_id(request.document_id)
        if file_path:
            os.remove(file_path)

        db.delete(doc)
        db.commit()

        return DeleteResponse(success=True, message="Document deleted successfully")
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/list", response_model=ListDocumentsResponse)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        docs = db.query(DocumentModel).filter(
            DocumentModel.user_id == current_user.id,
        ).order_by(DocumentModel.uploaded_at.desc()).all()

        result = []
        for doc in docs:
            proc_status = doc.status
            if proc_status == "ready":
                proc_status = "processed"
            if doc.id in processing_status:
                ps = processing_status[doc.id]
                if ps == "ready":
                    proc_status = "processed"
                elif ps != "processed":
                    proc_status = ps

            result.append(DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                file_type=doc.file_type,
                page_count=doc.page_count,
                status=proc_status,
                uploaded_at=doc.uploaded_at.isoformat() if doc.uploaded_at else "",
                chunks_count=doc.chunks_count,
            ))

        return ListDocumentsResponse(documents=result, total=len(result))
    except Exception as e:
        logger.error(f"List error: {e}")
        raise HTTPException(status_code=500, detail=f"List failed: {str(e)}")


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = await chat_service.chat(
            message=request.message,
            conversation_history=None,
            model=request.model,
            user_id=current_user.id,
        )

        return ChatResponse(
            answer=result["answer"],
            references=result["references"],
            conversation_id=request.conversation_id or str(uuid.uuid4()),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return StreamingResponse(
            chat_service.chat_stream(
                message=request.message,
                conversation_history=None,
                model=request.model,
                user_id=current_user.id,
            ),
            media_type="text/event-stream",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat stream error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat stream failed: {str(e)}")


@router.post("/summarize")
async def summarize(
    request: SummarizeRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        summary = await chat_service.summarize(
            document_id=request.document_id,
            model=request.model,
            user_id=current_user.id,
        )
        return {"summary": summary}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=f"Summarize failed: {str(e)}")


@router.post("/quiz")
async def generate_quiz(
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        quiz = await chat_service.generate_quiz(
            document_id=request.document_id,
            question_count=request.question_count,
            model=request.model,
            user_id=current_user.id,
        )
        return {"quiz": quiz}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz error: {e}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


@router.post("/flowchart")
async def generate_flowchart(
    request: FlowchartRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        flowchart_data = await chat_service.generate_flowchart_data(
            document_id=request.document_id,
            model=request.model,
            user_id=current_user.id,
        )
        data = json.loads(flowchart_data)
        return {"flowchart": data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flowchart error: {e}")
        raise HTTPException(status_code=500, detail=f"Flowchart generation failed: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        filter_dict = {"user_id": current_user.id}
        if request.document_id:
            filter_dict["document_id"] = request.document_id

        docs_with_scores = vector_store_service.similarity_search(
            request.query, k=10, filter=filter_dict
        )

        results = []
        for doc, score in docs_with_scores:
            results.append({
                "content": doc.page_content[:300] + "...",
                "file_name": doc.metadata.get("filename", "Unknown"),
                "page_number": doc.metadata.get("page_number"),
                "score": round(float(score), 4),
                "document_id": doc.metadata.get("document_id", ""),
                "chunk_index": doc.metadata.get("chunk_index", 0),
            })

        return SearchResponse(results=results, total=len(results))
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
