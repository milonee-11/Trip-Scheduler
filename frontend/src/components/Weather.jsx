// Weather.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import "./Dashboard.css";

const Weather = ({ username, onNext, onSave }) => {
  const [formData, setFormData] = useState({
    arrival: "",
    departure: "",
    city: "",
    budget: "",
  });

  const [weatherList, setWeatherList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`weatherData_${username}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setFormData({
        arrival: parsedData.arrival,
        departure: parsedData.departure,
        city: parsedData.city,
        budget: parsedData.budget,
      });
      if (parsedData.forecast) {
        setWeatherList(parsedData.forecast);
      }
      setConfirmed(true);
    }
    setInitialLoad(false);
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      alert("Please confirm your travel dates.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/weather", formData);
      setWeatherList(res.data.forecast || []);
      localStorage.setItem("selectedPlace", formData.city);

      const saveData = {
        ...formData,
        forecast: res.data.forecast,
      };
      localStorage.setItem(`weatherData_${username}`, JSON.stringify(saveData));

      if (typeof onSave === "function") {
        onSave(saveData);
      }

    } catch (error) {
      alert("❌ Error fetching weather.");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryScore = (cat) => {
    if (cat === "Good") return 3;
    if (cat === "Average") return 2;
    return 1;
  };

  const extractTemperature = (forecastText) => {
    const match = forecastText.match(/(\d{1,2})°C/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return (
    <>
      <div className="form-bubble-wrapper">
        <span className="bubble bubble1"></span>
        <span className="bubble bubble2"></span>
        <span className="bubble bubble3"></span>
        <span className="bubble bubble4"></span>

        <form onSubmit={handleSubmit} className="trip-form">
          <label>Arrival Date & Time:</label>
          <input 
            type="date" 
            name="arrival" 
            value={formData.arrival} 
            onChange={handleChange} 
            required 
          />

          <label>Departure Date & Time:</label>
          <input 
            type="date" 
            name="departure" 
            value={formData.departure} 
            onChange={handleChange} 
            required 
          />

          <label>Select City:</label>
          <select 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            required
          >
            <option value="">--Select--</option>
            <option value="Udaipur">Udaipur</option>
            <option value="Jaipur">Jaipur</option>
            <option value="Jaisalmer">Jaisalmer</option>
          </select>

          <label>Overall Budget (INR):</label>
          <input 
            type="number" 
            name="budget" 
            value={formData.budget} 
            onChange={handleChange} 
            min="2000"
            max="100000"
            required 
          />

          {!confirmed ? (
            <button type="button" onClick={() => setConfirmed(true)}>
              ✅ I'm sure about the dates
            </button>
          ) : (
            <button type="submit">
              {isLoading ? "Fetching..." : "Fetch Weather & Save Schedule"}
            </button>
          )}
        </form>
      </div>

      {!initialLoad && weatherList.length > 0 && (
        <div className="weather-graph-wrapper">
          <div className="weather-result">
            <h3>Weather Forecast for {formData.city}</h3>
            <ul>
              {weatherList.map((item, index) => (
                <li key={index}>
                  <strong>{item.date}:</strong> {item.forecast} — <em>{item.category}</em>
                </li>
              ))}
            </ul>
          </div>

          <div className="graph-section">
            <div className="chart-container">
              <h3>Temperature Forecast</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={weatherList.map(item => ({ 
                    date: item.date, 
                    temperature: extractTemperature(item.forecast) 
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="temperature" fill="#e67300" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Travel Suitability</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart 
                  data={weatherList.map(item => ({ 
                    date: item.date, 
                    score: categoryScore(item.category) 
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[1, 3]} ticks={[1, 2, 3]} />
                  <Tooltip 
                    formatter={(value) => {
                      if (value === 3) return "Good";
                      if (value === 2) return "Average";
                      return "Not Ideal";
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#c2185b" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {!initialLoad && weatherList.length === 0 && confirmed && !isLoading && (
        <div className="no-data-message">
          <p>📭 No weather data available for selected range.</p>
        </div>
      )}

      {weatherList.length > 0 && (
        <div className="next-button-wrapper">
          <button className="next-button" onClick={onNext}>
            Next →
          </button>
        </div>
      )}
    </>
  );
};

export default Weather;