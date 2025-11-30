import { useState, useRef, useEffect, useCallback } from "react";
import { UI_TEXT } from "../constants/ui.js";
import {
  formatDateDDMMMYY,
  formatDateForInput,
  parseDateFromInput,
} from "../utils/dateFormat.js";

const FILTER_CONDITIONS = {
  IS_AFTER: "is after",
  IS_BEFORE: "is before",
  IS_EQUAL_TO: "is equal to",
  IS_ON_OR_AFTER: "is on or after",
  IS_BEFORE_OR_ON: "is before or on",
  IS_IN_THE_LAST: "is in the last",
  IS_BETWEEN: "is between",
};

const CONDITION_OPTIONS = [
  { value: FILTER_CONDITIONS.IS_AFTER, label: UI_TEXT.FILTER_CONDITION_IS_AFTER },
  { value: FILTER_CONDITIONS.IS_BEFORE, label: UI_TEXT.FILTER_CONDITION_IS_BEFORE },
  { value: FILTER_CONDITIONS.IS_EQUAL_TO, label: UI_TEXT.FILTER_CONDITION_IS_EQUAL_TO },
  { value: FILTER_CONDITIONS.IS_ON_OR_AFTER, label: UI_TEXT.FILTER_CONDITION_IS_ON_OR_AFTER },
  { value: FILTER_CONDITIONS.IS_BEFORE_OR_ON, label: UI_TEXT.FILTER_CONDITION_IS_BEFORE_OR_ON },
  { value: FILTER_CONDITIONS.IS_IN_THE_LAST, label: UI_TEXT.FILTER_CONDITION_IS_IN_THE_LAST },
  { value: FILTER_CONDITIONS.IS_BETWEEN, label: UI_TEXT.FILTER_CONDITION_IS_BETWEEN },
];

export default function DateFilter({ label, field, value, onChange, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const [condition, setCondition] = useState(
    value?.condition || FILTER_CONDITIONS.IS_AFTER
  );
  const [dateValue, setDateValue] = useState(
    value?.dateValue ? formatDateForInput(value.dateValue) : ""
  );
  const [fromDate, setFromDate] = useState(
    value?.fromDate ? formatDateForInput(value.fromDate) : ""
  );
  const [toDate, setToDate] = useState(
    value?.toDate ? formatDateForInput(value.toDate) : ""
  );
  const [daysValue, setDaysValue] = useState(
    value?.daysValue?.toString() || ""
  );
  const popupRef = useRef(null);
  const tagRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        tagRef.current &&
        !tagRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleRemove = useCallback(
    (e) => {
      e.stopPropagation();
      if (onRemove) {
        onRemove();
      } else if (onChange) {
        onChange(null);
      }
    },
    [onRemove, onChange]
  );

  const handleApply = useCallback(() => {
    if (!onChange) return;

    let filterValue = null;

    if (condition === FILTER_CONDITIONS.IS_IN_THE_LAST) {
      const days = parseInt(daysValue, 10);
      if (!isNaN(days) && days > 0) {
        filterValue = {
          condition,
          daysValue: days,
          field,
        };
      }
    } else if (condition === FILTER_CONDITIONS.IS_BETWEEN) {
      const from = parseDateFromInput(fromDate);
      const to = parseDateFromInput(toDate);
      if (from && to && from <= to) {
        filterValue = {
          condition,
          fromDate: from,
          toDate: to,
          field,
        };
      }
    } else {
      const date = parseDateFromInput(dateValue);
      if (date) {
        filterValue = {
          condition,
          dateValue: date,
          field,
        };
      }
    }

    if (filterValue) {
      onChange(filterValue);
      setIsOpen(false);
    }
  }, [
    condition,
    dateValue,
    fromDate,
    toDate,
    daysValue,
    field,
    onChange,
  ]);

  const getDisplayValue = () => {
    if (!value) return "";

    if (value.condition === FILTER_CONDITIONS.IS_IN_THE_LAST) {
      return `${value.daysValue} ${UI_TEXT.FILTER_DAYS}`;
    } else if (value.condition === FILTER_CONDITIONS.IS_BETWEEN) {
      return `${formatDateDDMMMYY(value.fromDate)} - ${formatDateDDMMMYY(value.toDate)}`;
    } else if (value.dateValue) {
      return formatDateDDMMMYY(value.dateValue);
    }

    return "";
  };

  const getConditionLabel = (conditionValue) => {
    const option = CONDITION_OPTIONS.find((opt) => opt.value === conditionValue);
    return option ? option.label : conditionValue;
  };

  const isSingleDateCondition = () => {
    return (
      condition !== FILTER_CONDITIONS.IS_IN_THE_LAST &&
      condition !== FILTER_CONDITIONS.IS_BETWEEN
    );
  };

  const isBetweenCondition = () => {
    return condition === FILTER_CONDITIONS.IS_BETWEEN;
  };

  const isDaysCondition = () => {
    return condition === FILTER_CONDITIONS.IS_IN_THE_LAST;
  };

  return (
    <>
      {value && (
        <div className="filter-tag-wrapper" ref={tagRef}>
          <div className="filter-tag" onClick={handleOpen}>
            <button
              type="button"
              className="filter-tag-remove"
              onClick={handleRemove}
              aria-label="Remove filter"
            >
              ×
            </button>
            <span className="filter-tag-text">
              {label} | {getConditionLabel(value.condition)} {getDisplayValue()}
            </span>
            <svg
              className="filter-tag-chevron"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {!value && (
        <div className="filter-tag-wrapper" ref={tagRef}>
          <button
            type="button"
            className="filter-tag filter-tag--inactive"
            onClick={handleOpen}
          >
            <span className="filter-tag-text">{label}</span>
            <svg
              className="filter-tag-chevron"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="filter-popup-overlay">
          <div className="filter-popup" ref={popupRef}>
            <div className="filter-popup-header">
              <h3 className="h-card-title">
                {UI_TEXT.FILTER_BY} {label}
              </h3>
            </div>

            <div className="filter-popup-content">
              <div className="form-field">
                <label className="form-label-text">Condition</label>
                <select
                  className="input filter-dropdown"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isSingleDateCondition() && (
                <div className="form-field">
                  <label className="form-label-text">Date</label>
                  <div className="date-input-wrapper">
                    <button
                      type="button"
                      className="date-input-reset"
                      onClick={() => setDateValue("")}
                      aria-label="Reset date"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 4L4 12M4 4L12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <input
                      type="date"
                      className="input date-input"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.target.value)}
                    />
                    <svg
                      className="date-input-calendar"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 6H14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M5 4V2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M11 4V2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {isDaysCondition() && (
                <div className="form-field">
                  <label className="form-label-text">Number of days</label>
                  <div className="days-input-wrapper">
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={daysValue}
                      onChange={(e) => setDaysValue(e.target.value)}
                      placeholder="Enter days"
                    />
                    <span className="days-input-suffix">{UI_TEXT.FILTER_DAYS}</span>
                  </div>
                </div>
              )}

              {isBetweenCondition() && (
                <>
                  <div className="form-field">
                    <label className="form-label-text">{UI_TEXT.FILTER_FROM}</label>
                    <div className="date-input-wrapper">
                      <button
                        type="button"
                        className="date-input-reset"
                        onClick={() => setFromDate("")}
                        aria-label="Reset date"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 4L4 12M4 4L12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <input
                        type="date"
                        className="input date-input"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                      <svg
                        className="date-input-calendar"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 6H14"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 4V2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M11 4V2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label-text">{UI_TEXT.FILTER_TO}</label>
                    <div className="date-input-wrapper">
                      <button
                        type="button"
                        className="date-input-reset"
                        onClick={() => setToDate("")}
                        aria-label="Reset date"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 4L4 12M4 4L12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <input
                        type="date"
                        className="input date-input"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                      <svg
                        className="date-input-calendar"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 6H14"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 4V2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M11 4V2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleApply}
                >
                  {UI_TEXT.FILTER_APPLY}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

