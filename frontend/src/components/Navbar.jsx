import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define active check helper
  const isActive = (path) => {
    if (path === "/auth") {
      // If logged-in dashboard routes should also highlight "Login"
      return location.pathname.startsWith("/auth") || location.pathname.startsWith("/dashboard");
    }
    return location.pathname === path;
  };

  return (
    <nav className="rajasthani-navbar2 navbar navbar-expand-lg fixed-top">
      <div className="container-fluid">
        <span className="navbar-brand">
          <a
            href="#"
            onClick={() => navigate("/")}
            style={{ textDecoration: "none", color: "white" ,fontSize:'30px'}}
          >
            TripScheduler
          </a>
        </span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className="collapse navbar-collapse justify-content-end"
          id="navbarNav"
        >
          <ul className="navbar-nav">
            <li className={`nav-item ${isActive("/") ? "active" : ""}`}>
              <button className="btn nav-btn1" onClick={() => navigate("/")}>
                Home
              </button>
            </li>

            <li className={`nav-item ${isActive("/auth") ? "active" : ""}`}>
              <button
                className="btn nav-btn1"
                onClick={() => navigate("/auth")}
              >
                Login
              </button>
            </li>

            <li className={`nav-item ${isActive("/about") ? "active" : ""}`}>
              <button
                className="btn nav-btn1"
                onClick={() => navigate("/about")}
              >
                About Us
              </button>
            </li>

            <li className={`nav-item ${isActive("/blog") ? "active" : ""}`}>
              <button
                className="btn nav-btn1"
                onClick={() => navigate("/blog")}
              >
                News
              </button>
            </li>

            <li className={`nav-item ${isActive("/contact") ? "active" : ""}`}>
              <button
                className="btn nav-btn1"
                onClick={() => navigate("/contact")}
              >
                Contact
              </button>
            </li>

            <li className="nav-item">
              <button className="btn nav-btn1" onClick={() => navigate(-1)}>
                Back
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
