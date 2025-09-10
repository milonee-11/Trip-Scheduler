import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import "./BackToTop.css"; // Make sure your styles are here

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show or hide button depending on scroll
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      className={`back-to-top1 ${isVisible ? "show" : ""}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <FaArrowUp />
    </button>
  );
};

export default BackToTop;
