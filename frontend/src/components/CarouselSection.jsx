import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const destinations = [
  {
    name: "Udaipur",
    subtitle: "Lake City",
    image: "https://www.clubmahindra.com/blog/media/section_images/shuttersto-f35ae234595fb07.jpg",
    highlights: [
      "City Palace",
      "Lake Pichola",
      "Jag Mandir",
      "Fateh Sagar Lake",
      "Saheliyon-ki-Bari",
      "Vintage Car Museum",
    ],
    recommendedBy: "92%",
    budget: "Budget Friendly",
  },
  {
    name: "Jaisalmer",
    subtitle: "Golden City",
    image: "https://www.tripsavvy.com/thmb/r9yrQvETeR-ZwwizS5hDPZL0nC8=/2121x1414/filters:fill(auto,1)/GettyImages-1226021127-5b2d2d6bc6b8431bb4ec1e5fa1782462.jpg",
    highlights: [
      "Jaisalmer Fort",
      "Sam Sand Dunes",
      "Patwon ki Haveli",
      "Gadisar Lake",
      "Bada Bagh",
    ],
    recommendedBy: "89%",
    budget: "Moderately Priced",
  },
  {
    name: "Jaipur",
    subtitle: "Pink City",
    image: "https://tse4.mm.bing.net/th?id=OIP.k574Xz5W6lZQGCT-TZdL6wHaE7&pid=Api&P=0&h=180",
    highlights: [
      "Hawa Mahal",
      "Amber Fort",
      "City Palace",
      "Jantar Mantar",
      "Albert Hall Museum",
    ],
    recommendedBy: "95%",
    budget: "Budget Friendly",
  },
];

const CarouselSection = () => {
  const [selected, setSelected] = useState(null);

  const toggleDetails = (index) => {
    setSelected(selected === index ? null : index);
  };

  return (
    <section className="p-5 bg-light text-center">
      <h2 
  className="carousel-title" 
  style={{ fontFamily: "'Merriweather', serif", position: "relative" }}
>
  Popular Destinations
<p className="arrow-down"></p>
</h2>

{/* Animated Down Arrow */}

      <div className="d-flex flex-wrap justify-content-center gap-5">
        {destinations.map((place, index) => (
          <div
            key={index}
            className="destination-card position-relative"
            style={{ width: "280px", cursor: "pointer" }}
            onClick={() => toggleDetails(index)}
          >
            {/* Image with overlay */}
            <div className="image-container position-relative overflow-hidden rounded shadow border border-2 border-warning">
              <img
                src={place.image}
                alt={place.name}
                className="img-fluid destination-img"
                style={{
                  height: "180px",
                  width: "100%",
                  objectFit: "cover",
                }}
              />
              <div className="overlay d-flex align-items-center justify-content-center">
                <h5 className="place-title text-white fw-bold m-0">{place.name}</h5>
              </div>
            </div>

            {/* Word-by-word Animated Panel */}
            {selected === index && (
              <div
                className={`detail-panel bg-white p-3 rounded rajasthani-style shadow ${
                  place.name === "Udaipur" ? "left-panel" : "right-panel"
                }`}
              >
                <h5 className="text-danger fw-bold fadeIn" style={{ animationDelay: "0.2s" }}>{place.name}</h5>
                <p className="text-muted fst-italic fadeIn" style={{ animationDelay: "0.4s" }}>{place.subtitle}</p>
                
                <ul className="list-unstyled mb-2">
                  {place.highlights.map((spot, i) => (
                    <li className="fadeIn" key={i} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                      • {spot}
                    </li>
                  ))}
                </ul>
                <p className="mb-1 fadeIn" style={{ animationDelay: `${0.2 + place.highlights.length * 0.2 + 0.2}s` }}>
                  <strong>Recommended by:</strong> {place.recommendedBy}
                </p>
                <p className="fadeIn" style={{ animationDelay: `${0.1 + place.highlights.length * 0.2 + 0.4}s` }}>
                  <strong>Budget:</strong> {place.budget}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .image-container {
          position: relative;
        }
          .arrow-down {
  margin: 0 auto;
  width: 24px;
  height: 24px;
  border-left: 3px solid #333;
  border-bottom: 3px solid #333;
  transform: rotate(-45deg);
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) rotate(-45deg);
  }
  40% {
    transform: translateY(8px) rotate(-45deg);
  }
  60% {
    transform: translateY(4px) rotate(-45deg);
  }
}
.carousel-title {
    color: #4a1f0e; /* Darker */
    font-size: 2.2rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
    margin-bottom: 30px;
  }

        .destination-img {
          transition: all 0.4s ease-in-out;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background-color: rgba(0, 0, 0, 0);
          transition: background-color 0.4s ease;
        }

        .place-title {
          font-family: 'Georgia', serif;
          font-size: 1.4rem;
          letter-spacing: 1px;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .image-container:hover .overlay {
          background-color: rgba(0, 0, 0, 0.55);
        }

        .image-container:hover .place-title {
          opacity: 1;
        }

        .detail-panel {
          position: absolute;
          top: 10%;
          width: 300px;
          z-index: 5;
          animation: slideIn 0.6s ease-out forwards;
        }

        .left-panel {
          left: -310px;
        }

        .right-panel {
          right: -310px;
        }

        .rajasthani-style {
          background-color: #fffaf0;
          border: 2px dashed #d2691e;
          font-family: 'Georgia', serif;
          color: #4b2e1e;
        }

        .rajasthani-style ul li {
          margin-left: 1rem;
          padding-bottom: 4px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .fadeIn {
          opacity: 0;
          animation: fadeWord 0.5s forwards;
        }

        @keyframes fadeWord {
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        .fadeIn {
          transform: translateY(10px);
        }

        .fadeIn {
          animation-fill-mode: forwards;
        }

        @media (max-width: 768px) {
          .left-panel,
          .right-panel {
            position: static;
            width: 100%;
            margin-top: 1rem;
          }
        }
      `}</style>
    </section>
  );
};

export default CarouselSection;
