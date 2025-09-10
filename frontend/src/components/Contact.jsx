import React, { useState, useRef, useEffect } from "react";
import Navbar from "./Navbar";
import FooterSection from "./FooterSection";
import BackToTop from "./BackToTop";
import "./AboutMain.css";
import pic from './camel.png'

const Contact = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formInput, setFormInput] = useState({
    name: "",
    email: "",
    message: "",
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    message: "",
    isError: false,
    visible: false
  });

  const feedbackRef = useRef(null);
// Get user data from localStorage on component mount
  useEffect(() => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    
    if (username || email) {
      setFormInput(prev => ({
        ...prev,
        name: username || "",
        email: email || ""
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormInput({ ...formInput, [name]: value });
  };
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormInput({ ...formInput, [name]: value });
  // };

  // Scroll to top when the component loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch existing feedback from backend on component mount
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get-feedback');
        const data = await response.json();
        if (data.success) {
          setFeedbackList(data.feedbacks);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };
    
    fetchFeedback();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formInput),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add new feedback to the list
        const newFeedback = {
          ...formInput,
          date: new Date()
        };
        setFeedbackList([newFeedback, ...feedbackList]);
        setFormInput({ name: "", email: "", message: "", rating: 5 });
        
        setSubmitStatus({
          message: data.message,
          isError: false,
          visible: true
        });
        
        // Scroll to feedback section
        setTimeout(() => {
          feedbackRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setSubmitStatus({
          message: data.message,
          isError: true,
          visible: true
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitStatus({
        message: "Network error. Please try again later.",
        isError: true,
        visible: true
      });
    } finally {
      setIsSubmitting(false);
      
      // Hide status message after 5 seconds
      setTimeout(() => {
        setSubmitStatus({ ...submitStatus, visible: false });
      }, 5000);
    }
  };

  

  return (
    <>
      <Navbar />
      {/* <div className="fort-layer">
        <img src={pic} alt="Fort" />
      </div> */}
      <div className="camel-layer">
        <img src={pic} alt="Camel" />
      </div>
      
      <style>{`
        body {
          margin: 0;
          font-family: 'Georgia', serif;
          background: linear-gradient(135deg, #f5ece0ff, #fff7ebff);
          background-size: 200% 200%;
          animation: shiftBG 20s ease infinite;
          overflow-x: hidden;
        }

        @keyframes shiftBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes floatCamel {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .contact-container {
          padding-top: 100px;
          padding-bottom: 20px;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .contact-box {
          background-color: #fffef2;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          max-width: 1000px;
          width: 90%;
          padding: 40px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 30px;
        }

        .contact-form {
          flex: 1 1 400px;
        }

        .contact-form h2 {
          font-size: 32px;
          color: #7b3e1d;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 6px;
          color: #5d2b00;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #c08457;
          font-size: 16px;
          background-color: #fffdf7;
        }

        .form-group input:hover,
        .form-group textarea:hover,
        .form-group select:hover {
          border-color: #a45d2a;
          background-color: #fff4ec;
          box-shadow: 0 0 5px rgba(165, 93, 42, 0.2);
          transition: 0.3s ease;
        }

        .form-group textarea {
          height: 100px;
        }

        .submit-btn {
          background-color: #b2551d;
          color: white;
          padding: 12px 20px;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(1.05);
          background-color: #9c3f10;
        }

        .submit-btn:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .camel-section {
          flex: 1 1 300px;
          text-align: center;
        }

        .camel-section img {
          width: 100%;
          max-width: 250px;
          animation: floatCamel 4s ease-in-out infinite;
        }

        .camel-section p {
          color: #7a4521;
          font-weight: bold;
          margin-top: 10px;
          font-size: 18px;
        }

        .feedback-display {
          max-width: 1000px;
          margin: 20px auto 10px auto;
          background-color: #fffef6;
          box-shadow: 0 6px 15px rgba(0,0,0,0.1);
          padding: 20px;
          border-radius: 8px;
        }

        .feedback-entry {
          border-bottom: 1px solid #ddd;
          padding: 12px 0;
          transition: all 0.3s ease;
        }

        .feedback-entry:last-child {
          border-bottom: none;
        }

        .feedback-entry:hover {
          background-color: #fff8ed;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
        }

        .feedback-entry h4 {
          margin: 0;
          color: #6d3c1e;
        }

        .feedback-entry small {
          color: #888;
        }

        .stars {
          color: #ff9800;
        }

        .status-message {
          padding: 10px;
          margin: 15px 0;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
        }
        
        .status-success {
          background-color: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }
        
        .status-error {
          background-color: #ffebee;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
        }

        .feedback-display {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 12px;
  background: #fffaf5;
}

.feedback-entry {
  border-bottom: 1px solid #ddd;
  padding: 8px 0;
}

.feedback-entry:last-child {
  border-bottom: none;
}

/* Optional: prettier scrollbar */
.feedback-display::-webkit-scrollbar {
  width: 6px;
}
.feedback-display::-webkit-scrollbar-thumb {
  background-color: #b5651d;
  border-radius: 4px;
}


        @media (max-width: 768px) {
          .contact-box {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div className="contact-container">
        <div className="contact-box">
          <div className="contact-form">
            <h2>📬 Contact & Feedback</h2>
            
            {submitStatus.visible && (
              <div className={`status-message ${submitStatus.isError ? 'status-error' : 'status-success'}`}>
                {submitStatus.message}
              </div>
            )}
            
            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label>Name:</label>
               <input
  type="text"
  name="name"
  value={formInput.name}
  onChange={handleChange}
  required
  readOnly={!!localStorage.getItem("username")} // Makes field read-only if user is logged in
/>
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formInput.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  name="message"
                  value={formInput.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating:</label>
                <select name="rating" value={formInput.rating} onChange={handleChange}>
                  <option value={5}>★★★★★</option>
                  <option value={4}>★★★★☆</option>
                  <option value={3}>★★★☆☆</option>
                  <option value={2}>★★☆☆☆</option>
                  <option value={1}>★☆☆☆☆</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="camel-section">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1998/1998614.png"
              alt="Camel"
            />
            <p>जय राजस्थान 🐪<br />Feel free to reach out and share your thoughts!</p>
          </div>
        </div>
      </div>

      {feedbackList.length > 0 && (
  <div
    className="feedback-display"
    ref={feedbackRef}
    style={{
      maxHeight: "300px", // restrict height
      overflowY: "auto",  // enable vertical scroll
      paddingRight: "8px"
    }}
  >
    <h3 style={{ color: "#5d2b00", marginBottom: "10px" }}>
      📝 Feedback Received
    </h3>

    {feedbackList.map((fb, idx) => (
      <div className="feedback-entry" key={idx}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4>{fb.name}</h4>
        
        </div>

        <small>
          {new Date(fb.date).toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric"
          })}
        </small>

        <p>{fb.message}</p>
        <div className="stars">
          {"★".repeat(fb.rating)}
          {"☆".repeat(5 - fb.rating)}
        </div>
      </div>
    ))}
  </div>
)}


      <BackToTop />
      <FooterSection />
    </>
  );
};

export default Contact;