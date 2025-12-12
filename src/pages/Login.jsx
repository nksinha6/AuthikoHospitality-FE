import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { authService } from "../services/authService.js";
import Loader from "../components/Loader.jsx";
import { UI_TEXT, FORM_FIELDS, ROUTES } from "../constants/ui.js";
import "../styles/global.css";
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--color-bg-page)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          maxHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-white)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-border-subtle)",
            padding: "var(--space-8)",
            width: "100%",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "var(--space-4)",
            }}
          >
            {/* Logo */}
            <div
              style={{
                marginBottom: "var(--space-6)",
              }}
            >
              <img
                src={logo}
                alt="1/Pass Logo"
                style={{
                  width: "60px",
                  height: "auto",
                  marginBottom: "var(--space-4)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML =
                    '<div style="font-size: 32px; color: var(--color-primary); font-weight: bold; margin-bottom: var(--space-4)">1/Pass</div>';
                }}
              />
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "var(--color-text-main)",
                  marginBottom: "var(--space-2)",
                  lineHeight: "1.3",
                }}
              >
                Welcome Back
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-muted)",
                  lineHeight: "1.5",
                }}
              >
                Sign in to your account to continue
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  marginBottom: "var(--space-6)",
                  color: "var(--color-error)",
                  fontSize: "14px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-2)",
                }}
              >
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              {/* Email Field */}
              <div style={{ marginBottom: "var(--space-6)" }}>
                <label
                  htmlFor={FORM_FIELDS.USER_ID}
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--color-text-main)",
                    marginBottom: "var(--space-2)",
                    textAlign: "left",
                  }}
                >
                  Email Address
                </label>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <Mail
                    size={18}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-subtle)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id={FORM_FIELDS.USER_ID}
                    type="email"
                    name={FORM_FIELDS.USER_ID}
                    required
                    placeholder="abc@xyz.com"
                    value={values[FORM_FIELDS.USER_ID]}
                    onChange={handleChange}
                    autoComplete="username"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      fontSize: "14px",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-white)",
                      color: "var(--color-text-main)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "var(--space-6)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <label
                    htmlFor={FORM_FIELDS.PASSWORD}
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "var(--color-text-main)",
                    }}
                  >
                    Password
                  </label>
                  
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-subtle)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id={FORM_FIELDS.PASSWORD}
                    type={showPassword ? "text" : "password"}
                    name={FORM_FIELDS.PASSWORD}
                    required
                    placeholder="Enter your password"
                    value={values[FORM_FIELDS.PASSWORD]}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 40px",
                      fontSize: "14px",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-white)",
                      color: "var(--color-text-main)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-subtle)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                      fontSize: "13px",
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      fontWeight: "500",
                      float: "right",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    Forgot password?
                  </a>
              </div>

              {/* Remember Me Checkbox */}
              <div
                style={{
                  marginBottom: "var(--space-8)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  disabled={isSubmitting}
                  style={{
                    width: "16px",
                    height: "16px",
                    marginRight: "8px",
                    cursor: "pointer",
                    accentColor: "var(--color-primary)",
                  }}
                />
                <label
                  htmlFor="remember-me"
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  Remember me on this device
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-white)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginBottom: "var(--space-8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = "var(--color-primary-dark)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = "var(--color-primary)";
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        borderTopColor: "var(--color-white)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    ></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span style={{ fontSize: "16px" }}>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                paddingTop: "var(--space-6)",
                borderTop: "1px solid var(--color-border-subtle)",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  lineHeight: "1.5",
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

      
    </div>
  );
}