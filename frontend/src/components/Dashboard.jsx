import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import FooterSection from "./FooterSection";
import Weather from "./Weather";
import BackToTop from "./BackToTop";
import HotelRecommender from "./HotelRecommender";
import TouristAttraction from "./TouristAttraction";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const username = localStorage.getItem("username");
const navigate = useNavigate();

  // Redirect if username missing
  if (!username) {
    window.location.href = "/";
  }

  // State management
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [showTouristAttraction, setShowTouristAttraction] = useState(false);

  const [savedWeatherData, setSavedWeatherData] = useState(null);
  const [savedAccommodation, setSavedAccommodation] = useState(null);
  const [savedTouristData, setSavedTouristData] = useState(null);

  const [expandedCards, setExpandedCards] = useState({});

  // NEW: itinerary state to store data from TouristAttraction
  const [savedItineraryData, setSavedItineraryData] = useState(() => {
    const saved = localStorage.getItem(`savedItineraryData_${username}`);
    return saved ? JSON.parse(saved) : null;
  });

  // Load saved data on mount
  useEffect(() => {
    const savedWeather = localStorage.getItem(`weatherData_${username}`);
    const savedHotel = localStorage.getItem(`accommodation_${username}`);
    const savedTourist = localStorage.getItem(`touristData_${username}`);

    if (savedWeather) setSavedWeatherData(JSON.parse(savedWeather));
    if (savedHotel) setSavedAccommodation(JSON.parse(savedHotel));
    if (savedTourist) setSavedTouristData(JSON.parse(savedTourist));
  }, [username]);

  // Clear functions
  const clearSavedWeather = (e) => {
    e.stopPropagation();
    localStorage.removeItem(`weatherData_${username}`);
    setSavedWeatherData(null);
  };

  const clearAccommodation = () => {
    localStorage.removeItem(`accommodation_${username}`);
    setSavedAccommodation(null);
  };

  const clearTouristData = () => {
    localStorage.removeItem(`touristData_${username}`);
    setSavedTouristData(null);
  };

  const clearItineraryData = () => {
    localStorage.removeItem(`savedItineraryData_${username}`);
    setSavedItineraryData(null);
  };

  // Expand/collapse cards
  const toggleExpand = (key, e) => {
    if (e) e.stopPropagation();
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Memoized save tourist attraction data function (including confirmed places)
  const handleTouristSave = useCallback(
    (data) => {
      setSavedTouristData(data);
      localStorage.setItem(`touristData_${username}`, JSON.stringify(data));
    },
    [username]
  );

  // NEW: handler to save itinerary data received from TouristAttraction component
  const handleItinerarySave = useCallback(
    (data) => {
      setSavedItineraryData(data);
      localStorage.setItem(`savedItineraryData_${username}`, JSON.stringify(data));
    },
    [username]
  );


  //  const navigate = useNavigate();

  const goToBudgetPage = () => {
    navigate("/budget");  // Adjust path if needed
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Navbar />
      {/* Background Bubbles */}
      <div className="form-bubble-wrapper">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>

      <div className="dashboard-container">
        {/* Welcome Message */}
        <div className="welcome-message">
          <h1>स्वागत है,</h1>
          <h2>{username}!</h2>
        </div>

        {/* Render main forms above the cards, only one at a time */}
        {!showAccommodation && !showTouristAttraction && (
          <Weather
            username={username}
            onNext={() => setShowAccommodation(true)}
            onSave={(data) => setSavedWeatherData(data)}
          />
        )}

        {showAccommodation && !showTouristAttraction && (
          <HotelRecommender
            username={username}
            onSave={(data) => {
              setSavedAccommodation(data);
              setShowAccommodation(true);
            }}
          />
        )}

        {showTouristAttraction && (
          <TouristAttraction
            savedTouristData={savedTouristData}
            savedWeatherData={savedWeatherData}
            onSave={handleTouristSave}
            onItinerarySave={handleItinerarySave}  
          />
        )}

        {/* Dashboard Cards */}
        <div className="dashboard-cards">
       {/* 🌤️ Weather Card */}
<div
  className="dashboard-card"
  style={{ cursor: "pointer" }}
  onClick={() => {
    setShowAccommodation(false);
    setShowTouristAttraction(false);
  }}
>
  <div className="card-header">🌤️ Weather Forecast</div>
  <div className="card-content">
    {savedWeatherData ? (
      <>
        <p>
          <strong>City:</strong> {savedWeatherData.city}
        </p>
        <p>
          <strong>Arrival:</strong> {savedWeatherData.arrival}
        </p>
        <p>
          <strong>Departure:</strong> {savedWeatherData.departure}
        </p>
        <p>
          <strong>Budget:</strong> ₹{savedWeatherData.budget}
        </p>

        {expandedCards.weather && (
          <>
            <p>
              <strong>Forecast Summary:</strong>
            </p>
            <ul>
              {savedWeatherData.forecast.map((item, index) => (
                <li key={index}>
                  {item.date}: {item.forecast} — {item.category}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="card-buttons">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowAccommodation(false);
              setShowTouristAttraction(false);
              window.scrollTo(0, 0);
            }}
            className="primary-btn arrow-action-btn"
          >
            View Weather Details
            <span className="action-arrow"></span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand("weather", e);
            }}
          >
            {expandedCards.weather ? "See Less" : "See More"}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              clearSavedWeather(e);
            }} 
            className="clear-btn"
          >
            🗑️ Clear
          </button>
        </div>
      </>
    ) : (
      <p>No forecast saved. Please fill in your trip details.</p>
    )}
  </div>
</div>

{/* 🏨 Accommodation Card */}
<div className="dashboard-card">
  <div className="card-header">🏨 Accommodation</div>
  <div className="card-content">
    {savedAccommodation ? (
      <>
        <p>
          <strong>Hotel:</strong> {savedAccommodation.hotel.name}
        </p>
        <p>
          <strong>Price:</strong> ₹{savedAccommodation.hotel.price}
        </p>
        <p>
          <strong>Rooms:</strong> {savedAccommodation.rooms}
        </p>
        <p>
          <strong>Total:</strong> ₹{savedAccommodation.total}
        </p>

        {expandedCards.accommodation && (
          <p>
            You can access your full hotel recommendations or modify your selection.
          </p>
        )}

        <div className="card-buttons">
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem("scrollToHotelFilter", "true");
              setShowAccommodation(true);
              setShowTouristAttraction(false);
              window.scrollTo(0, 0);
            }}
            className="primary-btn arrow-action-btn"
          >
            Show Recommendations
            <span className="action-arrow"></span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand("accommodation");
            }}
          >
            {expandedCards.accommodation ? "See Less" : "See More"}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              clearAccommodation();
            }} 
            className="clear-btn"
          >
            🗑️ Clear
          </button>
        </div>
      </>
    ) : (
      <>
        <p>View your recommended stays after weather confirmation.</p>
        {expandedCards.accommodation && (
          <p>
            Click below to access personalized hotel recommendations based on your trip.
          </p>
        )}
        <div className="card-buttons">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAccommodation(true);
              setShowTouristAttraction(false);
              window.scrollTo(0, 0);
            }}
            className="primary-btn arrow-action-btn"
          >
            Show Recommendations
            <span className="action-arrow"></span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand("accommodation");
            }}
          >
            {expandedCards.accommodation ? "See Less" : "See More"}
          </button>
        </div>
      </>
    )}
  </div>
</div>

{/* 📸 Tourist Spots Card */}
<div className="dashboard-card">
  <div className="card-header">📸 Tourist Spots</div>
  <div className="card-content">
    {savedItineraryData ? (
      <>
        <p>
          <strong>Saved Itinerary Summary:</strong>
        </p>

        {savedItineraryData.itineraryByDay.map((dayItems, dayIndex) => (
          <div key={dayIndex} style={{ marginBottom: "0.75rem" }}>
            <strong>Day {dayIndex + 1}:</strong>
            {dayItems.length === 0 ? (
              <span> No activities scheduled</span>
            ) : expandedCards.spots ? (
              <ul style={{ marginTop: "0.25rem" }}>
                {dayItems.map((item) => (
                  <li key={item._id}>
                    <strong>{item.name}</strong> ({item.visitStartTime} - {item.visitEndTime}) | ₹
                    {item.calculatedFees}
                  </li>
                ))}
              </ul>
            ) : (
              <span> {dayItems.length} activities selected</span>
            )}
          </div>
        ))}

        <p>
          <strong>Total Estimated Fees:</strong> ₹{savedItineraryData.totalFee}
        </p>

        {expandedCards.spots && (
          <p style={{ fontStyle: "italic", color: "#555" }}>
            Saved on: {new Date(savedItineraryData.savedAt).toLocaleString()}
          </p>
        )}

        <div className="card-buttons">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTouristAttraction(true);
              setShowAccommodation(false);
              window.scrollTo(0, 0);
            }}
            className="green-btn arrow-action-btn"
          >
            View Tourist Spots
            <span className="action-arrow"></span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand("spots");
            }}
          >
            {expandedCards.spots ? "See Less" : "See More"}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              clearItineraryData();
            }} 
            className="clear-btn"
          >
            🗑️ Clear
          </button>
        </div>
      </>
    ) : (
      <>
        <p>Explore must-visit tourist attractions based on your city.</p>
        {expandedCards.spots && <p>Soon you'll see top-rated places, monuments, and cultural highlights.</p>}
        <div className="card-buttons">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTouristAttraction(true);
              setShowAccommodation(false);
              window.scrollTo(0, 0);
            }}
            className="green-btn arrow-action-btn"
          >
            View Tourist Spots
            <span className="action-arrow"></span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand("spots");
            }}
          >
            {expandedCards.spots ? "See Less" : "See More"}
          </button>
        </div>
      </>
    )}
  </div>
</div>

{/* 💰 Budget Alert Card */}
<div className="dashboard-card">
  <div className="card-header">💰 Budget Alert</div>
  <div className="card-content">
    <p>Set budgets and track expenses during your trip.</p>
    {expandedCards.budget && (
      <p>Coming soon: Integration with an expense tracker for real-time budget alerts!</p>
    )}
    <div className="card-buttons">
      <button 
        onClick={goToBudgetPage}
        className="budget-btn arrow-action-btn"
      >
        Budget Details
        <span className="action-arrow"></span>
      </button>
     
    </div>
  </div>
</div>



    
        </div>
      </div>

      {/* Back to top & footer */}
      <BackToTop />
      <FooterSection />
    </>
  );
};

export default Dashboard;





