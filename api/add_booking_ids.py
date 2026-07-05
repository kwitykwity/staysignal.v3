# One-time preprocessing script — already run once to add booking_id to
# hotel_bookings_raw_2.csv. Not part of the regular train/serve pipeline,
# so it assumes the CSV already exists locally (see train.py for the
# auto-download logic used there).
import pandas as pd

df = pd.read_csv("hotel_bookings_raw_2.csv")

# Add booking_id as the first column
df.insert(0, "booking_id", [
    f"BookingID_{str(i+1).zfill(7)}" for i in range(len(df))
])

df.to_csv("hotel_bookings_raw_2.csv", index=False)

print(f"Done. {len(df)} rows labeled BookingID_0000001 through BookingID_{str(len(df)).zfill(7)}")
print(df[["booking_id"]].head(3))