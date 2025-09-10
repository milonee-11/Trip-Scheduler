import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import Papa from "papaparse";
import "./hotel.css";
import HotelMap from "./HotelMap";

/* --------------------------------------------------
 * Config
 * -------------------------------------------------- */

// Map supported city names to CSV files in /public
const CITY_CSV_MAP = {
  udaipur: "/udaipur_hotels_full.csv",
  jaipur: "/jaipur_hotels_full.csv",
  jaisalmer: "/jaisalmer_hotels_full.csv",
};

const DEFAULT_CITY = "udaipur";

// Unsplash key from env
const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

/* --------------------------------------------------
 * Image helpers
 * -------------------------------------------------- */

/**
 * Local cache wrapper (namespaced JSON object stored in localStorage).
 */
const IMG_CACHE_KEY = "hotelImgCache_v1";
const loadImgCache = () => {
  try {
    const raw = localStorage.getItem(IMG_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveImgCache = (cache) => {
  try {
    localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
};

/**
 * Build a consistent cache key from hotel + place.
 */
const hotelCacheKey = (hotelName, place) =>
  `${hotelName?.toLowerCase().trim() || "hotel"}__${
    place?.toLowerCase().trim() || ""
  }`;

/**
 * Fallback image (no API key required) – random but relevant.
 * Uses Unsplash Source endpoint (returns a random image).
 */
const sourceFallbackImage = (hotelName, place) => {
  const q = encodeURIComponent(`${hotelName || "hotel"} ${place || ""}`);
  return `https://source.unsplash.com/400x300/?${q}`;
};

/**
 * Final guaranteed placeholder (inline SVG via data URI).
 * Never fails to load; shows a neutral block w/ text.
 */
const solidPlaceholder = (label = "Hotel") => {
  const safe = encodeURIComponent(label.slice(0, 20));
  return (
    `data:image/svg+xml,` +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <rect width="100%" height="100%" fill="#eee"/>
        <text x="50%" y="50%" font-size="20" text-anchor="middle" fill="#999" dy=".3em">${safe}</text>
      </svg>`
    )
  );
};

/**
 * Try Unsplash Search API (if key available); return {url, credit} or null.
 * NOTE: defensive for 401/empty results.
 */
const fetchUnsplashImage = async (query) => {
  if (!UNSPLASH_KEY) {
    // Silent skip — we'll fallback to Source/random
    return null;
  }

  const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&orientation=landscape&per_page=1&content_filter=high&client_id=${UNSPLASH_KEY}`;

  try {
    const resp = await fetch(endpoint);
    if (!resp.ok) {
      console.warn("Unsplash API error:", resp.status, resp.statusText);
      return null;
    }

    const data = await resp.json();
    if (Array.isArray(data?.results) && data.results.length > 0) {
      const imgObj = data.results[0];
      const url =
        imgObj?.urls?.small ||
        imgObj?.urls?.regular ||
        imgObj?.urls?.thumb ||
        null;
      const credit = imgObj?.user
        ? {
            name: imgObj.user.name || "Unsplash",
            link: imgObj.user.links?.html || imgObj.links?.html || "",
          }
        : null;
      return url ? { url, credit } : null;
    }
  } catch (err) {
    console.warn("Unsplash fetch failed:", err);
  }
  return null;
};

/**
 * High-level image resolver:
 * 1. cache
 * 2. Unsplash API (if key)
 * 3. Source fallback
 * 4. Solid placeholder
 */
const resolveHotelImage = async (hotelName, place, cache) => {
  const k = hotelCacheKey(hotelName, place);
  if (cache[k]) return cache[k];

  let resolved = null;
  const apiRes = await fetchUnsplashImage(`${hotelName} ${place} hotel`);
  if (apiRes?.url) {
    resolved = {
      image: apiRes.url,
      credit: apiRes.credit,
    };
  } else {
    // Source fallback
    resolved = {
      image: sourceFallbackImage(hotelName, place),
      credit: null,
    };
  }

  // If no URL at all (unlikely), solid data URI
  if (!resolved.image) {
    resolved.image = solidPlaceholder(hotelName);
  }

  cache[k] = resolved;
  saveImgCache(cache);
  return resolved;
};

/* --------------------------------------------------
 * Safe <img> component (handles error → fallback)
 * -------------------------------------------------- */
const SafeImg = memo(function SafeImg({
  src,
  alt,
  fallback,
  className,
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  const handleError = () => {
    if (imgSrc !== fallback) {
      setImgSrc(fallback || solidPlaceholder(alt));
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className={className}
      {...rest}
    />
  );
});

/* --------------------------------------------------
 * Component
 * -------------------------------------------------- */

const HotelRecommender = ({ username, onSave }) => {
  const [place, setPlace] = useState(DEFAULT_CITY);
  const [budget, setBudget] = useState(""); // user input
  const [hotels, setHotels] = useState([]); // master list

  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [customHotel, setCustomHotel] = useState({ name: "", price: "" });

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [numRooms, setNumRooms] = useState(1);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  // Amenity filter states
  const [amenityFilters, setAmenityFilters] = useState({
    pool: false,
    wifi: false,
    breakfast_included: false,
    parking: false,
    ac: false,
    pet_friendly: false,
    gym: false,
    spa: false,
    restaurant: false,
    front_desk_24h: false,
    family_friendly: false,
    bar: false,
    laundry_service: false,
    room_service: false,
    accessible_rooms: false,
    non_smoking_rooms: false,
  });

  const filterRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const hydratedSignatureRef = useRef(""); // prevents repeat hydration runs

  /* --------------------------------------------
   * Log key presence once (debug help)
   * -------------------------------------------- */
  useEffect(() => {
    console.log(
      "[HotelRecommender] Unsplash key loaded?",
      Boolean(UNSPLASH_KEY)
    );
  }, []);

  /* --------------------------------------------
   * Load place from saved weather data or fallback
   * -------------------------------------------- */
  useEffect(() => {
    let cityFromWeather = null;
    if (username) {
      const savedWeather = localStorage.getItem(`weatherData_${username}`);
      if (savedWeather) {
        try {
          const parsed = JSON.parse(savedWeather);
          if (parsed?.city) cityFromWeather = parsed.city;
        } catch {
          /* ignore */
        }
      }
    }
    const storedPlace = localStorage.getItem("selectedPlace");

    const rawCity = cityFromWeather || storedPlace || DEFAULT_CITY;
    setPlace(rawCity.toLowerCase().trim());
  }, [username]);

  /* --------------------------------------------
   * Fetch CSV when place changes
   * -------------------------------------------- */
  useEffect(() => {
    const csvPath = CITY_CSV_MAP[place] || CITY_CSV_MAP[DEFAULT_CITY];
    setLoadingCSV(true);
    Papa.parse(csvPath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data
          .filter((row) => row && (row.name || row.budget_min_INR))
          .map((row) => ({
            name: row.name?.trim() || "Unnamed Hotel",
            price: Number.parseInt(row.budget_min_INR, 10) || 0,
            lat: Number.parseFloat(row.latitude) || 0,
            lon: Number.parseFloat(row.longitude) || 0,
            image: sourceFallbackImage(row.name, place), // initial fast fallback
            credit: null,
            // Add amenity data from CSV
            pool: row.pool === "Yes",
            wifi: row.wifi === "Yes",
            breakfast_included: row.breakfast_included === "Yes",
            parking: row.parking === "Yes",
            ac: row.ac === "Yes",
            pet_friendly: row.pet_friendly === "Yes",
            gym: row.gym === "Yes",
            spa: row.spa === "Yes",
            restaurant: row.restaurant === "Yes",
            front_desk_24h: row.front_desk_24h === "Yes",
            family_friendly: row.family_friendly === "Yes",
            bar: row.bar === "Yes",
            laundry_service: row.laundry_service === "Yes",
            room_service: row.room_service === "Yes",
            accessible_rooms: row.accessible_rooms === "Yes",
            non_smoking_rooms: row.non_smoking_rooms === "Yes",
          }));
        setHotels(formatted);
        setError("");
        setLoadingCSV(false);
        hydratedSignatureRef.current = ""; // reset hydration signature (new place)
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        setHotels([]);
        setError(`Could not load hotel data for ${place}.`);
        setLoadingCSV(false);
      },
    });
  }, [place]);

  /* --------------------------------------------
   * After hotels load, resolve better images asynchronously (batched)
   * Only runs once per "signature" of hotel names + place.
   * -------------------------------------------- */
  useEffect(() => {
    if (!hotels.length) return;

    // Build signature: place + hotel names joined
    const sig = `${place}__${hotels.map((h) => h.name).join("|")}`;
    if (hydratedSignatureRef.current === sig) return; // already hydrated
    hydratedSignatureRef.current = sig;

    let cancelled = false;
    const cache = loadImgCache();

    const hydrateHotelImages = async () => {
      setLoadingImages(true);

      // Simple concurrency control
      const BATCH = 5;
      const updated = [...hotels];

      const doBatch = async (chunk, offset) => {
        const results = await Promise.all(
          chunk.map((h) => resolveHotelImage(h.name, place, cache))
        );
        results.forEach((res, i) => {
          updated[offset + i] = {
            ...updated[offset + i],
            image: res.image,
            credit: res.credit || null,
          };
        });
      };

      for (let i = 0; i < hotels.length; i += BATCH) {
        const chunk = hotels.slice(i, i + BATCH);
        // eslint-disable-next-line no-await-in-loop
        await doBatch(chunk, i);
        if (cancelled) return;
        // update partial to show progressive loading
        setHotels((prev) => {
          const clone = [...prev];
          for (let j = 0; j < chunk.length; j++) {
            const idx = i + j;
            clone[idx] = {
              ...clone[idx],
              image: updated[idx].image,
              credit: updated[idx].credit,
            };
          }
          return clone;
        });
      }
      if (!cancelled) setLoadingImages(false);
    };

    hydrateHotelImages();
    return () => {
      cancelled = true;
    };
  }, [hotels, place]);

  /* --------------------------------------------
   * Scroll to filter section if triggered by Dashboard
   * -------------------------------------------- */
  useEffect(() => {
    const scrollFlag = localStorage.getItem("scrollToHotelFilter");
    if (scrollFlag === "true") {
      filterRef.current?.scrollIntoView({ behavior: "smooth" });
      localStorage.removeItem("scrollToHotelFilter");
    }
  }, []);

  /* --------------------------------------------
   * Budget validation (message only; filtering is derived)
   * -------------------------------------------- */
  const handleBudgetValidate = () => {
    const budgetVal = parseInt(budget, 10);
    if (!budgetVal || Number.isNaN(budgetVal)) {
      setError("Please enter a valid numeric budget.");
    } else {
      setError("");
    }
  };

  /* --------------------------------------------
   * Custom hotel add
   * (Adds to master hotels list so filtering/search see it)
   * -------------------------------------------- */
  const handleAddCustomHotel = () => {
    if (!customHotel.name || !customHotel.price) return;
    const newHotel = {
      name: customHotel.name.trim(),
      price: parseInt(customHotel.price, 10) || 0,
      image: sourceFallbackImage(customHotel.name, place),
      credit: null,
      lat: 0,
      lon: 0,
      // Default amenities for custom hotels
      pool: false,
      wifi: false,
      breakfast_included: false,
      parking: false,
      ac: false,
      pet_friendly: false,
      gym: false,
      spa: false,
      restaurant: false,
      front_desk_24h: false,
      family_friendly: false,
      bar: false,
      laundry_service: false,
      room_service: false,
      accessible_rooms: false,
      non_smoking_rooms: false,
    };
    setHotels((prev) => [...prev, newHotel]);
    setSelectedHotel(newHotel); // open modal
    setCustomHotel({ name: "", price: "" });
    setSearchQuery("");
  };

  /* --------------------------------------------
   * Handle amenity filter toggle
   * -------------------------------------------- */
  const handleAmenityToggle = (amenity) => {
    setAmenityFilters((prev) => ({
      ...prev,
      [amenity]: !prev[amenity],
    }));
  };

  /* --------------------------------------------
   * Derived: Budget-filtered list
   * -------------------------------------------- */
  const budgetFiltered = useMemo(() => {
    const b = parseInt(budget, 10);
    if (!b || Number.isNaN(b)) return hotels;
    return hotels.filter((h) => h.price >= b - 1000 && h.price <= b + 1000);
  }, [budget, hotels]);

  /* --------------------------------------------
   * Search suggestions memo (applies after budget filter)
   * -------------------------------------------- */
  const filteredSuggestions = useMemo(() => {
    let filtered = budgetFiltered;

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((hotel) =>
        hotel.name.toLowerCase().includes(q)
      );
    }

    // Apply amenity filters if any are active
    const activeAmenities = Object.entries(amenityFilters)
      .filter(([_, isActive]) => isActive)
      .map(([amenity]) => amenity);

    if (activeAmenities.length > 0) {
      filtered = filtered.filter((hotel) =>
        activeAmenities.every((amenity) => hotel[amenity])
      );
    }

    return filtered;
  }, [searchQuery, budgetFiltered, amenityFilters]);

  /* --------------------------------------------
   * Close suggestion dropdown when clicking outside
   * -------------------------------------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        e.target !== searchInputRef.current
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* --------------------------------------------
   * Modal: Esc key closes (Cancel)
   * -------------------------------------------- */
  useEffect(() => {
    if (!selectedHotel) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedHotel(null);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [selectedHotel]);

  /* --------------------------------------------
   * Select hotel (open modal)
   * -------------------------------------------- */
  const handleSelectHotel = (hotel) => {
    setSelectedHotel(hotel);
    setNumRooms(1);
  };

  /* --------------------------------------------
   * Cancel modal (go back)
   * -------------------------------------------- */
  const handleCancelSelection = useCallback(() => {
    setSelectedHotel(null);
    setNumRooms(1);
  }, []);

  /* --------------------------------------------
   * Confirm selection -> save to localStorage + bubble up
   * -------------------------------------------- */
  const handleConfirmSelection = () => {
    if (!selectedHotel || !numRooms || Number.isNaN(Number(numRooms))) return;
    const roomCount = Math.max(1, Number(numRooms));
    const total = selectedHotel.price * roomCount;
    const data = { hotel: selectedHotel, rooms: roomCount, total };

    if (username) {
      localStorage.setItem(`accommodation_${username}`, JSON.stringify(data));
    }
    if (typeof onSave === "function") {
      onSave(data);
    }

    setSelectedHotel(null);
    setNumRooms(1);

    alert(
      `✅ Hotel Selected: ${selectedHotel.name}\nRooms: ${roomCount}\nTotal Cost: ₹${total}`
    );
  };

  /* --------------------------------------------
   * Place change select
   * -------------------------------------------- */
  const handleChangePlace = (e) => {
    setPlace(e.target.value);
    setBudget("");
    setSearchQuery("");
  };

  /* --------------------------------------------
   * Render logic
   * -------------------------------------------- */
  const showingMapOnly =
    !budget.trim() && !searchQuery.trim() && hotels.length > 0;

  // Compute preview total for modal
  const modalRooms = Math.max(1, Number(numRooms) || 1);
  const modalTotal =
    selectedHotel && selectedHotel.price ? selectedHotel.price * modalRooms : 0;
  const [activeSection, setActiveSection] = useState("budget");

  return (
    <div className="hotel-recommender-wrapper">
      <header className="hotel-header" ref={filterRef}>
        <h2>🏨 Explore Hotels</h2>

        {/* City selector */}
        <div
          className="input-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
            justifyContent: "center",
          }}
        >
          <label
            htmlFor="placeSelect"
            style={{ minWidth: "50px", fontWeight: "600" }}
          >
            City:
          </label>
          <select
            id="placeSelect"
            value={place}
            onChange={handleChangePlace}
            style={{
              padding: "10px 16px",
              fontSize: "16px",
              minWidth: "180px",
              borderRadius: "6px",
              border: "1.5px solid #ccc",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              transition: "border-color 0.3s ease",
              cursor: "pointer",
            }}
          >
            <option value="udaipur">Udaipur</option>
            <option value="jaipur">Jaipur</option>
            <option value="jaisalmer">Jaisalmer</option>
          </select>
        </div>

        {/* Toggle buttons for Search & Custom hotel */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              backgroundColor:
                activeSection === "search" ? "#2196f3" : "#f0f0f0",
              color: activeSection === "search" ? "white" : "#333",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow:
                activeSection === "search"
                  ? "0 4px 10px rgba(33, 150, 243, 0.6)"
                  : "none",
              transition: "all 0.3s ease",
              fontWeight: "600",
            }}
            onClick={() => setActiveSection("search")}
          >
            🔍 Search by Name
          </button>

          <button
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              backgroundColor:
                activeSection === "custom" ? "#4caf50" : "#f0f0f0",
              color: activeSection === "custom" ? "white" : "#333",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow:
                activeSection === "custom"
                  ? "0 4px 10px rgba(76, 175, 80, 0.6)"
                  : "none",
              transition: "all 0.3s ease",
              fontWeight: "600",
            }}
            onClick={() => setActiveSection("custom")}
          >
            🏨 Customise Hotel
          </button>
        </div>

        {/* Budget filter - only show if activeSection is 'budget' */}
        {activeSection === "budget" && (
          <div
            className="input-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              justifyContent: "center",
              maxWidth: "450px",
              margin: "0 auto 20px auto",
            }}
          >
            <input
              type="number"
              placeholder="Enter Budget per night (₹)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              onBlur={handleBudgetValidate}
              style={{
                padding: "12px 16px",
                fontSize: "16px",
                flex: 1,
                borderRadius: "8px",
                border: "1.5px solid #ccc",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                transition: "border-color 0.3s ease",
                outline: "none",
              }}
            />
            <button
              className="highlight-button"
              type="button"
              onClick={handleBudgetValidate}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(255, 152, 0, 0.6)",
                fontWeight: "600",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e68900")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#ff9800")
              }
            >
              Apply Budget
            </button>
          </div>
        )}

        {/* Search Section */}
        {activeSection === "search" && (
          <div
            className="input-group"
            style={{
              position: "relative",
              maxWidth: "400px",
              margin: "0 auto 20px auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search hotel by name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              style={{
                padding: "12px 16px",
                fontSize: "16px",
                width: "100%",
                border: "none",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#777",
                  fontWeight: "700",
                  lineHeight: 1,
                  userSelect: "none",
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            {showSuggestions && (
              <ul
                className="dropdown"
                ref={suggestionsRef}
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "4px 0 0 0",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  background: "#fff",
                  position: "absolute",
                  width: "100%",
                  maxHeight: "160px",
                  overflowY: "auto",
                  zIndex: 20,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                }}
              >
                {filteredSuggestions.length === 0 ? (
                  <li
                    className="dropdown-empty"
                    style={{
                      padding: "10px",
                      color: "#999",
                      fontStyle: "italic",
                    }}
                  >
                    No matches.
                  </li>
                ) : (
                  filteredSuggestions.map((h, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setSearchQuery(h.name);
                        setShowSuggestions(false);
                      }}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        borderBottom:
                          i !== filteredSuggestions.length - 1
                            ? "1px solid #eee"
                            : "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      {h.name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}

        {/* Custom Hotel Section */}
        {activeSection === "custom" && (
          <div
            className="custom-hotel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxWidth: "350px",
              margin: "0 auto 20px auto",
            }}
          >
            <input
              type="text"
              placeholder="Custom Hotel Name"
              value={customHotel.name}
              onChange={(e) =>
                setCustomHotel({ ...customHotel, name: e.target.value })
              }
              style={{
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1.5px solid #ccc",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4caf50")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
            />
            <input
              type="number"
              placeholder="Price per night"
              value={customHotel.price}
              onChange={(e) =>
                setCustomHotel({ ...customHotel, price: e.target.value })
              }
              style={{
                padding: "12px 16px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1.5px solid #ccc",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4caf50")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
            />
            <button
              onClick={handleAddCustomHotel}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(76, 175, 80, 0.6)",
                fontWeight: "600",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#43a047")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#4caf50")
              }
            >
              ➕ Add Custom Hotel
            </button>
          </div>
        )}

        {loadingCSV && (
          <p
            className="loading-msg"
            style={{
              textAlign: "center",
              fontSize: "16px",
              color: "#666",
              marginTop: "20px",
            }}
          >
            Loading hotel data…
          </p>
        )}

        {loadingImages && !loadingCSV && (
          <p
            className="loading-msg"
            style={{
              textAlign: "center",
              fontSize: "16px",
              color: "#666",
              marginTop: "20px",
            }}
          >
            Fetching images…
          </p>
        )}

        {error && !loadingCSV && (
          <p
            className="error"
            style={{
              textAlign: "center",
              fontWeight: "bold",
              color: "#c0392b",
              marginTop: "20px",
            }}
          >
            {error}
          </p>
        )}
      </header>
      {/* Amenity Filters Section */}
      <div
        style={{
          padding: "7px 12px",
          margin: "0 auto",
          maxWidth: "1500px",
          backgroundColor: "#f8f9fa",
          borderRadius: "2px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "5px",
        }}
      >
        <h3
          style={{
            marginBottom: "10px",
            textAlign: "center",
            color: "#333",
            fontSize: "16px",
          }}
        >
          Filter by Amenities
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px",
            alignItems: "center",
            padding: "5px",
            overflowX: "auto",
            scrollbarWidth: "none" /* Hide scrollbar for Firefox */,
            msOverflowStyle: "none" /* Hide scrollbar for IE/Edge */,
          }}
        >
          {/* Hide scrollbar for Chrome/Safari */}
          <style>
            {`div::-webkit-scrollbar {
              display: none;
            }`}
          </style>
          {Object.entries({
            pool: "🏊 Pool",
            wifi: "📶 WiFi",
            breakfast_included: "🍳 Breakfast",
            parking: "🅿️ Parking",
            ac: "❄️ AC",
            pet_friendly: "🐾 Pet Friendly",
            gym: "💪 Gym",
            spa: "💆 Spa",
            restaurant: "🍽️ Restaurant",
            front_desk_24h: "🕒 24h Front Desk",
            family_friendly: "👪 Family Friendly",
            bar: "🍸 Bar",
            laundry_service: "🧺 Laundry",
            room_service: "🛎️ Room Service",
            accessible_rooms: "♿ Accessible",
            non_smoking_rooms: "🚭 Non-Smoking",
          }).map(([key, label]) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "6px",
                backgroundColor: amenityFilters[key]
                  ? "#e3f2fd"
                  : "transparent",
                border: amenityFilters[key]
                  ? "1px solid #bbdefb"
                  : "1px solid #e0e0e0",
                transition: "all 0.2s ease",
                userSelect: "none",
                fontSize: "14px",
                whiteSpace: "nowrap",
                flexShrink: 0 /* Prevent items from shrinking */,
              }}
            >
              <input
                type="checkbox"
                checked={amenityFilters[key]}
                onChange={() => handleAmenityToggle(key)}
                style={{
                  cursor: "pointer",
                  width: "16px",
                  height: "16px",
                  margin: 0,
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>


      {/* Fullscreen map when nothing filtered/searched */}
      {showingMapOnly ? (
        <div className="fullscreen-map">
          <HotelMap hotels={hotels} />
        </div>
      ) : (
        <div className="hotel-main-content">
          <div className="hotel-list">
            {filteredSuggestions.map((hotel, index) => (
              <div
                key={index}
                className={`hotel-card ${
                  selectedHotel?.name === hotel.name ? "selected" : ""
                }`}
              >
                <SafeImg
                  src={hotel.image}
                  fallback={solidPlaceholder(hotel.name)}
                  alt={hotel.name}
                />
                <div className="hotel-info">
                  <h4>{hotel.name}</h4>
                  <p>
                    <strong>₹{hotel.price}</strong> per night
                  </p>
                  {hotel.credit && (
                    <small className="photo-credit">
                      Photo by{" "}
                      <a
                        href={hotel.credit.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {hotel.credit.name}
                      </a>{" "}
                      on Unsplash
                    </small>
                  )}
                  <button onClick={() => handleSelectHotel(hotel)}>
                    ✅ Select
                  </button>
                </div>
              </div>
            ))}
            {filteredSuggestions.length === 0 && (
              <p style={{ padding: "10px" }}>No hotels match your search.</p>
            )}
          </div>

          <div className="map-container">
            <HotelMap hotels={filteredSuggestions} />
          </div>
        </div>
      )}
{/* Modal */}
{selectedHotel && (
  <div className="confirm-box modal-center">
    <span className="modal-close-icon" onClick={handleCancelSelection}>
      ×
    </span>
    <h3>🛏️ Confirm Your Room Selection</h3>
    <p>
      <strong>Hotel:</strong> {selectedHotel.name}
    </p>
    <p>
      <strong>Price:</strong> ₹{selectedHotel.price}
    </p>
    <input
      type="number"
      min={1}
      step={1}
      placeholder="Number of rooms"
      value={numRooms}
      onChange={(e) => setNumRooms(e.target.value)}
    />
    <p className="modal-total-preview">
      Total: <strong>₹{modalTotal}</strong>
    </p>
    <div className="modal-actions">
      <button
        type="button"
        className="back-btn"
        onClick={handleCancelSelection}
      >
        ← Back
      </button>
      <button
        type="button"
        className="confirm-btn"
        onClick={() => {
          handleConfirmSelection();
          // Show the tourist spots suggestion after confirmation
          setTimeout(() => {
            alert(
              `✅ Hotel ${selectedHotel.name} booked successfully!\n\nNow you can explore tourist spots below to complete your itinerary.`
            );
            // Scroll to bottom after closing the alert
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth"
            });
          }, 300);
        }}
      >
        Confirm Booking →
      </button>
    </div>
  </div>
)}
{" "}
    </div>
  );
};
export default HotelRecommender;
