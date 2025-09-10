from pymongo import MongoClient
from datetime import datetime, timedelta
import random
from typing import List, Dict, Optional
import math
from collections import defaultdict
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import numpy as np

class ItineraryGenerator:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/touristattractions"):
        self.client = MongoClient(mongo_uri)
        self.db = self.client["touristattractions"]
        self.city_collections = {
            "jaipur": self.db["jaipur"],
            "jaisalmer": self.db["jaisalmer"],
            "udaipur": self.db["udaipur"]
        }
        
        # Initialize decision tree classifier
        self.decision_tree = DecisionTreeClassifier(random_state=42)
        self.label_encoders = {}
        self.is_trained = False
        
    def train_decision_tree(self, training_data: List[Dict]):
        """
        Train the decision tree classifier with historical data
        Format of training data: [
            {
                'weather': 'sunny',
                'hour_of_day': 14,
                'preference_indoor': True,
                'preference_outdoor': True,
                'preference_crowded': False,
                'success_score': 0.8  # Target variable (0-1)
            },
            ...
        ]
        """
        if not training_data:
            # Create some sample training data if none provided
            training_data = self._create_sample_training_data()
            
        # Prepare features and target
        X = []
        y = []
        
        for sample in training_data:
            features = []
            
            # Encode weather condition
            weather_encoder = self.label_encoders.setdefault('weather', LabelEncoder())
            if not hasattr(weather_encoder, 'classes_'):
                weather_encoder.fit(['sunny', 'cloudy', 'rainy', 'snowy', 'windy'])
            features.append(weather_encoder.transform([sample['weather']])[0])
            
            # Add hour of day
            features.append(sample['hour_of_day'])
            
            # Add preference flags
            features.append(1 if sample.get('preference_indoor', False) else 0)
            features.append(1 if sample.get('preference_outdoor', False) else 0)
            features.append(1 if sample.get('preference_crowded', False) else 0)
            
            X.append(features)
            y.append(sample['success_score'])
        
        # Train the classifier
        self.decision_tree.fit(X, y)
        self.is_trained = True
        
    def _create_sample_training_data(self):
        """Create sample training data for demonstration"""
        sample_data = []
        weather_conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy']
        
        for weather in weather_conditions:
            for hour in range(9, 18):  # 9 AM to 6 PM
                for indoor in [True, False]:
                    for outdoor in [True, False]:
                        for crowded in [True, False]:
                            # Simple rules for sample success scores
                            if weather == 'rainy' and outdoor:
                                score = 0.2  # Low score for outdoor activities in rain
                            elif weather == 'sunny' and indoor:
                                score = 0.6  # Moderate score for indoor on sunny days
                            elif hour in [12, 13] and crowded:  # Lunch time, crowded places
                                score = 0.4  # Lower score during peak hours
                            else:
                                score = 0.8  # Good score otherwise
                                
                            sample_data.append({
                                'weather': weather,
                                'hour_of_day': hour,
                                'preference_indoor': indoor,
                                'preference_outdoor': outdoor,
                                'preference_crowded': crowded,
                                'success_score': score
                            })
        
        return sample_data
        
    def predict_attraction_suitability(self, weather: str, hour: int, 
                                     preferences: Dict[str, bool]) -> float:
        """
        Predict how suitable an attraction is given current conditions
        
        Returns:
            Score between 0-1 indicating suitability (1 = highly suitable)
        """
        if not self.is_trained:
            # Train with sample data if not already trained
            self.train_decision_tree(None)
            
        # Prepare features for prediction
        features = []
        
        # Encode weather condition
        weather_encoder = self.label_encoders['weather']
        features.append(weather_encoder.transform([weather])[0])
        
        # Add hour of day
        features.append(hour)
        
        # Add preference flags
        features.append(1 if preferences.get('indoor', False) else 0)
        features.append(1 if preferences.get('outdoor', False) else 0)
        features.append(1 if preferences.get('crowded', False) else 0)
        
        # Make prediction
        suitability_score = self.decision_tree.predict([features])[0]
        return max(0, min(1, suitability_score))  # Ensure score is between 0-1
        
    def get_attractions(self, city: str, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetch attractions from MongoDB with optional filters"""
        if city.lower() not in self.city_collections:
            raise ValueError(f"No data available for city: {city}")
            
        collection = self.city_collections[city.lower()]
        query = {}
        
        if filters:
            if filters.get("avoid_crowd"):
                query["tags"] = {"$nin": ["crowded"]}
            if filters.get("indoor_only"):
                query["indoor_outdoor"] = "indoor"
            if filters.get("photography_only"):
                query["tags"] = {"$in": ["photography"]}
        
        return list(collection.find(query))

    def parse_opening_hours(self, opening_hours_str: str) -> Dict[str, str]:
        """Parse opening hours string into open/close times"""
        if not opening_hours_str:
            return {"open": "09:00", "close": "18:00"}
        
        parts = opening_hours_str.split('–')  # Note: This is an en dash, not hyphen
        if len(parts) != 2:
            return {"open": "09:00", "close": "18:00"}
            
        return {"open": parts[0].strip(), "close": parts[1].strip()}

    def time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM time string to minutes since midnight"""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except:
            return 540  # Default to 9:00 AM if parsing fails

    def minutes_to_time(self, minutes: int) -> str:
        """Convert minutes since midnight to HH:MM time string"""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"

    def is_time_between(self, check_time: str, start_time: str, end_time: str) -> bool:
        """Check if a time falls between two other times"""
        check = self.time_to_minutes(check_time)
        start = self.time_to_minutes(start_time)
        end = self.time_to_minutes(end_time)
        return start <= check <= end

    def generate_itinerary(
        self,
        city: str,
        arrival_date: str,
        departure_date: str,
        num_persons: int = 1,
        nationality: str = "Indian",
        weather_forecast: Optional[List[Dict]] = None,
        filters: Optional[Dict] = None,
        selected_attractions: Optional[List[str]] = None
    ) -> Dict:
       
        # Calculate trip duration
        start_date = datetime.strptime(arrival_date, "%Y-%m-%d")
        end_date = datetime.strptime(departure_date, "%Y-%m-%d")
        num_days = (end_date - start_date).days + 1
        
        # Get attractions from MongoDB
        all_attractions = self.get_attractions(city, filters)
        
        # Filter selected attractions if provided
        if selected_attractions:
            attractions = [a for a in all_attractions if str(a["_id"]) in selected_attractions]
        else:
            attractions = all_attractions
            
        # Classify attractions by indoor/outdoor
        indoor_attractions = [a for a in attractions if a.get("indoor_outdoor", "").lower() == "indoor"]
        outdoor_attractions = [a for a in attractions if a.get("indoor_outdoor", "").lower() != "indoor"]
        
        # Initialize itinerary structure
        itinerary = {
            "city": city,
            "start_date": arrival_date,
            "end_date": departure_date,
            "num_days": num_days,
            "num_persons": num_persons,
            "nationality": nationality,
            "days": []
        }
        
        # Process weather forecast if available
        weather_by_day = {}
        if weather_forecast:
            for i, forecast in enumerate(weather_forecast[:num_days]):
                date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                weather_by_day[date] = forecast.get("condition", "sunny").lower()
        
        # Extract preferences from filters
        preferences = {
            'indoor': filters.get('indoor_only', False) if filters else False,
            'outdoor': not filters.get('indoor_only', False) if filters else True,
            'crowded': not filters.get('avoid_crowd', False) if filters else True
        }
        
        # Distribute attractions across days
        for day in range(num_days):
            current_date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
            day_weather = weather_by_day.get(current_date, "sunny")
            
            # Determine suitable attractions for this day
            if day_weather in ["rainy", "snowy"]:
                day_attractions = indoor_attractions.copy()
            else:
                day_attractions = indoor_attractions + outdoor_attractions.copy()
                
            # Score attractions based on decision tree predictions
            scored_attractions = []
            for attraction in day_attractions:
                # Skip if we've already scheduled this attraction
                if any(a["_id"] == attraction["_id"] for day in itinerary["days"] for a in day["attractions"]):
                    continue
                    
                # Calculate suitability score
                opening_hours = self.parse_opening_hours(attraction.get("opening_hours", {}).get("daily", ""))
                open_time = self.time_to_minutes(opening_hours["open"])
                hour_of_day = open_time // 60  # Convert minutes to hour
                
                suitability_score = self.predict_attraction_suitability(
                    day_weather, hour_of_day, preferences
                )
                
                # Adjust score based on crowd preference
                if "crowded" in attraction.get("tags", []) and not preferences.get('crowded', True):
                    suitability_score *= 0.5
                
                scored_attractions.append((attraction, suitability_score))
            
            # Sort by suitability score (highest first)
            scored_attractions.sort(key=lambda x: x[1], reverse=True)
            day_attractions = [attraction for attraction, score in scored_attractions]
            
            # Schedule attractions for this day
            day_schedule = []
            current_time = self.time_to_minutes("09:00")  # Start at 9 AM
            
            for attraction in day_attractions:
                # Get attraction details
                opening_hours = self.parse_opening_hours(attraction.get("opening_hours", {}).get("daily", ""))
                open_time = self.time_to_minutes(opening_hours["open"])
                close_time = self.time_to_minutes(opening_hours["close"])
                duration = attraction.get("avg_visit_duration", 60)
                
                # Adjust start time if needed
                if current_time < open_time:
                    current_time = open_time
                    
                # Check if we have enough time before closing
                if current_time + duration > close_time:
                    continue
                    
                # Calculate entry fee
                entry_fee = attraction.get("entry_fee", {})
                fee = entry_fee.get("indian", 0) if nationality.lower() == "indian" else entry_fee.get("foreigner", 0)
                total_fee = fee * num_persons
                
                # Add to day's schedule
                day_schedule.append({
                    "attraction_id": str(attraction["_id"]),
                    "name": attraction["name"],
                    "category": attraction.get("category", ""),
                    "start_time": self.minutes_to_time(current_time),
                    "end_time": self.minutes_to_time(current_time + duration),
                    "duration": duration,
                    "location": {
                        "address": attraction.get("address", ""),
                        "latitude": attraction.get("latitude"),
                        "longitude": attraction.get("longitude")
                    },
                    "entry_fee": total_fee,
                    "image": attraction.get("images", ""),
                    "description": attraction.get("description", ""),
                    "suitability_score": next(score for att, score in scored_attractions if att["_id"] == attraction["_id"])
                })
                
                # Add travel time between attractions (30 mins default)
                current_time += duration + 30
                
                # Stop if we've reached evening (6 PM)
                if current_time >= self.time_to_minutes("18:00"):
                    break
                    
            # Add day to itinerary
            if day_schedule:
                itinerary["days"].append({
                    "date": current_date,
                    "weather": day_weather,
                    "attractions": day_schedule,
                    "total_duration": sum(a["duration"] for a in day_schedule),
                    "total_cost": sum(a["entry_fee"] for a in day_schedule)
                })
        
        # Calculate overall stats
        itinerary["total_cost"] = sum(day["total_cost"] for day in itinerary["days"])
        itinerary["total_attractions"] = sum(len(day["attractions"]) for day in itinerary["days"])
        
        return itinerary

    def optimize_itinerary(self, itinerary: Dict) -> Dict:
        """Optimize an existing itinerary by reordering attractions"""
        for day in itinerary["days"]:
            # Sort attractions by location to minimize travel time
            day["attractions"].sort(key=lambda x: (x["location"]["latitude"], x["location"]["longitude"]))
            
            # Recalculate times after sorting
            current_time = self.time_to_minutes("09:00")
            for attraction in day["attractions"]:
                opening_hours = self.parse_opening_hours(attraction.get("opening_hours", {}).get("daily", ""))
                open_time = self.time_to_minutes(opening_hours["open"])
                
                if current_time < open_time:
                    current_time = open_time
                    
                attraction["start_time"] = self.minutes_to_time(current_time)
                current_time += attraction["duration"]
                attraction["end_time"] = self.minutes_to_time(current_time)
                
                # Add travel time between attractions
                current_time += 30
                
        return itinerary

    def save_itinerary_to_db(self, itinerary: Dict, collection_name: str = "itineraries"):
        """Save generated itinerary to MongoDB"""
        collection = self.db[collection_name]
        result = collection.insert_one(itinerary)
        return result.inserted_id

# Example usage
if __name__ == "__main__":
    generator = ItineraryGenerator("mongodb://localhost:27017/touristattractions")
    
    # Sample weather forecast
    weather_forecast = [
        {"date": "2023-10-01", "condition": "sunny", "temp": 28},
        {"date": "2023-10-02", "condition": "rainy", "temp": 22},
        {"date": "2023-10-03", "condition": "cloudy", "temp": 25}
    ]
    
    # Generate itinerary
    itinerary = generator.generate_itinerary(
        city="jaipur",
        arrival_date="2023-10-01",
        departure_date="2023-10-03",
        num_persons=2,
        nationality="Indian",
        weather_forecast=weather_forecast,
        filters={"avoid_crowd": True}
    )
    
    # Optimize itinerary
    optimized = generator.optimize_itinerary(itinerary)
    
    # Save to database
    itinerary_id = generator.save_itinerary_to_db(optimized)
    print(f"Generated itinerary with ID: {itinerary_id}")