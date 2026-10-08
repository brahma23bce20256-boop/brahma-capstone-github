"""Gold-standard evaluation dataset for the RAG Knowledge Intelligence System.

Each entry is a ground-truth query paired with the filename of the document
that *should* be retrieved. Also includes expected categories for classification
evaluation and expected sentiment for sentiment evaluation.

Based on the sample docs shipped at the project root:
  amazon_q4_report.txt, hr_survey.txt, support_tickets.txt,
  financial_trends.csv, product_sales.csv, test_data.csv
"""

GOLD_RETRIEVAL_QUERIES = [
    # amazon_q4_report.txt
    {"query": "What was Amazon's Q4 revenue?", "expected_doc": "amazon_q4_report.txt"},
    {"query": "How much did AWS cloud revenue grow?", "expected_doc": "amazon_q4_report.txt"},
    {"query": "Amazon advertising revenue 2024", "expected_doc": "amazon_q4_report.txt"},
    {"query": "North America segment sales", "expected_doc": "amazon_q4_report.txt"},
    {"query": "free cash flow Amazon", "expected_doc": "amazon_q4_report.txt"},

    # hr_survey.txt
    {"query": "employee satisfaction engineering department", "expected_doc": "hr_survey.txt"},
    {"query": "which department had negative work-life balance?", "expected_doc": "hr_survey.txt"},
    {"query": "HR survey response rate", "expected_doc": "hr_survey.txt"},
    {"query": "compensation satisfaction scores", "expected_doc": "hr_survey.txt"},
    {"query": "career growth feedback", "expected_doc": "hr_survey.txt"},

    # support_tickets.txt
    {"query": "open support tickets", "expected_doc": "support_tickets.txt"},
    {"query": "critical issues from customers", "expected_doc": "support_tickets.txt"},
    {"query": "ticket resolution time", "expected_doc": "support_tickets.txt"},
    {"query": "escalated support cases", "expected_doc": "support_tickets.txt"},

    # financial_trends.csv
    {"query": "financial trends over time", "expected_doc": "financial_trends.csv"},
    {"query": "quarterly profit trends", "expected_doc": "financial_trends.csv"},

    # product_sales.csv
    {"query": "product sales data", "expected_doc": "product_sales.csv"},
    {"query": "best-selling products", "expected_doc": "product_sales.csv"},
]

# Expected document categories (what classify_document should return)
GOLD_CLASSIFICATIONS = {
    "amazon_q4_report.txt": "financial",
    "financial_trends.csv": "financial",
    "hr_survey.txt": "support",
    "support_tickets.txt": "support",
    "product_sales.csv": "financial",
    "test_data.csv": "general",
}

# Expected sentiments
GOLD_SENTIMENTS = {
    "amazon_q4_report.txt": "positive",   # Growth, revenue up
    "hr_survey.txt": "positive",           # Overall survey positive-leaning
    "support_tickets.txt": "negative",     # Complaints
}

# Topic groups for vector-space quality evaluation.
# Documents within the same group should have higher avg similarity than across groups.
TOPIC_GROUPS = {
    "financial": ["amazon_q4_report.txt", "financial_trends.csv", "product_sales.csv"],
    "hr_support": ["hr_survey.txt", "support_tickets.txt"],
}
