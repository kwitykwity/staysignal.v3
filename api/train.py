import os
import urllib.request
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
import pickle

DATA_FILE = "hotel_bookings_raw_2.csv"

if not os.path.exists(DATA_FILE):
    print(f"Downloading {DATA_FILE}...")
    urllib.request.urlretrieve(
        # Update the tag once you publish a release with this CSV attached
        # as a release asset in this repo.
        f"https://github.com/kwitykwity/staysignal.v3/releases/download/v1.0/{DATA_FILE}",
        DATA_FILE
    )
    print(f"{DATA_FILE} ready.")

df = pd.read_csv(DATA_FILE)

# Encode the channel
channel_map = {
    "Online TA": 0, "Offline TA/TO": 1, "Direct": 2,
    "Corporate": 3, "Groups": 4, "Complementary": 5, "Aviation": 6
}
df["channel_encoded"] = df["market_segment"].map(channel_map).fillna(0)

# Encode country (top countries get a number, rest = 0)
top_countries = df["country"].value_counts().head(20).index
df["country_encoded"] = df["country"].apply(
    lambda x: list(top_countries).index(x) + 1 if x in top_countries else 0
)

features = ["channel_encoded", "lead_time", "country_encoded", 
            "total_of_special_requests"]
X = df[features]
y = df["is_canceled"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = XGBClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print(f"Accuracy: {model.score(X_test, y_test):.3f}")

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved.")