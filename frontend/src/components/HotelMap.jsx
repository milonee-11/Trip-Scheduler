import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Component to dynamically fit map bounds
const FitBounds = ({ hotels }) => {
  const map = useMap();
  useEffect(() => {
    const validCoords = hotels
      .filter((h) => h.lat && h.lon)
      .map((h) => [h.lat, h.lon]);

    if (validCoords.length > 0) {
      map.fitBounds(validCoords, { padding: [50, 50] });
    }
  }, [hotels, map]);
  return null;
};

const HotelMap = ({ hotels }) => {
  const validHotels = hotels.filter((hotel) => hotel.lat && hotel.lon);

  // Default center for Udaipur (if no hotels)
  const defaultCenter = [24.5854, 73.7125];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom={false}
      style={{
        height: "100%",
        width: "100%",
        border: "none",
        zIndex: 1,
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds hotels={validHotels} />

      {validHotels.map((hotel, index) => (
        <CircleMarker
          key={index}
          center={[hotel.lat, hotel.lon]}
          radius={8}
          pathOptions={{
            color: "#e67e22",
            fillColor: "#e67e22",
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <div style={{ fontSize: "14px", lineHeight: "1.4", textAlign: "center" }}>
              <strong>{hotel.name}</strong>
              <br />
              ₹{hotel.price} / night
              {hotel.image && (
                <div style={{ marginTop: "8px" }}>
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    style={{
                      width: "100px",
                      height: "70px",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default HotelMap;
