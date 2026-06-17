"""
Sentence Transformers embedding utility.
Uses 'all-MiniLM-L6-v2' — lightweight (80MB), fast, great semantic similarity.
Gracefully handles ImportError for Python 3.14 compatibility.
"""
from typing import List

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    import threading

    _model_lock = threading.Lock()
    _model_instance = None

    def get_model() -> SentenceTransformer:
        """Lazy-load the embedding model (singleton)."""
        global _model_instance
        if _model_instance is None:
            with _model_lock:
                if _model_instance is None:
                    _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
        return _model_instance

    def embed_texts(texts: List[str]):
        """Embed a list of strings into dense vectors. Returns shape (n, 384)."""
        model = get_model()
        return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

    def cosine_similarity_score(a: str, b: str) -> float:
        """Compute cosine similarity between two strings. Returns 0.0–1.0."""
        vecs = embed_texts([a, b])
        return float(np.dot(vecs[0], vecs[1]))

    def batch_similarity(query: str, candidates: List[str]) -> List[float]:
        """Return cosine similarity scores between query and each candidate."""
        vecs = embed_texts([query] + candidates)
        query_vec = vecs[0]
        return [float(np.dot(query_vec, c)) for c in vecs[1:]]

except ImportError:
    # Graceful fallback — embeddings not available
    def get_model():
        raise ImportError("sentence-transformers not installed")

    def embed_texts(texts: List[str]):
        raise ImportError("sentence-transformers not installed")

    def cosine_similarity_score(a: str, b: str) -> float:
        return 0.0

    def batch_similarity(query: str, candidates: List[str]) -> List[float]:
        return [0.0] * len(candidates)
