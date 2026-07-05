from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
import os
import urllib.request

if not os.path.exists("model.pkl"):
    print("Downloading model.pkl...")
    urllib.request.urlretrieve(
        # Update the tag (v1.0) once you publish a release with model.pkl
        # attached as a release asset in this repo.
        "https://github.com/kwitykwity/staysignal.v3/releases/download/v1.0/model.pkl",
        "model.pkl"
    )
    print("model.pkl ready.")

with open("model.pkl", "rb") as f:
    model = pickle.load(f)

CHANNEL_MAP = {
    "Online TA": 0, "Offline TA/TO": 1, "Direct": 2,
    "Corporate": 3, "Groups": 4, "Complementary": 5,
    "Aviation": 6, "Other": 0
}

TOP_COUNTRIES = [
    "PRT", "GBR", "FRA", "ESP", "DEU", "ITA", "IRL",
    "BEL", "BRA", "NLD", "USA", "CHN", "AUT", "ROU",
    "POL", "SWE", "CHE", "RUS", "NOR", "DNK"
]

ACTIONS = {
    "High Risk": "Request a non-refundable deposit before confirming this reservation.",
    "Medium Risk": "Send a pre-arrival engagement email to increase guest commitment.",
    "Low Risk": "Standard processing. Add to overbooking buffer if needed."
}

class BookingInput(BaseModel):
    channel: str
    lead_time: int
    country: str
    special_requests: int

@app.post("/score")
def score_booking(booking: BookingInput):
    channel_enc = CHANNEL_MAP.get(booking.channel, 0)
    country_enc = (TOP_COUNTRIES.index(booking.country) + 1 
                   if booking.country in TOP_COUNTRIES else 0)

    features = np.array([[channel_enc, booking.lead_time, 
                          country_enc, booking.special_requests]])
    cancel_prob = model.predict_proba(features)[0][1]
    quality_score = round((1 - cancel_prob) * 100)

    if quality_score < 40:
        risk_label = "High Risk"
    elif quality_score < 70:
        risk_label = "Medium Risk"
    else:
        risk_label = "Low Risk"

    # Build plain-English drivers
    drivers = []
    cancel_rates = {"Online TA": 36.7, "Groups": 61.1, "Direct": 15.3,
                    "Corporate": 18.7, "Offline TA/TO": 34.3}
    if booking.channel in ["Online TA", "Groups", "Offline TA/TO"]:
        rate = cancel_rates.get(booking.channel, 36.7)
        drivers.append(
            f"{booking.channel} bookings cancel at {rate}% — "
            f"2.4× higher than Direct bookings."
        )
    if booking.lead_time > 180:
        drivers.append(
            f"Lead time of {booking.lead_time} days puts this booking "
            f"in the highest-risk window — 57% of these cancel."
        )
    elif booking.lead_time > 90:
        drivers.append(
            f"Lead time of {booking.lead_time} days — bookings in this "
            f"window cancel at 44.7%."
        )
    if booking.special_requests == 0:
        drivers.append(
            "Zero special requests — guests with no requests cancel "
            "at 47.7%. Engagement signals commitment."
        )
    if not drivers:
        drivers.append(
            "This booking shows low-risk signals across all four predictors."
        )

    return {
        "quality_score": int(quality_score),
        "risk_label": risk_label,
        "drivers": drivers[:2],
        "recommended_action": ACTIONS[risk_label],
        "cancel_probability": float(round(float(cancel_prob) * 100, 1))
    }

@app.get("/")
def root():
    return {"status": "StaySignal API running"}