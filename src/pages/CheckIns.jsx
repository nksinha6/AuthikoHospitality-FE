import React, { useState } from 'react';
import "../styles/global.css";
import "../styles/checkins.css";

const OTAVerificationForm = () => {
  const [formData, setFormData] = useState({
    ota: '',
    bookingId: '',
    countryCode: '+91',
    phoneNumber: '',
    adults: '',
    children: ''
  });

  const [showBookingId, setShowBookingId] = useState(true);

  const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳', pattern: /^(\d{5})(\d{5})$/, format: '$1-$2' },
    { code: '+1', country: 'US/Canada', flag: '🇺🇸', pattern: /^(\d{3})(\d{3})(\d{4})$/, format: '($1) $2-$3' },
    { code: '+44', country: 'UK', flag: '🇬🇧', pattern: /^(\d{4})(\d{6})$/, format: '$1 $2' },
    { code: '+61', country: 'Australia', flag: '🇦🇺', pattern: /^(\d{4})(\d{3})(\d{3})$/, format: '$1 $2 $3' },
    { code: '+971', country: 'UAE', flag: '🇦🇪', pattern: /^(\d{2})(\d{3})(\d{4})$/, format: '$1 $2 $3' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', pattern: /^(\d{4})(\d{4})$/, format: '$1 $2' },
  ];

  const otaOptions = [
    'Booking.com',
    'Airbnb',
    'Expedia',
    'Hotels.com',
    'Agoda',
    'Vrbo',
    'Tripadvisor',
    'MakeMyTrip',
    'Goibibo',
    'Walk-In'
  ];

  const getCurrentDate = () => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  const handleOTASelection = (e) => {
    const selectedOTA = e.target.value;
    setFormData(prev => ({
      ...prev,
      ota: selectedOTA,
      bookingId: selectedOTA === 'Walk-In' ? '' : prev.bookingId
    }));
    setShowBookingId(selectedOTA !== 'Walk-In');
  };

  const formatPhoneNumber = (value, countryCode) => {
    if (!value) return '';
    const country = countryCodes.find(c => c.code === countryCode);
    if (!country) return value;
    const digits = value.replace(/\D/g, '');
    if (country.pattern) {
      const match = digits.match(country.pattern);
      if (match) {
        return country.format.replace(/\$(\d+)/g, (_, index) => match[index]);
      }
    }
    return digits;
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value, formData.countryCode);
    setFormData(prev => ({ ...prev, phoneNumber: formattedValue }));
  };

  const handleCountryCodeChange = (e) => {
    const newCountryCode = e.target.value;
    const formattedNumber = formatPhoneNumber(formData.phoneNumber.replace(/\D/g, ''), newCountryCode);
    setFormData(prev => ({ ...prev, countryCode: newCountryCode, phoneNumber: formattedNumber }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'adults' || name === 'children') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue < 0 ? '' : value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCancel = () => {
    setFormData({
      ota: '',
      bookingId: '',
      countryCode: '+91',
      phoneNumber: '',
      adults: '',
      children: ''
    });
    setShowBookingId(true);
  };

  const handleReview = () => {
    if (!formData.ota) {
      alert('Please select an OTA platform');
      return;
    }
    if (showBookingId && !formData.bookingId.trim()) {
      alert('Please enter booking ID');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      alert('Please enter phone number');
      return;
    }
    if (!formData.adults || parseInt(formData.adults) < 1) {
      alert('Please enter at least one adult');
      return;
    }
    const childrenValue = parseInt(formData.children) || 0;
    if (childrenValue < 0) {
      alert('Number of minors cannot be negative');
      return;
    }
    console.log('Review booking information:', formData);
  };

  const getCurrentFlag = () => {
    const country = countryCodes.find(c => c.code === formData.countryCode);
    return country ? country.flag : '🇺🇸';
  };

  return (
    <div className="ota-verification-page">
      {/* Main Card */}
      <div className="ota-verification-card">
        {/* Card Header */}
        <div className="ota-verification-header">
          <h2 className="ota-verification-title">
            Walk-In Guest
          </h2>
          <p className="ota-verification-subtitle">
            Enter booking details to begin verification
          </p>
        </div>

        {/* Form Content */}
        <div className="ota-verification-content">
          {/* Verification Date */}
          <div className="form-group">
            <label className="form-label">
              Verification Date
            </label>
            <div className="form-date-display">
              {getCurrentDate()}
            </div>
          </div>

          {/* OTA Platform */}
          <div className="form-group">
            <label className="form-label">
              OTA Platform *
            </label>
            <div className="select-wrapper">
              <select
                name="ota"
                value={formData.ota}
                onChange={handleOTASelection}
                className="form-select"
              >
                <option value="">Select OTA platform</option>
                {otaOptions.map(ota => (
                  <option key={ota} value={ota}>{ota}</option>
                ))}
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>

          {/* Booking ID */}
          {showBookingId && (
            <div className="form-group">
              <label className="form-label">
                Booking ID *
              </label>
              <div className="input-with-icon">
                <span className="input-icon">#</span>
                <input
                  type="text"
                  name="bookingId"
                  placeholder="Enter booking ID"
                  value={formData.bookingId}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">
              Primary Guest Phone Number *
            </label>
            <div className="phone-input-group">
              <div className="country-code-selector">
                <span className="country-flag">
                  {getCurrentFlag()}
                </span>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleCountryCodeChange}
                  className="country-code-select"
                >
                  {countryCodes.map(({ code, country, flag }) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <div className="country-select-arrow">▼</div>
              </div>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handlePhoneNumberChange}
                className="phone-number-input"
              />
            </div>
          </div>

          {/* Guest Count */}
          <div className="form-group">
            <div className="guest-count-grid">
              <div>
                <label className="form-label">
                  Number of Adults *
                </label>
                <input
                  type="number"
                  name="adults"
                  placeholder="Enter number"
                  min="1"
                  value={formData.adults}
                  onChange={handleInputChange}
                  className="form-input"
                />
                <p className="form-hint">
                  Age 18+
                </p>
              </div>
              <div>
                <label className="form-label">
                  Number of Minors *
                </label>
                <input
                  type="number"
                  name="children"
                  placeholder="Enter number"
                  min="0"
                  value={formData.children}
                  onChange={handleInputChange}
                  className="form-input"
                />
                <p className="form-hint">
                  Under 18 years
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={handleCancel}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              className="next-button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTAVerificationForm;