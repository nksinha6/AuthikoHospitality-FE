import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { authService } from "../services/authService.js";
import Loader from "../components/Loader.jsx";
import { UI_TEXT, FORM_FIELDS, ROUTES } from "../constants/ui.js";
import "../styles/login.css";
import logo from "../assets/images/1pass_logo.jpg";

const INITIAL_FORM_VALUES = {
  [FORM_FIELDS.USER_ID]: "",
  [FORM_FIELDS.PASSWORD]: "",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login } = useAuth();
  const { values, isSubmitting, setIsSubmitting, handleChange, setFieldValue } =
    useForm(INITIAL_FORM_VALUES);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("rememberMe") === "true";
  });

  const from = ROUTES.TODAYS_BOOKINGS;

  // Load saved email if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setFieldValue(FORM_FIELDS.USER_ID, savedEmail);
    }
  }, [setFieldValue]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Save email if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem("savedEmail", values[FORM_FIELDS.USER_ID]);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.setItem("rememberMe", "false");
      }

      const tokens = await authService.login({
        userId: values[FORM_FIELDS.USER_ID],
        password: values[FORM_FIELDS.PASSWORD],
      });

      // Persist tokens according to "Remember me" preference
      login(tokens, rememberMe);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please try again.");
      console.error("Login failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      {/* Main Content */}
      <div className="login-wrapper">
        <div className="login-card">
          {/* Header with Logo */}
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-icon">
                <img src={logo} alt="Company Logo" />
              </div>
            </div>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="alert alert-error" role="alert" aria-live="polite">
              <div className="alert-icon">⚠️</div>
              <div className="alert-message">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor={FORM_FIELDS.USER_ID} className="form-label">
                {UI_TEXT.LOGIN_EMAIL_LABEL}
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id={FORM_FIELDS.USER_ID}
                  type="email"
                  name={FORM_FIELDS.USER_ID}
                  className="form-input"
                  required
                  placeholder={UI_TEXT.LOGIN_EMAIL_PLACEHOLDER}
                  value={values[FORM_FIELDS.USER_ID]}
                  onChange={handleChange}
                  autoComplete="username"
                  aria-label={UI_TEXT.LOGIN_EMAIL_LABEL}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor={FORM_FIELDS.PASSWORD} className="form-label">
                  {UI_TEXT.LOGIN_PASSWORD_LABEL}
                </label>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id={FORM_FIELDS.PASSWORD}
                  type={showPassword ? "text" : "password"}
                  name={FORM_FIELDS.PASSWORD}
                  className="form-input"
                  required
                  placeholder={UI_TEXT.LOGIN_PASSWORD_PLACEHOLDER}
                  value={values[FORM_FIELDS.PASSWORD]}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-label={UI_TEXT.LOGIN_PASSWORD_LABEL}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-group checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  disabled={isSubmitting}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  Remember me on this device
                </span>
              </label>

              <a href="#forgot-password" className="forgot-password-link">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="footer-text">
              Don't have an account?{" "}
              <a href="#signup" className="signup-link">
                Contact Us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
