import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { authService } from "../services/authService.js";
import Loader from "../components/Loader.jsx";
import { UI_TEXT, FORM_FIELDS, ROUTES } from "../constants/ui.js";
import { STORAGE_KEYS } from "../constants/storage.js";
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
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
  });
  const [logoError, setLogoError] = useState(false);

  // const from = location.state?.from?.pathname || ROUTES.TODAYS_BOOKINGS;
  const from = location.state?.from?.pathname || ROUTES.GUEST_DETAILS;

  // Load saved email if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
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
        localStorage.setItem(
          STORAGE_KEYS.SAVED_EMAIL,
          values[FORM_FIELDS.USER_ID],
        );
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-105">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-10">
          {/* Header Section */}
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8">
              {logoError ? (
                <div className="text-3xl text-brand font-bold mb-6">
                  {UI_TEXT.LOGO_NAME}
                </div>
              ) : (
                <img
                  src={logo}
                  alt="1/Pass Logo"
                  className="w-16 h-auto mx-auto mb-6"
                  onError={() => setLogoError(true)}
                />
              )}
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                {UI_TEXT.LOGIN_WELCOME_TITLE}
              </h1>
              <p className="text-sm text-gray-600">
                {UI_TEXT.LOGIN_WELCOME_SUBTITLE}
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full">
            {/* Email Field */}
            <div className="mb-5">
              <label
                htmlFor={FORM_FIELDS.USER_ID}
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
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
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor={FORM_FIELDS.PASSWORD}
                  className="text-sm font-medium text-gray-900"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
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
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-1 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* <a
                href="#forgot-password"
                className="text-sm text-brand font-medium hover:text-brand/80 transition-colors float-right mt-2"
              >
                Forgot password?
              </a> */}
            </div>

            {/* Remember Me Checkbox */}
            {/* <div className="mb-8 flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                disabled={isSubmitting}
                className="w-4 h-4 mr-2 cursor-pointer accent-brand disabled:cursor-not-allowed"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Remember me on this device
              </label>
            </div> */}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="text-base">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          {/* <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a
                href="#signup"
                className="text-brand font-medium hover:text-brand/80 transition-colors"
              >
                Contact Us
              </a>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
