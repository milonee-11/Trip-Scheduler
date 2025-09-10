import React, { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import rajasthaniBg from "../assets/rj.jpg";
import "./Accomodation.css";

const cityCoordinates = {
  Udaipur: [24.5854, 73.7125],
  Jaipur: [26.9124, 75.7873],
  Jaisalmer: [26.9157, 70.9083],
};

const Accomodation = ({ username, place }) => {
  const [budget, setBudget] = useState("");
  const [rooms, setRooms] = useState("1");
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchHotels = async () => {
    if (!budget || isNaN(budget) || Number(budget) <= 0) {
      alert("Please enter a valid budget.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/hotels", {
        budget: Number(budget),
        place
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        setHotels(response.data);
      } else {
        alert("No hotels found for the given criteria.");
        setHotels([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch hotels:", err);
      alert("Failed to fetch hotels. Please check the backend or network.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHotel = async (hotel) => {
    const total = Number(budget) * Number(rooms);
    setSelectedHotel(hotel);
    try {
      await axios.post("http://localhost:5000/api/selectHotel", {
        username,
        hotel,
        total
      });
    } catch (err) {
      console.error("❌ Failed to save selected hotel", err);
      alert("Failed to save selected hotel.");
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name?.toLowerCase().includes(search.toLowerCase())
  );

  const mapCenter = cityCoordinates[place] || [26.9124, 75.7873];

  return (
    <div
      className="accommodation-container"
      style={{ backgroundImage: `url(${rajasthaniBg})` }}
    >
      <h2 className="rajasthani-heading">🏨 Accommodation Recommender</h2>

      <div className="input-section">
        <input
          type="number"
          placeholder="Enter per day budget (₹)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <input
          type="number"
          placeholder="Enter number of rooms"
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
        />
        <button
          className="fetch-btn"
          onClick={handleFetchHotels}
          disabled={loading}
        >
          {loading ? "Fetching..." : "🔍 Fetch Hotels"}
        </button>
        <input
          type="text"
          placeholder="Search by hotel name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <MapContainer center={mapCenter} zoom={13} className="map-style">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredHotels.map((hotel, idx) => {
          const position = [hotel.lat ?? 26.9124, hotel.lon ?? 75.7873];
          return (
            <Marker
              key={idx}
              position={position}
              icon={
                new L.Icon({
                  iconUrl:
                    "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  iconSize: [30, 30],
                  iconAnchor: [15, 30],
                  popupAnchor: [0, -30]
                })
              }
              eventHandlers={{
                dblclick: () => handleSelectHotel(hotel)
              }}
            >
              <Popup>
                <div>
                  <strong>{hotel.name}</strong>
                  <br />
                  <img
                    src={
                      hotel.image ||
                      "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={hotel.name}
                    width="100"
                    style={{ borderRadius: "10px" }}
                  />
                  <br />
                  Price: ₹{hotel.price ?? "N/A"}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {selectedHotel && (
        <div className="selected-hotel">
          <h3>✅ Selected: {selectedHotel.name}</h3>
          <p>Total Cost: ₹{Number(budget) * Number(rooms)}</p>
        </div>
      )}
    </div>
  );
};

export default Accomodation;
