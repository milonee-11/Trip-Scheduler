from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

API_KEY = "0f51e6473a43d5c5d10bfd4791d1ff0c"

@app.route("/api/weather", methods=["POST"])
def get_weather():
    try:
        data = request.get_json()
        city = data.get("city")
        arrival = data.get("arrival")
        departure = data.get("departure")

        if not city or not arrival or not departure:
            return jsonify({"error": "City, arrival, and departure are required"}), 400

        # Convert arrival/departure strings to date objects
        arrival_date = datetime.fromisoformat(arrival).date()
        departure_date = datetime.fromisoformat(departure).date()

        # Fetch 5-day forecast from OpenWeatherMap
        url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
        response = requests.get(url)
        if response.status_code != 200:
            return jsonify({"error": "Weather API error"}), 500

        forecast_data = response.json().get("list", [])
        if not forecast_data:
            return jsonify({"forecast": []})

        # Debug: print available forecast dates
        available_dates = sorted({datetime.strptime(e["dt_txt"], "%Y-%m-%d %H:%M:%S").date() for e in forecast_data})
        print("📅 Available forecast dates:", available_dates)

        # Filter and group data by date
        day_wise = {}
        for entry in forecast_data:
            entry_dt = datetime.strptime(entry["dt_txt"], "%Y-%m-%d %H:%M:%S")
            entry_date = entry_dt.date()

            # Skip data outside selected date range
            if not (arrival_date <= entry_date <= departure_date):
                continue

            temp = entry["main"]["temp"]
            desc = entry["weather"][0]["description"]

            if entry_date not in day_wise:
                day_wise[entry_date] = {
                    "temps": [],
                    "descriptions": []
                }

            day_wise[entry_date]["temps"].append(temp)
            day_wise[entry_date]["descriptions"].append(desc)

        # Analyze grouped data
        result = []
        for date, info in sorted(day_wise.items()):
            avg_temp = sum(info["temps"]) / len(info["temps"])
            common_desc = max(set(info["descriptions"]), key=info["descriptions"].count)

            # Determine travel category
            if "rain" in common_desc.lower() or avg_temp < 10:
                category = "Not Ideal"
            elif 10 <= avg_temp <= 30:
                category = "Good"
            else:
                category = "Average"

            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "forecast": f"{common_desc.capitalize()}, {round(avg_temp)}°C",
                "category": category
            })

        return jsonify({"forecast": result})

    except Exception as e:
        print("❌ Error in /api/weather:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
