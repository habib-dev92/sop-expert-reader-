import logging
from typing import List, Optional
from langchain_community.embeddings import FastEmbedEmbeddings
from app.config import settings

logger = logging.getLogger(__name__)


def get_embeddings(model_name: Optional[str] = None):
    model = model_name or settings.EMBEDDING_MODEL
    try:
        embeddings = FastEmbedEmbeddings(
            model_name=model
        )
        return embeddings
    except Exception as e:
        logger.error(f"Failed to create embeddings: {e}")
        raise


def generate_embedding(text: str) -> List[float]:
    embeddings = get_embeddings()
    try:
        result = embeddings.embed_query(text)
        return result
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    embeddings = get_embeddings()
    try:
        results = embeddings.embed_documents(texts)
        return results
    except Exception as e:
        logger.error(f"Failed to generate batch embeddings: {e}")
        raise
