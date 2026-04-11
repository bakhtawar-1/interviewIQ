"""
train.py — Train the InterviewIQ answer scoring model

Run once to create the model (from interviewiq-backend):
    python ml/train.py

Re-run any time you add more training data. Merges data/training_data.json
and data/training_data_expansion.json when the latter exists.

The model (models/scorer.pkl) is loaded automatically by FastAPI.
"""

import json, pickle, os
import numpy as np
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.preprocessing import FunctionTransformer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error

from rule_features import rule_features

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, 'data', 'training_data.json')
EXPANSION_PATH = os.path.join(BASE, 'data', 'training_data_expansion.json')
MODEL_PATH = os.path.join(BASE, 'models', 'scorer.pkl')


def load_training_rows():
    with open(DATA_PATH) as f:
        rows = json.load(f)
    if os.path.isfile(EXPANSION_PATH):
        with open(EXPANSION_PATH) as f:
            extra = json.load(f)
        rows = rows + extra
        print(f"Merged expansion: +{len(extra)} examples from {os.path.basename(EXPANSION_PATH)}")
    return rows


data = load_training_rows()
print(f"Training on {len(data)} examples")

# Combine question + answer — context matters for scoring
X_raw = [f"{d['question'].lower()} [SEP] {d['answer'].lower()}" for d in data]
y     = np.array([float(d['score']) for d in data])

print(f"Score range: {y.min():.0f}-{y.max():.0f}, mean: {y.mean():.1f}")

X_train, X_test, y_train, y_test = train_test_split(X_raw, y, test_size=0.15, random_state=42)

# Combined feature pipeline: TF-IDF (semantic) + rule features (structural)
model = Pipeline([
    ('features', FeatureUnion([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=20000,
            sublinear_tf=True,
            min_df=1,
            analyzer='word',
        )),
        ('rules', FunctionTransformer(rule_features, validate=False)),
    ])),
    ('reg', Ridge(alpha=1.5)),
])

model.fit(X_train, y_train)

preds = np.clip(model.predict(X_test), 0, 100)
mae   = mean_absolute_error(y_test, preds)
cv    = -cross_val_score(model, X_raw, y, cv=5, scoring='neg_mean_absolute_error').mean()

print(f"\nTraining complete.")
print(f"   Test MAE:  {mae:.1f} pts  (target < 10)")
print(f"   CV-5 MAE:  {cv:.1f} pts")
print(f"\nSample predictions:")
for i in range(min(8, len(X_test))):
    print(f"   Actual {y_test[i]:.0f} -> Predicted {preds[i]:.0f}")

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
with open(MODEL_PATH, 'wb') as f:
    pickle.dump(model, f)
print(f"\nModel saved: {MODEL_PATH} ({os.path.getsize(MODEL_PATH)//1024} KB)")
