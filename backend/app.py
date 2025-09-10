from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import re
import bcrypt
import requests
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ---------------------------
# Load environment variables
# ---------------------------
load_dotenv()

# ---------------------------
# Create Flask app
# ---------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------
# MongoDB setup
# ---------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["UserDB"]
collection = db["users"]
feedback_collection = db["feedback"]  # New collection for storing feedback

# ---------------------------
# Email configuration
# ---------------------------
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

# ---------------------------
# News API Configuration
# ---------------------------
NEWS_API_KEY = "f72fdc79bd974aed8b11dffbc4855de9"

# ---------------------------
# Utility: Password validation
# ---------------------------
def validate_password(password):
    return bool(re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$', password))

# ---------------------------
# Utility: Send email
# ---------------------------
def send_thank_you_email(to_email, name, message, rating):
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = to_email
        msg['Subject'] = 'Thank you for your feedback!'
        
        # Email body
        stars = "★" * rating + "☆" * (5 - rating)
        body = f"""
        <html>
        <body>
            <h2>Thank you for your feedback, {name}!</h2>
            <p>We appreciate you taking the time to share your thoughts with us.</p>
            <p><strong>Your rating:</strong> {stars}</p>
            <p><strong>Your message:</strong><br>{message}</p>
            <p>We will review your feedback and get back to you if needed.</p>
            <br>
            <p>Best regards,<br>TripScheduler Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# ---------------------------
# Route: Signup
# ---------------------------
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not all([name, email, phone, password]):
        return jsonify({"message": "All fields are required!"}), 400

    if not validate_password(password):
        return jsonify({
            "message": "Password must contain uppercase, lowercase, number, and min 6 characters"
        }), 400

    if collection.find_one({"name": name}):
        return jsonify({"message": "User already exists!"}), 409

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    collection.insert_one({
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_pw
    })

    return jsonify({"message": "User registered successfully!"}), 200

# ---------------------------
# Route: Submit Feedback
# ---------------------------
@app.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        rating = data.get('rating', 5)

        if not all([name, email, message]):
            return jsonify({"success": False, "message": "Name, email, and message are required!"}), 400

        # Store feedback in database
        feedback_data = {
            "name": name,
            "email": email,
            "message": message,
            "rating": rating,
            "date": datetime.now()
        }
        
        feedback_collection.insert_one(feedback_data)

        # Send thank you email
        email_sent = send_thank_you_email(email, name, message, rating)
        
        if email_sent:
            return jsonify({
                "success": True, 
                "message": "Feedback submitted successfully! Thank you email sent."
            }), 200
        else:
            return jsonify({
                "success": False, 
                "message": "Feedback saved but failed to send email."
            }), 500
            
    except Exception as e:
        print(f"Error in submit-feedback: {e}")
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

# ---------------------------
# Route: Get Feedback
# ---------------------------
@app.route('/get-feedback', methods=['GET'])
def get_feedback():
    try:
        feedbacks = list(feedback_collection.find({}, {"_id": 0}).sort("date", -1))
        return jsonify({"success": True, "feedbacks": feedbacks}), 200
    except Exception as e:
        print(f"Error in get-feedback: {e}")
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

# ---------------------------
# Route: Dynamic Weather Forecast
# ---------------------------
API_KEY = os.getenv("OPENWEATHER_API_KEY", "0f51e6473a43d5c5d10bfd4791d1ff0c")

@app.route("/api/weather", methods=["POST"])
def get_weather():
    try:
        data = request.get_json()
        city = data.get("city")
        arrival = data.get("arrival")
        departure = data.get("departure")

        if not city or not arrival or not departure:
            return jsonify({"error": "City, arrival, and departure are required"}), 400

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

        day_wise = {}

        for entry in forecast_data:
            dt = datetime.strptime(entry["dt_txt"], "%Y-%m-%d %H:%M:%S")
            if not (arrival_date <= dt.date() <= departure_date):
                continue

            date_only = dt.date()
            temp = entry["main"]["temp"]
            desc = entry["weather"][0]["description"]

            if date_only not in day_wise:
                day_wise[date_only] = {
                    "temps": [],
                    "descriptions": []
                }

            day_wise[date_only]["temps"].append(temp)
            day_wise[date_only]["descriptions"].append(desc)

        result = []
        for date, info in sorted(day_wise.items()):
            avg_temp = sum(info["temps"]) / len(info["temps"])
            common_desc = max(set(info["descriptions"]), key=info["descriptions"].count)
            category = "Not Ideal" if "rain" in common_desc.lower() or avg_temp < 10 else (
                "Good" if avg_temp <= 30 else "Average"
            )

            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "forecast": f"{common_desc.capitalize()}, {round(avg_temp)}°C",
                "category": category
            })

        return jsonify({"forecast": result})

    except Exception as e:
        print("❌ Error in /api/weather:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Route: Get News
# ---------------------------
@app.route('/api/news', methods=['GET'])
def get_news():
    try:
        # Fetch news related to Rajasthan tourism
        url = f"https://newsapi.org/v2/everything?q=rajasthan+tourism+travel&sortBy=publishedAt&language=en&apiKey={NEWS_API_KEY}"
        
        response = requests.get(url)
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch news"}), 500
            
        news_data = response.json()
        
        # Filter and format the news articles
        articles = []
        for article in news_data.get('articles', [])[:12]:  # Get first 12 articles
            if article.get('title') and article.get('title') != '[Removed]':
                articles.append({
                    'title': article.get('title', ''),
                    'description': article.get('description', ''),
                    'url': article.get('url', ''),
                    'imageUrl': article.get('urlToImage', ''),
                    'publishedAt': article.get('publishedAt', ''),
                    'source': article.get('source', {}).get('name', '')
                })
        
        return jsonify({"articles": articles})
        
    except Exception as e:
        print(f"Error fetching news: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Health Check
# ---------------------------
@app.route('/')
def home():
    return "✅ Flask Backend is Running!", 200

# ---------------------------
# Run App
# ---------------------------
if __name__ == '__main__':
    app.run(debug=True)