import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../hooks/useForm.js";
import { Calendar, User, Phone, Users, UserPlus } from "lucide-react";
import { UI_TEXT, ROUTES } from "../constants/ui.js";
import "../styles/checkins.css";

const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

const INITIAL_FORM_VALUES = {
  date: today,
  firstName: "",
  surname: "",
  phone: "+91 ",
  adults: 0,
  minors: 0,
  totalGuests: 0,
};

// Helper function to format phone number
const formatPhoneNumber = (value) => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 2) return "+91 ";
  if (cleaned.length <= 5) return `+91 ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) {
    const part1 = cleaned.slice(2, 5);
    const part2 = cleaned.slice(5);
    return `+91 ${part1}-${part2}`;
  }
  const part1 = cleaned.slice(2, 5);
  const part2 = cleaned.slice(5, 10);
  return `+91 ${part1}-${part2}`;
};

export default function CheckIns() {
  const navigate = useNavigate();
  const { values, isSubmitting, setIsSubmitting, setFieldValue } = useForm(INITIAL_FORM_VALUES);
  
  // Keep totalGuests in sync with adults + minors
  useEffect(() => {
    const adults = parseInt(values.adults || 0, 10);
    const minors = parseInt(values.minors || 0, 10);
    const total = (isNaN(adults) ? 0 : adults) + (isNaN(minors) ? 0 : minors);
    if (total !== values.totalGuests) setFieldValue("totalGuests", total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.adults, values.minors]);

  const handleStartVerification = async (e) => {
    e.preventDefault();
    if (!values.firstName.trim() || !values.surname.trim()) {
      alert("Please enter first and last name");
      return;
    }
    if (values.totalGuests === 0) {
      alert("Please enter at least one guest");
      return;
    }
    setIsSubmitting(true);
    try {
      navigate(ROUTES.GUEST_VERIFICATION, { state: { formData: values } });
    } catch (err) {
      console.error("Navigation failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.CHECK_INS);
  };

  return (
    <div className="login-page">
      {/* Animated Background (same as login) */}
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
              <UserPlus className="logo-icon" size={48} color="#1b3635" />
            </div>
            <h2 className="login-title">Create Walk-in</h2>
            <p className="login-subtitle">
              Register a new walk-in guest quickly and efficiently
            </p>
          </div>

          {/* Form Card */}
          <div className="checkin-form-container">
            <div className="form-card-header">
              <h3 className="form-card-title">Guest Details</h3>
              <p className="form-card-subtitle">Fill in the guest information to start verification</p>
            </div>

            <form className="checkin-form" onSubmit={handleStartVerification}>
              {/* Date Field */}
              <div className="form-group date-field">
                <label htmlFor="date" className="form-label">
                  Date
                </label>
                <div className="input-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input
                    id="date"
                    type="date"
                    name="date"
                    className="form-input"
                    value={values.date}
                    readOnly
                    disabled={isSubmitting}
                    aria-label="Date"
                  />
                </div>
                <p className="input-helper-text">Current date (not editable)</p>
              </div>

              {/* Lead Guest Section */}
              <div className="section-divider">
                <div className="section-line"></div>
                <h4 className="section-title">Lead Guest</h4>
                <div className="section-line"></div>
              </div>

              {/* First Name and Surname */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="firstName" className="form-label">
                    First Name *
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      className="form-input"
                      required
                      placeholder="John"
                      value={values.firstName}
                      onChange={(e) => setFieldValue("firstName", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group half-width">
                  <label htmlFor="surname" className="form-label">
                    Surname *
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      id="surname"
                      name="surname"
                      type="text"
                      className="form-input"
                      required
                      placeholder="Doe"
                      value={values.surname}
                      onChange={(e) => setFieldValue("surname", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group phone-field">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    required
                    placeholder="+91 91064-71172"
                    value={values.phone}
                    onChange={(e) => setFieldValue("phone", formatPhoneNumber(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Number of Guests Section */}
              <div className="section-divider">
                <div className="section-line"></div>
                <h4 className="section-title">Number of Guests</h4>
                <div className="section-line"></div>
              </div>

              <div className="guests-container">
                <div className="guests-grid">
                  {/* Adults */}
                  <div className="guest-count-card adult-card">
                    <div className="guest-count-header">
                      <Users size={18} className="guest-count-icon" />
                      <label htmlFor="adults" className="guest-count-label">
                        Adults *
                      </label>
                    </div>
                    <div className="number-input-container">
                      <button
                        type="button"
                        onClick={() => setFieldValue("adults", Math.max(0, (Number(values.adults) || 0) - 1))}
                        className="number-btn minus-btn"
                        disabled={(Number(values.adults) || 0) === 0 || isSubmitting}
                      >
                        −
                      </button>
                      <input
                        id="adults"
                        type="number"
                        min="0"
                        className="number-input"
                        value={Number(values.adults) || 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setFieldValue("adults", isNaN(v) ? 0 : Math.max(0, v));
                        }}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setFieldValue("adults", (Number(values.adults) || 0) + 1)}
                        className="number-btn plus-btn"
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>
                    <p className="guest-count-description">Age 18+</p>
                  </div>

                  {/* Minors */}
                  <div className="guest-count-card minor-card">
                    <div className="guest-count-header">
                      <Users size={18} className="guest-count-icon" />
                      <label htmlFor="minors" className="guest-count-label">
                        Minors *
                      </label>
                    </div>
                    <div className="number-input-container">
                      <button
                        type="button"
                        onClick={() => setFieldValue("minors", Math.max(0, (Number(values.minors) || 0) - 1))}
                        className="number-btn minus-btn"
                        disabled={(Number(values.minors) || 0) === 0 || isSubmitting}
                      >
                        −
                      </button>
                      <input
                        id="minors"
                        type="number"
                        className="number-input"
                        value={Number(values.minors) || 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setFieldValue("minors", isNaN(v) ? 0 : Math.max(0, v));
                        }}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setFieldValue("minors", (Number(values.minors) || 0) + 1)}
                        className="number-btn plus-btn"
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>
                    <p className="guest-count-description">Age under 18</p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="info-box">
                <div className="info-icon">ℹ️</div>
                <p className="info-text">
                  <strong>Important:</strong> Total guests must equal Adults + Minors. 
                  All adults will need to go through the verification process.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Starting Verification...
                    </>
                  ) : (
                    <>
                      Start Guest Verification
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}