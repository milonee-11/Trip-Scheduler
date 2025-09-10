import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const FeaturesSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const features = [
   {
  icon: "🐪",
  title: "Authentic Itineraries",
  desc: "Tailored trips to Rajasthan's hidden gems, focusing on culture and traditions.",
},
{
  icon: "💰",
  title: "Smart Budget Alerts",
  desc: "Track expenses and get instant alerts when nearing your budget limit.",
},
{
  icon: "📅",
  title: "Personalized Schedules",
  desc: "Seamlessly organize travel dates, stays, and activities with ease.",
},

  ];

  return (
    <section className="features-section">
      <div className="container">
        <h2 className="section-title" data-aos="fade-up">
          Why Travel With Us?
        </h2>
        <ul className="features-list">
          {features.map((item, index) => (
            <li
              className="feature-item"
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 200}
            >
              <span className="icon">{item.icon}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Styling */}
      <style>{`
        .features-section {
          background-color: #fff8f0;
          padding: 60px 20px;
          color: #5d4037;
        }

        .section-title {
          font-size: 2.8rem;
          font-weight: bold;
          text-align: center;
          color: #9e5f3a;
          margin-bottom: 40px;
          font-family: 'Merriweather', serif;
        }

        .features-list {
          list-style: none;
          padding: 0;
          max-width: 900px;
          margin: auto;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 20px 0;
          border-bottom: 1px solid #e0cdbf;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .feature-item:hover {
          background-color: #fef2e6;
          border-radius: 12px;
          transform: scale(1.02);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        .feature-item:hover .icon {
          animation: bounce 0.6s ease;
        }

        .feature-item:last-child {
          border-bottom: none;
        }

        .icon {
          font-size: 2.5rem;
          line-height: 1;
          margin-top: 5px;
          transition: transform 0.3s ease;
        }

        h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #6c4f3d;
        }

        p {
          margin: 5px 0 0;
          font-size: 1rem;
          color: #5d4d3e;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 768px) {
          .feature-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .icon {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
