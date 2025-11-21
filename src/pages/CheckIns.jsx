import { useState } from "react";
import { useForm } from "../hooks/useForm.js";
import { checkInService } from "../services/checkInService.js";
import { UI_TEXT, FORM_FIELDS } from "../constants/ui.js";

const INITIAL_FORM_VALUES = {
  [FORM_FIELDS.BOOKING_ID]: "",
  [FORM_FIELDS.GUEST_NAME]: "",
  [FORM_FIELDS.NUMBER_OF_GUESTS]: "",
};

export default function CheckIns() {
  const { values, isSubmitting, setIsSubmitting, handleChange, resetForm } = useForm(INITIAL_FORM_VALUES);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await checkInService.submitCheckIn({
        bookingId: values[FORM_FIELDS.BOOKING_ID],
        guestName: values[FORM_FIELDS.GUEST_NAME],
        numberOfGuests: parseInt(values[FORM_FIELDS.NUMBER_OF_GUESTS], 10),
      });
      resetForm();
    } catch (error) {
      console.error("Check-in submission failed:", error);
      // TODO: Add error notification/toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="h-page-title">{UI_TEXT.CHECK_INS_TITLE}</h1>
        <p className="text-muted page-subtitle">{UI_TEXT.CHECK_INS_SUBTITLE}</p>
      </div>

      <div className="card card-container">
        <div className="card-header">
          <h2 className="h-card-title">{UI_TEXT.CHECK_INS_FORM_TITLE}</h2>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor={FORM_FIELDS.BOOKING_ID} className="form-label-text">
              {UI_TEXT.CHECK_INS_BOOKING_ID_LABEL}
            </label>
            <input
              id={FORM_FIELDS.BOOKING_ID}
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
            <label htmlFor={FORM_FIELDS.GUEST_NAME} className="form-label-text">
              {UI_TEXT.CHECK_INS_GUEST_NAME_LABEL}
            </label>
            <input
              id={FORM_FIELDS.GUEST_NAME}
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
            <label htmlFor={FORM_FIELDS.NUMBER_OF_GUESTS} className="form-label-text">
              {UI_TEXT.CHECK_INS_NUMBER_OF_GUESTS_LABEL}
            </label>
            <input
              id={FORM_FIELDS.NUMBER_OF_GUESTS}
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
              disabled={isSubmitting}
              aria-label={UI_TEXT.CHECK_INS_BUTTON}
            >
              {isSubmitting ? UI_TEXT.CHECK_INS_BUTTON_LOADING : UI_TEXT.CHECK_INS_BUTTON}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
