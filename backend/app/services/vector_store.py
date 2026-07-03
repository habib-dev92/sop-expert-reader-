import os
import logging
import shutil
import uuid
from typing import List, Optional, Dict, Any
from langchain_chroma import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LangchainDocument
from chromadb import PersistentClient
from app.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    def __init__(self):
        self.persist_directory = settings.CHROMA_PERSIST_DIR
        os.makedirs(self.persist_directory, exist_ok=True)
        self.embeddings = self._get_embeddings()
        self.collection_name = settings.CHROMA_COLLECTION_NAME
        self.vectorstore = None
        self._ensure_collection_dimension()

    def _get_embedding_dimension(self) -> int:
        sample = self.embeddings.embed_query("dimension check")
        return len(sample)

    def _ensure_collection_dimension(self):
        db_path = os.path.join(self.persist_directory)
        sqlite_path = os.path.join(db_path, "chroma.sqlite3")
        if not os.path.exists(sqlite_path):
            return
        try:
            client = PersistentClient(path=db_path)
            collection = client.get_collection(self.collection_name)
            existing_dim = collection.metadata.get("embedding_dimension") if collection.metadata else None
            if existing_dim is None:
                count = collection.count()
                if count > 0:
                    existing_dim = len(collection.get(limit=1)["embeddings"][0])
            required_dim = self._get_embedding_dimension()
            if existing_dim is not None and existing_dim != required_dim:
                logger.warning(
                    f"Collection dimension mismatch: expected {required_dim}, got {existing_dim}. "
                    f"Recreating collection..."
                )
                client.delete_collection(self.collection_name)
                self.vectorstore = None
        except Exception as e:
            logger.warning(f"Dimension check failed, recreating collection: {e}")
            try:
                client = PersistentClient(path=db_path)
                client.delete_collection(self.collection_name)
                self.vectorstore = None
            except Exception:
                pass

    def _get_embeddings(self):
        return FastEmbedEmbeddings(
            model_name=settings.EMBEDDING_MODEL
        )

    def _get_vectorstore(self):
        if self.vectorstore is None:
            self.vectorstore = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory,
            )
        return self.vectorstore

    def split_text(self, text: str, metadata: Dict[str, Any]) -> List[LangchainDocument]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ".", " ", ""],
        )
        docs = text_splitter.create_documents([text], metadatas=[metadata])
        return docs

    def index_document(
        self,
        document_id: str,
        text: str,
        filename: str,
        page_count: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> int:
        try:
            metadata = {
                "document_id": document_id,
                "filename": filename,
                "page_count": page_count or 0,
                "source": filename,
                "user_id": user_id or "",
            }
            chunks = self.split_text(text, metadata)

            for i, chunk in enumerate(chunks):
                chunk.metadata["chunk_index"] = i
                chunk.metadata["chunk_count"] = len(chunks)

            vectorstore = self._get_vectorstore()
            vectorstore.add_documents(chunks)

            logger.info(
                f"Indexed document {filename} with {len(chunks)} chunks"
            )
            return len(chunks)
        except Exception as e:
            logger.error(f"Failed to index document: {e}")
            raise

    def similarity_search(
        self, query: str, k: int = None, filter: Optional[dict] = None
    ) -> List[LangchainDocument]:
        try:
            vectorstore = self._get_vectorstore()
            k = k or settings.RETRIEVER_K
            docs = vectorstore.similarity_search_with_score(query, k=k, filter=filter)
            return docs
        except Exception as e:
            logger.error(f"Failed to search: {e}")
            return []

    def delete_document(self, document_id: str, user_id: Optional[str] = None) -> bool:
        try:
            vectorstore = self._get_vectorstore()
            filter_dict = {"document_id": document_id}
            if user_id:
                filter_dict["user_id"] = user_id
            vectorstore.delete(filter=filter_dict)
            logger.info(f"Deleted document {document_id} from vector store")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            return False

    def delete_collection(self) -> bool:
        try:
            if os.path.exists(self.persist_directory):
                shutil.rmtree(self.persist_directory)
                os.makedirs(self.persist_directory, exist_ok=True)
            self.vectorstore = None
            logger.info("Deleted entire vector store collection")
            return True
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        try:
            vectorstore = self._get_vectorstore()
            collection = vectorstore._collection
            count = collection.count()
            return {
                "total_chunks": count,
                "collection_name": self.collection_name,
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {"total_chunks": 0, "collection_name": self.collection_name}


vector_store_service = VectorStoreService()
