import math
import random
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models import AnomalyScore

class PureNumpyIsolationTree:
    def __init__(self, depth: int, max_depth: int):
        self.depth = depth
        self.max_depth = max_depth
        self.split_feature: Optional[int] = None
        self.split_value: Optional[float] = None
        self.left: Optional[PureNumpyIsolationTree] = None
        self.right: Optional[PureNumpyIsolationTree] = None
        self.size: int = 0

    def fit(self, X: np.ndarray) -> None:
        self.size = len(X)
        if self.depth >= self.max_depth or self.size <= 1:
            return

        # Select random feature with variance
        n_features = X.shape[1]
        valid_features = [f for f in range(n_features) if np.min(X[:, f]) < np.max(X[:, f])]
        if not valid_features:
            return

        self.split_feature = random.choice(valid_features)
        min_val = float(np.min(X[:, self.split_feature]))
        max_val = float(np.max(X[:, self.split_feature]))
        self.split_value = random.uniform(min_val, max_val)

        left_mask = X[:, self.split_feature] < self.split_value
        right_mask = ~left_mask

        if left_mask.sum() == 0 or right_mask.sum() == 0:
            return

        self.left = PureNumpyIsolationTree(self.depth + 1, self.max_depth)
        self.left.fit(X[left_mask])

        self.right = PureNumpyIsolationTree(self.depth + 1, self.max_depth)
        self.right.fit(X[right_mask])

    def path_length(self, x: np.ndarray) -> float:
        if self.left is None or self.right is None or self.split_feature is None:
            # Adjustment for unbuilt tree below leaf
            if self.size <= 1:
                return float(self.depth)
            return float(self.depth + PureNumpyIsolationForest.c_factor(self.size))

        if x[self.split_feature] < self.split_value:
            return self.left.path_length(x)
        else:
            return self.right.path_length(x)


class PureNumpyIsolationForest:
    def __init__(self, n_estimators: int = 100, max_samples: int = 256, contamination: float = 0.15):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.contamination = contamination
        self.trees: List[PureNumpyIsolationTree] = []

    @staticmethod
    def c_factor(n: int) -> float:
        if n <= 1:
            return 0.0
        if n == 2:
            return 1.0
        euler_gamma = 0.5772156649
        return 2.0 * (math.log(n - 1) + euler_gamma) - (2.0 * (n - 1) / n)

    def fit(self, X: np.ndarray) -> None:
        n_samples = len(X)
        sample_size = min(self.max_samples, n_samples)
        max_depth = int(math.ceil(math.log2(max(sample_size, 2))))

        self.trees = []
        for _ in range(self.n_estimators):
            idx = np.random.choice(n_samples, sample_size, replace=False) if n_samples > sample_size else np.arange(n_samples)
            tree = PureNumpyIsolationTree(0, max_depth)
            tree.fit(X[idx])
            self.trees.append(tree)

    def compute_anomaly_scores(self, X: np.ndarray) -> np.ndarray:
        n_samples = len(X)
        c = self.c_factor(min(self.max_samples, n_samples))
        if c == 0.0:
            c = 1.0

        scores = []
        for i in range(n_samples):
            x = X[i]
            avg_path = np.mean([tree.path_length(x) for tree in self.trees])
            # s(x, n) = 2^(-E(h)/c)
            score = 2.0 ** (- (avg_path / c))
            scores.append(score)

        return np.array(scores)


class EntityAnomalyDetector:
    FEATURE_NAMES = [
        "alert_volume",
        "critical_alert_ratio",
        "rapid_closure_ratio",
        "escalation_rate",
        "templated_ratio",
        "weekend_activity_ratio",
        "investigation_depth_score",
        "telemetry_coverage_ratio"
    ]

    def __init__(self, contamination: float = 0.15):
        self.contamination = contamination
        self.model = PureNumpyIsolationForest(n_estimators=100, contamination=contamination)

    def fit_predict_entities(self, entity_features_list: List[Dict[str, Any]]) -> List[AnomalyScore]:
        if len(entity_features_list) < 3:
            scores = []
            for item in entity_features_list:
                scores.append(AnomalyScore(
                    entity_id=item["entity_id"],
                    score=40.0,
                    is_outlier=False,
                    contamination=self.contamination,
                    outlier_dimensions=[],
                    feature_vector=item,
                    detected_at=datetime.utcnow()
                ))
            return scores

        df = pd.DataFrame(entity_features_list)
        entity_ids = df["entity_id"].tolist()

        # Extract features and fill missing with column medians
        X = df[self.FEATURE_NAMES].fillna(df[self.FEATURE_NAMES].median()).values

        # Fit Pure Isolation Forest
        self.model.fit(X)
        raw_scores = self.model.compute_anomaly_scores(X)

        # Contamination threshold for outlier flag
        threshold = float(np.percentile(raw_scores, 100 * (1 - self.contamination)))

        anomaly_records = []
        col_means = np.mean(X, axis=0)
        col_stds = np.std(X, axis=0)

        for i, entity_id in enumerate(entity_ids):
            # Scale score to 0 - 100
            score_100 = round(float(raw_scores[i] * 100.0), 1)
            is_outlier = bool(raw_scores[i] >= threshold)

            # Determine top deviating dimensions
            outlier_dims = []
            for j, fname in enumerate(self.FEATURE_NAMES):
                val = X[i, j]
                std = col_stds[j] if col_stds[j] > 0 else 1.0
                z = abs(val - col_means[j]) / std
                if z > 1.6:
                    outlier_dims.append(f"{fname} (deviation: {round(float(z), 1)}σ)")

            record = AnomalyScore(
                entity_id=entity_id,
                score=score_100,
                is_outlier=is_outlier,
                contamination=self.contamination,
                outlier_dimensions=outlier_dims,
                feature_vector={self.FEATURE_NAMES[k]: round(float(X[i, k]), 2) for k in range(len(self.FEATURE_NAMES))},
                detected_at=datetime.utcnow()
            )
            anomaly_records.append(record)

        return anomaly_records
