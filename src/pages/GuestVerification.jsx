import { useLocation, useNavigate } from "react-router-dom";
import { UI_TEXT, ROUTES } from "../constants/ui.js";
import { Calendar, User, Phone, Users, CheckCircle, ArrowLeft, Shield } from "lucide-react";
import "../styles/checkins.css";

export default function GuestVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData;

  const handleConfirmCheckIn = () => {
    // Show success message
    alert("Guest check-in successful! Starting verification process...");
    
    // In a real app, you would start the verification process here
    // For now, navigate to guest phone entry page
    navigate("/guest-phone-entry", {
      state: {
        bookingId: `WALKIN-${Date.now().toString().slice(-6)}`,
        guestName: `${formData.firstName} ${formData.surname}`,
        totalGuests: formData.totalGuests,
        adults: formData.adults,
        minors: formData.minors,
        phoneNumber: formData.phone,
        isWalkIn: true
      }
    });
  };

  const handleBack = () => {
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
              <Shield className="logo-icon" size={48} color="#1b3635" />
            </div>
            <h2 className="login-title">Guest Verification</h2>
            <p className="login-subtitle">
              Review and verify guest details before check-in
            </p>
          </div>

          {/* Form Card */}
          <div className="checkin-form-container">
            <div className="form-card-header">
              <h3 className="form-card-title">Verification Summary</h3>
              <p className="form-card-subtitle">Review all guest information before proceeding</p>
            </div>

            {formData ? (
  <div className="verification-content">
    {/* Summary Section - Now properly boxed */}
    <div className="summary-container">
      <div className="summary-section">
        <div className="summary-header">
          <div className="summary-title-container">
            <CheckCircle size={20} className="summary-title-icon" />
            <h4 className="section-title">
              Guest Information Summary
            </h4>
          </div>
          <div className="status-badge status-success">
            <span className="status-dot"></span>
            Ready for Verification
          </div>
        </div>

        {/* Summary Grid */}
        <div className="summary-grid">
          {/* Row 1 */}
          <div className="summary-row">
            {/* Date */}
            <div className="summary-card">
              <div className="summary-card-header">
                <Calendar size={18} className="summary-icon" />
                <span className="summary-label">Date</span>
              </div>
              <div className="summary-value">{formData.date}</div>
            </div>

            {/* Lead Guest Name */}
            <div className="summary-card">
              <div className="summary-card-header">
                <User size={18} className="summary-icon" />
                <span className="summary-label">Lead Guest</span>
              </div>
              <div className="summary-value">
                {formData.firstName} {formData.surname}
              </div>
            </div>

            {/* Phone Number */}
            <div className="summary-card">
              <div className="summary-card-header">
                <Phone size={18} className="summary-icon" />
                <span className="summary-label">Phone Number</span>
              </div>
              <div className="summary-value phone-value">{formData.phone}</div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="summary-row">
            {/* Adults Count */}
            <div className="summary-card guest-count-card">
              <div className="summary-card-header">
                <Users size={18} className="summary-icon" />
                <span className="summary-label">Adults</span>
              </div>
              <div className="summary-value count-value highlight">
                {formData.adults}
                <span className="count-label">Persons</span>
              </div>
            </div>

            {/* Minors Count */}
            <div className="summary-card guest-count-card">
              <div className="summary-card-header">
                <Users size={18} className="summary-icon" />
                <span className="summary-label">Minors</span>
              </div>
              <div className="summary-value count-value">
                {formData.minors}
                <span className="count-label">Persons</span>
              </div>
            </div>

            {/* Total Guests */}
            <div className="summary-card guest-count-card total-highlight-card">
              <div className="summary-card-header">
                <Users size={20} className="summary-icon total-icon" />
                <span className="summary-label total-label">Total Guests</span>
              </div>
              <div className="summary-value total-value">
                {formData.totalGuests}
                <span className="total-guests-label">Persons</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Verification Notes */}
    <div className="info-box verification-notes">
      <div className="info-icon">⚠️</div>
      <div className="info-content">
        <h5 className="info-title">Important Verification Notes</h5>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-bullet">•</span>
            <span>All adult guests will need to complete Aadhaar verification</span>
          </div>
          <div className="info-item">
            <span className="info-bullet">•</span>
            <span>Face ID matching will be performed for each adult</span>
          </div>
          <div className="info-item">
            <span className="info-bullet">•</span>
            <span>Verification links will be sent to provided phone numbers</span>
          </div>
          <div className="info-item">
            <span className="info-bullet">•</span>
            <span>Minors do not require separate verification</span>
          </div>
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="form-actions">
      <button
        type="button"
        className="button-primary"
        onClick={handleConfirmCheckIn}
      >
        <CheckCircle size={18} />
        Confirm & Start Verification
        <span className="arrow">→</span>
      </button>
      <button
        type="button"
        className="button-secondary"
        onClick={handleBack}
      >
        <ArrowLeft size={18} />
        Back to Edit
      </button>
    </div>
  </div>
) : (
  <div className="no-data-container">
    <div className="no-data-icon">📋</div>
    <h4 className="no-data-title">No Guest Data Provided</h4>
    <p className="no-data-text">
      Please go back to create a walk-in booking first.
    </p>
    <button
      type="button"
      className="button-secondary"
      onClick={handleBack}
      style={{ marginTop: '16px' }}
    >
      <ArrowLeft size={18} />
      Back to Create Walk-in
    </button>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}