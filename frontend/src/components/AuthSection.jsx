import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

function AuthSection({ type }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Validation functions
  const validateUsername = (username) => {
    if (!username) return "Username is required.";
    if (username.length < 3)
      return "Username must be at least 3 characters long.";
    if (username.length > 20)
      return "Username must be at most 20 characters long.";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Username can only contain letters, numbers, and underscores.";
    return null;
  };

  const validateEmail = (email) => {
    if (!email) return "Email is required.";
    // Simple email regex validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return "Enter a valid email address. E.g., user@example.com";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (password.length > 20)
      return "Password must be at most 20 characters long.";
    if (!/[A-Z]/.test(password))
      return "Password must include at least one uppercase letter (A-Z).";
    if (!/[a-z]/.test(password))
      return "Password must include at least one lowercase letter (a-z).";
    if (!/[0-9]/.test(password))
      return "Password must include at least one digit (0-9).";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must include at least one special character (!@#$%^&* etc.).";
    return null;
  };

  // Validate entire form and return errors object
  const validateForm = () => {
    const newErrors = {};

    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;

    if (type === "signup") {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear the specific field error on change
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: null,
    }));
    setServerError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return; // stop submission if validation fails
    }

    setLoading(true);
    setErrors({});
    setServerError(null);
    setSuccess(null);

    const payload = {
      username: formData.username,
      password: formData.password,
    };

    if (type === "signup") {
      payload.email = formData.email;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/${type === "signup" ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || "Success!");
        setFormData({ username: "", email: "", password: "" });

        if (type === "login") {
          localStorage.setItem("username", result.user.username);
          localStorage.setItem("email", result.user.email);
          navigate(`/dashboard`);
        }
      } else {
        setServerError(result.message || "Invalid credentials or user not found.");
      }
    } catch (err) {
      setServerError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="auth-background">
        <div className="auth-overlay">
          <div className="auth-left">
            <div className="auth-box">
              <h2>{type === "signup" ? "Sign Up" : "Login"}</h2>
              <form onSubmit={handleSubmit} noValidate>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-control mb-1 ${errors.username ? "is-invalid" : ""}`}
                  autoComplete="username"
                />
                {errors.username && (
                  <div className="invalid-feedback">{errors.username}</div>
                )}

                {type === "signup" && (
                  <>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-control mb-1 ${errors.email ? "is-invalid" : ""}`}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </>
                )}

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control mb-1 ${errors.password ? "is-invalid" : ""}`}
                  autoComplete={type === "signup" ? "new-password" : "current-password"}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}

                <button type="submit" className="btn btn-rajasthani w-100" disabled={loading}>
                  {loading ? "Please wait..." : type === "signup" ? "Register" : "Login"}
                </button>
              </form>

              {serverError && <p className="error text-danger mt-2">{serverError}</p>}
              {success && <p className="success text-success mt-2">{success}</p>}

              <div className="toggle-auth mt-3">
                {type === "signup" ? (
                  <a href="/auth" className="btn btn-link">
                    Already have an account? Log In
                  </a>
                ) : (
                  <a href="/auth/signup" className="btn btn-link">
                    Don't have an account? Sign Up
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="auth-right">
            <h1 className="rajasthan-heading">Vibrance of Rajasthan</h1>
            <p className="text-light">
              Experience the essence of Rajasthan, where history and modernity meet.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-background {
          background: linear-gradient(135deg, #d3b99dff, #af806aff); 
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .auth-overlay {
          display: flex;
          justify-content: space-between;
          width: 80%;
          max-width: 1200px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .auth-left {
          width: 50%;
          padding: 40px;
          background-color: #fff;
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.1);
        }

        .auth-box {
          max-width: 400px;
          margin: auto;
        }

        .auth-left h2 {
          font-family: 'Georgia', serif;
          color: #5a2d1e;
          text-align: center;
          font-size: 32px;
          margin-bottom: 20px;
          text-transform: uppercase;
        }

        .auth-left input {
          border: 2px solid #9f6a52;
          padding: 12px;
          border-radius: 5px;
          margin-bottom: 5px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.3s ease-in-out;
        }

        .auth-left input:focus {
          border-color: #7a4e35;
        }

        /* invalid input style */
        .is-invalid {
          border-color: #d9534f !important;
          background-color: #f8d7da;
        }

        .invalid-feedback {
          color: #d9534f;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .btn-rajasthani {
          background-color: #9f6a52;
          color: white;
          padding: 12px 20px;
          border-radius: 5px;
          font-size: 18px;
          text-transform: uppercase;
          font-weight: bold;
          transition: background-color 0.3s ease-in-out;
          border: none;
          cursor: pointer;
        }

        .btn-rajasthani:disabled {
          background-color: #b8a191;
          cursor: not-allowed;
        }

        .btn-rajasthani:hover:not(:disabled) {
          background-color: #7a4e35;
        }

        .error {
          color: #d9534f;
          font-size: 14px;
        }

        .success {
          color: #5bc0de;
          font-size: 14px;
        }

        .toggle-auth a {
          font-size: 16px;
          color: #9f6a52;
          text-decoration: none;
        }

        .toggle-auth a:hover {
          color: #7a4e35;
        }

        .auth-right {
          background-color: #9f6d52;
          width: 50%;
          
          background-position: center;
          color: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .rajasthan-heading {
          font-family: 'Georgia', serif;
          font-size: 40px;
          margin-top: 20px;
          font-weight: 700;
          color: #7B3F00;
          border-bottom: 3px solid #D4AF37;
          display: inline-block;
          padding-bottom: 5px;
          animation: fadeInTop 1s ease-in-out forwards;
        }

        .auth-right p {
          font-size: 18px;
          color: #3e2723;
          margin-top: 25px;
          padding: 15px 20px;
          font-style: normal;
          font-weight: 500;
          line-height: 1.6;
          animation: fadeIn 1.2s ease-out forwards;
        }

        @keyframes fadeInTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media screen and (max-width: 768px) {
          .auth-overlay {
            flex-direction: column;
          }

          .auth-left,
          .auth-right {
            width: 100%;
            padding: 30px;
          }

          .rajasthan-heading {
            font-size: 28px;
          }

          .auth-left h2 {
            font-size: 28px;
          }

          .btn-rajasthani {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default AuthSection;
