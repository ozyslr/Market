---
phase: 19-ml-fraud-detection
plan: 01
requirements_addressed: [MLF-01, MLF-02, MLF-03, MLF-04]
---

# Plan 19-01 Summary: ML Fraud Detection

## Completed

- Created `src/services/mlFraudService.ts`: Z-score, IQR, moving average anomaly detection
  - Combined ML fraud score (weighted: Z-score 30%, IQR 30%, moving avg 20%, seller dev 20%)
  - Works without external ML libraries — pure statistical methods
- Created `src/services/behavioralAnalysisService.ts`: Seller behavioral profiling
  - 10-dimension behavior profile: account age, listing frequency, discount patterns, image reuse, etc.
  - Suspicious score computation + behavior flag generation
- Created `scripts/build-fraud-dataset.mjs`: Firestore → JSON dataset for ML training
  - Labeled dataset (fraud/legit) with 12 features per sample
  - Ready for Python ML pipeline (scikit-learn, TensorFlow, etc.)
- ML fraud detection integrates alongside existing rule-based system (Phase 15)

## Verification

- [x] tsc --noEmit passes
- [ ] build-fraud-dataset.mjs run with Firestore data
- [ ] ML model training pipeline (external — Python/Jupyter)

## Notes

- Statistical methods provide anomaly detection without model training overhead
- Dataset builder ready when enough fraud labels accumulate
- ML pipeline can be trained offline in Python and scores stored in Firestore
