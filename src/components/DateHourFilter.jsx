import React, { useState, useEffect } from "react";
import { FiCornerUpLeft } from "react-icons/fi";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import "./DateHourFilter.css";

const DateHourFilter = ({ onApply }) => {
  // const containerRef = useRef(null);
  const [condition, setCondition] = useState("is after");

  // Single date
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedDateOpen, setSelectedDateOpen] = useState(false);

  // BETWEEN dates
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());

  // For "is in the last"
  const [value, setValue] = useState("1");
  const [timeUnit, setTimeUnit] = useState("months");

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const conditionOptions = [
    "is after",
    "is in the last",
    "is equal to",
    "is between",
    "is on or after",
    "is before or on",
    "is before",
  ];

  const timeUnitOptions = ["months", "days", "hours"];

  const togglePopup = (e) => {
    e.stopPropagation();
    setIsPopupOpen(!isPopupOpen);
    setIsConditionDropdownOpen(false);
  };

  const handleConditionChange = (option) => {
    setCondition(option);
    setIsConditionDropdownOpen(false);
  };

  const handleValueChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    setValue(v);
  };

  const handleTimeUnitChange = (unit) => {
    setTimeUnit(unit);
  };

  const handleApply = () => {
    setIsFilterActive(true);
    setIsPopupOpen(false);

    // send selected filter data to parent
    if (onApply) {
      onApply({
        condition,
        selectedDate: dayjs(selectedDate),
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        value,
        timeUnit,
      });
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "";
    return dayjs(dateObj).format("DD/MMM/YY"); // format as 10/Dec/25
  };

  const getFormattedFilterText = () => {
    switch (condition) {
      case "is in the last":
        return `${condition} ${value} ${timeUnit}`;
      case "is between":
        return `${condition} ${formatDate(startDate)} and ${formatDate(
          endDate
        )}`;
      case "is after":
      case "is on or after":
        return `${condition} ${formatDate(selectedDate)}`;
      case "is before":
      case "is before or on":
        return `${condition} ${formatDate(selectedDate)}`;
      case "is equal to":
        return `${condition} ${formatDate(selectedDate)}`;
      default:
        return `${condition} ${formatDate(selectedDate)}`;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsConditionDropdownOpen(false); // Only closes dropdown, NOT the popup
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const requiresTimeUnitInput = condition === "is in the last";

  return (
    <div className="evidence-filter-exact">
      {/* TOP HEADER */}
      <div
        className={`evidence-due-header ${
          isFilterActive ? "filter-active" : ""
        } ${isPopupOpen ? "popup-open" : ""}`}
        onClick={togglePopup}
      >
        <span className="evidence-due-text">Date filter</span>

        <span className="evidence-due-date">
          {isFilterActive ? getFormattedFilterText() : ""}
        </span>

        <span className="dropdown-arrow">▼</span>
      </div>

      {/* POPUP */}
      {isPopupOpen && (
        <div
          className="filter-popup"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="popup-content"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: "auto" }}
          >
            <div className="filter-header">
              <span className="filter-label">Filter by:</span>
              <div className="filter-type">evidence due by</div>
            </div>

            {/* CONTROLS */}
            <div className="filter-controls">
              {/* CONDITION DROPDOWN */}
              <div className="condition-dropdown-wrapper">
                <div
                  className="condition-dropdown-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConditionDropdownOpen(!isConditionDropdownOpen);
                  }}
                >
                  <span className="condition-display">{condition}</span>
                  <span className="dropdown-arrow-small">▼</span>
                </div>

                {isConditionDropdownOpen && (
                  <div className="condition-dropdown-menu">
                    {conditionOptions.map((opt) => (
                      <div
                        key={opt}
                        className={`condition-dropdown-option ${
                          condition === opt ? "selected" : ""
                        }`}
                        onClick={() => handleConditionChange(opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* INPUT SECTION */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {requiresTimeUnitInput ? (
                  <div className="filter-last-wrapper">
                    <div className="forward-icon">
                      <FiCornerUpLeft size={20} color="blue" />
                    </div>
                    <div className="last-fields">
                      <input
                        type="text"
                        className="last-number-input"
                        value={value}
                        onChange={handleValueChange}
                        placeholder="0"
                      />
                      <select
                        className="last-unit-select"
                        value={timeUnit}
                        onChange={(e) => handleTimeUnitChange(e.target.value)}
                      >
                        {timeUnitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : condition === "is between" ? (
                  <div className="between-wrapper">
                    <div className="forward-icon">
                      <FiCornerUpLeft size={20} color="blue" />
                    </div>

                    <div className="between-date-inputs">
                      <DatePicker
                        label=""
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        inputFormat="DD/MMM/YY"
                        open={startDateOpen}
                        onOpen={() => setStartDateOpen(true)}
                        onClose={() => setStartDateOpen(false)}
                        slots={{ openPickerIcon: () => null }}
                        slotProps={{
                          textField: {
                            size: "small",
                            placeholder: "DD/MMM/YY",
                            InputProps: { endAdornment: null },
                            style: { width: "120px" },
                            onClick: () => setStartDateOpen(true),
                          },
                        }}
                      />

                      <span className="and-text">and</span>

                      <DatePicker
                        label=""
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        inputFormat="DD/MMM/YY"
                        open={endDateOpen}
                        onOpen={() => setEndDateOpen(true)}
                        onClose={() => setEndDateOpen(false)}
                        slots={{ openPickerIcon: () => null }}
                        slotProps={{
                          textField: {
                            size: "small",
                            placeholder: "DD/MMM/YY",
                            InputProps: { endAdornment: null },
                            style: { width: "120px" },
                            onClick: () => setEndDateOpen(true),
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="date-input-wrapper">
                    <div className="forward-icon">
                      <FiCornerUpLeft size={20} color="blue" />
                    </div>

                    <DatePicker
                      label=""
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      inputFormat="DD/MMM/YY"
                      open={selectedDateOpen}
                      onOpen={() => setSelectedDateOpen(true)}
                      onClose={() => setSelectedDateOpen(false)}
                      slots={{ openPickerIcon: () => null }}
                      slotProps={{
                        textField: {
                          size: "small",
                          placeholder: "DD/MMM/YY",
                          InputProps: { endAdornment: null },
                          style: { width: "120px" },
                          onClick: () => setSelectedDateOpen(true), // <-- important
                        },
                      }}
                    />
                  </div>
                )}
              </LocalizationProvider>

              {/* APPLY BUTTON */}
              <div className="popup-buttons">
                <button onClick={handleApply} className="apply-button">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateHourFilter;
