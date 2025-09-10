from flask import Blueprint, request, jsonify
import pandas as pd
import folium
import os
import uuid

hotel_api = Blueprint("hotel_api", __name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), "udaipur_hotels_full.csv")
df = pd.read_csv(CSV_PATH)



@hotel_api.route('/hotel-recommend', methods=['POST'])
def recommend_hotels():
    print("📩 Hotel recommendation endpoint hit")
    try:
        data = request.get_json()
        place = data.get("place", "").lower()
        budget = int(data.get("budget", 0))

        if not place or not budget:
            return jsonify({"error": "Missing place or budget"}), 400

        filtered = df[
            (df["budget_min_INR"] <= budget) & (df["budget_max_INR"] >= budget)
        ].copy()

        if filtered.empty:
            return jsonify({"hotels": []}), 200

        filtered["image"] = "https://source.unsplash.com/400x300/?udaipur,hotel"

        m = folium.Map(location=[24.58, 73.68], zoom_start=13)
        fg = folium.FeatureGroup(name="Hotels")
        for _, row in filtered.iterrows():
            popup = f"{row['name']}<br>₹{row['budget_min_INR']} - ₹{row['budget_max_INR']}"
            folium.Marker(
                location=[row["latitude"], row["longitude"]],
                popup=popup,
                icon=folium.Icon(color='darkred', icon='info-sign')
            ).add_to(fg)
        m.add_child(fg)

        map_id = str(uuid.uuid4())
        map_dir = os.path.join("static", "maps")
        os.makedirs(map_dir, exist_ok=True)
        map_path = os.path.join(map_dir, f"{map_id}.html")
        m.save(map_path)

        hotels = filtered[["name", "budget_min_INR", "latitude", "longitude", "image"]].to_dict(orient="records")
        for h in hotels:
            h["price"] = h.pop("budget_min_INR")
            h["lat"] = h.pop("latitude")
            h["lon"] = h.pop("longitude")

        return jsonify({
            "hotels": hotels,
            "mapUrl": f"/static/maps/{map_id}.html"
        })
    except Exception as e:
        print("❌ Hotel API Error:", str(e))
        return jsonify({"error": str(e)}), 500
