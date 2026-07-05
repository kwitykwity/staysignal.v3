# StaySignal

Hotel booking quality scorer — know before they cancel.

Enter four booking details and get an instant **Booking Quality Score** (0–100), plain-English risk drivers, and a recommended action. Powered by a machine learning model trained on 119,390 real hotel booking records.

**Live demo:** [staysignal-v3.vercel.app](https://staysignal-v3.vercel.app)

This repository is a **monorepo** containing both halves of StaySignal:

```text
StaySignal/
├── frontend/   → React + Vite + Tailwind UI (deployed on Vercel)
└── api/        → FastAPI + XGBoost scoring service (deployed on Render)
```

Previously the frontend and API lived in two separate repositories (`staysignal` and `staysignal-api`). As of v2, both live here together for easier local development and versioning.

---

## What it does

Hotels lose revenue when bookings cancel at the last minute — leaving rooms empty with no time to resell. StaySignal reads four signals in a booking that predict whether a guest will actually show up, and tells you what to do about it before it's too late.

---

## The four predictors

| Input | Why it matters |
|-------|---------------|
| Booking channel | Online TA cancels at 36.7% vs Direct at 15.3% — a 2.4× gap |
| Lead time | 180+ day bookings cancel at 57% · 0–30 days cancel at 18.6% |
| Country of origin | Guest origin correlates with booking commitment patterns |
| Special requests | 0 requests = 47.7% cancel · 5 requests = 5.0% cancel |

---

## How it works

1. Enter the booking channel, lead time, guest country, and number of special requests
2. StaySignal scores the booking 0–100 in real time
3. See the top risk drivers in plain English
4. Get one recommended action — request a deposit, send an engagement email, or add to overbooking buffer

---

## Qatar Market tab

Alongside the single-booking scorer, StaySignal includes a **Qatar Market Context** view — a market-level dashboard showing:

- Occupancy rate, ADR, and RevPAR trends from 2014–2025 across 7 hospitality segments (Qatar+ aggregate, 5/4/3/1&2-star hotels, deluxe and standard apartments)
- COVID-19 and FIFA World Cup 2022 shown as shaded reference bands on the trend chart — these are manually annotated known market events, not derived from the dataset
- A trailing 12-month average for the headline stat cards (rather than a single latest month), to avoid misleading spikes from seasonal effects like Ramadan
- A segment comparison bar chart showing occupancy rate by property tier for the latest reporting month

Data source: Qatar accommodation data by segment, date, and key metrics (Data.gov.qa) — monthly supply, demand, occupancy, ADR, and RevPAR, 2014–2025. Bundled locally as `frontend/src/data/qatarMarketData.json`.

---

## Tech stack

**Frontend** (`/frontend`)
- React + Vite + Tailwind CSS
- Axios for API calls
- Recharts for the Qatar Market charts
- Deployed on Vercel

**API** (`/api`)
- Python 3.14 + FastAPI
- XGBoost + scikit-learn
- pandas / numpy
- Deployed on Render

---

## Local development

Clone this repo, then run both services from their own folders.

### API

```bash
cd api
pip install -r requirements.txt
python train.py        # trains model, saves model.pkl
python -m uvicorn main:app --reload
```

API runs at `http://127.0.0.1:8000` · Interactive docs at `http://127.0.0.1:8000/docs`

**Note on data and model files:** `hotel_bookings_raw_2.csv` and `model.pkl` are both git-ignored — they aren't committed to this repo. Instead:
- `train.py` auto-downloads the dataset CSV from this repo's GitHub Releases if it's missing locally, then trains and saves a fresh `model.pkl`.
- `main.py` auto-downloads `model.pkl` from GitHub Releases if it's missing at API startup.

For this to work, create a GitHub Release on this repo (tag `v1.0`) and attach both `hotel_bookings_raw_2.csv` and `model.pkl` as release assets. If you retrain the model or update the dataset later, either replace the assets on that same release or bump the tag and update the URLs in `train.py` and `main.py` to match.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Requires the API running locally at `http://127.0.0.1:8000` (see `frontend/vite.config.js` for the dev proxy).

---

## Endpoint reference

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

**Channel options:** `Online TA` · `Direct` · `Corporate` · `Offline TA/TO` · `Groups` · `Other`

**Country codes (top 20):** `PRT` `GBR` `FRA` `ESP` `DEU` `ITA` `IRL` `BEL` `BRA` `NLD` `USA` `CHN` `AUT` `ROU` `POL` `SWE` `CHE` `RUS` `NOR` `DNK`

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

- **37%** of hotel bookings never became stays — 44,224 of 119,390 canceled
- **$4.5M** in estimated lost revenue across two Portuguese hotels over two years
- OTA cancellations now approaching **50%** (Cloudbeds, 2026)
- Direct bookings generate **$519/booking** vs **$320** via OTA (SiteMinder, 2025)

---

## Part of

**StaySignal** — Hospitality Demand Intelligence & Booking Quality Scorer
Built by Christina Ruiz, Schiffon Wise, Chris Wozniak · Pursuit AI Native Fellowship 2026
