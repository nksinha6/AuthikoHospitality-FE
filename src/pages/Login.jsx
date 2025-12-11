import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { authService } from "../services/authService.js";
import Loader from "../components/Loader.jsx";
import { UI_TEXT, FORM_FIELDS, ROUTES } from "../constants/ui.js";
import "../styles/global.css"; // Using centralized CSS instead of login.css

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
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="login-wrapper"
        style={{ width: "100%", maxWidth: "440px", padding: "var(--space-6)" }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            padding: "var(--space-8)",
            maxWidth: "440px",
            margin: "0 auto",
          }}
        >
          {/* Header with Logo */}
          <div
            className="login-header"
            style={{ marginBottom: "var(--space-8)", textAlign: "center" }}
          >
            <h2 className="h-section-title">Welcome Back</h2>
            <p className="text-muted" style={{ marginTop: "var(--space-2)" }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              className="alert alert-error"
              role="alert"
              aria-live="polite"
              style={{ marginBottom: "var(--space-4)" }}
            >
              <div className="alert-icon" style={{ fontSize: "16px" }}>
                ⚠️
              </div>
              <div className="alert-message">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form
            className="form"
            onSubmit={handleSubmit}
            style={{ gap: "var(--space-3)" }}
          >
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
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
                  onClick={togglePasswordVisibility}
                  style={{
                    position: "absolute",
                    right: "var(--space-3)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--space-1)",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <a
                href="#forgot-password"
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: "500",
                  marginLeft: "auto",
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  disabled={isSubmitting}
                  className="checkbox-input"
                />
                <span
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Remember me on this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
  type="submit"
  className="button button-primary button-block"
  disabled={isSubmitting}
  style={{ 
    marginTop: "var(--space-2)",
    height: "39px",
    padding: "var(--space-2) var(--space-4)",
    fontSize: "var(--font-size-md)",
    fontWeight: "600",
    borderRadius: "6px"
  }}
>
  {isSubmitting ? (
    <>
      <span className="spinner"></span>
      Signing in...
    </>
  ) : (
    <>
      Sign In
      <span style={{ marginLeft: "var(--space-2)" }}>→</span>
    </>
  )}
</button>
          </form>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              paddingTop: "var(--space-6)",
              marginTop: "var(--space-6)",
              borderTop: "1px solid var(--color-border-subtle)",
            }}
          >
            <p
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              Don't have an account?{" "}
              <a
                href="#signup"
                style={{
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Contact Us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
