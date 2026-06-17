"""
Skill matching with graceful fallback strategy:
1. Try Sentence Transformers + scikit-learn (best quality)
2. Fall back to fuzzy string matching (pure Python, no deps)

This ensures compatibility with Python 3.14 where some wheels may be unavailable.
"""
from typing import List, Tuple, Dict
import re

# Try to import ML dependencies - graceful fallback if unavailable
try:
    from app.ai.embeddings import embed_texts
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

# Common role → required skills mapping for ATS scoring
ROLE_SKILLS_MAP: Dict[str, List[str]] = {
    "software engineer": [
        "Python", "Java", "JavaScript", "TypeScript", "REST API", "SQL",
        "Git", "Docker", "CI/CD", "Data Structures", "Algorithms",
        "System Design", "Microservices", "Agile"
    ],
    "data scientist": [
        "Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "scikit-learn", "SQL", "Pandas", "NumPy", "Data Visualization",
        "Statistics", "Feature Engineering", "NLP", "A/B Testing"
    ],
    "machine learning engineer": [
        "Python", "PyTorch", "TensorFlow", "MLOps", "Docker", "Kubernetes",
        "REST API", "Feature Engineering", "Model Deployment", "SQL",
        "Spark", "Airflow", "CI/CD", "System Design"
    ],
    "frontend developer": [
        "React", "Vue", "TypeScript", "JavaScript", "HTML", "CSS",
        "REST API", "Git", "Responsive Design", "Testing", "Performance Optimization"
    ],
    "backend developer": [
        "Python", "Java", "Node.js", "REST API", "SQL", "NoSQL",
        "Docker", "Redis", "System Design", "Git", "CI/CD"
    ],
    "full stack developer": [
        "React", "Node.js", "Python", "SQL", "REST API", "Docker",
        "JavaScript", "TypeScript", "Git", "AWS", "MongoDB"
    ],
    "devops engineer": [
        "Docker", "Kubernetes", "Terraform", "AWS", "CI/CD", "Linux",
        "Python", "Ansible", "Monitoring", "Git", "Networking"
    ],
    "data analyst": [
        "SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics",
        "Data Visualization", "Pandas", "R", "ETL"
    ],
}


def get_role_skills(role: str) -> List[str]:
    """Return the skills list for a role, falling back to a generic list."""
    role_lower = role.lower().strip()
    for key, skills in ROLE_SKILLS_MAP.items():
        if key in role_lower or role_lower in key:
            return skills
    return [
        "Communication", "Problem Solving", "Teamwork", "Python",
        "SQL", "Git", "REST API", "Documentation", "Agile"
    ]


def _normalize(text: str) -> str:
    """Normalize text for fuzzy matching."""
    return re.sub(r"[^a-z0-9 ]", "", text.lower().strip())


def _fuzzy_match(skill_a: str, skill_b: str) -> float:
    """Simple token overlap ratio for skill matching (fallback)."""
    a_tokens = set(_normalize(skill_a).split())
    b_tokens = set(_normalize(skill_b).split())
    if not a_tokens or not b_tokens:
        return 0.0
    # Jaccard similarity
    intersection = a_tokens & b_tokens
    union = a_tokens | b_tokens
    return len(intersection) / len(union)


def _semantic_match(
    resume_skills: List[str],
    required_skills: List[str],
    threshold: float = 0.55,
) -> Tuple[List[str], List[str], float]:
    """Match using Sentence Transformers + cosine similarity."""
    resume_vecs = embed_texts(resume_skills)
    required_vecs = embed_texts(required_skills)
    sim_matrix = cosine_similarity(required_vecs, resume_vecs)
    matched, missing = [], []
    for i, req_skill in enumerate(required_skills):
        best_score = float(np.max(sim_matrix[i]))
        if best_score >= threshold:
            matched.append(req_skill)
        else:
            missing.append(req_skill)
    ratio = len(matched) / len(required_skills) if required_skills else 0.0
    return matched, missing, ratio


def _fuzzy_match_skills(
    resume_skills: List[str],
    required_skills: List[str],
    threshold: float = 0.4,
) -> Tuple[List[str], List[str], float]:
    """Match using fuzzy string overlap (pure Python fallback)."""
    matched, missing = [], []
    for req_skill in required_skills:
        best = max(_fuzzy_match(req_skill, rs) for rs in resume_skills) if resume_skills else 0.0
        if best >= threshold:
            matched.append(req_skill)
        else:
            missing.append(req_skill)
    ratio = len(matched) / len(required_skills) if required_skills else 0.0
    return matched, missing, ratio


def match_skills(
    resume_skills: List[str],
    required_skills: List[str],
    threshold: float = 0.55,
) -> Tuple[List[str], List[str], float]:
    """Match resume skills against required skills with auto-fallback."""
    if not resume_skills or not required_skills:
        return [], required_skills, 0.0

    if ML_AVAILABLE:
        try:
            return _semantic_match(resume_skills, required_skills, threshold)
        except Exception:
            pass

    return _fuzzy_match_skills(resume_skills, required_skills, threshold)


def score_resume_for_role(
    resume_skills: List[str],
    role: str,
    job_description: str = "",
) -> Dict:
    """Full ATS scoring pipeline."""
    required_skills = get_role_skills(role)

    if job_description:
        from app.ai.llm_client import llm_client
        try:
            jd_skills = llm_client.chat_json([
                {"role": "system", "content": "Extract a JSON array of technical skills from the job description. Return only the JSON array."},
                {"role": "user", "content": job_description[:1000]}
            ])
            if isinstance(jd_skills, list):
                required_skills = list(set(required_skills + jd_skills))
        except Exception:
            pass

    matched, missing, ratio = match_skills(resume_skills, required_skills)
    ats_score = min(100.0, round(ratio * 100, 1))

    return {
        "score": ats_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "required_skills": required_skills,
        "match_ratio": ratio,
        "method": "semantic" if ML_AVAILABLE else "fuzzy",
    }
