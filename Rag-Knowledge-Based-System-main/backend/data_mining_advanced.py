"""Advanced Data Mining Algorithms for Semester Project.

1. Association Rule Mining (Apriori)
2. Document Clustering (K-Means + TF-IDF)
3. Sentiment Analysis (Lexicon-based)
"""

import re
import math
import logging
from collections import Counter, defaultdict
from itertools import combinations
from typing import Optional

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# 1. ASSOCIATION RULE MINING (APRIORI)
# ═══════════════════════════════════════════════════════════════

def _tokenize_text(text: str) -> list[str]:
    """Extract meaningful tokens/entities from text."""
    tokens = set()
    # Extract capitalized multi-word entities
    for m in re.finditer(r'\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){0,2}\b', text):
        tokens.add(m.group().strip())
    # Extract key terms
    for m in re.finditer(r'\b[a-z]{4,}\b', text.lower()):
        tokens.add(m.group())
    # Remove common stopwords
    stops = {'this', 'that', 'these', 'those', 'with', 'from', 'have', 'been', 'were', 'they', 'their'}
    tokens = {t for t in tokens if t not in stops}
    return list(tokens)[:30]


def apriori_mining(texts: list[str], min_support: float = 0.2, min_confidence: float = 0.5) -> dict:
    """Run Apriori algorithm to find frequent itemsets and association rules.

    Args:
        texts: List of document texts (each treated as a transaction)
        min_support: Minimum support threshold (0.0-1.0)
        min_confidence: Minimum confidence for rules (0.0-1.0)

    Returns:
        dict with frequent_itemsets and association_rules
    """
    n_docs = len(texts)
    if n_docs < 2:
        return {"frequent_itemsets": [], "association_rules": [], "n_transactions": n_docs}

    # Step 1: Build transactions
    transactions = []
    for text in texts:
        tokens = _tokenize_text(text)
        if tokens:
            transactions.append(set(tokens))

    if len(transactions) < 2:
        return {"frequent_itemsets": [], "association_rules": [], "n_transactions": n_docs}

    n_trans = len(transactions)

    # Step 2: Find frequent 1-itemsets
    item_counts = Counter()
    for txn in transactions:
        item_counts.update(txn)

    min_count = max(1, int(n_trans * min_support))
    freq_items = {item: count for item, count in item_counts.items() if count >= min_count}

    if not freq_items:
        return {"frequent_itemsets": [], "association_rules": [], "n_transactions": n_trans}

    # Step 3: Generate frequent itemsets (up to size 3)
    all_frequent = []
    all_frequent.append([(frozenset([item]), count) for item, count in freq_items.items()])

    for k in range(2, 4):  # k = 2, 3
        candidates = _generate_candidates([s for s, _ in all_frequent[k - 2]], k)
        if not candidates:
            break

        candidate_counts = Counter()
        for candidate in candidates:
            for txn in transactions:
                if candidate.issubset(txn):
                    candidate_counts[candidate] += 1

        freq_k = [(c, cnt) for c, cnt in candidate_counts.items() if cnt >= min_count]
        if freq_k:
            all_frequent.append(freq_k)

    # Step 4: Generate association rules
    rules = []
    for k_itemsets in all_frequent[1:]:  # Skip 1-itemsets
        for itemset, itemset_count in k_itemsets:
            items = list(itemset)
            for i in range(1, len(items)):
                for antecedent in combinations(items, i):
                    antecedent_set = frozenset(antecedent)
                    consequent_set = itemset - antecedent_set
                    if not consequent_set:
                        continue

                    # Find support of antecedent
                    antecedent_count = 0
                    for txn in transactions:
                        if antecedent_set.issubset(txn):
                            antecedent_count += 1

                    if antecedent_count == 0:
                        continue

                    confidence = itemset_count / antecedent_count
                    support = itemset_count / n_trans

                    if confidence >= min_confidence and support >= min_support:
                        lift = confidence / (sum(1 for t in transactions if consequent_set.issubset(t)) / n_trans) if sum(1 for t in transactions if consequent_set.issubset(t)) > 0 else 0
                        rules.append({
                            "antecedent": list(antecedent_set),
                            "consequent": list(consequent_set),
                            "support": round(support, 4),
                            "confidence": round(confidence, 4),
                            "lift": round(lift, 4) if lift > 0 else 1.0,
                        })

    rules.sort(key=lambda r: (r["confidence"], r["lift"]), reverse=True)

    # Flatten itemsets
    flat_itemsets = []
    for k, itemsets in enumerate(all_frequent):
        for itemset, count in itemsets:
            flat_itemsets.append({
                "items": list(itemset),
                "size": len(itemset),
                "support": round(count / n_trans, 4),
                "count": count,
            })
    flat_itemsets.sort(key=lambda x: (x["size"], x["support"]), reverse=True)

    return {
        "frequent_itemsets": flat_itemsets[:30],
        "association_rules": rules[:20],
        "n_transactions": n_trans,
    }


def _generate_candidates(prev_frequent: list[frozenset], k: int) -> list[frozenset]:
    """Generate candidate k-itemsets from (k-1)-frequent itemsets."""
    candidates = set()
    n = len(prev_frequent)
    for i in range(n):
        for j in range(i + 1, n):
            candidate = prev_frequent[i].union(prev_frequent[j])
            if len(candidate) == k:
                candidates.add(candidate)
    return list(candidates)


# ═══════════════════════════════════════════════════════════════
# 2. DOCUMENT CLUSTERING (K-MEANS + TF-IDF)
# ═══════════════════════════════════════════════════════════════

def _compute_tfidf(documents: list[str]) -> tuple:
    """Compute TF-IDF matrix for a list of documents."""
    n_docs = len(documents)
    # Tokenize
    doc_tokens = []
    for doc in documents:
        tokens = re.findall(r'\b[a-zA-Z]{3,}\b', doc.lower())
        doc_tokens.append(tokens)

    # Count document frequency
    doc_freq = Counter()
    for tokens in doc_tokens:
        doc_freq.update(set(tokens))

    # Build vocabulary (top 100 by document frequency)
    vocab = [w for w, _ in doc_freq.most_common(100)]

    # Compute TF-IDF vectors
    vectors = []
    for tokens in doc_tokens:
        vec = []
        token_counts = Counter(tokens)
        max_tf = max(token_counts.values()) if token_counts else 1
        for word in vocab:
            tf = token_counts.get(word, 0) / max_tf
            idf = math.log((n_docs + 1) / (doc_freq.get(word, 0) + 1)) + 1
            vec.append(tf * idf)
        # Normalize
        norm = math.sqrt(sum(v * v for v in vec)) or 1
        vectors.append([v / norm for v in vec])
    return vectors, vocab


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0
    return dot / (norm_a * norm_b)


def document_clustering(texts: list[str], filenames: list[str] = None, k: int = 3) -> dict:
    """Cluster documents using K-Means with TF-IDF vectors.

    Args:
        texts: List of document texts
        filenames: Optional list of document filenames
        k: Number of clusters

    Returns:
        dict with clusters, representative terms, and silhouette-like score
    """
    if filenames is None:
        filenames = [f"Doc_{i + 1}" for i in range(len(texts))]

    n_docs = len(texts)
    if n_docs < k:
        k = max(2, n_docs)

    if n_docs < 2:
        return {"clusters": [], "n_clusters": 0, "score": 0}

    vectors, vocab = _compute_tfidf(texts)

    # K-Means
    k = min(k, n_docs)
    centroids = vectors[:k]  # Initialize with first k docs
    prev_assignments = None

    for _ in range(20):  # Max 20 iterations
        # Assign documents to nearest centroid
        assignments = []
        for vec in vectors:
            similarities = [_cosine_similarity(vec, cent) for cent in centroids]
            assignments.append(similarities.index(max(similarities)))

        # Update centroids
        new_centroids = [[0.0] * len(vocab) for _ in range(k)]
        counts = [0] * k
        for i, cluster_id in enumerate(assignments):
            for j, val in enumerate(vectors[i]):
                new_centroids[cluster_id][j] += val
            counts[cluster_id] += 1

        for ci in range(k):
            if counts[ci] > 0:
                new_centroids[ci] = [v / counts[ci] for v in new_centroids[ci]]
            else:
                new_centroids[ci] = centroids[ci]

        centroids = new_centroids
        if assignments == prev_assignments:
            break
        prev_assignments = assignments

    # Build clusters
    clusters_data = {}
    for i, cluster_id in enumerate(assignments):
        if cluster_id not in clusters_data:
            clusters_data[cluster_id] = {"documents": [], "terms": [], "size": 0}
        clusters_data[cluster_id]["documents"].append({"name": filenames[i], "index": i})
        clusters_data[cluster_id]["size"] += 1

    # Find top terms per cluster
    for ci, cluster in clusters_data.items():
        centroid = centroids[ci]
        term_scores = [(vocab[j], centroid[j]) for j in range(len(vocab))]
        term_scores.sort(key=lambda x: x[1], reverse=True)
        cluster["terms"] = [t[0] for t in term_scores[:6]]

    # Silhouette-like score
    cohesion = 0
    for i, cluster_id in enumerate(assignments):
        cohesion += _cosine_similarity(vectors[i], centroids[cluster_id])
    score = round(cohesion / n_docs, 4) if n_docs > 0 else 0

    return {
        "clusters": list(clusters_data.values()),
        "n_clusters": k,
        "score": score,
    }


# ═══════════════════════════════════════════════════════════════
# 3. SENTIMENT ANALYSIS (LEXICON-BASED)
# ═══════════════════════════════════════════════════════════════

# Simple sentiment lexicons
POSITIVE_WORDS = {
    "growth", "profit", "revenue", "increase", "gain", "positive", "strong",
    "success", "improved", "opportunity", "innovation", "expansion", "advantage",
    "excellent", "outstanding", "leading", "breakthrough", "record", "milestone",
    "rising", "soaring", "boost", "surge", "thriving", "optimistic", "confident",
    "efficient", "productivity", "launch", "partnership", "award", "recognition",
    "compliance", "secure", "stable", "competitive", "valuable", "strategic",
}

NEGATIVE_WORDS = {
    "loss", "decline", "risk", "threat", "failure", "debt", "lawsuit",
    "penalty", "fine", "violation", "breach", "investigation", "fraud",
    "downturn", "recession", "crisis", "disruption", "outage", "incident",
    "delay", "shortage", "cut", "layoff", "downsizing", "bankruptcy",
    "litigation", "sanction", "warning", "deficiency", "noncompliance",
    "volatile", "uncertain", "weak", "poor", "worse", "severe", "critical",
}

INTENSIFIERS = {
    "very": 1.5, "extremely": 2.0, "highly": 1.5, "significantly": 1.5,
    "substantially": 1.5, "notably": 1.3, "particularly": 1.3,
}


def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment of text using a lexicon-based approach.

    Args:
        text: Document text

    Returns:
        dict with polarity, sentiment label, positive/negative word counts
    """
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    pos_count = 0
    neg_count = 0
    weighted_pos = 0.0
    weighted_neg = 0.0
    total_words = len(words)

    for i, word in enumerate(words):
        multiplier = 1.0
        # Check intensifiers before the word
        if i > 0 and words[i - 1] in INTENSIFIERS:
            multiplier = INTENSIFIERS[words[i - 1]]

        # Check negation
        if i > 0 and words[i - 1] in {"not", "never", "no", "neither", "hardly"}:
            multiplier *= -0.5  # Negation flips sentiment

        if word in POSITIVE_WORDS:
            pos_count += 1
            weighted_pos += multiplier
        elif word in NEGATIVE_WORDS:
            neg_count += 1
            weighted_neg += multiplier

    # Calculate polarity score (-1 to 1)
    total_weighted = weighted_pos - weighted_neg
    max_possible = max(pos_count + neg_count, 1)
    polarity = round(total_weighted / max_possible, 4)
    polarity = max(-1.0, min(1.0, polarity))

    # Label
    if polarity > 0.2:
        label = "positive"
        confidence = min(0.99, abs(polarity) + 0.3)
    elif polarity < -0.2:
        label = "negative"
        confidence = min(0.99, abs(polarity) + 0.3)
    else:
        label = "neutral"
        confidence = max(0.5, 1.0 - abs(polarity))

    return {
        "polarity": polarity,
        "sentiment": label,
        "confidence": round(confidence, 4),
        "positive_words": pos_count,
        "negative_words": neg_count,
        "total_words": total_words,
    }


def batch_sentiment(texts: list[str], filenames: list[str] = None) -> list[dict]:
    """Run sentiment analysis on multiple documents."""
    if filenames is None:
        filenames = [f"Doc_{i + 1}" for i in range(len(texts))]
    results = []
    for text, fname in zip(texts, filenames):
        result = analyze_sentiment(text)
        result["filename"] = fname
        results.append(result)
    return results
