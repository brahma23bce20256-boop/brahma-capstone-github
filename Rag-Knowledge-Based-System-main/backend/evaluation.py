"""Evaluation metrics for the RAG Knowledge Intelligence System.

Produces real, measurable efficiency metrics:
  - Retrieval:    Precision@K, Mean Reciprocal Rank, avg relevance
  - Classification: Accuracy, per-class precision/recall/F1, confusion matrix
  - Clustering:   Silhouette score, cluster purity, inertia
  - Sentiment:    Accuracy vs gold labels
  - Performance:  Latency p50/p95/p99, throughput (QPS)
  - Vector space: Intra- vs inter-topic cosine similarity, separation ratio
"""

import time
import statistics
from collections import defaultdict

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    silhouette_score,
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

from backend.eval_dataset import (
    GOLD_RETRIEVAL_QUERIES,
    GOLD_CLASSIFICATIONS,
    GOLD_SENTIMENTS,
    TOPIC_GROUPS,
)


# ────────────────────────────────────────────────────────────────
# Retrieval quality
# ────────────────────────────────────────────────────────────────

def evaluate_retrieval(rag_engine, documents: dict) -> dict:
    """Measure retrieval accuracy on the gold query set.

    Returns Precision@K for K in {1, 3, 5}, MRR, and average top-1 relevance.
    """
    uploaded_filenames = {d["filename"] for d in documents.values()}

    # Keep only queries whose target doc is actually uploaded
    queries = [q for q in GOLD_RETRIEVAL_QUERIES if q["expected_doc"] in uploaded_filenames]

    if not queries or not rag_engine or not rag_engine._initialized:
        return {
            "n_queries": 0,
            "precision_at_1": 0.0,
            "precision_at_3": 0.0,
            "precision_at_5": 0.0,
            "mrr": 0.0,
            "avg_top1_relevance": 0.0,
            "per_query": [],
            "note": "No gold queries runnable — upload the sample docs first.",
        }

    hits_1, hits_3, hits_5 = 0, 0, 0
    reciprocal_ranks = []
    top1_scores = []
    per_query = []

    for q in queries:
        try:
            results = rag_engine.retrieve(q["query"], top_k=5)
        except Exception:
            results = []

        retrieved_filenames = [
            r.get("metadata", {}).get("filename", "") for r in results
        ]

        found_at = None
        for rank, fname in enumerate(retrieved_filenames, start=1):
            if fname == q["expected_doc"]:
                found_at = rank
                break

        if found_at:
            if found_at <= 1:
                hits_1 += 1
            if found_at <= 3:
                hits_3 += 1
            if found_at <= 5:
                hits_5 += 1
            reciprocal_ranks.append(1.0 / found_at)
        else:
            reciprocal_ranks.append(0.0)

        if results:
            top1_scores.append(float(results[0].get("score", 0.0)))

        per_query.append({
            "query": q["query"],
            "expected": q["expected_doc"],
            "retrieved_top3": retrieved_filenames[:3],
            "found_at_rank": found_at,
        })

    n = len(queries)
    return {
        "n_queries": n,
        "precision_at_1": round(hits_1 / n, 4),
        "precision_at_3": round(hits_3 / n, 4),
        "precision_at_5": round(hits_5 / n, 4),
        "mrr": round(sum(reciprocal_ranks) / n, 4),
        "avg_top1_relevance": round(sum(top1_scores) / len(top1_scores), 4) if top1_scores else 0.0,
        "per_query": per_query,
    }


# ────────────────────────────────────────────────────────────────
# Classification quality
# ────────────────────────────────────────────────────────────────

def evaluate_classification(documents: dict) -> dict:
    """Compare auto-classified categories vs gold labels."""
    y_true, y_pred, filenames = [], [], []

    for d in documents.values():
        fname = d.get("filename", "")
        if fname not in GOLD_CLASSIFICATIONS:
            continue
        y_true.append(GOLD_CLASSIFICATIONS[fname])
        y_pred.append(d.get("category", "general"))
        filenames.append(fname)

    if not y_true:
        return {
            "n_docs": 0,
            "accuracy": 0.0,
            "note": "Upload labeled sample docs for classification eval.",
        }

    labels = sorted(set(y_true) | set(y_pred))
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average=None, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    per_class = []
    for i, lbl in enumerate(labels):
        per_class.append({
            "label": lbl,
            "precision": round(float(precision[i]), 4),
            "recall": round(float(recall[i]), 4),
            "f1": round(float(f1[i]), 4),
        })

    return {
        "n_docs": len(y_true),
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(np.mean(f1)), 4) if len(f1) else 0.0,
        "labels": labels,
        "confusion_matrix": cm,
        "per_class": per_class,
        "per_doc": [
            {"filename": f, "expected": t, "predicted": p, "correct": t == p}
            for f, t, p in zip(filenames, y_true, y_pred)
        ],
    }


# ────────────────────────────────────────────────────────────────
# Clustering quality
# ────────────────────────────────────────────────────────────────

def evaluate_clustering(documents: dict, k: int = 2) -> dict:
    """Cluster uploaded docs with K-Means; report silhouette + purity vs gold topic groups."""
    items = [
        (d["filename"], d.get("content", ""))
        for d in documents.values()
        if d.get("content", "").strip()
    ]
    if len(items) < 2:
        return {"n_docs": len(items), "note": "Need >=2 docs to cluster."}

    filenames = [f for f, _ in items]
    texts = [t for _, t in items]
    actual_k = min(k, len(texts))

    vectorizer = TfidfVectorizer(max_features=500, stop_words="english")
    X = vectorizer.fit_transform(texts)

    km = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
    labels = km.fit_predict(X)

    # Silhouette (needs >=2 clusters, >=k+1 samples)
    sil = None
    if actual_k >= 2 and X.shape[0] > actual_k:
        try:
            sil = float(silhouette_score(X, labels))
        except Exception:
            sil = None

    # Purity vs gold topic groups
    fname_to_group = {}
    for group, flist in TOPIC_GROUPS.items():
        for f in flist:
            fname_to_group[f] = group

    gold_labels = [fname_to_group.get(f) for f in filenames]
    purity = None
    if any(g is not None for g in gold_labels):
        cluster_members = defaultdict(list)
        for lbl, g in zip(labels, gold_labels):
            if g is not None:
                cluster_members[int(lbl)].append(g)
        total_matched = sum(len(v) for v in cluster_members.values())
        if total_matched > 0:
            majority_sum = sum(
                max(v.count(g) for g in set(v)) for v in cluster_members.values() if v
            )
            purity = round(majority_sum / total_matched, 4)

    return {
        "n_docs": len(items),
        "n_clusters": actual_k,
        "silhouette_score": round(sil, 4) if sil is not None else None,
        "inertia": round(float(km.inertia_), 4),
        "purity": purity,
        "assignments": [
            {"filename": f, "cluster": int(c), "gold_group": g}
            for f, c, g in zip(filenames, labels, gold_labels)
        ],
    }


# ────────────────────────────────────────────────────────────────
# Sentiment accuracy
# ────────────────────────────────────────────────────────────────

def evaluate_sentiment(documents: dict, sentiment_fn) -> dict:
    """Run sentiment_fn on each labeled doc and compute accuracy."""
    items = [
        (d["filename"], d.get("content", ""))
        for d in documents.values()
        if d.get("filename", "") in GOLD_SENTIMENTS and d.get("content", "").strip()
    ]
    if not items:
        return {"n_docs": 0, "accuracy": 0.0, "note": "No labeled docs uploaded."}

    y_true, y_pred, details = [], [], []
    for fname, text in items:
        res = sentiment_fn([text], [fname])[0]
        predicted = res["sentiment"]
        expected = GOLD_SENTIMENTS[fname]
        y_true.append(expected)
        y_pred.append(predicted)
        details.append({
            "filename": fname,
            "expected": expected,
            "predicted": predicted,
            "polarity": res.get("polarity", 0.0),
            "correct": expected == predicted,
        })

    acc = accuracy_score(y_true, y_pred)
    return {
        "n_docs": len(items),
        "accuracy": round(float(acc), 4),
        "details": details,
    }


# ────────────────────────────────────────────────────────────────
# System performance (latency / throughput)
# ────────────────────────────────────────────────────────────────

def _percentile(data, pct):
    if not data:
        return 0.0
    s = sorted(data)
    k = (len(s) - 1) * (pct / 100)
    lo = int(k)
    hi = min(lo + 1, len(s) - 1)
    frac = k - lo
    return s[lo] * (1 - frac) + s[hi] * frac


def measure_latency(fn, n: int = 20) -> dict:
    """Call fn() n times and report latency distribution in ms."""
    times = []
    errors = 0
    for _ in range(n):
        t0 = time.perf_counter()
        try:
            fn()
            times.append((time.perf_counter() - t0) * 1000)
        except Exception:
            errors += 1
    if not times:
        return {"n": 0, "errors": errors}
    return {
        "n": len(times),
        "errors": errors,
        "mean_ms": round(statistics.mean(times), 2),
        "median_ms": round(statistics.median(times), 2),
        "p50_ms": round(_percentile(times, 50), 2),
        "p95_ms": round(_percentile(times, 95), 2),
        "p99_ms": round(_percentile(times, 99), 2),
        "min_ms": round(min(times), 2),
        "max_ms": round(max(times), 2),
        "throughput_qps": round(1000.0 / statistics.mean(times), 2),
    }


def evaluate_performance(rag_engine, documents: dict) -> dict:
    """Measure latency of core operations."""
    sample_text = "The quarterly revenue grew significantly in cloud and advertising segments."

    results = {}

    # Embedding latency
    if rag_engine and rag_engine.embed_model is not None:
        results["embedding"] = measure_latency(
            lambda: rag_engine.embed(sample_text), n=20
        )
    else:
        results["embedding"] = {"n": 0, "note": "Embedding model not loaded"}

    # Retrieval latency
    if rag_engine and rag_engine._initialized:
        results["retrieval"] = measure_latency(
            lambda: rag_engine.retrieve("revenue growth", top_k=5), n=20
        )
    else:
        results["retrieval"] = {"n": 0, "note": "RAG engine not initialized"}

    # Document chunking latency (first uploaded doc, if any)
    docs = [d for d in documents.values() if d.get("content", "").strip()]
    if docs:
        from backend.document_processor import chunk_text
        sample = docs[0]["content"]
        results["chunking"] = measure_latency(lambda: chunk_text(sample), n=20)
    else:
        results["chunking"] = {"n": 0, "note": "No docs to chunk"}

    return results


# ────────────────────────────────────────────────────────────────
# Vector space quality
# ────────────────────────────────────────────────────────────────

def _cosine(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def evaluate_vector_space(rag_engine, documents: dict) -> dict:
    """Compare intra-topic vs inter-topic cosine similarity.

    Good embeddings → documents in the same topic group should be *more* similar
    to each other than to documents in different groups.
    """
    if not rag_engine or rag_engine.embed_model is None:
        return {"note": "Embedding model not loaded."}

    fname_to_text = {d["filename"]: d.get("content", "") for d in documents.values() if d.get("content")}
    fname_to_group = {}
    for group, flist in TOPIC_GROUPS.items():
        for f in flist:
            if f in fname_to_text:
                fname_to_group[f] = group

    if len(fname_to_group) < 3:
        return {"note": "Upload >=3 labeled sample docs for vector-space eval."}

    try:
        embeds = {f: rag_engine.embed(fname_to_text[f][:4000]) for f in fname_to_group}
    except Exception as exc:
        return {"note": f"Embedding failed: {exc}"}

    files = list(embeds.keys())
    intra_sims, inter_sims = [], []
    for i in range(len(files)):
        for j in range(i + 1, len(files)):
            f_i, f_j = files[i], files[j]
            sim = _cosine(embeds[f_i], embeds[f_j])
            if fname_to_group[f_i] == fname_to_group[f_j]:
                intra_sims.append(sim)
            else:
                inter_sims.append(sim)

    def _avg(xs):
        return round(sum(xs) / len(xs), 4) if xs else 0.0

    intra = _avg(intra_sims)
    inter = _avg(inter_sims)
    separation = round(intra - inter, 4) if intra_sims and inter_sims else 0.0

    return {
        "n_docs": len(files),
        "n_intra_pairs": len(intra_sims),
        "n_inter_pairs": len(inter_sims),
        "avg_intra_topic_similarity": intra,
        "avg_inter_topic_similarity": inter,
        "separation": separation,
        "quality": "good" if separation > 0.05 else ("marginal" if separation > 0.0 else "poor"),
    }


# ────────────────────────────────────────────────────────────────
# Mining metrics summary
# ────────────────────────────────────────────────────────────────

def evaluate_mining(documents: dict) -> dict:
    """Summarize data-mining output quality."""
    from backend.data_mining_advanced import apriori_mining, document_clustering

    texts = [d.get("content", "") for d in documents.values() if d.get("content", "").strip()]
    if len(texts) < 2:
        return {"note": "Need >=2 docs for mining eval."}

    apr = apriori_mining(texts, min_support=0.3, min_confidence=0.5)
    rules = apr.get("association_rules", [])

    return {
        "n_frequent_itemsets": len(apr.get("frequent_itemsets", [])),
        "n_association_rules": len(rules),
        "avg_rule_confidence": round(
            sum(r["confidence"] for r in rules) / len(rules), 4
        ) if rules else 0.0,
        "avg_rule_lift": round(
            sum(r["lift"] for r in rules) / len(rules), 4
        ) if rules else 0.0,
        "max_itemset_size": max(
            (item["size"] for item in apr.get("frequent_itemsets", [])), default=0
        ),
    }


# ────────────────────────────────────────────────────────────────
# Full evaluation bundle
# ────────────────────────────────────────────────────────────────

def run_full_evaluation(rag_engine, documents: dict, sentiment_fn) -> dict:
    """Run every evaluation and return a bundled report."""
    t0 = time.perf_counter()
    report = {
        "retrieval": evaluate_retrieval(rag_engine, documents),
        "classification": evaluate_classification(documents),
        "clustering": evaluate_clustering(documents, k=2),
        "sentiment": evaluate_sentiment(documents, sentiment_fn),
        "performance": evaluate_performance(rag_engine, documents),
        "vector_space": evaluate_vector_space(rag_engine, documents),
        "mining": evaluate_mining(documents),
    }
    report["total_evaluation_time_ms"] = int((time.perf_counter() - t0) * 1000)

    # Overall efficiency score (0-100) — weighted blend of what's available
    weights = []
    if report["retrieval"].get("n_queries", 0) > 0:
        weights.append(("retrieval", report["retrieval"]["precision_at_3"] * 100, 0.3))
    if report["classification"].get("n_docs", 0) > 0:
        weights.append(("classification", report["classification"]["accuracy"] * 100, 0.2))
    if report["clustering"].get("purity") is not None:
        weights.append(("clustering", report["clustering"]["purity"] * 100, 0.15))
    if report["sentiment"].get("n_docs", 0) > 0:
        weights.append(("sentiment", report["sentiment"]["accuracy"] * 100, 0.15))
    vs = report["vector_space"]
    if "separation" in vs:
        vs_score = max(0.0, min(100.0, (vs["separation"] + 0.1) * 500))
        weights.append(("vector_space", vs_score, 0.2))

    if weights:
        total_w = sum(w for _, _, w in weights)
        overall = sum(s * w for _, s, w in weights) / total_w
        report["overall_efficiency_score"] = round(overall, 2)
    else:
        report["overall_efficiency_score"] = 0.0

    return report
