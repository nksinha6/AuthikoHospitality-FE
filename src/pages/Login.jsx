import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { authService } from "../services/authService.js";
import Loader from "../components/Loader.jsx";
import { UI_TEXT, FORM_FIELDS, ROUTES } from "../constants/ui.js";

const INITIAL_FORM_VALUES = {
  [FORM_FIELDS.USER_ID]: "",
  [FORM_FIELDS.PASSWORD]: "",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login } = useAuth();
  const { values, isSubmitting, setIsSubmitting, handleChange } = useForm(INITIAL_FORM_VALUES);
  const [errorMessage, setErrorMessage] = useState("");

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const tokens = await authService.login({
        userId: values[FORM_FIELDS.USER_ID],
        password: values[FORM_FIELDS.PASSWORD],
      });

      login(tokens);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please try again.");
      console.error("Login failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="login-container">
      <div className="card card-container-narrow">
        <div className="login-header">
          <h1 className="h-page-title">{UI_TEXT.LOGIN_TITLE}</h1>
          <p className="text-muted login-subtitle">{UI_TEXT.LOGIN_SUBTITLE}</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor={FORM_FIELDS.USER_ID} className="form-label-text">
              {UI_TEXT.LOGIN_EMAIL_LABEL}
            </label>
            <input
              id={FORM_FIELDS.USER_ID}
              type="text"
              name={FORM_FIELDS.USER_ID}
              className="input"
              required
              placeholder={UI_TEXT.LOGIN_EMAIL_PLACEHOLDER}
              value={values[FORM_FIELDS.USER_ID]}
              onChange={handleChange}
              autoComplete="username"
              aria-label={UI_TEXT.LOGIN_EMAIL_LABEL}
            />
          </div>

          <div className="form-field">
            <label htmlFor={FORM_FIELDS.PASSWORD} className="form-label-text">
              {UI_TEXT.LOGIN_PASSWORD_LABEL}
            </label>
            <input
              id={FORM_FIELDS.PASSWORD}
              type="password"
              name={FORM_FIELDS.PASSWORD}
              className="input"
              required
              placeholder={UI_TEXT.LOGIN_PASSWORD_PLACEHOLDER}
              value={values[FORM_FIELDS.PASSWORD]}
              onChange={handleChange}
              autoComplete="current-password"
              aria-label={UI_TEXT.LOGIN_PASSWORD_LABEL}
            />
          </div>

          {errorMessage && (
            <div className="error" role="alert" aria-live="polite">
              {errorMessage}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
              aria-label={UI_TEXT.LOGIN_BUTTON}
            >
              {isSubmitting ? UI_TEXT.LOGIN_BUTTON_LOADING : UI_TEXT.LOGIN_BUTTON}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
