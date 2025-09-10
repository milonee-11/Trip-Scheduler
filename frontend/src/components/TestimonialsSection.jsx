import React, { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Aditi Sharma",
    message:
      "Every location felt like a royal dream. The palaces, boat rides, and sand dunes made this trip unforgettable. It was a perfect getaway into the richness of Rajasthan.",
  },
  {
    name: "Rahul Verma",
    message:
      "The camel ride and sunset in the desert were magical. I’d recommend it to anyone who loves unique travel experiences. The silence of the desert under the stars was unmatched.",
  },
  {
    name: "Priya Desai",
    message:
      "I loved shopping at local markets, visiting forts, and trying traditional Rajasthani food. The spicy flavors and vibrant colors added so much to the experience!",
  },
  {
    name: "Sneha Rathi",
    message:
      "Don’t miss out on the puppet shows and folk dance. They were so vibrant and beautiful! My kids had the best time enjoying the culture of Rajasthan.",
  },
  {
    name: "Mehul Joshi",
    message:
      "The trip was nothing short of royal. Udaipur’s City Palace is a must-visit! The boat ride on Lake Pichola was peaceful and scenic.",
  },
];

const TestimonialsCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState(Array(testimonials.length).fill(false));

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (index) => {
    setExpanded((prev) =>
      prev.map((item, i) => (i === index ? !item : item))
    );
  };

  return (
    <div className="carousel-container1">
      <h2 className="carousel-title" style={{ fontFamily: "'Merriweather', serif" }}>Traveler Testimonials</h2>

      <div className="carousel-wrapper">
        <button className="nav-btn prev1" onClick={prevSlide}>
          &#10094;
        </button>

        <div className="carousel1">
          {testimonials.map((t, index) => {
            const position = (index - current + testimonials.length) % testimonials.length;
            const translate = 300 * (position - 1);
            const scale = position === 1 ? 1 : 0.85;
            const zIndex = position === 1 ? 2 : 1;
            const opacity = position === 1 ? 1 : 0.5;

            const displayMessage =
              expanded[index] || t.message.length <= 100
                ? t.message
                : `${t.message.substring(0, 100)}...`;

            return (
              <div
                key={index}
                className="card1"
                style={{
                  transform: `translateX(${translate}px) scale(${scale})`,
                  zIndex,
                  opacity,
                }}
              >
                <div className="overlay1">
                  <h5>{t.name}</h5>
                  <p>
                    {displayMessage}{" "}
                    {t.message.length > 100 && (
                      <span
                        className="read-more"
                        onClick={() => toggleExpand(index)}
                      >
                        {expanded[index] ? "Read less" : "Read more"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button className="nav-btn next1" onClick={nextSlide}>
          &#10095;
        </button>
      </div>

     <style>{`
  .carousel-container1 {
    padding: 60px 20px;
    background-color: #fff9f4;
    text-align: center;
    overflow: hidden;
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

  .carousel-wrapper {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .carousel1 {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
  }

  .card1 {
    position: absolute;
    width: 300px;
    height: 360px;
    border-radius: 20px;
    background: #fff3e6;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out, box-shadow 0.3s ease;
  }

  .card1:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    transform: scale(1.02);
  }

  .overlay1 {
    width: 100%;
    height: 100%;
    color: #ffe4d0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    text-align: center;
    border-radius: 20px;
  }

  .overlay1 h5 {
    color: #e89b4c; /* Slightly darker */
    font-size: 22px;
    margin-bottom: 15px;
  }

  .overlay1 p {
    font-size: 16px;
    line-height: 1.5;
    color: #5d2b15;
  }

  .read-more {
    color: #cc7f3b; /* Darker color */
    font-weight: bold;
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.3s ease;
  }

  .read-more:hover {
    color: #a95d1f;
    text-decoration: underline;
  }

  .nav-btn {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    padding: 10px 15px;
    font-size: 24px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    transition: background 0.3s ease;
  }

  .nav-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .prev1 {
    margin-right: 10px;
  }

  .next1 {
    margin-left: 10px;
  }

  @media (max-width: 768px) {
    .carousel1 {
      flex-direction: column;
      height: auto;
    }

    .card1 {
      position: static;
      transform: none !important;
      opacity: 1 !important;
      width: 90%;
      margin: 15px 0;
    }

    .nav-btn {
      display: none;
    }
  }
`}</style>

    </div>
  );
};

export default TestimonialsCarousel;
