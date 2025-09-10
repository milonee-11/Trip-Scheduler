import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  ResponsiveContainer,
} from "recharts";
import "./TouristAttraction.css";

const COLORS = ["#FF8042", "#0088FE", "#00C49F", "#FFBB28", "#A020F0", "#FF4C4C"];

const TouristAttraction = ({ savedTouristData, onSave, savedWeatherData, onItinerarySave ,username}) => {
  const city = savedWeatherData?.city || "";
  const arrival = savedWeatherData?.arrival || "";
  const departure = savedWeatherData?.departure || "";
  // const navigate = useNavigate();
  const actualNumDays = (() => {
    if (!arrival || !departure) return 1;
    const diff = (new Date(departure) - new Date(arrival)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.ceil(diff) : 1;
  })();

  // Number of days state, restricted
  const [numDays, setNumDays] = useState(() => {
    if (savedTouristData?.numDays) {
      if (savedTouristData.numDays > actualNumDays) {
        alert(
          `Number of days (${savedTouristData.numDays}) is greater than the actual stay duration (${actualNumDays}). It has been adjusted automatically.`
        );
        return actualNumDays;
      }
      return savedTouristData.numDays;
    }
    return actualNumDays;
  });

  const [numPersons, setNumPersons] = useState(savedTouristData?.numPersons || 1);
  const [nationality, setNationality] = useState(savedTouristData?.nationality || "Indian");

  const [attractions, setAttractions] = useState([]);
  const [filteredAttractions, setFilteredAttractions] = useState([]);
  const [selectedAttractions, setSelectedAttractions] = useState(savedTouristData?.selectedAttractions || []);
  const [filters, setFilters] = useState(
    savedTouristData?.filters || {
      avoidCrowd: false,
      indoorOnly: false,
      photographyOnly: false,
    }
  );

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAttractionDetail, setSelectedAttractionDetail] = useState(null);
  const [visitTimes, setVisitTimes] = useState(savedTouristData?.visitTimes || {});
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAttraction, setEditAttraction] = useState(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [savedItineraryData, setSavedItineraryData] = useState(() => {
    const saved = localStorage.getItem(`savedItineraryData_${username}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [statsData, setStatsData] = useState([]);
  const [saved, setSaved] = useState(false);

  const parseOpeningHours = (openingHoursStr) => {
    if (!openingHoursStr) return { open: "09:00", close: "18:00" };
    const parts = openingHoursStr.split(/[–-]/);
    if (parts.length !== 2) return { open: "09:00", close: "18:00" };
    return { open: parts[0].trim(), close: parts[1].trim() };
  };

  const timeLessThan = (time1, time2) => {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    if (h1 < h2) return true;
    if (h1 === h2 && m1 < m2) return true;
    return false;
  };

  const validateVisitTimeWithinOpening = (start, end, open, close) => {
    if (!timeLessThan(start, end)) return false;
    if (timeLessThan(start, open)) return false;
    if (timeLessThan(close, end)) return false;
    return true;
  };

  const parseTimeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const formatMinutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // --- Fetch attractions ---
  useEffect(() => {
    if (!city) return;

    setLoading(true);
    axios
      .get(`http://localhost:5000/api/attractions/${city.toLowerCase()}`)
      .then((res) => {
        const data = res.data || [];
        setAttractions(data);
        setFilteredAttractions(data);

        const initialStats = data.map(attraction => ({
          name: attraction.name || "Unknown",
          value: isNaN(Number(attraction.visits)) ? 0 : Number(attraction.visits),
          id: attraction._id
        }));

        setStatsData(initialStats);

        if (!savedTouristData) {
          setSelectedAttractions([]);
          setFilters({
            avoidCrowd: false,
            indoorOnly: false,
            photographyOnly: false,
          });
          setNumDays(actualNumDays);
          setVisitTimes({});
          setShowConfirmStep(false);
          setNumPersons(1);
          setNationality("Indian");
        }
      })
      .catch((err) => {
        console.error("Error fetching attractions:", err);
        setAttractions([]);
        setFilteredAttractions([]);
        setStatsData([]);
      })
      .finally(() => setLoading(false));
  }, [city, actualNumDays, savedTouristData]);

  // --- Fetch weather data ---
  useEffect(() => {
    if (!city || !arrival || !departure) return;

    axios
      .get(
        `http://localhost:5000/api/weather?city=${encodeURIComponent(
          city.toLowerCase()
        )}&start=${arrival}&end=${departure}`
      )
      .then((res) => {
        const data = res.data || [];
        const normalized = data.map((d) => {
          const isBad = d.rain > 0 || d.temp < 10 || d.temp > 35 ||
            (d.condition && /rain|storm|snow|shower/i.test(d.condition));
          return { ...d, isBad };
        });
        setWeatherForecast(normalized);
      })
      .catch((err) => {
        console.warn("Weather fetch failed:", err);
        setWeatherForecast([]);
      });
  }, [city, arrival, departure]);

  // --- Filters ---
  useEffect(() => {
    let filtered = [...attractions];
    if (filters.avoidCrowd) {
      filtered = filtered.filter((a) => !a.tags?.includes("crowded"));
    }
    if (filters.indoorOnly) {
      filtered = filtered.filter((a) => a.indoor_outdoor === "indoor");
    }
    if (filters.photographyOnly) {
      filtered = filtered.filter((a) => a.tags?.includes("photography"));
    }
    setFilteredAttractions(filtered);
  }, [filters, attractions]);

  // --- Save data ---
  useEffect(() => {
    if (typeof onSave === "function") {
      onSave({
        numDays,
        numPersons,
        nationality,
        selectedAttractions,
        filters,
        visitTimes,
      });
    }
  }, [numDays, numPersons, nationality, selectedAttractions, filters, visitTimes, onSave]);

  // --- Number of Days input restriction and warning ---
  const handleNumDaysChange = (value) => {
    const val = Number(value);
    if (val < 1) {
      setNumDays(1);
      return;
    }
    if (val > actualNumDays) {
      alert(`Number of days cannot exceed your stay duration of ${actualNumDays} days.`);
      setNumDays(actualNumDays);
      return;
    }
    setNumDays(val);
  };

  // --- Dynamic distribution of attractions over days based on weather ---
  // --- Dynamic distribution of attractions over days based on weather ---
useEffect(() => {
  if (selectedAttractions.length === 0 || numDays < 1) return;

  const distributeAttractions = () => {
    const newVisitTimes = {...visitTimes};

    // Separate indoor and outdoor attractions
    const indoor = [];
    const outdoor = [];
    selectedAttractions.forEach(id => {
      const attr = attractions.find(a => a._id === id);
      if (!attr) return;
      if (attr.indoor_outdoor === "indoor") indoor.push(attr);
      else outdoor.push(attr);
    });

    // Days with good weather
    const goodDays = [];
    for (let i = 0; i < numDays; i++) {
      goodDays.push(!(weatherForecast[i]?.isBad));
    }

    // Helper function to count attractions per day
    const countAttractionsPerDay = (day) => {
      return Object.values(newVisitTimes).filter(vt => vt && vt.day === day).length;
    };

    // Assign outdoor attractions to good weather days first
    outdoor.forEach(attr => {
      let assignedDay = null;
      let minCount = Infinity;

      // Try to assign to a good weather day with least attractions
      for (let d = 0; d < numDays; d++) {
        if (goodDays[d]) {
          const count = countAttractionsPerDay(d + 1);
          if (count < minCount) {
            minCount = count;
            assignedDay = d + 1;
          }
        }
      }
      
      // If no good day found, assign to any day with least attractions
      if (assignedDay === null) {
        minCount = Infinity;
        for (let d = 0; d < numDays; d++) {
          const count = countAttractionsPerDay(d + 1);
          if (count < minCount) {
            minCount = count;
            assignedDay = d + 1;
          }
        }
      }

      // Get opening hours
      const { open, close } = parseOpeningHours(attr.opening_hours?.daily);
      const openMin = parseTimeToMinutes(open);
      const closeMin = parseTimeToMinutes(close);
      const duration = attr.avg_visit_duration || 60;

      // Find a time slot that doesn't conflict with existing attractions
      let startMin = openMin;
      let endMin = startMin + duration;
      let foundSlot = false;

      while (!foundSlot && startMin <= closeMin - duration) {
        let hasConflict = false;
        
        // Check against all existing attractions on this day
        for (const [id, vt] of Object.entries(newVisitTimes)) {
          if (!vt || vt.day !== assignedDay) continue;
          
          const otherStart = parseTimeToMinutes(vt.visitStartTime);
          const otherEnd = parseTimeToMinutes(vt.visitEndTime);
          
          if (startMin < otherEnd && endMin > otherStart) {
            hasConflict = true;
            break;
          }
        }
        
        if (!hasConflict) {
          foundSlot = true;
        } else {
          // Try next 30-minute slot
          startMin += 30;
          endMin = startMin + duration;
        }
      }

      // If no slot found, use opening time (will show warning)
      if (!foundSlot) {
        startMin = openMin;
        endMin = startMin + duration;
        if (endMin > closeMin) endMin = closeMin;
      }

      newVisitTimes[attr._id] = {
        day: assignedDay,
        visitStartTime: formatMinutesToTime(startMin),
        visitEndTime: formatMinutesToTime(endMin),
      };
    });

    // Assign indoor attractions to any day with least attractions
    indoor.forEach(attr => {
      let assignedDay = null;
      let minCount = Infinity;
      
      // Find day with least attractions
      for (let d = 0; d < numDays; d++) {
        const count = countAttractionsPerDay(d + 1);
        if (count < minCount) {
          minCount = count;
          assignedDay = d + 1;
        }
      }

      // Get opening hours
      const { open, close } = parseOpeningHours(attr.opening_hours?.daily);
      const openMin = parseTimeToMinutes(open);
      const closeMin = parseTimeToMinutes(close);
      const duration = attr.avg_visit_duration || 60;

      // Find a time slot that doesn't conflict with existing attractions
      let startMin = openMin;
      let endMin = startMin + duration;
      let foundSlot = false;

      while (!foundSlot && startMin <= closeMin - duration) {
        let hasConflict = false;
        
        // Check against all existing attractions on this day
        for (const [id, vt] of Object.entries(newVisitTimes)) {
          if (!vt || vt.day !== assignedDay) continue;
          
          const otherStart = parseTimeToMinutes(vt.visitStartTime);
          const otherEnd = parseTimeToMinutes(vt.visitEndTime);
          
          if (startMin < otherEnd && endMin > otherStart) {
            hasConflict = true;
            break;
          }
        }
        
        if (!hasConflict) {
          foundSlot = true;
        } else {
          // Try next 30-minute slot
          startMin += 30;
          endMin = startMin + duration;
        }
      }

      // If no slot found, use opening time (will show warning)
      if (!foundSlot) {
        startMin = openMin;
        endMin = startMin + duration;
        if (endMin > closeMin) endMin = closeMin;
      }

      newVisitTimes[attr._id] = {
        day: assignedDay,
        visitStartTime: formatMinutesToTime(startMin),
        visitEndTime: formatMinutesToTime(endMin),
      };
    });

    setVisitTimes(newVisitTimes);
  };

  distributeAttractions();
}, [selectedAttractions, numDays, weatherForecast]);

  const toggleSelectAttraction = (id) => {
    setSelectedAttractions(prev => {
      if (prev.includes(id)) {
        // Deselect: remove attraction
        setVisitTimes(prevTimes => {
          const copy = { ...prevTimes };
          delete copy[id];
          return copy;
        });
        return prev.filter(sid => sid !== id);
      } else {
        // Select: add attraction and let useEffect handle distribution
        return [...prev, id];
      }
    });
  };

  const calculateFees = (attraction) => {
    if (!attraction.entry_fee) return 0;
    const feePerPerson = nationality === "Indian"
      ? attraction.entry_fee.indian || 0
      : attraction.entry_fee.foreigner || 0;
    return feePerPerson * numPersons;
  };

  const fetchStats = () => {
    if (!city) {
      alert("City unknown, cannot fetch stats.");
      return;
    }

    const applyFilters = (list) => {
      return list.filter(att => {
        if (filters.avoidCrowd && att.crowded) return false;
        if (filters.indoorOnly && att.outdoor) return false;
        if (filters.photographyOnly && !att.photographySpots) return false;
        return true;
      });
    };

    const filteredAttractionsForStats = applyFilters(attractions);

    const finalData = filteredAttractionsForStats.map(place => {
      const visits = Math.floor(Math.random() * 901) + 100;
      let popularity, color;

      if (visits > 700) {
        popularity = "High";
        color = "green";
      } else if (visits > 400) {
        popularity = "Medium";
        color = "orange";
      } else {
        popularity = "Low";
        color = "red";
      }

      return {
        name: place.name,
        visits,
        rating: (Math.random() * 5).toFixed(1),
        popularity,
        color
      };
    });

    setStatsData(
      finalData.length > 0
        ? finalData
        : [{ name: "No Places", visits: 0, rating: "0.0", popularity: "Low", color: "#ccc" }]
    );

    setShowStatsModal(true);
  };

  const [customPlaceForm, setCustomPlaceForm] = useState({
    name: "",
    description: "",
    address: "",
    entry_fee_indian: 0,
    entry_fee_foreigner: 0,
    indoor_outdoor: "outdoor",
    avg_visit_duration: 60,
    opening_hours_daily: "09:00-18:00",
    tags: "",
    images: "",
  });

  const handleCustomPlaceChange = (field, value) => {
    setCustomPlaceForm(prev => ({ ...prev, [field]: value }));
  };

  const addCustomPlace = () => {
    if (!customPlaceForm.name.trim()) {
      alert("Place name is required.");
      return;
    }
    if (!customPlaceForm.description.trim()) {
      alert("Description is required.");
      return;
    }
    if (!customPlaceForm.address.trim()) {
      alert("Address is required.");
      return;
    }
    if (!customPlaceForm.opening_hours_daily.trim()) {
      alert("Opening hours are required.");
      return;
    }

    if (Number(customPlaceForm.entry_fee_indian) < 0 || Number(customPlaceForm.entry_fee_foreigner) < 0) {
      alert("Entry fees cannot be negative.");
      return;
    }

    if (
      Number(customPlaceForm.avg_visit_duration) < 15 ||
      Number(customPlaceForm.avg_visit_duration) > 600
    ) {
      alert("Average visit duration must be between 15 and 600 minutes.");
      return;
    }

    const imagesArray = customPlaceForm.images
      .split(",")
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const newPlace = {
      _id: `custom_${Date.now()}`,
      name: customPlaceForm.name.trim(),
      description: customPlaceForm.description.trim(),
      address: customPlaceForm.address.trim(),
      entry_fee: {
        indian: Number(customPlaceForm.entry_fee_indian) || 0,
        foreigner: Number(customPlaceForm.entry_fee_foreigner) || 0,
      },
      indoor_outdoor: customPlaceForm.indoor_outdoor,
      avg_visit_duration: Number(customPlaceForm.avg_visit_duration) || 60,
      opening_hours: {
        daily: customPlaceForm.opening_hours_daily,
      },
      tags: customPlaceForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      visits: 0,
      images: imagesArray,
    };

    setAttractions(prev => [...prev, newPlace]);
    setFilteredAttractions(prev => [...prev, newPlace]);
    
    setCustomPlaceForm({
      name: "",
      description: "",
      address: "",
      entry_fee_indian: 0,
      entry_fee_foreigner: 0,
      indoor_outdoor: "outdoor",
      avg_visit_duration: 60,
      opening_hours_daily: "09:00-18:00",
      tags: "",
      images: "",
    });

    setCustomModalOpen(false);
    alert("Custom place added.");
  };

  const saveItineraryToDashboard = () => {
    const dataToSave = {
      itineraryByDay,
      totalFee,
      savedAt: new Date().toISOString(),
    };

    setSavedItineraryData(dataToSave);
    localStorage.setItem(`savedItineraryData_${username}`, JSON.stringify(dataToSave));

    const placeCounts = {};
    itineraryByDay.forEach(dayItems => {
      dayItems.forEach(item => {
        placeCounts[item.name] = (placeCounts[item.name] || 0) + 1;
      });
    });

    const newStatsData = Object.entries(placeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    setStatsData(newStatsData);
    setSaved(true);

    if (onItinerarySave) {
      onItinerarySave(dataToSave);
    }

    alert("Itinerary saved successfully!");
    setShowConfirmStep(false);
  };

  // Itinerary by day sorted by start time
  const itineraryByDay = [];
  for (let i = 1; i <= numDays; i++) {
    const dayItems = selectedAttractions
      .map(id => {
        const attr = attractions.find(a => a._id === id);
        if (!attr) return null;
        const vt = visitTimes[id];
        if (!vt || vt.day !== i) return null;

        return {
          ...attr,
          visitStartTime: vt.visitStartTime,
          visitEndTime: vt.visitEndTime,
          calculatedFees: calculateFees(attr),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.visitStartTime < b.visitStartTime ? -1 : 1));
    itineraryByDay.push(dayItems);
  }

  const totalFee = itineraryByDay.reduce(
    (sum, day) => sum + day.reduce((dSum, item) => dSum + item.calculatedFees, 0),
    0
  );



  const [editModalData, setEditModalData] = useState({
  day: 1,
  visitStartTime: "10:00",
  visitEndTime: "12:00"
});

// Initialize modal data when opening
useEffect(() => {
  if (editModalOpen && editAttraction) {
    const currentTime = visitTimes[editAttraction._id] || {
      day: 1,
      visitStartTime: "10:00",
      visitEndTime: "12:00"
    };
    setEditModalData(currentTime);
  }
}, [editModalOpen, editAttraction]);
  return (
    <div className="ta-container">
      {/* Header and controls */}
      <h2 className="ta-heading">Tourist Attractions in {city}</h2>
      <p className="ta-subtitle">
        Arrival: {arrival} | Departure: {departure}
      </p>

      {/* Stats and custom place buttons */}
      <div className="ta-controls" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button 
          className="primary-btn" 
          onClick={fetchStats}
        >
          Highest Visited Places
        </button>
        {/* <button 
          className="secondary-btn"
          onClick={() => setCustomModalOpen(true)}
        >
          Customize Places
        </button> */}
      </div>

      {/* Global inputs */}
      <div className="ta-global-inputs">
        <label>
          Number of Days:
          <input
            type="number"
            min="1"
            max={actualNumDays}
            value={numDays}
            onChange={(e) => handleNumDaysChange(e.target.value)}
            disabled={showConfirmStep}
          />
        </label>
        <label>
          Number of Persons:
          <input
            type="number"
            min="1"
            max="20"
            value={numPersons}
            onChange={(e) => setNumPersons(Math.max(1, Math.min(20, +e.target.value)))}
            disabled={showConfirmStep}
          />
        </label>
        <label>
          Nationality:
          <select 
            value={nationality} 
            onChange={(e) => setNationality(e.target.value)}
            disabled={showConfirmStep}
          >
            <option value="Indian">Indian</option>
            <option value="Foreigner">Foreigner</option>
          </select>
        </label>
      </div>

      {/* Filters */}
      <div className="ta-filters">
        <label>
          <input
            type="checkbox"
            name="avoidCrowd"
            checked={filters.avoidCrowd}
            onChange={(e) => setFilters({...filters, avoidCrowd: e.target.checked})}
            disabled={showConfirmStep}
          />
          Avoid Crowded Places
        </label>
        <label>
          <input
            type="checkbox"
            name="indoorOnly"
            checked={filters.indoorOnly}
            onChange={(e) => setFilters({...filters, indoorOnly: e.target.checked})}
            disabled={showConfirmStep}
          />
          Indoor Only
        </label>
        <label>
          <input
            type="checkbox"
            name="photographyOnly"
            checked={filters.photographyOnly}
            onChange={(e) => setFilters({...filters, photographyOnly: e.target.checked})}
            disabled={showConfirmStep}
          />
          Photography Spots Only
        </label>
      </div>

      {/* Attraction grid */}
      {loading ? (
        <p className="ta-loading">Loading attractions...</p>
      ) : filteredAttractions.length === 0 ? (
        <p className="ta-no-data">No attractions found matching filters.</p>
      ) : (
        <div className="ta-grid">
          {filteredAttractions.map((attraction) => {
            const isSelected = selectedAttractions.includes(attraction._id);
            const vt = visitTimes[attraction._id];

            const [openTime, closeTime] = attraction.opening_hours?.daily
              ? attraction.opening_hours.daily.split("–")
              : ["00:00", "23:59"];

            const isVisitTimeValid =
              vt &&
              vt.visitStartTime >= openTime &&
              vt.visitEndTime <= closeTime &&
              vt.visitStartTime < vt.visitEndTime;

            return (
              <div
                key={attraction._id}
                className={`ta-card ${isSelected ? "ta-card-selected" : ""}`}
                title={
                  vt && !isVisitTimeValid
                    ? `Visit time outside opening hours (${openTime}–${closeTime})`
                    : undefined
                }
                style={{ cursor: "default" }}
              >
                <img
                  src={attraction.images?.[0] || "/placeholder-image.png"}
                  alt={attraction.name}
                  className="ta-card-image"
                  onClick={() => {
                    setSelectedAttractionDetail(attraction);
                    setModalOpen(true);
                  }}
                />
                <div className="ta-card-content">
                  <h3>{attraction.name}</h3>
                  <p>
                    {attraction.description?.slice(0, 100)}
                    {attraction.description?.length > 100 ? "..." : ""}
                  </p>
                  <p>
                    <strong>Address:</strong> {attraction.address || "N/A"}
                  </p>
                  <p>
                    <strong>Entry Fee:</strong>{" "}
                    {calculateFees(attraction) > 0 ? `₹${calculateFees(attraction)}` : "Free"}
                  </p>
                  {vt && (
                    <div
                      className="ta-visit-time"
                      style={{ color: isVisitTimeValid ? "inherit" : "#c0392b", fontWeight: "600" }}
                    >
                      Day {vt.day}: {vt.visitStartTime} - {vt.visitEndTime}{" "}
                      {!isVisitTimeValid && "(Outside opening hours)"}
                    </div>
                  )}
                  <div className="ta-card-actions">
                    <button
                      onClick={() => toggleSelectAttraction(attraction._id)}
                      className={isSelected ? "selected-btn" : "select-btn"}
                    >
                      {isSelected ? "Deselect" : "Select"}
                    </button>
                    <button
                      onClick={() => {
                        setEditAttraction(attraction);
                        setEditModalOpen(true);
                      }}
                      className="edit-btn"
                      disabled={!isSelected}
                      title={isSelected ? "Edit Timing" : "Select place first to edit timing"}
                      style={{
                        cursor: isSelected ? "pointer" : "not-allowed",
                        opacity: isSelected ? 1 : 0.5,
                      }}
                    >
                      Edit Timing
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current selections preview */}
      <div className="ta-itinerary-preview">
        <h3>Your Current Selections</h3>
        {selectedAttractions.length === 0 ? (
          <p>No attractions selected yet.</p>
        ) : (
          <>
            {itineraryByDay.map((dayItems, dayIndex) => (
              <div key={dayIndex} className="ta-itinerary-day">
                <h4>Day {dayIndex + 1}</h4>
                {dayItems.length === 0 ? (
                  <p>No attractions scheduled</p>
                ) : (
                  <ul>
                    {dayItems.map(item => (
                      <li key={item._id}>
                        <strong>{item.name}</strong>: {item.visitStartTime} - {item.visitEndTime} | ₹{item.calculatedFees}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <p className="ta-total-fee">Total Estimated Fees: ₹{totalFee}</p>
            <button 
              className="confirm-btn"
              onClick={() => setShowConfirmStep(true)}
            >
              Confirm Selections
            </button>
          </>
        )}
      </div>

     {/* Confirmed itinerary modal */}
{showConfirmStep && (
  <div className="ta-modal-overlay">
    <div className="ta-modal">
      <div className="ta-modal-content">
        <button className="ta-modal-close" onClick={() => setShowConfirmStep(false)}>
          &times;
        </button>
        <h3>Your Confirmed Itinerary</h3>
        {itineraryByDay.map((dayItems, dayIndex) => (
          <div key={dayIndex}>
            <h4>Day {dayIndex + 1}</h4>
            {dayItems.length === 0 ? (
              <p>No activities scheduled</p>
            ) : (
              <ul>
                {dayItems.map(item => (
                  <li key={item._id}>
                    <strong>{item.name}</strong> ({item.visitStartTime}-{item.visitEndTime})<br />
                    Address: {item.address}<br />
                    Fees: ₹{item.calculatedFees}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {(!saved || saved) && (
          <button
            className="modify-btn"
            onClick={() => {
              saveItineraryToDashboard();
              alert("✅ Itinerary saved! Now you can explore budget details to see where adjustments may be needed.");
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
              });
            }}
          >
            Save Itinerary
          </button>
        )}
      </div>
    </div>
  </div>
)}


      {/* Attraction detail modal */}
      {modalOpen && selectedAttractionDetail && (
        <div className="attractionmodal-overlay">
          <div className="attractionmodal-container">
            <div className="attractionmodal-content">
              <button 
                className="attractionmodal-close" 
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>

              <h2 className="attractionmodal-title">{selectedAttractionDetail.name}</h2>

              <img 
                src={selectedAttractionDetail.images?.[0] || "/placeholder-image.png"} 
                alt={selectedAttractionDetail.name}
                className="attractionmodal-image"
              />

              <div className="attractionmodal-details-grid">
                <div className="attractionmodal-description">
                  <h4>Description</h4>
                  <p>{selectedAttractionDetail.description || "No description available"}</p>
                </div>
                <div className="attractionmodal-details">
                  <h4>Details</h4>
                  <p><strong>Address:</strong> {selectedAttractionDetail.address || "N/A"}</p>
                  <p><strong>Opening Hours:</strong> {selectedAttractionDetail.opening_hours?.daily || "N/A"}</p>
                  <p><strong>Average Visit Duration:</strong> {selectedAttractionDetail.avg_visit_duration || 60} minutes</p>
                  <p><strong>Entry Fee:</strong> 
                    {calculateFees(selectedAttractionDetail) > 0 
                      ? `₹${calculateFees(selectedAttractionDetail)}` 
                      : "Free"}
                  </p>
                  <p><strong>Type:</strong> {selectedAttractionDetail.indoor_outdoor || "outdoor"}</p>
                  {selectedAttractionDetail.tags?.length > 0 && (
                    <p><strong>Tags:</strong> {selectedAttractionDetail.tags.join(", ")}</p>
                  )}
                </div>
              </div>

              <button 
                className="attractionmodal-close-btn"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats modal */}
      {showStatsModal && (
        <div className="ta-modal-overlay">
          <div className="ta-modal">
            <div className="ta-modal-content" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <button className="ta-modal-close" onClick={() => setShowStatsModal(false)}>
                &times;
              </button>

              <h2>Visit Popularity in {city}</h2>

              {statsData.length === 0 ? (
                <p>No stats data available for selected filters.</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ReTooltip formatter={(value, name, props) => [`${value} visits`, props.payload.popularity]} />
                    <ReLegend />
                    <Bar dataKey="visits" name="Number of Visits" label={{ position: 'top' }}>
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              <button className="close-btn" onClick={() => setShowStatsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit timing modal */}
     {editModalOpen && editAttraction && (
  <div className="ta-modal-overlay">
    <div className="ta-modal">
      <div className="ta-modal-content">
        <button className="ta-modal-close" onClick={() => setEditModalOpen(false)}>
          &times;
        </button>
        <h2>Edit Visit Timing for {editAttraction.name}</h2>
        <div className="ta-edit-form">
          <label>
            Day:
            <select
              value={editModalData.day}
              onChange={(e) => setEditModalData({...editModalData, day: parseInt(e.target.value)})}
            >
              {Array.from({ length: numDays }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Day {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Visit Time:
            <input
              type="time"
              value={editModalData.visitStartTime}
              onChange={(e) => setEditModalData({...editModalData, visitStartTime: e.target.value})}
              min={editAttraction.opening_hours?.daily?.split("–")[0] || "22:00"}
              max={editAttraction.opening_hours?.daily?.split("–")[1] || "21:59"}
            />
            to
            <input
              type="time"
              value={editModalData.visitEndTime}
              onChange={(e) => setEditModalData({...editModalData, visitEndTime: e.target.value})}
              min={editAttraction.opening_hours?.daily?.split("–")[0] || "22:00"}
              max={editAttraction.opening_hours?.daily?.split("–")[1] || "21:59"}
            />
          </label>
          <div className="ta-modal-actions">
            <button
              className="save-btn"
              onClick={() => {
                // Validate time range
                if (editModalData.visitStartTime >= editModalData.visitEndTime) {
                  alert("Start time must be before end time.");
                  return;
                }

                // Validate opening hours
                const [openTime, closeTime] = editAttraction.opening_hours?.daily
                  ? editAttraction.opening_hours.daily.split("–")
                  : ["00:00", "23:59"];

                if (editModalData.visitStartTime < openTime || editModalData.visitEndTime > closeTime) {
                  alert(`Visit time must be within opening hours: ${openTime} to ${closeTime}`);
                  return;
                }

                // Check conflicts with other attractions
                const hasConflict = selectedAttractions.some(id => {
                  if (id === editAttraction._id) return false;
                  const vt = visitTimes[id];
                  if (!vt || vt.day !== editModalData.day) return false;
                  
                  const otherStart = parseTimeToMinutes(vt.visitStartTime);
                  const otherEnd = parseTimeToMinutes(vt.visitEndTime);
                  const thisStart = parseTimeToMinutes(editModalData.visitStartTime);
                  const thisEnd = parseTimeToMinutes(editModalData.visitEndTime);

                  return (
                    (thisStart >= otherStart && thisStart < otherEnd) ||
                    (thisEnd > otherStart && thisEnd <= otherEnd) ||
                    (thisStart <= otherStart && thisEnd >= otherEnd)
                  );
                });

                if (hasConflict) {
                  alert("This time conflicts with another attraction. Please choose a different time.");
                  return;
                }

                // All validations passed - save the changes
                setVisitTimes(prev => ({
                  ...prev,
                  [editAttraction._id]: {
                    day: editModalData.day,
                    visitStartTime: editModalData.visitStartTime,
                    visitEndTime: editModalData.visitEndTime
                  }
                }));
                setEditModalOpen(false);
              }}
            >
              Save Changes
            </button>
            <button 
              className="cancel-btn" 
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Custom place modal */}
      {customModalOpen && (
        <div className="custommodal-overlay" role="dialog" aria-modal="true" aria-labelledby="custommodal-title">
          <div className="custommodal-container">
            <div className="custommodal-content">
              <button className="custommodal-close" onClick={() => setCustomModalOpen(false)} aria-label="Close modal">
                &times;
              </button>
              <h2 id="custommodal-title" className="custommodal-title">Customize Places</h2>
              <form onSubmit={(e) => { e.preventDefault(); addCustomPlace(); }} className="custommodal-form">
                <label className="custommodal-label" htmlFor="place-name">
                  Place Name*:
                  <input
                    id="place-name"
                    type="text"
                    value={customPlaceForm.name}
                    onChange={(e) => handleCustomPlaceChange("name", e.target.value)}
                    required
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="place-description">
                  Description*:
                  <textarea
                    id="place-description"
                    rows={3}
                    value={customPlaceForm.description}
                    onChange={(e) => handleCustomPlaceChange("description", e.target.value)}
                    required
                    className="custommodal-textarea"
                  />
                </label>

                <label className="custommodal-label" htmlFor="place-address">
                  Address*:
                  <input
                    id="place-address"
                    type="text"
                    value={customPlaceForm.address}
                    onChange={(e) => handleCustomPlaceChange("address", e.target.value)}
                    required
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="entry-fee-indian">
                  Entry Fee (Indian):
                  <input
                    id="entry-fee-indian"
                    type="number"
                    min={0}
                    value={customPlaceForm.entry_fee_indian}
                    onChange={(e) => handleCustomPlaceChange("entry_fee_indian", e.target.value)}
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="entry-fee-foreigner">
                  Entry Fee (Foreigner):
                  <input
                    id="entry-fee-foreigner"
                    type="number"
                    min={0}
                    value={customPlaceForm.entry_fee_foreigner}
                    onChange={(e) => handleCustomPlaceChange("entry_fee_foreigner", e.target.value)}
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="indoor-outdoor">
                  Indoor / Outdoor:
                  <select
                    id="indoor-outdoor"
                    value={customPlaceForm.indoor_outdoor}
                    onChange={(e) => handleCustomPlaceChange("indoor_outdoor", e.target.value)}
                    className="custommodal-select"
                  >
                    <option value="outdoor">Outdoor</option>
                    <option value="indoor">Indoor</option>
                    <option value="both">Both</option>
                  </select>
                </label>

                <label className="custommodal-label" htmlFor="avg-visit-duration">
                  Average Visit Duration (minutes):
                  <input
                    id="avg-visit-duration"
                    type="number"
                    min={15}
                    max={600}
                    value={customPlaceForm.avg_visit_duration}
                    onChange={(e) => handleCustomPlaceChange("avg_visit_duration", e.target.value)}
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="opening-hours-daily">
                  Opening Hours (Daily)*:
                  <input
                    id="opening-hours-daily"
                    type="text"
                    placeholder="e.g., 09:00-18:00"
                    value={customPlaceForm.opening_hours_daily}
                    onChange={(e) => handleCustomPlaceChange("opening_hours_daily", e.target.value)}
                    required
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="tags">
                  Tags (comma separated):
                  <input
                    id="tags"
                    type="text"
                    value={customPlaceForm.tags}
                    onChange={(e) => handleCustomPlaceChange("tags", e.target.value)}
                    className="custommodal-input"
                  />
                </label>

                <label className="custommodal-label" htmlFor="images">
                  Image URLs (comma separated):
                  <textarea
                    id="images"
                    rows={2}
                    placeholder="Paste one or more image URLs, separated by commas"
                    value={customPlaceForm.images}
                    onChange={(e) => handleCustomPlaceChange("images", e.target.value)}
                    className="custommodal-textarea"
                  />
                </label>

                <div className="custommodal-button-group">
                  <button type="submit" className="custommodal-save-btn">
                    Add Place
                  </button>
                  <button
                    type="button"
                    className="custommodal-cancel-btn"
                    onClick={() => setCustomModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouristAttraction;