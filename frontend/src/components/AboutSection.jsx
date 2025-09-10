import React, { useEffect, useState, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const AboutSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef(null);

  const images = [
    "https://st2.depositphotos.com/1152339/11965/i/950/depositphotos_119653730-stock-photo-marketing-concept-about-us-on.jpg",
    "https://i.ytimg.com/vi/zT1ZP3scwZE/maxresdefault.jpg",
    "https://ultimateblocks.com/wp-content/uploads/2023/07/10_Best_Meet_the_Team_Pages_-_Inspiring_Examples_That_Stand_Out_-_UB1920x960.png",
    "https://st3.depositphotos.com/14431644/34729/i/450/depositphotos_347298024-stock-photo-conceptual-hand-writing-showing-our.jpg",
  ];

  const textSections = [
   {
  heading: "About Us",
  content: `We aim to bring you the rich cultural heritage and scenic beauty of Rajasthan through unforgettable and well-planned travel experiences. From the golden sands of the Thar Desert to the exquisite palaces of Jaipur, we curate unique travel itineraries that immerse you in the colors and charm of Rajasthan.

With our Trip Scheduler, every journey is not just a plan — it’s a story. We don’t just create a schedule; we design an experience that narrates the history, culture, and traditions of every destination. Whether it’s camel safaris, fort treks, folk music nights, or culinary tours, we blend comfort with authenticity while helping you manage time and budget effectively.`,
  extra: "🎯 Curated itineraries with smart scheduling and budget tracking.",
  icon: "bi-globe"
},
{
  heading: "Our Journey",
  content: `What started as a passion for exploring palaces turned into a mission to share Rajasthan’s untold stories. Over the years, we’ve grown from a small travel blog to a full-fledged travel companion for thousands of explorers seeking authenticity and culture.

From covering hidden gems in Udaipur to organizing desert camps in Jaisalmer, we’ve evolved through consistent love for travel and a commitment to make tourism meaningful. Today, our platform is not just about inspiration — it’s your one-stop solution for building personalized schedules, setting budget alerts, booking tours, and experiencing Rajasthan without hassle.`,
  extra: "📈 From travel stories to a complete scheduling & planning platform.",
  icon: "bi-map"
},
{
  heading: "Our Team",
  content: `Our dedicated team of travel curators, historians, photographers, and local guides ensures every journey is rich in detail and experience. Each member of our team brings a unique flavor to our offerings — be it historic facts, language assistance, or offbeat locations.

In addition, our tech team continuously refines the Trip Scheduler to make it more intuitive — ensuring you can adjust your budget, track expenses, and update your plans on the go. We also work closely with local artisans, musicians, and craftsmen to ensure cultural sustainability and empowerment. The heart of Rajasthan beats in its people, and our team ensures you feel their warmth every step of the way.`,
  extra: "👥 Experts + Tech + Locals = Smarter, authentic journeys.",
  icon: "bi-people"
},
{
  heading: "Our Mission",
  content: `Our mission is to preserve and promote Rajasthan's incredible legacy through responsible and well-planned tourism. We strive to connect travelers with culture, empower local communities, and create memories that leave a lasting impact.

With smart trip scheduling and budget alerts, we aim to remove stress from travel planning while ensuring every traveler enjoys authenticity and value. We believe that travel should enrich both the traveler and the destination. That’s why we prioritize eco-friendly practices, fair wages for local partners, transparent community involvement, and responsible use of resources in all our ventures. Travel with us and become a part of Rajasthan’s revival story.`,
  extra: "🌱 Smart travel + Sustainable tourism = Lasting impact.",
  icon: "bi-bullseye"
},

  ];

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });

    const cycleContent = () => {
      timeoutRef.current = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % textSections.length);
        cycleContent(); // Recursively call
      }, 8000);
    };

    cycleContent();
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <section className="py-5 bg-light" style={{ fontFamily: "'Merriweather', serif" }}>
      <div className="container">
        <div className="row align-items-center">
          {/* Text Side */}
          <div
            className="col-md-6 text-md-start text-center mb-4 mb-md-0"
            data-aos="fade-right"
          >
            <h2
              className="display-6 fw-bold d-flex align-items-center mb-3"
              style={{ color: "#3e2a1f" }}
            >
              <i className={`bi ${textSections[activeIndex].icon} me-2 fs-3 text-warning`}></i>
              {textSections[activeIndex].heading}
            </h2>

            <p
              className="fw-semibold paragraph-fader"
              style={{ color: "#5d4d3e", fontSize: "1.1rem", textAlign: "justify", whiteSpace: "pre-line" }}
              key={activeIndex}
            >
              {textSections[activeIndex].content}
            </p>

            <p className="text-muted fst-italic" style={{ fontSize: "0.95rem" }}>
              {textSections[activeIndex].extra}
            </p>
          </div>

          {/* Image Side */}
          <div className="col-md-6 d-flex justify-content-center">
            <div className="image-stack-loop position-relative">
              {images.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`img-${index}`}
                  className={`loop-img img-${index + 1} ${index === activeIndex ? "active-img" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .image-stack-loop {
          width: 100%;
          max-width: 400px;
          height: 300px;
        }

        .loop-img {
          position: absolute;
          width: 100%;
          border-radius: 15px;
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 1s ease-in-out;
        }

        .loop-img.active-img {
          opacity: 1;
          transform: translateY(0px) scale(1);
          z-index: 2;
        }

        .paragraph-fader {
          animation: fadeSlide 0.8s ease-in-out;
        }

        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
};

export default AboutSection;
