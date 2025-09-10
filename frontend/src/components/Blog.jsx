import React, { useEffect, useState, useRef } from "react";
import Navbar from "./Navbar";
import FooterSection from "./FooterSection";
import BackToTop from "./BackToTop";
import { motion } from "framer-motion";

const Blog = () => {
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState("Rajasthan Tourism");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
 // Scroll to top when the component loads
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);
  // Popular Rajasthan tourism search suggestions
  const popularSearches = [
    "Rajasthan Tourism",
    "Jaipur Travel",
    "Udaipur Palace",
    "Jodhpur Fort",
    "Jaisalmer Desert",
    "Pushkar Festival",
    "Ranthambore Safari",
    "Rajasthan Culture",
    "Rajasthan Food",
    "Jaipur Shopping"
  ];

  // inside your component
  const searchRef = useRef(null);

  // Close suggestions if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchArticles = (searchQuery) => {
    setLoading(true);

    fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        searchQuery
      )}&apiKey=f72fdc79bd974aed8b11dffbc4855de9`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.articles) {
          // Split query into individual words for better matching
          const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
          
          // Filter articles that contain any of the query words in title/description
          const filtered = data.articles.filter((article) => {
            if (queryWords.length === 0) return true;
            
            const title = article.title?.toLowerCase() || '';
            const description = article.description?.toLowerCase() || '';
            
            // Check if any of the query words appear in title or description
            return queryWords.some(word => 
              title.includes(word) || description.includes(word)
            );
          });
          
          setArticles(filtered);
        } else {
          setArticles([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setArticles([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (query.trim() !== "") {
      fetchArticles(query);
    }
  }, []);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() !== "") {
      fetchArticles(query);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    fetchArticles(suggestion);
    setShowSuggestions(false);
  };

  // Handle input change + suggestions
  const handleInputChange = (value) => {
    setQuery(value);

    if (value.length > 1) {
      const filteredSuggestions = popularSearches.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Highlight all searched words
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    
    // Split the highlight into individual words
    const highlightWords = highlight.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    if (highlightWords.length === 0) return text;
    
    // Create a regex pattern that matches any of the words
    const regex = new RegExp(`(${highlightWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <Navbar />
      <div className="blog-container">
        <style>
          {`
          @keyframes fadePulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.08); }
            100% { opacity: 1; transform: scale(1); }
          }

          @keyframes underlineSlide {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(1); }
            100% { transform: scaleX(0); }
          }
          `}
        </style>

        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <h1
            style={{
              fontFamily: "'Merriweather', serif",
              background: "linear-gradient(90deg, #B22222, #FFB300, #0D47A1)", // Rajasthan theme
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "3rem",
              letterSpacing: "2px",
              fontWeight: "800",
              animation: "fadePulse 3s infinite ease-in-out",
              position: "relative",
              display: "inline-block",
              paddingBottom: "10px"
            }}
          >
            Every Detail Matters
            <span
              style={{
                content: "''",
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                height: "4px",
                background: "linear-gradient(90deg, #FFB300, #B22222, #0D47A1)",
                borderRadius: "2px",
                animation: "underlineSlide 4s infinite ease-in-out",
                transformOrigin: "center"
              }}
            ></span>
          </h1>
        </div>

        {/* Search Bar with Suggestions */}
        <motion.div 
          className="search-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          ref={searchRef}   // 👈 attach ref here
        >
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search Rajasthan tourism news..."
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-container">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </form>
        </motion.div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Fetching the latest news...</p>
          </div>
        ) : articles.length > 0 ? (
          <motion.div 
            className="blog-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {articles.map((article, i) => (
              <motion.div
                key={i}
                className="blog-card"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                {article.urlToImage && (
                  <motion.div 
                    className="image-container"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="blog-img"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="image-overlay"></div>
                  </motion.div>
                )}
                <div className="blog-content">
                  <h3 className="blog-title">{highlightText(article.title, query)}</h3>
                  <p className="blog-desc">{article.description ? highlightText(article.description, query) : "No description available."}</p>
                  <div className="blog-meta">
                    <span className="blog-source">{article.source?.name || "Unknown Source"}</span>
                    <span className="blog-date">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blog-link"
                  >
                    Read Full Article
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No articles found for "{query}"</h3>
            <p>Try searching for something else or browse our suggestions.</p>
          </motion.div>
        )}
      </div>
      <FooterSection />
      <BackToTop />

      <style>{`
        .blog-container {
          padding: 40px 20px;
          background: linear-gradient(135deg, #fdf6e3 0%, #faf0e6 100%);
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
          margin-top:25px
        }

        .blog-heading {
          text-align: center;
          font-size: 2.8rem;
          color: #8B4513;
          margin-bottom: 40px;
          font-weight: 700;
          letter-spacing: -0.5px;
          position: relative;
          padding-bottom: 20px;
        }

        .blog-heading::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 4px;
          background: linear-gradient(to right, #D2691E, #CD853F);
          border-radius: 2px;
        }

        /* Search Container */
        .search-container {
          max-width: 600px;
          margin: 0 auto 50px;
          position: relative;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 50px;
          padding: 5px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .search-input-container:focus-within {
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .search-input {
          flex: 1;
          border: none;
          padding: 15px 20px;
          font-size: 1rem;
          border-radius: 50px;
          outline: none;
          background: transparent;
        }

        .search-btn {
          background: linear-gradient(135deg, #D2691E 0%, #CD853F 100%);
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.3s ease;
        }

        .search-btn:hover {
          transform: rotate(15deg);
          box-shadow: 0 5px 15px rgba(210, 105, 30, 0.4);
        }

        .search-btn svg {
          width: 20px;
          height: 20px;
        }

        /* Suggestions */
        .suggestions-container {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 15px;
          margin-top: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          z-index: 10;
        }

        .suggestion-item {
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f0f0f0;
        }

        .suggestion-item:hover {
          background: #FFF8F0;
          color: #D2691E;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #D2691E;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 1.1rem;
          color: #8B4513;
        }

        /* Blog Grid */
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
        }

        /* Blog Card */
        .blog-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .image-container {
          position: relative;
          overflow: hidden;
          height: 200px;
        }

        .blog-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%);
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .blog-card:hover .image-overlay {
          opacity: 0.9;
        }

        .blog-content {
          padding: 25px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .blog-title {
          font-size: 1.3rem;
          color: #5C4033;
          margin-bottom: 15px;
          line-height: 1.4;
          font-weight: 600;
        }

        .blog-desc {
          font-size: 0.95rem;
          color: #6B5B4A;
          margin-bottom: 20px;
          line-height: 1.6;
          flex: 1;
        }

        .blog-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 0.85rem;
          color: #A67B5B;
        }

        .blog-source {
          font-weight: 600;
        }

        .highlight {
          background: rgba(210, 105, 30, 0.2);
          padding: 0 2px;
          border-radius: 3px;
          font-weight: 600;
        }

        .blog-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #D2691E 0%, #CD853F 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .blog-link:hover {
          box-shadow: 0 5px 15px rgba(210, 105, 30, 0.4);
          transform: translateY(-2px);
        }

        .blog-link svg {
          width: 16px;
          height: 16px;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 60px 20px;
          color: #8B4513;
        }

        .no-results svg {
          width: 60px;
          height: 60px;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .no-results h3 {
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .no-results p {
          font-size: 1rem;
          opacity: 0.8;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .blog-container {
            padding: 30px 15px;
          }
          
          .blog-heading {
            font-size: 2.2rem;
            margin-bottom: 30px;
          }
          
          .blog-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .search-input-container {
            border-radius: 15px;
          }
          
          .search-input {
            padding: 12px 15px;
          }
        }

        @media (max-width: 480px) {
          .blog-heading {
            font-size: 1.8rem;
          }
          
          .blog-content {
            padding: 20px;
          }
          
          .blog-title {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </>
  );
};

export default Blog;