import { useState, useCallback, useMemo, useEffect } from "react";
import { useForm } from "../hooks/useForm.js";
import { checkInService } from "../services/checkInService.js";
import { UI_TEXT, FORM_FIELDS } from "../constants/ui.js";

const createInitialGuestDetails = (count, primaryGuestName) => {
  const guests = [];
  for (let i = 0; i < count; i++) {
    guests.push({
      id: i + 1,
      guestName: i === 0 ? primaryGuestName : "",
      mobileNumber: "",
      aadharVerified: false,
      faceIdVerified: false,
      timestamp: null,
    });
  }
  return guests;
};

export default function CheckInModal({ booking, isOpen, onClose, onCheckInComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [guestDetails, setGuestDetails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const INITIAL_FORM_VALUES = {
    [FORM_FIELDS.BOOKING_ID]: booking?.bookingId || "",
    [FORM_FIELDS.GUEST_NAME]: booking?.guestName || "",
    [FORM_FIELDS.NUMBER_OF_GUESTS]: booking?.numberOfGuests?.toString() || "",
  };

  const { values, handleChange, resetForm, setFieldValue } = useForm(INITIAL_FORM_VALUES);

  // Pre-fill form when booking changes
  useEffect(() => {
    if (booking && isOpen) {
      setFieldValue(FORM_FIELDS.BOOKING_ID, booking.bookingId);
      setFieldValue(FORM_FIELDS.GUEST_NAME, booking.guestName);
      setFieldValue(FORM_FIELDS.NUMBER_OF_GUESTS, booking.numberOfGuests?.toString() || "");
      setCurrentStep(1);
      setGuestDetails([]);
    }
  }, [booking, isOpen, setFieldValue]);

  const numberOfGuests = parseInt(values[FORM_FIELDS.NUMBER_OF_GUESTS], 10) || 0;
  const isStep1Complete =
    values[FORM_FIELDS.BOOKING_ID] &&
    values[FORM_FIELDS.GUEST_NAME] &&
    numberOfGuests > 0;

  const handleNext = useCallback(
    (event) => {
      event.preventDefault();
      if (isStep1Complete) {
        setGuestDetails(
          createInitialGuestDetails(
            numberOfGuests,
            values[FORM_FIELDS.GUEST_NAME]
          )
        );
        setCurrentStep(2);
      }
    },
    [isStep1Complete, numberOfGuests, values]
  );

  const handleBack = useCallback(() => {
    setCurrentStep(1);
    setGuestDetails([]);
  }, []);

  const handleGuestDetailChange = useCallback((index, field, value) => {
    setGuestDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-verify Aadhar if name and mobile are filled
      if (field === "guestName" || field === "mobileNumber") {
        const { guestName, mobileNumber } = updated[index];
        if (guestName && mobileNumber) {
          updated[index].aadharVerified = true;
        } else {
          updated[index].aadharVerified = false;
        }
      }
      return updated;
    });
  }, []);

  const isGuestRowComplete = useCallback((guest) => {
    return guest.guestName.trim() !== "" && guest.mobileNumber.trim() !== "";
  }, []);

  const isGuestFullyComplete = useCallback((guest) => {
    return (
      isGuestRowComplete(guest) &&
      guest.aadharVerified &&
      guest.faceIdVerified &&
      guest.timestamp !== null
    );
  }, [isGuestRowComplete]);

  const isAllGuestsFullyComplete = useMemo(() => {
    return guestDetails.every(isGuestFullyComplete);
  }, [guestDetails, isGuestFullyComplete]);

  const handleAutoVerify = useCallback((index) => {
    setGuestDetails((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        faceIdVerified: true,
        timestamp: new Date().toLocaleString(),
      };
      return updated;
    });
  }, []);

  const handleManualVerify = useCallback((index) => {
    setGuestDetails((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        faceIdVerified: true,
        timestamp: new Date().toLocaleString(),
      };
      return updated;
    });
  }, []);

  const handleCheckInSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !isAllGuestsFullyComplete) return;
    setIsSubmitting(true);

    try {
      await checkInService.submitCheckIn({
        bookingId: values[FORM_FIELDS.BOOKING_ID],
        primaryGuestName: values[FORM_FIELDS.GUEST_NAME],
        numberOfGuests: numberOfGuests,
        guestDetails: guestDetails,
      });

      // Call the completion callback
      if (onCheckInComplete) {
        onCheckInComplete(booking?.id || values[FORM_FIELDS.BOOKING_ID]);
      }

      // Reset and close
      resetForm();
      setGuestDetails([]);
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error("Check-in submission failed:", error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="h-card-title">{UI_TEXT.CHECK_INS_FORM_TITLE}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="step-indicator">
          <div className="step-item">
            <div
              className={`step-number ${currentStep === 1 ? "step-number--active" : currentStep > 1 ? "step-number--completed" : ""}`}
            >
              1
            </div>
            <span className={`step-label ${currentStep === 1 ? "step-label--active" : ""}`}>
              {UI_TEXT.CHECK_INS_STEP_1_TITLE}
            </span>
          </div>
          <div
            className={`step-connector ${currentStep > 1 ? "step-connector--completed" : ""}`}
          ></div>
          <div className="step-item">
            <div
              className={`step-number ${currentStep === 2 ? "step-number--active" : ""}`}
            >
              2
            </div>
            <span className={`step-label ${currentStep === 2 ? "step-label--active" : ""}`}>
              {UI_TEXT.CHECK_INS_STEP_2_TITLE}
            </span>
          </div>
        </div>

        {currentStep === 1 ? (
          <form className="form" onSubmit={handleNext}>
            <div className="form-field">
              <label htmlFor={`modal-${FORM_FIELDS.BOOKING_ID}`} className="form-label-text">
                {UI_TEXT.CHECK_INS_BOOKING_ID_LABEL}
              </label>
              <input
                id={`modal-${FORM_FIELDS.BOOKING_ID}`}
                name={FORM_FIELDS.BOOKING_ID}
                type="text"
                className="input"
                required
                placeholder={UI_TEXT.CHECK_INS_BOOKING_ID_PLACEHOLDER}
                value={values[FORM_FIELDS.BOOKING_ID]}
                onChange={handleChange}
                aria-label={UI_TEXT.CHECK_INS_BOOKING_ID_LABEL}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`modal-${FORM_FIELDS.GUEST_NAME}`} className="form-label-text">
                {UI_TEXT.CHECK_INS_GUEST_NAME_LABEL}
              </label>
              <input
                id={`modal-${FORM_FIELDS.GUEST_NAME}`}
                name={FORM_FIELDS.GUEST_NAME}
                type="text"
                className="input"
                required
                placeholder={UI_TEXT.CHECK_INS_GUEST_NAME_PLACEHOLDER}
                value={values[FORM_FIELDS.GUEST_NAME]}
                onChange={handleChange}
                aria-label={UI_TEXT.CHECK_INS_GUEST_NAME_LABEL}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`modal-${FORM_FIELDS.NUMBER_OF_GUESTS}`} className="form-label-text">
                {UI_TEXT.CHECK_INS_NUMBER_OF_GUESTS_LABEL}
              </label>
              <input
                id={`modal-${FORM_FIELDS.NUMBER_OF_GUESTS}`}
                name={FORM_FIELDS.NUMBER_OF_GUESTS}
                type="number"
                className="input"
                required
                min="1"
                placeholder={UI_TEXT.CHECK_INS_NUMBER_OF_GUESTS_PLACEHOLDER}
                value={values[FORM_FIELDS.NUMBER_OF_GUESTS]}
                onChange={handleChange}
                aria-label={UI_TEXT.CHECK_INS_NUMBER_OF_GUESTS_LABEL}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={!isStep1Complete || isSubmitting}
                aria-label={UI_TEXT.CHECK_INS_BUTTON_NEXT}
              >
                {UI_TEXT.CHECK_INS_BUTTON_NEXT}
              </button>
            </div>
          </form>
        ) : (
          <form className="form" onSubmit={handleCheckInSubmit}>
            <div className="mb-6">
              <p className="text-body text-muted no-margin-bottom">
                {UI_TEXT.CHECK_INS_GUEST_DETAILS_TITLE} ({numberOfGuests}{" "}
                {numberOfGuests === 1 ? "guest" : "guests"})
              </p>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-num-column">{UI_TEXT.CHECK_INS_COLUMN_SR_NO}</th>
                    <th>{UI_TEXT.CHECK_INS_COLUMN_GUEST_NAME}</th>
                    <th>{UI_TEXT.CHECK_INS_COLUMN_MOBILE}</th>
                    <th>{UI_TEXT.CHECK_INS_COLUMN_AADHAR}</th>
                    <th>{UI_TEXT.CHECK_INS_COLUMN_FACE_ID}</th>
                    <th>{UI_TEXT.CHECK_INS_COLUMN_TIMESTAMP}</th>
                    <th className="table-actions-column"></th>
                  </tr>
                </thead>
                <tbody>
                  {guestDetails.map((guest, index) => {
                    const isRowComplete = isGuestRowComplete(guest);
                    const isFullyComplete = isGuestFullyComplete(guest);

                    return (
                      <tr key={guest.id}>
                        <td className="table-num">
                          <span className="text-body">{guest.id}</span>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input"
                            placeholder={UI_TEXT.CHECK_INS_GUEST_NAME_PLACEHOLDER}
                            value={guest.guestName}
                            onChange={(e) =>
                              handleGuestDetailChange(index, "guestName", e.target.value)
                            }
                            aria-label={`${UI_TEXT.CHECK_INS_COLUMN_GUEST_NAME} ${guest.id}`}
                          />
                        </td>
                        <td>
                          <input
                            type="tel"
                            className="input"
                            placeholder={UI_TEXT.CHECK_INS_MOBILE_PLACEHOLDER}
                            value={guest.mobileNumber}
                            onChange={(e) =>
                              handleGuestDetailChange(index, "mobileNumber", e.target.value)
                            }
                            aria-label={`${UI_TEXT.CHECK_INS_COLUMN_MOBILE} ${guest.id}`}
                          />
                        </td>
                        <td>
                          {isRowComplete && guest.aadharVerified ? (
                            <div className="flex-gap">
                              <img
                                src="/vite.svg"
                                alt={UI_TEXT.CHECK_INS_AADHAR_VERIFIED}
                                className="verified-icon"
                                aria-label={UI_TEXT.CHECK_INS_AADHAR_VERIFIED}
                              />
                              <span className="text-body text-muted">
                                {UI_TEXT.CHECK_INS_AADHAR_VERIFIED}
                              </span>
                            </div>
                          ) : (
                            <span className="text-body text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {isRowComplete ? (
                            <div className="flex-gap">
                              <button
                                type="button"
                                className="button button-secondary"
                                onClick={() => handleAutoVerify(index)}
                                disabled={guest.faceIdVerified}
                                aria-label={`${UI_TEXT.CHECK_INS_FACE_ID_AUTO} ${index + 1}`}
                              >
                                {UI_TEXT.CHECK_INS_FACE_ID_AUTO}
                              </button>
                              <button
                                type="button"
                                className="button button-secondary"
                                onClick={() => handleManualVerify(index)}
                                disabled={guest.faceIdVerified}
                                aria-label={`${UI_TEXT.CHECK_INS_FACE_ID_MANUAL} ${index + 1}`}
                              >
                                {UI_TEXT.CHECK_INS_FACE_ID_MANUAL}
                              </button>
                            </div>
                          ) : (
                            <span className="text-body text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {isFullyComplete ? (
                            <span className="text-body text-muted">{guest.timestamp}</span>
                          ) : (
                            <span className="text-body text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {isFullyComplete && (
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() => console.log("View details for guest:", guest.id)}
                              aria-label={`${UI_TEXT.CHECK_INS_VIEW_DETAILS} ${guest.id}`}
                            >
                              {UI_TEXT.CHECK_INS_VIEW_DETAILS}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-actions flex-gap">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleBack}
                aria-label={UI_TEXT.CHECK_INS_BUTTON_BACK}
              >
                {UI_TEXT.CHECK_INS_BUTTON_BACK}
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={!isAllGuestsFullyComplete || isSubmitting}
                aria-label={UI_TEXT.CHECK_INS_BUTTON}
              >
                {isSubmitting ? UI_TEXT.CHECK_INS_BUTTON_LOADING : UI_TEXT.CHECK_INS_BUTTON}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

