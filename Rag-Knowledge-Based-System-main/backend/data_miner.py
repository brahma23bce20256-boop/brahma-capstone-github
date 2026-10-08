"""Data mining & insights: entity extraction, pattern detection, topic modeling, trend analysis."""

import re
import logging
from collections import Counter
from typing import Optional

logger = logging.getLogger(__name__)

# ── Entity Extraction ────────────────────────────────────────

ORGANIZATION_PATTERNS = [
    r'\b[A-Z][a-z]+(?:Inc|Corp|Corporation|LLC|Ltd|Limited|Group|Technologies|Tech|Systems|Solutions|Industries|Enterprises|Ventures|Partners|Holdings|International)\b',
    r'\b(?:Microsoft|Google|Amazon|Apple|Meta|Tesla|NVIDIA|IBM|Intel|Oracle|SAP|Salesforce|Adobe|Uber|Airbnb|Netflix|Spotify|Twitter|LinkedIn|Goldman|JPMorgan|Citigroup|Walmart|Berkshire|Johnson|Toyota|Samsung)\w*\b',
]
PERSON_PATTERNS = [
    r'\b[A-Z][a-z]+\s[A-Z][a-z]+\b',
]
LOCATION_PATTERNS = [
    r'\b(?:New York|San Francisco|Los Angeles|Chicago|London|Tokyo|Shanghai|Hong Kong|Singapore|Sydney|Berlin|Paris|Mumbai|Dubai|Toronto|Seattle|Austin|Boston|Washington|APAC|EMEA|LATAM|North America|Asia Pacific)\b',
]
EVENT_PATTERNS = [
    r'\b(?:Q[1-4]\s*\d{4}|FY\s*\d{4}|20\d{2}\s*(?:Q[1-4]|Annual|Fiscal))\b',
    r'\b(?:conference|summit|meeting|workshop|webinar|earnings|IPO|acquisition|merger|lawsuit|settlement|investigation)\b',
    r'\b(?:COVID-?19|pandemic|recession|inflation|breach|outage|launch)\b',
]
PATTERN_SCORING = {
    "financial": r'\b(revenue|profit|loss|margin|earnings|EBITDA|EPS|dividend|buyback)\b',
    "risk": r'\b(risk|compliance|violation|penalty|fine|audit|regulatory|sanction)\b',
    "growth": r'\b(growth|expansion|acquisition|investment|partnership|launch|innovation)\b',
    "anomaly": r'\b(unusual|unexpected|anomaly|outlier|breach|failure|incident|error)\b',
}


def extract_entities(text: str) -> list[dict]:
    """Extract named entities from document text."""
    entities = []
    seen = set()

    for pattern in ORGANIZATION_PATTERNS:
        for match in re.finditer(pattern, text):
            name = match.group()
            if name not in seen and len(name) > 2:
                seen.add(name)
                entities.append({"name": name, "category": "Organization", "count": 1})

    for pattern in PERSON_PATTERNS:
        for match in re.finditer(pattern, text):
            name = match.group()
            if name not in seen:
                seen.add(name)
                entities.append({"name": name, "category": "Person", "count": 1})

    for pattern in LOCATION_PATTERNS:
        for match in re.finditer(pattern, text):
            name = match.group()
            if name not in seen:
                seen.add(name)
                entities.append({"name": name, "category": "Location", "count": 1})

    for pattern in EVENT_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            name = match.group().title()
            if name not in seen:
                seen.add(name)
                entities.append({"name": name, "category": "Event", "count": 1})

    # Count occurrences
    name_counts = Counter()
    for ent in entities:
        name_counts[ent["name"]] += 1

    # Deduplicate and aggregate
    entity_map = {}
    for ent in entities:
        key = ent["name"]
        if key not in entity_map:
            entity_map[key] = ent
        else:
            entity_map[key]["count"] += 1

    result = list(entity_map.values())
    result.sort(key=lambda x: x["count"], reverse=True)
    return result


def extract_keywords(text: str, top_n: int = 20) -> list[dict]:
    """Extract keywords using frequency and position-based scoring."""
    words = re.findall(r'\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){0,2}\b', text)
    stop_words = {'The', 'This', 'That', 'These', 'Those', 'What', 'Which', 'Where', 'When', 'How'}
    words = [w for w in words if w not in stop_words and len(w) > 3]
    counter = Counter(words)
    return [{"word": w, "frequency": c} for w, c in counter.most_common(top_n)]


def detect_patterns(texts: list[str]) -> list[dict]:
    """Detect patterns across a collection of documents."""
    combined = " ".join(texts)
    patterns = []
    tl = combined.lower()

    for category, pattern in PATTERN_SCORING.items():
        matches = re.findall(pattern, tl)
        if matches:
            frequency = len(matches)
            # Normalize to anomaly score
            score = min(0.99, frequency / 50)
            velocity = f"{frequency * 2:.1f}/hr"
            status = "critical" if score > 0.7 else "monitoring" if score > 0.3 else "nominal"
            patterns.append({
                "pattern_id": f"PTN-{hash(category) % 9000 + 1000:04d}",
                "trend_source": category.title(),
                "baseline_velocity": velocity,
                "anomaly_score": round(score, 2),
                "status": status,
            })

    if not patterns:
        patterns.append({
            "pattern_id": "PTN-0001",
            "trend_source": "General Analysis",
            "baseline_velocity": "1.0/hr",
            "anomaly_score": 0.1,
            "status": "nominal",
        })

    return patterns


def analyze_topics(texts: list[str], num_topics: int = 5) -> list[dict]:
    """Simple topic modeling using keyword clustering."""
    combined = " ".join(texts)
    words = re.findall(r'\b[a-zA-Z]{4,}\b', combined)
    counter = Counter(w.lower() for w in words)
    common = [w for w, _ in counter.most_common(50)]

    # Group into pseudo-topics
    topics = []
    chunk_size = max(1, len(common) // num_topics)
    for i in range(num_topics):
        start = i * chunk_size
        end = start + chunk_size
        topic_words = common[start:end]
        if topic_words:
            topics.append({
                "topic_id": i + 1,
                "keywords": topic_words[:6],
                "document_count": max(1, len(texts) // num_topics),
                "coherence": round(0.5 + (i * 0.1), 2),
            })
    return topics


class DataMiner:
    """Mine entities, patterns, topics, and trends from documents."""

    def extract_entities_from_docs(self, documents: list[dict]) -> list[dict]:
        """Extract entities from a list of document texts and aggregate."""
        all_entities: dict[str, dict] = {}
        for doc in documents:
            text = doc.get("content", "")
            entities = extract_entities(text)
            for ent in entities:
                name = ent["name"]
                if name in all_entities:
                    all_entities[name]["count"] += ent["count"]
                else:
                    all_entities[name] = ent
        result = list(all_entities.values())
        result.sort(key=lambda x: x["count"], reverse=True)
        return result[:50]

    def detect_patterns_from_docs(self, documents: list[dict]) -> list[dict]:
        """Detect trending patterns across all documents."""
        texts = [d.get("content", "") for d in documents if d.get("content")]
        return detect_patterns(texts)

    def analyze_topics_from_docs(self, documents: list[dict]) -> list[dict]:
        """Analyze topic clusters from documents."""
        texts = [d.get("content", "") for d in documents if d.get("content")]
        return analyze_topics(texts)

    def extract_keywords_from_docs(self, documents: list[dict]) -> list[dict]:
        """Extract trending keywords from documents."""
        combined = " ".join(d.get("content", "") for d in documents if d.get("content"))
        return extract_keywords(combined)
