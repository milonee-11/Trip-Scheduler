import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const HeroSection = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />
      {/* Hero Section */}
      <section
        className="hero-section position-relative"
          style={{
    height: "100vh",
    overflow: "hidden",
    position: "relative",
    backgroundImage: "url('https://www.clubmahindra.com/blog/media/section_images/shuttersto-67d5d542923acf6.jpg')", // Example background
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
      >
      



        <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-50"></div>

        <div className="position-relative d-flex flex-column justify-content-center align-items-center text-center text-white px-4 py-5 w-100 h-100">
          <h1 className="display-4 fw-bold text-shadow typing-text">
            Experience the Colors of Rajasthan
          </h1>
          <p className="lead mt-4 text-warning animate__fadeIn animate__delay-2s">
            Discover majestic forts, royal palaces, folk tales, and golden deserts.
          </p>
          <button
            className="btn btn-lg btn-warning text-dark mt-5 px-5 py-3 rounded-pill shadow-lg hover-zoom"
            onClick={() => navigate("/auth")}
          >
            Explore Now
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div
          className="custom-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 9999 }}
        >
          <div
            className="bg-white p-4 rounded shadow text-center position-relative"
            style={{ maxWidth: "400px", width: "90%" }}
          >
            <button
              className="btn-close position-absolute top-0 end-0 m-3"
              onClick={() => setShowModal(false)}
            ></button>

            <h5 className="mb-3">🔐 Want to log in?</h5>
            <p className="text-secondary mb-4">
              Log in to start planning your Rajasthan adventure now!
            </p>

            <div className="d-flex justify-content-center gap-3">
              <button
                className="btn btn-warning px-4"
                onClick={() => navigate("/auth")}
              >
                Login
              </button>
              <button
                className="btn btn-outline-secondary px-4"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations & Styling */}
      <style>{`
      
        .text-shadow {
          text-shadow: 2px 2px 6px rgba(13, 12, 12, 0.6);
          color: white;
        }

        .hover-zoom:hover {
          transform: scale(1.1);
          transition: transform 0.3s ease;
        }

        .typing-text {
          width: 31ch;
          white-space: nowrap;
          overflow: hidden;
          border-right: 2px solid white;
          animation: typing 5s steps(31) infinite, blink 0.9s step-end infinite alternate;
        }

        @keyframes typing {
          0% { width: 0; }
          50% { width: 31ch; }
          100% { width: 0; }
        }

        @keyframes blink {
          50% { border-color: transparent; }
        }

        .animate__fadeIn {
          animation: fadeIn 2s ease-out forwards;
        }

        .animate__delay-2s {
          animation-delay: 2s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        
      `}</style>
    </>
  );
};

export default HeroSection;
