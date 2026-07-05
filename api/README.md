# StaySignal API

ML-powered hotel booking cancellation risk prediction API.

Built with Python FastAPI + XGBoost. Trained on 119,390 real hotel booking records from two Portuguese properties (António, Almeida & Nunes, *Data in Brief*, 2019).

> Part of the [StaySignal monorepo](../README.md). See the root README for the full project overview, tech stack, and local dev instructions for both services.

---

## Endpoint

### `POST /score`

**Request body:**
```json
{
  "channel": "Online TA",
  "lead_time": 210,
  "country": "PRT",
  "special_requests": 0
}
```

**Response:**
```json
{
  "quality_score": 15,
  "risk_label": "High Risk",
  "drivers": [
    "Online TA bookings cancel at 36.7% — 2.4× higher than Direct bookings.",
    "Lead time of 210 days puts this booking in the highest-risk window — 57% of these cancel."
  ],
  "recommended_action": "Request a non-refundable deposit before confirming this reservation.",
  "cancel_probability": 84.5
}
```

---

## Channel options
`Online TA` · `Direct` · `Corporate` · `Offline TA/TO` · `Groups` · `Other`

## Country codes (top 20)
`PRT` `GBR` `FRA` `ESP` `DEU` `ITA` `IRL` `BEL` `BRA` `NLD`
`USA` `CHN` `AUT` `ROU` `POL` `SWE` `CHE` `RUS` `NOR` `DNK`

---

## Tech stack

- Python 3.14
- FastAPI
- XGBoost
- scikit-learn
- pandas / numpy
- Deployed on Render

---

## Local setup

```bash
pip install -r requirements.txt
python train.py        # trains model, saves model.pkl
python -m uvicorn main:app --reload
```

API runs at `http://127.0.0.1:8000`
Interactive docs at `http://127.0.0.1:8000/docs`

Note: `model.pkl` and `hotel_bookings_raw_2.csv` are both git-ignored.
- `train.py` will auto-download the dataset CSV from this repo's GitHub Releases if it's missing locally, then regenerate `model.pkl`.
- `main.py` will auto-download `model.pkl` from GitHub Releases if it's missing at startup.

Update the release tag/URLs in both files if this repo's release setup changes.

---

## Data source

António, N., Almeida, A., & Nunes, L. (2019). Hotel booking demand datasets.
*Data in Brief*, Vol. 22, pp. 41–49.
Real PMS data · 119,390 booking records · 2015–2017

---

## Key findings from the dataset

| Predictor | Finding |
|-----------|---------|
| Channel | Online TA cancels at 36.7% vs Direct at 15.3% — 2.4× gap |
| Lead time | 180+ days = 57% cancel rate · 0–30 days = 18.6% |
| Special requests | 0 requests = 47.7% cancel · 5 requests = 5.0% |
| Prior cancellations | Guests with 1 prior cancel re-cancel at 94.4% |
